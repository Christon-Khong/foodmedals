/** Score thresholds → visual tier (shared between client and server) */
export function getScoreTier(score: number): {
  color: string
  gradient: string
  label: string
  aura: string
  cardAura: string
} {
  if (score >= 30) return { color: 'text-yellow-600', gradient: 'from-yellow-400 to-amber-500', label: 'Legendary', aura: 'tier-aura-legendary', cardAura: 'tier-card-legendary' }
  if (score >= 20) return { color: 'text-amber-600', gradient: 'from-amber-400 to-orange-500', label: 'Outstanding', aura: 'tier-aura-outstanding', cardAura: 'tier-card-outstanding' }
  if (score >= 12) return { color: 'text-orange-600', gradient: 'from-orange-400 to-red-400', label: 'Excellent', aura: 'tier-aura-excellent', cardAura: 'tier-card-excellent' }
  if (score >= 6)  return { color: 'text-rose-600', gradient: 'from-rose-400 to-pink-500', label: 'Great', aura: 'tier-aura-great', cardAura: 'tier-card-great' }
  if (score >= 3)  return { color: 'text-violet-600', gradient: 'from-violet-400 to-purple-500', label: 'Rising', aura: '', cardAura: '' }
  return { color: 'text-gray-500', gradient: 'from-gray-300 to-gray-400', label: 'New', aura: '', cardAura: '' }
}

/** Get the tier card aura class for a given score — usable by server and client components */
export function getTierCardAura(score: number): string {
  return getScoreTier(score).cardAura
}
