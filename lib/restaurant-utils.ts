import { checkAndIncrementQuota } from './google-places-quota'

export function toSlug(name: string, city: string) {
  return `${name}-${city}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/** Strip suite/unit/apt numbers that confuse geocoders */
function stripUnit(address: string): string {
  return address
    .replace(/\s*(suite|ste|unit|apt|#)\s*#?\s*\S+/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function geocode(
  address: string,
  city: string,
  state: string,
  zip: string,
): Promise<{ lat: number; lng: number } | null> {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY
    if (!apiKey) return null

    const street = stripUnit(address)
    const fullAddress = `${street}, ${city}, ${state} ${zip}`
    const params = new URLSearchParams({
      address: fullAddress,
      key: apiKey,
    })
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?${params}`,
    )
    if (!res.ok) return null
    const data = await res.json()
    if (data.status !== 'OK' || !data.results?.length) return null
    const { lat, lng } = data.results[0].geometry.location
    return { lat, lng }
  } catch {
    return null
  }
}

/**
 * Geocode with quota tracking — increments the unified daily API counter
 * before making the call. Returns null if quota is exhausted.
 */
export async function geocodeWithQuota(
  address: string,
  city: string,
  state: string,
  zip: string,
): Promise<{ lat: number; lng: number } | null> {
  const check = await checkAndIncrementQuota(1)
  if (!check.allowed) return null
  return geocode(address, city, state, zip)
}
