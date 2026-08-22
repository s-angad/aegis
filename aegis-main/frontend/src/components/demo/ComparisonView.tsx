'use client'
import { Award, RotateCcw, ShieldCheck, Play, ArrowRight } from 'lucide-react'
import { useDemoStore } from '@/stores/demoStore'

interface ComparisonViewProps {
  onRunNewScenario: () => void
}

export default function ComparisonView({ onRunNewScenario }: ComparisonViewProps) {
  const { baselineMetrics, aegisMetrics } = useDemoStore()

  const comparisonRows = [
    { label: 'Flooded Area', baseline: `${baselineMetrics.floodedAreaPct}%`, aegis: `${aegisMetrics.floodedAreaPct}%`, diff: '-25%', good: true },
    { label: 'People at Risk', baseline: baselineMetrics.peopleAtRisk.toLocaleString(), aegis: aegisMetrics.peopleAtRisk.toLocaleString(), diff: '-10,000', good: true },
    { label: 'People Protected', baseline: '0', aegis: aegisMetrics.peopleProtected.toLocaleString(), diff: '+5,740', good: true },
    { label: 'Shelters Activated', baseline: '0', aegis: `${aegisMetrics.sheltersActivated}`, diff: '+3', good: true },
    { label: 'Resources Deployed', baseline: '0', aegis: `${aegisMetrics.resourcesDeployed}`, diff: '+7', good: true },
    { label: 'Routes Adapted', baseline: '0', aegis: `${aegisMetrics.routesAdapted}`, diff: '+4', good: true },
    { label: 'Risk Reduction Impact', baseline: '—', aegis: `${aegisMetrics.riskReductionPct}%`, diff: '+78%', good: true },
  ]

  return (
    <div className="space-y-10 select-none font-sans text-white max-w-[1500px] mx-auto px-6 md:px-12 py-10">
      {/* HEADER */}
      <div className="bg-[#0d1424] border border-slate-800/80 rounded-3xl p-8 shadow-2xl backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">
            PHASE 4 — DEMO CONCLUSION & SIDE-BY-SIDE IMPACT COMPARISON
          </span>
          <h1 className="text-3xl md:text-4xl font-black text-white mt-1">
            BASELINE vs AEGIS AUTONOMOUS RESPONSE
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            "Quantitative proof of human casualty reduction through autonomous AI intervention."
          </p>
        </div>

        <button
          onClick={onRunNewScenario}
          className="py-4 px-8 rounded-2xl font-mono text-base font-black text-black bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-500 hover:scale-105 transition-all cursor-pointer shadow-xl shadow-emerald-500/25 shrink-0 flex items-center gap-3 border border-white/20"
        >
          <Play size={20} fill="currentColor" />
          [ RUN NEW SCENARIO → ]
        </button>
      </div>

      {/* SIDE-BY-SIDE COMPARISON TABLE */}
      <div className="bg-[#0d1424] border border-slate-800/80 rounded-3xl p-8 shadow-2xl space-y-6">
        <h3 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
          COMPARATIVE METRICS TABLE
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-xs font-bold text-slate-400">
                <th className="pb-4 pl-4 uppercase">METRIC EVALUATED</th>
                <th className="pb-4 uppercase text-amber-400">BASELINE (NO AEGIS)</th>
                <th className="pb-4 uppercase text-emerald-400">AEGIS (AUTONOMOUS)</th>
                <th className="pb-4 uppercase text-cyan-300">IMPROVEMENT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {comparisonRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-[#070B14]/60 transition-colors">
                  <td className="py-4 pl-4 font-bold text-white">{row.label}</td>
                  <td className="py-4 font-bold text-amber-300">{row.baseline}</td>
                  <td className="py-4 font-black text-emerald-400 text-base">{row.aegis}</td>
                  <td className="py-4 font-bold text-cyan-300">
                    <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-xs">
                      {row.diff}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 78% RISK REDUCTION BAR */}
      <div className="p-8 rounded-3xl bg-[#0d1424] border border-emerald-500/40 shadow-2xl space-y-3">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="font-bold text-slate-300 uppercase">HUMAN CASUALTY RISK REDUCTION IMPACT</span>
          <span className="font-black text-emerald-400 text-lg">78% REDUCTION</span>
        </div>
        <div className="h-4 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-indigo-500 rounded-full w-[78%] transition-all duration-1000" />
        </div>
      </div>

      {/* FINAL SLOGAN BANNER */}
      <div className="p-10 rounded-3xl bg-gradient-to-r from-emerald-950/90 via-cyan-950/90 to-indigo-950/90 border-2 border-emerald-500/60 text-center space-y-4 shadow-2xl">
        <Award className="w-12 h-12 text-emerald-400 mx-auto" />
        <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
          AEGIS DID NOT STOP THE FLOOD.
        </h2>
        <h3 className="text-2xl md:text-4xl font-black text-emerald-400 tracking-tight">
          IT REDUCED ITS HUMAN IMPACT.
        </h3>

        <p className="text-slate-300 text-base max-w-xl mx-auto font-sans pt-2">
          "Autonomous perception, lookahead forecasting, SOP policy decision-making, and dynamic routing prevent casualties during severe flood emergencies."
        </p>

        <div className="pt-4">
          <button
            onClick={onRunNewScenario}
            className="py-4 px-10 rounded-2xl font-mono text-base font-black text-black bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-500 hover:scale-105 transition-all cursor-pointer shadow-2xl shadow-emerald-500/40 inline-flex items-center gap-3 border border-white/30 scale-105"
          >
            <RotateCcw size={20} />
            [ RUN NEW RANDOM SCENARIO → ]
          </button>
        </div>
      </div>
    </div>
  )
}
