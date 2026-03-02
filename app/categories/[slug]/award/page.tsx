import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getCategoryBySlug, getRestaurantsForCategory, getUserMedalsForCategory } from '@/lib/queries'
import { AwardForm } from '@/components/AwardForm'
import { Navbar } from '@/components/Navbar'

export default async function AwardPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect(`/auth/signin?callbackUrl=/categories/${slug}/award`)

  const category = await getCategoryBySlug(slug)
  if (!category) notFound()

  const year = new Date().getFullYear()

  const [restaurants, userMedals] = await Promise.all([
    getRestaurantsForCategory(category.id),
    getUserMedalsForCategory(session.user.id, category.id, year),
  ])

  const initialMedals = userMedals.map(m => ({
    medalType:    m.medalType as 'gold' | 'silver' | 'bronze',
    restaurantId: m.restaurantId,
  }))

  return (
    <div className="min-h-screen bg-amber-50">
      <Navbar />

      {/* Header */}
      <div className="bg-white border-b border-amber-100">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-4">
            <Link href="/categories" className="hover:text-yellow-700 transition-colors">Categories</Link>
            <span>/</span>
            <Link href={`/categories/${slug}`} className="hover:text-yellow-700 transition-colors">{category.name}</Link>
            <span>/</span>
            <span className="text-gray-700">Award</span>
          </nav>
          <div className="flex items-center gap-3">
            <span className="text-4xl">{category.iconEmoji}</span>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{category.name}</h1>
              <p className="text-sm text-gray-500">
                Your {year} medals — tap to assign, tap again to change
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
