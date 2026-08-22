'use client'
import { useReconStore } from '@/stores/reconStore'
import { Eye, Activity, Maximize2, History, Layers } from 'lucide-react'

export default function AegisReconFeedCard() {
  const { latestObservation, showOverlay, toggleOverlay, isCapturing } = useReconStore()

  if (!latestObservation) {
    return (
      <div className="w-80 bg-[#111827]/95 border border-slate-800 rounded-2xl p-4 shadow-2xl backdrop-blur-xl select-none font-mono">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-white uppercase">AEGIS RECON</span>
          </div>
          <span className="px-2 py-0.5 rounded text-[9px] bg-slate-800 text-slate-400 font-bold">STANDBY</span>
        </div>
        <p className="text-[10px] text-slate-400">Awaiting visual frame capture from physical simulation engine...</p>
      </div>
    )
  }

  const { frame_number, timestamp, flood_area_percent, expansion_rate, estimated_velocity, confidence } = latestObservation

  return (
    <div className="w-80 bg-[#111827]/95 border border-slate-800 rounded-2xl p-3.5 shadow-2xl backdrop-blur-xl select-none font-mono text-white flex flex-col gap-2.5">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold text-white uppercase">AEGIS RECON</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="px-2 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold uppercase">
            LIVE
          </span>
        </div>
      </div>

      {/* Visual Frame Image Thumbnail */}
      <div className="relative h-32 rounded-xl overflow-hidden bg-black border border-slate-800 flex items-center justify-center group">
        {latestObservation.image_data_url ? (
          <img
            src={latestObservation.image_data_url}
            alt="Aerial Recon Frame"
            className="w-full h-full object-cover filter brightness-105"
          />
        ) : (
          <div className="text-center p-3">
            <Eye className="w-8 h-8 text-cyan-500/40 mx-auto mb-1 animate-pulse" />
            <span className="text-[9px] text-slate-400">LIVE CV FRAME FEED</span>
          </div>
        )}

        {/* Scan lines overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, rgba(0, 212, 255, 0.2) 0px, transparent 1px, transparent 3px)',
            backgroundSize: '100% 4px',
          }}
        />

        {/* Frame Timestamp Badge */}
        <div className="absolute top-2 right-2 bg-black/80 border border-white/10 px-2 py-0.5 rounded text-[9px] text-slate-300">
          Frame #{frame_number}
        </div>

        {/* Capturing Pulse */}
        {isCapturing && (
          <div className="absolute bottom-2 left-2 bg-cyan-500/90 text-black px-2 py-0.5 rounded text-[8px] font-bold">
            CAPTURING...
          </div>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-2 text-[10px]">
        <div className="bg-[#0b0f19] border border-slate-800 p-2 rounded-lg">
          <div className="text-slate-400 uppercase text-[9px]">Flood Area</div>
          <div className="text-sm font-bold text-cyan-300 mt-0.5 flex items-baseline justify-between">
            <span>{flood_area_percent.toFixed(1)}%</span>
            <span className="text-[9px] text-cyan-400">+{expansion_rate.toFixed(1)}%</span>
          </div>
        </div>

        <div className="bg-[#0b0f19] border border-slate-800 p-2 rounded-lg">
          <div className="text-slate-400 uppercase text-[9px]">Expansion Rate</div>
          <div className="text-sm font-bold text-amber-400 mt-0.5">
            +{expansion_rate.toFixed(1)}%/s
          </div>
        </div>

        <div className="bg-[#0b0f19] border border-slate-800 p-2 rounded-lg">
          <div className="text-slate-400 uppercase text-[9px]">Est. Velocity</div>
          <div className="text-sm font-bold text-indigo-300 mt-0.5">
            {estimated_velocity.toFixed(2)} m/s
          </div>
        </div>

        <div className="bg-[#0b0f19] border border-slate-800 p-2 rounded-lg">
          <div className="text-slate-400 uppercase text-[9px]">Confidence</div>
          <div className="text-sm font-bold text-emerald-400 mt-0.5">
            {confidence}%
          </div>
        </div>
      </div>

      {/* History Button */}
      <button
        onClick={toggleOverlay}
        className="w-full py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
      >
        <Layers size={12} />
        {showOverlay ? 'HIDE CV BOUNDING OVERLAY' : 'SHOW CV BOUNDING OVERLAY'}
      </button>
    </div>
  )
}
