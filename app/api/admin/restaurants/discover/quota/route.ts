import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/adminAuth'
import { getQuotaStatus, getDiscoverSettings } from '@/lib/google-places-quota'

export async function GET() {
  const session = await getAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const [quota, discoverSettings] = await Promise.all([
    getQuotaStatus(),
    getDiscoverSettings(),
  ])
  return NextResponse.json({ ...quota, ...discoverSettings })
}
