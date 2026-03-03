import 'dotenv/config'
import { PrismaClient } from '../app/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool    = new Pool({ connectionString: process.env.DATABASE_URL!, max: 1 })
const adapter = new PrismaPg(pool)
const prisma  = new PrismaClient({ adapter })

// [oldSlug, keepSlug] — old is the pre-seed user-submitted duplicate
const pairs: [string, string][] = [
  ['lucky-13-slc',         'lucky-13'],
  ['kyoto-japanese-slc',   'kyoto'],
  ['bombay-house-provo',   'bombay-house'],
  ['randb-bbq-slc',        'r-and-r-bbq'],
  ['roosters-ogden',       'roosters-brewing-ogden'],
  ['slackwater-pub-ogden', 'slackwater-ogden'],
  ['takashi-slc',          'takashi'],
]

async function main() {
  for (const [oldSlug, keepSlug] of pairs) {
    const oldRec = await prisma.restaurant.findUnique({
      where: { slug: oldSlug },
      include: { categories: { select: { foodCategoryId: true } } },
    })
    const keepRec = await prisma.restaurant.findUnique({ where: { slug: keepSlug } })

    if (!oldRec || !keepRec) {
      console.warn('MISSING:', oldSlug, 'or', keepSlug)
      continue
    }

    // 1. Re-point all medals from old -> keep
    const { count: medalsMoved } = await prisma.medal.updateMany({
      where: { restaurantId: oldRec.id },
      data:  { restaurantId: keepRec.id },
    })

    // 2. Add any category links the old record had that keep doesn't
    const keepLinks = await prisma.restaurantCategory.findMany({
      where:  { restaurantId: keepRec.id },
      select: { foodCategoryId: true },
    })
    const keepCatIds = new Set(keepLinks.map(l => l.foodCategoryId))

    let linksAdded = 0
    for (const { foodCategoryId } of oldRec.categories) {
      if (!keepCatIds.has(foodCategoryId)) {
        await prisma.restaurantCategory.create({
          data: { restaurantId: keepRec.id, foodCategoryId, verified: true },
        })
        linksAdded++
      }
    }

    // 3. Delete old category links, then old restaurant record
    await prisma.restaurantCategory.deleteMany({ where: { restaurantId: oldRec.id } })
    await prisma.restaurant.delete({ where: { id: oldRec.id } })

    console.log(`OK ${oldSlug} -> ${keepSlug}: ${medalsMoved} medals migrated, ${linksAdded} links added, old record deleted`)
  }

  const total = await prisma.restaurant.count()
  console.log('Done! Restaurants remaining:', total)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
