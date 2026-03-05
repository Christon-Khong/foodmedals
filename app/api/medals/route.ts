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

  // If reassigning a gold medal, deactivate old comment & check for existing comment on new restaurant
  let existingComment: string | null = null
  let existingPhotoUrl: string | null = null
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
      // Gold is being moved to a different restaurant — deactivate old comment & disconnect from medal
      await prisma.goldMedalComment.updateMany({
        where: {
          userId,
          foodCategoryId,
          restaurantId: existingGold.restaurantId,
          year,
        },
        data: { active: false, medalId: null },
      })
    }

    // Check if there's a preserved comment for the new restaurant
    const preserved = await prisma.goldMedalComment.findUnique({
      where: {
        userId_foodCategoryId_restaurantId_year: {
          userId,
          foodCategoryId,
          restaurantId,
          year,
        },
      },
      select: { id: true, comment: true, photoUrl: true },
    })

    if (preserved) {
      existingComment = preserved.comment
      existingPhotoUrl = preserved.photoUrl
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

  // Re-link any preserved comment to this medal and reactivate it
  if (medalType === 'gold' && existingComment !== null) {
    await prisma.goldMedalComment.update({
      where: {
        userId_foodCategoryId_restaurantId_year: {
          userId,
          foodCategoryId,
          restaurantId,
          year,
        },
      },
      data: { active: true, medalId: medal.id },
    })
  }

  return NextResponse.json({
    ...medal,
    existingComment,
    existingPhotoUrl,
  })
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

  // If deleting a gold medal, disconnect & deactivate its comment (preserved for re-award)
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
      select: { id: true, restaurantId: true },
    })

    if (existingGold) {
      // Disconnect comment from medal (so cascade delete doesn't remove it) and deactivate
      await prisma.goldMedalComment.updateMany({
        where: {
          userId: session.user.id,
          foodCategoryId,
          restaurantId: existingGold.restaurantId,
          year,
        },
        data: { active: false, medalId: null },
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
