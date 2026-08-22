'use client'

import { useState } from 'react'
import AegisLandingPage from '@/components/landing/AegisLandingPage'
import SimulationStagePage from './simulation/page'

export default function Home() {
  const [systemInitialized, setSystemInitialized] = useState(false)

  if (!systemInitialized) {
    return <AegisLandingPage onInitialize={() => setSystemInitialized(true)} />
  }

  return <SimulationStagePage />
}
