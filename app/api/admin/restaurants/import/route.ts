import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/adminAuth'
import { verifyApiKey } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { toSlug, geocode } from '@/lib/restaurant-utils'
import { validateGoogleMapsUrl, parseGoogleMapsUrl } from '@/lib/parse-maps-url'

export const maxDuration = 120

type UrlEntry = {
  url: string
  categoryIds?: string[]
}

type ImportResult = {
  url: string
  status: 'success' | 'error' | 'duplicate'
  name?: string
  slug?: string
  restaurantId?: string
  error?: string
}

export async function POST(req: NextRequest) {
  // Dual auth: admin session cookie OR ADMIN_API_KEY bearer token (timing-safe)
  if (!verifyApiKey(req.headers.get('authorization'))) {
    const session = await getAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  let body: { urls?: UrlEntry[]; sharedCategoryIds?: string[] }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { urls, sharedCategoryIds } = body

  if (!Array.isArray(urls) || urls.length === 0) {
    return NextResponse.json({ error: 'urls array is required and must be non-empty' }, { status: 400 })
  }
  if (urls.length > 50) {
    return NextResponse.json({ error: 'Maximum 50 URLs per request' }, { status: 400 })
  }

  // Validate all URLs upfront (fast, no network calls)
  const results: ImportResult[] = []
  const validEntries: Array<{ index: number; entry: UrlEntry }> = []

  for (let i = 0; i < urls.length; i++) {
    const entry = urls[i]
    if (!entry.url || typeof entry.url !== 'string') {
      results.push({ url: entry.url ?? `(entry ${i + 1})`, status: 'error', error: 'URL is required' })
      continue
    }
    try {
      validateGoogleMapsUrl(entry.url.trim())
      validEntries.push({ index: i, entry: { ...entry, url: entry.url.trim() } })
      results.push({ url: entry.url.trim(), status: 'success' }) // placeholder, updated below
    } catch (err) {
      results.push({
        url: entry.url.trim(),
        status: 'error',
        error: err instanceof Error ? err.message : 'Invalid URL',
      })
    }
  }

  // Validate category IDs exist in DB (one query for all)
  const allCategoryIds = new Set<string>()
  if (Array.isArray(sharedCategoryIds)) {
    sharedCategoryIds.forEach(id => allCategoryIds.add(id))
  }
  for (const { entry } of validEntries) {
    if (Array.isArray(entry.categoryIds)) {
      entry.categoryIds.forEach(id => allCategoryIds.add(id))
    }
  }

  const validCategoryIds = new Set<string>()
  if (allCategoryIds.size > 0) {
    const existing = await prisma.foodCategory.findMany({
      where: { id: { in: Array.from(allCategoryIds) }, status: 'active' },
      select: { id: true },
    })
    existing.forEach(c => validCategoryIds.add(c.id))
  }

  // Process valid URLs sequentially
  for (let i = 0; i < validEntries.length; i++) {
    const { entry } = validEntries[i]
    const resultIndex = urls.indexOf(entry) !== -1
      ? urls.findIndex(u => u.url?.trim() === entry.url)
      : validEntries[i].index

    try {
      // Parse Google Maps URL (follows redirects, extracts data, reverse geocodes)
      const parsed = await parseGoogleMapsUrl(entry.url)

      // Fall back to forward geocoding if reverse geocode didn't yield lat/lng
      let { lat, lng } = parsed
      if (lat == null || lng == null) {
        if (parsed.address && parsed.city && parsed.state) {
          const geo = await geocode(parsed.address, parsed.city, parsed.state, parsed.zip)
          if (geo) {
            lat = geo.lat
            lng = geo.lng
          }
        }
      }

      // Reject if address could not be verified (no coordinates from either source)
      if (lat == null || lng == null) {
        results[resultIndex] = {
          url: entry.url,
          status: 'error',
          name: parsed.name,
          error: `Address could not be verified: ${parsed.address}, ${parsed.city}, ${parsed.state} ${parsed.zip}`,
        }
        continue
      }

      // Check for duplicates (name + city, case-insensitive)
      const duplicate = await prisma.restaurant.findFirst({
        where: {
          name: { equals: parsed.name, mode: 'insensitive' },
          city: { equals: parsed.city, mode: 'insensitive' },
        },
        select: { id: true, name: true, slug: true },
      })

      if (duplicate) {
        results[resultIndex] = {
          url: entry.url,
          status: 'duplicate',
          name: duplicate.name,
          slug: duplicate.slug,
          error: `Already exists: ${duplicate.name}`,
        }
      } else {
        // Generate slug with collision handling
        let slug = toSlug(parsed.name, parsed.city || 'unknown')
        const slugConflict = await prisma.restaurant.findUnique({ where: { slug } })
        if (slugConflict) slug = `${slug}-${Date.now()}`

        // Create restaurant with active status
        const restaurant = await prisma.restaurant.create({
          data: {
            name: parsed.name,
            slug,
            address: parsed.address,
            city: parsed.city,
            state: parsed.state || 'UT',
            zip: parsed.zip,
            lat,
            lng,
            status: 'active',
          },
        })

        // Create verified category links
        const effectiveCategoryIds = Array.isArray(entry.categoryIds) && entry.categoryIds.length > 0
          ? entry.categoryIds.filter(id => validCategoryIds.has(id))
          : Array.isArray(sharedCategoryIds)
            ? sharedCategoryIds.filter(id => validCategoryIds.has(id))
            : []

        if (effectiveCategoryIds.length > 0) {
          await prisma.restaurantCategory.createMany({
            data: effectiveCategoryIds.map(foodCategoryId => ({
              restaurantId: restaurant.id,
              foodCategoryId,
              verified: true,
            })),
            skipDuplicates: true,
          })
        }

        results[resultIndex] = {
          url: entry.url,
          status: 'success',
          name: restaurant.name,
          slug: restaurant.slug,
          restaurantId: restaurant.id,
        }
      }
    } catch (err) {
      results[resultIndex] = {
        url: entry.url,
        status: 'error',
        error: err instanceof Error ? err.message : 'Failed to process URL',
      }
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
