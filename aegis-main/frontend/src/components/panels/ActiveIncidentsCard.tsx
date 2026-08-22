'use client'
import { useIncidentStore } from '@/stores/incidentStore'
import { AlertTriangle, MapPin } from 'lucide-react'

export default function ActiveIncidentsCard() {
  const { incidents, selectedIncidentId, selectIncident } = useIncidentStore()
  const safeIncidents = Array.isArray(incidents) ? incidents.filter((i) => i.is_active) : []

  return (
    <div className="w-80 bg-[#111827]/95 border border-slate-800 rounded-2xl p-3.5 shadow-2xl backdrop-blur-xl select-none font-mono text-white flex flex-col h-72">
      {/* Header */}
      <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            ACTIVE INCIDENTS
          </h3>
        </div>
        <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
          {safeIncidents.length} Active
        </span>
      </div>

      {/* Incidents List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-slate-800">
        {safeIncidents.length === 0 ? (
          <div className="h-full flex items-center justify-center text-[11px] text-slate-500 text-center">
            No active incidents reported...
          </div>
        ) : (
          safeIncidents.map((inc) => {
            const isSelected = selectedIncidentId === inc.id
            const color = inc.severity === 'CRITICAL' ? '#ef4444' : inc.severity === 'HIGH' ? '#f97316' : '#eab308'

            return (
              <div
                key={inc.id}
                onClick={() => selectIncident(inc.id)}
                className={`bg-[#0b0f19] border rounded-xl p-2.5 cursor-pointer transition-all ${
                  isSelected ? 'border-cyan-400 ring-1 ring-cyan-400' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white font-mono flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-cyan-400" />
                    {inc.sector || 'Sector-07'} {inc.type ? inc.type.replace(/_/g, ' ') : 'Flooding'}
                  </span>
                  <span
                    className="px-2 py-0.5 rounded text-[9px] font-bold uppercase"
                    style={{ backgroundColor: `${color}20`, color, borderColor: `${color}40`, borderWidth: 1 }}
                  >
                    {inc.severity}
                  </span>
                </div>

                <p className="text-[10px] text-slate-400 font-sans line-clamp-1 leading-snug">
                  {inc.description}
                </p>

                <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono mt-1.5 pt-1 border-t border-slate-800/60">
                  <span>Conf: {inc.confidence}%</span>
                  <span>Depth: {inc.water_level ? inc.water_level.toFixed(1) : '0.8'}m</span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
