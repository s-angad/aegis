'use client'
import { create } from 'zustand'
import type { ReconObservation, ReconConfig } from '@/lib/types'

interface ReconStore {
  latestObservation: ReconObservation | null
  history: ReconObservation[]
  config: ReconConfig
  isCapturing: boolean
  lastCapturedAt: string | null
  selectedHistoryFrame: ReconObservation | null
  showOverlay: boolean
  humanOverrideActive: boolean
  setLatestObservation: (obs: ReconObservation) => void
  addHistoryObservation: (obs: ReconObservation) => void
  setHistory: (history: ReconObservation[]) => void
  setConfig: (cfg: Partial<ReconConfig>) => void
  setCapturing: (capturing: boolean) => void
  setSelectedHistoryFrame: (obs: ReconObservation | null) => void
  toggleOverlay: () => void
  toggleHumanOverride: () => void
  clearRecon: () => void
}

export const useReconStore = create<ReconStore>((set) => ({
  latestObservation: null,
  history: [],
  config: {
    recon_interval_seconds: 3.0,
    enabled: true,
    confidence_threshold: 70.0,
    model_width_meters: 8000.0,
    model_height_meters: 8000.0,
  },
  isCapturing: false,
  lastCapturedAt: null,
  selectedHistoryFrame: null,
  showOverlay: true,
  humanOverrideActive: false,
  setLatestObservation: (obs) =>
    set((state) => ({
      latestObservation: obs,
      lastCapturedAt: new Date().toISOString(),
      history: [obs, ...state.history.filter((h) => h.frame_number !== obs.frame_number)].slice(0, 50),
    })),
  addHistoryObservation: (obs) =>
    set((state) => ({
      history: [obs, ...state.history.filter((h) => h.frame_number !== obs.frame_number)].slice(0, 50),
    })),
  setHistory: (history) => set({ history }),
  setConfig: (cfg) => set((state) => ({ config: { ...state.config, ...cfg } })),
  setCapturing: (capturing) => set({ isCapturing: capturing }),
  setSelectedHistoryFrame: (obs) => set({ selectedHistoryFrame: obs }),
  toggleOverlay: () => set((state) => ({ showOverlay: !state.showOverlay })),
  toggleHumanOverride: () => set((state) => ({ humanOverrideActive: !state.humanOverrideActive })),
  clearRecon: () => set({ latestObservation: null, history: [], selectedHistoryFrame: null }),
}))
