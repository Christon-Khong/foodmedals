'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type CategoryItem = {
  name: string
  slug: string
}

export function RotatingCategoryText({ categories }: { categories: CategoryItem[] }) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex(prev => (prev + 1) % categories.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [categories.length])

  const cat = categories[index]

  return (
    <span className="relative inline-block overflow-hidden h-[1.2em] align-bottom w-full">
      <AnimatePresence mode="popLayout">
        <motion.span
          key={cat.slug}
          initial={{ y: '100%' }}
          animate={{ y: '0%' }}
          exit={{ y: '-100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="absolute inset-x-0 flex items-center justify-center text-yellow-300 drop-shadow-lg whitespace-nowrap"
        >
          {cat.name.toLowerCase()}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}
