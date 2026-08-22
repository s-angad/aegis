'use client'
import { useState } from 'react'
import { CheckSquare, CheckCircle2, ChevronDown, ChevronUp, Cpu, ArrowRight, Filter } from 'lucide-react'

export default function VerifyStageCard() {
  const [showDetails, setShowDetails] = useState(false)

  return (
    <div className="bg-[#0d1424] border border-slate-800/80 rounded-3xl p-8 shadow-2xl backdrop-blur-md font-sans select-none space-y-6 text-white">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div>
          <span className="text-xs font-mono font-bold text-blue-400 uppercase tracking-widest">
            STAGE 02 — VERIFY
          </span>
          <h2 className="text-2xl font-black text-white mt-1">VERIFYING INCIDENTS</h2>
          <p className="text-sm text-slate-300">"AEGIS filters citizen noise and cross-references multi-modal data before escalating incidents."</p>
        </div>
        <span className="px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold flex items-center gap-2">
          <CheckCircle2 size={16} />
          ✓ INCIDENT VERIFIED
        </span>
      </div>

      {/* Verification Pipeline Flow */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-center">
        <div className="p-6 rounded-2xl bg-[#070B14] border border-slate-800/80 flex flex-col items-center justify-center">
          <div className="text-3xl font-black text-slate-300">12</div>
          <div className="text-xs font-bold text-slate-400 uppercase mt-2">REPORTS RECEIVED</div>
          <p className="text-[11px] text-slate-500 font-sans mt-1">Raw hotline & sensor intake</p>
        </div>

        <div className="p-6 rounded-2xl bg-[#070B14] border border-cyan-500/40 flex flex-col items-center justify-center">
          <div className="text-3xl font-black text-cyan-300">8</div>
          <div className="text-xs font-bold text-cyan-400 uppercase mt-2">CONFIRMED INCIDENTS</div>
          <p className="text-[11px] text-slate-400 font-sans mt-1">Cross-referenced with aerial recon</p>
        </div>

        <div className="p-6 rounded-2xl bg-[#070B14] border border-slate-800/80 flex flex-col items-center justify-center">
          <div className="text-3xl font-black text-slate-500">4</div>
          <div className="text-xs font-bold text-slate-400 uppercase mt-2">NOISE FILTERED OUT</div>
          <p className="text-[11px] text-slate-500 font-sans mt-1">Duplicates & false reports removed</p>
        </div>
      </div>

      {/* Verification Result Banner */}
      <div className="p-5 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Filter className="w-5 h-5 text-cyan-400" />
          <span className="text-sm font-bold text-white">
            Primary Disaster Sector 04 verified with HIGH CONFIDENCE.
          </span>
        </div>
        <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/20 px-3.5 py-1.5 rounded-xl border border-emerald-500/30">
          CONFIDENCE 94%
        </span>
      </div>

      {/* Expandable Details Section */}
      <div className="pt-2">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1.5 cursor-pointer"
        >
          <Cpu size={14} />
          <span>{showDetails ? 'Hide Technical Agent Details' : 'Details: View Contributing Agents & Clustering Rules'}</span>
          {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {showDetails && (
          <div className="mt-3 p-4 rounded-2xl bg-[#070B14] border border-slate-800 text-xs font-mono text-slate-300 space-y-2 animate-fadeIn">
            <div className="text-cyan-400 font-bold">CONTRIBUTING AGENTS & ALGORITHMS:</div>
            <ul className="list-disc list-inside space-y-1">
              <li><strong className="text-white">Verifier Agent</strong>: Spatial DBSCAN clustering with radius = <span className="text-cyan-300">333m</span> and temporal window = <span className="text-cyan-300">120s</span>.</li>
              <li>Calculated incident priority score based on population density and proximity to water overflow channels.</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
