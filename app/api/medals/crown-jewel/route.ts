import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { medalId } = await req.json()
  if (!medalId || typeof medalId !== 'string') {
    return NextResponse.json({ error: 'medalId required' }, { status: 400 })
  }

  // Verify the medal belongs to this user and is gold
  const medal = await prisma.medal.findUnique({
    where: { id: medalId },
    select: { userId: true, medalType: true },
  })

  if (!medal || medal.userId !== session.user.id) {
    return NextResponse.json({ error: 'Medal not found' }, { status: 404 })
  }

  if (medal.medalType !== 'gold') {
    return NextResponse.json({ error: 'Only gold medals can be Crown Jewel' }, { status: 400 })
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { crownJewelMedalId: medalId },
  })

  return NextResponse.json({ ok: true })
}
