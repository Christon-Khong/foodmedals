import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Sign in to report an address' }, { status: 401 })
  }

  const { id: restaurantId } = await params

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { id: true, status: true },
  })

  if (!restaurant || restaurant.status !== 'active') {
    return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
  }

  let body: { googleMapsUrl?: string; note?: string }
  try {
    body = await req.json()
  } catch {
    body = {}
  }

  const googleMapsUrl = body.googleMapsUrl?.trim() || null
  const note = body.note?.trim().slice(0, 200) || null

  await prisma.addressReport.upsert({
    where: {
      restaurantId_userId: {
        restaurantId,
        userId: session.user.id,
      },
    },
    create: {
      restaurantId,
      userId: session.user.id,
      googleMapsUrl,
      note,
      status: 'pending',
    },
    update: {
      googleMapsUrl,
      note,
      status: 'pending',
    },
  })

  return NextResponse.json({ success: true })
}
