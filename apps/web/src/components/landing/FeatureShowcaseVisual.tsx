type Variant = 'dashboard' | 'analytics' | 'utm'

interface FeatureShowcaseVisualProps {
  variant: Variant
  className?: string
}

export function FeatureShowcaseVisual({ variant, className = '' }: FeatureShowcaseVisualProps) {
  if (variant === 'dashboard') {
    return (
      <div className={`relative w-full h-full min-h-[12rem] p-4 ${className}`}>
        <div className="rounded-xl border border-border bg-white shadow-soft overflow-hidden h-full flex flex-col">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-surface">
            <span className="h-2 w-2 rounded-full bg-red-400" />
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-[10px] text-muted ml-1">Dashboard</span>
          </div>
          <div className="p-3 flex-1 grid grid-cols-3 gap-2">
            {[
              { label: 'Clicks', value: '24.8K', up: true },
              { label: 'Links', value: '142', up: true },
              { label: 'CTR', value: '3.8%', up: false },
            ].map((m) => (
              <div key={m.label} className="rounded-lg border border-border p-2 bg-surface">
                <p className="text-[8px] text-muted">{m.label}</p>
                <p className="text-sm font-bold text-navy-900">{m.value}</p>
                <p className={`text-[8px] ${m.up ? 'text-emerald-600' : 'text-muted'}`}>
                  {m.up ? '↑ 12%' : '—'}
                </p>
              </div>
            ))}
            <div className="col-span-3 rounded-lg border border-border p-2 flex items-end gap-0.5 h-16 bg-white">
              {[35, 55, 40, 72, 48, 88, 65, 92, 70, 85].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm bg-accent/80"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'analytics') {
    return (
      <div className={`relative w-full h-full min-h-[12rem] p-4 ${className}`}>
        <div className="rounded-xl border border-border bg-white shadow-soft overflow-hidden h-full p-3 grid grid-cols-2 gap-2">
          <div className="col-span-2 rounded-lg border border-border p-2">
            <p className="text-[9px] font-medium text-muted mb-1">Click trends</p>
            <svg viewBox="0 0 200 48" className="w-full h-10" aria-hidden>
              <path
                d="M0 40 L25 32 L50 36 L75 20 L100 28 L125 12 L150 18 L175 8 L200 14"
                fill="none"
                stroke="#f97316"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M0 40 L25 32 L50 36 L75 20 L100 28 L125 12 L150 18 L175 8 L200 14 L200 48 L0 48 Z"
                fill="url(#analyticsFill)"
                opacity="0.2"
              />
              <defs>
                <linearGradient id="analyticsFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" />
                  <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="rounded-lg border border-border p-2 flex flex-col items-center">
            <p className="text-[9px] font-medium text-muted mb-1 self-start">Devices</p>
            <svg viewBox="0 0 40 40" className="w-14 h-14" aria-hidden>
              <circle cx="20" cy="20" r="14" fill="none" stroke="#e8ecf1" strokeWidth="6" />
              <circle
                cx="20"
                cy="20"
                r="14"
                fill="none"
                stroke="#0ea5e9"
                strokeWidth="6"
                strokeDasharray="55 100"
                transform="rotate(-90 20 20)"
              />
              <circle
                cx="20"
                cy="20"
                r="14"
                fill="none"
                stroke="#f97316"
                strokeWidth="6"
                strokeDasharray="30 100"
                strokeDashoffset="-55"
                transform="rotate(-90 20 20)"
              />
            </svg>
          </div>
          <div className="rounded-lg border border-border p-2">
            <p className="text-[9px] font-medium text-muted mb-2">Top countries</p>
            {[
              { name: 'US', w: 85 },
              { name: 'UK', w: 62 },
              { name: 'DE', w: 45 },
            ].map((c) => (
              <div key={c.name} className="flex items-center gap-1.5 mb-1.5">
                <span className="text-[8px] w-5 text-muted">{c.name}</span>
                <div className="flex-1 h-1.5 rounded-full bg-surface overflow-hidden">
                  <div
                    className="h-full rounded-full bg-sky-500"
                    style={{ width: `${c.w}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // AI UTM
  return (
    <div className={`relative w-full h-full min-h-[12rem] p-4 ${className}`}>
      <div className="rounded-xl border border-border bg-white shadow-soft overflow-hidden h-full p-4 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-navy-900">UTM Builder</p>
          <span className="inline-flex items-center gap-1 rounded-full bg-accent-muted px-2 py-0.5 text-[10px] font-medium text-accent">
            ✦ AI Suggest
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {['google · cpc', 'newsletter · email', 'linkedin · social'].map((chip) => (
            <span
              key={chip}
              className="rounded-full border border-orange-200 bg-accent-muted px-2 py-0.5 text-[9px] text-accent-hover"
            >
              {chip}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 flex-1">
          {['Source', 'Medium', 'Campaign', 'Content'].map((label) => (
            <div key={label} className="rounded-lg border border-border bg-surface px-2 py-1.5">
              <p className="text-[8px] text-muted">{label}</p>
              <p className="text-[10px] text-navy-900/60 mt-0.5">—</p>
            </div>
          ))}
        </div>
        <div className="mt-2 rounded-lg border border-dashed border-border bg-surface/50 px-2 py-1.5">
          <p className="text-[8px] text-muted truncate font-mono">
            example.com/?utm_source=google&amp;utm_medium=cpc
          </p>
        </div>
      </div>
    </div>
  )
}
