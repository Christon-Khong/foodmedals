import { prisma } from '@/lib/prisma'
import { getAdminSession } from '@/lib/adminAuth'
import { redirect } from 'next/navigation'
import { UsersTable } from './UsersTable'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  const session = await getAdminSession()
  if (!session?.user?.email) redirect('/auth/signin')

  const year = new Date().getFullYear()

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { medals: true, submittedRestaurants: true } },
    },
  })

  const medalsByUser = await prisma.medal.groupBy({
    by: ['userId'],
    where: { year },
    _count: { _all: true },
  })
  const currentYearMedals = new Map(medalsByUser.map((m) => [m.userId, m._count._all]))

  const rows = users.map((u) => ({
    id: u.id,
    displayName: u.displayName,
    email: u.email,
    city: u.city,
    isAdmin: u.isAdmin,
    currentYearMedals: currentYearMedals.get(u.id) ?? 0,
    totalMedals: u._count.medals,
    submissions: u._count.submittedRestaurants,
    createdAt: u.createdAt.toISOString(),
  }))

  return (
    <div className="max-w-5xl">
      <UsersTable users={rows} year={year} currentUserEmail={session.user.email} />
    </div>
  )
}
