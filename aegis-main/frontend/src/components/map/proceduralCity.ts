// AEGIS FLOOD — High-Detail Procedural 2D City Digital Twin Generator
// Organic city blocks, 150+ varied buildings, sidewalks, crosswalks, organic riverbank, 3 bridges

export interface Building {
  id: string
  x: number
  y: number
  w: number
  h: number
  type: 'residential' | 'commercial' | 'industrial' | 'hospital' | 'fire_station' | 'police_station' | 'shelter' | 'school' | 'warehouse' | 'apartment'
  roofColor: string
  wallColor: string
  roofDetails: 'ac' | 'solar' | 'cross' | 'helipad' | 'skylight' | 'none'
  gridRow: number
  gridCol: number
  sectorId: string
  depth: number
  windows: Array<{ x: number; y: number }>
}

export interface RoadSegment {
  id: string
  x1: number
  y1: number
  x2: number
  y2: number
  type: 'highway' | 'avenue' | 'street'
  width: number
  gridRow: number
  gridCol: number
  name: string
  hasCrosswalk?: boolean
}

export interface Bridge {
  id: string
  x: number
  y: number
  w: number
  h: number
  gridRow: number
  name: string
}

export interface Park {
  x: number
  y: number
  w: number
  h: number
  trees: Array<{ x: number; y: number; r: number }>
}

export interface ProceduralCity {
  buildings: Building[]
  roads: RoadSegment[]
  bridges: Bridge[]
  parks: Park[]
  riverPath: Array<{ x: number; y: number }>
  embankmentPath: Array<{ x: number; y: number }>
  districts: Array<{ name: string; bounds: { x: number; y: number; w: number; h: number }; type: string }>
}

// Deterministic PRNG
function pseudoRandom(seed: number) {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

export function generateProceduralCity(width: number, height: number, seed: number = 42): ProceduralCity {
  const rand = pseudoRandom(seed)

  const buildings: Building[] = []
  const roads: RoadSegment[] = []
  const bridges: Bridge[] = []
  const parks: Park[] = []

  const pad = 16
  const usableW = width - pad * 2
  const usableH = height - pad * 2
  const cellW = usableW / 16
  const cellH = usableH / 16

  // 1. Organic Curved River Shoreline & Embankment Barrier
  const riverPath: Array<{ x: number; y: number }> = []
  const embankmentPath: Array<{ x: number; y: number }> = []
  const riverStartCol = 12.5

  for (let r = 0; r <= 16; r++) {
    const curveOffset = Math.sin(r * 0.35 + seed) * cellW * 0.8
    const rx = pad + riverStartCol * cellW + curveOffset
    const ry = pad + r * cellH
    riverPath.push({ x: rx, y: ry })
    embankmentPath.push({ x: rx - 12, y: ry })
  }

  // 2. 3 Major Bridges
  const bridgeRows = [3, 7, 11]
  bridgeRows.forEach((r) => {
    const bx = pad + riverStartCol * cellW - cellW * 0.4
    const by = pad + r * cellH + cellH * 0.15
    bridges.push({
      id: `bridge-${r}`,
      x: bx,
      y: by,
      w: cellW * 1.8,
      h: cellH * 0.7,
      gridRow: r,
      name: `Bridge R${r}`,
    })
  })

  // 3. Hierarchical Muted Road Network (Highways, Avenues, Local Streets)
  for (let r = 0; r <= 16; r += 4) {
    roads.push({
      id: `h-hwy-${r}`,
      x1: pad,
      y1: pad + r * cellH,
      x2: pad + riverStartCol * cellW,
      y2: pad + r * cellH,
      type: 'highway',
      width: 10,
      gridRow: Math.min(15, r),
      gridCol: 4,
      name: `Avenue R${r}`,
      hasCrosswalk: true,
    })
  }

  for (let c = 0; c <= riverStartCol; c += 4) {
    roads.push({
      id: `v-hwy-${c}`,
      x1: pad + c * cellW,
      y1: pad,
      x2: pad + c * cellW,
      y2: pad + 16 * cellH,
      type: 'highway',
      width: 10,
      gridRow: 8,
      gridCol: Math.min(15, c),
      name: `Boulevard C${c}`,
      hasCrosswalk: true,
    })
  }

  // Local Street Network within City Blocks
  for (let r = 0; r < 16; r++) {
    for (let c = 0; c < riverStartCol; c++) {
      if (r % 2 === 1 && c % 4 !== 0) {
        roads.push({
          id: `street-${r}-${c}`,
          x1: pad + c * cellW,
          y1: pad + r * cellH + cellH * 0.5,
          x2: pad + (c + 1) * cellW,
          y2: pad + r * cellH + cellH * 0.5,
          type: 'street',
          width: 4,
          gridRow: r,
          gridCol: c,
          name: `Street ${r}-${c}`,
        })
      }
    }
  }

  // 4. Urban Parks
  parks.push({
    x: pad + 1 * cellW + 4,
    y: pad + 5 * cellH + 4,
    w: cellW * 2.8,
    h: cellH * 1.8,
    trees: Array.from({ length: 8 }, () => ({
      x: pad + 1.2 * cellW + rand() * cellW * 2.4,
      y: pad + 5.2 * cellH + rand() * cellH * 1.4,
      r: 4 + rand() * 4,
    })),
  })

  // 5. Generate 140+ Procedural Varied Buildings
  const roofColors = {
    residential: ['#1e293b', '#2d3748', '#334155', '#3f4e65'],
    apartment: ['#1e1e2e', '#27273a', '#1f293d'],
    commercial: ['#0f172a', '#172554', '#1b2a4a'],
    industrial: ['#27272a', '#3f3f46', '#333338'],
    hospital: ['#1e3a8a'],
    fire_station: ['#7f1d1d'],
    police_station: ['#1e3a8a'],
    shelter: ['#065f46'],
    school: ['#312e81'],
    warehouse: ['#334155'],
  }

  for (let r = 0; r < 16; r++) {
    for (let c = 0; c < riverStartCol; c++) {
      if (r % 4 === 0 || c % 4 === 0) continue

      const cellX = pad + c * cellW
      const cellY = pad + r * cellH
      const sectorId = `Sector-${Math.floor(r / 4) * 4 + Math.floor(c / 4) + 1}`

      // Landmark Placements
      let bType: Building['type'] | null = null
      if (r === 2 && c === 2) bType = 'hospital'
      else if (r === 12 && c === 2) bType = 'fire_station'
      else if (r === 2 && c === 10) bType = 'police_station'
      else if (r === 3 && c === 3) bType = 'shelter'
      else if (r === 11 && c === 9) bType = 'shelter'
      else if (r === 6 && c === 2) bType = 'school'

      if (bType) {
        buildings.push({
          id: `bld-landmark-${r}-${c}`,
          x: cellX + cellW * 0.15,
          y: cellY + cellH * 0.15,
          w: cellW * 0.7,
          h: cellH * 0.7,
          type: bType,
          roofColor: roofColors[bType][0],
          wallColor: '#1e293b',
          roofDetails: bType === 'hospital' ? 'helipad' : bType === 'school' ? 'skylight' : 'cross',
          gridRow: r,
          gridCol: c,
          sectorId,
          depth: 10,
          windows: [],
        })
        continue
      }

      // Generate 2-4 varied buildings per block
      const count = 3 + Math.floor(rand() * 2)
      for (let i = 0; i < count; i++) {
        const bW = cellW * (0.28 + rand() * 0.12)
        const bH = cellH * (0.28 + rand() * 0.12)
        const bx = cellX + (i % 2) * (cellW * 0.45) + cellW * 0.05
        const by = cellY + Math.floor(i / 2) * (cellH * 0.45) + cellH * 0.05

        let cat: Building['type'] = 'residential'
        if (c >= 4 && c <= 8 && r >= 4 && r <= 10) cat = rand() > 0.5 ? 'commercial' : 'apartment'
        else if (c >= 9) cat = rand() > 0.4 ? 'industrial' : 'warehouse'
        else if (rand() > 0.6) cat = 'apartment'

        const colorList = roofColors[cat]
        const roofColor = colorList[Math.floor(rand() * colorList.length)]

        buildings.push({
          id: `bld-${r}-${c}-${i}`,
          x: bx,
          y: by,
          w: bW,
          h: bH,
          type: cat,
          roofColor,
          wallColor: '#1e293b',
          roofDetails: rand() > 0.7 ? 'ac' : rand() > 0.85 ? 'solar' : 'none',
          gridRow: r,
          gridCol: c,
          sectorId,
          depth: cat === 'commercial' || cat === 'apartment' ? 7 : 4,
          windows: [],
        })
      }
    }
  }

  // 6. Urban Districts
  const districts = [
    { name: 'NORTH RESIDENTIAL', bounds: { x: pad, y: pad, w: cellW * 8, h: cellH * 4 }, type: 'residential' },
    { name: 'CENTRAL COMMERCIAL', bounds: { x: pad + cellW * 4, y: pad + cellH * 4, w: cellW * 5, h: cellH * 8 }, type: 'commercial' },
    { name: 'EAST INDUSTRIAL', bounds: { x: pad + cellW * 9, y: pad, w: cellW * 3.5, h: cellH * 16 }, type: 'industrial' },
    { name: 'SOUTH RESIDENTIAL', bounds: { x: pad, y: pad + cellH * 12, w: cellW * 8, h: cellH * 4 }, type: 'residential' },
  ]

  return { buildings, roads, bridges, parks, riverPath, embankmentPath, districts }
}
