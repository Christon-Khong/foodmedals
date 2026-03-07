'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'

const steps = [
  { icon: '🍔', step: '1', title: 'Browse Categories', href: '/categories', desc: 'Burgers, tacos, pizza, wings — dozens of food categories.' },
  { icon: 'medal', step: '2', title: 'Award Your Medals', href: '/categories', desc: 'Give Gold, Silver & Bronze to the three restaurants you love most.' },
  { icon: '🏆', step: '3', title: 'See the Rankings', href: '/categories', desc: 'Community votes aggregate into leaderboards that reset every year.' },
]

export function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('is-visible')
          observer.disconnect()
        }
      },
      { rootMargin: '-50px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} className="bg-white border-b border-amber-100 how-it-works-section">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
        <h2 className="text-center text-2xl font-bold text-gray-900 mb-10 how-it-works-heading">
          How it works
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
          {steps.map((item, i) => (
            <div
              key={item.step}
              className="text-center how-it-works-step"
              style={{ '--step-delay': `${i * 150}ms` } as React.CSSProperties}
            >
              <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-sm border border-amber-100">
                {item.icon === 'medal' ? (
                  <Image src="/medals/gold.webp" alt="medal" width={36} height={36} />
                ) : (
                  item.icon
                )}
              </div>
              <div className="text-xs font-bold text-yellow-600 uppercase tracking-wider mb-1">Step {item.step}</div>
              <Link href={item.href} className="font-bold text-gray-900 mb-2 hover:text-yellow-700 transition-colors inline-block">
                <h3>{item.title}</h3>
              </Link>
              <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
