'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, RefreshCw, Clock, MapPin, CheckCircle2, Play, Check } from 'lucide-react'
import { useProfileStore } from '@/stores/useProfileStore'
import { useSimulationStore } from '@/stores/simulationStore'
import { useCommandStore, TaskStatus } from '@/stores/useCommandStore'
import { useAuditStore } from '@/stores/useAuditStore'
import { PrivacyGate } from '@/components/privacy/PrivacyGate'
import { IntentSelector } from '@/components/privacy/IntentSelector'
import { deriveCurrentContext } from '@/lib/privacy/contextHelper'

export default function ResponderDashboardPage() {
  const router = useRouter()
  const currentProfile = useProfileStore((state) => state.currentProfile)
  const { simulation, floodState } = useSimulationStore()
  const { tasks, updateTaskStatus } = useCommandStore()
  const { currentIntent } = useAuditStore()

  // ROUTE GUARD:
  // If currentProfile is null, redirect to /select-profile.
  // If currentProfile.role !== 'FIELD_RESPONDER', redirect to "/".
  // TODO: redirect to proper role-specific dashboard once router is wired in final step
  useEffect(() => {
    if (!currentProfile) {
      router.push('/select-profile')
    } else if (currentProfile.role !== 'FIELD_RESPONDER') {
      router.push('/')
    }
  }, [currentProfile, router])

  if (!currentProfile || currentProfile.role !== 'FIELD_RESPONDER') {
    return null
  }

  const assignedSector = currentProfile.sector || '04'
  const reportsTo = currentProfile.reportsTo || 'Sector 04 Commander'
  const context = deriveCurrentContext()

  // Filter tasks assigned to THIS responder name (e.g. "Unit 12")
  const myTasks = tasks.filter((t) => t.assignedTo === currentProfile.name)

  const isRunning = simulation.is_running && !simulation.is_paused
  const sectorRiskLevel = isRunning ? 'CRITICAL' : 'LOW'
  const detailedRiskInformation = isRunning ? 'Sector 04 Flood Surge Velocity 1.8m/s (High Hazard Zone)' : 'Normal River Flow'

  const handleNextStatus = (taskId: string, currentStatus: TaskStatus) => {
    if (currentStatus === 'ASSIGNED') {
      updateTaskStatus(taskId, 'ACKNOWLEDGED')
    } else if (currentStatus === 'ACKNOWLEDGED') {
      updateTaskStatus(taskId, 'IN_PROGRESS')
    } else if (currentStatus === 'IN_PROGRESS') {
      updateTaskStatus(taskId, 'COMPLETE')
    }
  }

  return (
    <div className="relative min-h-screen w-full bg-[#F7F7F5] text-[#111111] font-sans flex flex-col justify-between selection:bg-[#2563EB] selection:text-white">
      
      {/* Background Aurora */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[8%] w-[520px] h-[520px] rounded-full bg-blue-400/25 blur-[130px]" />
      </div>

      {/* Main Minimal Container (Max 900px for sparse responder view) */}
      <div className="w-full max-w-[900px] mx-auto px-6 py-8 space-y-8 flex-1">
        
        {/* A) HEADER STRIP */}
        <header className="w-full liquid-glass-navbar px-6 py-4 rounded-full flex flex-wrap items-center justify-between gap-4 shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-emerald-600/10 text-emerald-700">
              <Shield size={20} />
            </div>
            <div>
              <h1 className="text-base font-bold text-[#111111] leading-none">
                Signed in as <span className="text-emerald-700 font-black">{currentProfile.name}</span> · Field Responder — {reportsTo}
              </h1>
              <p className="text-[10px] font-mono text-[#6E6E73] tracking-widest uppercase mt-0.5">
                TACTICAL FIELD RESPONDER VIEW
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

        {/* B) MY TASKS PANEL (liquid-glass-card) — REAL ACTIVE TASKS */}
        <section className="liquid-glass-card p-6 rounded-[28px] space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
            <div className="flex items-center gap-2 font-bold text-base text-[#111111]">
              <Clock size={18} className="text-[#2563EB]" />
              <span>MY ASSIGNED TASKS ({myTasks.length})</span>
            </div>
            <span className="font-mono text-xs text-emerald-700 font-bold">Active Store</span>
          </div>

          {myTasks.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-400 font-mono text-xs">
              No tasks currently assigned to {currentProfile.name}.
            </div>
          ) : (
            <div className="space-y-4 font-mono text-xs">
              {myTasks.map((t) => (
                <div
                  key={t.id}
                  className={`p-5 rounded-2xl border transition-all space-y-3 ${
                    t.status === 'COMPLETE'
                      ? 'bg-emerald-50/70 border-emerald-300'
                      : t.status === 'IN_PROGRESS'
                      ? 'bg-blue-50/70 border-[#2563EB] ring-2 ring-[#2563EB]/20'
                      : 'bg-white border-slate-200 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm text-[#2563EB]">{t.id}</span>
                      <span className="font-bold text-sm text-[#111111]">{t.title}</span>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                        t.status === 'COMPLETE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : t.status === 'IN_PROGRESS'
                          ? 'bg-blue-100 text-blue-800 animate-pulse'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 font-sans">{t.description}</p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-[10px] text-slate-500 font-sans">
                      Assigned by: <strong className="text-slate-800">{t.assignedBy}</strong>
                    </span>

                    {/* Functional Status Buttons */}
                    {t.status !== 'COMPLETE' ? (
                      <button
                        onClick={() => handleNextStatus(t.id, t.status)}
                        className={`px-4 py-2 rounded-full font-bold text-xs transition-all cursor-pointer shadow-sm flex items-center gap-1.5 ${
                          t.status === 'ASSIGNED'
                            ? 'bg-[#2563EB] hover:bg-blue-700 text-white'
                            : t.status === 'ACKNOWLEDGED'
                            ? 'bg-amber-600 hover:bg-amber-700 text-white'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        {t.status === 'ASSIGNED' && (
                          <>
                            <Check size={14} />
                            <span>Acknowledge</span>
                          </>
                        )}
                        {t.status === 'ACKNOWLEDGED' && (
                          <>
                            <Play size={14} />
                            <span>Start</span>
                          </>
                        )}
                        {t.status === 'IN_PROGRESS' && (
                          <>
                            <CheckCircle2 size={14} />
                            <span>Complete</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="flex items-center gap-1 text-emerald-700 font-bold text-xs bg-emerald-100 px-3 py-1 rounded-full">
                        <CheckCircle2 size={13} />
                        <span>Completed</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* C) SECTOR STATUS — READ ONLY, MINIMAL */}
        <section className="liquid-glass-card p-5 rounded-[24px] space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-[#2563EB]" />
              <span className="font-bold text-[#111111]">SECTOR {assignedSector} RISK LEVEL</span>
            </div>

            <span
              className={`px-3 py-1 rounded-full font-black uppercase border text-xs ${
                isRunning
                  ? 'bg-red-500/20 text-red-700 border-red-400/50'
                  : 'bg-emerald-500/20 text-emerald-700 border-emerald-400/50'
              }`}
            >
              {sectorRiskLevel}
            </span>
          </div>

          {/* PLACE 3: PRIVACY GATE — SENSITIVE Sector Risk Detail */}
          <div className="pt-2 border-t border-slate-200/80 font-sans text-xs">
            <span className="font-bold text-slate-500 font-mono text-[10px] uppercase block mb-1">
              Detailed Hazard Analysis (SENSITIVE)
            </span>
            <PrivacyGate
              tier="SENSITIVE"
              role={currentProfile.role}
              context={context}
              intent={currentIntent}
              field="Sector Risk Detail Analysis"
              fallbackText="Sector Flood Velocity & Hazard Telemetry"
            >
              <span className="text-slate-800 font-semibold">{detailedRiskInformation}</span>
            </PrivacyGate>
          </div>
        </section>

      </div>

    </div>
  )
}
