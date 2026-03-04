'use client'

import type { StateOption } from '@/lib/queries'

type Props = {
  states: StateOption[]
  selectedState: string | null
  onStateChange: (state: string | null) => void
}

export function StateFilter({ states, selectedState, onStateChange }: Props) {
  if (states.length === 0) return null

  return (
    <select
      value={selectedState ?? ''}
      onChange={e => onStateChange(e.target.value || null)}
      className="px-3 py-2.5 rounded-full border border-gray-300 bg-white text-sm text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-yellow-400 min-h-[44px] cursor-pointer"
      aria-label="Filter by state"
    >
      <option value="">All states</option>
      {states.map(s => (
        <option key={s.state} value={s.state}>
          {s.state} ({s.count})
        </option>
      ))}
    </select>
  )
}
