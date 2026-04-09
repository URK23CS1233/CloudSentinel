import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { Node, MetricPayload, Alert, AlertRule } from '@/lib/types'

const REFETCH_INTERVAL = 5000

// ─── Nodes ─────────────────────────────────────────────────────────────────────

export function useNodes() {
  return useQuery<Node[]>({
    queryKey: ['nodes'],
    queryFn: async () => {
      const { data } = await api.get('/nodes')
      return data
    },
    refetchInterval: REFETCH_INTERVAL,
  })
}

export function useNodeDetail(nodeId: string) {
  return useQuery<Node>({
    queryKey: ['node', nodeId],
    queryFn: async () => {
      const { data } = await api.get(`/nodes/${nodeId}`)
      return data
    },
    refetchInterval: REFETCH_INTERVAL,
    enabled: !!nodeId,
  })
}

// ─── Metrics ───────────────────────────────────────────────────────────────────

export function useMetrics(nodeId: string, range: '1h' | '6h' | '24h' = '1h') {
  return useQuery<MetricPayload[]>({
    queryKey: ['metrics', nodeId, range],
    queryFn: async () => {
      const { data } = await api.get(`/metrics/${nodeId}?range=${range}`)
      return data
    },
    refetchInterval: REFETCH_INTERVAL,
    enabled: !!nodeId,
  })
}

export function useLatestMetric(nodeId: string) {
  return useQuery<MetricPayload>({
    queryKey: ['metrics', nodeId, 'latest'],
    queryFn: async () => {
      const { data } = await api.get(`/metrics/${nodeId}/latest`)
      return data
    },
    refetchInterval: REFETCH_INTERVAL,
    enabled: !!nodeId,
  })
}

export function useAllLatestMetrics() {
  return useQuery<MetricPayload[]>({
    queryKey: ['metrics', 'summary', 'all'],
    queryFn: async () => {
      const { data } = await api.get('/metrics/summary/all')
      return data
    },
    refetchInterval: REFETCH_INTERVAL,
  })
}

// ─── Alerts ────────────────────────────────────────────────────────────────────

export function useAlerts(nodeId?: string, severity?: string) {
  return useQuery<Alert[]>({
    queryKey: ['alerts', nodeId, severity],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (nodeId) params.append('node_id', nodeId)
      if (severity) params.append('severity', severity)
      const { data } = await api.get(`/alerts?${params.toString()}`)
      return data
    },
    refetchInterval: REFETCH_INTERVAL,
  })
}

export function useResolveAlert() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (alertId: string) => api.post(`/alerts/${alertId}/resolve`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts'] }),
  })
}

export function useSilenceAlert() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ alertId, minutes }: { alertId: string; minutes: number }) =>
      api.post(`/alerts/${alertId}/silence?duration_minutes=${minutes}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts'] }),
  })
}

// ─── Alert Rules ───────────────────────────────────────────────────────────────

export function useAlertRules() {
  return useQuery<AlertRule[]>({
    queryKey: ['alert_rules'],
    queryFn: async () => {
      const { data } = await api.get('/alerts/rules')
      return data
    },
    refetchInterval: REFETCH_INTERVAL,
  })
}

export function useCreateAlertRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (rule: Omit<AlertRule, 'id'>) => api.post('/alerts/rules', rule),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alert_rules'] }),
  })
}

export function useDeleteAlertRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (ruleId: string) => api.delete(`/alerts/rules/${ruleId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alert_rules'] }),
  })
}
