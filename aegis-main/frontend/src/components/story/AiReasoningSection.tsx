'use client'
import { useSimulationStore } from '@/stores/simulationStore'
import { Eye, CheckSquare, Brain, Zap, Truck } from 'lucide-react'

export default function AiReasoningSection() {
  const { simulation } = useSimulationStore()
  const isRunning = simulation.is_running && !simulation.is_paused

  const stages = [
    { label: 'OBSERVE', agent: 'Sentinel + Recon', icon: Eye, text: 'Collect new flood observations.', active: isRunning, color: '#06b6d4' },
    { label: 'VERIFY', agent: 'Verifier', icon: CheckSquare, text: 'Confirm what is actually happening.', active: isRunning, color: '#3b82f6' },
    { label: 'PREDICT', agent: 'Prediction Agent', icon: Brain, text: 'Estimate where the flood is going.', active: isRunning, color: '#8b5cf6' },
    { label: 'DECIDE', agent: 'Policy Commander', icon: Zap, text: 'Select the safest response.', active: isRunning, color: '#f59e0b' },
    { label: 'ACT', agent: 'Allocation + Routing', icon: Truck, text: 'Deploy resources and adapt routes.', active: isRunning, color: '#10b981' },
  ]

  return (
    <div className="py-12 space-y-8 select-none font-sans">
      <div>
        <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">HOW AEGIS THINKS</h2>
        <p className="text-slate-400 text-base mt-1.5 font-medium">
          "Five autonomous stages turn raw information into action."
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {stages.map((stg, idx) => {
          const Icon = stg.icon
          return (
            <div
              key={stg.label}
              className={`p-6 rounded-2xl border transition-all flex flex-col justify-between h-full ${
                stg.active
                  ? 'bg-[#0d1424] border-cyan-500/40 shadow-xl shadow-cyan-500/10'
                  : 'bg-[#070B14] border-slate-800/80'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${stg.color}20`, color: stg.color }}>
                    <Icon size={20} />
                  </div>
                  <span className="text-[11px] font-mono text-slate-500 font-bold">STAGE 0{idx + 1}</span>
                </div>

                <h3 className="text-base font-mono font-bold text-white uppercase tracking-wider mb-1">
                  {stg.label}
                </h3>
                <div className="text-[11px] font-mono font-bold text-cyan-400 mb-3">
                  {stg.agent}
                </div>

                <p className="text-slate-300 text-xs leading-relaxed font-sans font-medium">
                  "{stg.text}"
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
