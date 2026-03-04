import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAllActiveCategories, getTopRestaurantsPerCategory } from '@/lib/queries'
import { Navbar } from '@/components/Navbar'
import { TrendingCarousel } from '@/components/TrendingCarousel'
import { CategoryIcon } from '@/components/CategoryIcon'

export const metadata: Metadata = {
  title: 'FoodMedals — Community Food Rankings for Utah Restaurants',
  description:
    'Vote for the best burgers, tacos, fries, and more. Award Gold, Silver & Bronze medals to your favorite Utah restaurants.',
  alternates: { canonical: 'https://foodmedals.com' },
  openGraph: {
    title: 'FoodMedals — Community Food Rankings for Utah Restaurants',
    description: 'Vote for the best burgers, tacos, fries, and more. Award Gold, Silver & Bronze medals to your favorite Utah restaurants.',
    type: 'website',
    url: 'https://foodmedals.com',
  },
}

export default async function HomePage() {
  const currentYear = new Date().getFullYear()
  const [categories, session, trending] = await Promise.all([
    getAllActiveCategories(),
    getServerSession(authOptions),
    getTopRestaurantsPerCategory(currentYear),
  ])
  const isLoggedIn = !!session?.user

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
      <Navbar />

      {/* ── Hero with background image ────────────────────────────────────── */}
      <section className="relative border-b border-amber-100 overflow-hidden">
        {/* Background image */}
        <Image
          src="/images/hero.png"
          alt="A spread of delicious food dishes"
          fill
          className="object-cover"
          priority
        />
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-black/50" />

        <div className="relative max-w-4xl mx-auto px-4 py-20 sm:py-28 text-center">
          <div className="flex justify-center gap-3 mb-6">
            <span className="animate-bounce inline-block" style={{ animationDelay: '0ms' }}>
              <Image src="/medals/gold.png" alt="gold medal" width={64} height={64} />
            </span>
            <span className="animate-bounce inline-block" style={{ animationDelay: '120ms' }}>
              <Image src="/medals/silver.png" alt="silver medal" width={64} height={64} />
            </span>
            <span className="animate-bounce inline-block" style={{ animationDelay: '240ms' }}>
              <Image src="/medals/bronze.png" alt="bronze medal" width={64} height={64} />
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-4 drop-shadow-lg">
            Award Medals to<br className="hidden sm:inline" /> the Best Food Near You
          </h1>
          <p className="text-lg sm:text-xl text-gray-200 max-w-xl mx-auto mb-8">
            Community-powered rankings. Pick your Gold, Silver &amp; Bronze for each food category — new year, new picks.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/categories"
              className="w-full sm:w-auto px-8 py-3.5 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold rounded-full text-base transition-colors shadow-sm"
            >
              Browse Categories
            </Link>
            {!isLoggedIn && (
              <Link
                href="/auth/signup"
                className="w-full sm:w-auto px-8 py-3.5 bg-white/90 hover:bg-white text-gray-700 font-semibold rounded-full text-base border border-gray-200 hover:border-yellow-300 transition-colors"
              >
                Sign up — it&apos;s free
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ── Trending carousel ─────────────────────────────────────────────── */}
      {trending.length > 0 && <TrendingCarousel categories={trending} year={currentYear} />}

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-amber-100">
        <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
          <h2 className="text-center text-2xl font-bold text-gray-900 mb-10">How it works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            {[
              { icon: '🍔', step: '1', title: 'Browse Categories', href: '/categories', desc: 'Burgers, tacos, pizza, wings — dozens of food categories.' },
              { icon: <Image src="/medals/gold.png" alt="medal" width={36} height={36} />, step: '2', title: 'Award Your Medals', href: '/categories', desc: 'Give Gold, Silver & Bronze to the three restaurants you love most.' },
              { icon: '🏆', step: '3', title: 'See the Rankings', href: '/categories', desc: 'Community votes aggregate into leaderboards that reset every year.' },
            ].map(item => (
              <div key={item.step} className="text-center">
                <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-sm border border-amber-100">
                  {item.icon}
                </div>
                <div className="text-xs font-bold text-yellow-600 uppercase tracking-wider mb-1">Step {item.step}</div>
                <Link href={item.href} className="font-bold text-gray-900 mb-2 hover:text-yellow-700 transition-colors inline-block">
                  <h3>{item.title}</h3>
                </Link>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

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
              className="group bg-white rounded-2xl p-3 sm:p-4 shadow-sm hover:shadow-md border border-amber-100 hover:border-yellow-300 transition-all duration-200 flex flex-col items-center text-center"
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
      <section className="bg-gradient-to-r from-yellow-400 to-amber-400 mx-4 mb-12 rounded-3xl">
        <div className="max-w-2xl mx-auto px-6 py-10 sm:py-14 text-center">
          <div className="text-4xl mb-4">🏆</div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-3">
            Your opinion matters
          </h2>
          <p className="text-gray-800 mb-6 text-sm sm:text-base">
            Join the community ranking the best restaurants in your city. One Gold, one Silver, one Bronze per category — make yours count.
          </p>
          <Link
            href={isLoggedIn ? '/categories' : '/auth/signup'}
            className="inline-block bg-white hover:bg-amber-50 text-gray-900 font-bold px-8 py-3 rounded-full transition-colors shadow-sm"
          >
            Start awarding medals
          </Link>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-amber-100 bg-white">
        <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-400">
          <span className="flex items-center gap-1.5">
            <Image src="/medals/gold.png" alt="" width={16} height={16} />
            FoodMedals · Community Food Rankings
          </span>
          <div className="flex gap-4">
            <Link href="/categories"   className="hover:text-gray-600 transition-colors">Categories</Link>
            <Link href="/hall-of-fame" className="hover:text-gray-600 transition-colors">Hall of Fame</Link>
            {!isLoggedIn && <Link href="/auth/signup" className="hover:text-gray-600 transition-colors">Sign up</Link>}
          </div>
        </div>
      </footer>
    </div>
  )
}
