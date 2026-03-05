import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import Image from 'next/image'

async function getStats() {
  const year = new Date().getFullYear()
  const [
    totalRestaurants,
    pendingRestaurants,
    activeRestaurants,
    totalUsers,
    totalMedalsThisYear,
    totalCategories,
    pendingAddressReports,
    recentPending,
  ] = await Promise.all([
    prisma.restaurant.count(),
    prisma.restaurant.count({ where: { status: 'pending_review' } }),
    prisma.restaurant.count({ where: { status: 'active' } }),
    prisma.user.count(),
    prisma.medal.count({ where: { year } }),
    prisma.foodCategory.count({ where: { status: 'active' } }),
    prisma.addressReport.count({ where: { status: 'pending' } }),
    prisma.restaurant.findMany({
      where:   { status: 'pending_review' },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { submitter: { select: { displayName: true, email: true } } },
    }),
  ])
  return { totalRestaurants, pendingRestaurants, activeRestaurants, totalUsers, totalMedalsThisYear, totalCategories, pendingAddressReports, recentPending, year }
}

export default async function AdminDashboard() {
  const stats = await getStats()

  const statCards: { label: string; value: number; icon: React.ReactNode; href: string | null; alert?: boolean }[] = [
    { label: 'Active Restaurants', value: stats.activeRestaurants,    icon: '🍽️', href: '/admin/restaurants/all' },
    { label: 'Pending Review',     value: stats.pendingRestaurants,    icon: '⏳', href: '/admin/restaurants',    alert: stats.pendingRestaurants > 0 },
    { label: 'Registered Users',   value: stats.totalUsers,            icon: '👥', href: '/admin/users' },
    { label: `${stats.year} Medals`, value: stats.totalMedalsThisYear, icon: <Image src="/medals/gold.png" alt="medals" width={24} height={24} />, href: null },
    { label: 'Address Reports',    value: stats.pendingAddressReports,  icon: '📍', href: '/admin/reports',        alert: stats.pendingAddressReports > 0 },
    { label: 'Food Categories',    value: stats.totalCategories,       icon: '📂', href: '/admin/categories' },
  ]

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">FoodMedals admin overview</p>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {statCards.map(card => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      {/* Pending queue preview */}
      {stats.recentPending.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              Pending Review ({stats.pendingRestaurants})
            </h2>
            <Link href="/admin/restaurants" className="text-xs text-yellow-400 hover:text-yellow-300 transition-colors">
              View all →
            </Link>
          </div>

          <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-4 py-3 text-gray-500 font-semibold">Restaurant</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-semibold hidden sm:table-cell">City</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-semibold hidden md:table-cell">Submitted by</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {stats.recentPending.map(r => (
                  <tr key={r.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-white">{r.name}</p>
                      <p className="text-xs text-gray-500 sm:hidden">{r.city}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-400 hidden sm:table-cell">{r.city}</td>
                    <td className="px-4 py-3 text-gray-400 hidden md:table-cell text-xs">
                      {r.submitter?.displayName ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href="/admin/restaurants"
                        className="text-xs text-yellow-400 hover:text-yellow-300 transition-colors"
                      >
                        Review →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {stats.pendingRestaurants === 0 && (
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-10 text-center">
          <div className="text-4xl mb-3">✅</div>
          <p className="text-gray-300 font-medium">Moderation queue is clear</p>
          <p className="text-gray-500 text-sm mt-1">No restaurants pending review</p>
        </div>
      )}
    </div>
  )
}

function StatCard({
  label, value, icon, href, alert,
}: {
  label: string; value: number; icon: React.ReactNode; href: string | null; alert?: boolean
}) {
  const inner = (
    <div className={`bg-gray-900 border rounded-2xl p-5 transition-colors ${
      alert ? 'border-yellow-500/60 hover:border-yellow-400' : 'border-gray-800 hover:border-gray-700'
    }`}>
      <div className="flex items-start justify-between">
        <span className="text-2xl">{icon}</span>
        {alert && <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse mt-1" />}
      </div>
      <p className="text-3xl font-extrabold text-white mt-3">{value.toLocaleString()}</p>
      <p className="text-xs text-gray-400 mt-1 font-medium uppercase tracking-wide">{label}</p>
    </div>
  )

  return href ? <Link href={href}>{inner}</Link> : <div>{inner}</div>
}
