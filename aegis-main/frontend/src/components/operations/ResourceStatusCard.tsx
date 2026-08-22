'use client'
import { useResourceStore } from '@/stores/resourceStore'
import { LifeBuoy, Ambulance, ShieldAlert, Flame } from 'lucide-react'

export default function ResourceStatusCard() {
  const { resources } = useResourceStore()
  const safeResources = Array.isArray(resources) ? resources : []

  const items = [
    { label: 'Rescue Boats', count: '2 / 5', active: 2, total: 5, icon: LifeBuoy, color: '#06b6d4' },
    { label: 'Rescue Teams', count: '4 / 8', active: 4, total: 8, icon: ShieldAlert, color: '#f59e0b' },
    { label: 'Ambulances', count: '6 / 12', active: 6, total: 12, icon: Ambulance, color: '#ef4444' },
    { label: 'Fire Engines', count: '3 / 6', active: 3, total: 6, icon: Flame, color: '#f97316' },
  ]

  return (
    <div className="bg-[#111827]/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md select-none font-mono text-white flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <LifeBuoy className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
            RESOURCES
          </h3>
        </div>
        <span className="text-[10px] text-emerald-400 font-bold uppercase">DEPLOYED / AVAILABLE</span>
      </div>

      <div className="space-y-2.5">
        {items.map((item, idx) => {
          const Icon = item.icon
          const pct = Math.round((item.active / item.total) * 100)

          return (
            <div key={idx} className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5" style={{ color: item.color }} />
                  <span className="text-slate-300 font-sans">{item.label}</span>
                </div>
                <span className="text-white font-bold">{item.count}</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: item.color }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
