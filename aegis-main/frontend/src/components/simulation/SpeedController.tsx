'use client'
import { FastForward, Gauge } from 'lucide-react'
import { useSimulation } from '@/hooks/useSimulation'
import { useSimulationStore } from '@/stores/simulationStore'

interface SpeedControllerProps {
  className?: string
}

export default function SpeedController({ className = '' }: SpeedControllerProps) {
  const sim = useSimulation()
  const { simulation } = useSimulationStore()
  const currentSpeed = simulation.speed || 1.0

  const handleSpeedChange = (newSpeed: number) => {
    const rounded = Math.round(newSpeed * 10) / 10
    sim.setSpeed(rounded)
  }

  const presets = [0.5, 1, 2, 4, 5, 10]

  return (
    <div className={`flex items-center gap-3 bg-[#0d1424]/90 border border-cyan-500/30 p-2 rounded-2xl backdrop-blur-md shadow-xl select-none ${className}`}>
      {/* Title Badge */}
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-400 text-xs font-mono font-bold">
        <Gauge size={14} className="animate-pulse text-cyan-300" />
        <span>SIM SPEED</span>
        <span className="text-white font-black text-xs px-1.5 py-0.5 rounded bg-cyan-500/20 border border-cyan-400/40">
          {currentSpeed}x
        </span>
      </div>

      {/* Interactive Slider */}
      <div className="flex items-center gap-2 px-2">
        <input
          type="range"
          min="0.5"
          max="10"
          step="0.5"
          value={currentSpeed}
          onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
          className="w-24 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 hover:accent-cyan-300 transition-all"
        />
      </div>

      {/* Preset Speed Buttons */}
      <div className="flex items-center gap-1">
        {presets.map((spd) => {
          const isActive = Math.abs(currentSpeed - spd) < 0.1
          return (
            <button
              key={spd}
              onClick={() => handleSpeedChange(spd)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-400 to-indigo-500 text-black shadow-lg shadow-cyan-500/30 font-black scale-105'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60'
              }`}
            >
              {spd}x
            </button>
          )
        })}
      </div>
    </div>
  )
}
