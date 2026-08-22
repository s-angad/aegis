'use client'
import { useAgentStore } from '@/stores/agentStore'
import { useSimulationStore } from '@/stores/simulationStore'
import { Cpu, ArrowRight } from 'lucide-react'

export default function AiResponseCard({ onOpenDrawer }: { onOpenDrawer: () => void }) {
  const { decisions } = useAgentStore()
  const { simulation } = useSimulationStore()
  const isRunning = simulation.is_running && !simulation.is_paused

  const safeDecisions = Array.isArray(decisions) ? decisions : []
  const latestDecision = safeDecisions[0]

  return (
    <div className="bg-[#111827]/95 border border-slate-800 rounded-2xl p-5 shadow-2xl backdrop-blur-md text-white select-none flex flex-col justify-between font-sans">
      <div>
        {/* Title */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
              AEGIS RESPONSE
            </h3>
          </div>
          <button
            onClick={onOpenDrawer}
            className="text-[10px] font-mono text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            VIEW AI ACTIVITY <ArrowRight size={10} />
          </button>
        </div>

        {/* Main Action Headline */}
        <div className="text-base font-bold text-red-400 flex items-center gap-2 mb-1.5 font-sans">
          <span>🔴</span>
          <span>{isRunning ? 'EVACUATE SECTOR 04' : 'STANDING BY · READY FOR SIMULATION'}</span>
        </div>

        {/* Action Explanation */}
        <p className="text-xs text-slate-300 leading-relaxed font-sans mb-3">
          {isRunning
            ? (latestDecision?.reasoning || 'Flood depth increased rapidly and the flood front expanded 7% during the last observation.')
            : 'Click START FLOOD SIMULATION below to begin automated risk detection, prediction, and vehicle routing.'}
        </p>

        {/* Key Action Bullet Points */}
        <div className="space-y-1.5 text-xs text-slate-200 font-sans border-t border-slate-800 pt-2.5">
          <div className="flex items-center gap-2">
            <span className="text-cyan-400">→</span>
            <span>Rescue Boat 02 dispatched to Sector 04</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-cyan-400">→</span>
            <span>Shelter 03 activated for safehouse evacuees</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-cyan-400">→</span>
            <span>Route R14 blocked — alternative safe route calculated</span>
          </div>
        </div>
      </div>
    </div>
  )
}
