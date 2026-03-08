import type { Metadata } from 'next'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAllActiveCategories, getTopRestaurantsPerCategory, getHomepageStats } from '@/lib/queries'
import { Navbar } from '@/components/Navbar'
import { CategoryIcon } from '@/components/CategoryIcon'
import { HeroSearch } from '@/components/HeroSearch'
import { HeroVideo } from '@/components/HeroVideo'
import { RotatingCategoryText } from '@/components/RotatingCategoryText'
import { Footer } from '@/components/Footer'

// Lazy-load below-fold client components to reduce initial JS bundle
const StatsBar = dynamic(() => import('@/components/StatsBar').then(m => ({ default: m.StatsBar })))
const TrendingCarousel = dynamic(() => import('@/components/TrendingCarousel').then(m => ({ default: m.TrendingCarousel })))
const HowItWorks = dynamic(() => import('@/components/HowItWorks').then(m => ({ default: m.HowItWorks })))

export const metadata: Metadata = {
  title: 'FoodMedals — Find the Best Food Near You',
  description:
    'Discover top-rated restaurants and rank your favorites. Award Gold, Silver & Bronze medals for burgers, tacos, pizza & more in your city.',
  alternates: { canonical: 'https://foodmedals.com' },
  openGraph: {
    title: 'FoodMedals — Find the Best Food Near You',
    description: 'Discover top-rated restaurants and rank your favorites. Award Gold, Silver & Bronze medals for burgers, tacos, pizza & more in your city.',
    type: 'website',
    url: 'https://foodmedals.com',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FoodMedals — Find the Best Food Near You',
    description: 'Discover top-rated restaurants and rank your favorites. Award Gold, Silver & Bronze medals for burgers, tacos, pizza & more in your city.',
  },
}

export default async function HomePage() {
  const currentYear = new Date().getFullYear()
  const [categories, session, trending, stats] = await Promise.all([
    getAllActiveCategories(),
    getServerSession(authOptions),
    getTopRestaurantsPerCategory(currentYear),
    getHomepageStats(),
  ])
  const isLoggedIn = !!session?.user

  // Rotating hero categories — uses all active categories in their DB sort order
  const heroCategories = categories.map(c => ({ name: c.name, slug: c.slug }))

  return (
    <div className="min-h-screen bg-amber-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'FoodMedals',
          url: 'https://foodmedals.com',
          logo: 'https://foodmedals.com/android-chrome-512x512.png',
          description: 'Community-powered restaurant rankings. Award Gold, Silver & Bronze medals to the best food in Utah.',
        }) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'FoodMedals',
          url: 'https://foodmedals.com',
          potentialAction: {
            '@type': 'SearchAction',
            target: { '@type': 'EntryPoint', urlTemplate: 'https://foodmedals.com/search?q={search_term_string}' },
            'query-input': 'required name=search_term_string',
          },
        }) }}
      />
      <Navbar />

      {/* ── Hero with background video ────────────────────────────────────── */}
      <section className="relative border-b border-amber-100 z-10">
        <HeroVideo />

        <div className="relative max-w-4xl mx-auto px-4 py-24 sm:py-32 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight mb-4 drop-shadow-lg">
            <span className="block">Find the best</span>
            <RotatingCategoryText categories={heroCategories} />
            <span className="block">near you</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-200 max-w-xl mx-auto mb-8">
            Community-powered rankings. Pick your Gold, Silver &amp; Bronze for each food category — new year, new picks.
          </p>
          <HeroSearch />
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-4">
            <Link
              href="/categories"
              className="text-sm font-semibold text-white/80 hover:text-white transition-colors underline underline-offset-2"
            >
              Browse all categories
            </Link>
            {!isLoggedIn && (
              <Link
                href="/auth/signup"
                className="px-6 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold rounded-full text-sm transition-colors shadow-sm"
              >
                Sign up — it&apos;s free
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ── Social proof stats ─────────────────────────────────────────────── */}
      <StatsBar stats={stats} />

      {/* ── Trending carousel ─────────────────────────────────────────────── */}
      {trending.length > 0 && <TrendingCarousel categories={trending} year={currentYear} />}

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <HowItWorks />

      {/* ── Category grid ────────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Food Categories</h2>
          <Link href="/categories" className="text-sm text-yellow-700 hover:underline font-medium">
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {categories.map(cat => (
            <Link
              key={cat.id}
              href={`/categories/${cat.slug}`}
              className="group bg-white rounded-2xl p-3 sm:p-4 shadow-sm hover:shadow-lg hover:-translate-y-1 border border-amber-100 hover:border-yellow-300 transition-all duration-200 flex flex-col items-center text-center"
            >
              <span className="text-3xl sm:text-4xl mb-2 group-hover:scale-110 transition-transform duration-200 inline-block">
                <CategoryIcon slug={cat.slug} iconEmoji={cat.iconEmoji} iconUrl={cat.iconUrl} />
              </span>
              <span className="text-xs font-semibold text-gray-700 leading-tight">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── CTA banner ───────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-r from-yellow-400 to-amber-400 mx-4 mb-12 rounded-3xl overflow-hidden relative">
        <div className="max-w-2xl mx-auto px-6 py-10 sm:py-14 text-center relative z-10">
          <div className="text-4xl mb-4">🏆</div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-3">
            Every vote shapes the leaderboard
          </h2>
          <p className="text-gray-800 mb-6 text-sm sm:text-base">
            Join the community ranking the best restaurants in your city. One Gold, one Silver, one Bronze per category — make yours count.
          </p>
          <Link
            href={isLoggedIn ? '/categories' : '/auth/signup'}
            className="inline-block bg-gray-900 hover:bg-gray-800 text-white font-bold px-8 py-3 rounded-full transition-colors shadow-md"
          >
            Start awarding medals
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
