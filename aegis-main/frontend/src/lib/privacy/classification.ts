// AEGIS FLOOD — Context-Aware Privacy Classification System (Challenge #64)

export type ClassificationTier = 'PUBLIC' | 'OPERATIONAL' | 'SENSITIVE' | 'RESTRICTED'

export type Role = 'FIELD_RESPONDER' | 'SECTOR_COMMANDER' | 'SYSTEM_ADMIN'

export type Context = 'IDLE' | 'MONITORING' | 'ACTIVE_RESPONSE' | 'POST_INCIDENT'

export type Intent = 'Browsing' | 'Field Coordination' | 'Compliance Review'

export const CLASSIFICATION_DESCRIPTIONS: Record<ClassificationTier, string> = {
  PUBLIC: 'Aggregate risk level, general area names, evacuation guidance, high-level stats.',
  OPERATIONAL: 'Sector-level severity scores, resource type counts, OODA stage status.',
  SENSITIVE: 'Exact resource GPS/staging locations, sector-specific citizen exposure numbers.',
  RESTRICTED: 'Citizen-identifying data, exact street addresses, individual beacon/tracking data.'
}

export const ROLE_LABELS: Record<Role, string> = {
  FIELD_RESPONDER: 'Field Responder',
  SECTOR_COMMANDER: 'Sector Commander',
  SYSTEM_ADMIN: 'System Admin'
}
