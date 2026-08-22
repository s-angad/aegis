'use client'
import { useReconStore } from '@/stores/reconStore'
import { History, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react'

export default function ReconHistoryChart() {
  const { history, selectedHistoryFrame, setSelectedHistoryFrame } = useReconStore()

  if (!history || history.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-3 text-center bg-white/5 border border-white/10 rounded-xl">
        <History className="w-6 h-6 text-slate-500 mb-1" />
        <p className="text-[10px] font-mono text-slate-400">NO RECON HISTORY RECORDED</p>
      </div>
    )
  }

  // Reverse to get chronological order (oldest -> newest)
  const chrono = [...history].reverse()
  const maxArea = Math.max(10, ...chrono.map((h) => h.flood_area_percent))

  return (
    <div className="h-full flex flex-col bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-xl select-none overflow-hidden">
      {/* Title */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
          <h4 className="text-[10px] font-mono font-bold text-white tracking-wider uppercase">
            FLOOD EXPANSION TELEMETRY
          </h4>
        </div>
        <span className="text-[9px] font-mono text-slate-400">{chrono.length} SAMPLES</span>
      </div>

      {/* Sparkline Bar Graph */}
      <div className="flex-1 flex items-end gap-1 px-1 py-2 bg-black/30 border border-white/5 rounded-lg mb-2 overflow-x-auto min-h-[50px]">
        {chrono.map((obs) => {
          const heightPct = Math.max(8, (obs.flood_area_percent / maxArea) * 100)
          const isSelected = selectedHistoryFrame?.frame_number === obs.frame_number
          const color = obs.anomaly_detected ? '#ef4444' : obs.expansion_rate > 1.0 ? '#f97316' : '#06b6d4'

          return (
            <div
              key={obs.frame_number}
              onClick={() => setSelectedHistoryFrame(isSelected ? null : obs)}
              className="flex-1 min-w-[6px] max-w-[12px] group relative cursor-pointer"
              title={`Frame #${obs.frame_number}: ${obs.flood_area_percent.toFixed(1)}%`}
            >
              <div
                className={`w-full rounded-t transition-all ${isSelected ? 'ring-2 ring-white scale-105' : 'hover:opacity-100 opacity-80'}`}
                style={{
                  height: `${heightPct}%`,
                  backgroundColor: color,
                  boxShadow: isSelected ? `0 0 10px ${color}` : undefined,
                }}
              />
            </div>
          )
        })}
      </div>

      {/* History Frame Details Scrubber */}
      {selectedHistoryFrame ? (
        <div className="bg-black/50 border border-cyan-500/30 rounded p-2 text-[9px] font-mono text-slate-300 flex items-center justify-between">
          <div>
            <span className="text-cyan-400 font-bold">SCRUBBING FRAME #{selectedHistoryFrame.frame_number}</span>
            <div className="text-slate-400 text-[8px]">
              Area: {selectedHistoryFrame.flood_area_percent.toFixed(1)}% · Vel: {selectedHistoryFrame.estimated_velocity.toFixed(2)}m/s
            </div>
          </div>
          <button
            onClick={() => setSelectedHistoryFrame(null)}
            className="text-[9px] text-slate-400 hover:text-white px-1.5 py-0.5 rounded bg-white/10"
          >
            LIVE
          </button>
        </div>
      ) : (
        <div className="text-[9px] font-mono text-slate-500 text-center">
          Click any bar on graph to scrub historical frame observation
        </div>
      )}
    </div>
  )
}
