'use client'

import { useState } from 'react'
import Link from 'next/link'
import { VoteButton } from '@/app/suggest/vote/VoteButton'

type Nomination = {
  id: string
  name: string
  city: string
  state: string
  description: string | null
  submitter: string
  createdAt: string
  voteCount: number
  voted: boolean
}

export function NominationsSection({
  nominations: initialNominations,
  isAdmin,
  isLoggedIn,
  categorySlug,
}: {
  nominations: Nomination[]
  isAdmin: boolean
  isLoggedIn: boolean
  categorySlug: string
}) {
  const [nominations, setNominations] = useState(initialNominations)
  const [approving, setApproving] = useState<string | null>(null)

  async function handleApprove(id: string) {
    setApproving(id)
    const res = await fetch(`/api/admin/restaurants/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'active' }),
    })
    if (res.ok) {
      setNominations(prev => prev.filter(n => n.id !== id))
    }
    setApproving(null)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">Community Nominations</h2>
        <Link
          href="/suggest/restaurant"
          className="text-xs font-semibold text-yellow-700 hover:underline"
        >
          Suggest a restaurant
        </Link>
      </div>

      {nominations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-8 text-center">
          <p className="text-sm text-gray-500">
            No pending nominations for this category.{' '}
            <Link href="/suggest/restaurant" className="text-yellow-700 hover:underline font-medium">
              Suggest one!
            </Link>
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {nominations.map(n => (
            <div
              key={n.id}
              className="bg-white border border-amber-100 rounded-2xl shadow-sm p-4 flex gap-3"
            >
              {/* Vote */}
              <div className="shrink-0 pt-0.5">
                {isLoggedIn ? (
                  <VoteButton
                    restaurantId={n.id}
                    initialVoted={n.voted}
                    initialCount={n.voteCount}
                  />
                ) : (
                  <Link
                    href={`/auth/signin?callbackUrl=/categories/${categorySlug}`}
                    className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-sm font-semibold bg-gray-100 text-gray-400 hover:bg-gray-200 transition-colors"
                  >
                    <span className="text-base">△</span>
                    <span className="text-xs">{n.voteCount}</span>
                  </Link>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 text-sm">{n.name}</h3>
                <p className="text-xs text-gray-500">{n.city}, {n.state}</p>
                {n.description && (
                  <p className="text-xs text-gray-600 mt-1 line-clamp-1">{n.description}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  by {n.submitter} · {new Date(n.createdAt).toLocaleDateString()}
                </p>
              </div>

              {/* Admin approve */}
              {isAdmin && (
                <div className="shrink-0 flex items-center">
                  <button
                    onClick={() => handleApprove(n.id)}
                    disabled={approving === n.id}
                    className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                  >
                    {approving === n.id ? 'Approving…' : 'Approve'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
