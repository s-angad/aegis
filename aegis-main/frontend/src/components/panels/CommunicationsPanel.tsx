'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useAgentStore } from '@/stores/agentStore'
import { GlassCard } from '@/components/ui/GlassCard'
import { Radio } from 'lucide-react'
import { PulsingDot } from '@/components/ui/PulsingDot'
import type { Alert } from '@/lib/types'

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#eab308',
  LOW: '#22c55e',
  INFO: '#06b6d4',
}

const PRIORITY_ICONS: Record<string, string> = {
  EVACUATION_ORDER: '🚨',
  PUBLIC_ALERT: '⚠️',
  SITUATION_REPORT: '📊',
  EXECUTIVE_SUMMARY: '📋',
  CRITICAL_EVENT: '💥',
  SENSOR_ALERT: '📡',
}

function AlertEntry({ alert }: { alert: Alert }) {
  const color = PRIORITY_COLORS[alert.priority] ?? '#6b7280'
  const icon = PRIORITY_ICONS[alert.type] ?? '📢'

  // Safe timestamp parse
  let ts = ''
  try { ts = new Date(alert.timestamp).toLocaleTimeString('en-US', { hour12: false }) } catch {}

  // Always treat affected_sectors as array
  const sectors: string[] = Array.isArray(alert.affected_sectors) ? alert.affected_sectors : []

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25 }}
      className="mb-2"
    >
      <div
        className="rounded-lg border p-2.5 overflow-hidden"
        style={{
          borderColor: `${color}30`,
          borderLeftColor: color,
          borderLeftWidth: 3,
          backgroundColor: `${color}08`,
        }}
      >
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-sm shrink-0">{icon}</span>
            <span className="text-[11px] font-bold truncate" style={{ color }}>{alert.title ?? 'Alert'}</span>
          </div>
          {ts && <span className="text-[9px] text-slate-500 font-mono shrink-0">{ts}</span>}
        </div>

        <p className="text-[10px] text-slate-300 leading-relaxed break-words">
          {alert.message ?? ''}
        </p>

        {sectors.length > 0 && (
          <div className="flex gap-1 mt-1.5 flex-wrap">
            {sectors.slice(0, 4).map((s, idx) => (
              <span
                key={`${s}-${idx}`}
                className="text-[8px] px-1 py-0.5 rounded font-mono"
                style={{ color, backgroundColor: `${color}15`, border: `1px solid ${color}30` }}
              >
                {s}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default function CommunicationsPanel() {
  const { alerts } = useAgentStore()
  const safeAlerts = Array.isArray(alerts) ? alerts : []
  const critical = safeAlerts.filter((a) => a?.priority === 'CRITICAL').length

  return (
    <GlassCard className="h-full flex flex-col" animate={false}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Radio size={14} className="text-rose-400" />
          <span className="text-xs font-bold text-white tracking-wider uppercase">Communications</span>
        </div>
        <div className="flex items-center gap-2">
          {critical > 0 && <PulsingDot color="#ef4444" size={7} />}
          <span className="text-[10px] text-slate-400 font-mono">{safeAlerts.length} msgs</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {safeAlerts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-full text-center py-8"
            >
              <div className="text-3xl mb-3">📡</div>
              <p className="text-xs text-slate-500">No communications yet</p>
            </motion.div>
          ) : (
            safeAlerts.map((alert, idx) => (
              <AlertEntry key={alert?.id ?? idx} alert={alert} />
            ))
          )}
        </AnimatePresence>
      </div>
    </GlassCard>
  )
}
