import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/adminAuth'
import { prisma } from '@/lib/prisma'
import { getSupabaseAdmin, ICON_BUCKET } from '@/lib/supabase'
import sharp from 'sharp'

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
const MAX_SIZE = 2 * 1024 * 1024 // 2 MB

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const category = await prisma.foodCategory.findUnique({ where: { id } })
  if (!category) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type. Use PNG, JPEG, WebP, or SVG.' }, { status: 400 })
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File too large. Max 2 MB.' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  // Optimize: resize to 256x256, convert to WebP
  const optimized = await sharp(buffer)
    .resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 85 })
    .toBuffer()

  const filePath = `${category.slug}.webp`

  // Upload (upsert) to Supabase Storage
  const { error: uploadError } = await getSupabaseAdmin().storage
    .from(ICON_BUCKET)
    .upload(filePath, optimized, {
      contentType: 'image/webp',
      upsert: true,
    })

  if (uploadError) {
    console.error('Supabase upload error:', uploadError)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }

  // Build public URL
  const { data: urlData } = getSupabaseAdmin().storage
    .from(ICON_BUCKET)
    .getPublicUrl(filePath)

  // Append cache-bust param so browsers pick up re-uploads
  const iconUrl = `${urlData.publicUrl}?v=${Date.now()}`

  await prisma.foodCategory.update({
    where: { id },
    data: { iconUrl },
  })

  return NextResponse.json({ ok: true, iconUrl })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const category = await prisma.foodCategory.findUnique({ where: { id } })
  if (!category) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (category.iconUrl) {
    const filePath = `${category.slug}.webp`
    await getSupabaseAdmin().storage.from(ICON_BUCKET).remove([filePath])
    await prisma.foodCategory.update({
      where: { id },
      data: { iconUrl: null },
    })
  }

  return NextResponse.json({ ok: true })
}
