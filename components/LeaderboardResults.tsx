'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Podium } from '@/components/Podium'
import type { LeaderboardRow } from '@/lib/queries'

type Props = {
  rows: LeaderboardRow[]
  year: number
  loading?: boolean
  nearMe?: boolean
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

export function LeaderboardResults({ rows, year, loading, nearMe }: Props) {
  if (loading) return <Skeleton />

  const medalled = rows.filter(r => r.totalScore > 0)
  const top3     = medalled.slice(0, 3)

  return (
    <>
      {/* Podium */}
      <div>
        <h2 className="text-center text-xs font-bold text-gray-500 pt-6 pb-2 tracking-wide uppercase">
          🏆 {year} Community Favorites{nearMe ? ' — Near You' : ''}
        </h2>
        <Podium rows={top3} />
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
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-50">
                {rows.map((row, i) => (
                  <tr
                    key={row.restaurantId}
                    className={`hover:bg-amber-50 transition-colors ${i < 3 ? 'font-medium' : ''}`}
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
                      </span>
                    </td>
                    <td className="px-2 py-3 text-center text-gray-600">{row.goldCount   || '—'}</td>
                    <td className="px-2 py-3 text-center text-gray-600">{row.silverCount || '—'}</td>
                    <td className="px-2 py-3 text-center text-gray-600">{row.bronzeCount || '—'}</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-800">{row.totalScore}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}
