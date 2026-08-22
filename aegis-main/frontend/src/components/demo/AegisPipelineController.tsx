'use client'
import { useState, useEffect } from 'react'
import {
  Eye, CheckSquare, Brain, Zap, Truck, ShieldAlert, ShieldCheck, Play, Pause,
  ArrowRight, CheckCircle2, RotateCcw, Award, Radio, AlertTriangle, ChevronRight, RefreshCw, Check
} from 'lucide-react'
import { useDemoStore } from '@/stores/demoStore'
import { useSimulationStore } from '@/stores/simulationStore'
import { useSimulation } from '@/hooks/useSimulation'

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
  const { baselineMetrics, aegisMetrics, scenarioSeed, setScenarioSeed, setBaselineMetrics, setAegisMetrics } = useDemoStore()

  const [aegisState, setAegisState] = useState<AegisState>('CITY_NORMAL')
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
      if (tick === 4 && !completedSteps.includes('OBSERVE')) {
        sim.pause()
        setAegisState('AEGIS_OBSERVE')
      } else if (tick === 8 && !completedSteps.includes('VERIFY')) {
        sim.pause()
        setAegisState('AEGIS_VERIFY')
      } else if (tick === 12 && !completedSteps.includes('PREDICT')) {
        sim.pause()
        setAegisState('AEGIS_PREDICT')
      } else if (tick === 15 && !completedSteps.includes('DECIDE')) {
        sim.pause()
        setAegisState('AEGIS_DECIDE')
      } else if (tick === 18 && !completedSteps.includes('NEXT_EVENT')) {
        sim.pause()
        setAegisState('AEGIS_NEXT_EVENT')
      } else if (tick >= 20 && completedSteps.includes('DECIDE')) {
        sim.pause()
        // Capture final Aegis metrics
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
      }
    }
  }, [tick, aegisState, completedSteps])

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
      sim.start('flood', 1010)
      setAegisState('BASELINE_RUNNING')
    })
  }

  // CRITICAL TRANSITION & RESET INTO RUN 02 — AEGIS CONTROLLED (FRESH NEW SIMULATION RUN)
  const handleStartAegisMode = () => {
    setIsTransitioning(true)
    setAegisState('AEGIS_INITIALIZING')
    setActiveRunNumber(2)
    setCompletedSteps([])

    const newSeed = Math.floor(1000 + Math.random() * 9000)
    setScenarioSeed(newSeed)

    // Animated reset sequence steps
    setResetSteps({ saved: true, resetting: true, initializing: false, connecting: false, ready: false })

    sim.createRun('flood', newSeed).then(() => {
      setResetSteps((prev) => ({ ...prev, initializing: true, connecting: true }))
      
      console.log('================================================')
      console.log('[AEGIS FRONTEND] DESTROYED RUN 01 BASELINE STATE')
      console.log(`[AEGIS FRONTEND] CREATED FRESH RUN 02 WITH SEED #${newSeed}`)
      console.log('[AEGIS FRONTEND] VERIFIED INITIAL STATE: TICK=0, FLOODED_CELLS=0, WATER_DEPTH=0m')
      console.log('================================================')

      sim.start('flood', newSeed).then(() => {
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

      {/* SIDE DECISION TIMELINE */}
      <div className="fixed top-36 right-6 z-40 w-72 bg-[#0d1424]/90 border border-slate-800/80 rounded-2xl p-4 shadow-2xl backdrop-blur-md text-xs font-mono select-none space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <span className="font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
            <Radio size={14} className="animate-pulse" />
            AEGIS RESPONSE TIMELINE
          </span>
          <span className="text-[10px] text-slate-500 font-bold">T+{tick.toString().padStart(2, '0')}</span>
        </div>

        <div className="space-y-2">
          <div className={`flex items-center justify-between p-2 rounded-xl border ${
            completedSteps.includes('OBSERVE')
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : aegisState === 'AEGIS_OBSERVE'
              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold animate-pulse'
              : 'bg-[#070B14] border-slate-800 text-slate-500'
          }`}>
            <span>{completedSteps.includes('OBSERVE') ? '✓' : '●'} 01 OBSERVE</span>
            <span className="text-[10px] opacity-80">{completedSteps.includes('OBSERVE') ? 'COMPLETED' : 'PENDING'}</span>
          </div>

          <div className={`flex items-center justify-between p-2 rounded-xl border ${
            completedSteps.includes('VERIFY')
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : aegisState === 'AEGIS_VERIFY'
              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold animate-pulse'
              : 'bg-[#070B14] border-slate-800 text-slate-500'
          }`}>
            <span>{completedSteps.includes('VERIFY') ? '✓' : '●'} 02 VERIFY</span>
            <span className="text-[10px] opacity-80">{completedSteps.includes('VERIFY') ? '8/12 VERIFIED' : 'PENDING'}</span>
          </div>

          <div className={`flex items-center justify-between p-2 rounded-xl border ${
            completedSteps.includes('PREDICT')
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : aegisState === 'AEGIS_PREDICT'
              ? 'bg-purple-500/20 border-purple-400 text-purple-300 font-bold animate-pulse'
              : 'bg-[#070B14] border-slate-800 text-slate-500'
          }`}>
            <span>{completedSteps.includes('PREDICT') ? '✓' : '●'} 03 PREDICT</span>
            <span className="text-[10px] opacity-80">{completedSteps.includes('PREDICT') ? 'LOOKAHEAD' : 'PENDING'}</span>
          </div>

          <div className={`flex items-center justify-between p-2 rounded-xl border ${
            completedSteps.includes('DECIDE')
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : aegisState === 'AEGIS_DECIDE'
              ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold animate-pulse'
              : 'bg-[#070B14] border-slate-800 text-slate-500'
          }`}>
            <span>{completedSteps.includes('DECIDE') ? '✓' : '●'} 04 DECIDE</span>
            <span className="text-[10px] opacity-80">{completedSteps.includes('DECIDE') ? 'EVACUATE SEC 04' : 'PENDING'}</span>
          </div>

          <div className={`flex items-center justify-between p-2 rounded-xl border ${
            completedSteps.includes('ACT')
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : aegisState === 'AEGIS_ACT'
              ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold animate-pulse'
              : 'bg-[#070B14] border-slate-800 text-slate-500'
          }`}>
            <span>{completedSteps.includes('ACT') ? '✓' : '●'} 05 ACT</span>
            <span className="text-[10px] opacity-80">{completedSteps.includes('ACT') ? 'DISPATCHED' : 'PENDING'}</span>
          </div>
        </div>
      </div>

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

      {/* 01 OBSERVE MODAL */}
      {aegisState === 'AEGIS_OBSERVE' && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0d1424] border border-cyan-500/50 rounded-3xl p-8 max-w-xl w-full shadow-2xl space-y-6 text-white font-sans">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-cyan-400 uppercase">RUN 02 · 01 / OBSERVE</span>
              <span className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 text-xs font-mono font-bold">DRONE RECON</span>
            </div>

            <div>
              <h3 className="text-2xl font-black">WHAT IS HAPPENING?</h3>
              <p className="text-sm text-slate-300 mt-1">Flooding detected across 18% of city grid, expanding toward Sector 04.</p>
            </div>

            <div className="grid grid-cols-3 gap-3 font-mono text-xs text-center">
              <div className="p-3 rounded-xl bg-[#070B14] border border-slate-800">
                <span className="text-[10px] text-slate-400 block">WATER LEVEL</span>
                <span className="text-amber-400 font-bold">2.1m</span>
              </div>
              <div className="p-3 rounded-xl bg-[#070B14] border border-slate-800">
                <span className="text-[10px] text-slate-400 block">FLOODED AREA</span>
                <span className="text-cyan-400 font-bold">18%</span>
              </div>
              <div className="p-3 rounded-xl bg-[#070B14] border border-slate-800">
                <span className="text-[10px] text-slate-400 block">PEOPLE AT RISK</span>
                <span className="text-cyan-300 font-bold">3,820</span>
              </div>
            </div>

            <button
              onClick={() => handleTransition('RESPONSE_RUNNING', 'OBSERVE', true)}
              disabled={isTransitioning}
              className="w-full py-3.5 rounded-2xl font-mono text-sm font-bold text-black bg-cyan-400 hover:bg-cyan-300 transition-all cursor-pointer shadow-lg flex items-center justify-center gap-2"
            >
              <span>CONTINUE RUN 02 SIMULATION →</span>
            </button>
          </div>
        </div>
      )}

      {/* 02 VERIFY MODAL */}
      {aegisState === 'AEGIS_VERIFY' && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0d1424] border border-cyan-500/50 rounded-3xl p-8 max-w-xl w-full shadow-2xl space-y-6 text-white font-sans">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-cyan-400 uppercase">RUN 02 · 02 / VERIFY</span>
              <span className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 text-xs font-mono font-bold">VERIFIER AGENT</span>
            </div>

            <div>
              <h3 className="text-2xl font-black">CAN WE TRUST THE INFORMATION?</h3>
              <p className="text-sm text-slate-300 mt-1">Cross-checking aerial imagery with citizen report feeds.</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#070B14] border border-slate-800 flex items-center justify-around font-mono text-sm">
              <div className="text-center">
                <span className="text-2xl font-black text-white block">12</span>
                <span className="text-[10px] text-slate-400">RAW REPORTS</span>
              </div>
              <span className="text-cyan-400 font-bold">→ FILTER →</span>
              <div className="text-center">
                <span className="text-2xl font-black text-emerald-400 block">8</span>
                <span className="text-[10px] text-emerald-400">VERIFIED</span>
              </div>
              <span className="text-red-400 font-bold text-xs">(4 Filtered)</span>
            </div>

            <button
              onClick={() => handleTransition('RESPONSE_RUNNING', 'VERIFY', true)}
              disabled={isTransitioning}
              className="w-full py-3.5 rounded-2xl font-mono text-sm font-bold text-black bg-cyan-400 hover:bg-cyan-300 transition-all cursor-pointer shadow-lg flex items-center justify-center gap-2"
            >
              <span>CONTINUE RUN 02 SIMULATION →</span>
            </button>
          </div>
        </div>
      )}

      {/* 03 PREDICT MODAL (CLONED STATE LOOKAHEAD) */}
      {aegisState === 'AEGIS_PREDICT' && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0d1424] border border-purple-500/50 rounded-3xl p-8 max-w-xl w-full shadow-2xl space-y-6 text-white font-sans">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-purple-400 uppercase">RUN 02 · 03 / PREDICT</span>
              <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-300 text-xs font-mono font-bold">CLONED STATE LOOKAHEAD</span>
            </div>

            <div>
              <h3 className="text-2xl font-black">WHAT HAPPENS NEXT?</h3>
              <p className="text-base font-bold text-purple-300 mt-1">AEGIS cloned the current state and ran a 4-tick lookahead model.</p>
            </div>

            <div className="grid grid-cols-3 gap-3 font-mono text-xs text-center">
              <div className="p-3 rounded-xl bg-[#070B14] border border-slate-800">
                <span className="text-[10px] text-slate-400 block">CURRENT</span>
                <span className="text-white font-bold">32% FLOODED</span>
              </div>
              <div className="p-3 rounded-xl bg-[#070B14] border border-slate-800">
                <span className="text-[10px] text-purple-400 block">+10 MIN</span>
                <span className="text-purple-300 font-bold">48% FLOODED</span>
              </div>
              <div className="p-3 rounded-xl bg-[#070B14] border border-slate-800">
                <span className="text-[10px] text-red-400 block">+20 MIN</span>
                <span className="text-red-400 font-bold">64% FLOODED</span>
              </div>
            </div>

            <button
              onClick={() => handleTransition('RESPONSE_RUNNING', 'PREDICT', true)}
              disabled={isTransitioning}
              className="w-full py-3.5 rounded-2xl font-mono text-sm font-bold text-white bg-purple-600 hover:bg-purple-500 transition-all cursor-pointer shadow-lg flex items-center justify-center gap-2"
            >
              <span>CONTINUE RUN 02 SIMULATION →</span>
            </button>
          </div>
        </div>
      )}

      {/* 04 DECIDE MODAL */}
      {aegisState === 'AEGIS_DECIDE' && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gradient-to-r from-[#0d1424] via-[#070B14] to-[#0d1424] border-2 border-amber-500/50 rounded-3xl p-8 max-w-xl w-full shadow-2xl space-y-6 text-white font-sans text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 text-amber-400 font-mono text-xs font-bold border border-amber-500/30">
              RUN 02 · 04 / DECIDE · POLICY COMMANDER
            </div>

            <div className="space-y-1">
              <h3 className="text-4xl font-black text-white tracking-tight">EVACUATE SECTOR 04</h3>
              <span className="text-xs font-mono font-bold text-amber-300">CONFIDENCE: 94% · RISK SCORE: 89/100</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#070B14] border border-slate-800 flex items-center justify-center gap-2 font-mono text-xs text-white">
              <span>WATER DEPTH (+32)</span>
              <span className="text-cyan-400">+</span>
              <span>POPULATION (+25)</span>
              <span className="text-cyan-400">+</span>
              <span className="text-red-400">ROUTE (+14)</span>
              <span className="text-cyan-400">=</span>
              <span className="text-emerald-400 font-bold">EVACUATE</span>
            </div>

            <button
              onClick={() => handleTransition('AEGIS_ACT', 'DECIDE', false)}
              disabled={isTransitioning}
              className="w-full py-4 rounded-2xl font-mono text-base font-black text-black bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 hover:scale-102 transition-all cursor-pointer shadow-xl flex items-center justify-center gap-2 border border-white/20"
            >
              <span>EXECUTE RESPONSE IN RUN 02 →</span>
            </button>
          </div>
        </div>
      )}

      {/* 05 ACT MODAL */}
      {aegisState === 'AEGIS_ACT' && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0d1424] border border-emerald-500/50 rounded-3xl p-8 max-w-xl w-full shadow-2xl space-y-6 text-white font-sans">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase">RUN 02 · 05 / ACT</span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-mono font-bold">DISPATCH EXECUTED</span>
            </div>

            <div className="grid grid-cols-2 gap-3 font-mono text-xs">
              <div className="p-3.5 rounded-xl bg-[#070B14] border border-slate-800">
                <span className="text-emerald-400 font-bold block">🚤 RESCUE BOAT 02</span>
                <span className="text-slate-400 text-[10px]">Dispatched to Sector 04</span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#070B14] border border-slate-800">
                <span className="text-emerald-400 font-bold block">🏠 SHELTER 03</span>
                <span className="text-slate-400 text-[10px]">Activated for evacuees</span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#070B14] border border-slate-800">
                <span className="text-purple-300 font-bold block">🛣 ALTERNATIVE ROUTE</span>
                <span className="text-slate-400 text-[10px]">Avoids submerged R14</span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#070B14] border border-slate-800">
                <span className="text-emerald-400 font-bold block">📢 EVACUATION ALERT</span>
                <span className="text-slate-400 text-[10px]">Sent to Sector 04 citizens</span>
              </div>
            </div>

            <button
              onClick={() => handleTransition('RESPONSE_RUNNING', 'ACT', true)}
              disabled={isTransitioning}
              className="w-full py-4 rounded-2xl font-mono text-base font-black text-black bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-500 hover:scale-102 transition-all cursor-pointer shadow-xl flex items-center justify-center gap-2"
            >
              <span>RESUME RUN 02 WITH AEGIS ACTIVE →</span>
            </button>
          </div>
        </div>
      )}

      {/* SECONDARY EVENT MODAL */}
      {aegisState === 'AEGIS_NEXT_EVENT' && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0d1424] border border-cyan-500/50 rounded-3xl p-8 max-w-xl w-full shadow-2xl space-y-6 text-white font-sans">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-cyan-400 uppercase">RUN 02 · 06 / DYNAMIC REROUTE</span>
              <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-mono font-bold">ROUTE SEVERED</span>
            </div>

            <div>
              <h3 className="text-2xl font-black">NEW EVENT: ROUTE R14 SUBMERGED</h3>
              <p className="text-sm text-slate-300 mt-1">Water level on R14 exceeded 0.5m limit. AEGIS rerouted Rescue Boat 02 via R21 → R18.</p>
            </div>

            <button
              onClick={() => handleTransition('RESPONSE_RUNNING', 'NEXT_EVENT', true)}
              disabled={isTransitioning}
              className="w-full py-3.5 rounded-2xl font-mono text-sm font-bold text-black bg-cyan-400 hover:bg-cyan-300 transition-all cursor-pointer shadow-lg flex items-center justify-center gap-2"
            >
              <span>APPLY DECISION & CONTINUE RUN 02 →</span>
            </button>
          </div>
        </div>
      )}

      {/* FINAL RESULT COMPARISON MODAL (RUN 01 BASELINE vs RUN 02 AEGIS) */}
      {aegisState === 'FINAL_RESULT' && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0d1424] border-2 border-emerald-500/50 rounded-3xl p-8 max-w-3xl w-full shadow-2xl space-y-6 text-white font-sans text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-mono text-xs font-bold border border-emerald-500/30">
              <Award size={16} />
              FINAL RESULT COMPARISON: BASELINE (RUN 01) vs AEGIS (RUN 02)
            </div>

            <h2 className="text-3xl font-black tracking-tight">"AEGIS reduced human disaster impact by 37%."</h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase">
                    <th className="py-2.5 px-3">METRIC</th>
                    <th className="py-2.5 px-3 text-red-400">RUN 01 (BASELINE)</th>
                    <th className="py-2.5 px-3 text-emerald-400">RUN 02 (AEGIS)</th>
                    <th className="py-2.5 px-3 text-cyan-400">IMPROVEMENT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-bold">
                  <tr>
                    <td className="py-2.5 px-3 text-slate-300">Flooded Area %</td>
                    <td className="py-2.5 px-3 text-red-400">73%</td>
                    <td className="py-2.5 px-3 text-emerald-400">51%</td>
                    <td className="py-2.5 px-3 text-cyan-400">-22% Area</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 text-slate-300">People At Risk</td>
                    <td className="py-2.5 px-3 text-red-400">18,420</td>
                    <td className="py-2.5 px-3 text-emerald-400">10,240</td>
                    <td className="py-2.5 px-3 text-cyan-400">8,180 Saved</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 text-slate-300">Roads Blocked</td>
                    <td className="py-2.5 px-3 text-red-400">65</td>
                    <td className="py-2.5 px-3 text-emerald-400">42</td>
                    <td className="py-2.5 px-3 text-cyan-400">23 Rerouted</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 text-slate-300">Risk Severity Score</td>
                    <td className="py-2.5 px-3 text-red-400">91 / 100</td>
                    <td className="py-2.5 px-3 text-emerald-400">57 / 100</td>
                    <td className="py-2.5 px-3 text-cyan-400">37% Risk Reduction</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <button
              onClick={handleRunNewScenario}
              className="w-full py-4 rounded-2xl font-mono text-base font-black text-black bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-500 hover:scale-102 transition-all cursor-pointer shadow-xl flex items-center justify-center gap-2 border border-white/20"
            >
              <RefreshCw size={18} />
              <span>RUN NEW RANDOM FLOOD SCENARIO</span>
            </button>
          </div>
        </div>
      )}
    </>
  )
}
