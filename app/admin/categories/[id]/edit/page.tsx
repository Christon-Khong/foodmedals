import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { CategoryEditForm } from './CategoryEditForm'

export const dynamic = 'force-dynamic'

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const category = await prisma.foodCategory.findUnique({
    where: { id },
    include: {
      _count: { select: { restaurants: true, medals: true } },
    },
  })

  if (!category) notFound()

  return (
    <div className="max-w-2xl">
      <CategoryEditForm
        category={{
          id: category.id,
          name: category.name,
          slug: category.slug,
          iconEmoji: category.iconEmoji,
          description: category.description,
          sortOrder: category.sortOrder,
          status: category.status,
        }}
        restaurantCount={category._count.restaurants}
        medalCount={category._count.medals}
      />
    </div>
  )
}
