'use client'
import { useResourceStore } from '@/stores/resourceStore'
import { Home } from 'lucide-react'

export default function ShelterStatusCard() {
  const { shelters } = useResourceStore()
  const safeShelters = Array.isArray(shelters) ? shelters : []

  const defaultShelters = [
    { name: 'Shelter-03', occupancy: 144, capacity: 500, pct: 29 },
    { name: 'Shelter-01', occupancy: 86, capacity: 400, pct: 21 },
  ]

  const items = safeShelters.length >= 2
    ? safeShelters.slice(0, 2).map((s) => ({
        name: s.name,
        occupancy: s.current_occupancy,
        capacity: s.capacity,
        pct: s.capacity > 0 ? Math.round((s.current_occupancy / s.capacity) * 100) : 0,
      }))
    : defaultShelters

  return (
    <div className="bg-[#111827]/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md select-none font-mono text-white flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Home className="w-4 h-4 text-blue-400" />
          <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
            SHELTERS
          </h3>
        </div>
        <span className="text-[10px] text-blue-400 font-bold uppercase">SAFE CAPACITY</span>
      </div>

      <div className="space-y-3">
        {items.map((s, idx) => {
          const color = s.pct > 80 ? '#ef4444' : s.pct > 50 ? '#f59e0b' : '#10b981'

          return (
            <div key={idx} className="flex flex-col gap-1.5 bg-[#0b0f19] border border-slate-800 p-2.5 rounded-xl">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white font-mono">{s.name}</span>
                <span className="text-slate-300 font-mono">
                  {s.occupancy} / {s.capacity} <span className="text-slate-500 font-normal">({s.pct}% occupied)</span>
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${s.pct}%`, backgroundColor: color }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
