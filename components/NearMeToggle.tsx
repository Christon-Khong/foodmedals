'use client'

import { useState } from 'react'
import { MapPin } from 'lucide-react'

const RADIUS_OPTIONS = [5, 10, 25, 50] as const
type Radius = typeof RADIUS_OPTIONS[number]

type Props = {
  onLocationChange: (lat: number, lng: number, radius: number) => void
  onClear: () => void
}

export function NearMeToggle({ onLocationChange, onClear }: Props) {
  const [state, setState] = useState<'idle' | 'loading' | 'active' | 'error'>('idle')
  const [radius, setRadius] = useState<Radius>(10)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  function requestLocation() {
    if (!navigator.geolocation) {
      setState('error')
      setErrorMsg('Geolocation is not supported by your browser')
      return
    }
    setState('loading')
    navigator.geolocation.getCurrentPosition(
      pos => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        setCoords({ lat, lng })
        setState('active')
        onLocationChange(lat, lng, radius)
      },
      () => {
        setState('error')
        setErrorMsg('Enable location to see restaurants near you')
      },
    )
  }

  function handleRadiusChange(r: Radius) {
    setRadius(r)
    if (coords) onLocationChange(coords.lat, coords.lng, r)
  }

  function handleClear() {
    setState('idle')
    setCoords(null)
    setErrorMsg('')
    onClear()
  }

  if (state === 'idle' || state === 'loading') {
    return (
      <button
        type="button"
        onClick={requestLocation}
        disabled={state === 'loading'}
        className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:border-yellow-400 hover:text-yellow-700 transition-colors disabled:opacity-60 min-h-[44px]"
      >
        <MapPin className="w-4 h-4" />
        {state === 'loading' ? 'Locating…' : 'Near Me'}
      </button>
    )
  }

  if (state === 'error') {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <MapPin className="w-4 h-4 text-gray-400" />
        <span>{errorMsg}</span>
      </div>
    )
  }

  // active state — show radius pills
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={handleClear}
        className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-yellow-400 text-gray-900 text-sm font-semibold min-h-[44px]"
      >
        <MapPin className="w-4 h-4" />
        Near Me
        <span className="ml-1 text-gray-600 font-normal">×</span>
      </button>
      {RADIUS_OPTIONS.map(r => (
        <button
          key={r}
          type="button"
          onClick={() => handleRadiusChange(r)}
          className={`px-3 py-2 rounded-full text-sm font-medium border transition-colors min-h-[44px] ${
            radius === r
              ? 'bg-gray-900 border-gray-900 text-white'
              : 'bg-white border-gray-300 text-gray-700 hover:border-gray-500'
          }`}
        >
          {r} mi
        </button>
      ))}
    </div>
  )
}
