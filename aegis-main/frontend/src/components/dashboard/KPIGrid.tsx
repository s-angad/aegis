'use client'
import { useDemoStore } from '@/stores/demoStore'

export default function KPIGrid() {
  const { baselineMetrics } = useDemoStore()

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <div className="p-6 rounded-3xl bg-[#0d1424] border border-slate-800/80 shadow-xl space-y-2">
        <span className="text-xs font-mono text-slate-400 font-bold uppercase">FLOODED AREA</span>
        <div className="text-4xl font-black text-amber-400 font-mono">{baselineMetrics.floodedAreaPct}%</div>
        <p className="text-xs text-slate-400 font-sans">↑ High exposure across city grid</p>
      </div>

      <div className="p-6 rounded-3xl bg-[#0d1424] border border-slate-800/80 shadow-xl space-y-2">
        <span className="text-xs font-mono text-slate-400 font-bold uppercase">PEOPLE AT RISK</span>
        <div className="text-4xl font-black text-amber-400 font-mono">{baselineMetrics.peopleAtRisk.toLocaleString()}</div>
        <p className="text-xs text-slate-400 font-sans">Trapped in low-elevation sectors</p>
      </div>

      <div className="p-6 rounded-3xl bg-[#0d1424] border border-slate-800/80 shadow-xl space-y-2">
        <span className="text-xs font-mono text-slate-400 font-bold uppercase">ROADS BLOCKED</span>
        <div className="text-4xl font-black text-red-400 font-mono">{baselineMetrics.blockedRoads}</div>
        <p className="text-xs text-slate-400 font-sans">Evacuation corridors affected</p>
      </div>

      <div className="p-6 rounded-3xl bg-[#0d1424] border border-slate-800/80 shadow-xl space-y-2">
        <span className="text-xs font-mono text-slate-400 font-bold uppercase">UNMITIGATED SAVED</span>
        <div className="text-4xl font-black text-slate-500 font-mono">0</div>
        <p className="text-xs text-slate-400 font-sans">Without AI intervention</p>
      </div>

      <div className="p-6 rounded-3xl bg-[#0d1424] border border-slate-800/80 shadow-xl space-y-2">
        <span className="text-xs font-mono text-slate-400 font-bold uppercase">CRITICAL SECTORS</span>
        <div className="text-4xl font-black text-purple-400 font-mono">6</div>
        <p className="text-xs text-slate-400 font-sans">Immediate response required</p>
      </div>
    </div>
  )
}
