import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getCategoryBySlug, getRestaurantsForCategory, getUserMedalsForCategory } from '@/lib/queries'
import { AwardForm } from '@/components/AwardForm'
import { Navbar } from '@/components/Navbar'
import { HeroImage } from '@/components/HeroImage'
import { CategoryIcon } from '@/components/CategoryIcon'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const category = await getCategoryBySlug(slug)
  if (!category) return {}
  return {
    title: `Award Medals for ${category.name} — FoodMedals`,
    description: `Pick your Gold, Silver & Bronze for the best ${category.name}. Community food rankings on FoodMedals.`,
    robots: { index: false, follow: true },
  }
}

export default async function AwardPage({
  params,
  searchParams,
}: {
  params:       Promise<{ slug: string }>
  searchParams: Promise<{ city?: string; state?: string }>
}) {
  const { slug }        = await params
  const { city, state } = await searchParams

  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect(`/auth/signin?callbackUrl=/categories/${slug}/award`)

  const category = await getCategoryBySlug(slug)
  if (!category) notFound()

  // Require city selection before awarding medals
  if (!city || !state) {
    redirect(`/categories/${slug}`)
  }

  const year = new Date().getFullYear()

  const [restaurants, userMedals] = await Promise.all([
    getRestaurantsForCategory(category.id, city, state),
    getUserMedalsForCategory(session.user.id, category.id, year),
  ])

  const initialMedals = userMedals.map(m => ({
    medalType:    m.medalType as 'gold' | 'silver' | 'bronze',
    restaurantId: m.restaurantId,
  }))

  const backHref = `/categories/${slug}?city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}`

  return (
    <div className="min-h-screen bg-amber-50">
      <Navbar />
      <HeroImage />

      {/* Header */}
      <div className="bg-white border-b border-amber-100">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-4">
            <Link href="/categories" className="hover:text-yellow-700 transition-colors">Categories</Link>
            <span>/</span>
            <Link href={backHref} className="hover:text-yellow-700 transition-colors">{category.name}</Link>
            <span>/</span>
            <span className="text-gray-700">Award</span>
          </nav>
          <div className="flex items-center gap-3">
            <span className="text-4xl"><CategoryIcon slug={category.slug} iconEmoji={category.iconEmoji} iconUrl={category.iconUrl} /></span>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{category.name}</h1>
              <p className="text-sm text-gray-500">
                Your {year} medals in {city}, {state} — tap to assign, tap again to change
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <AwardForm
          category={{
            id:        category.id,
            name:      category.name,
            slug:      category.slug,
            iconEmoji: category.iconEmoji,
          }}
          restaurants={restaurants.map(r => ({
            id:   r.id,
            name: r.name,
            city: r.city,
            slug: r.slug,
          }))}
          initialMedals={initialMedals}
          year={year}
        />
      </div>
    </div>
  )
}
