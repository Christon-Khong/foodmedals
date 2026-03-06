import { prisma } from '@/lib/prisma'
import { toSlug, geocode } from '@/lib/restaurant-utils'

export type RestaurantImportEntry = {
  name: string
  address: string
  city: string
  state: string
  zip: string
  websiteUrl?: string
  description?: string
  categorySlugs?: string[]
  /** Pre-geocoded coordinates (e.g. from Google Places) — skips geocoding when provided */
  lat?: number
  lng?: number
}

export type ImportResult = {
  name: string
  status: 'success' | 'error' | 'duplicate'
  slug?: string
  restaurantId?: string
  error?: string
}

export type ImportSummary = {
  total: number
  success: number
  duplicates: number
  errors: number
}

/**
 * Import restaurants into the database with deduplication, geocoding,
 * slug generation, and verified category linking.
 *
 * When `lat` and `lng` are provided on an entry (e.g. from Google Places),
 * geocoding is skipped for that entry, saving an API call.
 */
export async function importRestaurants(
  entries: RestaurantImportEntry[],
): Promise<{ results: ImportResult[]; summary: ImportSummary }> {
  // Validate all entries upfront
  const results: ImportResult[] = []
  const validEntries: Array<{ index: number; entry: RestaurantImportEntry }> = []

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]
    if (
      !entry.name?.trim() ||
      !entry.address?.trim() ||
      !entry.city?.trim() ||
      !entry.state?.trim() ||
      !entry.zip?.trim()
    ) {
      results.push({
        name: entry.name || `(entry ${i + 1})`,
        status: 'error',
        error: 'name, address, city, state, and zip are required',
      })
      continue
    }
    validEntries.push({ index: i, entry })
    results.push({ name: entry.name.trim(), status: 'success' }) // placeholder
  }

  // Resolve category slugs → IDs (one query)
  const allSlugs = new Set<string>()
  for (const { entry } of validEntries) {
    if (Array.isArray(entry.categorySlugs)) {
      entry.categorySlugs.forEach(s => allSlugs.add(s.toLowerCase().trim()))
    }
  }

  const slugToId = new Map<string, string>()
  if (allSlugs.size > 0) {
    const cats = await prisma.foodCategory.findMany({
      where: { slug: { in: Array.from(allSlugs) }, status: 'active' },
      select: { id: true, slug: true },
    })
    cats.forEach(c => slugToId.set(c.slug, c.id))
  }

  // Process entries sequentially
  for (const { index, entry } of validEntries) {
    const name = entry.name.trim()
    const address = entry.address.trim()
    const city = entry.city.trim()
    const state = entry.state.trim().toUpperCase()
    const zip = entry.zip.trim()

    try {
      // Check for duplicates (name + city, case-insensitive)
      const duplicate = await prisma.restaurant.findFirst({
        where: {
          name: { equals: name, mode: 'insensitive' },
          city: { equals: city, mode: 'insensitive' },
        },
        select: { id: true, name: true, slug: true },
      })

      if (duplicate) {
        results[index] = {
          name: duplicate.name,
          status: 'duplicate',
          slug: duplicate.slug,
          error: `Already exists: ${duplicate.name}`,
        }
        continue
      }

      // Use pre-geocoded coords if available, otherwise geocode
      let lat: number
      let lng: number

      if (entry.lat != null && entry.lng != null) {
        lat = entry.lat
        lng = entry.lng
      } else {
        const geo = await geocode(address, city, state, zip)
        if (!geo) {
          results[index] = {
            name,
            status: 'error',
            error: `Address could not be verified: ${address}, ${city}, ${state} ${zip}`,
          }
          continue
        }
        lat = geo.lat
        lng = geo.lng
      }

      // Generate slug with collision handling
      let slug = toSlug(name, city)
      const slugConflict = await prisma.restaurant.findUnique({ where: { slug } })
      if (slugConflict) slug = `${slug}-${Date.now()}`

      // Create restaurant with active status
      const restaurant = await prisma.restaurant.create({
        data: {
          name,
          slug,
          address,
          city,
          state,
          zip,
          lat,
          lng,
          websiteUrl: entry.websiteUrl?.trim() || null,
          description: entry.description?.trim() || null,
          status: 'active',
        },
      })

      // Create verified category links
      const categoryIds = (entry.categorySlugs ?? [])
        .map(s => slugToId.get(s.toLowerCase().trim()))
        .filter((id): id is string => !!id)

      if (categoryIds.length > 0) {
        await prisma.restaurantCategory.createMany({
          data: categoryIds.map(foodCategoryId => ({
            restaurantId: restaurant.id,
            foodCategoryId,
            verified: true,
          })),
          skipDuplicates: true,
        })
      }

      results[index] = {
        name: restaurant.name,
        status: 'success',
        slug: restaurant.slug,
        restaurantId: restaurant.id,
      }
    } catch (err) {
      results[index] = {
        name,
        status: 'error',
        error: err instanceof Error ? err.message : 'Failed to import',
      }
    }
  }

  const summary: ImportSummary = {
    total: results.length,
    success: results.filter(r => r.status === 'success').length,
    duplicates: results.filter(r => r.status === 'duplicate').length,
    errors: results.filter(r => r.status === 'error').length,
  }

  return { results, summary }
}
