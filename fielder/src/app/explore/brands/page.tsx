'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { JournalHeader } from '@/components/JournalHeader'
import { JournalFooter } from '@/components/JournalFooter'
import { ALL_BRANDS, type Brand, type BrandTier } from '@/lib/constants/brands'

// Tier display config
const TIER_CONFIG: Record<BrandTier, { label: string; color: string }> = {
  ultra_premium: { label: 'Ultra Premium', color: 'bg-purple-100 text-purple-800 border-purple-300' },
  premium: { label: 'Premium', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  mid_market: { label: 'Mid-Market', color: 'bg-gray-100 text-gray-800 border-gray-300' },
  value: { label: 'Value', color: 'bg-green-100 text-green-800 border-green-300' },
  commodity: { label: 'Commodity', color: 'bg-stone-100 text-stone-800 border-stone-300' },
}

export default function BrandsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>()
    ALL_BRANDS.forEach(brand => {
      brand.productCategories.forEach(cat => cats.add(cat))
    })
    return ['all', ...Array.from(cats).sort()]
  }, [])

  // Filter brands
  const filteredBrands = useMemo(() => {
    return ALL_BRANDS.filter(brand => {
      // Search filter
      const matchesSearch = searchQuery === '' ||
        brand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        brand.parentCompany?.toLowerCase().includes(searchQuery.toLowerCase())

      // Category filter
      const matchesCategory = selectedCategory === 'all' ||
        brand.productCategories.includes(selectedCategory as any)

      return matchesSearch && matchesCategory
    })
  }, [searchQuery, selectedCategory])

  return (
    <div className="min-h-screen bg-[var(--color-manila)]">
      <JournalHeader />

      {/* Hero Section */}
      <section className="border-b border-stone-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="max-w-3xl">
            <p className="font-mono text-xs uppercase tracking-widest text-[var(--color-accent)] mb-3">
              Competitive Intelligence
            </p>
            <h1 className="font-serif text-4xl sm:text-5xl text-stone-900 leading-tight">
              Brand Quality Database
            </h1>
            <p className="mt-4 font-serif text-xl text-stone-600 leading-relaxed">
              We research the claims so you don&apos;t have to.
            </p>
            <p className="mt-3 font-serif text-base text-stone-500 leading-relaxed">
              Investigative analysis of what brands say, what they don&apos;t say, and what the data reveals.
            </p>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="border-b border-stone-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search brands..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-stone-300 bg-white font-mono text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]"
              />
            </div>

            {/* Category Filter */}
            <div className="sm:w-48">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 border border-stone-300 bg-white font-mono text-sm text-stone-900 focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-4">
            <p className="font-mono text-xs text-stone-500 uppercase tracking-wider">
              {filteredBrands.length} {filteredBrands.length === 1 ? 'brand' : 'brands'} found
            </p>
          </div>
        </div>
      </section>

      {/* Brand Cards */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          {filteredBrands.map(brand => (
            <BrandCard key={brand.id} brand={brand} />
          ))}

          {filteredBrands.length === 0 && (
            <div className="text-center py-16">
              <p className="font-serif text-lg text-stone-600">No brands found matching your criteria.</p>
              <button
                onClick={() => {
                  setSearchQuery('')
                  setSelectedCategory('all')
                }}
                className="mt-4 font-mono text-sm text-[var(--color-accent)] hover:underline uppercase tracking-wider"
              >
                Reset filters
              </button>
            </div>
          )}
        </div>
      </main>

      <JournalFooter />
    </div>
  )
}

function BrandCard({ brand }: { brand: Brand }) {
  const tierConfig = TIER_CONFIG[brand.tier]
  const isSnakeRiver = brand.id === 'brand_snake_river_farms'
  const hasLabTests = brand.labTests && brand.labTests.length > 0

  return (
    <article className={`bg-white border-2 shadow-md ${isSnakeRiver ? 'border-red-500' : 'border-stone-300'}`}>
      {/* Header */}
      <div className="border-b border-stone-200 bg-stone-50 p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="font-serif text-2xl text-stone-900">
                {brand.name}
              </h2>
              <span className={`font-mono text-xs uppercase tracking-wider px-2 py-1 border ${tierConfig.color}`}>
                {tierConfig.label}
              </span>
              {hasLabTests && (
                <span className="font-mono text-xs uppercase tracking-wider px-2 py-1 bg-[var(--color-accent)] text-white">
                  Lab Tested
                </span>
              )}
            </div>
            {brand.parentCompany && (
              <p className="mt-1 font-mono text-sm text-stone-500">
                {brand.parentCompany}
              </p>
            )}
            <div className="mt-2 flex gap-2 flex-wrap">
              {brand.productCategories.map(cat => (
                <span key={cat} className="font-mono text-xs text-stone-600 bg-stone-100 px-2 py-1">
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </span>
              ))}
            </div>
          </div>

          {brand.websiteUrl && (
            <a
              href={brand.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs text-[var(--color-accent)] hover:underline uppercase tracking-wider"
            >
              Visit Site →
            </a>
          )}
        </div>

        {/* Snake River Special Callout */}
        {isSnakeRiver && (
          <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-500">
            <p className="font-serif text-lg text-red-900 font-semibold">
              Most Expensive ≠ Healthiest
            </p>
            <p className="mt-1 font-serif text-sm text-red-800">
              Premium Wagyu requires extended grain feeding for marbling. Expected omega ratio: 20-26:1 (worse than commodity beef).
            </p>
          </div>
        )}
      </div>

      {/* Body - Two Column Layout */}
      <div className="grid md:grid-cols-2 gap-6 p-6">
        {/* Left Column - Claims & Silences */}
        <div className="space-y-6">
          {/* ShareProfile Assignment */}
          <section>
            <h3 className="font-mono text-xs uppercase tracking-widest text-stone-500 mb-3">
              Quality Profile
            </h3>
            <div className="bg-stone-50 border border-stone-200 p-4">
              <div className="font-mono text-sm text-stone-900">
                Profile: <span className="font-semibold">{brand.assignedShareProfileId}</span>
              </div>
              {brand.shareProfileConfidence && (
                <div className="mt-1 font-mono text-xs text-stone-600">
                  Confidence: {brand.shareProfileConfidence}
                </div>
              )}
              <p className="mt-3 font-serif text-sm text-stone-700 leading-relaxed">
                {brand.shareProfileReasoning}
              </p>
            </div>
          </section>

          {/* Claims Found */}
          <section>
            <h3 className="font-mono text-xs uppercase tracking-widest text-green-700 mb-3 flex items-center gap-2">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Claims Found
            </h3>
            <ul className="space-y-2">
              {brand.explicitClaims.map((claim, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <svg className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    <p className="font-serif text-sm text-stone-900">{claim.claim}</p>
                    <p className="font-mono text-xs text-stone-500 mt-1">
                      Source: {claim.location}
                      {claim.notes && ` • ${claim.notes}`}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Silences - What They DON'T Say */}
          {brand.silences.length > 0 && (
            <section>
              <h3 className="font-mono text-xs uppercase tracking-widest text-amber-700 mb-3 flex items-center gap-2">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                What They Don&apos;t Say
              </h3>
              <ul className="space-y-3">
                {brand.silences.map((silence, idx) => (
                  <li key={idx} className={`border-l-4 pl-3 py-2 ${
                    silence.significance === 'high' ? 'border-red-500 bg-red-50' :
                    silence.significance === 'medium' ? 'border-amber-500 bg-amber-50' :
                    'border-stone-400 bg-stone-50'
                  }`}>
                    <p className="font-serif text-sm font-semibold text-stone-900">{silence.topic}</p>
                    <p className="font-serif text-sm text-stone-700 mt-1 italic">
                      &ldquo;{silence.implication}&rdquo;
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* Right Column - Assessment & Flags */}
        <div className="space-y-6">
          {/* Fielder's Assessment */}
          <section>
            <h3 className="font-mono text-xs uppercase tracking-widest text-[var(--color-accent)] mb-3">
              Fielder&apos;s Assessment
            </h3>
            <div className="border-2 border-stone-300 bg-[var(--color-manila)] p-4">
              <p className="font-typewriter text-base text-stone-800 leading-relaxed">
                {brand.fielderAssessment}
              </p>
            </div>
          </section>

          {/* Lab Test Results */}
          {hasLabTests && (
            <section>
              <h3 className="font-mono text-xs uppercase tracking-widest text-purple-700 mb-3 flex items-center gap-2">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                Lab Test Results
              </h3>
              <div className="space-y-3">
                {brand.labTests!.map((test, idx) => (
                  <div key={idx} className="bg-purple-50 border border-purple-200 p-4">
                    <div className="flex items-baseline justify-between">
                      <span className="font-mono text-sm text-stone-900">{test.metric.replace(/_/g, ' ')}</span>
                      <span className="font-mono text-lg font-semibold text-purple-900">
                        {test.value}{test.unit || ''}
                      </span>
                    </div>
                    <div className="mt-2 font-mono text-xs text-stone-600">
                      {test.labName} • {new Date(test.testDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </div>
                    {test.notes && (
                      <p className="mt-2 font-serif text-sm text-stone-700">
                        {test.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Red Flags */}
          {brand.redFlags.length > 0 && (
            <section>
              <h3 className="font-mono text-xs uppercase tracking-widest text-red-700 mb-3 flex items-center gap-2">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                Red Flags
              </h3>
              <ul className="space-y-2">
                {brand.redFlags.map((flag, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-red-900">
                    <span className="text-red-600 font-bold">⚠</span>
                    <p className="font-serif text-sm">{flag}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Green Flags */}
          {brand.greenFlags.length > 0 && (
            <section>
              <h3 className="font-mono text-xs uppercase tracking-widest text-green-700 mb-3 flex items-center gap-2">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Green Flags
              </h3>
              <ul className="space-y-2">
                {brand.greenFlags.map((flag, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-green-900">
                    <span className="text-green-600 font-bold">✓</span>
                    <p className="font-serif text-sm">{flag}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Quality Scores */}
          {(brand.qualityScore || brand.valueScore) && (
            <section>
              <h3 className="font-mono text-xs uppercase tracking-widest text-stone-500 mb-3">
                Scores
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {brand.qualityScore && (
                  <div className="bg-stone-50 border border-stone-200 p-4 text-center">
                    <div className="font-mono text-2xl font-bold text-stone-900">{brand.qualityScore}</div>
                    <div className="font-mono text-xs text-stone-500 uppercase tracking-wider mt-1">Flavor Quality</div>
                  </div>
                )}
                {brand.valueScore && (
                  <div className="bg-stone-50 border border-stone-200 p-4 text-center">
                    <div className="font-mono text-2xl font-bold text-stone-900">{brand.valueScore}</div>
                    <div className="font-mono text-xs text-stone-500 uppercase tracking-wider mt-1">Health Value</div>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Footer - Metadata */}
      <div className="border-t border-stone-200 bg-stone-50 px-6 py-4">
        <div className="flex flex-wrap gap-4 text-xs font-mono text-stone-500">
          <span>Researched: {new Date(brand.researchDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
          <span>•</span>
          <span>Confidence: {brand.confidence}</span>
          {brand.lastVerified && (
            <>
              <span>•</span>
              <span>Last Verified: {new Date(brand.lastVerified).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
            </>
          )}
        </div>
      </div>
    </article>
  )
}
