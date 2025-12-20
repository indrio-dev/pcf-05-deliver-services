'use client'

import { useState } from 'react'
import Link from 'next/link'
import { JournalFooter } from '@/components/JournalFooter'

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
      <div className="min-h-screen bg-[var(--color-manila)]">
        {/* Header */}
        <header className="border-b-2 border-stone-300 bg-[var(--color-manila)]">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <Link href="/" className="font-typewriter text-2xl text-stone-800">
                Fielder
              </Link>
            </div>
          </div>
        </header>

        <main className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4">
          <div className="w-full max-w-md border-2 border-stone-300 bg-[var(--color-manila)] p-8">
            <p className="font-typewriter text-xs uppercase tracking-widest text-stone-500 mb-2">
              Farm Portal
            </p>
            <h2 className="font-typewriter text-2xl text-stone-800 mb-2">
              Farm Dashboard
            </h2>
            <p className="font-typewriter text-stone-600 mb-6 text-sm">
              Enter your admin code to access the farm dashboard.
            </p>
            <form onSubmit={handleAuth}>
              <input
                type="password"
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value)}
                placeholder="Admin code"
                className="mb-4 w-full border-2 border-stone-300 bg-[var(--color-manila)] px-4 py-3 font-typewriter text-stone-800 placeholder:text-stone-400 focus:border-stone-500 focus:outline-none"
              />
              {error && (
                <p className="mb-4 font-typewriter text-sm text-red-700">{error}</p>
              )}
              <button
                type="submit"
                className="w-full border-2 border-stone-800 bg-stone-800 py-3 font-typewriter text-sm uppercase tracking-wider text-[var(--color-manila)] hover:bg-stone-700 transition-colors"
              >
                Enter Dashboard
              </button>
            </form>
            <p className="mt-4 text-center font-typewriter text-sm text-stone-500">
              Don&apos;t have access?{' '}
              <a href="mailto:farms@fielder.app" className="text-stone-800 hover:text-stone-600 underline">
                Contact us
              </a>
            </p>
          </div>
        </main>

        <JournalFooter />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-manila)]">
      {/* Header */}
      <header className="border-b-2 border-stone-300 bg-[var(--color-manila)]">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link href="/" className="font-typewriter text-2xl text-stone-800">
              Fielder
            </Link>
            <nav className="flex items-center gap-6">
              <Link
                href="/discover"
                className="font-typewriter text-xs uppercase tracking-wider text-stone-500 hover:text-stone-800 transition-colors"
              >
                Discover
              </Link>
              <button
                onClick={() => setIsAuthenticated(false)}
                className="font-typewriter text-xs uppercase tracking-wider text-stone-500 hover:text-stone-800 transition-colors"
              >
                Sign Out
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="font-typewriter text-xs uppercase tracking-widest text-stone-500 mb-2">
            Farm Portal
          </p>
          <h1 className="font-typewriter text-3xl text-stone-800">
            Farm Dashboard
          </h1>
        </div>

        {/* Quick Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="border-2 border-stone-300 bg-[var(--color-manila)] p-6">
            <p className="font-typewriter text-xs uppercase tracking-wider text-stone-500">Active Crops</p>
            <p className="mt-2 font-typewriter text-3xl text-stone-800">0</p>
          </div>
          <div className="border-2 border-stone-300 bg-[var(--color-manila)] p-6">
            <p className="font-typewriter text-xs uppercase tracking-wider text-stone-500">At Peak</p>
            <p className="mt-2 font-typewriter text-3xl text-green-700">0</p>
          </div>
          <div className="border-2 border-stone-300 bg-[var(--color-manila)] p-6">
            <p className="font-typewriter text-xs uppercase tracking-wider text-stone-500">Coming Soon</p>
            <p className="mt-2 font-typewriter text-3xl text-amber-700">0</p>
          </div>
          <div className="border-2 border-stone-300 bg-[var(--color-manila)] p-6">
            <p className="font-typewriter text-xs uppercase tracking-wider text-stone-500">Profile Views</p>
            <p className="mt-2 font-typewriter text-3xl text-stone-800">--</p>
          </div>
        </div>

        {/* Setup Guide */}
        <div className="border-2 border-stone-300 bg-[var(--color-manila)] p-6">
          <h2 className="font-typewriter text-lg text-stone-800">
            Welcome to Fielder!
          </h2>
          <p className="mt-2 font-typewriter text-stone-600 text-sm">
            To get started, you&apos;ll need to set up your farm profile and add your crops.
            This dashboard is a preview - full farm management features are coming soon.
          </p>
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-6 w-6 items-center justify-center border border-stone-400 font-typewriter text-xs text-stone-600">
                1
              </div>
              <span className="font-typewriter text-stone-700 text-sm">Set up your farm profile (name, location, contact)</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-6 w-6 items-center justify-center border border-stone-400 font-typewriter text-xs text-stone-600">
                2
              </div>
              <span className="font-typewriter text-stone-700 text-sm">Add your crops (cultivars, rootstocks, tree age)</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-6 w-6 items-center justify-center border border-stone-400 font-typewriter text-xs text-stone-600">
                3
              </div>
              <span className="font-typewriter text-stone-700 text-sm">Update availability and pricing when crops are ready</span>
            </div>
          </div>
        </div>

        {/* Coming Soon Features */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="border-2 border-stone-300 bg-[var(--color-manila)] p-6">
            <div className="mb-4 flex h-10 w-10 items-center justify-center border border-stone-300">
              <svg className="h-5 w-5 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="font-typewriter text-base text-stone-800">Farm Profile</h3>
            <p className="mt-1 font-typewriter text-sm text-stone-500">
              Create your farm profile with location, contact info, and fulfillment options.
            </p>
            <span className="mt-3 inline-block border border-stone-300 px-2.5 py-1 font-typewriter text-xs uppercase tracking-wider text-stone-500">
              Coming Soon
            </span>
          </div>

          <div className="border-2 border-stone-300 bg-[var(--color-manila)] p-6">
            <div className="mb-4 flex h-10 w-10 items-center justify-center border border-stone-300">
              <svg className="h-5 w-5 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
            </div>
            <h3 className="font-typewriter text-base text-stone-800">Crop Manager</h3>
            <p className="mt-1 font-typewriter text-sm text-stone-500">
              Add crops with cultivar, rootstock, and tree age for accurate predictions.
            </p>
            <span className="mt-3 inline-block border border-stone-300 px-2.5 py-1 font-typewriter text-xs uppercase tracking-wider text-stone-500">
              Coming Soon
            </span>
          </div>

          <div className="border-2 border-stone-300 bg-[var(--color-manila)] p-6">
            <div className="mb-4 flex h-10 w-10 items-center justify-center border border-stone-300">
              <svg className="h-5 w-5 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="font-typewriter text-base text-stone-800">Availability</h3>
            <p className="mt-1 font-typewriter text-sm text-stone-500">
              Toggle crop availability, set pricing, and update inventory levels.
            </p>
            <span className="mt-3 inline-block border border-stone-300 px-2.5 py-1 font-typewriter text-xs uppercase tracking-wider text-stone-500">
              Coming Soon
            </span>
          </div>
        </div>
      </main>

      <JournalFooter />
    </div>
  )
}
