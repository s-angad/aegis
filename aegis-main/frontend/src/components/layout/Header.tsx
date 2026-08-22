'use client'
import { useSimulationStore } from '@/stores/simulationStore'
import { Shield, Terminal } from 'lucide-react'

interface HeaderProps {
  connectionStatus: string
  onOpenTechnicalDrawer: () => void
}

export default function Header({ connectionStatus, onOpenTechnicalDrawer }: HeaderProps) {
  const { simulation } = useSimulationStore()
  const isRunning = simulation.is_running && !simulation.is_paused

  return (
    <header className="h-16 bg-[#090d16]/95 border-b border-slate-800/60 px-8 flex items-center justify-between shrink-0 select-none z-30 backdrop-blur-md">
      {/* Left: Brand logo & simplified title */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-black tracking-wider text-white font-sans leading-none">
            AEGIS FLOOD
          </h1>
          <p className="text-[10px] font-sans font-medium text-slate-400 tracking-wider uppercase mt-1">
            AUTONOMOUS FLOOD RESPONSE
          </p>
        </div>
      </div>

      {/* Center: Live Disaster Simulation Indicator */}
      <div className="flex items-center gap-2 bg-[#111827] border border-slate-800 px-5 py-2 rounded-2xl shadow-inner">
        <span className={`w-2.5 h-2.5 rounded-full ${isRunning ? 'bg-red-500 animate-ping' : 'bg-emerald-400'}`} />
        <span className="text-xs font-sans font-bold text-white uppercase tracking-wider">
          {isRunning ? 'LIVE DISASTER SIMULATION' : 'SYSTEM STANDBY'}
        </span>
      </div>

      {/* Right: Operational Status & Technical Drawer Button */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-sans font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          SYSTEM OPERATIONAL
        </div>

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-sans font-bold">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
          10/10 AGENTS
        </div>

        <button
          onClick={onOpenTechnicalDrawer}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-mono font-bold transition-all cursor-pointer"
          title="Open System Details & Developer Logs"
        >
          <Terminal size={14} className="text-cyan-400" />
          SYSTEM DETAILS
        </button>
      </div>
    </header>
  )
}
