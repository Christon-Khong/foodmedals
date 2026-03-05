import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Suspense } from 'react'
import { StatusBadge } from '../StatusBadge'
import { BulkStatusSelect } from '../BulkStatusSelect'
import { RestaurantSearch } from './RestaurantSearch'
import { RestaurantFilters } from './RestaurantFilters'
import { Pagination } from './Pagination'

export const dynamic = 'force-dynamic'

const STATUS_FILTERS = ['all', 'active', 'pending_review', 'inactive'] as const
type StatusFilter = typeof STATUS_FILTERS[number]

const SORT_OPTIONS: Record<string, { orderBy: object }> = {
  'name-asc':    { orderBy: { name: 'asc' } },
  'name-desc':   { orderBy: { name: 'desc' } },
  'newest':      { orderBy: { createdAt: 'desc' } },
  'oldest':      { orderBy: { createdAt: 'asc' } },
  'most-medals': { orderBy: { medals: { _count: 'desc' } } },
}

interface Params {
  status?: string
  q?: string
  page?: string
  perPage?: string
  city?: string
  state?: string
  category?: string
  sort?: string
}

async function getRestaurants(params: Params) {
  const status: StatusFilter =
    STATUS_FILTERS.includes(params.status as StatusFilter) ? (params.status as StatusFilter) : 'all'
  const query = typeof params.q === 'string' ? params.q.trim() : ''
  const page = Math.max(1, parseInt(params.page ?? '1', 10) || 1)
  const perPage = [50, 100, 250].includes(Number(params.perPage)) ? Number(params.perPage) : 50
  const city = params.city ?? ''
  const state = params.state ?? ''
  const categorySlug = params.category ?? ''
  const sortKey = params.sort ?? ''

  // Build where clause
  const where: Record<string, unknown> = {}
  if (status !== 'all') where.status = status
  if (query) where.name = { contains: query, mode: 'insensitive' }
  if (city) where.city = city
  if (state) where.state = state
  if (categorySlug) {
    where.categories = {
      some: { foodCategory: { slug: categorySlug } },
    }
  }

  // Build orderBy
  const sortOption = SORT_OPTIONS[sortKey]
  const orderBy = sortOption
    ? sortOption.orderBy
    : [{ status: 'asc' as const }, { name: 'asc' as const }]

  const [restaurants, total] = await Promise.all([
    prisma.restaurant.findMany({
      where,
      orderBy,
      skip: (page - 1) * perPage,
      take: perPage,
      include: {
        _count: { select: { medals: true, categories: true } },
        submitter: { select: { displayName: true } },
      },
    }),
    prisma.restaurant.count({ where }),
  ])

  return { restaurants, total, page, perPage, status, query }
}

async function getFilterOptions() {
  const [cityRows, stateRows, categories] = await Promise.all([
    prisma.restaurant.findMany({
      distinct: ['city'],
      select: { city: true },
      orderBy: { city: 'asc' },
    }),
    prisma.restaurant.findMany({
      distinct: ['state'],
      select: { state: true },
      orderBy: { state: 'asc' },
    }),
    prisma.foodCategory.findMany({
      where: { status: 'active' },
      select: { slug: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ])
  return {
    cities: cityRows.map(r => r.city),
    states: stateRows.map(r => r.state),
    categories,
  }
}

export default async function AllRestaurantsPage({
  searchParams,
}: {
  searchParams: Promise<Params>
}) {
  const params = await searchParams
  const [{ restaurants, total, page, perPage, status, query }, filterOptions] =
    await Promise.all([getRestaurants(params), getFilterOptions()])

  const totalPages = Math.ceil(total / perPage)

  // Build URL preserving all params except the one being changed
  function statusHref(s: string) {
    const p = new URLSearchParams()
    if (s !== 'all') p.set('status', s)
    if (query) p.set('q', query)
    // Preserve filters but reset page
    if (params.city) p.set('city', params.city)
    if (params.state) p.set('state', params.state)
    if (params.category) p.set('category', params.category)
    if (params.sort) p.set('sort', params.sort)
    if (params.perPage) p.set('perPage', params.perPage)
    const qs = p.toString()
    return `/admin/restaurants/all${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="max-w-6xl">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">All Restaurants</h1>
          <p className="text-gray-400 text-sm mt-1">{total} total</p>
        </div>

        {/* Status filter tabs */}
        <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1">
          {STATUS_FILTERS.map(s => (
            <Link
              key={s}
              href={statusHref(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                s === status
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {s === 'pending_review' ? 'Pending' : s.charAt(0).toUpperCase() + s.slice(1)}
            </Link>
          ))}
        </div>
      </div>

      {/* Search + Filters */}
      <div className="mb-4 flex flex-col sm:flex-row gap-3">
        <Suspense>
          <RestaurantSearch defaultValue={query} />
        </Suspense>
        <Suspense>
          <RestaurantFilters
            cities={filterOptions.cities}
            states={filterOptions.states}
            categories={filterOptions.categories}
          />
        </Suspense>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left px-4 py-3 text-gray-500 font-semibold">Restaurant</th>
              <th className="text-left px-4 py-3 text-gray-500 font-semibold hidden sm:table-cell">City</th>
              <th className="text-left px-4 py-3 text-gray-500 font-semibold hidden md:table-cell">Status</th>
              <th className="text-center px-4 py-3 text-gray-500 font-semibold hidden lg:table-cell">Medals</th>
              <th className="text-center px-4 py-3 text-gray-500 font-semibold hidden lg:table-cell">Cats</th>
              <th className="px-4 py-3 text-gray-500 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60">
            {restaurants.map(r => (
              <tr key={r.id} className="hover:bg-gray-800/40 transition-colors">
                <td className="px-4 py-3">
                  <div>
                    <Link
                      href={`/restaurants/${r.slug}`}
                      target="_blank"
                      className="font-medium text-white hover:text-yellow-400 transition-colors"
                    >
                      {r.name}
                    </Link>
                    <div className="md:hidden mt-0.5">
                      <StatusBadge status={r.status} />
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-400 hidden sm:table-cell">{r.city}</td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <StatusBadge status={r.status} />
                </td>
                <td className="px-4 py-3 text-center text-gray-400 hidden lg:table-cell">{r._count.medals}</td>
                <td className="px-4 py-3 text-center text-gray-400 hidden lg:table-cell">{r._count.categories}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <BulkStatusSelect restaurantId={r.id} currentStatus={r.status} />
                    <Link
                      href={`/admin/restaurants/${r.id}/edit`}
                      className="text-xs text-gray-500 hover:text-yellow-400 transition-colors"
                    >
                      Edit
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {restaurants.length === 0 && (
          <div className="py-16 text-center text-gray-500">No restaurants match this filter.</div>
        )}
      </div>

      {/* Pagination */}
      <Suspense>
        <Pagination page={page} totalPages={totalPages} total={total} perPage={perPage} />
      </Suspense>
    </div>
  )
}
