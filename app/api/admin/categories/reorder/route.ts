import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/adminAuth'
import { prisma } from '@/lib/prisma'

/** PATCH: Bulk-update sortOrder for categories.
 *  Body: { order: [{ id: string, sortOrder: number }] }
 */
export async function PATCH(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { order } = await req.json()
  if (!Array.isArray(order) || order.length === 0) {
    return NextResponse.json({ error: 'order array required' }, { status: 400 })
  }

  await prisma.$transaction(
    order.map((item: { id: string; sortOrder: number }) =>
      prisma.foodCategory.update({
        where: { id: item.id },
        data: { sortOrder: item.sortOrder },
      })
    )
  )

  return NextResponse.json({ ok: true })
}
