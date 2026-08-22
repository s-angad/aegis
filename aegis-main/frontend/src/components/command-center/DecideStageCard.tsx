'use client'
import { useState } from 'react'
import { Zap, CheckCircle2, ChevronDown, ChevronUp, Cpu, ShieldAlert, FileText } from 'lucide-react'

export default function DecideStageCard() {
  const [showDetails, setShowDetails] = useState(false)

  const bulletReasons = [
    'Water level is rapidly increasing (+0.4m over 5 minutes)',
    'High residential population exposure (~8,420 people at risk)',
    'Primary access road R14 is becoming underwater and hazardous',
    'Nearest safe facility (Shelter 03) has 36% available capacity'
  ]

  return (
    <div className="bg-[#0d1424] border border-slate-800/80 rounded-3xl p-8 shadow-2xl backdrop-blur-md font-sans select-none space-y-6 text-white">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div>
          <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
            STAGE 04 — DECIDE
          </span>
          <h2 className="text-2xl font-black text-white mt-1">AEGIS RECOMMENDS</h2>
          <p className="text-sm text-slate-300">"Autonomous policy selection based on SOP rules and casualty mitigation objectives."</p>
        </div>
        <span className="px-4 py-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-mono font-bold flex items-center gap-2">
          <CheckCircle2 size={16} />
          ✓ RESPONSE PLAN CREATED
        </span>
      </div>

      {/* Main Recommendation Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-950/60 to-red-950/60 border border-amber-500/40 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-amber-500/20 text-amber-300">
            <Zap size={32} />
          </div>
          <div>
            <div className="text-xs font-mono font-bold text-amber-400 uppercase">PRIMARY AUTONOMOUS DECISION</div>
            <h3 className="text-2xl font-black text-white mt-0.5">⚡ EVACUATE SECTOR 04</h3>
          </div>
        </div>
        <span className="px-4 py-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold uppercase">
          SOP MATCH: HIGH PRIORITY
        </span>
      </div>

      {/* Concise Decision Reasons (Section DECIDE) */}
      <div className="p-6 rounded-2xl bg-[#070B14] border border-slate-800/80 space-y-3">
        <h4 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
          <ShieldAlert size={14} />
          DECISION RATIONALE & RISK EVALUATION
        </h4>
        <ul className="space-y-2 text-sm text-slate-200">
          {bulletReasons.map((reason, idx) => (
            <li key={idx} className="flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Expandable Details Section */}
      <div className="pt-2">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1.5 cursor-pointer"
        >
          <Cpu size={14} />
          <span>{showDetails ? 'Hide Technical Agent Details' : 'Details: View Contributing Policy Agents & SOP Standard Operating Procedures'}</span>
          {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {showDetails && (
          <div className="mt-3 p-4 rounded-2xl bg-[#070B14] border border-slate-800 text-xs font-mono text-slate-300 space-y-2 animate-fadeIn">
            <div className="text-cyan-400 font-bold">CONTRIBUTING AGENTS & SOP PROTOCOLS:</div>
            <ul className="list-disc list-inside space-y-1">
              <li><strong className="text-white">Policy Commander Agent</strong>: Evaluating SOP rules engine.</li>
              <li>Matched Protocols: <span className="text-cyan-300">SOP-001</span> (Pre-emptive Evacuation), <span className="text-cyan-300">SOP-003</span> (Shelter Activation), <span className="text-cyan-300">SOP-005</span> (Asset Allocation).</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
