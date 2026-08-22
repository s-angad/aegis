'use client'
import { useResourceStore } from '@/stores/resourceStore'
import { Home, Users, CheckCircle2 } from 'lucide-react'

export default function ShelterStatusPanel() {
  const { shelters } = useResourceStore()
  const safeShelters = Array.isArray(shelters) ? shelters : []

  return (
    <div className="bg-[#111827]/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col h-full overflow-hidden select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Home className="w-4 h-4 text-blue-400" />
          <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
            SHELTER STATUS
          </h3>
        </div>
        <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/30">
          View All
        </span>
      </div>

      {/* Shelter Items */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {safeShelters.length === 0 ? (
          <div className="h-full flex items-center justify-center text-[11px] font-mono text-slate-500">
            Awaiting shelter activations...
          </div>
        ) : (
          safeShelters.slice(0, 4).map((s) => {
            const occPct = s.capacity > 0 ? Math.round((s.current_occupancy / s.capacity) * 100) : 0
            const isFull = occPct >= 90
            const isActive = s.status === 'active' || s.status === 'full'

            return (
              <div key={s.id} className="bg-[#0b0f19] border border-slate-800 rounded-xl p-2.5 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                      <Home className="w-3.5 h-3.5 text-blue-400" />
                      {s.name}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{s.sector}</div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                      isFull
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : isActive
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isFull ? 'FULL' : isActive ? 'ACTIVE' : 'STANDBY'}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-1">
                  <span>Occupancy</span>
                  <span className="font-bold text-white">
                    {s.current_occupancy} / {s.capacity} <span className="text-slate-500 font-normal">({occPct}%)</span>
                  </span>
                </div>

                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isFull ? 'bg-red-500' : occPct > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, occPct)}%` }}
                  />
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
