'use client'
import { useState } from 'react'
import { useSimulation } from '@/hooks/useSimulation'
import { useSimulationStore } from '@/stores/simulationStore'
import { useReconStore } from '@/stores/reconStore'
import { useDemoStore } from '@/stores/demoStore'
import SpeedController from '@/components/simulation/SpeedController'
import { Play, Pause, RotateCcw, FastForward, Repeat, Shuffle, RefreshCw } from 'lucide-react'

export default function HeroSection() {
  const sim = useSimulation()
  const { simulation, floodState } = useSimulationStore()
  const { latestObservation } = useReconStore()

  const [lastSeed, setLastSeed] = useState<number | undefined>(undefined)

  const isRunning = simulation.is_running && !simulation.is_paused
  const isPaused = simulation.is_paused
  const sc = simulation.scenario

  const floodAreaPct = latestObservation?.flood_area_percent ?? (floodState?.total_flooded_cells ? Math.round((floodState.total_flooded_cells / 256) * 100) : (isRunning ? 31 : 0))
  const waterLevel = floodState?.max_flood_level ?? (sc ? sc.river_baseline : 1.6)
  const popRisk = floodState?.projected_lives_at_risk ?? (isRunning ? 8420 : 0)

  const handleStartNewScenario = () => {
    const newSeed = Math.floor(100000 + Math.random() * 900000)
    setLastSeed(newSeed)
    sim.start(simulation.disaster_type || 'flood', newSeed)
  }

  const handleResumeSimulation = () => {
    sim.resume()
  }

  const handlePauseSimulation = () => {
    sim.pause()
  }

  const handleRestartSimulation = () => {
    sim.reset(simulation.disaster_type || 'flood', lastSeed)
  }

  return (
    <div className="space-y-6 select-none font-sans">
      {/* CURRENT SITUATION HERO */}
      <div className="bg-[#0d1424] border border-slate-800/60 rounded-3xl p-8 shadow-2xl backdrop-blur-md text-white flex flex-col md:flex-row items-stretch justify-between gap-8">
        {/* LEFT COLUMN: Status & Headline */}
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className={`px-4 py-1.5 rounded-full text-xs font-bold font-mono tracking-wider flex items-center gap-2 uppercase ${
                isRunning ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}>
                <span className={`w-2.5 h-2.5 rounded-full ${isRunning ? 'bg-red-500 animate-ping' : 'bg-emerald-400'}`} />
                {isRunning ? '🔴 FLOOD EMERGENCY ACTIVE' : '🟢 SYSTEM READY'}
              </span>

              {sc && (
                <span className="px-3.5 py-1 rounded-full text-xs font-mono font-bold text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 flex items-center gap-1.5">
                  <Shuffle size={12} />
                  {sc.scenario_type}
                </span>
              )}
            </div>

            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white mt-2 leading-tight">
              {isRunning ? 'Rapid flooding detected near Sector 04.' : 'AEGIS Autonomous Flood Response Ready.'}
            </h2>

            <p className="text-slate-300 text-base mt-3 max-w-2xl leading-relaxed font-sans">
              "AEGIS is monitoring flood expansion and coordinating the emergency response."
            </p>
          </div>

          {!isRunning && (
            <p className="text-xs text-slate-400 font-sans mt-4 font-medium">
              "Watch AEGIS detect, predict, and respond."
            </p>
          )}
        </div>

        {/* RIGHT COLUMN: 3 Clean Statistic Cards */}
        <div className="grid grid-cols-3 gap-4 shrink-0 w-full md:w-[560px]">
          <div className="bg-[#070B14] border border-slate-800/80 p-5 rounded-2xl flex flex-col justify-between text-center shadow-lg">
            <span className="text-[11px] font-sans font-bold text-slate-400 uppercase tracking-wider">WATER LEVEL</span>
            <div className="my-2">
              <span className="text-3xl font-mono font-black text-cyan-300">{waterLevel.toFixed(1)}m</span>
              <div className="text-xs font-sans font-semibold text-cyan-400 mt-0.5">↑ Rising</div>
            </div>
            <span className="text-[10px] font-mono text-slate-500">River Telemetry</span>
          </div>

          <div className="bg-[#070B14] border border-slate-800/80 p-5 rounded-2xl flex flex-col justify-between text-center shadow-lg">
            <span className="text-[11px] font-sans font-bold text-slate-400 uppercase tracking-wider">PEOPLE AT RISK</span>
            <div className="my-2">
              <span className="text-3xl font-mono font-black text-red-400">{popRisk.toLocaleString()}</span>
              <div className="text-xs font-sans font-semibold text-red-400 mt-0.5">High Exposure</div>
            </div>
            <span className="text-[10px] font-mono text-slate-500">Demographic Grid</span>
          </div>

          <div className="bg-[#070B14] border border-slate-800/80 p-5 rounded-2xl flex flex-col justify-between text-center shadow-lg">
            <span className="text-[11px] font-sans font-bold text-slate-400 uppercase tracking-wider">FLOODED AREA</span>
            <div className="my-2">
              <span className="text-3xl font-mono font-black text-amber-400">{floodAreaPct.toFixed(0)}%</span>
              <div className="text-xs font-sans font-semibold text-amber-400 mt-0.5">Inundation</div>
            </div>
            <span className="text-[10px] font-mono text-slate-500">Aerial Recon</span>
          </div>
        </div>
      </div>

      {/* DEDICATED MANUAL SIMULATION CONTROL BAR */}
      <div className="bg-[#0d1424] border border-slate-800/60 rounded-2xl p-4 shadow-xl backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
        {/* Status Indicator */}
        <div className="flex items-center gap-2.5 font-mono text-xs font-bold text-cyan-300">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <span>{isRunning ? '● FLOOD SIMULATION ACTIVE' : isPaused ? '● SIMULATION PAUSED' : '● SIMULATION STANDBY'}</span>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-3 flex-1 flex-wrap">
          {!isRunning && !isPaused && (
            <button
              onClick={handleStartNewScenario}
              className="py-3 px-6 rounded-xl font-mono text-sm font-black text-black bg-gradient-to-r from-cyan-400 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-lg shadow-cyan-500/25 scale-102"
            >
              <Play size={18} fill="currentColor" />
              ▶ START SIMULATION
            </button>
          )}

          {isRunning && (
            <button
              onClick={handlePauseSimulation}
              className="py-3 px-6 rounded-xl font-mono text-sm font-black text-amber-300 bg-amber-950/80 hover:bg-amber-900 border border-amber-500/50 flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-lg shadow-amber-500/20"
            >
              <Pause size={18} />
              ⏸ PAUSE SIMULATION
            </button>
          )}

          {isPaused && (
            <button
              onClick={handleResumeSimulation}
              className="py-3 px-6 rounded-xl font-mono text-sm font-black text-emerald-300 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
            >
              <Play size={18} fill="currentColor" />
              ▶ RESUME SIMULATION
            </button>
          )}

          <button
            onClick={handleRestartSimulation}
            className="px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer text-xs font-mono font-bold flex items-center gap-1.5"
            title="Restart / Reset simulation to tick 0"
          >
            <RotateCcw size={14} />
            ↺ RESTART SIMULATION
          </button>

          <button
            onClick={handleStartNewScenario}
            className="px-4 py-3 rounded-xl bg-slate-800 border border-cyan-500/40 text-cyan-300 hover:text-white transition-colors cursor-pointer text-xs font-mono font-bold flex items-center gap-1.5"
            title="Generate new random disaster scenario"
          >
            <RefreshCw size={14} />
            ↻ NEW SCENARIO
          </button>
        </div>

        {/* Interactive Speed Controller */}
        <SpeedController />
      </div>
    </div>
  )
}
