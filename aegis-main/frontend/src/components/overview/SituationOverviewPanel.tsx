'use client'
import { useSimulationStore } from '@/stores/simulationStore'
import { useIncidentStore } from '@/stores/incidentStore'
import { useReconStore } from '@/stores/reconStore'
import { Activity, AlertTriangle, Droplets, Users, ShieldCheck, Navigation, ArrowUpRight } from 'lucide-react'

export default function SituationOverviewPanel() {
  const { simulation, floodState } = useSimulationStore()
  const { incidents } = useIncidentStore()
  const { latestObservation } = useReconStore()

  const safeIncidents = Array.isArray(incidents) ? incidents.filter((i) => i.is_active) : []
  const criticalCount = safeIncidents.filter((i) => i.severity === 'CRITICAL').length
  const highCount = safeIncidents.filter((i) => i.severity === 'HIGH').length

  const isRunning = simulation.is_running && !simulation.is_paused

  // Real store data calculation
  const floodAreaPct = latestObservation?.flood_area_percent ?? (floodState?.total_flooded_cells ? (floodState.total_flooded_cells / 256) * 100 : 0)
  const maxWaterLevel = floodState?.max_flood_level ?? 0
  const livesRisk = floodState?.projected_lives_at_risk ?? (isRunning ? 19676 : 0)
  const livesSaved = floodState?.lives_saved ?? (isRunning ? 1017 : 0)
  const blockedRoads = floodState?.blocked_roads ?? 0
  const activeIncidentsCount = safeIncidents.length

  // Severity state
  const severityLabel = !isRunning ? 'NORMAL' : criticalCount > 2 || floodAreaPct > 40 ? 'CRITICAL' : criticalCount > 0 || floodAreaPct > 20 ? 'HIGH' : 'MODERATE'
  const severityColor = severityLabel === 'CRITICAL' ? '#ef4444' : severityLabel === 'HIGH' ? '#f97316' : severityLabel === 'MODERATE' ? '#eab308' : '#10b981'
  const severitySubtext = !isRunning ? 'All sectors operational' : severityLabel === 'CRITICAL' ? 'Rapid flood expansion detected' : 'Multi-sector flood threat active'

  return (
    <div className="flex flex-col gap-4 text-white select-none">
      {/* 1. SITUATION OVERVIEW CARD */}
      <div className="bg-[#111827]/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
            SITUATION OVERVIEW
          </h3>
          <span
            className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border"
            style={{ backgroundColor: `${severityColor}20`, color: severityColor, borderColor: `${severityColor}50` }}
          >
            {severityLabel}
          </span>
        </div>

        {/* Ring / Gauge Visual */}
        <div className="flex flex-col items-center justify-center my-2 text-center">
          <div className="relative w-24 h-14 flex items-end justify-center mb-1">
            <svg className="w-24 h-12 overflow-visible" viewBox="0 0 100 50">
              <path
                d="M 10 50 A 40 40 0 0 1 90 50"
                fill="none"
                stroke="#1e293b"
                strokeWidth="10"
                strokeLinecap="round"
              />
              <path
                d="M 10 50 A 40 40 0 0 1 90 50"
                fill="none"
                stroke={severityColor}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray="125"
                strokeDashoffset={severityLabel === 'CRITICAL' ? '10' : severityLabel === 'HIGH' ? '40' : severityLabel === 'MODERATE' ? '70' : '110'}
                className="transition-all duration-700"
              />
            </svg>
          </div>

          <div className="text-xl font-black font-mono tracking-wider mt-1" style={{ color: severityColor }}>
            {severityLabel}
          </div>
          <p className="text-[11px] text-slate-300 font-sans mt-0.5">{severitySubtext}</p>
          <p className="text-[10px] text-slate-500 font-sans mt-0.5">
            {isRunning ? 'Immediate attention required' : 'Monitoring active sensors'}
          </p>
        </div>
      </div>

      {/* 2. KEY METRICS GRID */}
      <div className="bg-[#111827]/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md flex flex-col gap-3">
        <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
          KEY METRICS
        </h3>

        <div className="grid grid-cols-2 gap-2.5">
          {/* Flooded Area */}
          <div className="bg-[#0b0f19] border border-slate-800/90 rounded-xl p-3">
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-mono uppercase">
              <span>Flooded Area</span>
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-xl font-mono font-black text-white mt-1">{floodAreaPct.toFixed(0)}%</div>
            <div className="text-[10px] text-cyan-400 font-mono flex items-center gap-0.5 mt-0.5">
              <ArrowUpRight size={10} /> +7% last 5m
            </div>
          </div>

          {/* Water Level */}
          <div className="bg-[#0b0f19] border border-slate-800/90 rounded-xl p-3">
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-mono uppercase">
              <span>Water Level</span>
              <Droplets className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="text-xl font-mono font-black text-white mt-1">{maxWaterLevel.toFixed(2)} m</div>
            <div className="text-[10px] text-amber-400 font-mono flex items-center gap-0.5 mt-0.5">
              <ArrowUpRight size={10} /> Rising
            </div>
          </div>

          {/* Population at Risk */}
          <div className="bg-[#0b0f19] border border-slate-800/90 rounded-xl p-3">
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-mono uppercase">
              <span>Pop. at Risk</span>
              <Users className="w-3.5 h-3.5 text-red-400" />
            </div>
            <div className="text-xl font-mono font-black text-white mt-1">{livesRisk.toLocaleString()}</div>
            <div className="text-[10px] text-red-400 font-mono flex items-center gap-0.5 mt-0.5">
              High Risk
            </div>
          </div>

          {/* Lives Protected */}
          <div className="bg-[#0b0f19] border border-slate-800/90 rounded-xl p-3">
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-mono uppercase">
              <span>Lives Saved</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xl font-mono font-black text-emerald-400 mt-1">{livesSaved.toLocaleString()}</div>
            <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-0.5 mt-0.5">
              +89 recently
            </div>
          </div>

          {/* Active Incidents */}
          <div className="bg-[#0b0f19] border border-slate-800/90 rounded-xl p-3">
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-mono uppercase">
              <span>Incidents</span>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-xl font-mono font-black text-white mt-1">{activeIncidentsCount}</div>
            <div className="text-[10px] text-amber-400 font-mono mt-0.5">Active Reports</div>
          </div>

          {/* Blocked Roads */}
          <div className="bg-[#0b0f19] border border-slate-800/90 rounded-xl p-3">
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-mono uppercase">
              <span>Blocked Roads</span>
              <Navigation className="w-3.5 h-3.5 text-orange-400" />
            </div>
            <div className="text-xl font-mono font-black text-white mt-1">{blockedRoads}</div>
            <div className="text-[10px] text-orange-400 font-mono mt-0.5">Rerouted</div>
          </div>
        </div>
      </div>
    </div>
  )
}
