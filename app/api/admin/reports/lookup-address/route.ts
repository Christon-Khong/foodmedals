import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/adminAuth'
import { STATE_ABBREV } from '@/lib/parse-maps-url'

function formatAddress(addr: Record<string, string | undefined>) {
  const houseNumber = addr.house_number ?? ''
  const road = addr.road ?? ''
  return [houseNumber, road].filter(Boolean).join(' ')
}

function formatResult(addr: Record<string, string | undefined>, lat: number, lng: number) {
  const streetAddress = formatAddress(addr)
  return {
    address: streetAddress || null,
    city: addr.city ?? addr.town ?? addr.village ?? null,
    state: (addr.state ? STATE_ABBREV[addr.state] ?? addr.state : null),
    zip: addr.postcode ?? null,
    lat,
    lng,
    partial: !addr.house_number,
  }
}

async function nominatimReverse(lat: number, lng: number) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
    { headers: { 'User-Agent': 'FoodMedals/1.0' } },
  )
  if (!res.ok) return null
  return res.json()
}

async function nominatimSearch(query: string) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=1`,
    { headers: { 'User-Agent': 'FoodMedals/1.0' } },
  )
  if (!res.ok) return []
  return res.json()
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { googleMapsUrl } = await req.json()
  if (!googleMapsUrl || typeof googleMapsUrl !== 'string') {
    return NextResponse.json({ error: 'Missing Google Maps URL' }, { status: 400 })
  }

  try {
    // Resolve shortened URLs (maps.app.goo.gl)
    let resolvedUrl = googleMapsUrl
    if (googleMapsUrl.includes('goo.gl') || googleMapsUrl.includes('maps.app')) {
      const headRes = await fetch(googleMapsUrl, { method: 'GET', redirect: 'follow' })
      resolvedUrl = headRes.url
    }

    // Extract place name from URL for fallback search
    const placeNameMatch = resolvedUrl.match(/\/place\/([^/@]+)/)
    const placeName = placeNameMatch
      ? decodeURIComponent(placeNameMatch[1].replace(/\+/g, ' '))
      : null

    // Extract coordinates — prefer !3d/!4d (place marker) over @ (viewport center)
    let lat: number | null = null
    let lng: number | null = null

    const dMatch = resolvedUrl.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/)
    if (dMatch) {
      lat = parseFloat(dMatch[1])
      lng = parseFloat(dMatch[2])
    }

    if (lat == null) {
      const atMatch = resolvedUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
      if (atMatch) {
        lat = parseFloat(atMatch[1])
        lng = parseFloat(atMatch[2])
      }
    }

    // Reverse geocode with coordinates
    if (lat != null && lng != null) {
      const data = await nominatimReverse(lat, lng)
      const addr = data?.address

      if (addr) {
        const hasHouseNumber = !!addr.house_number

        // If no house number, try forward geocoding the place name for a better result
        if (!hasHouseNumber && placeName) {
          // Try place name + city from reverse result
          const city = addr.city ?? addr.town ?? addr.village ?? ''
          const state = addr.state ? (STATE_ABBREV[addr.state] ?? addr.state) : ''
          const searchQueries = [
            `${placeName}, ${city}, ${state}`,
            placeName,
          ]

          for (const q of searchQueries) {
            // Rate limit: 1 req/sec for Nominatim
            await new Promise(r => setTimeout(r, 1100))
            const results = await nominatimSearch(q)
            if (results.length > 0 && results[0].address?.house_number) {
              return NextResponse.json(formatResult(
                results[0].address,
                parseFloat(results[0].lat),
                parseFloat(results[0].lon),
              ))
            }
          }
        }

        // Return reverse geocode result (possibly without house number)
        return NextResponse.json(formatResult(addr, lat, lng))
      }

      // Even if reverse geocoding failed, return coordinates
      return NextResponse.json({
        address: null, city: null, state: null, zip: null,
        lat, lng, partial: true,
      })
    }

    // No coordinates — try forward geocoding with query params or place name
    const qMatch = resolvedUrl.match(/[?&]q=([^&]+)/)
    const query = qMatch?.[1] || placeNameMatch?.[1]

    if (query) {
      const decoded = decodeURIComponent(query.replace(/\+/g, ' '))
      const results = await nominatimSearch(decoded)
      if (results.length > 0) {
        return NextResponse.json(formatResult(
          results[0].address,
          parseFloat(results[0].lat),
          parseFloat(results[0].lon),
        ))
      }
    }

    return NextResponse.json({ error: 'Could not extract address from URL' }, { status: 422 })
  } catch {
    return NextResponse.json({ error: 'Failed to process URL' }, { status: 500 })
  }
}
