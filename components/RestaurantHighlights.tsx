'use client'

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { CategoryIcon } from '@/components/CategoryIcon'
import { ThumbsUp, Sparkles, Loader2 } from 'lucide-react'

type Highlight = {
  id:           string
  comment:      string
  createdAt:    string // serialized from server
  year:         number
  categoryName: string
  categorySlug: string
  iconEmoji:    string
  iconUrl:      string | null
  userName:     string
  userSlug:     string | null
  userAvatar:   string | null
  upvoteCount:  number
}

type Props = {
  highlights: Highlight[]
  totalCount: number
  restaurantId: string
  isLoggedIn: boolean
  userUpvotedIds: string[]
}

type SortMode = 'popular' | 'newest'

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

function HighlightCard({
  highlight,
  isLoggedIn,
  upvoted: initialUpvoted,
}: {
  highlight: Highlight
  isLoggedIn: boolean
  upvoted: boolean
}) {
  const [upvoted, setUpvoted] = useState(initialUpvoted)
  const [count, setCount] = useState(highlight.upvoteCount)
  const [toggling, setToggling] = useState(false)

  const handleUpvote = async () => {
    if (!isLoggedIn || toggling) return
    setToggling(true)

    // Optimistic update
    const wasUpvoted = upvoted
    setUpvoted(!wasUpvoted)
    setCount(prev => wasUpvoted ? prev - 1 : prev + 1)

    try {
      const res = await fetch(`/api/comments/${highlight.id}/upvote`, {
        method: 'POST',
      })
      if (res.ok) {
        const data = await res.json()
        setUpvoted(data.upvoted)
        setCount(data.count)
      } else {
        // Revert
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
    <div className="bg-white rounded-2xl border border-amber-100 p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start gap-3">
        {/* User avatar */}
        <div className="flex-shrink-0 mt-0.5">
          {highlight.userSlug ? (
            <Link href={`/critics/${highlight.userSlug}`}>
              <UserAvatar name={highlight.userName} avatarUrl={highlight.userAvatar} size={36} />
            </Link>
          ) : (
            <UserAvatar name={highlight.userName} avatarUrl={highlight.userAvatar} size={36} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* User name + badges */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {highlight.userSlug ? (
              <Link
                href={`/critics/${highlight.userSlug}`}
                className="text-sm font-semibold text-gray-800 hover:text-yellow-700 transition-colors"
              >
                {highlight.userName}
              </Link>
            ) : (
              <span className="text-sm font-semibold text-gray-800">{highlight.userName}</span>
            )}

            {/* Category badge */}
            <Link
              href={`/categories/${highlight.categorySlug}`}
              className="inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 text-amber-700 hover:border-yellow-400 transition-colors"
            >
              <CategoryIcon slug={highlight.categorySlug} iconEmoji={highlight.iconEmoji} iconUrl={highlight.iconUrl} />
              {highlight.categoryName}
            </Link>

            {/* Year badge */}
            <span className="text-[10px] font-medium text-gray-400 flex items-center gap-0.5">
              <Image src="/medals/gold.png" alt="gold" width={12} height={12} />
              {highlight.year}
            </span>
          </div>

          {/* Comment text */}
          <p className="text-sm text-gray-700 leading-relaxed">{highlight.comment}</p>

          {/* Upvote button */}
          <div className="mt-2">
            <button
              onClick={handleUpvote}
              disabled={!isLoggedIn}
              title={isLoggedIn ? (upvoted ? 'Remove upvote' : 'Upvote this highlight') : 'Sign in to upvote'}
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border transition-colors ${
                upvoted
                  ? 'bg-yellow-100 border-yellow-300 text-yellow-700'
                  : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-yellow-300 hover:text-yellow-700'
              } ${!isLoggedIn ? 'opacity-60 cursor-default' : 'cursor-pointer'}`}
            >
              <ThumbsUp className={`w-3 h-3 ${upvoted ? 'fill-yellow-500' : ''}`} />
              {count > 0 && count}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function RestaurantHighlights({ highlights: initialHighlights, totalCount, restaurantId, isLoggedIn, userUpvotedIds }: Props) {
  const [sort, setSort] = useState<SortMode>('popular')
  const [allHighlights, setAllHighlights] = useState<Highlight[]>(initialHighlights)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialHighlights.length < totalCount)

  // When sort changes, reset to initial data and refetch with new sort
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

  // For the initial "popular" sort, data is already sorted from server.
  // Client-side sorting is only needed if we want to re-sort loaded data.
  const displayed = useMemo(() => {
    if (sort === 'newest' && currentSort === 'popular') {
      // If we haven't fetched newest from server yet, do client sort of current data
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
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-yellow-500" />
          Highlights
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

      <div className="space-y-3">
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
        <div className="mt-4 text-center">
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
              `Show more highlights (${remaining} remaining)`
            )}
          </button>
        </div>
      )}
    </section>
  )
}
