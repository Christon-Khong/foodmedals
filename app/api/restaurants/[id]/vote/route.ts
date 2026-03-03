import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  // Ensure restaurant exists and is pending
  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
    select: { status: true },
  })
  if (!restaurant || restaurant.status !== 'pending_review') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Toggle vote
  const existing = await prisma.suggestionVote.findUnique({
    where: { restaurantId_userId: { restaurantId: id, userId: session.user.id } },
  })

  if (existing) {
    await prisma.suggestionVote.delete({ where: { id: existing.id } })
    const count = await prisma.suggestionVote.count({ where: { restaurantId: id } })
    return NextResponse.json({ voted: false, count })
  } else {
    await prisma.suggestionVote.create({
      data: { restaurantId: id, userId: session.user.id },
    })
    const count = await prisma.suggestionVote.count({ where: { restaurantId: id } })
    return NextResponse.json({ voted: true, count })
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions)
  const { id } = await params

  const count = await prisma.suggestionVote.count({ where: { restaurantId: id } })
  let voted = false
  if (session?.user?.id) {
    const existing = await prisma.suggestionVote.findUnique({
      where: { restaurantId_userId: { restaurantId: id, userId: session.user.id } },
    })
    voted = !!existing
  }

  return NextResponse.json({ voted, count })
}
