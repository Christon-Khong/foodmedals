'use client'

import dynamic from 'next/dynamic'

export const RestaurantMap = dynamic(
  () => import('./RestaurantMapInner'),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-xl border border-amber-200 bg-amber-50/50 mt-4 flex items-center justify-center" style={{ height: 200 }}>
        <span className="text-sm text-gray-400">Loading map…</span>
      </div>
    ),
  },
)
