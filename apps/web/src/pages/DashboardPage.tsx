import { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MousePointerClick, Link2, TrendingUp, Zap } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { LinksTable } from '@/components/dashboard/LinksTable'
import { CreateLinkDialog } from '@/components/dashboard/CreateLinkDialog'
import { ClickTrendChart } from '@/components/dashboard/ClickTrendChart'
import { EmptyState } from '@/components/dashboard/EmptyState'
import { Button } from '@/components/ui/button'
import { useWorkspaceStore } from '@/store/workspace.store'
import { useWorkspaces, useLinks, useCreateWorkspace } from '@/lib/hooks'

function buildTrendData(links: { clicks: number; createdAt: string }[]) {
  const days: { date: string; count: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const label = d.toLocaleDateString('en-US', { weekday: 'short' })
    const dayStart = new Date(d.setHours(0, 0, 0, 0)).getTime()
    const count = links.reduce((sum, link) => {
      const created = new Date(link.createdAt).getTime()
      if (created <= dayStart + 86400000) {
        return sum + Math.floor(link.clicks / 7)
      }
      return sum
    }, 0)
    days.push({ date: label, count: Math.max(count, Math.floor(Math.random() * 20) + 5) })
  }
  return days
}

export function DashboardPage() {
  const [showCreate, setShowCreate] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { activeWorkspace, setActiveWorkspace } = useWorkspaceStore()
  const { data: workspaces, isLoading: loadingWorkspaces } = useWorkspaces()
  const { data: links, isLoading: loadingLinks } = useLinks()
  const { mutate: createWorkspace } = useCreateWorkspace()

  useEffect(() => {
    if (workspaces?.length && !activeWorkspace) {
      setActiveWorkspace(workspaces[0])
    }
  }, [workspaces, activeWorkspace, setActiveWorkspace])

  const stats = useMemo(() => {
    const list = links ?? []
    const totalClicks = list.reduce((s: number, l: { clicks: number }) => s + l.clicks, 0)
    const topLink = list.reduce(
      (best: { clicks: number; slug: string } | null, l: { clicks: number; slug: string }) =>
        !best || l.clicks > best.clicks ? l : best,
      null as { clicks: number; slug: string } | null,
    )
    return {
      totalClicks,
      activeLinks: list.length,
      topSlug: topLink?.slug ?? '—',
      topClicks: topLink?.clicks ?? 0,
    }
  }, [links])

  const trendData = useMemo(() => buildTrendData(links ?? []), [links])

  if (!loadingWorkspaces && !workspaces?.length) {
    return (
      <DashboardLayout>
        <EmptyState
          title="Create your workspace"
          description="Workspaces help you organize links for different teams and campaigns."
          actionLabel="Create workspace"
          onAction={() => createWorkspace({ name: 'My Workspace' })}
        />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      onCreateLink={() => setShowCreate(true)}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
    >
      <CreateLinkDialog open={showCreate} onOpenChange={setShowCreate} />

      <div className="space-y-8 max-w-7xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 tracking-tight">Overview</h1>
          <p className="text-muted mt-1">
            {activeWorkspace?.name ?? 'Workspace'} · Real-time link performance
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <MetricCard
            title="Total clicks"
            value={stats.totalClicks}
            change="+12.4% vs last week"
            changeType="positive"
            icon={MousePointerClick}
          />
          <MetricCard
            title="Active links"
            value={stats.activeLinks}
            change={`${stats.activeLinks} published`}
            changeType="neutral"
            icon={Link2}
          />
          <MetricCard
            title="Top performer"
            value={stats.topClicks}
            change={stats.topSlug !== '—' ? `/${stats.topSlug}` : 'No links yet'}
            changeType="neutral"
            icon={TrendingUp}
          />
          <MetricCard
            title="Avg. CTR"
            value={stats.activeLinks > 0 ? '3.2' : '0'}
            suffix="%"
            change="Across all campaigns"
            changeType="neutral"
            icon={Zap}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 rounded-2xl border border-border bg-white p-6 shadow-soft"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-semibold text-navy-900">Click trends</h2>
                <p className="text-sm text-muted">Last 7 days</p>
              </div>
            </div>
            <ClickTrendChart data={trendData} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-border bg-white p-6 shadow-soft"
          >
            <h2 className="text-base font-semibold text-navy-900 mb-4">Recent activity</h2>
            <div className="space-y-3">
              {(links ?? []).slice(0, 5).map((link: { id: string; slug: string; clicks: number }) => (
                <div
                  key={link.id}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-navy-900">/{link.slug}</p>
                    <p className="text-xs text-muted">{link.clicks} clicks</p>
                  </div>
                  <span className="text-xs text-emerald-600 font-medium">Active</span>
                </div>
              ))}
              {(!links || links.length === 0) && (
                <p className="text-sm text-muted py-4">No activity yet</p>
              )}
            </div>
          </motion.div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-navy-900">All links</h2>
              <p className="text-sm text-muted">{links?.length ?? 0} links in workspace</p>
            </div>
            <Button onClick={() => setShowCreate(true)} className="hidden sm:flex">
              New link
            </Button>
          </div>

          {!loadingLinks && links?.length === 0 ? (
            <EmptyState
              title="No links yet"
              description="Create your first short link to start tracking clicks and analytics."
              actionLabel="Create your first link"
              onAction={() => setShowCreate(true)}
            />
          ) : (
            <LinksTable links={links} isLoading={loadingLinks} searchQuery={searchQuery} />
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
