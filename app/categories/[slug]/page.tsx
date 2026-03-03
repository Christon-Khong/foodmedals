import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getCategoryBySlug, getLeaderboard, getCitiesForCategory } from '@/lib/queries'
import { Podium } from '@/components/Podium'
import { HeroImage } from '@/components/HeroImage'
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

  // Get available cities for city picker
  const cities = await getCitiesForCategory(category.id)

  // Auto-redirect if there's exactly one city
  if (!city && cities.length === 1) {
    const only = cities[0]
    redirect(`/categories/${slug}?city=${encodeURIComponent(only.city)}&state=${encodeURIComponent(only.state)}${yearParam ? `&year=${yearParam}` : ''}`)
  }

  const showCityPicker = !city || !state

  // Only fetch leaderboard when city is selected
  const rows = showCityPicker ? [] : await getLeaderboard(category.id, year, city, state)

  // Only medalled restaurants appear on the podium; all restaurants show in the table
  const medalled = rows.filter(r => r.totalScore > 0)
  const top3 = medalled.slice(0, 3)
  const rest = rows.slice(3)

  // Build year-tab hrefs preserving city selection
  function yearHref(y: number) {
    const params = new URLSearchParams()
    if (y !== currentYear) params.set('year', String(y))
    if (city)  params.set('city',  city)
    if (state) params.set('state', state)
    const qs = params.toString()
    return `/categories/${slug}${qs ? `?${qs}` : ''}`
  }

  // "Change city" href — removes city/state, keeps year if not current
  function changeCityHref() {
    if (yearParam && parseInt(yearParam, 10) !== currentYear) {
      return `/categories/${slug}?year=${yearParam}`
    }
    return `/categories/${slug}`
  }

  // Award medals href
  const awardHref = city && state
    ? `/categories/${slug}/award?city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}`
    : `/categories/${slug}`

  // ── JSON-LD breadcrumb ────────────────────────────────────────────────────
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
          {!showCityPicker && (
            <Link
              href={awardHref}
              className="text-xs sm:text-sm font-semibold bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-3 py-1.5 rounded-full transition-colors whitespace-nowrap"
            >
              Award medals
            </Link>
          )}
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

          {/* City indicator (only when city is selected) */}
          {!showCityPicker && city && state && (
            <div className="flex items-center justify-center gap-2 mt-3">
              <span className="text-sm text-gray-600">📍 {city}, {state}</span>
              <Link
                href={changeCityHref()}
                className="text-xs text-yellow-700 hover:underline font-medium"
              >
                Change city
              </Link>
            </div>
          )}

          {/* Year selector (only when city is selected) */}
          {!showCityPicker && (
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
          )}
        </div>
      </div>

      {/* ── City picker ─────────────────────────────────────────────────── */}
      {showCityPicker && (
        <div className="max-w-3xl mx-auto px-4 py-10">
          <h2 className="text-center text-lg font-bold text-gray-700 mb-6">
            Choose your city
          </h2>
          {cities.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-lg font-medium">No restaurants yet.</p>
              <Link href="/suggest/restaurant" className="text-sm text-yellow-600 hover:underline mt-2 inline-block">
                Suggest one →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {cities.map(c => (
                <Link
                  key={`${c.city}-${c.state}`}
                  href={`/categories/${slug}?city=${encodeURIComponent(c.city)}&state=${encodeURIComponent(c.state)}${yearParam ? `&year=${yearParam}` : ''}`}
                  className="bg-white rounded-2xl border border-amber-100 hover:border-yellow-300 hover:shadow-md p-5 text-center transition-all"
                >
                  <p className="font-bold text-gray-800">{c.city}, {c.state}</p>
                  <p className="text-xs text-gray-400 mt-1">{c.count} place{c.count !== 1 ? 's' : ''}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Podium section ──────────────────────────────────────────────── */}
      {!showCityPicker && (
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-center text-lg font-bold text-gray-700 pt-8 pb-2 tracking-wide uppercase text-xs">
            🏆 {year} Community Favorites
          </h2>
          <Podium rows={top3} />
        </div>
      )}

      {/* ── Full standings ───────────────────────────────────────────────── */}
      {!showCityPicker && rows.length > 0 && (
        <div className="max-w-3xl mx-auto px-4 pb-16">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 pt-4 border-t border-amber-200">
            Full Standings — {year}
          </h2>
          <div className="bg-white rounded-2xl shadow-sm border border-amber-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-amber-50 border-b border-amber-100">
                  <th className="text-left px-4 py-3 text-gray-500 font-semibold w-10">#</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-semibold">Restaurant</th>
                  <th className="text-center px-2 py-3 text-gray-500 font-semibold">
                    <Image src="/medals/gold.png" alt="Gold" width={16} height={16} className="mx-auto" />
                  </th>
                  <th className="text-center px-2 py-3 text-gray-500 font-semibold">
                    <Image src="/medals/silver.png" alt="Silver" width={16} height={16} className="mx-auto" />
                  </th>
                  <th className="text-center px-2 py-3 text-gray-500 font-semibold">
                    <Image src="/medals/bronze.png" alt="Bronze" width={16} height={16} className="mx-auto" />
                  </th>
                  <th className="text-right px-4 py-3 text-gray-500 font-semibold">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-50">
                {rows.map((row, i) => (
                  <tr
                    key={row.restaurantId}
                    className={`hover:bg-amber-50 transition-colors ${i < 3 ? 'font-medium' : ''}`}
                  >
                    <td className="px-4 py-3 text-gray-400">
                      {i === 0 ? (
                        <Image src="/medals/gold.png" alt="1st" width={16} height={16} />
                      ) : i === 1 ? (
                        <Image src="/medals/silver.png" alt="2nd" width={16} height={16} />
                      ) : i === 2 ? (
                        <Image src="/medals/bronze.png" alt="3rd" width={16} height={16} />
                      ) : (
                        i + 1
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/restaurants/${row.restaurantSlug}`}
                        className="text-gray-800 hover:text-yellow-700 transition-colors font-medium"
                      >
                        {row.restaurantName}
                      </Link>
                    </td>
                    <td className="px-2 py-3 text-center text-gray-600">{row.goldCount   || '—'}</td>
                    <td className="px-2 py-3 text-center text-gray-600">{row.silverCount || '—'}</td>
                    <td className="px-2 py-3 text-center text-gray-600">{row.bronzeCount || '—'}</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-800">{row.totalScore}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      {!showCityPicker && (
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
      )}
    </main>
  )
}
