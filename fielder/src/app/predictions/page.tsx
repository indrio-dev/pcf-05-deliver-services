/**
 * Predictions Index - Browse by Region
 *
 * SEO-optimized listing of all agricultural regions
 * URL: /predictions
 */

import Link from 'next/link'
import { Metadata } from 'next'
import { JournalHeader } from '@/components/JournalHeader'
import { JournalFooter } from '@/components/JournalFooter'
import {
  ALL_GROWING_REGIONS,
  getRegionsByMacroRegion,
  type MacroRegion,
  type GrowingRegionExtended,
} from '@/lib/constants/growing-regions'
import { OFFERINGS_BY_REGION } from '@/lib/constants/products'

export const metadata: Metadata = {
  title: 'Fresh Produce Predictions by Region | Fielder',
  description:
    'Real-time harvest predictions for fresh produce across the United States. Find what\'s at peak freshness near you.',
  openGraph: {
    title: 'Fresh Produce Predictions by Region',
    description:
      'Real-time harvest predictions for fresh produce across the United States.',
  },
}

const MACRO_REGION_LABELS: Record<MacroRegion, string> = {
  west_coast: 'West Coast',
  pacific_northwest: 'Pacific Northwest',
  southwest: 'Southwest',
  midwest: 'Midwest',
  southeast: 'Southeast',
  northeast: 'Northeast',
  mid_atlantic: 'Mid-Atlantic',
  mountain_west: 'Mountain West',
}

const MACRO_REGION_ORDER: MacroRegion[] = [
  'west_coast',
  'pacific_northwest',
  'southwest',
  'southeast',
  'midwest',
  'northeast',
  'mid_atlantic',
  'mountain_west',
]

function RegionCard({ region, macroRegion }: { region: GrowingRegionExtended; macroRegion: MacroRegion }) {
  const offeringCount = OFFERINGS_BY_REGION[region.id]?.length || 0

  return (
    <Link
      href={`/predictions/${region.slug}`}
      className="group block border-2 border-stone-300 bg-[var(--color-manila)] p-4 hover:border-stone-500 hover:bg-[var(--color-manila-dark)] transition-all"
    >
      <h3 className="font-typewriter text-stone-800 group-hover:text-stone-900 transition-colors">
        {region.displayName}
      </h3>
      <p className="mt-1 font-typewriter text-sm text-stone-500">
        {region.state} · {region.primaryCities[0]}
      </p>

      <div className="mt-3 flex items-center gap-2">
        <span
          className={`inline-flex items-center px-2 py-0.5 font-typewriter text-xs uppercase tracking-wider ${
            region.dtcActivity === 'high'
              ? 'bg-green-100 text-green-800 border border-green-300'
              : region.dtcActivity === 'medium'
                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                : 'bg-stone-100 text-stone-600 border border-stone-300'
          }`}
        >
          {region.dtcActivity === 'high'
            ? 'High DTC'
            : region.dtcActivity === 'medium'
              ? 'Med DTC'
              : 'Low DTC'}
        </span>
        {offeringCount > 0 && (
          <span className="font-typewriter text-xs text-stone-400">
            {offeringCount} products
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {region.primaryProducts.slice(0, 3).map((product) => (
          <span
            key={product}
            className="inline-flex items-center border border-stone-300 px-2 py-0.5 font-typewriter text-xs text-stone-600"
          >
            {product.replace(/_/g, ' ')}
          </span>
        ))}
        {region.primaryProducts.length > 3 && (
          <span className="font-typewriter text-xs text-stone-400">
            +{region.primaryProducts.length - 3}
          </span>
        )}
      </div>
    </Link>
  )
}

export default function PredictionsPage() {
  const totalRegions = Object.keys(ALL_GROWING_REGIONS).length

  return (
    <div className="min-h-screen bg-[var(--color-manila)]">
      <JournalHeader />

      <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Hero Section */}
        <div className="mb-12 text-center">
          <p className="font-typewriter text-xs uppercase tracking-widest text-stone-500 mb-4">
            United States
          </p>
          <h1 className="font-typewriter text-3xl sm:text-4xl text-stone-800 tracking-tight">
            Explore Growing Regions
          </h1>
          <p className="mt-4 font-typewriter text-stone-600 max-w-2xl mx-auto leading-relaxed">
            Browse {totalRegions} agricultural regions across the country.
            Select a region to see real-time harvest predictions.
          </p>
        </div>

        {/* Regions by Macro Region */}
        <div className="space-y-14">
          {MACRO_REGION_ORDER.map((macroRegion) => {
            const regions = getRegionsByMacroRegion(macroRegion)
            if (regions.length === 0) return null

            return (
              <section key={macroRegion}>
                <div className="flex items-center gap-3 mb-6 border-b-2 border-stone-300 pb-3">
                  <div>
                    <h2 className="font-typewriter text-xl text-stone-800 uppercase tracking-wider">
                      {MACRO_REGION_LABELS[macroRegion]}
                    </h2>
                    <p className="font-typewriter text-xs text-stone-500">
                      {regions.length} regions
                    </p>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {regions
                    .sort((a, b) => {
                      // High DTC first, then by name
                      if (a.dtcActivity !== b.dtcActivity) {
                        const order = { high: 0, medium: 1, low: 2 }
                        return order[a.dtcActivity] - order[b.dtcActivity]
                      }
                      return a.displayName.localeCompare(b.displayName)
                    })
                    .map((region) => (
                      <RegionCard key={region.id} region={region} macroRegion={macroRegion} />
                    ))}
                </div>
              </section>
            )
          })}
        </div>

        {/* CTA Section */}
        <section className="mt-16 border-2 border-stone-800 p-8 sm:p-12 text-center">
          <h2 className="font-typewriter text-xl sm:text-2xl text-stone-800 uppercase tracking-wider">
            Know exactly what&apos;s fresh near you
          </h2>
          <p className="mt-4 font-typewriter text-stone-600 max-w-xl mx-auto leading-relaxed">
            Our predictions use Growing Degree Day models to tell you precisely when produce hits peak quality.
          </p>
          <Link
            href="/discover"
            className="mt-8 inline-flex items-center gap-2 border-2 border-stone-800 px-8 py-3 font-typewriter text-sm uppercase tracking-wider text-stone-800 hover:bg-stone-800 hover:text-[var(--color-manila)] transition-all"
          >
            Discover What&apos;s Fresh →
          </Link>
        </section>
      </main>

      <JournalFooter />
    </div>
  )
}
