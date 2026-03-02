'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Confetti } from './Confetti'

type MedalType = 'gold' | 'silver' | 'bronze'

type Restaurant = {
  id:   string
  name: string
  city: string
  slug: string
}

type InitialMedal = {
  medalType:    MedalType
  restaurantId: string
}

type AwardFormProps = {
  category:      { id: string; name: string; slug: string; iconEmoji: string }
  restaurants:   Restaurant[]
  initialMedals: InitialMedal[]
  year:          number
}

const MEDAL_META: Record<MedalType, { src: string; label: string; color: string; bg: string }> = {
  gold:   { src: '/medals/gold.png',   label: 'Gold',   color: 'text-yellow-700', bg: 'bg-yellow-100 border-yellow-300' },
  silver: { src: '/medals/silver.png', label: 'Silver', color: 'text-gray-600',   bg: 'bg-gray-100   border-gray-300'   },
  bronze: { src: '/medals/bronze.png', label: 'Bronze', color: 'text-amber-700',  bg: 'bg-amber-100  border-amber-300'  },
}

const MEDAL_TYPES: MedalType[] = ['gold', 'silver', 'bronze']

export function AwardForm({ category, restaurants, initialMedals, year }: AwardFormProps) {
  const [medals, setMedals] = useState<Record<MedalType, string | null>>(() => ({
    gold:   initialMedals.find(m => m.medalType === 'gold')?.restaurantId   ?? null,
    silver: initialMedals.find(m => m.medalType === 'silver')?.restaurantId ?? null,
    bronze: initialMedals.find(m => m.medalType === 'bronze')?.restaurantId ?? null,
  }))

  const [saving, setSaving]         = useState<string | null>(null) // `${restaurantId}-${medalType}`
  const [goldConfetti, setConfetti] = useState(false)
  const [error, setError]           = useState<string | null>(null)

  const handleAward = useCallback(async (restaurantId: string, medalType: MedalType) => {
    // No-op if already assigned
    if (medals[medalType] === restaurantId) return

    const key = `${restaurantId}-${medalType}`
    setSaving(key)
    setError(null)

    // Optimistic update: clear this restaurant from any other medal slot,
    // then assign the new medal
    const newMedals = { ...medals }
    for (const mt of MEDAL_TYPES) {
      if (mt !== medalType && newMedals[mt] === restaurantId) {
        newMedals[mt] = null
      }
    }
    newMedals[medalType] = restaurantId
    setMedals(newMedals)

    if (medalType === 'gold') {
      setConfetti(false)
      requestAnimationFrame(() => setConfetti(true))
    }

    try {
      const res = await fetch('/api/medals', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ foodCategoryId: category.id, restaurantId, medalType, year }),
      })
      if (!res.ok) {
        setMedals(medals) // revert
        setError('Failed to save. Please try again.')
      }
    } catch {
      setMedals(medals)
      setError('Network error. Please try again.')
    } finally {
      setSaving(null)
    }
  }, [medals, category.id, year])

  return (
    <div className="max-w-2xl mx-auto">
      <Confetti trigger={goldConfetti} />

      {/* ── Current selections summary ── */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {MEDAL_TYPES.map(mt => {
          const meta       = MEDAL_META[mt]
          const assignedId = medals[mt]
          const restaurant = restaurants.find(r => r.id === assignedId)
          return (
            <div key={mt} className={`rounded-2xl border-2 p-3 text-center transition-all ${meta.bg}`}>
              <div className="mb-1 flex justify-center">
                <Image src={meta.src} alt={meta.label} width={32} height={32} />
              </div>
              <div className={`text-xs font-bold uppercase tracking-wide ${meta.color} mb-1`}>{meta.label}</div>
              {restaurant ? (
                <p className="text-xs font-semibold text-gray-800 leading-tight line-clamp-2">
                  {restaurant.name}
                </p>
              ) : (
                <p className="text-xs text-gray-400 italic">Not yet picked</p>
              )}
            </div>
          )
        })}
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2 mb-4">{error}</p>
      )}

      {/* ── Restaurant list ── */}
      <div className="space-y-2">
        {restaurants.map(r => {
          const assignedMedal = MEDAL_TYPES.find(mt => medals[mt] === r.id) ?? null

          return (
            <div
              key={r.id}
              className={`bg-white rounded-2xl border px-4 py-3 flex items-center justify-between gap-3 transition-all ${
                assignedMedal ? 'border-yellow-300 shadow-sm' : 'border-amber-100'
              }`}
            >
              {/* Restaurant info */}
              <div className="min-w-0 flex-1">
                <Link
                  href={`/restaurants/${r.slug}`}
                  target="_blank"
                  className="text-sm font-semibold text-gray-800 hover:text-yellow-700 transition-colors block truncate"
                >
                  {r.name}
                </Link>
                <p className="text-xs text-gray-400 truncate">{r.city}, UT</p>
              </div>

              {/* Medal buttons */}
              <div className="flex gap-1.5 shrink-0">
                {MEDAL_TYPES.map(mt => {
                  const isActive = medals[mt] === r.id
                  const isSaving = saving === `${r.id}-${mt}`
                  return (
                    <button
                      key={mt}
                      onClick={() => handleAward(r.id, mt)}
                      disabled={saving !== null}
                      title={`Award ${MEDAL_META[mt].label}`}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all border ${
                        isActive
                          ? 'scale-110 border-transparent shadow-md ' + MEDAL_META[mt].bg
                          : 'border-gray-100 hover:border-yellow-200 hover:bg-amber-50 opacity-60 hover:opacity-100'
                      } ${isSaving ? 'animate-pulse' : ''}`}
                    >
                      <Image src={MEDAL_META[mt].src} alt={MEDAL_META[mt].label} width={22} height={22} />
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {restaurants.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg font-medium">No restaurants in this category yet.</p>
          <Link href="/suggest/restaurant" className="text-sm text-yellow-600 hover:underline mt-2 inline-block">
            Suggest one →
          </Link>
        </div>
      )}

      {/* ── Bottom CTA ── */}
      {medals.gold || medals.silver || medals.bronze ? (
        <div className="mt-6 text-center">
          <Link
            href={`/categories/${category.slug}`}
            className="text-sm text-yellow-700 hover:underline font-medium"
          >
            ← View {category.name} leaderboard
          </Link>
        </div>
      ) : null}
    </div>
  )
}
