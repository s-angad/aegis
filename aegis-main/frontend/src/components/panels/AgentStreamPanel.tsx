'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useAgentStore } from '@/stores/agentStore'
import { GlassCard } from '@/components/ui/GlassCard'
import { PulsingDot } from '@/components/ui/PulsingDot'
import { AGENT_COLORS } from '@/lib/constants'
import { Terminal, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import type { AgentDecision } from '@/lib/types'

const SEVERITY_COLORS_STREAM: Record<string, string> = {
  info: '#64748b',
  warning: '#f59e0b',
  critical: '#ef4444',
}

function DecisionEntry({ decision }: { decision: AgentDecision }) {
  const [expanded, setExpanded] = useState(false)
  const agentColor = AGENT_COLORS[decision.agent_name] ?? '#6b7280'
  const sevColor = SEVERITY_COLORS_STREAM[decision.severity] ?? '#64748b'

  let ts = ''
  try { ts = new Date(decision.timestamp).toLocaleTimeString('en-US', { hour12: false }) } catch {}

  const reasoning = decision.reasoning ?? ''
  const sopRef = decision.sop_reference ?? null

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, height: 0 }}
      animate={{ opacity: 1, y: 0, height: 'auto' }}
      transition={{ duration: 0.25 }}
      className="mb-2"
    >
      <div
        className="rounded-lg border overflow-hidden transition-colors duration-200 hover:border-white/20"
        style={{
          borderColor: `${agentColor}30`,
          borderLeftColor: agentColor,
          borderLeftWidth: 3,
          backgroundColor: 'rgba(255,255,255,0.03)',
        }}
      >
        <div
          className="p-2.5 cursor-pointer flex items-start justify-between gap-2"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span
                className="text-[9px] font-bold px-1.5 py-0.5 rounded font-mono tracking-wider"
                style={{
                  color: agentColor,
                  backgroundColor: `${agentColor}20`,
                  border: `1px solid ${agentColor}40`,
                }}
              >
                {String(decision.agent_name ?? '').toUpperCase()}
              </span>
              {ts && <span className="text-[9px] text-slate-500 font-mono">{ts}</span>}
              {decision.severity === 'critical' && (
                <span className="text-[9px] text-red-400 font-bold animate-pulse">⚠</span>
              )}
            </div>
            <p className="text-[11px] font-semibold truncate" style={{ color: sevColor }}>
              {decision.action ?? ''}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">
              {decision.description ?? ''}
            </p>
          </div>
          {reasoning && (
            <ChevronDown
              size={12}
              className={`text-slate-500 shrink-0 mt-1 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
            />
          )}
        </div>

        <AnimatePresence>
          {expanded && reasoning && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t"
              style={{ borderColor: `${agentColor}20` }}
            >
              <div className="p-2.5 bg-black/20">
                <p className="text-[10px] text-slate-400 leading-relaxed mb-2 break-words">{reasoning}</p>
                {sopRef && (
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold"
                    style={{ color: agentColor, backgroundColor: `${agentColor}15`, border: `1px solid ${agentColor}30` }}
                  >
                    📋 {sopRef}
                  </span>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

export default function AgentStreamPanel() {
  const { decisions } = useAgentStore()
  const safeDecisions = Array.isArray(decisions) ? decisions : []
  const activeAgents = [...new Set(safeDecisions.slice(0, 20).map((d) => d?.agent_name).filter(Boolean))]

  return (
    <GlassCard className="h-full flex flex-col" animate={false}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-purple-400" />
          <span className="text-xs font-bold text-white tracking-wider uppercase">Agent Decision Stream</span>
        </div>
        <div className="flex items-center gap-2">
          <PulsingDot color="#22c55e" size={7} />
          <span className="text-[10px] text-slate-400 font-mono">{activeAgents.length}/10 active</span>
        </div>
      </div>

      <div className="px-3 py-2 border-b border-white/5 flex gap-1 flex-wrap">
        {Object.entries(AGENT_COLORS).map(([name, color]) => {
          const isActive = activeAgents.includes(name as any)
          return (
            <span
              key={name}
              className="text-[8px] px-1.5 py-0.5 rounded font-mono font-bold transition-all duration-300"
              style={{
                color: isActive ? color : '#374151',
                backgroundColor: isActive ? `${color}18` : 'rgba(255,255,255,0.03)',
                border: `1px solid ${isActive ? color + '40' : 'rgba(255,255,255,0.05)'}`,
              }}
            >
              {name.slice(0, 3).toUpperCase()}
            </span>
          )
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {safeDecisions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-full text-center py-12"
            >
              <div className="text-3xl mb-3">🤖</div>
              <p className="text-xs text-slate-500">Awaiting agent decisions</p>
              <p className="text-[10px] text-slate-600 mt-1">Start simulation to activate agents</p>
            </motion.div>
          ) : (
            safeDecisions.map((d, idx) => (
              <DecisionEntry key={d?.id ?? idx} decision={d} />
            ))
          )}
        </AnimatePresence>
      </div>

      <div className="px-4 py-2 border-t border-white/10">
        <span className="text-[10px] text-slate-600 font-mono">
          {safeDecisions.length} decisions logged
        </span>
      </div>
    </GlassCard>
  )
}
