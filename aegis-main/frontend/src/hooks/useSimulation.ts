'use client'
import { useCallback } from 'react'
import { API_URL } from '@/lib/constants'
import { useSimulationStore } from '@/stores/simulationStore'

export function useSimulation() {
  const { setSimulation } = useSimulationStore()

  const post = useCallback(async (endpoint: string, body?: object) => {
    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      })
      if (!res.ok) {
        console.warn(`[useSimulation] POST ${endpoint} returned ${res.status}`)
        return { status: 'error', code: res.status }
      }
      return await res.json()
    } catch (err) {
      console.error(`[useSimulation] Network error connecting to ${API_URL}${endpoint}:`, err)
      return { status: 'error', message: 'Failed to connect to backend server' }
    }
  }, [])

  return {
    createRun: (disasterType: string = 'flood', seed?: number) => {
      useSimulationStore.getState().resetSimulationStore()
      return post(`/api/simulation/create_run?run_type=aegis${seed ? `&seed=${seed}` : ''}`)
    },
    start: (disasterType: string = 'flood', seed?: number, runType: string = 'baseline') => {
      return post(`/api/simulation/start?disaster_type=${disasterType}${seed ? `&seed=${seed}` : ''}&run_type=${runType}`)
    },
    pause: () => {
      setSimulation({ is_paused: true, is_running: true, status: 'paused' })
      return post('/api/simulation/pause')
    },
    resume: () => {
      setSimulation({ is_paused: false, is_running: true, status: 'running' })
      return post('/api/simulation/resume')
    },
    reset: (disasterType: string = 'flood', seed?: number) => {
      useSimulationStore.getState().resetSimulationStore()
      return post(`/api/simulation/reset?disaster_type=${disasterType}${seed ? `&seed=${seed}` : ''}`)
    },
    setSpeed: (speed: number) => {
      setSimulation({ speed })
      return post(`/api/simulation/speed?speed=${speed}`)
    },
  }
}
