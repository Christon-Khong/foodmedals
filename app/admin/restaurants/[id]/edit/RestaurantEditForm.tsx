'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CategoryIcon } from '@/components/CategoryIcon'

type Category = { id: string; name: string; iconEmoji: string; slug: string }

type Props = {
  restaurant: {
    id: string
    name: string
    slug: string
    address: string
    city: string
    state: string
    zip: string
    description: string | null
    websiteUrl: string | null
    status: string
  }
  allCategories: Category[]
  currentCategoryIds: string[]
  medalCount: number
}

const STATUSES = [
  { value: 'active', label: 'Active', color: 'bg-green-500/15 text-green-400 border-green-500/30' },
  { value: 'pending_review', label: 'Pending', color: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30' },
  { value: 'inactive', label: 'Inactive', color: 'bg-gray-700/50 text-gray-400 border-gray-600/30' },
] as const

export function RestaurantEditForm({ restaurant, allCategories, currentCategoryIds, medalCount }: Props) {
  const router = useRouter()

  const [form, setForm] = useState({
    name: restaurant.name,
    address: restaurant.address,
    city: restaurant.city,
    state: restaurant.state,
    zip: restaurant.zip,
    websiteUrl: restaurant.websiteUrl ?? '',
    description: restaurant.description ?? '',
    status: restaurant.status,
  })
  const [categoryIds, setCategoryIds] = useState<string[]>(currentCategoryIds)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  function update(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  function toggleCategory(id: string) {
    setCategoryIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    if (categoryIds.length === 0) {
      setError('Select at least one category.')
      setSaving(false)
      return
    }

    const res = await fetch(`/api/admin/restaurants/${restaurant.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        zip: form.zip.trim(),
        description: form.description.trim() || null,
        websiteUrl: form.websiteUrl.trim() || null,
        status: form.status,
        categoryIds,
      }),
    })

    if (res.ok) {
      setSuccess('Saved!')
      setSaving(false)
      router.refresh()
      setTimeout(() => setSuccess(''), 2000)
    } else {
      const data = await res.json()
      setError(data.error ?? 'Failed to save')
      setSaving(false)
    }
  }

  async function handleDelete() {
    const msg = medalCount > 0
      ? `Permanently delete "${restaurant.name}"? This will also delete ${medalCount} medal(s). This cannot be undone.`
      : `Permanently delete "${restaurant.name}"? This cannot be undone.`
    if (!confirm(msg)) return
    setDeleting(true)
    setError('')

    const res = await fetch(`/api/admin/restaurants/${restaurant.id}`, { method: 'DELETE' })
    if (res.ok) {
      router.push('/admin/restaurants/all')
      router.refresh()
    } else {
      const data = await res.json()
      setError(data.error ?? 'Failed to delete')
      setDeleting(false)
    }
  }

  const inputClass =
    'w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500'

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/restaurants/all"
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          ← All Restaurants
        </Link>
        <h1 className="text-2xl font-bold text-white mt-2">Edit Restaurant</h1>
        <p className="text-gray-500 text-sm mt-1">
          {restaurant.name} · <span className="font-mono text-xs">{restaurant.slug}</span>
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Basic info */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Details</h2>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Restaurant name</label>
            <input type="text" value={form.name} onChange={update('name')} required className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-1">Street address</label>
              <input type="text" value={form.address} onChange={update('address')} required className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">City</label>
              <input type="text" value={form.city} onChange={update('city')} required className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">State</label>
                <input type="text" value={form.state} onChange={update('state')} required className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">ZIP</label>
                <input type="text" value={form.zip} onChange={update('zip')} required className={inputClass} />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Website</label>
            <input type="url" value={form.websiteUrl} onChange={update('websiteUrl')} placeholder="https://..." className={inputClass} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={update('description')}
              rows={3}
              placeholder="What makes this place special?"
              className={`${inputClass} resize-none`}
            />
          </div>
        </div>

        {/* Status */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Status</h2>
          <div className="flex gap-2">
            {STATUSES.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, status: s.value }))}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  form.status === s.value
                    ? s.color
                    : 'bg-gray-800 text-gray-500 border-gray-700 hover:border-gray-600'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">Categories</h2>
          <p className="text-xs text-gray-500 mb-3">Select all food categories this restaurant is known for.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-60 overflow-y-auto">
            {allCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => toggleCategory(cat.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors text-left ${
                  categoryIds.includes(cat.id)
                    ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                    : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600'
                }`}
              >
                <span><CategoryIcon slug={cat.slug} iconEmoji={cat.iconEmoji} /></span>
                <span className="truncate">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Error / Success */}
        {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">{error}</p>}
        {success && <p className="text-sm text-green-400 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-2">{success}</p>}

        {/* Save */}
        <button
          type="submit"
          disabled={saving}
          className="w-full bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </form>

      {/* Danger zone */}
      <div className="mt-8 bg-red-500/5 border border-red-500/20 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-red-400 uppercase tracking-wider mb-2">Danger Zone</h2>
        <p className="text-xs text-gray-500 mb-3">
          Permanently remove this restaurant and all associated data
          {medalCount > 0 && ` (including ${medalCount} medal${medalCount !== 1 ? 's' : ''})`}.
        </p>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="px-4 py-2 bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
        >
          {deleting ? 'Deleting…' : 'Delete restaurant'}
        </button>
      </div>
    </div>
  )
}
