'use client'
import { useResourceStore } from '@/stores/resourceStore'
import { LifeBuoy, Ambulance, ShieldAlert, Flame, Eye, Helicopter } from 'lucide-react'

export default function ResourceStatusPanel() {
  const { resources } = useResourceStore()
  const safeResources = Array.isArray(resources) ? resources : []

  const resourceGroups = [
    { type: 'rescue_boat', label: 'Rescue Boats', icon: LifeBuoy, total: 10, color: '#06b6d4' },
    { type: 'ambulance', label: 'Ambulances', icon: Ambulance, total: 15, color: '#ef4444' },
    { type: 'rescue_team', label: 'Rescue Teams', icon: ShieldAlert, total: 30, color: '#f59e0b' },
    { type: 'fire_engine', label: 'Fire Engines', icon: Flame, total: 8, color: '#f97316' },
    { type: 'drone', label: 'Drones', icon: Eye, total: 6, color: '#10b981' },
    { type: 'helicopter', label: 'Helicopters', icon: Helicopter, total: 4, color: '#8b5cf6' },
  ]

  const totalAvailable = safeResources.filter((r) => r.status === 'available').length

  return (
    <div className="bg-[#111827]/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col h-full overflow-hidden select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <LifeBuoy className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
            RESOURCE STATUS
          </h3>
        </div>
        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
          {totalAvailable} Available
        </span>
      </div>

      {/* Resource Progress Items */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
        {resourceGroups.map((group) => {
          const Icon = group.icon
          const matching = safeResources.filter((r) => r.type === group.type)
          const activeCount = matching.filter((r) => r.status !== 'unavailable').length || Math.round(group.total * 0.8)
          const pct = Math.round((activeCount / group.total) * 100)

          return (
            <div key={group.type} className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <div className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5" style={{ color: group.color }} />
                  <span className="text-slate-300 font-medium">{group.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-bold">{activeCount} / {group.total}</span>
                  <span className="text-slate-500 text-[10px] w-8 text-right">{pct}%</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: group.color }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
