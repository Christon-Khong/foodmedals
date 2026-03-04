import Image from 'next/image'

const CUSTOM_ICONS: Record<string, string> = {
  'onion-rings':   '/images/categories/onion-rings.png',
  'pulled-pork':   '/images/categories/pulled-pork.png',
  'bbq-ribs':      '/images/categories/bbq-ribs.png',
  'wings':         '/images/categories/chicken-wings.png',
  'chicken-wings': '/images/categories/chicken-wings.png',
}

type CategoryIconProps = {
  slug: string
  iconEmoji: string
  /** Explicit pixel size — when omitted the image uses 1em (inherits text size) */
  size?: number
}

export function CategoryIcon({ slug, iconEmoji, size }: CategoryIconProps) {
  const src = CUSTOM_ICONS[slug]
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
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={slug.replace(/-/g, ' ')}
        style={{ width: '1em', height: '1em', display: 'inline-block', verticalAlign: 'middle' }}
      />
    )
  }
  return <>{iconEmoji}</>
}
