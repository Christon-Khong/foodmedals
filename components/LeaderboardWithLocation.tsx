'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { NearMeToggle } from '@/components/NearMeToggle'
import { StateFilter } from '@/components/StateFilter'
import { CityFilter } from '@/components/CityFilter'
import { LeaderboardResults } from '@/components/LeaderboardResults'
import { Confetti } from '@/components/Confetti'
import { GoldCommentModal } from '@/components/GoldCommentModal'
import { NominationsSection } from '@/app/categories/[slug]/NominationsSection'
import type { LeaderboardRow, CityOption, StateOption } from '@/lib/queries'

type Mode = 'all' | 'nearme' | 'city'
type MedalType = 'gold' | 'silver' | 'bronze'
type UserMedals = Record<MedalType, string | null>

type Nomination = {
  id: string
  name: string
  city: string
  state: string
  description: string | null
  submitter: string
  createdAt: string
  voteCount: number
  voted: boolean
}

type Props = {
  categorySlug: string
  categoryId: string
  categoryName: string
  year: number
  initialRows: LeaderboardRow[]
  cities: CityOption[]
  states: StateOption[]
  initialCity?: string | null
  initialState?: string | null
  nominations: Nomination[]
  isAdmin: boolean
  isLoggedIn: boolean
  defaultNearMe?: boolean
}

export function LeaderboardWithLocation({
  categorySlug,
  categoryId,
  categoryName,
  year,
  initialRows,
  cities,
  states,
  initialCity,
  initialState,
  nominations,
  isAdmin,
  isLoggedIn: isLoggedInProp,
  defaultNearMe = true,
}: Props) {
  const [mode, setMode]         = useState<Mode>(initialCity && initialState ? 'city' : 'all')
  const [rows, setRows]         = useState<LeaderboardRow[]>(initialRows)
  const [loading, setLoading]   = useState(false)
  const [selectedCity, setSelectedCity]   = useState<string | null>(initialCity ?? null)
  const [selectedState, setSelectedState] = useState<string | null>(initialState ?? null)
  const [stateFilter, setStateFilter]     = useState<string | null>(initialState ?? null)
  const [nearMeCoords, setNearMeCoords]   = useState<{ lat: number; lng: number } | null>(null)
  const [nearMeAutoTriggered, setNearMeAutoTriggered] = useState(false)

  // Filter cities to only those in the selected state
  const filteredCities = useMemo(
    () => stateFilter ? cities.filter(c => c.state === stateFilter) : cities,
    [cities, stateFilter],
  )

  // Filter nominations by state
  const filteredNominations = useMemo(
    () => stateFilter ? nominations.filter(n => n.state === stateFilter) : nominations,
    [nominations, stateFilter],
  )

  // Medal state
  const [userMedals, setUserMedals] = useState<UserMedals>({ gold: null, silver: null, bronze: null })
  const [isLoggedIn, setIsLoggedIn] = useState(isLoggedInProp)
  const [goldConfetti, setGoldConfetti] = useState(false)

  // Gold medal comment tracking
  const [goldMedalId, setGoldMedalId] = useState<string | null>(null)
  const [goldHasComment, setGoldHasComment] = useState(false)
  const [goldCommentText, setGoldCommentText] = useState<string | null>(null)
  const [commentPrompt, setCommentPrompt] = useState<{
    medalId: string
    restaurantName: string
    initialComment?: string
  } | null>(null)

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
          // Track gold medal ID and comment
          if (medal.medalType === 'gold') {
            setGoldMedalId(medal.id)
            const comment = medal.goldMedalComment
            if (comment) {
              setGoldHasComment(true)
              setGoldCommentText(comment.comment)
            }
          }
        }
        setUserMedals(m)
      })
      .catch(() => {})
  }, [categorySlug, year])

  // Auto-trigger Near Me on mount when defaultNearMe is true
  useEffect(() => {
    if (!defaultNearMe || mode !== 'all') return
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        setNearMeCoords({ lat, lng })
        setNearMeAutoTriggered(true)
        setMode('nearme')
        setSelectedCity(null)
        setSelectedState(null)
        setLoading(true)
        const qs = new URLSearchParams({
          year: String(year),
          lat: String(lat),
          lng: String(lng),
          radius: '25',
        })
        fetch(`/api/categories/${categorySlug}/leaderboard?${qs}`)
          .then(res => res.ok ? res.json() : null)
          .then(data => { if (data) setRows(data.rows) })
          .catch(() => {})
          .finally(() => setLoading(false))
      },
      () => {
        // Geolocation denied — stay on 'all' mode
      },
      { timeout: 5000 },
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

    const WEIGHT: Record<MedalType, number> = { gold: 3, silver: 2, bronze: 1 }
    const COUNT_KEY: Record<MedalType, 'goldCount' | 'silverCount' | 'bronzeCount'> = {
      gold: 'goldCount', silver: 'silverCount', bronze: 'bronzeCount',
    }

    const isToggleOff = userMedals[medalType] === restaurantId
    const prevMedals = { ...userMedals }
    const prevRows = rows

    // Optimistic medal state update
    const newMedals = { ...userMedals }
    // Find what medal this restaurant currently has from the user
    const prevMedalOnRestaurant = (['gold', 'silver', 'bronze'] as MedalType[]).find(mt => userMedals[mt] === restaurantId) ?? null
    // Find what restaurant currently holds this medal type
    const prevHolderOfMedalType = userMedals[medalType]

    if (isToggleOff) {
      newMedals[medalType] = null
    } else {
      for (const mt of ['gold', 'silver', 'bronze'] as MedalType[]) {
        if (mt !== medalType && newMedals[mt] === restaurantId) {
          newMedals[mt] = null
        }
      }
      newMedals[medalType] = restaurantId
    }
    setUserMedals(newMedals)

    // Optimistic row counts update
    setRows(current => {
      const updated = current.map(r => ({ ...r }))

      if (isToggleOff) {
        // Remove medal: decrement this restaurant's count
        const row = updated.find(r => r.restaurantId === restaurantId)
        if (row) {
          row[COUNT_KEY[medalType]] = Math.max(0, row[COUNT_KEY[medalType]] - 1)
          row.totalScore = Math.max(0, row.totalScore - WEIGHT[medalType])
        }
      } else {
        // If another restaurant had this medal type, decrement it
        if (prevHolderOfMedalType && prevHolderOfMedalType !== restaurantId) {
          const oldRow = updated.find(r => r.restaurantId === prevHolderOfMedalType)
          if (oldRow) {
            oldRow[COUNT_KEY[medalType]] = Math.max(0, oldRow[COUNT_KEY[medalType]] - 1)
            oldRow.totalScore = Math.max(0, oldRow.totalScore - WEIGHT[medalType])
          }
        }
        // If this restaurant had a different medal from user, decrement that
        if (prevMedalOnRestaurant && prevMedalOnRestaurant !== medalType) {
          const row = updated.find(r => r.restaurantId === restaurantId)
          if (row) {
            row[COUNT_KEY[prevMedalOnRestaurant]] = Math.max(0, row[COUNT_KEY[prevMedalOnRestaurant]] - 1)
            row.totalScore = Math.max(0, row.totalScore - WEIGHT[prevMedalOnRestaurant])
          }
        }
        // Increment new medal on target restaurant
        const row = updated.find(r => r.restaurantId === restaurantId)
        if (row) {
          row[COUNT_KEY[medalType]] += 1
          row.totalScore += WEIGHT[medalType]
        }
      }

      // Re-sort by totalScore desc, then goldCount desc
      updated.sort((a, b) => b.totalScore - a.totalScore || b.goldCount - a.goldCount)
      return updated
    })

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
        if (!res.ok) { setUserMedals(prevMedals); setRows(prevRows) }
        else if (medalType === 'gold') {
          setGoldMedalId(null)
          setGoldHasComment(false)
          setGoldCommentText(null)
        }
      } else {
        const res = await fetch('/api/medals', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ foodCategoryId: categoryId, restaurantId, medalType, year }),
        })
        if (!res.ok) {
          setUserMedals(prevMedals)
          setRows(prevRows)
        } else if (medalType === 'gold') {
          const data = await res.json()
          if (data.id) {
            setGoldMedalId(data.id)
            setGoldHasComment(false)
            setGoldCommentText(null)
            // Prompt user to add a comment
            const row = rows.find(r => r.restaurantId === restaurantId)
            if (row) {
              setCommentPrompt({
                medalId: data.id,
                restaurantName: row.restaurantName,
              })
            }
          }
        }
      }
    } catch {
      setUserMedals(prevMedals)
      setRows(prevRows)
    }
  }, [userMedals, rows, isLoggedIn, categoryId, year])

  const handleLocationChange = useCallback((lat: number, lng: number, radius: number) => {
    setMode('nearme')
    setSelectedCity(null)
    setSelectedState(null)
    setNearMeCoords({ lat, lng })
    fetchLeaderboard({ lat: String(lat), lng: String(lng), radius: String(radius) })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categorySlug, year])

  const handleNearMeClear = useCallback(() => {
    setMode('all')
    setStateFilter(null)
    setSelectedCity(null)
    setSelectedState(null)
    setNearMeCoords(null)
    setNearMeAutoTriggered(false)
    setRows(initialRows)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialRows])

  const handleStateChange = useCallback((state: string | null) => {
    setStateFilter(state)
    setSelectedCity(null)
    setSelectedState(null)
    if (!state) {
      setMode('all')
      setRows(initialRows)
    } else {
      setMode('city')
      fetchLeaderboard({ state })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categorySlug, year, initialRows])

  const handleCityChange = useCallback((city: string | null, state: string | null) => {
    setSelectedCity(city)
    setSelectedState(state)
    if (!city || !state) {
      // City cleared — fall back to state filter if active
      if (stateFilter) {
        setMode('city')
        fetchLeaderboard({ state: stateFilter })
      } else {
        setMode('all')
        setRows(initialRows)
      }
    } else {
      setMode('city')
      fetchLeaderboard({ city, state })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categorySlug, year, initialRows, stateFilter])

  return (
    <div className="max-w-3xl mx-auto px-4">
      <Confetti trigger={goldConfetti} />

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 py-5">
        <NearMeToggle
          onLocationChange={handleLocationChange}
          onClear={handleNearMeClear}
          initialActive={nearMeAutoTriggered}
          initialCoords={nearMeCoords}
          defaultRadius={25}
        />
        {mode !== 'nearme' && (
          <>
            <StateFilter
              states={states}
              selectedState={stateFilter}
              onStateChange={handleStateChange}
            />
            <CityFilter
              cities={filteredCities}
              selectedCity={selectedCity}
              selectedState={selectedState}
              onCityChange={handleCityChange}
            />
          </>
        )}
        {mode === 'city' && selectedCity && selectedState && (
          <span className="text-sm text-gray-500">
            {selectedCity}, {selectedState}
          </span>
        )}
        {mode === 'city' && stateFilter && !selectedCity && (
          <span className="text-sm text-gray-500">
            {stateFilter}
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
        goldMedalId={goldMedalId}
        goldHasComment={goldHasComment}
        goldCommentText={goldCommentText}
        onOpenComment={(restaurantName) => {
          if (goldMedalId) {
            setCommentPrompt({
              medalId: goldMedalId,
              restaurantName,
              initialComment: goldCommentText ?? undefined,
            })
          }
        }}
      />

      {/* Nominations — filtered by state */}
      <NominationsSection
        nominations={filteredNominations}
        isAdmin={isAdmin}
        isLoggedIn={isLoggedIn}
        categorySlug={categorySlug}
      />

      {/* Gold medal comment modal */}
      {commentPrompt && (
        <GoldCommentModal
          medalId={commentPrompt.medalId}
          restaurantName={commentPrompt.restaurantName}
          categoryName={categoryName}
          initialComment={commentPrompt.initialComment}
          onClose={() => setCommentPrompt(null)}
          onSaved={(commentText) => {
            setCommentPrompt(null)
            setGoldHasComment(true)
            setGoldCommentText(commentText)
          }}
        />
      )}
    </div>
  )
}
