import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ApproveRejectButtons } from './ApproveRejectButtons'
import { CategoryIcon } from '@/components/CategoryIcon'

export const dynamic = 'force-dynamic'

async function getPendingRestaurants() {
  return prisma.restaurant.findMany({
    where:   { status: 'pending_review' },
    orderBy: { createdAt: 'asc' },
    include: {
      submitter:  { select: { id: true, displayName: true, email: true } },
      categories: { include: { foodCategory: { select: { name: true, iconEmoji: true, slug: true } } } },
      _count:     { select: { suggestionVotes: true } },
    },
  })
}

export default async function ModerationQueuePage() {
  const pending = await getPendingRestaurants()

  return (
    <div className="max-w-5xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Moderation Queue</h1>
          <p className="text-gray-400 text-sm mt-1">
            {pending.length} restaurant{pending.length !== 1 ? 's' : ''} awaiting review
          </p>
        </div>
        <Link
          href="/admin/restaurants/all"
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          View all restaurants →
        </Link>
      </div>

      {pending.length === 0 ? (
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-16 text-center">
          <div className="text-5xl mb-4">🎉</div>
          <p className="text-xl font-semibold text-gray-300">Queue is empty!</p>
          <p className="text-gray-500 text-sm mt-2">All submitted restaurants have been reviewed.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map(r => (
            <div
              key={r.id}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-5"
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-white font-bold text-base">{r.name}</h3>
                    <span className="text-xs bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 px-2 py-0.5 rounded-full">
                      Pending
                    </span>
                    {r._count.suggestionVotes > 0 && (
                      <span className="text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full">
                        ▲ {r._count.suggestionVotes} vote{r._count.suggestionVotes !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  <p className="text-gray-400 text-sm mt-1">
                    {r.address}, {r.city}, {r.state} {r.zip}
                  </p>

                  {r.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {r.categories.map(c => (
                        <span key={c.foodCategory.name} className="text-xs bg-gray-800 text-gray-300 border border-gray-700 px-2 py-0.5 rounded-full">
                          <CategoryIcon slug={c.foodCategory.slug} iconEmoji={c.foodCategory.iconEmoji} /> {c.foodCategory.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {r.description && (
                    <p className="text-gray-500 text-xs mt-2 line-clamp-2">{r.description}</p>
                  )}

                  {r.websiteUrl && (
                    <a
                      href={r.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:text-blue-300 transition-colors mt-1 inline-block"
                    >
                      {r.websiteUrl} ↗
                    </a>
                  )}

                  <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
                    <span>
                      Submitted by{' '}
                      <strong className="text-gray-400">
                        {r.submitter?.displayName ?? 'Anonymous'}
                      </strong>
                      {r.submitter?.email && ` (${r.submitter.email})`}
                    </span>
                    <span>·</span>
                    <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 shrink-0">
                  <ApproveRejectButtons restaurantId={r.id} restaurantName={r.name} />
                  <Link
                    href={`/admin/restaurants/${r.id}/edit`}
                    className="text-xs text-center text-gray-500 hover:text-yellow-400 transition-colors"
                  >
                    Edit details
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
