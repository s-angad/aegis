'use client'
import { useAgentStore } from '@/stores/agentStore'
import { useSimulationStore } from '@/stores/simulationStore'
import { TrendingUp, Clock, AlertTriangle, Users } from 'lucide-react'

export default function WhatAegisPredictsSection() {
  const { prediction } = useAgentStore()
  const { simulation, floodState } = useSimulationStore()
  const isRunning = simulation.is_running && !simulation.is_paused

  const sector = prediction?.affected_sectors?.[0] ?? 'SECTOR 07'
  const timeToImpact = prediction?.time_to_impact_minutes ?? 18
  const popRisk = floodState?.projected_lives_at_risk ?? (isRunning ? 8420 : 0)

  return (
    <div className="py-10 space-y-6 select-none font-sans">
      <div>
        <h2 className="text-3xl font-black text-white tracking-tight">WHAT HAPPENS NEXT?</h2>
        <p className="text-slate-400 text-sm mt-1">
          "AEGIS runs a forward simulation to identify areas that may become dangerous."
        </p>
      </div>

      <div className="bg-[#0f172a]/90 border border-slate-800/80 rounded-3xl p-8 shadow-2xl backdrop-blur-md space-y-6">
        {/* Timeline Progression Card */}
        <div className="grid grid-cols-3 gap-4 text-center font-mono">
          <div className="p-4 rounded-2xl bg-[#080c14] border border-cyan-500/40">
            <div className="text-xs text-cyan-400 font-bold uppercase">CURRENT STATE</div>
            <div className="text-lg font-bold text-white mt-1">Flooded Sector 04</div>
          </div>

          <div className="p-4 rounded-2xl bg-[#080c14] border border-amber-500/40">
            <div className="text-xs text-amber-400 font-bold uppercase">15 MINUTES</div>
            <div className="text-lg font-bold text-white mt-1">Advancing to Sector 07</div>
          </div>

          <div className="p-4 rounded-2xl bg-[#080c14] border border-purple-500/40">
            <div className="text-xs text-purple-400 font-bold uppercase">30 MINUTES</div>
            <div className="text-lg font-bold text-white mt-1">Potential Sector 10 Inundation</div>
          </div>
        </div>

        {/* Prediction Details Grid */}
        <div className="grid grid-cols-3 gap-6 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-4 bg-[#080c14] p-5 rounded-2xl border border-slate-800">
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
              <AlertTriangle size={24} />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-mono font-bold uppercase">NEXT HIGH-RISK AREA</div>
              <div className="text-xl font-mono font-black text-purple-300">{sector}</div>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-[#080c14] p-5 rounded-2xl border border-slate-800">
            <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Clock size={24} />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-mono font-bold uppercase">ESTIMATED TIME</div>
              <div className="text-xl font-mono font-black text-cyan-300">~{timeToImpact} MINUTES</div>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-[#080c14] p-5 rounded-2xl border border-slate-800">
            <div className="p-3 rounded-xl bg-red-500/10 text-red-400">
              <Users size={24} />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-mono font-bold uppercase">POTENTIALLY AFFECTED</div>
              <div className="text-xl font-mono font-black text-red-400">{popRisk.toLocaleString()} PEOPLE</div>
            </div>
          </div>
        </div>

        {/* AI Recommendation Banner */}
        <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-between text-sm">
          <span className="font-mono font-bold text-purple-300">AI RECOMMENDATION:</span>
          <span className="text-white font-medium">"Begin evacuation before the area becomes inaccessible."</span>
        </div>
      </div>
    </div>
  )
}
