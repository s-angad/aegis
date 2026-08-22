'use client'
import { useAgentStore } from '@/stores/agentStore'
import { TrendingUp, Clock } from 'lucide-react'

export default function PredictionTimeline() {
  const { prediction } = useAgentStore()

  // Build 4 horizon steps (Now, +15m, +30m, +60m)
  const baseArea = prediction?.risk_heatmap ? Math.round(Object.values(prediction.risk_heatmap).reduce((a, b) => a + b, 0) * 8) : 31
  const basePop = prediction?.population_at_risk || 19676

  const steps = [
    { label: 'Now', time: '20:52', area: Math.min(95, baseArea), pop: basePop },
    { label: '+15 min', time: '21:07', area: Math.min(95, Math.round(baseArea * 1.35)), pop: Math.round(basePop * 1.26) },
    { label: '+30 min', time: '21:22', area: Math.min(95, Math.round(baseArea * 1.85)), pop: Math.round(basePop * 1.63) },
    { label: '+60 min', time: '21:52', area: Math.min(95, Math.round(baseArea * 2.45)), pop: Math.round(basePop * 2.10) },
  ]

  return (
    <div className="bg-[#111827]/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col h-full overflow-hidden select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-purple-400" />
          <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
            PREDICTION TIMELINE
          </h3>
        </div>
        <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/30">
          60 Min Horizon
        </span>
      </div>

      {/* 4 Horizon Steps */}
      <div className="grid grid-cols-4 gap-2 mb-2 text-mono">
        {steps.map((step, idx) => (
          <div key={idx} className="bg-[#0b0f19] border border-slate-800 rounded-xl p-2 text-center">
            <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 font-bold">
              <span>{step.label}</span>
              <span className="text-[9px] font-normal text-slate-500">{step.time}</span>
            </div>

            <div className="mt-1.5">
              <span className="text-[9px] text-slate-500 block uppercase">Flood Area</span>
              <span className="text-sm font-bold text-white">{step.area}%</span>
            </div>

            <div className="mt-1">
              <span className="text-[9px] text-slate-500 block uppercase">At Risk</span>
              <span className="text-xs font-bold text-red-400">{step.pop.toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Smooth Trend Curve SVG */}
      <div className="flex-1 bg-[#0b0f19] border border-slate-800/80 rounded-xl p-2 relative flex items-end overflow-hidden">
        <svg className="w-full h-12 overflow-visible" viewBox="0 0 300 40">
          <defs>
            <linearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Area fill */}
          <path
            d="M 0 35 Q 75 25, 150 15 T 300 5 L 300 40 L 0 40 Z"
            fill="url(#redGrad)"
          />
          {/* Red Curve Line */}
          <path
            d="M 0 35 Q 75 25, 150 15 T 300 5"
            fill="none"
            stroke="#ef4444"
            strokeWidth="2.5"
          />
        </svg>
      </div>
    </div>
  )
}
