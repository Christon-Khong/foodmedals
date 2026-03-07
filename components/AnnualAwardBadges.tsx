import Link from 'next/link'
import Image from 'next/image'
import { CategoryIcon } from '@/components/CategoryIcon'
import type { AnnualAwardRow } from '@/lib/queries'

const RANK_MEDAL: Record<number, { src: string; label: string }> = {
  1: { src: '/medals/gold.webp',   label: 'Best' },
  2: { src: '/medals/silver.webp', label: '2nd Best' },
  3: { src: '/medals/bronze.webp', label: '3rd Best' },
}

function getGeoLabel(award: AnnualAwardRow): string {
  if (award.geoScope === 'overall') return ''
  if (award.geoScope === 'state') return ` in ${award.geoValue}`
  return ` in ${award.geoValue}, ${award.geoState}`
}

export function AnnualAwardBadges({ awards }: { awards: AnnualAwardRow[] }) {
  // Group by year
  const byYear = new Map<number, AnnualAwardRow[]>()
  for (const a of awards) {
    const list = byYear.get(a.year) ?? []
    list.push(a)
    byYear.set(a.year, list)
  }

  const years = [...byYear.keys()].sort((a, b) => b - a)

  return (
    <section>
      <h2 className="text-xl font-extrabold text-gray-900 mb-5 flex items-center gap-2">
        <span>🏅</span> Annual Awards
      </h2>
      <div className="space-y-6">
        {years.map(year => (
          <div key={year}>
            <div className="text-sm font-bold text-yellow-700 uppercase tracking-wider mb-2">{year}</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {byYear.get(year)!.map(award => {
                const medal = RANK_MEDAL[award.rank]
                if (!medal) return null
                const geoLabel = getGeoLabel(award)

                return (
                  <Link
                    key={award.id}
                    href={`/categories/${award.categorySlug}`}
                    className="group flex items-center gap-3 bg-white rounded-xl border border-amber-100 hover:border-yellow-300 px-3 py-2.5 transition-all hover:shadow-sm"
                  >
                    <Image
                      src={medal.src}
                      alt={medal.label}
                      width={24}
                      height={24}
                      className="flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">
                          <CategoryIcon slug={award.categorySlug} iconEmoji={award.iconEmoji} iconUrl={award.iconUrl} />
                        </span>
                        <span className="text-sm font-semibold text-gray-800 group-hover:text-yellow-700 transition-colors truncate">
                          {medal.label} {award.categoryName}{geoLabel}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 flex-shrink-0">{year}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
