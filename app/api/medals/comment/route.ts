import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { medalId, comment } = await req.json()

  if (!medalId || !comment) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const trimmed = comment.trim()
  if (trimmed.length === 0 || trimmed.length > 500) {
    return NextResponse.json({ error: 'Comment must be 1-500 characters' }, { status: 400 })
  }

  // Verify medal belongs to user and is gold
  const medal = await prisma.medal.findUnique({
    where: { id: medalId },
    select: { userId: true, medalType: true, restaurantId: true },
  })

  if (!medal) {
    return NextResponse.json({ error: 'Medal not found' }, { status: 404 })
  }

  if (medal.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not your medal' }, { status: 403 })
  }

  if (medal.medalType !== 'gold') {
    return NextResponse.json({ error: 'Comments are only for gold medals' }, { status: 400 })
  }

  // Upsert the comment (one per medal)
  const goldComment = await prisma.goldMedalComment.upsert({
    where: { medalId },
    update: { comment: trimmed, active: true },
    create: {
      medalId,
      userId: session.user.id,
      restaurantId: medal.restaurantId,
      comment: trimmed,
    },
  })

  return NextResponse.json(goldComment)
}
