'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { ShieldAlert } from 'lucide-react'
import { Role } from '@/lib/privacy/classification'
import { useProfileStore } from '@/stores/profileStore'

interface RouteGuardProps {
  requiredRole?: Role
  children: React.ReactNode
}

export const RouteGuard: React.FC<RouteGuardProps> = ({ requiredRole, children }) => {
  const router = useRouter()
  const pathname = usePathname()
  const { currentProfile } = useProfileStore()
  const [deniedMessage, setDeniedMessage] = useState<string | null>(null)

  useEffect(() => {
    // Check if Field Responder attempts to access Admin or Commander routes directly
    if (currentProfile.role === 'FIELD_RESPONDER' && (pathname === '/dashboard/admin' || pathname === '/dashboard/commander')) {
      setDeniedMessage(`Access Denied: Field Responders cannot access ${pathname}. Redirecting to Field Dashboard...`)
      const timer = setTimeout(() => {
        router.push('/dashboard/responder')
      }, 1500)
      return () => clearTimeout(timer)
    }

    // Check if Commander attempts to access Admin route directly
    if (currentProfile.role === 'SECTOR_COMMANDER' && pathname === '/dashboard/admin') {
      setDeniedMessage(`Access Denied: Sector Commanders cannot access Admin Dashboard. Redirecting to Commander Dashboard...`)
      const timer = setTimeout(() => {
        router.push('/dashboard/commander')
      }, 1500)
      return () => clearTimeout(timer)
    }

    setDeniedMessage(null)
  }, [currentProfile.role, pathname, router])

  if (deniedMessage) {
    return (
      <div className="min-h-screen bg-[#F7F7F5] flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="max-w-md p-6 rounded-2xl bg-amber-50 border border-amber-300 shadow-xl space-y-3 font-mono">
          <ShieldAlert size={36} className="mx-auto text-amber-600 animate-bounce" />
          <h2 className="text-sm font-bold text-amber-900 uppercase">POLICY ROUTE GUARD</h2>
          <p className="text-xs text-amber-800 leading-relaxed font-sans">{deniedMessage}</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
