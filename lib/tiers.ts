/** Default max community score — the score that represents the top "Legendary" tier.
 *  All other tiers are proportional percentages of this value. */
export const DEFAULT_MAX_COMMUNITY_SCORE = 150

/** Tier definition shape */
export type ScoreTier = {
  color: string
  gradient: string
  label: string
  aura: string      // CSS class for score number glow
  cardAura: string  // CSS class for card-level glow
}

/** Tier with its percentage breakpoint (for admin preview and dynamic computation) */
export type TierDefinition = ScoreTier & {
  pct: number  // 0-100, percentage of maxScore where this tier begins
}

/** All 18 tiers, ordered from highest to lowest.
 *  Top 8 tiers get animated aura effects. */
export const TIER_DEFINITIONS: TierDefinition[] = [
  { pct: 100, label: 'Legendary',   color: 'text-yellow-600',  gradient: 'from-yellow-400 to-amber-500',    aura: 'tier-aura-legendary',    cardAura: 'tier-card-legendary' },
  { pct: 90,  label: 'Mythic',      color: 'text-amber-500',   gradient: 'from-amber-400 to-yellow-500',    aura: 'tier-aura-mythic',       cardAura: 'tier-card-mythic' },
  { pct: 80,  label: 'Iconic',      color: 'text-orange-500',  gradient: 'from-orange-400 to-amber-500',    aura: 'tier-aura-iconic',       cardAura: 'tier-card-iconic' },
  { pct: 70,  label: 'Outstanding', color: 'text-orange-600',  gradient: 'from-orange-500 to-red-400',      aura: 'tier-aura-outstanding',  cardAura: 'tier-card-outstanding' },
  { pct: 62,  label: 'Exceptional', color: 'text-red-500',     gradient: 'from-red-400 to-rose-400',        aura: 'tier-aura-exceptional',  cardAura: 'tier-card-exceptional' },
  { pct: 54,  label: 'Superb',      color: 'text-rose-500',    gradient: 'from-rose-400 to-pink-400',       aura: 'tier-aura-superb',       cardAura: 'tier-card-superb' },
  { pct: 47,  label: 'Excellent',   color: 'text-rose-600',    gradient: 'from-rose-500 to-pink-500',       aura: 'tier-aura-excellent',    cardAura: 'tier-card-excellent' },
  { pct: 40,  label: 'Impressive',  color: 'text-pink-500',    gradient: 'from-pink-400 to-fuchsia-400',    aura: 'tier-aura-impressive',   cardAura: 'tier-card-impressive' },
  { pct: 34,  label: 'Great',       color: 'text-fuchsia-500', gradient: 'from-fuchsia-400 to-purple-400',  aura: '',                       cardAura: '' },
  { pct: 28,  label: 'Strong',      color: 'text-purple-500',  gradient: 'from-purple-400 to-violet-400',   aura: '',                       cardAura: '' },
  { pct: 23,  label: 'Notable',     color: 'text-violet-500',  gradient: 'from-violet-400 to-indigo-400',   aura: '',                       cardAura: '' },
  { pct: 18,  label: 'Solid',       color: 'text-indigo-500',  gradient: 'from-indigo-400 to-blue-400',     aura: '',                       cardAura: '' },
  { pct: 14,  label: 'Promising',   color: 'text-blue-500',    gradient: 'from-blue-400 to-cyan-400',       aura: '',                       cardAura: '' },
  { pct: 10,  label: 'Rising',      color: 'text-cyan-500',    gradient: 'from-cyan-400 to-teal-400',       aura: '',                       cardAura: '' },
  { pct: 7,   label: 'Growing',     color: 'text-teal-500',    gradient: 'from-teal-400 to-emerald-400',    aura: '',                       cardAura: '' },
  { pct: 4,   label: 'Budding',     color: 'text-emerald-500', gradient: 'from-emerald-400 to-green-400',   aura: '',                       cardAura: '' },
  { pct: 2,   label: 'Fresh',       color: 'text-green-500',   gradient: 'from-green-400 to-lime-400',      aura: '',                       cardAura: '' },
  { pct: 0,   label: 'New',         color: 'text-gray-500',    gradient: 'from-gray-300 to-gray-400',       aura: '',                       cardAura: '' },
]

/** Score threshold → visual tier (shared between client and server).
 *  @param score    - The restaurant's community score
 *  @param maxScore - The score that represents 100% (top tier). Defaults to DEFAULT_MAX_COMMUNITY_SCORE. */
export function getScoreTier(score: number, maxScore?: number): ScoreTier {
  const max = maxScore ?? DEFAULT_MAX_COMMUNITY_SCORE
  for (const tier of TIER_DEFINITIONS) {
    const threshold = Math.round((tier.pct / 100) * max)
    if (score >= threshold) return tier
  }
  // Fallback (should never reach since last tier has pct=0)
  return TIER_DEFINITIONS[TIER_DEFINITIONS.length - 1]
}

/** Get the tier card aura class for a given score — usable by server and client components */
export function getTierCardAura(score: number, maxScore?: number): string {
  return getScoreTier(score, maxScore).cardAura
}

/** Compute the absolute threshold for each tier given a maxScore.
 *  Useful for admin preview and progress bar calculations. */
export function getTierThresholds(maxScore?: number): Array<TierDefinition & { threshold: number }> {
  const max = maxScore ?? DEFAULT_MAX_COMMUNITY_SCORE
  return TIER_DEFINITIONS.map(tier => ({
    ...tier,
    threshold: Math.round((tier.pct / 100) * max),
  }))
}
