'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type Role = 'SYSTEM_ADMIN' | 'SECTOR_COMMANDER' | 'FIELD_RESPONDER'

export interface Profile {
  role: Role
  name: string
  sector?: string       // only relevant for COMMANDER / RESPONDER
  reportsTo?: string    // only relevant for RESPONDER
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
      setProfile: (profile: Profile) => set({ currentProfile: profile }),
      clearProfile: () => set({ currentProfile: null })
    }),
    {
      name: 'aegis-current-profile',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? sessionStorage : ({} as Storage)))
    }
  )
)
