'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function ApproveRejectButtons({
  restaurantId,
  restaurantName,
}: {
  restaurantId:   string
  restaurantName: string
}) {
  const router  = useRouter()
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)
  const [done,    setDone]    = useState<'approved' | 'rejected' | null>(null)

  async function handleAction(action: 'approve' | 'reject') {
    setLoading(action)
    const status = action === 'approve' ? 'active' : 'inactive'

    const res = await fetch(`/api/admin/restaurants/${restaurantId}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ status }),
    })

    if (res.ok) {
      setDone(action === 'approve' ? 'approved' : 'rejected')
      setTimeout(() => router.refresh(), 800)
    } else {
      setLoading(null)
    }
  }

  if (done) {
    return (
      <div className={`text-sm font-semibold px-4 py-2 rounded-xl ${
        done === 'approved'
          ? 'text-green-400 bg-green-400/10 border border-green-400/20'
          : 'text-red-400 bg-red-400/10 border border-red-400/20'
      }`}>
        {done === 'approved' ? '✓ Approved' : '✗ Rejected'}
      </div>
    )
  }

  return (
    <div className="flex gap-2 sm:flex-col shrink-0">
      <button
        onClick={() => handleAction('approve')}
        disabled={loading !== null}
        className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-1.5"
      >
        {loading === 'approve' ? (
          <span className="animate-spin inline-block w-3 h-3 border border-white border-t-transparent rounded-full" />
        ) : '✓'}
        Approve
      </button>
      <button
        onClick={() => handleAction('reject')}
        disabled={loading !== null}
        className="px-4 py-2 bg-gray-700 hover:bg-red-700 text-gray-300 hover:text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-1.5"
      >
        {loading === 'reject' ? (
          <span className="animate-spin inline-block w-3 h-3 border border-gray-300 border-t-transparent rounded-full" />
        ) : '✗'}
        Reject
      </button>
    </div>
  )
}
