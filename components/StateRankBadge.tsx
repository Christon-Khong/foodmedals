/**
 * Rank badge with a state outline silhouette and rank number.
 * State outline is decorative; rank number is displayed alongside.
 */
import { STATE_OUTLINES } from '@/lib/state-outlines'

const RANK_STYLES: Record<number, { fill: string; stroke: string; text: string; bg: string; border: string }> = {
  1: { fill: '#EAB308', stroke: '#CA8A04', text: 'text-yellow-800', bg: 'bg-yellow-50', border: 'border-yellow-300' },
  2: { fill: '#9CA3AF', stroke: '#6B7280', text: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-300' },
  3: { fill: '#F97316', stroke: '#EA580C', text: 'text-orange-800', bg: 'bg-orange-50', border: 'border-orange-300' },
}

type Props = {
  rank: number
  state: string
  size?: number
}

export function StateRankBadge({ rank, state, size = 48 }: Props) {
  const style = RANK_STYLES[rank]
  if (!style) return null

  const outline = STATE_OUTLINES[state]
  if (!outline) return null

  const stateSize = size * 0.7

  return (
    <div
      className={`inline-flex flex-col items-center gap-0.5 ${style.bg} ${style.border} border rounded-xl px-2 py-1.5`}
      title={`Ranked #${rank} in ${state}`}
    >
      <svg
        viewBox={outline.viewBox}
        width={stateSize}
        height={stateSize}
        className="drop-shadow-sm"
        style={{ maxHeight: stateSize }}
        preserveAspectRatio="xMidYMid meet"
      >
        <path
          d={outline.path}
          fill={style.fill}
          stroke={style.stroke}
          strokeWidth="2"
          strokeLinejoin="round"
          opacity={0.85}
        />
      </svg>
      <span className={`text-[11px] font-black ${style.text} leading-none`}>
        {rank === 1 ? '1st' : rank === 2 ? '2nd' : '3rd'}
      </span>
    </div>
  )
}
