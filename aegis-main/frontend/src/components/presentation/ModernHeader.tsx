'use client'
import { Shield } from 'lucide-react'

interface ModernHeaderProps {
  onOpenDetails: () => void
  onScrollTo: (id: string) => void
}

export default function ModernHeader({ onOpenDetails, onScrollTo }: ModernHeaderProps) {
  return (
    <header className="sticky top-4 z-50 px-6 max-w-[1400px] mx-auto">
      <div className="bg-white/95 backdrop-blur-md border border-[#EAEAE6] rounded-full px-6 py-3 shadow-sm flex items-center justify-between">
        {/* Left: Startup Branding */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#6C4DFF] flex items-center justify-center text-white font-black text-xs tracking-widest shadow-md">
            <Shield size={16} fill="currentColor" />
          </div>
          <div>
            <div className="font-black text-sm text-[#111111] tracking-tight leading-none">AEGIS</div>
            <span className="text-[9px] font-bold text-[#6B6B6B] tracking-wider uppercase">AUTONOMOUS FLOOD INTELLIGENCE</span>
          </div>
        </div>

        {/* Center: Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-bold text-[#6B6B6B]">
          <button onClick={() => onScrollTo('simulation')} className="hover:text-[#111111] transition-colors cursor-pointer tracking-wide">
            Simulation
          </button>
          <button onClick={() => onScrollTo('analysis')} className="hover:text-[#111111] transition-colors cursor-pointer tracking-wide">
            Analysis
          </button>
          <button onClick={() => onScrollTo('response')} className="hover:text-[#111111] transition-colors cursor-pointer tracking-wide">
            Response
          </button>
        </nav>

        {/* Right: Status & Actions */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#20A36A]/10 text-[#20A36A] text-xs font-bold border border-[#20A36A]/20">
            <span className="w-2 h-2 rounded-full bg-[#20A36A] animate-pulse" />
            <span>● SYSTEM ONLINE</span>
          </div>

          <button
            onClick={() => onScrollTo('simulation')}
            className="hidden sm:block text-xs font-bold text-[#6C4DFF] bg-[#6C4DFF]/10 hover:bg-[#6C4DFF]/20 border border-[#6C4DFF]/20 px-3.5 py-1.5 rounded-full transition-all cursor-pointer"
          >
            Live Simulation
          </button>

          <button
            onClick={onOpenDetails}
            className="text-xs font-bold text-[#6B6B6B] hover:text-[#111111] px-3.5 py-1.5 rounded-full bg-[#ECEAE4] hover:bg-[#E2E0D8] transition-all cursor-pointer"
          >
            SYSTEM DETAILS
          </button>
        </div>
      </div>
    </header>
  )
}
