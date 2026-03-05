import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get('name')?.trim()
  const city = req.nextUrl.searchParams.get('city')?.trim()

  if (!name || !city) {
    return NextResponse.json({ match: null })
  }

  const match = await prisma.restaurant.findFirst({
    where: {
      name: { equals: name, mode: 'insensitive' },
      city: { equals: city, mode: 'insensitive' },
    },
    select: { name: true, slug: true, city: true, state: true, status: true },
  })

  return NextResponse.json({ match: match ?? null })
}
