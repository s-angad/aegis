'use client'
import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Brain, Eye, CheckSquare, Zap, Truck, ArrowRight, Play, ShieldCheck, Clock, Users, Navigation } from 'lucide-react'
import { useDemoStore } from '@/stores/demoStore'

const CityMap = dynamic(() => import('@/components/map/CityMap'), { ssr: false })

interface AegisAnalysisViewProps {
  onRunWithAegis: () => void
}

export default function AegisAnalysisView({ onRunWithAegis }: AegisAnalysisViewProps) {
  const [activeStage, setActiveStage] = useState(1)

  const timelineSteps = [
    { title: 'RIVER LEVEL RISING', desc: 'Baseline overflow threshold breached at embankment' },
    { title: 'FLOOD ENTERED SECTOR 04', desc: 'Inundation spreads into dense commercial grid' },
    { title: 'ROAD R14 BLOCKED', desc: 'Submerged depth exceeds 0.5m safe vehicular limit' },
    { title: 'SECTOR 07 ISOLATED', desc: 'Downstream access cut off due to water expansion' },
    { title: 'POPULATION EXPOSURE INCREASED', desc: '18,420 citizens trapped in low-elevation zone' },
    { title: 'BRIDGE FAILURE DETECTED', desc: 'Structural failure recorded on primary bridge R11' },
    { title: 'CRITICAL UNCONTROLLED FLOODING', desc: 'Disaster reaches maximum severity without response' },
  ]

  return (
    <div className="space-y-10 select-none font-sans text-white max-w-[1700px] mx-auto px-6 md:px-12 py-8">
      {/* HEADER */}
      <div className="bg-[#0d1424] border border-slate-800/80 rounded-3xl p-8 shadow-2xl backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
            PHASE 2 — INCIDENT TIMELINE & AI OODA PIPELINE
          </span>
          <h1 className="text-3xl font-black text-white mt-1">AEGIS INCIDENT ANALYSIS</h1>
          <p className="text-sm text-slate-300 mt-1">
            "AEGIS reconstructed the unmitigated disaster timeline and formulated an autonomous mitigation plan."
          </p>
        </div>

        <button
          onClick={onRunWithAegis}
          className="py-4 px-8 rounded-2xl font-mono text-base font-black text-black bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-500 hover:scale-105 transition-all cursor-pointer shadow-xl shadow-emerald-500/25 shrink-0 flex items-center gap-3 border border-white/20"
        >
          <Play size={20} fill="currentColor" />
          [ RUN WITH AEGIS → ]
        </button>
      </div>

      {/* DISASTER TIMELINE RECONSTRUCTION */}
      <div className="bg-[#0d1424] border border-slate-800/80 rounded-3xl p-8 shadow-2xl space-y-4">
        <h3 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
          UNMITIGATED DISASTER TIMELINE RECONSTRUCTION
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
          {timelineSteps.map((step, idx) => (
            <div key={idx} className="p-3.5 rounded-2xl bg-[#070B14] border border-slate-800/80 text-center flex flex-col justify-between h-32">
              <span className="text-[10px] font-mono text-slate-500 font-bold">0{idx + 1}</span>
              <h4 className="text-[11px] font-mono font-bold text-amber-300 uppercase leading-tight">{step.title}</h4>
              <p className="text-[9px] text-slate-400 font-sans mt-0.5 line-clamp-2">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 5-STAGE AI OODA PIPELINE */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
              AUTONOMOUS OODA RESPONSE PIPELINE
            </h3>
            <p className="text-sm font-medium text-slate-300">
              Explore what AEGIS will do when autonomous control is active.
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 rounded-2xl">
            <ShieldCheck size={16} />
            AI RESPONSE PLAN GENERATED
          </div>
        </div>

        {/* 5 Stage Tab Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {[
            { id: 1, name: 'OBSERVE', desc: 'What could AEGIS have seen?', icon: Eye, color: '#06b6d4' },
            { id: 2, name: 'VERIFY', desc: 'Which reports can AEGIS trust?', icon: CheckSquare, color: '#3b82f6' },
            { id: 3, name: 'PREDICT', desc: 'Where will flood spread?', icon: Brain, color: '#8b5cf6' },
            { id: 4, name: 'DECIDE', desc: 'AEGIS operational decisions', icon: Zap, color: '#f59e0b' },
            { id: 5, name: 'ACT', desc: 'Dispatch & dynamic A* routing', icon: Truck, color: '#10b981' },
          ].map((stg) => {
            const Icon = stg.icon
            const isCurrent = activeStage === stg.id

            return (
              <button
                key={stg.id}
                onClick={() => setActiveStage(stg.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer text-left flex flex-col justify-between h-32 ${
                  isCurrent
                    ? 'bg-cyan-950/80 border-cyan-500 shadow-lg shadow-cyan-500/20 scale-102'
                    : 'bg-[#0d1424] border-slate-800/80 opacity-70 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${stg.color}20`, color: stg.color }}
                  >
                    <Icon size={18} />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-500">0{stg.id}</span>
                </div>

                <div>
                  <h4 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
                    {stg.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 font-sans mt-0.5 line-clamp-1">
                    {stg.desc}
                  </p>
                </div>
              </button>
            )
          })}
        </div>

        {/* ACTIVE STAGE CARD */}
        <div className="bg-[#0d1424] border border-slate-800/80 rounded-3xl p-8 shadow-2xl backdrop-blur-md">
          {activeStage === 1 && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">STAGE 01 — OBSERVE</span>
                <h3 className="text-2xl font-black text-white mt-1">What could AEGIS have seen?</h3>
              </div>
              <div className="grid grid-cols-3 gap-6 font-sans">
                <div className="p-5 rounded-2xl bg-[#070B14] border border-slate-800">
                  <div className="text-xs font-mono font-bold text-cyan-400 uppercase">AERIAL OBSERVATION</div>
                  <p className="text-sm text-slate-200 mt-2">Flood detected across 67% of monitored grid sectors.</p>
                </div>
                <div className="p-5 rounded-2xl bg-[#070B14] border border-slate-800">
                  <div className="text-xs font-mono font-bold text-amber-400 uppercase">CITIZEN REPORTS</div>
                  <p className="text-sm text-slate-200 mt-2">12 emergency distress calls received on hotline.</p>
                </div>
                <div className="p-5 rounded-2xl bg-[#070B14] border border-slate-800">
                  <div className="text-xs font-mono font-bold text-blue-400 uppercase">WATER MONITORING</div>
                  <p className="text-sm text-slate-200 mt-2">River level rising rapidly at 2.8m (+0.4m / 5 min).</p>
                </div>
              </div>
            </div>
          )}

          {activeStage === 2 && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <span className="text-xs font-mono font-bold text-blue-400 uppercase tracking-widest">STAGE 02 — VERIFY</span>
                <h3 className="text-2xl font-black text-white mt-1">Which reports can AEGIS trust?</h3>
              </div>
              <div className="grid grid-cols-4 gap-4 text-center font-mono">
                <div className="p-5 rounded-2xl bg-[#070B14] border border-slate-800">
                  <div className="text-3xl font-black text-white">12</div>
                  <div className="text-xs text-slate-400 font-bold mt-1">REPORTS RECEIVED</div>
                </div>
                <div className="p-5 rounded-2xl bg-[#070B14] border border-cyan-500/40">
                  <div className="text-3xl font-black text-cyan-300">8</div>
                  <div className="text-xs text-cyan-400 font-bold mt-1">VERIFIED REPORTS</div>
                </div>
                <div className="p-5 rounded-2xl bg-[#070B14] border border-slate-800">
                  <div className="text-3xl font-black text-slate-400">3</div>
                  <div className="text-xs text-slate-400 font-bold mt-1">DUPLICATES REMOVED</div>
                </div>
                <div className="p-5 rounded-2xl bg-[#070B14] border border-slate-800">
                  <div className="text-3xl font-black text-slate-500">1</div>
                  <div className="text-xs text-slate-400 font-bold mt-1">REJECTED NOISE</div>
                </div>
              </div>
            </div>
          )}

          {activeStage === 3 && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <span className="text-xs font-mono font-bold text-purple-400 uppercase tracking-widest">STAGE 03 — PREDICT</span>
                <h3 className="text-2xl font-black text-white mt-1">Where will the flood spread next?</h3>
              </div>
              <div className="relative h-64 rounded-2xl overflow-hidden border border-purple-500/30">
                <CityMap className="absolute inset-0 w-full h-full" />
              </div>
              <div className="grid grid-cols-3 gap-6 font-mono">
                <div className="p-4 rounded-2xl bg-[#070B14] border border-slate-800 text-purple-300 font-bold text-sm">
                  FORWARD PREDICTION: SPREAD TOWARD SECTOR 07
                </div>
                <div className="p-4 rounded-2xl bg-[#070B14] border border-slate-800 text-red-400 font-bold text-sm">
                  POPULATION IMPACT: 8,420 PEOPLE
                </div>
                <div className="p-4 rounded-2xl bg-[#070B14] border border-slate-800 text-emerald-400 font-bold text-sm">
                  CONFIDENCE SCORE: 94% HIGH
                </div>
              </div>
            </div>
          )}

          {activeStage === 4 && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">STAGE 04 — DECIDE</span>
                <h3 className="text-2xl font-black text-amber-400 mt-1">⚡ EVACUATE SECTOR 04</h3>
              </div>
              <div className="p-5 rounded-2xl bg-[#070B14] border border-slate-800 space-y-2 text-sm text-slate-200">
                <div className="font-mono font-bold text-amber-400">OPERATIONAL REASONING:</div>
                <ul className="list-disc list-inside space-y-1">
                  <li>Water level is rapidly increasing (+0.4m over 5 minutes)</li>
                  <li>High residential population density exposed (~8,420 people)</li>
                  <li>Primary evacuation access road R14 is submerged and unsafe</li>
                  <li>Shelter 03 has 36% available capacity to receive evacuees</li>
                </ul>
              </div>
            </div>
          )}

          {activeStage === 5 && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">STAGE 05 — ACT</span>
                <h3 className="text-2xl font-black text-white mt-1">Resource Allocation & Dynamic Routing Plan</h3>
              </div>
              <div className="grid grid-cols-3 gap-4 font-mono text-xs">
                <div className="p-4 rounded-2xl bg-[#070B14] border border-slate-800 text-emerald-300 font-bold">
                  ACTIVATE SHELTER 03
                </div>
                <div className="p-4 rounded-2xl bg-[#070B14] border border-slate-800 text-cyan-300 font-bold">
                  DISPATCH RESCUE BOAT 02
                </div>
                <div className="p-4 rounded-2xl bg-[#070B14] border border-slate-800 text-indigo-300 font-bold">
                  REROUTE VIA R16 → R18
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* KEY TRANSITION BANNER */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-emerald-950/80 via-cyan-950/80 to-indigo-950/80 border border-emerald-500/50 text-center space-y-4 shadow-2xl">
        <h2 className="text-3xl font-black text-white">AEGIS HAS BUILT A RESPONSE PLAN</h2>
        <p className="text-base text-slate-200 max-w-2xl mx-auto font-sans">
          "Now let's replay the flood with active autonomous AI control on a new randomized disaster scenario."
        </p>

        <button
          onClick={onRunWithAegis}
          className="py-4 px-10 rounded-2xl font-mono text-base font-black text-black bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-500 hover:scale-105 transition-all cursor-pointer shadow-2xl shadow-emerald-500/40 inline-flex items-center gap-3 border border-white/30 scale-105"
        >
          <Play size={22} fill="currentColor" />
          [ RUN WITH AEGIS → ]
        </button>
      </div>
    </div>
  )
}
