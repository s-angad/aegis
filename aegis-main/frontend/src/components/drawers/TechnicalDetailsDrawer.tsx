'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAgentStore } from '@/stores/agentStore'
import { useReconStore } from '@/stores/reconStore'
import { useResourceStore } from '@/stores/resourceStore'
import { useSimulationStore } from '@/stores/simulationStore'
import { X, Cpu, Eye, LifeBuoy, Home, Terminal, Radio, ShieldCheck } from 'lucide-react'
import { AuditLogTab } from '@/components/privacy/AuditLogTab'

interface TechnicalDetailsDrawerProps {
  isOpen: boolean
  onClose: () => void
  initialTab?: 'agents' | 'recon' | 'resources' | 'shelters' | 'privacy'
}

export default function TechnicalDetailsDrawer({ isOpen, onClose, initialTab = 'agents' }: TechnicalDetailsDrawerProps) {
  const [tab, setTab] = useState<'agents' | 'recon' | 'resources' | 'shelters' | 'privacy'>(initialTab)

  const { decisions, prediction, alerts } = useAgentStore()
  const { latestObservation, history } = useReconStore()
  const { resources, shelters } = useResourceStore()
  const { simulation } = useSimulationStore()

  const safeDecisions = Array.isArray(decisions) ? decisions : []
  const safeResources = Array.isArray(resources) ? resources : []
  const safeShelters = Array.isArray(shelters) ? shelters : []

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 select-none"
          />

          {/* Slide-over Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 bottom-0 w-[520px] max-w-full bg-[#0d1322] border-l border-slate-800 z-50 flex flex-col font-sans select-none text-white shadow-2xl"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#090d16]">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-cyan-400" />
                <h2 className="text-sm font-mono font-bold tracking-wider text-white uppercase">
                  SYSTEM TECHNICAL DETAILS & TELEMETRY
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Tab Selector */}
            <div className="flex border-b border-slate-800 bg-[#090d16]/50 p-1 gap-1 text-[11px] font-mono overflow-x-auto">
              <button
                onClick={() => setTab('agents')}
                className={`flex-1 py-2 px-2 rounded-lg font-bold flex items-center justify-center gap-1 transition-all whitespace-nowrap ${
                  tab === 'agents' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Cpu size={13} />
                OODA Agents
              </button>
              <button
                onClick={() => setTab('recon')}
                className={`flex-1 py-2 px-2 rounded-lg font-bold flex items-center justify-center gap-1 transition-all whitespace-nowrap ${
                  tab === 'recon' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Eye size={13} />
                CV Recon
              </button>
              <button
                onClick={() => setTab('resources')}
                className={`flex-1 py-2 px-2 rounded-lg font-bold flex items-center justify-center gap-1 transition-all whitespace-nowrap ${
                  tab === 'resources' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <LifeBuoy size={13} />
                Resources
              </button>
              <button
                onClick={() => setTab('shelters')}
                className={`flex-1 py-2 px-2 rounded-lg font-bold flex items-center justify-center gap-1 transition-all whitespace-nowrap ${
                  tab === 'shelters' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Home size={13} />
                Shelters
              </button>
              <button
                onClick={() => setTab('privacy')}
                className={`flex-1 py-2 px-2 rounded-lg font-bold flex items-center justify-center gap-1 transition-all whitespace-nowrap ${
                  tab === 'privacy' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShieldCheck size={13} />
                Privacy Audit
              </button>
            </div>

            {/* Tab Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs scrollbar-thin scrollbar-thumb-slate-800">
              {/* TAB 1: OODA AGENTS DEEP-DIVE */}
              {tab === 'agents' && (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300">
                    <span className="text-cyan-400 font-bold block mb-1">OODA LOOP STATE</span>
                    Sim Tick: T+{simulation.tick} · Pipeline: Sentinel → Verifier → Severity → Predictor → PolicyCommander → Allocator → Router → Communicator
                  </div>

                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Raw Agent Activity Log</h3>
                  {safeDecisions.length === 0 ? (
                    <p className="text-slate-500 text-[11px]">No active agent decisions recorded yet.</p>
                  ) : (
                    safeDecisions.map((d) => (
                      <div key={d.id} className="p-3 rounded-xl bg-[#080c14] border border-slate-800/80 space-y-1">
                        <div className="flex items-center justify-between text-cyan-400 font-bold">
                          <span>{d.agent_name}</span>
                          <span className="text-slate-500 text-[10px]">{new Date(d.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <div className="text-white text-[11px]">{d.action}</div>
                        <div className="text-slate-400 text-[10px]">{d.description}</div>
                        {d.sop_reference && (
                          <div className="text-indigo-400 text-[10px] mt-1">SOP: {d.sop_reference}</div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 2: OPENCV RECON DETAILS */}
              {tab === 'recon' && (
                <div className="space-y-3">
                  {latestObservation ? (
                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 text-[11px]">
                      <div className="text-cyan-400 font-bold">LATEST OBSERVATION</div>
                      <div>Water Level: {latestObservation.estimated_water_level}m</div>
                      <div>Flood Speed: {latestObservation.estimated_velocity} m/s</div>
                      <div>Flooded Area: {latestObservation.flood_area_percent}%</div>
                    </div>
                  ) : (
                    <p className="text-slate-500 text-[11px]">No CV observations recorded yet.</p>
                  )}
                </div>
              )}

              {/* TAB 3: RESOURCES TABLE */}
              {tab === 'resources' && (
                <div className="space-y-2">
                  {safeResources.map((r) => (
                    <div key={r.id} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-[11px]">
                      <div>
                        <div className="text-white font-bold">{r.name}</div>
                        <div className="text-slate-400 text-[10px]">{r.type.replace(/_/g, ' ')} · Crew: {r.crew_count}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                        r.status === 'available' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {r.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 4: SHELTERS TABLE */}
              {tab === 'shelters' && (
                <div className="space-y-2">
                  {safeShelters.map((s) => (
                    <div key={s.id} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] space-y-1">
                      <div className="flex justify-between font-bold text-white">
                        <span>{s.name}</span>
                        <span className="text-cyan-400">{s.sector}</span>
                      </div>
                      <div className="text-slate-400 text-[10px]">
                        Occupancy: {s.current_occupancy} / {s.capacity} ({s.capacity > 0 ? Math.round((s.current_occupancy / s.capacity) * 100) : 0}%)
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 5: PRIVACY AUDIT TRAIL */}
              {tab === 'privacy' && (
                <AuditLogTab />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
