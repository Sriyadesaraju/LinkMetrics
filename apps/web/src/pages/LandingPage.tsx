import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronDown, ArrowRight } from 'lucide-react'
import { LandingNav } from '@/components/landing/LandingNav'
import { HeroSection } from '@/components/landing/HeroSection'
import { HorizontalFeatures } from '@/components/landing/HorizontalFeatures'
import { StoriesCarousel } from '@/components/landing/StoriesCarousel'
import { SectionHeading } from '@/components/landing/SectionHeading'
import { FeatureShowcaseVisual } from '@/components/landing/FeatureShowcaseVisual'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/brand/Logo'
import { useAuthStore } from '@/store/auth.store'
import { useGsapLanding } from '@/hooks/useGsapLanding'
import { cn } from '@/lib/utils'

const TRUSTED = ['Vercel', 'Stripe', 'Linear', 'Notion', 'Shopify', 'Figma']

const FAQ = [
  {
    q: 'How is LinkMetrics different from Bitly?',
    a: 'LinkMetrics combines premium short links with deep analytics, AI-powered UTM suggestions, and workspace collaboration — built for modern growth teams.',
  },
  {
    q: 'Can I use custom domains?',
    a: 'Custom domain support is on our roadmap. Branded slugs and UTM tracking are available today on all plans.',
  },
  {
    q: 'Is my click data real-time?',
    a: 'Yes. Clicks are logged on redirect and appear in your dashboard within seconds.',
  },
  {
    q: 'Do you offer API access?',
    a: 'API access is available for teams. Contact us or check docs after signing up.',
  },
]

const SHOWCASE = [
  {
    tag: 'Dashboard',
    title: 'Boost profits & efficiency',
    desc: 'See real-time costs and clicks per link. Adjust campaigns by viewing performance as it happens.',
    visual: 'dashboard' as const,
  },
  {
    tag: 'Analytics',
    title: 'Real-time insights',
    desc: 'Referrers, devices, geography, and peak traffic — all in one clean workspace.',
    visual: 'analytics' as const,
  },
  {
    tag: 'AI UTM',
    title: 'Smarter campaigns',
    desc: 'Gemini-powered UTM suggestions and one-click chips for faster launches.',
    visual: 'utm' as const,
  },
]

export function LandingPage() {
  const [heroUrl, setHeroUrl] = useState('')
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const navigate = useNavigate()
  const token = useAuthStore((s) => s.token)
  const pageRef = useRef<HTMLDivElement>(null)

  useGsapLanding(pageRef)

  const handleHeroSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (token) {
      navigate('/dashboard', { state: { url: heroUrl } })
    } else {
      navigate('/register', { state: { url: heroUrl } })
    }
  }

  return (
    <div ref={pageRef} className="min-h-screen bg-white">
      <LandingNav />

      <HeroSection
        heroUrl={heroUrl}
        onUrlChange={setHeroUrl}
        onSubmit={handleHeroSubmit}
      />

      {/* Featured on */}
      <section className="py-14 border-y border-border bg-[#fafafa]">
        <p className="text-center text-xs font-semibold text-muted uppercase tracking-[0.2em] mb-8">
          Featured on
        </p>
        <div className="flex flex-wrap justify-center gap-x-14 gap-y-4 px-6 max-w-4xl mx-auto">
          {TRUSTED.map((name) => (
            <span key={name} className="text-navy-900/40 font-display font-bold text-lg">
              {name}
            </span>
          ))}
        </div>
      </section>

      <HorizontalFeatures />

      {/* Control section — MeMate "Streamline" style */}
      <section className="py-24 lg:py-32 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <SectionHeading
            eyebrow="Full control"
            title="Streamline your links and"
            titleAccent="enjoy full visibility"
            description="Track, analyze, and manage every short link in one clear, organized workspace."
          />

          <div className="reveal-up mt-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: 'Total clicks', value: '$24.8K', width: 92 },
              { label: 'Active links', value: '142', width: 78 },
              { label: 'Top referrer', value: 'Google', width: 65 },
              { label: 'Avg. CTR', value: '3.8%', width: 55 },
              { label: 'Countries', value: '47', width: 48 },
              { label: 'AI UTMs built', value: '1.2K', width: 70 },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-border bg-[#fafafa] p-5 hover:shadow-soft transition-shadow"
              >
                <p className="text-sm text-muted">{stat.label}</p>
                <p className="text-2xl font-display font-bold text-navy-900 mt-1">{stat.value}</p>
                <div className="mt-4 h-1.5 rounded-full bg-border overflow-hidden">
                  <div
                    className="stat-bar-fill h-full rounded-full bg-gradient-to-r from-sky-500 to-accent w-0"
                    data-width={stat.width}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Big typographic headline */}
      <section className="py-20 lg:py-28 bg-[#fafafa] overflow-hidden">
        <div className="max-w-5xl mx-auto px-6 text-center reveal-up">
          <h2 className="big-headline font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-navy-900 leading-[1.08]">
            <span className="headline-word block">See and predict</span>
            <span className="headline-word block text-brand-sky mt-2">what&apos;s working.</span>
          </h2>
          <p className="mt-6 text-lg text-muted max-w-2xl mx-auto">
            Zero guesswork on campaign performance. LinkMetrics shows you where clicks come from and which links convert.
          </p>
          <Link to="/register">
            <Button size="lg" className="mt-10 rounded-full h-14 px-10 text-base font-semibold">
              Start free trial
            </Button>
          </Link>
        </div>
      </section>

      {/* Feature showcase cards */}
      <section id="analytics" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <SectionHeading
            eyebrow="LinkMetrics features"
            title="All-in-one"
            titleAccent="link intelligence"
            description="Everything you need to shorten, track, and optimize — without switching tools."
            className="mb-16"
          />
          <div className="space-y-6">
            {SHOWCASE.map((item, i) => (
              <div
                key={item.tag}
                className="reveal-up grid lg:grid-cols-2 gap-8 items-center rounded-3xl border border-border p-8 lg:p-12 bg-[#fafafa] hover:shadow-card transition-shadow duration-500"
              >
                <div className={i % 2 === 1 ? 'lg:order-2' : ''}>
                  <p className="text-sm font-bold text-sky-600 uppercase tracking-wide">{item.tag}</p>
                  <h3 className="mt-2 font-display text-2xl sm:text-3xl font-extrabold text-navy-900">
                    {item.title}
                  </h3>
                  <p className="mt-4 text-muted leading-relaxed">{item.desc}</p>
                </div>
                <div
                  className={`rounded-2xl bg-surface border border-border h-52 lg:h-64 overflow-hidden ${i % 2 === 1 ? 'lg:order-1' : ''}`}
                >
                  <FeatureShowcaseVisual variant={item.visual} className="h-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <StoriesCarousel />

      {/* FAQ */}
      <section id="faq" className="py-24 bg-[#fafafa]">
        <div className="max-w-2xl mx-auto px-6">
          <div className="reveal-up text-center mb-12">
            <p className="text-sm font-semibold text-muted uppercase tracking-widest mb-3">
              We answer your questions
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-navy-900">
              Frequently asked questions
            </h2>
          </div>
          <div className="space-y-3 reveal-up">
            {FAQ.map((item, i) => (
              <div key={i} className="rounded-2xl border border-border bg-white overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between px-6 py-5 text-left text-sm font-semibold text-navy-900 hover:bg-surface/50 transition-colors"
                >
                  {item.q}
                  <ChevronDown
                    className={cn('h-4 w-4 text-muted shrink-0 transition-transform', openFaq === i && 'rotate-180')}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 text-sm text-muted leading-relaxed">{item.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA — MeMate "Take the next step" */}
      <section className="py-24 lg:py-32 bg-white relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'radial-gradient(ellipse 50% 80% at 50% 100%, rgba(56,189,248,0.12), transparent)',
          }}
        />
        <div className="relative max-w-3xl mx-auto px-6 text-center reveal-up">
          <h2 className="font-display text-4xl sm:text-5xl font-extrabold text-navy-900 tracking-tight">
            Take the
            <br />
            <span className="text-brand-sky">next step</span>
          </h2>
          <p className="mt-5 text-lg text-muted">
            Increase campaign clarity. Start tracking every click today.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register">
              <Button
                size="lg"
                className="w-full sm:w-auto h-14 rounded-full px-10 text-base font-semibold bg-navy-900"
              >
                Book a demo
              </Button>
            </Link>
            <Link to="/register">
              <Button
                variant="secondary"
                size="lg"
                className="w-full sm:w-auto h-14 rounded-full px-10 text-base font-semibold border-2"
              >
                Start free trial <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-white py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo linkTo="/" />
          <p className="text-xs text-muted">
            © {new Date().getFullYear()} LinkMetrics. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
