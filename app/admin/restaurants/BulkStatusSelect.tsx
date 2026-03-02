'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function BulkStatusSelect({
  restaurantId,
  currentStatus,
}: {
  restaurantId:  string
  currentStatus: string
}) {
  const router            = useRouter()
  const [saving, setSaving] = useState(false)

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const status = e.target.value
    if (status === currentStatus) return
    setSaving(true)
    await fetch(`/api/admin/restaurants/${restaurantId}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ status }),
    })
    setSaving(false)
    router.refresh()
  }

  return (
    <select
      defaultValue={currentStatus}
      onChange={handleChange}
      disabled={saving}
      className="text-xs bg-gray-800 border border-gray-700 text-gray-300 rounded-lg px-2 py-1.5 hover:border-gray-600 focus:outline-none focus:ring-1 focus:ring-yellow-500 transition-colors disabled:opacity-50"
    >
      <option value="active">Active</option>
      <option value="pending_review">Pending</option>
      <option value="inactive">Inactive</option>
    </select>
  )
}
