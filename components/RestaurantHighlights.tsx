'use client'

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { CategoryIcon } from '@/components/CategoryIcon'
import { Sparkles, Loader2, Quote, Award } from 'lucide-react'

type Highlight = {
  id:           string
  comment:      string
  createdAt:    string
  year:         number
  categoryName: string
  categorySlug: string
  iconEmoji:    string
  iconUrl:      string | null
  userName:     string
  userSlug:     string | null
  userAvatar:   string | null
  upvoteCount:  number
  userCategoryCount: number
}

type Props = {
  highlights: Highlight[]
  totalCount: number
  restaurantId: string
  isLoggedIn: boolean
  userUpvotedIds: string[]
}

type SortMode = 'popular' | 'newest'

// ─── Tier logic (shared with profile page) ─────────────────────────────────

const TIERS = [
  { min: 80, label: 'Oracle' },
  { min: 60, label: 'Vanguard' },
  { min: 45, label: 'The Palate' },
  { min: 30, label: 'Grand Curator' },
  { min: 20, label: 'Master Critic' },
  { min: 12, label: 'Local Legend' },
  { min:  7, label: 'Silver Spoon' },
  { min:  4, label: 'Flavor Chaser' },
  { min:  2, label: 'Food Scout' },
  { min:  1, label: 'Taste Tester' },
]

function getTierLabel(categoryCount: number): string | null {
  for (const tier of TIERS) {
    if (categoryCount >= tier.min) return tier.label
  }
  return null
}

// ─── Sub-components ────────────────────────────────────────────────────────

function UserAvatar({ name, avatarUrl, size }: { name: string; avatarUrl: string | null; size: number }) {
  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt={name}
        width={size}
        height={size}
        className="rounded-full"
      />
    )
  }
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div
      className="rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-white font-bold"
      style={{ width: size, height: size, fontSize: size * 0.35 }}
    >
      {initials}
    </div>
  )
}

function HighFiveButton({
  commentId,
  initialUpvoted,
  initialCount,
  isLoggedIn,
}: {
  commentId: string
  initialUpvoted: boolean
  initialCount: number
  isLoggedIn: boolean
}) {
  const [upvoted, setUpvoted] = useState(initialUpvoted)
  const [count, setCount] = useState(initialCount)
  const [toggling, setToggling] = useState(false)

  const handleClick = async () => {
    if (!isLoggedIn || toggling) return
    setToggling(true)

    const wasUpvoted = upvoted
    setUpvoted(!wasUpvoted)
    setCount(prev => wasUpvoted ? prev - 1 : prev + 1)

    try {
      const res = await fetch(`/api/comments/${commentId}/upvote`, { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setUpvoted(data.upvoted)
        setCount(data.count)
      } else {
        setUpvoted(wasUpvoted)
        setCount(prev => wasUpvoted ? prev + 1 : prev - 1)
      }
    } catch {
      setUpvoted(wasUpvoted)
      setCount(prev => wasUpvoted ? prev + 1 : prev - 1)
    } finally {
      setToggling(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={!isLoggedIn}
      title={isLoggedIn ? (upvoted ? 'Remove high five' : 'High five — you agree!') : 'Sign in to high five'}
      className={`inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-full border-2 transition-all duration-200 ${
        upvoted
          ? 'bg-yellow-100 border-yellow-400 text-yellow-800 scale-105 shadow-sm'
          : 'bg-white border-gray-200 text-gray-500 hover:border-yellow-400 hover:text-yellow-700 hover:bg-yellow-50'
      } ${!isLoggedIn ? 'opacity-60 cursor-default' : 'cursor-pointer active:scale-95'}`}
    >
      <span className="text-base leading-none">{upvoted ? '🙌' : '🖐️'}</span>
      {count > 0 ? count : 'High Five'}
    </button>
  )
}

function HighlightCard({
  highlight,
  isLoggedIn,
  upvoted,
}: {
  highlight: Highlight
  isLoggedIn: boolean
  upvoted: boolean
}) {
  const tierLabel = getTierLabel(highlight.userCategoryCount)

  return (
    <div className="bg-white rounded-2xl border border-amber-100 overflow-hidden hover:shadow-md transition-shadow">
      {/* Quote body — the hero */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-start gap-1 mb-1">
          <Quote className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5 rotate-180" />
        </div>
        <p className="font-[family-name:var(--font-lora)] italic text-gray-800 text-lg sm:text-xl leading-relaxed">
          {highlight.comment}
        </p>
        <div className="flex justify-end mt-1">
          <Quote className="w-5 h-5 text-yellow-400 flex-shrink-0" />
        </div>
      </div>

      {/* Attribution bar */}
      <div className="flex items-center justify-between gap-3 px-6 py-3.5 bg-gradient-to-r from-amber-50/80 to-yellow-50/60 border-t border-amber-100">
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {highlight.userSlug ? (
              <Link href={`/critics/${highlight.userSlug}`}>
                <UserAvatar name={highlight.userName} avatarUrl={highlight.userAvatar} size={40} />
              </Link>
            ) : (
              <UserAvatar name={highlight.userName} avatarUrl={highlight.userAvatar} size={40} />
            )}
          </div>

          {/* Name + badges */}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              {highlight.userSlug ? (
                <Link
                  href={`/critics/${highlight.userSlug}`}
                  className="text-sm font-bold text-gray-900 hover:text-yellow-700 transition-colors truncate"
                >
                  {highlight.userName}
                </Link>
              ) : (
                <span className="text-sm font-bold text-gray-900 truncate">{highlight.userName}</span>
              )}
              {tierLabel && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold bg-gradient-to-r from-yellow-100 to-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-yellow-200">
                  <Award className="w-2.5 h-2.5" />
                  {tierLabel}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <Link
                href={`/categories/${highlight.categorySlug}`}
                className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 hover:text-yellow-800 transition-colors"
              >
                <CategoryIcon slug={highlight.categorySlug} iconEmoji={highlight.iconEmoji} iconUrl={highlight.iconUrl} />
                {highlight.categoryName}
              </Link>
              <span className="text-[10px] text-gray-400">·</span>
              <span className="text-[10px] font-medium text-gray-400 flex items-center gap-0.5">
                <Image src="/medals/gold.png" alt="gold" width={10} height={10} />
                {highlight.year}
              </span>
            </div>
          </div>
        </div>

        {/* High Five */}
        <div className="flex-shrink-0">
          <HighFiveButton
            commentId={highlight.id}
            initialUpvoted={upvoted}
            initialCount={highlight.upvoteCount}
            isLoggedIn={isLoggedIn}
          />
        </div>
      </div>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────

export function RestaurantHighlights({ highlights: initialHighlights, totalCount, restaurantId, isLoggedIn, userUpvotedIds }: Props) {
  const [sort, setSort] = useState<SortMode>('popular')
  const [allHighlights, setAllHighlights] = useState<Highlight[]>(initialHighlights)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialHighlights.length < totalCount)

  const [currentSort, setCurrentSort] = useState<SortMode>('popular')

  const handleSortChange = useCallback(async (newSort: SortMode) => {
    if (newSort === currentSort) return
    setSort(newSort)
    setCurrentSort(newSort)
    setLoading(true)

    try {
      const res = await fetch(
        `/api/restaurants/${restaurantId}/highlights?limit=10&offset=0&sort=${newSort}`
      )
      if (res.ok) {
        const data = await res.json()
        setAllHighlights(data.highlights)
        setHasMore(data.hasMore)
      }
    } catch {
      // Keep current data on error
    } finally {
      setLoading(false)
    }
  }, [currentSort, restaurantId])

  const handleLoadMore = useCallback(async () => {
    if (loading) return
    setLoading(true)

    try {
      const res = await fetch(
        `/api/restaurants/${restaurantId}/highlights?limit=10&offset=${allHighlights.length}&sort=${currentSort}`
      )
      if (res.ok) {
        const data = await res.json()
        setAllHighlights(prev => [...prev, ...data.highlights])
        setHasMore(data.hasMore)
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false)
    }
  }, [loading, allHighlights.length, restaurantId, currentSort])

  const displayed = useMemo(() => {
    if (sort === 'newest' && currentSort === 'popular') {
      return [...allHighlights].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    }
    return allHighlights
  }, [allHighlights, sort, currentSort])

  if (totalCount === 0) return null

  const remaining = totalCount - allHighlights.length

  return (
    <section>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-yellow-500" />
          What people are saying
          {totalCount > 1 && (
            <span className="text-sm font-normal text-gray-400">({totalCount})</span>
          )}
        </h2>

        {totalCount > 1 && (
          <div className="flex bg-white rounded-full border border-gray-200 p-0.5">
            <button
              onClick={() => handleSortChange('popular')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                sort === 'popular' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Popular
            </button>
            <button
              onClick={() => handleSortChange('newest')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                sort === 'newest' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Newest
            </button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {displayed.map(h => (
          <HighlightCard
            key={h.id}
            highlight={h}
            isLoggedIn={isLoggedIn}
            upvoted={userUpvotedIds.includes(h.id)}
          />
        ))}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="mt-5 text-center">
          <button
            onClick={handleLoadMore}
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-yellow-700 bg-white border border-yellow-300 rounded-full hover:bg-yellow-50 hover:border-yellow-400 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </>
            ) : (
              `Show more (${remaining} remaining)`
            )}
          </button>
        </div>
      )}
    </section>
  )
}
