'use client'
import { useSimulation } from '@/hooks/useSimulation'
import { useSimulationStore } from '@/stores/simulationStore'
import { useReconStore } from '@/stores/reconStore'
import { Play, Pause, RotateCcw, FastForward } from 'lucide-react'

export default function SimulationControls() {
  const sim = useSimulation()
  const { simulation, floodState } = useSimulationStore()
  const { latestObservation } = useReconStore()

  const isRunning = simulation.is_running && !simulation.is_paused
  const isPaused = simulation.is_paused

  const floodAreaPct = latestObservation?.flood_area_percent ?? (floodState?.total_flooded_cells ? Math.round((floodState.total_flooded_cells / 256) * 100) : 0)

  return (
    <div className="bg-[#111827]/95 border border-slate-800 rounded-2xl p-4 shadow-2xl backdrop-blur-md select-none font-mono text-white flex flex-col gap-3">
      {/* Simulation Controls Row */}
      <div className="flex items-center justify-between gap-3">
        {/* Prominent START FLOOD Button */}
        {!isRunning ? (
          <button
            onClick={() => sim.start(simulation.disaster_type || 'flood')}
            className="flex-1 py-3 px-6 rounded-xl font-mono text-sm font-black text-black bg-gradient-to-r from-cyan-400 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-cyan-500/20"
          >
            <Play size={16} fill="currentColor" />
            {isPaused ? 'RESUME FLOOD' : 'START FLOOD'}
          </button>
        ) : (
          <button
            onClick={() => sim.pause()}
            className="flex-1 py-3 px-6 rounded-xl font-mono text-sm font-black text-cyan-300 bg-cyan-950/60 border border-cyan-500/50 flex items-center justify-center gap-2 transition-all"
          >
            <Pause size={16} />
            FLOOD IN PROGRESS
          </button>
        )}

        <button
          onClick={() => sim.pause()}
          className="px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer text-xs font-bold flex items-center gap-1.5"
        >
          <Pause size={14} />
          PAUSE
        </button>

        <button
          onClick={() => sim.reset(simulation.disaster_type || 'flood')}
          className="p-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          title="Reset Simulation"
        >
          <RotateCcw size={14} />
        </button>

        {/* Speed Selector */}
        <div className="flex items-center gap-1 bg-[#0b0f19] border border-slate-800 p-1 rounded-xl text-xs">
          <FastForward size={12} className="text-cyan-400 ml-1.5 mr-0.5" />
          {[0.5, 1, 2, 4].map((spd) => (
            <button
              key={spd}
              onClick={() => sim.setSpeed(spd)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                simulation.speed === spd
                  ? 'bg-cyan-500 text-black shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {spd}×
            </button>
          ))}
        </div>
      </div>

      {/* Flood Progression Progress Bar (Section 20 of prompt) */}
      <div className="flex items-center gap-3 pt-1 border-t border-slate-800/80">
        <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider shrink-0">
          FLOOD PROGRESSION
        </span>
        <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(2, floodAreaPct))}%` }}
          />
        </div>
        <span className="text-xs font-mono font-black text-cyan-300 shrink-0 w-10 text-right">
          {floodAreaPct}%
        </span>
      </div>
    </div>
  )
}
