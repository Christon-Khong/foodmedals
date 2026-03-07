'use client'

import { useEffect, useState } from 'react'

const COLORS = ['#FFD700', '#FFA500', '#FF6B6B', '#FFE55C', '#FFFFFF', '#FFD700', '#F4C430']

type Particle = {
  id:    number
  x:     number
  y:     number
  color: string
  size:  number
  angle: number
  dist:  number
  round: boolean
}

function makeParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id:    i,
    x:     50 + (Math.random() - 0.5) * 20,
    y:     40 + (Math.random() - 0.5) * 20,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    size:  6 + Math.random() * 8,
    angle: Math.random() * 360,
    dist:  80 + Math.random() * 120,
    round: Math.random() > 0.5,
  }))
}

export function Confetti({ trigger }: { trigger: boolean }) {
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    if (!trigger) return
    setParticles(makeParticles(40))
    const t = setTimeout(() => setParticles([]), 2200)
    return () => clearTimeout(t)
  }, [trigger])

  if (particles.length === 0) return null

  return (
    <>
      {particles.map(p => {
        const tx = Math.cos((p.angle * Math.PI) / 180) * p.dist
        const ty = Math.sin((p.angle * Math.PI) / 180) * p.dist + 60
        const rotate = p.angle * 3

        return (
          <div
            key={p.id}
            style={{
              position: 'fixed',
              left: `${p.x}vw`,
              top: `${p.y}vh`,
              width: p.size,
              height: p.size,
              borderRadius: p.round ? '50%' : '2px',
              background: p.color,
              zIndex: 9999,
              pointerEvents: 'none',
              animation: `confetti-burst 1.8s ease-out forwards`,
              // Pass trajectory via CSS custom properties
              '--confetti-tx': `${tx}px`,
              '--confetti-ty': `${ty}px`,
              '--confetti-rotate': `${rotate}deg`,
            } as React.CSSProperties}
          />
        )
      })}
    </>
  )
}
