import { Link } from 'react-router-dom'
import { BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  variant?: 'light' | 'dark'
  linkTo?: string
}

export function Logo({ className, variant = 'dark', linkTo = '/' }: LogoProps) {
  const content = (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-xl',
          variant === 'light' ? 'bg-white/10' : 'bg-navy-900',
        )}
      >
        <BarChart3
          className={cn('h-4 w-4', variant === 'light' ? 'text-accent' : 'text-accent')}
        />
      </div>
      <span
        className={cn(
          'text-lg font-semibold tracking-tight',
          variant === 'light' ? 'text-white' : 'text-navy-900',
        )}
      >
        LinkMetrics
      </span>
    </div>
  )

  if (linkTo) {
    return <Link to={linkTo}>{content}</Link>
  }
  return content
}
