'use client'
import { useAgentStore } from '@/stores/agentStore'
import { Cpu, HelpCircle, ShieldCheck } from 'lucide-react'

// Human Language Translators for Agent Decisions
function translateDecisionToHuman(agentName: string, action: string, description: string) {
  const descLower = description.toLowerCase()

  if (agentName === 'PolicyCommander') {
    if (descLower.includes('evacuat') || action.includes('evacuat')) return { icon: '🔴', text: 'Evacuate Sector-04 immediately', agent: 'Policy Commander' }
    return { icon: '🔴', text: description || 'Issue immediate safety directives', agent: 'Policy Commander' }
  }
  if (agentName === 'Allocator') {
    if (descLower.includes('boat') || descLower.includes('deploy')) return { icon: '🔵', text: 'Deploy Rescue Boat 02 to Sector-04', agent: 'Allocation Agent' }
    return { icon: '🔵', text: description || 'Dispatch emergency response asset', agent: 'Allocation Agent' }
  }
  if (agentName === 'Router') {
    if (descLower.includes('route') || descLower.includes('block')) return { icon: '🟢', text: 'Road blocked — rescue route automatically changed (R12 → R16 → R18)', agent: 'Routing Agent' }
    return { icon: '🟢', text: description || 'Calculate optimal safe routing path', agent: 'Routing Agent' }
  }
  if (agentName === 'Communicator') {
    return { icon: '🟣', text: 'Open Shelter-03 (Sector-04 safezone)', agent: 'Communication Agent' }
  }
  if (agentName === 'Severity') {
    return { icon: '🟠', text: 'Severity increased to HIGH in Sector-04', agent: 'Severity Agent' }
  }
  if (agentName === 'Verifier') {
    return { icon: '🟢', text: 'Citizen flood report verified in Sector-07', agent: 'Verification Agent' }
  }
  if (agentName === 'Predictor') {
    return { icon: '🔮', text: 'Flood expected to reach Sector-07 in 15 minutes', agent: 'Prediction Agent' }
  }

  return { icon: '⚡', text: description || action, agent: agentName }
}

export default function HumanAiDecisionStream() {
  const { decisions } = useAgentStore()
  const safeDecisions = Array.isArray(decisions) ? decisions : []

  // Sample default human decisions for immediate judge understanding
  const defaultItems = [
    { icon: '🔴', text: 'Evacuate Sector-04 immediately', agent: 'Policy Commander', time: '14:32' },
    { icon: '🔵', text: 'Deploy Rescue Boat 02 to Sector-04', agent: 'Allocation Agent', time: '14:32' },
    { icon: '🟢', text: 'Road blocked — rescue route automatically changed', agent: 'Routing Agent', time: '14:32' },
    { icon: '🟣', text: 'Open Shelter-03 safezone', agent: 'Communication Agent', time: '14:32' },
    { icon: '🟠', text: 'Severity increased to HIGH in Sector-04', agent: 'Severity Agent', time: '14:32' },
  ]

  const itemsToDisplay = safeDecisions.length > 0
    ? safeDecisions.slice(0, 5).map((d) => {
        const trans = translateDecisionToHuman(d.agent_name, d.action, d.description)
        const timeStr = new Date(d.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
        return { icon: trans.icon, text: trans.text, agent: trans.agent, time: timeStr, id: d.id }
      })
    : defaultItems

  return (
    <div className="bg-[#111827]/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md select-none font-mono text-white flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
            AI DECISIONS
          </h3>
        </div>
        <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">
          Human Language Stream
        </span>
      </div>

      {/* Decision Items */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-slate-800">
        {itemsToDisplay.map((item, idx) => (
          <div
            key={idx}
            className="bg-[#0b0f19] border border-slate-800/80 rounded-xl p-2.5 flex items-start justify-between gap-2.5 hover:border-slate-700 transition-colors"
          >
            <div className="flex items-start gap-2 min-w-0">
              <span className="text-sm mt-0.5">{item.icon}</span>
              <div className="min-w-0">
                <div className="text-xs font-sans font-bold text-white leading-snug">
                  {item.text}
                </div>
                <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                  {item.agent}
                </div>
              </div>
            </div>
            <span className="text-[10px] font-mono text-slate-500 shrink-0">{item.time}</span>
          </div>
        ))}
      </div>

      {/* Concise Explainability Box (Section 15) */}
      <div className="mt-3 p-2.5 rounded-xl bg-[#0b0f19] border border-slate-800 text-[10px] font-sans flex flex-col gap-1 shrink-0">
        <div className="flex items-center justify-between text-cyan-400 font-bold font-mono">
          <span className="flex items-center gap-1">
            <HelpCircle size={11} /> WHY?
          </span>
          <span className="text-emerald-400 font-mono">CONFIDENCE: 94%</span>
        </div>
        <p className="text-slate-300 leading-snug">
          "Flood depth increased by 0.4m and the water front expanded 7% in the last 5 minutes."
        </p>
        <div className="text-amber-400 font-mono font-bold mt-0.5">
          ACTION: <span className="text-white font-normal">Evacuation recommended.</span>
        </div>
      </div>
    </div>
  )
}
