import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { RestaurantEditForm } from './RestaurantEditForm'

export const dynamic = 'force-dynamic'

export default async function EditRestaurantPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
    include: {
      categories: {
        include: {
          foodCategory: { select: { id: true, name: true, iconEmoji: true, iconUrl: true, slug: true } },
        },
      },
      _count: { select: { medals: true } },
    },
  })

  if (!restaurant) notFound()

  const allCategories = await prisma.foodCategory.findMany({
    where: { status: 'active' },
    select: { id: true, name: true, iconEmoji: true, iconUrl: true, slug: true },
    orderBy: { sortOrder: 'asc' },
  })

  return (
    <div className="max-w-2xl">
      <RestaurantEditForm
        restaurant={{
          id: restaurant.id,
          name: restaurant.name,
          slug: restaurant.slug,
          address: restaurant.address,
          city: restaurant.city,
          state: restaurant.state,
          zip: restaurant.zip,
          lat: restaurant.lat,
          lng: restaurant.lng,
          description: restaurant.description,
          websiteUrl: restaurant.websiteUrl,
          status: restaurant.status,
        }}
        allCategories={allCategories}
        currentCategoryIds={restaurant.categories.map((c) => c.foodCategory.id)}
        medalCount={restaurant._count.medals}
      />
    </div>
  )
}
