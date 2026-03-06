import { prisma } from './prisma'

const COST_PER_PLACES_CALL = 0.032  // Google Places API (Text Search)
const COST_PER_GEOCODE_CALL = 0.005 // Google Geocoding API

export type QuotaStatus = {
  used: number
  limit: number
  remaining: number
  costToday: number
  percentUsed: number
  geocodeUsed: number
  geocodeCostToday: number
  totalCostToday: number
}

/**
 * Get the current day as an ISO date string (UTC).
 */
function todayUTC(): string {
  return new Date().toISOString().slice(0, 10) // "2026-03-05"
}

/**
 * Ensure the AdminSettings singleton exists and auto-reset the counters
 * if the day has changed. Returns the current row.
 */
async function getOrResetSettings() {
  const today = todayUTC()

  // Upsert to ensure row exists
  let row = await prisma.adminSettings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: { id: 'singleton' },
  })

  // If the stored date doesn't match today, reset both counters
  if (row.placesApiLastResetDate !== today) {
    row = await prisma.adminSettings.update({
      where: { id: 'singleton' },
      data: {
        placesApiCallsToday: 0,
        geocodeCallsToday: 0,
        placesApiLastResetDate: today,
      },
    })
  }

  return row
}

/**
 * Get current quota usage status (read-only, auto-resets on new day).
 */
export async function getQuotaStatus(): Promise<QuotaStatus> {
  const row = await getOrResetSettings()
  const used = row.placesApiCallsToday
  const limit = row.placesApiDailyLimit
  const remaining = Math.max(0, limit - used)
  const percentUsed = limit > 0 ? Math.round((used / limit) * 100) : 0
  const geocodeUsed = row.geocodeCallsToday
  const placesCost = Math.round(used * COST_PER_PLACES_CALL * 1000) / 1000
  const geocodeCost = Math.round(geocodeUsed * COST_PER_GEOCODE_CALL * 1000) / 1000

  return {
    used,
    limit,
    remaining,
    costToday: placesCost,
    percentUsed: Math.min(percentUsed, 100),
    geocodeUsed,
    geocodeCostToday: geocodeCost,
    totalCostToday: Math.round((placesCost + geocodeCost) * 1000) / 1000,
  }
}

/**
 * Check if `callCount` more API calls are allowed. If yes, atomically
 * increment the counter and return allowed: true. If not, return
 * allowed: false without incrementing.
 *
 * @param callCount - number of API calls to reserve
 * @param reserve - extra headroom to leave in the quota (e.g. for address verification).
 *                  The check becomes: used + callCount + reserve <= limit
 *
 * Handles day rollover automatically.
 */
export async function checkAndIncrementQuota(
  callCount: number,
  reserve: number = 0,
): Promise<{
  allowed: boolean
  used: number
  limit: number
  remaining: number
}> {
  const row = await getOrResetSettings()
  const limit = row.placesApiDailyLimit
  const currentUsed = row.placesApiCallsToday

  if (currentUsed + callCount + reserve > limit) {
    return {
      allowed: false,
      used: currentUsed,
      limit,
      remaining: Math.max(0, limit - currentUsed),
    }
  }

  // Atomically increment
  const updated = await prisma.adminSettings.update({
    where: { id: 'singleton' },
    data: {
      placesApiCallsToday: { increment: callCount },
    },
  })

  return {
    allowed: true,
    used: updated.placesApiCallsToday,
    limit,
    remaining: Math.max(0, limit - updated.placesApiCallsToday),
  }
}

/**
 * Get the verification reserve from AdminSettings.
 * This is the number of daily API calls reserved for address verification.
 */
export async function getVerificationReserve(): Promise<number> {
  const row = await getOrResetSettings()
  return row.apiVerificationReserve
}

/**
 * Get discover-related settings from AdminSettings.
 */
export async function getDiscoverSettings(): Promise<{
  verificationReserve: number
  minRating: number
  minReviews: number
}> {
  const row = await getOrResetSettings()
  return {
    verificationReserve: row.apiVerificationReserve,
    minRating: row.discoverMinRating,
    minReviews: row.discoverMinReviews,
  }
}

/**
 * Increment the geocode counter. Unlike Places API, geocoding has no hard
 * daily limit — it's cheap ($0.005/call) — but we track it for visibility.
 * Auto-resets on new day.
 */
export async function incrementGeocodeCounter(callCount: number = 1): Promise<void> {
  await getOrResetSettings() // ensures day reset
  await prisma.adminSettings.update({
    where: { id: 'singleton' },
    data: { geocodeCallsToday: { increment: callCount } },
  })
}
