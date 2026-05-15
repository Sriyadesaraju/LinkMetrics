import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link2, Sparkles, Clock, Tag, Globe } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { UTMBuilder } from '@/components/UTMBuilder'
import { useCreateLink } from '@/lib/hooks'
import { cn } from '@/lib/utils'

interface CreateLinkDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateLinkDialog({ open, onOpenChange }: CreateLinkDialogProps) {
  const [urlInput, setUrlInput] = useState('')
  const [slugInput, setSlugInput] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [finalUrl, setFinalUrl] = useState('')
  const [activeTab, setActiveTab] = useState('destination')

  const { mutate: createLink, isPending } = useCreateLink()

  const urlToShorten = finalUrl || urlInput
  const isValidUrl = (() => {
    try {
      new URL(urlInput)
      return true
    } catch {
      return urlInput.length === 0
    }
  })()

  const previewSlug = slugInput || 'your-link'
  const baseShort = import.meta.env.VITE_SHORT_URL || 'linkmetrics.co'

  const reset = () => {
    setUrlInput('')
    setSlugInput('')
    setExpiresAt('')
    setFinalUrl('')
    setActiveTab('destination')
  }

  const handleCreate = () => {
    if (!urlToShorten) return
    createLink(
      {
        originalUrl: urlToShorten,
        customSlug: slugInput || undefined,
        expiresAt: expiresAt || undefined,
      },
      {
        onSuccess: () => {
          reset()
          onOpenChange(false)
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl overflow-y-auto max-h-[90vh] sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent-muted">
              <Link2 className="h-4 w-4 text-accent" />
            </div>
            Create short link
          </DialogTitle>
          <DialogDescription>
            Shorten, brand, and track your URL with UTM parameters.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="px-6 pb-6">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="destination" className="gap-1.5">
              <Globe className="h-3.5 w-3.5" />
              URL
            </TabsTrigger>
            <TabsTrigger value="utm" className="gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              UTM
            </TabsTrigger>
            <TabsTrigger value="advanced" className="gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Advanced
            </TabsTrigger>
          </TabsList>

          <TabsContent value="destination" className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium text-navy-900">Destination URL</label>
              <Input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/your-page"
                className={cn('mt-1.5', !isValidUrl && urlInput && 'border-red-300 focus:ring-red-200')}
              />
              {!isValidUrl && urlInput && (
                <p className="text-xs text-red-500 mt-1">Enter a valid URL including https://</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-navy-900 flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-muted" />
                Custom slug
                <span className="text-muted font-normal">(optional)</span>
              </label>
              <div className="mt-1.5 flex items-center rounded-xl border border-border bg-surface overflow-hidden focus-within:ring-2 focus-within:ring-accent/30">
                <span className="px-3 text-sm text-muted bg-surface border-r border-border py-2.5">
                  {baseShort}/
                </span>
                <input
                  value={slugInput}
                  onChange={(e) => setSlugInput(e.target.value.replace(/[^a-zA-Z0-9-_]/g, ''))}
                  placeholder="my-campaign"
                  className="flex-1 px-3 py-2.5 text-sm bg-transparent outline-none"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="utm" className="mt-4">
            <UTMBuilder baseUrl={urlInput} onChange={setFinalUrl} />
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium text-navy-900">Expiration date</label>
              <p className="text-xs text-muted mt-0.5">Link stops redirecting after this date</p>
              <Input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="mt-1.5"
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Preview */}
        <AnimatePresence>
          {urlInput && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mx-6 mb-4 rounded-xl border border-border bg-surface p-4"
            >
              <p className="text-xs font-medium text-muted uppercase tracking-wide mb-2">Preview</p>
              <p className="text-xs text-muted truncate mb-1">{urlToShorten}</p>
              <p className="text-sm font-mono font-medium text-accent">
                {baseShort}/{previewSlug}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-2 px-6 pb-6">
          <Button variant="secondary" className="flex-1" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleCreate}
            disabled={isPending || !urlToShorten || (!isValidUrl && !finalUrl)}
          >
            {isPending ? 'Creating...' : 'Create link'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
