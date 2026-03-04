'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CategoryIcon } from '@/components/CategoryIcon'

type Category = {
  id: string
  name: string
  slug: string
  iconEmoji: string
  iconUrl: string | null
}

type Suggestion = {
  categoryId: string
  categoryName: string
  categorySlug: string
  iconEmoji: string
  iconUrl: string | null
  voteCount: number
  voted: boolean
}

type Props = {
  restaurantId: string
  restaurantSlug: string
  allCategories: Category[]
  verifiedCategoryIds: string[]
  suggestions: Suggestion[]
  isLoggedIn: boolean
}

export function CategorySuggest({
  restaurantId,
  restaurantSlug,
  allCategories,
  verifiedCategoryIds,
  suggestions: initialSuggestions,
  isLoggedIn,
}: Props) {
  const [open, setOpen] = useState(false)
  const [suggestions, setSuggestions] = useState(initialSuggestions)
  const [loading, setLoading] = useState<string | null>(null)

  // Categories not yet verified for this restaurant
  const availableCategories = allCategories.filter(
    c => !verifiedCategoryIds.includes(c.id)
  )

  if (availableCategories.length === 0) return null

  async function handleVote(categoryId: string) {
    if (!isLoggedIn || loading) return
    setLoading(categoryId)

    // Optimistic update
    setSuggestions(prev => {
      const existing = prev.find(s => s.categoryId === categoryId)
      if (existing) {
        return prev.map(s =>
          s.categoryId === categoryId
            ? { ...s, voted: !s.voted, voteCount: s.voted ? s.voteCount - 1 : s.voteCount + 1 }
            : s
        )
      }
      // New suggestion
      const cat = allCategories.find(c => c.id === categoryId)!
      return [...prev, {
        categoryId,
        categoryName: cat.name,
        categorySlug: cat.slug,
        iconEmoji: cat.iconEmoji,
        iconUrl: cat.iconUrl,
        voteCount: 1,
        voted: true,
      }]
    })

    try {
      const res = await fetch(`/api/restaurants/${restaurantId}/suggest-category`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.activated) {
          // Category was auto-activated — reload to show updated chips
          window.location.href = `/restaurants/${restaurantSlug}`
          return
        }
        setSuggestions(prev =>
          prev.map(s =>
            s.categoryId === categoryId
              ? { ...s, voted: data.voted, voteCount: data.count }
              : s
          )
        )
      } else {
        // Revert on error
        setSuggestions(prev =>
          prev.map(s =>
            s.categoryId === categoryId
              ? { ...s, voted: !s.voted, voteCount: s.voted ? s.voteCount - 1 : s.voteCount + 1 }
              : s
          ).filter(s => s.voteCount > 0 || s.voted)
        )
      }
    } catch {
      // Revert
      setSuggestions(initialSuggestions)
    }
    setLoading(null)
  }

  // Merge available categories with existing suggestion data
  const categoryRows = availableCategories.map(cat => {
    const sugg = suggestions.find(s => s.categoryId === cat.id)
    return {
      ...cat,
      voteCount: sugg?.voteCount ?? 0,
      voted: sugg?.voted ?? false,
    }
  }).sort((a, b) => b.voteCount - a.voteCount)

  return (
    <div className="mt-4">
      <button
        onClick={() => setOpen(o => !o)}
        className="text-xs text-gray-400 hover:text-yellow-700 transition-colors flex items-center gap-1"
      >
        <span className="text-sm">{open ? '−' : '+'}</span>
        Suggest a category
      </button>

      {open && (
        <div className="mt-2 bg-white rounded-xl border border-amber-100 p-3 space-y-1.5">
          <p className="text-xs text-gray-400 mb-2">
            Vote to add a category. {5} votes needed to activate.
          </p>
          {categoryRows.map(cat => (
            <div
              key={cat.id}
              className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-amber-50 transition-colors"
            >
              <span className="text-lg flex-shrink-0">
                <CategoryIcon slug={cat.slug} iconEmoji={cat.iconEmoji} iconUrl={cat.iconUrl} />
              </span>
              <span className="text-sm text-gray-700 flex-1 truncate">{cat.name}</span>
              {cat.voteCount > 0 && (
                <span className="text-xs text-gray-400 tabular-nums">{cat.voteCount}/5</span>
              )}
              {isLoggedIn ? (
                <button
                  onClick={() => handleVote(cat.id)}
                  disabled={loading === cat.id}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${
                    cat.voted
                      ? 'bg-yellow-400 text-gray-900 hover:bg-yellow-500'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat.voted ? 'Voted' : 'Vote'}
                </button>
              ) : (
                <Link
                  href={`/auth/signin?callbackUrl=/restaurants/${restaurantSlug}`}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
                >
                  Sign in
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
