'use client'

import React, { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { UserCheck, RefreshCw, Shield, LayoutDashboard, Compass } from 'lucide-react'
import { useProfileStore } from '@/stores/profileStore'
import { ProfileSelectionModal } from './ProfileSelectionModal'

export const ProfileSwitcherBar: React.FC = () => {
  const router = useRouter()
  const pathname = usePathname()
  const { currentProfile, setProfileModalOpen, isProfileModalOpen } = useProfileStore()

  return (
    <>
      <div className="w-full bg-[#080B12]/95 backdrop-blur-md border-b border-white/10 px-4 sm:px-8 py-2 text-white font-sans text-xs flex flex-wrap items-center justify-between gap-3 z-40">
        
        {/* Active Persona Badge */}
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{currentProfile.avatar}</span>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <span className="font-bold text-white tracking-wide">
              {currentProfile.name}
            </span>
            <span className="text-slate-400 font-mono text-[11px] hidden sm:inline">·</span>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-white/10 text-cyan-300 font-bold border border-cyan-500/30 uppercase">
              {currentProfile.role.replace('_', ' ')}
            </span>
            {currentProfile.assignedSector && (
              <span className="font-mono text-[10px] text-slate-300">
                📍 {currentProfile.assignedSector}
              </span>
            )}
          </div>
        </div>

        {/* Dashboards Jump Links & Switch Profile Action */}
        <div className="flex items-center gap-2 flex-wrap font-mono text-[11px]">
          <span className="text-slate-500 text-[10px] uppercase font-bold hidden md:inline">DEMO VIEWS:</span>

          <button
            onClick={() => router.push('/dashboard/admin')}
            className={`px-3 py-1 rounded-full border transition-all cursor-pointer flex items-center gap-1 font-bold ${
              pathname === '/dashboard/admin'
                ? 'bg-purple-500/30 text-purple-300 border-purple-400/60 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
            }`}
          >
            <span>👑 Admin</span>
          </button>

          <button
            onClick={() => router.push('/dashboard/commander')}
            className={`px-3 py-1 rounded-full border transition-all cursor-pointer flex items-center gap-1 font-bold ${
              pathname === '/dashboard/commander'
                ? 'bg-blue-500/30 text-blue-300 border-blue-400/60 shadow-[0_0_12px_rgba(59,130,246,0.3)]'
                : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
            }`}
          >
            <span>🛡️ Commander</span>
          </button>

          <button
            onClick={() => router.push('/dashboard/responder')}
            className={`px-3 py-1 rounded-full border transition-all cursor-pointer flex items-center gap-1 font-bold ${
              pathname === '/dashboard/responder'
                ? 'bg-emerald-500/30 text-emerald-300 border-emerald-400/60 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
            }`}
          >
            <span>🚤 Responder</span>
          </button>

          <button
            onClick={() => setProfileModalOpen(true)}
            className="px-3 py-1 rounded-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-bold border border-cyan-500/40 transition-all cursor-pointer flex items-center gap-1 ml-1"
          >
            <RefreshCw size={12} />
            <span>Switch Profile</span>
          </button>
        </div>

      </div>

      <ProfileSelectionModal
        isOpen={isProfileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />
    </>
  )
}
