'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { LeaderboardRow } from '@/lib/queries'

// ─── Medal config ────────────────────────────────────────────────────────────

const MEDAL_CONFIG = {
  1: {
    src:         '/medals/gold.webp',
    label:       '1st Place',
    blockHeight: 176,
    gradient:    'linear-gradient(160deg, #FFE566 0%, #FFD700 45%, #B8860B 100%)',
    shadowColor: '#8B6508',
    shineColor:  'rgba(255,255,255,0.55)',
    textColor:   '#78530A',
    auraGlow:    '0 0 18px 6px rgba(234,179,8,0.45), 0 0 36px 12px rgba(245,158,11,0.2)',
    auraGlowDim: '0 0 10px 4px rgba(234,179,8,0.2), 0 0 22px 8px rgba(245,158,11,0.08)',
  },
  2: {
    src:         '/medals/silver.webp',
    label:       '2nd Place',
    blockHeight: 128,
    gradient:    'linear-gradient(160deg, #E8E8E8 0%, #C0C0C0 45%, #808080 100%)',
    shadowColor: '#606060',
    shineColor:  'rgba(255,255,255,0.5)',
    textColor:   '#505050',
    auraGlow:    '0 0 14px 5px rgba(148,163,184,0.35), 0 0 28px 10px rgba(100,116,139,0.15)',
    auraGlowDim: '0 0 8px 3px rgba(148,163,184,0.15), 0 0 18px 6px rgba(100,116,139,0.06)',
  },
  3: {
    src:         '/medals/bronze.webp',
    label:       '3rd Place',
    blockHeight: 96,
    gradient:    'linear-gradient(160deg, #E8A060 0%, #CD7F32 45%, #7B4010 100%)',
    shadowColor: '#5C2E08',
    shineColor:  'rgba(255,255,255,0.3)',
    textColor:   '#5C2E08',
    auraGlow:    '0 0 12px 4px rgba(205,127,50,0.35), 0 0 24px 8px rgba(180,100,20,0.15)',
    auraGlowDim: '0 0 7px 3px rgba(205,127,50,0.15), 0 0 16px 5px rgba(180,100,20,0.06)',
  },
} as const

// ─── Count-up animation (native IntersectionObserver + rAF) ──────────────────

function CountUp({ target, delay = 0 }: { target: number; delay?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const hasAnimated = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el || hasAnimated.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || hasAnimated.current) return
        hasAnimated.current = true
        observer.disconnect()

        const delayMs = delay * 1000
        const timeout = setTimeout(() => {
          const duration = 1400
          const start = performance.now()
          const tick = (now: number) => {
            const progress = Math.min((now - start) / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            el.textContent = Math.round(eased * target).toString()
            if (progress < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
        }, delayMs)

        return () => clearTimeout(timeout)
      },
      { rootMargin: '-50px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [target, delay])

  return <span ref={ref}>0</span>
}

// ─── Single podium column ─────────────────────────────────────────────────────

type MedalType = 'gold' | 'silver' | 'bronze'
type UserMedals = Record<MedalType, string | null>

type BlockProps = {
  row:   LeaderboardRow
  place: 1 | 2 | 3
  delay: number
  isUserPick?: boolean
}

function PodiumColumn({ row, place, delay, isUserPick }: BlockProps) {
  const cfg = MEDAL_CONFIG[place]
  const infoDelayS = delay + 0.35
  const pickDelayS = delay + 0.9

  return (
    <div className="flex flex-col items-center">
      {/* ── Info card above the block ── */}
      <div
        className="text-center mb-3 px-1 w-[4.5rem] sm:w-36"
        style={{
          animation: `podium-fade-in 0.5s ease-out ${infoDelayS}s both`,
        }}
      >
        {/* medal image with aura glow */}
        <style>{`
          @keyframes podium-aura-${place} {
            0%, 100% { box-shadow: ${cfg.auraGlow}; }
            50% { box-shadow: ${cfg.auraGlowDim}; }
          }
        `}</style>
        <div
          className="mx-auto w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center mb-2"
          style={{ animation: `podium-aura-${place} 3s ease-in-out infinite` }}
        >
          <Image src={cfg.src} alt={cfg.label} width={place === 1 ? 40 : 32} height={place === 1 ? 40 : 32} className="drop-shadow-md" />
        </div>

        {/* restaurant name */}
        <Link
          href={`/restaurants/${row.restaurantSlug}`}
          className="block text-xs sm:text-sm font-extrabold text-gray-900 hover:text-yellow-700 leading-tight line-clamp-2 transition-colors font-[family-name:var(--font-lora)]"
        >
          {row.restaurantName}
        </Link>
        {row.city && (
          <p className="text-[10px] text-gray-400 leading-tight mt-0.5">
            {row.city}{row.state ? `, ${row.state}` : ''}
          </p>
        )}

        {/* Community Score */}
        <div className="mt-1">
          <p className="text-[11px] sm:text-xs text-gray-500 font-medium">
            <CountUp target={row.totalScore} delay={delay + 0.6} />
          </p>
          <p className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-gray-400 mt-0.5">
            Community Score
          </p>
        </div>

        {/* medal breakdown pills */}
        <div className="flex justify-center gap-0.5 mt-1 flex-wrap">
          {row.goldCount   > 0 && (
            <span className="text-[10px] bg-yellow-100 rounded px-1 inline-flex items-center gap-0.5">
              <Image src="/medals/gold.webp" alt="" width={10} height={10} />{row.goldCount}
            </span>
          )}
          {row.silverCount > 0 && (
            <span className="text-[10px] bg-gray-100 rounded px-1 inline-flex items-center gap-0.5">
              <Image src="/medals/silver.webp" alt="" width={10} height={10} />{row.silverCount}
            </span>
          )}
          {row.bronzeCount > 0 && (
            <span className="text-[10px] bg-orange-50 rounded px-1 inline-flex items-center gap-0.5">
              <Image src="/medals/bronze.webp" alt="" width={10} height={10} />{row.bronzeCount}
            </span>
          )}
        </div>

        {/* Your Pick badge */}
        {isUserPick && (
          <div
            className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-400 text-[10px] font-bold text-gray-900 shadow-sm"
            style={{
              animation: `podium-pop 0.3s ease-out ${pickDelayS}s both`,
            }}
          >
            <span>★</span> Your Pick
          </div>
        )}
      </div>

      {/* ── The podium block itself ── */}
      <div
        className="w-[3.75rem] sm:w-28 rounded-t-lg relative overflow-hidden"
        style={{
          height: cfg.blockHeight,
          background:  cfg.gradient,
          boxShadow:   `3px 6px 0 ${cfg.shadowColor}`,
          animation: `podium-rise 0.65s cubic-bezier(0.34, 1.2, 0.64, 1) ${delay}s both`,
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
      </div>
    </div>
  )
}

// ─── Empty placeholder slot ───────────────────────────────────────────────────

function EmptySlot({ place }: { place: 1 | 2 | 3 }) {
  const cfg = MEDAL_CONFIG[place]
  return (
    <div className="flex flex-col items-center opacity-30">
      <div className="w-[4.5rem] sm:w-32 text-center mb-3">
        <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-2">
          <Image src={cfg.src} alt={cfg.label} width={28} height={28} />
        </div>
        <p className="text-xs text-gray-400">—</p>
      </div>
      <div
        className="w-[3.75rem] sm:w-28 rounded-t-lg"
        style={{ height: cfg.blockHeight, background: cfg.gradient }}
      />
    </div>
  )
}

// ─── Main Podium export ───────────────────────────────────────────────────────

function isUserPickForRow(userMedals: UserMedals, restaurantId: string): boolean {
  return Object.values(userMedals).includes(restaurantId)
}

type PodiumProps = {
  rows: LeaderboardRow[]
  ranks?: number[]
  userMedals?: UserMedals
}

export function Podium({ rows, ranks, userMedals = { gold: null, silver: null, bronze: null } }: PodiumProps) {
  if (rows.length === 0) {
    return (
      <div className="text-center py-20 text-gray-400">
        <div className="text-6xl mb-4">🏆</div>
        <p className="text-xl font-semibold text-gray-500">No medals awarded yet</p>
        <p className="text-sm mt-2">Be the first to vote this year!</p>
      </div>
    )
  }

  // Group rows by rank (1, 2, 3)
  const groups: { place: 1 | 2 | 3; items: LeaderboardRow[] }[] = []
  for (let i = 0; i < rows.length; i++) {
    const rank = (ranks?.[i] ?? i + 1) as 1 | 2 | 3
    if (rank > 3) break
    const existing = groups.find(g => g.place === rank)
    if (existing) {
      existing.items.push(rows[i])
    } else {
      groups.push({ place: rank, items: [rows[i]] })
    }
  }

  const placeMap = new Map(groups.map(g => [g.place, g.items]))
  const gold   = placeMap.get(1) ?? []
  const silver = placeMap.get(2) ?? []
  const bronze = placeMap.get(3) ?? []

  const DELAY: Record<number, number> = { 1: 0, 2: 0.15, 3: 0.3 }

  function renderGroup(items: LeaderboardRow[], place: 1 | 2 | 3) {
    if (items.length === 0) return <EmptySlot place={place} />
    return (
      <div className="flex items-end gap-1 sm:gap-2">
        {items.map((row, idx) => (
          <PodiumColumn
            key={row.restaurantId}
            row={row}
            place={place}
            delay={DELAY[place] + idx * 0.08}
            isUserPick={isUserPickForRow(userMedals, row.restaurantId)}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="flex items-end justify-center gap-1.5 sm:gap-6 py-8 px-1 sm:px-4 overflow-x-auto">
      {renderGroup(silver, 2)}
      {renderGroup(gold, 1)}
      {renderGroup(bronze, 3)}
    </div>
  )
}
