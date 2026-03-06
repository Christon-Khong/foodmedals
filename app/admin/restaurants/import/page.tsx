import { prisma } from '@/lib/prisma'
import { BulkImportForm } from './BulkImportForm'
import { ApiReference } from './ApiReference'

export const dynamic = 'force-dynamic'

export default async function BulkImportPage() {
  const categories = await prisma.foodCategory.findMany({
    where: { status: 'active' },
    select: { id: true, name: true, iconEmoji: true, iconUrl: true, slug: true },
    orderBy: { sortOrder: 'asc' },
  })

  const slugs = categories.map(c => c.slug)
  const apiKey = process.env.ADMIN_API_KEY ?? ''

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Bulk Import Restaurants</h1>
        <p className="text-gray-400 text-sm mt-1">
          Import multiple restaurants from Google Maps URLs. Restaurants are created as Active with verified category links.
        </p>
      </div>
      <BulkImportForm categories={categories} />
      <ApiReference categories={categories} slugs={slugs} apiKey={apiKey} />
    </div>
  )
}
