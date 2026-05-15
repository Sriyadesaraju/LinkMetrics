import { useState } from 'react'
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
      <DialogContent className="max-w-xl sm:max-w-xl">
        <DialogHeader className="shrink-0 pr-10">
          <DialogTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent-muted">
              <Link2 className="h-4 w-4 text-accent" />
            </div>
            <span className="min-w-0">Create short link</span>
          </DialogTitle>
          <DialogDescription>
            Shorten, brand, and track your URL with UTM parameters.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex w-full min-w-0 flex-col px-6"
          >
            <TabsList className="grid h-auto w-full min-w-0 grid-cols-3 gap-1 p-1">
              <TabsTrigger value="destination" className="gap-1">
                <Globe className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">URL</span>
              </TabsTrigger>
              <TabsTrigger value="utm" className="gap-1">
                <Sparkles className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">UTM</span>
              </TabsTrigger>
              <TabsTrigger value="advanced" className="gap-1">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Advanced</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="destination" className="mt-4 min-w-0 space-y-4 overflow-hidden">
              <div className="min-w-0">
                <label className="text-sm font-medium text-navy-900">Destination URL</label>
                <Input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/your-page"
                  className={cn(
                    'mt-1.5',
                    !isValidUrl && urlInput && 'border-red-300 focus:ring-red-200',
                  )}
                />
                {!isValidUrl && urlInput && (
                  <p className="text-xs text-red-500 mt-1">Enter a valid URL including https://</p>
                )}
              </div>

              <div className="min-w-0">
                <label className="text-sm font-medium text-navy-900 flex items-center gap-1.5 flex-wrap">
                  <Tag className="h-3.5 w-3.5 text-muted shrink-0" />
                  Custom slug
                  <span className="text-muted font-normal">(optional)</span>
                </label>
                <div className="mt-1.5 flex min-w-0 w-full items-stretch rounded-xl border border-border bg-surface overflow-hidden focus-within:ring-2 focus-within:ring-accent/30">
                  <span className="shrink-0 max-w-[45%] truncate border-r border-border bg-surface px-2 sm:px-3 py-2.5 text-xs sm:text-sm text-muted">
                    {baseShort}/
                  </span>
                  <input
                    value={slugInput}
                    onChange={(e) => setSlugInput(e.target.value.replace(/[^a-zA-Z0-9-_]/g, ''))}
                    placeholder="my-campaign"
                    className="min-w-0 flex-1 w-0 px-2 sm:px-3 py-2.5 text-sm bg-transparent outline-none"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="utm" className="mt-4 min-w-0 overflow-hidden">
              <UTMBuilder baseUrl={urlInput} onChange={setFinalUrl} />
            </TabsContent>

            <TabsContent value="advanced" className="mt-4 min-w-0 space-y-4 overflow-hidden">
              <div className="min-w-0">
                <label className="text-sm font-medium text-navy-900">Expiration date</label>
                <p className="text-xs text-muted mt-0.5">Link stops redirecting after this date</p>
                <Input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="mt-1.5 max-w-full"
                />
              </div>
            </TabsContent>
          </Tabs>

          {urlInput && (
            <div className="mx-6 mt-4 min-w-0 overflow-hidden rounded-xl border border-border bg-surface p-4">
              <p className="text-xs font-medium text-muted uppercase tracking-wide mb-2">Preview</p>
              <p className="text-xs text-muted break-all mb-1">{urlToShorten}</p>
              <p className="text-sm font-mono font-medium text-accent break-all">
                {baseShort}/{previewSlug}
              </p>
            </div>
          )}
        </div>

        <div className="flex shrink-0 gap-2 border-t border-border bg-white px-6 py-4">
          <Button variant="secondary" className="flex-1 min-w-0" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="flex-1 min-w-0"
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
