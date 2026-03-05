'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function ClosureActions({ reportId }: { reportId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState<'resolve' | 'dismiss' | null>(null)
  const [done, setDone] = useState<'resolved' | 'dismissed' | null>(null)

  async function handleAction(action: 'resolve' | 'dismiss') {
    setLoading(action)
    const status = action === 'resolve' ? 'resolved' : 'dismissed'

    const res = await fetch(`/api/admin/closure-reports/${reportId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })

    if (res.ok) {
      setDone(status as 'resolved' | 'dismissed')
      setTimeout(() => router.refresh(), 800)
    } else {
      setLoading(null)
    }
  }

  if (done) {
    return (
      <div className={`text-sm font-semibold px-4 py-2 rounded-xl ${
        done === 'resolved'
          ? 'text-green-400 bg-green-400/10 border border-green-400/20'
          : 'text-gray-400 bg-gray-400/10 border border-gray-400/20'
      }`}>
        {done === 'resolved' ? '✓ Marked Closed' : '✗ Dismissed'}
      </div>
    )
  }

  return (
    <div className="flex gap-2 sm:flex-col shrink-0">
      <button
        onClick={() => handleAction('resolve')}
        disabled={loading !== null}
        className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-1.5"
      >
        {loading === 'resolve' ? (
          <span className="animate-spin inline-block w-3 h-3 border border-white border-t-transparent rounded-full" />
        ) : '✓'}
        Mark Closed
      </button>
      <button
        onClick={() => handleAction('dismiss')}
        disabled={loading !== null}
        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-1.5"
      >
        {loading === 'dismiss' ? (
          <span className="animate-spin inline-block w-3 h-3 border border-gray-300 border-t-transparent rounded-full" />
        ) : '✗'}
        Dismiss
      </button>
    </div>
  )
}
