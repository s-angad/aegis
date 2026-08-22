'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Brain, Eye, CheckSquare, Zap, Truck, ShieldAlert, ShieldCheck, Play, ArrowRight,
  RotateCcw, Award, Users, Activity, Radio, AlertTriangle, Navigation, CheckCircle2
} from 'lucide-react'
import { useDemoStore } from '@/stores/demoStore'
import TechnicalDetailsDrawer from '@/components/drawers/TechnicalDetailsDrawer'

interface CommandDashboardProps {
  onRunNewScenario?: () => void
}

export default function CommandDashboard({ onRunNewScenario }: CommandDashboardProps) {
  const router = useRouter()
  const { baselineMetrics, aegisMetrics, setPhase, resetDemo } = useDemoStore()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [activeOoda, setActiveOoda] = useState(1)

  // Animated Countup State
  const [livesSavedCount, setLivesSavedCount] = useState(0)

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

  const handleStartAegisScenario = () => {
    if (onRunNewScenario) {
      onRunNewScenario()
    } else {
      resetDemo()
      router.push('/simulation')
    }
  }

  const comparisonRows = [
    { label: 'Flooded Area', baseline: `${baselineMetrics.floodedAreaPct}%`, aegis: `${aegisMetrics.floodedAreaPct}%`, diff: '-25%', good: true },
    { label: 'People at Risk', baseline: baselineMetrics.peopleAtRisk.toLocaleString(), aegis: aegisMetrics.peopleAtRisk.toLocaleString(), diff: '-10,000', good: true },
    { label: 'People Protected', baseline: '0', aegis: livesSavedCount.toLocaleString(), diff: `+${livesSavedCount.toLocaleString()}`, good: true },
    { label: 'Shelters Activated', baseline: '0', aegis: `${aegisMetrics.sheltersActivated}`, diff: '+3', good: true },
    { label: 'Resources Deployed', baseline: '0', aegis: `${aegisMetrics.resourcesDeployed}`, diff: '+7', good: true },
    { label: 'Routes Adapted (A*)', baseline: '0', aegis: `${aegisMetrics.routesAdapted}`, diff: '+4', good: true },
    { label: 'Risk Reduction Impact', baseline: '0%', aegis: `${aegisMetrics.riskReductionPct}%`, diff: '+78%', good: true },
  ]

  const oodaStages = [
    {
      id: 1,
      num: '01',
      title: 'OBSERVE',
      subtitle: 'What AEGIS saw',
      icon: Eye,
      color: '#06b6d4',
      badge: 'AERIAL & CITIZEN RECON',
      desc: 'AEGIS ingested aerial imagery (94% flood detection confidence), 12 citizen emergency reports, and water sensor depth telemetry (2.8m overflow).'
    },
    {
      id: 2,
      num: '02',
      title: 'VERIFY',
      subtitle: 'What AEGIS verified',
      icon: CheckSquare,
      color: '#3b82f6',
      badge: 'REPORT FUSION',
      desc: 'Filtered 12 citizen reports into 8 verified emergency sites. 3 duplicate records and 1 false alarm were automatically removed.'
    },
    {
      id: 3,
      num: '03',
      title: 'PREDICT',
      subtitle: 'What happens next',
      icon: Brain,
      color: '#8b5cf6',
      badge: 'FLOOD FORECAST',
      desc: 'Simulated 30-minute flood propagation path. Identified Sector 07 (8,420 citizens) as the next critical inundation front with 94% confidence.'
    },
    {
      id: 4,
      num: '04',
      title: 'DECIDE',
      subtitle: 'AEGIS operational plan',
      icon: Zap,
      color: '#f59e0b',
      badge: 'POLICY COMMAND',
      desc: 'Recommended immediate pre-emptive evacuation of Sector 04, shelter 03 activation, and vehicle rerouting around submerged road R14.'
    },
    {
      id: 5,
      num: '05',
      title: 'ACT',
      subtitle: 'Autonomous execution',
      icon: Truck,
      color: '#10b981',
      badge: 'RESOURCE DISPATCH',
      desc: 'Dispatched Rescue Boat 02, activated Shelter 03, and calculated safe A* alternative route via R16 → R18 to protect 5,740 lives.'
    },
  ]

  const agentTeam = [
    { name: 'Drone Recon Agent', role: 'Aerial CV Frame Ingestion & Sensor Fusion', status: 'ACTIVE', color: '#06b6d4' },
    { name: 'Sentinel Agent', role: 'Raw Citizen Report Telemetry Ingestion', status: 'ACTIVE', color: '#06b6d4' },
    { name: 'Verification Agent', role: 'Duplicate Filtering & Truth Normalization', status: 'ACTIVE', color: '#3b82f6' },
    { name: 'Severity Agent', role: 'Visual Velocity & Threat Level Scoring', status: 'ACTIVE', color: '#3b82f6' },
    { name: 'Prediction Agent', role: '30-Minute Cellular Flood Spread Forecasting', status: 'ACTIVE', color: '#8b5cf6' },
    { name: 'Policy Commander', role: 'Multi-Objective Emergency Action Selection', status: 'ACTIVE', color: '#f59e0b' },
    { name: 'Resource Allocator', role: 'Equipment & Crew Dispatch Coordination', status: 'ACTIVE', color: '#f59e0b' },
    { name: 'Routing Agent', role: 'NetworkX A* Dynamic Obstacle Rerouting', status: 'ACTIVE', color: '#10b981' },
    { name: 'Communication Agent', role: 'Citizen Public Safety Alert Generation', status: 'ACTIVE', color: '#10b981' },
    { name: 'Master Orchestrator', role: 'Closed-Loop OODA Execution Management', status: 'ACTIVE', color: '#ec4899' },
  ]

  return (
    <div className="min-h-screen bg-[#070B14] text-white font-sans select-none overflow-x-hidden p-6 md:p-12 space-y-12 max-w-[1700px] mx-auto">
      {/* 1. TOP NAVIGATION / HEADER */}
      <div className="bg-[#0d1424] border border-slate-800/80 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center text-cyan-400 text-2xl shadow-xl">
            🌊
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">AEGIS FLOOD</h1>
              <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-bold uppercase">
                COMMAND CENTER v2.0
              </span>
            </div>
            <p className="text-sm text-slate-300 font-medium mt-1">
              Autonomous Flood Intelligence & Emergency Operations System
            </p>
          </div>
        </div>

        {/* System Badges & Details Action */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            SYSTEM OPERATIONAL
          </div>

          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold">
            <Users size={14} />
            10 AI AGENTS ACTIVE
          </div>

          <button
            onClick={() => setDrawerOpen(true)}
            className="py-2.5 px-5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white transition-all cursor-pointer text-xs font-mono font-bold"
          >
            [ SYSTEM DETAILS → ]
          </button>
        </div>
      </div>

      {/* 2. SECTION 1 — INCIDENT SUMMARY HERO & LARGE KPI CARDS */}
      <div className="space-y-6">
        <div>
          <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
            INCIDENT RESPONSE SUMMARY
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-white mt-1">FLOOD RESPONSE REPORT</h2>
          <p className="text-base text-slate-300 mt-1 max-w-3xl">
            "AEGIS analyzed the disaster, predicted escalation, and formulated an autonomous response."
          </p>
        </div>

        {/* 5 Large KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="p-6 rounded-3xl bg-[#0d1424] border border-slate-800/80 shadow-xl space-y-2">
            <span className="text-xs font-mono text-slate-400 font-bold uppercase">FLOODED AREA</span>
            <div className="text-4xl font-black text-amber-400 font-mono">73%</div>
            <p className="text-xs text-slate-400 font-sans">↑ High exposure across city grid</p>
          </div>

          <div className="p-6 rounded-3xl bg-[#0d1424] border border-slate-800/80 shadow-xl space-y-2">
            <span className="text-xs font-mono text-slate-400 font-bold uppercase">PEOPLE AT RISK</span>
            <div className="text-4xl font-black text-amber-400 font-mono">18,420</div>
            <p className="text-xs text-slate-400 font-sans">Trapped in low-elevation sectors</p>
          </div>

          <div className="p-6 rounded-3xl bg-[#0d1424] border border-slate-800/80 shadow-xl space-y-2">
            <span className="text-xs font-mono text-slate-400 font-bold uppercase">ROADS BLOCKED</span>
            <div className="text-4xl font-black text-red-400 font-mono">65</div>
            <p className="text-xs text-slate-400 font-sans">Evacuation corridors affected</p>
          </div>

          <div className="p-6 rounded-3xl bg-[#0d1424] border border-slate-800/80 shadow-xl space-y-2">
            <span className="text-xs font-mono text-slate-400 font-bold uppercase">UNMITIGATED SAVED</span>
            <div className="text-4xl font-black text-slate-500 font-mono">0</div>
            <p className="text-xs text-slate-400 font-sans">Without AI intervention</p>
          </div>

          <div className="p-6 rounded-3xl bg-[#0d1424] border border-slate-800/80 shadow-xl space-y-2">
            <span className="text-xs font-mono text-slate-400 font-bold uppercase">CRITICAL SECTORS</span>
            <div className="text-4xl font-black text-purple-400 font-mono">6</div>
            <p className="text-xs text-slate-400 font-sans">Immediate response required</p>
          </div>
        </div>
      </div>

      {/* 3. SECTION 2 — CRITICAL STATUS BANNER */}
      <div className="p-6 md:p-8 rounded-3xl bg-amber-950/30 border border-amber-500/50 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <ShieldAlert className="w-10 h-10 text-amber-400 shrink-0" />
          <div>
            <h3 className="text-xl font-black text-amber-300 uppercase tracking-tight">
              CRITICAL FLOOD EVENT DETECTED
            </h3>
            <p className="text-sm text-slate-300 font-medium mt-0.5">
              "Without intervention, flooding reached 73% of the monitored city."
            </p>
          </div>
        </div>

        <button
          onClick={handleStartAegisScenario}
          className="py-4 px-8 rounded-2xl font-mono text-base font-black text-black bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-500 hover:scale-105 transition-all cursor-pointer shadow-xl shadow-emerald-500/25 shrink-0 flex items-center gap-3 border border-white/20"
        >
          <Play size={20} fill="currentColor" />
          [ RUN AUTONOMOUS AEGIS RESPONSE → ]
        </button>
      </div>

      {/* 4. SECTION 3 — AEGIS MISSION CONTROL OODA PROCESS CARDS */}
      <div className="space-y-6">
        <div>
          <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
            AEGIS AUTONOMOUS RESPONSE
          </span>
          <h2 className="text-3xl font-black text-white mt-1">OODA DISASTER PIPELINE</h2>
          <p className="text-sm text-slate-300 mt-1">
            "How AEGIS turned flood observations into emergency actions"
          </p>
        </div>

        {/* 5 OODA Stage Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
          {oodaStages.map((stg) => {
            const Icon = stg.icon
            const isSelected = activeOoda === stg.id

            return (
              <button
                key={stg.id}
                onClick={() => setActiveOoda(stg.id)}
                className={`p-6 rounded-3xl border transition-all cursor-pointer text-left flex flex-col justify-between h-56 shadow-xl ${
                  isSelected
                    ? 'bg-[#0d1424] border-cyan-400 ring-2 ring-cyan-400/30 scale-102'
                    : 'bg-[#0d1424]/60 hover:bg-[#0d1424] border-slate-800/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-500">{stg.num}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-slate-800 text-cyan-300 border border-slate-700">
                    {stg.badge}
                  </span>
                </div>

                <div>
                  <Icon className="w-8 h-8 mb-2" style={{ color: stg.color }} />
                  <h3 className="text-lg font-black text-white">{stg.title}</h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">{stg.subtitle}</p>
                </div>

                <p className="text-xs text-slate-300 line-clamp-2 mt-2 leading-relaxed">
                  {stg.desc}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      {/* 5. SECTION 4 — "WHAT AEGIS SAW" (3 CLEAN OBSERVATION CARDS) */}
      <div className="space-y-6">
        <div>
          <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
            SENSOR FUSION TELEMETRY
          </span>
          <h2 className="text-3xl font-black text-white mt-1">WHAT AEGIS SAW</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-8 rounded-3xl bg-[#0d1424] border border-slate-800/80 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-xl">
                🛸
              </div>
              <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold">
                94% CONFIDENCE
              </span>
            </div>
            <h3 className="text-xl font-bold text-white">AERIAL RECONNAISSANCE</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              "Flooding detected across multiple sectors with rapid expanding water velocity."
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-[#0d1424] border border-slate-800/80 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 text-xl">
                🌊
              </div>
              <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-mono font-bold">
                2.8m OVERFLOW
              </span>
            </div>
            <h3 className="text-xl font-bold text-white">WATER MONITORING</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              "River water level rising rapidly above baseline embankment capacity."
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-[#0d1424] border border-slate-800/80 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 text-xl">
                📱
              </div>
              <span className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-mono font-bold">
                8 VERIFIED / 12 TOTAL
              </span>
            </div>
            <h3 className="text-xl font-bold text-white">CITIZEN REPORTS</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              "Multiple emergency reports received and verified via report fusion filter."
            </p>
          </div>
        </div>
      </div>

      {/* 6. SECTION 5 — "WHAT HAPPENS NEXT?" (30-MINUTE FORECAST) */}
      <div className="p-8 md:p-10 rounded-3xl bg-[#0d1424] border border-purple-500/40 shadow-2xl space-y-6">
        <div>
          <span className="text-xs font-mono font-bold text-purple-400 uppercase tracking-widest">
            30-MINUTE FLOOD EXPANSION FORECAST
          </span>
          <h2 className="text-3xl font-black text-white mt-1">WHAT HAPPENS NEXT?</h2>
          <p className="text-xl font-bold text-purple-300 mt-2">
            "Flooding is expected to reach Sector 07 within approximately 30 minutes."
          </p>
        </div>

        {/* 4 Forecast Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-[#070B14] border border-slate-800 text-center">
            <span className="text-xs font-mono text-slate-400 uppercase font-bold">TIME TO IMPACT</span>
            <div className="text-3xl font-black text-purple-400 font-mono mt-1">30 min</div>
          </div>
          <div className="p-5 rounded-2xl bg-[#070B14] border border-slate-800 text-center">
            <span className="text-xs font-mono text-slate-400 uppercase font-bold">ADDITIONAL AT RISK</span>
            <div className="text-3xl font-black text-purple-400 font-mono mt-1">8,420</div>
          </div>
          <div className="p-5 rounded-2xl bg-[#070B14] border border-slate-800 text-center">
            <span className="text-xs font-mono text-slate-400 uppercase font-bold">RISK LEVEL</span>
            <div className="text-3xl font-black text-amber-400 font-mono mt-1">HIGH</div>
          </div>
          <div className="p-5 rounded-2xl bg-[#070B14] border border-slate-800 text-center">
            <span className="text-xs font-mono text-slate-400 uppercase font-bold">SPREAD DIRECTION</span>
            <div className="text-3xl font-black text-cyan-400 font-mono mt-1">WEST</div>
          </div>
        </div>

        {/* Timeline Bar */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 font-bold">
            <span>NOW</span>
            <span>10 MIN</span>
            <span>20 MIN</span>
            <span>30 MIN (CRITICAL)</span>
          </div>
          <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-cyan-400 via-purple-500 to-amber-500 rounded-full w-[85%]" />
          </div>
        </div>
      </div>

      {/* 7. SECTION 6 — "WHY AEGIS ACTED" (CAUSE → EFFECT VISUAL DIAGRAM) */}
      <div className="p-8 md:p-10 rounded-3xl bg-[#0d1424] border border-slate-800/80 shadow-2xl space-y-6">
        <div>
          <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
            REASONING CHAIN & CAUSAL ANALYSIS
          </span>
          <h2 className="text-3xl font-black text-white mt-1">WHY DID AEGIS ACT?</h2>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-xs">
          <div className="p-5 rounded-2xl bg-[#070B14] border border-slate-800 text-center flex-1 w-full">
            <span className="text-amber-400 font-bold text-sm block">1. DEPTH INCREASED</span>
            <span className="text-slate-400 text-[11px] mt-1 block">Submerged level &gt; 1.2m</span>
          </div>

          <span className="text-cyan-400 font-black text-xl">+</span>

          <div className="p-5 rounded-2xl bg-[#070B14] border border-slate-800 text-center flex-1 w-full">
            <span className="text-amber-400 font-bold text-sm block">2. AREA EXPANDED</span>
            <span className="text-slate-400 text-[11px] mt-1 block">Westward front advancing</span>
          </div>

          <span className="text-cyan-400 font-black text-xl">+</span>

          <div className="p-5 rounded-2xl bg-[#070B14] border border-slate-800 text-center flex-1 w-full">
            <span className="text-red-400 font-bold text-sm block">3. ROAD R14 BLOCKED</span>
            <span className="text-slate-400 text-[11px] mt-1 block">Primary route severed</span>
          </div>

          <span className="text-cyan-400 font-black text-xl">=</span>

          <div className="p-5 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-center flex-1 w-full shadow-xl">
            <span className="text-emerald-400 font-black text-sm block">EVACUATION RECOMMENDED</span>
            <span className="text-slate-300 text-[11px] mt-1 block">Activate Shelter 03 & Boat 02</span>
          </div>
        </div>
      </div>

      {/* 8. SECTION 7 — "AEGIS DECISION" (PROMINENT CARD) */}
      <div className="p-8 md:p-10 rounded-3xl bg-gradient-to-r from-cyan-950/90 via-[#0d1424] to-indigo-950/90 border-2 border-cyan-400/60 shadow-2xl space-y-6">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
            POLICY COMMANDER DECISION
          </span>
          <div className="flex items-center gap-3">
            <span className="px-3.5 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-mono font-bold">
              CONFIDENCE: 94%
            </span>
            <span className="px-3.5 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-mono font-bold">
              PRIORITY: CRITICAL
            </span>
          </div>
        </div>

        <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
          "Initiate pre-emptive evacuation of Sector 04."
        </h2>

        <p className="text-base text-slate-300 max-w-4xl leading-relaxed">
          <strong className="text-white font-bold">REASONING:</strong> Projected flood expansion threatens high-density residential areas and the primary evacuation route. Immediate shelter activation protects 5,740 lives.
        </p>
      </div>

      {/* 9. SECTION 8 — RESOURCE RESPONSE */}
      <div className="space-y-6">
        <div>
          <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
            AUTONOMOUS DISPATCH & REROUTING
          </span>
          <h2 className="text-3xl font-black text-white mt-1">RESOURCE RESPONSE</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-6 rounded-3xl bg-[#0d1424] border border-slate-800/80 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-2xl">🚤</span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-mono font-bold">
                DISPATCHED
              </span>
            </div>
            <h4 className="text-base font-bold text-white">Rescue Boat 02</h4>
            <p className="text-xs text-slate-400 font-mono">Assigned to Sector 04</p>
          </div>

          <div className="p-6 rounded-3xl bg-[#0d1424] border border-slate-800/80 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-2xl">🏠</span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-mono font-bold">
                ACTIVATED
              </span>
            </div>
            <h4 className="text-base font-bold text-white">Shelter 03</h4>
            <p className="text-xs text-slate-400 font-mono">Capacity 6,000 citizens</p>
          </div>

          <div className="p-6 rounded-3xl bg-[#0d1424] border border-slate-800/80 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-2xl">🚑</span>
              <span className="px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold">
                READY
              </span>
            </div>
            <h4 className="text-base font-bold text-white">Medical Team 01</h4>
            <p className="text-xs text-slate-400 font-mono">Standby at Sector 07</p>
          </div>

          <div className="p-6 rounded-3xl bg-[#0d1424] border border-slate-800/80 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-2xl">🛣</span>
              <span className="px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-mono font-bold">
                A* REROUTED
              </span>
            </div>
            <h4 className="text-base font-bold text-white">Alternative Route</h4>
            <p className="text-xs text-slate-400 font-mono">Avoids R14 via R16 → R18</p>
          </div>
        </div>
      </div>

      {/* 10. SECTION 9 — WITHOUT AEGIS vs WITH AEGIS (COMPARATIVE TABLE) */}
      <div className="bg-[#0d1424] border border-slate-800/80 rounded-3xl p-8 shadow-2xl space-y-6">
        <div>
          <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
            QUANTITATIVE DEMO PROOF
          </span>
          <h2 className="text-3xl font-black text-white mt-1">WITHOUT AEGIS vs WITH AEGIS</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-xs font-bold text-slate-400">
                <th className="pb-4 pl-4 uppercase">METRIC EVALUATED</th>
                <th className="pb-4 uppercase text-amber-400">BASELINE (NO AEGIS)</th>
                <th className="pb-4 uppercase text-emerald-400">AEGIS (AUTONOMOUS)</th>
                <th className="pb-4 uppercase text-cyan-300">IMPROVEMENT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {comparisonRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-[#070B14]/60 transition-colors">
                  <td className="py-4 pl-4 font-bold text-white">{row.label}</td>
                  <td className="py-4 font-bold text-amber-300">{row.baseline}</td>
                  <td className="py-4 font-black text-emerald-400 text-base">{row.aegis}</td>
                  <td className="py-4 font-bold text-cyan-300">
                    <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-xs">
                      {row.diff}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 11. SECTION 10 — AEGIS IMPACT (ANIMATED COUNTUPS) */}
      <div className="p-8 md:p-10 rounded-3xl bg-[#0d1424] border border-emerald-500/40 shadow-2xl space-y-6">
        <div>
          <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">
            VALUATION & IMPACT METRICS
          </span>
          <h2 className="text-3xl font-black text-white mt-1">AEGIS IMPACT</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          <div className="p-6 rounded-2xl bg-[#070B14] border border-slate-800">
            <div className="text-4xl md:text-5xl font-black text-emerald-400 font-mono">
              {livesSavedCount.toLocaleString()}
            </div>
            <span className="text-xs font-mono font-bold text-slate-300 uppercase mt-2 block">LIVES PROTECTED</span>
          </div>

          <div className="p-6 rounded-2xl bg-[#070B14] border border-slate-800">
            <div className="text-4xl md:text-5xl font-black text-emerald-400 font-mono">
              78%
            </div>
            <span className="text-xs font-mono font-bold text-slate-300 uppercase mt-2 block">RISK REDUCTION</span>
          </div>

          <div className="p-6 rounded-2xl bg-[#070B14] border border-slate-800">
            <div className="text-4xl md:text-5xl font-black text-cyan-400 font-mono">
              &lt; 3 MIN
            </div>
            <span className="text-xs font-mono font-bold text-slate-300 uppercase mt-2 block">RESPONSE TIME</span>
          </div>

          <div className="p-6 rounded-2xl bg-[#070B14] border border-slate-800">
            <div className="text-4xl md:text-5xl font-black text-purple-400 font-mono">
              7
            </div>
            <span className="text-xs font-mono font-bold text-slate-300 uppercase mt-2 block">RESOURCES DISPATCHED</span>
          </div>
        </div>
      </div>

      {/* 12. SECTION 11 — AI TEAM (10 SPECIALIZED AGENTS) */}
      <div className="p-8 md:p-10 rounded-3xl bg-[#0d1424] border border-slate-800/80 shadow-2xl space-y-6">
        <div>
          <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
            MULTI-AGENT SYSTEM ARCHITECTURE
          </span>
          <h2 className="text-3xl font-black text-white mt-1">10 SPECIALIZED AI AGENTS</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
          {agentTeam.map((agt, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-[#070B14] border border-slate-800/80 flex items-center justify-between">
              <div>
                <span className="font-bold text-white block text-sm">{agt.name}</span>
                <span className="text-slate-400 text-[11px]">{agt.role}</span>
              </div>
              <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shrink-0">
                {agt.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 13. SECTION 13 — FINAL RESPONSE COMPLETE BANNER */}
      <div className="p-10 md:p-12 rounded-3xl bg-gradient-to-r from-emerald-950/90 via-cyan-950/90 to-indigo-950/90 border-2 border-emerald-500/60 text-center space-y-6 shadow-2xl">
        <Award className="w-14 h-14 text-emerald-400 mx-auto" />

        <div className="space-y-2">
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
            AEGIS RESPONSE COMPLETE
          </h2>
          <p className="text-lg md:text-2xl font-bold text-emerald-400 tracking-tight">
            "AEGIS DID NOT STOP THE FLOOD. IT REDUCED ITS HUMAN IMPACT."
          </p>
        </div>

        <button
          onClick={handleStartAegisScenario}
          className="py-4 px-10 rounded-2xl font-mono text-base font-black text-black bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-500 hover:scale-105 transition-all cursor-pointer shadow-2xl shadow-emerald-500/30 inline-flex items-center gap-3 border border-white/20"
        >
          <Play size={20} fill="currentColor" />
          [ RUN NEW RANDOM SCENARIO → ]
        </button>
      </div>

      {/* SYSTEM DETAILS DRAWER MODAL */}
      <TechnicalDetailsDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  )
}
