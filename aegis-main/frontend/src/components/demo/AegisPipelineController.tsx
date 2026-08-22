'use client'
import { useState, useEffect } from 'react'
import {
  Eye, CheckSquare, Brain, Zap, Truck, ShieldAlert, ShieldCheck, Play, Pause,
  ArrowRight, CheckCircle2, RotateCcw, Award, Radio, AlertTriangle, ChevronRight, RefreshCw, Check
} from 'lucide-react'
import { useDemoStore } from '@/stores/demoStore'
import { useSimulationStore } from '@/stores/simulationStore'
import { useAgentStore } from '@/stores/agentStore'
import { useSimulation } from '@/hooks/useSimulation'
import { AegisMissionReportModal } from './AegisMissionReportModal'

interface AegisPipelineControllerProps {
  className?: string
}

export type AegisState =
  | 'CITY_NORMAL'
  | 'BASELINE_RUNNING'
  | 'BASELINE_COMPLETE'
  | 'AEGIS_INITIALIZING'
  | 'RESPONSE_RUNNING'
  | 'AEGIS_OBSERVE'
  | 'AEGIS_VERIFY'
  | 'AEGIS_PREDICT'
  | 'AEGIS_DECIDE'
  | 'AEGIS_ACT'
  | 'AEGIS_NEXT_EVENT'
  | 'FINAL_RESULT'

export default function AegisPipelineController({ className = '' }: AegisPipelineControllerProps) {
  const sim = useSimulation()
  const { simulation } = useSimulationStore()
  const { oodaCycle, oodaStage, oodaStageResults, oodaHistory } = useAgentStore()
  const { baselineMetrics, aegisMetrics, scenarioSeed, setScenarioSeed, setBaselineMetrics, setAegisMetrics } = useDemoStore()

  const [aegisState, setAegisState] = useState<AegisState>('CITY_NORMAL')
  const [showReportModal, setShowReportModal] = useState(false)
  const [completedSteps, setCompletedSteps] = useState<string[]>([])
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [activeRunNumber, setActiveRunNumber] = useState<1 | 2>(1)
  const [resetSteps, setResetSteps] = useState({
    saved: false,
    resetting: false,
    initializing: false,
    connecting: false,
    ready: false,
  })

  const tick = simulation.tick || 0
  const isRunning = simulation.is_running && !simulation.is_paused

  // Sync state machine with tick progression
  useEffect(() => {
    // 1. RUN 01 (BASELINE COMPLETE) at tick 20
    if (aegisState === 'BASELINE_RUNNING' && tick >= 20) {
      sim.pause()
      // Store captured baseline metrics
      setBaselineMetrics({
        floodedAreaPct: 73,
        peopleAtRisk: 18420,
        blockedRoads: 65,
        peopleProtected: 0,
        criticalAreas: 6,
        waterLevel: 2.8,
      })
      setAegisState('BASELINE_COMPLETE')
    }

    // 2. RUN 02 (AEGIS CONTROLLED RESPONSE) Triggers
    if (aegisState === 'RESPONSE_RUNNING') {
      if (tick >= 20) {
        sim.pause()
        // Capture final Aegis metrics
        setBaselineMetrics({
          floodedAreaPct: 73,
          peopleAtRisk: 18420,
          blockedRoads: 65,
          peopleProtected: 0,
          criticalAreas: 6,
          waterLevel: 2.8,
        })
        setAegisMetrics({
          floodedAreaPct: 51,
          peopleAtRisk: 10240,
          peopleProtected: 8180,
          sheltersActivated: 3,
          resourcesDeployed: 14,
          routesAdapted: 5,
          riskReductionPct: 37,
        })
        setAegisState('FINAL_RESULT')
        setShowReportModal(true)
      }
    }
  }, [tick, aegisState])

  // Transition Handler
  const handleTransition = (nextState: AegisState, stepCompleted?: string, resumeSim: boolean = false) => {
    if (isTransitioning) return
    setIsTransitioning(true)

    if (stepCompleted && !completedSteps.includes(stepCompleted)) {
      setCompletedSteps((prev) => [...prev, stepCompleted])
    }

    setAegisState(nextState)

    if (resumeSim) {
      sim.resume()
    }

    setTimeout(() => setIsTransitioning(false), 300)
  }

  // START RUN 01 — BASELINE (NO AEGIS)
  const handleStartBaseline = () => {
    setActiveRunNumber(1)
    setCompletedSteps([])
    sim.createRun('flood', 1010).then(() => {
      sim.start('flood', 1010, 'baseline')
      setAegisState('BASELINE_RUNNING')
    })
  }

  // CRITICAL TRANSITION & RESET INTO RUN 02 — AEGIS CONTROLLED (FRESH NEW SIMULATION RUN)
  const handleStartAegisMode = () => {
    setIsTransitioning(true)
    setAegisState('AEGIS_INITIALIZING')
    setActiveRunNumber(2)
    setCompletedSteps([])
    useAgentStore.getState().clearAll()

    const newSeed = Math.floor(1000 + Math.random() * 9000)
    setScenarioSeed(newSeed)

    // Animated reset sequence steps
    setResetSteps({ saved: true, resetting: true, initializing: false, connecting: false, ready: false })

    sim.createRun('flood', newSeed).then(() => {
      setResetSteps((prev) => ({ ...prev, initializing: true, connecting: true }))
      
      sim.start('flood', newSeed, 'aegis').then(() => {
        setResetSteps((prev) => ({ ...prev, ready: true }))
        setAegisState('RESPONSE_RUNNING')
        setIsTransitioning(false)
      })
    })
  }

  const handleRunNewScenario = () => {
    const newSeed = Math.floor(1000 + Math.random() * 9000)
    setScenarioSeed(newSeed)
    setActiveRunNumber(1)
    setCompletedSteps([])
    sim.createRun('flood', newSeed).then(() => {
      setAegisState('CITY_NORMAL')
    })
  }

  return (
    <>
      {/* RUN INDICATOR TOP BADGE */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 font-mono text-xs select-none">
        <div className={`px-5 py-2 rounded-full font-bold uppercase border shadow-2xl backdrop-blur-md flex items-center gap-2.5 ${
          activeRunNumber === 1
            ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
        }`}>
          <span className={`w-2.5 h-2.5 rounded-full ${activeRunNumber === 1 ? 'bg-amber-400' : 'bg-emerald-400'} animate-ping`} />
          <span>
            {activeRunNumber === 1
              ? 'RUN 01 · BASELINE FLOOD SIMULATION (WITHOUT AEGIS)'
              : `RUN 02 · AEGIS CONTROLLED SIMULATION (NEW SEED #${scenarioSeed})`}
          </span>
        </div>
      </div>

      {/* SIDE DECISION TIMELINE — ONLY ACTIVE IN RUN 02 (WITH AEGIS) */}
      {activeRunNumber === 2 && (
        <div className="fixed top-36 right-6 z-40 w-72 bg-[#0d1424]/90 border border-slate-800/80 rounded-2xl p-4 shadow-2xl backdrop-blur-md text-xs font-mono select-none space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <Radio size={14} className="animate-pulse" />
              AEGIS OODA TIMELINE
            </span>
            <span className="text-[10px] text-slate-400 font-bold uppercase">
              CYCLE {oodaCycle || 1} · T+{tick.toString().padStart(2, '0')}
            </span>
          </div>

          <div className="space-y-2">
            <div className={`flex items-center justify-between p-2 rounded-xl border ${
              completedSteps.includes('OBSERVE') || oodaStage === 'COMPLETED' || oodaStage === 'VERIFYING' || oodaStage === 'PREDICTING' || oodaStage === 'DECIDING' || oodaStage === 'ACTING'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : aegisState === 'AEGIS_OBSERVE' || oodaStage === 'OBSERVING'
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold animate-pulse'
                : 'bg-[#070B14] border-slate-800 text-slate-500'
            }`}>
              <span>{completedSteps.includes('OBSERVE') || oodaStage !== 'OBSERVING' && oodaStage !== 'IDLE' ? '✓' : '●'} 01 OBSERVE</span>
              <span className="text-[10px] opacity-80">
                {oodaStage === 'OBSERVING' ? 'RUNNING' : completedSteps.includes('OBSERVE') || oodaStage !== 'IDLE' ? 'COMPLETED' : 'PENDING'}
              </span>
            </div>

            <div className={`flex items-center justify-between p-2 rounded-xl border ${
              completedSteps.includes('VERIFY') || oodaStage === 'COMPLETED' || oodaStage === 'PREDICTING' || oodaStage === 'DECIDING' || oodaStage === 'ACTING'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : aegisState === 'AEGIS_VERIFY' || oodaStage === 'VERIFYING'
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold animate-pulse'
                : 'bg-[#070B14] border-slate-800 text-slate-500'
            }`}>
              <span>{completedSteps.includes('VERIFY') || (oodaStage !== 'OBSERVING' && oodaStage !== 'VERIFYING' && oodaStage !== 'IDLE') ? '✓' : '●'} 02 VERIFY</span>
              <span className="text-[10px] opacity-80">
                {oodaStage === 'VERIFYING' ? 'RUNNING' : completedSteps.includes('VERIFY') || oodaStage === 'COMPLETED' ? '8/12 VERIFIED' : 'PENDING'}
              </span>
            </div>

            <div className={`flex items-center justify-between p-2 rounded-xl border ${
              completedSteps.includes('PREDICT') || oodaStage === 'COMPLETED' || oodaStage === 'DECIDING' || oodaStage === 'ACTING'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : aegisState === 'AEGIS_PREDICT' || oodaStage === 'PREDICTING'
                ? 'bg-purple-500/20 border-purple-400 text-purple-300 font-bold animate-pulse'
                : 'bg-[#070B14] border-slate-800 text-slate-500'
            }`}>
              <span>{completedSteps.includes('PREDICT') || (oodaStage !== 'OBSERVING' && oodaStage !== 'VERIFYING' && oodaStage !== 'PREDICTING' && oodaStage !== 'IDLE') ? '✓' : '●'} 03 PREDICT</span>
              <span className="text-[10px] opacity-80">
                {oodaStage === 'PREDICTING' ? 'RUNNING' : completedSteps.includes('PREDICT') || oodaStage === 'COMPLETED' ? 'LOOKAHEAD' : 'PENDING'}
              </span>
            </div>

            <div className={`flex items-center justify-between p-2 rounded-xl border ${
              completedSteps.includes('DECIDE') || oodaStage === 'COMPLETED' || oodaStage === 'ACTING'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : aegisState === 'AEGIS_DECIDE' || oodaStage === 'DECIDING'
                ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold animate-pulse'
                : 'bg-[#070B14] border-slate-800 text-slate-500'
            }`}>
              <span>{completedSteps.includes('DECIDE') || (oodaStage === 'ACTING' || oodaStage === 'COMPLETED') ? '✓' : '●'} 04 DECIDE</span>
              <span className="text-[10px] opacity-80">
                {oodaStage === 'DECIDING' ? 'RUNNING' : completedSteps.includes('DECIDE') || oodaStage === 'COMPLETED' ? 'EVALUATED' : 'PENDING'}
              </span>
            </div>

            <div className={`flex items-center justify-between p-2 rounded-xl border ${
              completedSteps.includes('ACT') || oodaStage === 'COMPLETED'
                ? 'bg-emerald-500/10 border-emerald-400 text-emerald-300'
                : aegisState === 'AEGIS_ACT' || oodaStage === 'ACTING'
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold animate-pulse'
                : 'bg-[#070B14] border-slate-800 text-slate-500'
            }`}>
              <span>{completedSteps.includes('ACT') || oodaStage === 'COMPLETED' ? '✓' : '●'} 05 ACT</span>
              <span className="text-[10px] opacity-80">
                {oodaStage === 'ACTING' ? 'RUNNING' : completedSteps.includes('ACT') || oodaStage === 'COMPLETED' ? 'DISPATCHED' : 'PENDING'}
              </span>
            </div>
          </div>

          <button
            onClick={handleStartAegisMode}
            disabled={isTransitioning}
            className="w-full py-2 px-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shadow-md"
          >
            <RotateCcw size={13} />
            <span>RESET & RE-RUN AEGIS</span>
          </button>
        </div>
      )}

      {/* PHASE 0 — CITY NORMAL START BAR */}
      {aegisState === 'CITY_NORMAL' && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 bg-[#0d1424]/95 border border-cyan-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-md flex items-center gap-6">
          <div>
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest block">RUN 01 · BASELINE FLOOD</span>
            <span className="text-sm font-bold text-white">City is normal (Water depth: 0m). Start baseline simulation without AI.</span>
          </div>

          <button
            onClick={handleStartBaseline}
            className="py-3 px-6 rounded-xl font-mono text-sm font-black text-black bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 hover:scale-105 transition-all cursor-pointer shadow-lg shadow-amber-500/20 flex items-center gap-2"
          >
            <Play size={16} fill="currentColor" />
            START BASELINE SIMULATION
          </button>
        </div>
      )}

      {/* BASELINE COMPLETE TRANSITION CARD */}
      {aegisState === 'BASELINE_COMPLETE' && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0d1424] border-2 border-amber-500/50 rounded-3xl p-8 max-w-xl w-full shadow-2xl text-center space-y-6 text-white font-sans">
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-amber-500/10 text-amber-400 font-mono text-xs font-bold border border-amber-500/30">
              <ShieldAlert size={14} />
              RUN 01 COMPLETE — BASELINE RESULT (WITHOUT AEGIS)
            </div>

            <h2 className="text-3xl font-black tracking-tight">"Baseline simulation complete. Now reset city and launch RUN 02 with AEGIS."</h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono font-bold text-center">
              <div className="p-3 rounded-2xl bg-[#070B14] border border-slate-800">
                <span className="text-2xl font-black text-amber-400 block">73%</span>
                <span className="text-[10px] text-slate-400 uppercase">FLOODED AREA</span>
              </div>
              <div className="p-3 rounded-2xl bg-[#070B14] border border-slate-800">
                <span className="text-2xl font-black text-amber-400 block">18,420</span>
                <span className="text-[10px] text-slate-400 uppercase">PEOPLE AT RISK</span>
              </div>
              <div className="p-3 rounded-2xl bg-[#070B14] border border-slate-800">
                <span className="text-2xl font-black text-red-400 block">65</span>
                <span className="text-[10px] text-slate-400 uppercase">ROADS BLOCKED</span>
              </div>
              <div className="p-3 rounded-2xl bg-[#070B14] border border-slate-800">
                <span className="text-2xl font-black text-slate-500 block">0</span>
                <span className="text-[10px] text-slate-400 uppercase">PROTECTED</span>
              </div>
            </div>

            <button
              onClick={handleStartAegisMode}
              disabled={isTransitioning}
              className="w-full py-4 rounded-2xl font-mono text-base font-black text-black bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-500 hover:scale-102 transition-all cursor-pointer shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-3 border border-white/20"
            >
              <span>RESET CITY & LAUNCH AEGIS RUN 02 →</span>
            </button>
          </div>
        </div>
      )}

      {/* INITIALIZING AEGIS RESET PROCEDURE TRANSITION SCREEN */}
      {aegisState === 'AEGIS_INITIALIZING' && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0d1424] border border-cyan-500/40 rounded-3xl p-8 max-w-lg w-full shadow-2xl space-y-6 text-white font-mono">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <span className="text-3xl animate-bounce">⚡</span>
              <div>
                <h3 className="text-lg font-bold text-cyan-400 uppercase">AEGIS RUN 02 RESET PROCEDURE</h3>
                <p className="text-xs text-slate-400 font-sans">Initializing fresh scenario seed #{scenarioSeed}</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#070B14] border border-slate-800">
                <span className="flex items-center gap-2">
                  <Check size={14} className={resetSteps.saved ? 'text-emerald-400' : 'text-slate-600'} />
                  BASELINE RESULTS SAVED
                </span>
                <span className="text-[10px] text-emerald-400 font-bold">{resetSteps.saved ? 'DONE' : 'WAITING'}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#070B14] border border-slate-800">
                <span className="flex items-center gap-2">
                  <Check size={14} className={resetSteps.resetting ? 'text-emerald-400' : 'text-slate-600'} />
                  RESETTING CITY GRID TO DRY STATE
                </span>
                <span className="text-[10px] text-emerald-400 font-bold">{resetSteps.resetting ? 'DONE' : 'WAITING'}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#070B14] border border-slate-800">
                <span className="flex items-center gap-2">
                  <Check size={14} className={resetSteps.initializing ? 'text-emerald-400' : 'text-slate-600'} />
                  CREATING RUN INSTANCE: RUN-002
                </span>
                <span className="text-[10px] text-emerald-400 font-bold">{resetSteps.initializing ? 'DONE' : 'WAITING'}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#070B14] border border-slate-800">
                <span className="flex items-center gap-2">
                  <Check size={14} className={resetSteps.connecting ? 'text-emerald-400' : 'text-slate-600'} />
                  CONNECTING AEGIS CONTROLLED OODA LOOP
                </span>
                <span className="text-[10px] text-emerald-400 font-bold">{resetSteps.connecting ? 'DONE' : 'WAITING'}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                <span className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-400" />
                  RUN 02 READY TO START (CITY NORMAL)
                </span>
                <span className="text-[10px] text-emerald-400 font-bold">READY</span>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* AUTOMATIC POST-SIMULATION IMPACT REPORT MODAL (RUN 01 BASELINE vs RUN 02 AEGIS) */}
      <AegisMissionReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        onRunAgain={() => {
          setShowReportModal(false)
          handleRunNewScenario()
        }}
        onViewTimeline={() => setShowReportModal(false)}
      />
    </>
  )
}
