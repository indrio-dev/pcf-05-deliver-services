/**
 * Region Predictions Page
 *
 * Shows all product predictions for a specific region
 * URL: /predictions/[region-slug] (e.g., /predictions/vero-beach-fl)
 */

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { Header } from '@/components/Header'
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

export async function generateStaticParams() {
  return Object.values(ALL_GROWING_REGIONS).map((region) => ({
    region: region.slug,
  }))
}

function getProductSlug(cultivarId: string): string {
  // Convert cultivar ID to URL-friendly slug
  return cultivarId.replace(/_/g, '-').toLowerCase()
}

// Category colors for placeholder images - muted, earthy
const categoryGradients: Record<string, string> = {
  fruit: 'from-rose-100/80 to-orange-100/60',
  vegetable: 'from-emerald-100/60 to-stone-100',
  nut: 'from-amber-100/70 to-stone-100',
  meat: 'from-rose-100/60 to-stone-100',
  dairy: 'from-stone-100 to-blue-50/50',
  honey: 'from-amber-100/60 to-yellow-100/40',
  processed: 'from-stone-100 to-stone-50',
}

function ProductCard({ offering, regionSlug }: { offering: RegionalOffering; regionSlug: string }) {
  const cultivar = CULTIVARS_BY_ID[offering.varietyId || '']
  const product = cultivar ? PRODUCTS_BY_ID[cultivar.productId] : null
  if (!cultivar || !product) return null

  const productSlug = getProductSlug(cultivar.id)
  const gradient = categoryGradients[product.category] || categoryGradients.fruit

  return (
    <Link
      href={`/predictions/${regionSlug}/${productSlug}`}
      className="group relative overflow-hidden rounded-sm bg-[var(--color-cream)] border border-stone-200 shadow-sm transition-all hover:shadow-md hover:border-stone-300 active:scale-[0.99]"
    >
      {/* Placeholder image area */}
      <div className={`relative h-28 bg-gradient-to-br ${gradient}`}>
        {/* Quality badge */}
        {offering.qualityTier && (
          <div className="absolute top-3 right-3">
            <span
              className={`inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium text-white ${
                offering.qualityTier === 'exceptional'
                  ? 'bg-[var(--color-accent)]'
                  : offering.qualityTier === 'excellent'
                    ? 'bg-[var(--color-peak)]'
                    : 'bg-stone-500'
              }`}
            >
              {offering.qualityTier}
            </span>
          </div>
        )}

        {/* Category label */}
        <div className="absolute bottom-3 left-3">
          <span className="rounded-sm bg-white/90 px-2 py-0.5 font-mono text-xs uppercase tracking-wider text-stone-600 backdrop-blur-sm">
            {product.category}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-serif font-normal text-stone-900 group-hover:text-[var(--color-accent)] transition-colors">
          {cultivar.displayName}
        </h3>
        <p className="text-sm text-stone-500 mt-0.5">{product.displayName}</p>

        {cultivar.flavorProfile && (
          <p className="mt-3 text-sm text-stone-600 line-clamp-2">{cultivar.flavorProfile}</p>
        )}

        {offering.flavorNotes && (
          <p className="mt-2 text-sm italic text-stone-500 line-clamp-1">
            {offering.flavorNotes}
          </p>
        )}

        {/* Tags */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {cultivar.isHeritage && (
            <span className="rounded-sm bg-[var(--color-accent-light)]/30 px-2 py-0.5 text-xs font-medium text-[var(--color-accent-dark)]">
              Heritage
            </span>
          )}
          {cultivar.isNonGmo && (
            <span className="rounded-sm bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600">
              Non-GMO
            </span>
          )}
        </div>
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

  const categoryIcons: Record<string, string> = {
    fruit: '🍎',
    vegetable: '🥬',
    nut: '🥜',
    meat: '🥩',
    dairy: '🥚',
    honey: '🍯',
    processed: '🫙',
  }

  return (
    <div className="min-h-screen bg-[var(--color-cream)]">
      <Header />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-2 text-sm text-stone-500">
          <Link href="/predictions" className="hover:text-[var(--color-accent)] transition-colors">
            Regions
          </Link>
          <ChevronRightIcon className="h-4 w-4" />
          <span className="text-stone-900 font-medium">{region.displayName}</span>
        </nav>

        {/* Hero Section */}
        <div className="mb-10">
          <p className="font-mono text-xs uppercase tracking-widest text-stone-500 mb-3">
            Growing Region
          </p>
          <h1 className="font-serif text-4xl font-normal tracking-tight text-stone-900 sm:text-5xl">
            {region.displayName}
          </h1>
          <p className="mt-3 text-lg text-stone-600">
            {region.state} &bull; {region.primaryCities.join(', ')}
          </p>

          {/* Climate badges */}
          <div className="mt-6 flex flex-wrap gap-3">
            <div className="rounded-sm bg-[var(--color-peak-light)] px-3 py-1.5">
              <span className="font-mono text-xs text-[var(--color-peak)]">
                {region.climate.frostFreeDays} frost-free days
              </span>
            </div>
            {region.climate.usdaZone && (
              <div className="rounded-sm bg-stone-100 px-3 py-1.5">
                <span className="font-mono text-xs text-stone-600">
                  USDA Zone {region.climate.usdaZone}
                </span>
              </div>
            )}
            {region.climate.annualGdd50 && (
              <div className="rounded-sm bg-[var(--color-approaching-light)] px-3 py-1.5">
                <span className="font-mono text-xs text-[var(--color-approaching)]">
                  {region.climate.annualGdd50.toLocaleString()} GDD/year
                </span>
              </div>
            )}
          </div>

          {region.notes && (
            <p className="mt-6 text-stone-600 max-w-3xl">{region.notes}</p>
          )}
        </div>

        {/* Products */}
        {activeOfferings.length === 0 ? (
          <div className="rounded-sm bg-[var(--color-parchment)] p-12 text-center border border-stone-200">
            <div className="text-4xl mb-4">🌱</div>
            <h3 className="font-serif text-xl font-normal text-stone-900">
              Coming Soon
            </h3>
            <p className="mt-2 text-stone-600">
              No products currently tracked for this region.
            </p>
            <p className="mt-4 font-mono text-xs text-stone-500 uppercase tracking-wider">
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
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-2xl">{categoryIcons[category]}</span>
                    <div>
                      <h2 className="font-serif text-2xl font-normal text-stone-900">
                        {categoryLabels[category] || category}
                      </h2>
                      <p className="font-mono text-xs uppercase tracking-wider text-stone-500">
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
        <section className="mt-16 rounded-sm bg-[var(--color-parchment)] p-6 sm:p-8 border border-stone-200">
          <h2 className="font-serif text-xl font-normal text-stone-900">
            Region Details
          </h2>
          <dl className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="font-mono text-xs uppercase tracking-wider text-stone-500">Counties</dt>
              <dd className="mt-1 text-stone-900">
                {region.counties.join(', ')}
              </dd>
            </div>
            <div>
              <dt className="font-mono text-xs uppercase tracking-wider text-stone-500">Coordinates</dt>
              <dd className="mt-1 text-stone-900">
                {region.latitude.toFixed(2)}°N, {Math.abs(region.longitude).toFixed(2)}°W
              </dd>
            </div>
            <div>
              <dt className="font-mono text-xs uppercase tracking-wider text-stone-500">Growing Season</dt>
              <dd className="mt-1 text-stone-900">
                Day {region.climate.avgLastFrostDoy} – Day{' '}
                {region.climate.avgFirstFrostDoy}
              </dd>
            </div>
            {region.climate.avgChillHours && (
              <div>
                <dt className="font-mono text-xs uppercase tracking-wider text-stone-500">Chill Hours</dt>
                <dd className="mt-1 text-stone-900">
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
            className="inline-flex items-center gap-2 rounded-sm bg-[var(--color-accent)] px-8 py-4 text-sm font-medium text-white shadow-lg transition-all hover:bg-[var(--color-accent-dark)] hover:shadow-xl active:scale-[0.98]"
          >
            View Live Status Near {region.displayName}
            <ArrowRightIcon className="h-5 w-5" />
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-stone-900 border-t border-stone-800 mt-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div>
              <span className="font-serif text-xl text-white">
                Fielder
              </span>
              <p className="mt-2 text-sm text-stone-400">
                Fresh produce at peak quality.
              </p>
            </div>
            <div className="flex gap-8 font-mono text-xs uppercase tracking-wider">
              <Link href="/discover" className="text-stone-400 hover:text-white transition-colors">
                Discover
              </Link>
              <Link href="/predictions" className="text-stone-400 hover:text-white transition-colors">
                Regions
              </Link>
              <Link href="/farm" className="text-stone-400 hover:text-white transition-colors">
                For Farms
              </Link>
              <Link href="/about" className="text-stone-400 hover:text-white transition-colors">
                About
              </Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-stone-800">
            <p className="font-mono text-xs text-stone-500">
              &copy; {new Date().getFullYear()} Fielder. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  )
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
    </svg>
  )
}
