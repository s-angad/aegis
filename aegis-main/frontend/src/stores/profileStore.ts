'use client'

import { create } from 'zustand'
import { Role } from '@/lib/privacy/classification'
import { usePrivacyStore } from './privacyStore'

export interface UserProfile {
  id: string
  name: string
  role: Role
  title: string
  assignedSector?: string
  reportsTo?: string
  unitId?: string
  avatar: string
  badgeColor: string
}

export const PRESET_PROFILES: UserProfile[] = [
  {
    id: 'admin-1',
    name: 'Maria Chen',
    role: 'SYSTEM_ADMIN',
    title: 'Operations Director',
    avatar: '👑',
    badgeColor: 'bg-purple-100 text-purple-700 border-purple-300'
  },
  {
    id: 'commander-s04',
    name: 'Capt. David Vance',
    role: 'SECTOR_COMMANDER',
    title: 'Sector 04 Commander',
    assignedSector: 'Sector 04',
    avatar: '🛡️',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300'
  },
  {
    id: 'responder-unit12',
    name: 'Officer Sarah Jenkins',
    role: 'FIELD_RESPONDER',
    title: 'Unit 12 Field Lead',
    assignedSector: 'Sector 04',
    reportsTo: 'Capt. David Vance',
    unitId: 'UNIT-12',
    avatar: '🚤',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300'
  },
  {
    id: 'responder-unit05',
    name: 'Officer Marcus Ruiz',
    role: 'FIELD_RESPONDER',
    title: 'Unit 05 Air Rescue',
    assignedSector: 'Sector 04',
    reportsTo: 'Capt. David Vance',
    unitId: 'UNIT-05',
    avatar: '🚁',
    badgeColor: 'bg-teal-100 text-teal-800 border-teal-300'
  }
]

interface ProfileStore {
  currentProfile: UserProfile
  isProfileModalOpen: boolean
  setProfile: (profileId: string) => void
  setProfileModalOpen: (open: boolean) => void
}

export const useProfileStore = create<ProfileStore>((set, get) => ({
  currentProfile: PRESET_PROFILES[2], // Default: Officer Sarah Jenkins (FIELD_RESPONDER)
  isProfileModalOpen: false,

  setProfile: (profileId: string) => {
    const found = PRESET_PROFILES.find((p) => p.id === profileId)
    if (found) {
      set({ currentProfile: found })
      // Synchronize role in Privacy Store!
      usePrivacyStore.getState().setRole(found.role)
    }
  },

  setProfileModalOpen: (open: boolean) => set({ isProfileModalOpen: open })
}))
