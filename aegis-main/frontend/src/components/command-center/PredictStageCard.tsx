'use client'
import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Brain, CheckCircle2, ChevronDown, ChevronUp, Cpu, Clock, Users, AlertTriangle } from 'lucide-react'
import { useAgentStore } from '@/stores/agentStore'
import { useSimulationStore } from '@/stores/simulationStore'

const CityMap = dynamic(() => import('@/components/map/CityMap'), { ssr: false })

export default function PredictStageCard() {
  const [showDetails, setShowDetails] = useState(false)
  const { prediction } = useAgentStore()
  const { floodState } = useSimulationStore()

  const timeToImpact = prediction?.time_to_impact_minutes ?? 18
  const popRisk = floodState?.projected_lives_at_risk ?? 8420

  return (
    <div className="bg-[#0d1424] border border-slate-800/80 rounded-3xl p-8 shadow-2xl backdrop-blur-md font-sans select-none space-y-6 text-white">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div>
          <span className="text-xs font-mono font-bold text-purple-400 uppercase tracking-widest">
            STAGE 03 — PREDICT
          </span>
          <h2 className="text-2xl font-black text-white mt-1">WHAT HAPPENS NEXT?</h2>
          <p className="text-sm text-slate-300">"AEGIS runs forward simulations to identify future risk sectors before water arrives."</p>
        </div>
        <span className="px-4 py-2 rounded-xl bg-purple-500/10 text-purple-300 border border-purple-500/30 text-xs font-mono font-bold flex items-center gap-2">
          <CheckCircle2 size={16} />
          ✓ PREDICTION COMPLETE
        </span>
      </div>

      {/* Map with Predicted Boundary Overlay */}
      <div className="relative h-72 rounded-2xl overflow-hidden border border-purple-500/30 shadow-xl">
        <CityMap className="absolute inset-0 w-full h-full" />
        <div className="absolute top-4 left-4 z-30 bg-[#070B14]/90 border border-purple-500/40 p-3 rounded-xl backdrop-blur-md font-mono text-xs text-purple-300">
          <span className="font-bold">ORANGE BOUNDARY:</span> PREDICTED 30-MIN FLOOD SPREAD
        </div>
      </div>

      {/* Prediction Metrics */}
      <div className="grid grid-cols-3 gap-6">
        <div className="p-5 rounded-2xl bg-[#070B14] border border-slate-800 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-500/20 text-purple-400">
            <AlertTriangle size={24} />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-mono font-bold uppercase">EXPANSION SECTORS</div>
            <div className="text-lg font-mono font-black text-purple-300">Sector 07, Sector 06</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#070B14] border border-slate-800 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-cyan-500/20 text-cyan-400">
            <Clock size={24} />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-mono font-bold uppercase">ESTIMATED IMPACT</div>
            <div className="text-lg font-mono font-black text-cyan-300">~{timeToImpact} Minutes</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#070B14] border border-slate-800 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-red-500/20 text-red-400">
            <Users size={24} />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-mono font-bold uppercase">ADDITIONAL RISK</div>
            <div className="text-lg font-mono font-black text-red-400">{popRisk.toLocaleString()} People</div>
          </div>
        </div>
      </div>

      {/* Expandable Details Section */}
      <div className="pt-2">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1.5 cursor-pointer"
        >
          <Cpu size={14} />
          <span>{showDetails ? 'Hide Technical Agent Details' : 'Details: View Contributing Agents & Lookahead Models'}</span>
          {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {showDetails && (
          <div className="mt-3 p-4 rounded-2xl bg-[#070B14] border border-slate-800 text-xs font-mono text-slate-300 space-y-2 animate-fadeIn">
            <div className="text-cyan-400 font-bold">CONTRIBUTING AGENTS & LOOKAHEAD:</div>
            <ul className="list-disc list-inside space-y-1">
              <li><strong className="text-white">Prediction Agent</strong>: Executing 4-tick lookahead cellular automata physics step.</li>
              <li>Calculates elevation slope differentials and downstream flow vectors across the city network graph.</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
