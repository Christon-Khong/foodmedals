'use client'

import { useState, useCallback } from 'react'
import { Search, Loader2, CheckSquare, Square, AlertTriangle, ExternalLink } from 'lucide-react'

/* ---------- Types ---------- */
type DiscoveredRestaurant = {
  placeId: string
  name: string
  address: string
  city: string
  state: string
  zip: string
  lat: number
  lng: number
  websiteUrl?: string
  categorySlugs: string[]
}

type DiscoverStats = {
  categoriesSearched: number
  totalPlacesFound: number
  uniqueRestaurants: number
}

type ImportResult = {
  name: string
  status: 'success' | 'error' | 'duplicate'
  slug?: string
  error?: string
}

type ImportSummary = {
  total: number
  success: number
  duplicates: number
  errors: number
}

/* ---------- US States ---------- */
const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC',
]

/* ---------- Component ---------- */
export function DiscoverForm() {
  // Phase 1: Search inputs
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [resultsPerCategory, setResultsPerCategory] = useState(5)

  // Phase 2: Results
  const [restaurants, setRestaurants] = useState<DiscoveredRestaurant[]>([])
  const [stats, setStats] = useState<DiscoverStats | null>(null)
  const [discoveryErrors, setDiscoveryErrors] = useState<string[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())

  // Phase 3: Import results
  const [importResults, setImportResults] = useState<ImportResult[] | null>(null)
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null)

  // Status
  const [searching, setSearching] = useState(false)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /* ---- Phase 1: Discover ---- */
  const handleDiscover = useCallback(async () => {
    if (!city.trim() || !state) return

    setSearching(true)
    setError(null)
    setRestaurants([])
    setStats(null)
    setDiscoveryErrors([])
    setSelected(new Set())
    setImportResults(null)
    setImportSummary(null)

    try {
      const res = await fetch('/api/admin/restaurants/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city: city.trim(),
          state,
          resultsPerCategory,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Server error ${res.status}`)
      }

      const data = await res.json()
      setRestaurants(data.restaurants ?? [])
      setStats(data.stats ?? null)
      setDiscoveryErrors(data.errors ?? [])

      // Select all by default
      const allIds = new Set<string>((data.restaurants ?? []).map((r: DiscoveredRestaurant) => r.placeId))
      setSelected(allIds)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Discovery failed')
    } finally {
      setSearching(false)
    }
  }, [city, state, resultsPerCategory])

  /* ---- Phase 2: Toggle selection ---- */
  const toggleOne = (placeId: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(placeId)) next.delete(placeId)
      else next.add(placeId)
      return next
    })
  }

  const selectAll = () => setSelected(new Set(restaurants.map(r => r.placeId)))
  const deselectAll = () => setSelected(new Set())

  /* ---- Phase 3: Import ---- */
  const handleImport = useCallback(async () => {
    const toImport = restaurants.filter(r => selected.has(r.placeId))
    if (toImport.length === 0) return

    setImporting(true)
    setError(null)
    setImportResults(null)
    setImportSummary(null)

    try {
      const payload = toImport.map(r => ({
        name: r.name,
        address: r.address,
        city: r.city,
        state: r.state,
        zip: r.zip,
        lat: r.lat,
        lng: r.lng,
        websiteUrl: r.websiteUrl,
        categorySlugs: r.categorySlugs,
      }))

      const res = await fetch('/api/admin/restaurants/discover/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurants: payload }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Import failed ${res.status}`)
      }

      const data = await res.json()
      setImportResults(data.results ?? [])
      setImportSummary(data.summary ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setImporting(false)
    }
  }, [restaurants, selected])

  /* ---- Render ---- */
  const hasResults = restaurants.length > 0
  const hasImportResults = importResults !== null

  return (
    <div className="space-y-6">
      {/* ═══════ Phase 1: Search Form ═══════ */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-white">Search Google Places</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* City */}
          <div className="sm:col-span-1">
            <label className="block text-xs text-gray-500 mb-1">City</label>
            <input
              type="text"
              value={city}
              onChange={e => setCity(e.target.value)}
              placeholder="e.g. Salt Lake City"
              disabled={searching}
              className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 placeholder:text-gray-600 disabled:opacity-50"
            />
          </div>

          {/* State */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">State</label>
            <select
              value={state}
              onChange={e => setState(e.target.value)}
              disabled={searching}
              className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 disabled:opacity-50"
            >
              <option value="">Select…</option>
              {US_STATES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Results per category */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Results per category</label>
            <select
              value={resultsPerCategory}
              onChange={e => setResultsPerCategory(Number(e.target.value))}
              disabled={searching}
              className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 disabled:opacity-50"
            >
              {[3, 5, 7, 10].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDiscover}
          disabled={searching || !city.trim() || !state}
          className="flex items-center justify-center gap-2 w-full bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 font-semibold py-3 rounded-xl transition-colors text-sm"
        >
          {searching ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Searching all categories…
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              Discover Restaurants
            </>
          )}
        </button>

        {searching && (
          <p className="text-xs text-gray-500 text-center">
            This may take 30–60 seconds while we search across all food categories.
          </p>
        )}
      </div>

      {/* ═══════ Error ═══════ */}
      {error && (
        <div className="bg-red-500/15 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {/* ═══════ Phase 2: Results Table ═══════ */}
      {hasResults && !hasImportResults && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
          {/* Stats bar */}
          {stats && (
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="bg-gray-800 border border-gray-700/50 rounded-lg px-3 py-1.5 text-gray-300">
                <strong className="text-white">{stats.categoriesSearched}</strong> categories searched
              </span>
              <span className="bg-gray-800 border border-gray-700/50 rounded-lg px-3 py-1.5 text-gray-300">
                <strong className="text-white">{stats.totalPlacesFound}</strong> total results
              </span>
              <span className="bg-yellow-500/15 border border-yellow-500/30 rounded-lg px-3 py-1.5 text-yellow-300">
                <strong className="text-white">{stats.uniqueRestaurants}</strong> unique restaurants
              </span>
              <span className="bg-green-500/15 border border-green-500/30 rounded-lg px-3 py-1.5 text-green-400">
                <strong className="text-white">{selected.size}</strong> selected
              </span>
            </div>
          )}

          {/* Discovery errors */}
          {discoveryErrors.length > 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3 space-y-1">
              <p className="text-xs font-medium text-yellow-400">
                Some categories had errors ({discoveryErrors.length}):
              </p>
              <ul className="text-xs text-yellow-300/70 space-y-0.5 max-h-24 overflow-y-auto">
                {discoveryErrors.map((e, i) => (
                  <li key={i}>• {e}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Select controls */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={selectAll}
              className="text-xs text-gray-400 hover:text-yellow-300 transition-colors"
            >
              Select All
            </button>
            <span className="text-gray-700">|</span>
            <button
              type="button"
              onClick={deselectAll}
              className="text-xs text-gray-400 hover:text-yellow-300 transition-colors"
            >
              Deselect All
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-800">
                  <th className="pb-2 pr-2 w-8"></th>
                  <th className="pb-2 pr-3">Restaurant</th>
                  <th className="pb-2 pr-3">Address</th>
                  <th className="pb-2 pr-3">Categories</th>
                  <th className="pb-2 w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {restaurants.map(r => {
                  const isSelected = selected.has(r.placeId)
                  return (
                    <tr
                      key={r.placeId}
                      onClick={() => toggleOne(r.placeId)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-yellow-500/5 hover:bg-yellow-500/10'
                          : 'hover:bg-gray-800/30'
                      }`}
                    >
                      <td className="py-2.5 pr-2">
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-yellow-400" />
                        ) : (
                          <Square className="w-4 h-4 text-gray-600" />
                        )}
                      </td>
                      <td className="py-2.5 pr-3">
                        <span className="text-gray-100 font-medium">{r.name}</span>
                      </td>
                      <td className="py-2.5 pr-3 text-gray-400 text-xs">
                        {r.address}, {r.city}, {r.state} {r.zip}
                      </td>
                      <td className="py-2.5 pr-3">
                        <div className="flex flex-wrap gap-1">
                          {r.categorySlugs.map(slug => (
                            <span
                              key={slug}
                              className="inline-block text-[10px] px-1.5 py-0.5 bg-gray-800 border border-gray-700/50 rounded text-gray-400 font-mono"
                            >
                              {slug}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-2.5">
                        {r.websiteUrl && (
                          <a
                            href={r.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="text-gray-600 hover:text-yellow-400 transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Import button */}
          <button
            type="button"
            onClick={handleImport}
            disabled={importing || selected.size === 0}
            className="flex items-center justify-center gap-2 w-full bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 font-semibold py-3 rounded-xl transition-colors text-sm"
          >
            {importing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Importing {selected.size} restaurants…
              </>
            ) : (
              <>Import {selected.size} Selected Restaurants</>
            )}
          </button>
        </div>
      )}

      {/* ═══════ Phase 3: Import Results ═══════ */}
      {hasImportResults && importSummary && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-white">Import Results</h2>

          {/* Summary badges */}
          <div className="flex flex-wrap gap-3 text-xs">
            <span className="bg-gray-800 border border-gray-700/50 rounded-lg px-3 py-1.5 text-gray-300">
              <strong className="text-white">{importSummary.total}</strong> total
            </span>
            {importSummary.success > 0 && (
              <span className="bg-green-500/15 border border-green-500/30 rounded-lg px-3 py-1.5 text-green-400">
                <strong className="text-white">{importSummary.success}</strong> imported
              </span>
            )}
            {importSummary.duplicates > 0 && (
              <span className="bg-yellow-500/15 border border-yellow-500/30 rounded-lg px-3 py-1.5 text-yellow-300">
                <strong className="text-white">{importSummary.duplicates}</strong> duplicates
              </span>
            )}
            {importSummary.errors > 0 && (
              <span className="bg-red-500/15 border border-red-500/30 rounded-lg px-3 py-1.5 text-red-400">
                <strong className="text-white">{importSummary.errors}</strong> errors
              </span>
            )}
          </div>

          {/* Results table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-800">
                  <th className="pb-2 pr-3">Restaurant</th>
                  <th className="pb-2 pr-3">Status</th>
                  <th className="pb-2">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {importResults.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-800/30">
                    <td className="py-2 pr-3 text-gray-200">{r.name}</td>
                    <td className="py-2 pr-3">
                      {r.status === 'success' && (
                        <span className="inline-block text-[11px] px-2 py-0.5 bg-green-500/15 text-green-400 border border-green-500/30 rounded-full font-medium">
                          Imported
                        </span>
                      )}
                      {r.status === 'duplicate' && (
                        <span className="inline-block text-[11px] px-2 py-0.5 bg-yellow-500/15 text-yellow-300 border border-yellow-500/30 rounded-full font-medium">
                          Duplicate
                        </span>
                      )}
                      {r.status === 'error' && (
                        <span className="inline-block text-[11px] px-2 py-0.5 bg-red-500/15 text-red-400 border border-red-500/30 rounded-full font-medium">
                          Error
                        </span>
                      )}
                    </td>
                    <td className="py-2 text-xs text-gray-500">
                      {r.status === 'success' && r.slug && (
                        <code className="bg-gray-800 px-1.5 py-0.5 rounded text-yellow-300/70 font-mono text-[10px]">
                          /{r.slug}
                        </code>
                      )}
                      {r.error && <span className="text-red-400/70">{r.error}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Search again button */}
          <button
            type="button"
            onClick={() => {
              setRestaurants([])
              setStats(null)
              setDiscoveryErrors([])
              setSelected(new Set())
              setImportResults(null)
              setImportSummary(null)
              setError(null)
            }}
            className="text-sm text-gray-400 hover:text-yellow-300 transition-colors"
          >
            ← Search another city
          </button>
        </div>
      )}
    </div>
  )
}
