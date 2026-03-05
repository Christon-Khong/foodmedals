'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CategoryVoteButton } from '@/app/suggest/vote/CategoryVoteButton'

type CategorySuggestion = {
  id: string
  name: string
  iconEmoji: string
  description: string | null
  submitter: string
  createdAt: string
  voteCount: number
  voted: boolean
}

type Props = {
  suggestions: CategorySuggestion[]
  isLoggedIn: boolean
  isAdmin?: boolean
}

export function CategoryNominations({ suggestions: initialSuggestions, isLoggedIn, isAdmin = false }: Props) {
  const [suggestions, setSuggestions] = useState(initialSuggestions)
  const [voteStates, setVoteStates] = useState<Record<string, { count: number; activated: boolean }>>({})
  const [approving, setApproving] = useState<string | null>(null)

  async function handleApprove(id: string) {
    setApproving(id)
    const res = await fetch(`/api/admin/category-suggestions/${id}/approve`, { method: 'POST' })
    if (res.ok) {
      setSuggestions(prev => prev.filter(s => s.id !== id))
    }
    setApproving(null)
  }

  return (
    <div className="mb-10">
      <h2 className="text-lg font-bold text-gray-900 mb-4">
        Category Nominations
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
                  <CategoryVoteButton
                    suggestionId={s.id}
                    initialVoted={s.voted}
                    initialCount={s.voteCount}
                    onCountChange={(count, _voted, activated) => {
                      setVoteStates(prev => ({ ...prev, [s.id]: { count, activated } }))
                    }}
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
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{s.iconEmoji}</span>
                  <h3 className="font-bold text-gray-900">{s.name}</h3>
                </div>

                {s.description && (
                  <p className="text-sm text-gray-600 mt-1.5 line-clamp-2">{s.description}</p>
                )}

                {/* Progress toward activation */}
                {isActivated ? (
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-green-100 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full w-full" />
                    </div>
                    <span className="text-[10px] text-green-600 font-bold whitespace-nowrap">
                      ✓ Added!
                    </span>
                  </div>
                ) : (
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.round((currentCount / 50) * 100))}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">
                      {currentCount}/50 to activate
                    </span>
                  </div>
                )}

                <p className="text-xs text-gray-400 mt-1.5">
                  Suggested by {s.submitter} · {new Date(s.createdAt).toLocaleDateString()}
                </p>
              </div>

              {/* Admin approve */}
              {isAdmin && (
                <div className="shrink-0 flex items-center">
                  <button
                    onClick={() => handleApprove(s.id)}
                    disabled={approving === s.id}
                    className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                  >
                    {approving === s.id ? 'Approving…' : 'Approve'}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
