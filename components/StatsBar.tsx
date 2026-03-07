'use client'

import { useEffect, useRef, useState } from 'react'

type Stats = {
  totalMedals: number
  totalRestaurants: number
  totalCategories: number
}

function AnimatedNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [display, setDisplay] = useState(0)
  const hasAnimated = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el || hasAnimated.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || hasAnimated.current) return
        hasAnimated.current = true
        observer.disconnect()

        const duration = 1200
        const start = performance.now()
        const animate = (now: number) => {
          const progress = Math.min((now - start) / duration, 1)
          // Ease-out cubic
          const eased = 1 - Math.pow(1 - progress, 3)
          setDisplay(Math.round(eased * value))
          if (progress < 1) requestAnimationFrame(animate)
        }
        requestAnimationFrame(animate)
      },
      { rootMargin: '-50px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [value])

  return (
    <span ref={ref}>
      {display.toLocaleString()}{suffix}
    </span>
  )
}

export function StatsBar({ stats }: { stats: Stats }) {
  const items = [
    { value: stats.totalMedals, label: 'Medals Awarded' },
    { value: stats.totalRestaurants, label: 'Curated Restaurants' },
    { value: stats.totalCategories, label: 'Food Categories' },
  ]

  return (
    <section className="bg-white/80 backdrop-blur-sm border-b border-amber-100">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-3 divide-x divide-amber-100">
          {items.map((item, i) => (
            <div
              key={item.label}
              className="flex flex-col items-center text-center px-2 animate-[fadeInUp_0.5s_ease_both]"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 font-heading tabular-nums mb-1">
                <AnimatedNumber value={item.value} />
              </span>
              <span className="text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
