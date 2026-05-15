import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Copy,
  Check,
  BarChart3,
  ArrowUpDown,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { getFaviconUrl, getDomain, formatNumber } from '@/lib/utils'

interface Link {
  id: string
  slug: string
  shortUrl: string
  originalUrl: string
  clicks: number
  createdAt: string
  expiresAt?: string | null
}

interface LinksTableProps {
  links?: Link[]
  isLoading?: boolean
  searchQuery?: string
}

type SortKey = 'clicks' | 'createdAt' | 'originalUrl'

export function LinksTable({ links = [], isLoading, searchQuery = '' }: LinksTableProps) {
  const navigate = useNavigate()
  const [copied, setCopied] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>('createdAt')
  const [sortAsc, setSortAsc] = useState(false)

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase()
    let result = links.filter(
      (l) =>
        l.originalUrl.toLowerCase().includes(q) ||
        l.shortUrl.toLowerCase().includes(q) ||
        l.slug.toLowerCase().includes(q),
    )
    result = [...result].sort((a, b) => {
      let cmp = 0
      if (sortKey === 'clicks') cmp = a.clicks - b.clicks
      else if (sortKey === 'createdAt')
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      else cmp = a.originalUrl.localeCompare(b.originalUrl)
      return sortAsc ? cmp : -cmp
    })
    return result
  }, [links, searchQuery, sortKey, sortAsc])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc)
    else {
      setSortKey(key)
      setSortAsc(false)
    }
  }

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url)
    setCopied(url)
    setTimeout(() => setCopied(null), 2000)
  }

  const isExpired = (expiresAt?: string | null) =>
    expiresAt ? new Date(expiresAt) < new Date() : false

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-white overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 border-b border-border last:border-0">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border bg-white overflow-hidden shadow-soft">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface/50">
              <th className="text-left px-4 py-3 font-medium text-muted w-[40%]">
                <button
                  type="button"
                  onClick={() => toggleSort('originalUrl')}
                  className="flex items-center gap-1 hover:text-navy-900 transition-colors"
                >
                  Link <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="text-left px-4 py-3 font-medium text-muted hidden md:table-cell">
                Short URL
              </th>
              <th className="text-left px-4 py-3 font-medium text-muted">
                <button
                  type="button"
                  onClick={() => toggleSort('clicks')}
                  className="flex items-center gap-1 hover:text-navy-900 transition-colors"
                >
                  Clicks <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="text-left px-4 py-3 font-medium text-muted hidden lg:table-cell">
                <button
                  type="button"
                  onClick={() => toggleSort('createdAt')}
                  className="flex items-center gap-1 hover:text-navy-900 transition-colors"
                >
                  Created <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((link, i) => (
              <motion.tr
                key={link.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="group hover:bg-surface/60 transition-colors"
              >
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={getFaviconUrl(link.originalUrl)}
                      alt=""
                      className="h-8 w-8 rounded-lg border border-border bg-white shrink-0"
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                    <div className="min-w-0">
                      <p className="font-medium text-navy-900 truncate max-w-[200px] lg:max-w-xs">
                        {getDomain(link.originalUrl)}
                      </p>
                      <p className="text-xs text-muted truncate max-w-[200px] lg:max-w-sm">
                        {link.originalUrl}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5 hidden md:table-cell">
                  <a
                    href={link.shortUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-sm text-accent hover:underline flex items-center gap-1"
                  >
                    /{link.slug}
                    <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                </td>
                <td className="px-4 py-3.5">
                  <span className="font-semibold text-navy-900">{formatNumber(link.clicks)}</span>
                </td>
                <td className="px-4 py-3.5 hidden lg:table-cell">
                  <div className="flex flex-col gap-1">
                    <span className="text-muted text-xs">
                      {new Date(link.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    {link.expiresAt && (
                      <Badge
                        variant={isExpired(link.expiresAt) ? 'secondary' : 'success'}
                        className="w-fit text-[10px]"
                      >
                        {isExpired(link.expiresAt) ? 'Expired' : 'Active'}
                      </Badge>
                    )}
                    {!link.expiresAt && <Badge variant="success" className="w-fit text-[10px]">Active</Badge>}
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleCopy(link.shortUrl)}
                    >
                      {copied === link.shortUrl ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1.5 text-xs"
                      onClick={() => navigate(`/analytics/${link.slug}`)}
                    >
                      <BarChart3 className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Analytics</span>
                    </Button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && (
        <p className="text-center text-sm text-muted py-12">No links match your search.</p>
      )}
    </div>
  )
}
