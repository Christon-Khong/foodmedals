import { DiscoverForm } from './DiscoverForm'

export const dynamic = 'force-dynamic'

export default function DiscoverPage() {
  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Discover Restaurants</h1>
        <p className="text-gray-400 text-sm mt-1">
          Search Google Places to find top restaurants by category for any city.
          Review results, then import selected restaurants with one click.
        </p>
      </div>
      <DiscoverForm />
    </div>
  )
}
