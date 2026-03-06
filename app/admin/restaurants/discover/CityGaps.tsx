'use client'

import { useState, useEffect, useCallback } from 'react'
import { MapPin, Loader2, ChevronDown, ChevronRight, AlertTriangle, EyeOff } from 'lucide-react'

type MissingCategory = { name: string; slug: string }

type CityGap = {
  city: string
  state: string
  totalCategories: number
  coveredCategories: number
  missingCategories: MissingCategory[]
}

const EXCLUDED_KEY = 'foodmedals-city-gaps-excluded'

function loadExcluded(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(EXCLUDED_KEY)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch {
    return new Set()
  }
}

function saveExcluded(set: Set<string>) {
  localStorage.setItem(EXCLUDED_KEY, JSON.stringify([...set]))
}

function cityKey(city: string, state: string) {
  return `${city}|${state}`
}

export function CityGaps() {
  const [cities, setCities] = useState<CityGap[]>([])
  const [totalCategories, setTotalCategories] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [excluded, setExcluded] = useState<Set<string>>(new Set())
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const fetchGaps = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/restaurants/discover/city-gaps')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setCities(data.cities)
      setTotalCategories(data.totalCategories)
    } catch {
      setError('Failed to load city gaps')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchGaps()
    setExcluded(loadExcluded())
  }, [fetchGaps])

  const toggleExclude = (key: string) => {
    setExcluded(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      saveExcluded(next)
      return next
    })
  }

  const toggleExpand = (key: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const visibleCities = cities.filter(c => !excluded.has(cityKey(c.city, c.state)))
  const excludedCities = cities.filter(c => excluded.has(cityKey(c.city, c.state)))

  return (
    <div className="bg-gray-900 border border-orange-500/20 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <MapPin className="w-4 h-4 text-orange-400" />
          City Category Gaps
        </h2>
        {!loading && cities.length > 0 && (
          <span className="text-xs text-gray-500">
            {visibleCities.length} {visibleCities.length === 1 ? 'city' : 'cities'} with gaps
            {excludedCities.length > 0 && ` · ${excludedCities.length} excluded`}
          </span>
        )}
      </div>

      <p className="text-xs text-gray-400">
        Cities on FoodMedals that have zero restaurants in one or more categories.
        Exclude cities you don&apos;t want to discover for.
      </p>

      {loading && (
        <div className="flex items-center justify-center py-6 text-gray-500 text-sm gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Scanning cities…
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-red-400 text-xs py-2">
          <AlertTriangle className="w-3.5 h-3.5" />
          {error}
        </div>
      )}

      {!loading && !error && cities.length === 0 && (
        <div className="text-center py-6 text-gray-500 text-sm">
          All cities have full category coverage!
        </div>
      )}

      {!loading && !error && visibleCities.length > 0 && (
        <div className="space-y-1 max-h-[420px] overflow-y-auto pr-1">
          {visibleCities.map(c => {
            const key = cityKey(c.city, c.state)
            const isExpanded = expanded.has(key)
            const gapPct = Math.round((c.missingCategories.length / c.totalCategories) * 100)

            return (
              <div key={key} className="rounded-xl border border-gray-700/50 bg-gray-800/40 overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-2.5">
                  {/* Expand toggle */}
                  <button
                    type="button"
                    onClick={() => toggleExpand(key)}
                    className="text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {isExpanded
                      ? <ChevronDown className="w-3.5 h-3.5" />
                      : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>

                  {/* City name */}
                  <button
                    type="button"
                    onClick={() => toggleExpand(key)}
                    className="flex-1 text-left text-sm text-gray-200 hover:text-white transition-colors"
                  >
                    {c.city}, {c.state}
                  </button>

                  {/* Coverage bar */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-20 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-400 rounded-full transition-all"
                        style={{ width: `${100 - gapPct}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-gray-500 w-16 text-right tabular-nums">
                      {c.coveredCategories}/{c.totalCategories} cats
                    </span>
                  </div>

                  {/* Missing count badge */}
                  <span className="text-[11px] px-2 py-0.5 bg-orange-500/15 text-orange-300 border border-orange-500/30 rounded-full font-medium tabular-nums shrink-0">
                    {c.missingCategories.length} missing
                  </span>

                  {/* Exclude checkbox */}
                  <button
                    type="button"
                    onClick={() => toggleExclude(key)}
                    className="text-gray-600 hover:text-orange-400 transition-colors shrink-0"
                    title="Exclude from list"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Expanded: missing categories */}
                {isExpanded && (
                  <div className="px-4 pb-3 pt-1 border-t border-gray-700/30">
                    <div className="flex flex-wrap gap-1.5">
                      {c.missingCategories.map(cat => (
                        <span
                          key={cat.slug}
                          className="text-[11px] px-2 py-0.5 bg-gray-700/60 text-gray-400 rounded-full"
                        >
                          {cat.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Excluded cities section */}
      {!loading && excludedCities.length > 0 && (
        <div className="pt-2 border-t border-gray-800">
          <p className="text-[11px] text-gray-600 mb-2">
            Excluded ({excludedCities.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {excludedCities.map(c => {
              const key = cityKey(c.city, c.state)
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleExclude(key)}
                  className="text-[11px] px-2 py-0.5 bg-gray-800/60 text-gray-600 border border-gray-700/40 rounded-full hover:text-gray-400 hover:border-gray-600 transition-colors"
                  title="Click to un-exclude"
                >
                  {c.city}, {c.state} ✕
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
