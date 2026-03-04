'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

type GoldMedal = {
  id: string
  restaurantName: string
  categoryName: string
  iconEmoji: string
}

type Props = {
  goldMedals: GoldMedal[]
  currentMedalId: string
  onSelect: (medalId: string) => void
}

export function CrownJewelSelector({ goldMedals, currentMedalId, onSelect }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  if (goldMedals.length < 2) return null

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="text-xs font-semibold text-yellow-700 hover:text-yellow-800 inline-flex items-center gap-0.5 transition-colors"
      >
        Change
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-xl border border-amber-100 shadow-lg z-20 py-1 overflow-hidden">
          {goldMedals.map(m => (
            <button
              key={m.id}
              onClick={() => {
                onSelect(m.id)
                setOpen(false)
              }}
              className={`w-full text-left px-3.5 py-2.5 flex items-center gap-2.5 hover:bg-amber-50 transition-colors ${
                m.id === currentMedalId ? 'bg-yellow-50' : ''
              }`}
            >
              <span className="text-lg flex-shrink-0">{m.iconEmoji}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-800 truncate">{m.restaurantName}</p>
                <p className="text-[11px] text-gray-400">{m.categoryName}</p>
              </div>
              {m.id === currentMedalId && (
                <span className="text-[10px] font-bold text-yellow-600 flex-shrink-0">CURRENT</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
