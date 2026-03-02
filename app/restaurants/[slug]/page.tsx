import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getRestaurantBySlug, getRestaurantTrophies } from '@/lib/queries'
import { Navbar } from '@/components/Navbar'
import { prisma } from '@/lib/prisma'

export const revalidate = 3600

export async function generateStaticParams() {
  const restaurants = await prisma.restaurant.findMany({ where: { status: 'active' } })
  return restaurants.map(r => ({ slug: r.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const r = await getRestaurantBySlug(slug)
  if (!r) return {}
  return {
    title: `${r.name} — Medals & Rankings | FoodMedals`,
    description: `See all medals ${r.name} in ${r.city}, UT has earned across food categories on FoodMedals.`,
    alternates: { canonical: `https://foodmedals.com/restaurants/${slug}` },
  }
}

const MEDAL_EMOJI: Record<string, string> = { gold: '🥇', silver: '🥈', bronze: '🥉' }

export default async function RestaurantPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug }     = await params
  const restaurant   = await getRestaurantBySlug(slug)
  if (!restaurant) notFound()

  const trophies = await getRestaurantTrophies(restaurant.id)
  const year     = new Date().getFullYear()

  const thisYearTrophies = trophies.filter(t => t.year === year)
  const pastTrophies     = trophies.filter(t => t.year < year)

  // JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type':    'Restaurant',
    name:       restaurant.name,
    address: {
      '@type':         'PostalAddress',
      streetAddress:   restaurant.address,
      addressLocality: restaurant.city,
      addressRegion:   'UT',
      postalCode:      restaurant.zip,
      addressCountry:  'US',
    },
    url: restaurant.websiteUrl ?? undefined,
  }

  return (
    <div className="min-h-screen bg-amber-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-amber-100">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <Link href="/categories" className="text-sm text-yellow-700 hover:underline mb-4 inline-block">
            ← Categories
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{restaurant.name}</h1>
          <p className="text-gray-500 mt-1">
            {restaurant.address}, {restaurant.city}, UT {restaurant.zip}
          </p>
          {restaurant.description && (
            <p className="text-sm text-gray-600 mt-3 max-w-xl">{restaurant.description}</p>
          )}
          {restaurant.websiteUrl && (
            <a
              href={restaurant.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-yellow-700 hover:underline mt-2 inline-block"
            >
              Visit website →
            </a>
          )}

          {/* Category chips */}
          {restaurant.categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {restaurant.categories.map(rc => (
                <Link
                  key={rc.id}
                  href={`/categories/${rc.foodCategory.slug}`}
                  className="flex items-center gap-1 text-xs bg-amber-50 border border-amber-200 rounded-full px-3 py-1 text-gray-700 hover:border-yellow-400 transition-colors"
                >
                  <span>{rc.foodCategory.iconEmoji}</span>
                  <span>{rc.foodCategory.name}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-10">
        {/* ── Trophy Case ─────────────────────────────────────────────── */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>🏆</span> Trophy Case — {year}
          </h2>
          {thisYearTrophies.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-amber-200 p-8 text-center text-gray-400">
              <p className="text-sm">No trophies yet this year.</p>
              <p className="text-xs mt-1">Be the first to award {restaurant.name} a medal!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {thisYearTrophies.map(t => (
                <Link
                  key={t.categoryId}
                  href={`/categories/${t.categorySlug}`}
                  className="bg-white rounded-2xl border border-amber-100 hover:border-yellow-300 p-4 flex items-center gap-4 transition-all hover:shadow-sm"
                >
                  <div className="text-3xl">{t.iconEmoji}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm truncate">{t.categoryName}</p>
                    <div className="flex gap-2 mt-1">
                      {t.goldCount   > 0 && <span className="text-xs">🥇 {t.goldCount}</span>}
                      {t.silverCount > 0 && <span className="text-xs">🥈 {t.silverCount}</span>}
                      {t.bronzeCount > 0 && <span className="text-xs">🥉 {t.bronzeCount}</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-gray-700">{t.totalScore}</span>
                    <p className="text-xs text-gray-400">pts</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* ── Past Awards ─────────────────────────────────────────────── */}
        {pastTrophies.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span>📜</span> Past Awards
            </h2>
            <div className="bg-white rounded-2xl border border-amber-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-amber-50 border-b border-amber-100">
                    <th className="text-left px-4 py-3 text-gray-500 font-semibold">Year</th>
                    <th className="text-left px-4 py-3 text-gray-500 font-semibold">Category</th>
                    <th className="text-center px-2 py-3 text-gray-500 font-semibold">🥇</th>
                    <th className="text-center px-2 py-3 text-gray-500 font-semibold">🥈</th>
                    <th className="text-center px-2 py-3 text-gray-500 font-semibold">🥉</th>
                    <th className="text-right px-4 py-3 text-gray-500 font-semibold">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-50">
                  {pastTrophies.map(t => (
                    <tr key={`${t.categoryId}-${t.year}`} className="hover:bg-amber-50 transition-colors">
                      <td className="px-4 py-2.5 font-medium text-gray-600">{t.year}</td>
                      <td className="px-4 py-2.5">
                        <Link href={`/categories/${t.categorySlug}`} className="flex items-center gap-1.5 hover:text-yellow-700 transition-colors text-gray-700">
                          <span>{t.iconEmoji}</span>
                          <span>{t.categoryName}</span>
                        </Link>
                      </td>
                      <td className="px-2 py-2.5 text-center text-gray-600">{t.goldCount   || '—'}</td>
                      <td className="px-2 py-2.5 text-center text-gray-600">{t.silverCount || '—'}</td>
                      <td className="px-2 py-2.5 text-center text-gray-600">{t.bronzeCount || '—'}</td>
                      <td className="px-4 py-2.5 text-right font-bold text-gray-800">{t.totalScore}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
