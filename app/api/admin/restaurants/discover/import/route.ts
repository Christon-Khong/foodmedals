import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/adminAuth'
import { importRestaurants, type RestaurantImportEntry } from '@/lib/restaurant-import'

export const maxDuration = 120

export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: { restaurants?: RestaurantImportEntry[] }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { restaurants } = body

  if (!Array.isArray(restaurants) || restaurants.length === 0) {
    return NextResponse.json({ error: 'restaurants array is required' }, { status: 400 })
  }
  if (restaurants.length > 100) {
    return NextResponse.json({ error: 'Maximum 100 restaurants per request' }, { status: 400 })
  }

  const result = await importRestaurants(restaurants)
  return NextResponse.json(result)
}
