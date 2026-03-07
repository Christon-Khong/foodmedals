'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Loader2, CheckSquare, Square, AlertTriangle, ExternalLink, Trash2, FolderOpen, Clock, Settings, Save, Check, Rocket } from 'lucide-react'
import { SearchQueue } from './SearchQueue'
import { CityGaps } from './CityGaps'

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
  rating?: number
  reviewCount?: number
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
  geocodeUsed: number
  geocodeLimit: number
  geocodeRemaining: number
  geocodeCostToday: number
  totalCostToday: number
  verificationReserve: number
  verificationIntervalDays: number
  activeRestaurantCount: number
  minRating: number
  minReviews: number
}

type ProgressEntry = {
  category: string
  index: number
  total: number
  found: number
  qualityFiltered?: number
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

type CategoryOption = {
  slug: string
  name: string
  iconEmoji: string
}

/* ---------- Component ---------- */
export function DiscoverForm() {
  // Phase 1: Search inputs
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [resultsPerCategory, setResultsPerCategory] = useState(5)
  const [categorySlug, setCategorySlug] = useState<string>('') // '' = all categories
  const [categories, setCategories] = useState<CategoryOption[]>([])

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

  // Settings panel
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsReserve, setSettingsReserve] = useState<number>(40)
  const [settingsInterval, setSettingsInterval] = useState<number>(30)
  const [settingsMinRating, setSettingsMinRating] = useState<number>(4.5)
  const [settingsMinReviews, setSettingsMinReviews] = useState<number>(100)
  const [settingsCronHour, setSettingsCronHour] = useState<number>(0)
  const [settingsCronMinute, setSettingsCronMinute] = useState<number>(5)
  const [savingSettings, setSavingSettings] = useState(false)
  const [settingsSaved, setSettingsSaved] = useState(false)
  const [deploying, setDeploying] = useState(false)
  const [deployStatus, setDeployStatus] = useState<string | null>(null)

  // Search progress (streaming)
  const [progress, setProgress] = useState<ProgressEntry[]>([])
  const [searchProgress, setSearchProgress] = useState<{ index: number; total: number } | null>(null)
  const [searchComplete, setSearchComplete] = useState(false)
  const logRef = useRef<HTMLDivElement>(null)

  // Saved batches queue
  const [batches, setBatches] = useState<SavedBatch[]>([])
  const [loadingBatchId, setLoadingBatchId] = useState<string | null>(null)
  const [deletingBatchId, setDeletingBatchId] = useState<string | null>(null)

  // Queue refresh trigger (incremented to signal SearchQueue to refetch)
  const [queueRefreshKey, setQueueRefreshKey] = useState(0)

  // Status
  const [searching, setSearching] = useState(false)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /* ---- Fetch quota ---- */
  const settingsInitialized = useRef(false)
  const fetchQuota = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/restaurants/discover/quota')
      if (res.ok) {
        const data = await res.json()
        setQuota(data)
        // Only sync settings fields on first load (not on 30s poll,
        // which would overwrite the user's in-progress edits)
        if (!settingsInitialized.current) {
          settingsInitialized.current = true
          setSettingsReserve(data.verificationReserve ?? 40)
          setSettingsInterval(data.verificationIntervalDays ?? 30)
          setSettingsMinRating(data.minRating ?? 4.5)
          setSettingsMinReviews(data.minReviews ?? 100)
          setSettingsCronHour(data.cronHourUtc ?? 0)
          setSettingsCronMinute(data.cronMinuteUtc ?? 5)
        }
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

  /* ---- Fetch categories ---- */
  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories/list')
      if (res.ok) {
        const data = await res.json()
        setCategories(data ?? [])
      }
    } catch {
      // silently fail
    }
  }, [])

  useEffect(() => {
    fetchQuota()
    fetchBatches()
    fetchCategories()
  }, [fetchQuota, fetchBatches, fetchCategories])

  // Auto-refresh quota every 30s
  useEffect(() => {
    const interval = setInterval(fetchQuota, 30_000)
    return () => clearInterval(interval)
  }, [fetchQuota])

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

  /* ---- Save settings ---- */
  const handleSaveSettings = useCallback(async () => {
    setSavingSettings(true)
    setSettingsSaved(false)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiVerificationReserve: settingsReserve,
          verificationIntervalDays: settingsInterval,
          discoverMinRating: settingsMinRating,
          discoverMinReviews: settingsMinReviews,
          cronHourUtc: settingsCronHour,
          cronMinuteUtc: settingsCronMinute,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to save settings')
      }
      setSettingsSaved(true)
      // Allow next fetchQuota to re-sync settings fields from the server
      settingsInitialized.current = false
      fetchQuota()
      setTimeout(() => setSettingsSaved(false), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setSavingSettings(false)
    }
  }, [settingsReserve, settingsInterval, settingsMinRating, settingsMinReviews, settingsCronHour, settingsCronMinute, fetchQuota])

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
  const handleDiscover = useCallback(async (overrides?: { city: string; state: string; resultsPerCategory: number }) => {
    const searchCity = overrides?.city ?? city
    const searchState = overrides?.state ?? state
    const searchRpc = overrides?.resultsPerCategory ?? resultsPerCategory
    const searchCatSlug = overrides ? null : (categorySlug || null)

    if (!searchCity.trim() || !searchState) return

    // Sync UI fields when triggered with overrides
    if (overrides) {
      setCity(overrides.city)
      setState(overrides.state)
      setResultsPerCategory(overrides.resultsPerCategory)
      setCategorySlug('')
    }

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
          city: searchCity.trim(),
          state: searchState,
          resultsPerCategory: searchRpc,
          categorySlug: searchCatSlug,
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

            // Update quota (preserve settings fields)
            if (event.quota) {
              setQuota(prev => ({
                ...(prev ?? { verificationReserve: 40, verificationIntervalDays: 30, activeRestaurantCount: 0, minRating: 4.5, minReviews: 100, geocodeUsed: 0, geocodeLimit: 0, geocodeRemaining: 0, geocodeCostToday: 0, totalCostToday: 0 }),
                used: event.quota.used,
                limit: event.quota.limit,
                remaining: event.quota.remaining,
                costToday: event.quota.costToday,
                geocodeUsed: event.quota.geocodeUsed ?? prev?.geocodeUsed ?? 0,
                geocodeLimit: event.quota.geocodeLimit ?? prev?.geocodeLimit ?? 0,
                geocodeRemaining: event.quota.geocodeRemaining ?? prev?.geocodeRemaining ?? 0,
                geocodeCostToday: event.quota.geocodeCostToday ?? prev?.geocodeCostToday ?? 0,
                totalCostToday: event.quota.totalCostToday ?? prev?.totalCostToday ?? 0,
                percentUsed: event.quota.limit > 0
                  ? Math.min(Math.round((event.quota.used / event.quota.limit) * 100), 100)
                  : 0,
              }))
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
  }, [city, state, resultsPerCategory, categorySlug, fetchBatches])

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
        placeId: r.placeId,
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
          </div>

          {/* Text Search API */}
          <div className="space-y-2">
            <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Text Search · 5k free/mo</div>
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
            </div>
          </div>

          {/* Geocoding API */}
          {(() => {
            const geoUsed = quota.geocodeUsed ?? 0
            const geoLimit = quota.geocodeLimit ?? 0
            const geoRemaining = quota.geocodeRemaining ?? 0
            const usedPercent = geoLimit > 0 ? Math.min((geoUsed / geoLimit) * 100, 100) : 0
            const reservePercent = geoLimit > 0 ? Math.min((settingsReserve / geoLimit) * 100, 100 - usedPercent) : 0
            const geoBarColor = usedPercent > 80 ? 'bg-red-500' : 'bg-blue-500'
            const geoBarBorder = usedPercent > 80 ? 'border-red-500/30' : 'border-blue-500/30'
            const freeForOther = Math.max(0, geoRemaining - settingsReserve)
            return (
              <div className="space-y-2">
                <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Geocoding · 10k free/mo</div>
                <div className={`h-2.5 bg-gray-800 rounded-full overflow-hidden border ${geoBarBorder} flex`}>
                  {/* Used segment */}
                  <div
                    className={`h-full ${geoBarColor} transition-all duration-500`}
                    style={{ width: `${usedPercent}%` }}
                  />
                  {/* Reserved segment */}
                  {settingsReserve > 0 && reservePercent > 0 && (
                    <div
                      className="h-full bg-amber-500/60 transition-all duration-500"
                      style={{ width: `${reservePercent}%` }}
                    />
                  )}
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-300">
                      <strong className="text-white">{geoUsed}</strong> / {geoLimit} calls
                    </span>
                    <span className="text-gray-600">|</span>
                    <span className={geoRemaining <= 0 ? 'text-red-400 font-medium' : 'text-gray-400'}>
                      {geoRemaining} remaining
                    </span>
                  </div>
                </div>
                {/* Legend for reserved segment */}
                {settingsReserve > 0 && (
                  <div className="flex items-center justify-between text-[11px] text-gray-500 pt-0.5">
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block w-2.5 h-2.5 rounded-sm bg-amber-500/60" />
                      {settingsReserve} reserved for verification
                    </span>
                    <span>
                      {freeForOther} available for other use
                    </span>
                  </div>
                )}
              </div>
            )
          })()}

          {/* Quality filter info */}
          <div className="space-y-2">
            <div className="text-[11px] text-gray-500 pt-0.5">
              Quality filter: ≥{quota.minRating}★ and ≥{quota.minReviews} reviews
            </div>
          </div>

          {/* Collapsible settings panel */}
          <details
            open={settingsOpen}
            onToggle={e => setSettingsOpen((e.target as HTMLDetailsElement).open)}
          >
            <summary className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer hover:text-gray-300 transition-colors select-none">
              <Settings className="w-3.5 h-3.5" />
              Settings
            </summary>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-3">
              {/* Daily API Limit (computed) */}
              <div>
                <label className="block text-[11px] text-gray-500 mb-1">Daily limit (auto)</label>
                <div className="w-full bg-gray-800/50 border border-gray-700/50 text-gray-400 rounded-lg px-2.5 py-1.5 text-sm font-mono">
                  {quota?.limit ?? '—'}
                </div>
                <p className="text-[10px] text-gray-600 mt-0.5">5k free ÷ days in month</p>
              </div>

              {/* Verification Reserve */}
              <div>
                <label className="block text-[11px] text-gray-500 mb-1">Verify calls/day</label>
                <input
                  type="number"
                  min={0}
                  max={1000}
                  value={settingsReserve}
                  onChange={e => setSettingsReserve(Number(e.target.value))}
                  className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 font-mono"
                />
              </div>

              {/* Verification Interval */}
              <div>
                <label className="block text-[11px] text-gray-500 mb-1">Verify interval (days)</label>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={settingsInterval}
                  onChange={e => setSettingsInterval(Number(e.target.value))}
                  className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 font-mono"
                />
              </div>

              {/* Min Rating */}
              <div>
                <label className="block text-[11px] text-gray-500 mb-1">Min rating (★)</label>
                <input
                  type="number"
                  min={0}
                  max={5}
                  step={0.1}
                  value={settingsMinRating}
                  onChange={e => setSettingsMinRating(Number(e.target.value))}
                  className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 font-mono"
                />
              </div>

              {/* Min Reviews */}
              <div>
                <label className="block text-[11px] text-gray-500 mb-1">Min reviews</label>
                <input
                  type="number"
                  min={0}
                  max={10000}
                  value={settingsMinReviews}
                  onChange={e => setSettingsMinReviews(Number(e.target.value))}
                  className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 font-mono"
                />
              </div>
            </div>

            {/* Cron schedule */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
              <div>
                <label className="block text-[11px] text-gray-500 mb-1">Queue runs at (UTC)</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    max={23}
                    value={settingsCronHour}
                    onChange={e => setSettingsCronHour(Number(e.target.value))}
                    className="w-16 bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 font-mono"
                  />
                  <span className="text-gray-500">:</span>
                  <input
                    type="number"
                    min={0}
                    max={59}
                    value={settingsCronMinute}
                    onChange={e => setSettingsCronMinute(Number(e.target.value))}
                    className="w-16 bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 font-mono"
                  />
                  <span className="text-[11px] text-gray-500 ml-1">UTC</span>
                </div>
              </div>
              <div>
                <p className="text-[11px] text-gray-500">
                  Local: {(() => {
                    const d = new Date()
                    d.setUTCHours(settingsCronHour, settingsCronMinute, 0, 0)
                    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
                  })()}
                </p>
                <p className="text-[10px] text-gray-600 mt-0.5">Cron: {settingsCronMinute} {settingsCronHour} * * *</p>
              </div>
              <div className="col-span-2 sm:col-span-2">
                <button
                  type="button"
                  onClick={async () => {
                    setDeploying(true)
                    setDeployStatus(null)
                    try {
                      const res = await fetch('/api/admin/deploy-cron', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ cronHourUtc: settingsCronHour, cronMinuteUtc: settingsCronMinute }),
                      })
                      const data = await res.json()
                      setDeployStatus(res.ok ? 'Deployed! New schedule active in ~1 min.' : (data.error || 'Deploy failed'))
                      if (res.ok) setTimeout(() => setDeployStatus(null), 5000)
                    } catch {
                      setDeployStatus('Deploy failed')
                    } finally {
                      setDeploying(false)
                    }
                  }}
                  disabled={deploying}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-600 hover:bg-yellow-500 text-gray-900 font-semibold rounded-lg transition-colors text-xs disabled:opacity-50"
                >
                  {deploying ? <Loader2 className="w-3 h-3 animate-spin" /> : <Rocket className="w-3 h-3" />}
                  {deploying ? 'Deploying...' : 'Deploy Schedule'}
                </button>
                {deployStatus && (
                  <p className={`text-[11px] mt-1 ${deployStatus.includes('failed') ? 'text-red-400' : 'text-green-400'}`}>
                    {deployStatus}
                  </p>
                )}
              </div>
            </div>

            {/* Verification coverage help text */}
            {(() => {
              const maxCoverage = settingsReserve * settingsInterval
              const activeCount = quota?.activeRestaurantCount ?? 0
              const covered = activeCount > 0 && maxCoverage >= activeCount
              return (
                <p className={`mt-2 text-[11px] ${covered ? 'text-gray-500' : 'text-amber-400'}`}>
                  {settingsReserve}/day × {settingsInterval} days = <span className="font-semibold text-gray-300">{maxCoverage.toLocaleString()}</span> restaurants covered per cycle
                  {activeCount > 0 && (
                    <> — {covered ? (
                      <span className="text-green-400">covers all {activeCount.toLocaleString()} active restaurants</span>
                    ) : (
                      <span className="text-amber-400">not enough for {activeCount.toLocaleString()} active restaurants (need {Math.ceil(activeCount / settingsInterval)}/day or {Math.ceil(activeCount / settingsReserve)}-day interval)</span>
                    )}</>
                  )}
                </p>
              )
            })()}

            {/* Save button */}
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 border border-gray-700 hover:border-yellow-500/50 text-gray-300 hover:text-white rounded-lg transition-colors text-xs disabled:opacity-50"
              >
                {savingSettings ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : settingsSaved ? (
                  <Check className="w-3 h-3 text-green-400" />
                ) : (
                  <Save className="w-3 h-3" />
                )}
                {settingsSaved ? 'Saved!' : 'Save Settings'}
              </button>
            </div>
          </details>

          {quotaExhausted && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-xs text-red-400">
              Daily limit reached. Quota resets at midnight UTC.
            </div>
          )}
        </div>
      )}

      {/* ═══════ Search Queue ═══════ */}
      <SearchQueue onQueueProcessed={() => { fetchQuota(); fetchBatches(); }} refreshTrigger={queueRefreshKey} />

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
                      {(p.qualityFiltered ?? 0) > 0 && (
                        <span className="text-red-400/50">-{p.qualityFiltered} filtered</span>
                      )}
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
                  <th className="pb-2 pr-3">Rating</th>
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
                      <td className="py-2.5 pr-3 text-xs whitespace-nowrap">
                        {r.rating != null && (
                          <span className="text-yellow-400 font-medium">{r.rating.toFixed(1)}★</span>
                        )}
                        {r.reviewCount != null && (
                          <span className="text-gray-500 ml-1">({r.reviewCount.toLocaleString()})</span>
                        )}
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

      {/* ═══════ City Category Gaps ═══════ */}
      <CityGaps onRunCity={async (c, s, rpc, missingCategories) => {
        // Create one queue item per missing category, all at top priority
        await Promise.all(
          missingCategories.map(cat =>
            fetch('/api/admin/restaurants/discover/queue', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ city: c, state: s, resultsPerCategory: rpc, categorySlug: cat.slug, priority: true }),
            })
          )
        )
        setQueueRefreshKey(k => k + 1)
        // Scroll to the search queue section
        document.querySelector('[data-queue]')?.scrollIntoView({ behavior: 'smooth' })
      }} />
    </div>
  )
}
