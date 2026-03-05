import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ReportActions } from './ReportActions'

export const dynamic = 'force-dynamic'

async function getPendingReports() {
  return prisma.addressReport.findMany({
    where: { status: 'pending' },
    orderBy: { createdAt: 'asc' },
    include: {
      restaurant: { select: { id: true, name: true, slug: true, address: true, city: true, state: true, zip: true } },
      user: { select: { displayName: true, email: true } },
    },
  })
}

export default async function AddressReportsPage() {
  const reports = await getPendingReports()

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Address Reports</h1>
        <p className="text-gray-400 text-sm mt-1">
          {reports.length} report{reports.length !== 1 ? 's' : ''} pending review
        </p>
      </div>

      {reports.length === 0 ? (
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-16 text-center">
          <div className="text-5xl mb-4">✅</div>
          <p className="text-xl font-semibold text-gray-300">No pending reports</p>
          <p className="text-gray-500 text-sm mt-2">All address reports have been handled.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map(r => (
            <div
              key={r.id}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-5"
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-white font-bold text-base">{r.restaurant.name}</h3>
                    <span className="text-xs bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-0.5 rounded-full">
                      Wrong Address
                    </span>
                  </div>

                  <p className="text-gray-400 text-sm mt-1">
                    Current: {r.restaurant.address}, {r.restaurant.city}, {r.restaurant.state} {r.restaurant.zip}
                  </p>

                  {r.googleMapsUrl && (
                    <a
                      href={r.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:text-blue-300 transition-colors mt-1 inline-block"
                    >
                      Suggested Google Maps link ↗
                    </a>
                  )}

                  {r.note && (
                    <p className="text-gray-500 text-xs mt-2 bg-gray-800/50 rounded-lg px-3 py-2">
                      &ldquo;{r.note}&rdquo;
                    </p>
                  )}

                  <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
                    <span>
                      Reported by{' '}
                      <strong className="text-gray-400">
                        {r.user.displayName}
                      </strong>
                      {r.user.email && ` (${r.user.email})`}
                    </span>
                    <span>·</span>
                    <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 shrink-0">
                  <ReportActions
                    reportId={r.id}
                    restaurantId={r.restaurant.id}
                    currentAddress={r.restaurant.address}
                    currentCity={r.restaurant.city}
                    currentState={r.restaurant.state}
                    currentZip={r.restaurant.zip}
                    googleMapsUrl={r.googleMapsUrl}
                  />
                  <Link
                    href={`/admin/restaurants/${r.restaurant.id}/edit`}
                    className="text-xs text-center text-gray-500 hover:text-yellow-400 transition-colors"
                  >
                    Edit restaurant
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
