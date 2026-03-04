import { ImageResponse } from 'next/og'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
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

        <div style={{ display: 'flex', gap: 16, fontSize: 80, marginBottom: 24 }}>
          <span>🥇</span>
          <span>🥈</span>
          <span>🥉</span>
        </div>

        <div style={{ color: 'white', fontSize: 72, fontWeight: 900, textAlign: 'center', lineHeight: 1.1, marginBottom: 20, display: 'flex' }}>
          FoodMedals
        </div>

        <div style={{ color: '#FFD700', fontSize: 36, fontWeight: 600, textAlign: 'center', display: 'flex' }}>
          Community Food Rankings
        </div>
      </div>
    ),
    { ...size },
  )
}
