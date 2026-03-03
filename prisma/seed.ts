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

  // ─── Food Categories (25 — do not change) ───────────────────────────────────
  const categoryData = [
    { name: 'Cheeseburgers',         slug: 'cheeseburgers',         iconEmoji: '🍔', sortOrder: 1,  description: 'Classic beef patties with melted cheese — including smash burgers' },
    { name: 'Pizza',                  slug: 'pizza',                 iconEmoji: '🍕', sortOrder: 2,  description: 'From New York slices to wood-fired Neapolitan pies' },
    { name: 'French Fries',           slug: 'french-fries',          iconEmoji: '🍟', sortOrder: 3,  description: 'Crispy, golden, and loaded — every style counts' },
    { name: 'Tacos',                  slug: 'tacos',                 iconEmoji: '🌮', sortOrder: 4,  description: 'Street tacos, crunchy shells, and everything in between' },
    { name: 'Chicken Wings',          slug: 'chicken-wings',         iconEmoji: '🍗', sortOrder: 5,  description: 'Bone-in, boneless, sauced, or dry-rubbed' },
    { name: 'Fried Chicken Sandwich', slug: 'fried-chicken-sandwich',iconEmoji: '🐔', sortOrder: 6,  description: 'The crispy chicken sandwich wars — who does it best?' },
    { name: 'Burritos',               slug: 'burritos',              iconEmoji: '🌯', sortOrder: 7,  description: 'Stuffed, wrapped, and smothered — classic and California style' },
    { name: 'Sushi',                  slug: 'sushi',                 iconEmoji: '🍣', sortOrder: 8,  description: 'Nigiri, rolls, sashimi, and omakase' },
    { name: 'Ramen',                  slug: 'ramen',                 iconEmoji: '🍜', sortOrder: 9,  description: 'Rich broth, fresh noodles, perfect toppings' },
    { name: 'Mac & Cheese',           slug: 'mac-and-cheese',        iconEmoji: '🧀', sortOrder: 10, description: 'Creamy, baked, smoked, or loaded — comfort food royalty' },
    { name: 'Ice Cream',              slug: 'ice-cream',             iconEmoji: '🍦', sortOrder: 11, description: 'Scoops, soft serve, sundaes, and shakes' },
    { name: 'Chicken Tenders',        slug: 'chicken-tenders',       iconEmoji: '🍗', sortOrder: 12, description: 'Crispy strips and dipping sauces done right' },
    { name: 'Nachos',                 slug: 'nachos',                iconEmoji: '🫔', sortOrder: 13, description: 'Loaded chips with cheese, meat, and all the fixings' },
    { name: 'BBQ Ribs',              slug: 'bbq-ribs',              iconEmoji: '🍖', sortOrder: 14, description: 'Slow-smoked, fall-off-the-bone perfection' },
    { name: 'Donuts',                 slug: 'donuts',                iconEmoji: '🍩', sortOrder: 15, description: 'Glazed, filled, cake, and artisan varieties' },
    { name: 'Milkshakes',             slug: 'milkshakes',            iconEmoji: '🥤', sortOrder: 16, description: 'Thick, creamy, classic and over-the-top' },
    { name: 'Cookies',                slug: 'cookies',               iconEmoji: '🍪', sortOrder: 17, description: 'Warm, gooey, stuffed, and freshly baked' },
    { name: 'Pad Thai',               slug: 'pad-thai',              iconEmoji: '🍜', sortOrder: 18, description: 'Stir-fried rice noodles with the perfect sweet-tangy balance' },
    { name: 'Pho',                    slug: 'pho',                   iconEmoji: '🍲', sortOrder: 19, description: 'Vietnamese noodle soup with aromatic broth' },
    { name: 'Birria Tacos',           slug: 'birria-tacos',          iconEmoji: '🌮', sortOrder: 20, description: 'Consommé-dipped, crispy, cheesy — the viral taco trend' },
    { name: 'Breakfast Burritos',     slug: 'breakfast-burritos',    iconEmoji: '🌅', sortOrder: 21, description: 'Eggs, cheese, meat, green chile — a Utah morning staple' },
    { name: 'Fish Tacos',             slug: 'fish-tacos',            iconEmoji: '🐟', sortOrder: 22, description: 'Battered or grilled with fresh slaw and crema' },
    { name: 'Pulled Pork',            slug: 'pulled-pork',           iconEmoji: '🐷', sortOrder: 23, description: 'Low-and-slow smoked pork, sauced or naked' },
    { name: 'Acai Bowls',             slug: 'acai-bowls',            iconEmoji: '🫐', sortOrder: 24, description: 'Blended açaí topped with granola, fruit, and honey' },
    { name: 'Indian Curry',           slug: 'indian-curry',          iconEmoji: '🍛', sortOrder: 25, description: 'Butter chicken, tikka masala, vindaloo — rich and aromatic' },
  ]

  const categories: Record<string, string> = {}
  for (const cat of categoryData) {
    const c = await prisma.foodCategory.upsert({
      where:  { slug: cat.slug },
      update: { description: cat.description },
      create: { ...cat, status: 'active' },
    })
    categories[cat.slug] = c.id
  }
  console.log(`✅ ${categoryData.length} categories seeded`)

  // ─── Real Utah Restaurants ───────────────────────────────────────────────────
  const restaurantData = [
    // Cheeseburgers
    { name: 'Lucky 13',                      slug: 'lucky-13',                       address: '135 W 1300 S',            city: 'Salt Lake City', zip: '84115' },
    { name: 'Pretty Bird Hot Chicken',        slug: 'pretty-bird-hot-chicken',        address: '146 Regent St',           city: 'Salt Lake City', zip: '84111' },
    { name: 'Copper Onion',                   slug: 'copper-onion',                   address: '111 E Broadway',          city: 'Salt Lake City', zip: '84111' },
    { name: 'Cotton Bottom Inn',              slug: 'cotton-bottom-inn',              address: '2820 E 6200 S',           city: 'Holladay',       zip: '84121' },
    { name: "Dom's Burgers",                  slug: 'doms-burgers',                   address: '975 S West Temple',       city: 'Salt Lake City', zip: '84101' },
    // Pizza
    { name: 'Settebello Pizzeria Napoletana', slug: 'settebello',                     address: '260 S 200 W',             city: 'Salt Lake City', zip: '84101' },
    { name: 'The Pie Pizzeria',               slug: 'the-pie-pizzeria',               address: '1320 E 200 S',            city: 'Salt Lake City', zip: '84102' },
    { name: 'Slackwater Pizzeria',            slug: 'slackwater-pizzeria',            address: '10290 S State St',        city: 'Sandy',          zip: '84070' },
    { name: 'Bricks Corner',                  slug: 'bricks-corner',                  address: '668 S State St',          city: 'Salt Lake City', zip: '84111' },
    { name: 'Pizza Nono',                     slug: 'pizza-nono',                     address: '925 E 900 S',             city: 'Salt Lake City', zip: '84105' },
    // French Fries
    { name: 'Bruges Belgian Bistro',          slug: 'bruges-belgian-bistro',          address: '336 W Broadway',          city: 'Salt Lake City', zip: '84101' },
    { name: 'SpudToddos',                     slug: 'spudtoddos',                     address: '3355 S 900 E',            city: 'Salt Lake City', zip: '84106' },
    { name: 'Hires Big H',                    slug: 'hires-big-h',                    address: '425 S 700 E',             city: 'Salt Lake City', zip: '84102' },
    { name: "Bumblebee's",                    slug: 'bumblebees',                     address: '844 S State St',          city: 'Salt Lake City', zip: '84111' },
    // Tacos
    { name: 'Tacos Garay',                    slug: 'tacos-garay',                    address: '690 S 300 W',             city: 'Salt Lake City', zip: '84101' },
    { name: "Emiliano's Taco Shop",           slug: 'emilianos-taco-shop',            address: '1656 W North Temple',     city: 'Salt Lake City', zip: '84116' },
    { name: 'Red Iguana',                     slug: 'red-iguana',                     address: '736 W North Temple',      city: 'Salt Lake City', zip: '84116' },
    { name: 'Lone Star Taqueria',             slug: 'lone-star-taqueria',             address: '2265 E Fort Union Blvd',  city: 'Salt Lake City', zip: '84121' },
    { name: 'Lola',                           slug: 'lola',                           address: '51 S Main St',            city: 'Salt Lake City', zip: '84111' },
    // Chicken Wings
    { name: 'Wing Coop',                      slug: 'wing-coop',                      address: '327 S Main St',           city: 'Salt Lake City', zip: '84111' },
    { name: 'Trolley Wing Company',           slug: 'trolley-wing-company',           address: '1509 S 1500 E',           city: 'Salt Lake City', zip: '84105' },
    { name: 'Scovilles',                      slug: 'scovilles',                      address: '812 E 2100 S',            city: 'Salt Lake City', zip: '84106' },
    { name: 'Mad for Chicken',                slug: 'mad-for-chicken',                address: '349 S Main St',           city: 'Salt Lake City', zip: '84111' },
    { name: 'Bonchon',                        slug: 'bonchon',                        address: '152 S 200 W',             city: 'Salt Lake City', zip: '84101' },
    // Fried Chicken Sandwich
    { name: 'Houston TX Hot Chicken',         slug: 'houston-tx-hot-chicken',         address: '912 E 900 S',             city: 'Salt Lake City', zip: '84105' },
    { name: "Dave's Hot Chicken",             slug: 'daves-hot-chicken',              address: '1059 E 2100 S',           city: 'Salt Lake City', zip: '84106' },
    { name: 'Bok Bok Korean Fried Chicken',   slug: 'bok-bok-korean-fried-chicken',   address: '155 S 200 W',             city: 'Salt Lake City', zip: '84101' },
    { name: 'ChickQueen',                     slug: 'chickqueen',                     address: '680 S 300 W',             city: 'Salt Lake City', zip: '84101' },
    { name: 'HallPass',                       slug: 'hallpass',                       address: '153 S Rio Grande St',     city: 'Salt Lake City', zip: '84101' },
    // Burritos
    { name: "Chunga's",                       slug: 'chungas',                        address: '180 S 900 W',             city: 'Salt Lake City', zip: '84104' },
    { name: "Alberto's",                      slug: 'albertos',                       address: '1399 S 900 W',            city: 'Salt Lake City', zip: '84104' },
    // Sushi
    { name: 'Takashi',                        slug: 'takashi',                        address: '18 W Market St',          city: 'Salt Lake City', zip: '84101' },
    { name: 'Tsunami',                        slug: 'tsunami',                        address: '515 S 700 E',             city: 'Salt Lake City', zip: '84102' },
    { name: 'Sushi Groove',                   slug: 'sushi-groove',                   address: '2910 S Highland Dr',      city: 'Salt Lake City', zip: '84106' },
    { name: 'Kyoto',                          slug: 'kyoto',                          address: '1080 E 1300 S',           city: 'Salt Lake City', zip: '84105' },
    { name: 'Itto Sushi',                     slug: 'itto-sushi',                     address: '935 E 900 S',             city: 'Salt Lake City', zip: '84105' },
    // Ramen
    { name: "Tosh's Ramen",                   slug: 'toshs-ramen',                    address: '1465 S State St',         city: 'Salt Lake City', zip: '84115' },
    { name: 'Ramen Ichizu',                   slug: 'ramen-ichizu',                   address: '43 W 900 S',              city: 'Salt Lake City', zip: '84101' },
    { name: 'Jinya Ramen Bar',                slug: 'jinya-ramen-bar',                address: '1201 E 2100 S',           city: 'Salt Lake City', zip: '84106' },
    { name: 'Yoko Ramen',                     slug: 'yoko-ramen',                     address: '233 S Edison St',         city: 'Salt Lake City', zip: '84111' },
    { name: 'Ramen Haus',                     slug: 'ramen-haus',                     address: '195 25th St',             city: 'Ogden',          zip: '84401' },
    // Mac & Cheese
    { name: "Ruth's Diner",                   slug: 'ruths-diner',                    address: '4160 Emigration Canyon Rd',city: 'Salt Lake City', zip: '84108' },
    { name: 'Squatters Pub',                  slug: 'squatters-pub',                  address: '147 W Broadway',          city: 'Salt Lake City', zip: '84101' },
    { name: 'R&R BBQ',                        slug: 'r-and-r-bbq',                    address: '307 W 600 S',             city: 'Salt Lake City', zip: '84101' },
    { name: "Grandma Claire's",               slug: 'grandma-claires',                address: '190 S 200 W',             city: 'Salt Lake City', zip: '84101' },
    { name: "Eva's Bakery",                   slug: 'evas-bakery',                    address: '155 S Main St',           city: 'Salt Lake City', zip: '84111' },
    // Ice Cream
    { name: 'Rockwell Ice Cream',             slug: 'rockwell-ice-cream',             address: '201 N University Ave',    city: 'Provo',          zip: '84601' },
    { name: "Nielsen's Frozen Custard",       slug: 'nielsens-frozen-custard',        address: '2272 S Highland Dr',      city: 'Salt Lake City', zip: '84106' },
    { name: "Handel's",                       slug: 'handels',                        address: '12235 S Lone Peak Pkwy',  city: 'Riverton',       zip: '84096' },
    { name: 'Sub Zero',                       slug: 'sub-zero',                       address: '60 E Center St',          city: 'Provo',          zip: '84606' },
    { name: "Rowley's Red Barn",              slug: 'rowleys-red-barn',               address: '901 S Main St',           city: 'Santaquin',      zip: '84655' },
    // Chicken Tenders
    { name: "Charlie's Chicken",              slug: 'charlies-chicken',               address: '5880 S State St',         city: 'Murray',         zip: '84107' },
    { name: "Raising Cane's",                 slug: 'raising-canes',                  address: '2150 S State St',         city: 'South Salt Lake',zip: '84115' },
    { name: "Crazy D's Hot Chicken",          slug: 'crazy-ds-hot-chicken',           address: '156 S 200 W',             city: 'Salt Lake City', zip: '84101' },
    // Nachos
    { name: 'Nacho Daddy',                    slug: 'nacho-daddy',                    address: '190 S 200 W',             city: 'Salt Lake City', zip: '84101' },
    { name: 'Porcupine Pub & Grille',         slug: 'porcupine-pub-and-grille',       address: '3698 E Fort Union Blvd',  city: 'Salt Lake City', zip: '84121' },
    { name: "Gracie's",                       slug: 'gracies',                        address: '326 S West Temple',       city: 'Salt Lake City', zip: '84101' },
    // BBQ Ribs
    { name: 'Salt City Barbecue',             slug: 'salt-city-barbecue',             address: '2000 S West Temple',      city: 'Salt Lake City', zip: '84115' },
    { name: "Pat's Barbecue",                 slug: 'pats-barbecue',                  address: '155 W Commonwealth Ave',  city: 'Salt Lake City', zip: '84115' },
    { name: "Charlotte-Rose's Carolina BBQ",  slug: 'charlotte-roses-carolina-bbq',   address: '42 E Gallivan Ave',       city: 'Salt Lake City', zip: '84111' },
    { name: "Kenny J's BBQ",                  slug: 'kenny-js-bbq',                   address: '940 S 300 W',             city: 'Salt Lake City', zip: '84101' },
    // Donuts
    { name: 'Banbury Cross Donuts',           slug: 'banbury-cross-donuts',           address: '705 S 700 E',             city: 'Salt Lake City', zip: '84102' },
    { name: 'Fresh Donut & Deli',             slug: 'fresh-donut-and-deli',           address: '3300 S State St',         city: 'South Salt Lake',zip: '84115' },
    { name: 'Provo Bakery',                   slug: 'provo-bakery',                   address: '190 E 100 N',             city: 'Provo',          zip: '84606' },
    { name: 'Spudly Donuts',                  slug: 'spudly-donuts',                  address: '70 E Center St',          city: 'Provo',          zip: '84606' },
    { name: 'Bismarck Doughnuts',             slug: 'bismarck-doughnuts',             address: '1692 N State St',         city: 'Provo',          zip: '84604' },
    // Milkshakes
    { name: 'Iceberg Drive Inn',              slug: 'iceberg-drive-inn',              address: '3900 S 900 E',            city: 'Salt Lake City', zip: '84124' },
    { name: "Millie's Burgers",               slug: 'millies-burgers',                address: '260 S 1300 E',            city: 'Salt Lake City', zip: '84102' },
    { name: "Woody's Drive-In",               slug: 'woodys-drive-in',                address: '1292 S State St',         city: 'Salt Lake City', zip: '84115' },
    // Cookies
    { name: 'Crumbl',                         slug: 'crumbl',                         address: '3375 S State St',         city: 'Salt Lake City', zip: '84115' },
    { name: 'Chip Cookies',                   slug: 'chip-cookies',                   address: '275 E 200 S',             city: 'Salt Lake City', zip: '84111' },
    { name: 'RubySnap Fresh Cookies',         slug: 'rubysnap-fresh-cookies',         address: '770 S 300 W',             city: 'Salt Lake City', zip: '84101' },
    { name: 'Süss Cookie Company',            slug: 'suss-cookie-company',            address: '240 N University Ave',    city: 'Provo',          zip: '84601' },
    { name: 'Crave Cookies',                  slug: 'crave-cookies',                  address: '1578 S State St',         city: 'Salt Lake City', zip: '84115' },
    // Pad Thai
    { name: 'Tuk Tuks',                       slug: 'tuk-tuks',                       address: '1675 W North Temple',     city: 'Salt Lake City', zip: '84116' },
    { name: 'Sawadee Thai',                   slug: 'sawadee-thai',                   address: '754 E South Temple',      city: 'Salt Lake City', zip: '84102' },
    { name: 'Chanon Thai Cafe',               slug: 'chanon-thai-cafe',               address: '278 E 900 S',             city: 'Salt Lake City', zip: '84111' },
    { name: 'Aroon Thai Kitchen',             slug: 'aroon-thai-kitchen',             address: '1677 W North Temple',     city: 'Salt Lake City', zip: '84116' },
    { name: 'Suzy Thai Food',                 slug: 'suzy-thai-food',                 address: '200 S 200 W',             city: 'Salt Lake City', zip: '84101' },
    // Pho
    { name: 'Pho 777',                        slug: 'pho-777',                        address: '1080 S State St',         city: 'Salt Lake City', zip: '84111' },
    { name: 'Pho Tay Ho',                     slug: 'pho-tay-ho',                     address: '1766 S Main St',          city: 'Salt Lake City', zip: '84115' },
    { name: 'Pho 33',                         slug: 'pho-33',                         address: '150 S State St',          city: 'Salt Lake City', zip: '84111' },
    { name: 'SOMI Vietnamese Bistro',         slug: 'somi-vietnamese-bistro',         address: '151 S Main St',           city: 'Salt Lake City', zip: '84111' },
    { name: 'Oh Mai',                         slug: 'oh-mai',                         address: '3425 S State St',         city: 'Salt Lake City', zip: '84115' },
    // Birria Tacos
    { name: 'Santo Taco',                     slug: 'santo-taco',                     address: '1465 S State St',         city: 'Salt Lake City', zip: '84115' },
    { name: 'Los Tapatios Taco Grill',        slug: 'los-tapatios-taco-grill',        address: '248 W 200 S',             city: 'Salt Lake City', zip: '84101' },
    { name: 'La Casa Del Tamal',              slug: 'la-casa-del-tamal',              address: '1518 S State St',         city: 'Salt Lake City', zip: '84115' },
    { name: 'Roctaco',                        slug: 'roctaco',                        address: '501 E 2700 S',            city: 'Salt Lake City', zip: '84106' },
    { name: 'Taqueria 27',                    slug: 'taqueria-27',                    address: '1615 S Foothill Dr',      city: 'Salt Lake City', zip: '84108' },
    // Breakfast Burritos
    { name: "Beto's Mexican Food",            slug: 'betos-mexican-food',             address: '2038 W 3500 S',           city: 'West Valley City',zip: '84119' },
    { name: 'Bad-Ass Breakfast Burritos',     slug: 'bad-ass-breakfast-burritos',     address: '764 S 200 W',             city: 'Salt Lake City', zip: '84101' },
    { name: 'Skillets',                       slug: 'skillets',                       address: '67 W 1700 S',             city: 'Salt Lake City', zip: '84115' },
    { name: "Floriberto's",                   slug: 'floribertos',                    address: '2150 S State St',         city: 'Salt Lake City', zip: '84115' },
    // Fish Tacos
    { name: 'Flanker Kitchen',                slug: 'flanker-kitchen',                address: '6 N Rio Grande St',       city: 'Salt Lake City', zip: '84101' },
    // Pulled Pork
    { name: "Benji's",                        slug: 'benjis',                         address: '820 S State St',          city: 'Salt Lake City', zip: '84111' },
    // Acai Bowls
    { name: 'Bowls Superfoods',               slug: 'bowls-superfoods',               address: '1283 N University Ave',   city: 'Provo',          zip: '84604' },
    { name: 'Vida Açaí',                      slug: 'vida-acai',                      address: '20 W Center St',          city: 'Provo',          zip: '84601' },
    { name: 'Vitality Bowls',                 slug: 'vitality-bowls',                 address: '50 S Main St',            city: 'Salt Lake City', zip: '84101' },
    { name: 'Honest Eatery',                  slug: 'honest-eatery',                  address: '53 W 200 S',              city: 'Salt Lake City', zip: '84101' },
    { name: 'Liv Pure Acai',                  slug: 'liv-pure-acai',                  address: '200 S 200 W',             city: 'Salt Lake City', zip: '84101' },
    // Indian Curry
    { name: 'Saffron Valley',                 slug: 'saffron-valley',                 address: '26 E St',                 city: 'Salt Lake City', zip: '84103' },
    { name: 'Bombay House',                   slug: 'bombay-house',                   address: '463 N University Ave',    city: 'Provo',          zip: '84601' },
    { name: 'The Kathmandu',                  slug: 'the-kathmandu',                  address: '3142 S Highland Dr',      city: 'Salt Lake City', zip: '84106' },
    { name: 'Bhansa Ghar',                    slug: 'bhansa-ghar',                    address: '138 W 300 S',             city: 'Salt Lake City', zip: '84101' },
    { name: 'Star of India',                  slug: 'star-of-india',                  address: '177 E 200 S',             city: 'Salt Lake City', zip: '84111' },
    // ─── Ogden ──────────────────────────────────────────────────────────────────
    { name: "Roosters Brewing Co.",           slug: 'roosters-brewing-ogden',         address: '253 25th St',             city: 'Ogden',          zip: '84401' },
    { name: 'Slackwater Pub (Ogden)',         slug: 'slackwater-ogden',               address: '1895 Washington Blvd',    city: 'Ogden',          zip: '84401' },
    { name: 'Lucky Slice Pizza (Ogden)',      slug: 'lucky-slice-ogden',              address: '226 25th St',             city: 'Ogden',          zip: '84401' },
    { name: 'Tona Sushi & Grill',            slug: 'tona-sushi-ogden',               address: '210 25th St',             city: 'Ogden',          zip: '84401' },
    { name: 'Farr Better Ice Cream',          slug: 'farr-better-ice-cream',          address: '286 21st St',             city: 'Ogden',          zip: '84401' },
    { name: 'Thai Pho Kitchen',               slug: 'thai-pho-kitchen-ogden',         address: '3900 Washington Blvd',    city: 'Ogden',          zip: '84403' },
    { name: 'Daylight Donuts (Ogden)',        slug: 'daylight-donuts-ogden',          address: '444 25th St',             city: 'Ogden',          zip: '84401' },
    { name: "Rancherito's",                   slug: 'rancheritos-ogden',              address: '555 E 12th St',           city: 'Ogden',          zip: '84404' },
    // ─── Provo / Orem ────────────────────────────────────────────────────────────
    { name: "Cubby's (Provo)",               slug: 'cubbys-provo',                   address: '801 N University Ave',    city: 'Provo',          zip: '84604' },
    { name: "Marley's Gourmet Sliders",       slug: 'marleys-gourmet-sliders',        address: '161 W Center St',         city: 'Provo',          zip: '84601' },
    { name: 'Pizzeria 712',                   slug: 'pizzeria-712',                   address: '320 S State St',          city: 'Orem',           zip: '84058' },
    { name: 'Nicolitalia Pizzeria',           slug: 'nicolitalia-pizzeria',           address: '48 E Center St',          city: 'Provo',          zip: '84601' },
    { name: 'Brick Oven Restaurant',          slug: 'brick-oven-provo',               address: '111 E 800 N',             city: 'Provo',          zip: '84606' },
    { name: 'Five Sushi Brothers',            slug: 'five-sushi-brothers',            address: '194 W Center St',         city: 'Provo',          zip: '84601' },
    { name: 'Asa Ramen',                      slug: 'asa-ramen',                      address: '55 N University Ave',     city: 'Provo',          zip: '84601' },
    { name: 'Black Sheep Cafe',               slug: 'black-sheep-cafe',               address: '19 N University Ave',     city: 'Provo',          zip: '84601' },
    { name: 'Café Sabor (Provo)',             slug: 'cafe-sabor-provo',               address: '240 W Center St',         city: 'Provo',          zip: '84601' },
    { name: 'Chip Cookies (Provo)',           slug: 'chip-cookies-provo',             address: '95 N University Ave',     city: 'Provo',          zip: '84601' },
    { name: 'Hires Big H (Orem)',             slug: 'hires-big-h-orem',               address: '900 N State St',          city: 'Orem',           zip: '84057' },
  ]

  const restaurants: Record<string, string> = {}
  for (const r of restaurantData) {
    const rec = await prisma.restaurant.upsert({
      where:  { slug: r.slug },
      update: {},
      create: { ...r, state: 'UT', status: 'active' },
    })
    restaurants[r.slug] = rec.id
  }
  console.log(`✅ ${restaurantData.length} restaurants seeded`)

  // ─── Restaurant ↔ Category Links ────────────────────────────────────────────
  //   Multi-category restaurants:
  //     lucky-13                  → cheeseburgers, french-fries
  //     pretty-bird-hot-chicken   → cheeseburgers, fried-chicken-sandwich, chicken-tenders
  //     red-iguana                → tacos, burritos, nachos
  //     lone-star-taqueria        → tacos, burritos, fish-tacos
  //     emilianos-taco-shop       → tacos, burritos
  //     r-and-r-bbq               → mac-and-cheese, bbq-ribs, pulled-pork
  //     pats-barbecue             → bbq-ribs, pulled-pork
  //     salt-city-barbecue        → bbq-ribs, pulled-pork
  //     charlotte-roses-carolina-bbq → bbq-ribs, pulled-pork
  //     hires-big-h               → french-fries, milkshakes
  //     nielsens-frozen-custard   → ice-cream, milkshakes
  //     slackwater-pizzeria       → pizza, nachos
  //     albertos                  → burritos, breakfast-burritos
  //     roctaco                   → birria-tacos, fish-tacos
  //     taqueria-27               → birria-tacos, fish-tacos
  //     santo-taco                → birria-tacos, fish-tacos
  //     hallpass                  → chicken-tenders, fried-chicken-sandwich
  const links: Array<[string, string]> = [
    // Cheeseburgers
    ['lucky-13',                    'cheeseburgers'],
    ['pretty-bird-hot-chicken',     'cheeseburgers'],
    ['copper-onion',                'cheeseburgers'],
    ['cotton-bottom-inn',           'cheeseburgers'],
    ['doms-burgers',                'cheeseburgers'],
    // Pizza
    ['settebello',                  'pizza'],
    ['the-pie-pizzeria',            'pizza'],
    ['slackwater-pizzeria',         'pizza'],
    ['bricks-corner',               'pizza'],
    ['pizza-nono',                  'pizza'],
    // French Fries
    ['bruges-belgian-bistro',       'french-fries'],
    ['spudtoddos',                  'french-fries'],
    ['hires-big-h',                 'french-fries'],
    ['lucky-13',                    'french-fries'],
    ['bumblebees',                  'french-fries'],
    // Tacos
    ['tacos-garay',                 'tacos'],
    ['emilianos-taco-shop',         'tacos'],
    ['red-iguana',                  'tacos'],
    ['lone-star-taqueria',          'tacos'],
    ['lola',                        'tacos'],
    // Chicken Wings
    ['wing-coop',                   'chicken-wings'],
    ['trolley-wing-company',        'chicken-wings'],
    ['scovilles',                   'chicken-wings'],
    ['mad-for-chicken',             'chicken-wings'],
    ['bonchon',                     'chicken-wings'],
    // Fried Chicken Sandwich
    ['pretty-bird-hot-chicken',     'fried-chicken-sandwich'],
    ['houston-tx-hot-chicken',      'fried-chicken-sandwich'],
    ['daves-hot-chicken',           'fried-chicken-sandwich'],
    ['bok-bok-korean-fried-chicken','fried-chicken-sandwich'],
    ['chickqueen',                  'fried-chicken-sandwich'],
    ['hallpass',                    'fried-chicken-sandwich'],
    // Burritos
    ['red-iguana',                  'burritos'],
    ['lone-star-taqueria',          'burritos'],
    ['chungas',                     'burritos'],
    ['emilianos-taco-shop',         'burritos'],
    ['albertos',                    'burritos'],
    // Sushi
    ['takashi',                     'sushi'],
    ['tsunami',                     'sushi'],
    ['sushi-groove',                'sushi'],
    ['kyoto',                       'sushi'],
    ['itto-sushi',                  'sushi'],
    // Ramen
    ['toshs-ramen',                 'ramen'],
    ['ramen-ichizu',                'ramen'],
    ['jinya-ramen-bar',             'ramen'],
    ['yoko-ramen',                  'ramen'],
    ['ramen-haus',                  'ramen'],
    // Mac & Cheese
    ['ruths-diner',                 'mac-and-cheese'],
    ['squatters-pub',               'mac-and-cheese'],
    ['r-and-r-bbq',                 'mac-and-cheese'],
    ['grandma-claires',             'mac-and-cheese'],
    ['evas-bakery',                 'mac-and-cheese'],
    // Ice Cream
    ['rockwell-ice-cream',          'ice-cream'],
    ['nielsens-frozen-custard',     'ice-cream'],
    ['handels',                     'ice-cream'],
    ['sub-zero',                    'ice-cream'],
    ['rowleys-red-barn',            'ice-cream'],
    // Chicken Tenders
    ['charlies-chicken',            'chicken-tenders'],
    ['pretty-bird-hot-chicken',     'chicken-tenders'],
    ['raising-canes',               'chicken-tenders'],
    ['crazy-ds-hot-chicken',        'chicken-tenders'],
    ['hallpass',                    'chicken-tenders'],
    // Nachos
    ['red-iguana',                  'nachos'],
    ['nacho-daddy',                 'nachos'],
    ['porcupine-pub-and-grille',    'nachos'],
    ['gracies',                     'nachos'],
    ['slackwater-pizzeria',         'nachos'],
    // BBQ Ribs
    ['salt-city-barbecue',          'bbq-ribs'],
    ['r-and-r-bbq',                 'bbq-ribs'],
    ['pats-barbecue',               'bbq-ribs'],
    ['charlotte-roses-carolina-bbq','bbq-ribs'],
    ['kenny-js-bbq',                'bbq-ribs'],
    // Donuts
    ['banbury-cross-donuts',        'donuts'],
    ['fresh-donut-and-deli',        'donuts'],
    ['provo-bakery',                'donuts'],
    ['spudly-donuts',               'donuts'],
    ['bismarck-doughnuts',          'donuts'],
    // Milkshakes
    ['iceberg-drive-inn',           'milkshakes'],
    ['hires-big-h',                 'milkshakes'],
    ['nielsens-frozen-custard',     'milkshakes'],
    ['millies-burgers',             'milkshakes'],
    ['woodys-drive-in',             'milkshakes'],
    // Cookies
    ['crumbl',                      'cookies'],
    ['chip-cookies',                'cookies'],
    ['rubysnap-fresh-cookies',      'cookies'],
    ['suss-cookie-company',         'cookies'],
    ['crave-cookies',               'cookies'],
    // Pad Thai
    ['tuk-tuks',                    'pad-thai'],
    ['sawadee-thai',                'pad-thai'],
    ['chanon-thai-cafe',            'pad-thai'],
    ['aroon-thai-kitchen',          'pad-thai'],
    ['suzy-thai-food',              'pad-thai'],
    // Pho
    ['pho-777',                     'pho'],
    ['pho-tay-ho',                  'pho'],
    ['pho-33',                      'pho'],
    ['somi-vietnamese-bistro',      'pho'],
    ['oh-mai',                      'pho'],
    // Birria Tacos
    ['santo-taco',                  'birria-tacos'],
    ['los-tapatios-taco-grill',     'birria-tacos'],
    ['la-casa-del-tamal',           'birria-tacos'],
    ['roctaco',                     'birria-tacos'],
    ['taqueria-27',                 'birria-tacos'],
    // Breakfast Burritos
    ['betos-mexican-food',          'breakfast-burritos'],
    ['bad-ass-breakfast-burritos',  'breakfast-burritos'],
    ['albertos',                    'breakfast-burritos'],
    ['skillets',                    'breakfast-burritos'],
    ['floribertos',                 'breakfast-burritos'],
    // Fish Tacos
    ['lone-star-taqueria',          'fish-tacos'],
    ['roctaco',                     'fish-tacos'],
    ['taqueria-27',                 'fish-tacos'],
    ['santo-taco',                  'fish-tacos'],
    ['flanker-kitchen',             'fish-tacos'],
    // Pulled Pork
    ['pats-barbecue',               'pulled-pork'],
    ['r-and-r-bbq',                 'pulled-pork'],
    ['salt-city-barbecue',          'pulled-pork'],
    ['charlotte-roses-carolina-bbq','pulled-pork'],
    ['benjis',                      'pulled-pork'],
    // Acai Bowls
    ['bowls-superfoods',            'acai-bowls'],
    ['vida-acai',                   'acai-bowls'],
    ['vitality-bowls',              'acai-bowls'],
    ['honest-eatery',               'acai-bowls'],
    ['liv-pure-acai',               'acai-bowls'],
    // Indian Curry
    ['saffron-valley',              'indian-curry'],
    ['bombay-house',                'indian-curry'],
    ['the-kathmandu',               'indian-curry'],
    ['bhansa-ghar',                 'indian-curry'],
    ['star-of-india',               'indian-curry'],
    // ─── Ogden ──────────────────────────────────────────────────────────────────
    ['roosters-brewing-ogden',      'cheeseburgers'],
    ['roosters-brewing-ogden',      'chicken-wings'],
    ['slackwater-ogden',            'cheeseburgers'],
    ['slackwater-ogden',            'pizza'],
    ['lucky-slice-ogden',           'pizza'],
    ['tona-sushi-ogden',            'sushi'],
    ['farr-better-ice-cream',       'ice-cream'],
    ['farr-better-ice-cream',       'milkshakes'],
    ['thai-pho-kitchen-ogden',      'pad-thai'],
    ['thai-pho-kitchen-ogden',      'pho'],
    ['daylight-donuts-ogden',       'donuts'],
    ['rancheritos-ogden',           'tacos'],
    ['rancheritos-ogden',           'burritos'],
    // ─── Provo / Orem ────────────────────────────────────────────────────────────
    ['cubbys-provo',                'cheeseburgers'],
    ['cubbys-provo',                'fried-chicken-sandwich'],
    ['marleys-gourmet-sliders',     'cheeseburgers'],
    ['pizzeria-712',                'pizza'],
    ['nicolitalia-pizzeria',        'pizza'],
    ['brick-oven-provo',            'pizza'],
    ['five-sushi-brothers',         'sushi'],
    ['asa-ramen',                   'ramen'],
    ['black-sheep-cafe',            'tacos'],
    ['black-sheep-cafe',            'burritos'],
    ['cafe-sabor-provo',            'tacos'],
    ['cafe-sabor-provo',            'burritos'],
    ['chip-cookies-provo',          'cookies'],
    ['hires-big-h-orem',            'cheeseburgers'],
    ['hires-big-h-orem',            'french-fries'],
    ['hires-big-h-orem',            'milkshakes'],
  ]

  for (const [rSlug, cSlug] of links) {
    const restaurantId   = restaurants[rSlug]
    const foodCategoryId = categories[cSlug]
    if (!restaurantId || !foodCategoryId) {
      console.warn(`⚠️  Skipping link: ${rSlug} → ${cSlug} (missing ID)`)
      continue
    }
    await prisma.restaurantCategory.upsert({
      where:  { restaurantId_foodCategoryId: { restaurantId, foodCategoryId } },
      update: {},
      create: { restaurantId, foodCategoryId, verified: true },
    })
  }
  console.log(`✅ ${links.length} restaurant-category links seeded`)

  // ─── Demo Users ─────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('demo1234', 12)

  const usersData = [
    { email: 'alex@demo.com',   displayName: 'Alex R.',   city: 'Salt Lake City' },
    { email: 'jordan@demo.com', displayName: 'Jordan M.', city: 'Provo'          },
    { email: 'sam@demo.com',    displayName: 'Sam T.',    city: 'Park City'      },
    { email: 'riley@demo.com',  displayName: 'Riley K.',  city: 'Ogden'          },
    { email: 'taylor@demo.com', displayName: 'Taylor W.', city: 'Sandy'          },
  ]

  const users: Record<string, string> = {}
  for (const u of usersData) {
    const user = await prisma.user.upsert({
      where:  { email: u.email },
      update: {},
      create: { ...u, passwordHash, state: 'UT' },
    })
    users[u.email] = user.id
  }
  console.log(`✅ ${usersData.length} demo users seeded`)

  // ─── Sample Medals ───────────────────────────────────────────────────────────
  //
  //  Designed so every listed category has 3+ restaurants with medals,
  //  and the top 10 categories produce a clear 1st/2nd/3rd podium.
  //
  //  Scoring reference (gold=3, silver=2, bronze=1):
  //
  //  Cheeseburgers:   Lucky 13 (11) > Copper Onion (8) > Cotton Bottom Inn (4)
  //  Pizza:           Settebello (8) > The Pie Pizzeria (6) > Bricks Corner (2)
  //  Tacos:           Red Iguana (7) > Tacos Garay (5) > Lone Star Taqueria (3)
  //  Ramen:           Tosh's Ramen (8) > Jinya Ramen Bar (6) > Ramen Ichizu (3)
  //  Fried Chkn Sand: Pretty Bird (8) > Dave's Hot Chicken (6) > Houston TX (3)
  //  Sushi:           Takashi (9) > Kyoto (5) > Tsunami (2)
  //  Chicken Wings:   Wing Coop (6) > Scovilles (3) > Trolley Wing (2)
  //  BBQ Ribs:        Salt City BBQ (5) > R&R BBQ (4) > Pat's (3)
  //  Milkshakes:      Iceberg Drive Inn (6) > Nielsen's (3) > Woody's (2)
  //  Indian Curry:    Saffron Valley (6) > Bombay House (5) > Bhansa Ghar (3)
  //
  const year = new Date().getFullYear()
  const medalData: Array<{
    userEmail:      string
    categorySlug:   string
    restaurantSlug: string
    medalType:      'gold' | 'silver' | 'bronze'
  }> = [
    // ── Alex: cheeseburgers, pizza, ramen, chicken-wings, sushi, fried-chicken-sandwich ──
    { userEmail: 'alex@demo.com', categorySlug: 'cheeseburgers',         restaurantSlug: 'lucky-13',                 medalType: 'gold'   },
    { userEmail: 'alex@demo.com', categorySlug: 'cheeseburgers',         restaurantSlug: 'copper-onion',             medalType: 'silver' },
    { userEmail: 'alex@demo.com', categorySlug: 'cheeseburgers',         restaurantSlug: 'cotton-bottom-inn',        medalType: 'bronze' },

    { userEmail: 'alex@demo.com', categorySlug: 'pizza',                 restaurantSlug: 'settebello',               medalType: 'gold'   },
    { userEmail: 'alex@demo.com', categorySlug: 'pizza',                 restaurantSlug: 'the-pie-pizzeria',         medalType: 'silver' },
    { userEmail: 'alex@demo.com', categorySlug: 'pizza',                 restaurantSlug: 'pizza-nono',               medalType: 'bronze' },

    { userEmail: 'alex@demo.com', categorySlug: 'ramen',                 restaurantSlug: 'toshs-ramen',              medalType: 'gold'   },
    { userEmail: 'alex@demo.com', categorySlug: 'ramen',                 restaurantSlug: 'jinya-ramen-bar',          medalType: 'silver' },
    { userEmail: 'alex@demo.com', categorySlug: 'ramen',                 restaurantSlug: 'ramen-ichizu',             medalType: 'bronze' },

    { userEmail: 'alex@demo.com', categorySlug: 'chicken-wings',         restaurantSlug: 'wing-coop',                medalType: 'gold'   },
    { userEmail: 'alex@demo.com', categorySlug: 'chicken-wings',         restaurantSlug: 'trolley-wing-company',     medalType: 'silver' },
    { userEmail: 'alex@demo.com', categorySlug: 'chicken-wings',         restaurantSlug: 'scovilles',                medalType: 'bronze' },

    { userEmail: 'alex@demo.com', categorySlug: 'sushi',                 restaurantSlug: 'takashi',                  medalType: 'gold'   },
    { userEmail: 'alex@demo.com', categorySlug: 'sushi',                 restaurantSlug: 'tsunami',                  medalType: 'silver' },
    { userEmail: 'alex@demo.com', categorySlug: 'sushi',                 restaurantSlug: 'kyoto',                    medalType: 'bronze' },

    { userEmail: 'alex@demo.com', categorySlug: 'fried-chicken-sandwich',restaurantSlug: 'pretty-bird-hot-chicken',  medalType: 'gold'   },
    { userEmail: 'alex@demo.com', categorySlug: 'fried-chicken-sandwich',restaurantSlug: 'daves-hot-chicken',        medalType: 'silver' },
    { userEmail: 'alex@demo.com', categorySlug: 'fried-chicken-sandwich',restaurantSlug: 'houston-tx-hot-chicken',   medalType: 'bronze' },

    // ── Jordan: cheeseburgers, tacos, fried-chicken-sandwich, mac-and-cheese, birria-tacos, milkshakes, indian-curry ──
    { userEmail: 'jordan@demo.com', categorySlug: 'cheeseburgers',       restaurantSlug: 'lucky-13',                 medalType: 'gold'   },
    { userEmail: 'jordan@demo.com', categorySlug: 'cheeseburgers',       restaurantSlug: 'copper-onion',             medalType: 'silver' },
    { userEmail: 'jordan@demo.com', categorySlug: 'cheeseburgers',       restaurantSlug: 'doms-burgers',             medalType: 'bronze' },

    { userEmail: 'jordan@demo.com', categorySlug: 'tacos',               restaurantSlug: 'red-iguana',               medalType: 'gold'   },
    { userEmail: 'jordan@demo.com', categorySlug: 'tacos',               restaurantSlug: 'tacos-garay',              medalType: 'silver' },
    { userEmail: 'jordan@demo.com', categorySlug: 'tacos',               restaurantSlug: 'lone-star-taqueria',       medalType: 'bronze' },

    { userEmail: 'jordan@demo.com', categorySlug: 'fried-chicken-sandwich',restaurantSlug: 'pretty-bird-hot-chicken',medalType: 'gold'   },
    { userEmail: 'jordan@demo.com', categorySlug: 'fried-chicken-sandwich',restaurantSlug: 'houston-tx-hot-chicken', medalType: 'silver' },
    { userEmail: 'jordan@demo.com', categorySlug: 'fried-chicken-sandwich',restaurantSlug: 'daves-hot-chicken',      medalType: 'bronze' },

    { userEmail: 'jordan@demo.com', categorySlug: 'mac-and-cheese',      restaurantSlug: 'ruths-diner',              medalType: 'gold'   },
    { userEmail: 'jordan@demo.com', categorySlug: 'mac-and-cheese',      restaurantSlug: 'squatters-pub',            medalType: 'silver' },
    { userEmail: 'jordan@demo.com', categorySlug: 'mac-and-cheese',      restaurantSlug: 'r-and-r-bbq',             medalType: 'bronze' },

    { userEmail: 'jordan@demo.com', categorySlug: 'birria-tacos',        restaurantSlug: 'santo-taco',               medalType: 'gold'   },
    { userEmail: 'jordan@demo.com', categorySlug: 'birria-tacos',        restaurantSlug: 'roctaco',                  medalType: 'silver' },
    { userEmail: 'jordan@demo.com', categorySlug: 'birria-tacos',        restaurantSlug: 'taqueria-27',              medalType: 'bronze' },

    { userEmail: 'jordan@demo.com', categorySlug: 'milkshakes',          restaurantSlug: 'iceberg-drive-inn',        medalType: 'gold'   },
    { userEmail: 'jordan@demo.com', categorySlug: 'milkshakes',          restaurantSlug: 'woodys-drive-in',          medalType: 'silver' },
    { userEmail: 'jordan@demo.com', categorySlug: 'milkshakes',          restaurantSlug: 'nielsens-frozen-custard',  medalType: 'bronze' },

    { userEmail: 'jordan@demo.com', categorySlug: 'indian-curry',        restaurantSlug: 'bombay-house',             medalType: 'gold'   },
    { userEmail: 'jordan@demo.com', categorySlug: 'indian-curry',        restaurantSlug: 'bhansa-ghar',              medalType: 'silver' },
    { userEmail: 'jordan@demo.com', categorySlug: 'indian-curry',        restaurantSlug: 'star-of-india',            medalType: 'bronze' },

    // ── Sam: cheeseburgers, pizza, tacos, bbq-ribs, pho, ramen, chicken-wings ──
    { userEmail: 'sam@demo.com', categorySlug: 'cheeseburgers',          restaurantSlug: 'copper-onion',             medalType: 'gold'   },
    { userEmail: 'sam@demo.com', categorySlug: 'cheeseburgers',          restaurantSlug: 'lucky-13',                 medalType: 'silver' },
    { userEmail: 'sam@demo.com', categorySlug: 'cheeseburgers',          restaurantSlug: 'cotton-bottom-inn',        medalType: 'bronze' },

    { userEmail: 'sam@demo.com', categorySlug: 'pizza',                  restaurantSlug: 'the-pie-pizzeria',         medalType: 'gold'   },
    { userEmail: 'sam@demo.com', categorySlug: 'pizza',                  restaurantSlug: 'settebello',               medalType: 'silver' },
    { userEmail: 'sam@demo.com', categorySlug: 'pizza',                  restaurantSlug: 'slackwater-pizzeria',      medalType: 'bronze' },

    { userEmail: 'sam@demo.com', categorySlug: 'tacos',                  restaurantSlug: 'tacos-garay',              medalType: 'gold'   },
    { userEmail: 'sam@demo.com', categorySlug: 'tacos',                  restaurantSlug: 'emilianos-taco-shop',      medalType: 'silver' },
    { userEmail: 'sam@demo.com', categorySlug: 'tacos',                  restaurantSlug: 'red-iguana',               medalType: 'bronze' },

    { userEmail: 'sam@demo.com', categorySlug: 'bbq-ribs',               restaurantSlug: 'salt-city-barbecue',       medalType: 'gold'   },
    { userEmail: 'sam@demo.com', categorySlug: 'bbq-ribs',               restaurantSlug: 'pats-barbecue',            medalType: 'silver' },
    { userEmail: 'sam@demo.com', categorySlug: 'bbq-ribs',               restaurantSlug: 'r-and-r-bbq',             medalType: 'bronze' },

    { userEmail: 'sam@demo.com', categorySlug: 'pho',                    restaurantSlug: 'pho-777',                  medalType: 'gold'   },
    { userEmail: 'sam@demo.com', categorySlug: 'pho',                    restaurantSlug: 'pho-tay-ho',               medalType: 'silver' },
    { userEmail: 'sam@demo.com', categorySlug: 'pho',                    restaurantSlug: 'oh-mai',                   medalType: 'bronze' },

    { userEmail: 'sam@demo.com', categorySlug: 'ramen',                  restaurantSlug: 'toshs-ramen',              medalType: 'gold'   },
    { userEmail: 'sam@demo.com', categorySlug: 'ramen',                  restaurantSlug: 'ramen-ichizu',             medalType: 'silver' },
    { userEmail: 'sam@demo.com', categorySlug: 'ramen',                  restaurantSlug: 'jinya-ramen-bar',          medalType: 'bronze' },

    { userEmail: 'sam@demo.com', categorySlug: 'chicken-wings',          restaurantSlug: 'wing-coop',                medalType: 'gold'   },
    { userEmail: 'sam@demo.com', categorySlug: 'chicken-wings',          restaurantSlug: 'scovilles',                medalType: 'silver' },
    { userEmail: 'sam@demo.com', categorySlug: 'chicken-wings',          restaurantSlug: 'mad-for-chicken',          medalType: 'bronze' },

    // ── Riley: cheeseburgers, ramen, french-fries, milkshakes, indian-curry, chicken-tenders, sushi ──
    { userEmail: 'riley@demo.com', categorySlug: 'cheeseburgers',        restaurantSlug: 'lucky-13',                 medalType: 'gold'   },
    { userEmail: 'riley@demo.com', categorySlug: 'cheeseburgers',        restaurantSlug: 'cotton-bottom-inn',        medalType: 'silver' },
    { userEmail: 'riley@demo.com', categorySlug: 'cheeseburgers',        restaurantSlug: 'copper-onion',             medalType: 'bronze' },

    { userEmail: 'riley@demo.com', categorySlug: 'ramen',                restaurantSlug: 'jinya-ramen-bar',          medalType: 'gold'   },
    { userEmail: 'riley@demo.com', categorySlug: 'ramen',                restaurantSlug: 'toshs-ramen',              medalType: 'silver' },
    { userEmail: 'riley@demo.com', categorySlug: 'ramen',                restaurantSlug: 'ramen-haus',               medalType: 'bronze' },

    { userEmail: 'riley@demo.com', categorySlug: 'french-fries',         restaurantSlug: 'bruges-belgian-bistro',    medalType: 'gold'   },
    { userEmail: 'riley@demo.com', categorySlug: 'french-fries',         restaurantSlug: 'hires-big-h',              medalType: 'silver' },
    { userEmail: 'riley@demo.com', categorySlug: 'french-fries',         restaurantSlug: 'spudtoddos',               medalType: 'bronze' },

    { userEmail: 'riley@demo.com', categorySlug: 'milkshakes',           restaurantSlug: 'iceberg-drive-inn',        medalType: 'gold'   },
    { userEmail: 'riley@demo.com', categorySlug: 'milkshakes',           restaurantSlug: 'nielsens-frozen-custard',  medalType: 'silver' },
    { userEmail: 'riley@demo.com', categorySlug: 'milkshakes',           restaurantSlug: 'hires-big-h',              medalType: 'bronze' },

    { userEmail: 'riley@demo.com', categorySlug: 'indian-curry',         restaurantSlug: 'saffron-valley',           medalType: 'gold'   },
    { userEmail: 'riley@demo.com', categorySlug: 'indian-curry',         restaurantSlug: 'bombay-house',             medalType: 'silver' },
    { userEmail: 'riley@demo.com', categorySlug: 'indian-curry',         restaurantSlug: 'the-kathmandu',            medalType: 'bronze' },

    { userEmail: 'riley@demo.com', categorySlug: 'chicken-tenders',      restaurantSlug: 'charlies-chicken',         medalType: 'gold'   },
    { userEmail: 'riley@demo.com', categorySlug: 'chicken-tenders',      restaurantSlug: 'raising-canes',            medalType: 'silver' },
    { userEmail: 'riley@demo.com', categorySlug: 'chicken-tenders',      restaurantSlug: 'hallpass',                 medalType: 'bronze' },

    { userEmail: 'riley@demo.com', categorySlug: 'sushi',                restaurantSlug: 'takashi',                  medalType: 'gold'   },
    { userEmail: 'riley@demo.com', categorySlug: 'sushi',                restaurantSlug: 'kyoto',                    medalType: 'silver' },
    { userEmail: 'riley@demo.com', categorySlug: 'sushi',                restaurantSlug: 'sushi-groove',             medalType: 'bronze' },

    // ── Taylor: pizza, tacos, fried-chicken-sandwich, sushi, cookies, pad-thai, pulled-pork, indian-curry ──
    { userEmail: 'taylor@demo.com', categorySlug: 'pizza',               restaurantSlug: 'settebello',               medalType: 'gold'   },
    { userEmail: 'taylor@demo.com', categorySlug: 'pizza',               restaurantSlug: 'bricks-corner',            medalType: 'silver' },
    { userEmail: 'taylor@demo.com', categorySlug: 'pizza',               restaurantSlug: 'the-pie-pizzeria',         medalType: 'bronze' },

    { userEmail: 'taylor@demo.com', categorySlug: 'tacos',               restaurantSlug: 'red-iguana',               medalType: 'gold'   },
    { userEmail: 'taylor@demo.com', categorySlug: 'tacos',               restaurantSlug: 'lone-star-taqueria',       medalType: 'silver' },
    { userEmail: 'taylor@demo.com', categorySlug: 'tacos',               restaurantSlug: 'lola',                     medalType: 'bronze' },

    { userEmail: 'taylor@demo.com', categorySlug: 'fried-chicken-sandwich',restaurantSlug: 'daves-hot-chicken',      medalType: 'gold'   },
    { userEmail: 'taylor@demo.com', categorySlug: 'fried-chicken-sandwich',restaurantSlug: 'pretty-bird-hot-chicken',medalType: 'silver' },
    { userEmail: 'taylor@demo.com', categorySlug: 'fried-chicken-sandwich',restaurantSlug: 'bok-bok-korean-fried-chicken',medalType: 'bronze'},

    { userEmail: 'taylor@demo.com', categorySlug: 'sushi',               restaurantSlug: 'takashi',                  medalType: 'gold'   },
    { userEmail: 'taylor@demo.com', categorySlug: 'sushi',               restaurantSlug: 'kyoto',                    medalType: 'silver' },
    { userEmail: 'taylor@demo.com', categorySlug: 'sushi',               restaurantSlug: 'itto-sushi',               medalType: 'bronze' },

    { userEmail: 'taylor@demo.com', categorySlug: 'cookies',             restaurantSlug: 'crumbl',                   medalType: 'gold'   },
    { userEmail: 'taylor@demo.com', categorySlug: 'cookies',             restaurantSlug: 'chip-cookies',             medalType: 'silver' },
    { userEmail: 'taylor@demo.com', categorySlug: 'cookies',             restaurantSlug: 'rubysnap-fresh-cookies',   medalType: 'bronze' },

    { userEmail: 'taylor@demo.com', categorySlug: 'pad-thai',            restaurantSlug: 'tuk-tuks',                 medalType: 'gold'   },
    { userEmail: 'taylor@demo.com', categorySlug: 'pad-thai',            restaurantSlug: 'sawadee-thai',             medalType: 'silver' },
    { userEmail: 'taylor@demo.com', categorySlug: 'pad-thai',            restaurantSlug: 'chanon-thai-cafe',         medalType: 'bronze' },

    { userEmail: 'taylor@demo.com', categorySlug: 'pulled-pork',         restaurantSlug: 'r-and-r-bbq',             medalType: 'gold'   },
    { userEmail: 'taylor@demo.com', categorySlug: 'pulled-pork',         restaurantSlug: 'salt-city-barbecue',       medalType: 'silver' },
    { userEmail: 'taylor@demo.com', categorySlug: 'pulled-pork',         restaurantSlug: 'pats-barbecue',            medalType: 'bronze' },

    { userEmail: 'taylor@demo.com', categorySlug: 'indian-curry',        restaurantSlug: 'saffron-valley',           medalType: 'gold'   },
    { userEmail: 'taylor@demo.com', categorySlug: 'indian-curry',        restaurantSlug: 'star-of-india',            medalType: 'silver' },
    { userEmail: 'taylor@demo.com', categorySlug: 'indian-curry',        restaurantSlug: 'bhansa-ghar',              medalType: 'bronze' },

    // ── Ogden + Provo/Orem additions ─────────────────────────────────────────────
    //   Cheeseburgers: Taylor is the only user with open slots
    { userEmail: 'taylor@demo.com', categorySlug: 'cheeseburgers',       restaurantSlug: 'roosters-brewing-ogden',   medalType: 'gold'   },
    { userEmail: 'taylor@demo.com', categorySlug: 'cheeseburgers',       restaurantSlug: 'slackwater-ogden',         medalType: 'silver' },
    { userEmail: 'taylor@demo.com', categorySlug: 'cheeseburgers',       restaurantSlug: 'cubbys-provo',             medalType: 'bronze' },

    //   Pizza: Jordan and Riley both have open slots — Pizzeria 712 earns 2G, Nicolitalia 1S+1B
    { userEmail: 'jordan@demo.com', categorySlug: 'pizza',               restaurantSlug: 'pizzeria-712',             medalType: 'gold'   },
    { userEmail: 'jordan@demo.com', categorySlug: 'pizza',               restaurantSlug: 'nicolitalia-pizzeria',     medalType: 'silver' },
    { userEmail: 'jordan@demo.com', categorySlug: 'pizza',               restaurantSlug: 'brick-oven-provo',         medalType: 'bronze' },
    { userEmail: 'riley@demo.com',  categorySlug: 'pizza',               restaurantSlug: 'pizzeria-712',             medalType: 'gold'   },
    { userEmail: 'riley@demo.com',  categorySlug: 'pizza',               restaurantSlug: 'slackwater-ogden',         medalType: 'silver' },
    { userEmail: 'riley@demo.com',  categorySlug: 'pizza',               restaurantSlug: 'nicolitalia-pizzeria',     medalType: 'bronze' },

    //   Sushi: Jordan and Sam both have open slots — Five Sushi Brothers earns 2G
    { userEmail: 'jordan@demo.com', categorySlug: 'sushi',               restaurantSlug: 'five-sushi-brothers',      medalType: 'gold'   },
    { userEmail: 'jordan@demo.com', categorySlug: 'sushi',               restaurantSlug: 'tona-sushi-ogden',         medalType: 'silver' },
    { userEmail: 'jordan@demo.com', categorySlug: 'sushi',               restaurantSlug: 'itto-sushi',               medalType: 'bronze' },
    { userEmail: 'sam@demo.com',    categorySlug: 'sushi',               restaurantSlug: 'five-sushi-brothers',      medalType: 'gold'   },
    { userEmail: 'sam@demo.com',    categorySlug: 'sushi',               restaurantSlug: 'tona-sushi-ogden',         medalType: 'silver' },
    { userEmail: 'sam@demo.com',    categorySlug: 'sushi',               restaurantSlug: 'itto-sushi',               medalType: 'bronze' },

    //   Ramen: Jordan and Taylor both have open slots — Asa Ramen earns 1G + 1B
    { userEmail: 'jordan@demo.com', categorySlug: 'ramen',               restaurantSlug: 'asa-ramen',                medalType: 'gold'   },
    { userEmail: 'jordan@demo.com', categorySlug: 'ramen',               restaurantSlug: 'ramen-haus',               medalType: 'silver' },
    { userEmail: 'jordan@demo.com', categorySlug: 'ramen',               restaurantSlug: 'ramen-ichizu',             medalType: 'bronze' },
    { userEmail: 'taylor@demo.com', categorySlug: 'ramen',               restaurantSlug: 'ramen-haus',               medalType: 'gold'   },
    { userEmail: 'taylor@demo.com', categorySlug: 'ramen',               restaurantSlug: 'jinya-ramen-bar',          medalType: 'silver' },
    { userEmail: 'taylor@demo.com', categorySlug: 'ramen',               restaurantSlug: 'asa-ramen',                medalType: 'bronze' },

    //   Ice Cream: Alex and Jordan both have open slots — Farr Better earns 1G + 1S
    { userEmail: 'alex@demo.com',   categorySlug: 'ice-cream',           restaurantSlug: 'farr-better-ice-cream',    medalType: 'gold'   },
    { userEmail: 'alex@demo.com',   categorySlug: 'ice-cream',           restaurantSlug: 'nielsens-frozen-custard',  medalType: 'silver' },
    { userEmail: 'jordan@demo.com', categorySlug: 'ice-cream',           restaurantSlug: 'nielsens-frozen-custard',  medalType: 'gold'   },
    { userEmail: 'jordan@demo.com', categorySlug: 'ice-cream',           restaurantSlug: 'farr-better-ice-cream',    medalType: 'silver' },
  ]

  for (const m of medalData) {
    const userId         = users[m.userEmail]
    const foodCategoryId = categories[m.categorySlug]
    const restaurantId   = restaurants[m.restaurantSlug]
    if (!userId || !foodCategoryId || !restaurantId) {
      console.warn(`⚠️  Skipping medal: ${m.userEmail} / ${m.categorySlug} / ${m.restaurantSlug} (missing ID)`)
      continue
    }
    await prisma.medal.upsert({
      where:  { userId_foodCategoryId_medalType_year: { userId, foodCategoryId, medalType: m.medalType, year } },
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
