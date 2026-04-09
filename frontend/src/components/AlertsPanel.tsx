import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { BellOff, CheckCircle2, AlertTriangle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAlerts, useResolveAlert, useSilenceAlert } from '@/hooks/useMetrics'
import type { Alert } from '@/lib/types'

const SILENCE_DURATIONS = [
  { label: '15 minutes', value: 15 },
  { label: '1 hour', value: 60 },
  { label: '4 hours', value: 240 },
  { label: '24 hours', value: 1440 },
]

function SeverityBadge({ severity }: { severity: Alert['severity'] }) {
  const map = {
    info: { color: 'text-blue-400 bg-blue-400/10 border-blue-400/30', icon: Info },
    warning: { color: 'text-amber-400 bg-amber-400/10 border-amber-400/30', icon: AlertTriangle },
    critical: { color: 'text-red-400 bg-red-400/10 border-red-400/30', icon: AlertTriangle },
  }
  const { color, icon: Icon } = map[severity]
  return (
    <span className={cn('inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded border uppercase tracking-wide', color)}>
      <Icon size={9} />
      {severity}
    </span>
  )
}

function AlertRow({ alert }: { alert: Alert }) {
  const [showSilence, setShowSilence] = useState(false)
  const resolve = useResolveAlert()
  const silence = useSilenceAlert()

  return (
    <div className="glass rounded-lg p-3 fade-in">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <SeverityBadge severity={alert.severity} />
            <span className="text-xs font-semibold text-[hsl(var(--foreground))]">{alert.type}</span>
            <span className="text-xs text-[hsl(var(--muted-foreground))]">· {alert.node_id.slice(0, 8)}…</span>
          </div>
          <p className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">{alert.message}</p>
          <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-1">
            {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setShowSilence(!showSilence)}
            className="p-1.5 rounded hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:text-amber-400 transition-colors"
            title="Silence"
          >
            <BellOff size={13} />
          </button>
          <button
            onClick={() => resolve.mutate(alert.id)}
            disabled={resolve.isPending}
            className="p-1.5 rounded hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:text-emerald-400 transition-colors"
            title="Resolve"
          >
            <CheckCircle2 size={13} />
          </button>
        </div>
      </div>

      {/* Inline silence picker */}
      {showSilence && (
        <div className="mt-2 flex flex-wrap gap-1 pt-2 border-t border-[hsl(var(--border))]">
          {SILENCE_DURATIONS.map((d) => (
            <button
              key={d.value}
              onClick={() => {
                silence.mutate({ alertId: alert.id, minutes: d.value })
                setShowSilence(false)
              }}
              className="text-[10px] px-2 py-1 rounded bg-amber-400/10 border border-amber-400/30 text-amber-400 hover:bg-amber-400/20 transition-colors"
            >
              {d.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

interface AlertsPanelProps {
  nodeId?: string
  limit?: number
}

export default function AlertsPanel({ nodeId, limit }: AlertsPanelProps) {
  const { data: alerts = [], isLoading, error } = useAlerts(nodeId)
  const displayed = limit ? alerts.slice(0, limit) : alerts

  if (isLoading)
    return <div className="text-xs text-[hsl(var(--muted-foreground))] p-4">Loading alerts…</div>
  if (error)
    return <div className="text-xs text-red-400 p-4">Failed to load alerts.</div>
  if (displayed.length === 0)
    return (
      <div className="flex flex-col items-center gap-2 p-6 text-[hsl(var(--muted-foreground))]">
        <CheckCircle2 size={24} className="text-emerald-400" />
        <p className="text-sm">No active alerts</p>
      </div>
    )

  return (
    <div className="flex flex-col gap-2">
      {displayed.map((a) => (
        <AlertRow key={a.id} alert={a} />
      ))}
    </div>
  )
}
