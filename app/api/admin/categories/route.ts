import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/adminAuth'
import { prisma } from '@/lib/prisma'

/**
 * PATCH: Rename a category or merge one category into another.
 *
 * Rename: { action: "rename", categoryId, newName, newSlug }
 * Merge:  { action: "merge", sourceId, targetId }
 *   - Moves restaurants & medals from source → target (skipping duplicates)
 *   - Deactivates the source category
 */
export async function PATCH(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()

  if (body.action === 'rename') {
    const { categoryId, newName, newSlug } = body
    if (!categoryId || !newName || !newSlug) {
      return NextResponse.json({ error: 'Missing categoryId, newName, or newSlug' }, { status: 400 })
    }
    const updated = await prisma.foodCategory.update({
      where: { id: categoryId },
      data: { name: newName, slug: newSlug },
    })
    return NextResponse.json({ ok: true, category: updated })
  }

  if (body.action === 'merge') {
    const { sourceId, targetId } = body
    if (!sourceId || !targetId || sourceId === targetId) {
      return NextResponse.json({ error: 'Invalid sourceId/targetId' }, { status: 400 })
    }

    // 1. Get existing restaurant links for the target to avoid duplicates
    const existingLinks = await prisma.restaurantCategory.findMany({
      where: { foodCategoryId: targetId },
      select: { restaurantId: true },
    })
    const existingRestaurantIds = new Set(existingLinks.map(l => l.restaurantId))

    // 2. Move restaurant-category links (skip duplicates)
    const sourceLinks = await prisma.restaurantCategory.findMany({
      where: { foodCategoryId: sourceId },
    })
    let movedLinks = 0
    let skippedLinks = 0
    for (const link of sourceLinks) {
      if (existingRestaurantIds.has(link.restaurantId)) {
        // Duplicate — delete the source link
        await prisma.restaurantCategory.delete({ where: { id: link.id } })
        skippedLinks++
      } else {
        // Move to target
        await prisma.restaurantCategory.update({
          where: { id: link.id },
          data: { foodCategoryId: targetId },
        })
        movedLinks++
      }
    }

    // 3. Get existing medals for the target to avoid duplicates
    const existingMedals = await prisma.medal.findMany({
      where: { foodCategoryId: targetId },
      select: { userId: true, medalType: true, year: true },
    })
    const existingMedalKeys = new Set(
      existingMedals.map(m => `${m.userId}_${m.medalType}_${m.year}`)
    )

    // 4. Move medals (skip duplicates)
    const sourceMedals = await prisma.medal.findMany({
      where: { foodCategoryId: sourceId },
    })
    let movedMedals = 0
    let skippedMedals = 0
    for (const medal of sourceMedals) {
      const key = `${medal.userId}_${medal.medalType}_${medal.year}`
      if (existingMedalKeys.has(key)) {
        await prisma.medal.delete({ where: { id: medal.id } })
        skippedMedals++
      } else {
        await prisma.medal.update({
          where: { id: medal.id },
          data: { foodCategoryId: targetId },
        })
        movedMedals++
      }
    }

    // 5. Deactivate the source category
    await prisma.foodCategory.update({
      where: { id: sourceId },
      data: { status: 'inactive' },
    })

    return NextResponse.json({
      ok: true,
      movedLinks,
      skippedLinks,
      movedMedals,
      skippedMedals,
    })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { name, slug, iconEmoji, description, sortOrder } = body

  if (!name || !slug || !iconEmoji) {
    return NextResponse.json({ error: 'Name, slug, and icon emoji are required' }, { status: 400 })
  }
  if (typeof name !== 'string' || name.length > 100) {
    return NextResponse.json({ error: 'Invalid name' }, { status: 400 })
  }
  if (typeof slug !== 'string' || slug.length > 100) {
    return NextResponse.json({ error: 'Invalid slug' }, { status: 400 })
  }

  // Check uniqueness
  const existing = await prisma.foodCategory.findFirst({
    where: { OR: [{ name }, { slug }] },
  })
  if (existing) {
    return NextResponse.json({
      error: existing.name === name ? 'A category with that name already exists' : 'A category with that slug already exists',
    }, { status: 409 })
  }

  const category = await prisma.foodCategory.create({
    data: {
      name: name.trim(),
      slug: slug.trim().toLowerCase(),
      iconEmoji: iconEmoji.trim(),
      description: description?.trim() || null,
      sortOrder: typeof sortOrder === 'number' ? sortOrder : 0,
    },
  })

  return NextResponse.json({ ok: true, category }, { status: 201 })
}
