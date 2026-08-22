'use client'
import { useSimulationStore } from '@/stores/simulationStore'
import { CloudRain, Waves, AlertTriangle, Navigation, Building2, ShieldAlert, Clock } from 'lucide-react'

export default function StoryTimeline() {
  const { simulation, timeline } = useSimulationStore()
  const isRunning = simulation.is_running && !simulation.is_paused

  // Story events matching Section 16 of prompt
  const defaultEvents = [
    { time: '14:26', label: 'Heavy rain started', icon: CloudRain, color: '#06b6d4' },
    { time: '14:27', label: 'River level rising', icon: Waves, color: '#3b82f6' },
    { time: '14:29', label: 'Flood entered Sector-04', icon: AlertTriangle, color: '#f59e0b' },
    { time: '14:30', label: 'Road R14 blocked', icon: Navigation, color: '#f97316' },
    { time: '14:31', label: 'Hospital access at risk', icon: Building2, color: '#ef4444' },
    { time: '14:32', label: 'Evacuation recommended', icon: ShieldAlert, color: '#8b5cf6' },
  ]

  const items = isRunning && timeline.length > 0
    ? timeline.slice(-6).map((t, idx) => ({
        time: `14:${String(26 + Math.min(30, t.tick)).padStart(2, '0')}`,
        label: t.description || 'Disaster state update',
        icon: idx % 2 === 0 ? Waves : AlertTriangle,
        color: idx > 3 ? '#ef4444' : '#06b6d4',
      }))
    : defaultEvents

  return (
    <div className="bg-[#111827]/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md select-none font-mono text-white flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
            TIMELINE
          </h3>
        </div>
        <span className="text-[10px] font-mono text-slate-400">Live Narrative Story</span>
      </div>

      {/* Horizontal Timeline Steps */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto py-1 scrollbar-none">
        {items.map((item, idx) => {
          const Icon = item.icon
          return (
            <div key={idx} className="flex flex-col items-center text-center min-w-[100px] flex-1 group">
              <div
                className="w-7 h-7 rounded-xl flex items-center justify-center mb-1.5 transition-transform group-hover:scale-110 shadow-md"
                style={{ backgroundColor: `${item.color}20`, color: item.color, borderColor: `${item.color}50`, borderWidth: 1 }}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>
              <span className="text-[10px] font-bold text-cyan-300 font-mono">{item.time}</span>
              <span className="text-[10px] text-slate-300 font-sans mt-0.5 line-clamp-1 leading-snug">
                {item.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
