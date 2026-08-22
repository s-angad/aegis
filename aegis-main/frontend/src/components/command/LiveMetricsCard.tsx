'use client'
import { useReconStore } from '@/stores/reconStore'
import { useAgentStore } from '@/stores/agentStore'
import { Gauge, TrendingUp, ShieldCheck, Clock } from 'lucide-react'

export default function LiveMetricsCard() {
  const { latestObservation } = useReconStore()
  const { prediction } = useAgentStore()

  const velocity = latestObservation?.estimated_velocity ?? 0.18
  const expansion = latestObservation?.expansion_rate ?? 1.4
  const confidence = latestObservation?.confidence ?? prediction?.confidence_pct ?? 94
  const nextSector = prediction?.affected_sectors?.[0] ?? 'Sector-07'
  const timeToImpact = prediction?.time_to_impact_minutes ?? 15

  return (
    <div className="bg-[#111827]/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md select-none font-mono text-white">
      <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-3">
        LIVE METRICS
      </h3>

      <div className="grid grid-cols-2 gap-2.5">
        {/* Velocity */}
        <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-2.5">
          <div className="flex items-center justify-between text-[9px] text-slate-400 uppercase">
            <span>FLOOD VELOCITY</span>
            <Gauge className="w-3 h-3 text-cyan-400" />
          </div>
          <div className="text-sm font-bold text-white mt-1">{velocity.toFixed(2)} m/s</div>
          <div className="text-[9px] text-cyan-400 font-sans mt-0.5">→ West</div>
        </div>

        {/* Expansion Rate */}
        <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-2.5">
          <div className="flex items-center justify-between text-[9px] text-slate-400 uppercase">
            <span>EXPANSION RATE</span>
            <TrendingUp className="w-3 h-3 text-amber-400" />
          </div>
          <div className="text-sm font-bold text-amber-400 mt-1">+{expansion.toFixed(1)}%/s</div>
          <div className="text-[9px] text-amber-400 font-sans mt-0.5">↑ Rising</div>
        </div>

        {/* Confidence */}
        <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-2.5">
          <div className="flex items-center justify-between text-[9px] text-slate-400 uppercase">
            <span>CONFIDENCE</span>
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
          </div>
          <div className="text-sm font-bold text-emerald-400 mt-1">{confidence}%</div>
          <div className="text-[9px] text-emerald-400 font-sans mt-0.5">High</div>
        </div>

        {/* Estimated Impact */}
        <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-2.5">
          <div className="flex items-center justify-between text-[9px] text-slate-400 uppercase">
            <span>EST. IMPACT</span>
            <Clock className="w-3 h-3 text-purple-400" />
          </div>
          <div className="text-sm font-bold text-purple-300 mt-1">{timeToImpact} min</div>
          <div className="text-[9px] text-purple-400 font-sans mt-0.5">{nextSector}</div>
        </div>
      </div>
    </div>
  )
}
