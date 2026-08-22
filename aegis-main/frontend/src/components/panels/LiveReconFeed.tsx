'use client'
import { useReconStore } from '@/stores/reconStore'
import { Camera, Crosshair, Zap, Eye, Layers } from 'lucide-react'

export default function LiveReconFeed() {
  const { latestObservation, showOverlay, toggleOverlay, isCapturing } = useReconStore()

  if (!latestObservation || !latestObservation.image_data_url) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4 text-center bg-black/40 border border-white/10 rounded-xl">
        <Camera className="w-8 h-8 text-cyan-500/40 mb-2" />
        <p className="text-xs font-mono text-slate-400">AWAITING AERIAL RECON FEED</p>
        <p className="text-[10px] text-slate-600 mt-1 font-mono">Frame capture loop waiting for simulation canvas</p>
      </div>
    )
  }

  const { frame_number, timestamp, flood_area_percent, confidence, affected_cells } = latestObservation

  return (
    <div className="h-full flex flex-col bg-black/60 border border-white/10 rounded-xl overflow-hidden relative group select-none">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-black/80 border-b border-white/10 z-10">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-mono font-bold text-cyan-400 tracking-wider uppercase">
            LIVE RECON FEED
          </span>
          <span className="text-[9px] font-mono text-slate-500">FRAME #{frame_number}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleOverlay}
            className={`p-1 rounded text-[9px] font-mono transition-colors ${
              showOverlay ? 'text-cyan-400 bg-cyan-500/20' : 'text-slate-500 hover:text-slate-300'
            }`}
            title="Toggle Computer Vision Bounding Box Overlay"
          >
            <Layers size={12} />
          </button>
          <span className="text-[9px] font-mono text-slate-400">{new Date(timestamp).toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Frame Container */}
      <div className="flex-1 relative overflow-hidden bg-black flex items-center justify-center">
        {/* Real Aerial Base64 Image */}
        <img
          src={latestObservation.image_data_url}
          alt={`Recon Frame #${frame_number}`}
          className="w-full h-full object-contain filter brightness-105 contrast-110"
        />

        {/* Scan lines effect */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, rgba(0, 212, 255, 0.15) 0px, transparent 1px, transparent 3px)',
            backgroundSize: '100% 4px',
          }}
        />

        {/* Tactical Crosshair Overlay */}
        {showOverlay && (
          <>
            {/* Center Reticle */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
              <Crosshair className="w-16 h-16 text-cyan-400 stroke-[1]" />
            </div>

            {/* Tactical Grid Corners */}
            <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-cyan-400/80 pointer-events-none" />
            <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-cyan-400/80 pointer-events-none" />
            <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-cyan-400/80 pointer-events-none" />
            <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-cyan-400/80 pointer-events-none" />

            {/* CV Sector Bounding Highlights */}
            {affected_cells.slice(0, 4).map((cell, idx) => (
              <div
                key={idx}
                className="absolute border border-cyan-400/60 bg-cyan-400/10 pointer-events-none rounded text-[8px] font-mono text-cyan-300 p-0.5"
                style={{
                  top: `${(cell.row / 16) * 100}%`,
                  left: `${(cell.col / 16) * 100}%`,
                  width: '25%',
                  height: '25%',
                }}
              >
                <span className="bg-black/80 px-1 py-0.5 rounded border border-cyan-400/40">
                  {cell.sector}
                </span>
              </div>
            ))}
          </>
        )}

        {/* Capturing Indicator */}
        {isCapturing && (
          <div className="absolute top-2 left-2 bg-cyan-500/90 text-black px-2 py-0.5 rounded text-[9px] font-mono font-bold flex items-center gap-1 shadow-lg">
            <Zap size={10} className="animate-spin" />
            PROCESSING CV FRAME...
          </div>
        )}

        {/* Telemetry Overlay Footer */}
        <div className="absolute bottom-2 left-2 right-2 bg-black/85 border border-white/10 backdrop-blur-md px-2.5 py-1 rounded flex items-center justify-between text-[9px] font-mono text-slate-300 pointer-events-none">
          <span className="text-cyan-400 font-bold">COVERAGE: {flood_area_percent.toFixed(1)}%</span>
          <span className="text-slate-400">SECTORS VISUAL: {new Set(affected_cells.map(c => c.sector)).size}</span>
          <span className="text-emerald-400">CONF: {confidence}%</span>
        </div>
      </div>
    </div>
  )
}
