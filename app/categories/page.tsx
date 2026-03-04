import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllActiveCategories } from '@/lib/queries'
import { Navbar } from '@/components/Navbar'
import { HeroImage } from '@/components/HeroImage'
import { CategoryIcon } from '@/components/CategoryIcon'

export const metadata: Metadata = {
  title: 'Food Categories — FoodMedals',
  description: 'Browse all food categories and see community-voted rankings for Utah restaurants.',
  alternates: { canonical: 'https://foodmedals.com/categories' },
}

export default async function CategoriesPage() {
  const categories = await getAllActiveCategories()

  return (
    <main className="min-h-screen bg-amber-50">
      <Navbar />
      <HeroImage />
      {/* Header */}
      <div className="bg-white border-b border-amber-100">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Link href="/" className="text-sm text-yellow-700 hover:underline mb-2 inline-block">
            ← FoodMedals
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Food Categories</h1>
          <p className="text-gray-500 mt-1">
            {categories.length} categories · Community rankings reset each year
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
          {categories.map(cat => (
            <Link
              key={cat.id}
              href={`/categories/${cat.slug}`}
              className="group bg-white rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md border border-amber-100 hover:border-yellow-300 transition-all duration-200 flex flex-col items-center text-center"
            >
              <span className="text-4xl sm:text-5xl mb-3 group-hover:scale-110 transition-transform duration-200 inline-block">
                <CategoryIcon slug={cat.slug} iconEmoji={cat.iconEmoji} iconUrl={cat.iconUrl} />
              </span>
              <span className="text-sm font-semibold text-gray-800 leading-tight mb-1">
                {cat.name}
              </span>
              <span className="text-xs text-gray-400">
                {cat._count.restaurants} restaurant{cat._count.restaurants !== 1 ? 's' : ''}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
