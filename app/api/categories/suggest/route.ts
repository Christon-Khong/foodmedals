import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { name, iconEmoji, description } = await req.json()

  if (!name || typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 60) {
    return NextResponse.json({ error: 'Name must be 2–60 characters' }, { status: 400 })
  }

  const trimmedName = name.trim()

  // Check if a category with this name already exists
  const existing = await prisma.foodCategory.findFirst({
    where: { name: { equals: trimmedName, mode: 'insensitive' } },
  })
  if (existing) {
    return NextResponse.json({ error: 'This category already exists' }, { status: 400 })
  }

  // Check if a pending suggestion with this name already exists
  const existingSuggestion = await prisma.newCategorySuggestion.findFirst({
    where: { name: { equals: trimmedName, mode: 'insensitive' }, status: 'pending' },
  })
  if (existingSuggestion) {
    return NextResponse.json({ error: 'This category has already been suggested. Vote for it instead!' }, { status: 400 })
  }

  const suggestion = await prisma.newCategorySuggestion.create({
    data: {
      name: trimmedName,
      iconEmoji: iconEmoji?.trim() || '🍽️',
      description: description?.trim() || null,
      submittedBy: session.user.id,
    },
  })

  return NextResponse.json({ id: suggestion.id })
}
