'use client'
import { useSimulationStore } from '@/stores/simulationStore'
import { Radio } from 'lucide-react'

export default function CinematicStatusBox() {
  const { simulation, floodState } = useSimulationStore()
  const isRunning = simulation.is_running && !simulation.is_paused
  const tick = simulation.tick || 0

  const sc = simulation.scenario

  // Narrative message based on tick & disaster state (Section STAGE 1 SIMULATION NARRATIVE)
  let narrative = "River level is normal. Monitoring municipal meteorological feeds."
  if (isRunning) {
    if (tick <= 2) narrative = "River level is starting to rise."
    else if (tick <= 5) narrative = "Water has entered Sector 04 embankment boundaries."
    else if (tick <= 8) narrative = "Road R14 is becoming unsafe due to deep water accumulation."
    else if (tick <= 12) narrative = "Flooding is spreading toward residential neighborhoods in Sector 07."
    else if (tick <= 16) narrative = "Emergency reports are increasing. Bridge structural strain detected."
    else narrative = "Critical flood threshold reached. AEGIS has collected enough information."
  }

  return (
    <div className="bg-[#0f172a]/90 border border-cyan-500/30 rounded-2xl px-5 py-3 shadow-2xl backdrop-blur-md text-white font-sans flex items-center gap-3 select-none max-w-xl">
      <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 shrink-0">
        <Radio className="w-5 h-5 animate-pulse" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-widest flex items-center justify-between">
          <span>SENSORY RECONNAISSANCE</span>
          <span>T+{tick < 10 ? `0${tick}` : tick}s</span>
        </div>
        <p className="text-sm font-medium text-slate-100 truncate mt-0.5 font-sans">
          "{narrative}"
        </p>
      </div>
    </div>
  )
}
