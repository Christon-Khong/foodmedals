import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/adminAuth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/restaurants/discover/batches/[id] — load a batch with its restaurants
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const batch = await prisma.discoveryBatch.findUnique({ where: { id } })
  if (!batch) {
    return NextResponse.json({ error: 'Batch not found' }, { status: 404 })
  }

  return NextResponse.json({ batch })
}

// PATCH /api/admin/restaurants/discover/batches/[id] — update batch status
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
  const { status } = body

  if (!['pending', 'imported', 'partial'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const batch = await prisma.discoveryBatch.update({
    where: { id },
    data: { status },
  })

  return NextResponse.json({ ok: true, batch })
}

// DELETE /api/admin/restaurants/discover/batches/[id] — remove a batch
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  await prisma.discoveryBatch.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
