import { memo } from 'react'
import Image from 'next/image'

const CUSTOM_ICONS: Record<string, string> = {
  'onion-rings':   '/images/categories/onion-rings.png',
  'pulled-pork':   '/images/categories/pulled-pork.png',
  'bbq-ribs':      '/images/categories/bbq-ribs.png',
  'wings':         '/images/categories/chicken-wings.png',
  'chicken-wings': '/images/categories/chicken-wings.png',
  'pad-thai':      '/images/categories/pad-thai.png',
  'mac-and-cheese':'/images/categories/mac-and-cheese.png',
  'pho':           '/images/categories/pho.png',
  'fried-chicken-sandwich': '/images/categories/fried-chicken-sandwich.png',
  'nachos':        '/images/categories/nachos.png',
  'chicken-tenders':'/images/categories/chicken-tenders.png',
  'acai-bowls':    '/images/categories/acai-bowls.png',
}

type CategoryIconProps = {
  slug: string
  iconEmoji: string
  /** Uploaded icon URL from the database (takes priority over hardcoded map) */
  iconUrl?: string | null
  /** Explicit pixel size — when omitted the image uses 1em (inherits text size) */
  size?: number
}

export const CategoryIcon = memo(function CategoryIcon({ slug, iconEmoji, iconUrl, size }: CategoryIconProps) {
  const src = iconUrl || CUSTOM_ICONS[slug]
  if (src) {
    if (size) {
      return (
        <Image
          src={src}
          alt={slug.replace(/-/g, ' ')}
          width={size}
          height={size}
          className="inline-block"
        />
      )
    }
    // Use 1em so the image auto-matches the parent's text size
    return (
      <Image
        src={src}
        alt={slug.replace(/-/g, ' ')}
        width={0}
        height={0}
        sizes="1em"
        className="inline-block align-middle"
        style={{ width: '1em', height: '1em' }}
      />
    )
  }
  return <>{iconEmoji}</>
})
