import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const ALLOWED_HOSTS = [
  'google.com',
  'www.google.com',
  'maps.google.com',
  'maps.app.goo.gl',
  'goo.gl',
]

const STATE_ABBREV: Record<string, string> = {
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

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { url } = await req.json()

  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 })
  }

  // Strict host validation — parse as URL and check hostname
  let parsedHost: string
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return NextResponse.json({ error: 'Not a valid Google Maps URL' }, { status: 400 })
    }
    parsedHost = parsed.hostname
  } catch {
    return NextResponse.json({ error: 'Not a valid URL' }, { status: 400 })
  }

  if (!ALLOWED_HOSTS.some(h => parsedHost === h || parsedHost.endsWith('.' + h))) {
    return NextResponse.json({ error: 'Not a valid Google Maps URL' }, { status: 400 })
  }

  // Follow redirects for shortened URLs
  let resolvedUrl = url
  if (parsedHost === 'goo.gl' || parsedHost === 'maps.app.goo.gl') {
    try {
      const res = await fetch(url, { redirect: 'follow' })
      resolvedUrl = res.url
      // Verify the resolved URL also points to Google
      const resolvedParsed = new URL(resolvedUrl)
      if (!ALLOWED_HOSTS.some(h => resolvedParsed.hostname === h || resolvedParsed.hostname.endsWith('.' + h))) {
        return NextResponse.json({ error: 'Redirect did not resolve to Google Maps' }, { status: 400 })
      }
    } catch {
      return NextResponse.json({ error: 'Could not resolve shortened URL' }, { status: 400 })
    }
  }

  // Parse place name from /place/Name+Here/
  let name = ''
  const placeMatch = resolvedUrl.match(/\/place\/([^/@]+)/)
  if (placeMatch) {
    name = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '))
  }

  // Parse lat/lng from /@lat,lng
  let lat: number | null = null
  let lng: number | null = null
  const coordMatch = resolvedUrl.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/)
  if (coordMatch) {
    lat = parseFloat(coordMatch[1])
    lng = parseFloat(coordMatch[2])
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

  return NextResponse.json({ name, address, city, state, zip })
}
