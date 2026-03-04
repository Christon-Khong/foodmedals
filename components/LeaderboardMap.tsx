'use client'

import dynamic from 'next/dynamic'

export const LeaderboardMap = dynamic(
  () => import('./LeaderboardMapInner'),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-xl border border-amber-200 bg-amber-50/50 mb-4 flex items-center justify-center" style={{ height: 260 }}>
        <span className="text-sm text-gray-400">Loading map...</span>
      </div>
    ),
  },
)
