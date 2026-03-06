import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/adminAuth'
import { prisma } from '@/lib/prisma'
import { DEFAULT_MAX_COMMUNITY_SCORE } from '@/lib/tiers'

/** GET /api/admin/settings — fetch current admin settings */
export async function GET() {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const row = await prisma.adminSettings.findUnique({
    where: { id: 'singleton' },
  })

  return NextResponse.json({
    maxCommunityScore: row?.maxCommunityScore ?? DEFAULT_MAX_COMMUNITY_SCORE,
    placesApiDailyLimit: row?.placesApiDailyLimit ?? 200,
    apiVerificationReserve: row?.apiVerificationReserve ?? 40,
    discoverMinRating: row?.discoverMinRating ?? 4.5,
    discoverMinReviews: row?.discoverMinReviews ?? 100,
  })
}

/** PUT /api/admin/settings — update admin settings */
export async function PUT(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()

  // Build update data from provided fields
  const updateData: Record<string, number> = {}

  if (body.maxCommunityScore !== undefined) {
    const val = Number(body.maxCommunityScore)
    if (!val || val < 10 || val > 1000) {
      return NextResponse.json(
        { error: 'maxCommunityScore must be between 10 and 1000' },
        { status: 400 },
      )
    }
    updateData.maxCommunityScore = val
  }

  if (body.placesApiDailyLimit !== undefined) {
    const val = Number(body.placesApiDailyLimit)
    if (!Number.isInteger(val) || val < 1 || val > 10000) {
      return NextResponse.json(
        { error: 'placesApiDailyLimit must be between 1 and 10000' },
        { status: 400 },
      )
    }
    updateData.placesApiDailyLimit = val
  }

  if (body.apiVerificationReserve !== undefined) {
    const val = Number(body.apiVerificationReserve)
    if (!Number.isInteger(val) || val < 0 || val > 500) {
      return NextResponse.json(
        { error: 'apiVerificationReserve must be between 0 and 500' },
        { status: 400 },
      )
    }
    updateData.apiVerificationReserve = val
  }

  if (body.discoverMinRating !== undefined) {
    const val = Number(body.discoverMinRating)
    if (isNaN(val) || val < 0 || val > 5) {
      return NextResponse.json(
        { error: 'discoverMinRating must be between 0 and 5' },
        { status: 400 },
      )
    }
    updateData.discoverMinRating = val
  }

  if (body.discoverMinReviews !== undefined) {
    const val = Number(body.discoverMinReviews)
    if (!Number.isInteger(val) || val < 0 || val > 10000) {
      return NextResponse.json(
        { error: 'discoverMinReviews must be between 0 and 10000' },
        { status: 400 },
      )
    }
    updateData.discoverMinReviews = val
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(
      { error: 'No valid settings provided' },
      { status: 400 },
    )
  }

  const row = await prisma.adminSettings.upsert({
    where: { id: 'singleton' },
    update: updateData,
    create: { id: 'singleton', ...updateData },
  })

  return NextResponse.json({
    maxCommunityScore: row.maxCommunityScore,
    placesApiDailyLimit: row.placesApiDailyLimit,
    apiVerificationReserve: row.apiVerificationReserve,
    discoverMinRating: row.discoverMinRating,
    discoverMinReviews: row.discoverMinReviews,
  })
}
