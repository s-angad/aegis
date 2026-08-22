'use client'
import { ShieldAlert, Play } from 'lucide-react'
import { useDemoStore } from '@/stores/demoStore'

interface MissionStatusProps {
  onRunAegisResponse: () => void
}

export default function MissionStatus({ onRunAegisResponse }: MissionStatusProps) {
  const { baselineMetrics } = useDemoStore()

  return (
    <div className="p-6 md:p-8 rounded-3xl bg-amber-950/30 border border-amber-500/50 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-md">
      <div className="flex items-center gap-4">
        <ShieldAlert className="w-10 h-10 text-amber-400 shrink-0" />
        <div>
          <h3 className="text-xl font-black text-amber-300 uppercase tracking-tight">
            CRITICAL FLOOD EVENT DETECTED
          </h3>
          <p className="text-sm text-slate-300 font-medium mt-0.5">
            "Without intervention, flooding reached {baselineMetrics.floodedAreaPct}% of the monitored city."
          </p>
        </div>
      </div>

      <button
        onClick={onRunAegisResponse}
        className="py-4 px-8 rounded-2xl font-mono text-base font-black text-black bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-500 hover:scale-105 transition-all cursor-pointer shadow-xl shadow-emerald-500/25 shrink-0 flex items-center gap-3 border border-white/20"
      >
        <Play size={20} fill="currentColor" />
        [ RUN AUTONOMOUS AEGIS RESPONSE → ]
      </button>
    </div>
  )
}
