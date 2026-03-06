import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/adminAuth'
import { incrementGeocodeCounter } from '@/lib/google-places-quota'

type AddressComponent = { types: string[]; long_name: string; short_name: string }
type GeoResult = {
  address_components: AddressComponent[]
  geometry: { location: { lat: number; lng: number } }
}

function extractFromComponents(components: AddressComponent[]) {
  const get = (type: string) => components.find(c => c.types.includes(type))
  const streetNumber = get('street_number')?.long_name ?? ''
  const route = get('route')?.long_name ?? ''
  return {
    address: `${streetNumber} ${route}`.trim() || null,
    city: get('locality')?.long_name ?? get('sublocality')?.long_name ?? null,
    state: get('administrative_area_level_1')?.short_name ?? null,
    zip: get('postal_code')?.long_name ?? null,
    hasStreetNumber: !!streetNumber,
  }
}

function formatResult(result: GeoResult) {
  const { address, city, state, zip, hasStreetNumber } = extractFromComponents(result.address_components)
  return {
    address,
    city,
    state,
    zip,
    lat: result.geometry.location.lat,
    lng: result.geometry.location.lng,
    partial: !hasStreetNumber,
  }
}

async function googleReverse(lat: number, lng: number): Promise<GeoResult | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  if (!apiKey) return null
  await incrementGeocodeCounter(1)
  const res = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`,
  )
  if (!res.ok) return null
  const data = await res.json()
  if (data.status !== 'OK' || !data.results?.length) return null
  return data.results[0]
}

async function googleSearch(query: string): Promise<GeoResult[]> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  if (!apiKey) return []
  await incrementGeocodeCounter(1)
  const res = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${apiKey}`,
  )
  if (!res.ok) return []
  const data = await res.json()
  if (data.status !== 'OK' || !data.results?.length) return []
  return data.results
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
      const result = await googleReverse(lat, lng)

      if (result) {
        const { hasStreetNumber } = extractFromComponents(result.address_components)

        // If no street number, try forward geocoding the place name for a better result
        if (!hasStreetNumber && placeName) {
          const { city, state } = extractFromComponents(result.address_components)
          const searchQueries = [
            `${placeName}, ${city ?? ''}, ${state ?? ''}`,
            placeName,
          ]

          for (const q of searchQueries) {
            const results = await googleSearch(q)
            if (results.length > 0) {
              const extracted = extractFromComponents(results[0].address_components)
              if (extracted.hasStreetNumber) {
                return NextResponse.json(formatResult(results[0]))
              }
            }
          }
        }

        // Return reverse geocode result (possibly without street number)
        return NextResponse.json(formatResult(result))
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
      const results = await googleSearch(decoded)
      if (results.length > 0) {
        return NextResponse.json(formatResult(results[0]))
      }
    }

    return NextResponse.json({ error: 'Could not extract address from URL' }, { status: 422 })
  } catch {
    return NextResponse.json({ error: 'Failed to process URL' }, { status: 500 })
  }
}
