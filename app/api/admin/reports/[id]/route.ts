import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/adminAuth'
import { prisma } from '@/lib/prisma'
import { toSlug, geocode } from '@/lib/restaurant-utils'

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
  const { status, restaurantId, address, city, state, zip } = body

  if (!['resolved', 'dismissed'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  // If resolving with updated address, update the restaurant first
  if (status === 'resolved' && restaurantId && address) {
    const existing = await prisma.restaurant.findUnique({ where: { id: restaurantId } })
    if (existing) {
      const data: Record<string, unknown> = {
        address: address.trim(),
        city: city?.trim() ?? existing.city,
        state: state?.trim() ?? existing.state,
        zip: zip?.trim() ?? existing.zip,
      }

      // Regenerate slug if city changed
      if (data.city !== existing.city) {
        let slug = toSlug(existing.name, data.city as string)
        if (slug !== existing.slug) {
          const conflict = await prisma.restaurant.findUnique({ where: { slug } })
          if (conflict && conflict.id !== restaurantId) slug = `${slug}-${Date.now()}`
          data.slug = slug
        }
      }

      // Re-geocode with new address
      const coords = await geocode(
        data.address as string,
        data.city as string,
        data.state as string,
        data.zip as string,
      )
      if (coords) {
        data.lat = coords.lat
        data.lng = coords.lng
      }

      await prisma.restaurant.update({ where: { id: restaurantId }, data })
    }
  }

  await prisma.addressReport.update({
    where: { id },
    data: { status },
  })

  return NextResponse.json({ success: true })
}
