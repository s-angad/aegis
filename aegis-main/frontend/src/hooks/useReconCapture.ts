'use client'
import { useEffect, useRef, useCallback } from 'react'
import { API_URL } from '@/lib/constants'
import { useReconStore } from '@/stores/reconStore'
import { useSimulationStore } from '@/stores/simulationStore'

export function useReconCapture(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const { config, setLatestObservation, setCapturing } = useReconStore()
  const { simulation } = useSimulationStore()
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isAnalyzingRef = useRef(false)

  const captureAndAnalyze = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas || isAnalyzingRef.current) return

    try {
      isAnalyzingRef.current = true
      setCapturing(true)

      // Resize & compress canvas for high performance aerial frame transmission (640px wide target)
      const offscreen = document.createElement('canvas')
      const targetW = 640
      const scale = targetW / canvas.width
      const targetH = Math.round(canvas.height * scale)
      offscreen.width = targetW
      offscreen.height = targetH

      const ctx = offscreen.getContext('2d')
      if (ctx) {
        ctx.drawImage(canvas, 0, 0, targetW, targetH)
      }

      // Convert to compressed Base64 JPEG data URL
      const dataUrl = offscreen.toDataURL('image/jpeg', 0.8)

      // POST to backend CV Recon Service
      const res = await fetch(`${API_URL}/api/recon/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: dataUrl,
          simulation_tick: simulation.tick,
          disaster_type: simulation.disaster_type || 'flood',
        }),
      })

      if (res.ok) {
        const json = await res.json()
        if (json.observation) {
          setLatestObservation(json.observation)
        }
      }
    } catch (e) {
      console.warn('[RECON CAPTURE WARNING] Frame upload error:', e)
    } finally {
      isAnalyzingRef.current = false
      setCapturing(false)
    }
  }, [canvasRef, simulation.tick, simulation.disaster_type, setLatestObservation, setCapturing])

  // Setup interval loop when simulation is running
  useEffect(() => {
    if (!config.enabled || !simulation.is_running || simulation.is_paused) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }

    const intervalMs = Math.max(800, config.recon_interval_seconds * 1000)
    
    // Immediate first capture
    captureAndAnalyze()

    intervalRef.current = setInterval(() => {
      captureAndAnalyze()
    }, intervalMs)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [config.enabled, config.recon_interval_seconds, simulation.is_running, simulation.is_paused, captureAndAnalyze])

  return { captureAndAnalyze }
}
