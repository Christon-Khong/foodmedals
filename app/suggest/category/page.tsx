'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { HeroImage } from '@/components/HeroImage'

const POPULAR_EMOJIS = [
  '🍔', '🌮', '🍕', '🍟', '🍗', '🥗', '🍜', '🍣', '🥪', '🌯',
  '🥘', '🍝', '🥟', '🍱', '🧆', '🥙', '🍲', '🍛', '🥧', '🍰',
  '🧁', '🍩', '🍪', '🥐', '🥨', '🧇', '🥞', '🍦', '🍨', '🧋',
]

export default function SuggestCategoryPage() {
  const [name, setName] = useState('')
  const [iconEmoji, setIconEmoji] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!iconEmoji.trim()) {
      setError('Please pick an emoji icon for the category.')
      setLoading(false)
      return
    }

    const res = await fetch('/api/categories/suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, iconEmoji, description }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Something went wrong')
      setLoading(false)
    } else {
      setDone(true)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-amber-50">
        <Navbar />
        <HeroImage />
        <div className="max-w-md mx-auto px-4 py-24 text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Category suggested!</h1>
          <p className="text-gray-500 text-sm mb-8">
            <strong>{name}</strong> has been submitted. Once it reaches 50 community votes, it&apos;ll be automatically added to FoodMedals.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/suggest/vote" className="px-5 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold rounded-full text-sm transition-colors">
              View Community Nominations
            </Link>
            <button
              onClick={() => { setDone(false); setName(''); setIconEmoji(''); setDescription('') }}
              className="px-5 py-2.5 border border-gray-200 hover:border-yellow-300 text-gray-700 font-semibold rounded-full text-sm transition-colors"
            >
              Suggest another
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-amber-50">
      <Navbar />
      <HeroImage />

      <div className="max-w-lg mx-auto px-4 py-10">
        <div className="mb-8">
          <Link href="/categories" className="text-sm text-yellow-700 hover:underline mb-4 inline-block">
            ← Categories
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Suggest a Food Category</h1>
          <p className="text-sm text-gray-500 mt-1">
            Think we&apos;re missing a food category? Suggest one and let the community vote it in.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-amber-100 shadow-sm p-6 space-y-5">
          {/* Category name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              minLength={2}
              maxLength={60}
              placeholder="e.g. Birria Tacos"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>

          {/* Emoji picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Emoji icon <span className="text-red-400">*</span>
            </label>
            <p className="text-xs text-gray-400 mb-2">Pick an emoji that represents this food, or type your own.</p>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center text-2xl bg-gray-50">
                {iconEmoji || '?'}
              </div>
              <input
                type="text"
                value={iconEmoji}
                onChange={e => setIconEmoji(e.target.value)}
                placeholder="Paste or type emoji"
                maxLength={4}
                className="w-24 border border-gray-200 rounded-xl px-3 py-2 text-center text-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_EMOJIS.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIconEmoji(emoji)}
                  className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-colors ${
                    iconEmoji === emoji
                      ? 'bg-yellow-400 ring-2 ring-yellow-500'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              maxLength={200}
              placeholder="What makes this category unique?"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none"
            />
          </div>

          {/* Threshold info */}
          <div className="bg-amber-50 rounded-xl border border-amber-100 p-3">
            <p className="text-xs text-amber-700">
              <strong>How it works:</strong> Your suggestion will appear on the Community Nominations page.
              Once it reaches 50 upvotes from the community, it&apos;ll be automatically added as a new food category.
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? 'Submitting…' : 'Submit for community vote'}
          </button>
        </form>
      </div>
    </div>
  )
}
