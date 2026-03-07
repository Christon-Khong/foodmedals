import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { city, state } = body as { city?: string | null; state?: string | null }

  // Allow clearing city (set to null) or updating it
  const data: Record<string, string | null> = {}

  if ('city' in body) {
    data.city = typeof city === 'string' && city.trim() ? city.trim() : null
  }
  if ('state' in body) {
    data.state = typeof state === 'string' && state.trim() ? state.trim() : null
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data,
  })

  return NextResponse.json({ ok: true })
}
