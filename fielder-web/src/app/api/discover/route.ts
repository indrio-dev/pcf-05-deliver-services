/**
 * GET /api/discover
 *
 * Discovery endpoint - fetches predictions from Supabase (pre-computed)
 * or falls back to on-the-fly computation if Supabase isn't configured.
 *
 * Query params:
 *   - lat, lon (required): User location for distance sorting
 *   - maxDistance: Filter by distance in miles (50, 100, 250, 500)
 *   - status: Comma-separated list of statuses (at_peak, in_season, approaching, off_season)
 *   - categories: Comma-separated list of categories (fruit, vegetable, nut, meat, dairy, honey, processed)
 *   - subcategories: Comma-separated list (citrus, stone_fruit, etc.)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { US_GROWING_REGIONS } from '@/lib/constants/regions'
import { ALL_GROWING_REGIONS } from '@/lib/constants/growing-regions'
import { getDistanceMiles } from '@/lib/utils/distance'
import type { DailyPrediction } from '@/lib/supabase/types'

// Supabase client - may be null if not configured
let supabase: SupabaseClient | null = null
if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

type Season = 'spring' | 'summer' | 'fall' | 'winter'

interface DiscoveryResult {
  id: string
  offeringId: string
  varietyId: string
  productId: string
  regionId: string
  status: string
  statusMessage: string | null
  harvestStart: string | null
  harvestEnd: string | null
  optimalStart: string | null
  optimalEnd: string | null
  daysUntilStart: number | null
  confidence: number
  distanceMiles: number
  category: string
  subcategory: string
  modelType: string
  qualityTier: string | null
  brix: number | null
  acidity: number | null
  brixAcidRatio: number | null
  isHeritage: boolean
  isNonGmo: boolean
  productDisplayName: string
  varietyDisplayName: string
  regionDisplayName: string
  regionSlug: string
  state: string
  flavorProfile: string | null
  flavorNotes: string | null
  regionLat: number
  regionLon: number
  seasons: Season[]
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const lat = parseFloat(searchParams.get('lat') || '')
  const lon = parseFloat(searchParams.get('lon') || '')

  if (isNaN(lat) || isNaN(lon)) {
    return NextResponse.json(
      { error: 'lat and lon query params are required' },
      { status: 400 }
    )
  }

  // Parse filter params
  const maxDistance = parseFloat(searchParams.get('maxDistance') || '') || null
  const statusFilter = searchParams.get('status')?.split(',').filter(Boolean) || null
  const categoryFilter = searchParams.get('categories')?.split(',').filter(Boolean) || null
  const subcategoryFilter = searchParams.get('subcategories')?.split(',').filter(Boolean) || null
  const seasonsFilter = searchParams.get('seasons')?.split(',').filter(Boolean) as Season[] | null

  // Determine current season
  const month = new Date().getMonth() + 1
  const currentSeason: Season =
    month === 12 || month === 1 || month === 2 ? 'winter' :
    month >= 3 && month <= 5 ? 'spring' :
    month >= 6 && month <= 8 ? 'summer' : 'fall'

  try {
    let results: DiscoveryResult[]
    let source = 'computed'

    if (supabase) {
      // Try to query pre-computed predictions from Supabase
      try {
        results = await fetchFromSupabase(lat, lon, {
          maxDistance,
          statusFilter,
          categoryFilter,
          subcategoryFilter,
          seasonsFilter,
        })
        source = 'supabase'
      } catch (supabaseError) {
        // Supabase query failed (table may not exist), fall back to computation
        console.log('[Discover] Supabase query failed, falling back to computation:', supabaseError)
        results = await fetchFallback(lat, lon, {
          maxDistance,
          statusFilter,
          categoryFilter,
          subcategoryFilter,
          seasonsFilter,
        })
      }
    } else {
      // Fall back to on-the-fly computation
      console.log('[Discover] Supabase not configured, using fallback computation')
      results = await fetchFallback(lat, lon, {
        maxDistance,
        statusFilter,
        categoryFilter,
        subcategoryFilter,
        seasonsFilter,
      })
    }

    // Group by status for UI
    const atPeak = results.filter(p => p.status === 'at_peak')
    const inSeason = results.filter(p => p.status === 'in_season')
    const approaching = results.filter(p => p.status === 'approaching')
    const offSeason = results.filter(p => p.status === 'off_season')

    // Count by category for filter UI
    const categoryCounts = results.reduce((acc, p) => {
      acc[p.category] = (acc[p.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Count by season for filter UI
    const seasonCounts = results.reduce((acc, p) => {
      for (const season of p.seasons) {
        acc[season] = (acc[season] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      atPeak,
      inSeason,
      approaching,
      offSeason,
      totalResults: results.length,
      categoryCounts,
      seasonCounts,
      currentSeason,
      source,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Discovery error:', error)
    let errorMessage: string
    if (error instanceof Error) {
      errorMessage = error.message
    } else if (typeof error === 'object' && error !== null) {
      errorMessage = JSON.stringify(error)
    } else {
      errorMessage = String(error)
    }
    return NextResponse.json(
      {
        error: 'Failed to fetch discovery data',
        details: errorMessage,
      },
      { status: 500 }
    )
  }
}

/**
 * Fetch predictions from Supabase (pre-computed)
 */
async function fetchFromSupabase(
  userLat: number,
  userLon: number,
  filters: {
    maxDistance: number | null
    statusFilter: string[] | null
    categoryFilter: string[] | null
    subcategoryFilter: string[] | null
    seasonsFilter: Season[] | null
  }
): Promise<DiscoveryResult[]> {
  const today = new Date().toISOString().slice(0, 10)

  // Build query
  let query = supabase!
    .from('daily_predictions')
    .select('*')
    .eq('computed_date', today)

  // Apply status filter
  if (filters.statusFilter && filters.statusFilter.length > 0) {
    query = query.in('status', filters.statusFilter)
  }

  // Apply category filter
  if (filters.categoryFilter && filters.categoryFilter.length > 0) {
    query = query.in('category', filters.categoryFilter)
  }

  // Apply subcategory filter
  if (filters.subcategoryFilter && filters.subcategoryFilter.length > 0) {
    query = query.in('subcategory', filters.subcategoryFilter)
  }

  const { data, error } = await query

  if (error) {
    console.error('[Discover] Supabase query error:', error)
    throw error
  }

  if (!data || data.length === 0) {
    console.log('[Discover] No predictions found for today, falling back to computation')
    return fetchFallback(userLat, userLon, filters)
  }

  // Import getSeasonsFromMonths for deriving seasons
  const { getSeasonsFromMonths } = await import('@/lib/constants/products')

  // Map to results with distance
  let results: DiscoveryResult[] = data.map((row: DailyPrediction) => {
    // Derive seasons from peak_months if available in the row
    const peakMonths = (row as any).peak_months as number[] | undefined
    const seasons = getSeasonsFromMonths(peakMonths)
    // Look up region slug from constants
    const regionData = ALL_GROWING_REGIONS[row.region_id as keyof typeof ALL_GROWING_REGIONS]
    const regionSlug = regionData?.slug || row.region_id.replace(/_/g, '-')

    return {
      id: row.id,
      offeringId: row.offering_id,
      varietyId: row.variety_id,
      productId: row.product_id,
      regionId: row.region_id,
      status: row.status,
      statusMessage: row.status_message,
      harvestStart: row.harvest_start,
      harvestEnd: row.harvest_end,
      optimalStart: row.optimal_start,
      optimalEnd: row.optimal_end,
      daysUntilStart: row.days_until_start,
      confidence: row.confidence,
      distanceMiles: getDistanceMiles(userLat, userLon, row.region_lat, row.region_lon),
      category: row.category,
      subcategory: row.subcategory,
      modelType: row.model_type,
      qualityTier: row.quality_tier,
      brix: row.brix,
      acidity: row.acidity,
      brixAcidRatio: row.brix_acid_ratio,
      isHeritage: row.is_heritage,
      isNonGmo: row.is_non_gmo,
      productDisplayName: row.product_display_name,
      varietyDisplayName: row.variety_display_name,
      regionDisplayName: row.region_display_name,
      regionSlug,
      state: row.state,
      flavorProfile: row.flavor_profile,
      flavorNotes: row.flavor_notes,
      regionLat: row.region_lat,
      regionLon: row.region_lon,
      seasons,
    }
  })

  // Apply distance filter
  if (filters.maxDistance) {
    results = results.filter(r => r.distanceMiles <= filters.maxDistance!)
  }

  // Sort by status priority then distance
  const statusPriority: Record<string, number> = {
    'at_peak': 0,
    'in_season': 1,
    'approaching': 2,
    'off_season': 3,
  }

  results.sort((a, b) => {
    const statusDiff = statusPriority[a.status] - statusPriority[b.status]
    if (statusDiff !== 0) return statusDiff
    return a.distanceMiles - b.distanceMiles
  })

  return results
}

/**
 * Fallback: compute predictions on-the-fly (when Supabase not configured)
 * Uses estimated GDD from climate data instead of live weather API to avoid timeouts
 */
async function fetchFallback(
  userLat: number,
  userLon: number,
  filters: {
    maxDistance: number | null
    statusFilter: string[] | null
    categoryFilter: string[] | null
    subcategoryFilter: string[] | null
    seasonsFilter: Season[] | null
  }
): Promise<DiscoveryResult[]> {
  // Import the products catalog
  const { REGIONAL_OFFERINGS, getOfferingDetails, getSeasonsFromMonths } = await import('@/lib/constants/products')

  const today = new Date()
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24))

  // Estimate GDD from region's historical climate data (annualGdd50 / 365 * dayOfYear)
  // This avoids slow weather API calls that timeout on Vercel
  const regionGddMap = new Map<string, { totalGdd: number; avgDailyGdd: number }>()

  for (const [regionId, region] of Object.entries(US_GROWING_REGIONS)) {
    // Use region's historical annual GDD or estimate from frost-free days
    const annualGdd = region.climate?.annualGdd50 || (region.climate?.frostFreeDays || 200) * 15
    const avgDailyGdd = annualGdd / 365

    // Estimate current accumulated GDD based on day of year
    // Account for growing season (after last frost, before first frost)
    const lastFrostDoy = region.climate?.avgLastFrostDoy || 90
    const firstFrostDoy = region.climate?.avgFirstFrostDoy || 300

    let effectiveDays = 0
    if (dayOfYear > lastFrostDoy && dayOfYear < firstFrostDoy) {
      effectiveDays = dayOfYear - lastFrostDoy
    } else if (dayOfYear >= firstFrostDoy) {
      effectiveDays = firstFrostDoy - lastFrostDoy
    }

    const totalGdd = Math.round(effectiveDays * avgDailyGdd)
    regionGddMap.set(regionId, { totalGdd, avgDailyGdd })
  }

  const results: DiscoveryResult[] = []

  for (const offering of REGIONAL_OFFERINGS) {
    if (!offering.isActive) continue

    const details = getOfferingDetails(offering.id)
    if (!details) continue

    const { variety, product, gddToMaturity, gddToPeak, gddWindow, baseTemp, peakMonths } = details
    const region = US_GROWING_REGIONS[offering.regionId]
    if (!region) continue
    // Look up region slug from ALL_GROWING_REGIONS
    const regionMeta = ALL_GROWING_REGIONS[offering.regionId as keyof typeof ALL_GROWING_REGIONS]
    const regionSlug = regionMeta?.slug || offering.regionId.replace(/_/g, '-')

    // Apply category filter
    if (filters.categoryFilter && !filters.categoryFilter.includes(product.category)) continue
    if (filters.subcategoryFilter && !filters.subcategoryFilter.includes(product.subcategory)) continue

    // Calculate distance
    const distance = getDistanceMiles(userLat, userLon, region.latitude, region.longitude)
    if (filters.maxDistance && distance > filters.maxDistance) continue

    let status: string
    let statusMessage: string
    let daysUntilStart: number | null = null
    let harvestStart: string | null = null
    let harvestEnd: string | null = null
    let optimalStart: string | null = null
    let optimalEnd: string | null = null
    let confidence = 0.85

    if (variety.modelType === 'gdd') {
      const gddData = regionGddMap.get(offering.regionId)
      if (!gddData) continue

      const gddToMaturityVal = gddToMaturity ?? 2000
      const gddToPeakVal = gddToPeak ?? (gddToMaturityVal + (gddWindow ?? 400) / 2)
      const gddWindowVal = gddWindow ?? 400

      const daysToMaturity = gddData.avgDailyGdd > 0
        ? Math.round((gddToMaturityVal - gddData.totalGdd) / gddData.avgDailyGdd)
        : 0

      const daysToEnd = gddData.avgDailyGdd > 0
        ? Math.round((gddToMaturityVal + gddWindowVal - gddData.totalGdd) / gddData.avgDailyGdd)
        : 0

      // Determine status
      if (daysToMaturity <= 0 && daysToEnd > 0) {
        // In harvest window
        const midpoint = (daysToMaturity + daysToEnd) / 2
        if (Math.abs(daysToMaturity) < gddWindowVal / (gddData.avgDailyGdd * 4)) {
          status = 'at_peak'
          statusMessage = `Peak quality now`
        } else {
          status = 'in_season'
          statusMessage = `In season`
        }
      } else if (daysToMaturity > 0 && daysToMaturity <= 30) {
        status = 'approaching'
        statusMessage = `Coming in ~${daysToMaturity} days`
        daysUntilStart = daysToMaturity
      } else {
        status = 'off_season'
        statusMessage = daysToEnd < 0 ? 'Season ended' : 'Off season'
      }

      // Calculate dates
      const harvestStartDate = new Date(today.getTime() + daysToMaturity * 24 * 60 * 60 * 1000)
      const harvestEndDate = new Date(today.getTime() + daysToEnd * 24 * 60 * 60 * 1000)
      harvestStart = harvestStartDate.toISOString().slice(0, 10)
      harvestEnd = harvestEndDate.toISOString().slice(0, 10)

    } else if (variety.modelType === 'calendar') {
      const currentMonth = today.getMonth() + 1
      const isInPeak = peakMonths?.includes(currentMonth) || false
      const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1
      const isApproaching = !isInPeak && (peakMonths?.includes(nextMonth) || false)

      if (isInPeak) {
        status = 'at_peak'
        statusMessage = `At peak availability`
      } else if (isApproaching) {
        status = 'approaching'
        const nextMonthStart = new Date(today.getFullYear(), nextMonth - 1, 1)
        if (nextMonth === 1) nextMonthStart.setFullYear(today.getFullYear() + 1)
        daysUntilStart = Math.ceil((nextMonthStart.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        statusMessage = `Coming soon - peak begins next month`
      } else {
        status = 'off_season'
        statusMessage = 'Off season'
      }
      confidence = 0.90
    } else {
      // Parent model - skip for now
      continue
    }

    // Apply status filter
    if (filters.statusFilter && !filters.statusFilter.includes(status)) continue

    // Get seasons from peakMonths
    const seasons = getSeasonsFromMonths(peakMonths)

    // Apply seasons filter
    if (filters.seasonsFilter && filters.seasonsFilter.length > 0) {
      const hasMatchingSeason = seasons.some(s => filters.seasonsFilter!.includes(s))
      if (!hasMatchingSeason) continue
    }

    results.push({
      id: offering.id,
      offeringId: offering.id,
      varietyId: variety.id,
      productId: product.id,
      regionId: offering.regionId,
      status,
      statusMessage,
      harvestStart,
      harvestEnd,
      optimalStart,
      optimalEnd,
      daysUntilStart,
      confidence,
      distanceMiles: distance,
      category: product.category,
      subcategory: product.subcategory,
      modelType: variety.modelType,
      qualityTier: offering.qualityTier || null,
      brix: null,
      acidity: null,
      brixAcidRatio: null,
      isHeritage: variety.isHeritage || false,
      isNonGmo: variety.isNonGmo || false,
      productDisplayName: product.displayName,
      varietyDisplayName: variety.displayName,
      regionDisplayName: region.displayName,
      regionSlug,
      state: region.state,
      flavorProfile: variety.flavorProfile || null,
      flavorNotes: offering.flavorNotes || null,
      regionLat: region.latitude,
      regionLon: region.longitude,
      seasons,
    })
  }

  // Sort by status priority then distance
  const statusPriority: Record<string, number> = {
    'at_peak': 0,
    'in_season': 1,
    'approaching': 2,
    'off_season': 3,
  }

  results.sort((a, b) => {
    const statusDiff = statusPriority[a.status] - statusPriority[b.status]
    if (statusDiff !== 0) return statusDiff
    return a.distanceMiles - b.distanceMiles
  })

  return results
}
