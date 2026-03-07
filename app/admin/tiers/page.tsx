import { Award, Star } from 'lucide-react'
import { CommunityTierPreview } from './CommunityTierPreview'
import { getMaxCommunityScore } from '@/lib/settings'
import { USER_TIERS } from '@/lib/user-points'

export const metadata = { title: 'Tier Preview — Admin' }
export const dynamic = 'force-dynamic'

function AnimatedStyles() {
  const css = USER_TIERS
    .filter(t => t.animated && t.glow && t.glowDim)
    .map(t => `
      @keyframes aura-${t.label.toLowerCase().replace(/\s+/g, '-')} {
        0%, 100% { box-shadow: ${t.glow}; }
        50% { box-shadow: ${t.glowDim}; }
      }
    `)
    .join('\n')

  return <style>{css}</style>
}

export default async function TierPreviewPage() {
  const savedMaxScore = await getMaxCommunityScore()

  return (
    <div>
      <AnimatedStyles />

      {/* ── Community Score Tiers (interactive) ────────────────────────────────── */}
      <h1 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
        <Star className="w-5 h-5 text-yellow-500" />
        Community Score Tiers
      </h1>
      <p className="text-sm text-gray-500 mb-4">
        Score-based tiers shown on restaurant cards and leaderboards.
        Gold = 3 pts, Silver = 2 pts, Bronze = 1 pt. Gold comment bonus = +1 pt. Crown Jewel = +1 pt.
      </p>

      <CommunityTierPreview savedMaxScore={savedMaxScore} />

      {/* ── User Achievement Tiers ─────────────────────────────────────────── */}
      <h1 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
        <Award className="w-5 h-5 text-yellow-500" />
        User Achievement Tiers
      </h1>
      <p className="text-sm text-gray-500 mb-2">
        All {USER_TIERS.length} levels based on all-time cumulative points. Points never reset across years.
      </p>
      <p className="text-xs text-gray-600 mb-8">
        Gold medal = 3 pts &middot; Silver = 2 pts &middot; Bronze = 1 pt &middot; Gold comment = +1 pt &middot; Photo on comment = +1 pt
      </p>

      <div className="space-y-4 sm:space-y-6">
        {USER_TIERS.map((tier, i) => {
          const rank = USER_TIERS.length - i

          return (
            <div key={tier.label} className="bg-gray-900 rounded-2xl border border-gray-800 p-4 sm:p-6 flex items-center gap-4 sm:gap-6">
              {/* Rank number */}
              <div className="text-2xl sm:text-3xl font-bold text-gray-700 w-6 sm:w-8 text-right shrink-0">
                {rank}
              </div>

              {/* Avatar with glow */}
              <div
                className="shrink-0 rounded-full"
                style={{
                  boxShadow: !tier.animated && tier.glow ? tier.glow : undefined,
                  animation: tier.animated ? `aura-${tier.label.toLowerCase().replace(/\s+/g, '-')} 3s ease-in-out infinite` : undefined,
                }}
              >
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-lg sm:text-xl font-bold text-white shadow-lg">
                  FM
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 sm:gap-3 mb-1 flex-wrap">
                  <span className={`inline-flex items-center gap-1 text-xs font-bold bg-gradient-to-r ${tier.color} px-2.5 py-0.5 rounded-full border`}>
                    <Award className="w-3 h-3" />
                    {tier.label}
                  </span>
                  {tier.animated && (
                    <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide">
                      Animated
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-gray-400">
                  Requires <span className="text-white font-semibold">{tier.min}</span> points
                </p>
                <p className="text-[10px] sm:text-xs text-gray-600 mt-0.5">
                  {tier.glow ? (tier.animated ? 'Pulsing aura glow' : 'Static aura glow') : 'No glow effect'}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
