import { useRef, useState, useEffect } from 'react'
import gsap from 'gsap'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const STORIES = [
  {
    company: 'GrowthLab',
    title: 'Replaced three tools with one link analytics stack',
    quote: 'LinkMetrics replaced Bitly, spreadsheets, and our UTM builder. Analytics paid for itself in week one.',
    author: 'Sarah K.',
    role: 'Head of Growth',
    gradient: 'from-orange-100 to-amber-50',
  },
  {
    company: 'LaunchPad',
    title: 'AI UTM suggestions save hours every campaign',
    quote: 'We ship campaigns faster. The AI UTM chips are eerily accurate for our industry.',
    author: 'Marcus T.',
    role: 'Marketing Lead',
    gradient: 'from-sky-100 to-blue-50',
  },
  {
    company: 'DevRel Co',
    title: 'Cleanest link analytics UI we have used',
    quote: 'Feels like Linear built a Bitly. Our dev advocates live in the dashboard.',
    author: 'Elena R.',
    role: 'Developer Advocate',
    gradient: 'from-violet-100 to-purple-50',
  },
  {
    company: 'ScaleUp',
    title: 'Workspace collaboration for distributed teams',
    quote: 'Three marketing pods, one workspace. Finally everyone sees the same click data.',
    author: 'James W.',
    role: 'VP Marketing',
    gradient: 'from-emerald-100 to-teal-50',
  },
]

export function StoriesCarousel() {
  const [active, setActive] = useState(1)
  const trackRef = useRef<HTMLDivElement>(null)

  const go = (dir: -1 | 1) => {
    setActive((i) => Math.max(0, Math.min(STORIES.length - 1, i + dir)))
  }

  useEffect(() => {
    const cards = trackRef.current?.querySelectorAll('.story-card')
    if (!cards?.length) return

    gsap.set(cards, { xPercent: -50, left: '50%' })

    cards.forEach((card, i) => {
      const offset = i - active
      const isCenter = offset === 0
      gsap.to(card, {
        x: offset * 280,
        scale: isCenter ? 1 : 0.88,
        opacity: Math.abs(offset) > 1 ? 0.35 : isCenter ? 1 : 0.65,
        zIndex: isCenter ? 10 : 5 - Math.abs(offset),
        duration: 0.55,
        ease: 'power2.out',
      })
    })
  }, [active])

  return (
    <section className="py-24 lg:py-32 bg-white overflow-hidden">
      <div className="reveal-up text-center max-w-3xl mx-auto px-6 mb-14">
        <span className="inline-block rounded-full border border-navy-900/20 px-5 py-2 text-sm font-medium text-navy-900 mb-6">
          Success Stories
        </span>
        <h2 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-navy-900">
          Loved by growth teams
        </h2>
        <p className="mt-4 text-lg text-muted">
          Stories from marketers and startups using LinkMetrics to track every click.
        </p>
      </div>

      <div className="relative h-[420px] max-w-5xl mx-auto px-6">
        <div
          ref={trackRef}
          className="relative flex items-center justify-center h-full"
          style={{ perspective: 1200 }}
        >
          {STORIES.map((story, i) => (
            <article
              key={story.company}
              className={cn(
                'story-card absolute w-[min(100%,320px)] rounded-3xl border border-border bg-white p-6 shadow-card cursor-pointer',
                `bg-linear-to-br ${story.gradient}`,
              )}
              onClick={() => setActive(i)}
            >
              <p className="text-xs font-semibold text-muted uppercase tracking-wide">{story.company}</p>
              <h3 className="mt-2 text-lg font-bold text-navy-900 leading-snug">{story.title}</h3>
              <p className="mt-4 text-sm text-muted leading-relaxed">&ldquo;{story.quote}&rdquo;</p>
              <footer className="mt-6 pt-4 border-t border-border/60">
                <p className="text-sm font-semibold text-navy-900">{story.author}</p>
                <p className="text-xs text-muted">{story.role}</p>
              </footer>
            </article>
          ))}
        </div>

        <div className="flex justify-center gap-3 mt-8">
          <button
            type="button"
            onClick={() => go(-1)}
            disabled={active === 0}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-white hover:bg-surface disabled:opacity-40 transition-colors"
            aria-label="Previous"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            disabled={active === STORIES.length - 1}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-white hover:bg-surface disabled:opacity-40 transition-colors"
            aria-label="Next"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  )
}
