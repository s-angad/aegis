'use client'
import { create } from 'zustand'
import type { Resource, Shelter } from '@/lib/types'

function normalizeResource(raw: unknown): Resource {
  const r = (raw ?? {}) as Record<string, unknown>
  return {
    id: (r.id as string) || Math.random().toString(36).slice(2, 10),
    type: (r.type as Resource['type']) || 'rescue_team',
    name: (r.name as string) || 'Unknown Resource',
    status: (r.status as Resource['status']) || 'available',
    lat: Number(r.lat) || 28.6139,
    lng: Number(r.lng) || 77.2090,
    home_lat: Number(r.home_lat) || 28.6139,
    home_lng: Number(r.home_lng) || 77.2090,
    assigned_incident: (r.assigned_incident as string | undefined) ?? undefined,
    route: Array.isArray(r.route) ? (r.route as number[][]) : [],
    route_progress: Number(r.route_progress) || 0,
    crew_count: Number(r.crew_count) || 2,
    capacity: Number(r.capacity) || 5,
  }
}

function normalizeShelter(raw: unknown): Shelter {
  const s = (raw ?? {}) as Record<string, unknown>
  return {
    id: (s.id as string) || Math.random().toString(36).slice(2, 10),
    name: (s.name as string) || 'Emergency Shelter',
    lat: Number(s.lat) || 28.6139,
    lng: Number(s.lng) || 77.2090,
    sector: (s.sector as string) || 'Unknown',
    capacity: Number(s.capacity) || 500,
    current_occupancy: Number(s.current_occupancy) || 0,
    status: (s.status as Shelter['status']) || 'standby',
    address: (s.address as string) || '',
  }
}

interface ResourceStore {
  resources: Resource[]
  shelters: Shelter[]
  setResources: (resources: unknown[]) => void
  updateResource: (id: string, updates: Partial<Resource>) => void
  setShelters: (shelters: unknown[]) => void
  updateShelter: (id: string, updates: Partial<Shelter>) => void
}

export const useResourceStore = create<ResourceStore>((set) => ({
  resources: [],
  shelters: [],
  setResources: (raws) => set({ resources: raws.map(normalizeResource) }),
  updateResource: (id, updates) =>
    set((state) => ({
      resources: state.resources.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    })),
  setShelters: (raws) => set({ shelters: raws.map(normalizeShelter) }),
  updateShelter: (id, updates) =>
    set((state) => ({
      shelters: state.shelters.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    })),
}))
