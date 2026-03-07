import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getAdminSession } from '@/lib/adminAuth'
import { AdminNav } from './AdminNav'
import { AdminMobileNav } from './AdminMobileNav'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession()
  if (!session) redirect('/auth/signin?callbackUrl=/admin')

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex">
      {/* Desktop Sidebar — hidden on mobile */}
      <aside className="hidden md:flex w-56 shrink-0 border-r border-gray-800 flex-col">
        <div className="h-14 flex items-center px-5 border-b border-gray-800">
          <Link href="/" className="flex items-center gap-2 text-sm font-bold text-white">
            <Image src="/medals/gold.webp" alt="medal" width={20} height={20} />
            <span className="text-gray-300">FoodMedals</span>
            <span className="ml-1 text-[10px] bg-yellow-500 text-gray-900 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">Admin</span>
          </Link>
        </div>

        <AdminNav />

        <div className="px-5 py-4 border-t border-gray-800">
          <p className="text-xs text-gray-500 truncate">{session.user.email}</p>
          <Link href="/" className="text-xs text-gray-600 hover:text-gray-300 transition-colors mt-1 block">
            &larr; Back to site
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-gray-800 flex items-center px-4 sm:px-6 gap-3">
          {/* Mobile hamburger + drawer */}
          <AdminMobileNav email={session.user.email ?? ''} />
          <span className="text-sm text-gray-500 hidden sm:inline">
            Signed in as <strong className="text-gray-300">{session.user.name}</strong>
          </span>
          {/* Mobile: compact header */}
          <span className="text-sm text-gray-500 sm:hidden flex items-center gap-2">
            <Image src="/medals/gold.webp" alt="medal" width={16} height={16} />
            <span className="text-gray-300 font-bold">Admin</span>
          </span>
        </header>
        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
