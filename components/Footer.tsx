import Link from 'next/link'
import Image from 'next/image'

export function Footer() {
  return (
    <footer className="border-t border-amber-100 bg-white">
      <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-400">
        <span className="flex items-center gap-1.5">
          <Image src="/images/logo.png" alt="" width={18} height={18} />
          FoodMedals · Community Food Rankings
        </span>
        <div className="flex gap-4">
          <Link href="/categories" className="hover:text-gray-600 transition-colors">Categories</Link>
          <Link href="/privacy" className="hover:text-gray-600 transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-gray-600 transition-colors">Terms</Link>
        </div>
      </div>
    </footer>
  )
}
