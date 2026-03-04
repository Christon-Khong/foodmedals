'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

function nameToSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function CategoryCreateForm() {
  const router = useRouter()

  const [form, setForm] = useState({
    name: '',
    slug: '',
    iconEmoji: '',
    description: '',
    sortOrder: 0,
  })
  const [autoSlug, setAutoSlug] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const res = await fetch('/api/admin/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name.trim(),
        slug: form.slug.trim(),
        iconEmoji: form.iconEmoji.trim(),
        description: form.description.trim() || null,
        sortOrder: Number(form.sortOrder) || 0,
      }),
    })

    if (res.ok) {
      router.push('/admin/categories')
      router.refresh()
    } else {
      const data = await res.json()
      setError(data.error ?? 'Failed to create')
      setSaving(false)
    }
  }

  const inputClass =
    'w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500'

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/categories"
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          ← Categories
        </Link>
        <h1 className="text-2xl font-bold text-white mt-2">Add Category</h1>
        <p className="text-gray-500 text-sm mt-1">Create a new food category.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Details</h2>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Name <span className="text-red-400">*</span>
            </label>
            <input type="text" value={form.name} onChange={update('name')} required placeholder="e.g. Burgers" className={inputClass} />
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
              placeholder="e.g. burgers"
              className={`${inputClass} ${autoSlug ? 'opacity-50' : ''}`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Icon Emoji <span className="text-red-400">*</span>
              </label>
              <input type="text" value={form.iconEmoji} onChange={update('iconEmoji')} required placeholder="🍔" className={inputClass} />
              <p className="text-xs text-gray-600 mt-1">You can upload a custom icon after creating.</p>
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

        {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
        >
          {saving ? 'Creating…' : 'Create category'}
        </button>
      </form>
    </div>
  )
}
