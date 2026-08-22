'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Shield, Play, ChevronRight, Cpu, ArrowRight, CheckCircle2, 
  Activity, RefreshCw, ArrowDown, Droplet, LifeBuoy, Navigation, Users, HeartHandshake, Anchor, UserCheck, ChevronDown
} from 'lucide-react'
import TechnicalDetailsDrawer from '@/components/drawers/TechnicalDetailsDrawer'
import { PrivacyGate } from '@/components/privacy/PrivacyGate'
import { DemoPrivacyControls } from '@/components/privacy/DemoPrivacyControls'
import { ProfileSwitcherBar } from '@/components/profile/ProfileSwitcherBar'
import { useProfileStore } from '@/stores/useProfileStore'

interface AegisLandingPageProps {
  onInitialize: () => void
}

export default function AegisLandingPage({ onInitialize }: AegisLandingPageProps) {
  const router = useRouter()
  const currentProfile = useProfileStore((state) => state.currentProfile)

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [oodaActiveState, setOodaActiveState] = useState(2) // 0: OBSERVE, 1: VERIFY, 2: PREDICT, 3: DECIDE, 4: ACT

  // Redirect to /select-profile if currentProfile is null
  useEffect(() => {
    if (currentProfile === null) {
      router.push('/select-profile')
    }
  }, [currentProfile, router])

  // Sequential OODA illumination timeline loop
  useEffect(() => {
    const timer = setInterval(() => {
      setOodaActiveState((prev) => (prev + 1) % 5)
    }, 2600)
    return () => clearInterval(timer)
  }, [])

  const handleStartSystem = () => {
    setIsInitializing(true)
    setTimeout(() => {
      onInitialize()
    }, 1000)
  }

  const scrollToAnchor = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // Derive dynamic avatar initials & styling for active profile
  const roleInitials =
    currentProfile?.role === 'SYSTEM_ADMIN' ? 'MC' :
    currentProfile?.role === 'SECTOR_COMMANDER' ? 'C4' : 'U12'

  const roleLabel =
    currentProfile?.role === 'SYSTEM_ADMIN' ? 'Admin' :
    currentProfile?.role === 'SECTOR_COMMANDER' ? 'Commander' : 'Responder'

  const roleAvatarStyle =
    currentProfile?.role === 'SYSTEM_ADMIN' ? 'bg-amber-500/15 text-amber-600 border-amber-500/30' :
    currentProfile?.role === 'SECTOR_COMMANDER' ? 'bg-blue-600/15 text-[#2563EB] border-blue-500/30' :
    'bg-cyan-500/15 text-cyan-600 border-cyan-500/30'

  return (
    <div className="relative min-h-screen w-full bg-[#F7F7F5] text-[#111111] font-sans selection:bg-[#2563EB] selection:text-white flex flex-col justify-between items-center text-center overflow-x-hidden">
      
      {/* PERSISTENT CHAIN OF COMMAND PROFILE BAR */}
      <ProfileSwitcherBar />

      {/* ───────────────────────────────────────────────────────────── */}
      {/* AURORA BACKGROUND (MANDATORY FOR LIQUID GLASS REFRACTION) */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[8%] w-[520px] h-[520px] rounded-full bg-blue-400/25 blur-[130px]" />
        <div className="absolute top-[15%] right-[4%] w-[420px] h-[420px] rounded-full bg-cyan-300/20 blur-[120px]" />
        <div className="absolute bottom-[8%] left-[28%] w-[460px] h-[460px] rounded-full bg-indigo-300/15 blur-[130px]" />
        <div className="absolute top-[45%] left-[55%] w-[380px] h-[380px] rounded-full bg-sky-300/15 blur-[110px]" />
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. FLOATING LIQUID GLASS NAVIGATION */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="sticky top-6 z-50 w-full px-4 sm:px-8 flex flex-col items-center gap-3 mb-6">
        <header className="max-w-[1020px] w-full h-[64px] mx-auto rounded-full liquid-glass-navbar px-6 flex items-center justify-between transition-all duration-300">
          
          {/* Brand */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="p-1.5 rounded-full bg-[#2563EB]/10 text-[#2563EB]">
              <Shield size={18} />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-bold text-sm text-[#111111] tracking-tight leading-none font-sans">AEGIS FLOOD</span>
              <span className="text-[9px] font-mono text-[#6E6E73] tracking-widest uppercase">AUTONOMOUS EMERGENCY INTELLIGENCE</span>
            </div>
          </div>

          {/* Nav Links - shrink-0 to prevent wrapping & overflow */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-medium text-[#6E6E73] font-sans shrink-0">
            <button onClick={() => scrollToAnchor('hero')} className="hover:text-[#2563EB] transition-colors cursor-pointer whitespace-nowrap">Overview</button>
            <button onClick={() => scrollToAnchor('problem')} className="hover:text-[#2563EB] transition-colors cursor-pointer whitespace-nowrap">Capabilities</button>
            <button onClick={() => scrollToAnchor('ooda')} className="hover:text-[#2563EB] transition-colors cursor-pointer whitespace-nowrap">Intelligence</button>
            <button onClick={() => scrollToAnchor('impact')} className="hover:text-[#2563EB] transition-colors cursor-pointer whitespace-nowrap">Impact</button>
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2.5 font-sans shrink-0">
            
            {/* Compact Profile Avatar Chip — Replaces old overflowed text badge */}
            <button
              onClick={() => router.push('/select-profile')}
              className="hidden md:flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full
                bg-white/70 backdrop-blur-[16px] saturate-[180%]
                border-t border-t-white/90 border-x border-x-white/50 border-b border-b-white/30
                shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_2px_8px_rgba(0,0,0,0.04)]
                hover:bg-white/85 transition-colors cursor-pointer"
              title="Click to switch profile"
            >
              <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-[10px] font-bold shrink-0 ${roleAvatarStyle}`}>
                {roleInitials}
              </div>
              <span className="text-xs font-semibold text-[#111111] whitespace-nowrap">
                {roleLabel}
              </span>
              <ChevronDown size={12} className="text-[#6E6E73]" />
            </button>

            <button
              onClick={() => setDrawerOpen(true)}
              className="p-2 rounded-full text-[#6E6E73] hover:text-[#111111] hover:bg-slate-100 transition-colors cursor-pointer"
              title="System Specs"
            >
              <Cpu size={16} />
            </button>

            <button
              onClick={handleStartSystem}
              disabled={isInitializing}
              className="liquid-glass-button text-white px-5 py-2.5 rounded-full text-xs font-bold cursor-pointer inline-flex items-center gap-2 whitespace-nowrap"
            >
              <span>Launch Simulation →</span>
            </button>
          </div>

        </header>

        {/* DEMO ROLE & INTENT CONTROLS BAR */}
        <DemoPrivacyControls onOpenAuditLog={() => setDrawerOpen(true)} />
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* GLOBAL MAIN CONTAINER (MAX-WIDTH 1200px) */}
      {/* ───────────────────────────────────────────────────────────── */}
      <main className="w-full max-w-[1200px] mx-auto px-6 sm:px-12 flex-1 flex flex-col items-center text-center">
        
        {/* ───────────────────────────────────────────────────────────── */}
        {/* HERO — CENTERED COMPOSITION */}
        {/* ───────────────────────────────────────────────────────────── */}
        <section id="hero" className="w-full py-16 lg:py-24 space-y-12 border-b border-slate-200/60 font-sans flex flex-col items-center text-center">
          
          {/* CENTERED HERO COPY */}
          <div className="max-w-[1050px] mx-auto space-y-6 flex flex-col items-center text-center">
            
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full liquid-glass-chip text-[#2563EB] font-mono text-[11px] font-bold uppercase tracking-wider">
              <Activity size={13} />
              <span>AUTONOMOUS EMERGENCY INTELLIGENCE</span>
            </div>

            <h1 className="text-5xl sm:text-7xl lg:text-[96px] font-black tracking-tight leading-[0.92] font-sans text-center">
              <span className="text-[#111111]">WHEN WATER MOVES, </span> <br className="hidden sm:inline" />
              <span className="text-[#2563EB]">AEGIS MOVES FIRST.</span>
            </h1>

            <p className="text-sm sm:text-base md:text-lg text-[#6E6E73] font-sans leading-relaxed max-w-[650px] mx-auto font-normal text-center">
              An autonomous emergency intelligence platform that predicts flood propagation, identifies emerging risk, and coordinates finite emergency resources before conditions worsen.
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-xs font-bold font-sans">
              
              <button
                onClick={handleStartSystem}
                disabled={isInitializing}
                className="liquid-glass-button text-white px-9 py-4 rounded-full font-bold text-sm cursor-pointer flex items-center gap-2"
              >
                {isInitializing ? (
                  <>
                    <RefreshCw size={16} className="animate-spin text-white" />
                    <span>Initializing Engine...</span>
                  </>
                ) : (
                  <>
                    <span>Launch Simulation →</span>
                  </>
                )}
              </button>

              <button
                onClick={() => scrollToAnchor('problem')}
                className="text-[#6E6E73] hover:text-[#111111] px-5 py-4 rounded-full transition-colors cursor-pointer flex items-center gap-1.5 font-semibold text-xs"
              >
                <span>See how AEGIS thinks ↓</span>
              </button>
            </div>

          </div>

          {/* DIGITAL TWIN SHOWCASE (BELOW HERO COPY, FULL-WIDTH SHOWCASE) */}
          <div className="w-full max-w-[1200px] mx-auto pt-4">
            <div className="w-full rounded-[32px] bg-gradient-to-b from-[#0B132B] to-[#050B16] liquid-glass-dark p-6 sm:p-8 space-y-4 font-mono relative overflow-hidden">
              
              {/* Header */}
              <div className="flex items-center justify-between text-xs text-slate-400 border-b border-white/10 pb-3 font-sans">
                <div className="flex items-center gap-2 font-bold text-white">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB] animate-pulse" />
                  <span>● LIVE DIGITAL TWIN</span>
                </div>
                <span className="text-[10px] font-mono">16 SECTORS · CONTINUOUS OODA</span>
              </div>

              {/* Viewport (~440–500px height) */}
              <div className="relative w-full h-[440px] sm:h-[500px] rounded-2xl bg-[#070A12] overflow-hidden border border-white/10 shadow-inner">
                <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#38BDF8_1px,transparent_1px)] [background-size:24px_24px]" />

                <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                  <path d="M 0 160 Q 300 90 600 200 T 1200 280" fill="none" stroke="#1D4ED8" strokeWidth="58" strokeLinecap="round" opacity="0.6" />
                  <path d="M 0 160 Q 300 90 600 200 T 1200 280" fill="none" stroke="#38BDF8" strokeWidth="20" strokeLinecap="round" opacity="0.8" />

                  <rect x="220" y="30" width="180" height="120" fill="rgba(255,69,58,0.25)" stroke="#FF453A" strokeWidth="1.5" />
                  <text x="235" y="55" fill="#FF453A" fontSize="11" fontFamily="monospace" fontWeight="bold">S04 HIGH RISK</text>

                  <rect x="440" y="45" width="160" height="125" fill="rgba(245,158,11,0.18)" stroke="#F59E0B" strokeWidth="1" strokeDasharray="3 3" />
                  <text x="455" y="70" fill="#F59E0B" fontSize="11" fontFamily="monospace" fontWeight="bold">S07 PREDICTED</text>

                  <rect x="640" y="55" width="170" height="130" fill="rgba(22,163,74,0.15)" stroke="#16A34A" strokeWidth="1" strokeDasharray="3 3" />
                  <text x="655" y="80" fill="#16A34A" fontSize="11" fontFamily="monospace" fontWeight="bold">S11 EVACUATION</text>

                  <path d="M 300 90 L 480 220 L 680 260" fill="none" stroke="#16A34A" strokeWidth="3.5" strokeDasharray="6 4" />
                </svg>

                {/* EXACTLY 2 GLASS ANNOTATION CHIPS */}
                <div className="absolute top-5 right-5 backdrop-blur-[20px] bg-white/75 border-t border-white/90 border-x border-b border-white/50 text-[#111111] p-4 rounded-2xl shadow-xl w-60 space-y-1 font-sans text-center">
                  <div className="text-[10px] font-mono font-bold text-[#2563EB] uppercase tracking-wider">AEGIS INTELLIGENCE</div>
                  <div className="text-xs font-bold text-[#111111] pt-0.5">SECTOR 04 SURGE</div>
                  <div className="text-xs font-mono text-[#FF453A] font-bold">
                    <PrivacyGate classification="SENSITIVE" field="Sector 04 Surge Level" fallbackValue="2.1m → 2.4m">
                      2.1m → 2.4m
                    </PrivacyGate>
                  </div>
                  <div className="text-[10px] text-[#16A34A] font-mono font-bold uppercase pt-0.5">ACTION: EVACUATE</div>
                </div>

                <div className="absolute bottom-5 left-5 bg-[#050B16]/80 backdrop-blur-[12px] text-cyan-300 font-mono text-[10px] px-3.5 py-1.5 rounded-full border border-cyan-500/30 shadow-md flex items-center gap-1.5">
                  <PrivacyGate classification="SENSITIVE" field="Rescue Boat Staging" fallbackValue="🚤 RESCUE BOAT 02 MOBILIZED">
                    <span>🚤 RESCUE BOAT 02 MOBILIZED</span>
                  </PrivacyGate>
                </div>
              </div>

            </div>
          </div>

        </section>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* SECTION 02 — THE CRITICAL GAP */}
        {/* ───────────────────────────────────────────────────────────── */}
        <section id="problem" className="w-full py-24 lg:py-32 space-y-12 text-center border-b border-slate-200/60 font-sans flex flex-col items-center">
          
          <div className="max-w-2xl mx-auto space-y-3 text-center flex flex-col items-center">
            
            <span className="text-xs font-mono font-bold text-[#2563EB] uppercase tracking-widest px-3.5 py-1 rounded-full liquid-glass-chip">
              THE CRITICAL GAP
            </span>

            <h2 className="text-3xl sm:text-5xl font-black text-[#111111] tracking-tight text-center">
              DISASTERS MOVE. <br />
              <span className="text-[#2563EB]">DECISIONS CAN'T WAIT.</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#6E6E73] leading-relaxed max-w-xl mx-auto font-normal pt-1 text-center">
              Traditional emergency response often begins after conditions become critical. AEGIS continuously evaluates what is happening, what is likely to happen next, and what should happen now.
            </p>
          </div>

          {/* THREE EDITORIAL COLUMNS (NO CARDS, NO BORDERS) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto text-center w-full">
            <div className="space-y-2 py-4 flex flex-col items-center text-center">
              <span className="text-3xl font-black text-[#2563EB] font-mono block">01</span>
              <h3 className="text-sm font-bold text-[#111111] uppercase tracking-wider text-center">DETECT</h3>
              <p className="text-xs text-[#6E6E73] leading-relaxed text-center">See what is happening.</p>
            </div>

            <div className="space-y-2 py-4 flex flex-col items-center text-center border-y md:border-y-0 md:border-x border-slate-200/80">
              <span className="text-3xl font-black text-[#2563EB] font-mono block">02</span>
              <h3 className="text-sm font-bold text-[#111111] uppercase tracking-wider text-center">PREDICT</h3>
              <p className="text-xs text-[#6E6E73] leading-relaxed text-center">Know what is likely next.</p>
            </div>

            <div className="space-y-2 py-4 flex flex-col items-center text-center">
              <span className="text-3xl font-black text-[#2563EB] font-mono block">03</span>
              <h3 className="text-sm font-bold text-[#111111] uppercase tracking-wider text-center">RESPOND</h3>
              <p className="text-xs text-[#6E6E73] leading-relaxed text-center">Act before conditions worsen.</p>
            </div>
          </div>

        </section>

      </main>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* SECTION 03 — INTELLIGENCE (DARK FULL-WIDTH BACKGROUND #080D18) */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section id="ooda" className="w-full bg-[#080D18] py-24 text-white font-sans flex flex-col items-center text-center border-y border-white/10 my-6">
        <div className="max-w-[1200px] w-full mx-auto px-6 sm:px-12 space-y-12 flex flex-col items-center">
          
          <div className="text-center max-w-2xl mx-auto space-y-3 flex flex-col items-center">
            
            <span className="text-xs font-mono font-bold text-[#38BDF8] tracking-widest uppercase px-3 py-1 rounded-full bg-white/10 backdrop-blur-[10px] border border-white/20">
              AUTONOMOUS DECISION ENGINE
            </span>

            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight text-center">
              AEGIS THINKS BEFORE THE CRISIS ARRIVES.
            </h2>
            <p className="text-xs text-slate-400 font-mono font-medium text-center pt-1">
              Every 2 seconds, AEGIS evaluates the changing environment and decides what should happen next.
            </p>
          </div>

          {/* HORIZONTAL OODA PIPELINE (CYCLING ILLUMINATION) */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 relative max-w-5xl mx-auto font-mono text-center w-full">
            <div className={`p-4.5 rounded-2xl backdrop-blur-[12px] border transition-all duration-300 space-y-1.5 flex flex-col items-center text-center ${oodaActiveState === 0 ? 'bg-white/20 border-2 border-[#38BDF8] text-white shadow-[0_0_24px_rgba(56,189,248,0.35)]' : 'bg-white/5 border-white/10 text-slate-400 opacity-75'}`}>
              <span className="text-xs font-bold text-[#38BDF8] block">01 · OBSERVE</span>
              <p className="text-[11px] font-sans leading-snug text-center">Detect signals.</p>
            </div>

            <div className={`p-4.5 rounded-2xl backdrop-blur-[12px] border transition-all duration-300 space-y-1.5 flex flex-col items-center text-center ${oodaActiveState === 1 ? 'bg-white/20 border-2 border-[#38BDF8] text-white shadow-[0_0_24px_rgba(56,189,248,0.35)]' : 'bg-white/5 border-white/10 text-slate-400 opacity-75'}`}>
              <span className="text-xs font-bold text-[#38BDF8] block">02 · VERIFY</span>
              <p className="text-[11px] font-sans leading-snug text-center">Validate confidence.</p>
            </div>

            <div className={`p-4.5 rounded-2xl backdrop-blur-[12px] border transition-all duration-300 space-y-1.5 flex flex-col items-center text-center ${oodaActiveState === 2 ? 'bg-white/20 border-2 border-[#38BDF8] text-white shadow-[0_0_24px_rgba(56,189,248,0.35)]' : 'bg-white/5 border-white/10 text-slate-400 opacity-75'}`}>
              <span className="text-xs font-bold text-[#38BDF8] block">03 · PREDICT</span>
              <p className="text-[11px] font-sans leading-snug text-center">Forecast surge.</p>
            </div>

            <div className={`p-4.5 rounded-2xl backdrop-blur-[12px] border transition-all duration-300 space-y-1.5 flex flex-col items-center text-center ${oodaActiveState === 3 ? 'bg-white/20 border-2 border-[#38BDF8] text-white shadow-[0_0_24px_rgba(56,189,248,0.35)]' : 'bg-white/5 border-white/10 text-slate-400 opacity-75'}`}>
              <span className="text-xs font-bold text-[#38BDF8] block">04 · DECIDE</span>
              <p className="text-[11px] font-sans leading-snug text-center">Allocate assets.</p>
            </div>

            <div className={`p-4.5 rounded-2xl backdrop-blur-[12px] border transition-all duration-300 space-y-1.5 flex flex-col items-center text-center ${oodaActiveState === 4 ? 'bg-white/20 border-2 border-[#4ADE80] text-white shadow-[0_0_24px_rgba(74,222,128,0.35)]' : 'bg-white/5 border-white/10 text-slate-400 opacity-75'}`}>
              <span className="text-xs font-bold text-[#4ADE80] block">05 · ACT</span>
              <p className="text-[11px] font-sans leading-snug text-center">Execute response.</p>
            </div>
          </div>

        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MAIN CONTINUED CONTAINER (MAX-WIDTH 1200px) */}
      {/* ───────────────────────────────────────────────────────────── */}
      <main className="w-full max-w-[1200px] mx-auto px-6 sm:px-12 flex-1 flex flex-col items-center">

        {/* ───────────────────────────────────────────────────────────── */}
        {/* SECTION 04 — IMPACT (ONE LARGE GLASS COMPARISON CARD) */}
        {/* ───────────────────────────────────────────────────────────── */}
        <section id="impact" className="w-full py-24 lg:py-36 border-b border-slate-200/60 font-sans flex flex-col items-center text-center">
          
          <div className="max-w-2xl mx-auto space-y-3 text-center flex flex-col items-center pb-8">
            <span className="text-xs font-mono font-bold text-[#2563EB] uppercase tracking-widest px-3.5 py-1 rounded-full liquid-glass-chip">
              SIMULATION BENCHMARK
            </span>
            <h2 className="text-4xl sm:text-5xl font-black text-[#111111] tracking-tight text-center">
              SAME DISASTER. <br />
              <span className="text-[#2563EB]">DIFFERENT OUTCOME.</span>
            </h2>
          </div>

          {/* ONE LARGE GLASS COMPARISON CARD */}
          <div className="w-full max-w-[900px] mx-auto liquid-glass-card p-8 sm:p-10 rounded-[32px] space-y-8 text-center flex flex-col items-center font-mono">
            
            {/* HERO STATISTIC */}
            <div className="space-y-2 text-center w-full">
              <span className="text-7xl sm:text-8xl lg:text-[110px] font-black text-[#2563EB] block leading-none">44%</span>
              <span className="text-xs sm:text-sm font-bold text-[#16A34A] uppercase tracking-wider block font-sans">LOWER PROJECTED HUMAN EXPOSURE</span>
            </div>

            {/* TRADITIONAL vs AEGIS COMPARISON */}
            <div className="grid grid-cols-2 gap-6 items-center text-center w-full border-t border-b border-slate-200/60 py-6">
              <div className="space-y-1.5 border-r border-slate-200/80 pr-4 text-center">
                <span className="text-xs font-bold text-[#6E6E73] uppercase block font-sans">TRADITIONAL RESPONSE</span>
                <span className="text-3xl sm:text-4xl font-black text-[#6E6E73] block">
                  <PrivacyGate classification="SENSITIVE" field="Traditional Exposure Count" fallbackValue="35,477">
                    35,477
                  </PrivacyGate>
                </span>
                <span className="text-[11px] text-[#6E6E73] block">Projected Exposure</span>
              </div>

              <div className="space-y-1.5 text-center">
                <span className="text-xs font-bold text-[#2563EB] uppercase block font-sans">AEGIS AUTONOMOUS</span>
                <span className="text-3xl sm:text-4xl font-black text-[#2563EB] block">
                  <PrivacyGate classification="SENSITIVE" field="AEGIS Exposure Count" fallbackValue="19,867">
                    19,867
                  </PrivacyGate>
                </span>
                <span className="text-[11px] text-[#16A34A] font-bold block uppercase">Projected Exposure</span>
              </div>
            </div>

            {/* THREE SUPPORTING METRICS */}
            <div className="grid grid-cols-3 gap-4 text-center w-full">
              <div className="border-r border-slate-200/80 pr-2">
                <span className="text-lg sm:text-xl font-black text-[#111111] block">91 → 57</span>
                <span className="text-[9px] text-[#6E6E73] uppercase font-bold block font-sans">PEAK SEVERITY</span>
              </div>
              <div className="border-r border-slate-200/80 pr-2">
                <span className="text-lg sm:text-xl font-black text-[#111111] block">100% → 93%</span>
                <span className="text-[9px] text-[#6E6E73] uppercase font-bold block font-sans">PEAK FLOODED AREA</span>
              </div>
              <div>
                <span className="text-lg sm:text-xl font-black text-[#16A34A] block">+7,360</span>
                <span className="text-[9px] text-[#6E6E73] uppercase font-bold block font-sans">CITIZENS PROTECTED</span>
              </div>
            </div>

          </div>

        </section>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* SECTION 05 — RESOURCE ORCHESTRATION */}
        {/* ───────────────────────────────────────────────────────────── */}
        <section className="w-full py-24 lg:py-32 font-sans border-b border-slate-200/60 flex flex-col items-center text-center">
          <div className="max-w-2xl mx-auto space-y-3 text-center flex flex-col items-center pb-6">
            <span className="text-xs font-mono font-bold text-[#2563EB] uppercase tracking-widest px-3.5 py-1 rounded-full liquid-glass-chip">
              RESOURCE ORCHESTRATION
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-[#111111] tracking-tight text-center">
              FINITE RESOURCES. DYNAMIC RESPONSE.
            </h2>
            <p className="text-xs sm:text-sm text-[#6E6E73] leading-relaxed text-center">
              AEGIS continuously allocates available emergency assets according to predicted risk.
            </p>
          </div>

          {/* SINGLE HORIZONTAL RESOURCE STRIP */}
          <div className="w-full max-w-4xl mx-auto space-y-5 font-mono text-center">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center border-b border-slate-200/60 pb-6">
              <div className="space-y-1 border-r-0 sm:border-r border-slate-200/80 pr-0 sm:pr-6">
                <span className="text-3xl sm:text-4xl font-black text-[#111111] block">10</span>
                <span className="text-xs text-[#6E6E73] font-bold block uppercase font-sans">RESCUE BOATS</span>
              </div>
              <div className="space-y-1 border-r-0 sm:border-r border-slate-200/80 pr-0 sm:pr-6">
                <span className="text-3xl sm:text-4xl font-black text-[#111111] block">3</span>
                <span className="text-xs text-[#6E6E73] font-bold block uppercase font-sans">HELICOPTERS</span>
              </div>
              <div className="space-y-1 border-r-0 sm:border-r border-slate-200/80 pr-0 sm:pr-6">
                <span className="text-3xl sm:text-4xl font-black text-[#111111] block">7</span>
                <span className="text-xs text-[#6E6E73] font-bold block uppercase font-sans">AMBULANCES</span>
              </div>
              <div className="space-y-1">
                <span className="text-3xl sm:text-4xl font-black text-[#111111] block">5</span>
                <span className="text-xs text-[#6E6E73] font-bold block uppercase font-sans">WATER PUMPS</span>
              </div>
            </div>

            <div className="text-xs text-[#6E6E73] font-mono font-medium">
              5 Shelters · 5 Relief Teams · 6 NGOs · 500+ Volunteers
            </div>
          </div>
        </section>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* SECTION 06 — FINAL CTA */}
        {/* ───────────────────────────────────────────────────────────── */}
        <section className="w-full py-28 lg:py-36 text-center space-y-8 font-sans flex flex-col items-center">
          <div className="max-w-2xl mx-auto space-y-4 text-center flex flex-col items-center">
            <span className="text-xs font-mono font-bold text-[#2563EB] uppercase tracking-widest px-3.5 py-1 rounded-full liquid-glass-chip">
              LIVE SIMULATION
            </span>
            <h2 className="text-4xl sm:text-6xl font-black text-[#111111] tracking-tight text-center">
              SEE AEGIS <br />
              MAKE THE DECISION.
            </h2>
            <p className="text-xs sm:text-sm text-[#6E6E73] leading-relaxed max-w-md mx-auto font-normal text-center">
              Run the same disaster twice. Compare what changes when autonomous intelligence takes control.
            </p>
          </div>

          <div className="pt-2 flex justify-center">
            <button
              onClick={handleStartSystem}
              disabled={isInitializing}
              className="liquid-glass-button text-white px-10 py-4.5 rounded-full font-bold text-sm cursor-pointer inline-flex items-center gap-2.5"
            >
              {isInitializing ? (
                <>
                  <RefreshCw size={16} className="animate-spin text-white" />
                  <span>Initializing Engine...</span>
                </>
              ) : (
                <>
                  <span>Launch Simulation →</span>
                </>
              )}
            </button>
          </div>

          <div className="pt-6 text-[11px] font-mono text-slate-400 text-center uppercase tracking-wider">
            SAME CITY. SAME DISASTER. DIFFERENT OUTCOME.
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 bg-white py-10">
        <div className="max-w-[1200px] w-full mx-auto px-6 sm:px-12 flex flex-col sm:flex-row items-center justify-between text-xs text-[#6E6E73] font-mono gap-4 text-center">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-[#2563EB]" />
            <span className="font-bold text-[#111111]">AEGIS FLOOD</span>
          </div>
          <span>© AEGIS FLOOD // AUTONOMOUS EMERGENCY INTELLIGENCE</span>
        </div>
      </footer>

      {/* Initialization Overlay */}
      {isInitializing && (
        <div className="fixed inset-0 z-[200] bg-[#050B16] flex flex-col items-center justify-center font-mono text-white space-y-4 animate-fadeIn">
          <div className="p-4 rounded-full bg-[#2563EB]/20 border border-[#2563EB] text-[#2563EB] animate-spin">
            <RefreshCw size={36} />
          </div>
          <div className="text-center space-y-1">
            <h2 className="text-lg font-black tracking-wider uppercase text-white">
              INITIALIZING SIMULATION ENGINE...
            </h2>
            <p className="text-xs text-slate-400">
              CONNECTING GEOSPATIAL MAP & OODA ORCHESTRATOR
            </p>
          </div>
        </div>
      )}

      {/* Drawer */}
      <TechnicalDetailsDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />

    </div>
  )
}
