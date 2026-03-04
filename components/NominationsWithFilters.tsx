'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { NearMeToggle } from '@/components/NearMeToggle'
import { StateFilter } from '@/components/StateFilter'
import { CityFilter } from '@/components/CityFilter'
import { CategoryIcon } from '@/components/CategoryIcon'
import { VoteButton } from '@/app/suggest/vote/VoteButton'
import type { CityOption, StateOption } from '@/lib/queries'

type Category = {
  name: string
  emoji: string
  iconUrl: string | null
  slug: string
}

type Suggestion = {
  id: string
  name: string
  city: string
  state: string
  lat: number | null
  lng: number | null
  description: string | null
  websiteUrl: string | null
  submitter: string
  createdAt: string
  categories: Category[]
  voteCount: number
  voted: boolean
}

type Props = {
  suggestions: Suggestion[]
  isLoggedIn: boolean
}

function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 3958.8 // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

type Mode = 'all' | 'nearme' | 'location'

export function NominationsWithFilters({ suggestions, isLoggedIn }: Props) {
  const [mode, setMode] = useState<Mode>('all')
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [radius, setRadius] = useState(25)
  const [autoTriggered, setAutoTriggered] = useState(false)
  const [selectedState, setSelectedState] = useState<string | null>(null)
  const [selectedCity, setSelectedCity] = useState<string | null>(null)
  const [selectedCityState, setSelectedCityState] = useState<string | null>(null)

  // Auto-trigger Near Me on mount
  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        setCoords({ lat, lng })
        setAutoTriggered(true)
        setMode('nearme')
        setRadius(25)
      },
      () => {
        // Geolocation denied — stay on 'all'
      },
      { timeout: 5000 },
    )
  }, [])

  // Derive state and city options from all suggestions
  const states: StateOption[] = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const s of suggestions) {
      counts[s.state] = (counts[s.state] ?? 0) + 1
    }
    return Object.entries(counts)
      .map(([state, count]) => ({ state, count }))
      .sort((a, b) => a.state.localeCompare(b.state))
  }, [suggestions])

  const cities: CityOption[] = useMemo(() => {
    const counts: Record<string, { city: string; state: string; count: number }> = {}
    for (const s of suggestions) {
      const key = `${s.city}|${s.state}`
      if (!counts[key]) {
        counts[key] = { city: s.city, state: s.state, count: 0 }
      }
      counts[key].count++
    }
    return Object.values(counts).sort((a, b) => a.city.localeCompare(b.city))
  }, [suggestions])

  const filteredCities = useMemo(
    () => selectedState ? cities.filter(c => c.state === selectedState) : cities,
    [cities, selectedState],
  )

  // Filter suggestions based on current mode
  const filtered = useMemo(() => {
    if (mode === 'nearme' && coords) {
      return suggestions.filter(s => {
        if (s.lat == null || s.lng == null) return false
        return haversineDistance(coords.lat, coords.lng, s.lat, s.lng) <= radius
      })
    }
    if (mode === 'location') {
      return suggestions.filter(s => {
        if (selectedCity && selectedCityState) {
          return s.city === selectedCity && s.state === selectedCityState
        }
        if (selectedState) {
          return s.state === selectedState
        }
        return true
      })
    }
    return suggestions
  }, [suggestions, mode, coords, radius, selectedState, selectedCity, selectedCityState])

  const handleLocationChange = useCallback((lat: number, lng: number, r: number) => {
    setMode('nearme')
    setCoords({ lat, lng })
    setRadius(r)
    setSelectedState(null)
    setSelectedCity(null)
    setSelectedCityState(null)
  }, [])

  const handleNearMeClear = useCallback(() => {
    setMode('all')
    setCoords(null)
    setAutoTriggered(false)
    setSelectedState(null)
    setSelectedCity(null)
    setSelectedCityState(null)
  }, [])

  const handleStateChange = useCallback((state: string | null) => {
    setSelectedState(state)
    setSelectedCity(null)
    setSelectedCityState(null)
    setMode(state ? 'location' : 'all')
  }, [])

  const handleCityChange = useCallback((city: string | null, state: string | null) => {
    setSelectedCity(city)
    setSelectedCityState(state)
    if (city && state) {
      setMode('location')
    } else if (selectedState) {
      setMode('location')
    } else {
      setMode('all')
    }
  }, [selectedState])

  return (
    <>
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <NearMeToggle
          onLocationChange={handleLocationChange}
          onClear={handleNearMeClear}
          initialActive={autoTriggered}
          initialCoords={coords}
          defaultRadius={25}
        />
        {mode !== 'nearme' && (
          <>
            <StateFilter
              states={states}
              selectedState={selectedState}
              onStateChange={handleStateChange}
            />
            <CityFilter
              cities={filteredCities}
              selectedCity={selectedCity}
              selectedState={selectedCityState}
              onCityChange={handleCityChange}
            />
          </>
        )}
        {mode === 'location' && selectedCity && selectedCityState && (
          <span className="text-sm text-gray-500">
            {selectedCity}, {selectedCityState}
          </span>
        )}
        {mode === 'location' && selectedState && !selectedCity && (
          <span className="text-sm text-gray-500">
            {selectedState}
          </span>
        )}
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-12 text-center">
          <div className="text-5xl mb-4">🍽️</div>
          <p className="text-lg font-semibold text-gray-700">
            {mode === 'nearme'
              ? 'No nominations near you'
              : 'No pending suggestions'}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Know a great spot?{' '}
            <Link href="/suggest/restaurant" className="text-yellow-700 hover:underline font-medium">
              Suggest one!
            </Link>
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(s => (
            <div
              key={s.id}
              className="bg-white border border-amber-100 rounded-2xl shadow-sm p-5 flex gap-4"
            >
              {/* Vote button */}
              <div className="shrink-0 pt-1">
                {isLoggedIn ? (
                  <VoteButton
                    restaurantId={s.id}
                    initialVoted={s.voted}
                    initialCount={s.voteCount}
                  />
                ) : (
                  <Link
                    href="/auth/signin?callbackUrl=/suggest/vote"
                    className="flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl text-sm font-semibold bg-gray-100 text-gray-400 hover:bg-gray-200 transition-colors"
                  >
                    <span className="text-lg">△</span>
                    <span>{s.voteCount}</span>
                  </Link>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900">{s.name}</h3>
                <p className="text-sm text-gray-500">
                  {s.city}, {s.state}
                </p>

                {s.description && (
                  <p className="text-sm text-gray-600 mt-1.5 line-clamp-2">{s.description}</p>
                )}

                {s.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {s.categories.map(c => (
                      <span
                        key={c.name}
                        className="text-xs bg-amber-50 border border-amber-200 text-amber-800 px-2 py-0.5 rounded-full"
                      >
                        <CategoryIcon slug={c.slug} iconEmoji={c.emoji} iconUrl={c.iconUrl} /> {c.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Progress toward auto-approval */}
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.round((s.voteCount / 10) * 100))}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">
                    {s.voteCount}/10 to activate
                  </span>
                </div>

                <p className="text-xs text-gray-400 mt-1.5">
                  Suggested by {s.submitter} · {new Date(s.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
