'use client'

import React from 'react'
import { Compass } from 'lucide-react'
import { Intent } from '@/lib/privacy/policy'
import { useAuditStore } from '@/stores/useAuditStore'

export const IntentSelector: React.FC = () => {
  const { currentIntent, setIntent } = useAuditStore()

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-slate-300/80 shadow-xs font-sans text-xs text-[#111111]">
      <Compass size={14} className="text-amber-600 shrink-0" />
      <span className="font-mono text-[10px] font-bold text-slate-500 uppercase">INTENT:</span>
      <select
        value={currentIntent}
        onChange={(e) => setIntent(e.target.value as Intent)}
        className="bg-slate-100 font-bold text-xs text-[#111111] px-2 py-0.5 rounded border border-slate-300 cursor-pointer outline-none transition-all"
      >
        <option value="BROWSING">Browsing (Default)</option>
        <option value="FIELD_COORDINATION">Field Coordination</option>
        <option value="COMPLIANCE_REVIEW">Compliance Review</option>
      </select>
    </div>
  )
}
