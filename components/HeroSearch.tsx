'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { CategoryIcon } from '@/components/CategoryIcon'

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

export function HeroSearch() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Results | null>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null)

  const close = useCallback(() => {
    setOpen(false)
    setQuery('')
    setResults(null)
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [close])

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

  return (
    <div ref={containerRef} className="relative w-full max-w-lg mx-auto">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search restaurants, categories, cities..."
          className="w-full pl-11 sm:pl-13 pr-10 py-3.5 sm:py-4 text-sm sm:text-base rounded-full bg-white/95 backdrop-blur-sm border border-white/50 shadow-lg text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/60 focus:bg-white transition-all"
        />
        {query ? (
          <button onClick={close} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        ) : (
          loading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-gray-300 border-t-yellow-400 rounded-full animate-spin" />
          )
        )}
      </div>

      {/* Results dropdown */}
      {open && (hasResults || noResults) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-amber-100 overflow-hidden z-50 max-h-[60vh] overflow-y-auto">
          {results!.categories.length > 0 && (
            <div>
              <div className="px-4 pt-3 pb-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Categories</div>
              {results!.categories.map(cat => (
                <button
                  key={cat.slug}
                  onClick={() => navigate(`/categories/${cat.slug}`)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-amber-50 transition-colors text-left"
                >
                  <span className="text-lg flex-shrink-0">
                    <CategoryIcon slug={cat.slug} iconEmoji={cat.iconEmoji} iconUrl={cat.iconUrl} />
                  </span>
                  <span className="font-medium">{cat.name}</span>
                </button>
              ))}
            </div>
          )}
          {results!.restaurants.length > 0 && (
            <div>
              <div className="px-4 pt-3 pb-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Restaurants</div>
              {results!.restaurants.map(r => (
                <button
                  key={r.slug}
                  onClick={() => navigate(`/restaurants/${r.slug}`)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-amber-50 transition-colors text-left"
                >
                  <span className="font-medium truncate flex-1">{r.name}</span>
                  <span className="text-xs text-gray-400 flex-shrink-0">{r.city}, {r.state}</span>
                </button>
              ))}
            </div>
          )}
          {noResults && (
            <div className="px-4 py-5 text-sm text-gray-400 text-center">No results found</div>
          )}
        </div>
      )}
    </div>
  )
}
