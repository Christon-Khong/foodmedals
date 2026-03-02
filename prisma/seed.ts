import 'dotenv/config'
import { PrismaClient } from '../app/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'

const pool    = new Pool({ connectionString: process.env.DATABASE_URL!, max: 3 })
const adapter = new PrismaPg(pool)
const prisma  = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding database...')

  // ─── Food Categories ────────────────────────────────────────────────────────
  const categoryData = [
    { name: 'Cheeseburgers',         slug: 'cheeseburgers',          iconEmoji: '🍔', sortOrder: 1 },
    { name: 'French Fries',          slug: 'french-fries',           iconEmoji: '🍟', sortOrder: 2 },
    { name: 'Tacos',                 slug: 'tacos',                  iconEmoji: '🌮', sortOrder: 3 },
    { name: 'Pizza',                 slug: 'pizza',                  iconEmoji: '🍕', sortOrder: 4 },
    { name: 'Burritos',              slug: 'burritos',               iconEmoji: '🌯', sortOrder: 5 },
    { name: 'Wings',                 slug: 'wings',                  iconEmoji: '🍗', sortOrder: 6 },
    { name: 'Fried Chicken Sandwich',slug: 'fried-chicken-sandwich', iconEmoji: '🥪', sortOrder: 7 },
    { name: 'Milkshakes',            slug: 'milkshakes',             iconEmoji: '🥤', sortOrder: 8 },
    { name: 'Onion Rings',           slug: 'onion-rings',            iconEmoji: '🧅', sortOrder: 9 },
    { name: 'Fish Tacos',            slug: 'fish-tacos',             iconEmoji: '🐟', sortOrder: 10 },
    { name: 'Nachos',                slug: 'nachos',                 iconEmoji: '🧀', sortOrder: 11 },
    { name: 'Pulled Pork',           slug: 'pulled-pork',            iconEmoji: '🥩', sortOrder: 12 },
    { name: 'Mac & Cheese',          slug: 'mac-and-cheese',         iconEmoji: '🧀', sortOrder: 13 },
    { name: 'Ramen',                 slug: 'ramen',                  iconEmoji: '🍜', sortOrder: 14 },
    { name: 'Pad Thai',              slug: 'pad-thai',               iconEmoji: '🍝', sortOrder: 15 },
  ]

  const categories: Record<string, string> = {}
  for (const cat of categoryData) {
    const c = await prisma.foodCategory.upsert({
      where: { slug: cat.slug },
      update: {},
      create: { ...cat, status: 'active' },
    })
    categories[cat.slug] = c.id
  }
  console.log(`✅ ${categoryData.length} categories seeded`)

  // ─── Restaurants ────────────────────────────────────────────────────────────
  const restaurantData = [
    // Salt Lake City
    { name: "Crown Burgers",          slug: "crown-burgers-slc",       address: "3190 S Highland Dr",    city: "Salt Lake City", zip: "84106", description: "Utah institution famous for pastrami-topped burgers since 1978." },
    { name: "Lucky 13 Bar & Grill",   slug: "lucky-13-slc",            address: "135 W 1300 S",          city: "Salt Lake City", zip: "84115", description: "Classic dive bar with some of SLC's most celebrated burgers." },
    { name: "Red Rock Brewing Co.",   slug: "red-rock-brewing",        address: "254 S 200 W",           city: "Salt Lake City", zip: "84101", description: "Brewpub with award-winning pub fare and craft beers." },
    { name: "Boltcutter",             slug: "boltcutter-slc",          address: "63 W 100 S",            city: "Salt Lake City", zip: "84101", description: "Elevated sandwiches and small plates in downtown SLC." },
    { name: "Tacos El Gordo",         slug: "tacos-el-gordo-slc",      address: "2390 S Redwood Rd",     city: "Salt Lake City", zip: "84119", description: "Authentic Tijuana-style tacos from the renowned chain." },
    { name: "Lone Star Taqueria",     slug: "lone-star-taqueria",      address: "2265 E Fort Union Blvd",city: "Salt Lake City", zip: "84121", description: "Fast-casual Tex-Mex with massive, foil-wrapped burritos." },
    { name: "The Pie Pizzeria",       slug: "the-pie-pizzeria",        address: "1320 E 200 S",          city: "Salt Lake City", zip: "84102", description: "Beloved basement pizza joint serving the U of U crowd since 1980." },
    { name: "Handle",                 slug: "handle-park-city",        address: "136 Heber Ave",         city: "Park City",      zip: "84060", description: "Modern American comfort food with a refined touch." },
    { name: "Franck's",               slug: "francks-slc",             address: "6263 S Holladay Blvd",  city: "Salt Lake City", zip: "84121", description: "Fine dining bistro with housemade pastas and local ingredients." },
    { name: "Epic Brewing",           slug: "epic-brewing-slc",        address: "1048 E 2100 S",         city: "Salt Lake City", zip: "84106", description: "Bold craft beers paired with satisfying brewpub food." },
    // Provo
    { name: "Communal Restaurant",    slug: "communal-provo",          address: "102 N University Ave",  city: "Provo",          zip: "84601", description: "Farm-to-table comfort dishes in a warm, shared-table setting." },
    { name: "Station 22",             slug: "station-22-provo",        address: "22 W Center St",        city: "Provo",          zip: "84601", description: "Casual American spot known for big portions and great fries." },
    { name: "Guru's Cafe",            slug: "gurus-cafe-provo",        address: "45 E Center St",        city: "Provo",          zip: "84606", description: "Health-conscious cafe with global flavors and fresh ingredients." },
    { name: "Bombay House",           slug: "bombay-house-provo",      address: "463 N University Ave",  city: "Provo",          zip: "84601", description: "Utah's favorite Indian restaurant, beloved for 30+ years." },
    { name: "Los Hermanos",           slug: "los-hermanos-provo",      address: "16 W Center St",        city: "Provo",          zip: "84601", description: "Traditional Mexican with house-made tortillas and fiery salsas." },
    // Park City
    { name: "High West Distillery",   slug: "high-west-distillery",    address: "703 Park Ave",          city: "Park City",      zip: "84060", description: "World-class whiskey with a remarkable pub menu to match." },
    { name: "Riverhorse on Main",     slug: "riverhorse-park-city",    address: "540 Main St",           city: "Park City",      zip: "84060", description: "Upscale New American on historic Main Street." },
    // Ogden
    { name: "Roosters B&G",           slug: "roosters-ogden",          address: "253 Historic 25th St",  city: "Ogden",          zip: "84401", description: "Ogden's brewpub anchor on the historic 25th Street corridor." },
    { name: "Tona Sushi & Grill",     slug: "tona-sushi-ogden",        address: "210 Historic 25th St",  city: "Ogden",          zip: "84401", description: "Creative sushi and Japanese-fusion dishes in a lively setting." },
    { name: "Slackwater Pub",         slug: "slackwater-pub-ogden",    address: "1895 Washington Blvd",  city: "Ogden",          zip: "84401", description: "Craft pizza, artisan wings, and local craft beers." },
    { name: "El Matador",             slug: "el-matador-ogden",        address: "2564 Ogden Ave",        city: "Ogden",          zip: "84401", description: "Classic Utah Mexican joint — hearty portions since 1965." },
    { name: "Jeremiah's Restaurant",  slug: "jeremiahs-ogden",         address: "1307 W 4300 S",         city: "Ogden",          zip: "84405", description: "Comfort food staples done right, a Weber County favorite." },
  ]

  const restaurants: Record<string, string> = {}
  for (const r of restaurantData) {
    const rec = await prisma.restaurant.upsert({
      where: { slug: r.slug },
      update: {},
      create: { ...r, state: 'UT', status: 'active' },
    })
    restaurants[r.slug] = rec.id
  }
  console.log(`✅ ${restaurantData.length} restaurants seeded`)

  // ─── Restaurant ↔ Category Links ────────────────────────────────────────────
  const links: Array<[string, string]> = [
    // Cheeseburgers
    ['crown-burgers-slc',      'cheeseburgers'],
    ['lucky-13-slc',           'cheeseburgers'],
    ['red-rock-brewing',       'cheeseburgers'],
    ['station-22-provo',       'cheeseburgers'],
    ['roosters-ogden',         'cheeseburgers'],
    ['epic-brewing-slc',       'cheeseburgers'],
    // French Fries
    ['crown-burgers-slc',      'french-fries'],
    ['lucky-13-slc',           'french-fries'],
    ['station-22-provo',       'french-fries'],
    ['boltcutter-slc',         'french-fries'],
    ['slackwater-pub-ogden',   'french-fries'],
    // Tacos
    ['tacos-el-gordo-slc',     'tacos'],
    ['lone-star-taqueria',     'tacos'],
    ['los-hermanos-provo',     'tacos'],
    ['el-matador-ogden',       'tacos'],
    // Pizza
    ['the-pie-pizzeria',       'pizza'],
    ['slackwater-pub-ogden',   'pizza'],
    ['red-rock-brewing',       'pizza'],
    // Burritos
    ['lone-star-taqueria',     'burritos'],
    ['los-hermanos-provo',     'burritos'],
    ['el-matador-ogden',       'burritos'],
    ['tacos-el-gordo-slc',     'burritos'],
    // Wings
    ['roosters-ogden',         'wings'],
    ['slackwater-pub-ogden',   'wings'],
    ['epic-brewing-slc',       'wings'],
    ['red-rock-brewing',       'wings'],
    // Fried Chicken Sandwich
    ['lucky-13-slc',           'fried-chicken-sandwich'],
    ['boltcutter-slc',         'fried-chicken-sandwich'],
    ['station-22-provo',       'fried-chicken-sandwich'],
    ['communal-provo',         'fried-chicken-sandwich'],
    // Milkshakes
    ['crown-burgers-slc',      'milkshakes'],
    ['lucky-13-slc',           'milkshakes'],
    ['station-22-provo',       'milkshakes'],
    // Onion Rings
    ['lucky-13-slc',           'onion-rings'],
    ['station-22-provo',       'onion-rings'],
    ['roosters-ogden',         'onion-rings'],
    // Fish Tacos
    ['tacos-el-gordo-slc',     'fish-tacos'],
    ['lone-star-taqueria',     'fish-tacos'],
    ['high-west-distillery',   'fish-tacos'],
    // Nachos
    ['los-hermanos-provo',     'nachos'],
    ['el-matador-ogden',       'nachos'],
    ['roosters-ogden',         'nachos'],
    ['slackwater-pub-ogden',   'nachos'],
    // Pulled Pork
    ['high-west-distillery',   'pulled-pork'],
    ['roosters-ogden',         'pulled-pork'],
    ['communal-provo',         'pulled-pork'],
    // Mac & Cheese
    ['communal-provo',         'mac-and-cheese'],
    ['handle-park-city',       'mac-and-cheese'],
    ['jeremiahs-ogden',        'mac-and-cheese'],
    // Ramen
    ['tona-sushi-ogden',       'ramen'],
    ['gurus-cafe-provo',       'ramen'],
    // Pad Thai
    ['gurus-cafe-provo',       'pad-thai'],
    ['bombay-house-provo',     'pad-thai'],
    ['tona-sushi-ogden',       'pad-thai'],
  ]

  for (const [rSlug, cSlug] of links) {
    const restaurantId   = restaurants[rSlug]
    const foodCategoryId = categories[cSlug]
    if (!restaurantId || !foodCategoryId) continue
    await prisma.restaurantCategory.upsert({
      where: { restaurantId_foodCategoryId: { restaurantId, foodCategoryId } },
      update: {},
      create: { restaurantId, foodCategoryId, verified: true },
    })
  }
  console.log(`✅ ${links.length} restaurant-category links seeded`)

  // ─── Demo Users ─────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('password123', 12)

  const usersData = [
    { email: 'alice@example.com',   displayName: 'Alice M.',   city: 'Salt Lake City' },
    { email: 'bob@example.com',     displayName: 'Bob T.',     city: 'Provo'          },
    { email: 'carol@example.com',   displayName: 'Carol R.',   city: 'Park City'      },
    { email: 'david@example.com',   displayName: 'David K.',   city: 'Ogden'          },
    { email: 'emma@example.com',    displayName: 'Emma J.',    city: 'Salt Lake City' },
  ]

  const users: Record<string, string> = {}
  for (const u of usersData) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, passwordHash, state: 'UT' },
    })
    users[u.email] = user.id
  }
  console.log(`✅ ${usersData.length} demo users seeded`)

  // ─── Sample Medals (current year) ───────────────────────────────────────────
  const year = new Date().getFullYear()

  const medalData: Array<{ userEmail: string; categorySlug: string; restaurantSlug: string; medalType: 'gold' | 'silver' | 'bronze' }> = [
    // Alice — cheeseburgers
    { userEmail: 'alice@example.com', categorySlug: 'cheeseburgers', restaurantSlug: 'lucky-13-slc',       medalType: 'gold'   },
    { userEmail: 'alice@example.com', categorySlug: 'cheeseburgers', restaurantSlug: 'crown-burgers-slc',  medalType: 'silver' },
    { userEmail: 'alice@example.com', categorySlug: 'cheeseburgers', restaurantSlug: 'red-rock-brewing',   medalType: 'bronze' },
    // Alice — tacos
    { userEmail: 'alice@example.com', categorySlug: 'tacos', restaurantSlug: 'tacos-el-gordo-slc',  medalType: 'gold'   },
    { userEmail: 'alice@example.com', categorySlug: 'tacos', restaurantSlug: 'lone-star-taqueria',   medalType: 'silver' },
    { userEmail: 'alice@example.com', categorySlug: 'tacos', restaurantSlug: 'los-hermanos-provo',   medalType: 'bronze' },
    // Bob — cheeseburgers
    { userEmail: 'bob@example.com',   categorySlug: 'cheeseburgers', restaurantSlug: 'crown-burgers-slc',  medalType: 'gold'   },
    { userEmail: 'bob@example.com',   categorySlug: 'cheeseburgers', restaurantSlug: 'lucky-13-slc',       medalType: 'silver' },
    { userEmail: 'bob@example.com',   categorySlug: 'cheeseburgers', restaurantSlug: 'station-22-provo',   medalType: 'bronze' },
    // Bob — pizza
    { userEmail: 'bob@example.com',   categorySlug: 'pizza', restaurantSlug: 'the-pie-pizzeria',     medalType: 'gold'   },
    { userEmail: 'bob@example.com',   categorySlug: 'pizza', restaurantSlug: 'slackwater-pub-ogden', medalType: 'silver' },
    { userEmail: 'bob@example.com',   categorySlug: 'pizza', restaurantSlug: 'red-rock-brewing',     medalType: 'bronze' },
    // Carol — wings
    { userEmail: 'carol@example.com', categorySlug: 'wings', restaurantSlug: 'slackwater-pub-ogden', medalType: 'gold'   },
    { userEmail: 'carol@example.com', categorySlug: 'wings', restaurantSlug: 'roosters-ogden',       medalType: 'silver' },
    { userEmail: 'carol@example.com', categorySlug: 'wings', restaurantSlug: 'epic-brewing-slc',     medalType: 'bronze' },
    // Carol — milkshakes
    { userEmail: 'carol@example.com', categorySlug: 'milkshakes', restaurantSlug: 'crown-burgers-slc', medalType: 'gold'   },
    { userEmail: 'carol@example.com', categorySlug: 'milkshakes', restaurantSlug: 'lucky-13-slc',      medalType: 'silver' },
    { userEmail: 'carol@example.com', categorySlug: 'milkshakes', restaurantSlug: 'station-22-provo',  medalType: 'bronze' },
    // David — cheeseburgers
    { userEmail: 'david@example.com', categorySlug: 'cheeseburgers', restaurantSlug: 'lucky-13-slc',      medalType: 'gold'   },
    { userEmail: 'david@example.com', categorySlug: 'cheeseburgers', restaurantSlug: 'roosters-ogden',    medalType: 'silver' },
    { userEmail: 'david@example.com', categorySlug: 'cheeseburgers', restaurantSlug: 'crown-burgers-slc', medalType: 'bronze' },
    // David — burritos
    { userEmail: 'david@example.com', categorySlug: 'burritos', restaurantSlug: 'lone-star-taqueria',   medalType: 'gold'   },
    { userEmail: 'david@example.com', categorySlug: 'burritos', restaurantSlug: 'tacos-el-gordo-slc',   medalType: 'silver' },
    { userEmail: 'david@example.com', categorySlug: 'burritos', restaurantSlug: 'el-matador-ogden',     medalType: 'bronze' },
    // Emma — french fries
    { userEmail: 'emma@example.com',  categorySlug: 'french-fries', restaurantSlug: 'crown-burgers-slc',   medalType: 'gold'   },
    { userEmail: 'emma@example.com',  categorySlug: 'french-fries', restaurantSlug: 'lucky-13-slc',        medalType: 'silver' },
    { userEmail: 'emma@example.com',  categorySlug: 'french-fries', restaurantSlug: 'boltcutter-slc',      medalType: 'bronze' },
    // Emma — fried chicken sandwich
    { userEmail: 'emma@example.com',  categorySlug: 'fried-chicken-sandwich', restaurantSlug: 'boltcutter-slc',    medalType: 'gold'   },
    { userEmail: 'emma@example.com',  categorySlug: 'fried-chicken-sandwich', restaurantSlug: 'lucky-13-slc',      medalType: 'silver' },
    { userEmail: 'emma@example.com',  categorySlug: 'fried-chicken-sandwich', restaurantSlug: 'station-22-provo',  medalType: 'bronze' },
  ]

  for (const m of medalData) {
    const userId       = users[m.userEmail]
    const foodCategoryId = categories[m.categorySlug]
    const restaurantId   = restaurants[m.restaurantSlug]
    if (!userId || !foodCategoryId || !restaurantId) continue
    await prisma.medal.upsert({
      where: { userId_foodCategoryId_medalType_year: { userId, foodCategoryId, medalType: m.medalType, year } },
      update: { restaurantId },
      create: { userId, foodCategoryId, restaurantId, medalType: m.medalType, year },
    })
  }
  console.log(`✅ ${medalData.length} sample medals seeded`)

  console.log('🎉 Seed complete!')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
