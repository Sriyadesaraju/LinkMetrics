import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useUTMSuggest } from '@/lib/hooks'
import { cn } from '@/lib/utils'

interface UTMParams {
  source: string
  medium: string
  campaign: string
  content: string
  term: string
}

interface Props {
  baseUrl: string
  onChange: (finalUrl: string) => void
}

const FIELDS: { key: keyof UTMParams; label: string; placeholder: string }[] = [
  { key: 'source', label: 'Source', placeholder: 'google, newsletter' },
  { key: 'medium', label: 'Medium', placeholder: 'cpc, email, social' },
  { key: 'campaign', label: 'Campaign', placeholder: 'summer-sale-2026' },
  { key: 'content', label: 'Content', placeholder: 'hero-banner' },
  { key: 'term', label: 'Term', placeholder: 'running+shoes' },
]

const SUGGESTION_CHIPS = [
  { source: 'google', medium: 'cpc', campaign: 'brand-search' },
  { source: 'linkedin', medium: 'social', campaign: 'b2b-launch' },
  { source: 'newsletter', medium: 'email', campaign: 'weekly-digest' },
]

export function UTMBuilder({ baseUrl, onChange }: Props) {
  const [params, setParams] = useState<UTMParams>({
    source: '',
    medium: '',
    campaign: '',
    content: '',
    term: '',
  })
  const { mutate: suggest, isPending: suggesting } = useUTMSuggest()

  const buildUrl = (updated: UTMParams) => {
    if (!baseUrl) return baseUrl
    try {
      const url = new URL(baseUrl)
      if (updated.source) url.searchParams.set('utm_source', updated.source)
      if (updated.medium) url.searchParams.set('utm_medium', updated.medium)
      if (updated.campaign) url.searchParams.set('utm_campaign', updated.campaign)
      if (updated.content) url.searchParams.set('utm_content', updated.content)
      if (updated.term) url.searchParams.set('utm_term', updated.term)
      return url.toString()
    } catch {
      return baseUrl
    }
  }

  const applyParams = (updated: UTMParams) => {
    setParams(updated)
    onChange(buildUrl(updated))
  }

  const handleChange = (field: keyof UTMParams, value: string) => {
    applyParams({ ...params, [field]: value })
  }

  const handleAISuggest = () => {
    if (!baseUrl) return
    suggest(baseUrl, {
      onSuccess: (data) => {
        applyParams({
          source: data.source ?? '',
          medium: data.medium ?? '',
          campaign: data.campaign ?? '',
          content: data.content ?? '',
          term: data.term ?? '',
        })
      },
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-navy-900">UTM parameters</p>
          <p className="text-xs text-muted">Track campaign performance in analytics</p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={handleAISuggest}
          disabled={!baseUrl || suggesting}
          className="gap-1.5 border-orange-200 bg-accent-muted text-accent-hover hover:bg-orange-100"
        >
          {suggesting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          {suggesting ? 'Analyzing...' : 'AI Suggest'}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {SUGGESTION_CHIPS.map((chip) => (
          <button
            key={chip.campaign}
            type="button"
            onClick={() => applyParams({ ...params, ...chip, content: '', term: '' })}
            className={cn(
              'rounded-full border border-border px-3 py-1 text-xs font-medium text-muted',
              'hover:border-accent/40 hover:bg-accent-muted hover:text-accent-hover transition-all',
            )}
          >
            {chip.source} · {chip.medium}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {FIELDS.map(({ key, label, placeholder }) => (
          <div key={key}>
            <label className="text-xs font-medium text-muted mb-1 block">{label}</label>
            <Input
              value={params[key]}
              onChange={(e) => handleChange(key, e.target.value)}
              placeholder={placeholder}
              className="h-9 text-sm"
            />
          </div>
        ))}
      </div>

      <AnimatePresence>
        {baseUrl && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-xl border border-border bg-surface p-3"
          >
            <p className="text-xs font-medium text-muted mb-1.5">Tagged URL preview</p>
            <p className="text-xs font-mono text-navy-700 break-all leading-relaxed">
              {buildUrl(params) || baseUrl}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
