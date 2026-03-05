'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

export function Pagination({
  page,
  totalPages,
  total,
  perPage,
}: {
  page: number
  totalPages: number
  total: number
  perPage: number
}) {
  const searchParams = useSearchParams()

  if (totalPages <= 1) return null

  function pageHref(p: number) {
    const params = new URLSearchParams(searchParams.toString())
    if (p > 1) {
      params.set('page', String(p))
    } else {
      params.delete('page')
    }
    const qs = params.toString()
    return `/admin/restaurants/all${qs ? `?${qs}` : ''}`
  }

  // Build page number array with ellipsis
  const pages: (number | '...')[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (page > 3) pages.push('...')
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i)
    }
    if (page < totalPages - 2) pages.push('...')
    pages.push(totalPages)
  }

  const start = (page - 1) * perPage + 1
  const end = Math.min(page * perPage, total)

  return (
    <div className="flex items-center justify-between mt-4 text-sm">
      <p className="text-gray-500 text-xs">
        Showing {start}–{end} of {total}
      </p>

      <div className="flex items-center gap-1">
        {page > 1 ? (
          <Link
            href={pageHref(page - 1)}
            className="px-2.5 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            Prev
          </Link>
        ) : (
          <span className="px-2.5 py-1.5 rounded-lg text-xs text-gray-600 cursor-not-allowed">
            Prev
          </span>
        )}

        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} className="px-1.5 text-gray-600 text-xs">...</span>
          ) : (
            <Link
              key={p}
              href={pageHref(p)}
              className={`px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                p === page
                  ? 'bg-gray-700 text-white font-medium'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {p}
            </Link>
          ),
        )}

        {page < totalPages ? (
          <Link
            href={pageHref(page + 1)}
            className="px-2.5 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            Next
          </Link>
        ) : (
          <span className="px-2.5 py-1.5 rounded-lg text-xs text-gray-600 cursor-not-allowed">
            Next
          </span>
        )}
      </div>
    </div>
  )
}
