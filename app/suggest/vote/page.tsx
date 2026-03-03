import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { HeroImage } from '@/components/HeroImage'
import { VoteButton } from './VoteButton'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Community Picks — FoodMedals',
  description: 'Upvote restaurant suggestions to help them get approved.',
}

async function getPendingSuggestions(userId?: string) {
  const restaurants = await prisma.restaurant.findMany({
    where:   { status: 'pending_review' },
    orderBy: { createdAt: 'desc' },
    include: {
      submitter:  { select: { displayName: true } },
      categories: { include: { foodCategory: { select: { name: true, iconEmoji: true } } } },
      _count:     { select: { suggestionVotes: true } },
    },
  })

  let votedIds: Set<string> = new Set()
  if (userId) {
    const votes = await prisma.suggestionVote.findMany({
      where:  { userId, restaurantId: { in: restaurants.map(r => r.id) } },
      select: { restaurantId: true },
    })
    votedIds = new Set(votes.map(v => v.restaurantId))
  }

  return restaurants.map(r => ({
    id:          r.id,
    name:        r.name,
    city:        r.city,
    state:       r.state,
    description: r.description,
    websiteUrl:  r.websiteUrl,
    submitter:   r.submitter?.displayName ?? 'Anonymous',
    createdAt:   r.createdAt.toISOString(),
    categories:  r.categories.map(c => ({
      name:  c.foodCategory.name,
      emoji: c.foodCategory.iconEmoji,
    })),
    voteCount: r._count.suggestionVotes,
    voted:     votedIds.has(r.id),
  }))
}

export default async function CommunityPicksPage() {
  const session = await getServerSession(authOptions)
  const suggestions = await getPendingSuggestions(session?.user?.id)

  return (
    <div className="min-h-screen bg-amber-50">
      <Navbar />
      <HeroImage />

      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Community Picks</h1>
          <p className="text-sm text-gray-500 mt-1">
            Upvote restaurant suggestions you&apos;d like to see added.
          </p>
        </div>

        {suggestions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-12 text-center">
            <div className="text-5xl mb-4">🍽️</div>
            <p className="text-lg font-semibold text-gray-700">No pending suggestions</p>
            <p className="text-sm text-gray-500 mt-2">
              Know a great spot?{' '}
              <Link href="/suggest/restaurant" className="text-yellow-700 hover:underline font-medium">
                Suggest one!
              </Link>
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {suggestions.map(s => (
              <div
                key={s.id}
                className="bg-white border border-amber-100 rounded-2xl shadow-sm p-5 flex gap-4"
              >
                {/* Vote button */}
                <div className="shrink-0 pt-1">
                  {session ? (
                    <VoteButton
                      restaurantId={s.id}
                      initialVoted={s.voted}
                      initialCount={s.voteCount}
                    />
                  ) : (
                    <Link
                      href="/auth/signin?callbackUrl=/suggest/vote"
                      className="flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl text-sm font-semibold bg-gray-100 text-gray-400 hover:bg-gray-200 transition-colors"
                    >
                      <span className="text-lg">△</span>
                      <span>{s.voteCount}</span>
                    </Link>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900">{s.name}</h3>
                  <p className="text-sm text-gray-500">
                    {s.city}, {s.state}
                  </p>

                  {s.description && (
                    <p className="text-sm text-gray-600 mt-1.5 line-clamp-2">{s.description}</p>
                  )}

                  {s.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {s.categories.map(c => (
                        <span
                          key={c.name}
                          className="text-xs bg-amber-50 border border-amber-200 text-amber-800 px-2 py-0.5 rounded-full"
                        >
                          {c.emoji} {c.name}
                        </span>
                      ))}
                    </div>
                  )}

                  <p className="text-xs text-gray-400 mt-2">
                    Suggested by {s.submitter} · {new Date(s.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <Link
            href="/suggest/restaurant"
            className="inline-block px-5 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold rounded-full text-sm transition-colors"
          >
            Suggest a restaurant
          </Link>
        </div>
      </div>
    </div>
  )
}
