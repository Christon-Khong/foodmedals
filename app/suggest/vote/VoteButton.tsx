'use client'

import { useState } from 'react'

export function VoteButton({
  restaurantId,
  initialVoted,
  initialCount,
  disabled,
}: {
  restaurantId: string
  initialVoted: boolean
  initialCount: number
  disabled?: boolean
}) {
  const [voted, setVoted] = useState(initialVoted)
  const [count, setCount] = useState(initialCount)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    if (disabled) return
    setLoading(true)
    // Optimistic update
    setVoted(v => !v)
    setCount(c => voted ? c - 1 : c + 1)

    const res = await fetch(`/api/restaurants/${restaurantId}/vote`, {
      method: 'POST',
    })

    if (res.ok) {
      const data = await res.json()
      setVoted(data.voted)
      setCount(data.count)
    } else {
      // Revert on error
      setVoted(v => !v)
      setCount(c => voted ? c + 1 : c - 1)
    }
    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={loading || disabled}
      className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 ${
        voted
          ? 'bg-yellow-400 text-gray-900 hover:bg-yellow-500'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      <span className="text-lg">{voted ? '▲' : '△'}</span>
      <span>{count}</span>
    </button>
  )
}
