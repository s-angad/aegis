'use client'
import { useAgentStore } from '@/stores/agentStore'
import { AlertTriangle, ShieldAlert } from 'lucide-react'

export default function CurrentAlertCard() {
  const { alerts } = useAgentStore()
  const safeAlerts = Array.isArray(alerts) ? alerts : []
  const latestAlert = safeAlerts[0]

  const title = latestAlert ? latestAlert.title : 'SECTOR-04 AT HIGH RISK'
  const message = latestAlert ? latestAlert.message : 'Flood waters are rising rapidly. Immediate evacuation recommended.'
  const isCritical = latestAlert ? latestAlert.priority === 'CRITICAL' || latestAlert.priority === 'HIGH' : true

  return (
    <div
      className={`rounded-2xl p-4 border shadow-2xl backdrop-blur-md transition-all select-none ${
        isCritical
          ? 'bg-red-950/40 border-red-500/60 shadow-red-900/20'
          : 'bg-amber-950/40 border-amber-500/60 shadow-amber-900/20'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <ShieldAlert className={`w-5 h-5 ${isCritical ? 'text-red-400 animate-pulse' : 'text-amber-400'}`} />
          <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
            CURRENT ALERT
          </h3>
        </div>
        <span
          className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase ${
            isCritical ? 'bg-red-500/30 text-red-300 border border-red-500/50' : 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
          }`}
        >
          {isCritical ? 'CRITICAL EMERGENCY' : 'HIGH WARNING'}
        </span>
      </div>

      <div className="flex items-start gap-2.5 mt-1">
        <span className="text-lg">🔴</span>
        <div>
          <h4 className="text-sm font-bold text-white font-mono tracking-tight">{title}</h4>
          <p className="text-xs text-slate-300 leading-relaxed font-sans mt-0.5">{message}</p>
        </div>
      </div>
    </div>
  )
}
