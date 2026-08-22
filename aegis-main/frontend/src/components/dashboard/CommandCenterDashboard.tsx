'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import {
  ShieldAlert, ShieldCheck, Play, ArrowRight, Activity, CheckCircle2, ChevronDown,
  ChevronUp, Radio, Users, Clock, AlertTriangle, Navigation, MapPin, RefreshCw, Eye, CheckSquare, Brain, Zap, Truck
} from 'lucide-react'
import ModernHeader from '@/components/presentation/ModernHeader'
import { useDemoStore } from '@/stores/demoStore'
import { useSimulationStore } from '@/stores/simulationStore'
import { useAgentStore } from '@/stores/agentStore'
import TechnicalDetailsDrawer from '@/components/drawers/TechnicalDetailsDrawer'

const CityMap = dynamic(() => import('@/components/map/CityMap'), { ssr: false })

interface CommandCenterDashboardProps {
  onRunNewScenario?: () => void
}

export default function CommandCenterDashboard({ onRunNewScenario }: CommandCenterDashboardProps) {
  const router = useRouter()
  const { baselineMetrics, aegisMetrics, resetDemo } = useDemoStore()
  const { simulation } = useSimulationStore()
  const { oodaCycle, oodaStage, oodaStageResults, oodaHistory } = useAgentStore()

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [activeOodaStage, setActiveOodaStage] = useState<number>(2) // 0: OBSERVE, 1: VERIFY, 2: PREDICT, 3: DECIDE, 4: ACT
  const [expandedOodaIndex, setExpandedOodaIndex] = useState<number | null>(2)
  const [showDecisionModal, setShowDecisionModal] = useState(false)
  const [resourceStatusIndex, setResourceStatusIndex] = useState(3) // 0: AVAIL, 1: ALLOC, 2: DISPATCH, 3: EN ROUTE, 4: SCENE
  const [peopleAtRiskCount, setPeopleAtRiskCount] = useState(10240)
  const [livesSavedCount, setLivesSavedCount] = useState(8180)

  const tick = simulation.tick || 0

  // Animated Countup for Risk & Protected
  useEffect(() => {
    const targetSaved = aegisMetrics.peopleProtected || 8180
    let startSaved = 0
    const duration = 1200
    const stepTime = 20
    const steps = duration / stepTime
    const incrementSaved = targetSaved / steps

    const timer = setInterval(() => {
      startSaved += incrementSaved
      if (startSaved >= targetSaved) {
        setLivesSavedCount(targetSaved)
        clearInterval(timer)
      } else {
        setLivesSavedCount(Math.floor(startSaved))
      }
    }, stepTime)

    return () => clearInterval(timer)
  }, [aegisMetrics.peopleProtected])

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleExecuteResponse = () => {
    setShowDecisionModal(false)
    setResourceStatusIndex(4) // ON SCENE
    setActiveOodaStage(4) // ACT
    setPeopleAtRiskCount(10240)
  }

  const handleRunAnother = () => {
    if (onRunNewScenario) {
      onRunNewScenario()
    } else {
      resetDemo()
      router.push('/simulation')
    }
  }

  const oodaStages = [
    {
      num: '01',
      title: 'OBSERVE',
      sub: 'What is happening?',
      agent: 'Drone Recon & Sensors',
      desc: 'Ingesting real-time telemetry from drone scans & water sensors.',
      details: {
        waterLevel: '2.41m ↑',
        floodedArea: '31%',
        peopleAtRisk: '8,420',
        affectedSectors: 'Sector-04, Sector-08',
        explanation: 'Water level is rising 0.4m every 5 minutes near river column 12.'
      }
    },
    {
      num: '02',
      title: 'VERIFY',
      sub: 'Is information reliable?',
      agent: 'Sensor Fusion Verifier',
      desc: 'Cross-checking incoming telemetry & citizen emergency alerts.',
      details: {
        rawReports: 12,
        verifiedIncidents: 8,
        duplicatesRemoved: 4,
        confidencePct: '94%',
        explanation: 'Multiple drone telemetry feeds validated. 4 duplicate citizen alerts filtered out.'
      }
    },
    {
      num: '03',
      title: 'PREDICT',
      sub: 'What happens next?',
      agent: 'Predictor Engine',
      desc: 'Simulating future flood expansion via cloned lookahead grids.',
      details: {
        nowPct: '31%',
        plus10min: '43%',
        plus20min: '57%',
        plus30min: '69%',
        targetSector: 'Sector-04',
        explanation: 'Sector 04 is projected to reach critical inundation severity within 18 minutes.'
      }
    },
    {
      num: '04',
      title: 'DECIDE',
      sub: 'What should AEGIS do?',
      agent: 'Policy Commander',
      desc: 'Evaluating candidate responses via counterfactual lookaheads.',
      details: {
        decision: 'EVACUATE SECTOR 04',
        confidencePct: '94%',
        riskScore: '89 / 100',
        recommendedOption: 'Option D: Combined Multimodal Response',
        explanation: 'Selected Option D because it achieves maximum risk reduction (37%) with zero traffic deadlocks.'
      }
    },
    {
      num: '05',
      title: 'ACT',
      sub: 'Execute the response.',
      agent: 'Allocator & Router',
      desc: 'Deploying rescue boats, shelters, and dynamic A* rerouting.',
      details: {
        dispatchedResource: 'Rescue Boat 02',
        activeShelter: 'Shelter 03 (Capacity 500)',
        selectedRoute: 'R21 → R18 → Sector 04',
        status: 'EN ROUTE',
        explanation: 'Rescue Boat 02 dispatched. Route R14 submerged; traffic rerouted via R21.'
      }
    },
  ]

  const riskFactors = [
    { name: 'WATER DEPTH', value: 32, max: 35, desc: 'Over-embankment depth 2.41m' },
    { name: 'POPULATION EXPOSURE', value: 25, max: 30, desc: 'High-density residential Sector 04' },
    { name: 'INFRASTRUCTURE RISK', value: 18, max: 20, desc: '23 arterial roads exposed' },
    { name: 'CRITICAL FACILITIES', value: 11, max: 15, desc: '1 hospital within 500m zone' },
    { name: 'ROUTE ACCESS RISK', value: 14, max: 15, desc: 'Primary route R14 submerged' },
  ]

  const totalRiskScore = riskFactors.reduce((acc, f) => acc + f.value, 0)

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#111827] font-sans antialiased select-none pb-24 relative">
      {/* FLOATING STATUS BADGE */}
      <div className="fixed bottom-6 right-6 z-40 hidden md:flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/95 border border-[#E5E7EB] shadow-lg text-xs font-bold text-[#111827] backdrop-blur-md">
        <span className="w-2.5 h-2.5 rounded-full bg-[#6366F1] animate-ping" />
        <span>AEGIS AI ● {oodaStages[activeOodaStage].agent} ({oodaStages[activeOodaStage].title})</span>
      </div>

      {/* MINIMAL HEADER */}
      <ModernHeader
        onOpenDetails={() => setDrawerOpen(true)}
        onScrollTo={scrollToSection}
      />

      <main className="max-w-[1240px] mx-auto px-6 md:px-8 space-y-16 md:space-y-20 pt-8">
        
        {/* 1. CURRENT SITUATION & 4 KEY METRICS */}
        <section id="hero" className="space-y-6 pt-4 scroll-mt-24">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 border-b border-[#E5E7EB] pb-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EF4444]/10 text-[#EF4444] text-xs font-bold border border-[#EF4444]/20">
                <span className="w-2 h-2 rounded-full bg-[#EF4444] animate-ping" />
                <span>CRITICAL DISASTER EVENT</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-[#111827] tracking-tight leading-tight">
                "Flood is rapidly expanding toward Sector 04."
              </h1>
              <p className="text-sm text-[#6B7280] font-medium">
                "AEGIS is monitoring the situation and evaluating autonomous response scenarios."
              </p>
            </div>

            {/* Overall Risk Score Badge */}
            <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-sm w-full md:w-72 space-y-2">
              <div className="flex justify-between text-xs font-bold text-[#6B7280]">
                <span>OVERALL RISK SCORE</span>
                <span className="text-[#EF4444] font-black">{totalRiskScore} / 100</span>
              </div>
              <div className="h-2.5 bg-[#E5E7EB] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#3B82F6] via-[#F59E0B] to-[#EF4444] rounded-full w-[87%]" />
              </div>
              <span className="text-xs font-bold text-[#EF4444] block text-right">CRITICAL SEVERITY</span>
            </div>
          </div>

          {/* 4 KEY METRICS WITH ONE-LINE HUMAN EXPLANATIONS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-[24px] bg-white border border-[#E5E7EB] shadow-sm space-y-2">
              <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider block">WATER LEVEL</span>
              <div className="text-4xl font-black text-[#111827]">2.41m ↑</div>
              <p className="text-xs text-[#3B82F6] font-semibold">"Rising 0.4m every 5 mins near Sector 04."</p>
            </div>

            <div className="p-6 rounded-[24px] bg-white border border-[#E5E7EB] shadow-sm space-y-2">
              <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider block">FLOODED AREA</span>
              <div className="text-4xl font-black text-[#3B82F6]">31%</div>
              <p className="text-xs text-[#6B7280] font-medium">"31% of monitored municipal grid submerged."</p>
            </div>

            <div className="p-6 rounded-[24px] bg-white border border-[#E5E7EB] shadow-sm space-y-2">
              <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider block">PEOPLE AT RISK</span>
              <div className="text-4xl font-black text-[#F59E0B]">{peopleAtRiskCount.toLocaleString()}</div>
              <p className="text-xs text-[#F59E0B] font-semibold">"People currently inside projected flood path."</p>
            </div>

            <div className="p-6 rounded-[24px] bg-white border border-[#E5E7EB] shadow-sm space-y-2">
              <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider block">RISK LEVEL</span>
              <div className="text-4xl font-black text-[#EF4444]">78 / 100</div>
              <p className="text-xs text-[#EF4444] font-semibold">"Critical — rapid flood expansion detected."</p>
            </div>
          </div>
        </section>

        {/* 2. LIVE CITY DIGITAL TWIN SIMULATION */}
        <section id="simulation" className="space-y-4 scroll-mt-24">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[#6366F1] uppercase tracking-widest block">LIVE DIGITAL TWIN</span>
              <h2 className="text-2xl font-bold text-[#111827]">LIVE FLOOD SIMULATION MAP</h2>
            </div>
            <span className="text-xs font-semibold text-[#3B82F6] bg-[#3B82F6]/10 px-3 py-1 rounded-full border border-[#3B82F6]/20">
              PHYSICAL WATER CELLULAR AUTOMATA ACTIVE
            </span>
          </div>

          <div className="rounded-[24px] overflow-hidden border border-[#E5E7EB] bg-[#070B14] h-[500px] relative shadow-lg">
            <CityMap className="w-full h-full" />

            {/* Simple Map Legend Overlay */}
            <div className="absolute bottom-4 left-4 z-20 bg-white/90 border border-[#E5E7EB] rounded-2xl px-4 py-2 shadow-md backdrop-blur-md flex items-center gap-4 text-xs font-bold text-[#111827]">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-500" /> Flood Water</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500" /> Safe Zone</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-500" /> Blocked Road</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-500" /> Rescue Unit</span>
            </div>
          </div>
        </section>

        {/* 3. WHAT AEGIS SEES (3 OBSERVATION CARDS) */}
        <section className="space-y-6">
          <div className="space-y-1">
            <span className="text-xs font-bold text-[#6366F1] uppercase tracking-widest">MULTI-MODAL INGESTION</span>
            <h2 className="text-2xl md:text-3xl font-bold text-[#111827]">WHAT AEGIS SEES</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-[24px] bg-white border border-[#E5E7EB] shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#6B7280]">VISION</span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-bold">94% CONFIDENCE</span>
              </div>
              <p className="text-sm font-bold text-[#111827]">"Flood detected across 31% of the monitored urban grid."</p>
              <span className="text-xs text-[#6B7280] block">Ingested from CV Recon drone video frames.</span>
            </div>

            <div className="p-6 rounded-[24px] bg-white border border-[#E5E7EB] shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#6B7280]">WATER MONITORS</span>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 text-[10px] font-bold">91% CONFIDENCE</span>
              </div>
              <p className="text-sm font-bold text-[#111827]">"Water level rising 0.4m every 5 minutes near riverbank."</p>
              <span className="text-xs text-[#6B7280] block">Ingested from municipal river level sensors.</span>
            </div>

            <div className="p-6 rounded-[24px] bg-white border border-[#E5E7EB] shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#6B7280]">CITIZEN REPORTS</span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-[10px] font-bold">96% CONFIDENCE</span>
              </div>
              <p className="text-sm font-bold text-[#111827]">"12 incoming reports received. 8 verified. 4 duplicates removed."</p>
              <span className="text-xs text-[#6B7280] block">Verified by Sensor Fusion Agent.</span>
            </div>
          </div>
        </section>

        {/* 4. AEGIS DECISION CYCLE (INTERACTIVE OODA ACCORDION) */}
        <section id="analysis" className="space-y-6 scroll-mt-24">
          <div className="space-y-1">
            <span className="text-xs font-bold text-[#6366F1] uppercase tracking-widest">AUTONOMOUS DECISION PIPELINE</span>
            <h2 className="text-2xl md:text-3xl font-bold text-[#111827]">HOW AEGIS IS RESPONDING</h2>
            <p className="text-sm text-[#6B7280] font-medium">"AEGIS continuously observes, verifies, predicts, decides and acts."</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
            {oodaStages.map((stg, idx) => {
              const isActive = activeOodaStage === idx
              const isExpanded = expandedOodaIndex === idx
              const isCompleted = activeOodaStage > idx

              return (
                <div
                  key={idx}
                  onClick={() => {
                    setActiveOodaStage(idx)
                    setExpandedOodaIndex(isExpanded ? null : idx)
                  }}
                  className={`p-6 rounded-[24px] border transition-all cursor-pointer flex flex-col justify-between shadow-sm ${
                    isActive
                      ? 'bg-white border-[#6366F1] ring-2 ring-[#6366F1]/30'
                      : isCompleted
                      ? 'bg-white/90 border-emerald-500/30'
                      : 'bg-white/60 border-[#E5E7EB] opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-xs font-bold font-mono ${isActive ? 'text-[#6366F1]' : 'text-[#6B7280]'}`}>
                      {stg.num}
                    </span>
                    {isCompleted ? (
                      <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-xs font-bold">✓</span>
                    ) : isActive ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-[#6366F1] animate-ping" />
                    ) : null}
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-[#6366F1] uppercase block">{stg.agent}</span>
                    <h3 className="text-base font-bold text-[#111827] flex items-center justify-between">
                      <span>{stg.title}</span>
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </h3>
                    <p className="text-xs text-[#6B7280] font-medium">{stg.sub}</p>
                  </div>

                  {/* Expanded Stage Details */}
                  {isExpanded && (
                    <div className="mt-4 pt-3 border-t border-[#E5E7EB] space-y-2 text-xs text-[#111827] font-medium">
                      <p className="text-[11px] text-[#6366F1] font-bold">{stg.desc}</p>
                      <div className="p-2.5 rounded-xl bg-[#F9F8F6] border border-[#E5E7EB] space-y-1">
                        <span className="text-[10px] font-bold text-[#6B7280] uppercase block">STAGE DETAILS:</span>
                        <p className="text-xs font-semibold text-[#111827]">{stg.details.explanation}</p>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {/* 5. PREDICTIVE LOOKAHEAD (WHAT HAPPENS NEXT?) */}
        <section className="p-8 md:p-10 rounded-[24px] bg-white border border-[#E5E7EB] shadow-sm space-y-6 max-w-4xl mx-auto">
          <div className="space-y-1">
            <span className="text-xs font-bold text-[#6366F1] uppercase tracking-widest">PREDICTIVE LOOKAHEAD ENGINE</span>
            <h2 className="text-2xl md:text-3xl font-bold text-[#111827]">WHAT HAPPENS NEXT?</h2>
            <p className="text-sm text-[#EF4444] font-semibold">
              "Sector 04 is projected to reach critical inundation severity within 18 minutes."
            </p>
          </div>

          {/* 4-Horizon Timeline Progression */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center font-bold">
            <div className="p-4 rounded-2xl bg-[#F9F8F6] border border-[#E5E7EB]">
              <span className="text-xs text-[#6B7280] uppercase block">NOW</span>
              <span className="text-2xl font-black text-[#111827]">31% FLOOD</span>
              <span className="text-[10px] text-[#6B7280] block font-medium">Baseline tick {tick}</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#F9F8F6] border border-[#E5E7EB]">
              <span className="text-xs text-[#3B82F6] uppercase block">+10 MIN</span>
              <span className="text-2xl font-black text-[#3B82F6]">43% FLOOD</span>
              <span className="text-[10px] text-[#6B7280] block font-medium">Riverbank overflow</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#F9F8F6] border border-[#E5E7EB]">
              <span className="text-xs text-[#F59E0B] uppercase block">+20 MIN</span>
              <span className="text-2xl font-black text-[#F59E0B]">57% FLOOD</span>
              <span className="text-[10px] text-[#6B7280] block font-medium">Route R14 submerged</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#F9F8F6] border border-[#E5E7EB]">
              <span className="text-xs text-[#EF4444] uppercase block">+30 MIN</span>
              <span className="text-2xl font-black text-[#EF4444]">69% FLOOD</span>
              <span className="text-[10px] text-[#EF4444] block font-medium">Sector 04 critical</span>
            </div>
          </div>
        </section>

        {/* 6. AEGIS DECISION & COUNTERFACTUAL WHAT-IF */}
        <section id="response" className="space-y-8 max-w-4xl mx-auto scroll-mt-24">
          
          {/* Prominent Decision Card */}
          <div className="p-8 md:p-10 rounded-[24px] bg-white border-2 border-[#6366F1]/40 shadow-md space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#6366F1] uppercase tracking-widest">AEGIS AUTONOMOUS DIRECTIVE</span>
              <button
                onClick={() => setShowDecisionModal(true)}
                className="text-xs font-bold text-white bg-[#6366F1] hover:bg-[#4F46E5] px-4 py-2 rounded-full transition-all cursor-pointer shadow-md"
              >
                INSPECT DECISION DETAILS →
              </button>
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl md:text-5xl font-black text-[#111827] tracking-tight">
                EVACUATE SECTOR 04
              </h2>
              <span className="inline-block px-4 py-1 rounded-full bg-[#6366F1]/10 text-[#6366F1] font-black text-xs border border-[#6366F1]/20">
                94% CONFIDENCE DIRECTIVE
              </span>
            </div>

            <div className="space-y-3 pt-2">
              <span className="text-xs font-bold text-[#6B7280] uppercase block">WHY DID AEGIS CHOOSE THIS ACTION?</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-semibold text-[#111827]">
                <div className="p-3 rounded-xl bg-[#F9F8F6] border border-[#E5E7EB] flex items-center gap-2">
                  <span className="text-[#EF4444]">●</span> High Population Exposure in Sector 04 (+25)
                </div>
                <div className="p-3 rounded-xl bg-[#F9F8F6] border border-[#E5E7EB] flex items-center gap-2">
                  <span className="text-[#EF4444]">●</span> Rapid Water Level Rise &gt; 1.2m overflow (+32)
                </div>
                <div className="p-3 rounded-xl bg-[#F9F8F6] border border-[#E5E7EB] flex items-center gap-2">
                  <span className="text-[#EF4444]">●</span> Primary Route R14 submerged; alternative open (+14)
                </div>
                <div className="p-3 rounded-xl bg-[#F9F8F6] border border-[#E5E7EB] flex items-center gap-2">
                  <span className="text-emerald-600">✓</span> Shelter 03 active & capacity available (500)
                </div>
              </div>
            </div>
          </div>

          {/* COUNTERFACTUAL WHAT-IF EVALUATION SECTION */}
          <div className="p-8 md:p-10 rounded-[24px] bg-white border border-[#E5E7EB] shadow-sm space-y-6">
            <div className="space-y-1">
              <span className="text-xs font-bold text-[#6366F1] uppercase tracking-widest">COUNTERFACTUAL EVALUATION ENGINE</span>
              <h3 className="text-2xl font-bold text-[#111827]">WHY THIS ACTION?</h3>
              <p className="text-sm text-[#6B7280] font-medium">
                "AEGIS tested possible future outcomes on cloned lookahead grids before selecting a response."
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-bold text-center">
              <div className="p-5 rounded-2xl bg-[#F9F8F6] border border-[#E5E7EB] space-y-2">
                <span className="text-xs text-[#EF4444] uppercase block">OPTION A: DO NOTHING</span>
                <div className="text-3xl font-black text-[#EF4444]">18,420</div>
                <span className="text-xs text-[#6B7280] block font-medium">PEOPLE AT RISK (HIGH IMPACT)</span>
              </div>

              <div className="p-5 rounded-2xl bg-[#F9F8F6] border border-[#E5E7EB] space-y-2">
                <span className="text-xs text-[#F59E0B] uppercase block">OPTION B: EVACUATE ONLY</span>
                <div className="text-3xl font-black text-[#F59E0B]">13,200</div>
                <span className="text-xs text-[#6B7280] block font-medium">PEOPLE AT RISK (MODERATE IMPACT)</span>
              </div>

              <div className="p-5 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/40 space-y-2">
                <span className="text-xs text-emerald-600 uppercase block">OPTION D: COMBINED RESPONSE</span>
                <div className="text-3xl font-black text-emerald-600">10,240</div>
                <span className="text-xs text-emerald-600 block font-bold">PEOPLE AT RISK (LOWEST IMPACT) ★</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#6366F1]/5 border border-[#6366F1]/20 text-xs font-semibold text-[#6366F1] text-center">
              "AEGIS CHOSE COMBINED RESPONSE because it produced the lowest projected human impact (37% risk reduction)."
            </div>
          </div>
        </section>

        {/* 7. RESPONSE ACTIONS & RESOURCE STATUS */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[#6366F1] uppercase tracking-widest">AUTONOMOUS INTERVENTION</span>
              <h2 className="text-2xl font-bold text-[#111827]">AEGIS RESPONSE ACTIONS</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Rescue Boat Dispatch Status */}
            <div className="p-6 rounded-[24px] bg-white border border-[#E5E7EB] shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl">🚤</span>
                <span className="px-3 py-1 rounded-full bg-[#6366F1]/10 text-[#6366F1] font-bold text-xs border border-[#6366F1]/20">
                  {['AVAILABLE', 'ALLOCATING', 'DISPATCHED', 'EN ROUTE', 'ON SCENE'][resourceStatusIndex]}
                </span>
              </div>

              <div>
                <h4 className="font-bold text-[#111827] text-base">Rescue Boat 02</h4>
                <p className="text-xs text-[#6B7280]">Distance: 2.4 km · ETA: 8 mins to Sector 04</p>
              </div>

              <div className="flex items-center justify-between text-[10px] font-bold text-[#6B7280] pt-2 border-t border-[#E5E7EB]">
                <span className={resourceStatusIndex >= 0 ? 'text-emerald-600' : ''}>● AVAIL</span>
                <span className={resourceStatusIndex >= 1 ? 'text-emerald-600' : ''}>──● ALLOC</span>
                <span className={resourceStatusIndex >= 2 ? 'text-emerald-600' : ''}>──● DISPATCH</span>
                <span className={resourceStatusIndex >= 3 ? 'text-emerald-600' : ''}>──● EN ROUTE</span>
                <span className={resourceStatusIndex >= 4 ? 'text-emerald-600 font-black' : ''}>──● SCENE</span>
              </div>
            </div>

            {/* A* Route Rerouting */}
            <div className="p-6 rounded-[24px] bg-white border border-[#E5E7EB] shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl">🛣</span>
                <span className="px-3 py-1 rounded-full bg-[#EF4444]/10 text-[#EF4444] font-bold text-xs border border-[#EF4444]/20">
                  ROUTE R14 BLOCKED
                </span>
              </div>

              <div>
                <h4 className="font-bold text-[#111827] text-base">A* Route Optimization</h4>
                <p className="text-xs text-[#6366F1] font-bold">Alternative Path: R21 → R18 → Sector 04 (ETA: 8 MIN)</p>
              </div>

              <div className="pt-2 border-t border-[#E5E7EB] text-xs font-semibold text-emerald-600">
                ✓ Dynamic solver bypassed submerged roads
              </div>
            </div>
          </div>

          {/* Resource Allocation Progress */}
          <div className="p-6 rounded-[24px] bg-white border border-[#E5E7EB] shadow-sm space-y-4">
            <h4 className="font-bold text-[#111827] text-sm uppercase tracking-wider">RESPONSE RESOURCES DEPLOYMENT</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-[#111827]">
                  <span>RESCUE BOATS</span>
                  <span className="text-[#6366F1]">2 / 5 Deployed</span>
                </div>
                <div className="h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
                  <div className="h-full bg-[#6366F1] rounded-full w-[40%]" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-[#111827]">
                  <span>RESCUE TEAMS</span>
                  <span className="text-[#6366F1]">1 / 3 Deployed</span>
                </div>
                <div className="h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
                  <div className="h-full bg-[#6366F1] rounded-full w-[33%]" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-[#111827]">
                  <span>SHELTERS ACTIVATED</span>
                  <span className="text-emerald-600">2 / 4 Active</span>
                </div>
                <div className="h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full w-[50%]" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 8. IMPACT EVALUATION (IS AEGIS HELPING?) */}
        <section id="impact" className="p-8 md:p-10 rounded-[24px] bg-white border border-[#E5E7EB] shadow-sm text-center space-y-6 max-w-4xl mx-auto scroll-mt-24">
          <div className="space-y-1">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest block">MEASURABLE IMPACT</span>
            <h2 className="text-3xl md:text-5xl font-black text-[#111827] tracking-tight leading-tight">
              IS AEGIS HELPING?
            </h2>
            <p className="text-sm text-[#6B7280] font-medium">"Quantifiable risk reduction following autonomous intervention."</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-center font-bold">
            <div className="p-6 rounded-2xl bg-[#F9F8F6] border border-[#E5E7EB] space-y-2">
              <span className="text-xs text-[#EF4444] uppercase block font-bold">BEFORE AEGIS ACTION</span>
              <div className="text-4xl font-black text-[#111827]">18,420</div>
              <span className="text-xs text-[#EF4444] block">RISK SCORE: 91 / 100</span>
            </div>

            <div className="p-6 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/40 space-y-2">
              <span className="text-xs text-emerald-600 uppercase block font-bold">CURRENT AEGIS IMPACT</span>
              <div className="text-4xl font-black text-emerald-600">{peopleAtRiskCount.toLocaleString()}</div>
              <span className="text-xs text-emerald-600 block">RISK SCORE: 57 / 100</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto font-bold text-center">
            <div className="p-4 rounded-2xl bg-[#F9F8F6] border border-[#E5E7EB]">
              <span className="text-3xl font-black text-emerald-600 block">+{livesSavedCount.toLocaleString()}</span>
              <span className="text-xs text-[#6B7280] uppercase">PEOPLE PROTECTED</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#F9F8F6] border border-[#E5E7EB]">
              <span className="text-3xl font-black text-emerald-600 block">37%</span>
              <span className="text-xs text-[#6B7280] uppercase">RISK REDUCTION</span>
            </div>
          </div>

          <div className="pt-2 flex justify-center">
            <button
              onClick={handleRunAnother}
              className="py-4 px-8 rounded-full bg-[#111827] hover:bg-[#222222] text-white font-bold text-sm transition-all cursor-pointer shadow-xl flex items-center gap-3 hover:scale-102"
            >
              <RefreshCw size={16} />
              <span>RUN NEW RANDOM SIMULATION →</span>
            </button>
          </div>
        </section>

      </main>

      {/* EXECUTIVE DECISION MODAL */}
      {showDecisionModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#6366F1]/40 rounded-[28px] p-8 max-w-lg w-full shadow-2xl space-y-6 text-center">
            <div className="inline-block px-4 py-1 rounded-full bg-[#6366F1]/10 text-[#6366F1] font-black text-xs border border-[#6366F1]/20 uppercase">
              AEGIS AI DECISION
            </div>

            <div className="space-y-1">
              <h3 className="text-3xl font-black text-[#111827]">EVACUATE SECTOR 04</h3>
              <span className="text-xs font-bold text-[#6366F1]">94% CONFIDENCE</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#F9F8F6] border border-[#E5E7EB] text-xs font-semibold text-[#6B7280] space-y-1 text-left">
              <p>• Water Depth score +32 (&gt;1.2m overflow)</p>
              <p>• Population Exposure score +25</p>
              <p>• Route Access risk score +14 (R14 submerged)</p>
              <p>• Shelter 03 active & capacity available</p>
            </div>

            <button
              onClick={handleExecuteResponse}
              className="w-full py-4 rounded-full font-bold text-sm text-white bg-[#6366F1] hover:bg-[#4F46E5] transition-all cursor-pointer shadow-lg shadow-[#6366F1]/20"
            >
              EXECUTE RESPONSE →
            </button>
          </div>
        </div>
      )}

      {/* TECHNICAL DETAILS DRAWER MODAL */}
      <TechnicalDetailsDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  )
}
