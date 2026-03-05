'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const THRESHOLD = 50

export function CategoryVoteButton({
  suggestionId,
  initialVoted,
  initialCount,
  disabled,
  onCountChange,
}: {
  suggestionId: string
  initialVoted: boolean
  initialCount: number
  disabled?: boolean
  onCountChange?: (count: number, voted: boolean, activated: boolean) => void
}) {
  const router = useRouter()
  const [voted, setVoted] = useState(initialVoted)
  const [count, setCount] = useState(initialCount)
  const [loading, setLoading] = useState(false)
  const [activated, setActivated] = useState(false)

  async function toggle() {
    if (disabled || activated) return
    setLoading(true)
    const newVoted = !voted
    const newCount = voted ? count - 1 : count + 1
    setVoted(newVoted)
    setCount(newCount)
    onCountChange?.(newCount, newVoted, false)

    const res = await fetch(`/api/categories/suggest/${suggestionId}/vote`, {
      method: 'POST',
    })

    if (res.ok) {
      const data = await res.json()
      setVoted(data.voted)
      setCount(data.count)
      if (data.activated) {
        setActivated(true)
        onCountChange?.(data.count, data.voted, true)
        setTimeout(() => router.refresh(), 1500)
      } else {
        onCountChange?.(data.count, data.voted, false)
      }
    } else {
      setVoted(voted)
      setCount(count)
      onCountChange?.(count, voted, false)
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
