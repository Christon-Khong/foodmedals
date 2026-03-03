'use client'

import { useState, useCallback } from 'react'
import { NearMeToggle } from '@/components/NearMeToggle'
import { CityFilter } from '@/components/CityFilter'
import { LeaderboardResults } from '@/components/LeaderboardResults'
import type { LeaderboardRow, CityOption } from '@/lib/queries'

type Mode = 'all' | 'nearme' | 'city'

type Props = {
  categorySlug: string
  year: number
  initialRows: LeaderboardRow[]
  cities: CityOption[]
  initialCity?: string | null
  initialState?: string | null
}

export function LeaderboardWithLocation({
  categorySlug,
  year,
  initialRows,
  cities,
  initialCity,
  initialState,
}: Props) {
  const [mode, setMode]         = useState<Mode>(initialCity && initialState ? 'city' : 'all')
  const [rows, setRows]         = useState<LeaderboardRow[]>(initialRows)
  const [loading, setLoading]   = useState(false)
  const [selectedCity, setSelectedCity]   = useState<string | null>(initialCity ?? null)
  const [selectedState, setSelectedState] = useState<string | null>(initialState ?? null)

  async function fetchLeaderboard(params: Record<string, string>) {
    setLoading(true)
    try {
      const qs  = new URLSearchParams({ year: String(year), ...params })
      const res = await fetch(`/api/categories/${categorySlug}/leaderboard?${qs}`)
      if (res.ok) {
        const data = await res.json()
        setRows(data.rows)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleLocationChange = useCallback((lat: number, lng: number, radius: number) => {
    setMode('nearme')
    setSelectedCity(null)
    setSelectedState(null)
    fetchLeaderboard({ lat: String(lat), lng: String(lng), radius: String(radius) })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categorySlug, year])

  const handleNearMeClear = useCallback(() => {
    setMode('all')
    setRows(initialRows)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialRows])

  const handleCityChange = useCallback((city: string | null, state: string | null) => {
    setSelectedCity(city)
    setSelectedState(state)
    if (!city || !state) {
      setMode('all')
      setRows(initialRows)
    } else {
      setMode('city')
      fetchLeaderboard({ city, state })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categorySlug, year, initialRows])

  return (
    <div className="max-w-3xl mx-auto px-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 py-5">
        <NearMeToggle
          onLocationChange={handleLocationChange}
          onClear={handleNearMeClear}
        />
        {mode !== 'nearme' && (
          <CityFilter
            cities={cities}
            selectedCity={selectedCity}
            selectedState={selectedState}
            onCityChange={handleCityChange}
          />
        )}
        {mode === 'city' && selectedCity && selectedState && (
          <span className="text-sm text-gray-500">
            📍 {selectedCity}, {selectedState}
          </span>
        )}
      </div>

      {/* Results */}
      <LeaderboardResults
        rows={rows}
        year={year}
        loading={loading}
        nearMe={mode === 'nearme'}
      />
    </div>
  )
}
