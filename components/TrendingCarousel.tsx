'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { TrendingCategory } from '@/lib/queries'
import { CategoryIcon } from '@/components/CategoryIcon'
import { MapPin } from 'lucide-react'

const MEDAL_IMG = ['/medals/gold.webp', '/medals/silver.webp', '/medals/bronze.webp']
const MEDAL_ALT = ['1st', '2nd', '3rd']

const ROW_STYLE = [
  // Gold — larger, warm highlight
  { bg: 'bg-yellow-50/70', text: 'text-gray-900', size: 'text-sm', weight: 'font-extrabold', medal: 22, pts: 'text-yellow-700 font-bold' },
  // Silver — normal, subtle gray
  { bg: 'bg-gray-50/50', text: 'text-gray-700', size: 'text-[13px]', weight: 'font-bold', medal: 18, pts: 'text-gray-400 font-semibold' },
  // Bronze — normal, subtle amber
  { bg: 'bg-amber-50/40', text: 'text-gray-700', size: 'text-[13px]', weight: 'font-bold', medal: 18, pts: 'text-gray-400 font-semibold' },
]

type Props = { categories: TrendingCategory[]; year: number }

function CategoryCard({ cat, nearMe }: { cat: TrendingCategory; nearMe: boolean }) {
  const href = nearMe
    ? `/categories/${cat.categorySlug}?nearme=1`
    : `/categories/${cat.categorySlug}`

  // Pad to 3 slots so we can show placeholders
  const slots = [0, 1, 2]

  return (
    <Link
      href={href}
      data-card
      className="flex-shrink-0 w-[260px] sm:w-[280px] bg-white rounded-2xl border border-amber-100 hover:border-yellow-300 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 p-5 flex flex-col group"
    >
      {/* Category header */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl group-hover:scale-110 transition-transform duration-200 inline-block">
          <CategoryIcon slug={cat.categorySlug} iconEmoji={cat.iconEmoji} iconUrl={cat.iconUrl} />
        </span>
        <div className="min-w-0">
          <h3 className="font-bold text-gray-900 text-sm leading-tight truncate">
            {cat.categoryName}
          </h3>
        </div>
      </div>

      {/* Top restaurants with medal hierarchy */}
      <div className="space-y-1.5 flex-1">
        {slots.map(i => {
          const r = cat.topRestaurants[i]
          const style = ROW_STYLE[i]

          if (!r) {
            // Empty placeholder slot
            return (
              <div
                key={`empty-${i}`}
                className="flex items-center gap-2.5 rounded-lg border border-dashed border-gray-200 px-2 py-1.5"
              >
                <Image src={MEDAL_IMG[i]} alt={MEDAL_ALT[i]} width={style.medal} height={style.medal} className="flex-shrink-0 opacity-30" />
                <span className="text-xs text-gray-300 italic">+ Add your medals</span>
              </div>
            )
          }

          return (
            <div
              key={r.restaurantSlug}
              className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 ${style.bg}`}
            >
              <Image src={MEDAL_IMG[i]} alt={MEDAL_ALT[i]} width={style.medal} height={style.medal} className="flex-shrink-0" />
              <span className={`${style.size} ${style.text} ${style.weight} truncate flex-1`}>
                {r.restaurantName}
                {r.city && (
                  <span className="text-[11px] text-gray-400 font-normal ml-1">
                    {r.city}{r.state ? `, ${r.state}` : ''}
                  </span>
                )}
              </span>
              <span className={`text-xs ${style.pts} tabular-nums flex-shrink-0`}>
                {r.totalScore}
              </span>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-amber-100 text-xs font-semibold text-yellow-700 group-hover:text-yellow-800 transition-colors">
        See full standings &rarr;
      </div>
    </Link>
  )
}

export function TrendingCarousel({ categories, year }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const isResetting = useRef(false)
  const userInteracting = useRef(false)
  const resumeTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const [mounted, setMounted] = useState(false)

  // Location-aware state
  const [displayCategories, setDisplayCategories] = useState(categories)
  const [locationActive, setLocationActive] = useState(false)

  // On mount, try to get geolocation and fetch nearby trending
  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude: lat, longitude: lng } = pos.coords
          const res = await fetch(`/api/trending?lat=${lat}&lng=${lng}&radius=25&year=${year}`)
          if (res.ok) {
            const data: TrendingCategory[] = await res.json()
            if (data.length > 0) {
              setDisplayCategories(data)
              setLocationActive(true)
            }
          }
        } catch {
          // Keep global data on error
        }
      },
      () => {
        // Geolocation denied — keep global data
      },
      { timeout: 5000 },
    )
  }, [year])

  // Triple the items: [clone-set] [original-set] [clone-set]
  // so scrolling past either end wraps around seamlessly
  const items = [...displayCategories, ...displayCategories, ...displayCategories]
  const count = displayCategories.length

  // On mount (or when displayCategories change), scroll to the middle set
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

  // ── Auto-scroll: slow creep when user isn't interacting ──────────
  const pauseAutoScroll = useCallback(() => {
    userInteracting.current = true
    clearTimeout(resumeTimer.current)
  }, [])

  const scheduleResume = useCallback(() => {
    clearTimeout(resumeTimer.current)
    resumeTimer.current = setTimeout(() => {
      userInteracting.current = false
    }, 3000) // resume after 3 s idle
  }, [])

  useEffect(() => {
    if (!mounted) return
    const el = scrollRef.current
    if (!el) return

    // Auto-scroll ~1px every 30ms ≈ 33px/s
    const interval = setInterval(() => {
      if (userInteracting.current || isResetting.current) return
      el.scrollLeft += 1
    }, 30)

    // Pause on hover / touch
    const onEnter = () => pauseAutoScroll()
    const onLeave = () => scheduleResume()
    const onTouchStart = () => pauseAutoScroll()
    const onTouchEnd = () => scheduleResume()

    // Pause when user manually scrolls (wheel / drag)
    let scrollTimeout: ReturnType<typeof setTimeout>
    const onWheel = () => {
      pauseAutoScroll()
      clearTimeout(scrollTimeout)
      scrollTimeout = setTimeout(() => scheduleResume(), 150)
    }

    el.addEventListener('mouseenter', onEnter)
    el.addEventListener('mouseleave', onLeave)
    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchend', onTouchEnd)
    el.addEventListener('wheel', onWheel, { passive: true })

    return () => {
      clearInterval(interval)
      clearTimeout(resumeTimer.current)
      clearTimeout(scrollTimeout)
      el.removeEventListener('mouseenter', onEnter)
      el.removeEventListener('mouseleave', onLeave)
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchend', onTouchEnd)
      el.removeEventListener('wheel', onWheel)
    }
  }, [mounted, pauseAutoScroll, scheduleResume])

  function scroll(dir: 'left' | 'right') {
    pauseAutoScroll()
    const el = scrollRef.current
    if (!el) return
    const cardWidth = el.querySelector<HTMLElement>('[data-card]')?.offsetWidth ?? 280
    el.scrollBy({ left: dir === 'left' ? -cardWidth - 16 : cardWidth + 16, behavior: 'smooth' })
    scheduleResume()
  }

  if (categories.length === 0) return null

  return (
    <section className="pt-12 border-b border-amber-100 bg-amber-50">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Trending Rankings</h2>
            <p className="text-sm text-gray-500 mt-1">
              {locationActive ? (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-yellow-600" />
                  Near you · Click to see full standings
                </span>
              ) : (
                'Do you agree? Click to see full standings.'
              )}
            </p>
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
        className="flex gap-4 overflow-x-auto px-4 sm:px-[max(1rem,calc((100%-56rem)/2+1rem))] py-6"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
      >
        {items.map((cat, i) => (
          <CategoryCard key={`${cat.categoryId}-${i}`} cat={cat} nearMe={locationActive} />
        ))}
      </div>

      {/* Category count indicator */}
      <div className="text-center pb-5">
        <span className="text-xs text-gray-400">
          {count} categories · Scroll to explore
        </span>
      </div>
    </section>
  )
}
