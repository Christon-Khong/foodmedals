'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { HeroImage } from '@/components/HeroImage'
import { CategoryIcon } from '@/components/CategoryIcon'
import { MapPin, Loader2 } from 'lucide-react'

type Category = { id: string; name: string; iconEmoji: string; iconUrl: string | null; slug: string }

export default function SuggestRestaurantPage() {
  const [form, setForm] = useState({
    name:        '',
    address:     '',
    city:        '',
    state:       '',
    zip:         '',
    websiteUrl:  '',
    description: '',
  })
  const [categoryIds,  setCategoryIds]  = useState<string[]>([])
  const [categories,   setCategories]   = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [done,    setDone]    = useState(false)
  const [mapsUrl, setMapsUrl] = useState('')
  const [parsing, setParsing] = useState(false)
  const [parseMsg, setParseMsg] = useState('')
  const [duplicateMatch, setDuplicateMatch] = useState<{
    name: string; slug: string; city: string; state: string; status: string
  } | null>(null)

  useEffect(() => {
    fetch('/api/categories/list')
      .then(r => r.json())
      .then(setCategories)
      .catch(() => {})
  }, [])

  function update(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm(prev => ({ ...prev, [field]: e.target.value }))
      if (field === 'name' || field === 'city') setDuplicateMatch(null)
    }
  }

  async function checkRestaurantDuplicate(name: string, city: string) {
    if (!name.trim() || !city.trim()) { setDuplicateMatch(null); return }
    try {
      const res = await fetch(`/api/restaurants/check-duplicate?name=${encodeURIComponent(name.trim())}&city=${encodeURIComponent(city.trim())}`)
      const data = await res.json()
      setDuplicateMatch(data.match)
    } catch { /* ignore */ }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (categoryIds.length === 0) {
      setError('Please select at least one category.')
      setLoading(false)
      return
    }

    const res = await fetch('/api/restaurants/suggest', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ ...form, categoryIds }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Something went wrong')
      setLoading(false)
    } else {
      setDone(true)
    }
  }

  async function handleParseMapsUrl() {
    if (!mapsUrl.trim()) return
    setParsing(true)
    setParseMsg('')
    try {
      const res = await fetch('/api/restaurants/parse-maps-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: mapsUrl.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setParseMsg(data.error ?? 'Could not parse URL')
      } else {
        const newName = data.name || form.name
        const newCity = data.city || form.city
        setForm(prev => ({
          ...prev,
          name:    data.name    || prev.name,
          address: data.address || prev.address,
          city:    data.city    || prev.city,
          state:   data.state   || prev.state,
          zip:     data.zip     || prev.zip,
        }))
        setParseMsg('Fields auto-filled — please verify and correct if needed.')
        checkRestaurantDuplicate(newName, newCity)
      }
    } catch {
      setParseMsg('Could not parse URL')
    } finally {
      setParsing(false)
    }
  }

  function toggleCategory(id: string) {
    setCategoryIds(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  if (done) {
    return (
      <div className="min-h-screen bg-amber-50">
        <Navbar />
        <HeroImage />
        <div className="max-w-md mx-auto px-4 py-24 text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Thanks for the suggestion!</h1>
          <p className="text-gray-500 text-sm mb-8">
            We&apos;ll review <strong>{form.name}</strong> and add it to the right categories soon.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/suggest/vote" className="px-5 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold rounded-full text-sm transition-colors">
              View Community Nominations
            </Link>
            <button
              onClick={() => { setDone(false); setForm({ name: '', address: '', city: '', state: '', zip: '', websiteUrl: '', description: '' }); setCategoryIds([]); setMapsUrl(''); setParseMsg('') }}
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
          <h1 className="text-2xl font-bold text-gray-900">Suggest a Restaurant</h1>
          <p className="text-sm text-gray-500 mt-1">
            Know a great spot that&apos;s not listed? Submit it for review.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-amber-100 shadow-sm p-6 space-y-4">
          {/* Google Maps URL autofill */}
          <div className="bg-blue-50 rounded-xl border border-blue-100 p-4">
            <label className="block text-sm font-medium text-blue-800 mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              Autofill from Google Maps
            </label>
            <p className="text-[11px] text-blue-500 mb-2">Paste a Google Maps link to auto-fill the restaurant details below.</p>
            <div className="flex gap-2">
              <input
                type="url"
                value={mapsUrl}
                onChange={e => { setMapsUrl(e.target.value); setParseMsg('') }}
                placeholder="https://maps.app.goo.gl/... or Google Maps URL"
                className="flex-1 min-w-0 border border-blue-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
              />
              <button
                type="button"
                onClick={handleParseMapsUrl}
                disabled={parsing || !mapsUrl.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition-colors disabled:opacity-50 flex items-center gap-1.5 flex-shrink-0"
              >
                {parsing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                {parsing ? 'Parsing…' : 'Autofill'}
              </button>
            </div>
            {parseMsg && (
              <p className={`text-xs mt-2 ${parseMsg.includes('auto-filled') ? 'text-green-600' : 'text-red-600'}`}>
                {parseMsg}
              </p>
            )}
          </div>

          {[
            { label: 'Restaurant name',    field: 'name',        type: 'text',  required: true,  placeholder: 'e.g. Crown Burgers' },
            { label: 'Street address',     field: 'address',     type: 'text',  required: true,  placeholder: '123 Main St' },
            { label: 'City',               field: 'city',        type: 'text',  required: true,  placeholder: 'e.g. Austin' },
            { label: 'State / Province',   field: 'state',       type: 'text',  required: true,  placeholder: 'e.g. TX' },
            { label: 'ZIP code',           field: 'zip',         type: 'text',  required: true,  placeholder: '84101' },
            { label: 'Website (optional)', field: 'websiteUrl',  type: 'url',   required: false, placeholder: 'https://...' },
          ].map(({ label, field, type, required, placeholder }) => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {label} {required && <span className="text-red-400">*</span>}
              </label>
              <input
                type={type}
                value={form[field as keyof typeof form]}
                onChange={update(field)}
                onBlur={(field === 'name' || field === 'city') ? () => checkRestaurantDuplicate(form.name, form.city) : undefined}
                required={required}
                placeholder={placeholder}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>
          ))}

          {/* Duplicate warning */}
          {duplicateMatch && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 space-y-2">
              <p className="text-sm text-amber-800">
                <strong>{duplicateMatch.name}</strong> in {duplicateMatch.city}, {duplicateMatch.state} already exists.
              </p>
              <div className="flex gap-3">
                <a
                  href={`/restaurants/${duplicateMatch.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-amber-700 hover:text-amber-900 underline"
                >
                  View restaurant →
                </a>
                <button
                  type="button"
                  onClick={() => setDuplicateMatch(null)}
                  className="text-xs font-medium text-gray-500 hover:text-gray-700"
                >
                  Submit anyway
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={form.description}
              onChange={update('description')}
              rows={3}
              placeholder="What makes this place special?"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none"
            />
          </div>

          {/* Category multi-select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categories <span className="text-red-400">*</span>
            </label>
            <p className="text-xs text-gray-400 mb-2">Select all food categories this restaurant is known for.</p>
            {categories.length === 0 ? (
              <p className="text-xs text-gray-400">Loading categories…</p>
            ) : (
              <div className="grid grid-cols-2 gap-1.5 max-h-52 overflow-y-auto border border-gray-200 rounded-xl p-3">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors text-left ${
                      categoryIds.includes(cat.id)
                        ? 'bg-yellow-400 text-gray-900'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span><CategoryIcon slug={cat.slug} iconEmoji={cat.iconEmoji} iconUrl={cat.iconUrl} /></span>
                    <span className="truncate">{cat.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? 'Submitting…' : 'Submit for review'}
          </button>
        </form>
      </div>
    </div>
  )
}
