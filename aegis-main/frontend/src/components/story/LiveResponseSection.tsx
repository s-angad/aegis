'use client'
import { useSimulationStore } from '@/stores/simulationStore'
import { AlertCircle, CheckCircle2, Brain, Zap, Navigation, Clock } from 'lucide-react'

export default function LiveResponseSection() {
  const { simulation, floodState } = useSimulationStore()
  const isRunning = simulation.is_running && !simulation.is_paused

  const timelineEvents = [
    { type: 'DETECTED', icon: AlertCircle, color: '#ef4444', time: '12:31', title: 'Rapid flood expansion detected near Sector 04.' },
    { type: 'VERIFIED', icon: CheckCircle2, color: '#06b6d4', time: '12:32', title: '12 citizen reports and aerial observations confirm flooding.' },
    { type: 'PREDICTED', icon: Brain, color: '#8b5cf6', time: '12:32', title: 'Sector 07 predicted to become critical in approximately 18 minutes.' },
    { type: 'DECIDED', icon: Zap, color: '#f59e0b', time: '12:33', title: 'Pre-emptive evacuation recommended.' },
    { type: 'ACTION TAKEN', icon: CheckCircle2, color: '#10b981', time: '12:33', title: 'Rescue Boat 02 dispatched to Sector 04.' },
    { type: 'ADAPTED', icon: Navigation, color: '#6366f1', time: '12:34', title: 'Road R14 became unsafe. AEGIS automatically calculated a new safe route via R18.' },
  ]

  return (
    <div className="py-12 space-y-8 select-none font-sans">
      <div>
        <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">AEGIS AI RESPONSE</h2>
        <p className="text-slate-400 text-base mt-1.5 font-medium">
          "From detection to action — human-readable autonomous response timeline."
        </p>
      </div>

      <div className="bg-[#0d1424] border border-slate-800/60 rounded-3xl p-8 shadow-2xl backdrop-blur-md">
        <div className="relative border-l-2 border-slate-800 ml-4 space-y-6 pl-8">
          {timelineEvents.map((ev, idx) => {
            const Icon = ev.icon
            return (
              <div key={idx} className="relative flex items-start justify-between p-5 rounded-2xl bg-[#070B14] border border-slate-800/80 hover:border-slate-700 transition-all">
                {/* Timeline Dot */}
                <div
                  className="absolute -left-[45px] top-6 w-8 h-8 rounded-full flex items-center justify-center border-2 border-[#0d1424]"
                  style={{ backgroundColor: `${ev.color}20`, color: ev.color }}
                >
                  <Icon size={16} />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider" style={{ color: ev.color }}>
                      {ev.type}
                    </span>
                  </div>
                  <p className="text-slate-100 text-base font-bold font-sans">
                    {ev.title}
                  </p>
                </div>

                <span className="text-xs font-mono text-cyan-300 font-bold bg-cyan-500/10 px-3.5 py-1.5 rounded-xl border border-cyan-500/30 flex items-center gap-1.5 shrink-0 ml-4">
                  <Clock size={12} />
                  {ev.time}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
