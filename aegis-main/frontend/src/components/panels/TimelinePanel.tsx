'use client'
import { useSimulationStore } from '@/stores/simulationStore'
import { useSimulation } from '@/hooks/useSimulation'
import { API_URL } from '@/lib/constants'
import { Play, Pause, RotateCcw, ChevronFirst, ChevronLast, Gauge } from 'lucide-react'

const SPEEDS = [0.5, 1, 2, 4]

export default function TimelinePanel() {
  const { simulation, timeline } = useSimulationStore()
  const sim = useSimulation()

  const tick = simulation.tick
  const totalTicks = simulation.total_ticks || 20
  const pct = (tick / totalTicks) * 100
  const isRunning = simulation.is_running && !simulation.is_paused
  const isCompleted = simulation.status === 'completed'

  const handleSpeedChange = async (speed: number) => {
    await fetch(`${API_URL}/api/simulation/speed?speed=${speed}`, { method: 'POST' })
  }

  return (
    <div className="h-full flex flex-col justify-center px-6 gap-3">
      {/* Narrative */}
      {simulation.narrative && (
        <p className="text-[10px] text-slate-400 text-center font-mono truncate px-8">
          {simulation.narrative}
        </p>
      )}

      {/* Timeline scrubber */}
      <div className="relative">
        {/* Tick markers */}
        <div className="flex justify-between px-0 mb-1">
          {Array.from({ length: Math.min(totalTicks, 20) }, (_, i) => i + 1).map((t) => {
            const entry = timeline.find((tl) => tl.tick === t)
            const hasEvent = entry && entry.description !== 'Normal conditions'
            return (
              <div key={t} className="flex flex-col items-center">
                <div
                  className={`w-px h-2 ${t <= tick ? 'bg-cyan-400' : 'bg-white/20'}`}
                />
                {hasEvent && t <= tick && (
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-0.5" title={entry?.description} />
                )}
              </div>
            )
          })}
        </div>

        {/* Progress bar */}
        <div className="relative h-2 bg-white/10 rounded-full overflow-visible">
          <div
            className="absolute left-0 top-0 h-full rounded-full transition-all duration-700"
            style={{
              width: `${pct}%`,
              background: 'linear-gradient(90deg, #0ea5e9, #06b6d4, #00d4ff)',
              boxShadow: '0 0 8px rgba(0,212,255,0.6)',
            }}
          />
          {/* Current position indicator */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 border-cyan-400 bg-black transition-all duration-700"
            style={{
              left: `${pct}%`,
              boxShadow: '0 0 8px rgba(0,212,255,0.8)',
            }}
          />
        </div>

        {/* Tick labels */}
        <div className="flex justify-between mt-1">
          <span className="text-[9px] text-slate-600 font-mono">T0</span>
          <span className="text-[9px] text-slate-600 font-mono">T{totalTicks}</span>
        </div>
      </div>

      {/* Controls row */}
      <div className="flex items-center justify-between gap-4">
        {/* Playback controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => sim.reset(simulation.disaster_type || 'flood')}
            className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
            title="Reset"
          >
            <RotateCcw size={13} />
          </button>

          <button
            onClick={() => isRunning ? sim.pause() : (simulation.is_paused ? sim.resume() : sim.start())}
            className="px-4 py-1.5 rounded-lg border font-bold text-xs transition-all duration-200 flex items-center gap-2"
            style={{
              backgroundColor: isRunning ? 'rgba(239,68,68,0.15)' : 'rgba(0,212,255,0.15)',
              borderColor: isRunning ? 'rgba(239,68,68,0.4)' : 'rgba(0,212,255,0.4)',
              color: isRunning ? '#ef4444' : '#00d4ff',
            }}
          >
            {isRunning ? <Pause size={12} /> : <Play size={12} />}
            {isCompleted ? 'REPLAY' : isRunning ? 'PAUSE' : simulation.is_paused ? 'RESUME' : 'START'}
          </button>
        </div>

        {/* Tick counter */}
        <div className="text-center">
          <span className="text-[11px] font-mono font-bold text-cyan-400">
            TICK {String(tick).padStart(2, '0')} / {String(totalTicks).padStart(2, '0')}
          </span>
          {simulation.description && (
            <p className="text-[9px] text-slate-500 font-mono truncate max-w-[200px]">
              {simulation.description}
            </p>
          )}
        </div>

        {/* Speed controls */}
        <div className="flex items-center gap-1.5">
          <Gauge size={11} className="text-slate-500" />
          <div className="flex gap-1">
            {SPEEDS.map((speed) => (
              <button
                key={speed}
                onClick={() => handleSpeedChange(speed)}
                className="px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all duration-200 border"
                style={{
                  backgroundColor: simulation.speed === speed ? 'rgba(0,212,255,0.2)' : 'rgba(255,255,255,0.05)',
                  borderColor: simulation.speed === speed ? 'rgba(0,212,255,0.5)' : 'rgba(255,255,255,0.1)',
                  color: simulation.speed === speed ? '#00d4ff' : '#64748b',
                }}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
