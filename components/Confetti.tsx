'use client'

import { motion, AnimatePresence } from 'framer-motion'
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
}

function makeParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id:    i,
    x:     50 + (Math.random() - 0.5) * 20,   // % from left, near centre
    y:     40 + (Math.random() - 0.5) * 20,   // % from top
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    size:  6 + Math.random() * 8,
    angle: Math.random() * 360,
    dist:  80 + Math.random() * 120,
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

  return (
    <AnimatePresence>
      {particles.map(p => (
        <motion.div
          key={p.id}
          initial={{
            position: 'fixed',
            left:     `${p.x}vw`,
            top:      `${p.y}vh`,
            width:    p.size,
            height:   p.size,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            background: p.color,
            opacity: 1,
            rotate:  0,
            zIndex:  9999,
          }}
          animate={{
            x:       Math.cos((p.angle * Math.PI) / 180) * p.dist,
            y:       Math.sin((p.angle * Math.PI) / 180) * p.dist + 60,
            opacity: 0,
            rotate:  p.angle * 3,
          }}
          transition={{ duration: 1.8, ease: 'easeOut' }}
          style={{ pointerEvents: 'none' }}
        />
      ))}
    </AnimatePresence>
  )
}
