import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getAdminSession } from '@/lib/adminAuth'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession()
  if (!session) redirect('/auth/signin?callbackUrl=/admin')

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-gray-800 flex flex-col">
        <div className="h-14 flex items-center px-5 border-b border-gray-800">
          <Link href="/" className="flex items-center gap-2 text-sm font-bold text-white">
            <Image src="/medals/gold.png" alt="medal" width={20} height={20} />
            <span className="text-gray-300">FoodMedals</span>
            <span className="ml-1 text-[10px] bg-yellow-500 text-gray-900 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">Admin</span>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 text-sm">
          <p className="px-2 text-[10px] uppercase tracking-widest text-gray-600 font-semibold mb-2">Overview</p>
          <NavLink href="/admin">Dashboard</NavLink>

          <p className="px-2 text-[10px] uppercase tracking-widest text-gray-600 font-semibold mt-4 mb-2">Restaurants</p>
          <NavLink href="/admin/restaurants">Moderation Queue</NavLink>
          <NavLink href="/admin/restaurants/all">All Restaurants</NavLink>

          <p className="px-2 text-[10px] uppercase tracking-widest text-gray-600 font-semibold mt-4 mb-2">Data</p>
          <NavLink href="/admin/categories">Categories</NavLink>
          <NavLink href="/admin/users">Users</NavLink>
          <NavLink href="/admin/tiers">Tier Preview</NavLink>
        </nav>

        <div className="px-5 py-4 border-t border-gray-800">
          <p className="text-xs text-gray-500 truncate">{session.user.email}</p>
          <Link href="/" className="text-xs text-gray-600 hover:text-gray-300 transition-colors mt-1 block">
            ← Back to site
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-gray-800 flex items-center px-6">
          <span className="text-sm text-gray-500">Signed in as <strong className="text-gray-300">{session.user.name}</strong></span>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
    >
      {children}
    </Link>
  )
}
