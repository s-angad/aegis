'use client'

import React, { useEffect } from 'react'
import { Lock, ShieldAlert } from 'lucide-react'
import { Tier, Context, Intent, canView, getPrivacyGateReason } from '@/lib/privacy/policy'
import { Role, useProfileStore } from '@/stores/useProfileStore'
import { useAuditStore } from '@/stores/useAuditStore'
import { deriveCurrentContext } from '@/lib/privacy/contextHelper'

export interface PrivacyGateProps {
  tier?: Tier
  classification?: Tier // Alias for tier
  role?: Role
  context?: Context
  intent?: Intent
  field: string
  children: React.ReactNode
  fallbackText?: string
  fallbackValue?: string // Alias for fallbackText
  className?: string
  [key: string]: unknown
}

export const PrivacyGate: React.FC<PrivacyGateProps> = ({
  tier,
  classification,
  role,
  context,
  intent,
  field,
  children,
  fallbackText,
  fallbackValue,
  className = ''
}) => {
  const currentProfile = useProfileStore((state) => state.currentProfile)
  const currentIntent = useAuditStore((state) => state.currentIntent)
  const logRestrictedAccess = useAuditStore((state) => state.logRestrictedAccess)

  const effectiveTier: Tier = tier || classification || 'SENSITIVE'
  const effectiveRole: Role = role || currentProfile?.role || 'FIELD_RESPONDER'
  const effectiveContext: Context = context || deriveCurrentContext()
  const effectiveIntent: Intent = intent || currentIntent
  const displayText = fallbackText || fallbackValue || 'REDACTED TELEMETRY'

  const allowed = canView(effectiveTier, effectiveRole, effectiveContext, effectiveIntent)
  const reason = getPrivacyGateReason(effectiveTier, effectiveRole, effectiveContext, effectiveIntent)

  // Every time a RESTRICTED-tier field is successfully unlocked, push an entry to the Access Log!
  useEffect(() => {
    if (allowed && effectiveTier === 'RESTRICTED') {
      logRestrictedAccess({
        role: effectiveRole,
        name: currentProfile?.name || 'Unknown User',
        intent: effectiveIntent,
        context: effectiveContext,
        field
      })
    }
  }, [allowed, effectiveTier, effectiveRole, effectiveIntent, effectiveContext, field, currentProfile?.name, logRestrictedAccess])

  if (allowed) {
    return <>{children}</>
  }

  // Denied: render blurred placeholder (filter: blur(6px)) with lock icon and hover tooltip
  return (
    <span
      className={`group relative inline-flex items-center gap-1 rounded bg-slate-200/70 backdrop-blur-md border border-slate-300/80 px-2 py-0.5 font-mono text-xs text-slate-500 select-none cursor-help transition-all hover:border-amber-400/80 ${className}`}
      title={reason}
    >
      <Lock size={12} className="text-amber-600 shrink-0" />
      <span className="filter blur-[6px] opacity-70 pointer-events-none">
        {displayText}
      </span>

      {/* Hover Tooltip */}
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col gap-1 w-64 p-3 rounded-xl bg-[#080B12]/95 backdrop-blur-xl border border-amber-500/40 shadow-2xl text-left z-50 text-[11px] font-sans text-white pointer-events-none animate-fadeIn">
        <span className="flex items-center gap-1.5 font-mono font-bold text-amber-400 uppercase text-[10px]">
          <ShieldAlert size={12} />
          <span>PRIVACY CONTROL GATE</span>
        </span>
        <span className="text-slate-200 leading-snug font-medium">{reason}</span>
        <span className="text-[9px] font-mono text-slate-400 pt-1 border-t border-white/10">
          Classification Tier: <strong className="text-amber-300">{effectiveTier}</strong>
        </span>
      </span>
    </span>
  )
}
