'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const THRESHOLD = 50

export function CategoryVoteButton({
  suggestionId,
  initialVoted,
  initialCount,
  disabled,
}: {
  suggestionId: string
  initialVoted: boolean
  initialCount: number
  disabled?: boolean
}) {
  const router = useRouter()
  const [voted, setVoted] = useState(initialVoted)
  const [count, setCount] = useState(initialCount)
  const [loading, setLoading] = useState(false)
  const [activated, setActivated] = useState(false)

  const pct = Math.min(100, Math.round((count / THRESHOLD) * 100))

  async function toggle() {
    if (disabled || activated) return
    setLoading(true)
    setVoted(v => !v)
    setCount(c => voted ? c - 1 : c + 1)

    const res = await fetch(`/api/categories/suggest/${suggestionId}/vote`, {
      method: 'POST',
    })

    if (res.ok) {
      const data = await res.json()
      setVoted(data.voted)
      setCount(data.count)
      if (data.activated) {
        setActivated(true)
        setTimeout(() => router.refresh(), 1500)
      }
    } else {
      setVoted(v => !v)
      setCount(c => voted ? c + 1 : c - 1)
    }
    setLoading(false)
  }

  if (activated) {
    return (
      <div className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl bg-green-100 text-green-700">
        <span className="text-lg">✓</span>
        <span className="text-xs font-bold">Added!</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-1">
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
      <div className="relative w-10 h-1.5 bg-gray-100 rounded-full overflow-hidden mt-0.5">
        <div
          className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[9px] text-gray-400 font-medium">{count}/{THRESHOLD}</span>
    </div>
  )
}
