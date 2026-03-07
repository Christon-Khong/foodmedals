/**
 * Rank badge rendered inside a stylized state outline.
 * Supports all 50 US states via the state-outlines data file.
 */
import { STATE_OUTLINES } from '@/lib/state-outlines'

const RANK_COLORS: Record<number, { fill: string; stroke: string; text: string; glow: string }> = {
  1: { fill: '#FEF9C3', stroke: '#EAB308', text: '#92400E', glow: 'rgba(234,179,8,0.25)' },
  2: { fill: '#F3F4F6', stroke: '#9CA3AF', text: '#4B5563', glow: 'rgba(156,163,175,0.2)' },
  3: { fill: '#FFF7ED', stroke: '#F97316', text: '#9A3412', glow: 'rgba(249,115,22,0.2)' },
}

type Props = {
  rank: number
  state: string
  size?: number
}

export function StateRankBadge({ rank, state, size = 48 }: Props) {
  const colors = RANK_COLORS[rank]
  if (!colors) return null

  const outline = STATE_OUTLINES[state]
  // Fallback: generic rectangle if state not found
  const path = outline?.path ?? 'M 10,8 L 90,8 L 90,112 L 10,112 Z'
  const viewBox = outline?.viewBox ?? '0 0 100 120'
  const center = outline?.center ?? [50, 60]

  const fontSize = size * 0.48

  return (
    <div
      className="relative inline-flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size * 1.2 }}
      title={`Ranked #${rank} in ${state}`}
    >
      <svg
        viewBox={viewBox}
        width={size}
        height={size * 1.2}
        className="drop-shadow-sm"
      >
        <defs>
          <filter id={`state-glow-${state}-${rank}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feFlood floodColor={colors.glow} result="color" />
            <feComposite in2="blur" operator="in" result="shadow" />
            <feMerge>
              <feMergeNode in="shadow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          d={path}
          fill={colors.fill}
          stroke={colors.stroke}
          strokeWidth="3"
          strokeLinejoin="round"
          filter={`url(#state-glow-${state}-${rank})`}
        />
        <text
          x={center[0]}
          y={center[1]}
          textAnchor="middle"
          dominantBaseline="central"
          fill={colors.text}
          fontWeight="900"
          fontSize={fontSize}
          fontFamily="system-ui, sans-serif"
        >
          {rank}
        </text>
      </svg>
    </div>
  )
}
