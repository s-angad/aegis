'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Shield, UserCheck, CheckCircle2, ArrowRight, X } from 'lucide-react'
import { PRESET_PROFILES, useProfileStore } from '@/stores/profileStore'

interface ProfileSelectionModalProps {
  isOpen: boolean
  onClose: () => void
}

export const ProfileSelectionModal: React.FC<ProfileSelectionModalProps> = ({ isOpen, onClose }) => {
  const router = useRouter()
  const { currentProfile, setProfile } = useProfileStore()

  if (!isOpen) return null

  const handleSelect = (profileId: string, role: string) => {
    setProfile(profileId)
    onClose()
    
    // Navigate to role's dashboard
    if (role === 'SYSTEM_ADMIN') {
      router.push('/dashboard/admin')
    } else if (role === 'SECTOR_COMMANDER') {
      router.push('/dashboard/commander')
    } else {
      router.push('/dashboard/responder')
    }
  }

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md font-sans">
      <div className="relative w-full max-w-3xl rounded-[28px] bg-white border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/20">
              <UserCheck size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-[#111111] tracking-tight">
                AEGIS CHAIN OF COMMAND — SELECT PERSONA
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Choose an operational profile to launch its dedicated command dashboard.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-[#111111] hover:bg-slate-100 transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Persona Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PRESET_PROFILES.map((p) => {
            const isSelected = currentProfile.id === p.id

            return (
              <div
                key={p.id}
                onClick={() => handleSelect(p.id, p.role)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer space-y-3 relative group ${
                  isSelected
                    ? 'bg-blue-50/70 border-2 border-[#2563EB] shadow-md'
                    : 'bg-white hover:bg-slate-50/80 border-slate-200/90 shadow-2xs'
                }`}
              >
                {isSelected && (
                  <span className="absolute top-4 right-4 text-[#2563EB]">
                    <CheckCircle2 size={18} />
                  </span>
                )}

                <div className="flex items-center gap-3">
                  <span className="text-3xl">{p.avatar}</span>
                  <div>
                    <h3 className="font-bold text-sm text-[#111111] leading-snug">{p.name}</h3>
                    <p className="text-xs text-slate-500 font-medium">{p.title}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 font-mono text-[10px]">
                  <span className={`px-2 py-0.5 rounded font-bold uppercase border ${p.badgeColor}`}>
                    {p.role.replace('_', ' ')}
                  </span>
                  {p.assignedSector && (
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold border border-slate-200">
                      📍 {p.assignedSector}
                    </span>
                  )}
                  {p.reportsTo && (
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                      Reports to: {p.reportsTo}
                    </span>
                  )}
                </div>

                <div className="pt-2 flex items-center justify-between text-xs font-bold text-[#2563EB] group-hover:translate-x-0.5 transition-transform">
                  <span>Enter Dashboard</span>
                  <ArrowRight size={14} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer Note */}
        <div className="text-[11px] font-mono text-slate-400 text-center border-t border-slate-100 pt-3">
          DEMO UTILITY: Switch between profiles anytime to experience role-based chain of command & data access.
        </div>

      </div>
    </div>
  )
}
