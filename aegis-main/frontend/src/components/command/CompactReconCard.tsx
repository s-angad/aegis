'use client'
import { useReconStore } from '@/stores/reconStore'
import { ExternalLink } from 'lucide-react'

export default function CompactReconCard({ onOpenDrawer }: { onOpenDrawer: () => void }) {
  const { latestObservation } = useReconStore()

  const confidence = latestObservation?.confidence ?? 94

  return (
    <div className="bg-[#111827]/95 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md text-white select-none font-sans max-w-xs">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-mono font-bold text-slate-300 uppercase flex items-center gap-1.5">
          <span>👁</span> AEGIS RECON
        </span>
        <span className="px-2 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono font-bold uppercase">
          LIVE
        </span>
      </div>

      <p className="text-[10px] text-slate-400 font-mono mb-2">
        Latest aerial observation 2.3s ago
      </p>

      <div className="space-y-1 text-xs text-slate-300 font-sans">
        <div className="flex items-center gap-1.5">
          <span className="text-emerald-400">✓</span>
          <span>3 flooded roads detected</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-emerald-400">✓</span>
          <span>1 blocked bridge intersection</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-emerald-400">✓</span>
          <span>2 high-risk structures</span>
        </div>
      </div>

      <button
        onClick={onOpenDrawer}
        className="mt-3 w-full py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
      >
        <span>VIEW RECON</span>
        <ExternalLink size={12} />
      </button>
    </div>
  )
}
