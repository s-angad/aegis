'use client'
import { useReconStore } from '@/stores/reconStore'
import { useSimulationStore } from '@/stores/simulationStore'
import { Eye, Radio, Droplets } from 'lucide-react'

export default function WhatAegisSeesSection() {
  const { latestObservation } = useReconStore()
  const { simulation, floodState } = useSimulationStore()
  const isRunning = simulation.is_running && !simulation.is_paused

  const floodArea = latestObservation?.flood_area_percent ?? (isRunning ? 31 : 0)
  const confidence = latestObservation?.confidence ?? 94
  const waterLevel = floodState?.max_flood_level ?? (isRunning ? 2.4 : 0.8)

  return (
    <div className="py-12 space-y-8 select-none font-sans">
      <div>
        <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">WHAT AEGIS SEES</h2>
        <p className="text-slate-400 text-base mt-1.5 font-medium">
          "AEGIS combines multiple independent signals before making a decision."
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* CARD 1: AERIAL RECON */}
        <div className="bg-[#0d1424] border border-slate-800/60 p-7 rounded-2xl backdrop-blur-md shadow-xl flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center gap-3 text-cyan-400 font-bold mb-4">
              <div className="p-3 rounded-xl bg-cyan-500/10">
                <Eye className="w-6 h-6" />
              </div>
              <h3 className="text-base font-mono uppercase tracking-wider font-bold text-white">AERIAL RECON</h3>
            </div>
            <p className="text-slate-200 text-base leading-relaxed">
              "{isRunning ? `Flood detected across ${floodArea.toFixed(0)}% of the monitored area.` : 'Awaiting drone aerial scan launch...'}"
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 font-bold">CONFIDENCE</span>
            <span className="text-emerald-400 font-black text-sm">{confidence}% HIGH</span>
          </div>
        </div>

        {/* CARD 2: CITIZEN REPORTS */}
        <div className="bg-[#0d1424] border border-slate-800/60 p-7 rounded-2xl backdrop-blur-md shadow-xl flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center gap-3 text-amber-400 font-bold mb-4">
              <div className="p-3 rounded-xl bg-amber-500/10">
                <Radio className="w-6 h-6" />
              </div>
              <h3 className="text-base font-mono uppercase tracking-wider font-bold text-white">CITIZEN REPORTS</h3>
            </div>
            <p className="text-slate-200 text-base leading-relaxed">
              "{isRunning ? '12 reports received. 8 confirmed.' : 'Monitoring municipal citizen emergency lines.'}"
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 font-bold">VERIFIED INCIDENTS</span>
            <span className="text-amber-400 font-black text-sm">8 CONFIRMED</span>
          </div>
        </div>

        {/* CARD 3: WATER MONITORING */}
        <div className="bg-[#0d1424] border border-slate-800/60 p-7 rounded-2xl backdrop-blur-md shadow-xl flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center gap-3 text-blue-400 font-bold mb-4">
              <div className="p-3 rounded-xl bg-blue-500/10">
                <Droplets className="w-6 h-6" />
              </div>
              <h3 className="text-base font-mono uppercase tracking-wider font-bold text-white">WATER MONITORING</h3>
            </div>
            <p className="text-slate-200 text-base leading-relaxed">
              "Water level: <strong className="text-white">{waterLevel.toFixed(1)}m</strong> {isRunning ? '· ↑ +0.4m / 5 min' : '· Normal baseline'}"
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 font-bold">RIVER RATE</span>
            <span className="text-cyan-300 font-black text-sm">RISING FAST</span>
          </div>
        </div>
      </div>
    </div>
  )
}
