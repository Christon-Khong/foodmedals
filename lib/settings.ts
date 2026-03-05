import { prisma } from './prisma'
import { DEFAULT_MAX_COMMUNITY_SCORE } from './tiers'

/** Fetch the admin-configured max community score from the database.
 *  Falls back to DEFAULT_MAX_COMMUNITY_SCORE if no row exists yet. */
export async function getMaxCommunityScore(): Promise<number> {
  try {
    const row = await prisma.adminSettings.findUnique({
      where: { id: 'singleton' },
      select: { maxCommunityScore: true },
    })
    return row?.maxCommunityScore ?? DEFAULT_MAX_COMMUNITY_SCORE
  } catch {
    return DEFAULT_MAX_COMMUNITY_SCORE
  }
}
