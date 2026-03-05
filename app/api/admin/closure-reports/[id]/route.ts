import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/adminAuth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const { status } = await req.json()

  if (!['resolved', 'dismissed'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const report = await prisma.closureReport.findUnique({
    where: { id },
    select: { restaurantId: true },
  })

  if (!report) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 })
  }

  // If resolving, mark the restaurant as closed
  if (status === 'resolved') {
    await prisma.restaurant.update({
      where: { id: report.restaurantId },
      data: { status: 'closed' },
    })
  }

  await prisma.closureReport.update({
    where: { id },
    data: { status },
  })

  return NextResponse.json({ success: true })
}
