/**
 * Product Detail Page
 * Clean, simple journal-style product information
 */

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Metadata } from 'next'
import { JournalHeader } from '@/components/JournalHeader'
import { JournalFooter } from '@/components/JournalFooter'
import {
  ALL_GROWING_REGIONS,
  getRegionBySlug,
  type GrowingRegionExtended,
} from '@/lib/constants/growing-regions'
import {
  REGIONAL_OFFERINGS,
  CULTIVARS_BY_ID,
  PRODUCTS_BY_ID,
  getOfferingDetails,
  type RegionalOffering,
  type Cultivar,
  type ProductType,
} from '@/lib/constants/products'
import {
  calculatePeakWindow,
  getCurrentDayOfYear,
} from '@/lib/utils/harvest-timing'

interface Props {
  params: Promise<{ region: string; product: string }>
}

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

function dateToDoy(month: number, day: number): number {
  let doy = day
  for (let i = 0; i < month - 1; i++) {
    doy += DAYS_IN_MONTH[i]
  }
  return doy
}

/**
 * Calculate live harvest status
 */
function calculateLiveStatus(peakMonths: number[] | undefined): {
  status: 'at_peak' | 'approaching' | 'in_season' | 'off_season' | 'year_round'
  label: string
  color: string
} {
  // No peakMonths = year-round availability (e.g., meat, dairy)
  if (!peakMonths || peakMonths.length === 0) {
    return {
      status: 'year_round',
      label: 'Year-Round',
      color: 'var(--color-season)',
    }
  }

  const currentDoy = getCurrentDayOfYear()
  const sortedMonths = [...peakMonths].sort((a, b) => {
    if (Math.abs(a - b) > 6) {
      const aAdj = a <= 6 ? a + 12 : a
      const bAdj = b <= 6 ? b + 12 : b
      return aAdj - bAdj
    }
    return a - b
  })

  const firstMonth = sortedMonths[0]
  const lastMonth = sortedMonths[sortedMonths.length - 1]
  const harvestStartDoy = dateToDoy(firstMonth, 1)
  const harvestEndDoy = dateToDoy(lastMonth, DAYS_IN_MONTH[lastMonth - 1])

  let totalDays = 0
  for (const month of sortedMonths) {
    totalDays += DAYS_IN_MONTH[month - 1]
  }

  const peakDays = Math.round(totalDays * 0.5)
  const marginDays = Math.round((totalDays - peakDays) / 2)
  const peakStartDoy = harvestStartDoy + marginDays
  const peakEndDoy = harvestEndDoy - marginDays

  const isInRange = (doy: number, start: number, end: number): boolean => {
    if (start <= end) return doy >= start && doy <= end
    return doy >= start || doy <= end
  }

  if (isInRange(currentDoy, peakStartDoy, peakEndDoy)) {
    return { status: 'at_peak', label: 'At Peak', color: 'var(--color-peak)' }
  }
  if (isInRange(currentDoy, harvestStartDoy, harvestEndDoy)) {
    const daysUntilPeak = peakStartDoy - currentDoy
    if (daysUntilPeak > 0 && daysUntilPeak <= 30) {
      return { status: 'approaching', label: 'Peak Soon', color: 'var(--color-approaching)' }
    }
    return { status: 'in_season', label: 'In Season', color: 'var(--color-season)' }
  }
  return { status: 'off_season', label: 'Off Season', color: 'var(--color-off)' }
}

function getCultivarFromSlug(slug: string): Cultivar | undefined {
  const normalizedSlug = slug.replace(/-/g, '_').toLowerCase()
  return CULTIVARS_BY_ID[normalizedSlug]
}

function findOfferingBySlug(
  regionSlug: string,
  cultivarId: string
): { offering: RegionalOffering; region: GrowingRegionExtended } | undefined {
  const matchingRegionIds = Object.entries(ALL_GROWING_REGIONS)
    .filter(([_, region]) => region.slug === regionSlug)
    .map(([id, _]) => id)

  for (const regionId of matchingRegionIds) {
    const offering = REGIONAL_OFFERINGS.find(
      (o) => o.regionId === regionId && o.varietyId === cultivarId && o.isActive
    )
    if (offering) {
      const region = ALL_GROWING_REGIONS[regionId]
      return { offering, region }
    }
  }
  return undefined
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { region: regionSlug, product: productSlug } = await params
  const region = getRegionBySlug(regionSlug)
  const cultivar = getCultivarFromSlug(productSlug)
  if (!region || !cultivar) return { title: 'Product Not Found' }

  const product = PRODUCTS_BY_ID[cultivar.productId]
  if (!product) return { title: 'Product Not Found' }

  return {
    title: `${cultivar.displayName} from ${region.displayName} | Fielder`,
    description: `${cultivar.displayName} harvest information for ${region.displayName}, ${region.state}.`,
  }
}

export const dynamic = 'force-dynamic'

export default async function ProductDetailPage({ params }: Props) {
  const { region: regionSlug, product: productSlug } = await params

  const cultivar = getCultivarFromSlug(productSlug)
  if (!cultivar) notFound()

  const product = PRODUCTS_BY_ID[cultivar.productId]
  if (!product) notFound()

  const result = findOfferingBySlug(regionSlug, cultivar.id)
  if (!result) notFound()

  const { offering, region } = result
  const details = getOfferingDetails(offering.id)
  const peakWindow = calculatePeakWindow(details?.peakMonths)
  const liveStatus = calculateLiveStatus(details?.peakMonths)

  return (
    <div className="journal-page">
      <JournalHeader />

      <main style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: 'var(--space-xl) var(--space-lg)',
      }}>
        {/* Breadcrumb */}
        <nav style={{
          fontFamily: 'var(--font-typewriter)',
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: 'var(--color-ink-muted)',
          marginBottom: 'var(--space-lg)',
        }}>
          <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>
            Home
          </Link>
          <span style={{ margin: '0 var(--space-xs)' }}>/</span>
          <span style={{ color: 'var(--color-ink)' }}>{cultivar.displayName}</span>
        </nav>

        {/* Product Card */}
        <article style={{
          background: 'var(--color-parchment)',
          border: '1px solid var(--color-rule)',
          padding: 'var(--space-xl)',
        }}>
          {/* Header */}
          <div style={{
            borderBottom: '2px solid var(--color-accent)',
            paddingBottom: 'var(--space-md)',
            marginBottom: 'var(--space-lg)',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: 'var(--space-md)',
            }}>
              <div>
                <p style={{
                  fontFamily: 'var(--font-typewriter)',
                  fontSize: '0.6875rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: 'var(--color-ink-muted)',
                  margin: 0,
                  marginBottom: 'var(--space-xs)',
                }}>
                  {product.displayName}
                </p>
                <h1 style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '2rem',
                  fontWeight: 400,
                  margin: 0,
                  lineHeight: 1.2,
                }}>
                  {cultivar.displayName}
                </h1>
              </div>

              {/* Status Badge */}
              <div style={{
                fontFamily: 'var(--font-typewriter)',
                fontSize: '0.6875rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                padding: 'var(--space-xs) var(--space-sm)',
                background: liveStatus.status === 'at_peak' ? 'rgba(34, 197, 94, 0.1)'
                  : liveStatus.status === 'in_season' ? 'rgba(16, 185, 129, 0.1)'
                  : liveStatus.status === 'year_round' ? 'rgba(16, 185, 129, 0.1)'
                  : liveStatus.status === 'approaching' ? 'rgba(245, 158, 11, 0.1)'
                  : 'rgba(120, 113, 108, 0.1)',
                color: liveStatus.color,
                fontWeight: 600,
              }}>
                {liveStatus.label}
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 'var(--space-lg)',
            marginBottom: 'var(--space-xl)',
          }}>
            {/* Origin */}
            <div style={{ borderLeft: '2px solid var(--color-rule)', paddingLeft: 'var(--space-md)' }}>
              <p style={{
                fontFamily: 'var(--font-typewriter)',
                fontSize: '0.625rem',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--color-ink-muted)',
                margin: 0,
                marginBottom: 'var(--space-xs)',
              }}>
                Origin
              </p>
              <p style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1rem',
                margin: 0,
              }}>
                {region.displayName}, {region.state}
              </p>
            </div>

            {/* Category */}
            <div style={{ borderLeft: '2px solid var(--color-rule)', paddingLeft: 'var(--space-md)' }}>
              <p style={{
                fontFamily: 'var(--font-typewriter)',
                fontSize: '0.625rem',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--color-ink-muted)',
                margin: 0,
                marginBottom: 'var(--space-xs)',
              }}>
                Category
              </p>
              <p style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1rem',
                margin: 0,
                textTransform: 'capitalize',
              }}>
                {product.subcategory.replace(/_/g, ' ')}
              </p>
            </div>

            {/* Harvest Season */}
            {peakWindow && (
              <div style={{ borderLeft: '2px solid var(--color-rule)', paddingLeft: 'var(--space-md)' }}>
                <p style={{
                  fontFamily: 'var(--font-typewriter)',
                  fontSize: '0.625rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: 'var(--color-ink-muted)',
                  margin: 0,
                  marginBottom: 'var(--space-xs)',
                }}>
                  Season
                </p>
                <p style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1rem',
                  margin: 0,
                }}>
                  {peakWindow.harvestStart} – {peakWindow.harvestEnd}
                </p>
              </div>
            )}

            {/* Peak Quality */}
            {peakWindow && (
              <div style={{ borderLeft: '2px solid var(--color-accent)', paddingLeft: 'var(--space-md)' }}>
                <p style={{
                  fontFamily: 'var(--font-typewriter)',
                  fontSize: '0.625rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: 'var(--color-ink-muted)',
                  margin: 0,
                  marginBottom: 'var(--space-xs)',
                }}>
                  Peak Quality
                </p>
                <p style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1rem',
                  margin: 0,
                  color: 'var(--color-accent)',
                }}>
                  {peakWindow.peakStart} – {peakWindow.peakEnd}
                </p>
              </div>
            )}

            {/* Quality Tier */}
            {offering.qualityTier && (
              <div style={{ borderLeft: '2px solid var(--color-accent)', paddingLeft: 'var(--space-md)' }}>
                <p style={{
                  fontFamily: 'var(--font-typewriter)',
                  fontSize: '0.625rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: 'var(--color-ink-muted)',
                  margin: 0,
                  marginBottom: 'var(--space-xs)',
                }}>
                  Quality Tier
                </p>
                <p style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1rem',
                  margin: 0,
                  color: 'var(--color-accent)',
                  textTransform: 'capitalize',
                }}>
                  {offering.qualityTier}
                </p>
              </div>
            )}
          </div>

          {/* Badges */}
          {(cultivar.isHeritage || cultivar.isNonGmo) && (
            <div style={{
              display: 'flex',
              gap: 'var(--space-sm)',
              marginBottom: 'var(--space-lg)',
            }}>
              {cultivar.isHeritage && (
                <span style={{
                  fontFamily: 'var(--font-typewriter)',
                  fontSize: '0.625rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  padding: 'var(--space-xs) var(--space-sm)',
                  border: '1px solid var(--color-rule)',
                  color: 'var(--color-ink-muted)',
                }}>
                  Heritage
                </span>
              )}
              {cultivar.isNonGmo && (
                <span style={{
                  fontFamily: 'var(--font-typewriter)',
                  fontSize: '0.625rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  padding: 'var(--space-xs) var(--space-sm)',
                  border: '1px solid var(--color-rule)',
                  color: 'var(--color-ink-muted)',
                }}>
                  Non-GMO
                </span>
              )}
            </div>
          )}

          {/* Flavor Profile */}
          {cultivar.flavorProfile && (
            <div style={{
              borderTop: '1px dashed var(--color-rule)',
              paddingTop: 'var(--space-lg)',
              marginTop: 'var(--space-lg)',
            }}>
              <p style={{
                fontFamily: 'var(--font-typewriter)',
                fontSize: '0.625rem',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--color-ink-muted)',
                margin: 0,
                marginBottom: 'var(--space-sm)',
              }}>
                Flavor Profile
              </p>
              <p style={{
                fontFamily: 'var(--font-typewriter)',
                fontSize: '0.9375rem',
                fontStyle: 'italic',
                margin: 0,
                lineHeight: 1.6,
              }}>
                "{cultivar.flavorProfile}"
              </p>
            </div>
          )}

          {/* Tasting Notes */}
          {offering.flavorNotes && (
            <div style={{
              borderTop: cultivar.flavorProfile ? 'none' : '1px dashed var(--color-rule)',
              paddingTop: cultivar.flavorProfile ? 'var(--space-md)' : 'var(--space-lg)',
              marginTop: cultivar.flavorProfile ? 0 : 'var(--space-lg)',
            }}>
              {!cultivar.flavorProfile && (
                <p style={{
                  fontFamily: 'var(--font-typewriter)',
                  fontSize: '0.625rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: 'var(--color-ink-muted)',
                  margin: 0,
                  marginBottom: 'var(--space-sm)',
                }}>
                  Tasting Notes
                </p>
              )}
              <p style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '0.9375rem',
                margin: 0,
                lineHeight: 1.6,
                color: 'var(--color-ink-muted)',
              }}>
                {offering.flavorNotes}
              </p>
            </div>
          )}
        </article>

        {/* Back Link */}
        <div style={{
          marginTop: 'var(--space-xl)',
          textAlign: 'center',
        }}>
          <Link
            href="/"
            style={{
              fontFamily: 'var(--font-typewriter)',
              fontSize: '0.8125rem',
              color: 'var(--color-ink-muted)',
              textDecoration: 'underline',
              textDecorationStyle: 'dashed',
              textUnderlineOffset: '3px',
            }}
          >
            ← Back to all products
          </Link>
        </div>
      </main>

      <JournalFooter />
    </div>
  )
}
