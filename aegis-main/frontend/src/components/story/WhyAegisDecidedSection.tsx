'use client'
import { useSimulationStore } from '@/stores/simulationStore'
import { HelpCircle, ArrowRight } from 'lucide-react'

export default function WhyAegisDecidedSection() {
  const { simulation, floodState } = useSimulationStore()
  const isRunning = simulation.is_running && !simulation.is_paused

  const popRisk = floodState?.projected_lives_at_risk ?? (isRunning ? 8420 : 0)

  return (
    <div className="py-12 space-y-8 select-none font-sans">
      <div>
        <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">WHY DID AEGIS DECIDE THIS?</h2>
        <p className="text-slate-400 text-base mt-1.5 font-medium">
          "Causal reasoning and risk factors driving pre-emptive evacuation orders."
        </p>
      </div>

      <div className="bg-[#0d1424] border border-slate-800/60 rounded-3xl p-8 shadow-2xl backdrop-blur-md space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-[#070B14] border border-slate-800/80">
            <span className="text-[11px] font-mono font-bold text-cyan-400 uppercase">FACTOR 1</span>
            <p className="text-slate-200 text-sm font-medium mt-2 leading-snug">
              Water level increased by 0.4m over the last 5 minutes.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#070B14] border border-slate-800/80">
            <span className="text-[11px] font-mono font-bold text-red-400 uppercase">FACTOR 2</span>
            <p className="text-slate-200 text-sm font-medium mt-2 leading-snug">
              Sector 04 contains approximately {popRisk.toLocaleString()} residents.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#070B14] border border-slate-800/80">
            <span className="text-[11px] font-mono font-bold text-emerald-400 uppercase">FACTOR 3</span>
            <p className="text-slate-200 text-sm font-medium mt-2 leading-snug">
              The nearest safe location with available capacity is Shelter 03.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#070B14] border border-slate-800/80">
            <span className="text-[11px] font-mono font-bold text-amber-400 uppercase">FACTOR 4</span>
            <p className="text-slate-200 text-sm font-medium mt-2 leading-snug">
              Road R14 is becoming underwater and inaccessible.
            </p>
          </div>
        </div>

        {/* Conclusion Banner */}
        <div className="p-6 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">THEREFORE:</span>
            <span className="text-lg md:text-xl font-black text-white font-mono">PRE-EMPTIVE EVACUATION RECOMMENDED</span>
          </div>
          <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-500/20 px-3.5 py-1.5 rounded-xl border border-cyan-500/30">
            CONFIDENCE 94%
          </span>
        </div>
      </div>
    </div>
  )
}
