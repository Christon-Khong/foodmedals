import { Navbar } from '@/components/Navbar'

export default function RestaurantLoading() {
  return (
    <div className="min-h-screen bg-amber-50">
      <Navbar />

      {/* Header skeleton */}
      <div className="bg-white border-b border-amber-100">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="h-4 w-24 bg-gray-100 rounded mb-4 animate-pulse" />
          <div className="h-8 w-72 bg-gray-200 rounded-lg mb-2 animate-pulse" />
          <div className="h-4 w-96 bg-gray-100 rounded mb-4 animate-pulse" />
          <div className="flex gap-2 mt-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-7 w-20 bg-amber-100 rounded-full animate-pulse" />
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-10">
        {/* Rankings skeleton */}
        <div>
          <div className="h-6 w-40 bg-gray-200 rounded mb-4 animate-pulse" />
          <div className="flex gap-2">
            {[1, 2].map(i => (
              <div key={i} className="h-16 flex-1 bg-white rounded-2xl border border-amber-100 animate-pulse" />
            ))}
          </div>
        </div>

        {/* Trophy case skeleton */}
        <div>
          <div className="h-6 w-48 bg-gray-200 rounded mb-4 animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-white rounded-2xl border border-amber-100 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
