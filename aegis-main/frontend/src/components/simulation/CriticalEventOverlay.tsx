'use client'
import { AlertTriangle, ArrowRight, Brain, ShieldCheck } from 'lucide-react'
import { useSimulationStore } from '@/stores/simulationStore'
import { useReconStore } from '@/stores/reconStore'

interface CriticalEventOverlayProps {
  isAegisMode?: boolean
  onAnalyze: () => void
}

export default function CriticalEventOverlay({ isAegisMode = false, onAnalyze }: CriticalEventOverlayProps) {
  const { simulation, floodState } = useSimulationStore()
  const { latestObservation } = useReconStore()

  const waterLevel = floodState?.max_flood_level ?? 2.7
  const floodAreaPct = latestObservation?.flood_area_percent ?? 31
  const popRisk = floodState?.projected_lives_at_risk ?? 8420
  const livesSaved = isAegisMode ? (floodState?.lives_saved ?? 1350) : 0

  return (
    <div className="fixed inset-0 z-50 bg-[#070B14]/85 backdrop-blur-md flex items-center justify-center p-6 animate-fadeIn select-none font-sans">
      <div className={`bg-[#0d1424] border-2 ${isAegisMode ? 'border-emerald-500/50' : 'border-red-500/50'} rounded-3xl p-8 max-w-2xl w-full shadow-2xl space-y-6 text-white text-center relative overflow-hidden`}>
        {/* Glowing Background Accent */}
        <div className={`absolute -top-24 -left-24 w-64 h-64 ${isAegisMode ? 'bg-emerald-500/10' : 'bg-red-500/10'} rounded-full blur-3xl pointer-events-none`} />

        {/* Icon & Title */}
        <div className="flex flex-col items-center gap-3">
          <div className={`w-16 h-16 rounded-3xl ${isAegisMode ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-emerald-500/20' : 'bg-red-500/20 text-red-400 border-red-500/40 shadow-red-500/20'} border flex items-center justify-center shadow-xl`}>
            {isAegisMode ? <ShieldCheck size={36} /> : <AlertTriangle size={36} />}
          </div>

          <span className={`px-4 py-1.5 rounded-full text-xs font-mono font-bold tracking-widest uppercase ${
            isAegisMode ? 'text-emerald-400 bg-emerald-500/20 border border-emerald-500/40' : 'text-red-400 bg-red-500/20 border border-red-500/40'
          }`}>
            {isAegisMode ? 'AEGIS AUTONOMOUS RESPONSE SUCCESSFUL' : 'UNMITIGATED FLOOD DISASTER'}
          </span>

          <h2 className="text-3xl font-black tracking-tight text-white mt-1">
            {isAegisMode
              ? 'AEGIS AI deployed rescue assets and rerouted around blocked roads.'
              : 'Unmitigated flood inundated city sectors without AI intervention.'}
          </h2>
        </div>

        {/* Metrics Box */}
        <div className="grid grid-cols-4 divide-x divide-slate-800 bg-[#070B14] border border-slate-800 p-5 rounded-2xl">
          <div>
            <div className="text-2xl font-mono font-black text-cyan-300">{waterLevel.toFixed(1)} m</div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">WATER LEVEL</div>
          </div>
          <div>
            <div className="text-2xl font-mono font-black text-amber-400">{floodAreaPct.toFixed(0)}%</div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">FLOODED AREA</div>
          </div>
          <div>
            <div className="text-2xl font-mono font-black text-red-400">{popRisk.toLocaleString()}</div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">PEOPLE AT RISK</div>
          </div>
          <div>
            <div className={`text-2xl font-mono font-black ${isAegisMode ? 'text-emerald-400' : 'text-slate-500'}`}>
              {livesSaved.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">PEOPLE SAVED</div>
          </div>
        </div>

        {/* Informational Message */}
        <div className="space-y-1">
          <p className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
            {isAegisMode ? 'AEGIS DISASTER MITIGATION COMPLETE' : 'READY FOR AEGIS AI OODA ANALYSIS'}
          </p>
          <p className="text-sm text-slate-300 font-medium font-sans">
            {isAegisMode
              ? 'AEGIS continuously adapts its response as disaster conditions evolve.'
              : 'Pass sensory observation telemetry to AEGIS multi-agent pipeline.'}
          </p>
        </div>

        {/* Primary Action Button */}
        <button
          onClick={onAnalyze}
          className="w-full py-4 px-8 rounded-2xl font-mono text-base font-black text-black bg-gradient-to-r from-cyan-400 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 flex items-center justify-center gap-3 transition-all cursor-pointer shadow-xl shadow-cyan-500/25 scale-102"
        >
          <Brain size={22} />
          {isAegisMode ? '[ VIEW FINAL IMPACT DASHBOARD → ]' : '[ ANALYZE WITH AEGIS AI → ]'}
        </button>
      </div>
    </div>
  )
}
