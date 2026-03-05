import Link from 'next/link'
import { CategoryIcon } from '@/components/CategoryIcon'
import type { CategoryRankingRow } from '@/lib/queries'

const RANK_STYLES: Record<number, string> = {
  1: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  2: 'bg-gray-100 text-gray-600 border-gray-300',
  3: 'bg-orange-100 text-orange-800 border-orange-300',
}

const RANK_LABELS: Record<number, string> = {
  1: '1st',
  2: '2nd',
  3: '3rd',
}

function RankBadge({ rank, label }: { rank: number; label: string }) {
  const style = RANK_STYLES[rank]
  if (!style) return null
  return (
    <span className={`inline-flex items-center text-xs font-semibold border rounded-full px-2 py-0.5 ${style}`}>
      {RANK_LABELS[rank]} {label}
    </span>
  )
}

type Props = {
  rankings: CategoryRankingRow[]
  year: number
}

export function CategoryRankingBadges({ rankings, year }: Props) {
  if (rankings.length === 0) return null

  return (
    <section>
      <h2 className="text-xl font-extrabold text-gray-900 mb-4 flex items-center gap-2">
        <span>🏅</span> Top Rankings — {year}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {rankings.map(r => (
          <Link
            key={r.categoryId}
            href={`/categories/${r.categorySlug}`}
            className="bg-white rounded-2xl border border-amber-100 hover:border-yellow-300 p-4 flex items-start gap-3 transition-all hover:shadow-sm"
          >
            <div className="text-2xl mt-0.5">
              <CategoryIcon slug={r.categorySlug} iconEmoji={r.iconEmoji} iconUrl={r.iconUrl} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-800 text-sm truncate">{r.categoryName}</p>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {r.cityRank <= 3 && (
                  <RankBadge rank={r.cityRank} label={`in ${r.city}`} />
                )}
                {r.stateRank <= 3 && (
                  <RankBadge rank={r.stateRank} label={`in ${r.state}`} />
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
