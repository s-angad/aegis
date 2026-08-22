'use client'
import { useState } from 'react'
import { useAgentStore } from '@/stores/agentStore'
import { useSimulationStore } from '@/stores/simulationStore'
import { Cpu, ArrowRight, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react'

export default function AiResponseStoryPanel({ onOpenDrawer }: { onOpenDrawer: () => void }) {
  const { decisions } = useAgentStore()
  const { simulation, floodState } = useSimulationStore()
  const isRunning = simulation.is_running && !simulation.is_paused

  const [showWhy, setShowWhy] = useState(false)

  const safeDecisions = Array.isArray(decisions) ? decisions : []
  const latestDecision = safeDecisions[0]

  // Pipeline stages for OODA loop visualization (Section 7)
  const pipelineStages = [
    { label: 'OBSERVE', active: isRunning, icon: '🔴', agent: 'Sentinel' },
    { label: 'VERIFY', active: isRunning, icon: '🔎', agent: 'Verifier' },
    { label: 'PREDICT', active: isRunning, icon: '🧠', agent: 'Predictor' },
    { label: 'DECIDE', active: isRunning, icon: '⚡', agent: 'Policy Commander' },
    { label: 'ACT', active: isRunning, icon: '🚑', agent: 'Allocator / Router' },
  ]

  const maxFlood = floodState?.max_flood_level ?? 2.71
  const popRisk = floodState?.projected_lives_at_risk ?? (isRunning ? 8420 : 0)

  return (
    <div className="bg-[#0f172a]/95 border border-slate-800/80 rounded-2xl p-4 shadow-2xl backdrop-blur-md text-white select-none font-sans flex flex-col justify-between h-full">
      <div>
        {/* Top Header & Pipeline Visual */}
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-800/80 mb-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
              AEGIS AI RESPONSE STORY
            </h3>
          </div>

          {/* OODA Pipeline Stage Indicator (Section 7) */}
          <div className="flex items-center gap-1.5 text-[10px] font-mono">
            {pipelineStages.map((stage, idx) => (
              <div key={stage.label} className="flex items-center gap-1.5">
                <span className={`px-2 py-0.5 rounded-lg font-bold flex items-center gap-1 transition-all ${
                  stage.active
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-500 bg-slate-900 border border-slate-800'
                }`}>
                  <span>{stage.icon}</span>
                  <span>{stage.label}</span>
                </span>
                {idx < pipelineStages.length - 1 && <span className="text-slate-600">→</span>}
              </div>
            ))}
          </div>

          <button
            onClick={onOpenDrawer}
            className="text-[10px] font-mono text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            SYSTEM DETAILS <ArrowRight size={10} />
          </button>
        </div>

        {/* Structured Story Cards (WHAT, WHY, ACTION, RESULT) - Sections 5, 8, 9, 22 */}
        <div className="grid grid-cols-12 gap-3 text-xs">
          {/* WHAT? */}
          <div className="col-span-3 bg-[#080c14] border border-slate-800/80 p-3 rounded-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono font-bold text-red-400 uppercase tracking-wider">
                  🔴 WHAT HAPPENED?
                </span>
                <span className="text-[9px] font-mono text-slate-500">Sentinel</span>
              </div>
              <p className="text-slate-200 leading-snug font-medium">
                {isRunning ? 'Flood waters breached riverbank and expanded rapidly into Sector 04.' : 'Disaster response system is standing by ready to simulate flood.'}
              </p>
            </div>
          </div>

          {/* WHY THIS DECISION? (Section 9) */}
          <div className="col-span-3 bg-[#080c14] border border-slate-800/80 p-3 rounded-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider">
                  🧠 WHY THIS DECISION?
                </span>
                <span className="text-[9px] font-mono text-slate-500">Predictor</span>
              </div>
              <p className="text-slate-300 leading-snug">
                {isRunning ? `Water level +0.4m over 5 min. ${popRisk.toLocaleString()} residents exposed to flood.` : 'Awaiting flood simulation trigger to assess threat levels.'}
              </p>
            </div>
            <div className="flex items-center justify-between text-[9px] font-mono text-emerald-400 mt-2">
              <span>CONFIDENCE: 94% HIGH</span>
              <button
                onClick={() => setShowWhy(!showWhy)}
                className="text-cyan-400 hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <span>Details</span>
                {showWhy ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
              </button>
            </div>
          </div>

          {/* ACTION TAKEN */}
          <div className="col-span-3 bg-[#080c14] border border-slate-800/80 p-3 rounded-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider">
                  ⚡ AI ACTION TAKEN
                </span>
                <span className="text-[9px] font-mono text-slate-500">Policy Commander</span>
              </div>
              <ul className="text-slate-200 space-y-0.5 font-medium">
                <li className="flex items-center gap-1.5"><span className="text-cyan-400">•</span> Evacuate Sector 04</li>
                <li className="flex items-center gap-1.5"><span className="text-cyan-400">•</span> Deploy Rescue Boat 02</li>
                <li className="flex items-center gap-1.5"><span className="text-cyan-400">•</span> Activate Shelter 03</li>
              </ul>
            </div>
          </div>

          {/* RESULT & REROUTING */}
          <div className="col-span-3 bg-[#080c14] border border-slate-800/80 p-3 rounded-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
                  🛡️ RESULT & REROUTE
                </span>
                <span className="text-[9px] font-mono text-slate-500">Routing Agent</span>
              </div>
              <p className="text-slate-300 leading-snug">
                {isRunning ? 'Route R14 blocked. Safe route recalculated via R18. 1,017 residents protected.' : 'Safehouse shelters & rescue boats ready for deployment.'}
              </p>
            </div>
          </div>
        </div>

        {/* Expandable Explanation Details Box (Section 9) */}
        {showWhy && (
          <div className="mt-2.5 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300 space-y-1 animate-fadeIn">
            <div className="text-cyan-400 font-bold font-mono">EVIDENCE & RATIONALE FOR PRE-EMPTIVE EVACUATION:</div>
            <p>
              Water level increased by 0.4m over the last 5 minutes. The flood front is moving west toward Sector 04 (containing ~8,420 residents). The nearest safe zone is Shelter 03. Therefore AEGIS recommends immediate pre-emptive evacuation.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
