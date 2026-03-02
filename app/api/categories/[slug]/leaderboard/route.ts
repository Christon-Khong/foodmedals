import { NextRequest, NextResponse } from 'next/server'
import { getCategoryBySlug, getLeaderboard } from '@/lib/queries'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const year = parseInt(req.nextUrl.searchParams.get('year') ?? String(new Date().getFullYear()), 10)

  const category = await getCategoryBySlug(slug)
  if (!category) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const rows = await getLeaderboard(category.id, year)
  return NextResponse.json({ category, year, rows })
}
