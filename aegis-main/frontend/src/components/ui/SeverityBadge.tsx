'use client'
import { SEVERITY_COLORS } from '@/lib/constants'
import type { Severity } from '@/lib/types'

interface SeverityBadgeProps {
  severity: Severity
  pulse?: boolean
  size?: 'sm' | 'md'
}

export function SeverityBadge({ severity, pulse, size = 'sm' }: SeverityBadgeProps) {
  const color = SEVERITY_COLORS[severity] || '#6b7280'
  const sizeClass = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1'

  return (
    <span
      className={`inline-flex items-center font-bold rounded-full font-mono tracking-wider ${sizeClass} ${pulse && severity === 'CRITICAL' ? 'animate-pulse' : ''}`}
      style={{ color, backgroundColor: `${color}22`, border: `1px solid ${color}44` }}
    >
      {severity === 'CRITICAL' && <span className="mr-1">⚠</span>}
      {severity}
    </span>
  )
}
