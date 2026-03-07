'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'

const steps = [
  { icon: '🍔', step: '1', title: 'Browse Categories', href: '/categories', desc: 'Burgers, tacos, pizza, wings — dozens of food categories.' },
  { icon: 'medal', step: '2', title: 'Award Your Medals', href: '/categories', desc: 'Give Gold, Silver & Bronze to the three restaurants you love most.' },
  { icon: '🏆', step: '3', title: 'See the Rankings', href: '/categories', desc: 'Community votes aggregate into leaderboards that reset every year.' },
]

export function HowItWorks() {
  return (
    <section className="bg-white border-b border-amber-100">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
          className="text-center text-2xl font-bold text-gray-900 mb-10"
        >
          How it works
        </motion.h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
          {steps.map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="text-center"
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
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
