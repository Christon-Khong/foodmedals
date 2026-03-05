import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/adminAuth'
import { prisma } from '@/lib/prisma'
import { generateUserSlug } from '@/lib/queries'

export async function POST() {
  const session = await getAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const users = await prisma.user.findMany({
    where: { slug: null },
    select: { id: true, displayName: true },
  })

  let updated = 0
  for (const user of users) {
    const slug = await generateUserSlug(user.displayName)
    await prisma.user.update({ where: { id: user.id }, data: { slug } })
    updated++
  }

  return NextResponse.json({ updated })
}
