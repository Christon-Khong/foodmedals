'use client'

import { useState } from 'react'
import Link from 'next/link'
import { VoteButton } from '@/app/suggest/vote/VoteButton'
import { CategoryIcon } from '@/components/CategoryIcon'

type Category = {
  name: string
  emoji: string
  iconUrl: string | null
  slug: string
}

type Suggestion = {
  id: string
  name: string
  city: string
  state: string
  description: string | null
  submitter: string
  createdAt: string
  categories: Category[]
  voteCount: number
  voted: boolean
}

type Props = {
  suggestions: Suggestion[]
  isLoggedIn: boolean
}

export function CategoriesRestaurantNominations({ suggestions, isLoggedIn }: Props) {
  const [voteStates, setVoteStates] = useState<Record<string, { count: number; activated: boolean }>>({})

  return (
    <div className="mb-10">
      <h2 className="text-lg font-bold text-gray-900 mb-4">
        Restaurant Nominations
      </h2>

      <div className="space-y-3">
        {suggestions.map(s => {
          const currentCount = voteStates[s.id]?.count ?? s.voteCount
          const isActivated = voteStates[s.id]?.activated ?? false

          return (
            <div
              key={s.id}
              className="bg-white border border-amber-100 rounded-2xl shadow-sm p-5 flex gap-4"
            >
              {/* Vote button */}
              <div className="shrink-0 pt-1">
                {isLoggedIn ? (
                  <VoteButton
                    restaurantId={s.id}
                    initialVoted={s.voted}
                    initialCount={s.voteCount}
                    onCountChange={(count, _voted, activated) => {
                      setVoteStates(prev => ({ ...prev, [s.id]: { count, activated } }))
                    }}
                  />
                ) : (
                  <Link
                    href="/auth/signin?callbackUrl=/categories"
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
                        <CategoryIcon slug={c.slug} iconEmoji={c.emoji} iconUrl={c.iconUrl} /> {c.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Progress toward activation */}
                {isActivated ? (
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-green-100 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full w-full" />
                    </div>
                    <span className="text-[10px] text-green-600 font-bold whitespace-nowrap">
                      ✓ Activated!
                    </span>
                  </div>
                ) : (
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.round((currentCount / 10) * 100))}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">
                      {currentCount}/10 to activate
                    </span>
                  </div>
                )}

                <p className="text-xs text-gray-400 mt-1.5">
                  Suggested by {s.submitter} · {new Date(s.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
