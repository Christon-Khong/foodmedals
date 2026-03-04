import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { getHallOfFame } from '@/lib/queries'
import { Navbar } from '@/components/Navbar'
import { HeroImage } from '@/components/HeroImage'
import { CategoryIcon } from '@/components/CategoryIcon'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Hall of Fame — FoodMedals',
  description: 'See every past Gold Medal winner per food category. The definitive archive of community food rankings.',
  alternates: { canonical: 'https://foodmedals.com/hall-of-fame' },
}

export default async function HallOfFamePage() {
  const currentYear = new Date().getFullYear()
  const rows        = await getHallOfFame(currentYear)

  // Group by year
  const byYear = rows.reduce<Record<number, typeof rows>>((acc, r) => {
    if (!acc[r.year]) acc[r.year] = []
    acc[r.year].push(r)
    return acc
  }, {})

  const years = Object.keys(byYear)
    .map(Number)
    .sort((a, b) => b - a)

  return (
    <div className="min-h-screen bg-amber-50">
      <Navbar />
      <HeroImage />

      {/* Header */}
      <div className="bg-white border-b border-amber-100">
        <div className="max-w-4xl mx-auto px-4 py-10 text-center">
          <div className="text-5xl mb-3">🏛️</div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Hall of Fame</h1>
          <p className="text-gray-500 mt-2 text-sm sm:text-base max-w-md mx-auto">
            The Gold Medal winners for each food category, year by year.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        {years.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-amber-100">
            <div className="text-5xl mb-4">🏆</div>
            <h2 className="text-xl font-bold text-gray-600 mb-2">No past winners yet</h2>
            <p className="text-gray-400 text-sm">Check back after {currentYear} ends.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {years.map(year => (
              <section key={year}>
                <div className="flex items-center gap-3 mb-5">
                  <h2 className="text-2xl font-extrabold text-gray-900">{year}</h2>
                  <div className="flex-1 h-px bg-amber-200" />
                  <span className="text-sm text-gray-400">{byYear[year].length} categories</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {byYear[year].map(row => (
                    <div
                      key={row.categoryId}
                      className="bg-white rounded-2xl border border-amber-100 overflow-hidden hover:border-yellow-300 hover:shadow-sm transition-all"
                    >
                      {/* Category band */}
                      <Link
                        href={`/categories/${row.categorySlug}?year=${year}`}
                        className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border-b border-amber-100 hover:bg-yellow-50 transition-colors"
                      >
                        <span className="text-lg"><CategoryIcon slug={row.categorySlug} iconEmoji={row.iconEmoji} /></span>
                        <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                          {row.categoryName}
                        </span>
                      </Link>

                      {/* Winner */}
                      <div className="px-4 py-3 flex items-center gap-3">
                        <Image src="/medals/gold.png" alt="gold medal" width={28} height={28} className="shrink-0" />
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/restaurants/${row.restaurantSlug}`}
                            className="block text-sm font-bold text-gray-800 hover:text-yellow-700 truncate transition-colors"
                          >
                            {row.restaurantName}
                          </Link>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {row.restaurantCity}, {row.restaurantState} · {row.goldCount} gold vote{row.goldCount !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
