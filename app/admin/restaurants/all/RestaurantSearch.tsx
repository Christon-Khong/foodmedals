'use client'

import { useRouter } from 'next/navigation'
import { useRef } from 'react'

export function RestaurantSearch({
  defaultValue,
  status,
}: {
  defaultValue: string
  status: string
}) {
  const router = useRouter()
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      const params = new URLSearchParams()
      if (status !== 'all') params.set('status', status)
      if (q.trim()) params.set('q', q.trim())
      const qs = params.toString()
      router.push(`/admin/restaurants/all${qs ? `?${qs}` : ''}`)
    }, 300)
  }

  return (
    <input
      type="text"
      defaultValue={defaultValue}
      onChange={handleChange}
      placeholder="Search by name…"
      className="w-full sm:w-72 bg-gray-800 border border-gray-700 text-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 placeholder-gray-500"
    />
  )
}
