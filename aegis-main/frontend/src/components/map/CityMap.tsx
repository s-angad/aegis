'use client'
import { useEffect, useRef, useCallback } from 'react'
import { useSimulationStore } from '@/stores/simulationStore'
import { useIncidentStore } from '@/stores/incidentStore'
import { useResourceStore } from '@/stores/resourceStore'
import { useAgentStore } from '@/stores/agentStore'
import { useReconCapture } from '@/hooks/useReconCapture'
import { generateProceduralCity, ProceduralCity } from './proceduralCity'

interface CityMapProps {
  className?: string
}

export default function CityMap({ className = '' }: CityMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animFrameRef = useRef<number>(0)
  const cityRef = useRef<ProceduralCity | null>(null)
  const citySizeRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 })

  // Discrete backend target grid & smooth 60 FPS interpolated render grid (Section 15, 16)
  const targetLevelsRef = useRef<number[][]>([])
  const renderLevelsRef = useRef<number[][]>([])

  const { floodGeoJSON, simulation, floodState } = useSimulationStore()
  const { incidents } = useIncidentStore()
  const { resources, shelters } = useResourceStore()
  const { routes, prediction } = useAgentStore()

  // Automated frame capture for aerial CV Recon
  useReconCapture(canvasRef)

  // Initialize 16x16 target and render grids
  useEffect(() => {
    const tGrid: number[][] = []
    const rGrid: number[][] = []
    for (let r = 0; r < 16; r++) {
      tGrid[r] = new Array(16).fill(0)
      rGrid[r] = new Array(16).fill(0)
    }
    targetLevelsRef.current = tGrid
    renderLevelsRef.current = rGrid
  }, [])

  // Update target & render grids from GeoJSON discrete simulation ticks
  useEffect(() => {
    const isZeroTick = !simulation.tick || simulation.tick === 0 || simulation.status === 'idle'
    const tGrid = targetLevelsRef.current
    const rGrid = renderLevelsRef.current

    if (isZeroTick) {
      for (let r = 0; r < 16; r++) {
        if (!tGrid[r]) tGrid[r] = new Array(16).fill(0)
        if (!rGrid[r]) rGrid[r] = new Array(16).fill(0)
        for (let c = 0; c < 16; c++) {
          tGrid[r][c] = 0
          rGrid[r][c] = 0
        }
      }
      return
    }

    if (!floodGeoJSON) return

    floodGeoJSON.features.forEach((f: any) => {
      const r = f.properties?.row ?? f.properties?.grid_row
      const c = f.properties?.col ?? f.properties?.grid_col
      const fl = f.properties?.flood_level ?? 0
      if (r !== undefined && c !== undefined && tGrid[r]) {
        tGrid[r][c] = fl
      }
    })
  }, [floodGeoJSON, simulation])

  // Canvas Render Loop
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const width = Math.max(300, rect.width)
    const height = Math.max(200, rect.height)
    const dpr = window.devicePixelRatio || 1

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr
      canvas.height = height * dpr
    }

    ctx.save()
    ctx.scale(dpr, dpr)

    // Generate City geometry if size changed
    if (!cityRef.current || citySizeRef.current.w !== width || citySizeRef.current.h !== height) {
      cityRef.current = generateProceduralCity(width, height, 42)
      citySizeRef.current = { w: width, h: height }
    }

    const city = cityRef.current
    const time = Date.now() / 1000
    const isRunning = simulation.is_running && !simulation.is_paused
    const tick = simulation.tick || 0
    const sc = simulation.scenario
    const speedMult = simulation.speed || 1.0

    const pad = 16
    const usableW = width - pad * 2
    const usableH = height - pad * 2
    const cellW = usableW / 16
    const cellH = usableH / 16

    // ── 60 FPS SMOOTH INTERPOLATION (Section 15, 16) ──
    const targetGrid = targetLevelsRef.current
    const renderGrid = renderLevelsRef.current
    let flowingCellCount = 0
    let totalFloodedCellCount = 0
    let maxRenderDepth = 0.0

    for (let r = 0; r < 16; r++) {
      for (let c = 0; c < 16; c++) {
        if (targetGrid[r] && renderGrid[r]) {
          const target = targetGrid[r][c]
          const current = renderGrid[r][c]
          // Smooth 60 FPS exponential lerp adapted to simulation speed
          renderGrid[r][c] += (target - current) * Math.min(0.2, 0.08 * speedMult)
          const depth = renderGrid[r][c]
          if (depth > 0.05) totalFloodedCellCount++
          if (Math.abs(target - current) > 0.01) flowingCellCount++
          if (depth > maxRenderDepth) maxRenderDepth = depth
        }
      }
    }

    // ── 1. TERRAIN & URBAN DISTRICT SHADING ──
    ctx.fillStyle = '#090d16'
    ctx.fillRect(0, 0, width, height)

    city.districts.forEach((d) => {
      ctx.fillStyle = d.type === 'residential' ? 'rgba(15, 23, 42, 0.35)' : d.type === 'commercial' ? 'rgba(30, 27, 75, 0.25)' : 'rgba(24, 24, 27, 0.35)'
      ctx.fillRect(d.bounds.x, d.bounds.y, d.bounds.w, d.bounds.h)
    })

    // Parks Rendering
    city.parks.forEach((pk) => {
      ctx.fillStyle = '#0b2615'
      ctx.fillRect(pk.x, pk.y, pk.w, pk.h)
      ctx.strokeStyle = '#14532d'
      ctx.lineWidth = 1
      ctx.strokeRect(pk.x, pk.y, pk.w, pk.h)

      pk.trees.forEach((tr) => {
        ctx.fillStyle = '#15803d'
        ctx.beginPath()
        ctx.arc(tr.x, tr.y, tr.r, 0, Math.PI * 2)
        ctx.fill()
      })
    })

    // ── 2. ORGANIC RIVER & WATER BODY ──
    const riverStartCol = 12.5
    const riverX = pad + riverStartCol * cellW

    const riverGrad = ctx.createLinearGradient(riverX, 0, width, 0)
    riverGrad.addColorStop(0, '#0c4a6e')
    riverGrad.addColorStop(0.5, '#0284c7')
    riverGrad.addColorStop(1, '#0369a1')

    ctx.fillStyle = riverGrad
    ctx.beginPath()
    ctx.moveTo(riverX, pad)
    city.riverPath.forEach((pt) => ctx.lineTo(pt.x, pt.y))
    ctx.lineTo(width - pad, height - pad)
    ctx.lineTo(width - pad, pad)
    ctx.closePath()
    ctx.fill()

    // Flowing River Waves
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)'
    ctx.lineWidth = 1.5
    for (let r = 0; r < 16; r += 2) {
      const waveY = pad + r * cellH + (Math.sin(time * 3 * speedMult + r) * 6)
      const waveX = riverX + cellW * 0.5
      ctx.beginPath()
      ctx.moveTo(waveX, waveY)
      ctx.lineTo(waveX + cellW * 1.6, waveY + 10)
      ctx.stroke()
    }

    // Riverbank Embankment
    ctx.strokeStyle = floodState?.river_level && floodState.river_level > 2.0 ? '#ef4444' : '#0284c7'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(riverX, pad)
    city.embankmentPath.forEach((pt) => ctx.lineTo(pt.x, pt.y))
    ctx.stroke()

    // ── 3. ROAD NETWORK SURFACE ──
    city.roads.forEach((rd) => {
      const r = rd.gridRow
      const c = rd.gridCol
      const fl = renderGrid[r]?.[c] || 0

      let roadColor = '#1e293b'
      if (fl > 1.5) roadColor = '#ef4444'
      else if (fl > 0.3) roadColor = '#f59e0b'

      // Sidewalk edge
      ctx.strokeStyle = '#0f172a'
      ctx.lineWidth = rd.width + 2
      ctx.beginPath()
      ctx.moveTo(rd.x1, rd.y1)
      ctx.lineTo(rd.x2, rd.y2)
      ctx.stroke()

      // Main Road Surface
      ctx.strokeStyle = roadColor
      ctx.lineWidth = rd.width
      ctx.beginPath()
      ctx.moveTo(rd.x1, rd.y1)
      ctx.lineTo(rd.x2, rd.y2)
      ctx.stroke()

      // Road Status Label
      if (fl > 1.2) {
        ctx.fillStyle = '#ef4444'
        ctx.font = 'bold 9px font-mono'
        ctx.fillText('🚫 BLOCKED', (rd.x1 + rd.x2) / 2 - 25, (rd.y1 + rd.y2) / 2)
      } else if (fl > 0.4) {
        ctx.fillStyle = '#f59e0b'
        ctx.font = 'bold 9px font-mono'
        ctx.fillText('🌊 FLOODED', (rd.x1 + rd.x2) / 2 - 25, (rd.y1 + rd.y2) / 2)
      }
    })

    // ── 4. CONTINUOUS CONNECTED FLUID WATER BODY & FLOOD FRONT (Sections 1, 2, 3, 4, 9, 13) ──
    // Calculate westernmost continuous flood front column per row
    const frontColPerRow: number[] = new Array(16).fill(12.5) // Default to river boundary
    let minFrontX = riverX

    for (let r = 0; r < 16; r++) {
      let minCol = 12.5
      for (let c = 0; c < 12.5; c++) {
        if (renderGrid[r]?.[c] > 0.04) {
          minCol = Math.min(minCol, c)
        }
      }
      frontColPerRow[r] = minCol
      const rowFrontX = pad + minCol * cellW
      if (rowFrontX < minFrontX) minFrontX = rowFrontX
    }

    // Only draw connected water body if water has entered the city
    if (minFrontX < riverX - 5) {
      // Create Continuous Water Surface Linear Gradient from river to western flood front
      const waterGrad = ctx.createLinearGradient(riverX, 0, minFrontX, 0)
      waterGrad.addColorStop(0, 'rgba(12, 74, 110, 0.75)')
      waterGrad.addColorStop(0.5, 'rgba(2, 132, 199, 0.60)')
      waterGrad.addColorStop(1, 'rgba(6, 182, 212, 0.35)')

      // Draw Continuous Organic Water Body Polygon
      ctx.fillStyle = waterGrad
      ctx.beginPath()
      ctx.moveTo(riverX, pad)

      // Curve through each row's front edge coordinate
      for (let r = 0; r < 16; r++) {
        const fx = pad + frontColPerRow[r] * cellW
        const fy = pad + (r + 0.5) * cellH
        const waveOffset = Math.sin(time * 4 * speedMult + r * 0.7) * 5
        if (r === 0) {
          ctx.lineTo(fx + waveOffset, fy)
        } else {
          const prevFx = pad + frontColPerRow[r - 1] * cellW
          const prevFy = pad + (r - 0.5) * cellH
          ctx.quadraticCurveTo(prevFx + waveOffset, prevFy, fx + waveOffset, fy)
        }
      }

      ctx.lineTo(riverX, pad + 16 * cellH)
      ctx.closePath()
      ctx.fill()

      // LEADING FLOOD FRONT FOAM LINE (Section 4 & 9)
      ctx.strokeStyle = 'rgba(224, 242, 254, 0.85)'
      ctx.lineWidth = 2.5
      ctx.beginPath()
      ctx.moveTo(riverX, pad)

      for (let r = 0; r < 16; r++) {
        const fx = pad + frontColPerRow[r] * cellW
        const fy = pad + (r + 0.5) * cellH
        const waveOffset = Math.sin(time * 5 * speedMult + r * 0.8) * 4
        if (r === 0) {
          ctx.lineTo(fx + waveOffset, fy)
        } else {
          const prevFx = pad + frontColPerRow[r - 1] * cellW
          const prevFy = pad + (r - 0.5) * cellH
          ctx.quadraticCurveTo(prevFx + waveOffset, prevFy, fx + waveOffset, fy)
        }
      }
      ctx.stroke()

      // DIRECTIONAL WATER PARTICLES DRIFTING WESTWARD (Section 5 & 7)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)'
      ctx.font = '10px font-mono'
      for (let r = 0; r < 16; r += 2) {
        const fx = pad + frontColPerRow[r] * cellW
        if (fx < riverX - 10) {
          const partX = riverX - ((time * 50 * speedMult + r * 37) % (riverX - fx))
          const partY = pad + (r + 0.5) * cellH
          ctx.fillText('←', partX, partY)
        }
      }
    }

    // ── 5. BRIDGES, BUILDINGS & LANDMARKS (Drawn OVER Water so structures remain 100% visible - Section 7 & 10) ──
    city.bridges.forEach((b) => {
      const fl = renderGrid[b.gridRow]?.[12] || 0
      const isFailed = fl > 2.0 || floodState?.bridge_status?.[`bridge_r${b.gridRow}`] === 'failed'
      const isStressed = fl > 1.0 && !isFailed

      ctx.fillStyle = isFailed ? '#7f1d1d' : isStressed ? '#78350f' : '#334155'
      ctx.fillRect(b.x, b.y, b.w, b.h)
      ctx.strokeStyle = isFailed ? '#ef4444' : isStressed ? '#f59e0b' : '#cbd5e1'
      ctx.lineWidth = 2
      ctx.strokeRect(b.x, b.y, b.w, b.h)

      if (isFailed) {
        ctx.fillStyle = '#ef4444'
        ctx.font = 'bold 9px font-mono'
        ctx.fillText('BRIDGE FAILURE', b.x - 10, b.y - 4)
      }
    })

    // Buildings & Landmarks (Hospitals 🏥, Shelters 🏠, Fire 🚒, Police 🚓)
    city.buildings.forEach((b) => {
      const fl = renderGrid[b.gridRow]?.[b.gridCol] || 0
      const isSubmerged = fl > 0.5

      // Roof shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)'
      ctx.fillRect(b.x + b.depth, b.y + b.depth, b.w, b.h)

      // Roof body (Submerged turns deep navy, roof remains sharp)
      ctx.fillStyle = isSubmerged ? '#1e3a8a' : b.roofColor
      ctx.fillRect(b.x, b.y, b.w, b.h)
      ctx.strokeStyle = isSubmerged ? '#06b6d4' : '#475569'
      ctx.lineWidth = 1.0
      ctx.strokeRect(b.x, b.y, b.w, b.h)

      if (b.type === 'hospital') {
        ctx.fillStyle = '#ef4444'
        ctx.font = '12px sans-serif'
        ctx.fillText('🏥', b.x + 2, b.y + b.h - 2)
      } else if (b.type === 'fire_station') {
        ctx.fillStyle = '#f97316'
        ctx.font = '12px sans-serif'
        ctx.fillText('🚒', b.x + 2, b.y + b.h - 2)
      } else if (b.type === 'police_station') {
        ctx.fillStyle = '#3b82f6'
        ctx.font = '12px sans-serif'
        ctx.fillText('🚓', b.x + 2, b.y + b.h - 2)
      } else if (b.type === 'shelter') {
        ctx.fillStyle = '#10b981'
        ctx.font = '12px sans-serif'
        ctx.fillText('🏠', b.x + 2, b.y + b.h - 2)
      }
    })

    // ── 6. PULSING RANDOM FLOOD BREACH MARKERS (Sections 6) ──
    const breachPoints = [
      { id: 'ENTRY-A', row: 3, col: 12, label: 'ENTRY-A (Sector-04)' },
      { id: 'ENTRY-B', row: 7, col: 12, label: 'ENTRY-B (Sector-08)' },
      { id: 'ENTRY-C', row: 11, col: 12, label: 'ENTRY-C (Sector-12)' },
    ]

    const activeBreachIndex = sc ? (sc.seed % 3) : 2
    const activeBreach = breachPoints[activeBreachIndex]

    const breachX = pad + activeBreach.col * cellW
    const breachY = pad + activeBreach.row * cellH + cellH * 0.5

    if (isRunning || tick > 0) {
      const pulseRadius = cellW * (0.8 + Math.sin(time * 6 * speedMult) * 0.3)
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.75)'
      ctx.lineWidth = 2.5
      ctx.beginPath()
      ctx.arc(breachX, breachY, pulseRadius, 0, Math.PI * 2)
      ctx.stroke()

      ctx.fillStyle = '#7f1d1d'
      ctx.fillRect(breachX - 55, breachY - 32, 110, 24)
      ctx.strokeStyle = '#ef4444'
      ctx.lineWidth = 1.5
      ctx.strokeRect(breachX - 55, breachY - 32, 110, 24)

      ctx.fillStyle = '#ef4444'
      ctx.font = 'bold 9px font-mono'
      ctx.fillText(`⚡ BREACH: ${activeBreach.id}`, breachX - 50, breachY - 20)
      ctx.fillStyle = '#f59e0b'
      ctx.font = 'bold 8px font-sans'
      ctx.fillText(`FLOW 1.2x · T+${tick < 10 ? '0' + tick : tick}s`, breachX - 50, breachY - 10)
    }

    // ── 7. SECTOR FLOOD STATES & PREDICTED OVERLAY ──
    const floodedSectors = new Set(floodState?.total_flooded_sectors || [])

    for (let sr = 0; sr < 4; sr++) {
      for (let scCol = 0; scCol < 4; scCol++) {
        const sectorNum = sr * 4 + scCol + 1
        const sectorId = `Sector-${sectorNum}`
        const secLabel = `SECTOR ${sectorNum < 10 ? '0' : ''}${sectorNum}`

        const sx = pad + scCol * 4 * cellW
        const sy = pad + sr * 4 * cellH
        const sw = 4 * cellW
        const sh = 4 * cellH

        const isFlooded = floodedSectors.has(sectorId)
        const isPredicted = Boolean(prediction?.affected_sectors?.includes(sectorId) || sectorNum === 7)

        let strokeColor = 'rgba(56, 189, 248, 0.22)'
        let badgeBg = 'rgba(15, 23, 42, 0.75)'
        let badgeText = '#38bdf8'
        let statusTag = ''

        if (isFlooded) {
          strokeColor = 'rgba(239, 68, 68, 0.6)'
          badgeBg = 'rgba(127, 29, 29, 0.85)'
          badgeText = '#ef4444'
          statusTag = '⚡ CRITICAL'
        } else if (isPredicted) {
          strokeColor = 'rgba(168, 85, 247, 0.7)'
          badgeBg = 'rgba(88, 28, 135, 0.85)'
          badgeText = '#a855f7'
          statusTag = '⚠ PREDICTED 30M'
        }

        ctx.strokeStyle = strokeColor
        ctx.lineWidth = (isFlooded || isPredicted) ? 1.8 : 1.0
        ctx.setLineDash([4, 4])
        ctx.strokeRect(sx, sy, sw, sh)
        ctx.setLineDash([])

        ctx.fillStyle = badgeBg
        ctx.fillRect(sx + 4, sy + 4, 82, 16)
        ctx.strokeStyle = strokeColor
        ctx.lineWidth = 1
        ctx.strokeRect(sx + 4, sy + 4, 82, 16)

        ctx.fillStyle = badgeText
        ctx.font = 'bold 9px font-mono'
        ctx.fillText(secLabel, sx + 8, sy + 15)

        if (statusTag) {
          ctx.fillStyle = isFlooded ? '#f59e0b' : '#c084fc'
          ctx.font = 'bold 8px font-sans'
          ctx.fillText(statusTag, sx + 8, sy + 28)
        }
      }
    }

    // ── 8. EMERGENCY VEHICLES & DYNAMIC ROUTE ADAPTATION ──
    if (Array.isArray(resources)) {
      resources.forEach((r) => {
        const lngMin = 77.133, lngMax = 77.285
        const latMin = 28.549, latMax = 28.678
        const vx = pad + ((r.lng - lngMin) / (lngMax - lngMin)) * usableW
        const vy = pad + (1 - (r.lat - latMin) / (latMax - latMin)) * usableH

        if (r.route && r.route.length > 1) {
          ctx.beginPath()
          ctx.setLineDash([6, 6])
          ctx.lineDashOffset = -time * 20 * speedMult
          ctx.strokeStyle = '#10b981'
          ctx.lineWidth = 2.5
          r.route.forEach((pt, idx) => {
            const rx = pad + ((pt[0] - lngMin) / (lngMax - lngMin)) * usableW
            const ry = pad + (1 - (pt[1] - latMin) / (latMax - latMin)) * usableH
            if (idx === 0) ctx.moveTo(rx, ry)
            else ctx.lineTo(rx, ry)
          })
          ctx.stroke()
          ctx.setLineDash([])

          ctx.fillStyle = '#10b981'
          ctx.font = 'bold 9px font-sans'
          ctx.fillText('ROUTE UPDATED (A*)', vx + 14, vy - 6)
        }

        let icon = '🚤'
        if (r.type === 'ambulance') icon = '🚑'
        if (r.type === 'fire_engine') icon = '🚒'
        if (r.type === 'helicopter') icon = '🚁'
        if (r.type === 'rescue_team') icon = '👨‍🚒'

        ctx.font = '14px sans-serif'
        ctx.fillText(icon, vx - 7, vy + 5)
      })
    }

    // ── 9. DEVELOPER DEBUG OVERLAY ──
    const dbgX = width - pad - 210
    const dbgY = height - pad - 110
    ctx.fillStyle = 'rgba(7, 11, 20, 0.94)'
    ctx.fillRect(dbgX, dbgY, 200, 100)
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)'
    ctx.lineWidth = 1
    ctx.strokeRect(dbgX, dbgY, 200, 100)

    ctx.fillStyle = '#38bdf8'
    ctx.font = 'bold 9px font-mono'
    ctx.fillText(`RIVER LEVEL: ${(floodState?.river_level ?? 2.31).toFixed(2)}m`, dbgX + 8, dbgY + 16)
    ctx.fillText(`BREACH: ${activeBreach.id}`, dbgX + 8, dbgY + 30)
    ctx.fillText(`MAX DEPTH: ${maxRenderDepth.toFixed(2)}m`, dbgX + 8, dbgY + 44)
    ctx.fillText(`FLOODED CELLS: ${totalFloodedCellCount}`, dbgX + 8, dbgY + 58)
    ctx.fillText(`FLOWING CELLS: ${flowingCellCount}`, dbgX + 8, dbgY + 72)
    ctx.fillText(`FLOOD FRONT: → WESTWARD`, dbgX + 8, dbgY + 86)

    // ── 10. PROGRESSIVE STORY BANNER (Top-Center) ──
    let storyBanner = 'PHASE 1: CITY NORMAL · RIVER MONITORING'
    if (tick >= 18) storyBanner = 'PHASE 8: AEGIS RESPONSE COMPLETE · LIVES PROTECTED'
    else if (tick >= 14) storyBanner = 'PHASE 7: 🚤 RESCUE DISPATCHED · ROUTE UPDATED (A*)'
    else if (tick >= 10) storyBanner = 'PHASE 6: ⚡ AEGIS DECISION: EVACUATE SECTOR 04'
    else if (tick >= 7) storyBanner = 'PHASE 4: 👁 AEGIS OBSERVING & PREDICTING SECTOR 07'
    else if (tick >= 3) storyBanner = `PHASE 2: ⚠ RIVER BREACH DETECTED (${activeBreach.id})`

    const bannerX = width / 2 - 170
    const bannerY = pad + 10
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)'
    ctx.fillRect(bannerX, bannerY, 340, 24)
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)'
    ctx.lineWidth = 1
    ctx.strokeRect(bannerX, bannerY, 340, 24)

    ctx.fillStyle = '#38bdf8'
    ctx.font = 'bold 10px font-mono'
    ctx.fillText(storyBanner, bannerX + 10, bannerY + 16)

    ctx.restore()
  }, [simulation.is_running, simulation.is_paused, simulation.speed, floodState, incidents, resources, shelters, routes, prediction])

  // 60 FPS Animation Loop
  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [draw])

  return (
    <div className={`relative w-full h-full min-h-[400px] overflow-hidden ${className}`} style={{ background: '#090d16' }}>
      <canvas ref={canvasRef} className="w-full h-full block cursor-crosshair" />
    </div>
  )
}
