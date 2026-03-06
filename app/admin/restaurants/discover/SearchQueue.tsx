'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Plus, Loader2, Play, ListOrdered } from 'lucide-react'
import { SortableQueueItem, type QueueItem } from './SortableQueueItem'

type CategoryOption = {
  slug: string
  name: string
  iconEmoji: string
}

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC',
]

type Props = {
  onQueueProcessed?: () => void
  refreshTrigger?: number
}

export function SearchQueue({ onQueueProcessed, refreshTrigger }: Props) {
  const [items, setItems] = useState<QueueItem[]>([])
  const [loading, setLoading] = useState(true)

  // Categories
  const [categories, setCategories] = useState<CategoryOption[]>([])

  // Add form
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [resultsPerCategory, setResultsPerCategory] = useState(5)
  const [categorySlug, setCategorySlug] = useState<string>('') // '' = all
  const [adding, setAdding] = useState(false)

  // Processing
  const [processing, setProcessing] = useState(false)
  const [processResults, setProcessResults] = useState<{
    results: Array<{ city: string; state: string; status: string; error?: string }>
  } | null>(null)

  // Deleting
  const [deletingId, setDeletingId] = useState<string | null>(null)

  /* ---- Fetch queue ---- */
  const fetchQueue = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/restaurants/discover/queue')
      if (res.ok) {
        const data = await res.json()
        setItems(data.items ?? [])
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchQueue()
    // Fetch categories for the dropdown
    fetch('/api/categories/list')
      .then(r => r.ok ? r.json() : [])
      .then(data => setCategories(data ?? []))
      .catch(() => {})
  }, [fetchQueue])

  // Refetch when parent signals a change (e.g. priority add from CityGaps)
  useEffect(() => {
    if (refreshTrigger) fetchQueue()
  }, [refreshTrigger, fetchQueue])

  /* ---- Add to queue ---- */
  const handleAdd = async () => {
    if (!city.trim() || !state) return
    setAdding(true)
    try {
      const res = await fetch('/api/admin/restaurants/discover/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city: city.trim(), state, resultsPerCategory, categorySlug: categorySlug || null }),
      })
      if (res.ok) {
        setCity('')
        fetchQueue()
      }
    } finally {
      setAdding(false)
    }
  }

  /* ---- Delete from queue ---- */
  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await fetch(`/api/admin/restaurants/discover/queue/${id}`, {
        method: 'DELETE',
      })
      setItems((prev) => prev.filter((i) => i.id !== id))
    } finally {
      setDeletingId(null)
    }
  }

  /* ---- Update queue item ---- */
  const handleUpdate = async (
    id: string,
    data: Partial<Pick<QueueItem, 'city' | 'state' | 'resultsPerCategory' | 'categorySlug'>>,
  ) => {
    // Optimistic update
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...data } : i)),
    )
    try {
      const res = await fetch(`/api/admin/restaurants/discover/queue/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        const { item } = await res.json()
        setItems((prev) => prev.map((i) => (i.id === id ? item : i)))
      }
    } catch {
      fetchQueue() // Revert on error
    }
  }

  /* ---- Drag and drop ---- */
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const pendingItems = items.filter((i) => i.status === 'pending')
    const oldIndex = pendingItems.findIndex((i) => i.id === active.id)
    const newIndex = pendingItems.findIndex((i) => i.id === over.id)

    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(pendingItems, oldIndex, newIndex)

    // Rebuild full items list: reordered pending items + non-pending items
    const nonPending = items.filter((i) => i.status !== 'pending')
    setItems([...reordered, ...nonPending])

    // Persist to server
    await fetch('/api/admin/restaurants/discover/queue/reorder', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderedIds: reordered.map((i) => i.id),
      }),
    })
  }

  /* ---- Process queue ---- */
  const handleProcess = async () => {
    setProcessing(true)
    setProcessResults(null)
    try {
      const res = await fetch(
        '/api/admin/restaurants/discover/queue/process',
        { method: 'POST' },
      )
      if (res.ok) {
        const data = await res.json()
        setProcessResults(data)
        fetchQueue()
        onQueueProcessed?.()
      }
    } finally {
      setProcessing(false)
    }
  }

  const pendingItems = items.filter((i) => i.status === 'pending')
  const completedItems = items.filter(
    (i) => i.status === 'completed' || i.status === 'failed',
  )

  // Don't render at all while loading
  if (loading) return null

  return (
    <div data-queue className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <ListOrdered className="w-4 h-4 text-yellow-400" />
          Search Queue
          {pendingItems.length > 0 && (
            <span className="text-xs text-gray-500 font-normal">
              ({pendingItems.length} pending)
            </span>
          )}
        </h2>
      </div>

      {/* ── Add to queue form ── */}
      <div className="flex items-end gap-2 flex-wrap">
        <div className="flex-1 min-w-[120px]">
          <label className="block text-xs text-gray-500 mb-1">City</label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g. Las Vegas"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd()
            }}
            className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 placeholder:text-gray-600"
          />
        </div>
        <div className="w-20">
          <label className="block text-xs text-gray-500 mb-1">State</label>
          <select
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500"
          >
            <option value="">—</option>
            {US_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[100px] flex-1">
          <label className="block text-xs text-gray-500 mb-1">Category</label>
          <select
            value={categorySlug}
            onChange={(e) => setCategorySlug(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500"
          >
            <option value="">All</option>
            {categories.map((cat) => (
              <option key={cat.slug} value={cat.slug}>
                {cat.iconEmoji} {cat.name}
              </option>
            ))}
          </select>
        </div>
        <div className="w-20">
          <label className="block text-xs text-gray-500 mb-1">Per cat</label>
          <select
            value={resultsPerCategory}
            onChange={(e) => setResultsPerCategory(Number(e.target.value))}
            className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500"
          >
            {[1, 3, 5, 7, 10].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={adding || !city.trim() || !state}
          className="flex items-center gap-1.5 bg-gray-800 border border-gray-700 hover:border-yellow-500/50 text-gray-300 hover:text-yellow-300 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          {adding ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Plus className="w-3.5 h-3.5" />
          )}
          Add
        </button>
      </div>

      {/* ── Pending queue list (drag-and-drop) ── */}
      {pendingItems.length > 0 && (
        <div className="space-y-1.5">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={pendingItems.map((i) => i.id)}
              strategy={verticalListSortingStrategy}
            >
              {pendingItems.map((item) => (
                <SortableQueueItem
                  key={item.id}
                  item={item}
                  categories={categories}
                  onDelete={handleDelete}
                  onUpdate={handleUpdate}
                  deleting={deletingId === item.id}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      )}

      {/* ── Process button ── */}
      {pendingItems.length > 0 && (
        <button
          type="button"
          onClick={handleProcess}
          disabled={processing}
          className="flex items-center justify-center gap-2 w-full bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 font-semibold py-2.5 rounded-xl transition-colors text-sm"
        >
          {processing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing queue…
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Process Queue ({pendingItems.length}{' '}
              {pendingItems.length === 1 ? 'city' : 'cities'})
            </>
          )}
        </button>
      )}

      {/* ── Process results ── */}
      {processResults && processResults.results.length > 0 && (
        <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-3 space-y-1 text-xs">
          {processResults.results.map((r, i) => (
            <div key={i} className="flex items-center gap-2">
              {r.status === 'completed' ? (
                <span className="text-green-400">✓</span>
              ) : r.status === 'skipped' ? (
                <span className="text-yellow-400">⏸</span>
              ) : (
                <span className="text-red-400">✗</span>
              )}
              <span className="text-gray-300">
                {r.city}, {r.state}
              </span>
              {r.status === 'skipped' && (
                <span className="text-yellow-400/70">quota exhausted — will retry</span>
              )}
              {r.status === 'failed' && (
                <span className="text-red-400/70">{r.error}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Completed/failed items ── */}
      {completedItems.length > 0 && (
        <details className="group">
          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-300 transition-colors select-none">
            {completedItems.length} completed/failed
          </summary>
          <div className="mt-2 space-y-1">
            {completedItems.map((item) => (
              <div
                key={item.id}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs ${
                  item.status === 'completed'
                    ? 'text-green-400/70'
                    : 'text-red-400/70'
                }`}
              >
                {item.status === 'completed' ? '✓' : '✗'}
                <span>
                  {item.city}, {item.state}
                </span>
                {item.error && (
                  <span className="text-red-500/50 truncate">{item.error}</span>
                )}
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Empty state */}
      {pendingItems.length === 0 && completedItems.length === 0 && (
        <p className="text-xs text-gray-600 text-center py-2">
          Add cities above to build your search queue.
        </p>
      )}
    </div>
  )
}
