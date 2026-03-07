'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Search, X, MapPin, Store, Tag, User, Compass, Map, SlidersHorizontal, Loader2 } from 'lucide-react'
import { CategoryIcon } from '@/components/CategoryIcon'
import type { FullSearchResults } from '@/lib/queries'

const STATE_NAMES: Record<string, string> = {
  AL:'Alabama',AK:'Alaska',AZ:'Arizona',AR:'Arkansas',CA:'California',
  CO:'Colorado',CT:'Connecticut',DE:'Delaware',FL:'Florida',GA:'Georgia',
  HI:'Hawaii',ID:'Idaho',IL:'Illinois',IN:'Indiana',IA:'Iowa',KS:'Kansas',
  KY:'Kentucky',LA:'Louisiana',ME:'Maine',MD:'Maryland',MA:'Massachusetts',
  MI:'Michigan',MN:'Minnesota',MS:'Mississippi',MO:'Missouri',MT:'Montana',
  NE:'Nebraska',NV:'Nevada',NH:'New Hampshire',NJ:'New Jersey',NM:'New Mexico',
  NY:'New York',NC:'North Carolina',ND:'North Dakota',OH:'Ohio',OK:'Oklahoma',
  OR:'Oregon',PA:'Pennsylvania',RI:'Rhode Island',SC:'South Carolina',
  SD:'South Dakota',TN:'Tennessee',TX:'Texas',UT:'Utah',VT:'Vermont',
  VA:'Virginia',WA:'Washington',WV:'West Virginia',WI:'Wisconsin',WY:'Wyoming',
  DC:'District of Columbia',
}

type Props = {
  initialQuery: string
  initialResults: FullSearchResults | null
}

export function SearchResults({ initialQuery, initialResults }: Props) {
  const router = useRouter()
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState(initialResults)
  const [loading, setLoading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null)

  // Filters
  const [stateFilter, setStateFilter] = useState<string | null>(null)
  const [cityFilters, setCityFilters] = useState<string[]>([])
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)

  // Sync internal state when props change (e.g. navbar search navigates to new query)
  useEffect(() => {
    setQuery(initialQuery)
    setResults(initialResults)
    setStateFilter(null)
    setCityFilters([])
    setCategoryFilter(null)
  }, [initialQuery, initialResults])

  const activeFilterCount = [stateFilter, categoryFilter].filter(Boolean).length + cityFilters.length

  // Derive available filter options from results
  const availableStates = useCallback(() => {
    if (!results) return []
    const statesFromRestaurants = new Set(results.restaurants.map(r => r.state))
    const statesFromSearch = results.states.map(s => s.stateCode)
    const all = new Set([...statesFromRestaurants, ...statesFromSearch])
    return Array.from(all).sort()
  }, [results])

  const availableCities = useCallback(() => {
    if (!results) return []
    const citiesFromRestaurants = results.restaurants
      .filter(r => !stateFilter || r.state === stateFilter)
      .map(r => `${r.city}|${r.state}`)
    const citiesFromSearch = results.cities
      .filter(c => !stateFilter || c.state === stateFilter)
      .map(c => `${c.city}|${c.state}`)
    const all = new Set([...citiesFromRestaurants, ...citiesFromSearch])
    return Array.from(all).sort().map(key => {
      const [city, state] = key.split('|')
      return { city, state }
    })
  }, [results, stateFilter])

  const availableCategories = useCallback(() => {
    if (!results) return []
    return results.categories
  }, [results])

  // Fetch results from API
  const fetchResults = useCallback(async (q: string, state?: string | null, cities?: string[], category?: string | null) => {
    if (q.trim().length < 2) {
      setResults(null)
      return
    }
    setLoading(true)
    try {
      const params = new URLSearchParams({ q: q.trim(), full: '1' })
      if (state) params.set('state', state)
      if (cities && cities.length > 0) params.set('city', cities.join(','))
      if (category) params.set('category', category)
      const res = await fetch(`/api/search?${params}`)
      if (res.ok) {
        const data = await res.json()
        setResults(data)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  // Debounced query search — clear location filters when query text changes
  function handleQueryChange(value: string) {
    setQuery(value)
    if (timerRef.current) clearTimeout(timerRef.current)
    // Clear all filters when the search text changes so stale location filters
    // don't persist across different search queries
    setStateFilter(null)
    setCityFilters([])
    setCategoryFilter(null)
    timerRef.current = setTimeout(() => {
      fetchResults(value, null, [], null)
    }, 400)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && query.trim().length >= 2) {
      if (timerRef.current) clearTimeout(timerRef.current)
      // Only router.push — the server component will call searchFull() and
      // useEffect will sync the results. No need for a redundant client API call.
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  // Filter changes trigger re-fetch
  function handleStateChange(value: string | null) {
    setStateFilter(value)
    setCityFilters([]) // Reset cities when state changes
    fetchResults(query, value, [], categoryFilter)
  }

  function handleAddCity(city: string) {
    if (!city || cityFilters.includes(city)) return
    const next = [...cityFilters, city]
    setCityFilters(next)
    fetchResults(query, stateFilter, next, categoryFilter)
  }

  function handleRemoveCity(city: string) {
    const next = cityFilters.filter(c => c !== city)
    setCityFilters(next)
    fetchResults(query, stateFilter, next, categoryFilter)
  }

  function handleCategoryChange(slug: string | null) {
    setCategoryFilter(slug)
    fetchResults(query, stateFilter, cityFilters, slug)
  }

  function clearFilters() {
    setStateFilter(null)
    setCityFilters([])
    setCategoryFilter(null)
    fetchResults(query, null, [], null)
  }

  const isEmpty = results && !results.combos.length && !results.categories.length
    && !results.restaurants.length && !results.cities.length
    && !results.states.length && !results.critics.length

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 min-h-[calc(100vh-200px)]">
      {/* Search bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={e => handleQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search restaurants, categories, cities..."
          className="w-full pl-11 pr-10 py-3 text-base rounded-xl border border-amber-200 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200 bg-white text-gray-900 placeholder:text-gray-400 shadow-sm"
          autoFocus
        />
        {loading && (
          <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500 animate-spin" />
        )}
        {!loading && query && (
          <button
            onClick={() => { setQuery(''); setResults(null) }}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter bar */}
      {results && !isEmpty && (
        <div className="mb-6">
          {/* Mobile: toggle button */}
          <div className="sm:hidden mb-2">
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-full border border-gray-300 bg-white text-sm text-gray-700 font-medium"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="bg-amber-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Filter controls (always visible on desktop, toggleable on mobile) */}
          <div className={`${filtersOpen ? 'flex' : 'hidden'} sm:flex flex-wrap items-center gap-2`}>
            {/* State filter */}
            <select
              value={stateFilter ?? ''}
              onChange={e => handleStateChange(e.target.value || null)}
              className="px-3 py-2 rounded-full border border-gray-300 bg-white text-sm text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-amber-300 cursor-pointer"
            >
              <option value="">All states</option>
              {availableStates().map(code => (
                <option key={code} value={code}>{STATE_NAMES[code] || code}</option>
              ))}
            </select>

            {/* City filter — multi-select with chips */}
            <div className="flex flex-wrap items-center gap-1.5">
              {cityFilters.map(city => (
                <span
                  key={city}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-amber-100 text-amber-800 text-sm font-medium"
                >
                  {city}
                  <button
                    onClick={() => handleRemoveCity(city)}
                    className="hover:text-amber-950 transition-colors"
                    aria-label={`Remove ${city}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <select
                value=""
                onChange={e => { if (e.target.value) handleAddCity(e.target.value) }}
                className="px-3 py-2 rounded-full border border-gray-300 bg-white text-sm text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-amber-300 cursor-pointer"
              >
                <option value="">{cityFilters.length > 0 ? 'Add city...' : 'All cities'}</option>
                {availableCities()
                  .filter(c => !cityFilters.includes(c.city))
                  .map(c => (
                    <option key={`${c.city}-${c.state}`} value={c.city}>{c.city}, {c.state}</option>
                  ))}
              </select>
            </div>

            {/* Category filter */}
            {availableCategories().length > 0 && (
              <select
                value={categoryFilter ?? ''}
                onChange={e => handleCategoryChange(e.target.value || null)}
                className="px-3 py-2 rounded-full border border-gray-300 bg-white text-sm text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-amber-300 cursor-pointer"
              >
                <option value="">All categories</option>
                {availableCategories().map(cat => (
                  <option key={cat.slug} value={cat.slug}>{cat.name}</option>
                ))}
              </select>
            )}

            {/* Clear filters */}
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-xs text-amber-600 hover:text-amber-800 font-medium px-2 py-1"
              >
                Clear filters
              </button>
            )}
          </div>

          {/* Summary */}
          <p className="text-sm text-gray-500 mt-3">
            {[
              results.combos.length > 0 && `${results.combos.length} combo${results.combos.length !== 1 ? 's' : ''}`,
              results.categories.length > 0 && `${results.categories.length} ${results.categories.length === 1 ? 'category' : 'categories'}`,
              results.restaurants.length > 0 && `${results.restaurants.length} ${results.restaurants.length === 1 ? 'restaurant' : 'restaurants'}`,
              results.cities.length > 0 && `${results.cities.length} ${results.cities.length === 1 ? 'city' : 'cities'}`,
              results.states.length > 0 && `${results.states.length} ${results.states.length === 1 ? 'state' : 'states'}`,
              results.critics.length > 0 && `${results.critics.length} ${results.critics.length === 1 ? 'critic' : 'critics'}`,
            ].filter(Boolean).join(' · ')}
          </p>
        </div>
      )}

      {/* States */}
      {!query && (
        <p className="text-gray-500 mt-4">Enter a search term to find restaurants, categories, cities, and more.</p>
      )}

      {query && query.trim().length < 2 && (
        <p className="text-gray-500 mt-4">Please enter at least 2 characters to search.</p>
      )}

      {isEmpty && !loading && (
        <div className="text-center py-16">
          <p className="text-gray-400 text-lg">No results found</p>
          <p className="text-gray-400 text-sm mt-1">Try a different search term or remove filters</p>
          {results?.suggestion && (
            <p className="text-sm mt-4">
              Did you mean{' '}
              <button
                onClick={() => {
                  setQuery(results.suggestion!)
                  clearFilters()
                  fetchResults(results.suggestion!, null, [], null)
                  router.push(`/search?q=${encodeURIComponent(results.suggestion!)}`)
                }}
                className="text-amber-600 hover:text-amber-800 font-medium underline underline-offset-2"
              >
                {results.suggestion}
              </button>
              ?
            </p>
          )}
        </div>
      )}

      {results && !isEmpty && (
        <div className="space-y-8">
          {/* Category + Location Combos */}
          {results.combos.length > 0 && (
            <Section icon={<Compass className="w-4 h-4" />} title="Category + Location">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {results.combos.map(c => (
                  <Link
                    key={`${c.categorySlug}-${c.city}-${c.state}`}
                    href={
                      c.city
                        ? `/categories/${c.categorySlug}?city=${encodeURIComponent(c.city)}&state=${encodeURIComponent(c.state)}`
                        : `/categories/${c.categorySlug}?state=${encodeURIComponent(c.state)}`
                    }
                    className="flex items-center gap-3 px-4 py-3 rounded-xl border border-amber-100 bg-white hover:border-amber-300 hover:bg-amber-50/50 transition-colors shadow-sm"
                  >
                    <span className="text-lg flex-shrink-0">
                      <CategoryIcon slug={c.categorySlug} iconEmoji={c.iconEmoji} iconUrl={c.iconUrl} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{c.categoryName}</p>
                      <p className="text-xs text-gray-500">
                        {c.city ? `in ${c.city}, ${c.state}` : `in ${STATE_NAMES[c.state] || c.state}`}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </Section>
          )}

          {/* Categories */}
          {results.categories.length > 0 && (
            <Section icon={<Tag className="w-4 h-4" />} title="Categories">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {results.categories.map(cat => (
                  <Link
                    key={cat.slug}
                    href={`/categories/${cat.slug}`}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl border border-amber-100 bg-white hover:border-amber-300 hover:bg-amber-50/50 transition-colors shadow-sm"
                  >
                    <span className="text-lg flex-shrink-0">
                      <CategoryIcon slug={cat.slug} iconEmoji={cat.iconEmoji} iconUrl={cat.iconUrl} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{cat.name}</p>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">{cat.restaurantCount} restaurants</span>
                  </Link>
                ))}
              </div>
            </Section>
          )}

          {/* Restaurants */}
          {results.restaurants.length > 0 && (
            <Section icon={<Store className="w-4 h-4" />} title="Restaurants">
              <div className="bg-white rounded-xl border border-amber-100 shadow-sm divide-y divide-amber-50">
                {results.restaurants.map(r => (
                  <Link
                    key={r.slug}
                    href={`/restaurants/${r.slug}`}
                    className="flex items-center justify-between px-4 py-3 hover:bg-amber-50/50 transition-colors first:rounded-t-xl last:rounded-b-xl"
                  >
                    <span className="text-sm font-medium text-gray-900 truncate">{r.name}</span>
                    <span className="text-xs text-gray-400 flex-shrink-0 ml-3">{r.city}, {r.state}</span>
                  </Link>
                ))}
              </div>
            </Section>
          )}

          {/* Cities */}
          {results.cities.length > 0 && (
            <Section icon={<MapPin className="w-4 h-4" />} title="Cities">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {results.cities.map(c => (
                  <Link
                    key={`${c.city}-${c.state}`}
                    href={`/categories?city=${encodeURIComponent(c.city)}&state=${encodeURIComponent(c.state)}`}
                    className="flex items-center justify-between px-4 py-3 rounded-xl border border-amber-100 bg-white hover:border-amber-300 hover:bg-amber-50/50 transition-colors shadow-sm"
                  >
                    <span className="text-sm font-medium text-gray-900">{c.city}, {c.state}</span>
                    <span className="text-xs text-gray-400">{c.restaurantCount} restaurants</span>
                  </Link>
                ))}
              </div>
            </Section>
          )}

          {/* States */}
          {results.states.length > 0 && (
            <Section icon={<Map className="w-4 h-4" />} title="States">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {results.states.map(s => (
                  <Link
                    key={s.stateCode}
                    href={`/categories?state=${encodeURIComponent(s.stateCode)}`}
                    className="flex items-center justify-between px-4 py-3 rounded-xl border border-amber-100 bg-white hover:border-amber-300 hover:bg-amber-50/50 transition-colors shadow-sm"
                  >
                    <span className="text-sm font-medium text-gray-900">{s.state}</span>
                    <span className="text-xs text-gray-400">{s.restaurantCount} restaurants</span>
                  </Link>
                ))}
              </div>
            </Section>
          )}

          {/* Critics */}
          {results.critics.length > 0 && (
            <Section icon={<User className="w-4 h-4" />} title="Critics">
              <div className="bg-white rounded-xl border border-amber-100 shadow-sm divide-y divide-amber-50">
                {results.critics.map(u => (
                  <Link
                    key={u.slug}
                    href={`/critics/${u.slug}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-amber-50/50 transition-colors first:rounded-t-xl last:rounded-b-xl"
                  >
                    {u.avatarUrl ? (
                      <Image src={u.avatarUrl} alt="" width={32} height={32} className="rounded-full flex-shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                        {u.displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{u.displayName}</p>
                      {u.city && <p className="text-xs text-gray-400">{u.city}{u.state ? `, ${u.state}` : ''}</p>}
                    </div>
                  </Link>
                ))}
              </div>
            </Section>
          )}
        </div>
      )}
    </div>
  )
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-amber-600">{icon}</span>
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">{title}</h2>
      </div>
      {children}
    </section>
  )
}
