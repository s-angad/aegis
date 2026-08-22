'use client'
import { create } from 'zustand'
import type { SimulationState, FloodState } from '@/lib/types'

interface SimulationStore {
  simulation: SimulationState
  floodState: FloodState | null
  floodGeoJSON: GeoJSON.FeatureCollection | null
  timeline: Array<{ tick: number; description: string; rain_rate: number; narrative: string }>
  currentNarrative: string
  setSimulation: (s: Partial<SimulationState>) => void
  setFloodState: (f: FloodState) => void
  setFloodGeoJSON: (g: GeoJSON.FeatureCollection) => void
  addTimelineEntry: (entry: { tick: number; description: string; rain_rate: number; narrative: string }) => void
  setNarrative: (n: string) => void
  resetSimulationStore: () => void
}

export const useSimulationStore = create<SimulationStore>((set) => ({
  simulation: {
    tick: 0,
    total_ticks: 20,
    is_running: false,
    is_paused: false,
    speed: 1,
    status: 'idle',
  },
  floodState: null,
  floodGeoJSON: null,
  timeline: [],
  currentNarrative: 'AEGIS AI System Ready. Monitoring all channels.',
  setSimulation: (s) => set((state) => ({ simulation: { ...state.simulation, ...s } })),
  setFloodState: (f) => set({ floodState: f }),
  setFloodGeoJSON: (g) => set({ floodGeoJSON: g }),
  addTimelineEntry: (entry) =>
    set((state) => ({
      timeline: [...state.timeline.filter((t) => t.tick !== entry.tick), entry].sort(
        (a, b) => a.tick - b.tick
      ),
    })),
  setNarrative: (n) => set({ currentNarrative: n }),
  resetSimulationStore: () => set({
    simulation: { tick: 0, total_ticks: 20, is_running: false, is_paused: false, speed: 1, status: 'idle' },
    floodState: null,
    floodGeoJSON: null,
    timeline: [],
    currentNarrative: 'AEGIS AI System Ready. Monitoring all channels.',
  })
}))
