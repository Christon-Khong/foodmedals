import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/adminAuth'
import { prisma } from '@/lib/prisma'
import { toSlug, geocodeWithQuota } from '@/lib/restaurant-utils'

const VALID_STATUSES = ['active', 'pending_review', 'inactive'] as const
type ValidStatus = (typeof VALID_STATUSES)[number]

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const body = await req.json()

  const existing = await prisma.restaurant.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Build update data
  const data: Record<string, unknown> = {}

  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || body.name.trim().length === 0 || body.name.length > 200)
      return NextResponse.json({ error: 'Invalid name' }, { status: 400 })
    data.name = body.name.trim()
  }
  if (body.address !== undefined && typeof body.address === 'string' && body.address.length <= 300)
    data.address = body.address.trim()
  if (body.city !== undefined && typeof body.city === 'string' && body.city.length <= 100)
    data.city = body.city.trim()
  if (body.state !== undefined && typeof body.state === 'string' && body.state.length <= 50)
    data.state = body.state.trim()
  if (body.zip !== undefined && typeof body.zip === 'string' && body.zip.length <= 20)
    data.zip = body.zip.trim()
  if (body.description !== undefined)
    data.description =
      typeof body.description === 'string' && body.description.length <= 1000
        ? body.description.trim() || null
        : null
  if (body.websiteUrl !== undefined)
    data.websiteUrl =
      typeof body.websiteUrl === 'string' && body.websiteUrl.length <= 500
        ? body.websiteUrl.trim() || null
        : null

  // Status
  if (body.status !== undefined) {
    if (!VALID_STATUSES.includes(body.status as ValidStatus))
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    data.status = body.status
  }

  // Slug regeneration when name or city changes
  if (data.name || data.city) {
    const newName = (data.name as string) ?? existing.name
    const newCity = (data.city as string) ?? existing.city
    let slug = toSlug(newName, newCity)
    if (slug !== existing.slug) {
      const conflict = await prisma.restaurant.findUnique({ where: { slug } })
      if (conflict && conflict.id !== id) slug = `${slug}-${Date.now()}`
      data.slug = slug
    }
  }

  // Re-geocode when address fields change
  if (data.address || data.city || data.state || data.zip) {
    const coords = await geocodeWithQuota(
      (data.address as string) ?? existing.address,
      (data.city as string) ?? existing.city,
      (data.state as string) ?? existing.state,
      (data.zip as string) ?? existing.zip,
    )
    if (coords) {
      data.lat = coords.lat
      data.lng = coords.lng
    }
  }

  // When approving a restaurant that has no coordinates, geocode it now
  if (data.status === 'active' && existing.lat == null && existing.lng == null && !data.lat && !data.lng) {
    const coords = await geocodeWithQuota(
      existing.address,
      existing.city,
      existing.state,
      existing.zip,
    )
    if (coords) {
      data.lat = coords.lat
      data.lng = coords.lng
    }
  }

  // Explicit lat/lng overrides
  if (typeof body.lat === 'number') data.lat = body.lat
  if (typeof body.lng === 'number') data.lng = body.lng
  if (body.lat === null) data.lat = null
  if (body.lng === null) data.lng = null

  // Update restaurant
  const restaurant = await prisma.restaurant.update({ where: { id }, data })

  // Auto-verify category links when approving
  if (data.status === 'active') {
    await prisma.restaurantCategory.updateMany({
      where: { restaurantId: id },
      data: { verified: true },
    })
  }

  // Category sync (if categoryIds provided)
  if (Array.isArray(body.categoryIds)) {
    const desiredIds: string[] = body.categoryIds
    const currentLinks = await prisma.restaurantCategory.findMany({
      where: { restaurantId: id },
      select: { id: true, foodCategoryId: true },
    })
    const currentIds = currentLinks.map((l) => l.foodCategoryId)

    // Delete removed categories
    const toRemove = currentLinks.filter((l) => !desiredIds.includes(l.foodCategoryId))
    if (toRemove.length > 0) {
      await prisma.restaurantCategory.deleteMany({
        where: { id: { in: toRemove.map((l) => l.id) } },
      })
    }

    // Add new categories
    const toAdd = desiredIds.filter((cid) => !currentIds.includes(cid))
    if (toAdd.length > 0) {
      await prisma.restaurantCategory.createMany({
        data: toAdd.map((foodCategoryId) => ({
          restaurantId: id,
          foodCategoryId,
          verified: restaurant.status === 'active',
        })),
        skipDuplicates: true,
      })
    }
  }

  return NextResponse.json(restaurant)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params

  const existing = await prisma.restaurant.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Medal and RestaurantCategory don't cascade — delete explicitly
  // SuggestionVote has onDelete: Cascade so it auto-deletes
  await prisma.$transaction([
    prisma.medal.deleteMany({ where: { restaurantId: id } }),
    prisma.restaurantCategory.deleteMany({ where: { restaurantId: id } }),
    prisma.restaurant.delete({ where: { id } }),
  ])

  return NextResponse.json({ deleted: true })
}
