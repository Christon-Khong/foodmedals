import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/queries'

const ACTIVATION_THRESHOLD = 50

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  // Ensure suggestion exists and is pending
  const suggestion = await prisma.newCategorySuggestion.findUnique({
    where: { id },
    select: { status: true, name: true, iconEmoji: true, description: true },
  })
  if (!suggestion || suggestion.status !== 'pending') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Toggle vote
  const existing = await prisma.newCategorySuggestionVote.findUnique({
    where: { suggestionId_userId: { suggestionId: id, userId: session.user.id } },
  })

  if (existing) {
    await prisma.newCategorySuggestionVote.delete({ where: { id: existing.id } })
  } else {
    await prisma.newCategorySuggestionVote.create({
      data: { suggestionId: id, userId: session.user.id },
    })
  }

  const count = await prisma.newCategorySuggestionVote.count({
    where: { suggestionId: id },
  })

  // Auto-approve at threshold: create the actual FoodCategory
  let activated = false
  if (count >= ACTIVATION_THRESHOLD) {
    // Generate unique slug
    const baseSlug = slugify(suggestion.name)
    let slug = baseSlug
    let i = 1
    while (await prisma.foodCategory.findUnique({ where: { slug }, select: { id: true } })) {
      slug = `${baseSlug}-${i++}`
    }

    // Get max sort order to place at end
    const maxSort = await prisma.foodCategory.aggregate({ _max: { sortOrder: true } })
    const nextSort = (maxSort._max.sortOrder ?? 0) + 1

    await prisma.$transaction([
      prisma.foodCategory.create({
        data: {
          name: suggestion.name,
          slug,
          iconEmoji: suggestion.iconEmoji,
          description: suggestion.description,
          sortOrder: nextSort,
          status: 'active',
        },
      }),
      prisma.newCategorySuggestion.update({
        where: { id },
        data: { status: 'approved' },
      }),
    ])
    activated = true
  }

  return NextResponse.json({ voted: !existing, count, activated, threshold: ACTIVATION_THRESHOLD })
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions)
  const { id } = await params

  const count = await prisma.newCategorySuggestionVote.count({ where: { suggestionId: id } })
  let voted = false
  if (session?.user?.id) {
    const existing = await prisma.newCategorySuggestionVote.findUnique({
      where: { suggestionId_userId: { suggestionId: id, userId: session.user.id } },
    })
    voted = !!existing
  }

  return NextResponse.json({ voted, count, threshold: ACTIVATION_THRESHOLD })
}
