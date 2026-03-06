'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ClipboardCheck,
  Store,
  Upload,
  Search,
  MapPin,
  AlertTriangle,
  XCircle,
  Tag,
  Users,
  Trophy,
} from 'lucide-react'

type NavItem = {
  href: string
  label: string
  icon: React.ReactNode
  exact?: boolean
}

type NavGroup = {
  title: string
  items: NavItem[]
}

const NAV: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      { href: '/admin', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" />, exact: true },
    ],
  },
  {
    title: 'Restaurants',
    items: [
      { href: '/admin/restaurants', label: 'Moderation Queue', icon: <ClipboardCheck className="w-4 h-4" />, exact: true },
      { href: '/admin/restaurants/all', label: 'All Restaurants', icon: <Store className="w-4 h-4" /> },
    ],
  },
  {
    title: 'Import Tools',
    items: [
      { href: '/admin/restaurants/import', label: 'Bulk Import', icon: <Upload className="w-4 h-4" /> },
      { href: '/admin/restaurants/discover', label: 'Discover', icon: <Search className="w-4 h-4" /> },
      { href: '/admin/restaurants/geocode', label: 'Missing Geocodes', icon: <MapPin className="w-4 h-4" /> },
    ],
  },
  {
    title: 'Reports',
    items: [
      { href: '/admin/reports', label: 'Address Reports', icon: <AlertTriangle className="w-4 h-4" /> },
      { href: '/admin/closure-reports', label: 'Closure Reports', icon: <XCircle className="w-4 h-4" /> },
    ],
  },
  {
    title: 'Data',
    items: [
      { href: '/admin/categories', label: 'Categories', icon: <Tag className="w-4 h-4" /> },
      { href: '/admin/users', label: 'Users', icon: <Users className="w-4 h-4" /> },
      { href: '/admin/tiers', label: 'Tier Preview', icon: <Trophy className="w-4 h-4" /> },
    ],
  },
]

export function AdminNav() {
  const pathname = usePathname()

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <nav className="flex-1 px-3 py-4 space-y-5 text-sm overflow-y-auto">
      {NAV.map(group => (
        <div key={group.title}>
          <p className="px-2 text-[10px] uppercase tracking-widest text-gray-600 font-semibold mb-1.5">
            {group.title}
          </p>
          <div className="space-y-0.5">
            {group.items.map(item => {
              const active = isActive(item.href, item.exact)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors ${
                    active
                      ? 'bg-yellow-500/10 text-yellow-300 font-medium'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <span className={active ? 'text-yellow-400' : 'text-gray-600'}>{item.icon}</span>
                  {item.label}
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </nav>
  )
}
