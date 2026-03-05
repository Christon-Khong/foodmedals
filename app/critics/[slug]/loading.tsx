import { Navbar } from '@/components/Navbar'

export default function CriticLoading() {
  return (
    <div className="min-h-screen bg-amber-50">
      <Navbar />

      {/* Profile header skeleton */}
      <div className="bg-white border-b border-amber-100">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex items-start gap-5">
            <div className="w-20 h-20 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="h-7 w-48 bg-gray-200 rounded-lg mb-2 animate-pulse" />
              <div className="h-4 w-32 bg-gray-100 rounded mb-3 animate-pulse" />
              <div className="flex gap-5">
                <div className="h-5 w-24 bg-gray-100 rounded animate-pulse" />
                <div className="h-5 w-28 bg-gray-100 rounded animate-pulse" />
                <div className="h-5 w-20 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trophy case skeleton */}
      <div className="max-w-5xl mx-auto px-4 pt-8">
        <div className="h-6 w-40 bg-gray-200 rounded mb-5 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-amber-100 overflow-hidden animate-pulse">
              <div className="h-12 bg-amber-50 border-b border-amber-50" />
              <div className="p-4 space-y-2">
                <div className="h-14 bg-yellow-50 rounded-xl" />
                <div className="grid grid-cols-2 gap-2">
                  <div className="h-12 bg-gray-50 rounded-lg" />
                  <div className="h-12 bg-gray-50 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
