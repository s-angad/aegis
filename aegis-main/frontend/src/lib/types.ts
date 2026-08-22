// AEGIS FLOOD — Full TypeScript Type Definitions

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type IncidentType = 'flood' | 'structural_damage' | 'medical_emergency' | 'evacuation_needed' | 'road_blocked' | 'wildfire' | 'hazardous_smoke' | 'cyclone_wind' | 'infrastructure_failure'
export type ResourceType = 'rescue_boat' | 'ambulance' | 'rescue_team' | 'helicopter' | 'fire_engine' | 'hazmat_unit' | 'utility_truck'
export type ResourceStatus = 'available' | 'dispatched' | 'en_route' | 'on_scene' | 'returning' | 'unavailable'
export type ShelterStatus = 'standby' | 'active' | 'full' | 'closed'
export type SimulationStatus = 'idle' | 'running' | 'paused' | 'completed'
export type AgentName = 'Sentinel' | 'Verifier' | 'Severity' | 'Predictor' | 'Allocator' | 'Router' | 'Communicator' | 'Orchestrator' | 'DroneRecon' | 'PolicyCommander'

export interface Incident {
  id: string
  type: IncidentType
  sector: string
  lat: number
  lng: number
  severity: Severity
  confidence: number
  source: string
  description: string
  timestamp: string
  verified: boolean
  assigned_resources: string[]
  reporter_name?: string
  water_level: number
  population_affected: number
  is_active: boolean
}

export interface Resource {
  id: string
  type: ResourceType
  name: string
  status: ResourceStatus
  lat: number
  lng: number
  home_lat: number
  home_lng: number
  assigned_incident?: string
  route: number[][]
  route_progress: number
  crew_count: number
  capacity: number
}

export interface Shelter {
  id: string
  name: string
  lat: number
  lng: number
  sector: string
  capacity: number
  current_occupancy: number
  status: ShelterStatus
  address: string
}

export interface Prediction {
  id: string
  affected_sectors: string[]
  impact_radius_km: number
  spread_direction: string
  risk_heatmap: Record<string, number>
  time_to_impact_minutes: number
  description: string
  peak_flood_level: number
  population_at_risk: number
  confidence_pct: number
  next_3_ticks: Array<{
    tick_offset: number
    risk_by_sector: Record<string, number>
    minutes_from_now: number
  }>
}

export interface AgentDecision {
  id: string
  agent_name: AgentName
  action: string
  description: string
  reasoning: string
  sop_reference?: string
  timestamp: string
  related_incident_id?: string
  severity: 'info' | 'warning' | 'critical'
}

export interface Alert {
  id: string
  type: 'PUBLIC_ALERT' | 'EVACUATION_ORDER' | 'SITUATION_REPORT' | 'EXECUTIVE_SUMMARY' | 'CRITICAL_EVENT' | 'SENSOR_ALERT'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'INFO'
  title: string
  message: string
  affected_sectors: string[]
  timestamp: string
  channel: string
}

export interface ReconObservation {
  observation_id: string
  timestamp: string
  frame_number: number
  flood_area_percent: number
  estimated_water_level: number
  estimated_velocity: number
  expansion_rate: number
  affected_cells: Array<{ row: number; col: number; sector: string }>
  blocked_roads: string[]
  affected_buildings: number
  affected_population: number
  critical_infrastructure: string[]
  confidence: number
  anomaly_detected: boolean
  anomaly_description?: string
  image_data_url?: string
  ground_truth_delta?: {
    depth_error_m: number
    cell_count_error: number
  }
}

export interface ReconConfig {
  recon_interval_seconds: number
  enabled: boolean
  confidence_threshold: number
  model_width_meters: number
  model_height_meters: number
}

export interface ScenarioInfo {
  seed: number
  seed_str: string
  scenario_type: string
  description: string
  river_baseline: number
  rainfall_peak: number
  primary_threat_sectors: string[]
}

export interface SimulationState {
  tick: number
  total_ticks: number
  is_running: boolean
  is_paused: boolean
  speed: number
  status: SimulationStatus
  description?: string
  narrative?: string
  rain_rate?: number
  disaster_type?: string
  scenario?: ScenarioInfo
}

export interface FloodState {
  total_flooded_cells: number
  total_flooded_sectors: string[]
  affected_population: number
  blocked_roads: number
  river_level: number
  max_flood_level: number
  bridge_status: Record<string, 'intact' | 'stressed' | 'failed'>
  projected_lives_at_risk?: number
  lives_saved?: number
  risk_reduction_pct?: number
}

export interface WSMessage {
  type: string
  data: unknown
  ts?: number
}
