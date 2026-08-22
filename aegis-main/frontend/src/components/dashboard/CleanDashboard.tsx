'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import {
  Eye, CheckSquare, Brain, Zap, Truck, ShieldAlert, ShieldCheck, Play, ArrowDown,
  ChevronRight, Award, Compass, RefreshCw, Activity, CheckCircle2, ArrowRight
} from 'lucide-react'
import { useDemoStore } from '@/stores/demoStore'
import TechnicalDetailsDrawer from '@/components/drawers/TechnicalDetailsDrawer'

const CityMap = dynamic(() => import('@/components/map/CityMap'), { ssr: false })

interface CleanDashboardProps {
  onRunNewScenario?: () => void
}

export default function CleanDashboard({ onRunNewScenario }: CleanDashboardProps) {
  const router = useRouter()
  const { baselineMetrics, aegisMetrics, resetDemo } = useDemoStore()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [livesSavedCount, setLivesSavedCount] = useState(0)

  // Animated Countup for Lives Saved
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

  const handleRunAnother = () => {
    if (onRunNewScenario) {
      onRunNewScenario()
    } else {
      resetDemo()
      router.push('/simulation')
    }
  }

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F7F5] text-[#111111] font-sans antialiased select-none pb-24">
      {/* TOP NAVIGATION */}
      <header className="sticky top-0 z-40 bg-[#F7F7F5]/90 backdrop-blur-md border-b border-[#E5E5E0] px-6 md:px-12 py-4">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#7C5CFC] flex items-center justify-center text-white font-bold text-sm">
                A
              </div>
              <span className="font-bold text-lg text-[#111111] tracking-tight">AEGIS FLOOD</span>
            </div>

            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#666666]">
              <button onClick={() => scrollToSection('section-what-happened')} className="hover:text-[#111111] transition-colors cursor-pointer">Overview</button>
              <button onClick={() => scrollToSection('section-city-simulation')} className="hover:text-[#111111] transition-colors cursor-pointer">Simulation</button>
              <button onClick={() => scrollToSection('section-aegis-decision')} className="hover:text-[#111111] transition-colors cursor-pointer">Response</button>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#19A974] bg-[#19A974]/10 px-3 py-1.5 rounded-full border border-[#19A974]/20">
              <span className="w-2 h-2 rounded-full bg-[#19A974] animate-pulse" />
              <span>System Operational</span>
            </div>

            <button
              onClick={() => setDrawerOpen(true)}
              className="text-xs font-semibold text-[#666666] hover:text-[#111111] px-4 py-2 rounded-xl bg-[#EFEFEA] hover:bg-[#E5E5E0] transition-all cursor-pointer"
            >
              SYSTEM DETAILS
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 md:px-12 space-y-24 pt-12">
        {/* SECTION 1 — HERO */}
        <section className="text-center space-y-6 pt-8 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#7C5CFC] bg-[#7C5CFC]/10 px-4 py-1.5 rounded-full border border-[#7C5CFC]/20">
            <CheckCircle2 size={14} />
            <span>INCIDENT ANALYSIS COMPLETE</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black text-[#111111] tracking-tight leading-tight">
            AEGIS turned a rapidly spreading flood into an actionable response plan.
          </h1>

          <p className="text-lg text-[#666666] font-medium max-w-2xl mx-auto">
            Autonomous Disaster Intelligence System for Emergency Operations.
          </p>

          <div className="pt-4 flex justify-center">
            <button
              onClick={() => scrollToSection('section-what-happened')}
              className="py-4 px-8 rounded-2xl bg-[#111111] hover:bg-[#222222] text-white font-semibold text-base transition-all cursor-pointer shadow-xl flex items-center gap-3 hover:scale-102"
            >
              <span>VIEW RESPONSE</span>
              <ArrowDown size={18} />
            </button>
          </div>
        </section>

        {/* SECTION 2 — WHAT HAPPENED? */}
        <section id="section-what-happened" className="space-y-8 scroll-mt-24">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-[#7C5CFC] uppercase tracking-widest">UNMITIGATED BASELINE</span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#111111]">WHAT HAPPENED?</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-8 rounded-3xl bg-white border border-[#E5E5E0] shadow-sm space-y-2 text-center">
              <div className="text-5xl md:text-6xl font-black text-[#E5484D] font-sans">
                {baselineMetrics.floodedAreaPct}%
              </div>
              <div className="text-sm font-bold text-[#111111] uppercase tracking-wide">CITY FLOODED</div>
            </div>

            <div className="p-8 rounded-3xl bg-white border border-[#E5E5E0] shadow-sm space-y-2 text-center">
              <div className="text-5xl md:text-6xl font-black text-[#E5A11A] font-sans">
                {baselineMetrics.peopleAtRisk.toLocaleString()}
              </div>
              <div className="text-sm font-bold text-[#111111] uppercase tracking-wide">PEOPLE AT RISK</div>
            </div>

            <div className="p-8 rounded-3xl bg-white border border-[#E5E5E0] shadow-sm space-y-2 text-center">
              <div className="text-5xl md:text-6xl font-black text-[#111111] font-sans">
                {baselineMetrics.blockedRoads}
              </div>
              <div className="text-sm font-bold text-[#111111] uppercase tracking-wide">ROADS BLOCKED</div>
            </div>
          </div>

          <p className="text-center text-sm text-[#666666] font-medium max-w-xl mx-auto">
            "Without intervention, the flood continued to spread through multiple city sectors."
          </p>
        </section>

        {/* SECTION 3 — THE CITY (HERO VISUAL SIMULATION) */}
        <section id="section-city-simulation" className="space-y-4 scroll-mt-24">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[#7C5CFC] uppercase tracking-widest">DIGITAL TWIN CANVASES</span>
              <h2 className="text-2xl font-bold text-[#111111]">FLOOD SIMULATION</h2>
              <p className="text-sm text-[#666666] font-medium">Watch how the flood spread through the city.</p>
            </div>
          </div>

          <div className="rounded-3xl overflow-hidden border border-[#E5E5E0] bg-[#070B14] h-[520px] relative shadow-lg">
            <CityMap className="w-full h-full" />
          </div>

          {/* Simple 4 Legend Items */}
          <div className="flex items-center justify-center gap-8 text-xs font-semibold text-[#666666] pt-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#06b6d4]" />
              <span>Flood</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#1e293b] border border-slate-600" />
              <span>Road</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#10b981]" />
              <span>Safe Area</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#f59e0b]" />
              <span>Emergency Resource</span>
            </div>
          </div>
        </section>

        {/* SECTION 4 — WHAT DID AEGIS SEE? */}
        <section className="space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-[#7C5CFC] uppercase tracking-widest">SENSOR FUSION</span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#111111]">WHAT DID AEGIS SEE?</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-8 rounded-3xl bg-white border border-[#E5E5E0] shadow-sm space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#7C5CFC]/10 flex items-center justify-center text-[#7C5CFC] text-2xl">
                👁
              </div>
              <h3 className="text-lg font-bold text-[#111111]">FLOOD OBSERVATION</h3>
              <p className="text-sm text-[#666666] leading-relaxed">
                Water levels were rising and flooding was expanding into residential sectors.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white border border-[#E5E5E0] shadow-sm space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#7C5CFC]/10 flex items-center justify-center text-[#7C5CFC] text-2xl">
                📡
              </div>
              <h3 className="text-lg font-bold text-[#111111]">REPORT VERIFICATION</h3>
              <p className="text-sm text-[#666666] leading-relaxed">
                AEGIS compared aerial observations and emergency reports to remove unreliable information.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white border border-[#E5E5E0] shadow-sm space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#7C5CFC]/10 flex items-center justify-center text-[#7C5CFC] text-2xl">
                💧
              </div>
              <h3 className="text-lg font-bold text-[#111111]">WATER MONITORING</h3>
              <p className="text-sm text-[#666666] leading-relaxed">
                River conditions indicated continued flood expansion.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 5 — WHAT WILL HAPPEN NEXT? */}
        <section className="p-8 md:p-12 rounded-3xl bg-white border border-[#E5E5E0] shadow-sm space-y-8 max-w-4xl mx-auto">
          <div className="space-y-3 text-center">
            <span className="text-xs font-bold text-[#7C5CFC] uppercase tracking-widest">30-MINUTE FORECAST</span>
            <h2 className="text-3xl font-bold text-[#111111]">WHAT WILL HAPPEN NEXT?</h2>
            <p className="text-2xl md:text-3xl font-bold text-[#7C5CFC] leading-snug">
              "Flooding is expected to reach Sector 07 within 30 minutes."
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-center pt-2">
            <div className="p-6 rounded-2xl bg-[#F7F7F5] border border-[#E5E5E0]">
              <span className="text-sm font-bold text-[#E5484D] block uppercase">HIGH RISK</span>
              <span className="text-xs text-[#666666] font-medium mt-1 block">8,420 people potentially affected</span>
            </div>

            <div className="p-6 rounded-2xl bg-[#F7F7F5] border border-[#E5E5E0]">
              <span className="text-sm font-bold text-[#111111] block uppercase">30 MIN</span>
              <span className="text-xs text-[#666666] font-medium mt-1 block">estimated impact horizon</span>
            </div>
          </div>

          <div className="space-y-2 pt-4">
            <div className="flex justify-between text-xs font-semibold text-[#666666]">
              <span>NOW</span>
              <span>30 MIN</span>
            </div>
            <div className="h-3 bg-[#EFEFEA] rounded-full overflow-hidden">
              <div className="h-full bg-[#7C5CFC] rounded-full w-[85%]" />
            </div>
          </div>
        </section>

        {/* SECTION 6 — WHAT DID AEGIS DECIDE? */}
        <section id="section-aegis-decision" className="p-8 md:p-12 rounded-3xl bg-white border-2 border-[#7C5CFC]/30 shadow-md space-y-6 max-w-4xl mx-auto text-center scroll-mt-24">
          <div className="text-5xl mb-2">🚨</div>
          <span className="text-xs font-bold text-[#7C5CFC] uppercase tracking-widest block">AEGIS AUTONOMOUS DIRECTIVE</span>

          <h2 className="text-3xl md:text-5xl font-black text-[#111111] tracking-tight">
            EVACUATE SECTOR 04
          </h2>

          <p className="text-base text-[#666666] font-medium max-w-2xl mx-auto leading-relaxed">
            "AEGIS identified Sector 04 as the highest priority because flood expansion was threatening residents and the primary evacuation route."
          </p>

          <div className="pt-2">
            <span className="inline-block px-4 py-1.5 rounded-full bg-[#7C5CFC]/10 text-[#7C5CFC] font-semibold text-xs border border-[#7C5CFC]/20">
              94% CONFIDENCE
            </span>
          </div>
        </section>

        {/* SECTION 7 — WHAT DID AEGIS DO? */}
        <section className="space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-[#7C5CFC] uppercase tracking-widest">AUTONOMOUS ACTIONS</span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#111111]">WHAT DID AEGIS DO?</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-6 rounded-3xl bg-white border border-[#E5E5E0] shadow-sm flex items-center gap-4">
              <div className="text-3xl">🚤</div>
              <div>
                <h4 className="font-bold text-[#111111] text-base">RESCUE BOAT</h4>
                <p className="text-xs text-[#666666]">Dispatched to Sector 04</p>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-[#E5E5E0] shadow-sm flex items-center gap-4">
              <div className="text-3xl">🏠</div>
              <div>
                <h4 className="font-bold text-[#111111] text-base">SHELTER</h4>
                <p className="text-xs text-[#666666]">Activated for evacuees</p>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-[#E5E5E0] shadow-sm flex items-center gap-4">
              <div className="text-3xl">🛣</div>
              <div>
                <h4 className="font-bold text-[#111111] text-base">SAFE ROUTE</h4>
                <p className="text-xs text-[#666666]">Alternative route calculated</p>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-[#E5E5E0] shadow-sm flex items-center gap-4">
              <div className="text-3xl">📢</div>
              <div>
                <h4 className="font-bold text-[#111111] text-base">ALERT</h4>
                <p className="text-xs text-[#666666]">Evacuation alert issued</p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 8 — AI DECISION MAKING (5 HUMAN STEPS) */}
        <section className="space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-[#7C5CFC] uppercase tracking-widest">OODA LOOP</span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#111111]">HOW DID AEGIS MAKE THE DECISION?</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
            <div className="p-6 rounded-3xl bg-white border border-[#E5E5E0] shadow-sm space-y-2 text-center">
              <div className="text-xs font-bold text-[#7C5CFC]">01</div>
              <h3 className="text-base font-bold text-[#111111]">OBSERVE</h3>
              <p className="text-xs text-[#666666]">"What is happening?"</p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-[#E5E5E0] shadow-sm space-y-2 text-center">
              <div className="text-xs font-bold text-[#7C5CFC]">02</div>
              <h3 className="text-base font-bold text-[#111111]">VERIFY</h3>
              <p className="text-xs text-[#666666]">"Is the information reliable?"</p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-[#E5E5E0] shadow-sm space-y-2 text-center">
              <div className="text-xs font-bold text-[#7C5CFC]">03</div>
              <h3 className="text-base font-bold text-[#111111]">PREDICT</h3>
              <p className="text-xs text-[#666666]">"What happens next?"</p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-[#E5E5E0] shadow-sm space-y-2 text-center">
              <div className="text-xs font-bold text-[#7C5CFC]">04</div>
              <h3 className="text-base font-bold text-[#111111]">DECIDE</h3>
              <p className="text-xs text-[#666666]">"What should we do?"</p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-[#E5E5E0] shadow-sm space-y-2 text-center">
              <div className="text-xs font-bold text-[#7C5CFC]">05</div>
              <h3 className="text-base font-bold text-[#111111]">ACT</h3>
              <p className="text-xs text-[#666666]">"Deploy the response."</p>
            </div>
          </div>
        </section>

        {/* SECTION 9 — RESOURCE RESPONSE */}
        <section className="space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-[#7C5CFC] uppercase tracking-widest">DEPLOYED ASSETS</span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#111111]">RESPONSE DEPLOYED</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="p-6 rounded-3xl bg-white border border-[#E5E5E0] shadow-sm flex items-center justify-between">
              <div>
                <h4 className="font-bold text-[#111111] text-base">Rescue Boat 02</h4>
                <p className="text-xs text-[#666666]">Sector 04</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#19A974]/10 text-[#19A974] font-semibold text-xs border border-[#19A974]/20">
                DEPLOYED
              </span>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-[#E5E5E0] shadow-sm flex items-center justify-between">
              <div>
                <h4 className="font-bold text-[#111111] text-base">Shelter 03</h4>
                <p className="text-xs text-[#666666]">Sector 04</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#19A974]/10 text-[#19A974] font-semibold text-xs border border-[#19A974]/20">
                ACTIVE
              </span>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-[#E5E5E0] shadow-sm flex items-center justify-between">
              <div>
                <h4 className="font-bold text-[#111111] text-base">Medical Team</h4>
                <p className="text-xs text-[#666666]">Sector 07</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#7C5CFC]/10 text-[#7C5CFC] font-semibold text-xs border border-[#7C5CFC]/20">
                READY
              </span>
            </div>
          </div>
        </section>

        {/* SECTION 10 — THE RESULT (BEFORE vs AFTER) */}
        <section className="space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-[#7C5CFC] uppercase tracking-widest">IMPACT ASSESSMENT</span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#111111]">THE RESULT</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* WITHOUT AEGIS */}
            <div className="p-8 rounded-3xl bg-white border border-[#E5E5E0] shadow-sm space-y-6 text-center">
              <span className="text-xs font-bold text-[#E5484D] uppercase tracking-wider block">WITHOUT AEGIS</span>
              <div className="space-y-4">
                <div>
                  <div className="text-3xl font-black text-[#111111]">{baselineMetrics.peopleAtRisk.toLocaleString()}</div>
                  <div className="text-xs text-[#666666] font-medium">People at risk</div>
                </div>
                <div>
                  <div className="text-3xl font-black text-[#111111]">{baselineMetrics.blockedRoads}</div>
                  <div className="text-xs text-[#666666] font-medium">Roads blocked</div>
                </div>
                <div>
                  <div className="text-3xl font-black text-[#E5484D]">0</div>
                  <div className="text-xs text-[#666666] font-medium">People protected</div>
                </div>
              </div>
            </div>

            {/* WITH AEGIS */}
            <div className="p-8 rounded-3xl bg-white border-2 border-[#19A974]/40 shadow-md space-y-6 text-center">
              <span className="text-xs font-bold text-[#19A974] uppercase tracking-wider block">WITH AEGIS</span>
              <div className="space-y-4">
                <div>
                  <div className="text-4xl font-black text-[#19A974]">{livesSavedCount.toLocaleString()}</div>
                  <div className="text-xs text-[#666666] font-medium">People protected</div>
                </div>
                <div>
                  <div className="text-3xl font-black text-[#111111]">{aegisMetrics.resourcesDeployed}</div>
                  <div className="text-xs text-[#666666] font-medium">Resources deployed</div>
                </div>
                <div>
                  <div className="text-3xl font-black text-[#111111]">{aegisMetrics.routesAdapted}</div>
                  <div className="text-xs text-[#666666] font-medium">Safe routes created</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 11 — FINAL MESSAGE */}
        <section className="p-12 md:p-16 rounded-3xl bg-white border border-[#E5E5E0] shadow-sm text-center space-y-6 max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-black text-[#111111] tracking-tight leading-tight">
            AEGIS DOESN'T JUST WATCH A DISASTER.<br />
            IT RESPONDS TO IT.
          </h2>

          <p className="text-sm font-semibold text-[#666666] tracking-widest uppercase">
            Observe. Understand. Predict. Act.
          </p>

          <div className="pt-4 flex justify-center">
            <button
              onClick={handleRunAnother}
              className="py-4 px-8 rounded-2xl bg-[#111111] hover:bg-[#222222] text-white font-semibold text-base transition-all cursor-pointer shadow-xl flex items-center gap-3 hover:scale-102"
            >
              <RefreshCw size={18} />
              <span>RUN ANOTHER SIMULATION</span>
            </button>
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
