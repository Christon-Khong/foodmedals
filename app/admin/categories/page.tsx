import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { CategoryIcon } from '@/components/CategoryIcon'

export const dynamic = 'force-dynamic'

const CUSTOM_ICON_SLUGS = new Set([
  'onion-rings', 'pulled-pork', 'bbq-ribs', 'wings', 'chicken-wings',
  'pad-thai', 'mac-and-cheese', 'pho', 'fried-chicken-sandwich',
  'nachos', 'chicken-tenders', 'acai-bowls',
])

function hasImage(cat: { slug: string; iconUrl: string | null }) {
  return !!(cat.iconUrl || CUSTOM_ICON_SLUGS.has(cat.slug))
}

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

  const filtered = iconFilter === 'emoji'
    ? categories.filter(c => !hasImage(c))
    : iconFilter === 'image'
      ? categories.filter(c => hasImage(c))
      : categories

  const emojiCount = categories.filter(c => !hasImage(c)).length
  const imageCount = categories.filter(c => hasImage(c)).length

  return (
    <div className="max-w-4xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Categories</h1>
          <p className="text-gray-400 text-sm mt-1">{filtered.length} of {categories.length} food categories</p>
        </div>
        <Link
          href="/admin/categories/new"
          className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-semibold rounded-xl text-sm transition-colors"
        >
          + Add Category
        </Link>
      </div>

      <div className="mb-4 flex gap-2">
        {[
          { label: 'All', value: undefined, count: categories.length },
          { label: 'Emoji', value: 'emoji', count: emojiCount },
          { label: 'Image', value: 'image', count: imageCount },
        ].map(f => {
          const active = iconFilter === f.value || (!iconFilter && !f.value)
          return (
            <Link
              key={f.label}
              href={f.value ? `/admin/categories?icon=${f.value}` : '/admin/categories'}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                active
                  ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40'
                  : 'bg-gray-800/50 text-gray-400 border-gray-700 hover:border-gray-600 hover:text-gray-300'
              }`}
            >
              {f.label} ({f.count})
            </Link>
          )
        })}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left px-4 py-3 text-gray-500 font-semibold w-8">#</th>
              <th className="text-left px-4 py-3 text-gray-500 font-semibold">Category</th>
              <th className="text-left px-4 py-3 text-gray-500 font-semibold hidden sm:table-cell">Slug</th>
              <th className="text-center px-4 py-3 text-gray-500 font-semibold">Restaurants</th>
              <th className="text-center px-4 py-3 text-gray-500 font-semibold hidden md:table-cell">Medals</th>
              <th className="text-center px-4 py-3 text-gray-500 font-semibold">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60">
            {filtered.map(cat => (
              <tr key={cat.id} className="hover:bg-gray-800/40 transition-colors">
                <td className="px-4 py-3 text-gray-600 text-xs">{cat.sortOrder}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl"><CategoryIcon slug={cat.slug} iconEmoji={cat.iconEmoji} iconUrl={cat.iconUrl} /></span>
                    <span className="font-medium text-white">{cat.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500 font-mono text-xs hidden sm:table-cell">{cat.slug}</td>
                <td className="px-4 py-3 text-center text-gray-300">{cat._count.restaurants}</td>
                <td className="px-4 py-3 text-center text-gray-300 hidden md:table-cell">{cat._count.medals}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                    cat.status === 'active'
                      ? 'bg-green-500/15 text-green-400 border-green-500/30'
                      : 'bg-gray-700/50 text-gray-400 border-gray-600/30'
                  }`}>
                    {cat.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/categories/${cat.id}/edit`}
                      className="text-xs text-gray-500 hover:text-yellow-400 transition-colors"
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/categories/${cat.slug}`}
                      target="_blank"
                      className="text-xs text-gray-500 hover:text-yellow-400 transition-colors"
                    >
                      View ↗
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
