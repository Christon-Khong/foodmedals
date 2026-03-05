export const ALLOWED_HOSTS = [
  'google.com',
  'www.google.com',
  'maps.google.com',
  'maps.app.goo.gl',
  'goo.gl',
]

export const STATE_ABBREV: Record<string, string> = {
  'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR',
  'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE',
  'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID',
  'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA', 'Kansas': 'KS',
  'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
  'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS',
  'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV',
  'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
  'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK',
  'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
  'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT',
  'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV',
  'Wisconsin': 'WI', 'Wyoming': 'WY', 'District of Columbia': 'DC',
}

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

  // Reverse geocode with Nominatim
  let address = ''
  let city = ''
  let state = ''
  let zip = ''

  if (lat != null && lng != null) {
    try {
      const params = new URLSearchParams({
        lat: lat.toString(),
        lon: lng.toString(),
        format: 'json',
        addressdetails: '1',
      })
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?${params}`,
        { headers: { 'User-Agent': 'FoodMedals/1.0 (foodmedals.com)' } },
      )
      if (res.ok) {
        const data = await res.json()
        const addr = data.address ?? {}
        const houseNumber = addr.house_number ?? ''
        const road = addr.road ?? ''
        address = `${houseNumber} ${road}`.trim()
        city = addr.city ?? addr.town ?? addr.village ?? ''
        const fullState = addr.state ?? ''
        state = STATE_ABBREV[fullState] ?? fullState
        zip = addr.postcode ?? ''
      }
    } catch {
      // Best effort — fields will be empty
    }
  }

  if (!name) {
    throw new Error('Could not extract restaurant name from URL')
  }

  return { name, address, city, state, zip, lat, lng }
}
