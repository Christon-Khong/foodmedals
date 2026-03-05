'use client'

import { useState } from 'react'

type Props = {
  restaurantId: string
  isLoggedIn: boolean
  hasReported: boolean
}

export function ReportAddressButton({ restaurantId, isLoggedIn, hasReported }: Props) {
  const [open, setOpen] = useState(false)
  const [googleMapsUrl, setGoogleMapsUrl] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(hasReported)

  if (!isLoggedIn) return null

  if (submitted) {
    return (
      <span className="text-xs text-gray-400 italic">You&apos;ve reported this address</span>
    )
  }

  async function handleSubmit() {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/restaurants/${restaurantId}/report-address`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          googleMapsUrl: googleMapsUrl.trim() || undefined,
          note: note.trim() || undefined,
        }),
      })
      if (res.ok) {
        setSubmitted(true)
        setOpen(false)
      }
    } catch { /* ignore */ } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className="text-xs text-gray-400 hover:text-red-500 transition-colors"
      >
        Report wrong address
      </button>

      {open && (
        <div className="mt-2 bg-red-50 border border-red-100 rounded-xl p-4 space-y-3 max-w-md">
          <p className="text-xs text-red-700 font-medium">
            Help us fix this! Provide the correct Google Maps link or describe the issue.
          </p>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Google Maps URL <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="url"
              value={googleMapsUrl}
              onChange={e => setGoogleMapsUrl(e.target.value)}
              placeholder="https://maps.app.goo.gl/..."
              className="w-full border border-red-200 rounded-lg px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-300 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Note <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              maxLength={200}
              rows={2}
              placeholder="What's wrong with the current address?"
              className="w-full border border-red-200 rounded-lg px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-300 bg-white resize-none"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="px-4 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {submitting ? 'Submitting…' : 'Submit Report'}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
