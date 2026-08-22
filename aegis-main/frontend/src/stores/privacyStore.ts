'use client'

import { create } from 'zustand'
import { Role, Intent, Context, ClassificationTier } from '@/lib/privacy/classification'

export interface AuditLogEntry {
  id: string
  timestamp: string
  role: Role
  intent: Intent
  context: Context
  field: string
  classification: ClassificationTier
  granted: boolean
  reason: string
}

interface PrivacyStore {
  currentRole: Role
  currentIntent: Intent
  auditLogs: AuditLogEntry[]
  
  setRole: (role: Role) => void
  setIntent: (intent: Intent) => void
  logAccess: (log: Omit<AuditLogEntry, 'id' | 'timestamp'>) => void
  clearAuditLogs: () => void
}

export const usePrivacyStore = create<PrivacyStore>((set, get) => ({
  currentRole: 'FIELD_RESPONDER', // Default role on load as mandated by challenge specs
  currentIntent: 'Browsing',     // Default intent on load
  auditLogs: [
    {
      id: 'init-001',
      timestamp: new Date().toLocaleTimeString(),
      role: 'FIELD_RESPONDER',
      intent: 'Browsing',
      context: 'IDLE',
      field: 'System Privacy Control Initialized',
      classification: 'PUBLIC',
      granted: true,
      reason: 'AEGIS Privacy Engine Active (Default: FIELD_RESPONDER / Browsing).'
    }
  ],

  setRole: (role) => {
    const prevRole = get().currentRole
    set({ currentRole: role })
    
    // Log role switch event
    get().logAccess({
      role,
      intent: get().currentIntent,
      context: 'IDLE',
      field: `Switched Role: ${prevRole} → ${role}`,
      classification: 'PUBLIC',
      granted: true,
      reason: `User role set to ${role}`
    })
  },

  setIntent: (intent) => {
    const prevIntent = get().currentIntent
    set({ currentIntent: intent })
    
    // Log intent switch event
    get().logAccess({
      role: get().currentRole,
      intent,
      context: 'IDLE',
      field: `Declared Intent: ${prevIntent} → ${intent}`,
      classification: 'PUBLIC',
      granted: true,
      reason: `Declared purpose updated to '${intent}'`
    })
  },

  logAccess: (logData) => {
    const entry: AuditLogEntry = {
      ...logData,
      id: `audit-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date().toLocaleTimeString()
    }

    set((state) => {
      // Prevent spamming identical logs sequentially
      const last = state.auditLogs[0]
      if (
        last &&
        last.field === entry.field &&
        last.role === entry.role &&
        last.intent === entry.intent &&
        last.granted === entry.granted
      ) {
        return state
      }

      return {
        auditLogs: [entry, ...state.auditLogs].slice(0, 100) // Keep last 100 entries
      }
    })
  },

  clearAuditLogs: () => set({ auditLogs: [] })
}))
