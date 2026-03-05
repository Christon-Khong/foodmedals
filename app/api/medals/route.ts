import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { foodCategoryId, restaurantId, medalType, year } = await req.json()

  if (!foodCategoryId || !restaurantId || !medalType || !year) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (!['gold', 'silver', 'bronze'].includes(medalType)) {
    return NextResponse.json({ error: 'Invalid medal type' }, { status: 400 })
  }

  const currentYear = new Date().getFullYear()
  if (typeof year !== 'number' || year < 2020 || year > currentYear + 1) {
    return NextResponse.json({ error: 'Invalid year' }, { status: 400 })
  }

  const userId = session.user.id

  // If reassigning a gold medal, deactivate any existing comment on the old gold medal
  if (medalType === 'gold') {
    const existingGold = await prisma.medal.findUnique({
      where: {
        userId_foodCategoryId_medalType_year: {
          userId,
          foodCategoryId,
          medalType: 'gold',
          year,
        },
      },
      select: { id: true, restaurantId: true },
    })

    if (existingGold && existingGold.restaurantId !== restaurantId) {
      // Gold is being moved to a different restaurant — deactivate old comment
      await prisma.goldMedalComment.updateMany({
        where: { medalId: existingGold.id },
        data: { active: false },
      })
    }
  }

  // Business rule: user cannot give two different medals to the same restaurant
  // in the same category+year. If they already have a different medal for this
  // restaurant, remove it first.
  await prisma.medal.deleteMany({
    where: {
      userId,
      foodCategoryId,
      restaurantId,
      year,
      NOT: { medalType },
    },
  })

  // Upsert: one gold/silver/bronze per user per category per year
  const medal = await prisma.medal.upsert({
    where: {
      userId_foodCategoryId_medalType_year: {
        userId,
        foodCategoryId,
        medalType,
        year,
      },
    },
    update: { restaurantId },
    create: { userId, foodCategoryId, restaurantId, medalType, year },
    include: { restaurant: true },
  })

  return NextResponse.json(medal)
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { foodCategoryId, medalType, year } = await req.json()

  if (!foodCategoryId || !medalType || !year) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (!['gold', 'silver', 'bronze'].includes(medalType)) {
    return NextResponse.json({ error: 'Invalid medal type' }, { status: 400 })
  }

  const currentYear = new Date().getFullYear()
  if (typeof year !== 'number' || year < 2020 || year > currentYear + 1) {
    return NextResponse.json({ error: 'Invalid year' }, { status: 400 })
  }

  // If deleting a gold medal, deactivate its comment first
  if (medalType === 'gold') {
    const existingGold = await prisma.medal.findUnique({
      where: {
        userId_foodCategoryId_medalType_year: {
          userId: session.user.id,
          foodCategoryId,
          medalType: 'gold',
          year,
        },
      },
      select: { id: true },
    })

    if (existingGold) {
      await prisma.goldMedalComment.updateMany({
        where: { medalId: existingGold.id },
        data: { active: false },
      })
    }
  }

  await prisma.medal.deleteMany({
    where: {
      userId: session.user.id,
      foodCategoryId,
      medalType,
      year,
    },
  })

  return NextResponse.json({ ok: true })
}
