'use client'
import { useSimulationStore } from '@/stores/simulationStore'
import { useReconStore } from '@/stores/reconStore'

export default function BaselineMetricsBar() {
  const { simulation, floodState } = useSimulationStore()
  const { latestObservation } = useReconStore()

  const isRunning = simulation.is_running && !simulation.is_paused
  const waterLevel = floodState?.max_flood_level ?? 2.8
  const floodAreaPct = latestObservation?.flood_area_percent ?? (floodState?.total_flooded_cells ? Math.round((floodState.total_flooded_cells / 256) * 100) : (isRunning ? 67 : 0))
  const popRisk = floodState?.projected_lives_at_risk ?? (isRunning ? 18420 : 0)
  const blockedRoads = floodState?.blocked_roads ?? (isRunning ? 21 : 0)

  return (
    <div className="bg-[#0f172a]/95 border border-amber-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-md text-white font-sans select-none grid grid-cols-5 divide-x divide-slate-800 text-center">
      <div className="px-3">
        <div className="text-2xl md:text-3xl font-mono font-black text-cyan-300">
          {waterLevel.toFixed(1)} m <span className="text-sm font-sans font-normal text-cyan-400">↑</span>
        </div>
        <div className="text-[11px] font-sans font-bold text-slate-400 uppercase tracking-wider mt-1">
          WATER LEVEL
        </div>
      </div>

      <div className="px-3">
        <div className="text-2xl md:text-3xl font-mono font-black text-amber-400">
          {floodAreaPct.toFixed(0)}%
        </div>
        <div className="text-[11px] font-sans font-bold text-slate-400 uppercase tracking-wider mt-1">
          FLOODED AREA
        </div>
      </div>

      <div className="px-3">
        <div className="text-2xl md:text-3xl font-mono font-black text-red-400">
          {popRisk.toLocaleString()}
        </div>
        <div className="text-[11px] font-sans font-bold text-slate-400 uppercase tracking-wider mt-1">
          PEOPLE AT RISK
        </div>
      </div>

      <div className="px-3">
        <div className="text-2xl md:text-3xl font-mono font-black text-slate-300">
          {blockedRoads}
        </div>
        <div className="text-[11px] font-sans font-bold text-slate-400 uppercase tracking-wider mt-1">
          BLOCKED ROADS
        </div>
      </div>

      <div className="px-3">
        <div className="text-sm md:text-base font-mono font-black text-amber-400 leading-tight">
          BASELINE — NO AI
        </div>
        <div className="text-[11px] font-sans font-bold text-slate-400 uppercase tracking-wider mt-1">
          STATUS
        </div>
      </div>
    </div>
  )
}
