import type { CategoryBreakdownItem } from '../types'

function polarToCartesian(cx: number, cy: number, r: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0
  return {
    x: cx + r * Math.cos(angleInRadians),
    y: cy + r * Math.sin(angleInRadians),
  }
}

function getSlicePath(cx: number, cy: number, r: number, startPercent: number, endPercent: number) {
  const span = endPercent - startPercent
  if (span <= 0) return ''

  // A single SVG arc whose start and end coordinates are identical is
  // degenerate. Draw a complete pie as two 180° arcs instead.
  if (span >= 0.999999) {
    return [
      `M ${cx} ${cy - r}`,
      `A ${r} ${r} 0 1 1 ${cx} ${cy + r}`,
      `A ${r} ${r} 0 1 1 ${cx} ${cy - r}`,
      'Z',
    ].join(' ')
  }

  const startAngle = startPercent * 360
  const endAngle = endPercent * 360
  const start = polarToCartesian(cx, cy, r, startAngle)
  const end = polarToCartesian(cx, cy, r, endAngle)
  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y} Z`
}

interface CategoryPieChartProps {
  categories: CategoryBreakdownItem[]
  hoveredIndex: number | null
  onHoverIndex: (idx: number | null) => void
  className?: string
}

/** The pie-slice SVG only — extracted from CategoryBreakdownCard so both
 * the Reports screen's compact card and the full CategoryBreakdownScreen
 * can render the identical chart without duplicating the slice-geometry
 * math (polarToCartesian/getSlicePath). */
export default function CategoryPieChart({ categories, hoveredIndex, onHoverIndex, className }: CategoryPieChartProps) {
  // Each slice's start is the running total of every percentage before it.
  const starts = categories.reduce<number[]>((acc, _category, idx) => {
    acc.push(idx === 0 ? 0 : acc[idx - 1] + categories[idx - 1].percentage / 100)
    return acc
  }, [])

  const slices = categories.map((cat, idx) => {
    const start = starts[idx]
    const end = start + cat.percentage / 100

    // Midpoint for label placing
    const midAngle = (start + (end - start) / 2) * 360
    const labelRadius = 55
    const labelCoords = polarToCartesian(80, 80, labelRadius, midAngle)

    return {
      path: getSlicePath(80, 80, 75, start, end),
      labelX: labelCoords.x,
      labelY: labelCoords.y,
      cat,
      idx,
      showLabel: cat.percentage >= 5 || categories.length === 1,
    }
  })

  return (
    <div className={className}>
      <svg viewBox="0 0 160 160" className="w-full h-full overflow-visible">
        {slices.map((slice) => {
          const isHovered = hoveredIndex === slice.idx
          const labelColor = slice.cat.label === 'Food' ? '#ffffff' : '#1A1A1A'
          return (
            <g
              key={slice.cat.id}
              onMouseEnter={() => onHoverIndex(slice.idx)}
              onMouseLeave={() => onHoverIndex(null)}
              className="transition-transform duration-300 origin-[80px_80px]"
              style={{
                transform: isHovered ? 'scale(1.04)' : 'scale(1)',
              }}
            >
              <path
                d={slice.path}
                fill={slice.cat.color}
                stroke="#ffffff"
                strokeWidth="1.5"
                className="cursor-pointer"
              />
              {slice.showLabel && slice.cat.percentage > 0 && (
                <text
                  x={slice.labelX}
                  y={slice.labelY}
                  fill={labelColor}
                  fontSize="11"
                  fontWeight="800"
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="pointer-events-none select-none"
                >
                  {slice.cat.percentage}%
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
