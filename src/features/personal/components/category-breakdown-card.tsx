import { useState, useMemo } from 'react'
import { formatCurrency } from '@/lib/currency'
import type { CategoryBreakdownItem } from '../types'

interface CategoryBreakdownCardProps {
  categories: CategoryBreakdownItem[]
  currency: string
}

function polarToCartesian(cx: number, cy: number, r: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0
  return {
    x: cx + r * Math.cos(angleInRadians),
    y: cy + r * Math.sin(angleInRadians),
  }
}

function getSlicePath(cx: number, cy: number, r: number, startPercent: number, endPercent: number) {
  const startAngle = startPercent * 360
  const endAngle = endPercent * 360
  const start = polarToCartesian(cx, cy, r, startAngle)
  const end = polarToCartesian(cx, cy, r, endAngle)
  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y} Z`
}

export default function CategoryBreakdownCard({
  categories,
  currency,
}: CategoryBreakdownCardProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  // Calculate coordinates for slices and labels — each slice's start is
  // the running total of every percentage before it.
  const slices = useMemo(() => {
    const starts = categories.reduce<number[]>((acc, _category, idx) => {
      acc.push(idx === 0 ? 0 : acc[idx - 1] + categories[idx - 1].percentage / 100)
      return acc
    }, [])

    return categories.map((cat, idx) => {
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
      }
    })
  }, [categories])

  return (
    <div className="bg-white rounded-[24px] border-[0.8px] border-[#EBEBEB] shadow-[0px_2px_10px_0px_#0000000D] p-6 mx-6 mt-4 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="size-6 flex items-center justify-center shrink-0">
            {/* Custom Pie Icon matching theme */}
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g clip-path="url(#clip0_275_3327)">
                <path d="M11 21C16.5228 21 21 16.5228 21 11C21 5.47715 16.5228 1 11 1C5.47715 1 1 5.47715 1 11C1 16.5228 5.47715 21 11 21Z" fill="#01592B" />
                <path d="M11 11V1C12.7553 1.00004 14.4798 1.46214 15.9999 2.33984C17.5201 3.21754 18.7824 4.47993 19.6601 6.00011C20.5377 7.52029 20.9998 9.24472 20.9997 11.0001C20.9997 12.7554 20.5377 14.4798 19.66 16L11 11Z" fill="#FDB105" />
                <path d="M11 11L19.66 16C19.0247 17.4237 18.0653 18.6791 16.8584 19.666C15.6516 20.6529 14.2307 21.3439 12.7092 21.684C11.1878 22.024 9.60789 22.0036 8.09572 21.6244C6.58355 21.2452 5.18098 20.5177 4 19.5L11 11Z" fill="#7BAE8A" />
              </g>
              <defs>
                <clipPath id="clip0_275_3327">
                  <rect width="22" height="22" fill="white" />
                </clipPath>
              </defs>
            </svg>

          </div>
          <h2 className="text-[19px] font-extrabold text-[#1A1A1A]">By Category</h2>
        </div>
      </div>

      {categories.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No expenses this period.</p>
      ) : (
      <div className="flex items-center justify-between gap-4">
        {/* Left Side: SVG Pie Chart */}
        <div className="relative w-[38%] aspect-square flex items-center justify-center shrink-0 min-w-[100px] max-w-[150px]">
          <svg viewBox="0 0 160 160" className="w-full h-full overflow-visible">
            {slices.map((slice) => {
              const isHovered = hoveredIndex === slice.idx
              const labelColor = slice.cat.label === 'Food' ? '#ffffff' : '#1A1A1A'
              return (
                <g
                  key={slice.cat.id}
                  onMouseEnter={() => setHoveredIndex(slice.idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
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
                </g>
              )
            })}
          </svg>
        </div>

        {/* Right Side: Category Legend */}
        <div className="flex-1 flex flex-col gap-2">
          {categories.map((cat, idx) => {
            const isHovered = hoveredIndex === idx
            return (
              <div
                key={cat.id}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={`flex items-center justify-between transition-colors p-1 -mx-1 rounded-lg ${isHovered ? 'bg-[#F7F5F0]' : ''
                  }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="size-3.5 rounded-full shrink-0 border border-[#FEFAF1]"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-[14px] font-medium text-[#1A1A1A] leading-tight max-w-[95px] text-wrap">
                    {cat.label}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[13px] font-bold text-[#1A1A1A]">
                    {formatCurrency(cat.amount, currency)}
                  </span>
                  <span className="text-[11px] font-semibold text-positive">
                    {cat.percentage}%
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      )}
    </div>
  )
}
