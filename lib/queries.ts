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
  distanceMiles?: number
  lat?:           number | null
  lng?:           number | null
  address?:       string | null
  city?:          string | null
  state?:         string | null
}

export async function getLeaderboard(
  foodCategoryId: string,
  year: number,
  city?: string,
  state?: string,
): Promise<LeaderboardRow[]> {
  const locationClause = city && state
    ? Prisma.sql`AND r.city = ${city} AND r.state = ${state}`
    : state
      ? Prisma.sql`AND r.state = ${state}`
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
      lat:          number | null
      lng:          number | null
      address:      string | null
      city:         string | null
      state:        string | null
    }>
  >`
    SELECT
      r.id   AS restaurant_id,
      r.name AS restaurant_name,
      r.slug AS restaurant_slug,
      r.lat,
      r.lng,
      r.address,
      r.city,
      r.state,
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
      ${locationClause}
    GROUP BY r.id, r.name, r.slug, r.lat, r.lng, r.address, r.city, r.state
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
    lat:            row.lat,
    lng:            row.lng,
    address:        row.address,
    city:           row.city,
    state:          row.state,
  }))
}

export async function getLeaderboardNearMe(
  foodCategoryId: string,
  year: number,
  lat: number,
  lng: number,
  radius: number,
): Promise<LeaderboardRow[]> {
  const rows = await prisma.$queryRaw<
    Array<{
      restaurant_id:   string
      restaurant_name: string
      restaurant_slug: string
      gold_count:      bigint
      silver_count:    bigint
      bronze_count:    bigint
      total_score:     bigint
      distance_miles:  number
      address:         string | null
      city:            string | null
      state:           string | null
    }>
  >`
    WITH nearby AS (
      SELECT r.id, r.name, r.slug, r.lat, r.lng, r.city, r.state, r.address,
        (3959 * acos(
          LEAST(1.0,
            cos(radians(${lat})) * cos(radians(r.lat)) *
            cos(radians(r.lng) - radians(${lng})) +
            sin(radians(${lat})) * sin(radians(r.lat))
          )
        )) AS distance_miles
      FROM restaurants r
      WHERE r.lat BETWEEN ${lat} - ${radius}/69.0 AND ${lat} + ${radius}/69.0
        AND r.lng BETWEEN ${lng} - ${radius}/(69.0 * cos(radians(${lat}))) AND ${lng} + ${radius}/(69.0 * cos(radians(${lat})))
        AND r.lat IS NOT NULL AND r.lng IS NOT NULL
        AND r.status = 'active'
    )
    SELECT
      n.id   AS restaurant_id,
      n.name AS restaurant_name,
      n.slug AS restaurant_slug,
      ROUND(n.distance_miles::numeric, 1)                                AS distance_miles,
      n.address,
      n.city,
      n.state,
      COUNT(*) FILTER (WHERE m.medal_type = 'gold')                     AS gold_count,
      COUNT(*) FILTER (WHERE m.medal_type = 'silver')                   AS silver_count,
      COUNT(*) FILTER (WHERE m.medal_type = 'bronze')                   AS bronze_count,
      (COUNT(*) FILTER (WHERE m.medal_type = 'gold')   * 3 +
       COUNT(*) FILTER (WHERE m.medal_type = 'silver') * 2 +
       COUNT(*) FILTER (WHERE m.medal_type = 'bronze') * 1)             AS total_score
    FROM nearby n
    JOIN restaurant_categories rc ON rc.restaurant_id = n.id AND rc.food_category_id = ${foodCategoryId} AND rc.verified = true
    LEFT JOIN medals m ON m.restaurant_id = n.id
                      AND m.food_category_id = ${foodCategoryId}
                      AND m.year = ${year}
    WHERE n.distance_miles <= ${radius}
    GROUP BY n.id, n.name, n.slug, n.distance_miles, n.address, n.city, n.state
    ORDER BY total_score DESC, gold_count DESC, n.distance_miles ASC
  `

  return rows.map(row => ({
    restaurantId:   row.restaurant_id,
    restaurantName: row.restaurant_name,
    restaurantSlug: row.restaurant_slug,
    goldCount:      Number(row.gold_count),
    silverCount:    Number(row.silver_count),
    bronzeCount:    Number(row.bronze_count),
    totalScore:     Number(row.total_score),
    distanceMiles:  Number(row.distance_miles),
    address:        row.address,
    city:           row.city,
    state:          row.state,
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

// ─── States ──────────────────────────────────────────────────────────────────

export type StateOption = {
  state: string
  count: number
}

export async function getStatesForCategory(foodCategoryId: string): Promise<StateOption[]> {
  const rows = await prisma.$queryRaw<
    Array<{ state: string; count: bigint }>
  >`
    SELECT r.state, COUNT(DISTINCT r.id) AS count
    FROM restaurant_categories rc
    JOIN restaurants r ON r.id = rc.restaurant_id
    WHERE rc.food_category_id = ${foodCategoryId}
      AND rc.verified = true
      AND r.status = 'active'
    GROUP BY r.state
    ORDER BY r.state
  `
  return rows.map(row => ({
    state: row.state,
    count: Number(row.count),
  }))
}

export type TrophyRow = {
  categoryId:   string
  categoryName: string
  categorySlug: string
  iconEmoji:    string
  iconUrl:      string | null
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
      icon_url:      string | null
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
      fc.icon_url,
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
    GROUP BY m.food_category_id, fc.name, fc.slug, fc.icon_emoji, fc.icon_url, m.year
    ORDER BY m.year DESC, total_score DESC
  `

  return rows.map(r => ({
    categoryId:   r.category_id,
    categoryName: r.category_name,
    categorySlug: r.category_slug,
    iconEmoji:    r.icon_emoji,
    iconUrl:      r.icon_url,
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
  iconUrl:         string | null
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
      icon_url:         string | null
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
        fc.icon_url,
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
      GROUP BY m.food_category_id, fc.name, fc.slug, fc.icon_emoji, fc.icon_url, m.year, m.restaurant_id, r.name, r.slug, r.city, r.state
    )
    SELECT * FROM ranked WHERE rn = 1
    ORDER BY year DESC, category_name ASC
  `

  return rows.map(r => ({
    categoryId:      r.category_id,
    categoryName:    r.category_name,
    categorySlug:    r.category_slug,
    iconEmoji:       r.icon_emoji,
    iconUrl:         r.icon_url,
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

// ─── Trending (homepage carousel) ─────────────────────────────────────────────

export type TrendingCategory = {
  categoryId:   string
  categoryName: string
  categorySlug: string
  iconEmoji:    string
  iconUrl:      string | null
  topRestaurants: Array<{
    restaurantName: string
    restaurantSlug: string
    totalScore:     number
    goldCount:      number
    city:           string | null
    state:          string | null
  }>
}

export async function getTopRestaurantsPerCategory(year: number): Promise<TrendingCategory[]> {
  const rows = await prisma.$queryRaw<
    Array<{
      category_id:     string
      category_name:   string
      category_slug:   string
      icon_emoji:      string
      icon_url:        string | null
      restaurant_name: string
      restaurant_slug: string
      restaurant_city: string | null
      restaurant_state: string | null
      total_score:     bigint
      gold_count:      bigint
      rn:              bigint
    }>
  >`
    WITH scored AS (
      SELECT
        fc.id           AS category_id,
        fc.name         AS category_name,
        fc.slug         AS category_slug,
        fc.icon_emoji,
        fc.icon_url,
        fc.sort_order,
        r.name          AS restaurant_name,
        r.slug          AS restaurant_slug,
        r.city          AS restaurant_city,
        r.state         AS restaurant_state,
        COUNT(*) FILTER (WHERE m.medal_type = 'gold')   AS gold_count,
        (COUNT(*) FILTER (WHERE m.medal_type = 'gold')   * 3 +
         COUNT(*) FILTER (WHERE m.medal_type = 'silver') * 2 +
         COUNT(*) FILTER (WHERE m.medal_type = 'bronze') * 1) AS total_score
      FROM food_categories fc
      JOIN restaurant_categories rc ON rc.food_category_id = fc.id AND rc.verified = true
      JOIN restaurants r            ON r.id = rc.restaurant_id     AND r.status = 'active'
      LEFT JOIN medals m            ON m.restaurant_id = r.id
                                   AND m.food_category_id = fc.id
                                   AND m.year = ${year}
      WHERE fc.status = 'active'
      GROUP BY fc.id, fc.name, fc.slug, fc.icon_emoji, fc.icon_url, fc.sort_order, r.name, r.slug, r.city, r.state
      HAVING (COUNT(*) FILTER (WHERE m.medal_type = 'gold')   * 3 +
              COUNT(*) FILTER (WHERE m.medal_type = 'silver') * 2 +
              COUNT(*) FILTER (WHERE m.medal_type = 'bronze') * 1) > 0
    ),
    ranked AS (
      SELECT *,
        ROW_NUMBER() OVER (
          PARTITION BY category_id
          ORDER BY total_score DESC, gold_count DESC
        ) AS rn
      FROM scored
    )
    SELECT category_id, category_name, category_slug, icon_emoji, icon_url,
           restaurant_name, restaurant_slug, restaurant_city, restaurant_state,
           total_score, gold_count, rn
    FROM ranked
    WHERE rn <= 3
    ORDER BY sort_order, rn
  `

  const map = new Map<string, TrendingCategory>()
  for (const row of rows) {
    let cat = map.get(row.category_id)
    if (!cat) {
      cat = {
        categoryId:   row.category_id,
        categoryName: row.category_name,
        categorySlug: row.category_slug,
        iconEmoji:    row.icon_emoji,
        iconUrl:      row.icon_url,
        topRestaurants: [],
      }
      map.set(row.category_id, cat)
    }
    cat.topRestaurants.push({
      restaurantName: row.restaurant_name,
      restaurantSlug: row.restaurant_slug,
      totalScore:     Number(row.total_score),
      goldCount:      Number(row.gold_count),
      city:           row.restaurant_city,
      state:          row.restaurant_state,
    })
  }

  return Array.from(map.values())
}

export async function getTopRestaurantsPerCategoryNearMe(
  year: number,
  lat: number,
  lng: number,
  radiusMiles: number,
): Promise<TrendingCategory[]> {
  const rows = await prisma.$queryRaw<
    Array<{
      category_id:     string
      category_name:   string
      category_slug:   string
      icon_emoji:      string
      icon_url:        string | null
      restaurant_name: string
      restaurant_slug: string
      restaurant_city: string | null
      restaurant_state: string | null
      total_score:     bigint
      gold_count:      bigint
      rn:              bigint
    }>
  >`
    WITH nearby AS (
      SELECT r.id, r.name, r.slug, r.city, r.state,
        (3959 * acos(
          LEAST(1.0,
            cos(radians(${lat})) * cos(radians(r.lat)) *
            cos(radians(r.lng) - radians(${lng})) +
            sin(radians(${lat})) * sin(radians(r.lat))
          )
        )) AS distance_miles
      FROM restaurants r
      WHERE r.lat BETWEEN ${lat} - ${radiusMiles}/69.0 AND ${lat} + ${radiusMiles}/69.0
        AND r.lng BETWEEN ${lng} - ${radiusMiles}/(69.0 * cos(radians(${lat}))) AND ${lng} + ${radiusMiles}/(69.0 * cos(radians(${lat})))
        AND r.lat IS NOT NULL AND r.lng IS NOT NULL
        AND r.status = 'active'
    ),
    scored AS (
      SELECT
        fc.id           AS category_id,
        fc.name         AS category_name,
        fc.slug         AS category_slug,
        fc.icon_emoji,
        fc.icon_url,
        fc.sort_order,
        n.name          AS restaurant_name,
        n.slug          AS restaurant_slug,
        n.city          AS restaurant_city,
        n.state         AS restaurant_state,
        COUNT(*) FILTER (WHERE m.medal_type = 'gold')   AS gold_count,
        (COUNT(*) FILTER (WHERE m.medal_type = 'gold')   * 3 +
         COUNT(*) FILTER (WHERE m.medal_type = 'silver') * 2 +
         COUNT(*) FILTER (WHERE m.medal_type = 'bronze') * 1) AS total_score
      FROM food_categories fc
      JOIN restaurant_categories rc ON rc.food_category_id = fc.id AND rc.verified = true
      JOIN nearby n ON n.id = rc.restaurant_id
      LEFT JOIN medals m ON m.restaurant_id = n.id
                        AND m.food_category_id = fc.id
                        AND m.year = ${year}
      WHERE fc.status = 'active'
        AND n.distance_miles <= ${radiusMiles}
      GROUP BY fc.id, fc.name, fc.slug, fc.icon_emoji, fc.icon_url, fc.sort_order, n.name, n.slug, n.city, n.state
      HAVING (COUNT(*) FILTER (WHERE m.medal_type = 'gold')   * 3 +
              COUNT(*) FILTER (WHERE m.medal_type = 'silver') * 2 +
              COUNT(*) FILTER (WHERE m.medal_type = 'bronze') * 1) > 0
    ),
    ranked AS (
      SELECT *,
        ROW_NUMBER() OVER (
          PARTITION BY category_id
          ORDER BY total_score DESC, gold_count DESC
        ) AS rn
      FROM scored
    )
    SELECT category_id, category_name, category_slug, icon_emoji, icon_url,
           restaurant_name, restaurant_slug, restaurant_city, restaurant_state,
           total_score, gold_count, rn
    FROM ranked
    WHERE rn <= 3
    ORDER BY sort_order, rn
  `

  const map = new Map<string, TrendingCategory>()
  for (const row of rows) {
    let cat = map.get(row.category_id)
    if (!cat) {
      cat = {
        categoryId:   row.category_id,
        categoryName: row.category_name,
        categorySlug: row.category_slug,
        iconEmoji:    row.icon_emoji,
        iconUrl:      row.icon_url,
        topRestaurants: [],
      }
      map.set(row.category_id, cat)
    }
    cat.topRestaurants.push({
      restaurantName: row.restaurant_name,
      restaurantSlug: row.restaurant_slug,
      totalScore:     Number(row.total_score),
      goldCount:      Number(row.gold_count),
      city:           row.restaurant_city,
      state:          row.restaurant_state,
    })
  }

  return Array.from(map.values())
}

// ─── Category suggestions for a restaurant ───────────────────────────────────

export type CategorySuggestion = {
  categoryId:   string
  categoryName: string
  categorySlug: string
  iconEmoji:    string
  iconUrl:      string | null
  voteCount:    number
}

export async function getCategorySuggestions(restaurantId: string): Promise<CategorySuggestion[]> {
  const rows = await prisma.restaurantCategory.findMany({
    where: { restaurantId, verified: false },
    include: {
      foodCategory: { select: { id: true, name: true, slug: true, iconEmoji: true, iconUrl: true } },
    },
  })

  // Get vote counts for each unverified category
  const categoryIds = rows.map(r => r.foodCategoryId)
  if (categoryIds.length === 0) return []

  const voteCounts = await prisma.categorySuggestionVote.groupBy({
    by: ['foodCategoryId'],
    where: { restaurantId, foodCategoryId: { in: categoryIds } },
    _count: true,
  })
  const countMap = new Map(voteCounts.map(v => [v.foodCategoryId, v._count]))

  return rows.map(r => ({
    categoryId:   r.foodCategory.id,
    categoryName: r.foodCategory.name,
    categorySlug: r.foodCategory.slug,
    iconEmoji:    r.foodCategory.iconEmoji,
    iconUrl:      r.foodCategory.iconUrl,
    voteCount:    countMap.get(r.foodCategoryId) ?? 0,
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

// ─── User Profiles ────────────────────────────────────────────────────────────

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/** Generate a unique user slug from display name, appending a number if needed */
export async function generateUserSlug(displayName: string): Promise<string> {
  const base = slugify(displayName) || 'user'
  let slug = base
  let i = 1
  while (await prisma.user.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${base}-${i++}`
  }
  return slug
}

export async function getUserProfile(slug: string) {
  const user = await prisma.user.findUnique({
    where: { slug },
    select: {
      id: true,
      displayName: true,
      avatarUrl: true,
      city: true,
      state: true,
      crownJewelMedalId: true,
      createdAt: true,
    },
  })
  if (!user) return null

  const year = new Date().getFullYear()
  const medals = await prisma.medal.findMany({
    where: { userId: user.id, year },
    include: {
      foodCategory: {
        select: { id: true, name: true, slug: true, iconEmoji: true, iconUrl: true, sortOrder: true },
      },
      restaurant: {
        select: { name: true, slug: true, city: true, state: true, address: true, lat: true, lng: true },
      },
    },
    orderBy: [{ foodCategory: { sortOrder: 'asc' } }, { medalType: 'asc' }],
  })

  return { user, medals, year }
}
