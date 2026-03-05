'use client'

import { useState } from 'react'
import { Save, Check, RotateCcw } from 'lucide-react'
import {
  DEFAULT_MAX_COMMUNITY_SCORE,
  getTierThresholds,
} from '@/lib/tiers'

type Props = {
  savedMaxScore: number
}

export function CommunityTierPreview({ savedMaxScore }: Props) {
  const [maxScore, setMaxScore] = useState(savedMaxScore)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const tiers = getTierThresholds(maxScore)

  const hasChanges = maxScore !== savedMaxScore
  const goldMedalsToTop = Math.ceil(maxScore / 5)

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxCommunityScore: maxScore }),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } catch {
      // Error handling — stays unsaved
    }
    setSaving(false)
  }

  return (
    <div>
      {/* Max Score Control */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-semibold text-gray-300">
            Max Community Score (top tier threshold)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={maxScore}
              onChange={(e) => setMaxScore(Math.max(10, Math.min(1000, Number(e.target.value) || 10)))}
              className="w-20 bg-gray-800 text-white text-sm font-bold rounded-lg px-3 py-1.5 border border-gray-700 text-center"
              min={10}
              max={1000}
            />
            {maxScore !== DEFAULT_MAX_COMMUNITY_SCORE && (
              <button
                onClick={() => setMaxScore(DEFAULT_MAX_COMMUNITY_SCORE)}
                title="Reset to default"
                className="p-1.5 text-gray-500 hover:text-gray-300 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
        <input
          type="range"
          min={10}
          max={500}
          value={Math.min(maxScore, 500)}
          onChange={(e) => setMaxScore(Number(e.target.value))}
          className="w-full accent-yellow-500"
        />
        <div className="flex justify-between text-xs text-gray-600 mt-1">
          <span>10</span>
          <span>~{goldMedalsToTop} gold medals to reach top tier</span>
          <span>500</span>
        </div>

        {/* Save button — appears when value changes */}
        {hasChanges && (
          <div className="mt-4 pt-3 border-t border-gray-800 flex items-center justify-between">
            <p className="text-xs text-yellow-500">
              Unsaved changes — current saved value is <span className="font-bold">{savedMaxScore}</span>
            </p>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-gray-900 text-sm font-bold rounded-lg transition-colors disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        )}
        {saved && !hasChanges && (
          <div className="mt-4 pt-3 border-t border-gray-800 flex items-center gap-1.5 text-green-400 text-xs font-semibold">
            <Check className="w-3.5 h-3.5" />
            Saved successfully
          </div>
        )}
      </div>

      {/* Tier Preview Cards */}
      <div className="space-y-3 mb-16">
        {tiers.map((tier, i) => {
          const exampleScore = tier.threshold === 0 ? 1 : tier.threshold
          const pct = Math.min((exampleScore / maxScore) * 100, 100)

          return (
            <div
              key={tier.label}
              className={`bg-gray-900 rounded-2xl border border-gray-800 p-5 flex items-center gap-5 ${tier.cardAura}`}
            >
              {/* Rank number */}
              <div className="text-2xl font-bold text-gray-700 w-6 text-right shrink-0">
                {tiers.length - i}
              </div>

              {/* Score badge preview */}
              <div className="shrink-0 flex flex-col items-center gap-1">
                <span className={`font-extrabold ${tier.color} text-2xl leading-none rounded-md px-2 py-1 ${tier.aura}`}>
                  {exampleScore}
                </span>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${tier.color} leading-none`}>
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
                  <span className={`font-bold text-sm ${tier.color}`}>{tier.label}</span>
                  {tier.aura && (
                    <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide">
                      Animated
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-400">
                  Requires <span className="text-white font-semibold">{tier.threshold}+</span> community score points
                  <span className="text-gray-600 ml-1">({tier.pct}% of max)</span>
                </p>
                <p className="text-xs text-gray-600 mt-0.5">
                  {tier.aura ? 'Pulsing score glow + card aura' : tier.gradient.includes('gray') ? 'No glow effect' : 'Gradient bar only'}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
