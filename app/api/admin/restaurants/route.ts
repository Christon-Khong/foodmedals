import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/adminAuth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const restaurants = await prisma.restaurant.findMany({
    where: { status: 'active' },
    select: {
      id: true,
      name: true,
      slug: true,
      address: true,
      city: true,
      state: true,
      zip: true,
      lat: true,
      lng: true,
    },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json({ restaurants })
}
