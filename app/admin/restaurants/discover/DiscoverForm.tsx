'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Search, Loader2, CheckSquare, Square, AlertTriangle, ExternalLink, Trash2, FolderOpen, Clock } from 'lucide-react'
import { SearchQueue } from './SearchQueue'

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

type QuotaInfo = {
  used: number
  limit: number
  remaining: number
  costToday: number
  percentUsed: number
  verificationReserve?: number
}

type ProgressEntry = {
  category: string
  index: number
  total: number
  found: number
  uniqueSoFar: number
  error?: string
}

type SavedBatch = {
  id: string
  city: string
  state: string
  resultsPerCategory: number
  totalResults: number
  uniqueRestaurants: number
  categoriesSearched: number
  status: string
  createdAt: string
}

/* ---------- US States ---------- */
const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC',
]

const COST_PER_CALL = 0.032

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

/* ---------- Component ---------- */
export function DiscoverForm() {
  // Phase 1: Search inputs
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [resultsPerCategory, setResultsPerCategory] = useState(5)

  // Phase 2: Results (can come from fresh search or loaded batch)
  const [restaurants, setRestaurants] = useState<DiscoveredRestaurant[]>([])
  const [stats, setStats] = useState<DiscoverStats | null>(null)
  const [discoveryErrors, setDiscoveryErrors] = useState<string[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [activeBatchId, setActiveBatchId] = useState<string | null>(null)

  // Phase 3: Import results
  const [importResults, setImportResults] = useState<ImportResult[] | null>(null)
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null)

  // Quota
  const [quota, setQuota] = useState<QuotaInfo | null>(null)

  // Search progress (streaming)
  const [progress, setProgress] = useState<ProgressEntry[]>([])
  const [searchProgress, setSearchProgress] = useState<{ index: number; total: number } | null>(null)
  const [searchComplete, setSearchComplete] = useState(false)
  const logRef = useRef<HTMLDivElement>(null)

  // Saved batches queue
  const [batches, setBatches] = useState<SavedBatch[]>([])
  const [loadingBatchId, setLoadingBatchId] = useState<string | null>(null)
  const [deletingBatchId, setDeletingBatchId] = useState<string | null>(null)

  // Status
  const [searching, setSearching] = useState(false)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /* ---- Fetch quota on mount ---- */
  const fetchQuota = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/restaurants/discover/quota')
      if (res.ok) {
        const data = await res.json()
        setQuota(data)
      }
    } catch {
      // silently fail — quota display is informational
    }
  }, [])

  /* ---- Fetch saved batches ---- */
  const fetchBatches = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/restaurants/discover/batches')
      if (res.ok) {
        const data = await res.json()
        setBatches(data.batches ?? [])
      }
    } catch {
      // silently fail
    }
  }, [])

  useEffect(() => {
    fetchQuota()
    fetchBatches()
  }, [fetchQuota, fetchBatches])

  // Auto-scroll progress log
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [progress])

  /* ---- Reset to search view ---- */
  const resetView = useCallback(() => {
    setRestaurants([])
    setStats(null)
    setDiscoveryErrors([])
    setSelected(new Set())
    setImportResults(null)
    setImportSummary(null)
    setError(null)
    setProgress([])
    setSearchProgress(null)
    setSearchComplete(false)
    setActiveBatchId(null)
    fetchQuota()
    fetchBatches()
  }, [fetchQuota, fetchBatches])

  /* ---- Load a saved batch ---- */
  const loadBatch = useCallback(async (batchId: string) => {
    setLoadingBatchId(batchId)
    setError(null)

    try {
      const res = await fetch(`/api/admin/restaurants/discover/batches/${batchId}`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to load batch')
      }

      const { batch } = await res.json()
      const batchRestaurants = batch.restaurants as DiscoveredRestaurant[]

      setRestaurants(batchRestaurants)
      setStats({
        categoriesSearched: batch.categoriesSearched,
        totalPlacesFound: batch.totalResults,
        uniqueRestaurants: batch.uniqueRestaurants,
      })
      setDiscoveryErrors([])
      setSelected(new Set(batchRestaurants.map((r: DiscoveredRestaurant) => r.placeId)))
      setActiveBatchId(batchId)
      setImportResults(null)
      setImportSummary(null)
      setProgress([])
      setSearchComplete(false)
      setCity(batch.city)
      setState(batch.state)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load batch')
    } finally {
      setLoadingBatchId(null)
    }
  }, [])

  /* ---- Delete a saved batch ---- */
  const deleteBatch = useCallback(async (batchId: string) => {
    setDeletingBatchId(batchId)
    try {
      await fetch(`/api/admin/restaurants/discover/batches/${batchId}`, { method: 'DELETE' })
      setBatches(prev => prev.filter(b => b.id !== batchId))
      // If this was the active batch, reset
      if (activeBatchId === batchId) {
        resetView()
      }
    } catch {
      setError('Failed to delete batch')
    } finally {
      setDeletingBatchId(null)
    }
  }, [activeBatchId, resetView])

  /* ---- Phase 1: Discover (streaming) ---- */
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
    setProgress([])
    setSearchProgress(null)
    setSearchComplete(false)
    setActiveBatchId(null)

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

      // Handle non-streaming error responses (429, 400, etc.)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        if (data.quota) {
          setQuota(prev => prev ? { ...prev, ...data.quota } : null)
        }
        throw new Error(data.error || `Server error ${res.status}`)
      }

      // Read the streaming response line by line
      const reader = res.body?.getReader()
      if (!reader) throw new Error('No response stream')

      const decoder = new TextDecoder()
      let buffer = ''

      // Helper to process complete NDJSON lines from buffer
      function processLine(line: string) {
        if (!line.trim()) return
        try {
          const event = JSON.parse(line)

          if (event.type === 'progress') {
            setProgress(prev => [...prev, event as ProgressEntry])
            setSearchProgress({ index: event.index, total: event.total })
          }

          if (event.type === 'complete') {
            setRestaurants(event.restaurants ?? [])
            setStats(event.stats ?? null)
            setDiscoveryErrors(event.errors ?? [])
            setSearchComplete(true)

            // Track the saved batch
            if (event.batchId) {
              setActiveBatchId(event.batchId)
              // Refresh batches list
              fetchBatches()
            }

            // Update quota
            if (event.quota) {
              setQuota({
                used: event.quota.used,
                limit: event.quota.limit,
                remaining: event.quota.remaining,
                costToday: event.quota.costToday,
                percentUsed: event.quota.limit > 0
                  ? Math.min(Math.round((event.quota.used / event.quota.limit) * 100), 100)
                  : 0,
              })
            }

            // Select all by default
            const allIds = new Set<string>(
              (event.restaurants ?? []).map((r: DiscoveredRestaurant) => r.placeId),
            )
            setSelected(allIds)
          }
        } catch {
          // skip unparseable lines
        }
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // Process complete lines
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? '' // Keep incomplete last line in buffer

        for (const line of lines) {
          processLine(line)
        }
      }

      // Process any remaining data left in the buffer after stream closes
      if (buffer.trim()) {
        processLine(buffer)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Discovery failed')
    } finally {
      setSearching(false)
      setSearchProgress(null)
    }
  }, [city, state, resultsPerCategory, fetchBatches])

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

      // Mark batch as imported
      if (activeBatchId) {
        const allImported = selected.size === restaurants.length
        await fetch(`/api/admin/restaurants/discover/batches/${activeBatchId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: allImported ? 'imported' : 'partial' }),
        }).catch(() => {})
        fetchBatches()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setImporting(false)
    }
  }, [restaurants, selected, activeBatchId, fetchBatches])

  /* ---- Render helpers ---- */
  const hasResults = restaurants.length > 0
  const hasImportResults = importResults !== null
  const quotaExhausted = quota ? quota.remaining <= 0 : false

  // Quota bar color
  const barColor = quota && quota.percentUsed > 80 ? 'bg-red-500' : 'bg-yellow-500'
  const barBorderColor = quota && quota.percentUsed > 80 ? 'border-red-500/30' : 'border-yellow-500/30'

  // Search progress percentage
  const searchPercent = searchProgress
    ? Math.round((searchProgress.index / searchProgress.total) * 100)
    : 0

  // Pending batches (not yet imported)
  const pendingBatches = batches.filter(b => b.status === 'pending' || b.status === 'partial')

  return (
    <div className="space-y-6">
      {/* ═══════ API Usage Card ═══════ */}
      {quota && (
        <div className={`bg-gray-900 border ${quotaExhausted ? 'border-red-500/40' : 'border-gray-800'} rounded-2xl p-5 space-y-3`}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">API Usage Today</h2>
            <span className="text-xs text-gray-500">
              ~${(quota.limit * COST_PER_CALL).toFixed(2)}/day budget
            </span>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className={`h-2.5 bg-gray-800 rounded-full overflow-hidden border ${barBorderColor}`}>
              <div
                className={`h-full ${barColor} rounded-full transition-all duration-500`}
                style={{ width: `${Math.min(quota.percentUsed, 100)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <span className="text-gray-300">
                  <strong className="text-white">{quota.used}</strong> / {quota.limit} calls
                </span>
                <span className="text-gray-600">|</span>
                <span className={quota.remaining <= 0 ? 'text-red-400 font-medium' : 'text-gray-400'}>
                  {quota.remaining} remaining
                </span>
              </div>
              <span className="text-gray-400">
                ${quota.costToday.toFixed(2)} spent today
              </span>
            </div>

            {/* Verification reserve info */}
            {(quota.verificationReserve ?? 0) > 0 && (
              <div className="flex items-center justify-between text-[11px] text-gray-500 pt-0.5">
                <span>
                  {quota.verificationReserve} reserved for address verification
                </span>
                <span>
                  {Math.max(0, quota.limit - quota.used - (quota.verificationReserve ?? 0))} available for discovery
                </span>
              </div>
            )}
          </div>

          {quotaExhausted && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-xs text-red-400">
              Daily limit reached. Quota resets at midnight UTC.
            </div>
          )}
        </div>
      )}

      {/* ═══════ Search Queue ═══════ */}
      <SearchQueue onQueueProcessed={() => { fetchQuota(); fetchBatches(); }} />

      {/* ═══════ Pending Batches Queue ═══════ */}
      {pendingBatches.length > 0 && !hasResults && (
        <div className="bg-gray-900 border border-yellow-500/20 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-400" />
              Pending Discoveries ({pendingBatches.length})
            </h2>
            <span className="text-xs text-gray-500">Click to review &amp; import</span>
          </div>

          <div className="space-y-2">
            {pendingBatches.map(batch => (
              <div
                key={batch.id}
                className="flex items-center justify-between bg-gray-800/60 border border-gray-700/50 rounded-xl px-4 py-3 group hover:border-yellow-500/30 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => loadBatch(batch.id)}
                    disabled={loadingBatchId === batch.id}
                    className="flex items-center gap-2 text-sm text-gray-200 hover:text-yellow-300 transition-colors font-medium truncate disabled:opacity-50"
                  >
                    {loadingBatchId === batch.id ? (
                      <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                    ) : (
                      <FolderOpen className="w-4 h-4 shrink-0 text-yellow-400/70" />
                    )}
                    {batch.city}, {batch.state}
                  </button>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{batch.uniqueRestaurants} restaurants</span>
                    <span className="text-gray-700">·</span>
                    <span>{timeAgo(batch.createdAt)}</span>
                    {batch.status === 'partial' && (
                      <>
                        <span className="text-gray-700">·</span>
                        <span className="text-yellow-400/70">partially imported</span>
                      </>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteBatch(batch.id)
                  }}
                  disabled={deletingBatchId === batch.id}
                  className="text-gray-600 hover:text-red-400 transition-colors p-1 opacity-0 group-hover:opacity-100 disabled:opacity-50"
                  title="Delete batch"
                >
                  {deletingBatchId === batch.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

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
          disabled={searching || !city.trim() || !state || quotaExhausted}
          className="flex items-center justify-center gap-2 w-full bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 font-semibold py-3 rounded-xl transition-colors text-sm"
        >
          {searching ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Searching…
            </>
          ) : quotaExhausted ? (
            <>Daily quota reached</>
          ) : (
            <>
              <Search className="w-4 h-4" />
              Discover Restaurants
            </>
          )}
        </button>
      </div>

      {/* ═══════ Search Progress ═══════ */}
      {(searching || searchComplete) && progress.length > 0 && (
        <div className={`bg-gray-900 border ${searchComplete ? 'border-green-500/30' : 'border-gray-800'} rounded-2xl p-5 space-y-3`}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">
              {searchComplete ? '✓ Search Complete' : 'Searching categories…'}
            </h2>
            <span className="text-xs text-gray-400 font-mono">
              {searchComplete
                ? `${progress.length}/${progress.length} done`
                : searchProgress
                  ? `${searchProgress.index}/${searchProgress.total} (${searchPercent}%)`
                  : ''}
            </span>
          </div>

          {/* Search progress bar */}
          <div className={`h-2 bg-gray-800 rounded-full overflow-hidden border ${searchComplete ? 'border-green-500/30' : 'border-yellow-500/30'}`}>
            <div
              className={`h-full ${searchComplete ? 'bg-green-500' : 'bg-yellow-500'} rounded-full transition-all duration-300`}
              style={{ width: searchComplete ? '100%' : `${searchPercent}%` }}
            />
          </div>

          {/* Completion summary */}
          {searchComplete && stats && (
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="bg-green-500/15 border border-green-500/30 rounded-lg px-2.5 py-1 text-green-400">
                {stats.uniqueRestaurants} unique restaurants found
              </span>
              <span className="bg-gray-800 border border-gray-700/50 rounded-lg px-2.5 py-1 text-gray-400">
                {stats.totalPlacesFound} total results across {stats.categoriesSearched} categories
              </span>
              {activeBatchId && (
                <span className="bg-blue-500/15 border border-blue-500/30 rounded-lg px-2.5 py-1 text-blue-400">
                  Saved — you can leave and come back later
                </span>
              )}
            </div>
          )}

          {/* Live log */}
          <details open={!searchComplete} className="group">
            <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-300 transition-colors select-none">
              {searchComplete ? 'Show search log' : 'Search log'}
            </summary>
            <div
              ref={logRef}
              className="mt-2 bg-gray-800/60 border border-gray-700/50 rounded-xl p-3 max-h-48 overflow-y-auto font-mono text-[11px] leading-relaxed space-y-0.5"
            >
              {progress.map((p, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-gray-600 w-8 text-right shrink-0">{p.index}</span>
                  {p.error ? (
                    <>
                      <span className="text-red-400">✗</span>
                      <span className="text-red-400/70">{p.category}</span>
                      <span className="text-red-500/50 text-[10px]">error</span>
                    </>
                  ) : (
                    <>
                      <span className="text-green-400">✓</span>
                      <span className="text-gray-300">{p.category}</span>
                      <span className="text-gray-600">—</span>
                      <span className="text-yellow-400/70">{p.found} found</span>
                      <span className="text-gray-600 ml-auto">{p.uniqueSoFar} unique</span>
                    </>
                  )}
                </div>
              ))}
              {searching && progress.length > 0 && (
                <div className="flex items-center gap-2 text-gray-500">
                  <span className="w-8" />
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Searching next category…</span>
                </div>
              )}
            </div>
          </details>
        </div>
      )}

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
          {/* Header with city name when viewing a loaded batch */}
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">
              {activeBatchId && !searchComplete ? `${city}, ${state} — Review & Import` : 'Discovered Restaurants'}
            </h2>
          </div>

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

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleImport}
              disabled={importing || selected.size === 0}
              className="flex items-center justify-center gap-2 flex-1 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 font-semibold py-3 rounded-xl transition-colors text-sm"
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
            <button
              type="button"
              onClick={resetView}
              className="px-4 py-3 bg-gray-800 border border-gray-700 hover:border-gray-600 text-gray-400 hover:text-white rounded-xl transition-colors text-sm"
            >
              Back
            </button>
          </div>
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

          {/* Back to queue */}
          <button
            type="button"
            onClick={resetView}
            className="text-sm text-gray-400 hover:text-yellow-300 transition-colors"
          >
            ← Back to Discover
          </button>
        </div>
      )}
    </div>
  )
}
