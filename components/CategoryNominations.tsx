'use client'

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
}

export function CategoryNominations({ suggestions, isLoggedIn }: Props) {
  return (
    <div className="mb-10">
      <h2 className="text-lg font-bold text-gray-900 mb-4">
        Category Nominations
      </h2>

      <div className="space-y-3">
        {suggestions.map(s => (
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

              {/* Progress toward auto-approval */}
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.round((s.voteCount / 50) * 100))}%` }}
                  />
                </div>
                <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">
                  {s.voteCount}/50 to auto-approve
                </span>
              </div>

              <p className="text-xs text-gray-400 mt-1.5">
                Suggested by {s.submitter} · {new Date(s.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
