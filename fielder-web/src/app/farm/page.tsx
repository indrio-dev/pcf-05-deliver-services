'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function FarmDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [adminCode, setAdminCode] = useState('')
  const [error, setError] = useState('')

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault()
    // Simple admin code check (in production, this would be server-side)
    if (adminCode === 'fielder2024' || adminCode === process.env.NEXT_PUBLIC_ADMIN_CODE) {
      setIsAuthenticated(true)
      setError('')
    } else {
      setError('Invalid admin code')
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[var(--color-cream)]">
        {/* Header */}
        <header className="border-b border-stone-200 bg-[var(--color-cream)]">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <Link href="/" className="font-serif text-2xl font-normal text-stone-900">
                Fielder
              </Link>
            </div>
          </div>
        </header>

        <main className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4">
          <div className="w-full max-w-md rounded-sm bg-[var(--color-parchment)] p-8 border border-stone-200">
            <p className="font-mono text-xs uppercase tracking-widest text-stone-500 mb-2">
              Farm Portal
            </p>
            <h2 className="font-serif text-2xl font-normal text-stone-900 mb-2">
              Farm Dashboard
            </h2>
            <p className="text-stone-600 mb-6 text-sm">
              Enter your admin code to access the farm dashboard.
            </p>
            <form onSubmit={handleAuth}>
              <input
                type="password"
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value)}
                placeholder="Admin code"
                className="mb-4 w-full rounded-sm border border-stone-300 bg-[var(--color-cream)] px-4 py-3 text-stone-900 placeholder:text-stone-400 focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
              />
              {error && (
                <p className="mb-4 text-sm text-red-700">{error}</p>
              )}
              <button
                type="submit"
                className="w-full rounded-sm bg-[var(--color-accent)] py-3 font-medium text-white hover:bg-[var(--color-accent-dark)] transition-colors"
              >
                Enter Dashboard
              </button>
            </form>
            <p className="mt-4 text-center text-sm text-stone-500">
              Don&apos;t have access?{' '}
              <a href="mailto:farms@fielder.app" className="text-[var(--color-accent)] hover:text-[var(--color-accent-dark)]">
                Contact us
              </a>
            </p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-cream)]">
      {/* Header */}
      <header className="border-b border-stone-200 bg-[var(--color-cream)]">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link href="/" className="font-serif text-2xl font-normal text-stone-900">
              Fielder
            </Link>
            <nav className="flex items-center gap-6">
              <Link
                href="/discover"
                className="font-mono text-xs uppercase tracking-wider text-stone-500 hover:text-stone-900 transition-colors"
              >
                Discover
              </Link>
              <button
                onClick={() => setIsAuthenticated(false)}
                className="font-mono text-xs uppercase tracking-wider text-stone-500 hover:text-stone-900 transition-colors"
              >
                Sign Out
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="font-mono text-xs uppercase tracking-widest text-stone-500 mb-2">
            Farm Portal
          </p>
          <h1 className="font-serif text-3xl font-normal text-stone-900">
            Farm Dashboard
          </h1>
        </div>

        {/* Quick Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-sm bg-[var(--color-parchment)] p-6 border border-stone-200">
            <p className="font-mono text-xs uppercase tracking-wider text-stone-500">Active Crops</p>
            <p className="mt-2 font-serif text-3xl text-stone-900">0</p>
          </div>
          <div className="rounded-sm bg-[var(--color-parchment)] p-6 border border-stone-200">
            <p className="font-mono text-xs uppercase tracking-wider text-stone-500">At Peak</p>
            <p className="mt-2 font-serif text-3xl text-[var(--color-peak)]">0</p>
          </div>
          <div className="rounded-sm bg-[var(--color-parchment)] p-6 border border-stone-200">
            <p className="font-mono text-xs uppercase tracking-wider text-stone-500">Coming Soon</p>
            <p className="mt-2 font-serif text-3xl text-[var(--color-approaching)]">0</p>
          </div>
          <div className="rounded-sm bg-[var(--color-parchment)] p-6 border border-stone-200">
            <p className="font-mono text-xs uppercase tracking-wider text-stone-500">Profile Views</p>
            <p className="mt-2 font-serif text-3xl text-stone-900">--</p>
          </div>
        </div>

        {/* Setup Guide */}
        <div className="rounded-sm bg-[var(--color-sage-light)]/20 p-6 border border-[var(--color-sage)]/30">
          <h2 className="font-serif text-lg font-normal text-stone-900">
            Welcome to Fielder!
          </h2>
          <p className="mt-2 text-stone-600 text-sm">
            To get started, you&apos;ll need to set up your farm profile and add your crops.
            This dashboard is a preview - full farm management features are coming soon.
          </p>
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-sage)]/20 font-mono text-xs text-[var(--color-sage-dark)]">
                1
              </div>
              <span className="text-stone-700 text-sm">Set up your farm profile (name, location, contact)</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-sage)]/20 font-mono text-xs text-[var(--color-sage-dark)]">
                2
              </div>
              <span className="text-stone-700 text-sm">Add your crops (cultivars, rootstocks, tree age)</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-sage)]/20 font-mono text-xs text-[var(--color-sage-dark)]">
                3
              </div>
              <span className="text-stone-700 text-sm">Update availability and pricing when crops are ready</span>
            </div>
          </div>
        </div>

        {/* Coming Soon Features */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-sm bg-[var(--color-parchment)] p-6 border border-stone-200">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-sm bg-stone-100">
              <svg className="h-5 w-5 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="font-serif text-base font-normal text-stone-900">Farm Profile</h3>
            <p className="mt-1 text-sm text-stone-500">
              Create your farm profile with location, contact info, and fulfillment options.
            </p>
            <span className="mt-3 inline-block rounded-sm bg-stone-100 px-2.5 py-1 font-mono text-xs uppercase tracking-wider text-stone-500">
              Coming Soon
            </span>
          </div>

          <div className="rounded-sm bg-[var(--color-parchment)] p-6 border border-stone-200">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-sm bg-stone-100">
              <svg className="h-5 w-5 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
            </div>
            <h3 className="font-serif text-base font-normal text-stone-900">Crop Manager</h3>
            <p className="mt-1 text-sm text-stone-500">
              Add crops with cultivar, rootstock, and tree age for accurate predictions.
            </p>
            <span className="mt-3 inline-block rounded-sm bg-stone-100 px-2.5 py-1 font-mono text-xs uppercase tracking-wider text-stone-500">
              Coming Soon
            </span>
          </div>

          <div className="rounded-sm bg-[var(--color-parchment)] p-6 border border-stone-200">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-sm bg-stone-100">
              <svg className="h-5 w-5 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="font-serif text-base font-normal text-stone-900">Availability</h3>
            <p className="mt-1 text-sm text-stone-500">
              Toggle crop availability, set pricing, and update inventory levels.
            </p>
            <span className="mt-3 inline-block rounded-sm bg-stone-100 px-2.5 py-1 font-mono text-xs uppercase tracking-wider text-stone-500">
              Coming Soon
            </span>
          </div>
        </div>
      </main>
    </div>
  )
}
