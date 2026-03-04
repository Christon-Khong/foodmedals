'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useSession, signOut } from 'next-auth/react'
import { useState } from 'react'

export function Navbar() {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)

  return (
    <nav className="bg-white border-b border-amber-100 sticky top-0 z-20">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-1.5 font-bold text-gray-900 text-lg">
          <Image src="/medals/gold.png" alt="medal" width={24} height={24} />
          <span className="hidden sm:inline">FoodMedals</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden sm:flex items-center gap-1">
          <Link href="/categories"   className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 rounded-lg hover:bg-amber-50 transition-colors">Categories</Link>
          {session ? (
            <>
              <Link href="/my-medals" className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 rounded-lg hover:bg-amber-50 transition-colors">My Medals</Link>
              {session.user?.isAdmin && (
                <Link href="/admin" className="px-3 py-1.5 text-sm text-yellow-700 hover:text-yellow-900 rounded-lg hover:bg-yellow-50 transition-colors font-medium">Admin</Link>
              )}
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="ml-1 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-900 rounded-lg hover:bg-amber-50 transition-colors"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/signin" className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 rounded-lg hover:bg-amber-50 transition-colors">Sign in</Link>
              <Link href="/auth/signup" className="ml-1 px-4 py-1.5 text-sm font-semibold bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded-full transition-colors">
                Sign up
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="sm:hidden p-2 rounded-lg hover:bg-amber-50 transition-colors"
          onClick={() => setOpen(o => !o)}
          aria-label="Toggle menu"
        >
          <div className="w-5 flex flex-col gap-1">
            <span className={`block h-0.5 bg-gray-700 transition-all ${open ? 'rotate-45 translate-y-1.5' : ''}`} />
            <span className={`block h-0.5 bg-gray-700 transition-all ${open ? 'opacity-0' : ''}`} />
            <span className={`block h-0.5 bg-gray-700 transition-all ${open ? '-rotate-45 -translate-y-1.5' : ''}`} />
          </div>
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="sm:hidden border-t border-amber-100 bg-white px-4 py-3 flex flex-col gap-1">
          <Link href="/categories"   onClick={() => setOpen(false)} className="py-2 text-sm text-gray-700">Categories</Link>
          {session ? (
            <>
              <Link href="/my-medals" onClick={() => setOpen(false)} className="py-2 text-sm text-gray-700">My Medals</Link>
              {session.user?.isAdmin && (
                <Link href="/admin" onClick={() => setOpen(false)} className="py-2 text-sm font-medium text-yellow-700">Admin</Link>
              )}
              <button onClick={() => signOut({ callbackUrl: '/' })} className="py-2 text-sm text-left text-gray-500">Sign out</button>
            </>
          ) : (
            <>
              <Link href="/auth/signin" onClick={() => setOpen(false)} className="py-2 text-sm text-gray-700">Sign in</Link>
              <Link href="/auth/signup" onClick={() => setOpen(false)} className="py-2 text-sm font-semibold text-yellow-700">Sign up free</Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
