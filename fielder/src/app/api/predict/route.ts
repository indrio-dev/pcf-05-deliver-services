/**
 * POST /api/predict
 *
 * UNIFIED PREDICTION API
 *
 * This route uses the canonical quality-predictor as the single source of truth
 * for all SHARE quality predictions. This ensures consistency across:
 * - API consumers
 * - Web UI pages
 * - Mobile apps
 *
 * Core Formula: Peak Brix = Cultivar_Base + Rootstock_Mod + Age_Mod + Timing_Mod
 */

import { NextRequest, NextResponse } from 'next/server'
import { weatherService } from '@/lib/services/weather'
import { getRegion, US_GROWING_REGIONS } from '@/lib/constants/regions'
import {
  predictQuality,
  findOptimalHarvestTime,
  type QualityPredictionInput,
} from '@/lib/prediction/quality-predictor'
import { getCropPhenology, getBloomDate } from '@/lib/constants/crop-phenology'
import { format } from 'date-fns'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { crop, region, cultivar_brix, rootstock_mod, tree_age, rootstock_id, cultivar_id } = body

    // Validate required fields
    if (!crop || !region) {
      return NextResponse.json(
        { error: 'crop and region are required' },
        { status: 400 }
      )
    }

    // Validate region exists
    const regionData = getRegion(region)
    if (!regionData) {
      return NextResponse.json(
        { error: `Unknown region: ${region}. Valid regions: ${Object.keys(US_GROWING_REGIONS).join(', ')}` },
        { status: 400 }
      )
    }

    // Check crop is viable for region
    if (!regionData.viableCrops.includes(crop)) {
      return NextResponse.json(
        { error: `${crop} is not viable in ${region}. Viable crops: ${regionData.viableCrops.join(', ')}` },
        { status: 400 }
      )
    }

    // Get phenology data (single source of truth for GDD parameters)
    const phenology = getCropPhenology(crop, region)
    const gddBase = phenology?.gddBase ?? 50
    const gddToMaturity = phenology?.gddToMaturity ?? 2000
    const gddToPeak = phenology?.gddToPeak ?? gddToMaturity + 300
    const gddWindow = phenology?.gddWindow ?? 400

    // Get bloom date for this year
    const today = new Date()
    const bloomDate = getBloomDate(crop, region, today.getFullYear())
    const referenceDate = bloomDate ?? new Date(today.getFullYear(), 0, 1)

    // Get actual GDD accumulation from weather API
    const gddData = await weatherService.getGddAccumulation(
      region,
      referenceDate,
      gddBase
    )

    // Use the canonical quality predictor
    const cultivarIdToUse = cultivar_id || crop
    const predictionInput: QualityPredictionInput = {
      cultivarId: cultivarIdToUse,
      regionId: region,
      rootstockId: rootstock_id,
      treeAgeYears: tree_age,
      currentGDD: gddData.totalGdd,
      currentDate: today,
    }

    const prediction = predictQuality(predictionInput)

    // Get optimal harvest timing
    const harvestTiming = findOptimalHarvestTime(cultivarIdToUse, region, today.getFullYear())

    // Format dates for response
    const formatDate = (date: Date | undefined) =>
      date ? format(date, 'MMMM dd') : undefined

    return NextResponse.json({
      crop,
      region,
      region_name: regionData.displayName,

      // Dates (from unified predictor)
      harvest_start_date: formatDate(prediction.harvestWindowStart),
      harvest_end_date: formatDate(prediction.harvestWindowEnd),
      optimal_start_date: harvestTiming ? formatDate(harvestTiming.peakStart) : formatDate(prediction.optimalHarvestDate),
      optimal_end_date: harvestTiming ? formatDate(harvestTiming.peakEnd) : formatDate(prediction.optimalHarvestDate),

      // GDD info (from phenology - single source)
      current_gdd: gddData.totalGdd,
      gdd_to_maturity: gddToMaturity,
      gdd_to_peak: gddToPeak,
      gdd_window: gddWindow,
      avg_daily_gdd: gddData.avgDailyGdd,

      // Status (from unified predictor)
      status: prediction.ripen.harvestStatus,
      status_message: getStatusMessage(prediction.ripen.harvestStatus, prediction.ripen.daysToPeak),
      days_until: prediction.daysToPeak,

      // Quality prediction (unified)
      quality: {
        predictedBrix: prediction.predictedBrix,
        qualityTier: prediction.predictedTier,
        qualityScore: prediction.predictedQualityScore,
        // SHARE breakdown
        heritage: {
          cultivarBase: prediction.heritage.baseBrix,
          rootstockModifier: prediction.heritage.rootstockModifier,
        },
        ripen: {
          timingModifier: prediction.ripen.timingModifier,
          percentToMaturity: prediction.ripen.percentToMaturity,
          percentToPeak: prediction.ripen.percentToPeak,
        },
        confidence: prediction.confidence,
      },

      // Sugar/acid for citrus (from unified predictor)
      sugar_acid: prediction.enrich?.titratableAcid !== undefined
        ? {
            ssc: prediction.predictedBrix,
            ta: prediction.enrich.titratableAcid,
            ratio: prediction.enrich.brixAcidRatio,
          }
        : null,

      // Metadata
      confidence: prediction.confidence,
      base_temp: gddBase,
      prediction_basis: prediction.predictionBasis,
      warnings: prediction.warnings,
    })

  } catch (error) {
    console.error('Prediction error:', error)
    return NextResponse.json(
      { error: 'Failed to generate prediction' },
      { status: 500 }
    )
  }
}

/**
 * Convert harvest status to human-readable message.
 */
function getStatusMessage(
  status: string,
  daysToPeak: number | undefined
): string {
  switch (status) {
    case 'pre_season':
      return 'Not yet in season'
    case 'approaching':
      return daysToPeak ? `${daysToPeak} days until harvest` : 'Approaching harvest'
    case 'harvest_window':
      return daysToPeak ? `${daysToPeak} days to peak` : 'In harvest window'
    case 'peak':
      return 'At peak quality!'
    case 'late_season':
      return 'Past peak, quality declining'
    case 'post_season':
      return 'Season ended'
    default:
      return 'Status unknown'
  }
}

// Also support GET for simple queries
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const crop = searchParams.get('crop')
  const region = searchParams.get('region')

  if (!crop || !region) {
    return NextResponse.json(
      { error: 'crop and region query params are required' },
      { status: 400 }
    )
  }

  // Convert to POST request body
  const body = { crop, region }

  // Create a new request with the body
  const postRequest = new NextRequest(request.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })

  return POST(postRequest)
}
