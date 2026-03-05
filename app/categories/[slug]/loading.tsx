import { Navbar } from '@/components/Navbar'

export default function CategoryLoading() {
  return (
    <main className="min-h-screen bg-amber-50">
      <Navbar />

      {/* Hero skeleton */}
      <div className="bg-white border-b border-amber-100">
        <div className="max-w-3xl mx-auto px-4 py-8 text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full mx-auto mb-3 animate-pulse" />
          <div className="h-10 w-64 bg-gray-200 rounded-xl mx-auto mb-2 animate-pulse" />
          <div className="h-4 w-48 bg-gray-100 rounded mx-auto animate-pulse" />
          <div className="flex justify-center gap-2 mt-4">
            <div className="h-8 w-16 bg-gray-100 rounded-full animate-pulse" />
            <div className="h-8 w-16 bg-yellow-200 rounded-full animate-pulse" />
          </div>
        </div>
      </div>

      {/* Leaderboard skeleton */}
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex gap-3 py-5">
          <div className="h-9 w-24 bg-white border border-gray-200 rounded-full animate-pulse" />
          <div className="h-9 w-20 bg-white border border-gray-200 rounded-full animate-pulse" />
        </div>

        <div className="text-center text-xs font-bold text-gray-400 py-6 uppercase">Loading rankings...</div>

        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-amber-100 rounded-xl animate-pulse" />
          ))}
        </div>

        {/* Table skeleton */}
        <div className="mt-8 bg-white rounded-2xl border border-amber-100 overflow-hidden">
          <div className="bg-amber-50 border-b border-amber-100 h-12 animate-pulse" />
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-14 border-b border-amber-50 animate-pulse" />
          ))}
        </div>
      </div>
    </main>
  )
}
