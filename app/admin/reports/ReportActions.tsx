'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, MapPin, CheckCircle2, AlertCircle } from 'lucide-react'

type Props = {
  reportId: string
  restaurantId: string
  currentAddress: string
  currentCity: string
  currentState: string
  currentZip: string
  googleMapsUrl?: string | null
}

type LookupResult = {
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  lat: number | null
  lng: number | null
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

  // Suggested address fields (populated from Google Maps lookup)
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zip, setZip] = useState('')
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')

  const [lookupStatus, setLookupStatus] = useState<'idle' | 'loading' | 'success' | 'failed'>('idle')
  const [lookupError, setLookupError] = useState<string | null>(null)

  // Auto-lookup the Google Maps URL on mount
  useEffect(() => {
    if (!googleMapsUrl) return
    let cancelled = false

    async function lookup() {
      setLookupStatus('loading')
      try {
        const res = await fetch('/api/admin/reports/lookup-address', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ googleMapsUrl }),
        })
        if (cancelled) return
        if (res.ok) {
          const data: LookupResult = await res.json()
          if (data.address) setAddress(data.address)
          if (data.city) setCity(data.city)
          if (data.state) setState(data.state)
          if (data.zip) setZip(data.zip)
          if (data.lat != null) setLat(data.lat.toFixed(6))
          if (data.lng != null) setLng(data.lng.toFixed(6))
          setLookupStatus('success')
        } else {
          const err = await res.json().catch(() => null)
          setLookupError(err?.error ?? 'Could not extract address')
          setLookupStatus('failed')
        }
      } catch {
        if (!cancelled) {
          setLookupError('Failed to look up address')
          setLookupStatus('failed')
        }
      }
    }

    lookup()
    return () => { cancelled = true }
  }, [googleMapsUrl])

  async function handleResolve() {
    setLoading('resolve')

    const hasAddress = address.trim().length > 0

    const res = await fetch(`/api/admin/reports/${reportId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'resolved',
        ...(hasAddress && {
          restaurantId,
          address: address.trim(),
          city: city.trim(),
          state: state.trim(),
          zip: zip.trim(),
          ...(lat.trim() && lng.trim() && {
            lat: parseFloat(lat),
            lng: parseFloat(lng),
          }),
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
      <div className={`text-sm font-semibold px-4 py-2 rounded-xl inline-block ${
        done === 'resolved'
          ? 'text-green-400 bg-green-400/10 border border-green-400/20'
          : 'text-gray-400 bg-gray-400/10 border border-gray-400/20'
      }`}>
        {done === 'resolved' ? '✓ Resolved' : '✗ Dismissed'}
      </div>
    )
  }

  const hasSuggestedAddress = lookupStatus === 'success' && address.trim().length > 0

  return (
    <div className="mt-3 space-y-3">
      {/* Suggested address from Google Maps */}
      {googleMapsUrl && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
            <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Suggested Address</h4>
            {lookupStatus === 'loading' && (
              <span className="inline-flex items-center gap-1 text-[10px] text-gray-500">
                <Loader2 className="w-3 h-3 animate-spin" />
                Looking up...
              </span>
            )}
            {lookupStatus === 'success' && (
              <span className="inline-flex items-center gap-1 text-[10px] text-green-400">
                <CheckCircle2 className="w-3 h-3" />
                Extracted from Google Maps
              </span>
            )}
            {lookupStatus === 'failed' && (
              <span className="inline-flex items-center gap-1 text-[10px] text-red-400">
                <AlertCircle className="w-3 h-3" />
                {lookupError}
              </span>
            )}
          </div>

          {lookupStatus !== 'loading' && (
            <>
              <div className="grid grid-cols-1 gap-2">
                <div>
                  <label className="block text-[10px] text-gray-400 mb-0.5">Street Address</label>
                  <input
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="Street address"
                    className="w-full px-3 py-1.5 text-sm bg-gray-900 border border-gray-700 rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-yellow-500"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-0.5">City</label>
                    <input
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      placeholder="City"
                      className="w-full px-3 py-1.5 text-sm bg-gray-900 border border-gray-700 rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-yellow-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-0.5">State</label>
                    <input
                      value={state}
                      onChange={e => setState(e.target.value)}
                      placeholder="State"
                      className="w-full px-3 py-1.5 text-sm bg-gray-900 border border-gray-700 rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-yellow-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-0.5">ZIP</label>
                    <input
                      value={zip}
                      onChange={e => setZip(e.target.value)}
                      placeholder="ZIP"
                      className="w-full px-3 py-1.5 text-sm bg-gray-900 border border-gray-700 rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-yellow-500"
                    />
                  </div>
                </div>
              </div>

              {/* Geocode coordinates */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-gray-400 mb-0.5">Latitude</label>
                  <input
                    value={lat}
                    onChange={e => setLat(e.target.value)}
                    placeholder="Lat"
                    className="w-full px-3 py-1.5 text-xs bg-gray-900 border border-gray-700 rounded-lg text-gray-300 placeholder:text-gray-600 focus:outline-none focus:border-yellow-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 mb-0.5">Longitude</label>
                  <input
                    value={lng}
                    onChange={e => setLng(e.target.value)}
                    placeholder="Lng"
                    className="w-full px-3 py-1.5 text-xs bg-gray-900 border border-gray-700 rounded-lg text-gray-300 placeholder:text-gray-600 focus:outline-none focus:border-yellow-500 font-mono"
                  />
                </div>
              </div>

              {hasSuggestedAddress && (
                <p className="text-[10px] text-yellow-400">
                  Resolving will update the restaurant&apos;s address and coordinates.
                </p>
              )}
            </>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleResolve}
          disabled={loading !== null}
          className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-1.5"
        >
          {loading === 'resolve' ? (
            <span className="animate-spin inline-block w-3 h-3 border border-white border-t-transparent rounded-full" />
          ) : '✓'}
          {hasSuggestedAddress ? 'Resolve & Update Address' : 'Resolve'}
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
    </div>
  )
}
