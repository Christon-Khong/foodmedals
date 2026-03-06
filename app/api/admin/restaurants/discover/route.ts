import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/adminAuth'
import { prisma } from '@/lib/prisma'
import { searchPlaces, type PlaceResult } from '@/lib/google-places'
import { checkAndIncrementQuota, getQuotaStatus } from '@/lib/google-places-quota'

export const maxDuration = 300

type DiscoveredRestaurant = {
  placeId: string
  name: string
  address: string
  city: string
  state: string
  zip: string
  lat: number
  lng: number
  websiteUrl?: string
  categorySlugs: string[]
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: { city?: string; state?: string; resultsPerCategory?: number }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const city = body.city?.trim()
  const state = body.state?.trim().toUpperCase()
  if (!city || !state) {
    return NextResponse.json({ error: 'city and state are required' }, { status: 400 })
  }

  const maxResults = Math.min(Math.max(body.resultsPerCategory ?? 5, 1), 10)

  // Fetch all active categories
  const categories = await prisma.foodCategory.findMany({
    where: { status: 'active' },
    select: { name: true, slug: true },
    orderBy: { sortOrder: 'asc' },
  })

  if (categories.length === 0) {
    return NextResponse.json({ error: 'No active categories found' }, { status: 400 })
  }

  // Check quota before starting (reserve calls for all categories)
  const quotaCheck = await checkAndIncrementQuota(categories.length)
  if (!quotaCheck.allowed) {
    return NextResponse.json(
      {
        error: `Daily API quota exceeded. ${quotaCheck.used}/${quotaCheck.limit} calls used today. This search needs ${categories.length} calls but only ${quotaCheck.remaining} remain.`,
        quota: {
          used: quotaCheck.used,
          limit: quotaCheck.limit,
          remaining: quotaCheck.remaining,
        },
      },
      { status: 429 },
    )
  }

  // Deduplicated results keyed by placeId
  const byPlaceId = new Map<string, DiscoveredRestaurant>()
  let categoriesSearched = 0
  let totalPlacesFound = 0
  const errors: string[] = []

  for (const cat of categories) {
    const query = `best ${cat.name} restaurants in ${city}, ${state}`

    try {
      const places: PlaceResult[] = await searchPlaces(query, maxResults)
      totalPlacesFound += places.length

      for (const place of places) {
        const existing = byPlaceId.get(place.placeId)
        if (existing) {
          // Merge category into existing entry
          if (!existing.categorySlugs.includes(cat.slug)) {
            existing.categorySlugs.push(cat.slug)
          }
        } else {
          byPlaceId.set(place.placeId, {
            placeId: place.placeId,
            name: place.name,
            address: place.address,
            city: place.city,
            state: place.state,
            zip: place.zip,
            lat: place.lat,
            lng: place.lng,
            websiteUrl: place.websiteUrl,
            categorySlugs: [cat.slug],
          })
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      errors.push(`${cat.name}: ${msg}`)
    }

    categoriesSearched++

    // Small delay between API calls to be a good citizen
    if (categoriesSearched < categories.length) {
      await new Promise(r => setTimeout(r, 200))
    }
  }

  const restaurants = Array.from(byPlaceId.values())

  // Get updated quota status after search
  const quota = await getQuotaStatus()

  return NextResponse.json({
    restaurants,
    stats: {
      categoriesSearched,
      totalPlacesFound,
      uniqueRestaurants: restaurants.length,
    },
    quota: {
      used: quota.used,
      limit: quota.limit,
      remaining: quota.remaining,
      costToday: quota.costToday,
    },
    errors: errors.length > 0 ? errors : undefined,
  })
}
