import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/adminAuth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Get all active categories
  const categories = await prisma.foodCategory.findMany({
    where: { status: 'active' },
    select: { id: true, name: true, slug: true, iconEmoji: true },
    orderBy: { sortOrder: 'asc' },
  })

  // Get all distinct city+state pairs from active restaurants
  const cityRows = await prisma.$queryRaw<
    Array<{ city: string; state: string }>
  >`
    SELECT DISTINCT city, state
    FROM restaurants
    WHERE status = 'active'
    ORDER BY state, city
  `

  // For each city+category combo, check if there's at least one verified restaurant
  const coverageRows = await prisma.$queryRaw<
    Array<{ city: string; state: string; food_category_id: string }>
  >`
    SELECT DISTINCT r.city, r.state, rc.food_category_id
    FROM restaurants r
    JOIN restaurant_categories rc ON rc.restaurant_id = r.id
    WHERE r.status = 'active'
      AND rc.verified = true
  `

  const coveredSet = new Set(
    coverageRows.map(r => `${r.city}|${r.state}|${r.food_category_id}`)
  )

  const totalCities = cityRows.length

  // For each category, find which cities are missing coverage
  const result = categories
    .map(cat => {
      const missingCities = cityRows
        .filter(({ city, state }) => !coveredSet.has(`${city}|${state}|${cat.id}`))
        .map(({ city, state }) => ({ city, state }))

      return {
        name: cat.name,
        slug: cat.slug,
        iconEmoji: cat.iconEmoji,
        totalCities,
        coveredCities: totalCities - missingCities.length,
        missingCities,
      }
    })
    .filter(c => c.missingCities.length > 0)
    .sort((a, b) => b.missingCities.length - a.missingCities.length)

  return NextResponse.json({ categories: result, totalCities })
}
