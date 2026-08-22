// AEGIS FLOOD — Simulation Context Derivation Helper (Challenge #64)

import { Context } from './classification'
import { useSimulationStore } from '@/stores/simulationStore'
import { useDemoStore } from '@/stores/demoStore'

/**
 * Derives current Context from simulation runtime state and demo store.
 */
export function deriveCurrentContext(isMissionReportOpen = false): Context {
  if (isMissionReportOpen) {
    return 'POST_INCIDENT'
  }

  const { simulation, floodState } = useSimulationStore.getState()
  const { phase } = useDemoStore.getState()

  if (simulation.status === 'completed' || simulation.tick >= simulation.total_ticks || phase === 4) {
    return 'POST_INCIDENT'
  }

  if (simulation.is_running || simulation.tick > 0) {
    // Check if any sector has high risk / critical severity or active evacuation
    const hasHighRisk =
      (floodState && floodState.total_flooded_cells > 10) ||
      simulation.tick >= 4 ||
      phase >= 2

    return hasHighRisk ? 'ACTIVE_RESPONSE' : 'MONITORING'
  }

  return 'IDLE'
}
