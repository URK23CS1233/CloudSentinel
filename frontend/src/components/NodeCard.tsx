import { useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { WifiOff, Clock, Server } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Node } from '@/lib/types'

interface MetricBarProps {
  label: string
  value: number
  unit?: string
}

function MetricBar({ label, value, unit = '%' }: MetricBarProps) {
  const color =
    value > 80
      ? 'bg-red-500'
      : value > 60
      ? 'bg-amber-400'
      : 'bg-cyan-400'

  const textColor =
    value > 80 ? 'text-red-400' : value > 60 ? 'text-amber-400' : 'text-cyan-400'

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-[hsl(var(--muted-foreground))]">{label}</span>
        <span className={cn('font-semibold tabular-nums', textColor)}>
          {value.toFixed(1)}{unit}
        </span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-[hsl(var(--muted))] overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', color)}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  )
}

interface NodeCardProps {
  node: Node
  cpu?: number
  ram?: number
  disk?: number
}

export default function NodeCard({ node, cpu = 0, ram = 0, disk = 0 }: NodeCardProps) {
  const navigate = useNavigate()

  const isStressed = node.status === 'online' && (cpu > 70 || ram > 80)
  const isOffline = node.status === 'offline'

  const glowClass = isOffline
    ? 'glow-red'
    : isStressed
    ? 'glow-amber'
    : 'glow-cyan'

  const statusColor = isOffline
    ? 'bg-red-500'
    : isStressed
    ? 'bg-amber-400'
    : 'bg-emerald-400'

  const statusLabel = isOffline ? 'Offline' : isStressed ? 'Stressed' : 'Online'
  const statusTextColor = isOffline
    ? 'text-red-400'
    : isStressed
    ? 'text-amber-400'
    : 'text-emerald-400'

  let lastSeenText = '—'
  try {
    lastSeenText = formatDistanceToNow(new Date(node.last_seen), { addSuffix: true })
  } catch {
    lastSeenText = 'Unknown'
  }

  return (
    <div
      onClick={() => navigate(`/nodes/${node.node_id}`)}
      className={cn(
        'glass rounded-xl p-4 cursor-pointer fade-in',
        'transition-all duration-200 hover:scale-[1.02] hover:-translate-y-0.5',
        glowClass
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <Server size={14} className="text-[hsl(var(--primary))] shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[hsl(var(--foreground))] truncate">
              {node.hostname}
            </p>
            <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">{node.ip}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={cn('w-2 h-2 rounded-full', statusColor, !isOffline && 'pulse-dot')} />
          <span className={cn('text-xs font-medium', statusTextColor)}>{statusLabel}</span>
        </div>
      </div>

      {/* OS badge */}
      {node.os && (
        <p className="text-[10px] text-[hsl(var(--muted-foreground))] mb-3 bg-[hsl(var(--muted))] rounded px-1.5 py-0.5 inline-block">
          {node.os}
        </p>
      )}

      {/* Metrics */}
      {!isOffline ? (
        <div className="space-y-2.5 mt-2">
          <MetricBar label="CPU" value={cpu} />
          <MetricBar label="RAM" value={ram} />
          <MetricBar label="Disk" value={disk} />
        </div>
      ) : (
        <div className="flex items-center gap-2 mt-3 text-red-400 text-xs">
          <WifiOff size={12} />
          <span>Node is unreachable</span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center gap-1 mt-3 text-[10px] text-[hsl(var(--muted-foreground))]">
        <Clock size={10} />
        <span>Last seen {lastSeenText}</span>
      </div>
    </div>
  )
}
