import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { format } from 'date-fns'
import type { MetricPayload } from '@/lib/types'

interface MetricsChartProps {
  data: MetricPayload[]
  metric: 'cpu_percent' | 'memory_percent' | 'disk_percent'
  label: string
  color: string
  threshold?: number
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ value: number; dataKey: string }>
  label?: string
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass rounded-lg px-3 py-2 text-xs shadow-xl border border-[hsl(var(--border))]">
        <p className="text-[hsl(var(--muted-foreground))] mb-1">{label}</p>
        {payload.map((p) => (
          <p key={p.dataKey} className="text-[hsl(var(--foreground))] font-semibold">
            {p.value.toFixed(1)}%
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function MetricsChart({
  data,
  metric,
  label,
  color,
  threshold,
}: MetricsChartProps) {
  const chartData = data.map((d) => ({
    time: format(new Date(d.timestamp), 'HH:mm'),
    value: d[metric],
  }))

  return (
    <div className="glass rounded-xl p-4">
      <p className="text-sm font-semibold text-[hsl(var(--foreground))] mb-4">{label}</p>
      {chartData.length === 0 ? (
        <div className="h-40 flex items-center justify-center text-[hsl(var(--muted-foreground))] text-sm">
          No data for this time range
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
              vertical={false}
            />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 10, fill: 'hsl(215 20% 55%)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: 'hsl(215 20% 55%)' }}
              axisLine={false}
              tickLine={false}
              unit="%"
            />
            <Tooltip content={<CustomTooltip />} />
            {threshold !== undefined && (
              <ReferenceLine
                y={threshold}
                stroke="rgba(239,68,68,0.6)"
                strokeDasharray="4 4"
                label={{ value: `${threshold}%`, position: 'right', fontSize: 9, fill: '#ef4444' }}
              />
            )}
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: color }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
