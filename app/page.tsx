import Link from 'next/link'
import { getAllActiveCategories } from '@/lib/queries'
import { Navbar } from '@/components/Navbar'

export default async function HomePage() {
  const categories = await getAllActiveCategories()

  return (
    <div className="min-h-screen bg-amber-50">
      <Navbar />

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-b from-white to-amber-50 border-b border-amber-100">
        <div className="max-w-4xl mx-auto px-4 py-16 sm:py-24 text-center">
          <div className="flex justify-center gap-3 text-5xl sm:text-6xl mb-6">
            <span className="animate-bounce" style={{ animationDelay: '0ms'   }}>🥇</span>
            <span className="animate-bounce" style={{ animationDelay: '120ms' }}>🥈</span>
            <span className="animate-bounce" style={{ animationDelay: '240ms' }}>🥉</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight mb-4">
            Award Medals to Utah's<br className="hidden sm:inline" /> Best Food
          </h1>
          <p className="text-lg sm:text-xl text-gray-500 max-w-xl mx-auto mb-8">
            Community-powered rankings. Pick your Gold, Silver &amp; Bronze for each food category — new year, new picks.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/categories"
              className="w-full sm:w-auto px-8 py-3.5 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold rounded-full text-base transition-colors shadow-sm"
            >
              Browse Categories
            </Link>
            <Link
              href="/auth/signup"
              className="w-full sm:w-auto px-8 py-3.5 bg-white hover:bg-amber-50 text-gray-700 font-semibold rounded-full text-base border border-gray-200 hover:border-yellow-300 transition-colors"
            >
              Sign up — it&apos;s free
            </Link>
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-amber-100">
        <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
          <h2 className="text-center text-2xl font-bold text-gray-900 mb-10">How it works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            {[
              { emoji: '🍔', step: '1', title: 'Browse Categories', desc: 'Cheeseburgers, tacos, pizza, wings — 15 categories of Utah eats.' },
              { emoji: '🏅', step: '2', title: 'Award Your Medals', desc: 'Give Gold, Silver & Bronze to the three restaurants you love most.' },
              { emoji: '🏆', step: '3', title: 'See the Rankings', desc: 'Community votes aggregate into leaderboards that reset every year.' },
            ].map(item => (
              <div key={item.step} className="text-center">
                <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-sm border border-amber-100">
                  {item.emoji}
                </div>
                <div className="text-xs font-bold text-yellow-600 uppercase tracking-wider mb-1">Step {item.step}</div>
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Category grid ────────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Food Categories</h2>
          <Link href="/categories" className="text-sm text-yellow-700 hover:underline font-medium">
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {categories.map(cat => (
            <Link
              key={cat.id}
              href={`/categories/${cat.slug}`}
              className="group bg-white rounded-2xl p-3 sm:p-4 shadow-sm hover:shadow-md border border-amber-100 hover:border-yellow-300 transition-all duration-200 flex flex-col items-center text-center"
            >
              <span className="text-3xl sm:text-4xl mb-2 group-hover:scale-110 transition-transform duration-200 inline-block">
                {cat.iconEmoji}
              </span>
              <span className="text-xs font-semibold text-gray-700 leading-tight">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── CTA banner ───────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-r from-yellow-400 to-amber-400 mx-4 mb-12 rounded-3xl">
        <div className="max-w-2xl mx-auto px-6 py-10 sm:py-14 text-center">
          <div className="text-4xl mb-4">🏆</div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-3">
            Your opinion matters
          </h2>
          <p className="text-gray-800 mb-6 text-sm sm:text-base">
            Join the community ranking Utah&apos;s best restaurants. One Gold, one Silver, one Bronze per category — make yours count.
          </p>
          <Link
            href="/auth/signup"
            className="inline-block bg-white hover:bg-amber-50 text-gray-900 font-bold px-8 py-3 rounded-full transition-colors shadow-sm"
          >
            Start awarding medals
          </Link>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-amber-100 bg-white">
        <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-400">
          <span>🏅 FoodMedals · Utah Community Food Rankings</span>
          <div className="flex gap-4">
            <Link href="/categories"   className="hover:text-gray-600 transition-colors">Categories</Link>
            <Link href="/hall-of-fame" className="hover:text-gray-600 transition-colors">Hall of Fame</Link>
            <Link href="/auth/signup"  className="hover:text-gray-600 transition-colors">Sign up</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
