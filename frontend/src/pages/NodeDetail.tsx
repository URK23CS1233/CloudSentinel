import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Server, Cpu, MemoryStick, HardDrive, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import { useNodeDetail, useMetrics } from '@/hooks/useMetrics'
import MetricsChart from '@/components/MetricsChart'
import AlertsPanel from '@/components/AlertsPanel'

type Range = '1h' | '6h' | '24h'
const RANGES: Range[] = ['1h', '6h', '24h']

export default function NodeDetail() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [range, setRange] = useState<Range>('1h')

  const { data: node, isLoading: nodeLoading, error: nodeError } = useNodeDetail(id)
  const { data: metrics = [], isLoading: metricsLoading } = useMetrics(id, range)

  const latest = metrics[metrics.length - 1]

  if (nodeLoading) return (
    <div className="flex-1 p-6">
      <div className="glass rounded-xl h-32 animate-pulse mb-4" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => <div key={i} className="glass rounded-xl h-52 animate-pulse" />)}
      </div>
    </div>
  )

  if (nodeError || !node) return (
    <div className="flex-1 p-6 flex items-center justify-center">
      <div className="text-center text-[hsl(var(--muted-foreground))]">
        <Server size={40} className="mx-auto mb-3" />
        <p>Node not found.</p>
        <button onClick={() => navigate('/')} className="text-sm text-[hsl(var(--primary))] mt-2">
          Return to Dashboard
        </button>
      </div>
    </div>
  )

  const statusColor =
    node.status === 'offline' ? 'text-red-400' : node.status === 'stressed' ? 'text-amber-400' : 'text-emerald-400'

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto">
      {/* Back */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-1.5 text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
      >
        <ArrowLeft size={13} />
        Back to Dashboard
      </button>

      {/* Node Header */}
      <div className="glass rounded-xl p-5">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[hsl(var(--primary)/0.15)] flex items-center justify-center">
              <Server size={18} className="text-[hsl(var(--primary))]" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[hsl(var(--foreground))]">{node.hostname}</h1>
              <div className="flex items-center gap-3 text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                <span>{node.ip}</span>
                {node.os && <span>· {node.os}</span>}
              </div>
            </div>
          </div>
          <div className={cn('text-xs font-semibold capitalize', statusColor)}>
            ● {node.status}
          </div>
        </div>

        {/* Latest snapshot */}
        {latest && (
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-[hsl(var(--border))]">
            {[
              { label: 'CPU', value: latest.cpu_percent, icon: Cpu, color: 'text-[hsl(var(--primary))]' },
              { label: 'RAM', value: latest.memory_percent, icon: MemoryStick, color: 'text-purple-400' },
              { label: 'Disk', value: latest.disk_percent, icon: HardDrive, color: 'text-amber-400' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="text-center">
                <Icon size={14} className={cn('mx-auto mb-1', color)} />
                <p className="text-xl font-bold text-[hsl(var(--foreground))] tabular-nums">{value.toFixed(1)}%</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">{label}</p>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-1 mt-3 text-[10px] text-[hsl(var(--muted-foreground))]">
          <Clock size={10} />
          <span>Last seen {formatDistanceToNow(new Date(node.last_seen), { addSuffix: true })}</span>
        </div>
      </div>

      {/* Range selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-[hsl(var(--muted-foreground))]">Time range:</span>
        <div className="flex bg-[hsl(var(--muted))] rounded-lg p-0.5 gap-0.5">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                'text-xs px-3 py-1 rounded-md font-medium transition-all',
                range === r
                  ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                  : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Charts */}
      {metricsLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="glass rounded-xl h-52 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <MetricsChart data={metrics} metric="cpu_percent" label="CPU Usage" color="#06b6d4" threshold={90} />
          <MetricsChart data={metrics} metric="memory_percent" label="RAM Usage" color="#a855f7" threshold={85} />
          <MetricsChart data={metrics} metric="disk_percent" label="Disk Usage" color="#f59e0b" threshold={90} />
        </div>
      )}

      {/* Recent Alerts */}
      <div>
        <h2 className="text-sm font-semibold text-[hsl(var(--foreground))] mb-3">Recent Alerts — {node.hostname}</h2>
        <AlertsPanel nodeId={id} limit={5} />
      </div>
    </div>
  )
}
