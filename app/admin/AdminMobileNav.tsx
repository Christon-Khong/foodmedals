'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { AdminNav } from './AdminNav'

export function AdminMobileNav({ email }: { email: string }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const close = useCallback(() => setOpen(false), [])

  // Close drawer on navigation
  const prevPath = useState(pathname)[0]
  if (pathname !== prevPath && open) {
    setOpen(false)
  }

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(true)}
        className="p-1.5 -ml-1.5 text-gray-400 hover:text-white transition-colors"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-40"
          onClick={close}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 left-0 w-64 bg-gray-950 border-r border-gray-800 z-50 flex flex-col transform transition-transform duration-200 ease-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-14 flex items-center justify-between px-5 border-b border-gray-800">
          <span className="text-sm font-bold text-gray-300">FoodMedals Admin</span>
          <button
            onClick={close}
            className="p-1 text-gray-400 hover:text-white transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Reuse AdminNav — clicks close the drawer */}
        <div onClick={close}>
          <AdminNav />
        </div>

        <div className="px-5 py-4 border-t border-gray-800 mt-auto">
          <p className="text-xs text-gray-500 truncate">{email}</p>
          <Link href="/" className="text-xs text-gray-600 hover:text-gray-300 transition-colors mt-1 block">
            &larr; Back to site
          </Link>
        </div>
      </div>
    </div>
  )
}
