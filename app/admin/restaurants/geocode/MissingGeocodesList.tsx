'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { MapPin, RotateCcw, CheckCircle2, XCircle, Loader2, Trash2 } from 'lucide-react'

type Restaurant = {
  id: string
  name: string
  address: string
  city: string
  state: string
  zip: string
  slug: string
}

type FixResult = { id: string; name: string; status: 'fixed' | 'failed' }

export function MissingGeocodesList() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [fixing, setFixing] = useState<string | null>(null) // single ID being fixed
  const [batchFixing, setBatchFixing] = useState(false)
  const [results, setResults] = useState<Record<string, 'fixed' | 'failed'>>({})
  const [batchSummary, setBatchSummary] = useState<{ fixed: number; failed: number } | null>(null)
  const [removing, setRemoving] = useState<string | null>(null)

  const fetchMissing = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/restaurants/geocode')
      if (res.ok) {
        const data = await res.json()
        setRestaurants(data.restaurants)
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  useEffect(() => { fetchMissing() }, [fetchMissing])

  async function handleFixOne(id: string) {
    setFixing(id)
    try {
      const res = await fetch('/api/admin/restaurants/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id] }),
      })
      if (res.ok) {
        const data = await res.json()
        const result = data.results[0] as FixResult | undefined
        if (result) {
          setResults(prev => ({ ...prev, [id]: result.status }))
          if (result.status === 'fixed') {
            // Remove from list after a brief delay so user sees the success
            setTimeout(() => {
              setRestaurants(prev => prev.filter(r => r.id !== id))
              setResults(prev => { const n = { ...prev }; delete n[id]; return n })
            }, 1500)
          }
        }
      }
    } catch { /* ignore */ }
    setFixing(null)
  }

  async function handleFixAll() {
    setBatchFixing(true)
    setBatchSummary(null)
    setResults({})

    const ids = restaurants.map(r => r.id)

    try {
      const res = await fetch('/api/admin/restaurants/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      })
      if (res.ok) {
        const data = await res.json()
        const newResults: Record<string, 'fixed' | 'failed'> = {}
        for (const r of data.results as FixResult[]) {
          newResults[r.id] = r.status
        }
        setResults(newResults)
        setBatchSummary(data.summary)

        // Remove fixed restaurants from list after delay
        const fixedIds = new Set(
          (data.results as FixResult[]).filter(r => r.status === 'fixed').map(r => r.id),
        )
        if (fixedIds.size > 0) {
          setTimeout(() => {
            setRestaurants(prev => prev.filter(r => !fixedIds.has(r.id)))
            setResults(prev => {
              const n = { ...prev }
              for (const id of fixedIds) delete n[id]
              return n
            })
          }, 2000)
        }
      }
    } catch { /* ignore */ }
    setBatchFixing(false)
  }

  async function handleRemove(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This removes the restaurant and all its medals permanently.`)) return
    setRemoving(id)
    try {
      const res = await fetch(`/api/admin/restaurants/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setRestaurants(prev => prev.filter(r => r.id !== id))
      }
    } catch { /* ignore */ }
    setRemoving(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Loading...
      </div>
    )
  }

  if (restaurants.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center">
        <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white mb-1">All clear!</h3>
        <p className="text-gray-400 text-sm">
          Every active restaurant has valid coordinates.
        </p>
      </div>
    )
  }

  return (
    <>
      {/* Summary bar */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">
            <span className="font-bold text-yellow-400">{restaurants.length}</span> restaurant{restaurants.length !== 1 ? 's' : ''} missing coordinates
          </span>
          {batchSummary && (
            <span className="text-xs bg-gray-800 border border-gray-700 rounded-lg px-3 py-1">
              <span className="text-green-400 font-semibold">{batchSummary.fixed} fixed</span>
              {batchSummary.failed > 0 && (
                <span className="text-red-400 font-semibold ml-2">{batchSummary.failed} failed</span>
              )}
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={fetchMissing}
            disabled={batchFixing}
            className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Refresh
          </button>
          <button
            onClick={handleFixAll}
            disabled={batchFixing || fixing !== null}
            className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-gray-900 text-xs font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            {batchFixing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Geocoding {restaurants.length}...
              </>
            ) : (
              <>
                <MapPin className="w-3.5 h-3.5" />
                Fix All ({restaurants.length})
              </>
            )}
          </button>
        </div>
      </div>

      {batchFixing && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3 mb-4 text-xs text-yellow-400">
          Geocoding in progress — this takes ~1 second per restaurant due to rate limits.
          Please don&apos;t navigate away.
        </div>
      )}

      {/* Restaurant list */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left px-4 py-3 text-gray-500 font-semibold">Restaurant</th>
              <th className="text-left px-4 py-3 text-gray-500 font-semibold hidden sm:table-cell">Address</th>
              <th className="text-left px-4 py-3 text-gray-500 font-semibold hidden md:table-cell">City</th>
              <th className="px-4 py-3 text-gray-500 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60">
            {restaurants.map(r => {
              const status = results[r.id]
              return (
                <tr
                  key={r.id}
                  className={`transition-all ${
                    status === 'fixed'
                      ? 'bg-green-500/5'
                      : status === 'failed'
                        ? 'bg-red-500/5'
                        : 'hover:bg-gray-800/40'
                  }`}
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/restaurants/${r.slug}`}
                      target="_blank"
                      className="font-medium text-white hover:text-yellow-400 transition-colors"
                    >
                      {r.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-400 hidden sm:table-cell text-xs">
                    {r.address}
                  </td>
                  <td className="px-4 py-3 text-gray-400 hidden md:table-cell">
                    {r.city}, {r.state} {r.zip}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {status === 'fixed' ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-400 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Fixed
                        </span>
                      ) : status === 'failed' ? (
                        <span className="inline-flex items-center gap-1 text-xs text-red-400 font-semibold">
                          <XCircle className="w-3.5 h-3.5" />
                          Failed
                        </span>
                      ) : (
                        <button
                          onClick={() => handleFixOne(r.id)}
                          disabled={fixing !== null || batchFixing}
                          className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
                        >
                          {fixing === r.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <MapPin className="w-3 h-3" />
                          )}
                          Fix
                        </button>
                      )}
                      <Link
                        href={`/admin/restaurants/${r.id}/edit`}
                        className="text-xs text-gray-500 hover:text-yellow-400 transition-colors"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleRemove(r.id, r.name)}
                        disabled={removing === r.id || batchFixing}
                        className="px-2 py-1.5 text-gray-500 hover:text-red-400 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
                        title="Delete restaurant"
                      >
                        {removing === r.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
