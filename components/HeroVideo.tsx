'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'

export function HeroVideo() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [videoReady, setVideoReady] = useState(false)
  const [videoInjected, setVideoInjected] = useState(false)

  const injectVideo = useCallback(() => {
    const container = containerRef.current
    if (!container || videoInjected) return

    setVideoInjected(true)

    const video = document.createElement('video')
    video.src = '/videos/hero-bg.mp4'
    video.autoplay = true
    video.loop = true
    video.muted = true
    video.playsInline = true
    video.setAttribute('playsinline', '') // iOS Safari
    video.setAttribute('webkit-playsinline', '') // older iOS
    video.preload = 'auto'
    video.className =
      'absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-1000'

    video.addEventListener(
      'canplaythrough',
      () => {
        // Fade in the video once ready to play smoothly
        video.style.opacity = '1'
        setVideoReady(true)
      },
      { once: true },
    )

    // Fallback: if canplaythrough doesn't fire within 4s, fade in anyway
    const fallbackTimer = setTimeout(() => {
      if (!videoReady) {
        video.style.opacity = '1'
        setVideoReady(true)
      }
    }, 4000)

    video.addEventListener(
      'canplaythrough',
      () => clearTimeout(fallbackTimer),
      { once: true },
    )

    container.appendChild(video)
  }, [videoInjected, videoReady])

  useEffect(() => {
    // Wait for the page to fully load, or a 1.5s delay — whichever comes first
    let triggered = false

    const trigger = () => {
      if (triggered) return
      triggered = true
      injectVideo()
    }

    if (document.readyState === 'complete') {
      // Page already loaded — inject after a brief paint delay
      const timer = setTimeout(trigger, 200)
      return () => clearTimeout(timer)
    }

    // Race: window load vs 1.5s timeout
    const timer = setTimeout(trigger, 1500)
    window.addEventListener('load', trigger, { once: true })

    return () => {
      clearTimeout(timer)
      window.removeEventListener('load', trigger)
    }
  }, [injectVideo])

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Static poster — always rendered, visible immediately */}
      <Image
        src="/images/hero-poster.jpg"
        alt="Cinematic food spread"
        fill
        className={`object-cover transition-opacity duration-1000 ${
          videoReady ? 'opacity-0' : 'opacity-100'
        }`}
        priority
        sizes="100vw"
      />

      {/* Video will be injected here by useEffect */}
      <div ref={containerRef} className="absolute inset-0" />

      {/* Dark overlay for text contrast */}
      <div className="absolute inset-0 bg-black/40" />
    </div>
  )
}
