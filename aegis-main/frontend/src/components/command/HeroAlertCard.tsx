'use client'
import { useAgentStore } from '@/stores/agentStore'
import { useSimulationStore } from '@/stores/simulationStore'

export default function HeroAlertCard() {
  const { alerts } = useAgentStore()
  const { simulation, floodState } = useSimulationStore()
  const isRunning = simulation.is_running && !simulation.is_paused

  const safeAlerts = Array.isArray(alerts) ? alerts : []
  const latestAlert = safeAlerts[0]

  const title = latestAlert ? latestAlert.title : 'CRITICAL FLOOD'
  const message = latestAlert ? latestAlert.message : 'Water is rapidly entering Sector 04.'
  const popRisk = floodState?.projected_lives_at_risk || (isRunning ? 8420 : 0)
  const maxFlood = floodState?.max_flood_level || (isRunning ? 2.41 : 0.8)

  if (!isRunning && !latestAlert) {
    return (
      <div className="bg-[#0f172a]/95 border border-slate-800 rounded-2xl p-4 shadow-2xl backdrop-blur-md text-white select-none max-w-xs font-sans">
        <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          SYSTEM STANDBY · READY
        </div>
        <p className="text-xs text-slate-300 font-sans leading-relaxed">
          Click "START FLOOD SIMULATION" to observe autonomous detection, prediction, and rerouting.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-red-950/80 border border-red-500/60 rounded-2xl p-4 shadow-2xl shadow-red-950/40 backdrop-blur-md text-white select-none max-w-xs font-sans">
      <div className="flex items-center justify-between mb-1.5">
        <span className="flex items-center gap-2 text-xs font-bold text-red-400 uppercase tracking-wider">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
          🔴 {title}
        </span>
      </div>

      <p className="text-sm font-sans font-medium text-slate-100 leading-snug">
        {message}
      </p>

      <div className="mt-3 pt-2 border-t border-red-500/30 flex items-center justify-between text-xs text-red-200 font-sans">
        <span>People affected:</span>
        <span className="font-bold text-white font-mono text-sm">{popRisk.toLocaleString()}</span>
      </div>

      <div className="mt-1 flex items-center justify-between text-xs text-slate-300 font-sans">
        <span>Flood Level:</span>
        <span className="font-bold text-cyan-300 font-mono text-sm">{maxFlood.toFixed(1)} m ↑</span>
      </div>
    </div>
  )
}
