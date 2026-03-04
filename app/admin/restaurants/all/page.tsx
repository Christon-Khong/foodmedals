import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { StatusBadge } from '../StatusBadge'
import { BulkStatusSelect } from '../BulkStatusSelect'

export const dynamic = 'force-dynamic'

const STATUS_FILTERS = ['all', 'active', 'pending_review', 'inactive'] as const
type StatusFilter = typeof STATUS_FILTERS[number]

async function getRestaurants(status: StatusFilter) {
  return prisma.restaurant.findMany({
    where:   status === 'all' ? {} : { status },
    orderBy: [{ status: 'asc' }, { name: 'asc' }],
    include: {
      _count:    { select: { medals: true, categories: true } },
      submitter: { select: { displayName: true } },
    },
  })
}

export default async function AllRestaurantsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status: rawStatus } = await searchParams
  const status: StatusFilter =
    STATUS_FILTERS.includes(rawStatus as StatusFilter) ? (rawStatus as StatusFilter) : 'all'

  const restaurants = await getRestaurants(status)

  return (
    <div className="max-w-6xl">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">All Restaurants</h1>
          <p className="text-gray-400 text-sm mt-1">{restaurants.length} shown</p>
        </div>

        {/* Status filter tabs */}
        <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1">
          {STATUS_FILTERS.map(s => (
            <Link
              key={s}
              href={`/admin/restaurants/all${s !== 'all' ? `?status=${s}` : ''}`}
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
    </div>
  )
}
