'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Crown, Shield, LifeBuoy, ChevronRight } from 'lucide-react'
import { useProfileStore, Profile, Role, getDashboardPathForRole } from '@/stores/useProfileStore'
import { usePrivacyStore } from '@/stores/privacyStore'

export default function SelectProfilePage() {
  const router = useRouter()
  const setProfile = useProfileStore((state) => state.setProfile)
  const setRole = usePrivacyStore((state) => state.setRole)

  const handleSelectProfile = (role: Role) => {
    let profile: Profile
    if (role === 'SYSTEM_ADMIN') {
      profile = { role: 'SYSTEM_ADMIN', name: 'Maria Chen' }
    } else if (role === 'SECTOR_COMMANDER') {
      profile = { role: 'SECTOR_COMMANDER', name: 'Commander — Sector 04', sector: '04' }
    } else {
      profile = { role: 'FIELD_RESPONDER', name: 'Unit 12', sector: '04', reportsTo: 'Sector 04 Commander' }
    }

    setProfile(profile)
    setRole(role)

    // Redirect directly to role-specific dashboard!
    const targetDashboard = getDashboardPathForRole(role)
    router.push(targetDashboard)
  }

  return (
    <div className="relative min-h-screen w-full bg-[#F7F7F5] text-[#111111] font-sans flex flex-col items-center justify-center p-6 selection:bg-[#2563EB] selection:text-white">
      
      {/* Background Aurora Blobs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[15%] w-[400px] h-[400px] rounded-full bg-amber-400/15 blur-[120px]" />
        <div className="absolute top-[30%] right-[10%] w-[420px] h-[420px] rounded-full bg-blue-400/15 blur-[120px]" />
        <div className="absolute bottom-[10%] left-[35%] w-[380px] h-[380px] rounded-full bg-cyan-400/15 blur-[120px]" />
      </div>

      <div className="w-full max-w-2xl space-y-8 text-center flex flex-col items-center">
        
        {/* Header */}
        <div className="space-y-3 flex flex-col items-center">
          <div className="p-3 rounded-2xl bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/20 inline-flex items-center gap-2">
            <Shield size={24} />
            <span className="font-mono text-xs font-bold uppercase tracking-wider">AEGIS EMERGENCY INTELLIGENCE</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-[#111111] tracking-tight">
            SELECT OPERATIONAL PROFILE
          </h1>

          <p className="text-xs sm:text-sm text-[#6E6E73] max-w-md font-normal">
            Choose your persona to access AEGIS emergency response capabilities and data clearance levels.
          </p>
        </div>

        {/* PROFILE CARDS LIST */}
        <div className="w-full max-w-3xl mx-auto flex flex-col gap-5 text-left">

          {/* ADMIN CARD */}
          <button
            onClick={() => handleSelectProfile('SYSTEM_ADMIN')}
            className="group relative w-full flex items-center gap-5 px-6 py-6 rounded-3xl
              bg-gradient-to-b from-white/90 to-white/70 backdrop-blur-[20px] backdrop-saturate-[180%]
              border-l-[4px] border-l-amber-500
              border-t border-t-white/90 border-r border-r-white/50 border-b border-b-white/40
              shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_16px_40px_rgba(0,0,0,0.08)]
              transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
              hover:-translate-y-1 hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_20px_50px_rgba(245,158,11,0.18)]
              hover:border-l-amber-400
              motion-reduce:hover:translate-y-0 text-left cursor-pointer"
          >
            <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-amber-500/12 border border-amber-500/25
              flex items-center justify-center transition-colors group-hover:bg-amber-500/20">
              <Crown size={26} className="text-amber-500" />
            </div>

            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-bold text-lg text-[#111111] tracking-tight">Maria Chen</span>
              </div>
              <p className="text-sm text-[#6E6E73]">Operations Director — Full System Oversight</p>
            </div>

            <ChevronRight size={20} className="flex-shrink-0 text-[#6E6E73] transition-transform group-hover:translate-x-1" />
          </button>

          {/* COMMANDER CARD */}
          <button
            onClick={() => handleSelectProfile('SECTOR_COMMANDER')}
            className="group relative w-full flex items-center gap-5 px-6 py-6 rounded-3xl
              bg-gradient-to-b from-white/90 to-white/70 backdrop-blur-[20px] backdrop-saturate-[180%]
              border-l-[4px] border-l-[#2563EB]
              border-t border-t-white/90 border-r border-r-white/50 border-b border-b-white/40
              shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_16px_40px_rgba(0,0,0,0.08)]
              transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
              hover:-translate-y-1 hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_20px_50px_rgba(37,99,235,0.18)]
              hover:border-l-[#4A85F2]
              motion-reduce:hover:translate-y-0 text-left cursor-pointer"
          >
            <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-[#2563EB]/10 border border-[#2563EB]/25
              flex items-center justify-center transition-colors group-hover:bg-[#2563EB]/20">
              <Shield size={26} className="text-[#2563EB]" />
            </div>

            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-bold text-lg text-[#111111] tracking-tight">Commander — Sector 04</span>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#2563EB]
                  bg-[#2563EB]/10 border border-[#2563EB]/20 px-2.5 py-1 rounded-full whitespace-nowrap">
                  Sector 04
                </span>
              </div>
              <p className="text-sm text-[#6E6E73]">Sector Command — Reports to Operations</p>
            </div>

            <ChevronRight size={20} className="flex-shrink-0 text-[#6E6E73] transition-transform group-hover:translate-x-1" />
          </button>

          {/* RESPONDER CARD */}
          <button
            onClick={() => handleSelectProfile('FIELD_RESPONDER')}
            className="group relative w-full flex items-center gap-5 px-6 py-6 rounded-3xl
              bg-gradient-to-b from-white/90 to-white/70 backdrop-blur-[20px] backdrop-saturate-[180%]
              border-l-[4px] border-l-cyan-500
              border-t border-t-white/90 border-r border-r-white/50 border-b border-b-white/40
              shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_16px_40px_rgba(0,0,0,0.08)]
              transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
              hover:-translate-y-1 hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_20px_50px_rgba(6,182,212,0.18)]
              hover:border-l-cyan-400
              motion-reduce:hover:translate-y-0 text-left cursor-pointer"
          >
            <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-cyan-500/12 border border-cyan-500/25
              flex items-center justify-center transition-colors group-hover:bg-cyan-500/20">
              <LifeBuoy size={26} className="text-cyan-500" />
            </div>

            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-bold text-lg text-[#111111] tracking-tight">Unit 12</span>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-600
                  bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-full whitespace-nowrap">
                  Sector 04
                </span>
              </div>
              <p className="text-sm text-[#6E6E73]">Field Responder — Reports to Sector 04 Commander</p>
            </div>

            <ChevronRight size={20} className="flex-shrink-0 text-[#6E6E73] transition-transform group-hover:translate-x-1" />
          </button>

        </div>

      </div>

    </div>
  )
}
