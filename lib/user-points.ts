/** User achievement tier system — points-based.
 *
 *  Points incentivize completing all 3 medals AND adding comments/photos.
 *  Balance: all 3 medals (6 pts) > gold + comment + photo (5 pts). */

// ─── Point values ────────────────────────────────────────────────────────────

export const USER_POINTS = {
  gold:    3,  // gold medal
  silver:  2,  // silver medal
  bronze:  1,  // bronze medal
  comment: 1,  // gold medal comment
  photo:   1,  // photo on gold medal comment
} as const

// ─── Tier definitions (ordered highest → lowest) ────────────────────────────

export type UserTier = {
  min: number
  label: string
  color: string
  glow: string | null
  glowDim: string | null
  animated: boolean
}

export const USER_TIERS: UserTier[] = [
  { min: 500, label: 'Eternal Flame', color: 'from-red-200 to-orange-100 text-red-900 border-red-300',
    glow:    '0 0 20px 6px rgba(251,191,36,0.5), 0 0 40px 12px rgba(245,158,11,0.3), 0 0 60px 20px rgba(251,191,36,0.15)',
    glowDim: '0 0 14px 4px rgba(251,191,36,0.22), 0 0 28px 8px rgba(245,158,11,0.12), 0 0 40px 12px rgba(251,191,36,0.06)',
    animated: true },
  { min: 400, label: 'Mythic Palate', color: 'from-fuchsia-200 to-pink-100 text-fuchsia-900 border-fuchsia-300',
    glow:    '0 0 20px 6px rgba(251,191,36,0.5), 0 0 40px 12px rgba(245,158,11,0.3), 0 0 60px 20px rgba(251,191,36,0.15)',
    glowDim: '0 0 14px 4px rgba(251,191,36,0.22), 0 0 28px 8px rgba(245,158,11,0.12), 0 0 40px 12px rgba(251,191,36,0.06)',
    animated: true },
  { min: 320, label: 'Sovereign',     color: 'from-yellow-300 to-amber-200 text-yellow-900 border-yellow-400',
    glow:    '0 0 20px 6px rgba(251,191,36,0.5), 0 0 40px 12px rgba(245,158,11,0.3), 0 0 60px 20px rgba(251,191,36,0.15)',
    glowDim: '0 0 14px 4px rgba(251,191,36,0.22), 0 0 28px 8px rgba(245,158,11,0.12), 0 0 40px 12px rgba(251,191,36,0.06)',
    animated: true },
  { min: 260, label: 'Luminary',      color: 'from-sky-200 to-indigo-100 text-sky-900 border-sky-300',
    glow:    '0 0 20px 6px rgba(251,191,36,0.5), 0 0 40px 12px rgba(245,158,11,0.3), 0 0 60px 20px rgba(251,191,36,0.15)',
    glowDim: '0 0 14px 4px rgba(251,191,36,0.22), 0 0 28px 8px rgba(245,158,11,0.12), 0 0 40px 12px rgba(251,191,36,0.06)',
    animated: true },
  { min: 220, label: 'Epicurean',     color: 'from-emerald-200 to-green-100 text-emerald-900 border-emerald-300',
    glow:    '0 0 20px 6px rgba(251,191,36,0.5), 0 0 40px 12px rgba(245,158,11,0.3), 0 0 60px 20px rgba(251,191,36,0.15)',
    glowDim: '0 0 14px 4px rgba(251,191,36,0.22), 0 0 28px 8px rgba(245,158,11,0.12), 0 0 40px 12px rgba(251,191,36,0.06)',
    animated: true },
  { min: 180, label: 'Oracle',        color: 'from-amber-200 to-yellow-100 text-amber-900 border-amber-300',
    glow:    '0 0 20px 6px rgba(251,191,36,0.5), 0 0 40px 12px rgba(245,158,11,0.3), 0 0 60px 20px rgba(251,191,36,0.15)',
    glowDim: '0 0 14px 4px rgba(251,191,36,0.22), 0 0 28px 8px rgba(245,158,11,0.12), 0 0 40px 12px rgba(251,191,36,0.06)',
    animated: true },
  { min: 140, label: 'Vanguard',      color: 'from-cyan-100 to-sky-100 text-cyan-800 border-cyan-200',
    glow:    '0 0 18px 5px rgba(6,182,212,0.45), 0 0 36px 10px rgba(14,165,233,0.25), 0 0 50px 16px rgba(6,182,212,0.12)',
    glowDim: '0 0 12px 3px rgba(6,182,212,0.2), 0 0 24px 6px rgba(14,165,233,0.1), 0 0 34px 10px rgba(6,182,212,0.05)',
    animated: true },
  { min: 105, label: 'The Palate',    color: 'from-rose-100 to-pink-100 text-rose-800 border-rose-200',
    glow:    '0 0 16px 4px rgba(244,63,94,0.4), 0 0 32px 8px rgba(236,72,153,0.2), 0 0 44px 14px rgba(244,63,94,0.1)',
    glowDim: '0 0 10px 3px rgba(244,63,94,0.18), 0 0 20px 5px rgba(236,72,153,0.08), 0 0 30px 8px rgba(244,63,94,0.04)',
    animated: true },
  { min:  75, label: 'Grand Curator', color: 'from-indigo-100 to-blue-100 text-indigo-800 border-indigo-200',
    glow:    '0 0 14px 4px rgba(99,102,241,0.35), 0 0 28px 8px rgba(79,70,229,0.18)',
    glowDim: '0 0 8px 3px rgba(99,102,241,0.15), 0 0 18px 5px rgba(79,70,229,0.08)',
    animated: true },
  { min:  50, label: 'Master Critic', color: 'from-purple-100 to-violet-100 text-purple-800 border-purple-200',
    glow:    '0 0 12px 3px rgba(168,85,247,0.3), 0 0 24px 6px rgba(139,92,246,0.15)',
    glowDim: '0 0 7px 2px rgba(168,85,247,0.13), 0 0 16px 4px rgba(139,92,246,0.06)',
    animated: true },
  { min:  32, label: 'Local Legend',  color: 'from-emerald-100 to-teal-100 text-emerald-800 border-emerald-200',
    glow:    '0 0 10px 3px rgba(16,185,129,0.28), 0 0 20px 5px rgba(20,184,166,0.12)',
    glowDim: '0 0 6px 2px rgba(16,185,129,0.12), 0 0 14px 3px rgba(20,184,166,0.05)',
    animated: true },
  { min:  18, label: 'Silver Spoon',  color: 'from-slate-100 to-gray-100 text-slate-700 border-slate-200',
    glow:    '0 0 8px 2px rgba(148,163,184,0.25), 0 0 16px 4px rgba(100,116,139,0.1)',
    glowDim: '0 0 5px 1px rgba(148,163,184,0.1), 0 0 10px 2px rgba(100,116,139,0.04)',
    animated: true },
  { min:  12, label: 'Flavor Chaser', color: 'from-orange-100 to-amber-100 text-orange-800 border-orange-200',
    glow:    '0 0 8px 2px rgba(251,146,60,0.2)',
    glowDim: '0 0 4px 1px rgba(251,146,60,0.08)',
    animated: true },
  { min:   4, label: 'Food Scout',    color: 'from-lime-100 to-green-100 text-lime-800 border-lime-200',
    glow: null, glowDim: null, animated: false },
  { min:   2, label: 'Taste Tester',  color: 'from-yellow-100 to-amber-100 text-yellow-800 border-yellow-200',
    glow: null, glowDim: null, animated: false },
]

// ─── Point calculation ──────────────────────────────────────────────────────

type MedalInput = {
  medalType: string
  goldMedalComment?: { photoUrl?: string | null } | null
}

export type UserPointsBreakdown = {
  total: number
  medalPoints: number
  commentPoints: number
  photoPoints: number
  medalCount: number
  commentCount: number
  photoCount: number
}

export function calculateUserPoints(medals: MedalInput[]): UserPointsBreakdown {
  let medalCount = 0
  let medalPoints = 0
  let commentCount = 0
  let photoCount = 0

  for (const m of medals) {
    medalCount++
    const pts = m.medalType === 'gold' ? USER_POINTS.gold
              : m.medalType === 'silver' ? USER_POINTS.silver
              : USER_POINTS.bronze
    medalPoints += pts

    if (m.medalType === 'gold' && m.goldMedalComment) {
      commentCount++
      if (m.goldMedalComment.photoUrl) {
        photoCount++
      }
    }
  }

  const commentPoints = commentCount * USER_POINTS.comment
  const photoPoints   = photoCount   * USER_POINTS.photo

  return {
    total: medalPoints + commentPoints + photoPoints,
    medalPoints,
    commentPoints,
    photoPoints,
    medalCount,
    commentCount,
    photoCount,
  }
}

// ─── Tier lookup ────────────────────────────────────────────────────────────

export function getUserTier(points: number): UserTier | null {
  for (const tier of USER_TIERS) {
    if (points >= tier.min) return tier
  }
  return null
}

export function getNextUserTier(points: number): { needed: number; tierName: string } | null {
  for (let i = USER_TIERS.length - 1; i >= 0; i--) {
    if (points < USER_TIERS[i].min) {
      return { needed: USER_TIERS[i].min - points, tierName: USER_TIERS[i].label }
    }
  }
  return null // already at max tier
}
