'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { CategoryIcon } from '@/components/CategoryIcon'
import { ThumbsUp, Sparkles } from 'lucide-react'

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

export function RestaurantHighlights({ highlights, isLoggedIn, userUpvotedIds }: Props) {
  const [sort, setSort] = useState<SortMode>('popular')

  const sorted = useMemo(() => {
    if (sort === 'newest') {
      return [...highlights].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    }
    // popular (default) — already sorted by upvote count from server
    return highlights
  }, [highlights, sort])

  if (highlights.length === 0) return null

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-yellow-500" />
          Highlights
        </h2>

        {highlights.length > 1 && (
          <div className="flex bg-white rounded-full border border-gray-200 p-0.5">
            <button
              onClick={() => setSort('popular')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                sort === 'popular' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Popular
            </button>
            <button
              onClick={() => setSort('newest')}
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
        {sorted.map(h => (
          <HighlightCard
            key={h.id}
            highlight={h}
            isLoggedIn={isLoggedIn}
            upvoted={userUpvotedIds.includes(h.id)}
          />
        ))}
      </div>
    </section>
  )
}
