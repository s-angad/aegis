'use client'
import { useAgentStore } from '@/stores/agentStore'
import { useSimulationStore } from '@/stores/simulationStore'

export default function CompactPredictionCard({ onOpenDrawer }: { onOpenDrawer: () => void }) {
  const { prediction } = useAgentStore()
  const { simulation, floodState } = useSimulationStore()
  const isRunning = simulation.is_running && !simulation.is_paused

  const sector = prediction?.affected_sectors?.[0] ?? 'Sector 04'
  const timeMin = prediction?.time_to_impact_minutes ?? 18
  const popRisk = floodState?.projected_lives_at_risk || (isRunning ? 8420 : 0)

  return (
    <div className="bg-[#111827]/95 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md text-white select-none font-sans max-w-xs">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-mono font-bold text-slate-300 uppercase flex items-center gap-1.5">
          <span>🧠</span> NEXT 30 MINUTES
        </span>
        <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase">
          HIGH RISK
        </span>
      </div>

      <div className="text-xs font-bold text-cyan-300 font-mono mb-1">{sector}</div>

      <p className="text-xs text-slate-300 leading-relaxed font-sans">
        Flood expected to reach this area in ~{timeMin} minutes. {popRisk.toLocaleString()} people potentially affected.
      </p>

      <div className="mt-2.5 pt-2 border-t border-slate-800 text-[11px] font-sans flex items-center justify-between">
        <span className="text-amber-400 font-bold">AI RECOMMENDATION:</span>
        <span className="text-white font-medium">Begin evacuation now.</span>
      </div>
    </div>
  )
}
