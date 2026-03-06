import { cache } from 'react'
import { prisma } from './prisma'
import { Prisma } from '@/app/generated/prisma/client'

// ─── Categories ───────────────────────────────────────────────────────────────

// React cache deduplicates within a single request (metadata + page component)
export const getCategoryBySlug = cache(async (slug: string) => {
  return prisma.foodCategory.findUnique({
    where: { slug, status: 'active' },
  })
})

export async function getAllActiveCategories() {
  return prisma.foodCategory.findMany({
    where: { status: 'active' },
    include: { _count: { select: { restaurants: true } } },
    orderBy: { sortOrder: 'asc' },
  })
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────

export type LeaderboardRow = {
  restaurantId:     string
  restaurantName:   string
  restaurantSlug:   string
  goldCount:        number
  silverCount:      number
  bronzeCount:      number
  commentCount:     number
  totalScore:       number
  distanceMiles?:   number
  lat?:             number | null
  lng?:             number | null
  address?:         string | null
  city?:            string | null
  state?:           string | null
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
      gold_count:    bigint
      silver_count:  bigint
      bronze_count:  bigint
      comment_count: bigint
      total_score:   bigint
      lat:           number | null
      lng:           number | null
      address:       string | null
      city:          string | null
      state:         string | null
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
      COUNT(DISTINCT gmc.id)                           AS comment_count,
      (COUNT(*) FILTER (WHERE m.medal_type = 'gold')   * 3 +
       COUNT(*) FILTER (WHERE m.medal_type = 'silver') * 2 +
       COUNT(*) FILTER (WHERE m.medal_type = 'bronze') * 1 +
       COUNT(*) FILTER (WHERE m.id = u.crown_jewel_medal_id) +
       COUNT(gmc.id) +
       COUNT(gmc.id) FILTER (WHERE gmc.photo_url IS NOT NULL)) AS total_score
    FROM restaurant_categories rc
    JOIN  restaurants r ON r.id = rc.restaurant_id
    LEFT JOIN medals  m ON m.restaurant_id    = r.id
                       AND m.food_category_id = ${foodCategoryId}
                       AND m.year             = ${year}
    LEFT JOIN users   u ON u.id = m.user_id
    LEFT JOIN gold_medal_comments gmc ON gmc.medal_id = m.id AND gmc.active = true
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
    commentCount:   Number(row.comment_count),
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
      comment_count:   bigint
      total_score:     bigint
      distance_miles:  number
      lat:             number | null
      lng:             number | null
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
      n.lat,
      n.lng,
      n.address,
      n.city,
      n.state,
      COUNT(*) FILTER (WHERE m.medal_type = 'gold')                     AS gold_count,
      COUNT(*) FILTER (WHERE m.medal_type = 'silver')                   AS silver_count,
      COUNT(*) FILTER (WHERE m.medal_type = 'bronze')                   AS bronze_count,
      COUNT(DISTINCT gmc.id)                                            AS comment_count,
      (COUNT(*) FILTER (WHERE m.medal_type = 'gold')   * 3 +
       COUNT(*) FILTER (WHERE m.medal_type = 'silver') * 2 +
       COUNT(*) FILTER (WHERE m.medal_type = 'bronze') * 1 +
       COUNT(*) FILTER (WHERE m.id = u.crown_jewel_medal_id) +
       COUNT(gmc.id) +
       COUNT(gmc.id) FILTER (WHERE gmc.photo_url IS NOT NULL))          AS total_score
    FROM nearby n
    JOIN restaurant_categories rc ON rc.restaurant_id = n.id AND rc.food_category_id = ${foodCategoryId} AND rc.verified = true
    LEFT JOIN medals m ON m.restaurant_id = n.id
                      AND m.food_category_id = ${foodCategoryId}
                      AND m.year = ${year}
    LEFT JOIN users  u ON u.id = m.user_id
    LEFT JOIN gold_medal_comments gmc ON gmc.medal_id = m.id AND gmc.active = true
    WHERE n.distance_miles <= ${radius}
    GROUP BY n.id, n.name, n.slug, n.lat, n.lng, n.distance_miles, n.address, n.city, n.state
    ORDER BY total_score DESC, gold_count DESC, n.distance_miles ASC
  `

  return rows.map(row => ({
    restaurantId:   row.restaurant_id,
    restaurantName: row.restaurant_name,
    restaurantSlug: row.restaurant_slug,
    goldCount:      Number(row.gold_count),
    silverCount:    Number(row.silver_count),
    bronzeCount:    Number(row.bronze_count),
    commentCount:   Number(row.comment_count),
    totalScore:     Number(row.total_score),
    distanceMiles:  Number(row.distance_miles),
    lat:            row.lat,
    lng:            row.lng,
    address:        row.address,
    city:           row.city,
    state:          row.state,
  }))
}

// ─── Restaurants ─────────────────────────────────────────────────────────────

export const getRestaurantBySlug = cache(async (slug: string) => {
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
})

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
       COUNT(*) FILTER (WHERE m.medal_type = 'bronze') * 1 +
       COUNT(*) FILTER (WHERE m.id = u.crown_jewel_medal_id) +
       COUNT(gmc.id) +
       COUNT(gmc.id) FILTER (WHERE gmc.photo_url IS NOT NULL)) AS total_score
    FROM medals m
    JOIN food_categories fc ON fc.id = m.food_category_id
    LEFT JOIN users u ON u.id = m.user_id
    LEFT JOIN gold_medal_comments gmc ON gmc.medal_id = m.id AND gmc.active = true
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
    include: {
      restaurant: true,
      goldMedalComment: {
        where: { active: true },
        select: { id: true, comment: true, photoUrl: true },
      },
    },
  })
}

/** Find a preserved (inactive) gold medal comment for re-award detection on page load */
export async function getPreservedGoldComment(
  userId: string,
  foodCategoryId: string,
  restaurantId: string,
  year: number,
) {
  return prisma.goldMedalComment.findUnique({
    where: {
      userId_foodCategoryId_restaurantId_year: {
        userId,
        foodCategoryId,
        restaurantId,
        year,
      },
    },
    select: { comment: true, active: true, photoUrl: true },
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
         COUNT(*) FILTER (WHERE m.medal_type = 'bronze') * 1 +
         COUNT(*) FILTER (WHERE m.id = u.crown_jewel_medal_id) +
         COUNT(gmc.id) +
         COUNT(gmc.id) FILTER (WHERE gmc.photo_url IS NOT NULL)) AS total_score,
        ROW_NUMBER() OVER (
          PARTITION BY m.food_category_id, m.year
          ORDER BY
            (COUNT(*) FILTER (WHERE m.medal_type = 'gold')   * 3 +
             COUNT(*) FILTER (WHERE m.medal_type = 'silver') * 2 +
             COUNT(*) FILTER (WHERE m.medal_type = 'bronze') * 1 +
             COUNT(*) FILTER (WHERE m.id = u.crown_jewel_medal_id) +
             COUNT(gmc.id) +
             COUNT(gmc.id) FILTER (WHERE gmc.photo_url IS NOT NULL)) DESC,
            COUNT(*) FILTER (WHERE m.medal_type = 'gold') DESC
        ) AS rn
      FROM medals m
      JOIN food_categories fc ON fc.id = m.food_category_id
      JOIN restaurants      r  ON r.id  = m.restaurant_id
      LEFT JOIN users       u  ON u.id  = m.user_id
      LEFT JOIN gold_medal_comments gmc ON gmc.medal_id = m.id AND gmc.active = true
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
         COUNT(*) FILTER (WHERE m.medal_type = 'bronze') * 1 +
         COUNT(*) FILTER (WHERE m.id = u.crown_jewel_medal_id) +
         COUNT(gmc.id) +
         COUNT(gmc.id) FILTER (WHERE gmc.photo_url IS NOT NULL)) AS total_score
      FROM food_categories fc
      JOIN restaurant_categories rc ON rc.food_category_id = fc.id AND rc.verified = true
      JOIN restaurants r            ON r.id = rc.restaurant_id     AND r.status = 'active'
      LEFT JOIN medals m            ON m.restaurant_id = r.id
                                   AND m.food_category_id = fc.id
                                   AND m.year = ${year}
      LEFT JOIN users  u            ON u.id = m.user_id
      LEFT JOIN gold_medal_comments gmc ON gmc.medal_id = m.id AND gmc.active = true
      WHERE fc.status = 'active'
      GROUP BY fc.id, fc.name, fc.slug, fc.icon_emoji, fc.icon_url, fc.sort_order, r.name, r.slug, r.city, r.state
      HAVING (COUNT(*) FILTER (WHERE m.medal_type = 'gold')   * 3 +
              COUNT(*) FILTER (WHERE m.medal_type = 'silver') * 2 +
              COUNT(*) FILTER (WHERE m.medal_type = 'bronze') * 1 +
              COUNT(*) FILTER (WHERE m.id = u.crown_jewel_medal_id) +
              COUNT(gmc.id)) > 0
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
         COUNT(*) FILTER (WHERE m.medal_type = 'bronze') * 1 +
         COUNT(*) FILTER (WHERE m.id = u.crown_jewel_medal_id) +
         COUNT(gmc.id) +
         COUNT(gmc.id) FILTER (WHERE gmc.photo_url IS NOT NULL)) AS total_score
      FROM food_categories fc
      JOIN restaurant_categories rc ON rc.food_category_id = fc.id AND rc.verified = true
      JOIN nearby n ON n.id = rc.restaurant_id
      LEFT JOIN medals m ON m.restaurant_id = n.id
                        AND m.food_category_id = fc.id
                        AND m.year = ${year}
      LEFT JOIN users  u ON u.id = m.user_id
      LEFT JOIN gold_medal_comments gmc ON gmc.medal_id = m.id AND gmc.active = true
      WHERE fc.status = 'active'
        AND n.distance_miles <= ${radiusMiles}
      GROUP BY fc.id, fc.name, fc.slug, fc.icon_emoji, fc.icon_url, fc.sort_order, n.name, n.slug, n.city, n.state
      HAVING (COUNT(*) FILTER (WHERE m.medal_type = 'gold')   * 3 +
              COUNT(*) FILTER (WHERE m.medal_type = 'silver') * 2 +
              COUNT(*) FILTER (WHERE m.medal_type = 'bronze') * 1 +
              COUNT(*) FILTER (WHERE m.id = u.crown_jewel_medal_id) +
              COUNT(gmc.id)) > 0
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

// ─── Trending categories by city ──────────────────────────────────────────────

export type TrendingCityCategory = {
  categoryId:   string
  categoryName: string
  categorySlug: string
  iconEmoji:    string
  iconUrl:      string | null
  medalCount:   number
}

export async function getTrendingCategoriesInCity(
  year: number,
  city: string,
  state: string,
): Promise<TrendingCityCategory[]> {
  const rows = await prisma.$queryRaw<
    Array<{
      category_id:   string
      category_name: string
      category_slug: string
      icon_emoji:    string
      icon_url:      string | null
      medal_count:   bigint
    }>
  >`
    SELECT
      fc.id          AS category_id,
      fc.name        AS category_name,
      fc.slug        AS category_slug,
      fc.icon_emoji,
      fc.icon_url,
      COUNT(m.id)    AS medal_count
    FROM food_categories fc
    JOIN medals m ON m.food_category_id = fc.id AND m.year = ${year}
    JOIN restaurants r ON r.id = m.restaurant_id
    WHERE fc.status = 'active'
      AND r.city  = ${city}
      AND r.state = ${state}
    GROUP BY fc.id, fc.name, fc.slug, fc.icon_emoji, fc.icon_url
    ORDER BY medal_count DESC
  `

  return rows.map(r => ({
    categoryId:   r.category_id,
    categoryName: r.category_name,
    categorySlug: r.category_slug,
    iconEmoji:    r.icon_emoji,
    iconUrl:      r.icon_url,
    medalCount:   Number(r.medal_count),
  }))
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

const STATE_NAMES: Record<string, string> = {
  AL:'Alabama',AK:'Alaska',AZ:'Arizona',AR:'Arkansas',CA:'California',
  CO:'Colorado',CT:'Connecticut',DE:'Delaware',FL:'Florida',GA:'Georgia',
  HI:'Hawaii',ID:'Idaho',IL:'Illinois',IN:'Indiana',IA:'Iowa',KS:'Kansas',
  KY:'Kentucky',LA:'Louisiana',ME:'Maine',MD:'Maryland',MA:'Massachusetts',
  MI:'Michigan',MN:'Minnesota',MS:'Mississippi',MO:'Missouri',MT:'Montana',
  NE:'Nebraska',NV:'Nevada',NH:'New Hampshire',NJ:'New Jersey',NM:'New Mexico',
  NY:'New York',NC:'North Carolina',ND:'North Dakota',OH:'Ohio',OK:'Oklahoma',
  OR:'Oregon',PA:'Pennsylvania',RI:'Rhode Island',SC:'South Carolina',
  SD:'South Dakota',TN:'Tennessee',TX:'Texas',UT:'Utah',VT:'Vermont',
  VA:'Virginia',WA:'Washington',WV:'West Virginia',WI:'Wisconsin',WY:'Wyoming',
  DC:'District of Columbia',
}

export { STATE_NAMES }

/** Resolve a term to a state code, e.g. "Utah"→"UT", "ut"→"UT", "wash"→"WA" */
function resolveStateCode(term: string): string | null {
  const lower = term.toLowerCase()
  // Exact abbreviation match
  for (const code of Object.keys(STATE_NAMES)) {
    if (code.toLowerCase() === lower) return code
  }
  // Exact full name match
  for (const [code, name] of Object.entries(STATE_NAMES)) {
    if (name.toLowerCase() === lower) return code
  }
  // Prefix match (e.g. "wash" → "Washington" → "WA")
  for (const [code, name] of Object.entries(STATE_NAMES)) {
    if (name.toLowerCase().startsWith(lower) && lower.length >= 3) return code
  }
  return null
}

/** Resolve a term to a city match pattern for SQL. Returns null if not a location. */
function resolveCityPattern(term: string): string | null {
  // City names are at least 2 chars
  if (term.length < 2) return null
  return '%' + term + '%'
}

// ─── Shared search engine (used by navbar, hero, and search page) ─────────

type QuickResult = {
  restaurants: Array<{ slug: string; name: string; city: string; state: string }>
  categories: Array<{ slug: string; name: string; iconEmoji: string; iconUrl: string | null }>
}

/**
 * Smart search for navbar/hero dropdowns.
 * Handles: multi-word queries, category+location combos, fuzzy matching.
 */
export async function searchAll(query: string): Promise<QuickResult> {
  const q = query.trim()
  if (q.length < 2) return { restaurants: [], categories: [] }

  const words = q.split(/\s+/)
  const isMultiWord = words.length > 1

  // Consonant skeleton for vowel-dropped abbreviations (e.g. "brgr" → matches "Burgers")
  const qConsonants = q.toLowerCase().replace(/[aeiou\s]/g, '')
  const consonantMatch = qConsonants.length >= 3
    ? Prisma.sql`OR regexp_replace(lower(name), '[aeiou ]', '', 'g') LIKE ${'%' + qConsonants + '%'}`
    : Prisma.empty

  // 1. Fuzzy category search via trigram + consonant skeleton
  const categories = await prisma.$queryRaw<
    Array<{ slug: string; name: string; icon_emoji: string; icon_url: string | null; sim: number }>
  >`
    SELECT slug, name, icon_emoji, icon_url,
           GREATEST(similarity(name, ${q}), word_similarity(${q}, name)) AS sim
    FROM food_categories
    WHERE status = 'active'
      AND (
        name ILIKE ${'%' + q + '%'}
        OR (similarity(name, ${q}) > CASE WHEN length(${q}) > 6 THEN 0.25 ELSE 0.15 END
            AND length(name) BETWEEN length(${q}) * 0.7 AND length(${q}) * 1.3)
        OR word_similarity(${q}, name) > 0.7
        ${consonantMatch}
      )
    ORDER BY
      CASE WHEN name ILIKE ${'%' + q + '%'} THEN 0 ELSE 1 END,
      sim DESC
    LIMIT 5
  `

  const mappedCategories = categories.map(c => ({
    slug: c.slug, name: c.name, iconEmoji: c.icon_emoji, iconUrl: c.icon_url,
  }))

  // 2. Direct restaurant fuzzy search
  const directRestaurants = await prisma.$queryRaw<
    Array<{ slug: string; name: string; city: string; state: string; sim: number }>
  >`
    SELECT slug, name, city, state,
           GREATEST(similarity(name, ${q}), word_similarity(${q}, name)) AS sim
    FROM restaurants
    WHERE status = 'active'
      AND (
        name ILIKE ${'%' + q + '%'}
        OR similarity(name, ${q}) > 0.2
        OR word_similarity(${q}, name) > 0.35
      )
    ORDER BY
      CASE WHEN name ILIKE ${'%' + q + '%'} THEN 0 ELSE 1 END,
      sim DESC
    LIMIT 10
  `

  const seenSlugs = new Set(directRestaurants.map(r => r.slug))
  const allRestaurants = directRestaurants.map(r => ({
    slug: r.slug, name: r.name, city: r.city, state: r.state,
  }))

  // 3. Multi-word: split and try category+location and name+location combos
  if (isMultiWord) {
    // Cache fuzzy category lookups per term to avoid redundant DB queries
    const fuzzyCatCache = new Map<string, Array<{ slug: string; name: string; iconEmoji: string; iconUrl: string | null }>>()

    // Track detected location for post-filtering
    let detectedState: string | null = null
    let detectedCityTerm: string | null = null

    for (let i = 1; i < words.length; i++) {
      const partA = words.slice(0, i).join(' ')
      const partB = words.slice(i).join(' ')

      for (const [termA, termB] of [[partA, partB], [partB, partA]]) {
        const stateCode = resolveStateCode(termB)
        const cityPattern = resolveCityPattern(termB)

        // Track first detected location
        if (stateCode && !detectedState) detectedState = stateCode
        if (cityPattern && !stateCode && !detectedCityTerm && termB.length >= 3) detectedCityTerm = termB.toLowerCase()

        // a) Category + location: fuzzy-match categories for the individual term
        const cacheKey = termA.toLowerCase()
        let matchedCats = fuzzyCatCache.get(cacheKey)
        if (matchedCats === undefined) {
          const termConsonants = termA.toLowerCase().replace(/[aeiou\s]/g, '')
          const termConsonantMatch = termConsonants.length >= 3
            ? Prisma.sql`OR regexp_replace(lower(name), '[aeiou ]', '', 'g') LIKE ${'%' + termConsonants + '%'}`
            : Prisma.empty

          const fuzzyCats = await prisma.$queryRaw<
            Array<{ slug: string; name: string; icon_emoji: string; icon_url: string | null }>
          >`
            SELECT slug, name, icon_emoji, icon_url
            FROM food_categories
            WHERE status = 'active'
              AND (
                name ILIKE ${'%' + termA + '%'}
                OR (similarity(name, ${termA}) > CASE WHEN length(${termA}) > 6 THEN 0.25 ELSE 0.15 END
                    AND length(name) <= length(${termA}) * 1.3)
                OR word_similarity(${termA}, name) > 0.55
                ${termConsonantMatch}
              )
            LIMIT 5
          `
          matchedCats = fuzzyCats.map(c => ({ slug: c.slug, name: c.name, iconEmoji: c.icon_emoji, iconUrl: c.icon_url }))
          fuzzyCatCache.set(cacheKey, matchedCats)
        }
        if (matchedCats.length > 0) {
          const catSlugs = matchedCats.map(c => c.slug)
          let catLocResults: Array<{ slug: string; name: string; city: string; state: string }>

          if (stateCode) {
            catLocResults = await prisma.$queryRaw`
              SELECT DISTINCT r.slug, r.name, r.city, r.state
              FROM restaurants r
              JOIN restaurant_categories rc ON rc.restaurant_id = r.id AND rc.verified = true
              JOIN food_categories fc ON fc.id = rc.food_category_id
              WHERE r.status = 'active'
                AND fc.slug = ANY(${catSlugs})
                AND r.state = ${stateCode}
              ORDER BY r.name ASC
              LIMIT 10
            `
          } else if (cityPattern) {
            catLocResults = await prisma.$queryRaw`
              SELECT DISTINCT r.slug, r.name, r.city, r.state
              FROM restaurants r
              JOIN restaurant_categories rc ON rc.restaurant_id = r.id AND rc.verified = true
              JOIN food_categories fc ON fc.id = rc.food_category_id
              WHERE r.status = 'active'
                AND fc.slug = ANY(${catSlugs})
                AND r.city ILIKE ${cityPattern}
              ORDER BY r.name ASC
              LIMIT 10
            `
          } else {
            catLocResults = []
          }
          for (const r of catLocResults) {
            if (!seenSlugs.has(r.slug)) {
              seenSlugs.add(r.slug)
              allRestaurants.push(r)
            }
          }
        }

        // b) Name + location: find restaurants by name in location
        if (stateCode) {
          const nameLocResults = await prisma.$queryRaw<
            Array<{ slug: string; name: string; city: string; state: string }>
          >`
            SELECT slug, name, city, state FROM restaurants
            WHERE status = 'active' AND state = ${stateCode}
              AND (name ILIKE ${'%' + termA + '%'} OR similarity(name, ${termA}) > 0.2)
            ORDER BY similarity(name, ${termA}) DESC
            LIMIT 8
          `
          for (const r of nameLocResults) {
            if (!seenSlugs.has(r.slug)) {
              seenSlugs.add(r.slug)
              allRestaurants.push(r)
            }
          }
        } else if (cityPattern) {
          const nameLocResults = await prisma.$queryRaw<
            Array<{ slug: string; name: string; city: string; state: string }>
          >`
            SELECT slug, name, city, state FROM restaurants
            WHERE status = 'active' AND city ILIKE ${cityPattern}
              AND (name ILIKE ${'%' + termA + '%'} OR similarity(name, ${termA}) > 0.2)
            ORDER BY similarity(name, ${termA}) DESC
            LIMIT 8
          `
          for (const r of nameLocResults) {
            if (!seenSlugs.has(r.slug)) {
              seenSlugs.add(r.slug)
              allRestaurants.push(r)
            }
          }
        }
      }
    }

    // Post-filter: when a location was detected, remove out-of-location direct results
    if (detectedState || detectedCityTerm) {
      const filtered = allRestaurants.filter(r => {
        if (detectedState && r.state === detectedState) return true
        if (detectedCityTerm && r.city.toLowerCase().includes(detectedCityTerm)) return true
        return false
      })
      if (filtered.length > 0) {
        allRestaurants.length = 0
        allRestaurants.push(...filtered)
        seenSlugs.clear()
        for (const r of allRestaurants) seenSlugs.add(r.slug)
      }
    }

    // Merge newly discovered fuzzy-matched categories into results
    const catSeen = new Set(mappedCategories.map(c => c.slug))
    for (const cats of Array.from(fuzzyCatCache.values())) {
      for (const c of cats) {
        if (!catSeen.has(c.slug)) {
          catSeen.add(c.slug)
          mappedCategories.push(c)
        }
      }
    }
  }

  // 4. If still no restaurants and we have categories, show restaurants from those categories
  if (allRestaurants.length === 0 && mappedCategories.length > 0) {
    const catSlugs = mappedCategories.map(c => c.slug)
    const catRestaurants = await prisma.$queryRaw<
      Array<{ slug: string; name: string; city: string; state: string }>
    >`
      SELECT DISTINCT r.slug, r.name, r.city, r.state
      FROM restaurants r
      JOIN restaurant_categories rc ON rc.restaurant_id = r.id AND rc.verified = true
      JOIN food_categories fc ON fc.id = rc.food_category_id
      WHERE r.status = 'active' AND fc.slug = ANY(${catSlugs})
      ORDER BY r.name ASC
      LIMIT 8
    `
    for (const r of catRestaurants) {
      if (!seenSlugs.has(r.slug)) {
        seenSlugs.add(r.slug)
        allRestaurants.push(r)
      }
    }
  }

  return {
    restaurants: allRestaurants.slice(0, 10),
    categories: mappedCategories,
  }
}

// ─── Full Search (for /search page) ──────────────────────────────────────────

export type SearchCity = { city: string; state: string; restaurantCount: number }
export type SearchState = { state: string; stateCode: string; restaurantCount: number }
export type SearchCategory = { slug: string; name: string; iconEmoji: string; iconUrl: string | null; restaurantCount: number }
export type SearchRestaurant = { slug: string; name: string; city: string; state: string }
export type SearchCritic = { slug: string; displayName: string; avatarUrl: string | null; city: string | null; state: string | null }
export type SearchCombo = { categorySlug: string; categoryName: string; iconEmoji: string; iconUrl: string | null; city: string; state: string }

export type FullSearchResults = {
  combos: SearchCombo[]
  categories: SearchCategory[]
  restaurants: SearchRestaurant[]
  cities: SearchCity[]
  states: SearchState[]
  critics: SearchCritic[]
  suggestion?: string
}

export type SearchFilters = {
  state?: string
  city?: string
  categorySlug?: string
}

export async function searchFull(query: string, filters?: SearchFilters): Promise<FullSearchResults> {
  const q = query.trim()
  if (q.length < 2) return { combos: [], categories: [], restaurants: [], cities: [], states: [], critics: [] }

  const words = q.split(/\s+/)
  const isMultiWord = words.length > 1

  // Build optional restaurant filter SQL fragments
  const stateFilter = filters?.state ? Prisma.sql`AND r.state = ${filters.state}` : Prisma.empty
  const cityFilter = filters?.city ? Prisma.sql`AND LOWER(r.city) = LOWER(${filters.city})` : Prisma.empty
  const catFilterJoin = filters?.categorySlug
    ? Prisma.sql`JOIN restaurant_categories frc ON frc.restaurant_id = r.id AND frc.verified = true
                 JOIN food_categories ffc ON ffc.id = frc.food_category_id AND ffc.slug = ${filters.categorySlug}`
    : Prisma.empty

  // Consonant skeleton for vowel-dropped abbreviations (e.g. "brgr" → matches "Burgers")
  const qConsonants = q.toLowerCase().replace(/[aeiou\s]/g, '')
  const consonantMatch = qConsonants.length >= 3
    ? Prisma.sql`OR regexp_replace(lower(fc.name), '[aeiou ]', '', 'g') LIKE ${'%' + qConsonants + '%'}`
    : Prisma.empty

  // Pre-compute state matches (client-side lookup, no DB needed)
  const qLower = q.toLowerCase()
  const matchedStates: string[] = Object.entries(STATE_NAMES)
    .filter(([code, name]) => code.toLowerCase().includes(qLower) || name.toLowerCase().includes(qLower))
    .map(([code]) => code)

  // Pre-compute multi-word split work and unique terms for parallel fuzzy cat lookups
  type SplitWorkItem = { termA: string; termB: string; stateCode: string | null; cityPattern: string | null }
  const splitWork: SplitWorkItem[] = []
  const uniqueCatTerms = new Set<string>()
  let detectedStateFull: string | null = null
  let detectedCityTermFull: string | null = null

  if (isMultiWord) {
    for (let i = 1; i < words.length; i++) {
      const partA = words.slice(0, i).join(' ')
      const partB = words.slice(i).join(' ')
      for (const [termA, termB] of [[partA, partB], [partB, partA]]) {
        const stateCode = resolveStateCode(termB)
        const cityPattern = resolveCityPattern(termB)
        if (stateCode && !detectedStateFull) detectedStateFull = stateCode
        if (cityPattern && !stateCode && !detectedCityTermFull && termB.length >= 3) detectedCityTermFull = termB.toLowerCase()
        splitWork.push({ termA, termB, stateCode, cityPattern })
        uniqueCatTerms.add(termA.toLowerCase())
      }
    }
  }

  // Build per-term fuzzy category lookup promises (run in parallel with core queries)
  const fuzzyCatPromises = Array.from(uniqueCatTerms).map(async (term) => {
    const termConsonants = term.replace(/[aeiou\s]/g, '')
    const termConsonantMatch = termConsonants.length >= 3
      ? Prisma.sql`OR regexp_replace(lower(name), '[aeiou ]', '', 'g') LIKE ${'%' + termConsonants + '%'}`
      : Prisma.empty

    const rows = await prisma.$queryRaw<
      Array<{ slug: string; name: string; icon_emoji: string; icon_url: string | null }>
    >`
      SELECT slug, name, icon_emoji, icon_url
      FROM food_categories
      WHERE status = 'active'
        AND (
          name ILIKE ${'%' + term + '%'}
          OR (similarity(name, ${term}) > CASE WHEN length(${term}) > 6 THEN 0.25 ELSE 0.15 END
              AND length(name) <= length(${term}) * 1.3)
          OR word_similarity(${term}, name) > 0.55
          ${termConsonantMatch}
        )
      LIMIT 5
    `
    return [term, rows.map(c => ({ slug: c.slug, name: c.name, iconEmoji: c.icon_emoji, iconUrl: c.icon_url }))] as const
  })

  // ── PHASE 1: Run ALL independent queries in parallel ──
  const [[categories, directRestaurants, cityRows, critics, stateRows], catLookupEntries] = await Promise.all([
    Promise.all([
    // Fuzzy category search via trigram
    prisma.$queryRaw<
      Array<{ id: string; slug: string; name: string; icon_emoji: string; icon_url: string | null; restaurant_count: bigint; sim: number }>
    >`
      SELECT fc.id, fc.slug, fc.name, fc.icon_emoji, fc.icon_url,
             (SELECT COUNT(*) FROM restaurant_categories rc
              JOIN restaurants r ON r.id = rc.restaurant_id AND r.status = 'active'
              WHERE rc.food_category_id = fc.id AND rc.verified = true
             ) AS restaurant_count,
             GREATEST(similarity(fc.name, ${q}), word_similarity(${q}, fc.name)) AS sim
      FROM food_categories fc
      WHERE fc.status = 'active'
        AND (
          fc.name ILIKE ${'%' + q + '%'}
          OR (similarity(fc.name, ${q}) > CASE WHEN length(${q}) > 6 THEN 0.25 ELSE 0.15 END
              AND length(fc.name) BETWEEN length(${q}) * 0.7 AND length(${q}) * 1.3)
          OR word_similarity(${q}, fc.name) > 0.7
          ${consonantMatch}
        )
      ORDER BY
        CASE WHEN fc.name ILIKE ${'%' + q + '%'} THEN 0 ELSE 1 END,
        sim DESC
    `,

    // Fuzzy restaurant search with optional filters
    prisma.$queryRaw<
      Array<{ slug: string; name: string; city: string; state: string; sim: number }>
    >`
      SELECT r.slug, r.name, r.city, r.state,
             GREATEST(similarity(r.name, ${q}), word_similarity(${q}, r.name)) AS sim
      FROM restaurants r
      ${catFilterJoin}
      WHERE r.status = 'active'
        ${stateFilter}
        ${cityFilter}
        AND (
          r.name ILIKE ${'%' + q + '%'}
          OR similarity(r.name, ${q}) > 0.2
          OR word_similarity(${q}, r.name) > 0.35
        )
      ORDER BY
        CASE WHEN r.name ILIKE ${'%' + q + '%'} THEN 0 ELSE 1 END,
        sim DESC
      LIMIT 25
    `,

    // Fuzzy city search
    prisma.$queryRaw<Array<{ city: string; state: string; count: bigint }>>`
      SELECT city, state, COUNT(*) as count
      FROM restaurants
      WHERE status = 'active'
        AND (
          city ILIKE ${'%' + q + '%'}
          OR similarity(city, ${q}) > 0.3
        )
      GROUP BY city, state
      ORDER BY
        CASE WHEN city ILIKE ${'%' + q + '%'} THEN 0 ELSE 1 END,
        count DESC, city ASC
    `,

    // Fuzzy critics search
    prisma.$queryRaw<
      Array<{ slug: string; display_name: string; avatar_url: string | null; city: string | null; state: string | null }>
    >`
      SELECT slug, display_name, avatar_url, city, state
      FROM users
      WHERE slug IS NOT NULL
        AND (
          display_name ILIKE ${'%' + q + '%'}
          OR similarity(display_name, ${q}) > 0.25
        )
      ORDER BY
        CASE WHEN display_name ILIKE ${'%' + q + '%'} THEN 0 ELSE 1 END,
        similarity(display_name, ${q}) DESC
      LIMIT 20
    `,

      // State restaurant counts (moved from sequential to parallel)
      matchedStates.length > 0
        ? prisma.$queryRaw<Array<{ state: string; count: bigint }>>`
            SELECT state, COUNT(*) as count
            FROM restaurants
            WHERE status = 'active' AND state = ANY(${matchedStates})
            GROUP BY state ORDER BY count DESC
          `
        : Promise.resolve([] as Array<{ state: string; count: bigint }>),
    ]),
    // Per-term fuzzy category lookups (for multi-word queries)
    Promise.all(fuzzyCatPromises),
  ])

  // Map categories
  const mappedCategories: SearchCategory[] = categories.map(c => ({
    slug: c.slug, name: c.name, iconEmoji: c.icon_emoji, iconUrl: c.icon_url,
    restaurantCount: Number(c.restaurant_count),
  }))

  // Map cities
  const cities: SearchCity[] = cityRows.map(r => ({
    city: r.city, state: r.state, restaurantCount: Number(r.count),
  }))

  // Map states (from parallel query)
  const states: SearchState[] = stateRows.map(r => ({
    state: STATE_NAMES[r.state] || r.state,
    stateCode: r.state,
    restaurantCount: Number(r.count),
  }))

  // Map critics
  const mappedCritics: SearchCritic[] = critics.map(u => ({
    slug: u.slug!, displayName: u.display_name, avatarUrl: u.avatar_url,
    city: u.city, state: u.state,
  }))

  // Build fuzzy category cache from parallel lookups (shared with combo building)
  const fuzzyCatCache = new Map(catLookupEntries)

  const allRestaurants: SearchRestaurant[] = directRestaurants.map(r => ({
    slug: r.slug, name: r.name, city: r.city, state: r.state,
  }))
  const seenSlugs = new Set(directRestaurants.map(r => r.slug))

  // ── PHASE 2: Location-dependent queries in parallel ──
  if (isMultiWord && splitWork.length > 0) {
    const locationPromises: Array<Promise<Array<{ slug: string; name: string; city: string; state: string }>>> = []

    for (const { termA, stateCode, cityPattern } of splitWork) {
      const matchedCats = fuzzyCatCache.get(termA.toLowerCase()) || []
      const catSlugs = matchedCats.map(c => c.slug)

      // Category + location restaurants
      if (catSlugs.length > 0 && stateCode) {
        locationPromises.push(prisma.$queryRaw`
          SELECT DISTINCT r.slug, r.name, r.city, r.state
          FROM restaurants r
          JOIN restaurant_categories rc ON rc.restaurant_id = r.id AND rc.verified = true
          JOIN food_categories fc ON fc.id = rc.food_category_id
          ${catFilterJoin}
          WHERE r.status = 'active'
            AND fc.slug = ANY(${catSlugs})
            AND r.state = ${stateCode}
            ${stateFilter} ${cityFilter}
          ORDER BY r.name ASC LIMIT 15
        `)
      } else if (catSlugs.length > 0 && cityPattern) {
        locationPromises.push(prisma.$queryRaw`
          SELECT DISTINCT r.slug, r.name, r.city, r.state
          FROM restaurants r
          JOIN restaurant_categories rc ON rc.restaurant_id = r.id AND rc.verified = true
          JOIN food_categories fc ON fc.id = rc.food_category_id
          ${catFilterJoin}
          WHERE r.status = 'active'
            AND fc.slug = ANY(${catSlugs})
            AND r.city ILIKE ${cityPattern}
            ${stateFilter} ${cityFilter}
          ORDER BY r.name ASC LIMIT 15
        `)
      }

      // Name + location restaurants
      if (stateCode) {
        locationPromises.push(prisma.$queryRaw<
          Array<{ slug: string; name: string; city: string; state: string }>
        >`
          SELECT slug, name, city, state FROM restaurants
          WHERE status = 'active' AND state = ${stateCode}
            AND (name ILIKE ${'%' + termA + '%'} OR similarity(name, ${termA}) > 0.2)
          ORDER BY similarity(name, ${termA}) DESC
          LIMIT 10
        `)
      } else if (cityPattern) {
        locationPromises.push(prisma.$queryRaw<
          Array<{ slug: string; name: string; city: string; state: string }>
        >`
          SELECT slug, name, city, state FROM restaurants
          WHERE status = 'active' AND city ILIKE ${cityPattern}
            AND (name ILIKE ${'%' + termA + '%'} OR similarity(name, ${termA}) > 0.2)
          ORDER BY similarity(name, ${termA}) DESC
          LIMIT 10
        `)
      }
    }

    // Execute all location queries in parallel
    if (locationPromises.length > 0) {
      const locationResults = await Promise.all(locationPromises)
      for (const rows of locationResults) {
        for (const r of rows) {
          if (!seenSlugs.has(r.slug)) {
            seenSlugs.add(r.slug)
            allRestaurants.push(r)
          }
        }
      }
    }

    // Post-filter: when a location was detected, remove out-of-location direct results
    if (detectedStateFull || detectedCityTermFull) {
      const filtered = allRestaurants.filter(r => {
        if (detectedStateFull && r.state === detectedStateFull) return true
        if (detectedCityTermFull && r.city.toLowerCase().includes(detectedCityTermFull)) return true
        return false
      })
      if (filtered.length > 0) {
        allRestaurants.length = 0
        allRestaurants.push(...filtered)
        seenSlugs.clear()
        for (const r of allRestaurants) seenSlugs.add(r.slug)
      }
    }

    // Merge newly discovered fuzzy-matched categories into results
    const catSeen = new Set(mappedCategories.map(c => c.slug))
    for (const cats of Array.from(fuzzyCatCache.values())) {
      for (const c of cats) {
        if (!catSeen.has(c.slug)) {
          catSeen.add(c.slug)
          mappedCategories.push({ ...c, restaurantCount: 0 })
        }
      }
    }
  }

  // If category matched but no restaurants yet, pull some from those categories
  if (allRestaurants.length === 0 && mappedCategories.length > 0) {
    const catSlugs = mappedCategories.map(c => c.slug)
    const catRestaurants = await prisma.$queryRaw<
      Array<{ slug: string; name: string; city: string; state: string }>
    >`
      SELECT DISTINCT r.slug, r.name, r.city, r.state
      FROM restaurants r
      JOIN restaurant_categories rc ON rc.restaurant_id = r.id AND rc.verified = true
      JOIN food_categories fc ON fc.id = rc.food_category_id
      WHERE r.status = 'active' AND fc.slug = ANY(${catSlugs})
      ORDER BY r.name ASC LIMIT 20
    `
    for (const r of catRestaurants) {
      if (!seenSlugs.has(r.slug)) {
        seenSlugs.add(r.slug)
        allRestaurants.push(r)
      }
    }
  }

  // --- Build combos (category + city AND category + state) ---
  const combos: SearchCombo[] = []
  const comboKeys = new Set<string>()

  if (isMultiWord) {
    for (let i = 1; i < words.length; i++) {
      const partA = words.slice(0, i).join(' ')
      const partB = words.slice(i).join(' ')

      for (const [cp, lp] of [[partA, partB], [partB, partA]]) {
        // Use pre-populated fuzzy category cache (no DB queries needed)
        const matchedCats = fuzzyCatCache.get(cp.toLowerCase()) || []

        // Category × city combos
        const matchedCitiesForLoc = cities.filter(c =>
          c.city.toLowerCase().includes(lp.toLowerCase())
        )
        for (const cat of matchedCats) {
          for (const city of matchedCitiesForLoc) {
            const key = `${cat.slug}|${city.city}|${city.state}`
            if (!comboKeys.has(key)) {
              comboKeys.add(key)
              combos.push({
                categorySlug: cat.slug, categoryName: cat.name,
                iconEmoji: cat.iconEmoji, iconUrl: cat.iconUrl,
                city: city.city, state: city.state,
              })
            }
          }
        }

        // Category × state combos
        const stateCode = resolveStateCode(lp)
        if (stateCode) {
          for (const cat of matchedCats) {
            const key = `${cat.slug}||${stateCode}`
            if (!comboKeys.has(key)) {
              comboKeys.add(key)
              combos.push({
                categorySlug: cat.slug, categoryName: cat.name,
                iconEmoji: cat.iconEmoji, iconUrl: cat.iconUrl,
                city: '', state: stateCode,
              })
            }
          }
        }
      }
    }
  }

  // --- "Did you mean?" suggestion when no results ---
  const hasResults = combos.length > 0 || mappedCategories.length > 0 || allRestaurants.length > 0
    || cities.length > 0 || states.length > 0 || mappedCritics.length > 0
  let suggestion: string | undefined

  if (!hasResults && q.length >= 3) {
    // Find closest restaurant name, category name, or city via trigram similarity
    const suggestions = await prisma.$queryRaw<Array<{ term: string; sim: number }>>`
      (SELECT name AS term, similarity(name, ${q}) AS sim FROM restaurants WHERE status = 'active' AND similarity(name, ${q}) > 0.1 ORDER BY sim DESC LIMIT 1)
      UNION ALL
      (SELECT name AS term, similarity(name, ${q}) AS sim FROM food_categories WHERE status = 'active' AND similarity(name, ${q}) > 0.1 ORDER BY sim DESC LIMIT 1)
      UNION ALL
      (SELECT DISTINCT city AS term, similarity(city, ${q}) AS sim FROM restaurants WHERE status = 'active' AND similarity(city, ${q}) > 0.15 ORDER BY sim DESC LIMIT 1)
      ORDER BY sim DESC
      LIMIT 1
    `
    if (suggestions.length > 0 && suggestions[0].term.toLowerCase() !== q.toLowerCase()) {
      suggestion = suggestions[0].term
    }
  }

  return {
    combos,
    categories: mappedCategories,
    restaurants: allRestaurants,
    cities,
    states,
    critics: mappedCritics,
    suggestion,
  }
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

export const getUserProfile = cache(async (slug: string) => {
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
      goldMedalComment: {
        where: { active: true },
        select: {
          id: true,
          comment: true,
          photoUrl: true,
          _count: { select: { upvotes: true } },
        },
      },
    },
    orderBy: [{ foodCategory: { sortOrder: 'asc' } }, { medalType: 'asc' }],
  })

  return { user, medals, year }
})

// ─── Restaurant Highlights (Gold Medal Comments) ────────────────────────────

export type HighlightRow = {
  id:           string
  userId:       string
  medalId:      string | null
  comment:      string
  photoUrl:     string | null
  createdAt:    Date
  year:         number
  categoryName: string
  categorySlug: string
  iconEmoji:    string
  iconUrl:      string | null
  userName:     string
  userSlug:     string | null
  userAvatar:   string | null
  upvoteCount:  number
  userCategoryCount: number
}

export async function getRestaurantHighlights(
  restaurantId: string,
  options?: { limit?: number; offset?: number; sort?: 'popular' | 'newest' },
): Promise<{ highlights: HighlightRow[]; total: number }> {
  const limit  = options?.limit  ?? 10
  const offset = options?.offset ?? 0
  const sort   = options?.sort   ?? 'popular'

  const orderClause = sort === 'newest'
    ? Prisma.sql`gmc.created_at DESC`
    : Prisma.sql`upvote_count DESC, gmc.created_at DESC`

  const [rows, countResult] = await Promise.all([
    prisma.$queryRaw<
      Array<{
        id:            string
        user_id:       string
        medal_id:      string | null
        comment:       string
        photo_url:     string | null
        created_at:    Date
        year:          number
        category_name: string
        category_slug: string
        icon_emoji:    string
        icon_url:      string | null
        display_name:  string
        user_slug:     string | null
        avatar_url:    string | null
        upvote_count:  bigint
        user_category_count: bigint
      }>
    >`
      SELECT
        gmc.id,
        gmc.user_id,
        gmc.medal_id,
        gmc.comment,
        gmc.photo_url,
        gmc.created_at,
        gmc.year,
        fc.name  AS category_name,
        fc.slug  AS category_slug,
        fc.icon_emoji,
        fc.icon_url,
        u.display_name,
        u.slug   AS user_slug,
        u.avatar_url,
        COUNT(cu.id) AS upvote_count,
        (SELECT COUNT(DISTINCT m2.food_category_id)
         FROM medals m2 WHERE m2.user_id = gmc.user_id AND m2.year = gmc.year
        ) AS user_category_count
      FROM gold_medal_comments gmc
      JOIN users u             ON u.id  = gmc.user_id
      JOIN food_categories fc  ON fc.id = gmc.food_category_id
      LEFT JOIN medals m       ON m.id  = gmc.medal_id
      LEFT JOIN comment_upvotes cu ON cu.comment_id = gmc.id
      WHERE gmc.restaurant_id = ${restaurantId}
        AND gmc.active = true
      GROUP BY gmc.id, gmc.user_id, gmc.medal_id, gmc.comment, gmc.photo_url, gmc.created_at, gmc.year, fc.name, fc.slug, fc.icon_emoji, fc.icon_url, u.display_name, u.slug, u.avatar_url
      ORDER BY ${orderClause}
      LIMIT ${limit}
      OFFSET ${offset}
    `,
    prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count
      FROM gold_medal_comments
      WHERE restaurant_id = ${restaurantId}
        AND active = true
    `,
  ])

  const total = Number(countResult[0].count)

  return {
    total,
    highlights: rows.map(r => ({
      id:           r.id,
      userId:       r.user_id,
      medalId:      r.medal_id,
      comment:      r.comment,
      photoUrl:     r.photo_url,
      createdAt:    r.created_at,
      year:         r.year,
      categoryName: r.category_name,
      categorySlug: r.category_slug,
      iconEmoji:    r.icon_emoji,
      iconUrl:      r.icon_url,
      userName:     r.display_name,
      userSlug:     r.user_slug,
      userAvatar:   r.avatar_url,
      upvoteCount:  Number(r.upvote_count),
      userCategoryCount: Number(r.user_category_count),
    })),
  }
}

// ─── Restaurant Category Rankings ────────────────────────────────────────────

export type CategoryRankingRow = {
  categoryId:   string
  categoryName: string
  categorySlug: string
  iconEmoji:    string
  iconUrl:      string | null
  cityRank:     number
  stateRank:    number
  city:         string
  state:        string
  totalScore:   number
}

export async function getRestaurantCategoryRankings(
  restaurantId: string,
  year: number,
): Promise<CategoryRankingRow[]> {
  const rows = await prisma.$queryRaw<
    Array<{
      food_category_id: string
      category_name:    string
      category_slug:    string
      icon_emoji:       string
      icon_url:         string | null
      city_rank:        bigint
      state_rank:       bigint
      city:             string
      state:            string
      total_score:      bigint
    }>
  >`
    WITH scored AS (
      SELECT
        m.restaurant_id,
        m.food_category_id,
        r.city,
        r.state,
        (COUNT(*) FILTER (WHERE m.medal_type = 'gold')   * 3 +
         COUNT(*) FILTER (WHERE m.medal_type = 'silver') * 2 +
         COUNT(*) FILTER (WHERE m.medal_type = 'bronze') * 1 +
         COUNT(*) FILTER (WHERE m.id = u.crown_jewel_medal_id) +
         COUNT(gmc.id) +
         COUNT(gmc.id) FILTER (WHERE gmc.photo_url IS NOT NULL)) AS total_score
      FROM medals m
      JOIN restaurants r ON r.id = m.restaurant_id AND r.status = 'active'
      LEFT JOIN users u ON u.id = m.user_id
      LEFT JOIN gold_medal_comments gmc ON gmc.medal_id = m.id AND gmc.active = true
      WHERE m.year = ${year}
      GROUP BY m.restaurant_id, m.food_category_id, r.city, r.state
      HAVING (COUNT(*) FILTER (WHERE m.medal_type IS NOT NULL)) > 0
    ),
    city_ranked AS (
      SELECT *,
        RANK() OVER (
          PARTITION BY food_category_id, city, state
          ORDER BY total_score DESC
        ) AS city_rank
      FROM scored
    ),
    state_ranked AS (
      SELECT restaurant_id, food_category_id,
        RANK() OVER (
          PARTITION BY food_category_id, state
          ORDER BY total_score DESC
        ) AS state_rank
      FROM scored
    )
    SELECT
      c.food_category_id,
      fc.name  AS category_name,
      fc.slug  AS category_slug,
      fc.icon_emoji,
      fc.icon_url,
      c.city_rank,
      s.state_rank,
      c.city,
      c.state,
      c.total_score
    FROM city_ranked c
    JOIN state_ranked s
      ON  s.restaurant_id    = c.restaurant_id
      AND s.food_category_id = c.food_category_id
    JOIN food_categories fc ON fc.id = c.food_category_id
    WHERE c.restaurant_id = ${restaurantId}
      AND (c.city_rank <= 3 OR s.state_rank <= 3)
    ORDER BY c.city_rank ASC, s.state_rank ASC
  `

  return rows.map(r => ({
    categoryId:   r.food_category_id,
    categoryName: r.category_name,
    categorySlug: r.category_slug,
    iconEmoji:    r.icon_emoji,
    iconUrl:      r.icon_url,
    cityRank:     Number(r.city_rank),
    stateRank:    Number(r.state_rank),
    city:         r.city,
    state:        r.state,
    totalScore:   Number(r.total_score),
  }))
}
