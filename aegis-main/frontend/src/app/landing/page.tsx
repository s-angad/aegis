'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AegisLandingPage from '@/components/landing/AegisLandingPage'
import { useProfileStore, getDashboardPathForRole } from '@/stores/useProfileStore'

export default function LandingShowcasePage() {
  const router = useRouter()
  const currentProfile = useProfileStore((state) => state.currentProfile)

  const handleInitialize = () => {
    if (currentProfile) {
      router.push(getDashboardPathForRole(currentProfile.role))
    } else {
      router.push('/select-profile')
    }
  }

  return <AegisLandingPage onInitialize={handleInitialize} />
}
