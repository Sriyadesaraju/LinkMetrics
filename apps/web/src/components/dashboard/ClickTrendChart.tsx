import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { CHART_COLORS, chartTooltipStyle } from '@/lib/chart-theme'

interface ClickTrendChartProps {
  data: { date: string; count: number }[]
}

export function ClickTrendChart({ data }: ClickTrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="clickGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART_COLORS[0]} stopOpacity={0.25} />
            <stop offset="100%" stopColor={CHART_COLORS[0]} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip {...chartTooltipStyle} />
        <Area
          type="monotone"
          dataKey="count"
          stroke={CHART_COLORS[0]}
          strokeWidth={2}
          fill="url(#clickGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
