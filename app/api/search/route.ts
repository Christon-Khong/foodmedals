import { NextRequest, NextResponse } from 'next/server'
import { searchAll, searchFull } from '@/lib/queries'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (q.length < 2 || q.length > 100) return NextResponse.json({ restaurants: [], categories: [] })

  const full = req.nextUrl.searchParams.get('full') === '1'

  if (full) {
    const filters = {
      state: req.nextUrl.searchParams.get('state') || undefined,
      city: req.nextUrl.searchParams.get('city') || undefined,
      categorySlug: req.nextUrl.searchParams.get('category') || undefined,
    }
    const results = await searchFull(q, filters)
    return NextResponse.json(results)
  }

  const results = await searchAll(q)
  return NextResponse.json(results)
}
