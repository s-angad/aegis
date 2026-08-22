// AEGIS AI — Constants & Configuration

export const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://127.0.0.1:8000/ws'
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'
export const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

export const CITY_CENTER: [number, number] = [77.2090, 28.6139]  // [lng, lat]
export const CITY_ZOOM = 13.5
export const CITY_PITCH = 45

export const SEVERITY_COLORS: Record<string, string> = {
  LOW: '#22c55e',
  MEDIUM: '#eab308',
  HIGH: '#f97316',
  CRITICAL: '#ef4444',
}

export const SEVERITY_BG: Record<string, string> = {
  LOW: 'rgba(34,197,94,0.15)',
  MEDIUM: 'rgba(234,179,8,0.15)',
  HIGH: 'rgba(249,115,22,0.15)',
  CRITICAL: 'rgba(239,68,68,0.15)',
}

export const AGENT_COLORS: Record<string, string> = {
  Sentinel: '#8b5cf6',
  Verifier: '#06b6d4',
  Severity: '#f59e0b',
  Predictor: '#ec4899',
  Allocator: '#10b981',
  Router: '#6366f1',
  Communicator: '#f43f5e',
  Orchestrator: '#a855f7',
  DroneRecon: '#14b8a6',
  PolicyCommander: '#e11d48',
}

export const RESOURCE_ICONS: Record<string, string> = {
  rescue_boat: '🚤',
  ambulance: '🚑',
  rescue_team: '👥',
  helicopter: '🚁',
}

export const RESOURCE_COLORS: Record<string, string> = {
  rescue_boat: '#0ea5e9',
  ambulance: '#ef4444',
  rescue_team: '#10b981',
  helicopter: '#f59e0b',
}

export const STATUS_COLORS: Record<string, string> = {
  available: '#22c55e',
  dispatched: '#3b82f6',
  en_route: '#06b6d4',
  on_scene: '#f97316',
  returning: '#6b7280',
  unavailable: '#374151',
}

export const THREAT_LEVELS = [
  { label: 'NORMAL', color: '#22c55e', bg: 'rgba(34,197,94,0.2)' },
  { label: 'ELEVATED', color: '#eab308', bg: 'rgba(234,179,8,0.2)' },
  { label: 'HIGH', color: '#f97316', bg: 'rgba(249,115,22,0.2)' },
  { label: 'SEVERE', color: '#ef4444', bg: 'rgba(239,68,68,0.2)' },
  { label: 'CRITICAL', color: '#dc2626', bg: 'rgba(220,38,38,0.3)' },
]
