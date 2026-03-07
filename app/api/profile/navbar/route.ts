import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculateUserPoints, getUserTier } from '@/lib/user-points'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [user, medals] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { avatarUrl: true, displayName: true },
    }),
    prisma.medal.findMany({
      where: { userId: session.user.id },
      select: { medalType: true, goldMedalComment: { select: { photoUrl: true } } },
    }),
  ])

  if (!user) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const points = calculateUserPoints(medals)
  const tier = getUserTier(points.total)

  return NextResponse.json({
    avatarUrl: user.avatarUrl,
    displayName: user.displayName,
    tier: tier
      ? { label: tier.label, color: tier.color, glow: tier.glow, glowDim: tier.glowDim, animated: tier.animated }
      : null,
  })
}
