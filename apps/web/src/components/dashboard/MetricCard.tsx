import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { cn, formatNumber } from '@/lib/utils'

interface MetricCardProps {
  title: string
  value: number | string
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon: LucideIcon
  suffix?: string
  className?: string
}

export function MetricCard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  suffix,
  className,
}: MetricCardProps) {
  const displayValue = typeof value === 'number' ? formatNumber(value) : value

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'rounded-2xl border border-border bg-white p-5 shadow-soft',
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-navy-900">
            {displayValue}
            {suffix && <span className="text-lg font-medium text-muted ml-0.5">{suffix}</span>}
          </p>
          {change && (
            <p
              className={cn(
                'mt-1.5 text-xs font-medium',
                changeType === 'positive' && 'text-emerald-600',
                changeType === 'negative' && 'text-red-500',
                changeType === 'neutral' && 'text-muted',
              )}
            >
              {change}
            </p>
          )}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-muted">
          <Icon className="h-5 w-5 text-accent" />
        </div>
      </div>
    </motion.div>
  )
}
