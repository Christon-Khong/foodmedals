import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/adminAuth'
import { getQuotaStatus, getDiscoverSettings } from '@/lib/google-places-quota'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const [quota, discoverSettings, activeCount] = await Promise.all([
    getQuotaStatus(),
    getDiscoverSettings(),
    prisma.restaurant.count({ where: { status: 'active' } }),
  ])
  return NextResponse.json({ ...quota, ...discoverSettings, activeRestaurantCount: activeCount })
}
