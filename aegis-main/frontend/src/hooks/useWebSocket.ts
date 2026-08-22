'use client'
import { useEffect, useRef, useCallback, useState } from 'react'
import { WS_URL } from '@/lib/constants'
import { useSimulationStore } from '@/stores/simulationStore'
import { useIncidentStore } from '@/stores/incidentStore'
import { useResourceStore } from '@/stores/resourceStore'
import { useAgentStore } from '@/stores/agentStore'
import { useReconStore } from '@/stores/reconStore'
import type { WSMessage, Incident, Resource, Shelter, AgentDecision, Alert, Prediction, ReconObservation, ReconConfig } from '@/lib/types'

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconnectDelayRef = useRef(1000)
  const [status, setStatus] = useState<ConnectionStatus>('disconnected')

  const { setSimulation, setFloodState, setFloodGeoJSON, addTimelineEntry, setNarrative } = useSimulationStore()
  const { setIncidents } = useIncidentStore()
  const { setResources, setShelters } = useResourceStore()
  const { addDecision, addAlert, setPrediction, setRoutes, clearAll, setDroneTelemetry, setPolicyRecommendations, setOodaState, setOodaStageResult, addOodaHistory } = useAgentStore()
  const { setLatestObservation, setConfig, clearRecon } = useReconStore()

  const handleMessage = useCallback((msg: WSMessage) => {
    const { type, data } = msg
    switch (type) {
      case 'initial_state': {
        const d = data as { shelters: Shelter[]; resources: Resource[]; latest_recon?: ReconObservation; city_geojson?: any; simulation?: any }
        setShelters(d.shelters)
        setResources(d.resources)
        if (d.latest_recon) setLatestObservation(d.latest_recon)
        if (d.city_geojson) setFloodGeoJSON(d.city_geojson)
        if (d.simulation) setSimulation(d.simulation)
        break
      }
      case 'simulation_status': {
        const d = data as {
          tick: number; total_ticks: number; status: string
          speed: number; rain_rate?: number; description?: string; narrative?: string; disaster_type?: string; scenario?: any
        }
        setSimulation({
          tick: d.tick,
          total_ticks: d.total_ticks,
          is_running: d.status === 'running',
          is_paused: d.status === 'paused',
          speed: d.speed,
          status: d.status as 'running' | 'paused' | 'completed',
          description: d.description,
          narrative: d.narrative,
          rain_rate: d.rain_rate,
          disaster_type: d.disaster_type,
          scenario: d.scenario,
        })
        if (d.narrative) setNarrative(d.narrative)
        if (d.tick !== undefined) {
          addTimelineEntry({
            tick: d.tick,
            description: d.description || '',
            rain_rate: d.rain_rate || 0,
            narrative: d.narrative || '',
          })
        }
        break
      }
      case 'simulation_control': {
        const d = data as { action: string; tick?: number; speed?: number; disaster_type?: string; scenario?: any }
        if (d.action === 'reset') {
          setSimulation({ tick: 0, status: 'idle', is_running: false, is_paused: false, disaster_type: d.disaster_type, scenario: d.scenario })
          clearAll()
          clearRecon()
          setIncidents([])
        }
        if (d.action === 'started') setSimulation({ is_running: true, is_paused: false, status: 'running', disaster_type: d.disaster_type, scenario: d.scenario })
        if (d.action === 'paused' || d.action === 'paused_for_aegis') setSimulation({ is_paused: true, status: 'paused' })
        if (d.action === 'resumed' || d.action === 'resumed_after_aegis') setSimulation({ is_paused: false, is_running: true, status: 'running' })
        if (d.action === 'speed_change' && d.speed) setSimulation({ speed: d.speed })
        break
      }
      case 'flood_update': {
        const d = data as { tick?: number; flood_geojson: GeoJSON.FeatureCollection; flood_state: any; scenario?: any }
        setFloodGeoJSON(d.flood_geojson)
        setFloodState(d.flood_state)
        setSimulation({
          ...(d.tick !== undefined ? { tick: d.tick } : {}),
          is_running: true,
          status: 'running',
          ...(d.scenario ? { scenario: d.scenario } : {}),
        })
        break
      }
      case 'incidents_update': {
        const d = data as { incidents: Incident[] }
        setIncidents(d.incidents)
        break
      }
      case 'resource_update': {
        const d = data as { resources: Resource[] }
        setResources(d.resources)
        break
      }
      case 'shelter_update': {
        const d = data as { shelters: Shelter[] }
        setShelters(d.shelters)
        break
      }
      case 'agent_decision': {
        addDecision(data as AgentDecision)
        break
      }
      case 'alert': {
        addAlert(data as Alert)
        break
      }
      case 'prediction_update': {
        const d = data as { prediction: Prediction }
        setPrediction(d.prediction)
        break
      }
      case 'routes_update': {
        const d = data as { routes: Record<string, number[][]> }
        setRoutes(d.routes)
        break
      }
      case 'drone_telemetry': {
        setDroneTelemetry(data)
        break
      }
      case 'policy_recommendations': {
        const d = data as { recommendations: string[] }
        setPolicyRecommendations(d.recommendations)
        break
      }
      case 'recon_observation': {
        setLatestObservation(data as ReconObservation)
        break
      }
      case 'recon_config': {
        setConfig(data as Partial<ReconConfig>)
        break
      }
      case 'ooda_cycle_started': {
        const d = data as { cycle: number; stage: string }
        setOodaState(d.cycle, d.stage || 'OBSERVE')
        break
      }
      case 'ooda_stage_started': {
        const d = data as { cycle: number; stage: string }
        setOodaState(d.cycle, d.stage)
        break
      }
      case 'ooda_stage_completed': {
        const d = data as { cycle: number; stage: string; result: any }
        setOodaStageResult(d.stage, d.result)
        break
      }
      case 'ooda_cycle_completed': {
        const d = data as { cycle: number; summary: any }
        addOodaHistory(d.summary)
        setOodaState(d.cycle, 'COMPLETED')
        break
      }
    }
  }, [setSimulation, setFloodState, setFloodGeoJSON, addTimelineEntry, setNarrative,
      setIncidents, setResources, setShelters, addDecision, addAlert, setPrediction, setRoutes,
      clearAll, setDroneTelemetry, setPolicyRecommendations, setLatestObservation, setConfig, clearRecon,
      setOodaState, setOodaStageResult, addOodaHistory])

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return
    setStatus('connecting')
    const ws = new WebSocket(WS_URL)
    wsRef.current = ws

    ws.onopen = () => {
      setStatus('connected')
      reconnectDelayRef.current = 1000
    }

    ws.onmessage = (e) => {
      try {
        const msg: WSMessage = JSON.parse(e.data)
        handleMessage(msg)
      } catch {}
    }

    ws.onclose = () => {
      setStatus('disconnected')
      reconnectTimerRef.current = setTimeout(() => {
        reconnectDelayRef.current = Math.min(reconnectDelayRef.current * 1.5, 10000)
        connect()
      }, reconnectDelayRef.current)
    }

    ws.onerror = () => {
      setStatus('error')
      ws.close()
    }
  }, [handleMessage])

  useEffect(() => {
    connect()
    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
      wsRef.current?.close()
    }
  }, [connect])

  const sendMessage = useCallback((type: string, data?: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, data }))
    }
  }, [])

  return { status, isConnected: status === 'connected', sendMessage }
}
