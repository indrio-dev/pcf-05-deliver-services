/**
 * POST /api/cron/compute-predictions
 *
 * Daily cron job to compute harvest predictions for all regional offerings.
 * Run via Vercel Cron at 4am UTC daily.
 *
 * This endpoint:
 * 1. Fetches weather/GDD data for all regions
 * 2. Computes predictions for each offering (variety × region)
 * 3. Upserts results to Supabase daily_predictions table
 * 4. Cleans up predictions older than 7 days
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { weatherService } from '@/lib/services/weather'
import { harvestPredictor } from '@/lib/services/harvest-predictor'
import {
  REGIONAL_OFFERINGS,
  VARIETIES_BY_ID,
  PRODUCTS_BY_ID,
  getOfferingDetails,
} from '@/lib/constants/products'
import { US_GROWING_REGIONS } from '@/lib/constants/regions'
import type { DailyPredictionInsert } from '@/lib/supabase/types'

// Use service role key for cron jobs (bypasses RLS)
// Handle missing Supabase config gracefully
let supabase: SupabaseClient | null = null
if (process.env.NEXT_PUBLIC_SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
  supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Vercel Cron secret for authentication
const CRON_SECRET = process.env.CRON_SECRET

export async function POST(request: NextRequest) {
  // Verify cron secret (Vercel sends this header for cron jobs)
  const authHeader = request.headers.get('authorization')
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startTime = Date.now()
  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)

  console.log(`[Cron] Starting prediction computation for ${todayStr}`)

  try {
    // Step 1: Fetch GDD data for all regions
    const regionGddMap = await fetchRegionGddData()
    console.log(`[Cron] Fetched GDD for ${regionGddMap.size} regions`)

    // Step 2: Compute predictions for all offerings
    const predictions: DailyPredictionInsert[] = []
    let gddCount = 0
    let calendarCount = 0
    let skippedCount = 0

    const skipReasons: Record<string, number> = {}
    for (const offering of REGIONAL_OFFERINGS) {
      if (!offering.isActive) {
        skipReasons['inactive'] = (skipReasons['inactive'] || 0) + 1
        skippedCount++
        continue
      }

      const details = getOfferingDetails(offering.id)
      if (!details) {
        skipReasons['no_details'] = (skipReasons['no_details'] || 0) + 1
        skippedCount++
        continue
      }

      const { variety, product } = details
      const region = US_GROWING_REGIONS[offering.regionId]
      if (!region) {
        skipReasons['no_region:' + offering.regionId] = (skipReasons['no_region:' + offering.regionId] || 0) + 1
        skippedCount++
        continue
      }

      // Different handling based on model type
      if (variety.modelType === 'gdd') {
        const gddData = regionGddMap.get(offering.regionId)
        if (!gddData) {
          skipReasons['no_gdd:' + offering.regionId] = (skipReasons['no_gdd:' + offering.regionId] || 0) + 1
          skippedCount++
          continue
        }

        const prediction = computeGddPrediction(
          offering,
          details,
          region,
          gddData,
          todayStr
        )
        predictions.push(prediction)
        gddCount++
      } else if (variety.modelType === 'calendar') {
        const prediction = computeCalendarPrediction(
          offering,
          details,
          region,
          today,
          todayStr
        )
        predictions.push(prediction)
        calendarCount++
      }
      // 'parent' model type is derived from parent variety - skip for now
      if (variety.modelType === 'parent') {
        skipReasons['parent_model'] = (skipReasons['parent_model'] || 0) + 1
        skippedCount++
      }
    }

    console.log(`[Cron] Computed ${predictions.length} predictions (${gddCount} GDD, ${calendarCount} calendar, ${skippedCount} skipped)`)
    console.log(`[Cron] Skip reasons:`, JSON.stringify(skipReasons))

    // Step 3: Upsert predictions to Supabase (if configured)
    let dbResult = { upserted: false, message: 'Supabase not configured' }
    if (supabase && predictions.length > 0) {
      const { error: upsertError } = await supabase
        .from('daily_predictions')
        .upsert(predictions, {
          onConflict: 'offering_id,computed_date',
          ignoreDuplicates: false,
        })

      if (upsertError) {
        console.error('[Cron] Upsert error:', upsertError)
        throw upsertError
      }
      dbResult = { upserted: true, message: `Upserted ${predictions.length} predictions` }

      // Step 4: Cleanup old predictions
      const { error: cleanupError } = await supabase
        .from('daily_predictions')
        .delete()
        .lt('computed_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10))

      if (cleanupError) {
        console.warn('[Cron] Cleanup warning:', cleanupError)
      }
    } else if (!supabase) {
      console.log('[Cron] Supabase not configured - predictions computed but not stored')
      // Log a sample prediction for debugging
      if (predictions.length > 0) {
        console.log('[Cron] Sample prediction:', JSON.stringify(predictions[0], null, 2))
      }
    }

    const duration = Date.now() - startTime
    console.log(`[Cron] Completed in ${duration}ms`)

    return NextResponse.json({
      success: true,
      date: todayStr,
      predictions: predictions.length,
      gdd: gddCount,
      calendar: calendarCount,
      skipped: skippedCount,
      duration: `${duration}ms`,
      database: dbResult,
    })
  } catch (error) {
    console.error('[Cron] Error:', error)
    return NextResponse.json(
      { error: 'Failed to compute predictions', details: String(error) },
      { status: 500 }
    )
  }
}

// Also allow GET for manual testing
export async function GET(request: NextRequest) {
  return POST(request)
}

/**
 * Fetch GDD data for all regions in parallel
 */
async function fetchRegionGddData(): Promise<Map<string, { totalGdd: number; avgDailyGdd: number }>> {
  const results = new Map<string, { totalGdd: number; avgDailyGdd: number }>()
  const today = new Date()
  const referenceDate = new Date(today.getFullYear(), 0, 1) // Jan 1

  // Fetch in batches to avoid rate limits
  const regionIds = Object.keys(US_GROWING_REGIONS)

  await Promise.all(
    regionIds.map(async (regionId) => {
      try {
        // Use base temp of 50°F as default (most common)
        const gddData = await weatherService.getGddAccumulation(regionId, referenceDate, 50)
        results.set(regionId, gddData)
      } catch (e) {
        console.warn(`[Cron] Failed to get GDD for ${regionId}:`, e)
      }
    })
  )

  return results
}

/**
 * Compute prediction for a GDD-based offering
 */
function computeGddPrediction(
  offering: typeof REGIONAL_OFFERINGS[number],
  details: ReturnType<typeof getOfferingDetails>,
  region: typeof US_GROWING_REGIONS[keyof typeof US_GROWING_REGIONS],
  gddData: { totalGdd: number; avgDailyGdd: number },
  todayStr: string
): DailyPredictionInsert {
  const { variety, product, gddToMaturity, gddToPeak, gddWindow, baseTemp } = details!

  // Calculate harvest window using variety-specific GDD targets
  const gddToMaturityVal = gddToMaturity ?? 2000
  const gddToPeakVal = gddToPeak ?? (gddToMaturityVal + (gddWindow ?? 400) / 2)
  const gddWindowVal = gddWindow ?? 400

  // Calculate days to key milestones
  const daysToMaturity = gddData.avgDailyGdd > 0
    ? Math.round((gddToMaturityVal - gddData.totalGdd) / gddData.avgDailyGdd)
    : 0
  const daysToPeak = gddData.avgDailyGdd > 0
    ? Math.round((gddToPeakVal - gddData.totalGdd) / gddData.avgDailyGdd)
    : 0
  const daysToEnd = gddData.avgDailyGdd > 0
    ? Math.round((gddToMaturityVal + gddWindowVal - gddData.totalGdd) / gddData.avgDailyGdd)
    : 0

  const today = new Date()
  const harvestStart = new Date(today.getTime() + daysToMaturity * 24 * 60 * 60 * 1000)
  const harvestEnd = new Date(today.getTime() + daysToEnd * 24 * 60 * 60 * 1000)
  const windowDuration = daysToEnd - daysToMaturity
  const optimalOffset = Math.round(windowDuration * 0.25)
  const optimalStart = new Date(harvestStart.getTime() + optimalOffset * 24 * 60 * 60 * 1000)
  const optimalEnd = new Date(harvestEnd.getTime() - optimalOffset * 24 * 60 * 60 * 1000)

  // Build harvest window object for status calculation
  const window = {
    cropId: variety.id,
    regionId: offering.regionId,
    year: today.getFullYear(),
    harvestStart,
    harvestEnd,
    optimalStart,
    optimalEnd,
    gddAtHarvestStart: gddToMaturityVal,
    gddAtPeak: gddToPeakVal,
    confidence: Math.min(0.95, Math.max(0.5, 1 - (Math.abs(Math.max(daysToMaturity, daysToPeak, daysToEnd)) / 365) * 0.3)),
  }
  const formatted = harvestPredictor.formatHarvestWindow(window)
  const rawStatus = harvestPredictor.getHarvestStatus(window)

  // Map harvest status to allowed values
  type AllowedStatus = 'at_peak' | 'in_season' | 'approaching' | 'off_season'
  const statusMap: Record<string, AllowedStatus> = {
    'at_peak': 'at_peak',
    'optimal': 'at_peak',
    'in_season': 'in_season',
    'approaching': 'approaching',
    'upcoming': 'approaching',
    'off_season': 'off_season',
    'ended': 'off_season',
  }
  const status = {
    status: statusMap[rawStatus.status] || 'off_season',
    message: rawStatus.message,
    daysUntil: rawStatus.daysUntil,
  }

  // Estimate sugar/acid for citrus
  let brix: number | null = null
  let acidity: number | null = null
  let brixAcidRatio: number | null = null
  if (product.subcategory === 'citrus') {
    const sugarAcid = harvestPredictor.estimateSugarAcid(gddData.totalGdd)
    brix = sugarAcid.ssc
    acidity = sugarAcid.ta
    brixAcidRatio = sugarAcid.ratio
  }

  return {
    offering_id: offering.id,
    variety_id: variety.id,
    product_id: product.id,
    region_id: offering.regionId,
    rootstock_id: null,
    rootstock_name: null,
    rootstock_vigor: null,
    rootstock_days_offset: 0,
    computed_date: todayStr,
    status: status.status as 'at_peak' | 'in_season' | 'approaching' | 'off_season',
    status_message: status.message,
    days_until_start: status.daysUntil && status.status === 'approaching' ? status.daysUntil : null,
    days_until_peak: null, // Could compute from GDD
    days_until_end: null,
    harvest_start: formatted.harvestStartDate,
    harvest_end: formatted.harvestEndDate,
    optimal_start: formatted.optimalStartDate,
    optimal_end: formatted.optimalEndDate,
    current_gdd: gddData.totalGdd,
    gdd_to_maturity: gddToMaturity ?? null,
    avg_daily_gdd: gddData.avgDailyGdd,
    quality_tier: offering.qualityTier || null,
    brix,
    acidity,
    brix_acid_ratio: brixAcidRatio,
    category: product.category,
    subcategory: product.subcategory,
    model_type: 'gdd',
    is_heritage: variety.isHeritage || false,
    is_non_gmo: variety.isNonGmo || false,
    product_display_name: product.displayName,
    variety_display_name: variety.displayName,
    region_display_name: region.displayName,
    state: region.state,
    region_lat: region.latitude,
    region_lon: region.longitude,
    flavor_profile: variety.flavorProfile || null,
    flavor_notes: offering.flavorNotes || null,
    confidence: window.confidence,
  }
}

/**
 * Compute prediction for a calendar-based offering (meat, honey, etc.)
 */
function computeCalendarPrediction(
  offering: typeof REGIONAL_OFFERINGS[number],
  details: ReturnType<typeof getOfferingDetails>,
  region: typeof US_GROWING_REGIONS[keyof typeof US_GROWING_REGIONS],
  today: Date,
  todayStr: string
): DailyPredictionInsert {
  const { variety, product, peakMonths } = details!
  const currentMonth = today.getMonth() + 1 // 1-12

  // Determine status based on peak months
  const isInPeak = peakMonths?.includes(currentMonth) || false

  // Check if next month is peak (approaching)
  const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1
  const isApproaching = !isInPeak && (peakMonths?.includes(nextMonth) || false)

  let status: 'at_peak' | 'in_season' | 'approaching' | 'off_season'
  let statusMessage: string
  let daysUntilStart: number | null = null

  if (isInPeak) {
    status = 'at_peak'
    statusMessage = `${variety.displayName} is at peak availability`
  } else if (isApproaching) {
    status = 'approaching'
    // Calculate days until next month
    const nextMonthStart = new Date(today.getFullYear(), nextMonth - 1, 1)
    if (nextMonth === 1) nextMonthStart.setFullYear(today.getFullYear() + 1)
    daysUntilStart = Math.ceil((nextMonthStart.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    statusMessage = `Coming soon - peak begins next month`
  } else {
    status = 'off_season'
    statusMessage = `Off season - check back in ${peakMonths?.[0] ? new Date(2000, peakMonths[0] - 1).toLocaleString('default', { month: 'long' }) : 'season'}`
  }

  // Compute approximate harvest window from peak months
  const harvestStart = peakMonths && peakMonths.length > 0
    ? new Date(today.getFullYear(), peakMonths[0] - 1, 1).toISOString().slice(0, 10)
    : null
  const harvestEnd = peakMonths && peakMonths.length > 0
    ? new Date(today.getFullYear(), peakMonths[peakMonths.length - 1], 0).toISOString().slice(0, 10)
    : null

  return {
    offering_id: offering.id,
    variety_id: variety.id,
    product_id: product.id,
    region_id: offering.regionId,
    rootstock_id: null,
    rootstock_name: null,
    rootstock_vigor: null,
    rootstock_days_offset: 0,
    computed_date: todayStr,
    status,
    status_message: statusMessage,
    days_until_start: daysUntilStart,
    days_until_peak: null,
    days_until_end: null,
    harvest_start: harvestStart,
    harvest_end: harvestEnd,
    optimal_start: harvestStart,
    optimal_end: harvestEnd,
    current_gdd: null,
    gdd_to_maturity: null,
    avg_daily_gdd: null,
    quality_tier: offering.qualityTier || null,
    brix: null,
    acidity: null,
    brix_acid_ratio: null,
    category: product.category,
    subcategory: product.subcategory,
    model_type: 'calendar',
    is_heritage: variety.isHeritage || false,
    is_non_gmo: variety.isNonGmo || false,
    product_display_name: product.displayName,
    variety_display_name: variety.displayName,
    region_display_name: region.displayName,
    state: region.state,
    region_lat: region.latitude,
    region_lon: region.longitude,
    flavor_profile: variety.flavorProfile || null,
    flavor_notes: offering.flavorNotes || null,
    confidence: 0.90, // Calendar-based has high confidence
  }
}
