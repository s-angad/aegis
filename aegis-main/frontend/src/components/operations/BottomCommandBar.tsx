'use client'
import { useState } from 'react'
import { useSimulation } from '@/hooks/useSimulation'
import { useSimulationStore } from '@/stores/simulationStore'
import { useReconStore } from '@/stores/reconStore'
import { Play, Pause, RotateCcw, FastForward, Shuffle, Repeat } from 'lucide-react'

export default function BottomCommandBar() {
  const sim = useSimulation()
  const { simulation, floodState } = useSimulationStore()
  const { latestObservation } = useReconStore()

  const [lastSeed, setLastSeed] = useState<number | undefined>(undefined)

  const isRunning = simulation.is_running && !simulation.is_paused
  const isPaused = simulation.is_paused
  const sc = simulation.scenario

  const floodAreaPct = latestObservation?.flood_area_percent ?? (floodState?.total_flooded_cells ? Math.round((floodState.total_flooded_cells / 256) * 100) : 0)
  const waterLevel = floodState?.max_flood_level ?? (sc ? sc.river_baseline : 2.71)
  const popRisk = floodState?.projected_lives_at_risk ?? (isRunning ? 34362 : 0)
  const livesSaved = floodState?.lives_saved ?? (isRunning ? 1350 : 0)

  const handleStartNewScenario = () => {
    const newSeed = Math.floor(100000 + Math.random() * 900000)
    setLastSeed(newSeed)
    sim.start(simulation.disaster_type || 'flood', newSeed)
  }

  const handleReplayScenario = () => {
    if (lastSeed) {
      sim.reset(simulation.disaster_type || 'flood', lastSeed)
      setTimeout(() => {
        sim.start(simulation.disaster_type || 'flood', lastSeed)
      }, 300)
    }
  }

  return (
    <div className="bg-[#0f172a]/95 border border-slate-800/80 rounded-2xl p-4 shadow-2xl backdrop-blur-md select-none font-sans text-white flex flex-col gap-3">
      {/* 5 Key Metrics with Number ABOVE Label (Section 13 & 31) */}
      <div className="grid grid-cols-5 divide-x divide-slate-800 text-center py-0.5">
        <div className="px-3">
          <div className="text-2xl font-mono font-black text-cyan-300">{waterLevel.toFixed(2)} m</div>
          <div className="text-[10px] font-sans font-bold text-slate-400 uppercase tracking-wider mt-0.5">WATER LEVEL</div>
        </div>

        <div className="px-3">
          <div className="text-2xl font-mono font-black text-cyan-300">{floodAreaPct.toFixed(0)}%</div>
          <div className="text-[10px] font-sans font-bold text-slate-400 uppercase tracking-wider mt-0.5">FLOODED AREA</div>
        </div>

        <div className="px-3">
          <div className="text-2xl font-mono font-black text-red-400">{popRisk.toLocaleString()}</div>
          <div className="text-[10px] font-sans font-bold text-slate-400 uppercase tracking-wider mt-0.5">PEOPLE AT RISK</div>
        </div>

        <div className="px-3">
          <div className="text-2xl font-mono font-black text-emerald-400">{livesSaved.toLocaleString()}</div>
          <div className="text-[10px] font-sans font-bold text-slate-400 uppercase tracking-wider mt-0.5">PEOPLE PROTECTED</div>
        </div>

        <div className="px-3">
          <div className="text-2xl font-mono font-black text-amber-400">
            {isRunning ? 'HIGH RISK' : 'NORMAL'}
          </div>
          <div className="text-[10px] font-sans font-bold text-slate-400 uppercase tracking-wider mt-0.5">SYSTEM STATUS</div>
        </div>
      </div>

      {/* Scenario Preview Info & Simulation Controls */}
      <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-800/80">
        <div className="flex items-center justify-between gap-3">
          {/* Prominent Start / Scenario Buttons */}
          {!isRunning ? (
            <div className="flex-1 flex items-center gap-2">
              <button
                onClick={handleStartNewScenario}
                className="flex-1 py-3 px-6 rounded-xl font-mono text-sm font-black text-black bg-gradient-to-r from-cyan-400 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-cyan-500/25 scale-105"
              >
                <Play size={18} fill="currentColor" />
                {isPaused ? 'RESUME SIMULATION' : 'START FLOOD SIMULATION'}
              </button>

              {lastSeed && (
                <button
                  onClick={handleReplayScenario}
                  className="py-3 px-4 rounded-xl font-mono text-xs font-bold text-cyan-300 bg-slate-800 hover:bg-slate-700 border border-cyan-500/40 flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Replay previous scenario with exact same seed"
                >
                  <Repeat size={14} />
                  REPLAY
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={() => sim.pause()}
              className="flex-1 py-3 px-8 rounded-xl font-mono text-sm font-black text-cyan-300 bg-cyan-950/70 border border-cyan-500/50 flex items-center justify-center gap-2.5 transition-all"
            >
              <Pause size={18} />
              FLOOD SIMULATION ACTIVE
            </button>
          )}

          <button
            onClick={() => sim.pause()}
            className="px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer text-xs font-mono font-bold flex items-center gap-1.5"
          >
            <Pause size={14} />
            PAUSE
          </button>

          <button
            onClick={() => sim.reset(simulation.disaster_type || 'flood')}
            className="p-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Reset Simulation & Generate New Scenario"
          >
            <RotateCcw size={16} />
          </button>

          {/* Speed Selector */}
          <div className="flex items-center gap-1 bg-[#0b0f19] border border-slate-800 p-1 rounded-xl text-xs font-mono">
            <FastForward size={12} className="text-cyan-400 ml-2 mr-1" />
            {[0.5, 1, 2, 4].map((spd) => (
              <button
                key={spd}
                onClick={() => sim.setSpeed(spd)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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

        {/* Dynamic Scenario Badge & Subtitle (Section 22 & 31) */}
        <div className="flex items-center justify-between text-[11px] font-sans px-1">
          <div className="flex items-center gap-2 text-cyan-400 font-mono font-bold">
            <Shuffle size={12} />
            <span>
              SCENARIO: "{sc ? sc.scenario_type : 'Dynamic Random Flood'}"
              {sc ? ` · Seed: #${sc.seed}` : ''}
            </span>
          </div>

          <span className="text-slate-400">
            {isRunning
              ? `Threat Sectors: ${sc?.primary_threat_sectors.join(', ') || 'Sector-4'}`
              : 'Watch AEGIS detect, predict, and respond.'}
          </span>
        </div>
      </div>

      {/* Flood Progression Progress Bar */}
      <div className="flex items-center gap-3 pt-1">
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
