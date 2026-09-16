'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { usePrivacyStore } from './privacyStore'

export type Role = 'SYSTEM_ADMIN' | 'SECTOR_COMMANDER' | 'FIELD_RESPONDER'

export interface Profile {
  role: Role
  name: string
  sector?: string       // only relevant for COMMANDER / RESPONDER
  reportsTo?: string    // only relevant for RESPONDER
}

export function getDashboardPathForRole(role: Role): string {
  if (role === 'SYSTEM_ADMIN') return '/dashboard/admin'
  if (role === 'SECTOR_COMMANDER') return '/dashboard/commander'
  return '/dashboard/responder'
}

interface ProfileStore {
  currentProfile: Profile | null
  setProfile: (profile: Profile) => void
  clearProfile: () => void
}

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set) => ({
      currentProfile: null,
      setProfile: (profile: Profile) => {
        set({ currentProfile: profile })
        // Sync with privacy store role
        if (typeof window !== 'undefined') {
          usePrivacyStore.getState().setRole(profile.role)
        }
      },
      clearProfile: () => set({ currentProfile: null })
    }),
    {
      name: 'aegis-current-profile',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? sessionStorage : ({} as Storage)))
    }
  )
)
