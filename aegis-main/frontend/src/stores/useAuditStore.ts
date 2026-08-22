'use client'

import { create } from 'zustand'
import { Role } from '@/stores/useProfileStore'
import { Intent, Context } from '@/lib/privacy/policy'

export interface AuditLogEntry {
  id: string
  timestamp: string
  role: Role
  name: string
  intent: Intent
  context: Context
  field: string
}

interface AuditStore {
  currentIntent: Intent
  auditLogs: AuditLogEntry[]
  setIntent: (intent: Intent) => void
  logRestrictedAccess: (log: Omit<AuditLogEntry, 'id' | 'timestamp'>) => void
  clearAuditLogs: () => void
}

export const useAuditStore = create<AuditStore>((set, get) => ({
  currentIntent: 'BROWSING',
  auditLogs: [],

  setIntent: (intent) => set({ currentIntent: intent }),

  logRestrictedAccess: (logData) => {
    const entry: AuditLogEntry = {
      ...logData,
      id: `audit-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date().toLocaleTimeString()
    }

    set((state) => {
      // Prevent rapid duplicate logging for the same field
      const last = state.auditLogs[0]
      if (
        last &&
        last.field === entry.field &&
        last.name === entry.name &&
        last.intent === entry.intent &&
        last.context === entry.context
      ) {
        return state
      }

      return {
        auditLogs: [entry, ...state.auditLogs].slice(0, 100)
      }
    })
  },

  clearAuditLogs: () => set({ auditLogs: [] })
}))
