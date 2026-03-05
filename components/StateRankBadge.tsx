/**
 * Rank badge rendered inside a stylized state outline.
 * Currently supports Utah (UT) — easily extensible to other states.
 */

const RANK_COLORS: Record<number, { fill: string; stroke: string; text: string; glow: string }> = {
  1: { fill: '#FEF9C3', stroke: '#EAB308', text: '#92400E', glow: 'rgba(234,179,8,0.25)' },
  2: { fill: '#F3F4F6', stroke: '#9CA3AF', text: '#4B5563', glow: 'rgba(156,163,175,0.2)' },
  3: { fill: '#FFF7ED', stroke: '#F97316', text: '#9A3412', glow: 'rgba(249,115,22,0.2)' },
}

// Simplified Utah outline (rectangular with NE notch)
// Viewbox is 100x120 for a nice vertical rectangle feel
function UtahOutline({ stroke, fill, glow }: { stroke: string; fill: string; glow: string }) {
  return (
    <g>
      {/* Glow filter */}
      <defs>
        <filter id="state-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feFlood floodColor={glow} result="color" />
          <feComposite in2="blur" operator="in" result="shadow" />
          <feMerge>
            <feMergeNode in="shadow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* Utah shape: rectangle with a step in the NE corner */}
      <path
        d="M 10,8 L 62,8 L 62,38 L 90,38 L 90,112 L 10,112 Z"
        fill={fill}
        stroke={stroke}
        strokeWidth="3"
        strokeLinejoin="round"
        filter="url(#state-glow)"
      />
    </g>
  )
}

type Props = {
  rank: number
  state: string
  size?: number
}

export function StateRankBadge({ rank, size = 48 }: Props) {
  const colors = RANK_COLORS[rank]
  if (!colors) return null

  // Scale text based on badge size
  const fontSize = size * 0.48

  return (
    <div
      className="relative inline-flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size * 1.2 }}
      title={`Ranked #${rank}`}
    >
      <svg
        viewBox="0 0 100 120"
        width={size}
        height={size * 1.2}
        className="drop-shadow-sm"
      >
        <UtahOutline stroke={colors.stroke} fill={colors.fill} glow={colors.glow} />
        {/* Rank number centered inside the state */}
        <text
          x="50"
          y="78"
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
