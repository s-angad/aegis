'use client'

import { Role } from '@/stores/useProfileStore'

export type Tier = 'PUBLIC' | 'OPERATIONAL' | 'SENSITIVE' | 'RESTRICTED'
export type Context = 'IDLE' | 'MONITORING' | 'ACTIVE_RESPONSE' | 'POST_INCIDENT'
export type Intent = 'BROWSING' | 'FIELD_COORDINATION' | 'COMPLIANCE_REVIEW'

export function canView(tier: Tier, role: Role, context: Context, intent: Intent): boolean {
  if (role === 'SYSTEM_ADMIN') return true
  if (tier === 'PUBLIC' || tier === 'OPERATIONAL') return true
  if (tier === 'SENSITIVE') {
    if (role === 'SECTOR_COMMANDER') return true
    if (role === 'FIELD_RESPONDER') {
      return context === 'ACTIVE_RESPONSE' && intent === 'FIELD_COORDINATION'
    }
  }
  if (tier === 'RESTRICTED') {
    if (role === 'SECTOR_COMMANDER') {
      return (
        (context === 'POST_INCIDENT' && intent === 'COMPLIANCE_REVIEW') ||
        (context === 'ACTIVE_RESPONSE' && intent === 'FIELD_COORDINATION')
      )
    }
    return false // FIELD_RESPONDER never sees RESTRICTED
  }
  return false
}

export function getPrivacyGateReason(tier: Tier, role: Role, context: Context, intent: Intent): string {
  if (tier === 'SENSITIVE') {
    if (role === 'FIELD_RESPONDER') {
      if (context !== 'ACTIVE_RESPONSE') {
        return `Sensitive field data requires ACTIVE_RESPONSE context for Field Responders (current context: ${context}).`
      }
      if (intent !== 'FIELD_COORDINATION') {
        return `Field Responders must declare FIELD_COORDINATION intent during active response (current intent: ${intent}).`
      }
    }
  }

  if (tier === 'RESTRICTED') {
    if (role === 'FIELD_RESPONDER') {
      return `Restricted citizen data is strictly hidden from Field Responders.`
    }
    if (role === 'SECTOR_COMMANDER') {
      return `Restricted data requires COMPLIANCE_REVIEW intent during POST_INCIDENT or FIELD_COORDINATION during ACTIVE_RESPONSE (current intent: ${intent}, context: ${context}).`
    }
  }

  return 'Access restricted by AEGIS Privacy Policy Engine.'
}
