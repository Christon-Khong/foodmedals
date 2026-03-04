import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { HeroImage } from '@/components/HeroImage'
import { NominationsWithFilters } from '@/components/NominationsWithFilters'
import { CategoryNominations } from '@/components/CategoryNominations'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Community Nominations — FoodMedals',
  description: 'Upvote restaurant and category suggestions you\'d like to see added.',
}

async function getPendingSuggestions(userId?: string) {
  const restaurants = await prisma.restaurant.findMany({
    where:   { status: 'pending_review' },
    orderBy: { createdAt: 'desc' },
    include: {
      submitter:  { select: { displayName: true } },
      categories: { include: { foodCategory: { select: { name: true, iconEmoji: true, iconUrl: true, slug: true } } } },
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
    lat:         r.lat,
    lng:         r.lng,
    description: r.description,
    websiteUrl:  r.websiteUrl,
    submitter:   r.submitter?.displayName ?? 'Anonymous',
    createdAt:   r.createdAt.toISOString(),
    categories:  r.categories.map(c => ({
      name:    c.foodCategory.name,
      emoji:   c.foodCategory.iconEmoji,
      iconUrl: c.foodCategory.iconUrl,
      slug:    c.foodCategory.slug,
    })),
    voteCount: r._count.suggestionVotes,
    voted:     votedIds.has(r.id),
  }))
}

async function getPendingCategorySuggestions(userId?: string) {
  const suggestions = await prisma.newCategorySuggestion.findMany({
    where:   { status: 'pending' },
    orderBy: { createdAt: 'desc' },
    include: {
      submitter: { select: { displayName: true } },
      _count:    { select: { votes: true } },
    },
  })

  let votedIds: Set<string> = new Set()
  if (userId) {
    const votes = await prisma.newCategorySuggestionVote.findMany({
      where:  { userId, suggestionId: { in: suggestions.map(s => s.id) } },
      select: { suggestionId: true },
    })
    votedIds = new Set(votes.map(v => v.suggestionId))
  }

  return suggestions.map(s => ({
    id:          s.id,
    name:        s.name,
    iconEmoji:   s.iconEmoji,
    description: s.description,
    submitter:   s.submitter?.displayName ?? 'Anonymous',
    createdAt:   s.createdAt.toISOString(),
    voteCount:   s._count.votes,
    voted:       votedIds.has(s.id),
  }))
}

export default async function CommunityNominationsPage() {
  const session = await getServerSession(authOptions)
  const [suggestions, categorySuggestions] = await Promise.all([
    getPendingSuggestions(session?.user?.id),
    getPendingCategorySuggestions(session?.user?.id),
  ])

  return (
    <div className="min-h-screen bg-amber-50">
      <Navbar />
      <HeroImage />

      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Community Nominations</h1>
          <p className="text-sm text-gray-500 mt-1">
            Upvote restaurants and categories you&apos;d like to see added.
          </p>
        </div>

        {/* Category Suggestions */}
        {categorySuggestions.length > 0 && (
          <CategoryNominations
            suggestions={categorySuggestions}
            isLoggedIn={!!session}
          />
        )}

        {/* Restaurant Suggestions */}
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          Restaurant Nominations
        </h2>
        <NominationsWithFilters
          suggestions={suggestions}
          isLoggedIn={!!session}
        />

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/suggest/restaurant"
            className="inline-block px-5 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold rounded-full text-sm transition-colors"
          >
            Suggest a restaurant
          </Link>
          <Link
            href="/suggest/category"
            className="inline-block px-5 py-2.5 border border-yellow-400 hover:bg-yellow-50 text-gray-900 font-semibold rounded-full text-sm transition-colors"
          >
            Suggest a category
          </Link>
        </div>
      </div>
    </div>
  )
}
