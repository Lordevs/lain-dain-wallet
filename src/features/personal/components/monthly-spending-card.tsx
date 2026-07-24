import { TrendingUp } from 'lucide-react'
import type { MonthlySpendingItem } from '../types'

interface MonthlySpendingCardProps {
  monthlySpending: MonthlySpendingItem[]
  activeMonthLabel: string // e.g. "January" or "April"
}

// Convert month name to 3-letter abbreviation
function getMonthAbbr(monthName: string): string {
  const map: Record<string, string> = {
    january: 'Jan',
    february: 'Feb',
    march: 'Mar',
    april: 'Apr',
    may: 'May',
    june: 'Jun',
    july: 'Jul',
    august: 'Aug',
    september: 'Sep',
    october: 'Oct',
    november: 'Nov',
    december: 'Dec',
  }
  return map[monthName.toLowerCase()] || monthName.substring(0, 3)
}

function getBarColor(monthAbbr: string, isHighlighted: boolean): string {
  if (isHighlighted) return '#FDB105' // Orange highlight

  // Mockup-faithful color gradient
  const darkGreenMonths = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const mediumGreenMonths = ['Jun', 'Jul']

  if (darkGreenMonths.includes(monthAbbr)) return '#01592B'
  if (mediumGreenMonths.includes(monthAbbr)) return '#5C967A'
  return '#8BBBA2' // Light green
}

/** A "nice" round axis max (and its 4 evenly-spaced ticks) that comfortably
 * fits the largest value in the data — replaces a hardcoded max so the
 * chart scales to whatever a real period's spending actually is instead of
 * clipping anything above a fixed guess. */
function computeYAxis(values: number[]): { maxVal: number; ticks: number[] } {
  const max = Math.max(0, ...values)
  if (max === 0) return { maxVal: 4, ticks: [4, 3, 2, 1, 0] }
  const magnitude = Math.pow(10, Math.floor(Math.log10(max)))
  const maxVal = Math.ceil(max / magnitude) * magnitude
  const step = maxVal / 4
  return { maxVal, ticks: [4, 3, 2, 1, 0].map((n) => step * n) }
}

const getBarPath = (x: number, y: number, w: number, h: number, r: number) => {
  if (h <= 0) return ''
  // Safety check: ensure rounding radius is not larger than height/width
  const radius = Math.min(r, h, w / 2)
  return `
    M ${x},${y + h}
    L ${x},${y + radius}
    Q ${x},${y} ${x + radius},${y}
    L ${x + w - radius},${y}
    Q ${x + w},${y} ${x + w},${y + radius}
    L ${x + w},${y + h}
    Z
  `
}

export default function MonthlySpendingCard({
  monthlySpending,
  activeMonthLabel,
}: MonthlySpendingCardProps) {
  const activeAbbr = getMonthAbbr(activeMonthLabel)

  // Chart config
  const svgWidth = 340
  const svgHeight = 180
  const chartHeight = 115
  const bottomY = 135
  const startX = 32
  const barWidth = 14
  const gap = 13

  const { maxVal, ticks: yTicks } = computeYAxis(monthlySpending.map((item) => item.amount))

  return (
    <div className="bg-white rounded-[24px] border-[0.8px] border-[#EBEBEB] shadow-[0px_2px_10px_0px_#0000000D] p-5 mx-4 mt-4 mb-24 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-5 select-none">
        <div className="w-8 h-8 bg-[#E4F2EB] rounded-[8px] flex items-center justify-center shrink-0">
          <TrendingUp size={16} className='text-primary' />
        </div>
        <div className="flex flex-col text-left">
          <h2 className="text-[14px] font-black text-[#1A1A1A] leading-tight">All months</h2>
          <span className="text-[10px] font-semibold text-[#6B6B6B]">Monthly spending</span>
        </div>
      </div>

      {/* SVG Bar Chart */}
      <div className="w-full flex justify-center">
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto overflow-visible">
          {/* Grid Lines & Y-Axis labels */}
          {yTicks.map((tick) => {
            const y = bottomY - (tick / maxVal) * chartHeight
            const label = tick === 0 ? '0' : tick >= 1000 ? `${tick / 1000}K` : `${tick}`

            return (
              <g key={tick} className="opacity-80">
                {/* Horizontal line */}
                <line
                  x1={startX}
                  y1={y}
                  x2={svgWidth - 6}
                  y2={y}
                  stroke="#EEEDED"
                  strokeWidth="0.8"
                />
                {/* Y-Axis tick label */}
                <text
                  x={startX - 8}
                  y={y}
                  fill="#9A9590"
                  fontSize="9"
                  fontWeight="600"
                  textAnchor="end"
                  dominantBaseline="middle"
                  className="select-none pointer-events-none"
                >
                  {label}
                </text>
              </g>
            )
          })}

          {/* Columns (Bars) */}
          {monthlySpending.map((item, idx) => {
            const x = startX + idx * (barWidth + gap) + 4
            const isHighlighted = item.month === activeAbbr
            const barH = (item.amount / maxVal) * chartHeight
            const y = bottomY - barH

            // Bar shape path
            const path = getBarPath(x, y, barWidth, barH, 4)
            const color = getBarColor(item.month, isHighlighted)

            return (
              <g key={item.month}>
                {/* Bar */}
                <path
                  d={path}
                  fill={color}
                  className="transition-all duration-300 hover:opacity-90 cursor-pointer"
                />

                {/* X-Axis Month label / Pill badge if active */}
                {isHighlighted ? (
                  <g>
                    {/* Active Pill Badge background */}
                    <rect
                      x={x - 6}
                      y={bottomY + 8}
                      width={barWidth + 12}
                      height={18}
                      rx={9}
                      fill="#ffffff"
                      stroke="#FDB105"
                      strokeWidth="1.5"
                    />
                    {/* Active text */}
                    <text
                      x={x + barWidth / 2}
                      y={bottomY + 17}
                      fill="#C96A1B"
                      fontSize="9"
                      fontWeight="800"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="select-none pointer-events-none"
                    >
                      {item.month}
                    </text>
                  </g>
                ) : (
                  <text
                    x={x + barWidth / 2}
                    y={bottomY + 17}
                    fill="#9A9590"
                    fontSize="9"
                    fontWeight="600"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="select-none pointer-events-none"
                  >
                    {item.month}
                  </text>
                )}
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
