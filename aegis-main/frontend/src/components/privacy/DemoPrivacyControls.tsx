'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { FileText } from 'lucide-react'
import { Role, Intent } from '@/lib/privacy/classification'
import { usePrivacyStore } from '@/stores/privacyStore'
import { useProfileStore, Profile, getDashboardPathForRole } from '@/stores/useProfileStore'
import { deriveCurrentContext } from '@/lib/privacy/contextHelper'

interface DemoPrivacyControlsProps {
  onOpenAuditLog?: () => void
  isMissionReportOpen?: boolean
}

export const DemoPrivacyControls: React.FC<DemoPrivacyControlsProps> = ({
  onOpenAuditLog,
  isMissionReportOpen = false
}) => {
  const router = useRouter()
  const { currentRole, currentIntent, setRole, setIntent, auditLogs } = usePrivacyStore()
  const setProfile = useProfileStore((state) => state.setProfile)
  const currentContext = deriveCurrentContext(isMissionReportOpen)

  const handleRoleChange = (newRole: Role) => {
    setRole(newRole)

    let profile: Profile
    if (newRole === 'SYSTEM_ADMIN') {
      profile = { role: 'SYSTEM_ADMIN', name: 'Maria Chen' }
    } else if (newRole === 'SECTOR_COMMANDER') {
      profile = { role: 'SECTOR_COMMANDER', name: 'Commander — Sector 04', sector: '04' }
    } else {
      profile = { role: 'FIELD_RESPONDER', name: 'Unit 12', sector: '04', reportsTo: 'Sector 04 Commander' }
    }

    setProfile(profile)
    router.push(getDashboardPathForRole(newRole))
  }

  return (
    <div className="w-full flex justify-center px-4 mt-3 mb-1">
      <div className="flex items-center gap-2 px-3 py-2 rounded-full
        bg-white/60 backdrop-blur-[16px] saturate-[180%]
        border-t border-t-white/80 border-x border-x-white/40 border-b border-b-white/25
        shadow-[inset_0_1px_1px_rgba(255,255,255,0.7),0_4px_16px_rgba(0,0,0,0.05)]
        text-[10px] font-mono font-medium text-[#6E6E73] flex-wrap justify-center">

        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/5">
          <span className="text-amber-600 font-bold">DEMO</span>
        </span>

        <select
          value={currentRole}
          onChange={(e) => handleRoleChange(e.target.value as Role)}
          className="appearance-none px-2.5 py-1 rounded-full bg-white/70 border border-slate-200
            text-[10px] font-mono font-semibold text-[#111111] cursor-pointer
            focus:outline-none focus:ring-1 focus:ring-[#2563EB]/40"
        >
          <option value="FIELD_RESPONDER">Field Responder</option>
          <option value="SECTOR_COMMANDER">Sector Commander</option>
          <option value="SYSTEM_ADMIN">System Admin</option>
        </select>

        <select
          value={currentIntent}
          onChange={(e) => setIntent(e.target.value as Intent)}
          className="appearance-none px-2.5 py-1 rounded-full bg-white/70 border border-slate-200
            text-[10px] font-mono font-semibold text-[#111111] cursor-pointer
            focus:outline-none focus:ring-1 focus:ring-[#2563EB]/40"
        >
          <option value="Browsing">Browsing</option>
          <option value="Field Coordination">Field Coordination</option>
          <option value="Compliance Review">Compliance Review</option>
        </select>

        <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 font-bold uppercase">
          {currentContext}
        </span>

        {onOpenAuditLog && (
          <button
            onClick={onOpenAuditLog}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#2563EB]/10
              text-[#2563EB] font-bold hover:bg-[#2563EB]/20 transition-colors cursor-pointer"
          >
            <FileText size={11} />
            <span>Access Log ({auditLogs.length})</span>
          </button>
        )}

      </div>
    </div>
  )
}
