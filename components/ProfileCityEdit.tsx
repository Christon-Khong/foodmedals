'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Check, X } from 'lucide-react'
import { STATE_NAMES } from '@/lib/states'

type Props = {
  city: string | null
  state: string | null
}

const STATE_OPTIONS = Object.entries(STATE_NAMES).sort((a, b) => a[1].localeCompare(b[1]))

export function ProfileCityEdit({ city, state }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [cityVal, setCityVal] = useState(city ?? '')
  const [stateVal, setStateVal] = useState(state ?? '')
  const [saving, setSaving] = useState(false)

  const display = city && state ? `${city}, ${state}` : city || 'Food Critic'

  async function save() {
    setSaving(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city: cityVal.trim() || null,
          state: stateVal || null,
        }),
      })
      if (res.ok) {
        setEditing(false)
        router.refresh()
      }
    } finally {
      setSaving(false)
    }
  }

  function cancel() {
    setCityVal(city ?? '')
    setStateVal(state ?? '')
    setEditing(false)
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="group flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        title="Edit location"
      >
        <span>{display}</span>
        <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2 mt-0.5">
      <input
        type="text"
        value={cityVal}
        onChange={e => setCityVal(e.target.value)}
        placeholder="City"
        className="w-28 sm:w-36 px-2 py-1 text-sm text-gray-900 rounded-lg border border-gray-300 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-200 bg-white"
        autoFocus
        onKeyDown={e => {
          if (e.key === 'Enter') save()
          if (e.key === 'Escape') cancel()
        }}
      />
      <select
        value={stateVal}
        onChange={e => setStateVal(e.target.value)}
        className="px-2 py-1 text-sm text-gray-900 rounded-lg border border-gray-300 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-200 bg-white"
      >
        <option value="">State</option>
        {STATE_OPTIONS.map(([code, name]) => (
          <option key={code} value={code}>{name}</option>
        ))}
      </select>
      <button
        onClick={save}
        disabled={saving}
        className="p-1 text-green-600 hover:text-green-800 disabled:opacity-50 transition-colors"
        title="Save"
      >
        <Check className="w-4 h-4" />
      </button>
      <button
        onClick={cancel}
        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
        title="Cancel"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
