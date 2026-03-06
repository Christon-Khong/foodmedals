import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getAdminSession } from '@/lib/adminAuth'
import { AdminNav } from './AdminNav'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession()
  if (!session) redirect('/auth/signin?callbackUrl=/admin')

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-gray-800 flex flex-col">
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
