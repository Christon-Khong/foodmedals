'use client'

import { useRouter, useSearchParams } from 'next/navigation'

export function RestaurantFilters({
  cities,
  states,
  categories,
}: {
  cities: string[]
  states: string[]
  categories: { slug: string; name: string }[]
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentCity = searchParams.get('city') ?? ''
  const currentState = searchParams.get('state') ?? ''
  const currentCategory = searchParams.get('category') ?? ''
  const currentSort = searchParams.get('sort') ?? ''
  const currentPerPage = searchParams.get('perPage') ?? '50'

  const hasFilters = currentCity || currentState || currentCategory || currentSort

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    // Reset to page 1 when filters change
    params.delete('page')
    const qs = params.toString()
    router.push(`/admin/restaurants/all${qs ? `?${qs}` : ''}`)
  }

  function clearFilters() {
    const params = new URLSearchParams()
    const status = searchParams.get('status')
    const q = searchParams.get('q')
    if (status) params.set('status', status)
    if (q) params.set('q', q)
    const qs = params.toString()
    router.push(`/admin/restaurants/all${qs ? `?${qs}` : ''}`)
  }

  const selectClass =
    'bg-gray-800 border border-gray-700 text-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-yellow-500 appearance-none cursor-pointer'

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <select
        value={currentCity}
        onChange={e => updateParam('city', e.target.value)}
        className={selectClass}
      >
        <option value="">All Cities</option>
        {cities.map(c => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      <select
        value={currentState}
        onChange={e => updateParam('state', e.target.value)}
        className={selectClass}
      >
        <option value="">All States</option>
        {states.map(s => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      <select
        value={currentCategory}
        onChange={e => updateParam('category', e.target.value)}
        className={selectClass}
      >
        <option value="">All Categories</option>
        {categories.map(c => (
          <option key={c.slug} value={c.slug}>{c.name}</option>
        ))}
      </select>

      <select
        value={currentSort}
        onChange={e => updateParam('sort', e.target.value)}
        className={selectClass}
      >
        <option value="">Sort: Default</option>
        <option value="name-asc">Name A-Z</option>
        <option value="name-desc">Name Z-A</option>
        <option value="newest">Newest First</option>
        <option value="oldest">Oldest First</option>
        <option value="most-medals">Most Medals</option>
      </select>

      <select
        value={currentPerPage}
        onChange={e => updateParam('perPage', e.target.value)}
        className={selectClass}
      >
        <option value="50">50 / page</option>
        <option value="100">100 / page</option>
        <option value="250">250 / page</option>
      </select>

      {hasFilters && (
        <button
          onClick={clearFilters}
          className="text-xs text-gray-500 hover:text-yellow-400 transition-colors ml-1"
        >
          Clear filters
        </button>
      )}
    </div>
  )
}
