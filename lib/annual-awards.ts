import { prisma } from './prisma'
import { getLeaderboard, getCitiesForCategory, getStatesForCategory, getAllActiveCategories } from './queries'

type AwardInsert = {
  year: number
  restaurantId: string
  foodCategoryId: string
  rank: number
  geoScope: string
  geoValue: string | null
  geoState: string | null
  totalScore: number
}

export type GenerationResult = {
  year: number
  totalAwards: number
  categoriesProcessed: number
  breakdown: { overall: number; state: number; city: number }
}

export async function generateAnnualAwards(year: number): Promise<GenerationResult> {
  const currentUTCYear = new Date().getUTCFullYear()
  if (year >= currentUTCYear) {
    throw new Error(`Cannot generate awards for ${year} — year is not yet complete`)
  }

  const categories = await getAllActiveCategories()
  const allAwards: AwardInsert[] = []
  const breakdown = { overall: 0, state: 0, city: 0 }

  for (const cat of categories) {
    // Overall top 3
    const overallRows = await getLeaderboard(cat.id, year)
    const overallTop = overallRows.filter(r => r.totalScore >= 1).slice(0, 3)
    for (let i = 0; i < overallTop.length; i++) {
      allAwards.push({
        year,
        restaurantId: overallTop[i].restaurantId,
        foodCategoryId: cat.id,
        rank: i + 1,
        geoScope: 'overall',
        geoValue: null,
        geoState: null,
        totalScore: overallTop[i].totalScore,
      })
      breakdown.overall++
    }

    // Per state top 3
    const states = await getStatesForCategory(cat.id)
    for (const s of states) {
      const stateRows = await getLeaderboard(cat.id, year, undefined, s.state)
      const stateTop = stateRows.filter(r => r.totalScore >= 1).slice(0, 3)
      for (let i = 0; i < stateTop.length; i++) {
        allAwards.push({
          year,
          restaurantId: stateTop[i].restaurantId,
          foodCategoryId: cat.id,
          rank: i + 1,
          geoScope: 'state',
          geoValue: s.state,
          geoState: null,
          totalScore: stateTop[i].totalScore,
        })
        breakdown.state++
      }
    }

    // Per city top 3
    const cities = await getCitiesForCategory(cat.id)
    for (const c of cities) {
      const cityRows = await getLeaderboard(cat.id, year, c.city, c.state)
      const cityTop = cityRows.filter(r => r.totalScore >= 1).slice(0, 3)
      for (let i = 0; i < cityTop.length; i++) {
        allAwards.push({
          year,
          restaurantId: cityTop[i].restaurantId,
          foodCategoryId: cat.id,
          rank: i + 1,
          geoScope: 'city',
          geoValue: c.city,
          geoState: c.state,
          totalScore: cityTop[i].totalScore,
        })
        breakdown.city++
      }
    }
  }

  // Idempotent: delete existing awards for this year, then insert fresh
  await prisma.$transaction([
    prisma.annualAward.deleteMany({ where: { year } }),
    prisma.annualAward.createMany({ data: allAwards }),
  ])

  return {
    year,
    totalAwards: allAwards.length,
    categoriesProcessed: categories.length,
    breakdown,
  }
}
