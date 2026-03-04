'use client'

import { useState, useCallback, useEffect } from 'react'
import { NearMeToggle } from '@/components/NearMeToggle'
import { CityFilter } from '@/components/CityFilter'
import { LeaderboardResults } from '@/components/LeaderboardResults'
import { Confetti } from '@/components/Confetti'
import type { LeaderboardRow, CityOption } from '@/lib/queries'

type Mode = 'all' | 'nearme' | 'city'
type MedalType = 'gold' | 'silver' | 'bronze'
type UserMedals = Record<MedalType, string | null>

type Props = {
  categorySlug: string
  categoryId: string
  year: number
  initialRows: LeaderboardRow[]
  cities: CityOption[]
  initialCity?: string | null
  initialState?: string | null
}

export function LeaderboardWithLocation({
  categorySlug,
  categoryId,
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

  // Medal state
  const [userMedals, setUserMedals] = useState<UserMedals>({ gold: null, silver: null, bronze: null })
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [goldConfetti, setGoldConfetti] = useState(false)

  // Fetch user's medals on mount
  useEffect(() => {
    fetch(`/api/categories/${categorySlug}/my-medals?year=${year}`)
      .then(res => {
        if (res.status === 401) return null
        if (!res.ok) return null
        return res.json()
      })
      .then(data => {
        if (!data) return
        setIsLoggedIn(true)
        const m: UserMedals = { gold: null, silver: null, bronze: null }
        for (const medal of data.medals) {
          m[medal.medalType as MedalType] = medal.restaurantId
        }
        setUserMedals(m)
      })
      .catch(() => {})
  }, [categorySlug, year])

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

  const handleMedalChange = useCallback(async (restaurantId: string, medalType: MedalType) => {
    if (!isLoggedIn) return

    const isToggleOff = userMedals[medalType] === restaurantId
    const prevMedals = { ...userMedals }

    // Optimistic update
    const newMedals = { ...userMedals }
    if (isToggleOff) {
      newMedals[medalType] = null
    } else {
      // Clear this restaurant from any other medal slot
      for (const mt of ['gold', 'silver', 'bronze'] as MedalType[]) {
        if (mt !== medalType && newMedals[mt] === restaurantId) {
          newMedals[mt] = null
        }
      }
      newMedals[medalType] = restaurantId
    }
    setUserMedals(newMedals)

    // Gold confetti
    if (!isToggleOff && medalType === 'gold') {
      setGoldConfetti(false)
      requestAnimationFrame(() => setGoldConfetti(true))
    }

    try {
      if (isToggleOff) {
        const res = await fetch('/api/medals', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ foodCategoryId: categoryId, medalType, year }),
        })
        if (!res.ok) setUserMedals(prevMedals)
      } else {
        const res = await fetch('/api/medals', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ foodCategoryId: categoryId, restaurantId, medalType, year }),
        })
        if (!res.ok) setUserMedals(prevMedals)
      }
    } catch {
      setUserMedals(prevMedals)
    }
  }, [userMedals, isLoggedIn, categoryId, year])

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
      <Confetti trigger={goldConfetti} />

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
        userMedals={userMedals}
        isLoggedIn={isLoggedIn}
        onMedalChange={handleMedalChange}
        categorySlug={categorySlug}
      />
    </div>
  )
}
