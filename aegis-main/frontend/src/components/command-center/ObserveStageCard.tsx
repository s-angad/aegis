'use client'
import { useState } from 'react'
import { Eye, Radio, Droplets, CheckCircle2, ChevronDown, ChevronUp, Cpu } from 'lucide-react'
import { useReconStore } from '@/stores/reconStore'
import { useSimulationStore } from '@/stores/simulationStore'

export default function ObserveStageCard() {
  const [showDetails, setShowDetails] = useState(false)
  const { latestObservation } = useReconStore()
  const { floodState } = useSimulationStore()

  const floodArea = latestObservation?.flood_area_percent ?? 31
  const waterLevel = floodState?.max_flood_level ?? 2.7

  return (
    <div className="bg-[#0d1424] border border-slate-800/80 rounded-3xl p-8 shadow-2xl backdrop-blur-md font-sans select-none space-y-6 text-white">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div>
          <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
            STAGE 01 — OBSERVE
          </span>
          <h2 className="text-2xl font-black text-white mt-1">WHAT AEGIS SEES</h2>
          <p className="text-sm text-slate-300">"AEGIS is collecting information from aerial recon, citizen feeds, and water sensors."</p>
        </div>
        <span className="px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold flex items-center gap-2">
          <CheckCircle2 size={16} />
          ✓ OBSERVATION COMPLETE
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Aerial Observation */}
        <div className="p-6 rounded-2xl bg-[#070B14] border border-slate-800/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 text-cyan-400 font-bold mb-3">
              <Eye size={22} />
              <h3 className="text-sm font-mono uppercase tracking-wider text-white">AERIAL OBSERVATION</h3>
            </div>
            <p className="text-slate-200 text-sm leading-relaxed">
              "Flood detected across <strong className="text-cyan-300">{floodArea.toFixed(0)}%</strong> of monitored area."
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 text-xs font-mono text-emerald-400 font-bold">
            CONFIDENCE: 94% HIGH
          </div>
        </div>

        {/* Card 2: Citizen Reports */}
        <div className="p-6 rounded-2xl bg-[#070B14] border border-slate-800/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 text-amber-400 font-bold mb-3">
              <Radio size={22} />
              <h3 className="text-sm font-mono uppercase tracking-wider text-white">CITIZEN REPORTS</h3>
            </div>
            <p className="text-slate-200 text-sm leading-relaxed">
              "12 emergency distress calls received across Sector 04 and Sector 07."
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 text-xs font-mono text-amber-400 font-bold">
            RAW RECON TELEMETRY
          </div>
        </div>

        {/* Card 3: Water Monitoring */}
        <div className="p-6 rounded-2xl bg-[#070B14] border border-slate-800/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 text-blue-400 font-bold mb-3">
              <Droplets size={22} />
              <h3 className="text-sm font-mono uppercase tracking-wider text-white">WATER MONITORING</h3>
            </div>
            <p className="text-slate-200 text-sm leading-relaxed">
              "River level: <strong className="text-white">{waterLevel.toFixed(1)} m</strong> · Rising rapidly (+0.4m / 5 min)"
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 text-xs font-mono text-cyan-300 font-bold">
            GAUGE TELEMETRY
          </div>
        </div>
      </div>

      {/* Expandable Details Section (Section OBSERVE) */}
      <div className="pt-2">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1.5 cursor-pointer"
        >
          <Cpu size={14} />
          <span>{showDetails ? 'Hide Technical Agent Details' : 'Details: View Contributing Agents'}</span>
          {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {showDetails && (
          <div className="mt-3 p-4 rounded-2xl bg-[#070B14] border border-slate-800 text-xs font-mono text-slate-300 space-y-2 animate-fadeIn">
            <div className="text-cyan-400 font-bold">CONTRIBUTING AGENTS:</div>
            <ul className="list-disc list-inside space-y-1">
              <li><strong className="text-white">Sentinel Agent</strong>: Ingesting sensor array metrics, river gauge levels, and citizen hotline data stream.</li>
              <li><strong className="text-white">Drone Recon Agent</strong>: Processing aerial OpenCV frame contours, flood coverage %, and water depth estimates.</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
