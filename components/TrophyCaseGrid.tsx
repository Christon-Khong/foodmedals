'use client'

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { CategoryIcon } from '@/components/CategoryIcon'
import { GoldCommentModal } from '@/components/GoldCommentModal'
import { LayoutGrid, Map, Lock, Search, X, Plus, TrendingUp, Quote, ThumbsUp, MessageSquare, Pencil } from 'lucide-react'

const ProfileMapInner = dynamic(() => import('./ProfileMapInner'), {
  ssr: false,
  loading: () => (
    <div className="rounded-xl border border-amber-200 bg-amber-50/50 flex items-center justify-center" style={{ height: 380 }}>
      <span className="text-sm text-gray-400">Loading map...</span>
    </div>
  ),
})

const MEDAL_ORDER: Record<string, number> = { gold: 0, silver: 1, bronze: 2 }
const MEDAL_LABELS: Record<string, string> = { gold: 'Winner', silver: '2nd Place', bronze: '3rd Place' }

type Medal = {
  id: string
  medalType: string
  restaurant: {
    name: string
    slug: string
    city: string | null
    state: string | null
    address: string | null
    lat: number | null
    lng: number | null
  }
  foodCategory: {
    id: string
    name: string
    slug: string
    iconEmoji: string
    iconUrl: string | null
    sortOrder: number
  }
  goldMedalComment?: {
    id: string
    comment: string
    photoUrl?: string | null
    _count: { upvotes: number }
  } | null
}

type UnrankedCategory = {
  id: string
  name: string
  slug: string
  iconEmoji: string
  iconUrl: string | null
  trendingCount?: number
}

type Props = {
  byCategory: Record<string, Medal[]>
  year: number
  isOwner: boolean
  totalCategories?: number
  rankedCount?: number
  unrankedCategories?: UnrankedCategory[]
  userCity?: string
}

function MedalImage({ type, size }: { type: string; size: number }) {
  const src =
    type === 'gold'   ? '/medals/gold.png'   :
    type === 'silver' ? '/medals/silver.png' :
                        '/medals/bronze.png'
  return <Image src={src} alt={type} width={size} height={size} className="medal-hover cursor-pointer" />
}

function EmptyMedalSlot({ type, awardHref }: { type: string; awardHref?: string }) {
  const label = type === 'gold' ? 'Winner' : type === 'silver' ? '2nd Place' : '3rd Place'

  if (awardHref) {
    return (
      <Link
        href={awardHref}
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-dashed border-yellow-300 bg-yellow-50/50 hover:bg-yellow-50 hover:border-yellow-400 transition-colors group"
      >
        <div className="w-7 h-7 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0 group-hover:bg-yellow-200 transition-colors">
          <Plus className="w-3.5 h-3.5 text-yellow-600" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-yellow-700 font-medium">{label}</p>
          <p className="text-[10px] text-yellow-500">Award a medal</p>
        </div>
      </Link>
    )
  }

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-dashed border-gray-200 bg-gray-50/50">
      <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
        <Lock className="w-3.5 h-3.5 text-gray-400" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400 font-medium">{label}</p>
        <p className="text-[10px] text-gray-300">Awaiting pick</p>
      </div>
    </div>
  )
}

function CategoryCard({ catMedals, isOwner, onOpenComment }: { catMedals: Medal[]; isOwner: boolean; onOpenComment?: (medalId: string, restaurantName: string, categoryName: string, existingComment?: string, existingPhotoUrl?: string | null) => void }) {
  const cat = catMedals[0].foodCategory
  const sorted = [...catMedals].sort(
    (a, b) => (MEDAL_ORDER[a.medalType] ?? 9) - (MEDAL_ORDER[b.medalType] ?? 9),
  )

  const gold = sorted.find(m => m.medalType === 'gold')
  const silver = sorted.find(m => m.medalType === 'silver')
  const bronze = sorted.find(m => m.medalType === 'bronze')

  return (
    <div
      id={`cat-${cat.slug}`}
      className="bg-white rounded-2xl border border-amber-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden scroll-mt-20"
    >
      {/* Category header — editorial serif */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-amber-50">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">
            <CategoryIcon slug={cat.slug} iconEmoji={cat.iconEmoji} iconUrl={cat.iconUrl} />
          </span>
          <Link
            href={`/categories/${cat.slug}`}
            className="category-label text-sm text-gray-800 hover:text-yellow-700 transition-colors"
          >
            {cat.name}
          </Link>
        </div>
        {isOwner && (
          <Link
            href={`/categories/${cat.slug}/award`}
            className="text-[11px] font-semibold text-yellow-700 hover:underline"
          >
            Change
          </Link>
        )}
      </div>

      <div className="p-4 space-y-2">
        {/* Gold — featured "Winner" row */}
        {gold ? (
          <Link
            href={`/restaurants/${gold.restaurant.slug}`}
            className="flex items-center gap-3 px-3 py-3 rounded-xl bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200/60 hover:border-yellow-300 transition-colors group"
          >
            <MedalImage type="gold" size={36} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-gray-900 truncate group-hover:text-yellow-700 transition-colors">
                {gold.restaurant.name}
              </p>
              <p className="text-[11px] text-gray-400">
                {gold.restaurant.city}{gold.restaurant.state ? `, ${gold.restaurant.state}` : ''}
              </p>
            </div>
            <span className="text-[10px] font-bold text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full border border-yellow-200 flex-shrink-0 uppercase tracking-wider">
              {MEDAL_LABELS.gold}
            </span>
          </Link>
        ) : (
          <EmptyMedalSlot type="gold" awardHref={isOwner ? `/categories/${cat.slug}/award` : undefined} />
        )}

        {/* Gold medal comment — subtle quote */}
        {gold?.goldMedalComment && (
          <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-50/50">
            <Quote className="w-3 h-3 text-yellow-500 flex-shrink-0 mt-0.5 rotate-180" />
            <p className="text-xs text-gray-600 leading-relaxed line-clamp-2 flex-1 italic">
              {gold.goldMedalComment.comment}
            </p>
            {gold.goldMedalComment._count.upvotes > 0 && (
              <span className="flex items-center gap-0.5 text-[10px] text-gray-400 flex-shrink-0">
                <ThumbsUp className="w-2.5 h-2.5" />
                {gold.goldMedalComment._count.upvotes}
              </span>
            )}
            {isOwner && onOpenComment && (
              <button
                onClick={() => onOpenComment(gold.id, gold.restaurant.name, cat.name, gold.goldMedalComment?.comment, gold.goldMedalComment?.photoUrl)}
                className="flex items-center gap-0.5 text-[10px] font-semibold text-yellow-700 hover:text-yellow-900 transition-colors flex-shrink-0"
                title="Edit comment"
              >
                <Pencil className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        )}

        {/* Owner: add comment prompt when gold has no comment */}
        {gold && !gold.goldMedalComment && isOwner && onOpenComment && (
          <button
            onClick={() => onOpenComment(gold.id, gold.restaurant.name, cat.name)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-yellow-50/50 border border-dashed border-yellow-200 hover:border-yellow-300 hover:bg-yellow-50 transition-colors w-full text-left"
          >
            <MessageSquare className="w-3 h-3 text-yellow-600 flex-shrink-0" />
            <span className="text-[11px] font-semibold text-yellow-700">Share why this is your #1 pick</span>
          </button>
        )}

        {/* Silver & Bronze — compact rows */}
        <div className="grid grid-cols-2 gap-2">
          {silver ? (
            <Link
              href={`/restaurants/${silver.restaurant.slug}`}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <MedalImage type="silver" size={26} />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-700 truncate group-hover:text-yellow-700 transition-colors">
                  {silver.restaurant.name}
                </p>
                <p className="text-[10px] text-gray-400">{silver.restaurant.city}</p>
              </div>
            </Link>
          ) : (
            <EmptyMedalSlot type="silver" awardHref={isOwner ? `/categories/${cat.slug}/award` : undefined} />
          )}

          {bronze ? (
            <Link
              href={`/restaurants/${bronze.restaurant.slug}`}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <MedalImage type="bronze" size={22} />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-700 truncate group-hover:text-yellow-700 transition-colors">
                  {bronze.restaurant.name}
                </p>
                <p className="text-[10px] text-gray-400">{bronze.restaurant.city}</p>
              </div>
            </Link>
          ) : (
            <EmptyMedalSlot type="bronze" awardHref={isOwner ? `/categories/${cat.slug}/award` : undefined} />
          )}
        </div>
      </div>
    </div>
  )
}

const TIER_THRESHOLDS = [
  { min: 80, label: 'Oracle' },
  { min: 60, label: 'Vanguard' },
  { min: 45, label: 'The Palate' },
  { min: 30, label: 'Grand Curator' },
  { min: 20, label: 'Master Critic' },
  { min: 12, label: 'Local Legend' },
  { min:  7, label: 'Silver Spoon' },
  { min:  4, label: 'Flavor Chaser' },
  { min:  2, label: 'Food Scout' },
  { min:  1, label: 'Taste Tester' },
]

function getNextTierInfo(rankedCount: number): { needed: number; tierName: string } | null {
  // Find the next tier above current count
  for (let i = TIER_THRESHOLDS.length - 1; i >= 0; i--) {
    if (rankedCount < TIER_THRESHOLDS[i].min) {
      return { needed: TIER_THRESHOLDS[i].min - rankedCount, tierName: TIER_THRESHOLDS[i].label }
    }
  }
  return null // already at max tier
}

function getCurrentTierLabel(rankedCount: number): string | null {
  for (const tier of TIER_THRESHOLDS) {
    if (rankedCount >= tier.min) return tier.label
  }
  return null
}

function CategoryProgressBar({ rankedCount, totalCategories }: { rankedCount: number; totalCategories: number }) {
  const pct = totalCategories > 0 ? Math.round((rankedCount / totalCategories) * 100) : 0
  const nextTier = getNextTierInfo(rankedCount)

  return (
    <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-5 mb-5">
      <div className="flex items-center justify-between mb-2.5">
        <p className="text-sm font-semibold text-gray-800">
          You&apos;ve ranked <span className="text-yellow-700">{rankedCount}</span> of {totalCategories} categories
        </p>
        <span className="text-xs font-bold text-yellow-700">{pct}%</span>
      </div>
      <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      {nextTier && (
        <p className="text-xs text-gray-500 mt-2">
          {nextTier.needed} more to reach <span className="font-semibold text-yellow-700">{nextTier.tierName}</span>
        </p>
      )}
      {!nextTier && rankedCount > 0 && (
        <p className="text-xs text-amber-700 font-medium mt-2">
          You&apos;ve reached Oracle — the highest rank!
        </p>
      )}
    </div>
  )
}

function TrendingUnrankedSection({ categories, userCity }: { categories: UnrankedCategory[]; userCity?: string }) {
  if (categories.length === 0) return null

  // Show trending (with counts) first, then remaining
  const trending = categories.filter(c => c.trendingCount && c.trendingCount > 0)
  const other = categories.filter(c => !c.trendingCount || c.trendingCount === 0)
  const sorted = [...trending, ...other].slice(0, 12)

  return (
    <div id="unranked-section" className="mt-8">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-yellow-600" />
        <h3 className="text-base font-bold text-gray-900">Categories you haven&apos;t ranked</h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {sorted.map(cat => (
          <Link
            key={cat.id}
            href={`/categories/${cat.slug}/award`}
            className="group bg-white rounded-xl border border-amber-100 hover:border-yellow-300 shadow-sm hover:shadow-md p-4 flex flex-col items-center text-center transition-all duration-200 hover:-translate-y-0.5"
          >
            <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">
              <CategoryIcon slug={cat.slug} iconEmoji={cat.iconEmoji} iconUrl={cat.iconUrl} />
            </span>
            <span className="text-xs font-semibold text-gray-700 leading-tight">{cat.name}</span>
            {cat.trendingCount && cat.trendingCount > 0 && userCity && (
              <span className="text-[10px] text-yellow-600 mt-1">
                {cat.trendingCount} medal{cat.trendingCount !== 1 ? 's' : ''} in {userCity}
              </span>
            )}
            <span className="text-[10px] font-semibold text-yellow-700 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              Start ranking →
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}

function SuggestCategoryCard() {
  return (
    <div className="mt-6 flex justify-center">
      <Link
        href="/suggest/category"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-gray-300 bg-white hover:border-yellow-400 hover:bg-yellow-50 text-sm font-semibold text-gray-600 hover:text-gray-900 shadow-sm hover:shadow transition-all"
      >
        <Plus className="w-4 h-4" />
        Suggest a Category
      </Link>
    </div>
  )
}

export function TrophyCaseGrid({ byCategory, year, isOwner, totalCategories, rankedCount, unrankedCategories, userCity }: Props) {
  const [view, setView] = useState<'grid' | 'map'>('grid')
  const [search, setSearch] = useState('')
  const [commentPrompt, setCommentPrompt] = useState<{
    medalId: string
    restaurantName: string
    categoryName: string
    initialComment?: string
    initialPhotoUrl?: string | null
  } | null>(null)

  // Track which medal IDs have had comments saved (for optimistic UI)
  const [savedCommentIds, setSavedCommentIds] = useState<Set<string>>(new Set())

  const handleOpenComment = useCallback((medalId: string, restaurantName: string, categoryName: string, existingComment?: string, existingPhotoUrl?: string | null) => {
    setCommentPrompt({ medalId, restaurantName, categoryName, initialComment: existingComment, initialPhotoUrl: existingPhotoUrl })
  }, [])

  // Filter categories by search query (category name, restaurant name, city, state)
  const filteredCategories = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return Object.entries(byCategory)
    return Object.entries(byCategory).filter(([, catMedals]) => {
      const cat = catMedals[0].foodCategory
      if (cat.name.toLowerCase().includes(q)) return true
      return catMedals.some(m => {
        if (m.restaurant.name.toLowerCase().includes(q)) return true
        if (m.restaurant.city?.toLowerCase().includes(q)) return true
        if (m.restaurant.state?.toLowerCase().includes(q)) return true
        return false
      })
    })
  }, [byCategory, search])

  // Collect map pins from filtered categories
  const mapPins = useMemo(() => {
    const pins: {
      id: string
      medalType: string
      restaurantName: string
      restaurantSlug: string
      categoryName: string
      iconEmoji: string
      city: string | null
      state: string | null
      address: string | null
      lat: number
      lng: number
    }[] = []

    for (const [, catMedals] of filteredCategories) {
      for (const m of catMedals) {
        if (m.restaurant.lat != null && m.restaurant.lng != null) {
          pins.push({
            id: m.id,
            medalType: m.medalType,
            restaurantName: m.restaurant.name,
            restaurantSlug: m.restaurant.slug,
            categoryName: m.foodCategory.name,
            iconEmoji: m.foodCategory.iconEmoji,
            city: m.restaurant.city,
            state: m.restaurant.state,
            address: m.restaurant.address,
            lat: m.restaurant.lat,
            lng: m.restaurant.lng,
          })
        }
      }
    }
    return pins
  }, [filteredCategories])

  const hasMapPins = mapPins.length > 0

  return (
    <div>
      {/* Header with search + view toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <h2 className="text-lg font-bold text-gray-900">{year} Trophy Case</h2>
        <div className="flex items-center gap-2">
          {/* Search box */}
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search categories, restaurants..."
              className="w-full sm:w-56 pl-8 pr-8 py-2 text-sm rounded-full border border-gray-200 bg-white text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {/* View toggle */}
          {hasMapPins && (
            <div className="flex bg-white rounded-full border border-gray-200 p-0.5 flex-shrink-0">
              <button
                onClick={() => setView('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  view === 'grid'
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Grid
              </button>
              <button
                onClick={() => setView('map')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  view === 'map'
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Map className="w-3.5 h-3.5" />
                Map
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Grid View */}
      {view === 'grid' && (
        filteredCategories.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-amber-100">
            <p className="text-sm text-gray-400">No matches for &ldquo;{search}&rdquo;</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredCategories.map(([, catMedals]) => (
              <CategoryCard
                key={catMedals[0].foodCategory.id}
                catMedals={catMedals}
                isOwner={isOwner}
                onOpenComment={isOwner ? handleOpenComment : undefined}
              />
            ))}
          </div>
        )
      )}

      {/* Map View */}
      {view === 'map' && (
        <ProfileMapInner pins={mapPins} />
      )}

      {/* Owner engagement features */}
      {isOwner && totalCategories != null && rankedCount != null && (
        <CategoryProgressBar rankedCount={rankedCount} totalCategories={totalCategories} />
      )}

      {isOwner && unrankedCategories && unrankedCategories.length > 0 && (
        <TrendingUnrankedSection categories={unrankedCategories} userCity={userCity} />
      )}

      {isOwner && (
        <SuggestCategoryCard />
      )}

      {/* Gold medal comment modal */}
      {commentPrompt && (
        <GoldCommentModal
          medalId={commentPrompt.medalId}
          restaurantName={commentPrompt.restaurantName}
          categoryName={commentPrompt.categoryName}
          initialComment={commentPrompt.initialComment}
          initialPhotoUrl={commentPrompt.initialPhotoUrl}
          onClose={() => setCommentPrompt(null)}
          onSaved={() => {
            setSavedCommentIds(prev => new Set(prev).add(commentPrompt.medalId))
            setCommentPrompt(null)
          }}
        />
      )}
    </div>
  )
}
