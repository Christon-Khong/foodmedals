'use client'

import { useState } from 'react'
import { MapPin, ExternalLink, Loader2, CheckCircle2, XCircle } from 'lucide-react'

type Props = {
  restaurantId: string
  address: string
  city: string
  state: string
  zip: string
  hasCoords: boolean
}

export function GeocodeFixInline({ restaurantId, address, city, state, zip, hasCoords }: Props) {
  const [status, setStatus] = useState<'idle' | 'fixing' | 'fixed' | 'failed' | 'manual'>(
    hasCoords ? 'fixed' : 'idle'
  )
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [saving, setSaving] = useState(false)

  if (hasCoords && status === 'fixed') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] text-green-400/70">
        <CheckCircle2 className="w-3 h-3" />
        Geocoded
      </span>
    )
  }

  const mapsQuery = encodeURIComponent(`${address}, ${city}, ${state} ${zip}`)
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`

  async function handleAutoFix() {
    setStatus('fixing')
    try {
      const res = await fetch('/api/admin/restaurants/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [restaurantId] }),
      })
      if (res.ok) {
        const data = await res.json()
        const result = data.results?.[0]
        setStatus(result?.status === 'fixed' ? 'fixed' : 'failed')
      } else {
        setStatus('failed')
      }
    } catch {
      setStatus('failed')
    }
  }

  async function handleManualSave() {
    const latNum = parseFloat(lat)
    const lngNum = parseFloat(lng)
    if (isNaN(latNum) || isNaN(lngNum)) return

    setSaving(true)
    try {
      const res = await fetch(`/api/admin/restaurants/${restaurantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat: latNum, lng: lngNum }),
      })
      if (res.ok) {
        setStatus('fixed')
      }
    } catch { /* ignore */ }
    setSaving(false)
  }

  if (status === 'fixed') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] text-green-400 font-semibold">
        <CheckCircle2 className="w-3 h-3" />
        Fixed
      </span>
    )
  }

  return (
    <div className="mt-2 flex flex-col gap-1.5">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1 text-[10px] text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full">
          <MapPin className="w-2.5 h-2.5" />
          No coordinates
        </span>

        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 transition-colors"
        >
          <ExternalLink className="w-2.5 h-2.5" />
          Google Maps
        </a>

        {status === 'idle' && (
          <button
            onClick={handleAutoFix}
            className="inline-flex items-center gap-1 text-[10px] font-semibold text-yellow-400 hover:text-yellow-300 transition-colors"
          >
            <MapPin className="w-2.5 h-2.5" />
            Auto-fix
          </button>
        )}

        {status === 'fixing' && (
          <span className="inline-flex items-center gap-1 text-[10px] text-gray-400">
            <Loader2 className="w-2.5 h-2.5 animate-spin" />
            Geocoding...
          </span>
        )}

        {status === 'failed' && (
          <>
            <span className="inline-flex items-center gap-1 text-[10px] text-red-400">
              <XCircle className="w-2.5 h-2.5" />
              Auto-fix failed
            </span>
            <button
              onClick={() => setStatus('manual')}
              className="text-[10px] font-semibold text-gray-400 hover:text-white transition-colors"
            >
              Enter manually
            </button>
          </>
        )}

        {status !== 'manual' && status !== 'fixing' && status !== 'failed' && (
          <button
            onClick={() => setStatus('manual')}
            className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
          >
            Manual
          </button>
        )}
      </div>

      {status === 'manual' && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Lat"
            value={lat}
            onChange={e => setLat(e.target.value)}
            className="w-24 px-2 py-1 text-[11px] bg-gray-800 border border-gray-700 rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-yellow-500"
          />
          <input
            type="text"
            placeholder="Lng"
            value={lng}
            onChange={e => setLng(e.target.value)}
            className="w-24 px-2 py-1 text-[11px] bg-gray-800 border border-gray-700 rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-yellow-500"
          />
          <button
            onClick={handleManualSave}
            disabled={saving || !lat.trim() || !lng.trim()}
            className="px-2 py-1 text-[11px] font-semibold bg-yellow-500 hover:bg-yellow-400 text-gray-900 rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
          </button>
          <button
            onClick={() => setStatus('idle')}
            className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}
