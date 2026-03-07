'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { X } from 'lucide-react'
import { NearMeToggle } from '@/components/NearMeToggle'
import { LeaderboardResults } from '@/components/LeaderboardResults'
import dynamic from 'next/dynamic'

const Confetti = dynamic(() => import('@/components/Confetti').then(m => m.Confetti), { ssr: false })
const GoldCommentModal = dynamic(() => import('@/components/GoldCommentModal').then(m => m.GoldCommentModal), { ssr: false })
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
  const [mode, setMode]         = useState<Mode>(initialState ? 'city' : 'all')
  const [rows, setRows]         = useState<LeaderboardRow[]>(initialRows)
  const [loading, setLoading]   = useState(false)
  const [stateFilters, setStateFilters] = useState<string[]>(initialState ? [initialState] : [])
  const [cityFilters, setCityFilters]   = useState<string[]>(
    initialCity && initialState ? [`${initialCity}|${initialState}`] : []
  )
  const [nearMeCoords, setNearMeCoords]   = useState<{ lat: number; lng: number } | null>(null)
  const [nearMeAutoTriggered, setNearMeAutoTriggered] = useState(false)

  // Filter cities to only those in selected states
  const filteredCities = useMemo(
    () => stateFilters.length > 0 ? cities.filter(c => stateFilters.includes(c.state)) : cities,
    [cities, stateFilters],
  )

  // Filter nominations by selected states
  const filteredNominations = useMemo(
    () => stateFilters.length > 0 ? nominations.filter(n => stateFilters.includes(n.state)) : nominations,
    [nominations, stateFilters],
  )

  // Medal state
  const [userMedals, setUserMedals] = useState<UserMedals>({ gold: null, silver: null, bronze: null })
  const [isLoggedIn, setIsLoggedIn] = useState(isLoggedInProp)
  const [goldConfetti, setGoldConfetti] = useState(false)

  // Gold medal comment tracking
  const [goldMedalId, setGoldMedalId] = useState<string | null>(null)
  const [goldHasComment, setGoldHasComment] = useState(false)
  const [goldCommentText, setGoldCommentText] = useState<string | null>(null)
  const [goldPhotoUrl, setGoldPhotoUrl] = useState<string | null>(null)
  const [commentPrompt, setCommentPrompt] = useState<{
    medalId: string
    restaurantName: string
    initialComment?: string
    initialPhotoUrl?: string | null
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
              setGoldPhotoUrl(comment.photoUrl ?? null)
            }
          }
        }
        setUserMedals(m)
      })
      .catch(() => {})
  }, [categorySlug, year])

  // Auto-trigger Near Me on mount when defaultNearMe is true.
  // Uses cached coords from sessionStorage to avoid the jarring "double load"
  // where the page first shows full results, then switches to near-me.
  useEffect(() => {
    if (!defaultNearMe || mode !== 'all') return

    function applyNearMe(lat: number, lng: number) {
      setNearMeCoords({ lat, lng })
      setNearMeAutoTriggered(true)
      setMode('nearme')
      setStateFilters([])
      setCityFilters([])
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
    }

    // Check for cached coordinates first (instant, no browser prompt delay)
    try {
      const cachedLat = sessionStorage.getItem('fm-geo-lat')
      const cachedLng = sessionStorage.getItem('fm-geo-lng')
      if (cachedLat && cachedLng) {
        const lat = parseFloat(cachedLat)
        const lng = parseFloat(cachedLng)
        if (!isNaN(lat) && !isNaN(lng)) {
          applyNearMe(lat, lng)
          return
        }
      }
    } catch {}

    // No cached coords — fall back to browser geolocation API
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        try {
          sessionStorage.setItem('fm-geo-lat', String(lat))
          sessionStorage.setItem('fm-geo-lng', String(lng))
        } catch {}
        applyNearMe(lat, lng)
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
          // If removing a gold medal that had a comment, also subtract the comment bonus point
          const commentBonus = medalType === 'gold' && goldHasComment ? 1 : 0
          row.totalScore = Math.max(0, row.totalScore - WEIGHT[medalType] - commentBonus)
        }
      } else {
        // If another restaurant had this medal type, decrement it
        if (prevHolderOfMedalType && prevHolderOfMedalType !== restaurantId) {
          const oldRow = updated.find(r => r.restaurantId === prevHolderOfMedalType)
          if (oldRow) {
            oldRow[COUNT_KEY[medalType]] = Math.max(0, oldRow[COUNT_KEY[medalType]] - 1)
            // If reassigning gold and old restaurant had a comment, also subtract the comment bonus point
            const commentBonus = medalType === 'gold' && goldHasComment ? 1 : 0
            oldRow.totalScore = Math.max(0, oldRow.totalScore - WEIGHT[medalType] - commentBonus)
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
            const restored = data.existingComment ?? null
            const restoredPhoto = data.existingPhotoUrl ?? null
            if (restored) {
              setGoldHasComment(true)
              setGoldCommentText(restored)
              setGoldPhotoUrl(restoredPhoto)
            } else {
              setGoldHasComment(false)
              setGoldCommentText(null)
              setGoldPhotoUrl(null)
            }
            // Prompt user to add a comment
            const row = rows.find(r => r.restaurantId === restaurantId)
            if (row) {
              setCommentPrompt({
                medalId: data.id,
                restaurantName: row.restaurantName,
                initialComment: restored ?? undefined,
                initialPhotoUrl: restoredPhoto,
              })
            }
          }
        }
      }
    } catch {
      setUserMedals(prevMedals)
      setRows(prevRows)
    }
  }, [userMedals, rows, isLoggedIn, categoryId, year, goldHasComment])

  const handleLocationChange = useCallback((lat: number, lng: number, radius: number) => {
    setMode('nearme')
    setStateFilters([])
    setCityFilters([])
    setNearMeCoords({ lat, lng })
    try {
      sessionStorage.setItem('fm-geo-lat', String(lat))
      sessionStorage.setItem('fm-geo-lng', String(lng))
    } catch {}
    fetchLeaderboard({ lat: String(lat), lng: String(lng), radius: String(radius) })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categorySlug, year])

  const handleNearMeClear = useCallback(() => {
    setMode('all')
    setStateFilters([])
    setCityFilters([])
    setNearMeCoords(null)
    setNearMeAutoTriggered(false)
    if (initialCity || initialState) {
      fetchLeaderboard({})
    } else {
      setRows(initialRows)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialRows, initialCity, initialState])

  // Multi-select state handlers
  const handleAddState = useCallback((state: string) => {
    if (!state || stateFilters.includes(state)) return
    const next = [...stateFilters, state]
    setStateFilters(next)
    setMode('city')
    const params: Record<string, string> = { state: next.join(',') }
    if (cityFilters.length > 0) {
      params.city = cityFilters.map(cf => cf.split('|')[0]).join(',')
    }
    fetchLeaderboard(params)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateFilters, cityFilters, categorySlug, year])

  const handleRemoveState = useCallback((state: string) => {
    const nextStates = stateFilters.filter(s => s !== state)
    // Also remove cities belonging to the removed state
    const nextCities = cityFilters.filter(cf => cf.split('|')[1] !== state)
    setStateFilters(nextStates)
    setCityFilters(nextCities)

    if (nextStates.length === 0) {
      setMode('all')
      if (initialCity || initialState) {
        fetchLeaderboard({})
      } else {
        setRows(initialRows)
      }
    } else {
      const params: Record<string, string> = { state: nextStates.join(',') }
      if (nextCities.length > 0) {
        params.city = nextCities.map(cf => cf.split('|')[0]).join(',')
      }
      fetchLeaderboard(params)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateFilters, cityFilters, initialRows, initialCity, initialState, categorySlug, year])

  const handleAddCity = useCallback((cityStateKey: string) => {
    if (!cityStateKey || cityFilters.includes(cityStateKey)) return
    const [, state] = cityStateKey.split('|')
    const nextCities = [...cityFilters, cityStateKey]
    setCityFilters(nextCities)

    // Auto-add state if not already selected
    let nextStates = stateFilters
    if (!stateFilters.includes(state)) {
      nextStates = [...stateFilters, state]
      setStateFilters(nextStates)
    }

    setMode('city')
    const params: Record<string, string> = {
      state: nextStates.join(','),
      city: nextCities.map(cf => cf.split('|')[0]).join(','),
    }
    fetchLeaderboard(params)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateFilters, cityFilters, categorySlug, year])

  const handleRemoveCity = useCallback((cityStateKey: string) => {
    const nextCities = cityFilters.filter(cf => cf !== cityStateKey)
    setCityFilters(nextCities)

    if (nextCities.length === 0 && stateFilters.length > 0) {
      // Cities cleared, fall back to state filter
      fetchLeaderboard({ state: stateFilters.join(',') })
    } else if (nextCities.length === 0 && stateFilters.length === 0) {
      setMode('all')
      if (initialCity || initialState) {
        fetchLeaderboard({})
      } else {
        setRows(initialRows)
      }
    } else {
      const params: Record<string, string> = { state: stateFilters.join(',') }
      params.city = nextCities.map(cf => cf.split('|')[0]).join(',')
      fetchLeaderboard(params)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateFilters, cityFilters, initialRows, initialCity, initialState, categorySlug, year])

  const clearAllFilters = useCallback(() => {
    setStateFilters([])
    setCityFilters([])
    setMode('all')
    if (initialCity || initialState) {
      fetchLeaderboard({})
    } else {
      setRows(initialRows)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialRows, initialCity, initialState])

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
          <div className="flex flex-wrap items-center gap-1.5">
            {/* State chips */}
            {stateFilters.map(st => (
              <span
                key={st}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-amber-100 text-amber-800 text-sm font-medium"
              >
                {st}
                <button
                  onClick={() => handleRemoveState(st)}
                  className="hover:text-amber-950 transition-colors"
                  aria-label={`Remove ${st}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {/* State dropdown */}
            <select
              value=""
              onChange={e => { if (e.target.value) handleAddState(e.target.value) }}
              className="px-3 py-2 rounded-full border border-gray-300 bg-white text-sm text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-amber-300 cursor-pointer"
            >
              <option value="">{stateFilters.length > 0 ? 'Add state...' : 'All states'}</option>
              {states
                .filter(s => !stateFilters.includes(s.state))
                .map(s => (
                  <option key={s.state} value={s.state}>
                    {s.state} ({s.count})
                  </option>
                ))}
            </select>

            {/* City chips */}
            {cityFilters.map(cf => {
              const [cityName, state] = cf.split('|')
              return (
                <span
                  key={cf}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-amber-100 text-amber-800 text-sm font-medium"
                >
                  {cityName}, {state}
                  <button
                    onClick={() => handleRemoveCity(cf)}
                    className="hover:text-amber-950 transition-colors"
                    aria-label={`Remove ${cityName}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )
            })}
            {/* City dropdown */}
            <select
              value=""
              onChange={e => { if (e.target.value) handleAddCity(e.target.value) }}
              className="px-3 py-2 rounded-full border border-gray-300 bg-white text-sm text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-amber-300 cursor-pointer"
            >
              <option value="">{cityFilters.length > 0 ? 'Add city...' : 'All cities'}</option>
              {filteredCities
                .filter(c => !cityFilters.includes(`${c.city}|${c.state}`))
                .map(c => (
                  <option key={`${c.city}|${c.state}`} value={`${c.city}|${c.state}`}>
                    {c.city}, {c.state}
                  </option>
                ))}
            </select>

            {/* Clear all filters */}
            {(stateFilters.length > 0 || cityFilters.length > 0) && (
              <button
                onClick={clearAllFilters}
                className="text-xs text-amber-600 hover:text-amber-800 font-medium px-2 py-1"
              >
                Clear filters
              </button>
            )}
          </div>
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
        votingDisabled={year < new Date().getFullYear()}
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
              initialPhotoUrl: goldPhotoUrl,
            })
          }
        }}
      />

      {/* Nominations — filtered by states */}
      <NominationsSection
        nominations={filteredNominations}
        isAdmin={isAdmin}
        isLoggedIn={isLoggedIn}
        categorySlug={categorySlug}
        onApproved={() => {
          // Refetch leaderboard so newly approved restaurant appears in standings
          if (mode === 'nearme' && nearMeCoords) {
            fetchLeaderboard({ lat: String(nearMeCoords.lat), lng: String(nearMeCoords.lng), radius: '25' })
          } else if (cityFilters.length > 0) {
            fetchLeaderboard({
              state: stateFilters.join(','),
              city: cityFilters.map(cf => cf.split('|')[0]).join(','),
            })
          } else if (stateFilters.length > 0) {
            fetchLeaderboard({ state: stateFilters.join(',') })
          } else {
            fetchLeaderboard({})
          }
        }}
      />

      {/* Gold medal comment modal */}
      {commentPrompt && (
        <GoldCommentModal
          medalId={commentPrompt.medalId}
          restaurantName={commentPrompt.restaurantName}
          categoryName={categoryName}
          initialComment={commentPrompt.initialComment}
          initialPhotoUrl={commentPrompt.initialPhotoUrl}
          onClose={() => setCommentPrompt(null)}
          onSaved={(commentText, photoUrl) => {
            const isNewComment = !commentPrompt.initialComment
            setCommentPrompt(null)
            setGoldHasComment(true)
            setGoldCommentText(commentText)
            setGoldPhotoUrl(photoUrl ?? null)

            // Optimistic +1 bonus point for new comments
            if (isNewComment && userMedals.gold) {
              setRows(current => {
                const updated = current.map(r => ({ ...r }))
                const row = updated.find(r => r.restaurantId === userMedals.gold)
                if (row) {
                  row.totalScore += 1
                }
                updated.sort((a, b) => b.totalScore - a.totalScore || b.goldCount - a.goldCount)
                return updated
              })
            }
          }}
        />
      )}
    </div>
  )
}
