'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { BEEF_PROFILES, type AnimalFreshShareProfile } from '@/lib/constants/share-profiles'
import { getGridsForProfile, type ShareProfileGrid } from '@/lib/constants/profile-grids'

type SortOption = 'omega' | 'price' | 'code'

export default function BeefProfilesPage() {
  const [sortBy, setSortBy] = useState<SortOption>('omega')
  const [expandedProfile, setExpandedProfile] = useState<string | null>(null)
  const [showPillarFor, setShowPillarFor] = useState<string | null>(null)

  // Sort profiles
  const sortedProfiles = [...BEEF_PROFILES].sort((a, b) => {
    switch (sortBy) {
      case 'omega':
        return (a.estimatedOmegaRatioMidpoint || 0) - (b.estimatedOmegaRatioMidpoint || 0)
      case 'price':
        // Price order is inverse of quality rank for beef (worst = most expensive for wagyu)
        return b.qualityRank - a.qualityRank
      case 'code':
        return a.code.localeCompare(b.code)
      default:
        return 0
    }
  })

  const toggleExpanded = (profileId: string) => {
    setExpandedProfile(expandedProfile === profileId ? null : profileId)
  }

  const togglePillars = (profileId: string) => {
    setShowPillarFor(showPillarFor === profileId ? null : profileId)
  }

  return (
    <div className="min-h-screen bg-[var(--color-cream)]">
      <Header />

      {/* Hero Section */}
      <section className="border-b border-stone-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="max-w-3xl">
            <p className="font-mono text-xs uppercase tracking-widest text-stone-500 mb-3">
              Meat Quality Profiles
            </p>
            <h1 className="font-serif text-4xl sm:text-5xl text-stone-900 leading-tight mb-4">
              Beef Quality Profiles
            </h1>
            <p className="font-serif text-xl text-stone-600 leading-relaxed">
              Same label, different nutrition — decoded
            </p>
          </div>
        </div>
      </section>

      {/* Omega Ratio Explainer */}
      <section className="border-b border-stone-300 bg-gradient-to-br from-red-50 to-amber-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-3xl">
            <h2 className="font-serif text-2xl text-stone-900 mb-4">
              The Omega Ratio: Your Health Compass
            </h2>
            <p className="font-serif text-stone-700 mb-6">
              Omega-6 to Omega-3 ratio is the <strong>most important measure</strong> of meat quality for human health.
              Lower is better. Grain feeding in feedlots dramatically increases omega-6, creating pro-inflammatory profiles.
            </p>

            {/* Visual scale */}
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <div className="w-32 font-mono text-sm text-stone-600">2:1 (Best)</div>
                <div className="flex-1 h-8 bg-gradient-to-r from-green-500 via-yellow-400 to-red-600 border border-stone-300"></div>
                <div className="w-32 font-mono text-sm text-stone-600 text-right">26:1 (Worst)</div>
              </div>
              <div className="flex justify-between font-mono text-xs text-stone-500 px-32">
                <span>Anti-inflammatory</span>
                <span>Moderate</span>
                <span>Pro-inflammatory</span>
              </div>
            </div>

            <div className="mt-6 p-4 bg-amber-100 border-l-4 border-amber-600">
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="font-serif text-sm text-stone-900 font-semibold mb-1">
                    The Price/Health Inversion
                  </p>
                  <p className="font-serif text-sm text-stone-700">
                    Profile F (Premium Wagyu) has the <strong>worst omega ratio</strong> (20-26:1) despite the highest price.
                    Extended feedlot time for marbling = maximum omega-6 accumulation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Controls */}
      <section className="border-b border-stone-300 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <span className="font-mono text-xs uppercase tracking-wider text-stone-500">Sort by:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setSortBy('omega')}
                className={`px-4 py-2 font-mono text-xs uppercase tracking-wider border transition-colors ${
                  sortBy === 'omega'
                    ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]'
                    : 'bg-white text-stone-700 border-stone-300 hover:border-stone-400'
                }`}
              >
                Omega Ratio (Best First)
              </button>
              <button
                onClick={() => setSortBy('code')}
                className={`px-4 py-2 font-mono text-xs uppercase tracking-wider border transition-colors ${
                  sortBy === 'code'
                    ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]'
                    : 'bg-white text-stone-700 border-stone-300 hover:border-stone-400'
                }`}
              >
                Profile Code (A-F)
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Profile Cards */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-6">
          {sortedProfiles.map((profile) => (
            <ProfileCard
              key={profile.id}
              profile={profile}
              isExpanded={expandedProfile === profile.id}
              onToggleExpanded={() => toggleExpanded(profile.id)}
              showPillars={showPillarFor === profile.id}
              onTogglePillars={() => togglePillars(profile.id)}
            />
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <section className="border-t border-stone-300 bg-stone-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-serif text-3xl text-stone-900 mb-4">
              Want to verify your beef?
            </h2>
            <p className="font-serif text-lg text-stone-600 mb-8">
              Lab testing proves what labels only promise. Fielder partners with Edacious Labs to verify omega ratios
              and nutrient profiles.
            </p>
            <Link
              href="/farm"
              className="inline-flex items-center justify-center px-8 py-4 bg-[var(--color-accent)] text-white font-mono text-sm uppercase tracking-wider hover:bg-[var(--color-accent-dark)] transition-colors"
            >
              Learn About Verification
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

function ProfileCard({
  profile,
  isExpanded,
  onToggleExpanded,
  showPillars,
  onTogglePillars,
}: {
  profile: AnimalFreshShareProfile
  isExpanded: boolean
  onToggleExpanded: () => void
  showPillars: boolean
  onTogglePillars: () => void
}) {
  const grids = getGridsForProfile(profile.id)
  const omegaMid = profile.estimatedOmegaRatioMidpoint || 0
  const omegaRange = profile.estimatedOmegaRatioRange || [0, 0]

  // Determine color based on omega ratio
  const getOmegaColor = (ratio: number) => {
    if (ratio <= 3) return 'text-green-700 bg-green-50 border-green-200'
    if (ratio <= 6) return 'text-green-600 bg-green-50 border-green-200'
    if (ratio <= 12) return 'text-yellow-700 bg-yellow-50 border-yellow-200'
    if (ratio <= 18) return 'text-orange-700 bg-orange-50 border-orange-200'
    return 'text-red-700 bg-red-50 border-red-200'
  }

  // Determine quality badge
  const getTierBadge = () => {
    if (profile.qualityTier === 'premium') {
      return 'bg-[var(--color-sage)] text-white'
    }
    if (profile.qualityTier === 'standard') {
      return 'bg-amber-600 text-white'
    }
    return 'bg-stone-500 text-white'
  }

  // Special warning for Profile F
  const isWorstProfile = profile.code === 'B-F'

  return (
    <div className={`bg-white border-2 shadow-sm transition-all ${
      isWorstProfile ? 'border-red-300' : 'border-stone-300'
    }`}>
      {/* Header */}
      <div className="p-6 border-b border-stone-200">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="font-mono text-2xl font-bold text-stone-900">{profile.code}</span>
              <span className={`px-3 py-1 font-mono text-xs uppercase tracking-wider ${getTierBadge()}`}>
                {profile.qualityTier}
              </span>
              {isWorstProfile && (
                <span className="px-3 py-1 font-mono text-xs uppercase tracking-wider bg-red-600 text-white">
                  Worst for Health
                </span>
              )}
            </div>
            <h3 className="font-serif text-2xl text-stone-900 mb-3">
              {profile.name}
            </h3>

            {/* Omega Ratio - Very Prominent */}
            <div className={`inline-flex items-center gap-3 px-4 py-3 border-2 ${getOmegaColor(omegaMid)}`}>
              <div>
                <div className="font-mono text-xs uppercase tracking-wider mb-1">Omega-6:3 Ratio</div>
                <div className="font-mono text-3xl font-bold">{omegaMid}:1</div>
                <div className="font-mono text-xs text-stone-600 mt-1">
                  Range: {omegaRange[0]}-{omegaRange[1]}:1
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Info */}
      <div className="p-6 grid md:grid-cols-2 gap-8">
        {/* Required Claims */}
        <div>
          <h4 className="font-mono text-xs uppercase tracking-wider text-stone-500 mb-3">
            Required on Label
          </h4>
          {profile.requiredClaims.length > 0 ? (
            <ul className="space-y-2">
              {profile.requiredClaims.map((claim, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span className="font-serif text-stone-900">{claim}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="font-serif text-stone-600 italic">No specific claims required</p>
          )}
        </div>

        {/* Red Flags */}
        <div>
          <h4 className="font-mono text-xs uppercase tracking-wider text-stone-500 mb-3">
            What's Typically MISSING (Red Flags)
          </h4>
          {profile.redFlags && profile.redFlags.length > 0 ? (
            <ul className="space-y-2">
              {profile.redFlags.map((flag, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-amber-600 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="font-serif text-stone-900">{flag}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="font-serif text-stone-600 italic">Look for explicit process claims</p>
          )}
        </div>
      </div>

      {/* Notes */}
      {profile.notes && (
        <div className="px-6 pb-6">
          <div className="p-4 bg-stone-50 border-l-4 border-[var(--color-accent)]">
            <p className="font-serif text-sm text-stone-700">{profile.notes}</p>
          </div>
        </div>
      )}

      {/* Toggle Buttons */}
      <div className="border-t border-stone-200 p-4 flex gap-3">
        <button
          onClick={onToggleExpanded}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-stone-100 hover:bg-stone-200 transition-colors font-mono text-xs uppercase tracking-wider text-stone-700"
        >
          {isExpanded ? (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
              Hide Details
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              Show Full Details
            </>
          )}
        </button>
        <button
          onClick={onTogglePillars}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[var(--color-accent)] hover:bg-[var(--color-accent-dark)] transition-colors font-mono text-xs uppercase tracking-wider text-white"
        >
          {showPillars ? (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
              Hide SHARE Pillars
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              Show SHARE Pillars
            </>
          )}
        </button>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-stone-200 p-6 bg-stone-50">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-mono text-xs uppercase tracking-wider text-stone-500 mb-2">
                Optional Claims
              </h4>
              {profile.optionalClaims && profile.optionalClaims.length > 0 ? (
                <ul className="space-y-1">
                  {profile.optionalClaims.map((claim, idx) => (
                    <li key={idx} className="font-serif text-sm text-stone-700">• {claim}</li>
                  ))}
                </ul>
              ) : (
                <p className="font-serif text-sm text-stone-600 italic">None</p>
              )}
            </div>
            <div>
              <h4 className="font-mono text-xs uppercase tracking-wider text-stone-500 mb-2">
                Excluded Claims
              </h4>
              {profile.excludedClaims.length > 0 ? (
                <ul className="space-y-1">
                  {profile.excludedClaims.map((claim, idx) => (
                    <li key={idx} className="font-serif text-sm text-stone-700">• {claim}</li>
                  ))}
                </ul>
              ) : (
                <p className="font-serif text-sm text-stone-600 italic">None</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SHARE Pillars */}
      {showPillars && (
        <div className="border-t border-stone-200 p-6 bg-white">
          <h4 className="font-serif text-xl text-stone-900 mb-6">SHARE Framework Analysis</h4>
          <div className="space-y-4">
            <PillarSummary label="S: Soil" content={profile.soilPillarSummary} />
            <PillarSummary label="H: Heritage" content={profile.heritagePillarSummary} />
            <PillarSummary label="A: Agricultural" content={profile.agriculturalPillarSummary} />
            <PillarSummary label="R: Ripen" content={profile.ripenPillarSummary} />
            <PillarSummary label="E: Enrich" content={profile.enrichPillarSummary} />
          </div>

          {/* 3-Perspective Grid */}
          {grids.length > 0 && (
            <div className="mt-8">
              <h5 className="font-mono text-xs uppercase tracking-wider text-stone-500 mb-4">
                3-Perspective Reality Check
              </h5>
              <div className="space-y-6">
                {grids.map((grid) => (
                  <GridRow key={grid.id} grid={grid} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function PillarSummary({ label, content }: { label: string; content: string }) {
  return (
    <div className="flex gap-4">
      <div className="font-mono text-sm font-bold text-[var(--color-accent)] w-32 flex-shrink-0">
        {label}
      </div>
      <div className="font-serif text-stone-700 flex-1">
        {content}
      </div>
    </div>
  )
}

function GridRow({ grid }: { grid: ShareProfileGrid }) {
  const perspectiveLabels = {
    regulation: 'Regulation',
    marketing: 'Marketing',
    reality: 'Reality (Fielder)',
  }

  const getPerspectiveColor = (perspective: string) => {
    if (perspective === 'regulation') return 'bg-blue-50 border-blue-200'
    if (perspective === 'marketing') return 'bg-amber-50 border-amber-200'
    return 'bg-green-50 border-green-200'
  }

  return (
    <div className={`p-4 border ${getPerspectiveColor(grid.perspective)}`}>
      <div className="font-mono text-xs uppercase tracking-wider text-stone-600 mb-3">
        {perspectiveLabels[grid.perspective]}
      </div>
      <div className="grid grid-cols-5 gap-4 text-xs">
        <div>
          <div className="font-mono text-[10px] uppercase text-stone-500 mb-1">Soil</div>
          <div className="font-serif text-stone-700">{grid.soilContent}</div>
        </div>
        <div>
          <div className="font-mono text-[10px] uppercase text-stone-500 mb-1">Heritage</div>
          <div className="font-serif text-stone-700">{grid.heritageContent}</div>
        </div>
        <div>
          <div className="font-mono text-[10px] uppercase text-stone-500 mb-1">Agricultural</div>
          <div className="font-serif text-stone-700">{grid.agriculturalContent}</div>
        </div>
        <div>
          <div className="font-mono text-[10px] uppercase text-stone-500 mb-1">Ripen</div>
          <div className="font-serif text-stone-700">{grid.ripenContent}</div>
        </div>
        <div>
          <div className="font-mono text-[10px] uppercase text-stone-500 mb-1">Enrich</div>
          <div className="font-serif text-stone-700">{grid.enrichContent}</div>
        </div>
      </div>
    </div>
  )
}
