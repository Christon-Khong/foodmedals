'use client'

import { useState } from 'react'
import Image from 'next/image'
import { X, Loader2, MessageSquare } from 'lucide-react'

type Props = {
  medalId: string
  restaurantName: string
  categoryName: string
  initialComment?: string
  onClose: () => void
  onSaved: () => void
}

export function GoldCommentModal({ medalId, restaurantName, categoryName, initialComment, onClose, onSaved }: Props) {
  const [comment, setComment] = useState(initialComment ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    const trimmed = comment.trim()
    if (!trimmed) return

    setSaving(true)
    setError(null)

    try {
      const res = await fetch('/api/medals/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ medalId, comment: trimmed }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to save comment')
        return
      }

      onSaved()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in slide-in-from-bottom sm:animate-none">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
              <Image src="/medals/gold.png" alt="Gold" width={24} height={24} />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Share your pick!</h3>
              <p className="text-xs text-gray-500">{categoryName}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Why is <span className="font-semibold text-gray-800">{restaurantName}</span> your #1 pick?
          Share a menu item you recommend or what makes this place special.
        </p>

        {/* Textarea */}
        <div className="relative mb-3">
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="Their smash burger with the house sauce is unreal — crispy edges, perfectly seasoned..."
            className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent resize-none"
          />
          <span className="absolute bottom-2 right-3 text-[10px] text-gray-400">
            {comment.length}/500
          </span>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2 mb-3">{error}</p>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
          >
            Skip
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !comment.trim()}
            className="flex-1 px-4 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-sm font-bold text-gray-900 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <MessageSquare className="w-4 h-4" />
                Share
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
