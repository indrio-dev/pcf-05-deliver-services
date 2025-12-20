/**
 * Region Predictions Page
 *
 * Shows all product predictions for a specific region
 * URL: /predictions/[region-slug] (e.g., /predictions/vero-beach-fl)
 */

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { JournalHeader } from '@/components/JournalHeader'
import { JournalFooter } from '@/components/JournalFooter'
import {
  ALL_GROWING_REGIONS,
  getRegionBySlug,
} from '@/lib/constants/growing-regions'
import {
  OFFERINGS_BY_REGION,
  CULTIVARS_BY_ID,
  PRODUCTS_BY_ID,
  type RegionalOffering,
} from '@/lib/constants/products'

interface Props {
  params: Promise<{ region: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { region: regionSlug } = await params
  const region = getRegionBySlug(regionSlug)
  if (!region) return { title: 'Region Not Found' }

  return {
    title: `Fresh Produce in ${region.displayName} | Fielder`,
    description: `Real-time harvest predictions for ${region.displayName}, ${region.state}. See what's at peak freshness: ${region.primaryProducts.slice(0, 5).join(', ')}.`,
    openGraph: {
      title: `Fresh Produce in ${region.displayName}`,
      description: `What's fresh and in season in ${region.displayName}, ${region.state}`,
    },
  }
}

// Static generation disabled - 7,700+ pages exceed Vercel's 75MB build limit
// TODO: Implement seasonal static generation (pre-render only in-season pages)
// For now, all pages render dynamically on-demand
export const dynamic = 'force-dynamic'

function getProductSlug(cultivarId: string): string {
  // Convert cultivar ID to URL-friendly slug
  return cultivarId.replace(/_/g, '-').toLowerCase()
}

function ProductCard({ offering, regionSlug }: { offering: RegionalOffering; regionSlug: string }) {
  const cultivar = CULTIVARS_BY_ID[offering.varietyId || '']
  const product = cultivar ? PRODUCTS_BY_ID[cultivar.productId] : null
  if (!cultivar || !product) return null

  const productSlug = getProductSlug(cultivar.id)

  return (
    <Link
      href={`/predictions/${regionSlug}/${productSlug}`}
      className="group block border-2 border-stone-300 bg-[var(--color-manila)] p-4 hover:border-stone-500 hover:bg-[var(--color-manila-dark)] transition-all"
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-typewriter text-stone-800 group-hover:text-stone-900 transition-colors">
            {cultivar.displayName}
          </h3>
          <p className="font-typewriter text-sm text-stone-500 mt-0.5">{product.displayName}</p>
        </div>
        {offering.qualityTier && (
          <span
            className={`px-2 py-0.5 font-typewriter text-xs uppercase tracking-wider ${
              offering.qualityTier === 'exceptional'
                ? 'bg-green-100 text-green-800 border border-green-300'
                : offering.qualityTier === 'excellent'
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : 'bg-stone-100 text-stone-600 border border-stone-300'
            }`}
          >
            {offering.qualityTier}
          </span>
        )}
      </div>

      {cultivar.flavorProfile && (
        <p className="mt-3 font-typewriter text-sm text-stone-600 line-clamp-2">{cultivar.flavorProfile}</p>
      )}

      {offering.flavorNotes && (
        <p className="mt-2 font-typewriter text-sm italic text-stone-500 line-clamp-1">
          {offering.flavorNotes}
        </p>
      )}

      {/* Tags */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className="border border-stone-300 px-2 py-0.5 font-typewriter text-xs text-stone-600 uppercase">
          {product.category}
        </span>
        {cultivar.isHeritage && (
          <span className="border border-amber-300 bg-amber-50 px-2 py-0.5 font-typewriter text-xs text-amber-800">
            Heritage
          </span>
        )}
        {cultivar.isNonGmo && (
          <span className="border border-stone-300 px-2 py-0.5 font-typewriter text-xs text-stone-600">
            Non-GMO
          </span>
        )}
      </div>
    </Link>
  )
}

export default async function RegionPage({ params }: Props) {
  const { region: regionSlug } = await params
  const region = getRegionBySlug(regionSlug)

  if (!region) {
    notFound()
  }

  const offerings = OFFERINGS_BY_REGION[region.id] || []
  const activeOfferings = offerings.filter((o) => o.isActive)

  // Group by category
  const offeringsByCategory = activeOfferings.reduce(
    (acc, offering) => {
      const cultivar = CULTIVARS_BY_ID[offering.varietyId || '']
      const product = cultivar ? PRODUCTS_BY_ID[cultivar.productId] : null
      if (!product) return acc
      const category = product.category
      if (!acc[category]) acc[category] = []
      acc[category].push(offering)
      return acc
    },
    {} as Record<string, RegionalOffering[]>
  )

  const categoryOrder = [
    'fruit',
    'vegetable',
    'nut',
    'meat',
    'dairy',
    'honey',
    'processed',
  ]
  const categoryLabels: Record<string, string> = {
    fruit: 'Fruits',
    vegetable: 'Vegetables',
    nut: 'Nuts',
    meat: 'Meat & Poultry',
    dairy: 'Dairy & Eggs',
    honey: 'Honey',
    processed: 'Lightly Processed',
  }

  return (
    <div className="min-h-screen bg-[var(--color-manila)]">
      <JournalHeader />

      <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-2 font-typewriter text-sm text-stone-500">
          <Link href="/predictions" className="hover:text-stone-800 transition-colors">
            Regions
          </Link>
          <span>→</span>
          <span className="text-stone-800">{region.displayName}</span>
        </nav>

        {/* Hero Section */}
        <div className="mb-10 border-b-2 border-stone-300 pb-8">
          <p className="font-typewriter text-xs uppercase tracking-widest text-stone-500 mb-3">
            Growing Region
          </p>
          <h1 className="font-typewriter text-3xl sm:text-4xl text-stone-800">
            {region.displayName}
          </h1>
          <p className="mt-3 font-typewriter text-stone-600">
            {region.state} · {region.primaryCities.join(', ')}
          </p>

          {/* Climate badges */}
          <div className="mt-6 flex flex-wrap gap-3">
            <span className="border border-green-300 bg-green-50 px-3 py-1.5 font-typewriter text-xs text-green-800">
              {region.climate.frostFreeDays} frost-free days
            </span>
            {region.climate.usdaZone && (
              <span className="border border-stone-300 px-3 py-1.5 font-typewriter text-xs text-stone-600">
                USDA Zone {region.climate.usdaZone}
              </span>
            )}
            {region.climate.annualGdd50 && (
              <span className="border border-amber-300 bg-amber-50 px-3 py-1.5 font-typewriter text-xs text-amber-800">
                {region.climate.annualGdd50.toLocaleString()} GDD/year
              </span>
            )}
          </div>

          {region.notes && (
            <p className="mt-6 font-typewriter text-stone-600 max-w-3xl">{region.notes}</p>
          )}
        </div>

        {/* Products */}
        {activeOfferings.length === 0 ? (
          <div className="border-2 border-stone-300 p-12 text-center">
            <h3 className="font-typewriter text-xl text-stone-800">
              Coming Soon
            </h3>
            <p className="mt-2 font-typewriter text-stone-600">
              No products currently tracked for this region.
            </p>
            <p className="mt-4 font-typewriter text-xs text-stone-500 uppercase tracking-wider">
              Primary products: {region.primaryProducts.join(', ')}
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {categoryOrder.map((category) => {
              const categoryOfferings = offeringsByCategory[category]
              if (!categoryOfferings || categoryOfferings.length === 0) return null

              return (
                <section key={category}>
                  <div className="flex items-center gap-3 mb-6 border-b-2 border-stone-300 pb-3">
                    <div>
                      <h2 className="font-typewriter text-xl text-stone-800 uppercase tracking-wider">
                        {categoryLabels[category] || category}
                      </h2>
                      <p className="font-typewriter text-xs text-stone-500">
                        {categoryOfferings.length} {categoryOfferings.length === 1 ? 'variety' : 'varieties'}
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {categoryOfferings.map((offering) => (
                      <ProductCard key={offering.id} offering={offering} regionSlug={region.slug} />
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        )}

        {/* Region Details */}
        <section className="mt-16 border-2 border-stone-300 p-6 sm:p-8">
          <h2 className="font-typewriter text-xl text-stone-800 uppercase tracking-wider mb-6">
            Region Details
          </h2>
          <dl className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 font-typewriter">
            <div>
              <dt className="text-xs uppercase tracking-wider text-stone-500">Counties</dt>
              <dd className="mt-1 text-stone-800">
                {region.counties.join(', ')}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-stone-500">Coordinates</dt>
              <dd className="mt-1 text-stone-800">
                {region.latitude.toFixed(2)}°N, {Math.abs(region.longitude).toFixed(2)}°W
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-stone-500">Growing Season</dt>
              <dd className="mt-1 text-stone-800">
                Day {region.climate.avgLastFrostDoy} – Day {region.climate.avgFirstFrostDoy}
              </dd>
            </div>
            {region.climate.avgChillHours && (
              <div>
                <dt className="text-xs uppercase tracking-wider text-stone-500">Chill Hours</dt>
                <dd className="mt-1 text-stone-800">
                  {region.climate.avgChillHours} hours/winter
                </dd>
              </div>
            )}
          </dl>
        </section>

        {/* CTA */}
        <section className="mt-12 text-center">
          <Link
            href={`/discover?lat=${region.latitude}&lon=${region.longitude}`}
            className="inline-flex items-center gap-2 border-2 border-stone-800 px-8 py-4 font-typewriter text-sm uppercase tracking-wider text-stone-800 hover:bg-stone-800 hover:text-[var(--color-manila)] transition-all"
          >
            View Live Status Near {region.displayName} →
          </Link>
        </section>
      </main>

      <JournalFooter />
    </div>
  )
}
