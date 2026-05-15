import { BarChart3, Sparkles, Link2, Users, MousePointerClick, Zap, Globe, Clock } from 'lucide-react'

const FEATURES = [
  {
    icon: Link2,
    title: 'Short links',
    desc: 'Branded slugs, custom domains-ready architecture, and instant redirects.',
    color: 'bg-sky-50 text-sky-600',
  },
  {
    icon: BarChart3,
    title: 'Analytics',
    desc: 'Clicks, referrers, devices, geography — Vercel-quality dashboards.',
    color: 'bg-orange-50 text-orange-600',
  },
  {
    icon: Sparkles,
    title: 'AI UTM',
    desc: 'One-click Gemini suggestions and smart campaign chips.',
    color: 'bg-violet-50 text-violet-600',
  },
  {
    icon: MousePointerClick,
    title: 'Click tracking',
    desc: 'Every redirect logged with browser, device, and referrer data.',
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    icon: Users,
    title: 'Workspaces',
    desc: 'Organize links by team, client, or campaign in shared libraries.',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: Zap,
    title: 'CSV export',
    desc: 'Raw click events for BI tools, reports, and custom analysis.',
    color: 'bg-amber-50 text-amber-600',
  },
  {
    icon: Globe,
    title: 'Geography',
    desc: 'See where clicks come from with country-level breakdowns.',
    color: 'bg-teal-50 text-teal-600',
  },
  {
    icon: Clock,
    title: 'Expiration',
    desc: 'Time-limited links for promos, launches, and seasonal campaigns.',
    color: 'bg-rose-50 text-rose-600',
  },
]

export function HorizontalFeatures() {
  return (
    <section id="features" className="features-pin relative bg-[#fafafa] py-20 lg:py-28">
      <div className="reveal-up max-w-6xl mx-auto px-6 mb-12">
        <p className="text-sm font-semibold text-sky-600 uppercase tracking-widest text-center mb-3">
          One platform
        </p>
        <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-center text-navy-900 tracking-tight">
          to replace them all
        </h2>
        <p className="mt-4 text-center text-muted text-lg max-w-2xl mx-auto">
          Shortening, tracking, UTM building, and team collaboration — without juggling five tools.
        </p>
      </div>

      <div className="overflow-hidden">
        <div className="features-track flex gap-5 px-6 lg:px-[max(1.5rem,calc((100vw-72rem)/2+1.5rem))] w-max pb-4">
          {FEATURES.map((f) => (
            <article
              key={f.title}
              className="feature-card flex-shrink-0 w-[300px] sm:w-[340px] rounded-3xl border border-border bg-white p-8 shadow-soft hover:shadow-card transition-shadow duration-300"
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${f.color} mb-6`}>
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-navy-900">{f.title}</h3>
              <p className="mt-3 text-muted leading-relaxed">{f.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
