'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { CategoryIcon } from '@/components/CategoryIcon'
import { LayoutGrid, Map, Lock } from 'lucide-react'

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
}

type Props = {
  byCategory: Record<string, Medal[]>
  year: number
  isOwner: boolean
}

function MedalImage({ type, size }: { type: string; size: number }) {
  const src =
    type === 'gold'   ? '/medals/gold.png'   :
    type === 'silver' ? '/medals/silver.png' :
                        '/medals/bronze.png'
  return <Image src={src} alt={type} width={size} height={size} className="medal-hover cursor-pointer" />
}

function EmptyMedalSlot({ type }: { type: string }) {
  const label = type === 'silver' ? '2nd Place' : '3rd Place'
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

function CategoryCard({ catMedals, isOwner }: { catMedals: Medal[]; isOwner: boolean }) {
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
          <EmptyMedalSlot type="gold" />
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
            <EmptyMedalSlot type="silver" />
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
            <EmptyMedalSlot type="bronze" />
          )}
        </div>
      </div>
    </div>
  )
}

export function TrophyCaseGrid({ byCategory, year, isOwner }: Props) {
  const [view, setView] = useState<'grid' | 'map'>('grid')

  // Collect all map pins from medals with coordinates
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

    for (const catMedals of Object.values(byCategory)) {
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
  }, [byCategory])

  const hasMapPins = mapPins.length > 0

  return (
    <div>
      {/* Header with view toggle */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-gray-900">{year} Trophy Case</h2>
        {hasMapPins && (
          <div className="flex bg-white rounded-full border border-gray-200 p-0.5">
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

      {/* Grid View */}
      {view === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Object.entries(byCategory).map(([, catMedals]) => (
            <CategoryCard key={catMedals[0].foodCategory.id} catMedals={catMedals} isOwner={isOwner} />
          ))}
        </div>
      )}

      {/* Map View */}
      {view === 'map' && (
        <ProfileMapInner pins={mapPins} />
      )}
    </div>
  )
}
