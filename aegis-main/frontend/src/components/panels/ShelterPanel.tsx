'use client'
import { useResourceStore } from '@/stores/resourceStore'
import { GlassCard } from '@/components/ui/GlassCard'
import { Home } from 'lucide-react'
import type { Shelter } from '@/lib/types'

const STATUS_COLORS_S: Record<string, string> = {
  standby: '#64748b',
  active: '#22c55e',
  full: '#ef4444',
  closed: '#374151',
}

function ShelterCard({ shelter }: { shelter: Shelter }) {
  const capacity = Math.max(1, Number(shelter.capacity) || 1)
  const occupancy = Math.max(0, Number(shelter.current_occupancy) || 0)
  const pct = Math.min(100, (occupancy / capacity) * 100)
  const barColor = pct > 90 ? '#ef4444' : pct > 65 ? '#eab308' : '#22c55e'
  const statusColor = STATUS_COLORS_S[shelter.status ?? 'standby'] ?? '#64748b'
  const icon = shelter.status === 'standby' ? '🏠' : shelter.status === 'full' ? '🔴' : '🏥'

  return (
    <div className="p-3 rounded-lg border border-white/[0.08] bg-white/[0.03] mb-2">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base shrink-0">{icon}</span>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-white truncate">{shelter.name ?? '–'}</p>
            <p className="text-[9px] text-slate-500">{shelter.sector ?? '–'}</p>
          </div>
        </div>
        <span
          className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase shrink-0"
          style={{ color: statusColor, backgroundColor: `${statusColor}18`, border: `1px solid ${statusColor}40` }}
        >
          {shelter.status ?? 'standby'}
        </span>
      </div>

      <div>
        <div className="flex justify-between mb-1">
          <span className="text-[9px] text-slate-500">Occupancy</span>
          <span className="text-[10px] font-mono font-bold" style={{ color: barColor }}>
            {occupancy.toLocaleString()} / {capacity.toLocaleString()}
          </span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, backgroundColor: barColor }}
          />
        </div>
        <p className="text-[9px] text-right mt-0.5" style={{ color: barColor }}>
          {pct.toFixed(0)}% capacity
        </p>
      </div>
    </div>
  )
}

export default function ShelterPanel() {
  const { shelters } = useResourceStore()
  const safeShelters = Array.isArray(shelters) ? shelters : []
  const active = safeShelters.filter((s) => s?.status !== 'standby').length
  const total = safeShelters.reduce((a, s) => a + (Number(s?.current_occupancy) || 0), 0)

  return (
    <GlassCard className="h-full flex flex-col" animate={false}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Home size={14} className="text-emerald-400" />
          <span className="text-xs font-bold text-white tracking-wider uppercase">Shelters</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-emerald-400 font-mono">{active} active</span>
          <span className="text-[10px] text-slate-500 font-mono">{total.toLocaleString()} evacuees</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
        {safeShelters.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div className="text-3xl mb-3">🏠</div>
            <p className="text-xs text-slate-500">Shelters initializing...</p>
          </div>
        ) : (
          safeShelters.map((s, idx) => <ShelterCard key={s?.id ?? idx} shelter={s} />)
        )}
      </div>
    </GlassCard>
  )
}
