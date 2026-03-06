import { prisma } from './prisma'
import { searchPlaces, type PlaceResult } from './google-places'
import { checkAndIncrementQuota } from './google-places-quota'

export type DiscoveredRestaurant = {
  placeId: string
  name: string
  address: string
  city: string
  state: string
  zip: string
  lat: number
  lng: number
  websiteUrl?: string
  rating?: number
  reviewCount?: number
  categorySlugs: string[]
}

export type DiscoverCityResult = {
  batchId?: string
  restaurants: DiscoveredRestaurant[]
  stats: {
    categoriesSearched: number
    totalPlacesFound: number
    uniqueRestaurants: number
  }
  errors: string[]
}

export type ProgressEvent = {
  category: string
  categorySlug: string
  index: number
  total: number
  found: number
  uniqueSoFar: number
  error?: string
}

export type ProgressCallback = (event: ProgressEvent) => void

export class QuotaExhaustedError extends Error {
  quotaExhausted = true
  quota: { used: number; limit: number; remaining: number }

  constructor(
    message: string,
    quota: { used: number; limit: number; remaining: number },
  ) {
    super(message)
    this.name = 'QuotaExhaustedError'
    this.quota = quota
  }
}

/**
 * Run the full discovery search for a single city.
 * Searches all active food categories, deduplicates results,
 * and saves a DiscoveryBatch to the DB.
 *
 * @param onProgress - optional callback fired after each category (for streaming)
 * @throws QuotaExhaustedError if daily API quota is exceeded
 */
export async function discoverCity(options: {
  city: string
  state: string
  resultsPerCategory?: number
  quotaReserve?: number
  minRating?: number
  minReviews?: number
  onProgress?: ProgressCallback
}): Promise<DiscoverCityResult> {
  const {
    city, state, resultsPerCategory = 5, quotaReserve = 0,
    minRating = 4.5, minReviews = 100, onProgress,
  } = options
  const maxResults = Math.min(Math.max(resultsPerCategory, 1), 10)

  // Fetch all active categories
  const categories = await prisma.foodCategory.findMany({
    where: { status: 'active' },
    select: { name: true, slug: true },
    orderBy: { sortOrder: 'asc' },
  })

  if (categories.length === 0) {
    throw new Error('No active categories found')
  }

  // Check quota before starting (reserve calls for all categories + verification reserve)
  const quotaCheck = await checkAndIncrementQuota(categories.length, quotaReserve)
  if (!quotaCheck.allowed) {
    throw new QuotaExhaustedError(
      `Daily API quota exceeded. ${quotaCheck.used}/${quotaCheck.limit} calls used today. ` +
        `This search needs ${categories.length} calls but only ${quotaCheck.remaining} remain.`,
      quotaCheck,
    )
  }

  const byPlaceId = new Map<string, DiscoveredRestaurant>()
  let categoriesSearched = 0
  let totalPlacesFound = 0
  const errors: string[] = []

  for (const cat of categories) {
    const query = `best ${cat.name} restaurants in ${city}, ${state}`
    let found = 0

    try {
      const places: PlaceResult[] = await searchPlaces(query, maxResults)
      found = places.length
      totalPlacesFound += places.length

      for (const place of places) {
        // Quality filter: skip restaurants that have ratings/reviews below thresholds.
        // If rating or reviewCount is missing, don't reject — only filter when data exists.
        if (place.rating != null && place.rating < minRating) continue
        if (place.reviewCount != null && place.reviewCount < minReviews) continue

        const existing = byPlaceId.get(place.placeId)
        if (existing) {
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
            rating: place.rating,
            reviewCount: place.reviewCount,
            categorySlugs: [cat.slug],
          })
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      errors.push(`${cat.name}: ${msg}`)
    }

    categoriesSearched++

    onProgress?.({
      category: cat.name,
      categorySlug: cat.slug,
      index: categoriesSearched,
      total: categories.length,
      found,
      uniqueSoFar: byPlaceId.size,
      error:
        found === 0 && errors.length > 0
          ? errors[errors.length - 1]
          : undefined,
    })

    // Small delay between API calls
    if (categoriesSearched < categories.length) {
      await new Promise((r) => setTimeout(r, 200))
    }
  }

  const restaurants = Array.from(byPlaceId.values())

  // Save batch to DB for later review
  let batchId: string | undefined
  try {
    const batch = await prisma.discoveryBatch.create({
      data: {
        city,
        state,
        resultsPerCategory: maxResults,
        totalResults: totalPlacesFound,
        uniqueRestaurants: restaurants.length,
        categoriesSearched,
        restaurants: JSON.parse(JSON.stringify(restaurants)),
        status: 'pending',
      },
    })
    batchId = batch.id
  } catch (err) {
    console.error('Failed to save discovery batch:', err)
  }

  return {
    batchId,
    restaurants,
    stats: {
      categoriesSearched,
      totalPlacesFound,
      uniqueRestaurants: restaurants.length,
    },
    errors,
  }
}
