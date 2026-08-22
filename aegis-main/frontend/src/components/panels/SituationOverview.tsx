'use client'
import { useSimulationStore } from '@/stores/simulationStore'
import { useIncidentStore } from '@/stores/incidentStore'
import { useReconStore } from '@/stores/reconStore'
import { Activity, AlertTriangle, Droplets, Users, ShieldCheck, Navigation, CloudRain, Wind, Eye } from 'lucide-react'

export default function SituationOverview() {
  const { simulation, floodState } = useSimulationStore()
  const { incidents } = useIncidentStore()
  const { latestObservation } = useReconStore()

  const activeIncidents = Array.isArray(incidents) ? incidents.filter((i) => i.is_active).length : 0
  const criticalIncidents = Array.isArray(incidents) ? incidents.filter((i) => i.is_active && i.severity === 'CRITICAL').length : 0

  const floodAreaPct = latestObservation?.flood_area_percent || (floodState?.total_flooded_cells ? (floodState.total_flooded_cells / 256) * 100 : 0)
  const maxWaterLevel = floodState?.max_flood_level || 0
  const livesRisk = floodState?.projected_lives_at_risk || 19676
  const livesSaved = floodState?.lives_saved || 1017
  const riskMitigationPct = floodState?.risk_reduction_pct || 4.2
  const blockedRoads = floodState?.blocked_roads || 0

  // Risk gauge determination
  const riskLevel = criticalIncidents > 2 || floodAreaPct > 40 ? 'CRITICAL' : criticalIncidents > 0 || floodAreaPct > 20 ? 'HIGH' : floodAreaPct > 10 ? 'MODERATE' : 'SAFE'
  const riskColor = riskLevel === 'CRITICAL' ? '#ef4444' : riskLevel === 'HIGH' ? '#f97316' : riskLevel === 'MODERATE' ? '#eab308' : '#10b981'

  return (
    <div className="flex flex-col gap-4 text-white select-none">
      {/* 1. SITUATION OVERVIEW & RISK GAUGE */}
      <div className="bg-[#111827]/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
            SITUATION OVERVIEW
          </h3>
          <span
            className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider"
            style={{ backgroundColor: `${riskColor}20`, color: riskColor, borderColor: `${riskColor}50`, borderWidth: 1 }}
          >
            {riskLevel}
          </span>
        </div>

        {/* Risk Gauge Bar */}
        <div className="flex flex-col items-center justify-center my-2">
          <div className="text-2xl font-black font-mono tracking-tight" style={{ color: riskColor }}>
            {riskLevel}
          </div>
          <p className="text-[11px] text-slate-400 font-mono mt-0.5 text-center">
            {riskLevel === 'CRITICAL'
              ? 'Rapid flood expansion detected'
              : riskLevel === 'HIGH'
              ? 'Multi-sector inundation threat'
              : 'Localized containment monitoring'}
          </p>

          {/* Curved Gauge Bar */}
          <div className="w-full h-2 bg-slate-800 rounded-full mt-3 overflow-hidden flex">
            <div className="h-full bg-emerald-500 w-1/4" />
            <div className="h-full bg-amber-500 w-1/4" />
            <div className="h-full bg-orange-500 w-1/4" />
            <div className="h-full bg-red-500 w-1/4" />
          </div>
        </div>
      </div>

      {/* 2. KEY METRICS GRID */}
      <div className="bg-[#111827]/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col gap-3">
        <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
          KEY METRICS
        </h3>

        <div className="grid grid-cols-2 gap-2.5">
          {/* Flooded Area */}
          <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-3">
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-mono uppercase mb-1">
              <span>Flooded Area</span>
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-xl font-mono font-black text-white">{floodAreaPct.toFixed(1)}%</div>
            <div className="text-[10px] text-cyan-400 font-mono mt-0.5">+7% last 5 min</div>
          </div>

          {/* Water Level */}
          <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-3">
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-mono uppercase mb-1">
              <span>Water Level</span>
              <Droplets className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="text-xl font-mono font-black text-white">{maxWaterLevel.toFixed(2)}m</div>
            <div className="text-[10px] text-amber-400 font-mono mt-0.5">Rising</div>
          </div>

          {/* Population at Risk */}
          <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-3">
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-mono uppercase mb-1">
              <span>Pop. at Risk</span>
              <Users className="w-3.5 h-3.5 text-red-400" />
            </div>
            <div className="text-xl font-mono font-black text-white">{livesRisk.toLocaleString()}</div>
            <div className="text-[10px] text-red-400 font-mono mt-0.5">+2,341</div>
          </div>

          {/* Lives Protected */}
          <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-3">
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-mono uppercase mb-1">
              <span>Lives Saved</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xl font-mono font-black text-emerald-400">{livesSaved.toLocaleString()}</div>
            <div className="text-[10px] text-emerald-400 font-mono mt-0.5">({riskMitigationPct}%)</div>
          </div>

          {/* Active Incidents */}
          <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-3">
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-mono uppercase mb-1">
              <span>Incidents</span>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-xl font-mono font-black text-white">{activeIncidents}</div>
            <div className="text-[10px] text-amber-400 font-mono mt-0.5">+3 new</div>
          </div>

          {/* Blocked Roads */}
          <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-3">
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-mono uppercase mb-1">
              <span>Blocked Roads</span>
              <Navigation className="w-3.5 h-3.5 text-orange-400" />
            </div>
            <div className="text-xl font-mono font-black text-white">{blockedRoads}</div>
            <div className="text-[10px] text-orange-400 font-mono mt-0.5">+5 new</div>
          </div>
        </div>
      </div>

      {/* 3. WEATHER CONDITIONS */}
      <div className="bg-[#111827]/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col gap-3 font-mono">
        <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
          WEATHER CONDITIONS
        </h3>

        <div className="flex items-center justify-between bg-[#0b0f19] border border-slate-800 p-3 rounded-xl">
          <div className="flex items-center gap-3">
            <CloudRain className="w-8 h-8 text-cyan-400" />
            <div>
              <div className="text-sm font-bold text-white">Heavy Rain</div>
              <div className="text-[10px] text-slate-400">42 mm/h</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-400">
          <div className="bg-[#0b0f19] border border-slate-800 p-2 rounded-lg text-center">
            <div>Wind</div>
            <div className="text-xs font-bold text-white mt-0.5">18 km/h</div>
          </div>
          <div className="bg-[#0b0f19] border border-slate-800 p-2 rounded-lg text-center">
            <div>Humidity</div>
            <div className="text-xs font-bold text-white mt-0.5">89%</div>
          </div>
          <div className="bg-[#0b0f19] border border-slate-800 p-2 rounded-lg text-center">
            <div>Visibility</div>
            <div className="text-xs font-bold text-white mt-0.5">2.1 km</div>
          </div>
        </div>
      </div>
    </div>
  )
}
