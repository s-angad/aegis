'use client'
import { Eye, CheckSquare, Brain, Zap, Truck, Check } from 'lucide-react'

interface AgentPipelineFlowProps {
  activeStage: number
  onSelectStage: (stage: number) => void
}

export default function AgentPipelineFlow({ activeStage, onSelectStage }: AgentPipelineFlowProps) {
  const stages = [
    { id: 1, name: 'OBSERVE', desc: 'AEGIS is collecting information.', icon: Eye, color: '#06b6d4' },
    { id: 2, name: 'VERIFY', desc: 'AEGIS is checking report reliability.', icon: CheckSquare, color: '#3b82f6' },
    { id: 3, name: 'PREDICT', desc: 'AEGIS is forecasting flood spread.', icon: Brain, color: '#8b5cf6' },
    { id: 4, name: 'DECIDE', desc: 'AEGIS is selecting safe response.', icon: Zap, color: '#f59e0b' },
    { id: 5, name: 'ACT', desc: 'AEGIS is deploying & adapting routes.', icon: Truck, color: '#10b981' },
  ]

  return (
    <div className="bg-[#0d1424] border border-slate-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur-md font-sans select-none space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
            AUTONOMOUS OODA RESPONSE PIPELINE
          </h3>
          <p className="text-sm font-medium text-slate-300">
            Click any stage to view details or follow the story sequence.
          </p>
        </div>
        <span className="px-3.5 py-1.5 rounded-full text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-1.5">
          <Check size={14} />
          STAGE {activeStage} OF 5 ACTIVE
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
        {stages.map((stg) => {
          const Icon = stg.icon
          const isCurrent = activeStage === stg.id
          const isPassed = activeStage > stg.id

          return (
            <button
              key={stg.id}
              onClick={() => onSelectStage(stg.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer text-left flex flex-col justify-between h-32 ${
                isCurrent
                  ? 'bg-cyan-950/80 border-cyan-500 shadow-lg shadow-cyan-500/20 scale-102'
                  : isPassed
                  ? 'bg-[#070B14] border-emerald-500/40 text-slate-200'
                  : 'bg-[#070B14] border-slate-800/80 opacity-60 hover:opacity-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${stg.color}20`, color: stg.color }}
                >
                  <Icon size={18} />
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-500">0{stg.id}</span>
              </div>

              <div>
                <h4 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
                  {stg.name}
                </h4>
                <p className="text-[11px] text-slate-400 font-sans mt-0.5 line-clamp-1">
                  {stg.desc}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
