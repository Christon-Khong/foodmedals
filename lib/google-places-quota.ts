import { prisma } from './prisma'

const GOOGLE_MONTHLY_CREDIT = 200   // $200 free credit per calendar month
const COST_PER_PLACES_CALL = 0.032  // Google Places API (Text Search)
const COST_PER_GEOCODE_CALL = 0.005 // Google Geocoding API

/**
 * Get the number of days in the current month (UTC).
 */
function getDaysInCurrentMonth(): number {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)).getUTCDate()
}

/**
 * Compute the daily Places API call limit based on the current month's length.
 * $200 monthly credit / $0.032 per call / days in month.
 */
export function getDailyPlacesLimit(): number {
  return Math.floor(GOOGLE_MONTHLY_CREDIT / COST_PER_PLACES_CALL / getDaysInCurrentMonth())
}

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
  const limit = getDailyPlacesLimit()
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
  const limit = getDailyPlacesLimit()
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
 * Get the verification interval in days from AdminSettings.
 */
export async function getVerificationIntervalDays(): Promise<number> {
  const row = await getOrResetSettings()
  return row.verificationIntervalDays
}

/**
 * Get discover-related settings from AdminSettings.
 */
export async function getDiscoverSettings(): Promise<{
  verificationReserve: number
  verificationIntervalDays: number
  minRating: number
  minReviews: number
}> {
  const row = await getOrResetSettings()
  return {
    verificationReserve: row.apiVerificationReserve,
    verificationIntervalDays: row.verificationIntervalDays,
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
