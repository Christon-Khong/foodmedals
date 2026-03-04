export function toSlug(name: string, city: string) {
  return `${name}-${city}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function geocode(
  address: string,
  city: string,
  state: string,
  zip: string,
): Promise<{ lat: number; lng: number } | null> {
  try {
    const params = new URLSearchParams({
      street:       address,
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
