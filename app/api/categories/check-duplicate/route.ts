import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get('name')?.trim()

  if (!name || name.length < 2) {
    return NextResponse.json({ match: null })
  }

  // Check active categories
  const existingCategory = await prisma.foodCategory.findFirst({
    where: { name: { equals: name, mode: 'insensitive' }, status: 'active' },
    select: { name: true, slug: true },
  })
  if (existingCategory) {
    return NextResponse.json({
      match: { name: existingCategory.name, type: 'category', slug: existingCategory.slug },
    })
  }

  // Check pending suggestions
  const existingSuggestion = await prisma.newCategorySuggestion.findFirst({
    where: { name: { equals: name, mode: 'insensitive' }, status: 'pending' },
    select: { name: true, id: true },
  })
  if (existingSuggestion) {
    return NextResponse.json({
      match: { name: existingSuggestion.name, type: 'suggestion', id: existingSuggestion.id },
    })
  }

  return NextResponse.json({ match: null })
}
