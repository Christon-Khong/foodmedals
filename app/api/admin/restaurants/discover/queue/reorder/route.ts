import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/adminAuth'
import { prisma } from '@/lib/prisma'

// PUT — receive ordered array of item IDs, bulk-update sortOrder
export async function PUT(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { orderedIds } = (await req.json()) as { orderedIds: string[] }

  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return NextResponse.json(
      { error: 'orderedIds array is required' },
      { status: 400 },
    )
  }

  // Batch update sortOrder for each item
  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.searchQueueItem.update({
        where: { id },
        data: { sortOrder: index },
      }),
    ),
  )

  return NextResponse.json({ ok: true })
}
