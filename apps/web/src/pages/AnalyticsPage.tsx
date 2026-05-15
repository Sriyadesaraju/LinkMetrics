import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Download,
  MousePointerClick,
  Globe,
  Monitor,
  Clock,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  CartesianGrid,
} from 'recharts'
import { useAnalytics } from '@/lib/hooks'
import { useWorkspaceStore } from '@/store/workspace.store'
import { Button } from '@/components/ui/button'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { Skeleton } from '@/components/ui/skeleton'
import { CHART_COLORS, chartTooltipStyle } from '@/lib/chart-theme'
import { formatNumber } from '@/lib/utils'

export function AnalyticsPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspace?.id)

  const [from, setFrom] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d.toISOString().split('T')[0]
  })
  const [to, setTo] = useState(() => new Date().toISOString().split('T')[0])

  const { data, isLoading, error } = useAnalytics(slug ?? null, from, to)

  const handleExport = () => {
    window.open(
      `${import.meta.env.VITE_API_URL}/api/links/${slug}/analytics/export?workspaceId=${workspaceId}`,
      '_blank',
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface p-8 space-y-6 max-w-7xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface gap-4">
        <p className="text-red-500 text-sm">Failed to load analytics.</p>
        <Button variant="secondary" onClick={() => navigate('/dashboard')}>
          Back to dashboard
        </Button>
      </div>
    )
  }

  const deviceData = data.byDevice.map((d: { name: string; count: number }) => ({
    name: d.name,
    value: d.count,
  }))
  const browserData = data.byBrowser.map((d: { name: string; count: number }) => ({
    name: d.name,
    clicks: d.count,
  }))
  const countryData = data.byCountry.map((d: { name: string; count: number }) => ({
    name: d.name,
    clicks: d.count,
  }))

  const peakDay = data.byDay?.reduce(
    (best: { date: string; count: number } | null, d: { date: string; count: number }) =>
      !best || d.count > best.count ? d : best,
    null,
  )

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-40 border-b border-border bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-4 px-4 lg:px-8 h-16">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-navy-900 truncate">/{slug}</h1>
            <p className="text-xs text-muted">Link analytics</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="text-sm border border-border rounded-xl px-3 py-1.5 bg-white"
            />
            <span className="text-muted text-sm">–</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="text-sm border border-border rounded-xl px-3 py-1.5 bg-white"
            />
            <Button variant="secondary" size="sm" onClick={handleExport} className="gap-1.5">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard title="Total clicks" value={data.totalClicks} icon={MousePointerClick} />
          <MetricCard
            title="Peak day"
            value={peakDay?.count ?? 0}
            change={peakDay?.date ?? '—'}
            changeType="neutral"
            icon={Clock}
          />
          <MetricCard
            title="Top country"
            value={countryData[0]?.name ?? '—'}
            change={countryData[0] ? `${formatNumber(countryData[0].clicks)} clicks` : ''}
            changeType="neutral"
            icon={Globe}
          />
          <MetricCard
            title="Top device"
            value={deviceData[0]?.name ?? '—'}
            change={deviceData[0] ? `${formatNumber(deviceData[0].value)} clicks` : ''}
            changeType="neutral"
            icon={Monitor}
          />
        </div>

        {data.byDay?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-border bg-white p-6 shadow-soft"
          >
            <h2 className="text-base font-semibold text-navy-900 mb-1">Click trends</h2>
            <p className="text-sm text-muted mb-6">Daily clicks over selected period</p>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={data.byDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f5" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip {...chartTooltipStyle} />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke={CHART_COLORS[0]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: CHART_COLORS[0] }}
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {deviceData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="rounded-2xl border border-border bg-white p-6 shadow-soft"
            >
              <h2 className="text-base font-semibold text-navy-900 mb-6">Devices</h2>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={deviceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {deviceData.map((_: unknown, i: number) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip {...chartTooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-3 mt-4 justify-center">
                {deviceData.map((d: { name: string; value: number }, i: number) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs text-muted">
                    <span className="h-2 w-2 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                    {d.name} ({d.value})
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {browserData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl border border-border bg-white p-6 shadow-soft"
            >
              <h2 className="text-base font-semibold text-navy-900 mb-6">Browsers</h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={browserData} layout="vertical" margin={{ left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f5" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} width={72} axisLine={false} tickLine={false} />
                  <Tooltip {...chartTooltipStyle} />
                  <Bar dataKey="clicks" fill={CHART_COLORS[1]} radius={[0, 6, 6, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          )}
        </div>

        {countryData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-border bg-white p-6 shadow-soft"
          >
            <h2 className="text-base font-semibold text-navy-900 mb-6">Geography</h2>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={countryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f5" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip {...chartTooltipStyle} />
                <Bar dataKey="clicks" fill={CHART_COLORS[2]} radius={[6, 6, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {data.byReferrer?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-border bg-white overflow-hidden shadow-soft"
          >
            <div className="p-6 border-b border-border">
              <h2 className="text-base font-semibold text-navy-900">Top referrers</h2>
              <p className="text-sm text-muted">Where your traffic comes from</p>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-surface/50">
                <tr className="text-left text-muted">
                  <th className="px-6 py-3 font-medium">Source</th>
                  <th className="px-6 py-3 font-medium">Clicks</th>
                  <th className="px-6 py-3 font-medium">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.byReferrer.map((r: { name: string; count: number }) => (
                  <tr key={r.name} className="hover:bg-surface/50 transition-colors">
                    <td className="px-6 py-3.5 font-medium text-navy-900">{r.name}</td>
                    <td className="px-6 py-3.5">{formatNumber(r.count)}</td>
                    <td className="px-6 py-3.5 text-muted">
                      {data.totalClicks > 0
                        ? `${((r.count / data.totalClicks) * 100).toFixed(1)}%`
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}
      </main>
    </div>
  )
}
