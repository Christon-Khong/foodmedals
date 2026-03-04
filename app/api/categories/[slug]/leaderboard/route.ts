import { NextRequest, NextResponse } from 'next/server'
import { getCategoryBySlug, getLeaderboard, getLeaderboardNearMe } from '@/lib/queries'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const sp   = req.nextUrl.searchParams
  const currentYear = new Date().getFullYear()
  const year = parseInt(sp.get('year') ?? String(currentYear), 10)

  if (isNaN(year) || year < 2020 || year > currentYear + 1) {
    return NextResponse.json({ error: 'Invalid year' }, { status: 400 })
  }

  const category = await getCategoryBySlug(slug)
  if (!category) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const latStr = sp.get('lat')
  const lngStr = sp.get('lng')

  if (latStr && lngStr) {
    // Near-me mode — Haversine query, never cached
    const lat    = parseFloat(latStr)
    const lng    = parseFloat(lngStr)
    const radius = Math.min(parseFloat(sp.get('radius') ?? '10'), 100)

    if (isNaN(lat) || isNaN(lng) || isNaN(radius) || lat < -90 || lat > 90 || lng < -180 || lng > 180 || radius < 1) {
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

  if (state && state.length > 50) {
    return NextResponse.json({ error: 'Invalid state' }, { status: 400 })
  }
  if (city && city.length > 100) {
    return NextResponse.json({ error: 'Invalid city' }, { status: 400 })
  }

  const rows = await getLeaderboard(category.id, year, city, state)
  return NextResponse.json({ category, year, rows })
}
