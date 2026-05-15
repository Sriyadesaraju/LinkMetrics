import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { Logo } from '@/components/brand/Logo'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const links = [
    { href: '#features', label: 'Features' },
    { href: '#analytics', label: 'Analytics' },
    { href: '#faq', label: 'FAQ' },
  ]

  return (
    <nav
      className={cn(
        'fixed top-0 inset-x-0 z-50 transition-all duration-300',
        scrolled ? 'bg-white/90 backdrop-blur-lg border-b border-border shadow-sm' : 'bg-transparent',
      )}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between h-16 lg:h-[4.5rem] px-6">
        <Logo linkTo="/" />

        <div className="hidden md:flex items-center gap-10 text-sm font-medium text-muted">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="hover:text-navy-900 transition-colors">
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link to="/login">
            <Button variant="ghost" className="font-medium text-navy-900">
              Sign in
            </Button>
          </Link>
          <Link to="/register">
            <Button className="rounded-full px-6 font-semibold">Get started</Button>
          </Link>
        </div>

        <button
          type="button"
          className="md:hidden p-2 text-navy-900"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-border bg-white px-6 py-4 space-y-3">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="block py-2 text-navy-900 font-medium"
              onClick={() => setMenuOpen(false)}
            >
              {l.label}
            </a>
          ))}
          <Link to="/login" className="block py-2" onClick={() => setMenuOpen(false)}>
            Sign in
          </Link>
          <Link to="/register" onClick={() => setMenuOpen(false)}>
            <Button className="w-full rounded-full">Get started</Button>
          </Link>
        </div>
      )}
    </nav>
  )
}
