import type { Metadata } from 'next'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { SearchResults } from '@/components/SearchResults'
import { searchFull } from '@/lib/queries'

type Props = {
  searchParams: Promise<{ q?: string }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams
  return {
    title: q ? `Search: ${q} — FoodMedals` : 'Search Restaurants & Categories — FoodMedals',
    description: q
      ? `Search results for "${q}" on FoodMedals. Find restaurants, food categories, and community rankings.`
      : 'Search for restaurants and food categories on FoodMedals. Find community-voted rankings near you.',
    robots: q ? { index: false, follow: true } : { index: true, follow: true },
    alternates: { canonical: 'https://foodmedals.com/search' },
  }
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams
  const query = q?.trim() ?? ''

  const results = query.length >= 2 ? await searchFull(query) : null

  return (
    <main className="min-h-screen bg-amber-50">
      <Navbar />
      <SearchResults initialQuery={query} initialResults={results} />
      <Footer />
    </main>
  )
}
