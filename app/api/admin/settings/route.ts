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
  })
}

/** PUT /api/admin/settings — update admin settings */
export async function PUT(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const maxCommunityScore = Number(body.maxCommunityScore)

  if (!maxCommunityScore || maxCommunityScore < 10 || maxCommunityScore > 1000) {
    return NextResponse.json(
      { error: 'maxCommunityScore must be between 10 and 1000' },
      { status: 400 },
    )
  }

  const row = await prisma.adminSettings.upsert({
    where: { id: 'singleton' },
    update: { maxCommunityScore },
    create: { id: 'singleton', maxCommunityScore },
  })

  return NextResponse.json({
    maxCommunityScore: row.maxCommunityScore,
  })
}
