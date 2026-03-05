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
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: commentId } = await params

  // Verify comment exists and is active
  const comment = await prisma.goldMedalComment.findUnique({
    where: { id: commentId },
    select: { id: true, active: true },
  })

  if (!comment || !comment.active) {
    return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
  }

  // Toggle upvote
  const existing = await prisma.commentUpvote.findUnique({
    where: {
      commentId_userId: {
        commentId,
        userId: session.user.id,
      },
    },
  })

  if (existing) {
    // Remove upvote
    await prisma.commentUpvote.delete({
      where: { id: existing.id },
    })
  } else {
    // Add upvote
    await prisma.commentUpvote.create({
      data: {
        commentId,
        userId: session.user.id,
      },
    })
  }

  // Return new count
  const count = await prisma.commentUpvote.count({
    where: { commentId },
  })

  return NextResponse.json({ upvoted: !existing, count })
}
