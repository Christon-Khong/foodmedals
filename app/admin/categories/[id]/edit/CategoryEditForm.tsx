'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Props = {
  category: {
    id: string
    name: string
    slug: string
    iconEmoji: string
    description: string | null
    sortOrder: number
    status: string
  }
  restaurantCount: number
  medalCount: number
}

const STATUSES = [
  { value: 'active', label: 'Active', color: 'bg-green-500/15 text-green-400 border-green-500/30' },
  { value: 'inactive', label: 'Inactive', color: 'bg-gray-700/50 text-gray-400 border-gray-600/30' },
] as const

function nameToSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function CategoryEditForm({ category, restaurantCount, medalCount }: Props) {
  const router = useRouter()

  const [form, setForm] = useState({
    name: category.name,
    slug: category.slug,
    iconEmoji: category.iconEmoji,
    description: category.description ?? '',
    sortOrder: category.sortOrder,
    status: category.status,
  })
  const [autoSlug, setAutoSlug] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  function update(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.target.value
      setForm((prev) => {
        const next = { ...prev, [field]: value }
        if (field === 'name' && autoSlug) {
          next.slug = nameToSlug(value)
        }
        return next
      })
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    const res = await fetch(`/api/admin/categories/${category.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name.trim(),
        slug: form.slug.trim(),
        iconEmoji: form.iconEmoji.trim(),
        description: form.description.trim() || null,
        sortOrder: Number(form.sortOrder) || 0,
        status: form.status,
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
    if (!confirm(`Permanently delete "${category.name}"? This cannot be undone.`)) return
    setDeleting(true)
    setError('')

    const res = await fetch(`/api/admin/categories/${category.id}`, { method: 'DELETE' })
    if (res.ok) {
      router.push('/admin/categories')
      router.refresh()
    } else {
      const data = await res.json()
      setError(data.error ?? 'Failed to delete')
      setDeleting(false)
    }
  }

  const inputClass =
    'w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500'

  const hasLinkedData = restaurantCount > 0 || medalCount > 0

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/categories"
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          ← Categories
        </Link>
        <h1 className="text-2xl font-bold text-white mt-2">Edit Category</h1>
        <p className="text-gray-500 text-sm mt-1">
          {category.iconEmoji} {category.name} · <span className="font-mono text-xs">{category.slug}</span>
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Details */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Details</h2>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
            <input type="text" value={form.name} onChange={update('name')} required className={inputClass} />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-1">
              Slug
              <label className="flex items-center gap-1 text-xs text-gray-500 font-normal cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSlug}
                  onChange={(e) => {
                    setAutoSlug(e.target.checked)
                    if (e.target.checked) setForm((prev) => ({ ...prev, slug: nameToSlug(prev.name) }))
                  }}
                  className="rounded"
                />
                Auto from name
              </label>
            </label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
              required
              disabled={autoSlug}
              className={`${inputClass} ${autoSlug ? 'opacity-50' : ''}`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Icon Emoji</label>
              <input type="text" value={form.iconEmoji} onChange={update('iconEmoji')} required className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Sort Order</label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm((prev) => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={update('description')}
              rows={2}
              placeholder="Short description for this category"
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

        {/* Stats */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Stats</h2>
          <div className="flex gap-6 text-sm">
            <div>
              <span className="text-gray-500">Restaurants:</span>{' '}
              <span className="text-white font-medium">{restaurantCount}</span>
            </div>
            <div>
              <span className="text-gray-500">Medals:</span>{' '}
              <span className="text-white font-medium">{medalCount}</span>
            </div>
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
        {hasLinkedData ? (
          <p className="text-xs text-gray-500">
            This category has {restaurantCount} restaurant(s) and {medalCount} medal(s) linked.
            Set status to inactive instead of deleting, or remove all linked data first.
          </p>
        ) : (
          <>
            <p className="text-xs text-gray-500 mb-3">
              Permanently remove this category. Only possible when no restaurants or medals are linked.
            </p>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {deleting ? 'Deleting…' : 'Delete category'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
