'use client'
import { ShieldCheck, Award, BarChart2 } from 'lucide-react'
import { useSimulationStore } from '@/stores/simulationStore'

interface ControlledCompletionModalProps {
  onCompare: () => void
}

export default function ControlledCompletionModal({ onCompare }: ControlledCompletionModalProps) {
  const { floodState } = useSimulationStore()

  const floodAreaPct = floodState?.total_flooded_cells ? Math.round((floodState.total_flooded_cells / 256) * 100) : 42
  const popRisk = floodState?.projected_lives_at_risk ?? 8420
  const livesSaved = floodState?.lives_saved ?? 5740

  return (
    <div className="fixed inset-0 z-50 bg-[#070B14]/85 backdrop-blur-md flex items-center justify-center p-6 animate-fadeIn select-none font-sans">
      <div className="bg-[#0d1424] border-2 border-emerald-500/50 rounded-3xl p-8 max-w-2xl w-full shadow-2xl space-y-6 text-white text-center relative overflow-hidden">
        {/* Glowing Background Accent */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Icon & Banner */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shadow-xl shadow-emerald-500/20">
            <ShieldCheck size={36} />
          </div>

          <span className="px-4 py-1.5 rounded-full text-xs font-mono font-bold tracking-widest uppercase text-emerald-400 bg-emerald-500/20 border border-emerald-500/40">
            AEGIS RESPONSE COMPLETE — WITH AUTONOMOUS INTERVENTION
          </span>

          <h2 className="text-3xl font-black tracking-tight text-white mt-1">
            AEGIS AI deployed rescue assets, activated shelters, and adapted routes around submerged roads.
          </h2>
        </div>

        {/* Summary Metrics Grid */}
        <div className="grid grid-cols-6 divide-x divide-slate-800 bg-[#070B14] border border-slate-800 p-4 rounded-2xl font-mono">
          <div>
            <div className="text-2xl font-black text-amber-400">{floodAreaPct}%</div>
            <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">FLOODED AREA</div>
          </div>
          <div>
            <div className="text-2xl font-black text-red-400">{popRisk.toLocaleString()}</div>
            <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">PEOPLE AT RISK</div>
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-400">{livesSaved.toLocaleString()}</div>
            <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">PROTECTED</div>
          </div>
          <div>
            <div className="text-2xl font-black text-cyan-300">3</div>
            <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">SHELTERS</div>
          </div>
          <div>
            <div className="text-2xl font-black text-indigo-300">7</div>
            <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">RESOURCES</div>
          </div>
          <div>
            <div className="text-2xl font-black text-purple-300">4</div>
            <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">REROUTES</div>
          </div>
        </div>

        {/* Risk Reduction Progress Indicator */}
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-left space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="font-bold text-slate-200">CASUALTY RISK REDUCTION</span>
            <span className="font-black text-emerald-400 text-sm">78% REDUCTION</span>
          </div>
          <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full w-[78%]" />
          </div>
        </div>

        {/* Primary Action Button */}
        <button
          onClick={onCompare}
          className="w-full py-4 px-8 rounded-2xl font-mono text-base font-black text-black bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-500 hover:scale-105 transition-all cursor-pointer shadow-xl shadow-emerald-500/25 scale-102 flex items-center justify-center gap-3 border border-white/20"
        >
          <BarChart2 size={22} />
          [ VIEW SIDE-BY-SIDE COMPARISON → ]
        </button>
      </div>
    </div>
  )
}
