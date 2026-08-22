'use client'
import { useAgentStore } from '@/stores/agentStore'
import { Cpu, ShieldCheck, AlertTriangle, TrendingUp, Compass, Navigation, Radio, Eye } from 'lucide-react'

export default function AgentDecisionStream() {
  const { decisions } = useAgentStore()
  const safeDecisions = Array.isArray(decisions) ? decisions : []

  const AGENT_COLORS: Record<string, string> = {
    Sentinel: '#3b82f6',
    Verifier: '#10b981',
    Severity: '#ef4444',
    Predictor: '#8b5cf6',
    PolicyCommander: '#f59e0b',
    Allocator: '#06b6d4',
    Router: '#ec4899',
    Communicator: '#64748b',
    DroneRecon: '#14b8a6',
    Orchestrator: '#6366f1',
  }

  const AGENT_ICONS: Record<string, any> = {
    Verifier: ShieldCheck,
    Severity: AlertTriangle,
    Predictor: TrendingUp,
    PolicyCommander: Compass,
    Allocator: Navigation,
    Router: Navigation,
    Communicator: Radio,
    DroneRecon: Eye,
  }

  return (
    <div className="bg-[#111827]/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col h-full overflow-hidden select-none">
      {/* Panel Header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
            AI AGENT DECISION STREAM
          </h3>
        </div>
        <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">
          50 Min Feed
        </span>
      </div>

      {/* Stream List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-slate-800">
        {safeDecisions.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center text-[11px] font-mono text-slate-500">
            Awaiting OODA Agent decisions...
          </div>
        ) : (
          safeDecisions.slice(0, 15).map((d) => {
            const color = AGENT_COLORS[d.agent_name] || '#06b6d4'
            const Icon = AGENT_ICONS[d.agent_name] || Cpu
            const timeStr = new Date(d.timestamp).toLocaleTimeString('en-US', { hour12: false })

            return (
              <div
                key={d.id}
                className="bg-[#0b0f19] border border-slate-800/80 rounded-xl p-2.5 flex items-start justify-between gap-3 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{ backgroundColor: `${color}20`, color }}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold" style={{ color }}>
                        {d.agent_name}
                      </span>
                      <span className="text-[10px] text-slate-300 font-medium truncate">
                        {d.action}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1 leading-snug font-sans">
                      {d.description}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-slate-500 shrink-0 mt-0.5">{timeStr}</span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
