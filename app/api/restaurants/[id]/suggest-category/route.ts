import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const ACTIVATION_THRESHOLD = 5

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: restaurantId } = await params
  const { categoryId } = await req.json()

  if (!categoryId || typeof categoryId !== 'string') {
    return NextResponse.json({ error: 'categoryId required' }, { status: 400 })
  }

  // Verify restaurant and category exist
  const [restaurant, category] = await Promise.all([
    prisma.restaurant.findUnique({ where: { id: restaurantId }, select: { id: true, status: true } }),
    prisma.foodCategory.findUnique({ where: { id: categoryId }, select: { id: true, status: true } }),
  ])

  if (!restaurant || restaurant.status !== 'active') {
    return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
  }
  if (!category || category.status !== 'active') {
    return NextResponse.json({ error: 'Category not found' }, { status: 404 })
  }

  // Check if category is already verified for this restaurant
  const existingLink = await prisma.restaurantCategory.findUnique({
    where: { restaurantId_foodCategoryId: { restaurantId, foodCategoryId: categoryId } },
  })
  if (existingLink?.verified) {
    return NextResponse.json({ error: 'Category already active' }, { status: 400 })
  }

  // Ensure the RestaurantCategory row exists (unverified)
  if (!existingLink) {
    await prisma.restaurantCategory.create({
      data: {
        restaurantId,
        foodCategoryId: categoryId,
        verified: false,
        submittedBy: session.user.id,
      },
    })
  }

  // Toggle vote
  const existing = await prisma.categorySuggestionVote.findUnique({
    where: {
      restaurantId_foodCategoryId_userId: {
        restaurantId,
        foodCategoryId: categoryId,
        userId: session.user.id,
      },
    },
  })

  if (existing) {
    await prisma.categorySuggestionVote.delete({ where: { id: existing.id } })
  } else {
    await prisma.categorySuggestionVote.create({
      data: { restaurantId, foodCategoryId: categoryId, userId: session.user.id },
    })
  }

  const count = await prisma.categorySuggestionVote.count({
    where: { restaurantId, foodCategoryId: categoryId },
  })

  // Auto-activate at threshold
  let activated = false
  if (count >= ACTIVATION_THRESHOLD) {
    await prisma.restaurantCategory.update({
      where: { restaurantId_foodCategoryId: { restaurantId, foodCategoryId: categoryId } },
      data: { verified: true },
    })
    activated = true
  }

  return NextResponse.json({
    voted: !existing,
    count,
    activated,
  })
}
