import { prisma } from './prisma'
import { Prisma } from '@/app/generated/prisma/client'

// ─── Categories ───────────────────────────────────────────────────────────────

export async function getCategoryBySlug(slug: string) {
  return prisma.foodCategory.findUnique({
    where: { slug, status: 'active' },
  })
}

export async function getAllActiveCategories() {
  return prisma.foodCategory.findMany({
    where: { status: 'active' },
    include: { _count: { select: { restaurants: true } } },
    orderBy: { sortOrder: 'asc' },
  })
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────

export type LeaderboardRow = {
  restaurantId:   string
  restaurantName: string
  restaurantSlug: string
  goldCount:      number
  silverCount:    number
  bronzeCount:    number
  totalScore:     number
}

export async function getLeaderboard(
  foodCategoryId: string,
  year: number,
  city?: string,
  state?: string,
): Promise<LeaderboardRow[]> {
  const cityClause = city && state
    ? Prisma.sql`AND r.city = ${city} AND r.state = ${state}`
    : Prisma.empty

  const rows = await prisma.$queryRaw<
    Array<{
      restaurant_id:   string
      restaurant_name: string
      restaurant_slug: string
      gold_count:   bigint
      silver_count: bigint
      bronze_count: bigint
      total_score:  bigint
    }>
  >`
    SELECT
      r.id   AS restaurant_id,
      r.name AS restaurant_name,
      r.slug AS restaurant_slug,
      COUNT(*) FILTER (WHERE m.medal_type = 'gold')   AS gold_count,
      COUNT(*) FILTER (WHERE m.medal_type = 'silver') AS silver_count,
      COUNT(*) FILTER (WHERE m.medal_type = 'bronze') AS bronze_count,
      (COUNT(*) FILTER (WHERE m.medal_type = 'gold')   * 3 +
       COUNT(*) FILTER (WHERE m.medal_type = 'silver') * 2 +
       COUNT(*) FILTER (WHERE m.medal_type = 'bronze') * 1) AS total_score
    FROM restaurant_categories rc
    JOIN  restaurants r ON r.id = rc.restaurant_id
    LEFT JOIN medals  m ON m.restaurant_id    = r.id
                       AND m.food_category_id = ${foodCategoryId}
                       AND m.year             = ${year}
    WHERE rc.food_category_id = ${foodCategoryId}
      AND rc.verified = true
      AND r.status    = 'active'
      ${cityClause}
    GROUP BY r.id, r.name, r.slug
    ORDER BY total_score DESC, gold_count DESC, r.name ASC
  `

  return rows.map(row => ({
    restaurantId:   row.restaurant_id,
    restaurantName: row.restaurant_name,
    restaurantSlug: row.restaurant_slug,
    goldCount:      Number(row.gold_count),
    silverCount:    Number(row.silver_count),
    bronzeCount:    Number(row.bronze_count),
    totalScore:     Number(row.total_score),
  }))
}

// ─── Restaurants ─────────────────────────────────────────────────────────────

export async function getRestaurantBySlug(slug: string) {
  return prisma.restaurant.findUnique({
    where: { slug, status: 'active' },
    include: {
      categories: {
        where:   { verified: true },
        include: { foodCategory: true },
        orderBy: { foodCategory: { sortOrder: 'asc' } },
      },
    },
  })
}

export async function getRestaurantsForCategory(
  foodCategoryId: string,
  city?: string,
  state?: string,
) {
  const links = await prisma.restaurantCategory.findMany({
    where: {
      foodCategoryId,
      verified: true,
      restaurant: {
        status: 'active',
        ...(city && state ? { city, state } : {}),
      },
    },
    include: { restaurant: true },
    orderBy: { restaurant: { name: 'asc' } },
  })
  return links.map(l => l.restaurant)
}

// ─── Cities ───────────────────────────────────────────────────────────────────

export type CityOption = {
  city:  string
  state: string
  count: number
}

export async function getCitiesForCategory(foodCategoryId: string): Promise<CityOption[]> {
  const rows = await prisma.$queryRaw<
    Array<{ city: string; state: string; count: bigint }>
  >`
    SELECT r.city, r.state, COUNT(DISTINCT r.id) AS count
    FROM restaurant_categories rc
    JOIN restaurants r ON r.id = rc.restaurant_id
    WHERE rc.food_category_id = ${foodCategoryId}
      AND rc.verified = true
      AND r.status = 'active'
    GROUP BY r.city, r.state
    ORDER BY r.state, r.city
  `
  return rows.map(row => ({
    city:  row.city,
    state: row.state,
    count: Number(row.count),
  }))
}

export type TrophyRow = {
  categoryId:   string
  categoryName: string
  categorySlug: string
  iconEmoji:    string
  year:         number
  goldCount:    number
  silverCount:  number
  bronzeCount:  number
  totalScore:   number
}

export async function getRestaurantTrophies(restaurantId: string): Promise<TrophyRow[]> {
  const rows = await prisma.$queryRaw<
    Array<{
      category_id:   string
      category_name: string
      category_slug: string
      icon_emoji:    string
      year:          number
      gold_count:    bigint
      silver_count:  bigint
      bronze_count:  bigint
      total_score:   bigint
    }>
  >`
    SELECT
      m.food_category_id AS category_id,
      fc.name            AS category_name,
      fc.slug            AS category_slug,
      fc.icon_emoji,
      m.year,
      COUNT(*) FILTER (WHERE m.medal_type = 'gold')   AS gold_count,
      COUNT(*) FILTER (WHERE m.medal_type = 'silver') AS silver_count,
      COUNT(*) FILTER (WHERE m.medal_type = 'bronze') AS bronze_count,
      (COUNT(*) FILTER (WHERE m.medal_type = 'gold')   * 3 +
       COUNT(*) FILTER (WHERE m.medal_type = 'silver') * 2 +
       COUNT(*) FILTER (WHERE m.medal_type = 'bronze') * 1) AS total_score
    FROM medals m
    JOIN food_categories fc ON fc.id = m.food_category_id
    WHERE m.restaurant_id = ${restaurantId}
    GROUP BY m.food_category_id, fc.name, fc.slug, fc.icon_emoji, m.year
    ORDER BY m.year DESC, total_score DESC
  `

  return rows.map(r => ({
    categoryId:   r.category_id,
    categoryName: r.category_name,
    categorySlug: r.category_slug,
    iconEmoji:    r.icon_emoji,
    year:         r.year,
    goldCount:    Number(r.gold_count),
    silverCount:  Number(r.silver_count),
    bronzeCount:  Number(r.bronze_count),
    totalScore:   Number(r.total_score),
  }))
}

// ─── User Medals ──────────────────────────────────────────────────────────────

export async function getUserMedalsForCategory(
  userId: string,
  foodCategoryId: string,
  year: number,
) {
  return prisma.medal.findMany({
    where:   { userId, foodCategoryId, year },
    include: { restaurant: true },
  })
}

export async function getAllUserMedals(userId: string, year: number) {
  return prisma.medal.findMany({
    where:   { userId, year },
    include: { foodCategory: true, restaurant: true },
    orderBy: [{ foodCategory: { sortOrder: 'asc' } }, { medalType: 'asc' }],
  })
}

// ─── Hall of Fame ─────────────────────────────────────────────────────────────

export type HallOfFameRow = {
  categoryId:      string
  categoryName:    string
  categorySlug:    string
  iconEmoji:       string
  year:            number
  restaurantId:    string
  restaurantName:  string
  restaurantSlug:  string
  restaurantCity:  string
  restaurantState: string
  goldCount:       number
  totalScore:      number
}

export async function getHallOfFame(maxYear: number): Promise<HallOfFameRow[]> {
  // Gold winner per category per year (past years only)
  const rows = await prisma.$queryRaw<
    Array<{
      category_id:      string
      category_name:    string
      category_slug:    string
      icon_emoji:       string
      year:             number
      restaurant_id:    string
      restaurant_name:  string
      restaurant_slug:  string
      restaurant_city:  string
      restaurant_state: string
      gold_count:       bigint
      total_score:      bigint
    }>
  >`
    WITH ranked AS (
      SELECT
        m.food_category_id AS category_id,
        fc.name            AS category_name,
        fc.slug            AS category_slug,
        fc.icon_emoji,
        m.year,
        m.restaurant_id,
        r.name             AS restaurant_name,
        r.slug             AS restaurant_slug,
        r.city             AS restaurant_city,
        r.state            AS restaurant_state,
        COUNT(*) FILTER (WHERE m.medal_type = 'gold')   AS gold_count,
        (COUNT(*) FILTER (WHERE m.medal_type = 'gold')   * 3 +
         COUNT(*) FILTER (WHERE m.medal_type = 'silver') * 2 +
         COUNT(*) FILTER (WHERE m.medal_type = 'bronze') * 1) AS total_score,
        ROW_NUMBER() OVER (
          PARTITION BY m.food_category_id, m.year
          ORDER BY
            (COUNT(*) FILTER (WHERE m.medal_type = 'gold')   * 3 +
             COUNT(*) FILTER (WHERE m.medal_type = 'silver') * 2 +
             COUNT(*) FILTER (WHERE m.medal_type = 'bronze') * 1) DESC,
            COUNT(*) FILTER (WHERE m.medal_type = 'gold') DESC
        ) AS rn
      FROM medals m
      JOIN food_categories fc ON fc.id = m.food_category_id
      JOIN restaurants      r  ON r.id  = m.restaurant_id
      WHERE m.year < ${maxYear}
      GROUP BY m.food_category_id, fc.name, fc.slug, fc.icon_emoji, m.year, m.restaurant_id, r.name, r.slug, r.city, r.state
    )
    SELECT * FROM ranked WHERE rn = 1
    ORDER BY year DESC, category_name ASC
  `

  return rows.map(r => ({
    categoryId:      r.category_id,
    categoryName:    r.category_name,
    categorySlug:    r.category_slug,
    iconEmoji:       r.icon_emoji,
    year:            r.year,
    restaurantId:    r.restaurant_id,
    restaurantName:  r.restaurant_name,
    restaurantSlug:  r.restaurant_slug,
    restaurantCity:  r.restaurant_city,
    restaurantState: r.restaurant_state,
    goldCount:       Number(r.gold_count),
    totalScore:      Number(r.total_score),
  }))
}

// ─── Search ───────────────────────────────────────────────────────────────────

export async function searchAll(query: string) {
  const q = `%${query.toLowerCase()}%`
  const [restaurants, categories] = await Promise.all([
    prisma.restaurant.findMany({
      where: {
        status: 'active',
        OR: [
          { name:    { contains: query, mode: 'insensitive' } },
          { city:    { contains: query, mode: 'insensitive' } },
          { address: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 8,
      orderBy: { name: 'asc' },
    }),
    prisma.foodCategory.findMany({
      where: {
        status: 'active',
        name: { contains: query, mode: 'insensitive' },
      },
      take: 5,
    }),
  ])
  return { restaurants, categories }
}
