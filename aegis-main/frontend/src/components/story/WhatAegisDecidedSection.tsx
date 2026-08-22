'use client'
import { useAgentStore } from '@/stores/agentStore'
import { useSimulationStore } from '@/stores/simulationStore'
import { Zap, CheckCircle2 } from 'lucide-react'

export default function WhatAegisDecidedSection() {
  const { decisions } = useAgentStore()
  const { simulation } = useSimulationStore()
  const isRunning = simulation.is_running && !simulation.is_paused

  const actions = [
    { title: 'Activate Shelter 03', agent: 'Communication Agent' },
    { title: 'Deploy Rescue Boat 02', agent: 'Allocation Agent' },
    { title: 'Begin evacuation', agent: 'Policy Commander' },
    { title: 'Recalculate emergency routes', agent: 'Routing Agent' },
  ]

  return (
    <div className="py-10 space-y-6 select-none font-sans">
      <div>
        <h2 className="text-3xl font-black text-white tracking-tight">WHAT DID AEGIS DECIDE?</h2>
        <p className="text-slate-400 text-sm mt-1">
          "Autonomous decision-making based on risk evaluation and SOP policy engine."
        </p>
      </div>

      <div className="bg-[#0f172a]/90 border border-slate-800/80 rounded-3xl p-8 shadow-2xl backdrop-blur-md space-y-6">
        {/* Main Headline Card */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-cyan-950/60 to-indigo-950/60 border border-cyan-500/40 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-cyan-500/20 text-cyan-300">
              <Zap size={32} />
            </div>
            <div>
              <div className="text-xs font-mono font-bold text-cyan-400 uppercase">PRIMARY AUTONOMOUS DECISION</div>
              <h3 className="text-2xl font-black text-white mt-0.5">⚡ EVACUATE SECTOR 04</h3>
            </div>
          </div>
          <span className="px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-mono font-bold uppercase">
            POLICY COMMANDER
          </span>
        </div>

        {/* WHY? Explanation */}
        <div className="p-5 rounded-2xl bg-[#080c14] border border-slate-800 space-y-1">
          <span className="text-xs font-mono font-bold text-amber-400 uppercase">WHY THIS DECISION?</span>
          <p className="text-slate-200 text-sm leading-relaxed">
            "{isRunning ? 'Water levels are rising rapidly and the sector contains a large residential population. Pre-emptive evacuation minimizes casualty exposure.' : 'Awaiting simulation triggers to generate autonomous decisions.'}"
          </p>
        </div>

        {/* Action Checkpoints */}
        <div className="grid grid-cols-2 gap-4">
          {actions.map((act, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-[#080c14] border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="text-sm font-bold text-white">{act.title}</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500">{act.agent}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
