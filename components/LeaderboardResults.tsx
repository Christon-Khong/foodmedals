'use client'

import Image from 'next/image'
import Link from 'next/link'
import { MessageSquare, Pencil, Quote } from 'lucide-react'
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
  goldMedalId?: string | null
  goldHasComment?: boolean
  goldCommentText?: string | null
  onOpenComment?: (restaurantName: string) => void
}

const MEDAL_TYPES: MedalType[] = ['gold', 'silver', 'bronze']
const MEDAL_IMG: Record<MedalType, string> = {
  gold:   '/medals/gold.webp',
  silver: '/medals/silver.webp',
  bronze: '/medals/bronze.webp',
}
const MEDAL_ACTIVE_BG: Record<MedalType, string> = {
  gold:   'bg-yellow-50 ring-2 ring-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.4)]',
  silver: 'bg-gray-50 ring-2 ring-gray-400 shadow-[0_0_8px_rgba(156,163,175,0.4)]',
  bronze: 'bg-amber-50 ring-2 ring-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]',
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

/** Interactive medal cell — shows count + clickable to award */
function MedalCell({
  medalType,
  count,
  isActive,
  isLoggedIn,
  categorySlug,
  onClick,
}: {
  medalType: MedalType
  count: number
  isActive: boolean
  isLoggedIn: boolean
  categorySlug?: string
  onClick?: () => void
}) {
  const content = (
    <div className={`flex flex-col items-center gap-0.5 py-1 px-1 rounded-xl transition-all duration-200 ${
      isActive
        ? `${MEDAL_ACTIVE_BG[medalType]} scale-105`
        : isLoggedIn
          ? 'hover:bg-amber-50 hover:scale-105 cursor-pointer'
          : ''
    }`}>
      <Image src={MEDAL_IMG[medalType]} alt={medalType} width={22} height={22} />
      <span className={`text-xs tabular-nums leading-none ${
        isActive ? 'font-bold text-gray-900' : count ? 'font-semibold text-gray-600' : 'text-gray-300'
      }`}>
        {count || '—'}
      </span>
    </div>
  )

  if (isLoggedIn) {
    return (
      <td className="px-1 py-2 text-center">
        <button
          onClick={onClick}
          title={isActive ? `Remove ${medalType} medal` : `Award ${medalType}`}
          className="inline-flex"
        >
          {content}
        </button>
      </td>
    )
  }

  return (
    <td className="px-1 py-2 text-center">
      <Link
        href={`/auth/signin?callbackUrl=/categories/${categorySlug ?? ''}`}
        title="Sign in to award medals"
        className="inline-flex opacity-70 hover:opacity-100 transition-opacity"
      >
        {content}
      </Link>
    </td>
  )
}

/** Compute standard competition ranking (1,1,3 not 1,1,2) based on score+goldCount */
function computeRanks(rows: LeaderboardRow[]): number[] {
  const ranks: number[] = []
  for (let i = 0; i < rows.length; i++) {
    if (i === 0) {
      ranks.push(1)
    } else if (
      rows[i].totalScore === rows[i - 1].totalScore &&
      rows[i].goldCount === rows[i - 1].goldCount
    ) {
      ranks.push(ranks[i - 1])
    } else {
      ranks.push(i + 1)
    }
  }
  return ranks
}

const RANK_MEDAL_IMG: Record<number, { src: string; alt: string }> = {
  1: { src: '/medals/gold.webp', alt: '1st' },
  2: { src: '/medals/silver.webp', alt: '2nd' },
  3: { src: '/medals/bronze.webp', alt: '3rd' },
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
  goldMedalId,
  goldHasComment,
  goldCommentText,
  onOpenComment,
}: Props) {
  if (loading && rows.length === 0) return <Skeleton />

  const medalled = rows.filter(r => r.totalScore > 0)
  const ranks = computeRanks(medalled)

  // Podium: all rows with rank 1, 2, or 3 (includes ties)
  const podiumRows = medalled.filter((_, i) => ranks[i] <= 3)

  // Full ranks for all rows (including zero-score ones)
  const fullRanks = computeRanks(rows)

  return (
    <div className={loading ? 'opacity-50 pointer-events-none transition-opacity' : 'transition-opacity'}>
      {/* Map + Podium */}
      <div>
        <h2 className="text-center text-xs font-bold text-gray-500 pt-6 pb-2 tracking-wide uppercase">
          {year} Community Favorites{nearMe ? ' — Near You' : ''}
        </h2>
        <LeaderboardMap rows={podiumRows} ranks={ranks} />
        <Podium rows={podiumRows} ranks={ranks} userMedals={userMedals} />
      </div>

      {/* Full standings table — only show when there are medals for this year */}
      {medalled.length > 0 && rows.length > 0 && (
        <div className="pb-16">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 pt-4 border-t border-amber-200">
            Full Standings — {year}
          </h2>
          <div className="bg-white rounded-2xl shadow-sm border border-amber-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-amber-50 border-b border-amber-100">
                  <th className="text-left px-3 sm:px-4 py-3 text-gray-500 font-semibold w-10">#</th>
                  <th className="text-left px-2 sm:px-4 py-3 text-gray-500 font-semibold">Restaurant</th>
                  {MEDAL_TYPES.map(mt => (
                    <th key={mt} className="text-center px-1 py-3 text-gray-500 font-semibold">
                      <Image src={MEDAL_IMG[mt]} alt={mt} width={20} height={20} className="mx-auto" />
                    </th>
                  ))}
                  <th className="text-center px-1 py-3 text-gray-500 font-semibold" title="Gold medal comments">
                    <MessageSquare className="w-4 h-4 mx-auto text-gray-400" />
                  </th>
                  <th className="text-right px-3 sm:px-4 py-3 text-gray-500 font-semibold whitespace-nowrap">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-50">
                {rows.map((row, i) => {
                  const rank = fullRanks[i]
                  const medalInfo = RANK_MEDAL_IMG[rank]
                  const userMedal = getUserMedalForRestaurant(userMedals, row.restaurantId)
                  const rowHighlight = userMedal ? ROW_HIGHLIGHT[userMedal] : ''
                  return (
                    <tr
                      key={row.restaurantId}
                      className={`hover:bg-amber-50 transition-colors ${rank <= 3 ? 'font-medium' : ''} ${rowHighlight}`}
                    >
                      <td className="px-3 sm:px-4 py-3 text-gray-400">
                        {medalInfo ? (
                          <Image src={medalInfo.src} alt={medalInfo.alt} width={16} height={16} />
                        ) : (
                          rank
                        )}
                      </td>
                      <td className="px-2 sm:px-4 py-3">
                        <span className="flex items-center flex-wrap gap-x-1">
                          <Link
                            href={`/restaurants/${row.restaurantSlug}`}
                            className="text-gray-800 hover:text-yellow-700 transition-colors font-bold"
                          >
                            {row.restaurantName}
                          </Link>
                          {row.city && (
                            <span className="text-xs text-gray-400 font-normal">
                              {row.city}{row.state ? `, ${row.state}` : ''}
                            </span>
                          )}
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
                          {userMedal === 'gold' && goldMedalId && onOpenComment && (
                            <button
                              onClick={(e) => { e.stopPropagation(); onOpenComment(row.restaurantName) }}
                              className="ml-1 inline-flex items-center gap-0.5 text-[10px] font-semibold text-yellow-700 hover:text-yellow-900 transition-colors"
                              title={goldHasComment ? 'Edit comment' : 'Share your pick'}
                            >
                              {goldHasComment ? (
                                <>
                                  <Pencil className="w-2.5 h-2.5" />
                                  <span className="hidden sm:inline">Edit</span>
                                </>
                              ) : (
                                <>
                                  <MessageSquare className="w-2.5 h-2.5" />
                                  <span className="hidden sm:inline">Comment</span>
                                </>
                              )}
                            </button>
                          )}
                        </span>
                        {userMedal === 'gold' && goldCommentText && (
                          <div className="flex items-start gap-1.5 mt-1.5">
                            <Quote className="w-3 h-3 text-yellow-500 flex-shrink-0 mt-0.5 rotate-180" />
                            <p className="text-xs text-gray-500 italic leading-relaxed line-clamp-2">
                              {goldCommentText}
                            </p>
                            <Quote className="w-3 h-3 text-yellow-500 flex-shrink-0 mt-0.5" />
                          </div>
                        )}
                      </td>

                      {/* Medal cells — combined count + award */}
                      {MEDAL_TYPES.map(mt => (
                        <MedalCell
                          key={mt}
                          medalType={mt}
                          count={mt === 'gold' ? row.goldCount : mt === 'silver' ? row.silverCount : row.bronzeCount}
                          isActive={userMedals[mt] === row.restaurantId}
                          isLoggedIn={isLoggedIn}
                          categorySlug={categorySlug}
                          onClick={() => onMedalChange?.(row.restaurantId, mt)}
                        />
                      ))}

                      <td className="px-1 py-2 text-center text-gray-600">
                        {row.commentCount ? (
                          <Link
                            href={`/restaurants/${row.restaurantSlug}#highlights`}
                            className="inline-flex items-center gap-0.5 text-yellow-700 hover:text-yellow-900 transition-colors font-semibold"
                            title={`${row.commentCount} comment${row.commentCount !== 1 ? 's' : ''} — view highlights`}
                          >
                            <MessageSquare className="w-3 h-3" />
                            {row.commentCount}
                          </Link>
                        ) : '—'}
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-right font-bold text-gray-800">{row.totalScore}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
