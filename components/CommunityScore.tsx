'use client'

import { useState } from 'react'
import { Info } from 'lucide-react'
import { getScoreTier, DEFAULT_MAX_COMMUNITY_SCORE } from '@/lib/tiers'

// Re-export for backwards compatibility with client component imports
export { getTierCardAura } from '@/lib/tiers'

type Props = {
  score: number
  /** Maximum possible score for the bar fill — defaults to DEFAULT_MAX_COMMUNITY_SCORE */
  maxScore?: number
  size?: 'sm' | 'md' | 'lg'
}

const SIZES = {
  sm: { label: 'text-[10px]', score: 'text-sm', bar: 'h-1.5', width: 'w-16', gap: 'gap-1' },
  md: { label: 'text-xs', score: 'text-lg', bar: 'h-2', width: 'w-20', gap: 'gap-1.5' },
  lg: { label: 'text-xs', score: 'text-xl', bar: 'h-2.5', width: 'w-24', gap: 'gap-2' },
} as const

export function CommunityScore({ score, maxScore, size = 'md' }: Props) {
  const [showTooltip, setShowTooltip] = useState(false)
  const s = SIZES[size]

  // Fill percentage — bar fills to 100% at the top tier threshold, capped at 100%
  const max = maxScore ?? DEFAULT_MAX_COMMUNITY_SCORE
  const tier = getScoreTier(score, max)
  const pct = Math.min((score / max) * 100, 100)

  return (
    <div className={`flex flex-col items-end ${s.gap} relative`}>
      {/* Score + label row */}
      <div className="flex items-center gap-1">
        <span className={`font-extrabold ${tier.color} ${s.score} leading-none rounded-md px-1 ${tier.aura}`}>
          {score}
        </span>
        <button
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowTooltip(t => !t) }}
          className="text-gray-300 hover:text-gray-500 transition-colors"
          aria-label="Score info"
        >
          <Info className="w-3 h-3" />
        </button>
      </div>

      {/* Tier label */}
      <span className={`${s.label} font-bold uppercase tracking-wider ${tier.color} leading-none`}>
        {tier.label}
      </span>

      {/* Visual bar */}
      <div className={`${s.width} ${s.bar} bg-gray-100 rounded-full overflow-hidden`}>
        <div
          className={`h-full rounded-full bg-gradient-to-r ${tier.gradient} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full right-0 mb-2 w-56 bg-gray-900 text-white text-xs rounded-xl px-3 py-2.5 shadow-xl z-50 leading-relaxed">
          <p className="font-bold mb-1">Community Score</p>
          <p className="text-gray-300">
            Earned from community medals.
            Gold = 3 pts, Silver = 2 pts, Bronze = 1 pt.
            Gold comment = +1. Photo with comment = +1 extra.
            Crown Jewel picks also add +1.
          </p>
          <div className="absolute bottom-0 right-4 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900" />
        </div>
      )}
    </div>
  )
}
