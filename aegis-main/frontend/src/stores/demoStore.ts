'use client'
import { create } from 'zustand'

export type DemoPhase = 1 | 2 | 3 | 4

interface BaselineMetrics {
  waterLevel: number
  floodedAreaPct: number
  peopleAtRisk: number
  blockedRoads: number
  peopleProtected: number
  criticalAreas: number
}

interface AegisMetrics {
  waterLevel: number
  floodedAreaPct: number
  peopleAtRisk: number
  peopleProtected: number
  sheltersActivated: number
  resourcesDeployed: number
  routesAdapted: number
  riskReductionPct: number
}

interface DemoStore {
  phase: DemoPhase
  scenarioSeed: number
  baselineMetrics: BaselineMetrics
  aegisMetrics: AegisMetrics
  setPhase: (phase: DemoPhase) => void
  setScenarioSeed: (seed: number) => void
  setBaselineMetrics: (m: Partial<BaselineMetrics>) => void
  setAegisMetrics: (m: Partial<AegisMetrics>) => void
  resetDemo: () => void
}

export const useDemoStore = create<DemoStore>((set) => ({
  phase: 1,
  scenarioSeed: 4821,
  baselineMetrics: {
    waterLevel: 2.8,
    floodedAreaPct: 67,
    peopleAtRisk: 18420,
    blockedRoads: 21,
    peopleProtected: 0,
    criticalAreas: 6,
  },
  aegisMetrics: {
    waterLevel: 2.6,
    floodedAreaPct: 42,
    peopleAtRisk: 8420,
    peopleProtected: 5740,
    sheltersActivated: 3,
    resourcesDeployed: 7,
    routesAdapted: 4,
    riskReductionPct: 78,
  },
  setPhase: (phase) => set({ phase }),
  setScenarioSeed: (scenarioSeed) => set({ scenarioSeed }),
  setBaselineMetrics: (m) => set((state) => ({ baselineMetrics: { ...state.baselineMetrics, ...m } })),
  setAegisMetrics: (m) => set((state) => ({ aegisMetrics: { ...state.aegisMetrics, ...m } })),
  resetDemo: () =>
    set({
      phase: 1,
      scenarioSeed: Math.floor(1000 + Math.random() * 9000),
      baselineMetrics: {
        waterLevel: 2.8,
        floodedAreaPct: 67,
        peopleAtRisk: 18420,
        blockedRoads: 21,
        peopleProtected: 0,
        criticalAreas: 6,
      },
      aegisMetrics: {
        waterLevel: 2.6,
        floodedAreaPct: 42,
        peopleAtRisk: 8420,
        peopleProtected: 5740,
        sheltersActivated: 3,
        resourcesDeployed: 7,
        routesAdapted: 4,
        riskReductionPct: 78,
      },
    }),
}))
