import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, restaurants] = await Promise.all([
    prisma.foodCategory.findMany({ where: { status: 'active' } }),
    prisma.restaurant.findMany({ where: { status: 'active' } }),
  ])

  return [
    { url: 'https://foodmedals.com',             changeFrequency: 'daily',   priority: 1.0 },
    { url: 'https://foodmedals.com/categories',  changeFrequency: 'weekly',  priority: 0.8 },
    { url: 'https://foodmedals.com/privacy',     changeFrequency: 'yearly',  priority: 0.3 },
    { url: 'https://foodmedals.com/terms',       changeFrequency: 'yearly',  priority: 0.3 },
    ...categories.map(c => ({
      url:             `https://foodmedals.com/categories/${c.slug}`,
      changeFrequency: 'daily' as const,
      priority:        0.9,
    })),
    ...restaurants.map(r => ({
      url:             `https://foodmedals.com/restaurants/${r.slug}`,
      changeFrequency: 'weekly' as const,
      priority:        0.7,
    })),
  ]
}
