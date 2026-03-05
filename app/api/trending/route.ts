import { NextRequest, NextResponse } from 'next/server'
import { getTopRestaurantsPerCategoryNearMe } from '@/lib/queries'

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const lat = Number(sp.get('lat'))
  const lng = Number(sp.get('lng'))
  const radius = Number(sp.get('radius') || '25')
  const year = Number(sp.get('year') || new Date().getFullYear())

  if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return NextResponse.json({ error: 'Invalid lat/lng' }, { status: 400 })
  }
  if (isNaN(radius) || radius < 1 || radius > 100) {
    return NextResponse.json({ error: 'Radius must be 1-100' }, { status: 400 })
  }

  const categories = await getTopRestaurantsPerCategoryNearMe(year, lat, lng, radius)
  return NextResponse.json(categories, {
    headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300' },
  })
}
