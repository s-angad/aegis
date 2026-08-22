'use client'
import { useResourceStore } from '@/stores/resourceStore'
import { GlassCard } from '@/components/ui/GlassCard'
import { RESOURCE_ICONS, RESOURCE_COLORS, STATUS_COLORS } from '@/lib/constants'
import { Truck } from 'lucide-react'
import type { Resource } from '@/lib/types'

const STATUS_LABELS: Record<string, string> = {
  available: 'Available',
  dispatched: 'Dispatched',
  en_route: 'En Route',
  on_scene: 'On Scene',
  returning: 'Returning',
  unavailable: 'Unavail.',
}

function ResourceCard({ resource }: { resource: Resource }) {
  const color = STATUS_COLORS[resource.status] ?? '#6b7280'
  const typeColor = RESOURCE_COLORS[resource.type] ?? '#6b7280'
  const icon = RESOURCE_ICONS[resource.type] ?? '📍'
  const progress = Math.max(0, Math.min(1, Number(resource.route_progress) || 0))
  const statusLabel = STATUS_LABELS[resource.status] ?? (resource.status ?? '').replace(/_/g, ' ')

  return (
    <div
      className="p-2.5 rounded-lg border mb-2 transition-all duration-300"
      style={{
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderColor: resource.status === 'on_scene' ? `${typeColor}50` : 'rgba(255,255,255,0.08)',
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg shrink-0">{icon}</span>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-white truncate">{resource.name ?? '–'}</p>
            <p className="text-[9px] text-slate-500">{(resource.type ?? '').replace(/_/g, ' ')}</p>
          </div>
        </div>
        <span
          className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold shrink-0"
          style={{ color, backgroundColor: `${color}18`, border: `1px solid ${color}40` }}
        >
          {statusLabel}
        </span>
      </div>

      {resource.status === 'en_route' && (
        <div className="mt-2">
          <div className="flex justify-between mb-1">
            <span className="text-[9px] text-slate-500">Route progress</span>
            <span className="text-[9px] text-cyan-400 font-mono">{Math.round(progress * 100)}%</span>
          </div>
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${progress * 100}%`, backgroundColor: color }}
            />
          </div>
        </div>
      )}

      {resource.assigned_incident && (
        <p className="text-[9px] text-slate-500 mt-1.5 font-mono truncate">
          → {resource.assigned_incident}
        </p>
      )}
    </div>
  )
}

export default function ResourcePanel() {
  const { resources } = useResourceStore()
  const safeResources = Array.isArray(resources) ? resources : []
  const deployed = safeResources.filter((r) => r?.status !== 'available').length
  const total = safeResources.length
  const utilPct = total > 0 ? Math.round((deployed / total) * 100) : 0
  const barColor = utilPct > 80 ? '#ef4444' : utilPct > 50 ? '#f97316' : '#22c55e'

  return (
    <GlassCard className="h-full flex flex-col" animate={false}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Truck size={14} className="text-cyan-400" />
          <span className="text-xs font-bold text-white tracking-wider uppercase">Resources</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-16 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${utilPct}%`, backgroundColor: barColor }}
            />
          </div>
          <span className="text-[10px] text-slate-400 font-mono">{deployed}/{total}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
        {safeResources.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div className="text-3xl mb-3">🚤</div>
            <p className="text-xs text-slate-500">Resources loading...</p>
          </div>
        ) : (
          safeResources.map((r, idx) => <ResourceCard key={r?.id ?? idx} resource={r} />)
        )}
      </div>
    </GlassCard>
  )
}
