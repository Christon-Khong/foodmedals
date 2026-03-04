import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { toSlug, geocode } from '@/lib/restaurant-utils'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { name, address, city, state, zip, websiteUrl, description, categoryIds } = await req.json()

  if (!name || !address || !city || !state || !zip) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
    return NextResponse.json({ error: 'Select at least one category' }, { status: 400 })
  }

  // Field length limits
  if (name.length > 200 || address.length > 300 || city.length > 100 || state.length > 50 || zip.length > 20) {
    return NextResponse.json({ error: 'Field too long' }, { status: 400 })
  }
  if (description && description.length > 1000) {
    return NextResponse.json({ error: 'Description too long (max 1000 chars)' }, { status: 400 })
  }
  if (websiteUrl && websiteUrl.length > 500) {
    return NextResponse.json({ error: 'URL too long' }, { status: 400 })
  }
  if (categoryIds.length > 10) {
    return NextResponse.json({ error: 'Too many categories (max 10)' }, { status: 400 })
  }

  // Generate a unique slug
  let slug = toSlug(name, city)
  const existing = await prisma.restaurant.findUnique({ where: { slug } })
  if (existing) slug = `${slug}-${Date.now()}`

  // Geocode the address via OpenStreetMap Nominatim (best-effort — won't block creation if it fails)
  const coords = await geocode(address.trim(), city.trim(), state.trim(), zip.trim())

  const restaurant = await prisma.restaurant.create({
    data: {
      name:        name.trim(),
      slug,
      address:     address.trim(),
      city:        city.trim(),
      state:       state.trim(),
      zip:         zip.trim(),
      websiteUrl:  websiteUrl?.trim() || null,
      description: description?.trim() || null,
      status:      'pending_review',
      submittedBy: session.user.id,
      lat:         coords?.lat ?? null,
      lng:         coords?.lng ?? null,
    },
  })

  // Create unverified category links
  if (categoryIds.length > 0) {
    await prisma.restaurantCategory.createMany({
      data: categoryIds.map((foodCategoryId: string) => ({
        restaurantId:   restaurant.id,
        foodCategoryId,
        submittedBy:    session.user.id,
        verified:       false,
      })),
      skipDuplicates: true,
    })
  }

  return NextResponse.json({ id: restaurant.id, slug: restaurant.slug }, { status: 201 })
}
