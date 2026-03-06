import 'dotenv/config'
import { PrismaClient } from './app/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL!, max: 1 })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const oldSlugs = [
  'lucky-13-slc',
  'kyoto-japanese-slc',
  'bombay-house-provo',
  'randb-bbq-slc',
  'roosters-ogden',
  'slackwater-pub-ogden',
  'takashi-slc',
]

async function main() {
  for (const slug of oldSlugs) {
    const r = await prisma.restaurant.findUnique({
      where: { slug },
      include: {
        categories: { include: { foodCategory: { select: { slug: true } } } },
        medals: { select: { id: true, medalType: true, year: true, user: { select: { email: true } }, foodCategory: { select: { slug: true } } } },
      }
    })
    if (!r) { console.log(slug + ': NOT FOUND'); continue }
    console.log('--- ' + slug + ' ---')
    console.log('  name:', r.name)
    console.log('  categoryLinks:', r.categories.map(c => c.foodCategory.slug).join(', ') || 'none')
    console.log('  medals:', r.medals.length === 0 ? 'none' : r.medals.map(m => m.user.email + '/' + m.foodCategory.slug + '/' + m.medalType).join(', '))
  }
  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
