'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Podium } from '@/components/Podium'
import { LeaderboardMap } from '@/components/LeaderboardMap'
import type { LeaderboardRow } from '@/lib/queries'

type MedalType = 'gold' | 'silver' | 'bronze'
type UserMedals = Record<MedalType, string | null>

type Props = {
  rows: LeaderboardRow[]
  year: number
  loading?: boolean
  nearMe?: boolean
  userMedals?: UserMedals
  isLoggedIn?: boolean
  onMedalChange?: (restaurantId: string, medalType: MedalType) => void
  categorySlug?: string
}

const MEDAL_TYPES: MedalType[] = ['gold', 'silver', 'bronze']
const MEDAL_IMG: Record<MedalType, string> = {
  gold:   '/medals/gold.png',
  silver: '/medals/silver.png',
  bronze: '/medals/bronze.png',
}
const MEDAL_ACTIVE_STYLES: Record<MedalType, string> = {
  gold:   'ring-2 ring-yellow-400 bg-yellow-50 shadow-[0_0_8px_rgba(250,204,21,0.5)]',
  silver: 'ring-2 ring-gray-400 bg-gray-50 shadow-[0_0_8px_rgba(156,163,175,0.5)]',
  bronze: 'ring-2 ring-amber-500 bg-amber-50 shadow-[0_0_8px_rgba(245,158,11,0.5)]',
}
const ROW_HIGHLIGHT: Record<MedalType, string> = {
  gold:   'border-l-4 border-l-yellow-400 bg-yellow-50/40',
  silver: 'border-l-4 border-l-gray-300 bg-gray-50/40',
  bronze: 'border-l-4 border-l-amber-500 bg-amber-50/40',
}

function getUserMedalForRestaurant(userMedals: UserMedals, restaurantId: string): MedalType | null {
  for (const mt of MEDAL_TYPES) {
    if (userMedals[mt] === restaurantId) return mt
  }
  return null
}

function DistanceBadge({ miles }: { miles: number }) {
  return (
    <span className="ml-1.5 text-xs text-gray-400 font-normal bg-gray-100 px-1.5 py-0.5 rounded-full whitespace-nowrap">
      {miles} mi
    </span>
  )
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-12 bg-amber-100 rounded-xl" />
      ))}
    </div>
  )
}

function MedalButtons({
  restaurantId,
  userMedals,
  isLoggedIn,
  onMedalChange,
  categorySlug,
}: {
  restaurantId: string
  userMedals: UserMedals
  isLoggedIn: boolean
  onMedalChange?: (restaurantId: string, medalType: MedalType) => void
  categorySlug?: string
}) {
  if (!isLoggedIn) {
    return (
      <Link
        href={`/auth/signin?callbackUrl=/categories/${categorySlug ?? ''}`}
        className="flex gap-0.5 opacity-40 hover:opacity-70 transition-opacity"
        title="Sign in to award medals"
      >
        {MEDAL_TYPES.map(mt => (
          <div key={mt} className="w-7 h-7 rounded-lg flex items-center justify-center">
            <Image src={MEDAL_IMG[mt]} alt={mt} width={18} height={18} />
          </div>
        ))}
      </Link>
    )
  }

  return (
    <div className="flex gap-0.5">
      {MEDAL_TYPES.map(mt => {
        const isActive = userMedals[mt] === restaurantId
        return (
          <button
            key={mt}
            onClick={() => onMedalChange?.(restaurantId, mt)}
            title={isActive ? `Remove ${mt} medal` : `Award ${mt}`}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 ${
              isActive
                ? `scale-110 ${MEDAL_ACTIVE_STYLES[mt]}`
                : 'opacity-30 hover:opacity-80 hover:bg-amber-50 hover:scale-105'
            }`}
          >
            <Image src={MEDAL_IMG[mt]} alt={mt} width={18} height={18} />
          </button>
        )
      })}
    </div>
  )
}

export function LeaderboardResults({
  rows,
  year,
  loading,
  nearMe,
  userMedals = { gold: null, silver: null, bronze: null },
  isLoggedIn = false,
  onMedalChange,
  categorySlug,
}: Props) {
  if (loading) return <Skeleton />

  const medalled = rows.filter(r => r.totalScore > 0)
  const top3     = medalled.slice(0, 3)

  return (
    <>
      {/* Map + Podium */}
      <div>
        <h2 className="text-center text-xs font-bold text-gray-500 pt-6 pb-2 tracking-wide uppercase">
          {year} Community Favorites{nearMe ? ' — Near You' : ''}
        </h2>
        <LeaderboardMap rows={top3} />
        <Podium rows={top3} userMedals={userMedals} />
      </div>

      {/* Full standings table */}
      {rows.length > 0 && (
        <div className="pb-16">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 pt-4 border-t border-amber-200">
            Full Standings — {year}
          </h2>
          <div className="bg-white rounded-2xl shadow-sm border border-amber-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-amber-50 border-b border-amber-100">
                  <th className="text-left px-4 py-3 text-gray-500 font-semibold w-10">#</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-semibold">Restaurant</th>
                  <th className="text-center px-2 py-3 text-gray-500 font-semibold">
                    <Image src="/medals/gold.png" alt="Gold" width={16} height={16} className="mx-auto" />
                  </th>
                  <th className="text-center px-2 py-3 text-gray-500 font-semibold">
                    <Image src="/medals/silver.png" alt="Silver" width={16} height={16} className="mx-auto" />
                  </th>
                  <th className="text-center px-2 py-3 text-gray-500 font-semibold">
                    <Image src="/medals/bronze.png" alt="Bronze" width={16} height={16} className="mx-auto" />
                  </th>
                  <th className="text-right px-4 py-3 text-gray-500 font-semibold">Score</th>
                  <th className="px-2 py-3 text-gray-500 font-semibold text-center whitespace-nowrap text-xs">Your Picks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-50">
                {rows.map((row, i) => {
                  const userMedal = getUserMedalForRestaurant(userMedals, row.restaurantId)
                  const rowHighlight = userMedal ? ROW_HIGHLIGHT[userMedal] : ''
                  return (
                    <tr
                      key={row.restaurantId}
                      className={`hover:bg-amber-50 transition-colors ${i < 3 ? 'font-medium' : ''} ${rowHighlight}`}
                    >
                      <td className="px-4 py-3 text-gray-400">
                        {i === 0 ? (
                          <Image src="/medals/gold.png" alt="1st" width={16} height={16} />
                        ) : i === 1 ? (
                          <Image src="/medals/silver.png" alt="2nd" width={16} height={16} />
                        ) : i === 2 ? (
                          <Image src="/medals/bronze.png" alt="3rd" width={16} height={16} />
                        ) : (
                          i + 1
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center flex-wrap gap-x-1">
                          <Link
                            href={`/restaurants/${row.restaurantSlug}`}
                            className="text-gray-800 hover:text-yellow-700 transition-colors font-medium"
                          >
                            {row.restaurantName}
                          </Link>
                          {row.distanceMiles !== undefined && (
                            <DistanceBadge miles={row.distanceMiles} />
                          )}
                          {userMedal && (
                            <span className={`ml-1 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full ${
                              userMedal === 'gold'   ? 'bg-yellow-100 text-yellow-700' :
                              userMedal === 'silver' ? 'bg-gray-100 text-gray-600' :
                                                       'bg-amber-100 text-amber-700'
                            }`}>
                              Your {userMedal}
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="px-2 py-3 text-center text-gray-600">{row.goldCount   || '—'}</td>
                      <td className="px-2 py-3 text-center text-gray-600">{row.silverCount || '—'}</td>
                      <td className="px-2 py-3 text-center text-gray-600">{row.bronzeCount || '—'}</td>
                      <td className="px-4 py-3 text-right font-bold text-gray-800">{row.totalScore}</td>
                      <td className="px-2 py-3 text-center">
                        <MedalButtons
                          restaurantId={row.restaurantId}
                          userMedals={userMedals}
                          isLoggedIn={isLoggedIn}
                          onMedalChange={onMedalChange}
                          categorySlug={categorySlug}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}
