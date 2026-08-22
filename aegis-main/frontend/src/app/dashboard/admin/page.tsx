'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, RefreshCw, FileText, Send, Layers, CheckCircle2 } from 'lucide-react'
import { useProfileStore } from '@/stores/useProfileStore'
import { useSimulationStore } from '@/stores/simulationStore'
import { useResourceStore } from '@/stores/resourceStore'
import { useCommandStore, Priority } from '@/stores/useCommandStore'
import { useAuditStore } from '@/stores/useAuditStore'
import { AegisMissionReportModal } from '@/components/demo/AegisMissionReportModal'

export default function AdminDashboardPage() {
  const router = useRouter()
  const currentProfile = useProfileStore((state) => state.currentProfile)
  const { simulation, floodState } = useSimulationStore()
  const { resources } = useResourceStore()
  const { directives, issueDirective } = useCommandStore()
  const { auditLogs } = useAuditStore()

  const [isReportOpen, setIsReportOpen] = useState(false)

  // Directive Form State
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [targetSector, setTargetSector] = useState('04')
  const [priority, setPriority] = useState<Priority>('HIGH')

  // ROUTE GUARD:
  // If currentProfile is null, redirect to /select-profile.
  // If currentProfile.role !== 'SYSTEM_ADMIN', redirect to "/".
  // TODO: redirect to role-specific dashboard once other dashboards exist
  useEffect(() => {
    if (!currentProfile) {
      router.push('/select-profile')
    } else if (currentProfile.role !== 'SYSTEM_ADMIN') {
      router.push('/')
    }
  }, [currentProfile, router])

  if (!currentProfile || currentProfile.role !== 'SYSTEM_ADMIN') {
    return null
  }

  // Derive real system status from live simulation state
  const isRunning = simulation.is_running && !simulation.is_paused
  const floodedCells = floodState ? floodState.total_flooded_cells : 0
  const systemStatus =
    isRunning && floodedCells > 0
      ? 'ACTIVE RESPONSE'
      : isRunning
      ? 'MONITORING'
      : 'IDLE'

  const deployedResourcesCount = resources.filter(
    (r) => r.status === 'dispatched' || r.status === 'en_route' || r.status === 'on_scene'
  ).length || (isRunning ? 7 : 0)

  const highRiskSectorsCount =
    floodState && floodState.total_flooded_sectors && floodState.total_flooded_sectors.length > 0
      ? floodState.total_flooded_sectors.length
      : isRunning
      ? 2
      : 0

  const sectorsData = [
    {
      id: 'S04',
      name: 'Sector 04',
      riskLevel: isRunning ? 'CRITICAL' : 'LOW',
      colorClass: isRunning ? 'bg-red-500/20 text-red-700 border-red-400/50' : 'bg-emerald-500/20 text-emerald-700 border-emerald-400/50',
    },
    {
      id: 'S07',
      name: 'Sector 07',
      riskLevel: isRunning ? 'HIGH' : 'LOW',
      colorClass: isRunning ? 'bg-amber-500/20 text-amber-700 border-amber-400/50' : 'bg-emerald-500/20 text-emerald-700 border-emerald-400/50',
    },
    {
      id: 'S11',
      name: 'Sector 11',
      riskLevel: isRunning ? 'MEDIUM' : 'LOW',
      colorClass: isRunning ? 'bg-blue-500/20 text-blue-700 border-blue-400/50' : 'bg-emerald-500/20 text-emerald-700 border-emerald-400/50',
    },
  ]

  const handleIssueDirective = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    issueDirective({
      title,
      description: description || `Strategic directive for Sector ${targetSector}`,
      targetSector,
      priority,
      issuedBy: currentProfile.name
    })

    setTitle('')
    setDescription('')
  }

  return (
    <div className="relative min-h-screen w-full bg-[#F7F7F5] text-[#111111] font-sans flex flex-col justify-between selection:bg-[#2563EB] selection:text-white">
      
      {/* Background Aurora */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[8%] w-[520px] h-[520px] rounded-full bg-blue-400/25 blur-[130px]" />
        <div className="absolute top-[15%] right-[4%] w-[420px] h-[420px] rounded-full bg-cyan-300/20 blur-[120px]" />
      </div>

      {/* Main Container */}
      <div className="w-full max-w-[1200px] mx-auto px-6 py-8 space-y-8 flex-1">
        
        {/* A) HEADER STRIP */}
        <header className="w-full liquid-glass-navbar px-6 py-4 rounded-full flex flex-wrap items-center justify-between gap-4 shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-[#2563EB]/10 text-[#2563EB]">
              <Shield size={20} />
            </div>
            <div>
              <h1 className="text-base font-bold text-[#111111] leading-none">
                Signed in as <span className="text-[#2563EB] font-black">{currentProfile.name}</span> · Operations Director
              </h1>
              <p className="text-[10px] font-mono text-[#6E6E73] tracking-widest uppercase mt-0.5">
                SYSTEM ADMIN OVERVIEW
              </p>
            </div>
          </div>

          <button
            onClick={() => router.push('/select-profile')}
            className="liquid-glass-button text-white px-4 py-2 rounded-full text-xs font-bold cursor-pointer inline-flex items-center gap-1.5"
          >
            <RefreshCw size={12} />
            <span>Switch Profile</span>
          </button>
        </header>

        {/* B) SUMMARY ROW (4 liquid-glass-chip / card pills across) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
          <div className="liquid-glass-card p-5 rounded-2xl space-y-1">
            <span className="text-[10px] font-bold text-[#6E6E73] uppercase block">TOTAL SECTORS MONITORED</span>
            <span className="text-2xl font-black text-[#111111] block">16 Sectors</span>
          </div>

          <div className="liquid-glass-card p-5 rounded-2xl space-y-1">
            <span className="text-[10px] font-bold text-[#6E6E73] uppercase block">OVERALL SYSTEM STATUS</span>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isRunning ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
              <span className="text-lg font-black text-[#2563EB] block">{systemStatus}</span>
            </div>
          </div>

          <div className="liquid-glass-card p-5 rounded-2xl space-y-1">
            <span className="text-[10px] font-bold text-[#6E6E73] uppercase block">HIGH-RISK SECTORS ACTIVE</span>
            <span className={`text-2xl font-black block ${highRiskSectorsCount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
              {highRiskSectorsCount} Active
            </span>
          </div>

          <div className="liquid-glass-card p-5 rounded-2xl space-y-1">
            <span className="text-[10px] font-bold text-[#6E6E73] uppercase block">TOTAL RESOURCES DEPLOYED</span>
            <span className="text-2xl font-black text-emerald-700 block">{deployedResourcesCount} Deployed</span>
          </div>
        </section>

        {/* C) SECTOR OVERVIEW LIST */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#111111] font-sans tracking-tight">
              DIGITAL TWIN SECTOR OVERVIEW
            </h2>
            <span className="text-xs font-mono text-[#6E6E73]">Live Telemetry</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono">
            {sectorsData.map((sec) => (
              <div key={sec.id} className="liquid-glass-card p-6 rounded-[24px] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-base font-black text-[#111111]">{sec.name}</span>
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase border ${sec.colorClass}`}>
                    {sec.riskLevel}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-200/80 text-xs text-[#6E6E73] font-sans">
                  Commander: <span className="font-mono text-[#111111] font-semibold">Commander — Sector 04</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* PART 2: ISSUE DIRECTIVE FORM & DIRECTIVES LIST */}
        <section className="liquid-glass-card p-6 rounded-[28px] space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
            <div className="flex items-center gap-2 font-bold text-base text-[#111111]">
              <Send size={18} className="text-[#2563EB]" />
              <span>ISSUE STRATEGIC DIRECTIVE</span>
            </div>
            <span className="font-mono text-xs font-bold text-[#2563EB]">{directives.length} Total Directives</span>
          </div>

          <form onSubmit={handleIssueDirective} className="space-y-4 font-sans text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase font-mono text-[10px]">Directive Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Contain Sector 04 flooding, prioritize evacuation"
                className="w-full p-3 rounded-xl bg-white border border-slate-300 text-sm font-semibold outline-none focus:border-[#2563EB]"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3 font-mono">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase text-[10px]">Target Sector</label>
                <select
                  value={targetSector}
                  onChange={(e) => setTargetSector(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-300 font-bold text-xs outline-none"
                >
                  <option value="04">Sector 04</option>
                  <option value="07">Sector 07</option>
                  <option value="11">Sector 11</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase text-[10px]">Priority Level</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-300 font-bold text-xs outline-none"
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase font-mono text-[10px]">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detail operational objective or evacuation priorities..."
                rows={2}
                className="w-full p-3 rounded-xl bg-white border border-slate-300 font-sans text-xs outline-none focus:border-[#2563EB]"
              />
            </div>

            <button
              type="submit"
              className="liquid-glass-button text-white px-6 py-3 rounded-xl font-bold text-xs cursor-pointer inline-flex items-center gap-2"
            >
              <Send size={14} />
              <span>Issue Directive →</span>
            </button>
          </form>

          {/* List of Directives */}
          <div className="space-y-3 font-mono pt-4 border-t border-slate-200/80">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Issued Directives List</h3>
            {directives.map((d) => (
              <div key={d.id} className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-xs text-[#2563EB]">{d.id}</span>
                    <span className="font-bold text-xs text-[#111111]">{d.title}</span>
                    <span className="px-2 py-0.5 rounded text-[9px] bg-red-100 text-red-700 font-bold uppercase">{d.priority}</span>
                  </div>
                  <p className="text-xs text-slate-600 font-sans">{d.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase ${
                    d.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' : d.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {d.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* PART 6: AUDIT LOG (ADMIN ONLY) */}
        <section className="liquid-glass-card p-6 rounded-[28px] space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
            <div className="flex items-center gap-2 font-bold text-base text-[#111111]">
              <FileText size={18} className="text-amber-600" />
              <span>PRIVACY ACCESS LOG (RESTRICTED DATA UNLOCKS)</span>
            </div>
            <span className="font-mono text-xs font-bold text-amber-700">{auditLogs.length} Entries</span>
          </div>

          {auditLogs.length === 0 ? (
            <div className="p-6 text-center text-slate-400 font-mono text-xs">
              No RESTRICTED field unlocks recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px]">
                    <th className="p-3">Time</th>
                    <th className="p-3">User</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Intent</th>
                    <th className="p-3">Context</th>
                    <th className="p-3">Field Unlocked</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="p-3 text-slate-400">{log.timestamp}</td>
                      <td className="p-3 font-bold text-[#111111]">{log.name}</td>
                      <td className="p-3 text-blue-700 font-semibold">{log.role}</td>
                      <td className="p-3 text-amber-700">{log.intent}</td>
                      <td className="p-3 font-bold">{log.context}</td>
                      <td className="p-3 text-purple-700 font-bold">{log.field}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* D) LINK TO MISSION REPORT */}
        <section className="pt-2 flex justify-center">
          <button
            onClick={() => setIsReportOpen(true)}
            className="liquid-glass-button text-white px-8 py-3.5 rounded-full text-xs font-bold cursor-pointer inline-flex items-center gap-2"
          >
            <FileText size={16} />
            <span>View Mission Impact Report →</span>
          </button>
        </section>

      </div>

      {/* Mission Report Modal */}
      <AegisMissionReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        onRunAgain={() => setIsReportOpen(false)}
      />

    </div>
  )
}
