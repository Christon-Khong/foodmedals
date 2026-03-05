import { MissingGeocodesList } from './MissingGeocodesList'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Missing Geocodes — Admin',
}

export default function MissingGeocodesPage() {
  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Missing Geocodes</h1>
        <p className="text-gray-400 text-sm mt-1">
          Active restaurants without lat/lng coordinates won&apos;t appear in Near Me results.
          Fix them individually or batch geocode all at once.
        </p>
      </div>
      <MissingGeocodesList />
    </div>
  )
}
