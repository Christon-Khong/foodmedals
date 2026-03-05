import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/adminAuth'
import { STATE_ABBREV } from '@/lib/parse-maps-url'

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

    // Try to extract coordinates from the URL
    // !3d/!4d = actual place marker (preferred), @ = viewport center (fallback)
    let lat: number | null = null
    let lng: number | null = null

    // Prefer !3d/!4d — these are the actual place coordinates
    const dMatch = resolvedUrl.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/)
    if (dMatch) {
      lat = parseFloat(dMatch[1])
      lng = parseFloat(dMatch[2])
    }

    // Fall back to @ coordinates (viewport center, less accurate)
    if (lat == null) {
      const atMatch = resolvedUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
      if (atMatch) {
        lat = parseFloat(atMatch[1])
        lng = parseFloat(atMatch[2])
      }
    }

    // Use Nominatim reverse geocoding if we have coordinates
    if (lat != null && lng != null) {
      const nomRes = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
        { headers: { 'User-Agent': 'FoodMedals/1.0' } },
      )

      if (nomRes.ok) {
        const data = await nomRes.json()
        const addr = data.address

        if (addr) {
          const houseNumber = addr.house_number ?? ''
          const road = addr.road ?? ''
          const streetAddress = [houseNumber, road].filter(Boolean).join(' ')

          return NextResponse.json({
            address: streetAddress || null,
            city: addr.city ?? addr.town ?? addr.village ?? null,
            state: (addr.state ? STATE_ABBREV[addr.state] ?? addr.state : null),
            zip: addr.postcode ?? null,
            lat,
            lng,
          })
        }
      }

      // Even if reverse geocoding failed, return the coordinates
      return NextResponse.json({
        address: null,
        city: null,
        state: null,
        zip: null,
        lat,
        lng,
      })
    }

    // Try extracting a place name query from the URL for forward geocoding
    const qMatch = resolvedUrl.match(/[?&]q=([^&]+)/)
    const placeMatch = resolvedUrl.match(/\/place\/([^/@]+)/)
    const query = qMatch?.[1] || placeMatch?.[1]

    if (query) {
      const decoded = decodeURIComponent(query.replace(/\+/g, ' '))
      const nomRes = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(decoded)}&format=json&addressdetails=1&limit=1`,
        { headers: { 'User-Agent': 'FoodMedals/1.0' } },
      )

      if (nomRes.ok) {
        const results = await nomRes.json()
        if (results.length > 0) {
          const addr = results[0].address
          const houseNumber = addr.house_number ?? ''
          const road = addr.road ?? ''
          const streetAddress = [houseNumber, road].filter(Boolean).join(' ')

          return NextResponse.json({
            address: streetAddress || null,
            city: addr.city ?? addr.town ?? addr.village ?? null,
            state: (addr.state ? STATE_ABBREV[addr.state] ?? addr.state : null),
            zip: addr.postcode ?? null,
            lat: parseFloat(results[0].lat),
            lng: parseFloat(results[0].lon),
          })
        }
      }
    }

    return NextResponse.json({ error: 'Could not extract address from URL' }, { status: 422 })
  } catch {
    return NextResponse.json({ error: 'Failed to process URL' }, { status: 500 })
  }
}
