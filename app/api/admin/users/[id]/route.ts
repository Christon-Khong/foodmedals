import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/adminAuth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const body = await req.json()

  if (typeof body.isAdmin !== 'boolean') {
    return NextResponse.json({ error: 'isAdmin must be a boolean' }, { status: 400 })
  }

  // Prevent removing your own admin access
  const target = await prisma.user.findUnique({ where: { id } })
  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  if (target.email === session.user?.email && !body.isAdmin) {
    return NextResponse.json({ error: 'Cannot remove your own admin access' }, { status: 400 })
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { isAdmin: body.isAdmin },
    select: { id: true, isAdmin: true },
  })

  return NextResponse.json(updated)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const target = await prisma.user.findUnique({ where: { id } })
  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Prevent deleting yourself
  if (target.email === session.user?.email) {
    return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
  }

  // Delete related data first, then user
  await prisma.$transaction([
    prisma.suggestionVote.deleteMany({ where: { userId: id } }),
    prisma.medal.deleteMany({ where: { userId: id } }),
    prisma.restaurantCategory.deleteMany({ where: { submittedBy: id } }),
    prisma.restaurant.updateMany({ where: { submittedBy: id }, data: { submittedBy: null } }),
    prisma.account.deleteMany({ where: { userId: id } }),
    prisma.user.delete({ where: { id } }),
  ])

  return NextResponse.json({ ok: true })
}
