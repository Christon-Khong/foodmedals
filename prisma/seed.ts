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
    { name: 'Wings',                   slug: 'wings',                 iconEmoji: '🍗', sortOrder: 5,  description: 'Bone-in, boneless, sauced, or dry-rubbed' },
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
    { name: 'Lucky 13',                      slug: "lucky-13",                       address: '135 W 1300 S',            city: 'Salt Lake City', zip: '84115', lat: 40.7405, lng: -111.8937 },
    { name: 'Pretty Bird Hot Chicken',        slug: "pretty-bird-hot-chicken",        address: '146 Regent St',           city: 'Salt Lake City', zip: '84111', lat: 40.7578, lng: -111.8898 },
    { name: 'Copper Onion',                   slug: "copper-onion",                   address: '111 E Broadway',          city: 'Salt Lake City', zip: '84111', lat: 40.7561, lng: -111.8887 },
    { name: 'Cotton Bottom Inn',              slug: "cotton-bottom-inn",              address: '2820 E 6200 S',           city: 'Holladay',       zip: '84121', lat: 40.6665, lng: -111.829 },
    { name: "Dom's Burgers",                  slug: "doms-burgers",                   address: '975 S West Temple',       city: 'Salt Lake City', zip: '84101', lat: 40.7456, lng: -111.894 },
    // Pizza
    { name: 'Settebello Pizzeria Napoletana', slug: "settebello",                     address: '260 S 200 W',             city: 'Salt Lake City', zip: '84101', lat: 40.7567, lng: -111.8951 },
    { name: 'The Pie Pizzeria',               slug: "the-pie-pizzeria",               address: '1320 E 200 S',            city: 'Salt Lake City', zip: '84102', lat: 40.7577, lng: -111.8642 },
    { name: 'Slackwater Pizzeria',            slug: "slackwater-pizzeria",            address: '10290 S State St',        city: 'Sandy',          zip: '84070', lat: 40.5725, lng: -111.8918 },
    { name: 'Bricks Corner',                  slug: "bricks-corner",                  address: '668 S State St',          city: 'Salt Lake City', zip: '84111', lat: 40.7504, lng: -111.8916 },
    { name: 'Pizza Nono',                     slug: "pizza-nono",                     address: '925 E 900 S',             city: 'Salt Lake City', zip: '84105', lat: 40.7468, lng: -111.8722 },
    // French Fries
    { name: 'Bruges Belgian Bistro',          slug: "bruges-belgian-bistro",          address: '336 W Broadway',          city: 'Salt Lake City', zip: '84101', lat: 40.7561, lng: -111.8978 },
    { name: 'SpudToddos',                     slug: "spudtoddos",                     address: '3355 S 900 E',            city: 'Salt Lake City', zip: '84106', lat: 40.7085, lng: -111.8727 },
    { name: 'Hires Big H',                    slug: "hires-big-h",                    address: '425 S 700 E',             city: 'Salt Lake City', zip: '84102', lat: 40.7542, lng: -111.8768 },
    { name: "Bumblebee's",                    slug: "bumblebees",                     address: '844 S State St',          city: 'Salt Lake City', zip: '84111', lat: 40.7476, lng: -111.8916 },
    // Tacos
    { name: 'Tacos Garay',                    slug: "tacos-garay",                    address: '690 S 300 W',             city: 'Salt Lake City', zip: '84101', lat: 40.75, lng: -111.8971 },
    { name: "Emiliano's Taco Shop",           slug: "emilianos-taco-shop",            address: '1656 W North Temple',     city: 'Salt Lake City', zip: '84116', lat: 40.7761, lng: -111.9246 },
    { name: 'Red Iguana',                     slug: "red-iguana",                     address: '736 W North Temple',      city: 'Salt Lake City', zip: '84116', lat: 40.7761, lng: -111.9059 },
    { name: 'Lone Star Taqueria',             slug: "lone-star-taqueria",             address: '2265 E Fort Union Blvd',  city: 'Salt Lake City', zip: '84121', lat: 40.6502, lng: -111.845 },
    { name: 'Lola',                           slug: "lola",                           address: '51 S Main St',            city: 'Salt Lake City', zip: '84111', lat: 40.76, lng: -111.891 },
    // Chicken Wings
    { name: 'Wing Coop',                      slug: "wing-coop",                      address: '327 S Main St',           city: 'Salt Lake City', zip: '84111', lat: 40.7557, lng: -111.891 },
    { name: 'Trolley Wing Company',           slug: "trolley-wing-company",           address: '1509 S 1500 E',           city: 'Salt Lake City', zip: '84105', lat: 40.7373, lng: -111.8606 },
    { name: 'Scovilles',                      slug: "scovilles",                      address: '812 E 2100 S',            city: 'Salt Lake City', zip: '84106', lat: 40.728, lng: -111.8745 },
    { name: 'Mad for Chicken',                slug: "mad-for-chicken",                address: '349 S Main St',           city: 'Salt Lake City', zip: '84111', lat: 40.7554, lng: -111.891 },
    { name: 'Bonchon',                        slug: "bonchon",                        address: '152 S 200 W',             city: 'Salt Lake City', zip: '84101', lat: 40.7584, lng: -111.8951 },
    // Fried Chicken Sandwich
    { name: 'Houston TX Hot Chicken',         slug: "houston-tx-hot-chicken",         address: '912 E 900 S',             city: 'Salt Lake City', zip: '84105', lat: 40.7468, lng: -111.8725 },
    { name: "Dave's Hot Chicken",             slug: "daves-hot-chicken",              address: '1059 E 2100 S',           city: 'Salt Lake City', zip: '84106', lat: 40.728, lng: -111.8695 },
    { name: 'Bok Bok Korean Fried Chicken',   slug: "bok-bok-korean-fried-chicken",   address: '155 S 200 W',             city: 'Salt Lake City', zip: '84101', lat: 40.7583, lng: -111.8952 },
    { name: 'ChickQueen',                     slug: "chickqueen",                     address: '680 S 300 W',             city: 'Salt Lake City', zip: '84101', lat: 40.7502, lng: -111.8971 },
    { name: 'HallPass',                       slug: "hallpass",                       address: '153 S Rio Grande St',     city: 'Salt Lake City', zip: '84101', lat: 40.7584, lng: -111.9001 },
    // Burritos
    { name: "Chunga's",                       slug: "chungas",                        address: '180 S 900 W',             city: 'Salt Lake City', zip: '84104', lat: 40.758, lng: -111.9093 },
    { name: "Alberto's",                      slug: "albertos",                       address: '1399 S 900 W',            city: 'Salt Lake City', zip: '84104', lat: 40.739, lng: -111.9093 },
    // Sushi
    { name: 'Takashi',                        slug: "takashi",                        address: '18 W Market St',          city: 'Salt Lake City', zip: '84101', lat: 40.7553, lng: -111.8914 },
    { name: 'Tsunami',                        slug: "tsunami",                        address: '515 S 700 E',             city: 'Salt Lake City', zip: '84102', lat: 40.7527, lng: -111.8768 },
    { name: 'Sushi Groove',                   slug: "sushi-groove",                   address: '2910 S Highland Dr',      city: 'Salt Lake City', zip: '84106', lat: 40.7154, lng: -111.8773 },
    { name: 'Kyoto',                          slug: "kyoto",                          address: '1080 E 1300 S',           city: 'Salt Lake City', zip: '84105', lat: 40.7405, lng: -111.8691 },
    { name: 'Itto Sushi',                     slug: "itto-sushi",                     address: '935 E 900 S',             city: 'Salt Lake City', zip: '84105', lat: 40.7468, lng: -111.872 },
    // Ramen
    { name: "Tosh's Ramen",                   slug: "toshs-ramen",                    address: '1465 S State St',         city: 'Salt Lake City', zip: '84115', lat: 40.738, lng: -111.8916 },
    { name: 'Ramen Ichizu',                   slug: "ramen-ichizu",                   address: '43 W 900 S',              city: 'Salt Lake City', zip: '84101', lat: 40.7468, lng: -111.8919 },
    { name: 'Jinya Ramen Bar',                slug: "jinya-ramen-bar",                address: '1201 E 2100 S',           city: 'Salt Lake City', zip: '84106', lat: 40.728, lng: -111.8666 },
    { name: 'Yoko Ramen',                     slug: "yoko-ramen",                     address: '233 S Edison St',         city: 'Salt Lake City', zip: '84111', lat: 40.7572, lng: -111.8869 },
    { name: 'Ramen Haus',                     slug: "ramen-haus",                     address: '195 25th St',             city: 'Ogden',          zip: '84401', lat: 41.2247, lng: -111.976 },
    // Mac & Cheese
    { name: "Ruth's Diner",                   slug: "ruths-diner",                    address: '4160 Emigration Canyon Rd',city: 'Salt Lake City', zip: '84108', lat: 40.7469, lng: -111.8258 },
    { name: 'Squatters Pub',                  slug: "squatters-pub",                  address: '147 W Broadway',          city: 'Salt Lake City', zip: '84101', lat: 40.7561, lng: -111.894 },
    { name: 'R&R BBQ',                        slug: "r-and-r-bbq",                    address: '307 W 600 S',             city: 'Salt Lake City', zip: '84101', lat: 40.7514, lng: -111.8972 },
    { name: "Grandma Claire's",               slug: "grandma-claires",                address: '190 S 200 W',             city: 'Salt Lake City', zip: '84101', lat: 40.7578, lng: -111.8951 },
    { name: "Eva's Bakery",                   slug: "evas-bakery",                    address: '155 S Main St',           city: 'Salt Lake City', zip: '84111', lat: 40.7584, lng: -111.891 },
    // Ice Cream
    { name: 'Rockwell Ice Cream',             slug: "rockwell-ice-cream",             address: '201 N University Ave',    city: 'Provo',          zip: '84601', lat: 40.2374, lng: -111.6602 },
    { name: "Nielsen's Frozen Custard",       slug: "nielsens-frozen-custard",        address: '2272 S Highland Dr',      city: 'Salt Lake City', zip: '84106', lat: 40.7254, lng: -111.8773 },
    { name: "Handel's",                       slug: "handels",                        address: '12235 S Lone Peak Pkwy',  city: 'Riverton',       zip: '84096', lat: 40.521, lng: -111.9334 },
    { name: 'Sub Zero',                       slug: "sub-zero",                       address: '60 E Center St',          city: 'Provo',          zip: '84606', lat: 40.2337, lng: -111.6572 },
    { name: "Rowley's Red Barn",              slug: "rowleys-red-barn",               address: '901 S Main St',           city: 'Santaquin',      zip: '84655', lat: 39.9741, lng: -111.7858 },
    // Chicken Tenders
    { name: "Charlie's Chicken",              slug: "charlies-chicken",               address: '5880 S State St',         city: 'Murray',         zip: '84107', lat: 40.668, lng: -111.8875 },
    { name: "Raising Cane's",                 slug: "raising-canes",                  address: '2150 S State St',         city: 'South Salt Lake',zip: '84115', lat: 40.7299, lng: -111.8916 },
    { name: "Crazy D's Hot Chicken",          slug: "crazy-ds-hot-chicken",           address: '156 S 200 W',             city: 'Salt Lake City', zip: '84101', lat: 40.7583, lng: -111.8953 },
    // Nachos
    { name: 'Nacho Daddy',                    slug: "nacho-daddy",                    address: '190 S 200 W',             city: 'Salt Lake City', zip: '84101', lat: 40.7578, lng: -111.895 },
    { name: 'Porcupine Pub & Grille',         slug: "porcupine-pub-and-grille",       address: '3698 E Fort Union Blvd',  city: 'Salt Lake City', zip: '84121', lat: 40.6502, lng: -111.8272 },
    { name: "Gracie's",                       slug: "gracies",                        address: '326 S West Temple',       city: 'Salt Lake City', zip: '84101', lat: 40.7557, lng: -111.894 },
    // BBQ Ribs
    { name: 'Salt City Barbecue',             slug: "salt-city-barbecue",             address: '2000 S West Temple',      city: 'Salt Lake City', zip: '84115', lat: 40.7296, lng: -111.894 },
    { name: "Pat's Barbecue",                 slug: "pats-barbecue",                  address: '155 W Commonwealth Ave',  city: 'Salt Lake City', zip: '84115', lat: 40.7388, lng: -111.8937 },
    { name: "Charlotte-Rose's Carolina BBQ",  slug: "charlotte-roses-carolina-bbq",   address: '42 E Gallivan Ave',       city: 'Salt Lake City', zip: '84111', lat: 40.7546, lng: -111.8905 },
    { name: "Kenny J's BBQ",                  slug: "kenny-js-bbq",                   address: '940 S 300 W',             city: 'Salt Lake City', zip: '84101', lat: 40.7461, lng: -111.8971 },
    // Donuts
    { name: 'Banbury Cross Donuts',           slug: "banbury-cross-donuts",           address: '705 S 700 E',             city: 'Salt Lake City', zip: '84102', lat: 40.7498, lng: -111.8768 },
    { name: 'Fresh Donut & Deli',             slug: "fresh-donut-and-deli",           address: '3300 S State St',         city: 'South Salt Lake',zip: '84115', lat: 40.7093, lng: -111.8916 },
    { name: 'Provo Bakery',                   slug: "provo-bakery",                   address: '190 E 100 N',             city: 'Provo',          zip: '84606', lat: 40.2357, lng: -111.6547 },
    { name: 'Spudly Donuts',                  slug: "spudly-donuts",                  address: '70 E Center St',          city: 'Provo',          zip: '84606', lat: 40.2338, lng: -111.6573 },
    { name: 'Bismarck Doughnuts',             slug: "bismarck-doughnuts",             address: '1692 N State St',         city: 'Provo',          zip: '84604', lat: 40.2528, lng: -111.6558 },
    // Milkshakes
    { name: 'Iceberg Drive Inn',              slug: "iceberg-drive-inn",              address: '3900 S 900 E',            city: 'Salt Lake City', zip: '84124', lat: 40.7, lng: -111.8727 },
    { name: "Millie's Burgers",               slug: "millies-burgers",                address: '260 S 1300 E',            city: 'Salt Lake City', zip: '84102', lat: 40.7567, lng: -111.8646 },
    { name: "Woody's Drive-In",               slug: "woodys-drive-in",                address: '1292 S State St',         city: 'Salt Lake City', zip: '84115', lat: 40.7406, lng: -111.8916 },
    // Cookies
    { name: 'Crumbl',                         slug: "crumbl",                         address: '3375 S State St',         city: 'Salt Lake City', zip: '84115', lat: 40.7082, lng: -111.8916 },
    { name: 'Chip Cookies',                   slug: "chip-cookies",                   address: '275 E 200 S',             city: 'Salt Lake City', zip: '84111', lat: 40.7577, lng: -111.8854 },
    { name: 'RubySnap Fresh Cookies',         slug: "rubysnap-fresh-cookies",         address: '770 S 300 W',             city: 'Salt Lake City', zip: '84101', lat: 40.7488, lng: -111.8971 },
    { name: 'Süss Cookie Company',            slug: "suss-cookie-company",            address: '240 N University Ave',    city: 'Provo',          zip: '84601', lat: 40.2375, lng: -111.6598 },
    { name: 'Crave Cookies',                  slug: "crave-cookies",                  address: '1578 S State St',         city: 'Salt Lake City', zip: '84115', lat: 40.7362, lng: -111.8916 },
    // Pad Thai
    { name: 'Tuk Tuks',                       slug: "tuk-tuks",                       address: '1675 W North Temple',     city: 'Salt Lake City', zip: '84116', lat: 40.7761, lng: -111.925 },
    { name: 'Sawadee Thai',                   slug: "sawadee-thai",                   address: '754 E South Temple',      city: 'Salt Lake City', zip: '84102', lat: 40.7692, lng: -111.8757 },
    { name: 'Chanon Thai Cafe',               slug: "chanon-thai-cafe",               address: '278 E 900 S',             city: 'Salt Lake City', zip: '84111', lat: 40.7468, lng: -111.8854 },
    { name: 'Aroon Thai Kitchen',             slug: "aroon-thai-kitchen",             address: '1677 W North Temple',     city: 'Salt Lake City', zip: '84116', lat: 40.7761, lng: -111.9251 },
    { name: 'Suzy Thai Food',                 slug: "suzy-thai-food",                 address: '200 S 200 W',             city: 'Salt Lake City', zip: '84101', lat: 40.7577, lng: -111.8951 },
    // Pho
    { name: 'Pho 777',                        slug: "pho-777",                        address: '1080 S State St',         city: 'Salt Lake City', zip: '84111', lat: 40.744, lng: -111.8916 },
    { name: 'Pho Tay Ho',                     slug: "pho-tay-ho",                     address: '1766 S Main St',          city: 'Salt Lake City', zip: '84115', lat: 40.7333, lng: -111.891 },
    { name: 'Pho 33',                         slug: "pho-33",                         address: '150 S State St',          city: 'Salt Lake City', zip: '84111', lat: 40.7585, lng: -111.8916 },
    { name: 'SOMI Vietnamese Bistro',         slug: "somi-vietnamese-bistro",         address: '151 S Main St',           city: 'Salt Lake City', zip: '84111', lat: 40.7585, lng: -111.891 },
    { name: 'Oh Mai',                         slug: "oh-mai",                         address: '3425 S State St',         city: 'Salt Lake City', zip: '84115', lat: 40.7074, lng: -111.8916 },
    // Birria Tacos
    { name: 'Santo Taco',                     slug: "santo-taco",                     address: '1465 S State St',         city: 'Salt Lake City', zip: '84115', lat: 40.738, lng: -111.8917 },
    { name: 'Los Tapatios Taco Grill',        slug: "los-tapatios-taco-grill",        address: '248 W 200 S',             city: 'Salt Lake City', zip: '84101', lat: 40.7577, lng: -111.896 },
    { name: 'La Casa Del Tamal',              slug: "la-casa-del-tamal",              address: '1518 S State St',         city: 'Salt Lake City', zip: '84115', lat: 40.7371, lng: -111.8916 },
    { name: 'Roctaco',                        slug: "roctaco",                        address: '501 E 2700 S',            city: 'Salt Lake City', zip: '84106', lat: 40.7187, lng: -111.8808 },
    { name: 'Taqueria 27',                    slug: "taqueria-27",                    address: '1615 S Foothill Dr',      city: 'Salt Lake City', zip: '84108', lat: 40.7356, lng: -111.8618 },
    // Breakfast Burritos
    { name: "Beto's Mexican Food",            slug: "betos-mexican-food",             address: '2038 W 3500 S',           city: 'West Valley City',zip: '84119', lat: 40.6916, lng: -111.9521 },
    { name: 'Bad-Ass Breakfast Burritos',     slug: "bad-ass-breakfast-burritos",     address: '764 S 200 W',             city: 'Salt Lake City', zip: '84101', lat: 40.7489, lng: -111.8951 },
    { name: 'Skillets',                       slug: "skillets",                       address: '67 W 1700 S',             city: 'Salt Lake City', zip: '84115', lat: 40.7343, lng: -111.8924 },
    { name: "Floriberto's",                   slug: "floribertos",                    address: '2150 S State St',         city: 'Salt Lake City', zip: '84115', lat: 40.7273, lng: -111.8916 },
    // Fish Tacos
    { name: 'Flanker Kitchen',                slug: "flanker-kitchen",                address: '6 N Rio Grande St',       city: 'Salt Lake City', zip: '84101', lat: 40.7612, lng: -111.8981 },
    // Pulled Pork
    { name: "Benji's",                        slug: "benjis",                         address: '820 S State St',          city: 'Salt Lake City', zip: '84111', lat: 40.748, lng: -111.8916 },
    // Acai Bowls
    { name: 'Bowls Superfoods',               slug: "bowls-superfoods",               address: '1283 N University Ave',   city: 'Provo',          zip: '84604', lat: 40.2527, lng: -111.6593 },
    { name: 'Vida Açaí',                      slug: "vida-acai",                      address: '20 W Center St',          city: 'Provo',          zip: '84601', lat: 40.2338, lng: -111.659 },
    { name: 'Vitality Bowls',                 slug: "vitality-bowls",                 address: '50 S Main St',            city: 'Salt Lake City', zip: '84101', lat: 40.76, lng: -111.8911 },
    { name: 'Honest Eatery',                  slug: "honest-eatery",                  address: '53 W 200 S',              city: 'Salt Lake City', zip: '84101', lat: 40.7577, lng: -111.8921 },
    { name: 'Liv Pure Acai',                  slug: "liv-pure-acai",                  address: '200 S 200 W',             city: 'Salt Lake City', zip: '84101', lat: 40.7577, lng: -111.8952 },
    // Indian Curry
    { name: 'Saffron Valley',                 slug: "saffron-valley",                 address: '26 E St',                 city: 'Salt Lake City', zip: '84103', lat: 40.7693, lng: -111.8866 },
    { name: 'Bombay House',                   slug: "bombay-house",                   address: '463 N University Ave',    city: 'Provo',          zip: '84601', lat: 40.2407, lng: -111.659 },
    { name: 'The Kathmandu',                  slug: "the-kathmandu",                  address: '3142 S Highland Dr',      city: 'Salt Lake City', zip: '84106', lat: 40.7118, lng: -111.8773 },
    { name: 'Bhansa Ghar',                    slug: "bhansa-ghar",                    address: '138 W 300 S',             city: 'Salt Lake City', zip: '84101', lat: 40.7561, lng: -111.8938 },
    { name: 'Star of India',                  slug: "star-of-india",                  address: '177 E 200 S',             city: 'Salt Lake City', zip: '84111', lat: 40.7577, lng: -111.8874 },
    // ─── Ogden ──────────────────────────────────────────────────────────────────
    { name: "Roosters Brewing Co.",           slug: "roosters-brewing-ogden",         address: '253 25th St',             city: 'Ogden',          zip: '84401', lat: 41.2247, lng: -111.9752 },
    { name: 'Slackwater Pub (Ogden)',         slug: "slackwater-ogden",               address: '1895 Washington Blvd',    city: 'Ogden',          zip: '84401', lat: 41.2059, lng: -111.9741 },
    { name: 'Lucky Slice Pizza (Ogden)',      slug: "lucky-slice-ogden",              address: '226 25th St',             city: 'Ogden',          zip: '84401', lat: 41.2247, lng: -111.9757 },
    { name: 'Tona Sushi & Grill',            slug: "tona-sushi-ogden",               address: '210 25th St',             city: 'Ogden',          zip: '84401', lat: 41.2247, lng: -111.9758 },
    { name: 'Farr Better Ice Cream',          slug: "farr-better-ice-cream",          address: '286 21st St',             city: 'Ogden',          zip: '84401', lat: 41.2304, lng: -111.9747 },
    { name: 'Thai Pho Kitchen',               slug: "thai-pho-kitchen-ogden",         address: '3900 Washington Blvd',    city: 'Ogden',          zip: '84403', lat: 41.1924, lng: -111.9673 },
    { name: 'Daylight Donuts (Ogden)',        slug: "daylight-donuts-ogden",          address: '444 25th St',             city: 'Ogden',          zip: '84401', lat: 41.2245, lng: -111.9744 },
    { name: "Rancherito's",                   slug: "rancheritos-ogden",              address: '555 E 12th St',           city: 'Ogden',          zip: '84404', lat: 41.2379, lng: -111.9587 },
    // ─── Provo / Orem ────────────────────────────────────────────────────────────
    { name: "Cubby's (Provo)",               slug: "cubbys-provo",                   address: '801 N University Ave',    city: 'Provo',          zip: '84604', lat: 40.2475, lng: -111.6596 },
    { name: "Marley's Gourmet Sliders",       slug: "marleys-gourmet-sliders",        address: '161 W Center St',         city: 'Provo',          zip: '84601', lat: 40.2338, lng: -111.6619 },
    { name: 'Pizzeria 712',                   slug: "pizzeria-712",                   address: '320 S State St',          city: 'Orem',           zip: '84058', lat: 40.2921, lng: -111.6963 },
    { name: 'Nicolitalia Pizzeria',           slug: "nicolitalia-pizzeria",           address: '48 E Center St',          city: 'Provo',          zip: '84601', lat: 40.2338, lng: -111.6576 },
    { name: 'Brick Oven Restaurant',          slug: "brick-oven-provo",               address: '111 E 800 N',             city: 'Provo',          zip: '84606', lat: 40.248, lng: -111.656 },
    { name: 'Five Sushi Brothers',            slug: "five-sushi-brothers",            address: '194 W Center St',         city: 'Provo',          zip: '84601', lat: 40.2338, lng: -111.6621 },
    { name: 'Asa Ramen',                      slug: "asa-ramen",                      address: '55 N University Ave',     city: 'Provo',          zip: '84601', lat: 40.2348, lng: -111.6588 },
    { name: 'Black Sheep Cafe',               slug: "black-sheep-cafe",               address: '19 N University Ave',     city: 'Provo',          zip: '84601', lat: 40.2342, lng: -111.6587 },
    { name: 'Café Sabor (Provo)',             slug: "cafe-sabor-provo",               address: '240 W Center St',         city: 'Provo',          zip: '84601', lat: 40.2338, lng: -111.6625 },
    { name: 'Chip Cookies (Provo)',           slug: "chip-cookies-provo",             address: '95 N University Ave',     city: 'Provo',          zip: '84601', lat: 40.2352, lng: -111.6589 },
    { name: 'Hires Big H (Orem)',             slug: "hires-big-h-orem",               address: '900 N State St',          city: 'Orem',           zip: '84057', lat: 40.3105, lng: -111.695 },
    // ─── Park City ───────────────────────────────────────────────────────────────
    { name: 'No Name Saloon',                 slug: "no-name-saloon",                 address: '447 Main St',             city: 'Park City',      zip: '84060', lat: 40.6463, lng: -111.4978 },
    { name: 'Hearth and Hill',                slug: "hearth-and-hill",                address: '1153 Center Dr',          city: 'Park City',      zip: '84060', lat: 40.691, lng: -111.507 },
    { name: 'Boneyard Saloon & Grill',        slug: "boneyard-saloon",                address: '1251 Kearns Blvd',        city: 'Park City',      zip: '84060', lat: 40.6545, lng: -111.4974 },
    { name: 'Yuki Yama Sushi',                slug: "yuki-yama-sushi",                address: '586 Main St',             city: 'Park City',      zip: '84060', lat: 40.6453, lng: -111.4975 },
    { name: 'Shabu',                          slug: "shabu",                          address: '442 Main St',             city: 'Park City',      zip: '84060', lat: 40.6463, lng: -111.4979 },
    { name: 'Hana Ramen Bar',                 slug: "hana-ramen-bar",                 address: '1612 Ute Blvd',           city: 'Park City',      zip: '84098', lat: 40.6886, lng: -111.5115 },
    { name: 'Dos Olas Cantina',               slug: "dos-olas-cantina",               address: '804 Main St',             city: 'Park City',      zip: '84060', lat: 40.6441, lng: -111.4971 },
    { name: 'Wasatch Bagel and Grill',        slug: "wasatch-bagel",                  address: '333 Main St',             city: 'Park City',      zip: '84060', lat: 40.6468, lng: -111.4983 },
    { name: 'Atticus Coffee & Tea',           slug: "atticus-coffee",                 address: '738 Main St',             city: 'Park City',      zip: '84060', lat: 40.6444, lng: -111.4973 },
    { name: 'Chomp Donuts & Coffee',          slug: "chomp-donuts",                   address: '1700 Snow Creek Dr',      city: 'Park City',      zip: '84060', lat: 40.6475, lng: -111.5055 },
    { name: "Auntie Em's",                    slug: "auntie-ems",                     address: '1700 Snow Creek Dr',      city: 'Park City',      zip: '84060', lat: 40.6476, lng: -111.5056 },
    { name: 'Java Cow Café & Bakery',         slug: "java-cow",                       address: '402 Main St',             city: 'Park City',      zip: '84060', lat: 40.6465, lng: -111.498 },
    // ─── St. George ──────────────────────────────────────────────────────────────
    { name: "Morty's Cafe",                   slug: "mortys-st-george",               address: '396 E Tabernacle St',     city: 'St. George',     zip: '84770', lat: 37.0961, lng: -113.5616 },
    { name: 'Burger Theory',                  slug: "burger-theory",                  address: '1555 S Convention Center Dr', city: 'St. George', zip: '84790', lat: 37.0799, lng: -113.5756 },
    { name: "Rigatti's",                      slug: "rigattis",                       address: '73 N Main St',            city: 'St. George',     zip: '84770', lat: 37.097, lng: -113.569 },
    { name: "Angelica's Mexican Grill",       slug: "angelicas",                      address: '925 W Sunset Blvd',       city: 'St. George',     zip: '84770', lat: 37.0994, lng: -113.5803 },
    { name: 'Sandtown',                       slug: "sandtown",                       address: '511 S Airport Rd',        city: 'St. George',     zip: '84770', lat: 37.087, lng: -113.595 },
    { name: 'Benja Thai & Sushi',             slug: "benja-thai",                     address: '2 W St. George Blvd',     city: 'St. George',     zip: '84770', lat: 37.0965, lng: -113.5689 },
    { name: "Slurpin' Ramen Bar",             slug: "slurpin-ramen",                  address: '929 W Sunset Blvd',       city: 'St. George',     zip: '84770', lat: 37.0994, lng: -113.5805 },
    { name: 'Red Fort Cuisine',               slug: "red-fort-cuisine",               address: '100 W St. George Blvd',   city: 'St. George',     zip: '84770', lat: 37.0965, lng: -113.5703 },
    { name: "Nielsen's Frozen Custard",       slug: "nielsens-st-george",             address: '2286 Red Cliffs Dr',      city: 'St. George',     zip: '84790', lat: 37.0896, lng: -113.5318 },
    { name: 'Pica Rica BBQ',                  slug: "pica-rica-bbq",                  address: '1440 S Bluff St',         city: 'St. George',     zip: '84770', lat: 37.0818, lng: -113.5749 },
    { name: 'Bonrue Bakery',                  slug: "bonrue-bakery",                  address: '143 N 100 W',             city: 'St. George',     zip: '84770', lat: 37.098, lng: -113.5698 },
    { name: "George's Corner",                slug: "georges-corner",                 address: '2 W St. George Blvd',     city: 'St. George',     zip: '84770', lat: 37.0964, lng: -113.5688 },
    // ─── Lehi / Draper / Sandy ───────────────────────────────────────────────────
    { name: "Cubby's",                        slug: "cubbys-lehi",                    address: '1044 E Main St',          city: 'Lehi',           zip: '84043', lat: 40.3917, lng: -111.834 },
    { name: 'Hamachi Sushi Bar',              slug: "hamachi-sushi",                  address: '3626 Outlet Pkwy',        city: 'Lehi',           zip: '84043', lat: 40.4245, lng: -111.8867 },
    { name: 'Tsunami',                        slug: "tsunami-sandy",                  address: '11461 S State St',        city: 'Sandy',          zip: '84070', lat: 40.5518, lng: -111.8918 },
    { name: 'Sobo Sushi and Ramen',           slug: "sobo-sushi-ramen",               address: '3566 Outlet Pkwy',        city: 'Lehi',           zip: '84043', lat: 40.4245, lng: -111.8875 },
    { name: 'Baan Thai',                      slug: "baan-thai",                      address: '1541 S State St',         city: 'Lehi',           zip: '84043', lat: 40.3782, lng: -111.8598 },
    { name: 'Montauk Bistro',                 slug: "montauk-bistro",                 address: '13862 Bangerter Pkwy',    city: 'Draper',         zip: '84020', lat: 40.4912, lng: -111.9018 },
    { name: 'Dog Haus',                       slug: "dog-haus-sandy",                 address: '10261 S State St',        city: 'Sandy',          zip: '84070', lat: 40.5727, lng: -111.8918 },
    // ─── Logan ───────────────────────────────────────────────────────────────────
    { name: "Morty's",                        slug: "mortys-logan",                   address: '1177 N Main St',          city: 'Logan',          zip: '84341', lat: 41.7485, lng: -111.8339 },
    { name: 'Center Street Pizza',            slug: "center-street-pizza",            address: '71 W Center St',          city: 'Logan',          zip: '84321', lat: 41.737, lng: -111.8348 },
    { name: 'Firehouse Pizza',                slug: "firehouse-pizza",                address: '95 W Center St',          city: 'Logan',          zip: '84321', lat: 41.737, lng: -111.8352 },
    { name: 'Cafe Sabor',                     slug: "cafe-sabor-logan",               address: '600 W Center St',         city: 'Logan',          zip: '84321', lat: 41.737, lng: -111.846 },
    { name: 'Aggie Ice Cream',                slug: "aggie-ice-cream",                address: '750 N 1200 E',            city: 'Logan',          zip: '84322', lat: 41.7476, lng: -111.8152 },
    { name: 'Akita Ramen Poke and Boba',      slug: "akita-ramen",                    address: '35 W Center St',          city: 'Logan',          zip: '84321', lat: 41.737, lng: -111.8344 },
    { name: 'Himalayan Flavor',               slug: "himalayan-flavor",               address: '58 W Center St',          city: 'Logan',          zip: '84321', lat: 41.737, lng: -111.8348 },
  ]

  const restaurants: Record<string, string> = {}
  for (const r of restaurantData) {
    const rec = await prisma.restaurant.upsert({
      where:  { slug: r.slug },
      update: { lat: r.lat, lng: r.lng },
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
    ['wing-coop',                   'wings'],
    ['trolley-wing-company',        'wings'],
    ['scovilles',                   'wings'],
    ['mad-for-chicken',             'wings'],
    ['bonchon',                     'wings'],
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
    ['roosters-brewing-ogden',      'wings'],
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
    // ─── Park City ───────────────────────────────────────────────────────────────
    ['no-name-saloon',              'cheeseburgers'],
    ['hearth-and-hill',             'cheeseburgers'],
    ['hearth-and-hill',             'birria-tacos'],
    ['boneyard-saloon',             'pizza'],
    ['yuki-yama-sushi',             'sushi'],
    ['shabu',                       'sushi'],
    ['hana-ramen-bar',              'ramen'],
    ['dos-olas-cantina',            'tacos'],
    ['wasatch-bagel',               'breakfast-burritos'],
    ['atticus-coffee',              'breakfast-burritos'],
    ['chomp-donuts',                'donuts'],
    ['auntie-ems',                  'cookies'],
    ['java-cow',                    'ice-cream'],
    // ─── St. George ──────────────────────────────────────────────────────────────
    ['mortys-st-george',            'cheeseburgers'],
    ['burger-theory',               'cheeseburgers'],
    ['rigattis',                    'pizza'],
    ['angelicas',                   'tacos'],
    ['angelicas',                   'burritos'],
    ['sandtown',                    'wings'],
    ['benja-thai',                  'sushi'],
    ['benja-thai',                  'pad-thai'],
    ['slurpin-ramen',               'ramen'],
    ['red-fort-cuisine',            'indian-curry'],
    ['nielsens-st-george',          'ice-cream'],
    ['pica-rica-bbq',               'bbq-ribs'],
    ['pica-rica-bbq',               'pulled-pork'],
    ['bonrue-bakery',               'donuts'],
    ['georges-corner',              'breakfast-burritos'],
    // ─── Lehi / Draper / Sandy ───────────────────────────────────────────────────
    ['cubbys-lehi',                 'cheeseburgers'],
    ['hamachi-sushi',               'sushi'],
    ['tsunami-sandy',               'sushi'],
    ['sobo-sushi-ramen',            'ramen'],
    ['baan-thai',                   'pad-thai'],
    ['montauk-bistro',              'pho'],
    ['montauk-bistro',              'pad-thai'],
    ['dog-haus-sandy',              'fried-chicken-sandwich'],
    ['dog-haus-sandy',              'breakfast-burritos'],
    // ─── Logan ───────────────────────────────────────────────────────────────────
    ['mortys-logan',                'cheeseburgers'],
    ['center-street-pizza',         'pizza'],
    ['firehouse-pizza',             'pizza'],
    ['cafe-sabor-logan',            'tacos'],
    ['cafe-sabor-logan',            'burritos'],
    ['aggie-ice-cream',             'ice-cream'],
    ['akita-ramen',                 'ramen'],
    ['himalayan-flavor',            'indian-curry'],
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

    { userEmail: 'alex@demo.com', categorySlug: 'wings',         restaurantSlug: 'wing-coop',                medalType: 'gold'   },
    { userEmail: 'alex@demo.com', categorySlug: 'wings',         restaurantSlug: 'trolley-wing-company',     medalType: 'silver' },
    { userEmail: 'alex@demo.com', categorySlug: 'wings',         restaurantSlug: 'scovilles',                medalType: 'bronze' },

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

    { userEmail: 'sam@demo.com', categorySlug: 'wings',          restaurantSlug: 'wing-coop',                medalType: 'gold'   },
    { userEmail: 'sam@demo.com', categorySlug: 'wings',          restaurantSlug: 'scovilles',                medalType: 'silver' },
    { userEmail: 'sam@demo.com', categorySlug: 'wings',          restaurantSlug: 'mad-for-chicken',          medalType: 'bronze' },

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

    // ── Park City + St. George additions ─────────────────────────────────────────
    { userEmail: 'alex@demo.com',   categorySlug: 'sushi',               restaurantSlug: 'yuki-yama-sushi',          medalType: 'gold'   },
    { userEmail: 'jordan@demo.com', categorySlug: 'sushi',               restaurantSlug: 'yuki-yama-sushi',          medalType: 'silver' },
    { userEmail: 'sam@demo.com',    categorySlug: 'sushi',               restaurantSlug: 'shabu',                    medalType: 'bronze' },
    { userEmail: 'riley@demo.com',  categorySlug: 'sushi',               restaurantSlug: 'yuki-yama-sushi',          medalType: 'bronze' },
    { userEmail: 'alex@demo.com',   categorySlug: 'cheeseburgers',       restaurantSlug: 'no-name-saloon',           medalType: 'gold'   },
    { userEmail: 'jordan@demo.com', categorySlug: 'cheeseburgers',       restaurantSlug: 'no-name-saloon',           medalType: 'gold'   },
    { userEmail: 'sam@demo.com',    categorySlug: 'cheeseburgers',       restaurantSlug: 'hearth-and-hill',          medalType: 'silver' },
    { userEmail: 'alex@demo.com',   categorySlug: 'wings',       restaurantSlug: 'sandtown',                 medalType: 'gold'   },
    { userEmail: 'jordan@demo.com', categorySlug: 'wings',       restaurantSlug: 'sandtown',                 medalType: 'gold'   },
    { userEmail: 'sam@demo.com',    categorySlug: 'wings',       restaurantSlug: 'sandtown',                 medalType: 'silver' },
    { userEmail: 'alex@demo.com',   categorySlug: 'pizza',               restaurantSlug: 'rigattis',                 medalType: 'gold'   },
    { userEmail: 'jordan@demo.com', categorySlug: 'pizza',               restaurantSlug: 'rigattis',                 medalType: 'silver' },
    { userEmail: 'sam@demo.com',    categorySlug: 'pizza',               restaurantSlug: 'rigattis',                 medalType: 'silver' },
    { userEmail: 'alex@demo.com',   categorySlug: 'indian-curry',        restaurantSlug: 'red-fort-cuisine',         medalType: 'gold'   },
    { userEmail: 'jordan@demo.com', categorySlug: 'indian-curry',        restaurantSlug: 'red-fort-cuisine',         medalType: 'gold'   },
    { userEmail: 'riley@demo.com',  categorySlug: 'indian-curry',        restaurantSlug: 'red-fort-cuisine',         medalType: 'bronze' },
    { userEmail: 'alex@demo.com',   categorySlug: 'cheeseburgers',       restaurantSlug: 'mortys-st-george',         medalType: 'silver' },
    { userEmail: 'jordan@demo.com', categorySlug: 'cheeseburgers',       restaurantSlug: 'burger-theory',            medalType: 'bronze' },

    // ── Lehi / Draper / Sandy + Logan additions ───────────────────────────────────
    { userEmail: 'alex@demo.com',   categorySlug: 'pizza',               restaurantSlug: 'firehouse-pizza',          medalType: 'gold'   },
    { userEmail: 'jordan@demo.com', categorySlug: 'pizza',               restaurantSlug: 'firehouse-pizza',          medalType: 'silver' },
    { userEmail: 'sam@demo.com',    categorySlug: 'pizza',               restaurantSlug: 'center-street-pizza',      medalType: 'silver' },
    { userEmail: 'riley@demo.com',  categorySlug: 'pizza',               restaurantSlug: 'center-street-pizza',      medalType: 'bronze' },
    { userEmail: 'alex@demo.com',   categorySlug: 'ice-cream',           restaurantSlug: 'aggie-ice-cream',          medalType: 'gold'   },
    { userEmail: 'jordan@demo.com', categorySlug: 'ice-cream',           restaurantSlug: 'aggie-ice-cream',          medalType: 'gold'   },
    { userEmail: 'sam@demo.com',    categorySlug: 'ice-cream',           restaurantSlug: 'aggie-ice-cream',          medalType: 'gold'   },
    { userEmail: 'riley@demo.com',  categorySlug: 'ice-cream',           restaurantSlug: 'aggie-ice-cream',          medalType: 'silver' },
    { userEmail: 'alex@demo.com',   categorySlug: 'sushi',               restaurantSlug: 'hamachi-sushi',            medalType: 'gold'   },
    { userEmail: 'jordan@demo.com', categorySlug: 'sushi',               restaurantSlug: 'hamachi-sushi',            medalType: 'silver' },
    { userEmail: 'alex@demo.com',   categorySlug: 'ramen',               restaurantSlug: 'sobo-sushi-ramen',         medalType: 'gold'   },
    { userEmail: 'sam@demo.com',    categorySlug: 'ramen',               restaurantSlug: 'sobo-sushi-ramen',         medalType: 'bronze' },
    { userEmail: 'alex@demo.com',   categorySlug: 'indian-curry',        restaurantSlug: 'himalayan-flavor',         medalType: 'gold'   },
    { userEmail: 'jordan@demo.com', categorySlug: 'indian-curry',        restaurantSlug: 'himalayan-flavor',         medalType: 'silver' },
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
