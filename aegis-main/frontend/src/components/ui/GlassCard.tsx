'use client'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface GlassCardProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'alert' | 'critical' | 'dark'
  animate?: boolean
  onClick?: () => void
}

export function GlassCard({ children, className, variant = 'default', animate = true, onClick }: GlassCardProps) {
  const variants = {
    default: 'bg-white/5 border-white/10',
    alert: 'bg-amber-500/10 border-amber-500/30',
    critical: 'bg-red-500/10 border-red-500/30',
    dark: 'bg-black/40 border-white/5',
  }

  const content = (
    <div
      className={cn(
        'backdrop-blur-xl border rounded-xl overflow-hidden',
        variants[variant],
        onClick && 'cursor-pointer hover:border-white/20 transition-colors duration-200',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )

  if (!animate) return content

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'backdrop-blur-xl border rounded-xl overflow-hidden',
        variants[variant],
        onClick && 'cursor-pointer hover:border-white/20 transition-colors duration-200',
        className
      )}
      onClick={onClick}
    >
      {children}
    </motion.div>
  )
}
