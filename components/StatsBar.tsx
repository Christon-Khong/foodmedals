'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'

type Stats = {
  totalMedals: number
  totalRestaurants: number
  totalCategories: number
}

function AnimatedNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!inView) return
    const duration = 1200
    const steps = 40
    const increment = value / steps
    let current = 0
    let step = 0
    const timer = setInterval(() => {
      step++
      current = Math.min(Math.round(increment * step), value)
      setDisplay(current)
      if (step >= steps) clearInterval(timer)
    }, duration / steps)
    return () => clearInterval(timer)
  }, [inView, value])

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
          {items.map(item => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center text-center px-2"
            >
              <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 font-heading tabular-nums mb-1">
                <AnimatedNumber value={item.value} />
              </span>
              <span className="text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
                {item.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
