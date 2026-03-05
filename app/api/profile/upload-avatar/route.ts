import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getSupabaseAdmin, AVATAR_BUCKET } from '@/lib/supabase'
import sharp from 'sharp'

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024 // 5 MB

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type. Use PNG, JPEG, or WebP.' }, { status: 400 })
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File too large. Max 5 MB.' }, { status: 400 })
  }

  // Parse crop coordinates from form data
  const cropX = parseInt(formData.get('cropX') as string) || 0
  const cropY = parseInt(formData.get('cropY') as string) || 0
  const cropSize = parseInt(formData.get('cropSize') as string) || 0

  const buffer = Buffer.from(await file.arrayBuffer())

  let pipeline = sharp(buffer)

  // Apply crop if valid coordinates provided
  if (cropSize > 0) {
    const metadata = await sharp(buffer).metadata()
    const imgWidth = metadata.width ?? 0
    const imgHeight = metadata.height ?? 0

    // Clamp crop region to image bounds
    const left = Math.max(0, Math.min(cropX, imgWidth - 1))
    const top = Math.max(0, Math.min(cropY, imgHeight - 1))
    const size = Math.min(cropSize, imgWidth - left, imgHeight - top)

    if (size > 0) {
      pipeline = pipeline.extract({ left, top, width: size, height: size })
    }
  }

  // Resize to 256x256 and convert to WebP
  const optimized = await pipeline
    .resize(256, 256, { fit: 'cover' })
    .webp({ quality: 85 })
    .toBuffer()

  const filePath = `${session.user.id}.webp`

  const { error: uploadError } = await getSupabaseAdmin().storage
    .from(AVATAR_BUCKET)
    .upload(filePath, optimized, {
      contentType: 'image/webp',
      upsert: true,
    })

  if (uploadError) {
    console.error('Supabase avatar upload error:', uploadError)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }

  const { data: urlData } = getSupabaseAdmin().storage
    .from(AVATAR_BUCKET)
    .getPublicUrl(filePath)

  const avatarUrl = `${urlData.publicUrl}?v=${Date.now()}`

  await prisma.user.update({
    where: { id: session.user.id },
    data: { avatarUrl },
  })

  return NextResponse.json({ ok: true, avatarUrl })
}
