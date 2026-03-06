import { timingSafeEqual } from 'crypto'

/**
 * Timing-safe comparison of an API key from a Bearer token header
 * against the stored ADMIN_API_KEY env var.
 * Returns true only when both values exist and match.
 */
export function verifyApiKey(authHeader: string | null): boolean {
  const apiKey = process.env.ADMIN_API_KEY
  if (!apiKey) return false

  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!bearerToken) return false

  if (bearerToken.length !== apiKey.length) return false

  return timingSafeEqual(Buffer.from(bearerToken), Buffer.from(apiKey))
}
