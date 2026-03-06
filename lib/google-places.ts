export type PlaceResult = {
  placeId: string
  name: string
  address: string
  city: string
  state: string
  zip: string
  lat: number
  lng: number
  websiteUrl?: string
  rating?: number
  reviewCount?: number
}

/**
 * Search Google Places Text Search API for restaurants matching a query.
 * Uses field masks to minimize billing (~$0.032 per request).
 */
export async function searchPlaces(
  query: string,
  maxResults: number = 5,
): Promise<PlaceResult[]> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  if (!apiKey) throw new Error('GOOGLE_MAPS_API_KEY not configured')

  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask':
        'places.id,places.displayName,places.formattedAddress,places.location,places.websiteUri,places.rating,places.userRatingCount',
    },
    body: JSON.stringify({
      textQuery: query,
      maxResultCount: maxResults,
    }),
    signal: AbortSignal.timeout(10_000),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Places API error ${res.status}: ${text.slice(0, 200)}`)
  }

  const data = await res.json()
  const places: Array<{
    id: string
    displayName?: { text: string }
    formattedAddress?: string
    location?: { latitude: number; longitude: number }
    websiteUri?: string
    rating?: number
    userRatingCount?: number
  }> = data.places ?? []

  return places
    .filter(p => p.displayName?.text && p.formattedAddress && p.location)
    .map(p => {
      const parsed = parseFormattedAddress(p.formattedAddress!)
      return {
        placeId: p.id,
        name: p.displayName!.text,
        address: parsed.streetAddress,
        city: parsed.city,
        state: parsed.state,
        zip: parsed.zip,
        lat: p.location!.latitude,
        lng: p.location!.longitude,
        websiteUrl: p.websiteUri,
        rating: p.rating,
        reviewCount: p.userRatingCount,
      }
    })
    .filter(p => p.city && p.state && p.zip) // filter out unparseable addresses
}

/**
 * Parse a US formatted address from Google Places into structured components.
 * Google returns: "123 Main St, Salt Lake City, UT 84101, USA"
 */
export function parseFormattedAddress(formattedAddress: string): {
  streetAddress: string
  city: string
  state: string
  zip: string
} {
  // Remove trailing country
  const withoutCountry = formattedAddress.replace(/,\s*(USA|United States)\s*$/i, '')

  // Split by comma: ["123 Main St", "Salt Lake City", "UT 84101"]
  const parts = withoutCountry.split(',').map(p => p.trim())

  if (parts.length >= 3) {
    const streetAddress = parts.slice(0, -2).join(', ')
    const city = parts[parts.length - 2]
    const stateZip = parts[parts.length - 1]
    const match = stateZip.match(/^([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/)
    if (match) {
      return { streetAddress, city, state: match[1], zip: match[2] }
    }
  }

  // Fallback: best-effort parse
  return {
    streetAddress: parts[0] || formattedAddress,
    city: parts[1] || '',
    state: parts[2]?.replace(/\s+\d+.*/, '') || '',
    zip: formattedAddress.match(/\b(\d{5})\b/)?.[1] || '',
  }
}
