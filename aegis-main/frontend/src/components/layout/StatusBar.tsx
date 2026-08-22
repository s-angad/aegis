'use client'
import { useSimulationStore } from '@/stores/simulationStore'
import { useIncidentStore } from '@/stores/incidentStore'
import { useResourceStore } from '@/stores/resourceStore'
import { AlertTriangle, Users, Truck, Home, Shield } from 'lucide-react'

export default function StatusBar() {
  const { floodState, simulation } = useSimulationStore()
  const { incidents } = useIncidentStore()
  const { resources, shelters } = useResourceStore()

  const safeIncidents = Array.isArray(incidents) ? incidents : []
  const safeResources = Array.isArray(resources) ? resources : []
  const safeShelters = Array.isArray(shelters) ? shelters : []

  const activeIncidents = safeIncidents.filter((i) => i?.is_active !== false).length
  const affectedPop = Number(floodState?.affected_population) || 0
  const deployedResources = safeResources.filter((r) => r?.status !== 'available').length
  const activeShelters = safeShelters.filter((s) => s?.status !== 'standby').length

  const livesRisk = Number(floodState?.projected_lives_at_risk) || 0
  const livesSaved = Number(floodState?.lives_saved) || 0
  const riskReduction = Number(floodState?.risk_reduction_pct) || 0

  const stats = [
    { label: 'Active Incidents', value: activeIncidents, icon: AlertTriangle, color: '#ef4444', highlight: activeIncidents > 0 },
    { label: 'Population Affected', value: affectedPop.toLocaleString(), icon: Users, color: '#f97316', highlight: affectedPop > 1000 },
    { label: 'Resources Deployed', value: `${deployedResources}/${safeResources.length}`, icon: Truck, color: '#06b6d4', highlight: deployedResources > 0 },
    { label: 'Safezones/Shelters Active', value: activeShelters, icon: Home, color: '#22c55e', highlight: activeShelters > 0 },
    { label: 'Projected Lives at Risk', value: livesRisk.toLocaleString(), icon: Users, color: '#f87171', highlight: livesRisk > 0 },
    { label: 'Lives Protected', value: `${livesSaved.toLocaleString()} (${riskReduction}%)`, icon: Shield, color: '#34d399', highlight: livesSaved > 0 },
  ]

  return (
    <div
      className="h-10 flex items-center px-6 border-b border-white/10 gap-6 overflow-x-auto"
      style={{ backgroundColor: 'rgba(10,14,26,0.9)' }}
    >
      {stats.map((stat, i) => {
        const Icon = stat.icon
        return (
          <div key={i} className="flex items-center gap-2 shrink-0">
            <Icon size={11} style={{ color: stat.highlight ? stat.color : '#475569' }} />
            <span className="text-[10px] text-slate-500 font-mono">{stat.label}:</span>
            <span
              className="text-[11px] font-bold font-mono tabular-nums transition-all duration-500"
              style={{ color: stat.highlight ? stat.color : '#94a3b8' }}
            >
              {stat.value}
            </span>
            {i < stats.length - 1 && (
              <span className="text-slate-700 ml-4">|</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
