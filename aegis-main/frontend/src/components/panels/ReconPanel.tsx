'use client'
import { useReconStore } from '@/stores/reconStore'
import { Eye, ShieldAlert, Activity, Gauge, Cpu, CheckCircle2, AlertTriangle, UserCheck } from 'lucide-react'

export default function ReconPanel() {
  const { latestObservation, isCapturing, config, humanOverrideActive, toggleHumanOverride } = useReconStore()

  if (!latestObservation) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4 text-center bg-white/5 border border-white/10 rounded-xl backdrop-blur-xl">
        <Activity className="w-8 h-8 text-cyan-400/50 animate-pulse mb-2" />
        <p className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">AERIAL RECON INACTIVE</p>
        <p className="text-[10px] text-slate-500 mt-1 max-w-[200px]">
          Boot emergency simulation to activate Canvas frame capture & CV computer vision perception.
        </p>
      </div>
    )
  }

  const {
    frame_number,
    flood_area_percent,
    estimated_water_level,
    estimated_velocity,
    expansion_rate,
    confidence,
    anomaly_detected,
    anomaly_description,
    affected_cells,
    blocked_roads,
    ground_truth_delta,
  } = latestObservation

  return (
    <div className="h-full flex flex-col bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-xl overflow-hidden select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Eye className="w-4 h-4 text-cyan-400" />
            {isCapturing && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            )}
          </div>
          <div>
            <h3 className="text-xs font-mono font-bold text-white tracking-wider uppercase flex items-center gap-1.5">
              CV RECON PERCEPTION
            </h3>
            <span className="text-[9px] font-mono text-slate-400">
              FRAME #{frame_number} · INTERVAL {config.recon_interval_seconds}s
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleHumanOverride}
            className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold transition-all flex items-center gap-1 border ${
              humanOverrideActive
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
            }`}
            title="Toggle Human-in-the-Loop Override Mode"
          >
            <UserCheck size={10} />
            {humanOverrideActive ? 'OVERRIDE ON' : 'HUMAN HITL'}
          </button>
          <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-500/20 border border-cyan-500/40 text-cyan-300">
            {confidence}% CONF
          </span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-2 mb-2.5">
        {/* Flood Area */}
        <div className="bg-black/30 border border-white/5 rounded-lg p-2">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[9px] font-mono tracking-wider uppercase">Flooded Area</span>
            <Activity className="w-3 h-3 text-cyan-400" />
          </div>
          <div className="text-lg font-mono font-black text-cyan-300 flex items-baseline gap-1">
            {flood_area_percent.toFixed(1)}%
            <span className={`text-[10px] ${expansion_rate >= 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              ({expansion_rate >= 0 ? '+' : ''}{expansion_rate.toFixed(1)}%/s)
            </span>
          </div>
        </div>

        {/* Velocity */}
        <div className="bg-black/30 border border-white/5 rounded-lg p-2">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[9px] font-mono tracking-wider uppercase">Est. Velocity</span>
            <Gauge className="w-3 h-3 text-indigo-400" />
          </div>
          <div className="text-lg font-mono font-black text-indigo-300">
            {estimated_velocity.toFixed(2)} <span className="text-[10px] text-slate-400 font-normal">m/s</span>
          </div>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-3 gap-1.5 text-center mb-2.5">
        <div className="bg-white/5 border border-white/5 rounded p-1.5">
          <p className="text-[8px] font-mono text-slate-400 uppercase">Est. Depth</p>
          <p className="text-xs font-mono font-bold text-slate-200 mt-0.5">{estimated_water_level.toFixed(2)}m</p>
        </div>
        <div className="bg-white/5 border border-white/5 rounded p-1.5">
          <p className="text-[8px] font-mono text-slate-400 uppercase">Flooded Cells</p>
          <p className="text-xs font-mono font-bold text-slate-200 mt-0.5">{affected_cells.length} / 256</p>
        </div>
        <div className="bg-white/5 border border-white/5 rounded p-1.5">
          <p className="text-[8px] font-mono text-slate-400 uppercase">Blocked Roads</p>
          <p className="text-xs font-mono font-bold text-amber-300 mt-0.5">{blocked_roads.length}</p>
        </div>
      </div>

      {/* Anomaly & Ground Truth Delta Warning */}
      {anomaly_detected && (
        <div className="mb-2 p-2 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 animate-bounce" />
          <p className="text-[10px] font-mono text-red-300 leading-tight">
            {anomaly_description || 'SURGE ANOMALY: High flood expansion rate detected'}
          </p>
        </div>
      )}

      {ground_truth_delta && (
        <div className="p-1.5 rounded bg-black/40 border border-white/5 text-[9px] font-mono text-slate-400 flex items-center justify-between">
          <span>GROUND TRUTH VS OBS ERROR:</span>
          <span className="text-cyan-400 font-bold">
            ΔDepth: {ground_truth_delta.depth_error_m}m · ΔCells: {ground_truth_delta.cell_count_error}
          </span>
        </div>
      )}
    </div>
  )
}
