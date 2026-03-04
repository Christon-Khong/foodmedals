import { ImageResponse } from 'next/og'
import { prisma } from '@/lib/prisma'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const restaurant = await prisma.restaurant.findUnique({
    where: { slug, status: 'active' },
  })

  const name = restaurant?.name ?? 'Restaurant'
  const city = restaurant?.city ?? ''
  const state = restaurant?.state ?? 'UT'

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
        <div style={{ position: 'absolute', top: -80, right: -80, width: 360, height: 360, borderRadius: '50%', background: 'rgba(255,215,0,0.08)', display: 'flex' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 280, height: 280, borderRadius: '50%', background: 'rgba(255,215,0,0.06)', display: 'flex' }} />

        <div style={{ fontSize: 100, marginBottom: 24, display: 'flex' }}>🏆</div>

        <div style={{ color: 'white', fontSize: 64, fontWeight: 900, textAlign: 'center', lineHeight: 1.1, marginBottom: 16, display: 'flex', maxWidth: '90%' }}>
          {name}
        </div>

        {city && (
          <div style={{ color: '#94a3b8', fontSize: 32, marginBottom: 20, display: 'flex' }}>
            {city}, {state}
          </div>
        )}

        <div style={{ color: '#FFD700', fontSize: 30, fontWeight: 600, display: 'flex' }}>
          Medals &amp; Rankings · FoodMedals
        </div>

        <div style={{ display: 'flex', gap: 16, marginTop: 24, fontSize: 48 }}>
          <span>🥇</span>
          <span>🥈</span>
          <span>🥉</span>
        </div>
      </div>
    ),
    { ...size },
  )
}
