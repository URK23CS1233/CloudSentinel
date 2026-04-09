import { Server, Wifi, WifiOff, BellRing, Activity } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNodes, useAlerts, useAllLatestMetrics } from '@/hooks/useMetrics'
import NodeCard from '@/components/NodeCard'
import type { Node, MetricPayload } from '@/lib/types'

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: number | string
  color: string
  loading?: boolean
}

function StatCard({ icon, label, value, color, loading }: StatCardProps) {
  return (
    <div className="glass rounded-xl p-5 flex items-center gap-4">
      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', color)}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-[hsl(var(--foreground))] tabular-nums">
          {loading ? '—' : value}
        </p>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { data: nodes = [], isLoading: nodesLoading } = useNodes()
  const { data: alerts = [], isLoading: alertsLoading } = useAlerts()
  const { data: latestMetrics = [] } = useAllLatestMetrics()

  const onlineNodes = nodes.filter((n: Node) => n.status !== 'offline')
  const offlineNodes = nodes.filter((n: Node) => n.status === 'offline')

  const metricsMap = new Map<string, MetricPayload>()
  latestMetrics.forEach((m) => metricsMap.set(m.node_id, m))

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[hsl(var(--foreground))]">Dashboard</h1>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
            Real-time overview of all monitored nodes
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-400">
          <Activity size={12} className="pulse-dot" />
          <span>Live · auto-refresh 5s</span>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Nodes"
          value={nodes.length}
          icon={<Server size={18} className="text-[hsl(var(--primary))]" />}
          color="bg-[hsl(var(--primary)/0.15)]"
          loading={nodesLoading}
        />
        <StatCard
          label="Online"
          value={onlineNodes.length}
          icon={<Wifi size={18} className="text-emerald-400" />}
          color="bg-emerald-400/10"
          loading={nodesLoading}
        />
        <StatCard
          label="Offline"
          value={offlineNodes.length}
          icon={<WifiOff size={18} className="text-red-400" />}
          color="bg-red-400/10"
          loading={nodesLoading}
        />
        <StatCard
          label="Active Alerts"
          value={alerts.length}
          icon={<BellRing size={18} className="text-amber-400" />}
          color="bg-amber-400/10"
          loading={alertsLoading}
        />
      </div>

      {/* Node grid */}
      <div>
        <h2 className="text-sm font-semibold text-[hsl(var(--foreground))] mb-3">
          Nodes ({nodes.length})
        </h2>
        {nodesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="glass rounded-xl p-4 h-44 animate-pulse" />
            ))}
          </div>
        ) : nodes.length === 0 ? (
          <div className="glass rounded-xl p-10 flex flex-col items-center gap-3 text-[hsl(var(--muted-foreground))]">
            <Server size={32} />
            <p className="text-sm">No nodes registered yet</p>
            <p className="text-xs">Run the agent on a server to start monitoring</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nodes.map((node: Node) => {
              const m = metricsMap.get(node.node_id)
              return (
                <NodeCard
                  key={node.node_id}
                  node={node}
                  cpu={m?.cpu_percent ?? 0}
                  ram={m?.memory_percent ?? 0}
                  disk={m?.disk_percent ?? 0}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
