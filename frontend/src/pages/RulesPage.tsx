import { useState } from 'react'
import { ShieldAlert, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAlertRules, useCreateAlertRule, useDeleteAlertRule, useNodes } from '@/hooks/useMetrics'
import type { AlertRule, Node } from '@/lib/types'

const METRICS = [
  { value: 'cpu_percent', label: 'CPU Usage' },
  { value: 'memory_percent', label: 'RAM Usage' },
  { value: 'disk_percent', label: 'Disk Usage' },
]
const SEVERITIES = ['info', 'warning', 'critical'] as const

const SEVERITY_COLORS = {
  info: 'text-blue-400',
  warning: 'text-amber-400',
  critical: 'text-red-400',
}

interface NewRuleState {
  node_id: string
  metric: string
  operator: '>' | '<'
  threshold: string
  severity: 'info' | 'warning' | 'critical'
}

export default function RulesPage() {
  const { data: rules = [], isLoading } = useAlertRules()
  const { data: nodes = [] } = useNodes()
  const createRule = useCreateAlertRule()
  const deleteRule = useDeleteAlertRule()

  const [form, setForm] = useState<NewRuleState>({
    node_id: 'all',
    metric: 'cpu_percent',
    operator: '>',
    threshold: '90',
    severity: 'warning',
  })
  const [formError, setFormError] = useState('')

  function handleCreate() {
    const threshold = parseFloat(form.threshold)
    if (isNaN(threshold) || threshold < 0 || threshold > 100) {
      setFormError('Threshold must be between 0 and 100')
      return
    }
    setFormError('')
    createRule.mutate({
      node_id: form.node_id,
      metric: form.metric,
      operator: form.operator,
      threshold,
      severity: form.severity,
      notification_channels: [],
    })
  }

  const metricLabel = (m: string) => METRICS.find((x) => x.value === m)?.label ?? m

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[hsl(var(--foreground))] flex items-center gap-2">
          <ShieldAlert size={18} className="text-[hsl(var(--primary))]" />
          Alert Rules
        </h1>
        <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
          Configure threshold rules that trigger alerts
        </p>
      </div>

      {/* Create form */}
      <div className="glass rounded-xl p-5">
        <h2 className="text-sm font-semibold text-[hsl(var(--foreground))] mb-4 flex items-center gap-2">
          <Plus size={14} /> New Rule
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
          {/* Node */}
          <div>
            <label className="text-xs text-[hsl(var(--muted-foreground))] block mb-1">Node</label>
            <select
              value={form.node_id}
              onChange={(e) => setForm({ ...form, node_id: e.target.value })}
              className="w-full text-xs bg-[hsl(var(--muted))] border border-[hsl(var(--border))] rounded-md px-2 py-1.5 text-[hsl(var(--foreground))] focus:outline-none focus:border-[hsl(var(--primary))]"
            >
              <option value="all">All nodes</option>
              {nodes.map((n: Node) => (
                <option key={n.node_id} value={n.node_id}>
                  {n.hostname}
                </option>
              ))}
            </select>
          </div>

          {/* Metric */}
          <div>
            <label className="text-xs text-[hsl(var(--muted-foreground))] block mb-1">Metric</label>
            <select
              value={form.metric}
              onChange={(e) => setForm({ ...form, metric: e.target.value })}
              className="w-full text-xs bg-[hsl(var(--muted))] border border-[hsl(var(--border))] rounded-md px-2 py-1.5 text-[hsl(var(--foreground))] focus:outline-none focus:border-[hsl(var(--primary))]"
            >
              {METRICS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Operator + Threshold */}
          <div>
            <label className="text-xs text-[hsl(var(--muted-foreground))] block mb-1">Condition</label>
            <div className="flex gap-1">
              <select
                value={form.operator}
                onChange={(e) => setForm({ ...form, operator: e.target.value as '>' | '<' })}
                className="text-xs bg-[hsl(var(--muted))] border border-[hsl(var(--border))] rounded-md px-2 py-1.5 text-[hsl(var(--foreground))] focus:outline-none focus:border-[hsl(var(--primary))]"
              >
                <option value=">">{'>'}</option>
                <option value="<">{'<'}</option>
              </select>
              <input
                type="number"
                value={form.threshold}
                onChange={(e) => setForm({ ...form, threshold: e.target.value })}
                min={0}
                max={100}
                className="w-full text-xs bg-[hsl(var(--muted))] border border-[hsl(var(--border))] rounded-md px-2 py-1.5 text-[hsl(var(--foreground))] focus:outline-none focus:border-[hsl(var(--primary))]"
                placeholder="%"
              />
            </div>
          </div>

          {/* Severity */}
          <div>
            <label className="text-xs text-[hsl(var(--muted-foreground))] block mb-1">Severity</label>
            <select
              value={form.severity}
              onChange={(e) => setForm({ ...form, severity: e.target.value as typeof form.severity })}
              className="w-full text-xs bg-[hsl(var(--muted))] border border-[hsl(var(--border))] rounded-md px-2 py-1.5 text-[hsl(var(--foreground))] focus:outline-none focus:border-[hsl(var(--primary))]"
            >
              {SEVERITIES.map((s) => (
                <option key={s} value={s} className="capitalize">{s}</option>
              ))}
            </select>
          </div>

          {/* Submit */}
          <button
            onClick={handleCreate}
            disabled={createRule.isPending}
            className="text-xs px-4 py-1.5 rounded-md bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {createRule.isPending ? 'Adding…' : 'Add Rule'}
          </button>
        </div>
        {formError && <p className="text-xs text-red-400 mt-2">{formError}</p>}
      </div>

      {/* Rules table */}
      <div className="glass rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-[hsl(var(--muted))] rounded animate-pulse" />)}
          </div>
        ) : rules.length === 0 ? (
          <div className="p-10 flex flex-col items-center gap-3 text-[hsl(var(--muted-foreground))]">
            <ShieldAlert size={32} />
            <p className="text-sm">No rules configured</p>
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] uppercase tracking-wide">
                <th className="text-left px-4 py-3">Node</th>
                <th className="text-left px-4 py-3">Metric</th>
                <th className="text-left px-4 py-3">Condition</th>
                <th className="text-left px-4 py-3">Severity</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule: AlertRule) => (
                <tr
                  key={rule.id}
                  className="border-b border-[hsl(var(--border))/50] hover:bg-[hsl(var(--muted)/0.3)] transition-colors"
                >
                  <td className="px-4 py-3 text-[hsl(var(--foreground))] font-mono">
                    {rule.node_id === 'all' ? 'All Nodes' : rule.node_id.slice(0, 12) + '…'}
                  </td>
                  <td className="px-4 py-3 text-[hsl(var(--foreground))]">{metricLabel(rule.metric)}</td>
                  <td className="px-4 py-3 font-semibold text-[hsl(var(--foreground))]">
                    {rule.operator} {rule.threshold}%
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('font-semibold capitalize', SEVERITY_COLORS[rule.severity])}>
                      {rule.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => deleteRule.mutate(rule.id)}
                      disabled={deleteRule.isPending}
                      className="p-1.5 rounded text-red-400 hover:bg-red-400/10 transition-colors"
                      title="Delete rule"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
