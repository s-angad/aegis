'use client'
import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Truck, CheckCircle2, ChevronDown, ChevronUp, Cpu, Navigation, AlertTriangle } from 'lucide-react'

const CityMap = dynamic(() => import('@/components/map/CityMap'), { ssr: false })

export default function ActStageCard() {
  const [showDetails, setShowDetails] = useState(false)

  const actions = [
    { id: '01', title: 'RESCUE BOAT 02', desc: 'Dispatched to Sector 04', icon: '🚤', status: 'EN ROUTE' },
    { id: '02', title: 'RESCUE TEAM 03', desc: 'Dispatched to Sector 04', icon: '👥', status: 'DISPATCHED' },
    { id: '03', title: 'SHELTER 03', desc: 'Activated (64% occupied)', icon: '🏠', status: 'ACTIVE' },
    { id: '04', title: 'ROAD R14', desc: 'Submerged (1.2m depth)', icon: '🚧', status: 'BLOCKED' },
    { id: '05', title: 'SAFE ROUTE VIA R18', desc: 'Recalculated via A* graph', icon: '🛣', status: 'REROUTED' },
  ]

  return (
    <div className="bg-[#0d1424] border border-slate-800/80 rounded-3xl p-8 shadow-2xl backdrop-blur-md font-sans select-none space-y-6 text-white">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div>
          <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">
            STAGE 05 — ACT & DYNAMIC ROUTING
          </span>
          <h2 className="text-2xl font-black text-white mt-1">AEGIS IS RESPONDING</h2>
          <p className="text-sm text-slate-300">"Resource allocation and dynamic graph rerouting as roads submerge."</p>
        </div>
        <span className="px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold flex items-center gap-2">
          <CheckCircle2 size={16} />
          ✓ DISPATCH & ROUTE ADAPTED
        </span>
      </div>

      {/* 5 Response Action Cards (Section ACT) */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
        {actions.map((act) => (
          <div key={act.id} className="p-4 rounded-2xl bg-[#070B14] border border-slate-800/80 flex flex-col justify-between h-36">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-2xl">{act.icon}</span>
                <span className="text-[10px] font-mono text-slate-500 font-bold">ACTION {act.id}</span>
              </div>
              <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider mt-1">{act.title}</h4>
              <p className="text-[11px] text-slate-400 font-sans mt-0.5">{act.desc}</p>
            </div>
            <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider">{act.status}</span>
          </div>
        ))}
      </div>

      {/* Dynamic NetworkX A* Rerouting Map Container (Section DYNAMIC ROUTING) */}
      <div className="space-y-3">
        <div className="p-4 rounded-2xl bg-indigo-950/60 border border-indigo-500/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Navigation className="w-5 h-5 text-indigo-400" />
            <div>
              <div className="text-xs font-mono font-bold text-indigo-400 uppercase">DYNAMIC ROUTE RECALCULATION</div>
              <p className="text-sm font-bold text-white">
                Primary route R14 flooded $\rightarrow$ AEGIS automatically calculated safe alternative route through R18.
              </p>
            </div>
          </div>
          <span className="px-3.5 py-1.5 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-mono font-bold uppercase">
            A* GRAPH ADAPTED
          </span>
        </div>

        <div className="relative h-72 rounded-2xl overflow-hidden border border-indigo-500/30 shadow-xl">
          <CityMap className="absolute inset-0 w-full h-full" />
        </div>
      </div>

      {/* Expandable Details Section */}
      <div className="pt-2">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1.5 cursor-pointer"
        >
          <Cpu size={14} />
          <span>{showDetails ? 'Hide Technical Agent Details' : 'Details: View Allocation, Routing, & Communication Agents'}</span>
          {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {showDetails && (
          <div className="mt-3 p-4 rounded-2xl bg-[#070B14] border border-slate-800 text-xs font-mono text-slate-300 space-y-2 animate-fadeIn">
            <div className="text-cyan-400 font-bold">CONTRIBUTING AGENTS:</div>
            <ul className="list-disc list-inside space-y-1">
              <li><strong className="text-white">Allocation Agent</strong>: Calculating Euclidean distance matrix and selecting Rescue Boat 02 & Rescue Team 03.</li>
              <li><strong className="text-white">Routing Agent</strong>: Running NetworkX A* algorithm with flooded road edge weights set to infinity ($\infty$).</li>
              <li><strong className="text-white">Communication Agent</strong>: Issuing dispatch alerts and updating Shelter 03 occupancy records.</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
