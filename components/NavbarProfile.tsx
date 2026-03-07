'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import { User, Shield, LogOut } from 'lucide-react'

type TierData = {
  label: string
  color: string
  glow: string | null
  glowDim: string | null
  animated: boolean
}

type NavbarData = {
  avatarUrl: string | null
  displayName: string
  tier: TierData | null
}

export function NavbarProfile() {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const [data, setData] = useState<NavbarData | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Fetch tier data on mount
  useEffect(() => {
    if (!session?.user) return
    fetch('/api/profile/navbar')
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setData(d))
      .catch(() => {})
  }, [session?.user])

  // Close on click outside
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open])

  if (!session?.user) return null

  const user = session.user
  const avatarUrl = data?.avatarUrl ?? user.image
  const displayName = data?.displayName ?? user.name ?? 'User'
  const tier = data?.tier ?? null
  const initial = (displayName[0] ?? '?').toUpperCase()

  const auraStyle = tier?.glow
    ? tier.animated
      ? undefined // handled by CSS animation
      : { boxShadow: tier.glow }
    : undefined

  return (
    <div ref={containerRef} className="relative">
      {/* Inject aura animation if tier is animated */}
      {tier?.animated && tier.glow && tier.glowDim && (
        <style>{`
          @keyframes navbar-aura-pulse {
            0%, 100% { box-shadow: ${tier.glowDim}; }
            50% { box-shadow: ${tier.glow}; }
          }
          .navbar-aura { animation: navbar-aura-pulse 3s ease-in-out infinite; }
        `}</style>
      )}

      {/* Avatar button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center focus:outline-none"
        aria-label="Profile menu"
      >
        <div
          className={`w-8 h-8 rounded-full overflow-hidden ${tier?.animated ? 'navbar-aura' : ''}`}
          style={auraStyle}
        >
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={displayName}
              width={32}
              height={32}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-sm font-semibold">
              {initial}
            </div>
          )}
        </div>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl border border-amber-100 shadow-lg z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full overflow-hidden flex-shrink-0 ${tier?.animated ? 'navbar-aura' : ''}`}
              style={auraStyle}
            >
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={displayName}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-base font-semibold">
                  {initial}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
              {tier && (
                <span className={`inline-flex items-center text-[10px] font-bold bg-gradient-to-r ${tier.color} px-2 py-0.5 rounded-full border mt-0.5`}>
                  {tier.label}
                </span>
              )}
            </div>
          </div>

          <div className="border-t border-amber-100" />

          {/* Links */}
          <div className="py-1">
            <Link
              href={user.slug ? `/critics/${user.slug}` : '/my-medals'}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-amber-50 transition-colors"
            >
              <User className="w-4 h-4 text-gray-400" />
              My Profile
            </Link>
            {user.isAdmin && (
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-sm text-yellow-700 hover:bg-yellow-50 transition-colors"
              >
                <Shield className="w-4 h-4 text-yellow-500" />
                Admin
              </Link>
            )}
          </div>

          <div className="border-t border-amber-100" />

          <div className="py-1">
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-amber-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
