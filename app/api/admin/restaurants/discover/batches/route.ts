import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/adminAuth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/restaurants/discover/batches — list all batches
export async function GET() {
  const session = await getAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const batches = await prisma.discoveryBatch.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      city: true,
      state: true,
      resultsPerCategory: true,
      totalResults: true,
      uniqueRestaurants: true,
      categoriesSearched: true,
      status: true,
      createdAt: true,
    },
  })

  return NextResponse.json({ batches })
}
