import { prisma } from './prisma'

const COST_PER_CALL = 0.032

export type QuotaStatus = {
  used: number
  limit: number
  remaining: number
  costToday: number
  percentUsed: number
}

/**
 * Get the current day as an ISO date string (UTC).
 */
function todayUTC(): string {
  return new Date().toISOString().slice(0, 10) // "2026-03-05"
}

/**
 * Ensure the AdminSettings singleton exists and auto-reset the counter
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

  // If the stored date doesn't match today, reset the counter
  if (row.placesApiLastResetDate !== today) {
    row = await prisma.adminSettings.update({
      where: { id: 'singleton' },
      data: {
        placesApiCallsToday: 0,
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

  return {
    used,
    limit,
    remaining,
    costToday: Math.round(used * COST_PER_CALL * 1000) / 1000,
    percentUsed: Math.min(percentUsed, 100),
  }
}

/**
 * Check if `callCount` more API calls are allowed. If yes, atomically
 * increment the counter and return allowed: true. If not, return
 * allowed: false without incrementing.
 *
 * Handles day rollover automatically.
 */
export async function checkAndIncrementQuota(callCount: number): Promise<{
  allowed: boolean
  used: number
  limit: number
  remaining: number
}> {
  const row = await getOrResetSettings()
  const limit = row.placesApiDailyLimit
  const currentUsed = row.placesApiCallsToday

  if (currentUsed + callCount > limit) {
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
