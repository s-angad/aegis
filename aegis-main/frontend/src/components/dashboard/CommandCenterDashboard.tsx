'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import {
  Eye, CheckSquare, Brain, Zap, Truck, ShieldAlert, ShieldCheck, Play, ArrowDown,
  ChevronRight, Award, Compass, RefreshCw, Activity, CheckCircle2, ArrowRight,
  ChevronDown, Shield, Layers, Radio, Users, Clock, AlertTriangle, Navigation, MapPin
} from 'lucide-react'
import ModernHeader from '@/components/presentation/ModernHeader'
import { useDemoStore } from '@/stores/demoStore'
import { useSimulationStore } from '@/stores/simulationStore'
import TechnicalDetailsDrawer from '@/components/drawers/TechnicalDetailsDrawer'

const CityMap = dynamic(() => import('@/components/map/CityMap'), { ssr: false })

interface CommandCenterDashboardProps {
  onRunNewScenario?: () => void
}

export default function CommandCenterDashboard({ onRunNewScenario }: CommandCenterDashboardProps) {
  const router = useRouter()
  const { baselineMetrics, aegisMetrics, resetDemo } = useDemoStore()
  const { simulation } = useSimulationStore()

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [activeStageIndex, setActiveStageIndex] = useState(2) // 0: OBSERVE, 1: VERIFY, 2: PREDICT, 3: DECIDE, 4: ACT
  const [showDecisionModal, setShowDecisionModal] = useState(false)
  const [resourceStatusIndex, setResourceStatusIndex] = useState(2) // 0: AVAILABLE, 1: ALLOCATING, 2: DISPATCHED, 3: EN ROUTE, 4: ON SCENE
  const [peopleAtRiskCount, setPeopleAtRiskCount] = useState(baselineMetrics.peopleAtRisk)
  const [livesSavedCount, setLivesSavedCount] = useState(0)

  const tick = simulation.tick || 0

  // Animated Countup for Risk & Saved
  useEffect(() => {
    const targetSaved = aegisMetrics.peopleProtected || 5740
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
    setActiveStageIndex(4) // ACT
    setPeopleAtRiskCount(11240)
  }

  const handleRunAnother = () => {
    if (onRunNewScenario) {
      onRunNewScenario()
    } else {
      resetDemo()
      router.push('/simulation')
    }
  }

  const stages = [
    { num: '01', title: 'OBSERVE', sub: 'What is happening?', status: 'Ingesting aerial & citizen telemetry...', agent: 'Drones Recon Agent' },
    { num: '02', title: 'VERIFY', sub: 'Can we trust the info?', status: 'Cross-checking 12 incoming reports (8 verified)...', agent: 'Verifier Agent' },
    { num: '03', title: 'PREDICT', sub: 'What happens next?', status: 'Simulating future flood spread (+30 min lookahead)...', agent: 'Predictor Agent' },
    { num: '04', title: 'DECIDE', sub: 'What should we do?', status: 'Selecting Sector 04 evacuation as top priority...', agent: 'Policy Commander' },
    { num: '05', title: 'ACT', sub: 'Deploy the response.', status: 'Deploying Rescue Boat 02 via A* route R21 → R18...', agent: 'Allocator + Router' },
  ]

  const riskFactors = [
    { name: 'WATER DEPTH', value: 32, max: 35, desc: 'Over-embankment height 2.8m' },
    { name: 'POPULATION EXPOSURE', value: 25, max: 30, desc: 'High-density residential Sector 04' },
    { name: 'INFRASTRUCTURE', value: 18, max: 20, desc: '23 roads affected' },
    { name: 'CRITICAL FACILITIES', value: 11, max: 15, desc: '1 hospital within 500m zone' },
    { name: 'ROUTE ACCESS', value: 14, max: 15, desc: 'Primary route R14 blocked' },
  ]

  const totalRiskScore = riskFactors.reduce((acc, f) => acc + f.value, 0)

  const responseHistory = [
    { time: '09:40', title: 'FLOOD DETECTED', desc: 'Embankment overflow recorded at river column 12.', what: 'High flood exposure detected', why: 'Embankment breached', next: 'Sensor verification' },
    { time: '09:41', title: 'DAMAGE ASSESSED & VERIFIED', desc: '12 reports ingested → 8 verified emergency locations.', what: 'Telemetry verified', why: 'Filtered 4 duplicate citizen alerts', next: 'Future simulation' },
    { time: '09:42', title: 'FUTURE STATE SIMULATED', desc: '4-tick lookahead model predicts Sector 07 impact in 18 minutes.', what: 'Spread prediction', why: '30-min horizon lookahead', next: 'Sector prioritization' },
    { time: '09:42', title: 'SECTOR 04 PRIORITIZED & ORDERED', desc: 'Sector 04 evaluated at 87/100 risk. Evacuation ordered.', what: 'Evacuation directive', why: '87/100 severity score', next: 'Resource dispatch' },
    { time: '09:43', title: 'RESCUE RESOURCE DISPATCHED', desc: 'Rescue Boat 02 dispatched via A* route R21 → R18 → Sector 04.', what: 'Boat 02 & Shelter 03 active', why: 'R14 blocked, rerouted', next: 'Continuous monitoring' },
  ]

  return (
    <div className="min-h-screen bg-[#F7F6F2] text-[#111111] font-sans antialiased select-none pb-24 relative">
      {/* FLOATING AI STATUS BADGE */}
      <div className="fixed bottom-6 right-6 z-40 hidden md:flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/95 border border-[#ECEAE4] shadow-lg text-xs font-bold text-[#111111] backdrop-blur-md">
        <span className="w-2.5 h-2.5 rounded-full bg-[#6C4DFF] animate-ping" />
        <span>AEGIS AI ● {stages[activeStageIndex].agent} ({stages[activeStageIndex].title})</span>
      </div>

      {/* MINIMAL HEADER */}
      <ModernHeader
        onOpenDetails={() => setDrawerOpen(true)}
        onScrollTo={scrollToSection}
      />

      <main className="max-w-[1240px] mx-auto px-6 md:px-8 space-y-16 md:space-y-20 pt-8">
        {/* 1. LIVE CURRENT FLOOD SITUATION */}
        <section id="hero" className="space-y-6 pt-4 scroll-mt-24">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 border-b border-[#ECEAE4] pb-6">
            <div className="space-y-2 max-w-2xl">
              <span className="text-xs font-bold text-[#6C4DFF] uppercase tracking-widest block">CURRENT FLOOD SITUATION</span>
              <h1 className="text-3xl md:text-5xl font-black text-[#111111] tracking-tight leading-tight">
                "Flooding is expanding across the eastern districts."
              </h1>
            </div>

            {/* Visual Risk Bar */}
            <div className="p-4 rounded-2xl bg-white border border-[#ECEAE4] shadow-sm w-full md:w-72 space-y-2">
              <div className="flex justify-between text-[11px] font-bold text-[#6B6B6B]">
                <span>OVERALL RISK</span>
                <span className="text-[#E5484D] font-black">{totalRiskScore} / 100</span>
              </div>
              <div className="h-2.5 bg-[#ECEAE4] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#1976FF] via-[#D99A2B] to-[#E5484D] rounded-full w-[87%]" />
              </div>
              <span className="text-xs font-black text-[#E5484D] block text-right">CRITICAL SEVERITY SCORE</span>
            </div>
          </div>

          {/* 3 CRITICAL LIVE METRICS WITH SHORT EXPLANATIONS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-8 rounded-[24px] bg-white border border-[#ECEAE4] shadow-sm space-y-2">
              <span className="text-xs font-bold text-[#6B6B6B] uppercase tracking-wider block">WATER LEVEL</span>
              <div className="text-5xl font-black text-[#111111] font-sans">2.41m ↑</div>
              <p className="text-xs text-[#1976FF] font-bold pt-1">"Rising rapidly near Sector 04."</p>
            </div>

            <div className="p-8 rounded-[24px] bg-white border border-[#ECEAE4] shadow-sm space-y-2">
              <span className="text-xs font-bold text-[#6B6B6B] uppercase tracking-wider block">FLOODED AREA</span>
              <div className="text-5xl font-black text-[#1976FF] font-sans">42%</div>
              <p className="text-xs text-[#6B6B6B] font-bold pt-1">"Flooding is expanding toward eastern residential sectors."</p>
            </div>

            <div className="p-8 rounded-[24px] bg-white border border-[#ECEAE4] shadow-sm space-y-2">
              <span className="text-xs font-bold text-[#6B6B6B] uppercase tracking-wider block">PEOPLE AT RISK</span>
              <div className="text-5xl font-black text-[#D99A2B] font-sans">{peopleAtRiskCount.toLocaleString()}</div>
              <p className="text-xs text-[#E5484D] font-bold pt-1">"61% are inside the projected flood path."</p>
            </div>
          </div>
        </section>

        {/* HERO CITY DIGITAL TWIN MAP SIMULATION */}
        <section id="simulation" className="space-y-4 scroll-mt-24">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#6C4DFF] uppercase tracking-widest">LIVE CITY DIGITAL TWIN</span>
            <span className="text-xs font-semibold text-[#1976FF] bg-[#1976FF]/10 px-3 py-1 rounded-full border border-[#1976FF]/20">
              PHYSICAL WATER CELLULAR AUTOMATA ACTIVE
            </span>
          </div>

          <div className="rounded-[24px] overflow-hidden border border-[#ECEAE4] bg-[#070B14] h-[520px] relative shadow-lg">
            <CityMap className="w-full h-full" />
          </div>
        </section>

        {/* 2. LIVE IMPACT ANALYSIS (4 CATEGORIES) */}
        <section className="space-y-6">
          <div className="space-y-1">
            <span className="text-xs font-bold text-[#6C4DFF] uppercase tracking-widest">CATEGORICAL DISASTER TELEMETRY</span>
            <h2 className="text-2xl md:text-3xl font-bold text-[#111111]">LIVE IMPACT ANALYSIS</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-[24px] bg-white border border-[#ECEAE4] shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#6B6B6B]">PEOPLE</span>
                <Users size={16} className="text-[#D99A2B]" />
              </div>
              <div className="text-2xl font-black text-[#D99A2B]">{peopleAtRiskCount.toLocaleString()} AT RISK</div>
              <p className="text-xs text-[#6B6B6B] font-medium leading-snug">"People currently located inside the projected flood zone."</p>
            </div>

            <div className="p-6 rounded-[24px] bg-white border border-[#ECEAE4] shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#6B6B6B]">INFRASTRUCTURE</span>
                <ShieldAlert size={16} className="text-[#E5484D]" />
              </div>
              <div className="text-2xl font-black text-[#E5484D]">23 ROADS BLOCKED</div>
              <p className="text-xs text-[#6B6B6B] font-medium leading-snug">"Primary evacuation route R14 is becoming inaccessible."</p>
            </div>

            <div className="p-6 rounded-[24px] bg-white border border-[#ECEAE4] shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#6B6B6B]">CRITICAL FACILITIES</span>
                <ShieldCheck size={16} className="text-[#E5484D]" />
              </div>
              <div className="text-2xl font-black text-[#E5484D]">1 HOSPITAL AT RISK</div>
              <p className="text-xs text-[#6B6B6B] font-medium leading-snug">"Emergency access may be restricted within 45 mins."</p>
            </div>

            <div className="p-6 rounded-[24px] bg-white border border-[#ECEAE4] shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#6B6B6B]">EVACUATION ACCESS</span>
                <Navigation size={16} className="text-[#1976FF]" />
              </div>
              <div className="text-2xl font-black text-[#1976FF]">2 / 5 ROUTES OPEN</div>
              <p className="text-xs text-[#6B6B6B] font-medium leading-snug">"Available evacuation routes are decreasing."</p>
            </div>
          </div>
        </section>

        {/* 3. AEGIS RISK ENGINE (SCORE BREAKDOWN) */}
        <section className="p-8 md:p-10 rounded-[24px] bg-white border border-[#ECEAE4] shadow-sm space-y-6 max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#ECEAE4] pb-4">
            <div>
              <span className="text-xs font-bold text-[#6C4DFF] uppercase tracking-widest">EXPLICIT SEVERITY FORMULA</span>
              <h2 className="text-2xl font-black text-[#111111]">AEGIS RISK ENGINE</h2>
            </div>
            <div className="text-right">
              <span className="text-3xl font-black text-[#E5484D]">{totalRiskScore} / 100</span>
              <span className="text-xs font-bold text-[#E5484D] block uppercase">HIGH SEVERITY RISK</span>
            </div>
          </div>

          <div className="space-y-4">
            {riskFactors.map((factor, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-[#111111]">{factor.name}</span>
                  <span className="text-[#6C4DFF]">+{factor.value} / {factor.max}</span>
                </div>
                <div className="h-2 bg-[#ECEAE4] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#6C4DFF] rounded-full transition-all duration-500"
                    style={{ width: `${(factor.value / factor.max) * 100}%` }}
                  />
                </div>
                <span className="text-[11px] text-[#6B6B6B] font-medium block">{factor.desc}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 4. AEGIS DECISION ENGINE (ACTIVE STAGE STEPPER) */}
        <section id="analysis" className="space-y-6 scroll-mt-24">
          <div className="text-center space-y-1 max-w-xl mx-auto">
            <span className="text-xs font-bold text-[#6C4DFF] uppercase tracking-widest block">CLOSED-LOOP OODA PIPELINE</span>
            <h2 className="text-3xl font-black text-[#111111]">AEGIS DECISION ENGINE</h2>
            <p className="text-sm text-[#6B6B6B] font-medium">"From real-time observation to autonomous response."</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
            {stages.map((stg, idx) => {
              const isActive = activeStageIndex === idx
              const isCompleted = activeStageIndex > idx

              return (
                <button
                  key={idx}
                  onClick={() => setActiveStageIndex(idx)}
                  className={`p-6 rounded-[24px] border transition-all cursor-pointer text-left flex flex-col justify-between h-52 shadow-sm ${
                    isActive
                      ? 'bg-white border-[#6C4DFF] ring-2 ring-[#6C4DFF]/30 scale-102'
                      : isCompleted
                      ? 'bg-white/80 border-[#1B9A67]/30 text-[#171717]'
                      : 'bg-white/50 border-[#ECEAE4] opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold font-mono ${isActive ? 'text-[#6C4DFF]' : 'text-[#6B6B6B]'}`}>
                      {stg.num}
                    </span>
                    {isCompleted ? (
                      <span className="w-5 h-5 rounded-full bg-[#1B9A67]/10 text-[#1B9A67] flex items-center justify-center text-xs font-bold">✓</span>
                    ) : isActive ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-[#6C4DFF] animate-ping" />
                    ) : null}
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-[#6C4DFF] uppercase block">{stg.agent}</span>
                    <h3 className="text-base font-bold text-[#111111]">{stg.title}</h3>
                    <p className="text-xs text-[#6B6B6B] font-medium mt-0.5">{stg.sub}</p>
                  </div>

                  {isActive && (
                    <p className="text-[11px] text-[#6C4DFF] font-semibold line-clamp-2 pt-1 border-t border-[#ECEAE4]">
                      {stg.status}
                    </p>
                  )}
                </button>
              )
            })}
          </div>
        </section>

        {/* 5. AEGIS FUTURE-STATE SIMULATION (LOOKAHEAD HORIZON & CURRENT VS FUTURE) */}
        <section className="p-8 md:p-12 rounded-[24px] bg-white border border-[#ECEAE4] shadow-sm space-y-8 max-w-4xl mx-auto">
          <div className="space-y-2">
            <span className="text-xs font-bold text-[#6C4DFF] uppercase tracking-widest">PREDICTIVE LOOKAHEAD ENGINE</span>
            <h2 className="text-2xl md:text-3xl font-bold text-[#111111]">AEGIS FUTURE-STATE SIMULATION</h2>
            <p className="text-sm text-[#6B6B6B] font-medium leading-relaxed">
              "Without intervention, Sector 07 is projected to become the next high-risk area in 18 minutes."
            </p>
          </div>

          {/* 4-Horizon Progress Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center font-bold">
            <div className="p-4 rounded-2xl bg-[#F7F6F2] border border-[#ECEAE4]">
              <span className="text-xs text-[#6B6B6B] uppercase block">CURRENT STATE</span>
              <span className="text-2xl font-black text-[#111111]">42% FLOOD</span>
              <span className="text-[10px] text-[#6B6B6B] block">Baseline tick {tick}</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#F7F6F2] border border-[#ECEAE4]">
              <span className="text-xs text-[#1976FF] uppercase block">+10 MIN</span>
              <span className="text-2xl font-black text-[#1976FF]">53% FLOOD</span>
              <span className="text-[10px] text-[#6B6B6B] block">Sector 02 breach</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#F7F6F2] border border-[#ECEAE4]">
              <span className="text-xs text-[#D99A2B] uppercase block">+20 MIN</span>
              <span className="text-2xl font-black text-[#D99A2B]">67% FLOOD</span>
              <span className="text-[10px] text-[#6B6B6B] block">Route R14 submerged</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#F7F6F2] border border-[#ECEAE4]">
              <span className="text-xs text-[#E5484D] uppercase block">+30 MIN</span>
              <span className="text-2xl font-black text-[#E5484D]">74% FLOOD</span>
              <span className="text-[10px] text-[#E5484D] block">Sector 07 inundation</span>
            </div>
          </div>

          {/* CURRENT VS PROJECTED COMPARISON */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-2xl bg-[#F7F6F2] border border-[#ECEAE4]">
            <div className="space-y-1">
              <span className="text-xs font-bold text-[#6B6B6B] uppercase block">CURRENT DISASTER STATE</span>
              <div className="text-3xl font-black text-[#111111]">42% FLOODED</div>
              <span className="text-xs font-bold text-[#D99A2B] block">8,420 PEOPLE AT RISK</span>
            </div>

            <div className="space-y-1 border-t md:border-t-0 md:border-l border-[#ECEAE4] pt-4 md:pt-0 md:pl-6">
              <span className="text-xs font-bold text-[#E5484D] uppercase block">PROJECTED UNMITIGATED STATE</span>
              <div className="text-3xl font-black text-[#E5484D]">67% FLOODED</div>
              <span className="text-xs font-bold text-[#E5484D] block">14,200 PEOPLE AT RISK</span>
            </div>
          </div>
        </section>

        {/* 6. ONE DOMINANT DECISION REASONING CARD */}
        <section id="response" className="p-8 md:p-12 rounded-[24px] bg-white border-2 border-[#6C4DFF]/40 shadow-md space-y-6 max-w-4xl mx-auto scroll-mt-24">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#6C4DFF] uppercase tracking-widest">WHY DID AEGIS CHOOSE SECTOR 04?</span>
            <button
              onClick={() => setShowDecisionModal(true)}
              className="text-xs font-bold text-white bg-[#6C4DFF] hover:bg-[#5A38EE] px-4 py-2 rounded-full transition-all cursor-pointer shadow-md"
            >
              INSPECT DECISION MODAL →
            </button>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl md:text-5xl font-black text-[#111111] tracking-tight">
              EVACUATE SECTOR 04
            </h2>
            <span className="inline-block px-4 py-1.5 rounded-full bg-[#6C4DFF]/10 text-[#6C4DFF] font-black text-xs border border-[#6C4DFF]/20">
              94% CONFIDENCE DIRECTIVE
            </span>
          </div>

          <div className="space-y-3 pt-2">
            <span className="text-xs font-bold text-[#6B6B6B] uppercase block">DECISION FORMULA REASONING</span>
            <div className="p-4 rounded-2xl bg-[#F7F6F2] border border-[#ECEAE4] flex flex-wrap items-center justify-center gap-3 font-bold text-xs text-[#111111]">
              <span>WATER DEPTH (+32)</span>
              <span className="text-[#6C4DFF]">+</span>
              <span>POPULATION EXPOSURE (+25)</span>
              <span className="text-[#6C4DFF]">+</span>
              <span className="text-[#E5484D]">ROUTE ACCESS RISK (+14)</span>
              <span className="text-[#6C4DFF]">=</span>
              <span className="text-[#E5484D] font-black">SCORE 87 / 100</span>
            </div>
          </div>
        </section>

        {/* 7. RESOURCE ALLOCATION & ROUTE OPTIMIZATION */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[#6C4DFF] uppercase tracking-widest">AUTONOMOUS DISPATCH</span>
              <h2 className="text-2xl font-bold text-[#111111]">RESOURCE ALLOCATION & ROUTING</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Rescue Boat 02 */}
            <div className="p-6 rounded-[24px] bg-white border border-[#ECEAE4] shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl">🚤</span>
                <span className="px-3 py-1 rounded-full bg-[#6C4DFF]/10 text-[#6C4DFF] font-bold text-xs border border-[#6C4DFF]/20">
                  {['AVAILABLE', 'ALLOCATING', 'DISPATCHED', 'EN ROUTE', 'ON SCENE'][resourceStatusIndex]}
                </span>
              </div>

              <div>
                <h4 className="font-bold text-[#111111] text-base">Rescue Boat 02</h4>
                <p className="text-xs text-[#6B6B6B]">Distance: 2.4 km · ETA: 8 mins</p>
              </div>

              <div className="flex items-center justify-between text-[10px] font-bold text-[#6B6B6B] pt-2 border-t border-[#ECEAE4]">
                <span className={resourceStatusIndex >= 0 ? 'text-[#1B9A67]' : ''}>● AVAIL</span>
                <span className={resourceStatusIndex >= 1 ? 'text-[#1B9A67]' : ''}>──● ALLOC</span>
                <span className={resourceStatusIndex >= 2 ? 'text-[#1B9A67]' : ''}>──● DISPATCH</span>
                <span className={resourceStatusIndex >= 3 ? 'text-[#1B9A67]' : ''}>──● ROUTE</span>
                <span className={resourceStatusIndex >= 4 ? 'text-[#1B9A67] font-black' : ''}>──● SCENE</span>
              </div>
            </div>

            {/* A* Route Optimization */}
            <div className="p-6 rounded-[24px] bg-white border border-[#ECEAE4] shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl">🛣</span>
                <span className="px-3 py-1 rounded-full bg-[#E5484D]/10 text-[#E5484D] font-bold text-xs border border-[#E5484D]/20">
                  R14 BLOCKED → REROUTED
                </span>
              </div>

              <div>
                <h4 className="font-bold text-[#111111] text-base">A* Route Optimization</h4>
                <p className="text-xs text-[#6C4DFF] font-bold">Alternative Path: R21 → R18 → Sector 04 (ETA: 8 MIN)</p>
              </div>

              <div className="pt-2 border-t border-[#ECEAE4] text-xs font-semibold text-[#1B9A67]">
                ✓ NetworkX A* solver bypassed submerged roads
              </div>
            </div>
          </div>
        </section>

        {/* 8. RESPONSE HISTORY & WHAT / WHY / WHAT NEXT */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[#6C4DFF] uppercase tracking-widest">AUDIT TRAIL & DECISION EXPLANATIONS</span>
              <h2 className="text-2xl font-bold text-[#111111]">RESPONSE HISTORY</h2>
            </div>
          </div>

          <div className="bg-white border border-[#ECEAE4] rounded-[24px] p-6 shadow-sm divide-y divide-[#ECEAE4]">
            {responseHistory.map((item, idx) => (
              <div key={idx} className="py-4 first:pt-0 last:pb-0 space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-[#6C4DFF] bg-[#6C4DFF]/10 px-3 py-1 rounded-full shrink-0">
                    {item.time}
                  </span>
                  <h4 className="font-bold text-[#111111] text-sm flex items-center gap-2">
                    <span className="text-[#1B9A67]">✓</span>
                    {item.title}
                  </h4>
                </div>

                {/* WHAT / WHY / WHAT NEXT */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pl-4 text-xs">
                  <div className="p-2.5 rounded-xl bg-[#F7F6F2] border border-[#ECEAE4]">
                    <span className="text-[10px] font-bold text-[#6B6B6B] uppercase block">WHAT?</span>
                    <span className="font-bold text-[#111111]">{item.what}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#F7F6F2] border border-[#ECEAE4]">
                    <span className="text-[10px] font-bold text-[#6B6B6B] uppercase block">WHY?</span>
                    <span className="font-bold text-[#6C4DFF]">{item.why}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#F7F6F2] border border-[#ECEAE4]">
                    <span className="text-[10px] font-bold text-[#6B6B6B] uppercase block">WHAT NEXT?</span>
                    <span className="font-bold text-[#1B9A67]">{item.next}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 9. REAL-TIME FEEDBACK LOOP & FINAL COMPARISON */}
        <section id="impact" className="p-10 md:p-12 rounded-[24px] bg-white border border-[#ECEAE4] shadow-sm text-center space-y-6 max-w-4xl mx-auto scroll-mt-24">
          <div className="space-y-2">
            <span className="text-xs font-bold text-[#1B9A67] uppercase tracking-widest block">RESPONSE COMPLETE · REAL-TIME FEEDBACK LOOP</span>
            <h2 className="text-3xl md:text-5xl font-black text-[#111111] tracking-tight leading-tight">
              "AEGIS reduced projected disaster impact by 39%."
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-center font-bold">
            <div className="p-6 rounded-2xl bg-[#F7F6F2] border border-[#ECEAE4] space-y-2">
              <span className="text-xs text-[#E5484D] uppercase block font-bold">WITHOUT AEGIS</span>
              <div className="text-4xl font-black text-[#111111]">18,420</div>
              <span className="text-xs text-[#6B6B6B] block">PEOPLE AT RISK (0 SAVED)</span>
            </div>

            <div className="p-6 rounded-2xl bg-[#F7F6F2] border-2 border-[#1B9A67]/40 space-y-2">
              <span className="text-xs text-[#1B9A67] uppercase block font-bold">WITH AEGIS RESPONSE</span>
              <div className="text-4xl font-black text-[#1B9A67]">{peopleAtRiskCount.toLocaleString()}</div>
              <span className="text-xs text-[#1B9A67] block">PEOPLE AT RISK (39% RISK REDUCTION)</span>
            </div>
          </div>

          <div className="pt-2 flex justify-center">
            <button
              onClick={handleRunAnother}
              className="py-4 px-8 rounded-full bg-[#111111] hover:bg-[#222222] text-white font-bold text-sm transition-all cursor-pointer shadow-xl flex items-center gap-3 hover:scale-102"
            >
              <RefreshCw size={16} />
              <span>RUN NEW RANDOM SIMULATION →</span>
            </button>
          </div>
        </section>
      </main>

      {/* EXECUTIVE AI DECISION MODAL */}
      {showDecisionModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#6C4DFF]/40 rounded-[28px] p-8 max-w-lg w-full shadow-2xl space-y-6 text-center">
            <div className="inline-block px-4 py-1.5 rounded-full bg-[#6C4DFF]/10 text-[#6C4DFF] font-black text-xs border border-[#6C4DFF]/20 uppercase">
              AEGIS AI DECISION
            </div>

            <div className="space-y-1">
              <h3 className="text-3xl font-black text-[#111111]">EVACUATE SECTOR 04</h3>
              <span className="text-xs font-bold text-[#6C4DFF]">94% CONFIDENCE</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#F7F6F2] border border-[#ECEAE4] text-xs font-semibold text-[#6B6B6B] space-y-1 text-left">
              <p>• Water Depth score +32 (&gt;1.2m overflow)</p>
              <p>• Population Exposure score +25</p>
              <p>• Route Access risk score +14 (R14 submerged)</p>
            </div>

            <button
              onClick={handleExecuteResponse}
              className="w-full py-4 rounded-full font-bold text-sm text-white bg-[#6C4DFF] hover:bg-[#5A38EE] transition-all cursor-pointer shadow-lg shadow-[#6C4DFF]/20"
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
