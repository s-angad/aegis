'use client'
import { useRouter } from 'next/navigation'
import { useSimulationStore } from '@/stores/simulationStore'
import { ShieldCheck, Award, RotateCcw, Play, Shuffle } from 'lucide-react'

export default function FinalImpactSummary() {
  const router = useRouter()
  const { floodState } = useSimulationStore()
  const livesSaved = floodState?.lives_saved ?? 1350

  return (
    <div className="bg-[#0d1424] border border-slate-800/80 rounded-3xl p-8 shadow-2xl backdrop-blur-md font-sans select-none space-y-8 text-white">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div>
          <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">
            PHASE 2 — AI DECISION-MAKING & DISPATCH PLAN
          </span>
          <h2 className="text-3xl font-black text-white mt-1">AEGIS RESPONSE PLAN CREATED</h2>
          <p className="text-sm text-slate-300">"Multi-agent AI pipeline has formulated the disaster mitigation and rerouting strategy."</p>
        </div>
        <span className="px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold flex items-center gap-2">
          <ShieldCheck size={16} />
          ✓ PLAN READY
        </span>
      </div>

      {/* Large Impact Numbers */}
      <div className="grid grid-cols-2 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-slate-800 text-center py-2">
        <div className="px-4 py-3 md:py-0">
          <div className="text-4xl font-mono font-black text-emerald-400">{livesSaved.toLocaleString()}</div>
          <div className="text-xs font-sans font-bold text-slate-300 uppercase tracking-wider mt-2">PEOPLE PROTECTED</div>
        </div>

        <div className="px-4 py-3 md:py-0">
          <div className="text-4xl font-mono font-black text-cyan-300">3</div>
          <div className="text-xs font-sans font-bold text-slate-300 uppercase tracking-wider mt-2">SHELTERS ACTIVATED</div>
        </div>

        <div className="px-4 py-3 md:py-0">
          <div className="text-4xl font-mono font-black text-amber-400">4</div>
          <div className="text-xs font-sans font-bold text-slate-300 uppercase tracking-wider mt-2">RESOURCES DEPLOYED</div>
        </div>

        <div className="px-4 py-3 md:py-0">
          <div className="text-4xl font-mono font-black text-indigo-300">12</div>
          <div className="text-xs font-sans font-bold text-slate-300 uppercase tracking-wider mt-2">INCIDENTS VERIFIED</div>
        </div>

        <div className="px-4 py-3 md:py-0">
          <div className="text-4xl font-mono font-black text-purple-300">6</div>
          <div className="text-xs font-sans font-bold text-slate-300 uppercase tracking-wider mt-2">ROUTES ADAPTED</div>
        </div>
      </div>

      {/* Risk Reduction Progress Bar */}
      <div className="p-5 rounded-2xl bg-[#070B14] border border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="font-bold text-slate-300 uppercase">CASUALTY RISK REDUCTION IMPACT</span>
          <span className="font-black text-emerald-400">42% REDUCED</span>
        </div>
        <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-cyan-500 via-emerald-400 to-indigo-500 rounded-full w-[42%]" />
        </div>
      </div>

      {/* Primary Action Buttons for Phase 3 Execution */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-cyan-950/60 border border-emerald-500/40 text-center flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-left">
          <Award className="w-6 h-6 text-emerald-400 shrink-0" />
          <p className="text-slate-100 font-sans font-medium text-base">
            "Now run the simulation WITH AEGIS AI active to observe real-time resource routing and shelter control."
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => router.push('/simulation?mode=aegis')}
            className="py-4 px-6 rounded-2xl font-mono text-sm font-black text-black bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 flex items-center gap-2 transition-all cursor-pointer shadow-xl shadow-emerald-500/25 scale-102"
          >
            <Play size={18} fill="currentColor" />
            [ PHASE 3: RUN AUTONOMOUS AEGIS RESPONSE → ]
          </button>

          <button
            onClick={() => router.push('/simulation?mode=unmitigated')}
            className="py-4 px-4 rounded-2xl font-mono text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
            title="Restart demo from Phase 1 (Unmitigated flood)"
          >
            <RotateCcw size={14} />
            RESET DEMO ↺
          </button>
        </div>
      </div>
    </div>
  )
}
