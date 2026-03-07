import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/adminAuth'
import { generateAnnualAwards } from '@/lib/annual-awards'

export const maxDuration = 300

async function isAuthorized(req: NextRequest): Promise<boolean> {
  const session = await getAdminSession()
  if (session) return true

  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) return true

  return false
}

// GET — called by Vercel cron (Jan 1 01:00 UTC)
export async function GET(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const year = new Date().getUTCFullYear() - 1
  const result = await generateAnnualAwards(year)
  return NextResponse.json(result)
}

// POST — manual admin trigger with optional year override
export async function POST(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const year = typeof body.year === 'number' ? body.year : new Date().getUTCFullYear() - 1

  const result = await generateAnnualAwards(year)
  return NextResponse.json(result)
}
