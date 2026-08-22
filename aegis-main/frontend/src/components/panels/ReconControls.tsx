'use client'
import { useSimulation } from '@/hooks/useSimulation'
import { useSimulationStore } from '@/stores/simulationStore'
import { useReconStore } from '@/stores/reconStore'
import { Play, Pause, RotateCcw, FastForward, Clock, Sliders, ShieldAlert } from 'lucide-react'

export default function ReconControls() {
  const sim = useSimulation()
  const { simulation } = useSimulationStore()
  const { config, setConfig } = useReconStore()

  const handleSpeed = (speed: number) => {
    sim.setSpeed(speed)
  }

  const handleInterval = (interval: number) => {
    setConfig({ recon_interval_seconds: interval })
  }

  const isRunning = simulation.is_running && !simulation.is_paused
  const isPaused = simulation.is_paused

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-xl select-none flex flex-col gap-2.5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
        <div className="flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-cyan-400" />
          <h4 className="text-[10px] font-mono font-bold text-white tracking-wider uppercase">
            SIMULATION & RECON CONTROLS
          </h4>
        </div>
        <div className="flex items-center gap-1 text-[9px] font-mono text-slate-400">
          <Clock className="w-3 h-3 text-cyan-400" />
          <span>SIM T+{simulation.tick}</span>
        </div>
      </div>

      {/* Main Play / Pause / Reset */}
      <div className="flex items-center gap-2">
        {!isRunning ? (
          <button
            onClick={() => sim.start(simulation.disaster_type || 'flood')}
            className="flex-1 py-2 rounded-lg font-mono text-xs font-bold text-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg"
            style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)' }}
          >
            <Play size={14} fill="currentColor" />
            {isPaused ? 'RESUME FLOOD' : 'START FLOOD'}
          </button>
        ) : (
          <button
            onClick={() => sim.pause()}
            className="flex-1 py-2 rounded-lg font-mono text-xs font-bold text-white bg-amber-500/20 border border-amber-500/50 hover:bg-amber-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Pause size={14} />
            PAUSE SIMULATION
          </button>
        )}

        <button
          onClick={() => sim.reset(simulation.disaster_type || 'flood')}
          className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title="Reset Simulation"
        >
          <RotateCcw size={14} />
        </button>
      </div>

      {/* Control Selector Grids */}
      <div className="grid grid-cols-2 gap-2 text-[9px] font-mono">
        {/* Speed Selector */}
        <div className="bg-black/30 border border-white/5 rounded-lg p-2">
          <div className="text-slate-400 mb-1 flex items-center gap-1">
            <FastForward size={10} className="text-cyan-400" />
            <span>SIM SPEED</span>
          </div>
          <div className="flex gap-1">
            {[0.5, 1, 2, 4].map((spd) => (
              <button
                key={spd}
                onClick={() => handleSpeed(spd)}
                className={`flex-1 py-1 rounded text-[9px] font-bold transition-colors cursor-pointer ${
                  simulation.speed === spd
                    ? 'bg-cyan-500 text-black'
                    : 'bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                {spd}×
              </button>
            ))}
          </div>
        </div>

        {/* Recon Interval Selector */}
        <div className="bg-black/30 border border-white/5 rounded-lg p-2">
          <div className="text-slate-400 mb-1 flex items-center gap-1">
            <Clock size={10} className="text-indigo-400" />
            <span>RECON INTERVAL</span>
          </div>
          <div className="flex gap-1">
            {[1, 3, 5].map((sec) => (
              <button
                key={sec}
                onClick={() => handleInterval(sec)}
                className={`flex-1 py-1 rounded text-[9px] font-bold transition-colors cursor-pointer ${
                  config.recon_interval_seconds === sec
                    ? 'bg-indigo-500 text-white'
                    : 'bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                {sec}s
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
