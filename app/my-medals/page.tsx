import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAllUserMedals } from '@/lib/queries'
import { Navbar } from '@/components/Navbar'

export const metadata: Metadata = {
  title: 'My Medals — FoodMedals',
}

const MEDAL_ORDER: Record<string, number> = { gold: 0, silver: 1, bronze: 2 }
const MEDAL_EMOJI: Record<string, string>  = { gold: '🥇', silver: '🥈', bronze: '🥉' }

export default async function MyMedalsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/auth/signin?callbackUrl=/my-medals')

  const year   = new Date().getFullYear()
  const medals = await getAllUserMedals(session.user.id, year)

  // Group by category
  const byCategory = medals.reduce<Record<string, typeof medals>>(
    (acc, m) => {
      const key = m.foodCategoryId
      if (!acc[key]) acc[key] = []
      acc[key].push(m)
      return acc
    },
    {},
  )

  const categoriesVoted = Object.keys(byCategory).length

  return (
    <div className="min-h-screen bg-amber-50">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">My Medals</h1>
          <p className="text-sm text-gray-500 mt-1">
            {session.user.name} · {year} · {categoriesVoted} categor{categoriesVoted !== 1 ? 'ies' : 'y'} voted
          </p>
        </div>

        {medals.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-amber-100">
            <div className="text-5xl mb-4">🏅</div>
            <h2 className="text-xl font-bold text-gray-700 mb-2">No medals yet</h2>
            <p className="text-gray-400 text-sm mb-6">
              Browse a category and award your first Gold medal.
            </p>
            <Link
              href="/categories"
              className="inline-block bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold px-6 py-2.5 rounded-full transition-colors"
            >
              Browse categories
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(byCategory).map(([, catMedals]) => {
              const cat    = catMedals[0].foodCategory
              const sorted = [...catMedals].sort(
                (a, b) => (MEDAL_ORDER[a.medalType] ?? 9) - (MEDAL_ORDER[b.medalType] ?? 9),
              )
              return (
                <div key={cat.id} className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
                  {/* Category header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-amber-50">
                    <Link
                      href={`/categories/${cat.slug}`}
                      className="flex items-center gap-2 font-bold text-gray-800 hover:text-yellow-700 transition-colors"
                    >
                      <span className="text-xl">{cat.iconEmoji}</span>
                      <span>{cat.name}</span>
                    </Link>
                    <Link
                      href={`/categories/${cat.slug}/award`}
                      className="text-xs font-semibold text-yellow-700 hover:underline"
                    >
                      Change picks
                    </Link>
                  </div>

                  {/* Medal rows */}
                  <div className="divide-y divide-amber-50">
                    {sorted.map(m => (
                      <div key={m.id} className="flex items-center gap-3 px-4 py-2.5">
                        <span className="text-lg w-6 text-center">{MEDAL_EMOJI[m.medalType]}</span>
                        <Link
                          href={`/restaurants/${m.restaurant.slug}`}
                          className="text-sm font-medium text-gray-700 hover:text-yellow-700 transition-colors flex-1"
                        >
                          {m.restaurant.name}
                        </Link>
                        <span className="text-xs text-gray-400">{m.restaurant.city}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {medals.length > 0 && (
          <div className="mt-8 text-center">
            <Link
              href="/categories"
              className="text-sm text-yellow-700 hover:underline font-medium"
            >
              Vote in more categories →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
