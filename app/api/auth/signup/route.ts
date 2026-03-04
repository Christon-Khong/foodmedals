import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { generateUserSlug } from '@/lib/queries'

export async function POST(req: NextRequest) {
  const { email, password, displayName, city } = await req.json()

  if (!email || !password || !displayName) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
  if (existing) {
    return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const slug = await generateUserSlug(displayName.trim())
  const user = await prisma.user.create({
    data: {
      email:        email.toLowerCase(),
      passwordHash,
      displayName:  displayName.trim(),
      slug,
      city:         city?.trim() || null,
    },
  })

  return NextResponse.json({ id: user.id, email: user.email }, { status: 201 })
}
