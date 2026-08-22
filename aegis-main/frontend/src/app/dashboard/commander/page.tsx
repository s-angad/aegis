'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, RefreshCw, MapPin, Users, Plus, Send, Clock, Layers } from 'lucide-react'
import { useProfileStore } from '@/stores/useProfileStore'
import { useSimulationStore } from '@/stores/simulationStore'
import { useCommandStore } from '@/stores/useCommandStore'
import { useAuditStore } from '@/stores/useAuditStore'
import { PrivacyGate } from '@/components/privacy/PrivacyGate'
import { IntentSelector } from '@/components/privacy/IntentSelector'
import { deriveCurrentContext } from '@/lib/privacy/contextHelper'

export default function CommanderDashboardPage() {
  const router = useRouter()
  const currentProfile = useProfileStore((state) => state.currentProfile)
  const { simulation, floodState } = useSimulationStore()
  const { directives, tasks, createTask } = useCommandStore()
  const { currentIntent } = useAuditStore()

  // Mini-form state for creating tasks from directives
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDesc, setTaskDesc] = useState('')
  const [assignee, setAssignee] = useState('Unit 12')
  const [activeDirectiveId, setActiveDirectiveId] = useState<string | null>(null)

  // ROUTE GUARD:
  // If currentProfile is null, redirect to /select-profile.
  // If currentProfile.role !== 'SECTOR_COMMANDER', redirect to "/".
  // TODO: redirect to role-specific dashboard once all dashboards exist
  useEffect(() => {
    if (!currentProfile) {
      router.push('/select-profile')
    } else if (currentProfile.role !== 'SECTOR_COMMANDER') {
      router.push('/')
    }
  }, [currentProfile, router])

  if (!currentProfile || currentProfile.role !== 'SECTOR_COMMANDER') {
    return null
  }

  const assignedSector = currentProfile.sector || '04'
  const context = deriveCurrentContext()

  // Filter directives targeting this Commander's sector ("04")
  const sectorDirectives = directives.filter(
    (d) => d.targetSector === assignedSector || d.targetSector === `Sector ${assignedSector}`
  )

  // Filter tasks created for this sector
  const sectorTasks = tasks.filter(
    (t) => t.assignedBy === currentProfile.name || t.assignedTo === 'Unit 12' || t.assignedTo === 'Unit 07'
  )

  const isRunning = simulation.is_running && !simulation.is_paused
  const floodedCells = floodState ? floodState.total_flooded_cells : 0

  const liveStatus =
    isRunning && floodedCells > 0
      ? 'ACTIVE RESPONSE'
      : isRunning
      ? 'MONITORING'
      : 'IDLE'

  const riskLevel = isRunning ? 'CRITICAL' : 'LOW'
  const surgeWaterLevelNumber = isRunning ? '2.4m Surge' : '0.0m Normal'
  const citizenCountAtRisk = isRunning ? '18,420 Citizens' : '0 Citizens'

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!taskTitle.trim()) return

    createTask({
      directiveId: activeDirectiveId,
      title: taskTitle,
      description: taskDesc || `Field task for Sector ${assignedSector}`,
      assignedTo: assignee, // Must match "Unit 12" or "Unit 07"
      assignedBy: currentProfile.name
    })

    setTaskTitle('')
    setTaskDesc('')
    setActiveDirectiveId(null)
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
                Signed in as <span className="text-[#2563EB] font-black">{currentProfile.name}</span> · Sector Commander — Sector {assignedSector}
              </h1>
              <p className="text-[10px] font-mono text-[#6E6E73] tracking-widest uppercase mt-0.5">
                SECTOR COMMAND OVERVIEW
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <IntentSelector />
            <button
              onClick={() => router.push('/select-profile')}
              className="liquid-glass-button text-white px-4 py-2 rounded-full text-xs font-bold cursor-pointer inline-flex items-center gap-1.5"
            >
              <RefreshCw size={12} />
              <span>Switch Profile</span>
            </button>
          </div>
        </header>

        {/* B) SECTOR STATUS PANEL (liquid-glass-card) */}
        <section className="liquid-glass-card p-6 rounded-[28px] space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
            <div className="flex items-center gap-2">
              <MapPin size={18} className="text-[#2563EB]" />
              <h2 className="text-base font-bold text-[#111111] font-sans">
                SECTOR {assignedSector} TELEMETRY & LIVE STATUS
              </h2>
            </div>
            <span className="font-mono text-xs font-bold text-[#2563EB] px-3 py-1 rounded-full bg-blue-50 border border-blue-200">
              {liveStatus}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
            {/* Risk Level */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-[#6E6E73] uppercase block">RISK LEVEL</span>
              <span className={`text-xl font-black block ${isRunning ? 'text-red-600' : 'text-emerald-600'}`}>
                {riskLevel}
              </span>
            </div>

            {/* PLACE 1: PRIVACY GATE — SENSITIVE Surge Water Level */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-[#6E6E73] uppercase block">SURGE / WATER DEPTH (SENSITIVE)</span>
              <div className="text-xl font-black text-[#2563EB]">
                <PrivacyGate
                  tier="SENSITIVE"
                  role={currentProfile.role}
                  context={context}
                  intent={currentIntent}
                  field="Sector 04 Water Surge Depth"
                  fallbackText="2.4m Surge"
                >
                  {surgeWaterLevelNumber}
                </PrivacyGate>
              </div>
            </div>

            {/* PLACE 2: PRIVACY GATE — RESTRICTED Citizen Count at Risk */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-[#6E6E73] uppercase block">CITIZENS AT RISK (RESTRICTED)</span>
              <div className="text-xl font-black text-purple-700">
                <PrivacyGate
                  tier="RESTRICTED"
                  role={currentProfile.role}
                  context={context}
                  intent={currentIntent}
                  field="Sector 04 Citizen Count at Risk"
                  fallbackText="18,420 Citizens"
                >
                  {citizenCountAtRisk}
                </PrivacyGate>
              </div>
            </div>
          </div>
        </section>

        {/* C) SCOPED DIGITAL TWIN VIEW */}
        <section className="space-y-3 font-mono">
          <div className="flex items-center justify-between text-xs text-[#6E6E73]">
            <span className="font-bold text-[#111111]">DIGITAL TWIN VISUALIZATION</span>
            <span>Showing full city view — sector-level filtering not yet supported</span>
          </div>

          {/* TODO: Add sector-level filtering to Digital Twin component in a later step */}
          <div className="w-full rounded-[28px] bg-gradient-to-b from-[#0B132B] to-[#050B16] liquid-glass-dark p-6 space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-slate-400 border-b border-white/10 pb-2 font-sans">
              <div className="flex items-center gap-2 font-bold text-white">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB] animate-pulse" />
                <span>● DIGITAL TWIN MAP — SECTOR {assignedSector} CONTEXT</span>
              </div>
              <span className="text-[10px]">16 SECTORS TOTAL</span>
            </div>

            <div className="relative w-full h-48 rounded-xl bg-[#070A12] overflow-hidden border border-white/10 flex items-center justify-center text-center p-4">
              <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#38BDF8_1px,transparent_1px)] [background-size:24px_24px]" />
              
              <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <path d="M 0 100 Q 300 50 600 120 T 1200 180" fill="none" stroke="#1D4ED8" strokeWidth="40" strokeLinecap="round" opacity="0.6" />
                <rect x="180" y="20" width="160" height="100" fill="rgba(255,69,58,0.25)" stroke="#FF453A" strokeWidth="1.5" />
                <text x="195" y="45" fill="#FF453A" fontSize="11" fontFamily="monospace" fontWeight="bold">SECTOR {assignedSector} (FOCUS)</text>
              </svg>

              <div className="relative z-10 bg-[#050B16]/80 backdrop-blur-md p-4 rounded-xl border border-white/10 max-w-sm space-y-1">
                <div className="text-xs font-bold text-cyan-300">SECTOR {assignedSector} MAP HIGHLIGHT</div>
                <div className="text-[11px] text-slate-300">Evacuation Corridor R21 Active</div>
              </div>
            </div>
          </div>
        </section>

        {/* PART 3: DIRECTIVES FROM ADMIN & CREATE TASK FORM */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 font-sans">
          
          {/* Directives List & Create Task Form (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="liquid-glass-card p-6 rounded-[28px] space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                <div className="flex items-center gap-2 font-bold text-base text-[#111111]">
                  <Layers size={18} className="text-[#2563EB]" />
                  <span>DIRECTIVES FROM ADMIN</span>
                </div>
                <span className="font-mono text-xs font-bold text-[#2563EB]">{sectorDirectives.length} Received</span>
              </div>

              {sectorDirectives.length === 0 ? (
                <div className="p-6 text-center text-slate-400 font-mono text-xs">
                  No directives received for Sector {assignedSector} yet.
                </div>
              ) : (
                <div className="space-y-3 font-mono">
                  {sectorDirectives.map((d) => (
                    <div key={d.id} className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-xs text-[#2563EB]">{d.id}</span>
                          <span className="font-bold text-xs text-[#111111]">{d.title}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[9px] bg-red-100 text-red-700 font-bold uppercase">{d.priority}</span>
                      </div>
                      <p className="text-xs text-slate-600 font-sans">{d.description}</p>
                      
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[10px] text-slate-500">Issued by: {d.issuedBy}</span>
                        <button
                          onClick={() => setActiveDirectiveId(activeDirectiveId === d.id ? null : d.id)}
                          className="px-3 py-1 rounded bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs transition-all cursor-pointer inline-flex items-center gap-1"
                        >
                          <Plus size={12} />
                          <span>{activeDirectiveId === d.id ? 'Cancel Task' : 'Create Task'}</span>
                        </button>
                      </div>

                      {/* Mini Task Form */}
                      {activeDirectiveId === d.id && (
                        <form onSubmit={handleCreateTask} className="mt-3 p-3 rounded-lg bg-slate-50 border border-blue-200 space-y-3 font-sans text-xs">
                          <div className="font-bold text-[#2563EB] font-mono text-[11px]">CREATE TASK FOR {d.id}</div>
                          <input
                            type="text"
                            value={taskTitle}
                            onChange={(e) => setTaskTitle(e.target.value)}
                            placeholder="Task Title (e.g. Deploy to Sector 04 evacuation zone)"
                            className="w-full p-2 rounded-md bg-white border border-slate-300 font-semibold outline-none"
                            required
                          />
                          <div className="space-y-1 font-mono">
                            <label className="text-[10px] font-bold text-slate-600 uppercase">Assign To Responder</label>
                            <select
                              value={assignee}
                              onChange={(e) => setAssignee(e.target.value)}
                              className="w-full p-2 rounded-md bg-white border border-slate-300 font-bold outline-none"
                            >
                              <option value="Unit 12">Unit 12</option>
                              <option value="Unit 07">Unit 07</option>
                            </select>
                          </div>
                          <button
                            type="submit"
                            className="w-full py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all cursor-pointer"
                          >
                            Assign Task to {assignee} →
                          </button>
                        </form>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Live My Field Responders List (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="liquid-glass-card p-6 rounded-[28px] space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                <div className="flex items-center gap-2 font-bold text-base text-[#111111]">
                  <Users size={18} className="text-[#2563EB]" />
                  <span>MY FIELD RESPONDERS</span>
                </div>
                <span className="font-mono text-xs text-slate-500">Real-Time Store</span>
              </div>

              <div className="space-y-3 font-mono text-xs">
                {['Unit 12', 'Unit 07'].map((unit) => {
                  const unitTasks = sectorTasks.filter((t) => t.assignedTo === unit)

                  return (
                    <div key={unit} className="p-4 rounded-xl bg-white border border-slate-200 space-y-2 shadow-2xs">
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-sm text-[#111111]">{unit}</span>
                        <span className="text-[10px] text-slate-500">{unitTasks.length} Active Tasks</span>
                      </div>

                      {unitTasks.length === 0 ? (
                        <p className="text-xs text-[#6E6E73] font-sans">No task assigned yet</p>
                      ) : (
                        unitTasks.map((t) => (
                          <div key={t.id} className="p-2.5 rounded bg-slate-50 border border-slate-200 space-y-1">
                            <div className="flex items-center justify-between font-bold">
                              <span className="text-[#2563EB]">{t.id}</span>
                              <span className={`px-2 py-0.5 rounded text-[9px] uppercase ${
                                t.status === 'COMPLETE' ? 'bg-emerald-100 text-emerald-800' : t.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {t.status}
                              </span>
                            </div>
                            <div className="font-semibold text-slate-800">{t.title}</div>
                          </div>
                        ))
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

        </section>

      </div>

    </div>
  )
}
