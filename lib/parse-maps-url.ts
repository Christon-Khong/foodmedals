import { incrementGeocodeCounter } from './google-places-quota'

export const ALLOWED_HOSTS = [
  'google.com',
  'www.google.com',
  'maps.google.com',
  'maps.app.goo.gl',
  'goo.gl',
]

export type ParsedMapsResult = {
  name: string
  address: string
  city: string
  state: string
  zip: string
  lat: number | null
  lng: number | null
}

/**
 * Fast URL validation — no network calls.
 * Returns the parsed hostname on success, or throws with a descriptive message.
 */
export function validateGoogleMapsUrl(url: string): string {
  let parsedHost: string
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      throw new Error('Not a valid Google Maps URL')
    }
    parsedHost = parsed.hostname
  } catch (e) {
    if (e instanceof Error && e.message.includes('Google Maps')) throw e
    throw new Error('Not a valid URL')
  }

  if (!ALLOWED_HOSTS.some(h => parsedHost === h || parsedHost.endsWith('.' + h))) {
    throw new Error('Not a valid Google Maps URL')
  }

  return parsedHost
}

/**
 * Full parse pipeline: validate → follow redirects → extract name/coords → reverse geocode.
 * Throws on unrecoverable errors.
 */
export async function parseGoogleMapsUrl(url: string): Promise<ParsedMapsResult> {
  const parsedHost = validateGoogleMapsUrl(url)

  // Follow redirects for shortened URLs
  let resolvedUrl = url
  if (parsedHost === 'goo.gl' || parsedHost === 'maps.app.goo.gl') {
    try {
      const res = await fetch(url, { redirect: 'follow' })
      resolvedUrl = res.url
      const resolvedParsed = new URL(resolvedUrl)
      if (!ALLOWED_HOSTS.some(h => resolvedParsed.hostname === h || resolvedParsed.hostname.endsWith('.' + h))) {
        throw new Error('Redirect did not resolve to Google Maps')
      }
    } catch (e) {
      if (e instanceof Error && e.message.includes('Redirect')) throw e
      throw new Error('Could not resolve shortened URL')
    }
  }

  // Parse place name from /place/Name+Here/
  let name = ''
  const placeMatch = resolvedUrl.match(/\/place\/([^/@]+)/)
  if (placeMatch) {
    name = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '))
  }

  // Parse lat/lng — prefer !3d/!4d (actual place marker) over @ (viewport center)
  let lat: number | null = null
  let lng: number | null = null
  const placeCoordMatch = resolvedUrl.match(/!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/)
  if (placeCoordMatch) {
    lat = parseFloat(placeCoordMatch[1])
    lng = parseFloat(placeCoordMatch[2])
  } else {
    const viewportMatch = resolvedUrl.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/)
    if (viewportMatch) {
      lat = parseFloat(viewportMatch[1])
      lng = parseFloat(viewportMatch[2])
    }
  }

  // Reverse geocode with Google Maps
  let address = ''
  let city = ''
  let state = ''
  let zip = ''

  if (lat != null && lng != null) {
    try {
      const apiKey = process.env.GOOGLE_MAPS_API_KEY
      if (apiKey) {
        // Track this reverse geocode call and enforce daily limit
        const allowed = await incrementGeocodeCounter(1)
        if (!allowed) {
          // Quota exhausted — skip geocode, fields will be empty
          throw new Error('Daily geocode quota exhausted')
        }

        const params = new URLSearchParams({
          latlng: `${lat},${lng}`,
          key: apiKey,
        })
        const res = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?${params}`,
        )
        if (res.ok) {
          const data = await res.json()
          if (data.status === 'OK' && data.results?.length) {
            const components = data.results[0].address_components as { types: string[]; long_name: string; short_name: string }[]
            const get = (type: string) => components.find(c => c.types.includes(type))
            const streetNumber = get('street_number')?.long_name ?? ''
            const route = get('route')?.long_name ?? ''
            address = `${streetNumber} ${route}`.trim()
            city = get('locality')?.long_name ?? get('sublocality')?.long_name ?? ''
            state = get('administrative_area_level_1')?.short_name ?? ''
            zip = get('postal_code')?.long_name ?? ''
          }
        }
      }
    } catch (e) {
      // Re-throw quota errors so callers can handle them; swallow other errors
      if (e instanceof Error && e.message.includes('quota')) throw e
    }
  }

  if (!name) {
    throw new Error('Could not extract restaurant name from URL')
  }

  return { name, address, city, state, zip, lat, lng }
}
