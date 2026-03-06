import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/adminAuth'
import { prisma } from '@/lib/prisma'
import { discoverCity, QuotaExhaustedError } from '@/lib/discover-city'
import { getQuotaStatus, getVerificationReserve } from '@/lib/google-places-quota'
import { verifyAddresses } from '@/lib/verify-addresses'

export const maxDuration = 300

type ProcessResult = {
  id: string
  city: string
  state: string
  status: 'completed' | 'failed' | 'skipped'
  batchId?: string
  error?: string
}

async function isAuthorized(req: NextRequest): Promise<boolean> {
  // Check admin session (manual trigger from UI)
  const session = await getAdminSession()
  if (session) return true

  // Check CRON_SECRET for Vercel cron jobs
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) return true

  return false
}

async function processQueue(): Promise<{
  results: ProcessResult[]
  verification: { checked: number; updated: number; failed: number; skipped: number } | null
  quota: Awaited<ReturnType<typeof getQuotaStatus>>
}> {
  const results: ProcessResult[] = []
  const reserve = await getVerificationReserve()

  while (true) {
    // Check remaining quota — need ~30+ calls for a city search, plus reserve for verification
    const quota = await getQuotaStatus()
    if (quota.remaining < 30 + reserve) {
      break
    }

    // Grab next pending item in priority order
    const item = await prisma.searchQueueItem.findFirst({
      where: { status: 'pending' },
      orderBy: { sortOrder: 'asc' },
    })

    if (!item) break // Queue empty

    // Mark as processing
    await prisma.searchQueueItem.update({
      where: { id: item.id },
      data: { status: 'processing' },
    })

    try {
      const result = await discoverCity({
        city: item.city,
        state: item.state,
        resultsPerCategory: item.resultsPerCategory,
        quotaReserve: reserve,
      })

      await prisma.searchQueueItem.update({
        where: { id: item.id },
        data: {
          status: 'completed',
          discoveryBatchId: result.batchId ?? null,
          processedAt: new Date(),
          error: null,
        },
      })

      results.push({
        id: item.id,
        city: item.city,
        state: item.state,
        status: 'completed',
        batchId: result.batchId,
      })
    } catch (err) {
      const isQuotaError = err instanceof QuotaExhaustedError

      await prisma.searchQueueItem.update({
        where: { id: item.id },
        data: {
          // Put back to pending if quota issue, so it retries next day
          status: isQuotaError ? 'pending' : 'failed',
          error: err instanceof Error ? err.message : 'Unknown error',
        },
      })

      if (isQuotaError) {
        results.push({
          id: item.id,
          city: item.city,
          state: item.state,
          status: 'skipped',
          error: 'Quota exhausted',
        })
        break // Stop — quota done for today
      }

      results.push({
        id: item.id,
        city: item.city,
        state: item.state,
        status: 'failed',
        error: err instanceof Error ? err.message : 'Unknown error',
      })
    }
  }

  // After queue processing, use remaining quota for address verification
  let verification = null
  const quotaAfterQueue = await getQuotaStatus()
  const checksAvailable = Math.min(quotaAfterQueue.remaining, reserve)

  if (checksAvailable > 0) {
    verification = await verifyAddresses(checksAvailable)
  }

  const quota = await getQuotaStatus()
  return { results, verification, quota }
}

// POST — process queue (manual trigger from UI)
export async function POST(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const data = await processQueue()
  return NextResponse.json(data)
}

// GET — process queue (Vercel cron)
export async function GET(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const data = await processQueue()
  return NextResponse.json(data)
}
