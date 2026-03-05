'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { X, Loader2, MessageSquare, Camera } from 'lucide-react'
import imageCompression from 'browser-image-compression'

type Props = {
  medalId: string
  restaurantName: string
  categoryName: string
  initialComment?: string
  initialPhotoUrl?: string | null
  onClose: () => void
  onSaved: (commentText: string, photoUrl?: string | null) => void
}

export function GoldCommentModal({ medalId, restaurantName, categoryName, initialComment, initialPhotoUrl, onClose, onSaved }: Props) {
  const [comment, setComment] = useState(initialComment ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(initialPhotoUrl ?? null)
  const [removePhoto, setRemovePhoto] = useState(false)
  const [compressing, setCompressing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (photoPreview?.startsWith('blob:')) URL.revokeObjectURL(photoPreview)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setCompressing(true)
    setError(null)
    try {
      const compressed = await imageCompression(file, {
        maxWidthOrHeight: 1200,
        maxSizeMB: 2,
        useWebWorker: true,
      })
      // Revoke old blob URL if there was one
      if (photoPreview?.startsWith('blob:')) URL.revokeObjectURL(photoPreview)
      setPhotoFile(compressed)
      setPhotoPreview(URL.createObjectURL(compressed))
      setRemovePhoto(false)
    } catch {
      setError('Failed to process image. Try a different photo.')
    } finally {
      setCompressing(false)
    }
  }

  const handleRemovePhoto = () => {
    setPhotoFile(null)
    if (photoPreview?.startsWith('blob:')) URL.revokeObjectURL(photoPreview)
    setPhotoPreview(null)
    setRemovePhoto(true)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async () => {
    const trimmed = comment.trim()
    if (!trimmed) return

    setSaving(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('medalId', medalId)
      formData.append('comment', trimmed)
      if (photoFile) formData.append('photo', photoFile)
      if (removePhoto) formData.append('removePhoto', 'true')

      const res = await fetch('/api/medals/comment', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to save comment')
        return
      }

      const data = await res.json()
      onSaved(trimmed, data.photoUrl ?? null)
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

        <p className="text-sm text-gray-600 mb-2">
          Why is <span className="font-semibold text-gray-800">{restaurantName}</span> your #1 pick?
          Share a menu item you recommend or what makes this place special.
        </p>

        {!initialComment && (
          <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-xl px-3 py-2 mb-4">
            <span className="text-base">+1</span>
            <p className="text-xs text-yellow-800">
              Sharing a comment adds <span className="font-bold">+1 bonus point</span> to {restaurantName}&apos;s Community Score!
            </p>
          </div>
        )}

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

        {/* Photo section */}
        <div className="mb-3">
          {photoPreview ? (
            <div className="relative inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoPreview}
                alt="Preview"
                className="rounded-lg object-cover border border-gray-200"
                style={{ maxHeight: 80, maxWidth: 120 }}
              />
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="absolute -top-2 -right-2 bg-white border border-gray-200 rounded-full p-0.5 shadow-sm hover:bg-red-50 transition-colors"
              >
                <X className="w-3.5 h-3.5 text-gray-500" />
              </button>
            </div>
          ) : (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileSelect}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={compressing}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-yellow-700 transition-colors disabled:opacity-50"
              >
                {compressing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4" />
                    Add photo
                  </>
                )}
              </button>
            </>
          )}
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
