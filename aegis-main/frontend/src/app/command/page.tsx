'use client'
import { useState } from 'react'
import dynamic from 'next/dynamic'
import StoryHeader from '@/components/story/StoryHeader'
import HeroSection from '@/components/story/HeroSection'
import HeroAlertCard from '@/components/command/HeroAlertCard'
import CompactPredictionCard from '@/components/command/CompactPredictionCard'
import WhatAegisSeesSection from '@/components/story/WhatAegisSeesSection'
import AiReasoningSection from '@/components/story/AiReasoningSection'
import WhatAegisPredictsSection from '@/components/story/WhatAegisPredictsSection'
import WhatAegisDecidedSection from '@/components/story/WhatAegisDecidedSection'
import WhyAegisDecidedSection from '@/components/story/WhyAegisDecidedSection'
import LiveResponseSection from '@/components/story/LiveResponseSection'
import EmergencyResourcesSection from '@/components/story/EmergencyResourcesSection'
import WhatAegisAchievedSection from '@/components/story/WhatAegisAchievedSection'
import WhyAegisIsAutonomousSection from '@/components/story/WhyAegisIsAutonomousSection'
import TechnicalDetailsDrawer from '@/components/drawers/TechnicalDetailsDrawer'
import { useWebSocket } from '@/hooks/useWebSocket'

const CityMap = dynamic(() => import('@/components/map/CityMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#070B14]">
      <div className="text-center font-sans">
        <div className="text-5xl mb-3">🌊</div>
        <p className="text-cyan-400 text-sm font-bold tracking-wider">LOADING HERO DIGITAL TWIN SIMULATION...</p>
      </div>
    </div>
  ),
})

export default function CommandDeckPage() {
  const { status } = useWebSocket()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerTab, setDrawerTab] = useState<'agents' | 'recon' | 'resources' | 'shelters'>('agents')

  const handleOpenDrawer = (tab: 'agents' | 'recon' | 'resources' | 'shelters' = 'agents') => {
    setDrawerTab(tab)
    setDrawerOpen(true)
  }

  return (
    <div className="min-h-screen bg-[#070B14] text-white font-sans select-none overflow-x-hidden">
      {/* HEADER (Section 3 & 4) */}
      <StoryHeader onOpenSystemDetails={() => handleOpenDrawer('agents')} />

      {/* CENTERED RESPONSIVE APPLICATION CONTAINER (1600px–1800px, 24px–40px padding - Section 2) */}
      <main className="max-w-[1700px] mx-auto px-8 md:px-12 py-10 space-y-20">
        {/* SECTION 1: CURRENT SITUATION HERO & CONTROL BAR (Section 5 & 6) */}
        <HeroSection />

        {/* SECTION 2: HERO CITY SIMULATION MAP (Section 7 & 8 - controlled height ~640px) */}
        <section className="relative rounded-3xl overflow-hidden border border-slate-800/80 bg-[#070B14] shadow-2xl h-[640px]">
          <CityMap className="absolute inset-0 w-full h-full" />

          {/* Floating Overlay Top-Left: Map & Current Flood Extent */}
          <div className="absolute top-6 left-6 z-30">
            <HeroAlertCard />
          </div>

          {/* Floating Overlay Top-Right: Live & Prediction */}
          <div className="absolute top-6 right-6 z-30">
            <CompactPredictionCard onOpenDrawer={() => handleOpenDrawer('agents')} />
          </div>
        </section>

        {/* SECTION 3: WHAT AEGIS SEES (Section 9 - 3 Cards) */}
        <WhatAegisSeesSection />

        {/* SECTION 4: HOW AEGIS THINKS (Section 11 & 12 - 5 Stages) */}
        <AiReasoningSection />

        {/* SECTION 5: WHAT HAPPENS NEXT? (Section 16 - Prediction) */}
        <WhatAegisPredictsSection />

        {/* SECTION 6: WHAT DID AEGIS DECIDE? (Section 7 & 15) */}
        <WhatAegisDecidedSection />

        {/* SECTION 7: WHY DID AEGIS DECIDE THIS? (Section 15) */}
        <WhyAegisDecidedSection />

        {/* SECTION 8: AEGIS AI RESPONSE (Section 13 & 14 - Human Timeline) */}
        <LiveResponseSection />

        {/* SECTION 9: EMERGENCY RESPONSE (Section 17 - Resource & Shelter Cards) */}
        <EmergencyResourcesSection />

        {/* SECTION 10: AEGIS IMPACT (Section 18 - Large Numbers) */}
        <WhatAegisAchievedSection />

        {/* SECTION 11: WHY AEGIS IS AUTONOMOUS (Section 19 - 4 Steps) */}
        <WhyAegisIsAutonomousSection />

        {/* SYSTEM DETAILS BUTTON AT BOTTOM */}
        <div className="py-8 text-center border-t border-slate-800/60">
          <button
            onClick={() => handleOpenDrawer('agents')}
            className="px-8 py-4 rounded-2xl bg-[#0d1424] hover:bg-slate-800 border border-slate-700 text-cyan-400 font-mono font-bold text-sm tracking-wider transition-all shadow-xl cursor-pointer"
          >
            VIEW FULL SYSTEM DETAILS & AGENT LOGS →
          </button>
        </div>
      </main>

      {/* FULL-SCREEN SYSTEM DETAILS ENGINEERING DRAWER (Section 20) */}
      <TechnicalDetailsDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        initialTab={drawerTab}
      />
    </div>
  )
}
