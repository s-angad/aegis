'use client'
import { useResourceStore } from '@/stores/resourceStore'

export default function EmergencyResourcesSection() {
  const { resources, shelters } = useResourceStore()

  return (
    <div className="py-10 space-y-6 select-none font-sans">
      <div>
        <h2 className="text-3xl font-black text-white tracking-tight">EMERGENCY RESPONSE</h2>
        <p className="text-slate-400 text-sm mt-1">
          "Deployed emergency response assets and safehouse capacities."
        </p>
      </div>

      <div className="grid grid-cols-4 gap-6">
        {/* RESCUE BOATS */}
        <div className="bg-[#0f172a]/90 border border-slate-800/80 p-6 rounded-3xl backdrop-blur-md shadow-xl flex flex-col justify-between">
          <div>
            <div className="text-3xl mb-2">🚤</div>
            <h3 className="text-sm font-mono font-bold text-slate-400 uppercase tracking-wider">RESCUE BOATS</h3>
            <div className="text-2xl font-mono font-black text-cyan-300 mt-2">2 / 5 <span className="text-xs font-sans text-slate-400 font-normal">deployed</span></div>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full mt-4 overflow-hidden">
            <div className="h-full bg-cyan-400 rounded-full w-[40%]" />
          </div>
        </div>

        {/* AMBULANCES */}
        <div className="bg-[#0f172a]/90 border border-slate-800/80 p-6 rounded-3xl backdrop-blur-md shadow-xl flex flex-col justify-between">
          <div>
            <div className="text-3xl mb-2">🚑</div>
            <h3 className="text-sm font-mono font-bold text-slate-400 uppercase tracking-wider">AMBULANCES</h3>
            <div className="text-2xl font-mono font-black text-red-400 mt-2">1 / 4 <span className="text-xs font-sans text-slate-400 font-normal">deployed</span></div>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full mt-4 overflow-hidden">
            <div className="h-full bg-red-400 rounded-full w-[25%]" />
          </div>
        </div>

        {/* RESCUE TEAMS */}
        <div className="bg-[#0f172a]/90 border border-slate-800/80 p-6 rounded-3xl backdrop-blur-md shadow-xl flex flex-col justify-between">
          <div>
            <div className="text-3xl mb-2">👨‍🚒</div>
            <h3 className="text-sm font-mono font-bold text-slate-400 uppercase tracking-wider">RESCUE TEAMS</h3>
            <div className="text-2xl font-mono font-black text-amber-400 mt-2">4 / 8 <span className="text-xs font-sans text-slate-400 font-normal">deployed</span></div>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full mt-4 overflow-hidden">
            <div className="h-full bg-amber-400 rounded-full w-[50%]" />
          </div>
        </div>

        {/* ACTIVE SHELTER */}
        <div className="bg-[#0f172a]/90 border border-slate-800/80 p-6 rounded-3xl backdrop-blur-md shadow-xl flex flex-col justify-between">
          <div>
            <div className="text-3xl mb-2">🏠</div>
            <h3 className="text-sm font-mono font-bold text-slate-400 uppercase tracking-wider">ACTIVE SHELTER</h3>
            <div className="text-xl font-mono font-bold text-white mt-1">Shelter 03</div>
            <div className="text-sm font-mono text-emerald-400 font-bold mt-1">320 / 500 <span className="text-xs font-sans text-slate-400 font-normal">(64%)</span></div>
          </div>
          <div className="mt-4 pt-2 border-t border-slate-800 flex items-center gap-2 text-xs font-mono text-emerald-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            ACCEPTING EVACUEES
          </div>
        </div>
      </div>
    </div>
  )
}
