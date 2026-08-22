'use client'
import { useState } from 'react'
import dynamic from 'next/dynamic'
import StoryHeader from '@/components/story/StoryHeader'
import TechnicalDetailsDrawer from '@/components/drawers/TechnicalDetailsDrawer'
import SpeedController from '@/components/simulation/SpeedController'
import AegisPipelineController from '@/components/demo/AegisPipelineController'
import { AegisDecisionModalOverlay } from '@/components/demo/AegisDecisionModalOverlay'
import { useWebSocket } from '@/hooks/useWebSocket'

const CityMap = dynamic(() => import('@/components/map/CityMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#070B14]">
      <div className="text-center font-sans">
        <div className="text-5xl mb-3">🌊</div>
        <p className="text-cyan-400 text-sm font-bold tracking-wider">BOOTING MINIATURE DIGITAL TWIN CITY...</p>
      </div>
    </div>
  ),
})

export default function SimulationStagePage() {
  const { status } = useWebSocket()
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <div className="h-screen flex flex-col bg-[#070B14] text-white font-sans select-none overflow-hidden relative">
      {/* 1. HEADER */}
      <StoryHeader onOpenSystemDetails={() => setDrawerOpen(true)} />

      {/* 2. HERO DIGITAL TWIN CITY MAP */}
      <div className="flex-1 relative min-w-0 p-4 flex flex-col gap-4">
        <div className="flex-1 relative rounded-3xl overflow-hidden border border-slate-800/80 shadow-2xl bg-[#070B14]">
          {/* CITY MAP CANVAS */}
          <CityMap className="absolute inset-0 w-full h-full" />
        </div>

        {/* 3. SPEED CONTROLLER */}
        <div className="flex items-center justify-between px-2">
          <SpeedController />
        </div>
      </div>

      {/* 4. EXPLICIT AEGIS OODA RESPONSE PIPELINE CONTROLLER */}
      <AegisPipelineController />

      {/* 5. LIVE 5-STEP DECISION POPUP EXPERIENCE OVERLAY */}
      <AegisDecisionModalOverlay />

      {/* 6. SYSTEM DETAILS DRAWER MODAL */}
      <TechnicalDetailsDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  )
}
