'use client'

import { motion, useInView, animate } from 'framer-motion'
import { useEffect, useRef } from 'react'
import Link from 'next/link'
import type { LeaderboardRow } from '@/lib/queries'

// ─── Medal config ────────────────────────────────────────────────────────────

const MEDAL_CONFIG = {
  1: {
    emoji:       '🥇',
    label:       '1st Place',
    blockHeight: 176,
    gradient:    'linear-gradient(160deg, #FFE566 0%, #FFD700 45%, #B8860B 100%)',
    shadowColor: '#8B6508',
    shineColor:  'rgba(255,255,255,0.55)',
    textColor:   '#78530A',
    badgeBg:     'bg-yellow-400',
    ringColor:   'ring-yellow-500',
  },
  2: {
    emoji:       '🥈',
    label:       '2nd Place',
    blockHeight: 128,
    gradient:    'linear-gradient(160deg, #E8E8E8 0%, #C0C0C0 45%, #808080 100%)',
    shadowColor: '#606060',
    shineColor:  'rgba(255,255,255,0.5)',
    textColor:   '#505050',
    badgeBg:     'bg-gray-300',
    ringColor:   'ring-gray-400',
  },
  3: {
    emoji:       '🥉',
    label:       '3rd Place',
    blockHeight: 96,
    gradient:    'linear-gradient(160deg, #E8A060 0%, #CD7F32 45%, #7B4010 100%)',
    shadowColor: '#5C2E08',
    shineColor:  'rgba(255,255,255,0.3)',
    textColor:   '#5C2E08',
    badgeBg:     'bg-amber-600',
    ringColor:   'ring-amber-700',
  },
} as const

// ─── Count-up animation ───────────────────────────────────────────────────────

function CountUp({ target, delay = 0 }: { target: number; delay?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (!isInView || !ref.current) return
    const node = ref.current
    const controls = animate(0, target, {
      duration: 1.4,
      delay,
      ease: 'easeOut',
      onUpdate(v) { node.textContent = Math.round(v).toString() },
    })
    return () => controls.stop()
  }, [isInView, target, delay])

  return <span ref={ref}>0</span>
}

// ─── Single podium column ─────────────────────────────────────────────────────

type BlockProps = {
  row:   LeaderboardRow
  place: 1 | 2 | 3
  delay: number
}

function PodiumColumn({ row, place, delay }: BlockProps) {
  const cfg = MEDAL_CONFIG[place]

  return (
    <div className="flex flex-col items-center">
      {/* ── Info card above the block ── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: delay + 0.35, duration: 0.5, ease: 'easeOut' }}
        className="text-center mb-3 px-1 w-24 sm:w-32"
      >
        {/* medal emoji */}
        <div
          className={`mx-auto w-10 h-10 sm:w-12 sm:h-12 rounded-full ${cfg.badgeBg} ring-2 ${cfg.ringColor} flex items-center justify-center text-xl sm:text-2xl shadow-md mb-2`}
        >
          {cfg.emoji}
        </div>

        {/* restaurant name */}
        <Link
          href={`/restaurants/${row.restaurantSlug}`}
          className="block text-[11px] sm:text-xs font-bold text-gray-800 hover:text-yellow-700 leading-tight line-clamp-2 transition-colors"
        >
          {row.restaurantName}
        </Link>

        {/* score */}
        <p className="text-[11px] sm:text-xs text-gray-500 mt-1 font-medium">
          <CountUp target={row.totalScore} delay={delay + 0.6} /> pts
        </p>

        {/* medal breakdown pills */}
        <div className="flex justify-center gap-0.5 mt-1 flex-wrap">
          {row.goldCount   > 0 && <span className="text-[10px] bg-yellow-100 rounded px-1">🥇{row.goldCount}</span>}
          {row.silverCount > 0 && <span className="text-[10px] bg-gray-100  rounded px-1">🥈{row.silverCount}</span>}
          {row.bronzeCount > 0 && <span className="text-[10px] bg-orange-50 rounded px-1">🥉{row.bronzeCount}</span>}
        </div>
      </motion.div>

      {/* ── The podium block itself ── */}
      <motion.div
        initial={{ height: 0 }}
        animate={{ height: cfg.blockHeight }}
        transition={{ delay, duration: 0.65, ease: [0.34, 1.2, 0.64, 1] }}
        className="w-20 sm:w-28 rounded-t-lg relative overflow-hidden"
        style={{
          background:  cfg.gradient,
          boxShadow:   `3px 6px 0 ${cfg.shadowColor}`,
        }}
      >
        {/* shine strip across top */}
        <div
          className="absolute top-0 left-0 right-0 h-3 rounded-t-lg"
          style={{ background: `linear-gradient(180deg, ${cfg.shineColor} 0%, transparent 100%)` }}
        />
        {/* rank watermark */}
        <div
          className="absolute inset-0 flex items-center justify-center select-none"
          style={{ color: cfg.shineColor, fontSize: 64, fontWeight: 900, lineHeight: 1 }}
        >
          {place}
        </div>
      </motion.div>
    </div>
  )
}

// ─── Empty placeholder slot ───────────────────────────────────────────────────

function EmptySlot({ place }: { place: 1 | 2 | 3 }) {
  const cfg = MEDAL_CONFIG[place]
  return (
    <div className="flex flex-col items-center opacity-30">
      <div className="w-24 sm:w-32 text-center mb-3">
        <div className={`mx-auto w-10 h-10 rounded-full ${cfg.badgeBg} ring-2 ${cfg.ringColor} flex items-center justify-center text-xl shadow-md mb-2`}>
          {cfg.emoji}
        </div>
        <p className="text-xs text-gray-400">—</p>
      </div>
      <div
        className="w-20 sm:w-28 rounded-t-lg"
        style={{ height: cfg.blockHeight, background: cfg.gradient }}
      />
    </div>
  )
}

// ─── Main Podium export ───────────────────────────────────────────────────────

export function Podium({ rows }: { rows: LeaderboardRow[] }) {
  const [first, second, third] = rows

  if (rows.length === 0) {
    return (
      <div className="text-center py-20 text-gray-400">
        <div className="text-6xl mb-4">🏆</div>
        <p className="text-xl font-semibold text-gray-500">No medals awarded yet</p>
        <p className="text-sm mt-2">Be the first to vote this year!</p>
      </div>
    )
  }

  return (
    <div className="flex items-end justify-center gap-3 sm:gap-6 py-8 px-4">
      {/* Silver — left */}
      {second
        ? <PodiumColumn row={second} place={2} delay={0.15} />
        : <EmptySlot place={2} />
      }

      {/* Gold — centre (tallest) */}
      {first
        ? <PodiumColumn row={first} place={1} delay={0} />
        : <EmptySlot place={1} />
      }

      {/* Bronze — right */}
      {third
        ? <PodiumColumn row={third} place={3} delay={0.3} />
        : <EmptySlot place={3} />
      }
    </div>
  )
}
