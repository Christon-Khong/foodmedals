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

  const existing = await prisma.foodCategory.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const data: Record<string, unknown> = {}

  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || body.name.trim().length === 0 || body.name.length > 100)
      return NextResponse.json({ error: 'Invalid name' }, { status: 400 })
    const conflict = await prisma.foodCategory.findFirst({
      where: { name: body.name.trim(), id: { not: id } },
    })
    if (conflict) return NextResponse.json({ error: 'A category with that name already exists' }, { status: 409 })
    data.name = body.name.trim()
  }

  if (body.slug !== undefined) {
    if (typeof body.slug !== 'string' || body.slug.trim().length === 0 || body.slug.length > 100)
      return NextResponse.json({ error: 'Invalid slug' }, { status: 400 })
    const conflict = await prisma.foodCategory.findFirst({
      where: { slug: body.slug.trim().toLowerCase(), id: { not: id } },
    })
    if (conflict) return NextResponse.json({ error: 'A category with that slug already exists' }, { status: 409 })
    data.slug = body.slug.trim().toLowerCase()
  }

  if (body.iconEmoji !== undefined) {
    if (typeof body.iconEmoji !== 'string' || body.iconEmoji.trim().length === 0)
      return NextResponse.json({ error: 'Invalid icon emoji' }, { status: 400 })
    data.iconEmoji = body.iconEmoji.trim()
  }

  if (body.description !== undefined) {
    data.description =
      typeof body.description === 'string' && body.description.length <= 500
        ? body.description.trim() || null
        : null
  }

  if (body.sortOrder !== undefined && typeof body.sortOrder === 'number') {
    data.sortOrder = body.sortOrder
  }

  if (body.status !== undefined) {
    if (!['active', 'inactive'].includes(body.status))
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    data.status = body.status
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const category = await prisma.foodCategory.update({ where: { id }, data })
  return NextResponse.json({ ok: true, category })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params

  const category = await prisma.foodCategory.findUnique({
    where: { id },
    include: {
      _count: { select: { restaurants: true, medals: true } },
    },
  })
  if (!category) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (category._count.restaurants > 0 || category._count.medals > 0) {
    return NextResponse.json({
      error: `Cannot delete: ${category._count.restaurants} restaurant(s) and ${category._count.medals} medal(s) are linked. Set status to inactive instead.`,
    }, { status: 409 })
  }

  await prisma.foodCategory.delete({ where: { id } })
  return NextResponse.json({ deleted: true })
}
