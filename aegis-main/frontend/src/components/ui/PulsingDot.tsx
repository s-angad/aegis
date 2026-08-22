'use client'

interface PulsingDotProps {
  color?: string
  size?: number
  rings?: boolean
}

export function PulsingDot({ color = '#22c55e', size = 8, rings = true }: PulsingDotProps) {
  return (
    <span className="relative inline-flex" style={{ width: size, height: size }}>
      {rings && (
        <span
          className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-50"
          style={{ backgroundColor: color }}
        />
      )}
      <span
        className="relative inline-flex rounded-full"
        style={{ width: size, height: size, backgroundColor: color }}
      />
    </span>
  )
}
