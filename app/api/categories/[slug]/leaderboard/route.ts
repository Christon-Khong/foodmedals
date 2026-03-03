import { NextRequest, NextResponse } from 'next/server'
import { getCategoryBySlug, getLeaderboard, getLeaderboardNearMe } from '@/lib/queries'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const sp   = req.nextUrl.searchParams
  const year = parseInt(sp.get('year') ?? String(new Date().getFullYear()), 10)

  const category = await getCategoryBySlug(slug)
  if (!category) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const latStr = sp.get('lat')
  const lngStr = sp.get('lng')

  if (latStr && lngStr) {
    // Near-me mode — Haversine query, never cached
    const lat    = parseFloat(latStr)
    const lng    = parseFloat(lngStr)
    const radius = parseFloat(sp.get('radius') ?? '10')

    if (isNaN(lat) || isNaN(lng) || isNaN(radius)) {
      return NextResponse.json({ error: 'Invalid lat/lng/radius' }, { status: 400 })
    }

    const rows = await getLeaderboardNearMe(category.id, year, lat, lng, radius)
    return NextResponse.json(
      { category, year, rows, nearMe: true, radius },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  }

  // City or statewide mode — existing behavior
  const city  = sp.get('city')  ?? undefined
  const state = sp.get('state') ?? undefined

  const rows = await getLeaderboard(category.id, year, city, state)
  return NextResponse.json({ category, year, rows })
}
