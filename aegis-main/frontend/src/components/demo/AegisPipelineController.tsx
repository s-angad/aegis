'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Eye, CheckSquare, Brain, Zap, Truck, ShieldAlert, ShieldCheck, Play, Pause,
  ArrowRight, CheckCircle2, RotateCcw, Award, Radio, AlertTriangle, ChevronRight, RefreshCw, Check, Sparkles, Clock, Bot
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
  const { simulation, setSimulation } = useSimulationStore()
  const { oodaCycle, oodaStage, setOodaState, clearAll } = useAgentStore()
  const { scenarioSeed, setScenarioSeed, setBaselineMetrics, setAegisMetrics } = useDemoStore()

  const [aegisState, setAegisState] = useState<AegisState>('CITY_NORMAL')
  const [showReportModal, setShowReportModal] = useState(false)
  const [completedSteps, setCompletedSteps] = useState<string[]>([])
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [activeRunNumber, setActiveRunNumber] = useState<1 | 2>(1)
  const [countdown, setCountdown] = useState<number | null>(null)

  const [resetSteps, setResetSteps] = useState({
    saved: false,
    resetting: false,
    initializing: false,
    connecting: false,
    ready: false,
  })

  const tick = simulation.tick || 0
  const isRunning = simulation.is_running && !simulation.is_paused

  // Sync active state when simulation starts from header or bottom bar
  useEffect(() => {
    if (isRunning && activeRunNumber === 1 && aegisState === 'CITY_NORMAL') {
      setAegisState('BASELINE_RUNNING')
    }
  }, [isRunning, activeRunNumber, aegisState])

  // Internal Fallback Tick Progression Loop
  const tickTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isRunning && (aegisState === 'BASELINE_RUNNING' || aegisState === 'RESPONSE_RUNNING')) {
      tickTimerRef.current = setInterval(() => {
        setSimulation({
          tick: Math.min(20, (simulation.tick || 0) + 1),
          is_running: true,
          status: 'running',
        })
      }, 900)
    } else {
      if (tickTimerRef.current) clearInterval(tickTimerRef.current)
    }

    return () => {
      if (tickTimerRef.current) clearInterval(tickTimerRef.current)
    }
  }, [isRunning, aegisState, simulation.tick, setSimulation])

  // Main Tick Progression & Completion Observer
  useEffect(() => {
    // 1. RUN 01 (BASELINE COMPLETE) at tick >= 20
    if (activeRunNumber === 1 && tick >= 20 && aegisState !== 'BASELINE_COMPLETE' && aegisState !== 'AEGIS_INITIALIZING' && aegisState !== 'RESPONSE_RUNNING' && aegisState !== 'FINAL_RESULT') {
      sim.pause()
      setSimulation({ is_running: false, is_paused: true, status: 'completed' })

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
      setCountdown(5) // Auto-countdown timer
    }

    // 2. RUN 02 (AEGIS 5-AGENT AI CONTROLLED RESPONSE) OODA STAGE TRIGGERS ACCORDING TO TICK
    if (activeRunNumber === 2 && aegisState === 'RESPONSE_RUNNING') {
      if (tick === 2 && !completedSteps.includes('OBSERVE')) {
        setCompletedSteps((prev) => [...prev, 'OBSERVE'])
        setOodaState(1, 'OBSERVING')
      } else if (tick === 5 && !completedSteps.includes('VERIFY')) {
        setCompletedSteps((prev) => [...prev, 'VERIFY'])
        setOodaState(1, 'VERIFYING')
      } else if (tick === 8 && !completedSteps.includes('PREDICT')) {
        setCompletedSteps((prev) => [...prev, 'PREDICT'])
        setOodaState(1, 'PREDICTING')
      } else if (tick === 12 && !completedSteps.includes('DECIDE')) {
        setCompletedSteps((prev) => [...prev, 'DECIDE'])
        setOodaState(1, 'DECIDING')
      } else if (tick === 15 && !completedSteps.includes('ACT')) {
        setCompletedSteps((prev) => [...prev, 'ACT'])
        setOodaState(1, 'ACTING')
      }

      // RUN 02 COMPLETE at tick 20
      if (tick >= 20) {
        sim.pause()
        setSimulation({ is_running: false, is_paused: true, status: 'completed' })

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
  }, [tick, activeRunNumber, aegisState, sim, setSimulation, setBaselineMetrics, setAegisMetrics, completedSteps, setOodaState])

  // Countdown handler for automatic transition to Run 02
  useEffect(() => {
    if (aegisState === 'BASELINE_COMPLETE' && countdown !== null && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((prev) => (prev !== null && prev > 0 ? prev - 1 : 0))
      }, 1000)
      return () => clearTimeout(timer)
    } else if (aegisState === 'BASELINE_COMPLETE' && countdown === 0) {
      setCountdown(null)
      handleStartAegisMode()
    }
  }, [aegisState, countdown])

  // START RUN 01 — BASELINE (NO AEGIS)
  const handleStartBaseline = () => {
    setActiveRunNumber(1)
    setCompletedSteps([])
    setSimulation({ tick: 0, is_running: true, is_paused: false, status: 'running' })
    setAegisState('BASELINE_RUNNING')

    sim.createRun('flood', 1010).then(() => {
      sim.start('flood', 1010, 'baseline')
    })
  }

  // START RUN 02 — AEGIS CONTROLLED (5 MULTI-AGENT SWARM)
  const handleStartAegisMode = () => {
    setCountdown(null)
    setIsTransitioning(true)
    setAegisState('AEGIS_INITIALIZING')
    setActiveRunNumber(2)
    setCompletedSteps([])
    clearAll()

    const newSeed = Math.floor(1000 + Math.random() * 9000)
    setScenarioSeed(newSeed)

    setResetSteps({ saved: true, resetting: true, initializing: false, connecting: false, ready: false })

    setTimeout(() => {
      setResetSteps((prev) => ({ ...prev, initializing: true, connecting: true }))
      setTimeout(() => {
        setResetSteps((prev) => ({ ...prev, ready: true }))
        setSimulation({ tick: 0, is_running: true, is_paused: false, status: 'running' })
        setAegisState('RESPONSE_RUNNING')
        setIsTransitioning(false)

        sim.createRun('flood', newSeed).then(() => {
          sim.start('flood', newSeed, 'aegis')
        })
      }, 1000)
    }, 1000)
  }

  const handleRunNewScenario = () => {
    const newSeed = Math.floor(1000 + Math.random() * 9000)
    setScenarioSeed(newSeed)
    setActiveRunNumber(1)
    setCompletedSteps([])
    setSimulation({ tick: 0, is_running: false, is_paused: false, status: 'idle' })
    setAegisState('CITY_NORMAL')
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
              ? 'RUN 01 · BASELINE FLOOD SIMULATION (WITHOUT AEGIS AI)'
              : `RUN 02 · AEGIS 5-AGENT AI SWARM IN CONTROL (SCENARIO #${scenarioSeed})`}
          </span>
        </div>
      </div>

      {/* SIDE DECISION TIMELINE — ONLY ACTIVE IN RUN 02 (WITH 5 AI AGENTS) */}
      {activeRunNumber === 2 && (
        <div className="fixed top-36 right-6 z-40 w-80 bg-[#0d1424]/95 border-2 border-cyan-500/50 rounded-2xl p-4 shadow-2xl backdrop-blur-md text-xs font-mono select-none space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <Bot size={15} className="animate-bounce text-cyan-300" />
              5-AGENT AEGIS SWARM
            </span>
            <span className="text-[10px] text-slate-400 font-bold uppercase">
              CYCLE {oodaCycle || 1} · T+{tick.toString().padStart(2, '0')}
            </span>
          </div>

          <div className="space-y-2">
            <div className={`flex items-center justify-between p-2.5 rounded-xl border ${
              completedSteps.includes('OBSERVE') || oodaStage === 'COMPLETED'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : aegisState === 'AEGIS_OBSERVE' || oodaStage === 'OBSERVING'
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold animate-pulse'
                : 'bg-[#070B14] border-slate-800 text-slate-500'
            }`}>
              <div className="flex items-center gap-2">
                <span>{completedSteps.includes('OBSERVE') ? '✓' : '●'}</span>
                <span>01 RECON AGENT</span>
              </div>
              <span className="text-[10px] opacity-90 font-bold">
                {oodaStage === 'OBSERVING' ? 'ANALYZING CV' : completedSteps.includes('OBSERVE') ? 'COMPLETED' : 'PENDING'}
              </span>
            </div>

            <div className={`flex items-center justify-between p-2.5 rounded-xl border ${
              completedSteps.includes('VERIFY') || oodaStage === 'COMPLETED'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : aegisState === 'AEGIS_VERIFY' || oodaStage === 'VERIFYING'
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold animate-pulse'
                : 'bg-[#070B14] border-slate-800 text-slate-500'
            }`}>
              <div className="flex items-center gap-2">
                <span>{completedSteps.includes('VERIFY') ? '✓' : '●'}</span>
                <span>02 VERIFIER AGENT</span>
              </div>
              <span className="text-[10px] opacity-90 font-bold">
                {oodaStage === 'VERIFYING' ? 'AUDITING SENSORS' : completedSteps.includes('VERIFY') ? 'COMPLETED' : 'PENDING'}
              </span>
            </div>

            <div className={`flex items-center justify-between p-2.5 rounded-xl border ${
              completedSteps.includes('PREDICT') || oodaStage === 'COMPLETED'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : aegisState === 'AEGIS_PREDICT' || oodaStage === 'PREDICTING'
                ? 'bg-purple-500/20 border-purple-400 text-purple-300 font-bold animate-pulse'
                : 'bg-[#070B14] border-slate-800 text-slate-500'
            }`}>
              <div className="flex items-center gap-2">
                <span>{completedSteps.includes('PREDICT') ? '✓' : '●'}</span>
                <span>03 PREDICTOR AGENT</span>
              </div>
              <span className="text-[10px] opacity-90 font-bold">
                {oodaStage === 'PREDICTING' ? 'NEURAL SURGE' : completedSteps.includes('PREDICT') ? 'LOOKAHEAD' : 'PENDING'}
              </span>
            </div>

            <div className={`flex items-center justify-between p-2.5 rounded-xl border ${
              completedSteps.includes('DECIDE') || oodaStage === 'COMPLETED'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : aegisState === 'AEGIS_DECIDE' || oodaStage === 'DECIDING'
                ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold animate-pulse'
                : 'bg-[#070B14] border-slate-800 text-slate-500'
            }`}>
              <div className="flex items-center gap-2">
                <span>{completedSteps.includes('DECIDE') ? '✓' : '●'}</span>
                <span>04 ORCHESTRATOR AGENT</span>
              </div>
              <span className="text-[10px] opacity-90 font-bold">
                {oodaStage === 'DECIDING' ? 'DECISION MATRIX' : completedSteps.includes('DECIDE') ? 'EVALUATED' : 'PENDING'}
              </span>
            </div>

            <div className={`flex items-center justify-between p-2.5 rounded-xl border ${
              completedSteps.includes('ACT') || oodaStage === 'COMPLETED'
                ? 'bg-emerald-500/10 border-emerald-400 text-emerald-300'
                : aegisState === 'AEGIS_ACT' || oodaStage === 'ACTING'
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold animate-pulse'
                : 'bg-[#070B14] border-slate-800 text-slate-500'
            }`}>
              <div className="flex items-center gap-2">
                <span>{completedSteps.includes('ACT') ? '✓' : '●'}</span>
                <span>05 ROUTER & DISPATCH AGENT</span>
              </div>
              <span className="text-[10px] opacity-90 font-bold">
                {oodaStage === 'ACTING' ? 'DISPATCHING UNITS' : completedSteps.includes('ACT') ? 'DISPATCHED' : 'PENDING'}
              </span>
            </div>
          </div>

          <button
            onClick={handleStartAegisMode}
            disabled={isTransitioning}
            className="w-full py-2.5 px-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shadow-md"
          >
            <RotateCcw size={13} />
            <span>RE-RUN AEGIS 5-AGENT AI SWARM</span>
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

      {/* RUN 01 BASELINE COMPLETE & AI TAKEOVER BRIEFING DASHBOARD */}
      {aegisState === 'BASELINE_COMPLETE' && (
        <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0d1424] border-2 border-amber-500/70 rounded-3xl p-8 max-w-2xl w-full shadow-2xl text-center space-y-6 text-white font-sans animate-fadeIn">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-400 font-mono text-xs font-bold border border-amber-500/40 shadow-xs">
              <ShieldAlert size={16} />
              <span>RUN 01 BASELINE COMPLETE — NO AI PROTECTION APPLIED</span>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Baseline Flood Damage Summary
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 font-normal max-w-lg mx-auto">
                Without AI intervention, uncoordinated flood response resulted in widespread sector inundation and severe route blockages.
              </p>
            </div>

            {/* BASELINE IMPACT STATS GRID */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono font-bold text-center">
              <div className="p-3.5 rounded-2xl bg-[#070B14] border border-amber-500/30">
                <span className="text-2xl sm:text-3xl font-black text-amber-400 block">73%</span>
                <span className="text-[10px] text-slate-400 uppercase font-bold">FLOODED AREA</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#070B14] border border-red-500/30">
                <span className="text-2xl sm:text-3xl font-black text-red-400 block">18,420</span>
                <span className="text-[10px] text-slate-400 uppercase font-bold">PEOPLE AT RISK</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#070B14] border border-orange-500/30">
                <span className="text-2xl sm:text-3xl font-black text-orange-400 block">65</span>
                <span className="text-[10px] text-slate-400 uppercase font-bold">ROADS BLOCKED</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#070B14] border border-slate-800">
                <span className="text-2xl sm:text-3xl font-black text-slate-500 block">0</span>
                <span className="text-[10px] text-slate-400 uppercase font-bold">PROTECTED</span>
              </div>
            </div>

            {/* AUTOMATIC COUNTDOWN BADGE */}
            <div className="p-4 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-between font-mono text-xs text-cyan-300">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-cyan-400 animate-spin" />
                <span>Auto-starting RUN 02 (AEGIS 5-Agent AI Swarm)...</span>
              </div>
              <div className="px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/50 font-black text-sm text-cyan-200 flex items-center gap-1.5">
                <Clock size={14} />
                <span>{countdown !== null ? `${countdown}s` : 'STARTING'}</span>
              </div>
            </div>

            {/* DIRECT MANUAL OVERRIDE LAUNCH BUTTON */}
            <button
              onClick={handleStartAegisMode}
              disabled={isTransitioning}
              className="w-full py-4 rounded-2xl font-mono text-sm sm:text-base font-black text-black bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-500 hover:scale-[1.01] transition-all cursor-pointer shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-3 border border-white/20"
            >
              <Zap size={18} fill="currentColor" />
              <span>START SIMULATION WITH AEGIS AI (5 AI AGENTS SWARM) →</span>
            </button>
          </div>
        </div>
      )}

      {/* INITIALIZING AEGIS RESET PROCEDURE TRANSITION SCREEN */}
      {aegisState === 'AEGIS_INITIALIZING' && (
        <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0d1424] border border-cyan-500/40 rounded-3xl p-8 max-w-lg w-full shadow-2xl space-y-6 text-white font-mono">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <span className="text-3xl animate-bounce">⚡</span>
              <div>
                <h3 className="text-lg font-bold text-cyan-400 uppercase">AEGIS RUN 02 RESET PROCEDURE</h3>
                <p className="text-xs text-slate-400 font-sans">Initializing 5-Agent AI Swarm for scenario #{scenarioSeed}</p>
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
                  SPAWNING 5 MULTI-AGENT SWARM INSTANCES
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
                  AEGIS 5-AGENT AI SWARM READY
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
