import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getSupabaseAdmin, REVIEW_PHOTO_BUCKET } from '@/lib/supabase'
import sharp from 'sharp'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await req.formData()
  const medalId = formData.get('medalId') as string | null
  const comment = formData.get('comment') as string | null
  const photo = formData.get('photo') as File | null
  const removePhoto = formData.get('removePhoto') === 'true'

  if (!medalId || !comment) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const trimmed = comment.trim()
  if (trimmed.length === 0 || trimmed.length > 500) {
    return NextResponse.json({ error: 'Comment must be 1-500 characters' }, { status: 400 })
  }

  // Verify medal belongs to user and is gold
  const medal = await prisma.medal.findUnique({
    where: { id: medalId },
    select: { userId: true, medalType: true, restaurantId: true, foodCategoryId: true, year: true },
  })

  if (!medal) {
    return NextResponse.json({ error: 'Medal not found' }, { status: 404 })
  }

  if (medal.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not your medal' }, { status: 403 })
  }

  if (medal.medalType !== 'gold') {
    return NextResponse.json({ error: 'Comments are only for gold medals' }, { status: 400 })
  }

  const currentUTCYear = new Date().getUTCFullYear()
  if (medal.year < currentUTCYear) {
    return NextResponse.json({ error: 'Comments on past-year medals are locked' }, { status: 403 })
  }

  // Process photo if provided
  let photoUrl: string | null | undefined = undefined // undefined = don't change
  if (photo && photo.size > 0) {
    if (!photo.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Please select an image file.' }, { status: 400 })
    }
    if (photo.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image must be under 10MB.' }, { status: 400 })
    }

    const buffer = Buffer.from(await photo.arrayBuffer())
    const optimized = await sharp(buffer)
      .resize(1200, undefined, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer()

    const filePath = `${session.user.id}-${medal.foodCategoryId}-${medal.restaurantId}-${medal.year}.webp`

    const { error: uploadError } = await getSupabaseAdmin().storage
      .from(REVIEW_PHOTO_BUCKET)
      .upload(filePath, optimized, {
        contentType: 'image/webp',
        upsert: true,
      })

    if (uploadError) {
      console.error('Supabase review photo upload error:', uploadError)
      return NextResponse.json({ error: 'Photo upload failed' }, { status: 500 })
    }

    const { data: urlData } = getSupabaseAdmin().storage
      .from(REVIEW_PHOTO_BUCKET)
      .getPublicUrl(filePath)

    photoUrl = `${urlData.publicUrl}?v=${Date.now()}`
  } else if (removePhoto) {
    photoUrl = null
  }

  // Upsert by composite key (userId + categoryId + restaurantId + year)
  const goldComment = await prisma.goldMedalComment.upsert({
    where: {
      userId_foodCategoryId_restaurantId_year: {
        userId: session.user.id,
        foodCategoryId: medal.foodCategoryId,
        restaurantId: medal.restaurantId,
        year: medal.year,
      },
    },
    update: {
      comment: trimmed,
      active: true,
      medalId,
      ...(photoUrl !== undefined ? { photoUrl } : {}),
    },
    create: {
      medalId,
      userId: session.user.id,
      restaurantId: medal.restaurantId,
      foodCategoryId: medal.foodCategoryId,
      year: medal.year,
      comment: trimmed,
      photoUrl: photoUrl ?? null,
    },
  })

  return NextResponse.json(goldComment)
}
