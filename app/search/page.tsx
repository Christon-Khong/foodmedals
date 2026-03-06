import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Navbar } from '@/components/Navbar'
import { CategoryIcon } from '@/components/CategoryIcon'
import { searchFull } from '@/lib/queries'
import { MapPin, Store, Tag, User, Compass, Map } from 'lucide-react'

type Props = {
  searchParams: Promise<{ q?: string }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams
  return {
    title: q ? `Search: ${q} — FoodMedals` : 'Search — FoodMedals',
  }
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams
  const query = q?.trim() ?? ''

  const results = query.length >= 2 ? await searchFull(query) : null

  const isEmpty = results && !results.combos.length && !results.categories.length
    && !results.restaurants.length && !results.cities.length
    && !results.states.length && !results.critics.length

  return (
    <>
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          {query ? <>Results for &ldquo;{query}&rdquo;</> : 'Search'}
        </h1>
        {query && results && !isEmpty && (
          <p className="text-sm text-gray-500 mb-6">
            {[
              results.combos.length > 0 && `${results.combos.length} combo`,
              results.categories.length > 0 && `${results.categories.length} ${results.categories.length === 1 ? 'category' : 'categories'}`,
              results.restaurants.length > 0 && `${results.restaurants.length} ${results.restaurants.length === 1 ? 'restaurant' : 'restaurants'}`,
              results.cities.length > 0 && `${results.cities.length} ${results.cities.length === 1 ? 'city' : 'cities'}`,
              results.states.length > 0 && `${results.states.length} ${results.states.length === 1 ? 'state' : 'states'}`,
              results.critics.length > 0 && `${results.critics.length} ${results.critics.length === 1 ? 'critic' : 'critics'}`,
            ].filter(Boolean).join(' · ')}
          </p>
        )}

        {!query && (
          <p className="text-gray-500 mt-4">Enter a search term to find restaurants, categories, cities, and more.</p>
        )}

        {query && query.length < 2 && (
          <p className="text-gray-500 mt-4">Please enter at least 2 characters to search.</p>
        )}

        {isEmpty && (
          <div className="text-center py-16">
            <p className="text-gray-400 text-lg">No results found</p>
            <p className="text-gray-400 text-sm mt-1">Try a different search term</p>
          </div>
        )}

        {results && !isEmpty && (
          <div className="space-y-8">
            {/* Category + City Combos */}
            {results.combos.length > 0 && (
              <Section icon={<Compass className="w-4 h-4" />} title="Category + Location">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {results.combos.map(c => (
                    <Link
                      key={`${c.categorySlug}-${c.city}-${c.state}`}
                      href={`/categories/${c.categorySlug}?city=${encodeURIComponent(c.city)}&state=${encodeURIComponent(c.state)}`}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl border border-amber-100 hover:border-amber-300 hover:bg-amber-50/50 transition-colors"
                    >
                      <span className="text-lg flex-shrink-0">
                        <CategoryIcon slug={c.categorySlug} iconEmoji={c.iconEmoji} iconUrl={c.iconUrl} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{c.categoryName}</p>
                        <p className="text-xs text-gray-500">in {c.city}, {c.state}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </Section>
            )}

            {/* Categories */}
            {results.categories.length > 0 && (
              <Section icon={<Tag className="w-4 h-4" />} title="Categories">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {results.categories.map(cat => (
                    <Link
                      key={cat.slug}
                      href={`/categories/${cat.slug}`}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-100 hover:border-amber-300 hover:bg-amber-50/50 transition-colors"
                    >
                      <span className="text-lg flex-shrink-0">
                        <CategoryIcon slug={cat.slug} iconEmoji={cat.iconEmoji} iconUrl={cat.iconUrl} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{cat.name}</p>
                      </div>
                      <span className="text-xs text-gray-400 flex-shrink-0">{cat.restaurantCount} restaurants</span>
                    </Link>
                  ))}
                </div>
              </Section>
            )}

            {/* Restaurants */}
            {results.restaurants.length > 0 && (
              <Section icon={<Store className="w-4 h-4" />} title="Restaurants">
                <div className="space-y-1">
                  {results.restaurants.map(r => (
                    <Link
                      key={r.slug}
                      href={`/restaurants/${r.slug}`}
                      className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-amber-50/50 transition-colors"
                    >
                      <span className="text-sm font-medium text-gray-900 truncate">{r.name}</span>
                      <span className="text-xs text-gray-400 flex-shrink-0 ml-3">{r.city}, {r.state}</span>
                    </Link>
                  ))}
                </div>
              </Section>
            )}

            {/* Cities */}
            {results.cities.length > 0 && (
              <Section icon={<MapPin className="w-4 h-4" />} title="Cities">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {results.cities.map(c => (
                    <Link
                      key={`${c.city}-${c.state}`}
                      href={`/categories?city=${encodeURIComponent(c.city)}&state=${encodeURIComponent(c.state)}`}
                      className="flex items-center justify-between px-4 py-3 rounded-xl border border-gray-100 hover:border-amber-300 hover:bg-amber-50/50 transition-colors"
                    >
                      <span className="text-sm font-medium text-gray-900">{c.city}, {c.state}</span>
                      <span className="text-xs text-gray-400">{c.restaurantCount} restaurants</span>
                    </Link>
                  ))}
                </div>
              </Section>
            )}

            {/* States */}
            {results.states.length > 0 && (
              <Section icon={<Map className="w-4 h-4" />} title="States">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {results.states.map(s => (
                    <Link
                      key={s.stateCode}
                      href={`/categories?state=${encodeURIComponent(s.stateCode)}`}
                      className="flex items-center justify-between px-4 py-3 rounded-xl border border-gray-100 hover:border-amber-300 hover:bg-amber-50/50 transition-colors"
                    >
                      <span className="text-sm font-medium text-gray-900">{s.state}</span>
                      <span className="text-xs text-gray-400">{s.restaurantCount} restaurants</span>
                    </Link>
                  ))}
                </div>
              </Section>
            )}

            {/* Critics */}
            {results.critics.length > 0 && (
              <Section icon={<User className="w-4 h-4" />} title="Critics">
                <div className="space-y-1">
                  {results.critics.map(u => (
                    <Link
                      key={u.slug}
                      href={`/critics/${u.slug}`}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-amber-50/50 transition-colors"
                    >
                      {u.avatarUrl ? (
                        <Image src={u.avatarUrl} alt="" width={32} height={32} className="rounded-full flex-shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                          {u.displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{u.displayName}</p>
                        {u.city && <p className="text-xs text-gray-400">{u.city}{u.state ? `, ${u.state}` : ''}</p>}
                      </div>
                    </Link>
                  ))}
                </div>
              </Section>
            )}
          </div>
        )}
      </div>
    </>
  )
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-amber-600">{icon}</span>
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">{title}</h2>
      </div>
      {children}
    </section>
  )
}
