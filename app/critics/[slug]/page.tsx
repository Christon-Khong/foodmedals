import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserProfile } from '@/lib/queries'
import { Navbar } from '@/components/Navbar'
import { CategoryIcon } from '@/components/CategoryIcon'

const MEDAL_ORDER: Record<string, number> = { gold: 0, silver: 1, bronze: 2 }

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const profile = await getUserProfile(slug)
  if (!profile) return { title: 'Critic Not Found — FoodMedals' }
  return {
    title: `${profile.user.displayName} — Food Critic | FoodMedals`,
    description: `${profile.user.displayName}'s food rankings and medal picks on FoodMedals.`,
  }
}

function MedalImage({ type }: { type: string }) {
  const src =
    type === 'gold'   ? '/medals/gold.png'   :
    type === 'silver' ? '/medals/silver.png' :
                        '/medals/bronze.png'
  return <Image src={src} alt={type} width={28} height={28} />
}

function Initials({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  return (
    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
      {initials}
    </div>
  )
}

export default async function CriticProfilePage({ params }: Props) {
  const { slug } = await params
  const [profile, session] = await Promise.all([
    getUserProfile(slug),
    getServerSession(authOptions),
  ])
  if (!profile) notFound()

  const { user, medals, year } = profile
  const isOwner = session?.user?.id === user.id

  // Group medals by category
  const byCategory = medals.reduce<Record<string, typeof medals>>(
    (acc, m) => {
      const key = m.foodCategoryId
      if (!acc[key]) acc[key] = []
      acc[key].push(m)
      return acc
    },
    {},
  )

  const memberSince = user.createdAt.getFullYear()
  const categoriesVoted = Object.keys(byCategory).length

  return (
    <div className="min-h-screen bg-amber-50">
      <Navbar />

      {/* Profile header */}
      <div className="bg-white border-b border-amber-100">
        <div className="max-w-2xl mx-auto px-4 py-8 flex items-center gap-5">
          {user.avatarUrl ? (
            <Image
              src={user.avatarUrl}
              alt={user.displayName}
              width={80}
              height={80}
              className="rounded-full shadow-lg"
            />
          ) : (
            <Initials name={user.displayName} />
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{user.displayName}</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {user.city && user.state ? `${user.city}, ${user.state}` : 'Food Critic'}
              {' · '}Member since {memberSince}
            </p>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs font-semibold bg-yellow-100 text-yellow-800 px-2.5 py-1 rounded-full">
                {medals.length} medal{medals.length !== 1 ? 's' : ''} awarded
              </span>
              <span className="text-xs font-semibold bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full border border-amber-200">
                {categoriesVoted} categor{categoriesVoted !== 1 ? 'ies' : 'y'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Medal shelf */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4">{year} Medal Shelf</h2>

        {medals.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-amber-100">
            <div className="mb-4 flex justify-center">
              <Image src="/medals/gold.png" alt="medals" width={48} height={48} />
            </div>
            <h3 className="text-lg font-bold text-gray-600 mb-1">No medals yet</h3>
            <p className="text-gray-400 text-sm mb-6">
              {isOwner ? 'Browse a category and award your first Gold medal.' : "This critic hasn't awarded any medals yet."}
            </p>
            {isOwner && (
              <Link
                href="/categories"
                className="inline-block bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold px-6 py-2.5 rounded-full transition-colors"
              >
                Browse categories
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(byCategory).map(([, catMedals]) => {
              const cat = catMedals[0].foodCategory
              const sorted = [...catMedals].sort(
                (a, b) => (MEDAL_ORDER[a.medalType] ?? 9) - (MEDAL_ORDER[b.medalType] ?? 9),
              )

              return (
                <div key={cat.id} className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
                  {/* Shelf header — category name */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-amber-50">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">
                        <CategoryIcon slug={cat.slug} iconEmoji={cat.iconEmoji} iconUrl={cat.iconUrl} />
                      </span>
                      <Link
                        href={`/categories/${cat.slug}`}
                        className="font-bold text-gray-800 hover:text-yellow-700 transition-colors"
                      >
                        {cat.name}
                      </Link>
                    </div>
                    {isOwner && (
                      <Link
                        href={`/categories/${cat.slug}/award`}
                        className="text-xs font-semibold text-yellow-700 hover:underline"
                      >
                        Change picks
                      </Link>
                    )}
                  </div>

                  {/* Shelf — medals on a wood-textured strip */}
                  <div
                    className="px-4 py-3"
                    style={{
                      background: 'linear-gradient(to bottom, #f5ebe0 0%, #e8d5c0 40%, #c9a97a 42%, #b8935a 44%, #c9a97a 46%, #e8d5c0 48%, #f5ebe0 100%)',
                    }}
                  >
                    <div className="flex items-stretch gap-3">
                      {sorted.map(m => (
                        <div
                          key={m.id}
                          className="flex-1 bg-white/90 backdrop-blur rounded-xl px-3 py-2.5 text-center shadow-sm"
                        >
                          <div className="flex justify-center mb-1">
                            <MedalImage type={m.medalType} />
                          </div>
                          <Link
                            href={`/restaurants/${m.restaurant.slug}`}
                            className="text-xs font-semibold text-gray-700 hover:text-yellow-700 transition-colors line-clamp-2 leading-tight"
                          >
                            {m.restaurant.name}
                          </Link>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {m.restaurant.city}
                          </p>
                        </div>
                      ))}
                      {/* Empty slots to fill row if < 3 medals */}
                      {sorted.length < 3 && Array.from({ length: 3 - sorted.length }).map((_, i) => (
                        <div
                          key={`empty-${i}`}
                          className="flex-1 border-2 border-dashed border-amber-200/60 rounded-xl px-3 py-2.5 flex items-center justify-center"
                        >
                          <span className="text-xs text-amber-300">—</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {isOwner && medals.length > 0 && (
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
