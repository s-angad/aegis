'use client'
import { Shield, Terminal, Play, Pause, RotateCcw } from 'lucide-react'
import { useSimulation } from '@/hooks/useSimulation'
import { useSimulationStore } from '@/stores/simulationStore'

interface StoryHeaderProps {
  onOpenSystemDetails: () => void
}

export default function StoryHeader({ onOpenSystemDetails }: StoryHeaderProps) {
  const sim = useSimulation()
  const { simulation } = useSimulationStore()
  const tick = simulation.tick || 0

  const isRunning = simulation.is_running && !simulation.is_paused
  const isPaused = simulation.is_paused

  const handleStart = () => {
    const seed = Math.floor(100000 + Math.random() * 900000)
    sim.start(simulation.disaster_type || 'flood', seed)
  }

  return (
    <header className="bg-[#070B14]/95 border-b border-slate-800/60 px-6 md:px-10 py-3.5 flex items-center justify-between shrink-0 select-none z-40 backdrop-blur-md sticky top-0">
      {/* LEFT: Logo & Subtitle */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight text-white font-sans leading-none">
            AEGIS FLOOD
          </h1>
          <p className="text-[10px] font-sans font-bold text-slate-400 tracking-widest uppercase mt-1">
            AUTONOMOUS FLOOD RESPONSE
          </p>
        </div>
      </div>

      {/* CENTER: MANUAL CONTROL BUTTONS (START, PAUSE, RESUME, RESTART) */}
      <div className="flex items-center gap-2 bg-[#0d1424] border border-slate-800/80 p-1.5 rounded-2xl shadow-inner">
        {/* START BUTTON */}
        {!isRunning && !isPaused && (
          <button
            onClick={handleStart}
            className="px-4 py-2 rounded-xl font-mono text-xs font-black text-black bg-gradient-to-r from-cyan-400 to-indigo-400 hover:from-cyan-300 hover:to-indigo-300 flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-cyan-500/20"
          >
            <Play size={14} fill="currentColor" />
            <span>START</span>
          </button>
        )}

        {/* PAUSE BUTTON */}
        {isRunning && (
          <button
            onClick={() => sim.pause()}
            className="px-4 py-2 rounded-xl font-mono text-xs font-black text-amber-300 bg-amber-950/80 hover:bg-amber-900 border border-amber-500/40 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Pause size={14} />
            <span>PAUSE</span>
          </button>
        )}

        {/* RESUME BUTTON */}
        {isPaused && (
          <button
            onClick={() => sim.resume()}
            className="px-4 py-2 rounded-xl font-mono text-xs font-black text-emerald-300 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Play size={14} fill="currentColor" />
            <span>RESUME</span>
          </button>
        )}

        {/* RESTART / RESET BUTTON */}
        <button
          onClick={() => sim.reset(simulation.disaster_type || 'flood')}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer text-xs font-mono font-bold flex items-center gap-1"
          title="Reset simulation to tick 0"
        >
          <RotateCcw size={13} />
          <span>RESTART</span>
        </button>

        <span className="text-[11px] font-mono font-bold text-cyan-400 px-3 border-l border-slate-800">
          T+{tick < 10 ? `0${tick}` : tick}s
        </span>
      </div>

      {/* RIGHT: Operational Badge & System Details Button */}
      <div className="flex items-center gap-3 font-sans text-xs">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 font-bold text-[11px]">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          SYSTEM OPERATIONAL
        </div>

        <button
          onClick={onOpenSystemDetails}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-mono font-bold transition-all cursor-pointer shadow-md text-xs"
        >
          <Terminal size={14} className="text-cyan-400" />
          SYSTEM DETAILS →
        </button>
      </div>
    </header>
  )
}
