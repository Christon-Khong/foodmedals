import { ImageResponse } from 'next/og'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { getCategoryBySlug } from '@/lib/queries'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const CUSTOM_ICONS: Record<string, string> = {
  'onion-rings':   'onion-rings.png',
  'pulled-pork':   'pulled-pork.png',
  'bbq-ribs':      'bbq-ribs.png',
  'chicken-wings': 'chicken-wings.png',
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const category = await getCategoryBySlug(slug)

  const name = category?.name ?? 'Food Rankings'
  const emoji = category?.iconEmoji ?? '🍽️'

  let customIconSrc: string | null = null
  if (slug && CUSTOM_ICONS[slug]) {
    try {
      const buf = await readFile(join(process.cwd(), 'public/images/categories', CUSTOM_ICONS[slug]))
      customIconSrc = `data:image/png;base64,${buf.toString('base64')}`
    } catch { /* fall back to emoji */ }
  }

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #1F4E79 0%, #0F2A45 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px',
        }}
      >
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: -80, right: -80, width: 360, height: 360, borderRadius: '50%', background: 'rgba(255,215,0,0.08)', display: 'flex' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 280, height: 280, borderRadius: '50%', background: 'rgba(255,215,0,0.06)', display: 'flex' }} />

        {/* Category icon */}
        {customIconSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={customIconSrc} width={120} height={120} alt="" style={{ marginBottom: 24 }} />
        ) : (
          <div style={{ fontSize: 120, marginBottom: 24, display: 'flex' }}>{emoji}</div>
        )}

        {/* Title */}
        <div
          style={{
            color: 'white',
            fontSize: 72,
            fontWeight: 900,
            textAlign: 'center',
            lineHeight: 1.1,
            marginBottom: 20,
            display: 'flex',
          }}
        >
          Best {name}
        </div>

        {/* Subtitle */}
        <div
          style={{
            color: '#FFD700',
            fontSize: 36,
            fontWeight: 600,
            textAlign: 'center',
            display: 'flex',
          }}
        >
          Community Rankings · FoodMedals
        </div>

        {/* Medal row */}
        <div style={{ display: 'flex', gap: 16, marginTop: 36, fontSize: 48 }}>
          <span>🥇</span>
          <span>🥈</span>
          <span>🥉</span>
        </div>
      </div>
    ),
    { ...size },
  )
}
