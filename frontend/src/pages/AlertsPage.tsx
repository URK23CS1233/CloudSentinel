import { useState } from 'react'
import { BellRing, Filter } from 'lucide-react'
import { useAlerts, useResolveAlert, useSilenceAlert } from '@/hooks/useMetrics'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import type { Alert } from '@/lib/types'

const SEVERITY_OPTIONS = ['all', 'info', 'warning', 'critical'] as const
const SILENCE_DURATIONS = [
  { label: '15 min', value: 15 },
  { label: '1 hour', value: 60 },
  { label: '4 hours', value: 240 },
  { label: '24 hours', value: 1440 },
]

function SeverityBadge({ severity }: { severity: Alert['severity'] }) {
  const styles = {
    info: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
    warning: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
    critical: 'text-red-400 bg-red-400/10 border-red-400/30',
  }
  return (
    <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded border uppercase tracking-wide', styles[severity])}>
      {severity}
    </span>
  )
}

export default function AlertsPage() {
  const [severity, setSeverity] = useState<string>('all')
  const [silencingId, setSilencingId] = useState<string | null>(null)

  const { data: alerts = [], isLoading } = useAlerts(
    undefined,
    severity === 'all' ? undefined : severity
  )
  const resolve = useResolveAlert()
  const silence = useSilenceAlert()

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-[hsl(var(--foreground))] flex items-center gap-2">
            <BellRing size={18} className="text-amber-400" />
            Active Alerts
          </h1>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
            {alerts.length} unresolved alert{alerts.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Severity filter */}
        <div className="flex items-center gap-2">
          <Filter size={12} className="text-[hsl(var(--muted-foreground))]" />
          <div className="flex bg-[hsl(var(--muted))] rounded-lg p-0.5 gap-0.5">
            {SEVERITY_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setSeverity(s)}
                className={cn(
                  'text-xs px-3 py-1 rounded-md font-medium capitalize transition-all',
                  severity === s
                    ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                    : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="glass rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-[hsl(var(--muted))] rounded animate-pulse" />)}
          </div>
        ) : alerts.length === 0 ? (
          <div className="p-10 flex flex-col items-center gap-3 text-[hsl(var(--muted-foreground))]">
            <BellRing size={32} />
            <p className="text-sm">No alerts matching filter</p>
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] uppercase tracking-wide">
                <th className="text-left px-4 py-3">Severity</th>
                <th className="text-left px-4 py-3">Type</th>
                <th className="text-left px-4 py-3">Node</th>
                <th className="text-left px-4 py-3">Value</th>
                <th className="text-left px-4 py-3">Time</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((alert: Alert) => (
                <>
                  <tr
                    key={alert.id}
                    className="border-b border-[hsl(var(--border))/50] hover:bg-[hsl(var(--muted)/0.5)] transition-colors"
                  >
                    <td className="px-4 py-3"><SeverityBadge severity={alert.severity} /></td>
                    <td className="px-4 py-3 font-semibold text-[hsl(var(--foreground))]">{alert.type}</td>
                    <td className="px-4 py-3 text-[hsl(var(--muted-foreground))] font-mono">{alert.node_id.slice(0, 12)}…</td>
                    <td className="px-4 py-3 font-semibold">{alert.value.toFixed(1)}%</td>
                    <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">
                      {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSilencingId(silencingId === alert.id ? null : alert.id)}
                          className="px-2 py-1 rounded text-amber-400 border border-amber-400/30 hover:bg-amber-400/10 transition-colors"
                        >
                          Silence
                        </button>
                        <button
                          onClick={() => resolve.mutate(alert.id)}
                          disabled={resolve.isPending}
                          className="px-2 py-1 rounded text-emerald-400 border border-emerald-400/30 hover:bg-emerald-400/10 transition-colors"
                        >
                          Resolve
                        </button>
                      </div>
                    </td>
                  </tr>
                  {/* Inline silence row */}
                  {silencingId === alert.id && (
                    <tr key={`${alert.id}-silence`} className="bg-[hsl(var(--muted)/0.3)]">
                      <td colSpan={6} className="px-4 py-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[hsl(var(--muted-foreground))]">Silence for:</span>
                          {SILENCE_DURATIONS.map((d) => (
                            <button
                              key={d.value}
                              onClick={() => {
                                silence.mutate({ alertId: alert.id, minutes: d.value })
                                setSilencingId(null)
                              }}
                              className="px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/30 text-amber-400 hover:bg-amber-400/20 transition-colors"
                            >
                              {d.label}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
