'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import {
  Eye, CheckSquare, Brain, Zap, Truck, ShieldAlert, ShieldCheck, Play, ArrowDown,
  ChevronRight, Award, Compass, RefreshCw, Activity, CheckCircle2, ArrowRight,
  ChevronDown, Shield, Layers, Radio, Users
} from 'lucide-react'
import ModernHeader from './ModernHeader'
import { useDemoStore } from '@/stores/demoStore'
import TechnicalDetailsDrawer from '@/components/drawers/TechnicalDetailsDrawer'

const CityMap = dynamic(() => import('@/components/map/CityMap'), { ssr: false })

interface PresentationViewProps {
  onRunNewScenario?: () => void
}

export default function PresentationView({ onRunNewScenario }: PresentationViewProps) {
  const router = useRouter()
  const { baselineMetrics, aegisMetrics, resetDemo } = useDemoStore()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [showWhyReasoning, setShowWhyReasoning] = useState(false)
  const [activeAgentNode, setActiveAgentNode] = useState<string | null>('PREDICTOR')
  const [livesSavedCount, setLivesSavedCount] = useState(0)

  // Animated Countup for Lives Protected
  useEffect(() => {
    const target = aegisMetrics.peopleProtected || 5740
    let start = 0
    const duration = 1200
    const stepTime = 20
    const steps = duration / stepTime
    const increment = target / steps

    const timer = setInterval(() => {
      start += increment
      if (start >= target) {
        setLivesSavedCount(target)
        clearInterval(timer)
      } else {
        setLivesSavedCount(Math.floor(start))
      }
    }, stepTime)

    return () => clearInterval(timer)
  }, [aegisMetrics.peopleProtected])

  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleRunAnother = () => {
    if (onRunNewScenario) {
      onRunNewScenario()
    } else {
      resetDemo()
      router.push('/simulation')
    }
  }

  const agentNodes = [
    { name: 'RECON AGENT', desc: 'Ingests CV aerial video & drone telemetry', status: 'ACTIVE', color: '#06b6d4' },
    { name: 'VERIFICATION AGENT', desc: 'Cross-checks reports to eliminate false data', status: 'ACTIVE', color: '#3b82f6' },
    { name: 'SEVERITY AGENT', desc: 'Calculates water velocity & inundation depth', status: 'ACTIVE', color: '#3b82f6' },
    { name: 'PREDICTION AGENT', desc: 'Forecasts where flooding will spread next', status: 'ACTIVE', color: '#8b5cf6' },
    { name: 'POLICY COMMANDER', desc: 'Selects optimal pre-emptive emergency actions', status: 'ACTIVE', color: '#f59e0b' },
    { name: 'RESOURCE ALLOCATOR', desc: 'Dispatches rescue boats & activates shelters', status: 'ACTIVE', color: '#f59e0b' },
    { name: 'ROUTING AGENT', desc: 'Finds a safer route around flooded roads', status: 'ACTIVE', color: '#10b981' },
    { name: 'COMMUNICATION AGENT', desc: 'Issues targeted citizen evacuation alerts', status: 'ACTIVE', color: '#10b981' },
  ]

  return (
    <div className="min-h-screen bg-[#070B14] text-white font-sans antialiased select-none pb-24 relative">
      {/* FLOATING AI STATUS BADGE */}
      <div className="fixed bottom-6 right-6 z-40 hidden md:flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#0d1424]/90 border border-cyan-500/30 shadow-2xl text-xs font-mono font-bold text-cyan-300 backdrop-blur-md">
        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
        <span>AEGIS OODA LOOP ● ACTIVE</span>
      </div>

      {/* FLOATING HEADER */}
      <ModernHeader
        onOpenDetails={() => setDrawerOpen(true)}
        onScrollTo={scrollTo}
      />

      <main className="max-w-[1300px] mx-auto px-6 md:px-10 space-y-16 md:space-y-20 pt-8">
        {/* HERO SECTION */}
        <section id="hero" className="text-center space-y-6 pt-4 max-w-4xl mx-auto scroll-mt-24">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 text-cyan-300 font-mono font-bold text-xs tracking-wider uppercase border border-cyan-500/30 shadow-lg">
            <Shield size={14} className="text-cyan-400" />
            <span>AEGIS AUTONOMOUS FLOOD INTELLIGENCE PLATFORM</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-[1.1]">
            AI-POWERED <span className="bg-gradient-to-r from-cyan-400 via-emerald-400 to-indigo-400 bg-clip-text text-transparent">FLOOD RESPONSE</span>
          </h1>

          <p className="text-lg md:text-xl font-bold text-cyan-200 tracking-tight">
            "From the first signal to the right response."
          </p>

          <p className="text-sm md:text-base text-slate-300 font-medium max-w-2xl mx-auto leading-relaxed">
            AEGIS combines real-time aerial observations, dynamic digital twin simulation, and autonomous multi-agent OODA decision-making to protect lives before disaster hits.
          </p>

          {/* BADGES */}
          <div className="flex flex-wrap items-center justify-center gap-2 font-mono font-bold text-xs text-slate-300 pt-1">
            <span className="px-3.5 py-1.5 rounded-full bg-[#0d1424] border border-slate-800 shadow-md text-cyan-300">LIVE SIMULATION</span>
            <span className="px-3.5 py-1.5 rounded-full bg-[#0d1424] border border-slate-800 shadow-md text-emerald-300">CITY DIGITAL TWIN</span>
            <span className="px-3.5 py-1.5 rounded-full bg-[#0d1424] border border-slate-800 shadow-md text-purple-300">10 SPECIALIZED AI AGENTS</span>
            <span className="px-3.5 py-1.5 rounded-full bg-[#0d1424] border border-slate-800 shadow-md text-amber-300">AUTONOMOUS OODA LOOP</span>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-3">
            <button
              onClick={() => scrollTo('simulation')}
              className="w-full sm:w-auto py-4 px-8 rounded-2xl font-mono text-sm font-black text-black bg-gradient-to-r from-cyan-400 via-emerald-400 to-indigo-500 hover:scale-105 transition-all cursor-pointer shadow-xl shadow-cyan-500/20 flex items-center justify-center gap-2.5 border border-white/20"
            >
              <span>RUN FLOOD SIMULATION</span>
              <Play size={16} fill="currentColor" />
            </button>

            <button
              onClick={() => scrollTo('analysis')}
              className="w-full sm:w-auto py-4 px-8 rounded-2xl font-mono text-sm font-bold text-slate-200 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>EXPLORE AEGIS ANALYSIS</span>
              <ArrowDown size={16} />
            </button>
          </div>
        </section>

        {/* HERO CITY DIGITAL TWIN SIMULATION */}
        <section id="simulation" className="space-y-6 scroll-mt-24">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3">
            <div>
              <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest block">REAL-TIME DIGITAL TWIN</span>
              <h2 className="text-2xl md:text-3xl font-black text-white">CITY FLOOD PROPAGATION SIMULATION</h2>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs font-bold text-cyan-300 bg-[#0d1424] px-4 py-2 rounded-xl border border-cyan-500/30 shadow-md">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              <span>T+08:42 · SIMULATION ACTIVE</span>
            </div>
          </div>

          {/* City Canvas Container with Floating Glass Overlay Cards */}
          <div className="rounded-3xl overflow-hidden border border-slate-800/80 bg-[#070B14] h-[580px] relative shadow-2xl">
            {/* Overlay 1: Top Left */}
            <div className="absolute top-4 left-4 z-10 bg-[#0d1424]/90 backdrop-blur-md border border-cyan-500/30 rounded-2xl px-4 py-2.5 shadow-xl text-xs font-mono font-bold text-cyan-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>DIGITAL TWIN · REAL-TIME TELEMETRY</span>
            </div>

            {/* Overlay 2: Top Right */}
            <div className="absolute top-4 right-4 z-10 bg-[#0d1424]/90 backdrop-blur-md border border-slate-800/80 rounded-2xl px-4 py-2.5 shadow-xl text-xs font-mono font-bold text-slate-200">
              <span className="text-slate-400 font-medium block text-[10px]">WATER LEVEL</span>
              <span className="text-cyan-400 font-black text-sm">2.41m ↑</span>
            </div>

            {/* Overlay 3: Bottom Left */}
            <div className="absolute bottom-4 left-4 z-10 bg-[#0d1424]/90 backdrop-blur-md border border-slate-800/80 rounded-2xl px-4 py-2.5 shadow-xl text-xs font-mono font-bold text-slate-200">
              <span className="text-slate-400 font-medium block text-[10px]">FLOODED AREA</span>
              <span className="text-amber-400 font-black text-sm">{baselineMetrics.floodedAreaPct}%</span>
            </div>

            {/* Overlay 4: Bottom Right */}
            <div className="absolute bottom-4 right-4 z-10 bg-[#0d1424]/90 backdrop-blur-md border border-slate-800/80 rounded-2xl px-4 py-2.5 shadow-xl text-xs font-mono font-bold text-slate-200">
              <span className="text-slate-400 font-medium block text-[10px]">PEOPLE AT RISK</span>
              <span className="text-red-400 font-black text-sm">{baselineMetrics.peopleAtRisk.toLocaleString()}</span>
            </div>

            {/* Actual City Map Canvas */}
            <CityMap className="w-full h-full" />
          </div>
        </section>

        {/* BASELINE COMPLETE SUMMARY CARD */}
        <section className="p-8 md:p-10 rounded-3xl bg-[#0d1424] border border-slate-800/80 shadow-2xl text-center space-y-6 max-w-3xl mx-auto backdrop-blur-md">
          <div className="flex justify-center gap-2 font-mono font-bold text-xs">
            <span className="px-3 py-1 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700">PHASE 01: NORMAL</span>
            <span className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">PHASE 02: BREACH</span>
            <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">PHASE 03: EXPANDS</span>
          </div>

          <div className="space-y-2">
            <span className="px-3.5 py-1 rounded-full bg-red-500/10 text-red-400 font-mono font-bold text-xs border border-red-500/30 uppercase">
              PHASE 04: BASELINE FLOOD COMPLETE
            </span>

            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-snug pt-2">
              "Without autonomous intervention, flooding reached {baselineMetrics.floodedAreaPct}% of the city."
            </h2>
          </div>

          {/* 4 Summary Numbers */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center font-mono font-bold pt-2">
            <div className="p-3.5 rounded-2xl bg-[#070B14] border border-slate-800">
              <span className="text-2xl font-black text-amber-400 block">{baselineMetrics.floodedAreaPct}%</span>
              <span className="text-[10px] text-slate-400 uppercase font-sans font-bold">CITY FLOODED</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#070B14] border border-slate-800">
              <span className="text-2xl font-black text-amber-400 block">{baselineMetrics.peopleAtRisk.toLocaleString()}</span>
              <span className="text-[10px] text-slate-400 uppercase font-sans font-bold">PEOPLE AT RISK</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#070B14] border border-slate-800">
              <span className="text-2xl font-black text-red-400 block">{baselineMetrics.blockedRoads}</span>
              <span className="text-[10px] text-slate-400 uppercase font-sans font-bold">ROADS BLOCKED</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#070B14] border border-slate-800">
              <span className="text-2xl font-black text-slate-500 block">0</span>
              <span className="text-[10px] text-slate-400 uppercase font-sans font-bold">SAVED (NO AI)</span>
            </div>
          </div>

          <div className="pt-2 flex justify-center">
            <button
              onClick={() => scrollTo('analysis')}
              className="py-4 px-8 rounded-2xl font-mono text-sm font-black text-black bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-500 hover:scale-105 transition-all cursor-pointer shadow-xl shadow-emerald-500/20 flex items-center gap-2 border border-white/20"
            >
              <span>ANALYZE WITH AEGIS →</span>
            </button>
          </div>
        </section>

        {/* AEGIS ANALYSIS SECTION */}
        <section id="analysis" className="space-y-12 scroll-mt-24">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest block">CLOSED-LOOP OODA PIPELINE</span>
            <h2 className="text-3xl md:text-4xl font-black text-white">AEGIS INCIDENT ANALYSIS</h2>
            <p className="text-sm text-slate-300 font-medium font-sans">"From observation to autonomous emergency action."</p>
          </div>

          {/* Stepper Timeline Progress Bar */}
          <div className="bg-[#0d1424] border border-slate-800/80 rounded-2xl p-4 shadow-2xl max-w-4xl mx-auto flex items-center justify-between font-mono font-bold text-xs text-slate-300 px-6 backdrop-blur-md">
            <div className="flex items-center gap-2 text-cyan-400">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              <span>01 OBSERVE</span>
            </div>
            <span className="text-slate-700">───</span>
            <div className="flex items-center gap-2 text-cyan-400">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              <span>02 VERIFY</span>
            </div>
            <span className="text-slate-700">───</span>
            <div className="flex items-center gap-2 text-purple-400">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
              <span>03 PREDICT</span>
            </div>
            <span className="text-slate-700">───</span>
            <div className="flex items-center gap-2 text-amber-400">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span>04 DECIDE</span>
            </div>
            <span className="text-slate-700">───</span>
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 size={16} />
              <span>05 ACT</span>
            </div>
          </div>

          {/* CONTINUOUS STORYLINE WITH LEFT VERTICAL CONNECTING LINE */}
          <div className="relative pl-6 md:pl-10 space-y-12 border-l-2 border-cyan-500/30 ml-2 md:ml-4">
            {/* 01 / OBSERVE */}
            <div className="relative space-y-6">
              <div className="absolute -left-[31px] md:-left-[47px] top-1.5 w-5 h-5 rounded-full bg-[#070B14] border-4 border-cyan-400 shadow-lg" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-3">
                  <span className="text-xs font-mono font-bold text-cyan-400 uppercase">01 / OBSERVE</span>
                  <h3 className="text-2xl font-black text-white">WHAT AEGIS SAW</h3>
                  <p className="text-sm text-slate-300 leading-relaxed font-sans">
                    "Flooding expanded across multiple residential sectors with water levels rising."
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1 font-mono font-bold text-xs">
                    <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">AERIAL OBSERVATION</span>
                    <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">WATER LEVEL</span>
                    <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">CITIZEN REPORTS</span>
                  </div>
                </div>

                {/* Evidence Composition */}
                <div className="p-6 rounded-2xl bg-[#0d1424] border border-slate-800/80 shadow-2xl flex items-center justify-between gap-3 font-mono">
                  <div className="text-center p-3 rounded-xl bg-[#070B14] border border-slate-800 flex-1">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">AERIAL CV</span>
                    <span className="text-sm font-black text-cyan-400">31% FLOOD</span>
                  </div>
                  <span className="text-cyan-400 font-bold">→</span>
                  <div className="text-center p-3 rounded-xl bg-[#070B14] border border-slate-800 flex-1">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">WATER SENSOR</span>
                    <span className="text-sm font-black text-amber-400">2.4m ↑</span>
                  </div>
                  <span className="text-cyan-400 font-bold">→</span>
                  <div className="text-center p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex-1">
                    <span className="text-[10px] font-bold text-cyan-300 block uppercase">REPORTS</span>
                    <span className="text-sm font-black text-cyan-300">12 RECV</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 02 / VERIFY */}
            <div className="relative space-y-6">
              <div className="absolute -left-[31px] md:-left-[47px] top-1.5 w-5 h-5 rounded-full bg-[#070B14] border-4 border-cyan-400 shadow-lg" />

              <div className="space-y-3">
                <span className="text-xs font-mono font-bold text-cyan-400 uppercase">02 / VERIFY</span>
                <h3 className="text-2xl font-black text-white">WHAT AEGIS VERIFIED</h3>
                <p className="text-sm text-slate-300 max-w-xl font-sans leading-relaxed">
                  "AEGIS cross-checks aerial imagery with citizen reports to remove duplicate, conflicting, and low-confidence entries."
                </p>
              </div>

              {/* Filtering Diagram */}
              <div className="p-6 rounded-2xl bg-[#0d1424] border border-slate-800/80 shadow-2xl max-w-2xl flex items-center justify-around font-mono font-bold text-sm">
                <div className="text-center">
                  <span className="text-2xl font-black text-slate-200 block">12</span>
                  <span className="text-[11px] text-slate-400">RAW REPORTS</span>
                </div>
                <span className="text-cyan-400 font-bold text-sm">→ AI VERIFICATION →</span>
                <div className="text-center">
                  <span className="text-2xl font-black text-emerald-400 block">8</span>
                  <span className="text-[11px] text-emerald-400">VERIFIED INCIDENTS</span>
                </div>
                <span className="text-red-400 font-bold text-[11px]">(4 Filtered)</span>
              </div>
            </div>

            {/* 03 / PREDICT */}
            <div className="relative space-y-6">
              <div className="absolute -left-[31px] md:-left-[47px] top-1.5 w-5 h-5 rounded-full bg-[#070B14] border-4 border-purple-400 shadow-lg" />

              <div className="p-8 rounded-2xl bg-[#0d1424] border border-purple-500/40 shadow-2xl space-y-6">
                <div className="space-y-2">
                  <span className="text-xs font-mono font-bold text-purple-400 uppercase">03 / PREDICT</span>
                  <h3 className="text-2xl font-black text-white">WHAT HAPPENS NEXT?</h3>
                  <p className="text-2xl font-black text-purple-300 font-sans">
                    "Flood expected to reach Sector 07 in approximately 30 minutes."
                  </p>
                </div>

                {/* Timeline */}
                <div className="space-y-2 pt-2 font-mono">
                  <div className="flex justify-between text-xs font-bold text-slate-400">
                    <span>NOW</span>
                    <span>10 MIN</span>
                    <span>20 MIN</span>
                    <span className="text-purple-300 font-black">30 MIN (SECTOR 07)</span>
                  </div>
                  <div className="h-3.5 bg-[#070B14] rounded-full overflow-hidden border border-slate-800">
                    <div className="h-full bg-gradient-to-r from-cyan-400 via-purple-500 to-amber-500 rounded-full w-[85%]" />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-2 font-mono font-bold text-xs">
                  <div>
                    <span className="text-xl font-black text-white block">8,420</span>
                    <span className="text-slate-400 text-[10px]">PEOPLE POTENTIALLY AFFECTED</span>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/30">
                    HIGH RISK
                  </span>
                  <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30">
                    94% CONFIDENCE
                  </span>
                </div>
              </div>
            </div>

            {/* 04 / DECIDE */}
            <div className="relative space-y-6">
              <div className="absolute -left-[31px] md:-left-[47px] top-1.5 w-5 h-5 rounded-full bg-[#070B14] border-4 border-amber-400 shadow-lg animate-pulse" />

              <div className="p-8 md:p-10 rounded-2xl bg-gradient-to-r from-[#0d1424] via-[#070B14] to-[#0d1424] border-2 border-amber-500/50 shadow-2xl space-y-6 text-center">
                <div className="space-y-2">
                  <span className="text-xs font-mono font-bold text-amber-400 uppercase">04 / DECIDE</span>
                  <h3 className="text-xs font-mono font-bold text-slate-400 uppercase">POLICY COMMANDER DIRECTIVE</h3>
                  <div className="text-4xl md:text-5xl font-black text-white tracking-tight">
                    EVACUATE SECTOR 04
                  </div>
                </div>

                <div className="inline-block px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-300 font-mono font-bold text-xs border border-amber-500/30">
                  94% CONFIDENCE
                </div>

                {/* Reasoning Formula */}
                <div className="p-4 rounded-xl bg-[#070B14] border border-slate-800 flex flex-wrap items-center justify-center gap-3 font-mono font-bold text-xs text-white">
                  <span className="text-amber-300">RISING WATER</span>
                  <span className="text-cyan-400">+</span>
                  <span className="text-amber-300">HIGH POPULATION</span>
                  <span className="text-cyan-400">+</span>
                  <span className="text-red-400">BLOCKED ROUTE</span>
                  <span className="text-cyan-400">=</span>
                  <span className="text-emerald-400 font-black">EVACUATION REQUIRED</span>
                </div>

                <p className="text-xs text-slate-300 max-w-lg mx-auto font-sans leading-relaxed">
                  "AEGIS identified Sector 04 as high priority because flood expansion threatens residents and the primary evacuation corridor."
                </p>
              </div>
            </div>

            {/* 05 / ACT */}
            <div className="relative space-y-6">
              <div className="absolute -left-[31px] md:-left-[47px] top-1.5 w-5 h-5 rounded-full bg-[#070B14] border-4 border-emerald-400 shadow-lg" />

              <div className="space-y-4">
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase">05 / ACT</span>
                <h3 className="text-2xl font-black text-white">AUTONOMOUS RESOURCE DISPATCH</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-5 rounded-2xl bg-[#0d1424] border border-slate-800/80 shadow-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">🚤</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono font-bold text-[10px] border border-emerald-500/30">DEPLOYED</span>
                    </div>
                    <h4 className="font-bold text-white text-sm">Rescue Boat 02</h4>
                    <p className="text-[11px] text-slate-400 font-mono">Dispatched to Sector 04</p>
                  </div>

                  <div className="p-5 rounded-2xl bg-[#0d1424] border border-slate-800/80 shadow-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">🏠</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono font-bold text-[10px] border border-emerald-500/30">ACTIVATED</span>
                    </div>
                    <h4 className="font-bold text-white text-sm">Shelter 03</h4>
                    <p className="text-[11px] text-slate-400 font-mono">Evacuation capacity active</p>
                  </div>

                  <div className="p-5 rounded-2xl bg-[#0d1424] border border-slate-800/80 shadow-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">🛣</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 font-mono font-bold text-[10px] border border-purple-500/30">REROUTED</span>
                    </div>
                    <h4 className="font-bold text-white text-sm">Routing Agent</h4>
                    <p className="text-[11px] text-slate-400 font-mono">Alternative route calculated</p>
                  </div>

                  <div className="p-5 rounded-2xl bg-[#0d1424] border border-slate-800/80 shadow-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">📢</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono font-bold text-[10px] border border-emerald-500/30">ISSUED</span>
                    </div>
                    <h4 className="font-bold text-white text-sm">Evacuation Alert</h4>
                    <p className="text-[11px] text-slate-400 font-mono">Communication sent</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* MULTI-AGENT ARCHITECTURE */}
        <section className="p-8 md:p-10 rounded-3xl bg-[#0d1424] border border-slate-800/80 shadow-2xl text-center space-y-6 max-w-4xl mx-auto">
          <div className="space-y-1">
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">MULTI-AGENT SYSTEM SYSTEM</span>
            <h2 className="text-2xl font-bold text-white">10 SPECIALIZED AI AGENTS</h2>
            <p className="text-xs text-slate-300 font-sans">"Specialized agents coordinated the emergency response."</p>
          </div>

          {/* Interactive Agent Network Nodes */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto text-left font-mono font-bold text-xs">
            {agentNodes.map((agt, idx) => (
              <button
                key={idx}
                onClick={() => setActiveAgentNode(agt.name)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  activeAgentNode === agt.name
                    ? 'bg-cyan-500/10 border-cyan-500 text-cyan-300 ring-2 ring-cyan-500/20'
                    : 'bg-[#070B14] border-slate-800 text-slate-300 hover:bg-[#0d1424]'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span>{agt.name}</span>
                </div>
                <p className="text-[10px] text-slate-400 font-sans font-normal leading-tight line-clamp-2">{agt.desc}</p>
              </button>
            ))}
          </div>
        </section>

        {/* IMPACT SECTION */}
        <section id="impact" className="space-y-6 pt-4 scroll-mt-24">
          <div className="text-center space-y-1">
            <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">QUANTITATIVE DEMO PROOF</span>
            <h2 className="text-3xl font-black text-white">THE DIFFERENCE AEGIS MAKES</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* WITHOUT AEGIS */}
            <div className="p-8 rounded-3xl bg-[#0d1424] border border-slate-800/80 shadow-2xl space-y-4 text-center">
              <span className="text-xs font-mono font-bold text-red-400 uppercase tracking-wider block">WITHOUT AEGIS</span>
              <div className="space-y-3 font-mono font-bold">
                <div>
                  <div className="text-3xl font-black text-white">{baselineMetrics.peopleAtRisk.toLocaleString()}</div>
                  <div className="text-xs text-slate-400 uppercase font-sans">PEOPLE AT RISK</div>
                </div>
                <div>
                  <div className="text-3xl font-black text-white">{baselineMetrics.blockedRoads}</div>
                  <div className="text-xs text-slate-400 uppercase font-sans">ROADS BLOCKED</div>
                </div>
                <div>
                  <div className="text-3xl font-black text-red-400">0</div>
                  <div className="text-xs text-slate-400 uppercase font-sans">PROTECTED</div>
                </div>
              </div>
            </div>

            {/* WITH AEGIS */}
            <div className="p-8 rounded-3xl bg-[#0d1424] border-2 border-emerald-500/40 shadow-2xl space-y-4 text-center">
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider block">WITH AEGIS</span>
              <div className="space-y-3 font-mono font-bold">
                <div>
                  <div className="text-4xl font-black text-emerald-400">{livesSavedCount.toLocaleString()}</div>
                  <div className="text-xs text-slate-400 uppercase font-sans">PEOPLE PROTECTED</div>
                </div>
                <div>
                  <div className="text-3xl font-black text-white">{aegisMetrics.riskReductionPct}%</div>
                  <div className="text-xs text-slate-400 uppercase font-sans">RISK REDUCED</div>
                </div>
                <div>
                  <div className="text-3xl font-black text-white">{aegisMetrics.resourcesDeployed}</div>
                  <div className="text-xs text-slate-400 uppercase font-sans">RESOURCES DEPLOYED</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FINAL STARTUP FOOTER */}
        <section className="p-10 md:p-14 rounded-3xl bg-gradient-to-r from-[#0d1424] via-[#070B14] to-[#0d1424] border border-cyan-500/40 shadow-2xl text-center space-y-6 max-w-3xl mx-auto">
          <div className="space-y-2">
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
              AEGIS
            </h2>
            <p className="text-base md:text-xl font-bold text-cyan-300 tracking-tight">
              "See the flood. Understand the risk. Act before it's too late."
            </p>
          </div>

          <div className="pt-2 flex justify-center">
            <button
              onClick={handleRunAnother}
              className="py-4 px-8 rounded-2xl font-mono text-sm font-black text-black bg-gradient-to-r from-cyan-400 via-emerald-400 to-indigo-500 hover:scale-105 transition-all cursor-pointer shadow-xl shadow-cyan-500/20 flex items-center gap-2 border border-white/20"
            >
              <RefreshCw size={16} />
              <span>RUN ANOTHER SIMULATION</span>
            </button>
          </div>

          <div className="pt-4 border-t border-slate-800 text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
            Autonomous Flood Intelligence · AI • Simulation • Computer Vision • Decision Intelligence
          </div>
        </section>
      </main>

      {/* TECHNICAL DETAILS DRAWER MODAL */}
      <TechnicalDetailsDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  )
}
