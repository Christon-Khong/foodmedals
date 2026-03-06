import Link from 'next/link'
import Image from 'next/image'
import { Trophy } from 'lucide-react'
import { CategoryIcon } from '@/components/CategoryIcon'
import { StateRankBadge } from '@/components/StateRankBadge'
import { CommunityScore } from '@/components/CommunityScore'
import { getTierCardAura } from '@/lib/tiers'
import type { CategoryRankingRow } from '@/lib/queries'

const RANK_LABELS: Record<number, string> = { 1: '1st', 2: '2nd', 3: '3rd' }

const RANK_MEDAL: Record<number, string> = {
  1: '/medals/gold.webp',
  2: '/medals/silver.webp',
  3: '/medals/bronze.webp',
}

const CARD_ACCENT: Record<number, string> = {
  1: 'border-l-yellow-400 bg-gradient-to-r from-yellow-50/60 to-white',
  2: 'border-l-gray-300 bg-gradient-to-r from-gray-50/60 to-white',
  3: 'border-l-orange-400 bg-gradient-to-r from-orange-50/40 to-white',
}

type Props = {
  rankings: CategoryRankingRow[]
  year: number
  maxCommunityScore?: number
}

export function CategoryRankingBadges({ rankings, year, maxCommunityScore }: Props) {
  if (rankings.length === 0) return null

  return (
    <section>
      <h2 className="text-xl font-extrabold text-gray-900 mb-5 flex items-center gap-2">
        <Trophy className="w-5 h-5 text-yellow-500" />
        Top Rankings — {year}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {rankings.map(r => {
          const bestRank = Math.min(
            r.cityRank <= 3 ? r.cityRank : 99,
            r.stateRank <= 3 ? r.stateRank : 99,
          )
          const accent = CARD_ACCENT[bestRank] ?? ''
          const medalSrc = RANK_MEDAL[bestRank]
          const cardAura = getTierCardAura(r.totalScore, maxCommunityScore)

          return (
            <Link
              key={r.categoryId}
              href={`/categories/${r.categorySlug}`}
              className={`group rounded-2xl border border-amber-100 hover:border-yellow-300 border-l-4 p-4 flex items-center gap-4 transition-all hover:shadow-md ${accent} ${cardAura}`}
            >
              {/* State outline badge (state rank) */}
              {r.stateRank <= 3 && (
                <StateRankBadge rank={r.stateRank} state={r.state} size={44} />
              )}

              {/* Category icon + info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">
                    <CategoryIcon slug={r.categorySlug} iconEmoji={r.iconEmoji} iconUrl={r.iconUrl} />
                  </span>
                  <p className="font-bold text-gray-900 text-sm truncate group-hover:text-yellow-700 transition-colors">
                    {r.categoryName}
                  </p>
                </div>

                {/* Rank labels */}
                <div className="flex flex-wrap gap-1.5">
                  {r.cityRank <= 3 && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-600 bg-white border border-gray-200 rounded-full px-2 py-0.5">
                      {medalSrc && (
                        <Image src={RANK_MEDAL[r.cityRank] ?? medalSrc} alt="" width={12} height={12} />
                      )}
                      {RANK_LABELS[r.cityRank]} in {r.city}
                    </span>
                  )}
                  {r.stateRank <= 3 && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-600 bg-white border border-gray-200 rounded-full px-2 py-0.5">
                      {RANK_MEDAL[r.stateRank] && (
                        <Image src={RANK_MEDAL[r.stateRank]} alt="" width={12} height={12} />
                      )}
                      {RANK_LABELS[r.stateRank]} in {r.state}
                    </span>
                  )}
                </div>
              </div>

              {/* Community Score */}
              <CommunityScore score={r.totalScore} maxScore={maxCommunityScore} size="sm" />
            </Link>
          )
        })}
      </div>
    </section>
  )
}
