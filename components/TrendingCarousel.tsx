'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { TrendingCategory } from '@/lib/queries'

const MEDAL_IMG = ['/medals/gold.png', '/medals/silver.png', '/medals/bronze.png']

type Props = { categories: TrendingCategory[] }

function CategoryCard({ cat }: { cat: TrendingCategory }) {
  return (
    <Link
      href={`/categories/${cat.categorySlug}`}
      data-card
      className="flex-shrink-0 w-[260px] sm:w-[280px] bg-amber-50/60 rounded-2xl border border-amber-100 hover:border-yellow-300 hover:shadow-md transition-all duration-200 p-5 flex flex-col group"
      style={{ scrollSnapAlign: 'start' }}
    >
      {/* Category header */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl group-hover:scale-110 transition-transform duration-200 inline-block">
          {cat.iconEmoji}
        </span>
        <div className="min-w-0">
          <h3 className="font-bold text-gray-900 text-sm leading-tight truncate">
            {cat.categoryName}
          </h3>
          <span className="text-[11px] text-gray-400 uppercase tracking-wide font-semibold">
            Top {cat.topRestaurants.length}
          </span>
        </div>
      </div>

      {/* Top restaurants */}
      <div className="space-y-2.5 flex-1">
        {cat.topRestaurants.map((r, i) => (
          <div key={r.restaurantSlug} className="flex items-center gap-2.5">
            <Image
              src={MEDAL_IMG[i]}
              alt={['1st', '2nd', '3rd'][i]}
              width={20}
              height={20}
              className="flex-shrink-0"
            />
            <span className="text-sm text-gray-800 font-medium truncate flex-1">
              {r.restaurantName}
            </span>
            <span className="text-xs text-gray-400 font-semibold tabular-nums flex-shrink-0">
              {r.totalScore} pts
            </span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-amber-100 text-xs font-semibold text-yellow-700 group-hover:text-yellow-800 transition-colors">
        See full standings &rarr;
      </div>
    </Link>
  )
}

export function TrendingCarousel({ categories }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const isResetting = useRef(false)
  const [mounted, setMounted] = useState(false)

  // Triple the items: [clone-set] [original-set] [clone-set]
  // so scrolling past either end wraps around seamlessly
  const items = [...categories, ...categories, ...categories]
  const count = categories.length

  // On mount, scroll to the middle set (the "real" items)
  useEffect(() => {
    const el = scrollRef.current
    if (!el || count === 0) return
    const card = el.querySelector<HTMLElement>('[data-card]')
    if (!card) return
    const cardWidth = card.offsetWidth + 16 // card + gap
    el.scrollLeft = cardWidth * count
    setMounted(true)
  }, [count])

  // When user scrolls near either boundary, silently jump to the equivalent position in the middle set
  const handleScroll = useCallback(() => {
    if (isResetting.current) return
    const el = scrollRef.current
    if (!el || count === 0) return

    const card = el.querySelector<HTMLElement>('[data-card]')
    if (!card) return
    const cardWidth = card.offsetWidth + 16
    const setWidth = cardWidth * count

    // If scrolled into the first clone set (too far left)
    if (el.scrollLeft < cardWidth * 0.5) {
      isResetting.current = true
      el.style.scrollBehavior = 'auto'
      el.scrollLeft += setWidth
      el.style.scrollBehavior = ''
      requestAnimationFrame(() => { isResetting.current = false })
    }
    // If scrolled into the last clone set (too far right)
    else if (el.scrollLeft > setWidth * 2 - cardWidth * 0.5) {
      isResetting.current = true
      el.style.scrollBehavior = 'auto'
      el.scrollLeft -= setWidth
      el.style.scrollBehavior = ''
      requestAnimationFrame(() => { isResetting.current = false })
    }
  }, [count])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scroll', handleScroll, { passive: true })
    return () => el.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  function scroll(dir: 'left' | 'right') {
    const el = scrollRef.current
    if (!el) return
    const cardWidth = el.querySelector<HTMLElement>('[data-card]')?.offsetWidth ?? 280
    el.scrollBy({ left: dir === 'left' ? -cardWidth - 16 : cardWidth + 16, behavior: 'smooth' })
  }

  if (categories.length === 0) return null

  return (
    <section className="py-12 border-b border-amber-100 bg-white">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Trending Rankings</h2>
            <p className="text-sm text-gray-500 mt-1">Do you agree? Click to see full standings.</p>
          </div>

          {/* Desktop scroll arrows */}
          <div className="hidden sm:flex gap-2">
            <button
              onClick={() => scroll('left')}
              className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-amber-50 hover:border-yellow-300 transition-colors"
              aria-label="Scroll left"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <button
              onClick={() => scroll('right')}
              className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-amber-50 hover:border-yellow-300 transition-colors"
              aria-label="Scroll right"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable track — tripled for infinite loop */}
      <div
        ref={scrollRef}
        className={`flex gap-4 overflow-x-auto px-4 sm:px-[max(1rem,calc((100%-56rem)/2+1rem))] pb-2 ${mounted ? 'scroll-smooth' : ''}`}
        style={{ scrollSnapType: 'x mandatory', scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
      >
        {items.map((cat, i) => (
          <CategoryCard key={`${cat.categoryId}-${i}`} cat={cat} />
        ))}
      </div>
    </section>
  )
}
