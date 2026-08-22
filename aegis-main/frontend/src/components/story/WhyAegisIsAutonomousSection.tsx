'use client'
import { Eye, Brain, Zap, RefreshCw } from 'lucide-react'

export default function WhyAegisIsAutonomousSection() {
  const steps = [
    { num: '01', title: 'OBSERVE', desc: 'Continuously receives new information.', icon: Eye, color: '#06b6d4' },
    { num: '02', title: 'UNDERSTAND', desc: 'Verifies and evaluates the situation.', icon: Brain, color: '#8b5cf6' },
    { num: '03', title: 'DECIDE', desc: 'Selects resources and actions.', icon: Zap, color: '#f59e0b' },
    { num: '04', title: 'ADAPT', desc: 'Recalculates when conditions change.', icon: RefreshCw, color: '#10b981' },
  ]

  return (
    <div className="py-12 space-y-8 select-none font-sans">
      <div>
        <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">WHY AEGIS IS AUTONOMOUS</h2>
        <p className="text-slate-400 text-base mt-1.5 font-medium">
          "Core closed-loop architecture for autonomous disaster intelligence."
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {steps.map((stg) => {
          const Icon = stg.icon
          return (
            <div key={stg.num} className="bg-[#0d1424] border border-slate-800/60 p-7 rounded-2xl backdrop-blur-md shadow-xl flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${stg.color}20`, color: stg.color }}>
                    <Icon size={24} />
                  </div>
                  <span className="text-sm font-mono font-black text-slate-500">{stg.num}</span>
                </div>
                <h3 className="text-lg font-mono font-bold text-white uppercase tracking-wider mb-2">{stg.title}</h3>
                <p className="text-slate-300 text-sm leading-relaxed font-medium">{stg.desc}</p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="p-5 rounded-2xl bg-[#070B14] border border-slate-800/80 text-center text-sm font-medium text-slate-300">
        "Human operators remain in control while AEGIS continuously performs the response loop."
      </div>
    </div>
  )
}
