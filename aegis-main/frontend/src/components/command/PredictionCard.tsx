'use client'
import { useAgentStore } from '@/stores/agentStore'
import { TrendingUp, ArrowRight } from 'lucide-react'

export default function PredictionCard() {
  const { prediction } = useAgentStore()

  const timeToImpact = prediction?.time_to_impact_minutes ?? 15
  const sector = prediction?.affected_sectors?.[0] ?? 'Sector-07'
  const text = prediction?.description || `Flood expected to reach ${sector} in approximately ${timeToImpact} minutes.`

  return (
    <div className="bg-[#111827]/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md select-none font-mono text-white flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
              NEXT PREDICTION
            </h3>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
            {timeToImpact} MIN
          </span>
        </div>

        <p className="text-xs text-slate-200 font-sans leading-relaxed mt-2">
          "{text}"
        </p>
      </div>

      <button className="mt-4 w-full py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 text-xs font-mono font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer">
        <span>VIEW PREDICTION MAP</span>
        <ArrowRight size={14} />
      </button>
    </div>
  )
}
