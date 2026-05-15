import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function useGsapLanding(containerRef: React.RefObject<HTMLElement | null>) {
  const ctxRef = useRef<gsap.Context | null>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    ctxRef.current = gsap.context(() => {
      // Hero entrance
      gsap.from('.hero-eyebrow', {
        y: 20,
        opacity: 0,
        duration: 0.6,
        ease: 'power3.out',
      })
      gsap.from('.hero-gradient-heading', {
        y: 70,
        opacity: 0,
        duration: 0.9,
        ease: 'power3.out',
        delay: 0.15,
      })
      gsap.from('.hero-sub', {
        y: 30,
        opacity: 0,
        duration: 0.7,
        ease: 'power2.out',
        delay: 0.35,
      })
      gsap.from('.hero-cta', {
        y: 24,
        opacity: 0,
        stagger: 0.08,
        duration: 0.6,
        ease: 'power2.out',
        delay: 0.5,
      })
      gsap.from('.hero-mockup', {
        y: 80,
        opacity: 0,
        scale: 0.96,
        duration: 1.1,
        ease: 'power3.out',
        delay: 0.25,
      })
      gsap.from('.float-card', {
        y: 40,
        opacity: 0,
        stagger: 0.12,
        duration: 0.8,
        ease: 'power2.out',
        delay: 0.65,
      })

      // Floating cards parallax
      gsap.to('.float-card-1', {
        y: -50,
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero-section',
          start: 'top top',
          end: 'bottom top',
          scrub: 1.2,
        },
      })
      gsap.to('.float-card-2', {
        y: -30,
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero-section',
          start: 'top top',
          end: 'bottom top',
          scrub: 1.5,
        },
      })

      // Horizontal feature scroll (pinned)
      const track = el.querySelector('.features-track') as HTMLElement | null
      const pinSection = el.querySelector('.features-pin')
      if (track && pinSection) {
        const getScroll = () => Math.max(0, track.scrollWidth - window.innerWidth + 80)
        gsap.to(track, {
          x: () => -getScroll(),
          ease: 'none',
          scrollTrigger: {
            trigger: pinSection,
            pin: true,
            scrub: 1,
            end: () => `+=${getScroll()}`,
            invalidateOnRefresh: true,
          },
        })
      }

      // Section reveals
      gsap.utils.toArray<HTMLElement>(el.querySelectorAll('.reveal-up')).forEach((section) => {
        gsap.from(section, {
          y: 48,
          opacity: 0,
          duration: 0.85,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 88%',
            toggleActions: 'play none none none',
          },
        })
      })

      // Big headline word stagger
      gsap.utils.toArray<HTMLElement>(el.querySelectorAll('.headline-word')).forEach((word) => {
        gsap.from(word, {
          y: 80,
          opacity: 0,
          rotateX: -12,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: word.closest('.big-headline') || word,
            start: 'top 85%',
          },
        })
      })

      // Stat bars grow
      gsap.utils.toArray<HTMLElement>(el.querySelectorAll('.stat-bar-fill')).forEach((bar) => {
        const w = bar.dataset.width || '0'
        gsap.fromTo(
          bar,
          { width: '0%' },
          {
            width: `${w}%`,
            duration: 1,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: bar,
              start: 'top 90%',
            },
          },
        )
      })

      // Stories cards initial state handled by carousel component
    }, el)

    return () => {
      ctxRef.current?.revert()
      ScrollTrigger.getAll().forEach((t) => t.kill())
    }
  }, [containerRef])
}
