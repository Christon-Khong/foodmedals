import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/adminAuth'
import { prisma } from '@/lib/prisma'

// PATCH — edit city, state, or resultsPerCategory of a pending item
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()

  // Only allow editing pending items
  const existing = await prisma.searchQueueItem.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  if (existing.status !== 'pending') {
    return NextResponse.json(
      { error: 'Can only edit pending items' },
      { status: 400 },
    )
  }

  const data: Record<string, unknown> = {}
  if (body.city !== undefined) data.city = String(body.city).trim()
  if (body.state !== undefined)
    data.state = String(body.state).trim().toUpperCase()
  if (body.resultsPerCategory !== undefined)
    data.resultsPerCategory = Math.min(
      Math.max(Number(body.resultsPerCategory) || 5, 1),
      10,
    )

  if (Object.keys(data).length === 0) {
    return NextResponse.json(
      { error: 'No valid fields to update' },
      { status: 400 },
    )
  }

  const item = await prisma.searchQueueItem.update({
    where: { id },
    data,
  })

  return NextResponse.json({ item })
}

// DELETE — remove an item from the queue
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  await prisma.searchQueueItem.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
