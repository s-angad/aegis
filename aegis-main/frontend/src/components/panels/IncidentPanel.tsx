'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useIncidentStore } from '@/stores/incidentStore'
import { GlassCard } from '@/components/ui/GlassCard'
import { SeverityBadge } from '@/components/ui/SeverityBadge'
import { AlertTriangle, MapPin, Clock } from 'lucide-react'
import { SEVERITY_COLORS } from '@/lib/constants'
import type { Incident } from '@/lib/types'

function formatTimeAgo(ts: string): string {
  try {
    const diff = Date.now() - new Date(ts).getTime()
    const secs = Math.floor(diff / 1000)
    if (isNaN(secs) || secs < 0) return '–'
    if (secs < 60) return `${secs}s ago`
    return `${Math.floor(secs / 60)}m ago`
  } catch {
    return '–'
  }
}

function IncidentCard({ incident }: { incident: Incident }) {
  const { selectIncident, selectedIncidentId } = useIncidentStore()
  const isSelected = selectedIncidentId === incident.id
  const color = SEVERITY_COLORS[incident.severity] ?? '#6b7280'
  const timeAgo = formatTimeAgo(incident.timestamp ?? '')
  // Always safe arrays / numbers
  const assignedCount = Array.isArray(incident.assigned_resources) ? incident.assigned_resources.length : 0
  const confidence = Math.max(0, Math.min(100, Number(incident.confidence) || 0))
  const waterLevel = Number(incident.water_level) || 0
  const incidentType = (incident.type ?? '').replace(/_/g, ' ')

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20, height: 0 }}
      animate={{ opacity: 1, x: 0, height: 'auto' }}
      exit={{ opacity: 0, x: -20, height: 0 }}
      transition={{ duration: 0.3 }}
      onClick={() => selectIncident(incident.id)}
      className="cursor-pointer"
    >
      <div
        className="p-3 rounded-lg border mb-2 transition-all duration-200"
        style={{
          backgroundColor: isSelected ? `${color}15` : 'rgba(255,255,255,0.03)',
          borderColor: isSelected ? `${color}60` : 'rgba(255,255,255,0.08)',
        }}
      >
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <SeverityBadge severity={incident.severity} pulse={incident.severity === 'CRITICAL'} />
          <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
            <Clock size={9} />
            {timeAgo}
          </span>
        </div>

        <div className="flex items-center gap-1.5 mb-1">
          <MapPin size={10} className="text-slate-400 shrink-0" />
          <span className="text-[11px] text-slate-300 font-medium">{incident.sector ?? '–'}</span>
          {incidentType && (
            <span className="text-[10px] text-slate-500">· {incidentType}</span>
          )}
        </div>

        <p className="text-[10px] text-slate-400 leading-relaxed line-clamp-2 mb-1.5">
          {incident.description ?? ''}
        </p>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${confidence}%`, backgroundColor: color }}
            />
          </div>
          <span className="text-[9px] text-slate-500 font-mono">{confidence}%</span>
          {waterLevel > 0 && (
            <span className="text-[9px] text-blue-400 font-mono">💧{waterLevel.toFixed(1)}m</span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default function IncidentPanel() {
  const { incidents } = useIncidentStore()
  const safeIncidents = Array.isArray(incidents) ? incidents : []
  const active = safeIncidents
    .filter((i) => i?.is_active !== false)
    .sort((a, b) => {
      const sev: Record<string, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 }
      return (sev[b?.severity] ?? 0) - (sev[a?.severity] ?? 0)
    })

  const criticalCount = active.filter((i) => i?.severity === 'CRITICAL').length
  const highCount = active.filter((i) => i?.severity === 'HIGH').length
  const assignedCount = active.filter((i) =>
    Array.isArray(i?.assigned_resources) && i.assigned_resources.length > 0
  ).length

  return (
    <GlassCard className="h-full flex flex-col" animate={false}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <AlertTriangle size={14} className="text-red-400" />
          <span className="text-xs font-bold text-white tracking-wider uppercase">Active Incidents</span>
        </div>
        <div className="flex items-center gap-1.5">
          {criticalCount > 0 && (
            <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded-full font-bold animate-pulse">
              {criticalCount} CRIT
            </span>
          )}
          <span className="text-[11px] bg-white/10 text-slate-300 px-2 py-0.5 rounded-full font-mono">
            {active.length}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {active.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-full text-center py-12"
            >
              <div className="text-3xl mb-3">🛡️</div>
              <p className="text-xs text-slate-500">No active incidents</p>
              <p className="text-[10px] text-slate-600 mt-1">All systems normal</p>
            </motion.div>
          ) : (
            active.map((incident, idx) => (
              <IncidentCard key={incident?.id ?? idx} incident={incident} />
            ))
          )}
        </AnimatePresence>
      </div>

      {active.length > 0 && (
        <div className="px-4 py-2 border-t border-white/10 flex items-center justify-between">
          <span className="text-[10px] text-slate-500">
            {assignedCount}/{active.length} assigned
          </span>
          <div className="flex gap-2">
            {highCount > 0 && (
              <span className="text-[10px] text-orange-400">{highCount} HIGH</span>
            )}
          </div>
        </div>
      )}
    </GlassCard>
  )
}
