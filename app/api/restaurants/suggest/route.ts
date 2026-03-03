import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function toSlug(name: string, city: string) {
  return `${name}-${city}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { name, address, city, state, zip, websiteUrl, description } = await req.json()

  if (!name || !address || !city || !state || !zip) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Generate a unique slug
  let slug = toSlug(name, city)
  const existing = await prisma.restaurant.findUnique({ where: { slug } })
  if (existing) slug = `${slug}-${Date.now()}`

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
    },
  })

  return NextResponse.json({ id: restaurant.id, slug: restaurant.slug }, { status: 201 })
}
