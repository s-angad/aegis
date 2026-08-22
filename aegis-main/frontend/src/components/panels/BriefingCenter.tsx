'use client'
import { useState } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { useSimulationStore } from '@/stores/simulationStore'
import { API_URL } from '@/lib/constants'
import { FileText, Award, AlertCircle, Share2, Loader2 } from 'lucide-react'

export default function BriefingCenter() {
  const { simulation } = useSimulationStore()
  const [report, setReport] = useState<string>('')
  const [generating, setGenerating] = useState<boolean>(false)
  const [activeType, setActiveType] = useState<string>('')

  const generateReport = async (type: string) => {
    setGenerating(true)
    setActiveType(type)
    setReport('')
    try {
      const res = await fetch(`${API_URL}/api/reports/generate?report_type=${type}`, {
        method: 'POST',
      })
      const data = await res.json()
      
      // Simulate typewriter effect
      const text = data.report || ''
      let current = ''
      let index = 0
      
      const interval = setInterval(() => {
        if (index < text.length) {
          // Type chunks of 6 chars for speed
          current += text.slice(index, index + 6)
          setReport(current)
          index += 6
        } else {
          clearInterval(interval)
          setGenerating(false)
        }
      }, 10)
    } catch {
      setReport('ERR: FAILED TO ESTABLISH COMMUNICATIONS DECK LINK.')
      setGenerating(false)
    }
  }

  const buttons = [
    { label: 'Situation Report', type: 'situation', icon: FileText, color: 'text-cyan-400', hover: 'hover:bg-cyan-500/10' },
    { label: 'Gov Briefing', type: 'briefing', icon: Award, color: 'text-purple-400', hover: 'hover:bg-purple-500/10' },
    { label: 'Press Release', type: 'media', icon: Share2, color: 'text-emerald-400', hover: 'hover:bg-emerald-500/10' },
    { label: 'Citizen Alert', type: 'alert', icon: AlertCircle, color: 'text-rose-400', hover: 'hover:bg-rose-500/10' },
  ]

  return (
    <GlassCard className="h-full flex flex-col" animate={false}>
      {/* Title */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <FileText size={14} className="text-cyan-400" />
          <span className="text-xs font-bold text-white tracking-wider uppercase">OS Briefing & Media Room</span>
        </div>
        {simulation.status !== 'idle' && (
          <span className="text-[9px] bg-cyan-500/15 text-cyan-400 px-1.5 py-0.5 rounded font-mono border border-cyan-500/30">
            EOC T+{simulation.tick}
          </span>
        )}
      </div>

      {/* Buttons Deck */}
      <div className="p-3 grid grid-cols-2 gap-2 border-b border-white/5 shrink-0">
        {buttons.map((btn) => {
          const Icon = btn.icon
          const isActive = activeType === btn.type
          return (
            <button
              key={btn.type}
              disabled={generating || simulation.tick === 0}
              onClick={() => generateReport(btn.type)}
              className={`p-2 rounded-lg border text-left flex items-center gap-2 transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${btn.hover} ${
                isActive ? 'border-cyan-500 bg-cyan-500/10' : 'border-white/10 bg-white/5'
              }`}
            >
              <Icon size={12} className={btn.color} />
              <span className="text-[10px] text-slate-300 font-semibold">{btn.label}</span>
            </button>
          )
        })}
      </div>

      {/* Output Terminal */}
      <div className="flex-1 p-3 bg-black/40 overflow-hidden flex flex-col font-mono text-[10px]">
        {simulation.tick === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-600">
            <span className="text-2xl mb-1">📟</span>
            <p className="text-[10px]">Briefing Deck Standby</p>
            <p className="text-[9px] mt-0.5">Initialize simulation to enable briefing tools</p>
          </div>
        ) : generating && !report ? (
          <div className="flex-1 flex items-center justify-center gap-2 text-cyan-400">
            <Loader2 size={14} className="animate-spin" />
            <span>CONNECTING COMS LINK...</span>
          </div>
        ) : report ? (
          <div className="flex-1 overflow-y-auto whitespace-pre-wrap text-emerald-400 leading-relaxed custom-scrollbar selection:bg-emerald-500/30">
            {report}
            {generating && <span className="animate-pulse bg-emerald-400 w-1.5 h-3 inline-block ml-0.5">▋</span>}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500 text-center">
            <p className="text-[9px]">SELECT ADVISORY INSTRUMENT TO SYNTHESIZE DECK</p>
          </div>
        )}
      </div>
    </GlassCard>
  )
}
