import { NextRequest, NextResponse } from 'next/server'
import { getRestaurantHighlights } from '@/lib/queries'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const url = req.nextUrl.searchParams

  const limit  = Math.min(parseInt(url.get('limit') ?? '10', 10), 50)
  const offset = Math.max(parseInt(url.get('offset') ?? '0', 10), 0)
  const sort   = url.get('sort') === 'newest' ? 'newest' as const : 'popular' as const

  const { highlights, total } = await getRestaurantHighlights(id, { limit, offset, sort })

  return NextResponse.json({
    highlights: highlights.map(h => ({
      ...h,
      createdAt: h.createdAt.toISOString(),
    })),
    total,
    hasMore: offset + highlights.length < total,
  })
}
