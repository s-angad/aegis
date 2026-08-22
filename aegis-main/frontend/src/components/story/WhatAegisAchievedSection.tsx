'use client'
import { useSimulationStore } from '@/stores/simulationStore'
import { Award } from 'lucide-react'

export default function WhatAegisAchievedSection() {
  const { simulation, floodState } = useSimulationStore()
  const isRunning = simulation.is_running && !simulation.is_paused

  const livesSaved = floodState?.lives_saved ?? (isRunning ? 1350 : 0)

  return (
    <div className="py-12 space-y-8 select-none font-sans">
      <div>
        <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">AEGIS IMPACT</h2>
        <p className="text-slate-400 text-base mt-1.5 font-medium">
          "Measurable casualty reduction and operational success metrics."
        </p>
      </div>

      <div className="bg-[#0d1424] border border-slate-800/60 rounded-3xl p-8 shadow-2xl backdrop-blur-md space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-800/80 text-center py-4">
          <div className="px-6 py-4 md:py-0">
            <div className="text-5xl font-mono font-black text-emerald-400">{livesSaved.toLocaleString()}</div>
            <div className="text-sm font-sans font-bold text-slate-300 uppercase tracking-wider mt-3">PEOPLE PROTECTED</div>
          </div>

          <div className="px-6 py-4 md:py-0">
            <div className="text-5xl font-mono font-black text-cyan-300">24</div>
            <div className="text-sm font-sans font-bold text-slate-300 uppercase tracking-wider mt-3">ROADS MONITORED</div>
          </div>

          <div className="px-6 py-4 md:py-0">
            <div className="text-5xl font-mono font-black text-indigo-300">7</div>
            <div className="text-sm font-sans font-bold text-slate-300 uppercase tracking-wider mt-3">INCIDENTS RESPONDED TO</div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center flex items-center justify-center gap-3">
          <Award className="w-6 h-6 text-emerald-400 shrink-0" />
          <p className="text-slate-100 font-sans font-bold text-lg">
            "AEGIS continuously adapts its response as the disaster evolves."
          </p>
        </div>
      </div>
    </div>
  )
}
