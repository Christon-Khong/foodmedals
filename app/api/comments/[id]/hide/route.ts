import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/adminAuth'
import { prisma } from '@/lib/prisma'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  const comment = await prisma.goldMedalComment.findUnique({
    where: { id },
    select: { id: true, active: true },
  })

  if (!comment) {
    return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
  }

  await prisma.goldMedalComment.update({
    where: { id },
    data: { active: false },
  })

  return NextResponse.json({ success: true })
}
