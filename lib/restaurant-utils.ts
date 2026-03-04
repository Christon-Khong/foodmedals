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
    const street = stripUnit(address)
    const params = new URLSearchParams({
      street,
      city,
      state,
      postalcode:   zip,
      countrycodes: 'us',
      format:       'json',
      limit:        '1',
    })
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?${params}`,
      {
        headers: {
          'User-Agent':      'FoodMedals/1.0 (foodmedals.com)',
          'Accept-Language': 'en',
        },
      },
    )
    if (!res.ok) return null
    const data = await res.json()
    if (!Array.isArray(data) || data.length === 0) return null
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
  } catch {
    return null
  }
}
