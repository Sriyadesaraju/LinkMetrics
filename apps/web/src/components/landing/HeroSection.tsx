import { Link } from 'react-router-dom'
import { Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { BarChart3, TrendingUp, Link2 } from 'lucide-react'

interface HeroSectionProps {
  heroUrl: string
  onUrlChange: (v: string) => void
  onSubmit: (e: React.FormEvent) => void
}

export function HeroSection({ heroUrl, onUrlChange, onSubmit }: HeroSectionProps) {
  return (
    <section className="hero-section relative pt-28 pb-16 lg:pt-32 lg:pb-24 bg-white overflow-hidden">
      {/* Soft blobs like MeMate */}
      <div
        className="pointer-events-none absolute top-20 left-[5%] w-[420px] h-[420px] rounded-full opacity-60 blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(56,189,248,0.2) 0%, transparent 70%)' }}
      />
      <div
        className="pointer-events-none absolute top-40 right-[0%] w-[380px] h-[380px] rounded-full opacity-50 blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.15) 0%, transparent 70%)' }}
      />

      <div className="relative mx-auto px-6 text-center home-platform">
        <h1 className="hero-platform-title hero-eyebrow">
          Smart URL Shortener &amp; Analytics Platform
        </h1>

        <h2 className="gradient-heading header-text hero-gradient-heading hero-line smokey-gradient smokeyGradient">
          to grow with smart links
        </h2>

        <p className="hero-sub mt-6 text-lg sm:text-xl text-muted max-w-2xl mx-auto leading-relaxed">
          Easy-to-use link management for marketers, startups, and growth teams.
          Shorten URLs, track every click, and optimize campaigns in one place.
        </p>

        <form onSubmit={onSubmit} className="hero-cta mt-10 flex flex-col sm:flex-row gap-3 max-w-lg mx-auto sm:max-w-none sm:justify-center">
          <Input
            type="url"
            value={heroUrl}
            onChange={(e) => onUrlChange(e.target.value)}
            placeholder="Paste your long URL..."
            className="hero-cta h-14 rounded-full border-border bg-white shadow-soft text-base px-5 sm:min-w-[320px]"
          />
        </form>

        <div className="hero-cta mt-4 flex flex-col sm:flex-row gap-3 justify-center items-center">
          <Link to="/register" className="w-full sm:w-auto">
            <Button
              size="lg"
              className="hero-cta w-full sm:w-auto h-14 rounded-full px-8 text-base font-semibold bg-navy-900 hover:bg-navy-800 shadow-lg"
            >
              Show me how it works
            </Button>
          </Link>
          <Link to="/register" className="w-full sm:w-auto">
            <Button
              variant="secondary"
              size="lg"
              className="hero-cta w-full sm:w-auto h-14 rounded-full px-8 text-base font-semibold border-2 border-navy-900/10"
            >
              Start free trial
            </Button>
          </Link>
        </div>

        {/* Product mockup */}
        <div className="hero-mockup relative mt-16 lg:mt-20 max-w-3xl mx-auto">
          <div className="relative rounded-2xl border border-border bg-white shadow-elevated overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-surface">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <span className="text-xs text-muted ml-2">app.linkmetrics.co</span>
            </div>
            <div className="p-6 sm:p-8 bg-surface">
              <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
                {[
                  { label: 'Clicks', value: '24.8K', icon: BarChart3 },
                  { label: 'Links', value: '142', icon: Link2 },
                  { label: 'CTR', value: '3.8%', icon: TrendingUp },
                ].map((m) => (
                  <div key={m.label} className="rounded-2xl bg-white border border-border p-4 text-left">
                    <m.icon className="h-4 w-4 text-accent mb-2" />
                    <p className="text-[10px] sm:text-xs text-muted">{m.label}</p>
                    <p className="text-lg sm:text-xl font-bold text-navy-900">{m.value}</p>
                  </div>
                ))}
              </div>
              <div className="h-28 sm:h-36 rounded-2xl bg-white border border-border flex items-end gap-1 p-4">
                {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-md bg-gradient-to-t from-sky-500 to-sky-400"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Floating UI cards */}
          <div className="float-card float-card-1 absolute -left-2 lg:-left-16 top-1/4 hidden sm:block rounded-2xl border border-border bg-white p-4 shadow-card w-44">
            <p className="text-[10px] font-semibold text-muted uppercase">Top link</p>
            <p className="text-sm font-mono text-sky-600 mt-1">/launch-26</p>
            <p className="text-xl font-bold text-navy-900 mt-1">8,421</p>
          </div>
          <div className="float-card float-card-2 absolute -right-2 lg:-right-12 bottom-1/4 hidden sm:block rounded-2xl border border-border bg-white p-4 shadow-card">
            <div className="flex items-center gap-2 text-sm font-medium text-navy-900">
              <Play className="h-4 w-4 text-accent fill-accent" />
              Live analytics
            </div>
          </div>
        </div>
      </div>

      {/* Sub-hero line */}
      <div className="reveal-up mt-20 text-center px-6">
        <h3 className="font-display text-2xl sm:text-3xl font-bold text-navy-900">
          More clicks — less guesswork
        </h3>
        <p className="mt-3 text-muted max-w-xl mx-auto">
          Send a link in seconds, watch performance in real time, and export data when you need it.
        </p>
      </div>
    </section>
  )
}
