import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isAdminEmail } from '@/lib/adminAuth'
import { getCategoryBySlug, getLeaderboard, getCitiesForCategory } from '@/lib/queries'
import { HeroImage } from '@/components/HeroImage'
import { LeaderboardWithLocation } from '@/components/LeaderboardWithLocation'
import { NominationsSection } from './NominationsSection'
import { prisma } from '@/lib/prisma'

export const revalidate = 3600

export async function generateStaticParams() {
  const categories = await prisma.foodCategory.findMany({ where: { status: 'active' } })
  return categories.map(c => ({ slug: c.slug }))
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ year?: string; city?: string; state?: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const { year: yearParam, city, state } = await searchParams
  const category = await getCategoryBySlug(slug)
  if (!category) return {}
  const year = yearParam ?? new Date().getFullYear()
  if (city && state) {
    return {
      title: `Best ${category.name} in ${city}, ${state} — ${year} | FoodMedals`,
      description: `Community-voted best ${category.name} in ${city}, ${state}. See who holds Gold, Silver & Bronze for ${year}.`,
      alternates: { canonical: `https://foodmedals.com/categories/${slug}` },
    }
  }
  return {
    title: `Best ${category.name} — ${year} Rankings | FoodMedals`,
    description: `Community-voted ${category.name} rankings. See who holds Gold, Silver & Bronze for ${year}.`,
    alternates: { canonical: `https://foodmedals.com/categories/${slug}` },
  }
}

export default async function CategoryLeaderboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ year?: string; city?: string; state?: string }>
}) {
  const { slug } = await params
  const { year: yearParam, city, state } = await searchParams

  const category = await getCategoryBySlug(slug)
  if (!category) notFound()

  const year        = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear()
  const currentYear = new Date().getFullYear()

  const session = await getServerSession(authOptions)
  const isAdmin = isAdminEmail(session?.user?.email)
  const isLoggedIn = !!session?.user

  // Always fetch statewide for SSR (Googlebot sees full list)
  const [initialRows, cities, pendingRestaurants] = await Promise.all([
    getLeaderboard(category.id, year),
    getCitiesForCategory(category.id),
    prisma.restaurant.findMany({
      where: {
        status: 'pending_review',
        categories: { some: { foodCategoryId: category.id } },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        submitter: { select: { displayName: true } },
        _count: { select: { suggestionVotes: true } },
      },
    }),
  ])

  // Check which nominations the current user has voted on
  let votedIds: Set<string> = new Set()
  if (session?.user?.id && pendingRestaurants.length > 0) {
    const votes = await prisma.suggestionVote.findMany({
      where: { userId: session.user.id, restaurantId: { in: pendingRestaurants.map(r => r.id) } },
      select: { restaurantId: true },
    })
    votedIds = new Set(votes.map(v => v.restaurantId))
  }

  const nominations = pendingRestaurants.map(r => ({
    id:          r.id,
    name:        r.name,
    city:        r.city,
    state:       r.state,
    description: r.description,
    submitter:   r.submitter?.displayName ?? 'Anonymous',
    createdAt:   r.createdAt.toISOString(),
    voteCount:   r._count.suggestionVotes,
    voted:       votedIds.has(r.id),
  }))

  // Year tab hrefs
  function yearHref(y: number) {
    const p = new URLSearchParams()
    if (y !== currentYear) p.set('year', String(y))
    if (city)  p.set('city',  city)
    if (state) p.set('state', state)
    const qs = p.toString()
    return `/categories/${slug}${qs ? `?${qs}` : ''}`
  }

  // Award medals href
  const awardHref = city && state
    ? `/categories/${slug}/award?city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}`
    : `/categories/${slug}/award`

  // JSON-LD breadcrumb
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Categories', item: 'https://foodmedals.com/categories' },
      { '@type': 'ListItem', position: 2, name: category.name, item: `https://foodmedals.com/categories/${slug}` },
    ],
  }

  return (
    <main className="min-h-screen bg-amber-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-amber-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <nav className="flex items-center gap-1.5 text-sm text-gray-500">
            <Link href="/" className="hover:text-yellow-700 transition-colors">FoodMedals</Link>
            <span>/</span>
            <Link href="/categories" className="hover:text-yellow-700 transition-colors">Categories</Link>
            <span>/</span>
            <span className="text-gray-800 font-medium truncate max-w-[120px]">{category.name}</span>
          </nav>
          <Link
            href={awardHref}
            className="text-xs sm:text-sm font-semibold bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-3 py-1.5 rounded-full transition-colors whitespace-nowrap"
          >
            Award medals
          </Link>
        </div>
      </div>

      <HeroImage />

      {/* ── Hero header ─────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-amber-100">
        <div className="max-w-3xl mx-auto px-4 py-8 text-center">
          <div className="text-6xl mb-3">{category.iconEmoji}</div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Best {category.name}
          </h1>
          {category.description && (
            <p className="text-gray-500 mt-2 text-sm sm:text-base max-w-md mx-auto">
              {category.description}
            </p>
          )}

          {/* Year selector */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {[currentYear - 1, currentYear].map(y => (
              <Link
                key={y}
                href={yearHref(y)}
                className={`text-sm px-4 py-1.5 rounded-full border transition-colors ${
                  y === year
                    ? 'bg-yellow-400 border-yellow-400 text-gray-900 font-semibold'
                    : 'border-gray-200 text-gray-500 hover:border-yellow-300 hover:text-gray-800'
                }`}
              >
                {y}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Leaderboard with Near Me + City filter ──────────────────────── */}
      <LeaderboardWithLocation
        categorySlug={slug}
        categoryId={category.id}
        year={year}
        initialRows={initialRows}
        cities={cities}
        initialCity={city ?? null}
        initialState={state ?? null}
      />

      {/* ── Community Nominations ────────────────────────────────────── */}
      <NominationsSection
        nominations={nominations}
        isAdmin={isAdmin}
        isLoggedIn={isLoggedIn}
        categorySlug={slug}
      />

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-b from-amber-50 to-white border-t border-amber-100">
        <div className="max-w-3xl mx-auto px-4 py-12 text-center">
          <div className="mb-3 flex justify-center">
            <Image src="/medals/gold.png" alt="medal" width={48} height={48} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Have a favorite {category.name}?
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            Award your Gold, Silver &amp; Bronze medals for {year}. You can change them any time.
          </p>
          <Link
            href={awardHref}
            className="inline-block bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold px-8 py-3 rounded-full transition-colors shadow-sm"
          >
            Cast your votes
          </Link>
        </div>
      </div>
    </main>
  )
}
