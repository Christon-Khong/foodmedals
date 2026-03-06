import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/adminAuth'
import { discoverCity, QuotaExhaustedError } from '@/lib/discover-city'
import { getQuotaStatus, getDiscoverSettings } from '@/lib/google-places-quota'

export const maxDuration = 300

export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: { city?: string; state?: string; resultsPerCategory?: number }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const city = body.city?.trim()
  const state = body.state?.trim().toUpperCase()
  if (!city || !state) {
    return NextResponse.json(
      { error: 'city and state are required' },
      { status: 400 },
    )
  }

  // Stream progress events as newline-delimited JSON
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      function send(event: Record<string, unknown>) {
        controller.enqueue(encoder.encode(JSON.stringify(event) + '\n'))
      }

      try {
        const settings = await getDiscoverSettings()
        const result = await discoverCity({
          city,
          state,
          resultsPerCategory: body.resultsPerCategory,
          quotaReserve: settings.verificationReserve,
          minRating: settings.minRating,
          minReviews: settings.minReviews,
          onProgress: (event) => send({ type: 'progress', ...event }),
        })

        const quota = await getQuotaStatus()

        send({
          type: 'complete',
          batchId: result.batchId,
          restaurants: result.restaurants,
          stats: result.stats,
          quota: {
            used: quota.used,
            limit: quota.limit,
            remaining: quota.remaining,
            costToday: quota.costToday,
          },
          errors: result.errors.length > 0 ? result.errors : undefined,
        })
      } catch (err) {
        if (err instanceof QuotaExhaustedError) {
          send({
            type: 'error',
            error: err.message,
            quota: err.quota,
          })
        } else {
          send({
            type: 'error',
            error:
              err instanceof Error ? err.message : 'Discovery failed',
          })
        }
      }

      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
    },
  })
}
