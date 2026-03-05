import { Award, Star } from 'lucide-react'

export const metadata = { title: 'Tier Preview — Admin' }

/* ── Community Score tiers (restaurant score badges) ─────────────────────── */
const SCORE_TIERS = [
  { min: 30, label: 'Legendary',   score: 'text-yellow-600', gradient: 'from-yellow-400 to-amber-500',   aura: 'tier-aura-legendary',   cardAura: 'tier-card-legendary' },
  { min: 20, label: 'Outstanding', score: 'text-amber-600',  gradient: 'from-amber-400 to-orange-500',   aura: 'tier-aura-outstanding', cardAura: 'tier-card-outstanding' },
  { min: 12, label: 'Excellent',   score: 'text-orange-600', gradient: 'from-orange-400 to-red-400',     aura: 'tier-aura-excellent',   cardAura: 'tier-card-excellent' },
  { min:  6, label: 'Great',       score: 'text-rose-600',   gradient: 'from-rose-400 to-pink-500',      aura: 'tier-aura-great',       cardAura: 'tier-card-great' },
  { min:  3, label: 'Rising',      score: 'text-violet-600', gradient: 'from-violet-400 to-purple-500',  aura: '',                      cardAura: '' },
  { min:  0, label: 'New',         score: 'text-gray-500',   gradient: 'from-gray-300 to-gray-400',      aura: '',                      cardAura: '' },
]

/* ── Achievement tiers (critic profile badges) ───────────────────────────── */
const TIERS = [
  { min: 80, label: 'Oracle',        color: 'from-amber-200 to-yellow-100 text-amber-900 border-amber-300',
    glow:    '0 0 20px 6px rgba(251,191,36,0.5), 0 0 40px 12px rgba(245,158,11,0.3), 0 0 60px 20px rgba(251,191,36,0.15)',
    glowDim: '0 0 14px 4px rgba(251,191,36,0.22), 0 0 28px 8px rgba(245,158,11,0.12), 0 0 40px 12px rgba(251,191,36,0.06)',
    animated: true },
  { min: 60, label: 'Vanguard',      color: 'from-cyan-100 to-sky-100 text-cyan-800 border-cyan-200',
    glow:    '0 0 18px 5px rgba(6,182,212,0.45), 0 0 36px 10px rgba(14,165,233,0.25), 0 0 50px 16px rgba(6,182,212,0.12)',
    glowDim: '0 0 12px 3px rgba(6,182,212,0.2), 0 0 24px 6px rgba(14,165,233,0.1), 0 0 34px 10px rgba(6,182,212,0.05)',
    animated: true },
  { min: 45, label: 'The Palate',    color: 'from-rose-100 to-pink-100 text-rose-800 border-rose-200',
    glow:    '0 0 16px 4px rgba(244,63,94,0.4), 0 0 32px 8px rgba(236,72,153,0.2), 0 0 44px 14px rgba(244,63,94,0.1)',
    glowDim: '0 0 10px 3px rgba(244,63,94,0.18), 0 0 20px 5px rgba(236,72,153,0.08), 0 0 30px 8px rgba(244,63,94,0.04)',
    animated: true },
  { min: 30, label: 'Grand Curator', color: 'from-indigo-100 to-blue-100 text-indigo-800 border-indigo-200',
    glow:    '0 0 14px 4px rgba(99,102,241,0.35), 0 0 28px 8px rgba(79,70,229,0.18)',
    glowDim: '0 0 8px 3px rgba(99,102,241,0.15), 0 0 18px 5px rgba(79,70,229,0.08)',
    animated: true },
  { min: 20, label: 'Master Critic', color: 'from-purple-100 to-violet-100 text-purple-800 border-purple-200',
    glow:    '0 0 12px 3px rgba(168,85,247,0.3), 0 0 24px 6px rgba(139,92,246,0.15)',
    glowDim: '0 0 7px 2px rgba(168,85,247,0.13), 0 0 16px 4px rgba(139,92,246,0.06)',
    animated: true },
  { min: 12, label: 'Local Legend',  color: 'from-emerald-100 to-teal-100 text-emerald-800 border-emerald-200',
    glow:    '0 0 10px 3px rgba(16,185,129,0.28), 0 0 20px 5px rgba(20,184,166,0.12)',
    glowDim: '0 0 6px 2px rgba(16,185,129,0.12), 0 0 14px 3px rgba(20,184,166,0.05)',
    animated: true },
  { min:  7, label: 'Silver Spoon',  color: 'from-slate-100 to-gray-100 text-slate-700 border-slate-200',
    glow:    '0 0 8px 2px rgba(148,163,184,0.25), 0 0 16px 4px rgba(100,116,139,0.1)',
    glowDim: '0 0 5px 1px rgba(148,163,184,0.1), 0 0 10px 2px rgba(100,116,139,0.04)',
    animated: true },
  { min:  4, label: 'Flavor Chaser', color: 'from-orange-100 to-amber-100 text-orange-800 border-orange-200',
    glow:    '0 0 8px 2px rgba(251,146,60,0.2)',
    glowDim: '0 0 4px 1px rgba(251,146,60,0.08)',
    animated: true },
  { min:  2, label: 'Food Scout',    color: 'from-lime-100 to-green-100 text-lime-800 border-lime-200',
    glow: null, glowDim: null, animated: false },
  { min:  1, label: 'Taste Tester',  color: 'from-yellow-100 to-amber-100 text-yellow-800 border-yellow-200',
    glow: null, glowDim: null, animated: false },
]

function AnimatedStyles() {
  // Generate a unique keyframe for each animated tier
  const css = TIERS
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

export default function TierPreviewPage() {
  return (
    <div>
      <AnimatedStyles />

      {/* ── Community Score Tiers ────────────────────────────────────────────── */}
      <h1 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
        <Star className="w-5 h-5 text-yellow-500" />
        Community Score Tiers
      </h1>
      <p className="text-sm text-gray-500 mb-8">Score-based tiers shown on restaurant cards and leaderboards. Gold = 3 pts, Silver = 2 pts, Bronze = 1 pt. Gold comment bonus = +1 pt.</p>

      <div className="space-y-4 mb-16">
        {SCORE_TIERS.map((tier, i) => {
          const exampleScore = tier.min === 0 ? 1 : tier.min
          const max = Math.max(exampleScore * 2, 10)
          const pct = Math.min((exampleScore / max) * 100, 100)

          return (
            <div key={tier.label} className={`bg-gray-900 rounded-2xl border border-gray-800 p-5 flex items-center gap-5 ${tier.cardAura}`}>
              {/* Rank number */}
              <div className="text-2xl font-bold text-gray-700 w-6 text-right shrink-0">
                {SCORE_TIERS.length - i}
              </div>

              {/* Score badge preview */}
              <div className="shrink-0 flex flex-col items-center gap-1">
                <span className={`font-extrabold ${tier.score} text-2xl leading-none rounded-md px-2 py-1 ${tier.aura}`}>
                  {exampleScore}
                </span>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${tier.score} leading-none`}>
                  {tier.label}
                </span>
                <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${tier.gradient}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <span className={`font-bold text-sm ${tier.score}`}>{tier.label}</span>
                  {tier.aura && (
                    <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide">
                      Animated
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-400">
                  Requires <span className="text-white font-semibold">{tier.min}+</span> community score points
                </p>
                <p className="text-xs text-gray-600 mt-0.5">
                  {tier.aura ? 'Pulsing score glow + card aura' : tier.gradient.includes('gray') ? 'No glow effect' : 'Gradient bar only'}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Achievement Tiers ───────────────────────────────────────────────── */}
      <h1 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
        <Award className="w-5 h-5 text-yellow-500" />
        Achievement Tiers
      </h1>
      <p className="text-sm text-gray-500 mb-8">All 10 levels with their badge colors and profile picture aura effects.</p>

      <div className="space-y-6">
        {TIERS.map((tier, i) => {
          const rank = TIERS.length - i
          const animClass = tier.animated ? `aura-${tier.label.toLowerCase().replace(/\s+/g, '-')}` : ''

          return (
            <div key={tier.label} className="bg-gray-900 rounded-2xl border border-gray-800 p-6 flex items-center gap-6">
              {/* Rank number */}
              <div className="text-3xl font-bold text-gray-700 w-8 text-right shrink-0">
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
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-xl font-bold text-white shadow-lg">
                  FM
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
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
                <p className="text-sm text-gray-400">
                  Requires <span className="text-white font-semibold">{tier.min}</span> categories ranked
                </p>
                <p className="text-xs text-gray-600 mt-0.5">
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
