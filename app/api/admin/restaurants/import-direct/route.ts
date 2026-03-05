import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/adminAuth'
import { prisma } from '@/lib/prisma'
import { toSlug, geocode } from '@/lib/restaurant-utils'

export const maxDuration = 120

type RestaurantEntry = {
  name: string
  address: string
  city: string
  state: string
  zip: string
  websiteUrl?: string
  description?: string
  categorySlugs?: string[]
}

type ImportResult = {
  name: string
  status: 'success' | 'error' | 'duplicate'
  slug?: string
  restaurantId?: string
  error?: string
}

export async function POST(req: NextRequest) {
  // Dual auth: admin session cookie OR ADMIN_API_KEY bearer token
  const apiKey = process.env.ADMIN_API_KEY
  const authHeader = req.headers.get('authorization')
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  const isApiKeyAuth = apiKey && bearerToken && bearerToken === apiKey
  if (!isApiKeyAuth) {
    const session = await getAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  let body: { restaurants?: RestaurantEntry[] }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { restaurants } = body

  if (!Array.isArray(restaurants) || restaurants.length === 0) {
    return NextResponse.json({ error: 'restaurants array is required and must be non-empty' }, { status: 400 })
  }
  if (restaurants.length > 50) {
    return NextResponse.json({ error: 'Maximum 50 restaurants per request' }, { status: 400 })
  }

  // Validate all entries upfront
  const results: ImportResult[] = []
  const validEntries: Array<{ index: number; entry: RestaurantEntry }> = []

  for (let i = 0; i < restaurants.length; i++) {
    const entry = restaurants[i]
    if (!entry.name?.trim() || !entry.address?.trim() || !entry.city?.trim() || !entry.state?.trim() || !entry.zip?.trim()) {
      results.push({ name: entry.name || `(entry ${i + 1})`, status: 'error', error: 'name, address, city, state, and zip are required' })
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

  // Process entries sequentially (geocoding has rate limits)
  for (let i = 0; i < validEntries.length; i++) {
    const { index, entry } = validEntries[i]
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

      // Geocode to get lat/lng
      let lat: number | null = null
      let lng: number | null = null
      const geo = await geocode(address, city, state, zip)
      if (geo) {
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

    // Rate limit delay for Nominatim geocoding (1 req/sec)
    if (i < validEntries.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1100))
    }
  }

  const summary = {
    total: results.length,
    success: results.filter(r => r.status === 'success').length,
    duplicates: results.filter(r => r.status === 'duplicate').length,
    errors: results.filter(r => r.status === 'error').length,
  }

  return NextResponse.json({ results, summary })
}
