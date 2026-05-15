import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowUpRight, MousePointerClick, TrendingUp, Globe } from 'lucide-react'
import { Logo } from '@/components/brand/Logo'

interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  subtitle: string
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden lg:flex flex-col justify-between bg-navy-900 p-12 overflow-hidden">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 50%, rgba(249,115,22,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(59,130,246,0.1) 0%, transparent 40%)',
          }}
        />
        <div className="relative z-10">
          <Logo variant="light" linkTo="/" />
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-white leading-tight max-w-md">
              Shorten links. Track every click. Grow faster.
            </h2>
            <p className="mt-3 text-slate-400 text-base max-w-sm">
              Enterprise-grade analytics for marketers, startups, and growth teams.
            </p>
          </div>

          <div className="space-y-3">
            {[
              { icon: MousePointerClick, label: '12.4K clicks tracked today', value: '+24%' },
              { icon: TrendingUp, label: 'Avg. CTR across campaigns', value: '3.8%' },
              { icon: Globe, label: 'Countries reached', value: '47' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/20">
                  <stat.icon className="h-4 w-4 text-accent" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-300">{stat.label}</p>
                </div>
                <span className="text-sm font-semibold text-accent">{stat.value}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Floating preview card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="relative z-10 rounded-2xl border border-white/10 bg-navy-800/80 p-5 backdrop-blur-md"
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Live analytics</p>
            <span className="flex items-center gap-1.5 text-xs text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </span>
          </div>
          <div className="h-24 flex items-end gap-1">
            {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm bg-accent/80"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
            <ArrowUpRight className="h-3 w-3 text-accent" />
            <span>linkmetrics.co/summer-sale up 34% this week</span>
          </div>
        </motion.div>

        <p className="relative z-10 text-xs text-slate-500">
          Trusted by 2,000+ growth teams worldwide
        </p>
      </div>

      {/* Form panel */}
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 bg-surface">
        <div className="lg:hidden mb-8">
          <Logo linkTo="/" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md mx-auto"
        >
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-navy-900 tracking-tight">{title}</h1>
            <p className="mt-2 text-muted">{subtitle}</p>
          </div>
          <div className="rounded-2xl border border-border bg-white p-8 shadow-card">{children}</div>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            By continuing, you agree to our{' '}
            <Link to="/" className="text-navy-700 hover:underline">
              Terms
            </Link>{' '}
            and{' '}
            <Link to="/" className="text-navy-700 hover:underline">
              Privacy Policy
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
