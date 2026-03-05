import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/adminAuth'
import { prisma } from '@/lib/prisma'
import { geocode } from '@/lib/restaurant-utils'

/** GET — list all active restaurants with missing coordinates */
export async function GET() {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const restaurants = await prisma.restaurant.findMany({
    where: {
      status: 'active',
      OR: [{ lat: null }, { lng: null }],
    },
    select: {
      id: true,
      name: true,
      address: true,
      city: true,
      state: true,
      zip: true,
      slug: true,
    },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json({ restaurants })
}

/** POST — batch geocode a list of restaurant IDs */
export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { ids } = await req.json()
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'No restaurant IDs provided' }, { status: 400 })
  }

  // Cap at 50 per request
  const batch = ids.slice(0, 50)

  const restaurants = await prisma.restaurant.findMany({
    where: { id: { in: batch } },
    select: { id: true, name: true, address: true, city: true, state: true, zip: true },
  })

  const results: Array<{ id: string; name: string; status: 'fixed' | 'failed' }> = []

  for (const r of restaurants) {
    const coords = await geocode(r.address, r.city, r.state, r.zip)
    if (coords) {
      await prisma.restaurant.update({
        where: { id: r.id },
        data: { lat: coords.lat, lng: coords.lng },
      })
      results.push({ id: r.id, name: r.name, status: 'fixed' })
    } else {
      results.push({ id: r.id, name: r.name, status: 'failed' })
    }
  }

  const fixed = results.filter(r => r.status === 'fixed').length
  const failed = results.filter(r => r.status === 'failed').length

  return NextResponse.json({ results, summary: { total: results.length, fixed, failed } })
}
