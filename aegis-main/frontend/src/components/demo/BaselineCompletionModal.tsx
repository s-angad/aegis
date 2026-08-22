'use client'
import { AlertTriangle, Brain, ShieldAlert } from 'lucide-react'
import { useDemoStore } from '@/stores/demoStore'
import { useSimulationStore } from '@/stores/simulationStore'

interface BaselineCompletionModalProps {
  onAnalyze: () => void
}

export default function BaselineCompletionModal({ onAnalyze }: BaselineCompletionModalProps) {
  const { floodState } = useSimulationStore()

  const waterLevel = floodState?.max_flood_level ?? 2.8
  const floodAreaPct = floodState?.total_flooded_cells ? Math.round((floodState.total_flooded_cells / 256) * 100) : 67
  const popRisk = floodState?.projected_lives_at_risk ?? 18420
  const blockedRoads = floodState?.blocked_roads ?? 21

  return (
    <div className="fixed inset-0 z-50 bg-[#070B14]/85 backdrop-blur-md flex items-center justify-center p-6 animate-fadeIn select-none font-sans">
      <div className="bg-[#0d1424] border-2 border-amber-500/50 rounded-3xl p-8 max-w-2xl w-full shadow-2xl space-y-6 text-white text-center relative overflow-hidden">
        {/* Glowing Background Accent */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Icon & Banner */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shadow-xl shadow-amber-500/20">
            <ShieldAlert size={36} />
          </div>

          <span className="px-4 py-1.5 rounded-full text-xs font-mono font-bold tracking-widest uppercase text-amber-400 bg-amber-500/20 border border-amber-500/40">
            BASELINE FLOOD COMPLETE — WITHOUT AUTONOMOUS INTERVENTION
          </span>

          <h2 className="text-3xl font-black tracking-tight text-white mt-1">
            Unmitigated flood inundated city sectors without AI response.
          </h2>
        </div>

        {/* Summary Metrics Grid */}
        <div className="grid grid-cols-5 divide-x divide-slate-800 bg-[#070B14] border border-slate-800 p-4 rounded-2xl font-mono">
          <div>
            <div className="text-2xl font-black text-amber-400">{floodAreaPct}%</div>
            <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">FLOODED AREA</div>
          </div>
          <div>
            <div className="text-2xl font-black text-red-400">{popRisk.toLocaleString()}</div>
            <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">PEOPLE AT RISK</div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-300">{blockedRoads}</div>
            <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">BLOCKED ROADS</div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-500">0</div>
            <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">PEOPLE PROTECTED</div>
          </div>
          <div>
            <div className="text-2xl font-black text-red-400">6</div>
            <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">CRITICAL SECTORS</div>
          </div>
        </div>

        {/* Narrative Prompt */}
        <div className="space-y-1">
          <p className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
            PHASE 1 COMPLETE · READY FOR AEGIS RECON ANALYSIS
          </p>
          <p className="text-sm text-slate-300 font-medium font-sans">
            "Now let AEGIS analyze what happened and formulate an autonomous response plan."
          </p>
        </div>

        {/* Primary Action Button */}
        <button
          onClick={onAnalyze}
          className="w-full py-4 px-8 rounded-2xl font-mono text-base font-black text-black bg-gradient-to-r from-cyan-400 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 flex items-center justify-center gap-3 transition-all cursor-pointer shadow-xl shadow-cyan-500/25 scale-102"
        >
          <Brain size={22} />
          [ ANALYZE INCIDENT → ]
        </button>
      </div>
    </div>
  )
}
