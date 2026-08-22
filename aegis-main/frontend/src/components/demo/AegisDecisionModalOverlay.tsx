'use client'

import React from 'react'
import { useAgentStore } from '@/stores/agentStore'
import { useSimulationStore } from '@/stores/simulationStore'
import { 
  Eye, CheckCircle2, TrendingUp, Compass, Zap, ShieldAlert, AlertTriangle, 
  MapPin, Users, Navigation, Radio, Check, ArrowRight, Activity, Cpu, Play
} from 'lucide-react'

export const AegisDecisionModalOverlay: React.FC = () => {
  const { oodaCycle, oodaStage, oodaStageResults } = useAgentStore()
  const { is_paused, is_running } = useSimulationStore((state) => state.simulation)

  // Only display modal overlay when simulation is running and paused specifically for active AEGIS processing
  const isAegisProcessing = is_running && is_paused && oodaStage !== 'IDLE' && oodaCycle > 0

  if (!isAegisProcessing) {
    return null
  }

  // Retrieve actual stage outputs from backend store
  const obs = oodaStageResults.OBSERVE || {}
  const ver = oodaStageResults.VERIFY || {}
  const pred = oodaStageResults.PREDICT || {}
  const dec = oodaStageResults.DECIDE || {}
  const act = oodaStageResults.ACT || {}

  // Determine current active stage index for top progress bar
  const stages = ['OBSERVE', 'VERIFY', 'PREDICT', 'DECIDE', 'ACT', 'COMPLETED']
  const stageMap: Record<string, string> = {
    OBSERVE: 'OBSERVE',
    OBSERVING: 'OBSERVE',
    VERIFY: 'VERIFY',
    VERIFYING: 'VERIFY',
    PREDICT: 'PREDICT',
    PREDICTING: 'PREDICT',
    DECIDE: 'DECIDE',
    DECIDING: 'DECIDE',
    ACT: 'ACT',
    ACTING: 'ACT',
    COMPLETED: 'COMPLETED',
  }
  const activeStageName = stageMap[oodaStage] || 'OBSERVE'
  const activeStageIndex = stages.indexOf(activeStageName)

  return (
    <div className="fixed top-24 left-6 z-[100] w-[520px] max-h-[82vh] transition-all duration-300 animate-fadeIn pointer-events-auto select-none">
      {/* REPOSITIONED AEGIS DECISION CONTAINER */}
      <div className="w-full bg-[#0d1424]/95 border-2 border-cyan-500/50 rounded-3xl shadow-2xl shadow-cyan-950/80 overflow-hidden flex flex-col font-sans text-slate-100 backdrop-blur-xl">
        
        {/* TOP SYSTEM STATUS BAR */}
        <div className="bg-slate-950/90 px-6 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>
            <div className="font-mono text-xs uppercase tracking-wider font-bold text-cyan-400 flex items-center gap-2">
              <span>⏸ SIMULATION PAUSED</span>
              <span className="text-slate-600">|</span>
              <span>AEGIS ANALYZING</span>
            </div>
          </div>
          <div className="font-mono text-xs font-bold text-slate-400 bg-slate-800/80 px-3 py-1 rounded-full border border-slate-700">
            CYCLE {oodaCycle || 1}
          </div>
        </div>

        {/* 5-STAGE PROGRESS STEPPER */}
        <div className="bg-slate-900/90 px-6 py-3 border-b border-slate-800/80">
          <div className="flex items-center justify-between font-mono text-[11px]">
            {[
              { id: 'OBSERVE', label: '01 OBSERVE' },
              { id: 'VERIFY', label: '02 VERIFY' },
              { id: 'PREDICT', label: '03 PREDICT' },
              { id: 'DECIDE', label: '04 DECIDE' },
              { id: 'ACT', label: '05 ACT' },
            ].map((step, idx) => {
              const isDone = activeStageIndex > idx || oodaStage === 'COMPLETED'
              const isCurrent = stages[activeStageIndex] === step.id && oodaStage !== 'COMPLETED'

              return (
                <div key={step.id} className="flex items-center gap-1.5">
                  <span className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                    isDone 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : isCurrent
                      ? 'bg-cyan-500 text-slate-950 font-extrabold animate-pulse'
                      : 'bg-slate-800 text-slate-500 border border-slate-700'
                  }`}>
                    {isDone ? '✓' : idx + 1}
                  </span>
                  <span className={`font-semibold ${
                    isDone 
                      ? 'text-emerald-400' 
                      : isCurrent 
                      ? 'text-cyan-300 font-bold' 
                      : 'text-slate-500'
                  }`}>
                    {step.id}
                  </span>
                  {idx < 4 && <ArrowRight size={10} className="text-slate-700 ml-1" />}
                </div>
              )
            })}
          </div>
        </div>

        {/* DYNAMIC STAGE CONTENT BODY */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* ───────────────────────────────────────────────────────────── */}
          {/* STAGE 1: OBSERVE POPUP */}
          {/* ───────────────────────────────────────────────────────────── */}
          {(activeStageName === 'OBSERVE' || (oodaStage === 'OBSERVING')) && (
            <div className="space-y-5 animate-fadeIn">
              <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                <div>
                  <div className="text-cyan-400 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Eye size={14} /> 01 — OBSERVE
                  </div>
                  <h3 className="text-xl font-bold text-slate-100">"What is happening right now?"</h3>
                </div>
                <span className="bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-xs font-mono font-bold px-2.5 py-1 rounded-md">
                  CONFIDENCE: {obs.confidencePct || 94}%
                </span>
              </div>

              {/* TELEMETRY GRID */}
              <div className="grid grid-cols-3 gap-3 font-mono">
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Water Level</div>
                  <div className="text-lg font-bold text-cyan-400 mt-0.5">{obs.waterLevel || 2.4} m ↑</div>
                </div>
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Flooded Area</div>
                  <div className="text-lg font-bold text-amber-400 mt-0.5">{obs.floodedArea || 31}%</div>
                </div>
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">People at Risk</div>
                  <div className="text-lg font-bold text-rose-400 mt-0.5">{(obs.peopleAtRisk || 4820).toLocaleString()}</div>
                </div>
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Blocked Roads</div>
                  <div className="text-lg font-bold text-slate-200 mt-0.5">{obs.blockedRoads || 6}</div>
                </div>
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Affected Sectors</div>
                  <div className="text-xs font-bold text-cyan-300 mt-1">{(obs.affectedSectors || ['Sector-4', 'Sector-7']).join(', ')}</div>
                </div>
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Critical Facilities</div>
                  <div className="text-lg font-bold text-amber-300 mt-0.5">2 Threatened</div>
                </div>
              </div>

              {/* AI OBSERVATION SUMMARY */}
              <div className="bg-cyan-950/20 border border-cyan-500/30 rounded-xl p-3.5 text-xs text-cyan-200 font-sans leading-relaxed">
                <span className="font-bold font-mono uppercase text-cyan-400 block mb-1">AEGIS Observation</span>
                "{obs.summary || 'Flooding is expanding rapidly toward commercial districts. Population exposure increasing.'}"
              </div>

              <div className="flex items-center justify-between text-xs font-mono text-emerald-400 pt-2 border-t border-slate-800">
                <span className="flex items-center gap-1.5 font-bold"><CheckCircle2 size={14} /> OBSERVATION COMPLETE</span>
                <span className="text-slate-500">TRANSITIONING TO VERIFY...</span>
              </div>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* STAGE 2: VERIFY POPUP */}
          {/* ───────────────────────────────────────────────────────────── */}
          {(activeStageName === 'VERIFY' || (oodaStage === 'VERIFYING')) && (
            <div className="space-y-5 animate-fadeIn">
              <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                <div>
                  <div className="text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 size={14} /> 02 — VERIFY
                  </div>
                  <h3 className="text-xl font-bold text-slate-100">"Can AEGIS trust what it observed?"</h3>
                </div>
                <span className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold px-2.5 py-1 rounded-md">
                  CONFIDENCE: {ver.confidencePct || 94}%
                </span>
              </div>

              {/* VERIFICATION CHECKLIST */}
              <div className="space-y-2 font-mono text-xs">
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-300">Flood expansion telemetry</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1"><Check size={14} /> Confirmed</span>
                </div>
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-300">Water level sensor reading</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1"><Check size={14} /> Confirmed</span>
                </div>
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-300">Road blockage & bridge integrity</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1"><Check size={14} /> Confirmed</span>
                </div>
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-300">Citizen report validation</span>
                  <span className="text-amber-400 font-bold flex items-center gap-1">
                    <AlertTriangle size={12} /> {ver.duplicatesRemoved || 4} Duplicates Filtered
                  </span>
                </div>
              </div>

              {/* AI VERIFICATION SUMMARY */}
              <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-3.5 text-xs text-emerald-200 font-sans leading-relaxed">
                <span className="font-bold font-mono uppercase text-emerald-400 block mb-1">AEGIS Verification</span>
                "{ver.summary || 'Current flood expansion is consistent with multi-sensor telemetry observations. 94% confidence score.'}"
              </div>

              <div className="flex items-center justify-between text-xs font-mono text-emerald-400 pt-2 border-t border-slate-800">
                <span className="flex items-center gap-1.5 font-bold"><CheckCircle2 size={14} /> VERIFICATION COMPLETE</span>
                <span className="text-slate-500">TRANSITIONING TO PREDICT...</span>
              </div>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* STAGE 3: PREDICT POPUP */}
          {/* ───────────────────────────────────────────────────────────── */}
          {(activeStageName === 'PREDICT' || (oodaStage === 'PREDICTING')) && (
            <div className="space-y-5 animate-fadeIn">
              <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                <div>
                  <div className="text-indigo-400 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp size={14} /> 03 — PREDICT
                  </div>
                  <h3 className="text-xl font-bold text-slate-100">"What is likely to happen next?"</h3>
                </div>
                <span className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 text-xs font-mono font-bold px-2.5 py-1 rounded-md">
                  LOOKAHEAD: +30 MIN
                </span>
              </div>

              {/* LOOKAHEAD TIMELINE */}
              <div className="grid grid-cols-3 gap-3 font-mono">
                <div className="bg-slate-950/60 p-3 rounded-xl border border-indigo-500/20 text-center">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">+3 SEC HORIZON</div>
                  <div className="text-base font-bold text-indigo-300 mt-1">{pred.plus10minPct || 38}% Flooded</div>
                </div>
                <div className="bg-slate-950/60 p-3 rounded-xl border border-indigo-500/30 text-center">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">+6 SEC HORIZON</div>
                  <div className="text-base font-bold text-amber-300 mt-1">{pred.plus20minPct || 47}% Flooded</div>
                </div>
                <div className="bg-slate-950/60 p-3 rounded-xl border border-indigo-500/40 text-center">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">+9 SEC HORIZON</div>
                  <div className="text-base font-bold text-rose-400 mt-1">{pred.plus30minPct || 58}% Flooded</div>
                </div>
              </div>

              {/* HIGH RISK SECTOR THREAT */}
              <div className="bg-rose-950/20 border border-rose-500/30 rounded-xl p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase text-rose-400 font-bold block">HIGH-RISK SECTOR</span>
                  <span className="text-base font-bold text-slate-100">{pred.targetSector || 'Sector-11'}</span>
                  <p className="text-xs text-rose-200 mt-0.5">Expected to become critical within ~6 simulation seconds.</p>
                </div>
                <div className="text-right font-mono text-xs">
                  <div className="text-slate-400">Proj. At Risk</div>
                  <div className="font-bold text-rose-400">6,240</div>
                </div>
              </div>

              {/* AI PREDICTION SUMMARY */}
              <div className="bg-indigo-950/20 border border-indigo-500/30 rounded-xl p-3.5 text-xs text-indigo-200 font-sans leading-relaxed">
                <span className="font-bold font-mono uppercase text-indigo-400 block mb-1">AEGIS Prediction</span>
                "{pred.predictedThreat || 'Without intervention, Sector 11 is expected to experience rapidly increasing population exposure.'}"
              </div>

              <div className="flex items-center justify-between text-xs font-mono text-emerald-400 pt-2 border-t border-slate-800">
                <span className="flex items-center gap-1.5 font-bold"><CheckCircle2 size={14} /> PREDICTION COMPLETE</span>
                <span className="text-slate-500">TRANSITIONING TO DECIDE...</span>
              </div>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* STAGE 4: DECIDE POPUP */}
          {/* ───────────────────────────────────────────────────────────── */}
          {(activeStageName === 'DECIDE' || (oodaStage === 'DECIDING')) && (
            <div className="space-y-5 animate-fadeIn">
              <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                <div>
                  <div className="text-amber-400 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Compass size={14} /> 04 — DECIDE
                  </div>
                  <h3 className="text-xl font-bold text-slate-100">"What should AEGIS do?"</h3>
                </div>
                <span className="bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold px-2.5 py-1 rounded-md">
                  CONFIDENCE: {dec.confidencePct || 94}%
                </span>
              </div>

              {/* OPTIONS EVALUATED GRID */}
              <div className="space-y-2 font-mono text-xs">
                <div className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Counterfactual Options Evaluated</div>
                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">Option A: Do Nothing</span>
                  <span className="text-rose-400 font-bold">Projected Risk: HIGH (89/100)</span>
                </div>
                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">Option B: Dispatch Rescue Boat</span>
                  <span className="text-amber-400 font-bold">Projected Risk: MEDIUM (58/100)</span>
                </div>
                <div className="bg-emerald-950/30 p-3 rounded-xl border border-emerald-500/50 flex items-center justify-between">
                  <div>
                    <span className="text-emerald-400 font-bold block">✓ OPTION C: EVACUATE + RESCUE BOAT (SELECTED)</span>
                    <span className="text-[11px] text-slate-300 font-sans">Minimizes casualties & protects Sector 11 evacuees</span>
                  </div>
                  <span className="text-emerald-300 font-bold text-sm font-mono">-37% Risk</span>
                </div>
              </div>

              {/* REASONING BULLET POINTS */}
              <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-3.5 text-xs text-amber-200 font-sans space-y-1.5">
                <span className="font-bold font-mono uppercase text-amber-400 block mb-1">Decision Reasoning</span>
                <div className="flex items-center gap-2 text-slate-200">
                  <span className="text-amber-400">•</span> High population exposure in target sector
                </div>
                <div className="flex items-center gap-2 text-slate-200">
                  <span className="text-amber-400">•</span> Flood predicted to intensify within 6 simulation seconds
                </div>
                <div className="flex items-center gap-2 text-slate-200">
                  <span className="text-amber-400">•</span> Rescue Boat 02 and Shelter 03 capacity verified available
                </div>
              </div>

              <div className="flex items-center justify-between text-xs font-mono text-emerald-400 pt-2 border-t border-slate-800">
                <span className="flex items-center gap-1.5 font-bold"><CheckCircle2 size={14} /> DECISION COMPLETE</span>
                <span className="text-slate-500">TRANSITIONING TO ACT...</span>
              </div>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* STAGE 5: ACT POPUP */}
          {/* ───────────────────────────────────────────────────────────── */}
          {(activeStageName === 'ACT' || (oodaStage === 'ACTING')) && (
            <div className="space-y-5 animate-fadeIn">
              <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                <div>
                  <div className="text-rose-400 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Zap size={14} /> 05 — ACT
                  </div>
                  <h3 className="text-xl font-bold text-slate-100">"Executing emergency response..."</h3>
                </div>
                <span className="bg-rose-500/10 text-rose-300 border border-rose-500/30 text-xs font-mono font-bold px-2.5 py-1 rounded-md">
                  EXECUTING
                </span>
              </div>

              {/* ACTION PLAN CHECKLIST */}
              <div className="space-y-2 font-mono text-xs">
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-slate-200 font-bold block">🚤 Rescue Boat 04</span>
                    <span className="text-[10px] text-slate-400">Destination: Sector 11</span>
                  </div>
                  <span className="text-emerald-400 font-bold border border-emerald-500/30 px-2 py-0.5 rounded bg-emerald-500/10">
                    DISPATCHED
                  </span>
                </div>
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-slate-200 font-bold block">🏠 Shelter 03</span>
                    <span className="text-[10px] text-slate-400">Capacity: 1,000 evacuees</span>
                  </div>
                  <span className="text-emerald-400 font-bold border border-emerald-500/30 px-2 py-0.5 rounded bg-emerald-500/10">
                    ACTIVATED
                  </span>
                </div>
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-slate-200 font-bold block">🚧 Evacuation Rerouting</span>
                    <span className="text-[10px] text-slate-400">Route R14 blocked → Route R21 selected</span>
                  </div>
                  <span className="text-cyan-400 font-bold border border-cyan-500/30 px-2 py-0.5 rounded bg-cyan-500/10">
                    REROUTED
                  </span>
                </div>
              </div>

              {/* AI ACTION SUMMARY */}
              <div className="bg-rose-950/20 border border-rose-500/30 rounded-xl p-3.5 text-xs text-rose-200 font-sans leading-relaxed">
                <span className="font-bold font-mono uppercase text-rose-400 block mb-1">AEGIS Action Summary</span>
                "{act.summary || 'Rescue Boat 04 dispatched via A* route R21 -> R18. Shelter 03 activated. Emergency public warnings transmitted.'}"
              </div>

              <div className="flex items-center justify-between text-xs font-mono text-emerald-400 pt-2 border-t border-slate-800">
                <span className="flex items-center gap-1.5 font-bold"><CheckCircle2 size={14} /> ACTION COMPLETE</span>
                <span className="text-slate-500 font-bold animate-pulse">PREPARING TO RESUME...</span>
              </div>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* STAGE COMPLETE CARD */}
          {/* ───────────────────────────────────────────────────────────── */}
          {oodaStage === 'COMPLETED' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-xl p-4 text-center space-y-2">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 mb-1">
                  <Check size={20} />
                </div>
                <h3 className="text-lg font-bold text-slate-100">AEGIS CYCLE {oodaCycle || 1} COMPLETE ✓</h3>
                <p className="text-xs text-slate-300 font-sans max-w-md mx-auto">
                  Response executed cleanly. Live city state updated. Flood simulation resuming for next 3 seconds...
                </p>
              </div>

              <div className="grid grid-cols-4 gap-2 font-mono text-[11px] text-slate-300">
                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">OBSERVED</span>
                  Sector 11 Expansion
                </div>
                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">PREDICTED</span>
                  Critical in ~6s
                </div>
                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">DECIDED</span>
                  Evacuate + Boat 04
                </div>
                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">ACTED</span>
                  Dispatched & Rerouted
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-xs font-mono text-cyan-400 pt-2 border-t border-slate-800">
                <Play size={14} className="animate-pulse" />
                <span className="font-bold uppercase tracking-wider">▶ RESUMING SIMULATION</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
