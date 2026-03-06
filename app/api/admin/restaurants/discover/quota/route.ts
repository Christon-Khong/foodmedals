import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/adminAuth'
import { getQuotaStatus, getVerificationReserve } from '@/lib/google-places-quota'

export async function GET() {
  const session = await getAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const [quota, verificationReserve] = await Promise.all([
    getQuotaStatus(),
    getVerificationReserve(),
  ])
  return NextResponse.json({ ...quota, verificationReserve })
}
