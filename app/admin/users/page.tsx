import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  const year = new Date().getFullYear()

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { medals: true, submittedRestaurants: true } },
    },
  })

  const medalsByUser = await prisma.medal.groupBy({
    by:      ['userId'],
    where:   { year },
    _count:  { _all: true },
  })
  const currentYearMedals = new Map(medalsByUser.map(m => [m.userId, m._count._all]))

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Users</h1>
        <p className="text-gray-400 text-sm mt-1">{users.length} registered users</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left px-4 py-3 text-gray-500 font-semibold">User</th>
              <th className="text-left px-4 py-3 text-gray-500 font-semibold hidden sm:table-cell">City</th>
              <th className="text-center px-4 py-3 text-gray-500 font-semibold">{year} Medals</th>
              <th className="text-center px-4 py-3 text-gray-500 font-semibold hidden md:table-cell">Total</th>
              <th className="text-center px-4 py-3 text-gray-500 font-semibold hidden lg:table-cell">Submissions</th>
              <th className="text-left px-4 py-3 text-gray-500 font-semibold hidden lg:table-cell">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-gray-800/40 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-white">{u.displayName}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{u.email}</p>
                </td>
                <td className="px-4 py-3 text-gray-400 hidden sm:table-cell">{u.city ?? '—'}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`font-semibold ${
                    (currentYearMedals.get(u.id) ?? 0) > 0 ? 'text-yellow-400' : 'text-gray-600'
                  }`}>
                    {currentYearMedals.get(u.id) ?? 0}
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-gray-400 hidden md:table-cell">{u._count.medals}</td>
                <td className="px-4 py-3 text-center text-gray-400 hidden lg:table-cell">{u._count.submittedRestaurants}</td>
                <td className="px-4 py-3 text-gray-500 text-xs hidden lg:table-cell">
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
