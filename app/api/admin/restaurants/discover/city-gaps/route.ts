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
    select: { id: true, name: true, slug: true },
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

  // For each city, find which categories have at least one verified restaurant
  const coverageRows = await prisma.$queryRaw<
    Array<{ city: string; state: string; food_category_id: string }>
  >`
    SELECT DISTINCT r.city, r.state, rc.food_category_id
    FROM restaurants r
    JOIN restaurant_categories rc ON rc.restaurant_id = r.id
    WHERE r.status = 'active'
      AND rc.verified = true
  `

  // Build a set of covered city+category combos
  const coveredSet = new Set(
    coverageRows.map(r => `${r.city}|${r.state}|${r.food_category_id}`)
  )

  const categoryMap = new Map(categories.map(c => [c.id, c]))

  // For each city, find missing categories
  const cities = cityRows
    .map(({ city, state }) => {
      const missingCategories = categories
        .filter(cat => !coveredSet.has(`${city}|${state}|${cat.id}`))
        .map(cat => ({ name: cat.name, slug: cat.slug }))

      return {
        city,
        state,
        totalCategories: categories.length,
        coveredCategories: categories.length - missingCategories.length,
        missingCategories,
      }
    })
    .filter(c => c.missingCategories.length > 0)
    .sort((a, b) => b.missingCategories.length - a.missingCategories.length)

  return NextResponse.json({ cities, totalCategories: categories.length })
}
