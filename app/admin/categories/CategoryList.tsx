'use client'

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { GripVertical, Check, X } from 'lucide-react'
import { CategoryIcon } from '@/components/CategoryIcon'

type Category = {
  id: string
  name: string
  slug: string
  iconEmoji: string
  iconUrl: string | null
  sortOrder: number
  status: string
  _count: { restaurants: number; medals: number }
}

type Props = {
  categories: Category[]
  iconFilter?: string
}

const CUSTOM_ICON_SLUGS = new Set([
  'onion-rings', 'pulled-pork', 'bbq-ribs', 'wings', 'chicken-wings',
  'pad-thai', 'mac-and-cheese', 'pho', 'fried-chicken-sandwich',
  'nachos', 'chicken-tenders', 'acai-bowls',
])

function hasImage(cat: { slug: string; iconUrl: string | null }) {
  return !!(cat.iconUrl || CUSTOM_ICON_SLUGS.has(cat.slug))
}

export function CategoryList({ categories: initial, iconFilter }: Props) {
  const [categories, setCategories] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const dragItem = useRef<number | null>(null)
  const dragOverItem = useRef<number | null>(null)

  const filtered = iconFilter === 'emoji'
    ? categories.filter(c => !hasImage(c))
    : iconFilter === 'image'
      ? categories.filter(c => hasImage(c))
      : categories

  const emojiCount = categories.filter(c => !hasImage(c)).length
  const imageCount = categories.filter(c => hasImage(c)).length

  const persistOrder = useCallback(async (updated: Category[]) => {
    setSaving(true)
    const order = updated.map((c, i) => ({ id: c.id, sortOrder: i }))
    try {
      await fetch('/api/admin/categories/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order }),
      })
    } finally {
      setSaving(false)
    }
  }, [])

  // Drag handlers
  const handleDragStart = (index: number) => {
    dragItem.current = index
  }

  const handleDragEnter = (index: number) => {
    dragOverItem.current = index
  }

  const handleDragEnd = () => {
    if (dragItem.current === null || dragOverItem.current === null) return
    if (dragItem.current === dragOverItem.current) {
      dragItem.current = null
      dragOverItem.current = null
      return
    }

    const updated = [...categories]
    const [dragged] = updated.splice(dragItem.current, 1)
    updated.splice(dragOverItem.current, 0, dragged)
    // Reassign sortOrder
    const reordered = updated.map((c, i) => ({ ...c, sortOrder: i }))
    setCategories(reordered)
    persistOrder(reordered)

    dragItem.current = null
    dragOverItem.current = null
  }

  // Direct sort order edit
  const startEdit = (cat: Category) => {
    setEditingId(cat.id)
    setEditValue(String(cat.sortOrder))
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditValue('')
  }

  const commitEdit = () => {
    if (!editingId) return
    const target = parseInt(editValue, 10)
    if (isNaN(target)) { cancelEdit(); return }

    const currentIndex = categories.findIndex(c => c.id === editingId)
    if (currentIndex === -1) { cancelEdit(); return }

    // Clamp target to valid range
    const clampedTarget = Math.max(0, Math.min(categories.length - 1, target))

    const updated = [...categories]
    const [item] = updated.splice(currentIndex, 1)
    updated.splice(clampedTarget, 0, item)
    const reordered = updated.map((c, i) => ({ ...c, sortOrder: i }))
    setCategories(reordered)
    persistOrder(reordered)
    cancelEdit()
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Categories</h1>
          <p className="text-gray-400 text-sm mt-1">
            {filtered.length} of {categories.length} food categories
            {saving && <span className="ml-2 text-yellow-400">· Saving…</span>}
          </p>
        </div>
        <Link
          href="/admin/categories/new"
          className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-semibold rounded-xl text-sm transition-colors"
        >
          + Add Category
        </Link>
      </div>

      <div className="mb-4 flex gap-2">
        {[
          { label: 'All', value: undefined, count: categories.length },
          { label: 'Emoji', value: 'emoji', count: emojiCount },
          { label: 'Image', value: 'image', count: imageCount },
        ].map(f => {
          const active = iconFilter === f.value || (!iconFilter && !f.value)
          return (
            <Link
              key={f.label}
              href={f.value ? `/admin/categories?icon=${f.value}` : '/admin/categories'}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                active
                  ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40'
                  : 'bg-gray-800/50 text-gray-400 border-gray-700 hover:border-gray-600 hover:text-gray-300'
              }`}
            >
              {f.label} ({f.count})
            </Link>
          )
        })}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="w-8 px-1" />
              <th className="text-left px-3 py-3 text-gray-500 font-semibold w-14">#</th>
              <th className="text-left px-4 py-3 text-gray-500 font-semibold">Category</th>
              <th className="text-left px-4 py-3 text-gray-500 font-semibold hidden sm:table-cell">Slug</th>
              <th className="text-center px-4 py-3 text-gray-500 font-semibold">Restaurants</th>
              <th className="text-center px-4 py-3 text-gray-500 font-semibold hidden md:table-cell">Medals</th>
              <th className="text-center px-4 py-3 text-gray-500 font-semibold">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60">
            {filtered.map((cat, index) => (
              <tr
                key={cat.id}
                draggable={!iconFilter}
                onDragStart={() => handleDragStart(index)}
                onDragEnter={() => handleDragEnter(index)}
                onDragEnd={handleDragEnd}
                onDragOver={e => e.preventDefault()}
                className="hover:bg-gray-800/40 transition-colors group"
              >
                {/* Drag handle */}
                <td className="px-1 py-3">
                  {!iconFilter && (
                    <div className="cursor-grab active:cursor-grabbing text-gray-700 group-hover:text-gray-400 transition-colors">
                      <GripVertical className="w-4 h-4" />
                    </div>
                  )}
                </td>

                {/* Sort order — click to edit */}
                <td className="px-3 py-3">
                  {editingId === cat.id ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') commitEdit()
                          if (e.key === 'Escape') cancelEdit()
                        }}
                        autoFocus
                        className="w-12 bg-gray-800 border border-yellow-500/50 rounded px-1.5 py-0.5 text-xs text-white text-center focus:outline-none"
                        min={0}
                        max={categories.length - 1}
                      />
                      <button onClick={commitEdit} className="text-green-400 hover:text-green-300">
                        <Check className="w-3 h-3" />
                      </button>
                      <button onClick={cancelEdit} className="text-gray-500 hover:text-gray-300">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => startEdit(cat)}
                      className="text-gray-600 hover:text-yellow-400 text-xs tabular-nums transition-colors"
                      title="Click to set position"
                    >
                      {cat.sortOrder}
                    </button>
                  )}
                </td>

                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl"><CategoryIcon slug={cat.slug} iconEmoji={cat.iconEmoji} iconUrl={cat.iconUrl} /></span>
                    <span className="font-medium text-white">{cat.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500 font-mono text-xs hidden sm:table-cell">{cat.slug}</td>
                <td className="px-4 py-3 text-center text-gray-300">{cat._count.restaurants}</td>
                <td className="px-4 py-3 text-center text-gray-300 hidden md:table-cell">{cat._count.medals}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                    cat.status === 'active'
                      ? 'bg-green-500/15 text-green-400 border-green-500/30'
                      : 'bg-gray-700/50 text-gray-400 border-gray-600/30'
                  }`}>
                    {cat.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/categories/${cat.id}/edit`}
                      className="text-xs text-gray-500 hover:text-yellow-400 transition-colors"
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/categories/${cat.slug}`}
                      target="_blank"
                      className="text-xs text-gray-500 hover:text-yellow-400 transition-colors"
                    >
                      View ↗
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
