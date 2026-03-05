import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/adminAuth'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/queries'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params

  const suggestion = await prisma.newCategorySuggestion.findUnique({
    where: { id },
    select: { status: true, name: true, iconEmoji: true, description: true },
  })
  if (!suggestion) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  if (suggestion.status !== 'pending') {
    return NextResponse.json({ error: 'Already processed' }, { status: 400 })
  }

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

  const [category] = await prisma.$transaction([
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

  return NextResponse.json({ approved: true, categoryId: category.id, slug })
}
