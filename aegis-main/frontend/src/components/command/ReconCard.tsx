'use client'
import { useReconStore } from '@/stores/reconStore'
import { Eye, History } from 'lucide-react'

export default function ReconCard() {
  const { latestObservation, toggleOverlay, showOverlay } = useReconStore()

  const frameNo = latestObservation?.frame_number ?? 184
  const floodArea = latestObservation?.flood_area_percent ?? 31.0
  const expansion = latestObservation?.expansion_rate ?? 1.4
  const velocity = latestObservation?.estimated_velocity ?? 0.18
  const confidence = latestObservation?.confidence ?? 94

  return (
    <div className="bg-[#111827]/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md select-none font-mono text-white flex flex-col justify-between">
      <div>
        {/* Top Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
              AEGIS RECON
            </h3>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="px-2 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold uppercase">
              LIVE
            </span>
          </div>
        </div>

        <p className="text-[10px] text-slate-400 mb-3">
          Latest aerial observation · Frame #{frameNo} · 2.3 sec ago
        </p>

        {/* 4 Clean Metric Rows */}
        <div className="grid grid-cols-2 gap-2 text-[10px] bg-[#0b0f19] border border-slate-800 p-2.5 rounded-xl">
          <div>
            <span className="text-slate-400 block uppercase">Flood Area</span>
            <span className="text-sm font-bold text-cyan-300">{floodArea.toFixed(0)}%</span>
          </div>
          <div>
            <span className="text-slate-400 block uppercase">Expansion</span>
            <span className="text-sm font-bold text-amber-400">+{expansion.toFixed(1)}%/s</span>
          </div>
          <div>
            <span className="text-slate-400 block uppercase">Est. Velocity</span>
            <span className="text-sm font-bold text-indigo-300">{velocity.toFixed(2)} m/s</span>
          </div>
          <div>
            <span className="text-slate-400 block uppercase">Confidence</span>
            <span className="text-sm font-bold text-emerald-400">{confidence}%</span>
          </div>
        </div>
      </div>

      <button
        onClick={toggleOverlay}
        className="mt-3 w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
      >
        <History size={14} />
        <span>{showOverlay ? 'HIDE RECON OVERLAY' : 'VIEW RECON HISTORY'}</span>
      </button>
    </div>
  )
}
