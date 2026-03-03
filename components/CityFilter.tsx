'use client'

import type { CityOption } from '@/lib/queries'

type Props = {
  cities: CityOption[]
  selectedCity: string | null
  selectedState: string | null
  onCityChange: (city: string | null, state: string | null) => void
}

export function CityFilter({ cities, selectedCity, selectedState, onCityChange }: Props) {
  if (cities.length === 0) return null

  const value = selectedCity && selectedState ? `${selectedCity}|${selectedState}` : ''

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value
    if (!v) {
      onCityChange(null, null)
    } else {
      const [city, state] = v.split('|')
      onCityChange(city, state)
    }
  }

  return (
    <select
      value={value}
      onChange={handleChange}
      className="px-3 py-2.5 rounded-full border border-gray-300 bg-white text-sm text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-yellow-400 min-h-[44px] cursor-pointer"
      aria-label="Filter by city"
    >
      <option value="">All cities</option>
      {cities.map(c => (
        <option key={`${c.city}-${c.state}`} value={`${c.city}|${c.state}`}>
          {c.city}, {c.state}
        </option>
      ))}
    </select>
  )
}
