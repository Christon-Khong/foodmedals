'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { Camera, X, Check, Loader2 } from 'lucide-react'

type Props = {
  currentAvatarUrl: string | null
  displayName: string
}

function Initials({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  return (
    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-2xl font-bold text-white">
      {initials}
    </div>
  )
}

export function ProfileAvatarUpload({ currentAvatarUrl, displayName }: Props) {
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl)
  const [showCropModal, setShowCropModal] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Crop state
  const [imgNaturalSize, setImgNaturalSize] = useState({ w: 0, h: 0 })
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [scale, setScale] = useState(1)
  const [dragging, setDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [offsetStart, setOffsetStart] = useState({ x: 0, y: 0 })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const cropAreaRef = useRef<HTMLDivElement>(null)

  const CROP_SIZE = 256 // display size of the crop circle

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setError('Please select a PNG, JPEG, or WebP image.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5 MB.')
      return
    }

    setError(null)
    setSelectedFile(file)

    const reader = new FileReader()
    reader.onload = () => {
      setImageDataUrl(reader.result as string)
      setOffset({ x: 0, y: 0 })
      setScale(1)
      setShowCropModal(true)
    }
    reader.readAsDataURL(file)

    // Reset input so re-selecting same file triggers change
    e.target.value = ''
  }

  // When image loads in crop modal, compute initial scale so the image fills the crop circle
  const handleCropImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    const nw = img.naturalWidth
    const nh = img.naturalHeight
    setImgNaturalSize({ w: nw, h: nh })

    // Scale so the smaller dimension fills CROP_SIZE
    const fitScale = CROP_SIZE / Math.min(nw, nh)
    setScale(fitScale)
    // Center the image
    setOffset({
      x: (CROP_SIZE - nw * fitScale) / 2,
      y: (CROP_SIZE - nh * fitScale) / 2,
    })
  }, [])

  // Mouse/touch drag handlers
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    setDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
    setOffsetStart({ ...offset })
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [offset])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging) return
    const dx = e.clientX - dragStart.x
    const dy = e.clientY - dragStart.y
    setOffset({
      x: offsetStart.x + dx,
      y: offsetStart.y + dy,
    })
  }, [dragging, dragStart, offsetStart])

  const onPointerUp = useCallback(() => {
    setDragging(false)
  }, [])

  // Zoom with scroll wheel
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.95 : 1.05
    setScale(prev => {
      const minScale = CROP_SIZE / Math.max(imgNaturalSize.w, imgNaturalSize.h)
      const newScale = Math.max(minScale * 0.5, Math.min(prev * delta, 5))

      // Adjust offset to zoom toward center of crop area
      const cx = CROP_SIZE / 2
      const cy = CROP_SIZE / 2
      const ratio = newScale / prev
      setOffset(prevOffset => ({
        x: cx - (cx - prevOffset.x) * ratio,
        y: cy - (cy - prevOffset.y) * ratio,
      }))

      return newScale
    })
  }, [imgNaturalSize])

  // Handle zoom with pinch on touch devices
  useEffect(() => {
    const el = cropAreaRef.current
    if (!el) return
    const handler = (e: WheelEvent) => e.preventDefault()
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [showCropModal])

  const handleUpload = async () => {
    if (!selectedFile) return
    setUploading(true)
    setError(null)

    // Compute crop coordinates in natural image space
    const cropX = Math.round(-offset.x / scale)
    const cropY = Math.round(-offset.y / scale)
    const cropSizeNatural = Math.round(CROP_SIZE / scale)

    const formData = new FormData()
    formData.append('file', selectedFile)
    formData.append('cropX', String(cropX))
    formData.append('cropY', String(cropY))
    formData.append('cropSize', String(cropSizeNatural))

    try {
      const res = await fetch('/api/profile/upload-avatar', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Upload failed')
        return
      }

      const data = await res.json()
      setAvatarUrl(data.avatarUrl)
      setShowCropModal(false)
      setSelectedFile(null)
      setImageDataUrl(null)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      {/* Avatar with edit overlay */}
      <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={displayName}
            width={80}
            height={80}
            className="rounded-full shadow-lg"
          />
        ) : (
          <Initials name={displayName} />
        )}
        <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Camera className="w-5 h-5 text-white" />
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {/* Crop Modal */}
      {showCropModal && imageDataUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Position your photo</h3>
              <button
                onClick={() => { setShowCropModal(false); setSelectedFile(null); setImageDataUrl(null) }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-500 mb-4">
              Drag to reposition. Scroll to zoom.
            </p>

            {/* Crop area */}
            <div className="flex justify-center mb-4">
              <div
                ref={cropAreaRef}
                className="relative overflow-hidden rounded-full border-4 border-yellow-400 cursor-move select-none touch-none"
                style={{ width: CROP_SIZE, height: CROP_SIZE }}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onWheel={onWheel}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageDataUrl}
                  alt="Crop preview"
                  onLoad={handleCropImageLoad}
                  style={{
                    position: 'absolute',
                    left: offset.x,
                    top: offset.y,
                    width: imgNaturalSize.w * scale,
                    height: imgNaturalSize.h * scale,
                    maxWidth: 'none',
                    pointerEvents: 'none',
                    userSelect: 'none',
                  }}
                  draggable={false}
                />
              </div>
            </div>

            {/* Zoom slider */}
            <div className="flex items-center gap-3 mb-4 px-4">
              <span className="text-xs text-gray-400">-</span>
              <input
                type="range"
                min={0.1}
                max={3}
                step={0.01}
                value={scale / (CROP_SIZE / Math.min(imgNaturalSize.w || 1, imgNaturalSize.h || 1))}
                onChange={(e) => {
                  const baseScale = CROP_SIZE / Math.min(imgNaturalSize.w || 1, imgNaturalSize.h || 1)
                  const newScale = parseFloat(e.target.value) * baseScale

                  // Zoom toward center
                  const cx = CROP_SIZE / 2
                  const cy = CROP_SIZE / 2
                  const ratio = newScale / scale
                  setOffset(prev => ({
                    x: cx - (cx - prev.x) * ratio,
                    y: cy - (cy - prev.y) * ratio,
                  }))
                  setScale(newScale)
                }}
                className="flex-1 accent-yellow-500"
              />
              <span className="text-xs text-gray-400">+</span>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2 mb-3">{error}</p>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => { setShowCropModal(false); setSelectedFile(null); setImageDataUrl(null) }}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="flex-1 px-4 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-sm font-bold text-gray-900 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Save
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
