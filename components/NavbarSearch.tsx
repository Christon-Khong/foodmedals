'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { CategoryIcon } from '@/components/CategoryIcon'
import { useModalBack } from '@/lib/useModalBack'

type Restaurant = {
  slug: string
  name: string
  city: string
  state: string
}

type Category = {
  slug: string
  name: string
  iconEmoji: string
  iconUrl: string | null
}

type Results = {
  restaurants: Restaurant[]
  categories: Category[]
}

export function NavbarSearch() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Results | null>(null)
  const [open, setOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const mobileInputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null)

  const close = useCallback(() => {
    setOpen(false)
    setMobileOpen(false)
    setQuery('')
    setResults(null)
  }, [])

  useModalBack(mobileOpen, close)

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [close])

  // Close on route change
  useEffect(() => {
    close()
  }, [])

  function handleChange(value: string) {
    setQuery(value)
    if (timerRef.current) clearTimeout(timerRef.current)

    if (value.trim().length < 2) {
      setResults(null)
      setOpen(false)
      return
    }

    setLoading(true)
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(value.trim())}`)
        if (res.ok) {
          const data = await res.json()
          setResults(data)
          setOpen(true)
        }
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }, 300)
  }

  function navigate(href: string) {
    close()
    router.push(href)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') close()
  }

  const hasResults = results && (results.restaurants.length > 0 || results.categories.length > 0)
  const noResults = results && results.restaurants.length === 0 && results.categories.length === 0 && query.trim().length >= 2

  const dropdown = open && (hasResults || noResults) ? (
    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-amber-100 rounded-xl shadow-lg overflow-hidden z-50 max-h-[70vh] overflow-y-auto">
      {results!.categories.length > 0 && (
        <div>
          <div className="px-3 pt-2.5 pb-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Categories</div>
          {results!.categories.map(cat => (
            <button
              key={cat.slug}
              onClick={() => navigate(`/categories/${cat.slug}`)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-amber-50 transition-colors text-left"
            >
              <span className="text-base flex-shrink-0">
                <CategoryIcon slug={cat.slug} iconEmoji={cat.iconEmoji} iconUrl={cat.iconUrl} />
              </span>
              <span className="truncate">{cat.name}</span>
            </button>
          ))}
        </div>
      )}
      {results!.restaurants.length > 0 && (
        <div>
          <div className="px-3 pt-2.5 pb-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Restaurants</div>
          {results!.restaurants.map(r => (
            <button
              key={r.slug}
              onClick={() => navigate(`/restaurants/${r.slug}`)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-amber-50 transition-colors text-left"
            >
              <span className="truncate flex-1">{r.name}</span>
              <span className="text-xs text-gray-400 flex-shrink-0">{r.city}, {r.state}</span>
            </button>
          ))}
        </div>
      )}
      {noResults && (
        <div className="px-3 py-4 text-sm text-gray-400 text-center">No results found</div>
      )}
    </div>
  ) : null

  return (
    <div ref={containerRef} className="relative">
      {/* Desktop search */}
      <div className="hidden sm:block relative">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search..."
            className="w-44 focus:w-60 transition-all pl-8 pr-3 py-1.5 text-sm rounded-lg border border-gray-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-200 bg-gray-50 focus:bg-white text-gray-900 placeholder:text-gray-400"
          />
          {query && (
            <button onClick={close} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {dropdown}
      </div>

      {/* Mobile search icon + overlay */}
      <div className="sm:hidden">
        <button
          onClick={() => { setMobileOpen(true); setTimeout(() => mobileInputRef.current?.focus(), 100) }}
          className="p-2 rounded-lg hover:bg-amber-50 transition-colors"
          aria-label="Search"
        >
          <Search className="w-5 h-5 text-gray-700" />
        </button>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 bg-white">
            <div className="flex items-center gap-2 px-4 h-14 border-b border-amber-100">
              <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input
                ref={mobileInputRef}
                type="text"
                value={query}
                onChange={e => handleChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search restaurants, categories, cities..."
                className="flex-1 text-sm py-2 outline-none bg-transparent text-gray-900 placeholder:text-gray-400"
                autoFocus
              />
              <button onClick={close} className="p-1.5 text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(100vh-3.5rem)]">
              {results?.categories && results.categories.length > 0 && (
                <div>
                  <div className="px-4 pt-3 pb-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Categories</div>
                  {results.categories.map(cat => (
                    <button
                      key={cat.slug}
                      onClick={() => navigate(`/categories/${cat.slug}`)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-amber-50 transition-colors text-left"
                    >
                      <span className="text-lg flex-shrink-0">
                        <CategoryIcon slug={cat.slug} iconEmoji={cat.iconEmoji} iconUrl={cat.iconUrl} />
                      </span>
                      <span className="truncate">{cat.name}</span>
                    </button>
                  ))}
                </div>
              )}
              {results?.restaurants && results.restaurants.length > 0 && (
                <div>
                  <div className="px-4 pt-3 pb-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Restaurants</div>
                  {results.restaurants.map(r => (
                    <button
                      key={r.slug}
                      onClick={() => navigate(`/restaurants/${r.slug}`)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-amber-50 transition-colors text-left"
                    >
                      <span className="truncate flex-1">{r.name}</span>
                      <span className="text-xs text-gray-400 flex-shrink-0">{r.city}, {r.state}</span>
                    </button>
                  ))}
                </div>
              )}
              {noResults && (
                <div className="px-4 py-8 text-sm text-gray-400 text-center">No results found</div>
              )}
              {!results && query.length < 2 && (
                <div className="px-4 py-8 text-sm text-gray-400 text-center">Type to search...</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
