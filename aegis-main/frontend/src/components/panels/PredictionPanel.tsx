'use client'
import { useAgentStore } from '@/stores/agentStore'
import { useSimulationStore } from '@/stores/simulationStore'
import { GlassCard } from '@/components/ui/GlassCard'
import { Activity, TrendingUp } from 'lucide-react'

export default function PredictionPanel() {
  const { prediction } = useAgentStore()
  const { floodState } = useSimulationStore()

  const timeLeft = Math.max(0, Number(prediction?.time_to_impact_minutes) || 0)
  const minutes = Math.floor(timeLeft)
  const secs = Math.round((timeLeft - minutes) * 60)

  // Sort sectors by risk — safe even if risk_heatmap is undefined
  const heatmap = prediction?.risk_heatmap ?? {}
  const topRiskSectors = Object.entries(heatmap)
    .sort(([, a], [, b]) => (Number(b) || 0) - (Number(a) || 0))
    .slice(0, 6)

  const peakLevel = Number(prediction?.peak_flood_level) || 0
  const popAtRisk = Number(prediction?.population_at_risk) || 0
  const confidence = Number(prediction?.confidence_pct) || 0
  const spreadDir = prediction?.spread_direction ?? '–'
  const description = prediction?.description ?? ''

  const riverLevel = Number(floodState?.river_level) || 0
  const blockedRoads = Number(floodState?.blocked_roads) || 0

  return (
    <GlassCard className="h-full flex flex-col" animate={false}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Activity size={14} className="text-pink-400" />
          <span className="text-xs font-bold text-white tracking-wider uppercase">Threat Prediction</span>
        </div>
        {prediction && (
          <span className="text-[10px] text-pink-400 font-mono">{confidence}% conf.</span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
        {!prediction ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div className="text-3xl mb-3">🎯</div>
            <p className="text-xs text-slate-500">Prediction engine idle</p>
            <p className="text-[10px] text-slate-600 mt-1">Start simulation to activate</p>
          </div>
        ) : (
          <>
            {/* Time to impact */}
            {timeLeft > 0 && (
              <div className="text-center p-3 rounded-lg bg-red-500/10 border border-red-500/20 mb-3">
                <p className="text-[10px] text-red-400 uppercase tracking-wider mb-1">New Areas at Risk In</p>
                <div className="text-3xl font-mono font-bold text-red-400 tabular-nums">
                  {String(minutes).padStart(2, '0')}:{String(secs).padStart(2, '0')}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">minutes</p>
              </div>
            )}

            {/* Spread direction */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 border border-white/10 mb-3">
              <div>
                <p className="text-[9px] text-slate-500 uppercase">Spread Direction</p>
                <p className="text-sm font-bold text-white">{spreadDir}</p>
              </div>
              <TrendingUp size={20} className="text-pink-400" />
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-center">
                <p className="text-xs font-bold text-blue-400 font-mono">{popAtRisk.toLocaleString()}</p>
                <p className="text-[9px] text-slate-500">At Risk</p>
              </div>
              <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-center">
                <p className="text-xs font-bold text-orange-400 font-mono">{peakLevel.toFixed(1)}m</p>
                <p className="text-[9px] text-slate-500">Peak Level</p>
              </div>
            </div>

            {/* Forecast Horizons */}
            <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 mb-3">
              <p className="text-[9px] text-slate-500 uppercase tracking-wider mb-2">Disaster Forecast Horizons</p>
              <div className="space-y-2">
                {[
                  { time: '15 Min', desc: 'Water rise, low-lying boundaries breach', risk: 'Elevated', color: 'text-yellow-400 bg-yellow-500/10' },
                  { time: '30 Min', desc: 'Peak flow enters central grid, bridge strain', risk: 'High Risk', color: 'text-orange-400 bg-orange-500/10' },
                  { time: '60 Min', desc: 'Waters recede north, pooling in south quadrants', risk: 'Stable', color: 'text-cyan-400 bg-cyan-500/10' }
                ].map((hz, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 border-b border-white/5 pb-1.5 last:border-0 last:pb-0">
                    <div>
                      <span className="text-[9px] font-bold text-white font-mono">{hz.time}</span>
                      <p className="text-[8px] text-slate-400">{hz.desc}</p>
                    </div>
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded font-mono ${hz.color}`}>{hz.risk}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk heatmap by sector */}
            {topRiskSectors.length > 0 && (
              <div className="mb-3">
                <p className="text-[9px] text-slate-500 uppercase tracking-wider mb-2">Sector Risk</p>
                <div className="space-y-1.5">
                  {topRiskSectors.map(([sector, risk]) => {
                    const pct = Math.min(100, (Number(risk) || 0) * 100)
                    const color = pct > 85 ? '#ef4444' : pct > 60 ? '#f97316' : pct > 35 ? '#eab308' : '#22c55e'
                    return (
                      <div key={sector} className="flex items-center gap-2">
                        <span className="text-[9px] text-slate-400 font-mono w-16 shrink-0 truncate">{sector}</span>
                        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, backgroundColor: color }}
                          />
                        </div>
                        <span className="text-[9px] font-mono" style={{ color }}>{pct.toFixed(0)}%</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {description && (
              <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
                <p className="text-[10px] text-slate-400 leading-relaxed break-words">{description}</p>
              </div>
            )}
          </>
        )}

        {/* Flood state metrics */}
        {floodState && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-center">
              <p className="text-sm font-bold text-blue-400 font-mono">{riverLevel.toFixed(1)}m</p>
              <p className="text-[9px] text-slate-500">River Level</p>
            </div>
            <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20 text-center">
              <p className="text-sm font-bold text-orange-400 font-mono">{blockedRoads}</p>
              <p className="text-[9px] text-slate-500">Roads Blocked</p>
            </div>
          </div>
        )}
      </div>
    </GlassCard>
  )
}
