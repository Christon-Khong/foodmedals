'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { CategoryIcon } from '@/components/CategoryIcon'
import { CrownJewelSelector } from '@/components/CrownJewelSelector'

type MedalData = {
  id: string
  medalType: string
  restaurant: { name: string; slug: string; city: string | null; state: string | null }
  foodCategory: { id: string; name: string; slug: string; iconEmoji: string; iconUrl: string | null }
}

type Props = {
  medals: MedalData[]
  crownJewelMedalId: string | null
  isOwner: boolean
}

export function CrownJewelCard({ medals, crownJewelMedalId, isOwner }: Props) {
  const router = useRouter()
  const goldMedals = medals.filter(m => m.medalType === 'gold')

  const [selectedId, setSelectedId] = useState(
    crownJewelMedalId && goldMedals.some(m => m.id === crownJewelMedalId)
      ? crownJewelMedalId
      : goldMedals[0]?.id ?? null,
  )

  const crownJewel = goldMedals.find(m => m.id === selectedId) ?? goldMedals[0]
  if (!crownJewel) return null

  async function handleSelect(medalId: string) {
    setSelectedId(medalId)
    try {
      await fetch('/api/medals/crown-jewel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ medalId }),
      })
      router.refresh()
    } catch {
      // Revert on error
      setSelectedId(selectedId)
    }
  }

  const selectorMedals = goldMedals.map(m => ({
    id: m.id,
    restaurantName: m.restaurant.name,
    categoryName: m.foodCategory.name,
    iconEmoji: m.foodCategory.iconEmoji,
  }))

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-bold text-yellow-700 uppercase tracking-wider">Crown Jewel</h2>
        {isOwner && (
          <CrownJewelSelector
            goldMedals={selectorMedals}
            currentMedalId={selectedId!}
            onSelect={handleSelect}
          />
        )}
      </div>
      <Link
        href={`/restaurants/${crownJewel.restaurant.slug}`}
        className="crown-jewel-card block bg-white rounded-2xl border border-blue-200 shadow-sm p-5 hover:shadow-md transition-shadow"
      >
        <div className="flex items-center gap-4">
          <Image src="/medals/gold.png" alt="Gold" width={48} height={48} className="flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-lg font-bold text-gray-900 truncate">{crownJewel.restaurant.name}</p>
            <p className="text-sm text-gray-500">
              <span className="inline-flex items-center gap-1">
                <CategoryIcon
                  slug={crownJewel.foodCategory.slug}
                  iconEmoji={crownJewel.foodCategory.iconEmoji}
                  iconUrl={crownJewel.foodCategory.iconUrl}
                />
                {crownJewel.foodCategory.name}
              </span>
              {crownJewel.restaurant.city && (
                <span className="text-gray-400">
                  {' '}&middot; {crownJewel.restaurant.city}
                  {crownJewel.restaurant.state ? `, ${crownJewel.restaurant.state}` : ''}
                </span>
              )}
            </p>
          </div>
          <span className="text-xs font-bold text-yellow-600 bg-yellow-50 px-2.5 py-1 rounded-full border border-yellow-200 flex-shrink-0">
            #1 Pick
          </span>
        </div>
      </Link>
    </div>
  )
}
