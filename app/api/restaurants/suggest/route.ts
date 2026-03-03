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

async function geocode(
  address: string,
  city: string,
  state: string,
  zip: string,
): Promise<{ lat: number; lng: number } | null> {
  try {
    const params = new URLSearchParams({
      street:       address,
      city,
      state,
      postalcode:   zip,
      countrycodes: 'us',
      format:       'json',
      limit:        '1',
    })
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?${params}`,
      {
        headers: {
          'User-Agent':      'FoodMedals/1.0 (foodmedals.com)',
          'Accept-Language': 'en',
        },
      },
    )
    if (!res.ok) return null
    const data = await res.json()
    if (!Array.isArray(data) || data.length === 0) return null
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
  } catch {
    return null
  }
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

  return NextResponse.json({ id: restaurant.id, slug: restaurant.slug }, { status: 201 })
}
