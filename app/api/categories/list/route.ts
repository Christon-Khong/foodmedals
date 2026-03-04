import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const categories = await prisma.foodCategory.findMany({
    where:   { status: 'active' },
    select:  { id: true, name: true, iconEmoji: true, iconUrl: true, slug: true },
    orderBy: { sortOrder: 'asc' },
  })

  return NextResponse.json(categories)
}
