'use client'

import { useState } from 'react'
import Link from 'next/link'

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Main header */}
      <div className="bg-[var(--color-cream)]/95 backdrop-blur-md border-b border-stone-200/60">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <span className="font-serif text-2xl font-normal tracking-tight text-stone-900">
                Fielder
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex md:items-center md:gap-6">
              <NavLink href="/discover">Discover</NavLink>
              <NavLink href="/predictions">Regions</NavLink>
              <NavDropdown label="Learn">
                <DropdownLink href="/explore/produce/cultivars">Cultivars</DropdownLink>
                <DropdownLink href="/explore/produce/calendar">Harvest Calendar</DropdownLink>
                <DropdownLink href="/explore/meat/beef">Beef Profiles</DropdownLink>
                <DropdownLink href="/explore/brands">Brands</DropdownLink>
              </NavDropdown>
              <NavLink href="/about">About</NavLink>
            </div>

            {/* Desktop CTA */}
            <div className="hidden md:flex md:items-center md:gap-4">
              <Link
                href="/farm"
                className="rounded-sm bg-[var(--color-accent)] px-5 py-2 text-sm font-medium text-white transition-all hover:bg-[var(--color-accent-dark)] active:scale-[0.98]"
              >
                For Farms
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden inline-flex items-center justify-center rounded-lg p-2 text-stone-600 hover:bg-stone-100 hover:text-stone-900"
            >
              <span className="sr-only">Open menu</span>
              {mobileMenuOpen ? (
                <XIcon className="h-6 w-6" />
              ) : (
                <MenuIcon className="h-6 w-6" />
              )}
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[var(--color-cream)] border-b border-stone-200">
          <div className="px-4 py-4 space-y-1">
            <MobileNavLink href="/discover" onClick={() => setMobileMenuOpen(false)}>
              Discover
            </MobileNavLink>
            <MobileNavLink href="/predictions" onClick={() => setMobileMenuOpen(false)}>
              Regions
            </MobileNavLink>
            <MobileNavLink href="/about" onClick={() => setMobileMenuOpen(false)}>
              Our Story
            </MobileNavLink>
            <div className="pt-4 border-t border-stone-100">
              <Link
                href="/farm"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full rounded-sm bg-[var(--color-accent)] px-4 py-3 text-center text-sm font-medium text-white"
              >
                For Farms
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-3 py-2 font-mono text-xs uppercase tracking-wider text-stone-500 transition-colors hover:text-stone-900"
    >
      {children}
    </Link>
  )
}

function MobileNavLink({
  href,
  onClick,
  children,
}: {
  href: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block rounded-sm px-4 py-3 font-mono text-xs uppercase tracking-wider text-stone-600 hover:bg-stone-100 hover:text-stone-900"
    >
      {children}
    </Link>
  )
}

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function NavDropdown({ label, children }: { label: string; children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button className="px-3 py-2 font-mono text-xs uppercase tracking-wider text-stone-500 transition-colors hover:text-stone-900">
        {label}
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-48 rounded-lg bg-white shadow-lg border border-stone-200 py-2">
          {children}
        </div>
      )}
    </div>
  )
}

function DropdownLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="block px-4 py-2 text-sm text-stone-700 hover:bg-stone-50 hover:text-stone-900 transition-colors"
    >
      {children}
    </Link>
  )
}

export default Header
