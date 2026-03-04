import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/adminAuth'
import { prisma } from '@/lib/prisma'

const VALID_STATUSES = ['active', 'pending_review', 'inactive'] as const
type ValidStatus = typeof VALID_STATUSES[number]

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const body = await req.json()

  // Address update
  if (body.address !== undefined) {
    const data: Record<string, string | number | null> = {}
    if (typeof body.address === 'string' && body.address.length <= 200) data.address = body.address
    if (typeof body.city === 'string' && body.city.length <= 100) data.city = body.city
    if (typeof body.state === 'string' && body.state.length <= 50) data.state = body.state
    if (typeof body.zip === 'string' && body.zip.length <= 20) data.zip = body.zip
    if (typeof body.lat === 'number') data.lat = body.lat
    if (typeof body.lng === 'number') data.lng = body.lng
    if (body.lat === null) data.lat = null
    if (body.lng === null) data.lng = null

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No valid fields' }, { status: 400 })
    }

    const restaurant = await prisma.restaurant.update({ where: { id }, data })
    return NextResponse.json(restaurant)
  }

  // Status update
  const { status } = body
  if (!VALID_STATUSES.includes(status as ValidStatus)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const restaurant = await prisma.restaurant.update({
    where: { id },
    data:  { status },
  })

  // Auto-verify category links when approving
  if (status === 'active') {
    await prisma.restaurantCategory.updateMany({
      where: { restaurantId: id },
      data:  { verified: true },
    })
  }

  return NextResponse.json(restaurant)
}
