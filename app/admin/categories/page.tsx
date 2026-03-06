import { prisma } from '@/lib/prisma'
import { CategoryList } from './CategoryList'

export const dynamic = 'force-dynamic'

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ icon?: string }>
}) {
  const { icon: iconFilter } = await searchParams

  const categories = await prisma.foodCategory.findMany({
    orderBy: { sortOrder: 'asc' },
    include: {
      _count: { select: { restaurants: true, medals: true } },
    },
  })

  return (
    <CategoryList
      categories={categories.map(c => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        iconEmoji: c.iconEmoji,
        iconUrl: c.iconUrl,
        sortOrder: c.sortOrder,
        status: c.status,
        _count: c._count,
      }))}
      iconFilter={iconFilter}
    />
  )
}
