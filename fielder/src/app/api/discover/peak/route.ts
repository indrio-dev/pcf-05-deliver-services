/**
 * GET /api/discover/peak
 *
 * Discovery endpoint using the polymorphic SHARE prediction system.
 * Returns items at peak quality RIGHT NOW across all categories.
 *
 * Unlike /api/discover which uses manual GDD estimation, this endpoint
 * uses predictUnified() for full SHARE quality predictions.
 *
 * Query params:
 *   - categories: Comma-separated ProductCategory (produce, livestock, vegetables, etc.)
 *   - subcategories: Comma-separated subcategory filter (citrus, pome_fruit, stone_fruit, berry, etc.)
 *   - regions: Comma-separated region IDs (indian_river, pacific_nw_yakima, etc.)
 *   - states: Comma-separated state abbreviations (FL, CA, WA, etc.)
 *   - limit: Max results per category (default: 50)
 *   - minScore: Minimum quality score 0-100 (default: 50)
 *   - harvestStatus: Filter by harvest status (peak, optimal, early, late)
 *   - sortBy: Sort field (qualityScore, primaryMetric, region, cultivar) - default: qualityScore
 *   - sortOrder: Sort direction (asc, desc) - default: desc
 *
 * Response is cached for 1 hour (results change slowly based on GDD accumulation).
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  predictUnified,
  getRegisteredCategories,
  type PredictionResult,
  type ProductCategory,
} from '@/lib/prediction/prediction-router'
import {
  REGIONAL_OFFERINGS,
  CULTIVARS_BY_ID,
  PRODUCT_TYPES_BY_ID,
  type RegionalOffering,
} from '@/lib/constants/products'
import { US_GROWING_REGIONS } from '@/lib/constants/regions'
import { ALL_GROWING_REGIONS } from '@/lib/constants/growing-regions'

// =============================================================================
// Cache Configuration
// =============================================================================

const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour
const responseCache = new Map<string, { data: PeakDiscoveryResponse; timestamp: number }>()

function getCacheKey(params: URLSearchParams): string {
  // Create deterministic cache key from sorted params
  const sortedParams = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('&')
  return sortedParams || 'default'
}

function getCachedResponse(key: string): PeakDiscoveryResponse | null {
  const cached = responseCache.get(key)
  if (!cached) return null
  if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
    responseCache.delete(key)
    return null
  }
  return cached.data
}

function setCachedResponse(key: string, data: PeakDiscoveryResponse): void {
  // Limit cache size to prevent memory issues
  if (responseCache.size > 100) {
    // Remove oldest entries
    const entries = Array.from(responseCache.entries())
      .sort(([, a], [, b]) => a.timestamp - b.timestamp)
    for (let i = 0; i < 50; i++) {
      responseCache.delete(entries[i][0])
    }
  }
  responseCache.set(key, { data, timestamp: Date.now() })
}

// =============================================================================
// Sort Configuration
// =============================================================================

type SortField = 'qualityScore' | 'primaryMetric' | 'region' | 'cultivar'
type SortOrder = 'asc' | 'desc'

function sortItems(items: PeakDiscoveryItem[], sortBy: SortField, sortOrder: SortOrder): PeakDiscoveryItem[] {
  const multiplier = sortOrder === 'asc' ? 1 : -1

  return [...items].sort((a, b) => {
    switch (sortBy) {
      case 'qualityScore':
        return (a.qualityScore - b.qualityScore) * multiplier
      case 'primaryMetric':
        // For omega ratio, lower is better, so we invert for consistent "best first" sorting
        const aValue = a.primaryMetric.type === 'omega_ratio' ? -a.primaryMetric.value : a.primaryMetric.value
        const bValue = b.primaryMetric.type === 'omega_ratio' ? -b.primaryMetric.value : b.primaryMetric.value
        return (aValue - bValue) * multiplier
      case 'region':
        return a.regionName.localeCompare(b.regionName) * multiplier
      case 'cultivar':
        return a.cultivarName.localeCompare(b.cultivarName) * multiplier
      default:
        return (a.qualityScore - b.qualityScore) * multiplier
    }
  })
}

// =============================================================================
// Types
// =============================================================================

interface PeakDiscoveryItem {
  // Identity
  id: string
  offeringId: string
  cultivarId: string
  regionId: string

  // Display names
  cultivarName: string
  regionName: string
  regionSlug: string
  state: string

  // Classification
  subcategory: string

  // SHARE Quality Prediction
  qualityScore: number
  qualityTier: string
  confidence: number

  // Primary metric (category-specific)
  primaryMetric: {
    type: string
    value: number
    unit: string
    displayName: string
  }

  // Harvest status
  harvestStatus: string
  daysToPeak?: number
  percentToMaturity?: number

  // SHARE pillar summaries
  pillars: {
    soil: { modifier: number; confidence: number; insights: string[] }
    heritage: { modifier: number; confidence: number; insights: string[] }
    agricultural: { modifier: number; confidence: number; insights: string[] }
    ripen: { modifier: number; confidence: number; insights: string[] }
    enrich: { verified: boolean; confidence: number; insights: string[] }
  }

  // Category for grouping
  category: ProductCategory
  modelValidation: string

  // Optional quality notes
  flavorNotes?: string
  qualityTierExpected?: string
}

interface PeakDiscoveryResponse {
  items: PeakDiscoveryItem[]
  summary: {
    totalPredicted: number
    atPeakCount: number
    byCategory: Record<ProductCategory, number>
    bySubcategory: Record<string, number>
    byTier: Record<string, number>
    byState: Record<string, number>
    avgQualityScore: number
  }
  filters: {
    categories: ProductCategory[]
    subcategories: string[]
    regions: string[]
    states: string[]
    sortBy: SortField
    sortOrder: SortOrder
  }
  categories: ProductCategory[]
  cached: boolean
  cacheAge?: number // seconds since cached
  timestamp: string
}

// =============================================================================
// GDD Estimation (from climate data)
// =============================================================================

function estimateCurrentGDD(regionId: string): number {
  const region = US_GROWING_REGIONS[regionId]
  if (!region?.climate) return 0

  const today = new Date()
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) /
      (1000 * 60 * 60 * 24)
  )

  // Use region's historical annual GDD
  const annualGdd = region.climate.annualGdd50 || (region.climate.frostFreeDays || 200) * 15
  const avgDailyGdd = annualGdd / 365

  // Estimate based on growing season
  const lastFrostDoy = region.climate.avgLastFrostDoy || 90
  const firstFrostDoy = region.climate.avgFirstFrostDoy || 300

  let effectiveDays = 0
  if (dayOfYear > lastFrostDoy && dayOfYear < firstFrostDoy) {
    effectiveDays = dayOfYear - lastFrostDoy
  } else if (dayOfYear >= firstFrostDoy) {
    effectiveDays = firstFrostDoy - lastFrostDoy
  }

  return Math.round(effectiveDays * avgDailyGdd)
}

// =============================================================================
// Main Handler
// =============================================================================

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  // Check cache first
  const cacheKey = getCacheKey(searchParams)
  const cachedResponse = getCachedResponse(cacheKey)
  if (cachedResponse) {
    const cached = responseCache.get(cacheKey)!
    return NextResponse.json({
      ...cachedResponse,
      cached: true,
      cacheAge: Math.round((Date.now() - cached.timestamp) / 1000),
    })
  }

  // Parse filters
  const categoryFilter = searchParams.get('categories')?.split(',').filter(Boolean) as ProductCategory[] | undefined
  const subcategoryFilter = searchParams.get('subcategories')?.split(',').filter(Boolean)
  const regionFilter = searchParams.get('regions')?.split(',').filter(Boolean)
  const stateFilter = searchParams.get('states')?.split(',').filter(Boolean).map(s => s.toUpperCase())
  const limit = parseInt(searchParams.get('limit') || '50', 10)
  const minScore = parseFloat(searchParams.get('minScore') || '50')
  const harvestStatusFilter = searchParams.get('harvestStatus')?.split(',').filter(Boolean)
  const sortBy = (searchParams.get('sortBy') || 'qualityScore') as SortField
  const sortOrder = (searchParams.get('sortOrder') || 'desc') as SortOrder

  const registeredCategories = getRegisteredCategories()
  const categoriesToProcess = categoryFilter?.filter(c => registeredCategories.includes(c)) || ['produce']

  const results: PeakDiscoveryItem[] = []
  const errors: string[] = []

  // Process produce category (REGIONAL_OFFERINGS)
  if (categoriesToProcess.includes('produce')) {
    const produceResults = processProduceOfferings(
      limit * 10, // Get more initially for filtering
      minScore,
      harvestStatusFilter,
      subcategoryFilter,
      regionFilter,
      stateFilter
    )
    results.push(...produceResults.items)
    errors.push(...produceResults.errors)
  }

  // Filter to requested limit per category with sorting
  const itemsByCategory = new Map<ProductCategory, PeakDiscoveryItem[]>()
  for (const item of results) {
    const categoryItems = itemsByCategory.get(item.category) || []
    categoryItems.push(item)
    itemsByCategory.set(item.category, categoryItems)
  }

  // Sort each category and limit
  const limitedResults: PeakDiscoveryItem[] = []
  for (const [_category, items] of itemsByCategory) {
    const sortedItems = sortItems(items, sortBy, sortOrder)
    limitedResults.push(...sortedItems.slice(0, limit))
  }

  // Final sort across all categories
  const finalResults = sortItems(limitedResults, sortBy, sortOrder)

  // Calculate summary statistics
  const atPeakCount = finalResults.filter(
    r => r.harvestStatus === 'peak' || r.harvestStatus === 'optimal'
  ).length

  const byCategory = finalResults.reduce((acc, r) => {
    acc[r.category] = (acc[r.category] || 0) + 1
    return acc
  }, {} as Record<ProductCategory, number>)

  const bySubcategory = finalResults.reduce((acc, r) => {
    acc[r.subcategory] = (acc[r.subcategory] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const byTier = finalResults.reduce((acc, r) => {
    acc[r.qualityTier] = (acc[r.qualityTier] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const byState = finalResults.reduce((acc, r) => {
    acc[r.state] = (acc[r.state] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const avgScore =
    finalResults.length > 0
      ? finalResults.reduce((sum, r) => sum + r.qualityScore, 0) / finalResults.length
      : 0

  const response: PeakDiscoveryResponse = {
    items: finalResults,
    summary: {
      totalPredicted: finalResults.length,
      atPeakCount,
      byCategory,
      bySubcategory,
      byTier,
      byState,
      avgQualityScore: Math.round(avgScore * 10) / 10,
    },
    filters: {
      categories: categoriesToProcess,
      subcategories: subcategoryFilter || [],
      regions: regionFilter || [],
      states: stateFilter || [],
      sortBy,
      sortOrder,
    },
    categories: registeredCategories,
    cached: false,
    timestamp: new Date().toISOString(),
  }

  // Cache the response
  setCachedResponse(cacheKey, response)

  return NextResponse.json(response)
}

// =============================================================================
// Produce Processing
// =============================================================================

function processProduceOfferings(
  limit: number,
  minScore: number,
  harvestStatusFilter?: string[],
  subcategoryFilter?: string[],
  regionFilter?: string[],
  stateFilter?: string[]
): { items: PeakDiscoveryItem[]; errors: string[] } {
  const items: PeakDiscoveryItem[] = []
  const errors: string[] = []

  for (const offering of REGIONAL_OFFERINGS) {
    if (!offering.isActive) continue

    // Early exit if we have enough items
    if (items.length >= limit) break

    // Get cultivar ID (varietyId is the backwards compat field)
    const cultivarId = (offering as { varietyId?: string; cultivarId?: string }).varietyId || offering.cultivarId
    if (!cultivarId) continue

    // Look up cultivar details
    const cultivar = CULTIVARS_BY_ID[cultivarId]
    if (!cultivar) continue

    // Get subcategory from product type
    const productType = PRODUCT_TYPES_BY_ID[cultivar.productId]
    const subcategory = productType?.subcategory || 'unknown'

    // Apply subcategory filter early (before expensive prediction)
    if (subcategoryFilter && subcategoryFilter.length > 0) {
      if (!subcategoryFilter.includes(subcategory)) continue
    }

    // Apply region filter early
    if (regionFilter && regionFilter.length > 0) {
      if (!regionFilter.includes(offering.regionId)) continue
    }

    // Get region data
    const region = US_GROWING_REGIONS[offering.regionId]
    if (!region) continue

    // Apply state filter early
    if (stateFilter && stateFilter.length > 0) {
      if (!stateFilter.includes(region.state)) continue
    }

    const regionMeta = ALL_GROWING_REGIONS[offering.regionId as keyof typeof ALL_GROWING_REGIONS]
    const regionSlug = regionMeta?.slug || offering.regionId.replace(/_/g, '-')

    // Estimate current GDD for this region
    const currentGDD = estimateCurrentGDD(offering.regionId)

    try {
      // Call polymorphic prediction
      const prediction = predictUnified({
        category: 'produce',
        cultivarId,
        regionId: offering.regionId,
        currentGDD,
      })

      // Apply harvest status filter
      const harvestStatus = prediction.ripen.details.harvestStatus
      if (harvestStatusFilter && harvestStatusFilter.length > 0) {
        if (!harvestStatusFilter.includes(harvestStatus)) continue
      }

      // Apply minimum score filter
      if (prediction.qualityScore < minScore) continue

      // Build discovery item
      const item: PeakDiscoveryItem = {
        id: offering.id,
        offeringId: offering.id,
        cultivarId,
        regionId: offering.regionId,

        cultivarName: cultivar.displayName || cultivarId,
        regionName: region.displayName,
        regionSlug,
        state: region.state,

        subcategory,

        qualityScore: prediction.qualityScore,
        qualityTier: prediction.qualityTier,
        confidence: prediction.confidence,

        primaryMetric: {
          type: prediction.primaryMetric.type,
          value: Math.round(prediction.primaryMetric.value * 10) / 10,
          unit: prediction.primaryMetric.unit,
          displayName: prediction.primaryMetric.displayName,
        },

        harvestStatus,
        daysToPeak: prediction.ripen.details.daysToHarvest ?? undefined,
        percentToMaturity: prediction.ripen.details.percentToMaturity ?? undefined,

        pillars: {
          soil: {
            modifier: prediction.soil.modifier,
            confidence: prediction.soil.confidence,
            insights: prediction.soil.insights,
          },
          heritage: {
            modifier: prediction.heritage.modifier,
            confidence: prediction.heritage.confidence,
            insights: prediction.heritage.insights,
          },
          agricultural: {
            modifier: prediction.agricultural.modifier,
            confidence: prediction.agricultural.confidence,
            insights: prediction.agricultural.insights,
          },
          ripen: {
            modifier: prediction.ripen.timingModifier,
            confidence: prediction.ripen.confidence,
            insights: prediction.ripen.insights,
          },
          enrich: {
            verified: prediction.enrich.verified,
            confidence: prediction.enrich.confidence,
            insights: prediction.enrich.insights,
          },
        },

        category: 'produce',
        modelValidation: prediction.modelInfo.validationStatus,

        flavorNotes: offering.flavorNotes,
        qualityTierExpected: offering.qualityTier,
      }

      items.push(item)
    } catch (err) {
      // Log but don't fail the whole request
      errors.push(`Failed to predict ${offering.id}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return { items, errors }
}
