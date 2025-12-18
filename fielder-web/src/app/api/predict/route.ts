/**
 * POST /api/predict
 *
 * Predict harvest window for a crop/region combination
 */

import { NextRequest, NextResponse } from 'next/server'
import { weatherService } from '@/lib/services/weather'
import { harvestPredictor } from '@/lib/services/harvest-predictor'
import { getGddTargets } from '@/lib/constants/gdd-targets'
import { getRegion, US_GROWING_REGIONS } from '@/lib/constants/regions'
import { subDays } from 'date-fns'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { crop, region, cultivar_brix, rootstock_mod, tree_age } = body

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

    // Get GDD targets for crop
    const targets = getGddTargets(crop)

    // Get recent weather to calculate current GDD accumulation
    // Use Jan 1 as reference for perennial crops, or estimate bloom date
    const today = new Date()
    const referenceDate = new Date(today.getFullYear(), 0, 1) // Jan 1

    // Get GDD accumulation from reference date
    const gddData = await weatherService.getGddAccumulation(
      region,
      referenceDate,
      targets.baseTemp
    )

    // Predict harvest window
    const window = harvestPredictor.predictHarvestWindow(
      crop,
      region,
      gddData.totalGdd,
      gddData.avgDailyGdd
    )

    // Format response
    const formatted = harvestPredictor.formatHarvestWindow(window)
    const status = harvestPredictor.getHarvestStatus(window)

    // Estimate quality if Brix parameters provided
    let quality = null
    if (cultivar_brix) {
      const brix = harvestPredictor.predictBrix(
        cultivar_brix,
        rootstock_mod || 0,
        tree_age || null,
        gddData.totalGdd,
        targets.gddToPeak || targets.gddToMaturity
      )
      quality = brix
    }

    // Estimate sugar/acid for citrus
    let sugarAcid = null
    if (crop.includes('orange') || crop.includes('grapefruit') || crop.includes('tangerine') || crop.includes('satsuma')) {
      sugarAcid = harvestPredictor.estimateSugarAcid(gddData.totalGdd)
    }

    return NextResponse.json({
      crop,
      region,
      region_name: regionData.displayName,

      // Dates
      harvest_start_date: formatted.harvestStartDate,
      harvest_end_date: formatted.harvestEndDate,
      optimal_start_date: formatted.optimalStartDate,
      optimal_end_date: formatted.optimalEndDate,

      // GDD info
      current_gdd: gddData.totalGdd,
      gdd_to_maturity: targets.gddToMaturity,
      gdd_to_peak: targets.gddToPeak,
      avg_daily_gdd: gddData.avgDailyGdd,

      // Status
      status: status.status,
      status_message: status.message,
      days_until: status.daysUntil,

      // Quality (if available)
      quality,
      sugar_acid: sugarAcid,

      // Metadata
      confidence: window.confidence,
      base_temp: targets.baseTemp
    })

  } catch (error) {
    console.error('Prediction error:', error)
    return NextResponse.json(
      { error: 'Failed to generate prediction' },
      { status: 500 }
    )
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
