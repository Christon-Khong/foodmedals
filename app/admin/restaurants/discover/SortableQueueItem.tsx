'use client'

import { useState, useRef } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Trash2, Loader2, CheckCircle, XCircle } from 'lucide-react'

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC',
]

export type QueueItem = {
  id: string
  city: string
  state: string
  resultsPerCategory: number
  categorySlug?: string | null
  sortOrder: number
  status: string
  error?: string | null
  discoveryBatchId?: string | null
  createdAt: string
  processedAt?: string | null
}

type CategoryOption = {
  slug: string
  name: string
  iconEmoji: string
}

type Props = {
  item: QueueItem
  categories?: CategoryOption[]
  onDelete: (id: string) => void
  onUpdate: (id: string, data: Partial<Pick<QueueItem, 'city' | 'state' | 'resultsPerCategory' | 'categorySlug'>>) => void
  deleting: boolean
}

export function SortableQueueItem({ item, categories = [], onDelete, onUpdate, deleting }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const [editingCity, setEditingCity] = useState(false)
  const [editingState, setEditingState] = useState(false)
  const [editingRpc, setEditingRpc] = useState(false)
  const [editingCat, setEditingCat] = useState(false)
  const [cityValue, setCityValue] = useState(item.city)
  const [stateValue, setStateValue] = useState(item.state)
  const [rpcValue, setRpcValue] = useState(item.resultsPerCategory)
  const [catValue, setCatValue] = useState(item.categorySlug ?? '')
  const cityRef = useRef<HTMLInputElement>(null)

  const isPending = item.status === 'pending'

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  }

  const saveCity = () => {
    setEditingCity(false)
    if (cityValue.trim() && cityValue.trim() !== item.city) {
      onUpdate(item.id, { city: cityValue.trim() })
    } else {
      setCityValue(item.city)
    }
  }

  const saveState = (val: string) => {
    setEditingState(false)
    setStateValue(val)
    if (val !== item.state) {
      onUpdate(item.id, { state: val })
    }
  }

  const saveRpc = (val: number) => {
    setEditingRpc(false)
    setRpcValue(val)
    if (val !== item.resultsPerCategory) {
      onUpdate(item.id, { resultsPerCategory: val })
    }
  }

  const saveCat = (val: string) => {
    setEditingCat(false)
    setCatValue(val)
    const newSlug = val || null
    if (newSlug !== (item.categorySlug ?? null)) {
      onUpdate(item.id, { categorySlug: newSlug })
    }
  }

  const catLabel = item.categorySlug
    ? categories.find(c => c.slug === item.categorySlug)
    : null

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 bg-gray-800/60 border rounded-xl px-3 py-2.5 group transition-colors ${
        isDragging
          ? 'border-yellow-500/50 shadow-lg'
          : item.status === 'failed'
            ? 'border-red-500/30'
            : item.status === 'completed'
              ? 'border-green-500/20'
              : 'border-gray-700/50'
      }`}
    >
      {/* Drag handle */}
      {isPending && (
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-600 hover:text-gray-400 shrink-0 touch-none"
        >
          <GripVertical className="w-4 h-4" />
        </button>
      )}
      {!isPending && <div className="w-4 shrink-0" />}

      {/* City — click to edit */}
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        {editingCity && isPending ? (
          <input
            ref={cityRef}
            type="text"
            value={cityValue}
            onChange={(e) => setCityValue(e.target.value)}
            onBlur={saveCity}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveCity()
              if (e.key === 'Escape') {
                setCityValue(item.city)
                setEditingCity(false)
              }
            }}
            autoFocus
            className="bg-gray-700 border border-gray-600 text-gray-100 rounded px-1.5 py-0.5 text-sm w-32 focus:outline-none focus:ring-1 focus:ring-yellow-500"
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              if (isPending) {
                setEditingCity(true)
                setCityValue(item.city)
              }
            }}
            className={`text-sm font-medium truncate ${
              isPending
                ? 'text-gray-200 hover:text-yellow-300 cursor-pointer'
                : 'text-gray-400 cursor-default'
            }`}
            title={isPending ? 'Click to edit' : undefined}
          >
            {item.city}
          </button>
        )}

        <span className="text-gray-600">,</span>

        {/* State — click to edit */}
        {editingState && isPending ? (
          <select
            value={stateValue}
            onChange={(e) => saveState(e.target.value)}
            onBlur={() => setEditingState(false)}
            autoFocus
            className="bg-gray-700 border border-gray-600 text-gray-100 rounded px-1 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500"
          >
            {US_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        ) : (
          <button
            type="button"
            onClick={() => {
              if (isPending) {
                setEditingState(true)
                setStateValue(item.state)
              }
            }}
            className={`text-sm font-medium ${
              isPending
                ? 'text-gray-200 hover:text-yellow-300 cursor-pointer'
                : 'text-gray-400 cursor-default'
            }`}
            title={isPending ? 'Click to edit' : undefined}
          >
            {item.state}
          </button>
        )}
      </div>

      {/* Category — click to edit */}
      {editingCat && isPending ? (
        <select
          value={catValue}
          onChange={(e) => saveCat(e.target.value)}
          onBlur={() => setEditingCat(false)}
          autoFocus
          className="bg-gray-700 border border-gray-600 text-gray-100 rounded px-1 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-yellow-500 max-w-[120px]"
        >
          <option value="">All</option>
          {categories.map((cat) => (
            <option key={cat.slug} value={cat.slug}>
              {cat.iconEmoji} {cat.name}
            </option>
          ))}
        </select>
      ) : (
        <button
          type="button"
          onClick={() => {
            if (isPending) {
              setEditingCat(true)
              setCatValue(item.categorySlug ?? '')
            }
          }}
          className={`text-[11px] px-1.5 py-0.5 rounded border shrink-0 truncate max-w-[100px] ${
            isPending
              ? 'bg-gray-800 border-gray-700 text-gray-500 hover:border-yellow-500/50 hover:text-yellow-300 cursor-pointer'
              : 'bg-gray-800/50 border-gray-700/50 text-gray-600 cursor-default'
          }`}
          title={isPending ? 'Click to edit category' : undefined}
        >
          {catLabel ? `${catLabel.iconEmoji} ${catLabel.name}` : 'All'}
        </button>
      )}

      {/* Results per category — click to edit */}
      {editingRpc && isPending ? (
        <select
          value={rpcValue}
          onChange={(e) => saveRpc(Number(e.target.value))}
          onBlur={() => setEditingRpc(false)}
          autoFocus
          className="bg-gray-700 border border-gray-600 text-gray-100 rounded px-1 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-yellow-500"
        >
          {[1, 3, 5, 7, 10].map((n) => (
            <option key={n} value={n}>
              {n}/cat
            </option>
          ))}
        </select>
      ) : (
        <button
          type="button"
          onClick={() => {
            if (isPending) {
              setEditingRpc(true)
              setRpcValue(item.resultsPerCategory)
            }
          }}
          className={`text-[11px] px-1.5 py-0.5 rounded border shrink-0 ${
            isPending
              ? 'bg-gray-800 border-gray-700 text-gray-500 hover:border-yellow-500/50 hover:text-yellow-300 cursor-pointer'
              : 'bg-gray-800/50 border-gray-700/50 text-gray-600 cursor-default'
          }`}
          title={isPending ? 'Click to edit' : undefined}
        >
          {item.resultsPerCategory}/cat
        </button>
      )}

      {/* Status indicator */}
      {item.status === 'processing' && (
        <Loader2 className="w-4 h-4 animate-spin text-yellow-400 shrink-0" />
      )}
      {item.status === 'completed' && (
        <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
      )}
      {item.status === 'failed' && (
        <span title={item.error ?? 'Failed'}>
          <XCircle className="w-4 h-4 text-red-400 shrink-0" />
        </span>
      )}

      {/* Delete button */}
      {isPending && (
        <button
          type="button"
          onClick={() => onDelete(item.id)}
          disabled={deleting}
          className="text-gray-600 hover:text-red-400 transition-colors shrink-0 opacity-0 group-hover:opacity-100 disabled:opacity-50"
          title="Remove from queue"
        >
          {deleting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Trash2 className="w-3.5 h-3.5" />
          )}
        </button>
      )}
    </div>
  )
}
