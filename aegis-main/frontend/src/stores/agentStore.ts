'use client'
import { create } from 'zustand'
import type { AgentDecision, Alert, Prediction } from '@/lib/types'

const MAX_DECISIONS = 60

// ─── Normalizers — ensure every object has required fields ───────────────────

function normalizeAlert(raw: unknown): Alert {
  const a = (raw ?? {}) as Record<string, unknown>
  return {
    id: (a.id as string) || Math.random().toString(36).slice(2, 10),
    type: (a.type as Alert['type']) || 'PUBLIC_ALERT',
    priority: (a.priority as Alert['priority']) || 'LOW',
    title: (a.title as string) || 'Alert',
    message: (a.message as string) || '',
    affected_sectors: Array.isArray(a.affected_sectors) ? (a.affected_sectors as string[]) : [],
    timestamp: (a.timestamp as string) || new Date().toISOString(),
    channel: (a.channel as string) || 'broadcast',
  }
}

function normalizeDecision(raw: unknown): AgentDecision {
  const d = (raw ?? {}) as Record<string, unknown>
  return {
    id: (d.id as string) || Math.random().toString(36).slice(2, 10),
    agent_name: (d.agent_name as AgentDecision['agent_name']) || 'Orchestrator',
    action: (d.action as string) || '',
    description: (d.description as string) || '',
    reasoning: (d.reasoning as string) || '',
    sop_reference: (d.sop_reference as string | undefined) ?? undefined,
    timestamp: (d.timestamp as string) || new Date().toISOString(),
    related_incident_id: (d.related_incident_id as string | undefined) ?? undefined,
    severity: (d.severity as 'info' | 'warning' | 'critical') || 'info',
  }
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface AgentStore {
  decisions: AgentDecision[]
  alerts: Alert[]
  prediction: Prediction | null
  routes: Record<string, number[][]>
  droneTelemetry: any | null
  policyRecommendations: string[]
  addDecision: (decision: unknown) => void
  addAlert: (alert: unknown) => void
  setPrediction: (p: Prediction) => void
  setRoutes: (r: Record<string, number[][]>) => void
  setDroneTelemetry: (t: any) => void
  setPolicyRecommendations: (r: string[]) => void
  clearAll: () => void
}

export const useAgentStore = create<AgentStore>((set) => ({
  decisions: [],
  alerts: [],
  prediction: null,
  routes: {},
  droneTelemetry: null,
  policyRecommendations: [],
  addDecision: (raw) =>
    set((state) => ({
      decisions: [normalizeDecision(raw), ...state.decisions].slice(0, MAX_DECISIONS),
    })),
  addAlert: (raw) =>
    set((state) => ({
      alerts: [normalizeAlert(raw), ...state.alerts].slice(0, 30),
    })),
  setPrediction: (p) => set({ prediction: p }),
  setRoutes: (r) => set({ routes: r }),
  setDroneTelemetry: (t) => set({ droneTelemetry: t }),
  setPolicyRecommendations: (r) => set({ policyRecommendations: r }),
  clearAll: () => set({ decisions: [], alerts: [], prediction: null, routes: {}, droneTelemetry: null, policyRecommendations: [] }),
}))
