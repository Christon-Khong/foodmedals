import { prisma } from './prisma'
import { geocodeWithQuota } from './restaurant-utils'

export type VerificationResult = {
  checked: number
  updated: number
  failed: number
  skipped: number
}

/**
 * Verify restaurant addresses by re-geocoding and comparing coordinates.
 * Picks restaurants ordered by lastGeocodedAt (never-checked first, then oldest).
 *
 * @param maxChecks - maximum number of restaurants to verify (each costs 1 API call)
 * @returns summary of results
 */
export async function verifyAddresses(maxChecks: number): Promise<VerificationResult> {
  if (maxChecks <= 0) {
    return { checked: 0, updated: 0, failed: 0, skipped: 0 }
  }

  // Only re-check restaurants that haven't been verified in the last 30 days
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // Fetch restaurants to verify: never-checked first, then oldest checked
  const restaurants = await prisma.restaurant.findMany({
    where: {
      status: 'active',
      // Only verify restaurants that have addresses
      address: { not: '' },
      city: { not: '' },
      state: { not: '' },
      zip: { not: '' },
      // Skip restaurants checked within the last 30 days
      OR: [
        { lastGeocodedAt: null },
        { lastGeocodedAt: { lt: thirtyDaysAgo } },
      ],
    },
    orderBy: [
      { lastGeocodedAt: { sort: 'asc', nulls: 'first' } },
    ],
    take: maxChecks,
    select: {
      id: true,
      name: true,
      address: true,
      city: true,
      state: true,
      zip: true,
      lat: true,
      lng: true,
    },
  })

  let checked = 0
  let updated = 0
  let failed = 0
  let skipped = 0

  for (const restaurant of restaurants) {
    const coords = await geocodeWithQuota(
      restaurant.address,
      restaurant.city,
      restaurant.state,
      restaurant.zip,
    )

    if (!coords) {
      // Quota exhausted or geocode failed — still update lastGeocodedAt
      // so we don't keep retrying the same ones
      if (restaurant.lat != null && restaurant.lng != null) {
        // Has existing coords, just mark as checked
        await prisma.restaurant.update({
          where: { id: restaurant.id },
          data: { lastGeocodedAt: new Date() },
        })
        skipped++
      } else {
        failed++
      }
      checked++
      continue
    }

    // Check if coordinates changed significantly (>0.001° ≈ 111m)
    const latDiff = Math.abs((restaurant.lat ?? 0) - coords.lat)
    const lngDiff = Math.abs((restaurant.lng ?? 0) - coords.lng)
    const significantChange = latDiff > 0.001 || lngDiff > 0.001
    const hadNoCoords = restaurant.lat == null || restaurant.lng == null

    if (significantChange || hadNoCoords) {
      await prisma.restaurant.update({
        where: { id: restaurant.id },
        data: {
          lat: coords.lat,
          lng: coords.lng,
          lastGeocodedAt: new Date(),
        },
      })
      updated++
    } else {
      // Coords unchanged — just update the timestamp
      await prisma.restaurant.update({
        where: { id: restaurant.id },
        data: { lastGeocodedAt: new Date() },
      })
    }

    checked++
  }

  return { checked, updated, failed, skipped }
}
