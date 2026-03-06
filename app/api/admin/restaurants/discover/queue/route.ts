import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/adminAuth'
import { prisma } from '@/lib/prisma'

// GET — list all queue items ordered by sortOrder
export async function GET() {
  const session = await getAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const items = await prisma.searchQueueItem.findMany({
    orderBy: { sortOrder: 'asc' },
  })

  return NextResponse.json({ items })
}

// POST — add a new city to the queue
export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { city, state, resultsPerCategory, categorySlug, priority } = body

  if (!city?.trim() || !state?.trim()) {
    return NextResponse.json(
      { error: 'city and state are required' },
      { status: 400 },
    )
  }

  let sortOrder: number
  if (priority) {
    // Insert at top: get min sortOrder and go one below
    const first = await prisma.searchQueueItem.findFirst({
      orderBy: { sortOrder: 'asc' },
      select: { sortOrder: true },
    })
    sortOrder = (first?.sortOrder ?? 0) - 1
  } else {
    // Append at end: get max sortOrder
    const last = await prisma.searchQueueItem.findFirst({
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    })
    sortOrder = (last?.sortOrder ?? -1) + 1
  }

  const item = await prisma.searchQueueItem.create({
    data: {
      city: city.trim(),
      state: state.trim().toUpperCase(),
      resultsPerCategory: resultsPerCategory ?? 5,
      categorySlug: categorySlug || null,
      sortOrder,
      status: 'pending',
    },
  })

  return NextResponse.json({ item }, { status: 201 })
}
