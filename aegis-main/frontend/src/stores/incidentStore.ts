'use client'
import { create } from 'zustand'
import type { Incident } from '@/lib/types'

// Normalize an incoming incident object so all arrays/fields are always present
function normalizeIncident(raw: unknown): Incident {
  const i = (raw ?? {}) as Record<string, unknown>
  return {
    id: (i.id as string) || Math.random().toString(36).slice(2, 10),
    type: (i.type as Incident['type']) || 'flood',
    sector: (i.sector as string) || 'Unknown',
    lat: Number(i.lat) || 28.6139,
    lng: Number(i.lng) || 77.2090,
    severity: (i.severity as Incident['severity']) || 'LOW',
    confidence: Number(i.confidence) || 50,
    source: (i.source as string) || 'unknown',
    description: (i.description as string) || '',
    timestamp: (i.timestamp as string) || new Date().toISOString(),
    verified: Boolean(i.verified),
    assigned_resources: Array.isArray(i.assigned_resources) ? (i.assigned_resources as string[]) : [],
    reporter_name: (i.reporter_name as string | undefined) ?? undefined,
    water_level: Number(i.water_level) || 0,
    population_affected: Number(i.population_affected) || 0,
    is_active: i.is_active !== false, // default true
  }
}

interface IncidentStore {
  incidents: Incident[]
  selectedIncidentId: string | null
  setIncidents: (incidents: unknown[]) => void
  addIncident: (incident: unknown) => void
  updateIncident: (id: string, updates: Partial<Incident>) => void
  clearIncidents: () => void
  selectIncident: (id: string | null) => void
}

export const useIncidentStore = create<IncidentStore>((set) => ({
  incidents: [],
  selectedIncidentId: null,
  setIncidents: (raws) => set({ incidents: raws.map(normalizeIncident) }),
  addIncident: (raw) => {
    const incident = normalizeIncident(raw)
    set((state) => ({
      incidents: state.incidents.find((i) => i.id === incident.id)
        ? state.incidents.map((i) => (i.id === incident.id ? incident : i))
        : [incident, ...state.incidents],
    }))
  },
  updateIncident: (id, updates) =>
    set((state) => ({
      incidents: state.incidents.map((i) => (i.id === id ? { ...i, ...updates } : i)),
    })),
  clearIncidents: () => set({ incidents: [], selectedIncidentId: null }),
  selectIncident: (id) => set({ selectedIncidentId: id }),
}))
