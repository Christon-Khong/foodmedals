'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, MapPin } from 'lucide-react'

type Props = {
  reportId: string
  restaurantId: string
  currentAddress: string
  currentCity: string
  currentState: string
  currentZip: string
  googleMapsUrl?: string | null
}

export function ReportActions({
  reportId,
  restaurantId,
  currentAddress,
  currentCity,
  currentState,
  currentZip,
  googleMapsUrl,
}: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<'resolve' | 'dismiss' | null>(null)
  const [done, setDone] = useState<'resolved' | 'dismissed' | null>(null)
  const [editing, setEditing] = useState(false)
  const [address, setAddress] = useState(currentAddress)
  const [city, setCity] = useState(currentCity)
  const [state, setState] = useState(currentState)
  const [zip, setZip] = useState(currentZip)
  const [lookingUp, setLookingUp] = useState(false)
  const [lookupError, setLookupError] = useState<string | null>(null)

  async function handleLookupFromMaps() {
    if (!googleMapsUrl) return
    setLookingUp(true)
    setLookupError(null)
    try {
      const res = await fetch('/api/admin/reports/lookup-address', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ googleMapsUrl }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.address) setAddress(data.address)
        if (data.city) setCity(data.city)
        if (data.state) setState(data.state)
        if (data.zip) setZip(data.zip)
      } else {
        const err = await res.json().catch(() => null)
        setLookupError(err?.error ?? 'Could not extract address from URL')
      }
    } catch {
      setLookupError('Failed to look up address')
    }
    setLookingUp(false)
  }

  async function handleResolve() {
    setLoading('resolve')

    // Check if address was changed
    const addressChanged =
      address.trim() !== currentAddress ||
      city.trim() !== currentCity ||
      state.trim() !== currentState ||
      zip.trim() !== currentZip

    const res = await fetch(`/api/admin/reports/${reportId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'resolved',
        ...(addressChanged && {
          restaurantId,
          address: address.trim(),
          city: city.trim(),
          state: state.trim(),
          zip: zip.trim(),
        }),
      }),
    })

    if (res.ok) {
      setDone('resolved')
      setTimeout(() => router.refresh(), 800)
    } else {
      setLoading(null)
    }
  }

  async function handleDismiss() {
    setLoading('dismiss')
    const res = await fetch(`/api/admin/reports/${reportId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'dismissed' }),
    })

    if (res.ok) {
      setDone('dismissed')
      setTimeout(() => router.refresh(), 800)
    } else {
      setLoading(null)
    }
  }

  if (done) {
    return (
      <div className={`text-sm font-semibold px-4 py-2 rounded-xl ${
        done === 'resolved'
          ? 'text-green-400 bg-green-400/10 border border-green-400/20'
          : 'text-gray-400 bg-gray-400/10 border border-gray-400/20'
      }`}>
        {done === 'resolved' ? '✓ Resolved' : '✗ Dismissed'}
      </div>
    )
  }

  if (editing) {
    return (
      <div className="w-full mt-3 bg-gray-800/50 border border-gray-700 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">Update Address</h4>
          {googleMapsUrl && (
            <button
              onClick={handleLookupFromMaps}
              disabled={lookingUp}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {lookingUp ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <MapPin className="w-3 h-3" />
              )}
              Use Google Maps Link
            </button>
          )}
        </div>

        {lookupError && (
          <p className="text-xs text-red-400">{lookupError}</p>
        )}

        <div className="grid grid-cols-1 gap-2">
          <div>
            <label className="block text-[10px] text-gray-400 mb-0.5">Street Address</label>
            <input
              value={address}
              onChange={e => setAddress(e.target.value)}
              className="w-full px-3 py-1.5 text-sm bg-gray-900 border border-gray-700 rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-yellow-500"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] text-gray-400 mb-0.5">City</label>
              <input
                value={city}
                onChange={e => setCity(e.target.value)}
                className="w-full px-3 py-1.5 text-sm bg-gray-900 border border-gray-700 rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-yellow-500"
              />
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 mb-0.5">State</label>
              <input
                value={state}
                onChange={e => setState(e.target.value)}
                className="w-full px-3 py-1.5 text-sm bg-gray-900 border border-gray-700 rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-yellow-500"
              />
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 mb-0.5">ZIP</label>
              <input
                value={zip}
                onChange={e => setZip(e.target.value)}
                className="w-full px-3 py-1.5 text-sm bg-gray-900 border border-gray-700 rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-yellow-500"
              />
            </div>
          </div>
        </div>

        {address.trim() !== currentAddress || city.trim() !== currentCity || state.trim() !== currentState || zip.trim() !== currentZip ? (
          <p className="text-[10px] text-yellow-400">Address will be updated and re-geocoded on resolve.</p>
        ) : null}

        <div className="flex gap-2">
          <button
            onClick={handleResolve}
            disabled={loading !== null}
            className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            {loading === 'resolve' ? (
              <span className="animate-spin inline-block w-3 h-3 border border-white border-t-transparent rounded-full" />
            ) : '✓'}
            Resolve
          </button>
          <button
            onClick={handleDismiss}
            disabled={loading !== null}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            {loading === 'dismiss' ? (
              <span className="animate-spin inline-block w-3 h-3 border border-gray-300 border-t-transparent rounded-full" />
            ) : '✗'}
            Dismiss
          </button>
          <button
            onClick={() => {
              setEditing(false)
              setAddress(currentAddress)
              setCity(currentCity)
              setState(currentState)
              setZip(currentZip)
            }}
            className="px-3 py-2 text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-2 sm:flex-col shrink-0">
      <button
        onClick={() => setEditing(true)}
        className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-1.5"
      >
        ✓ Resolve
      </button>
      <button
        onClick={handleDismiss}
        disabled={loading !== null}
        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-1.5"
      >
        {loading === 'dismiss' ? (
          <span className="animate-spin inline-block w-3 h-3 border border-gray-300 border-t-transparent rounded-full" />
        ) : '✗'}
        Dismiss
      </button>
    </div>
  )
}
