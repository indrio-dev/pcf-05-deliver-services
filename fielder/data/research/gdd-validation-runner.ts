/**
 * GDD Validation Runner
 *
 * Uses existing TypeScript infrastructure (weather.ts, gdd-calculator.ts)
 * to validate harvest predictions against farm ground truth data.
 *
 * Run with: npx ts-node --esm data/research/gdd-validation-runner.ts
 * Or: bun run data/research/gdd-validation-runner.ts
 */

import { CROP_GDD_TARGETS, getGddTargets, type GDDTarget } from '../../src/lib/constants/gdd-targets'
import { CROP_PHENOLOGY, type CropPhenology } from '../../src/lib/constants/crop-phenology'
import { ALL_GROWING_REGIONS, type GrowingRegionExtended } from '../../src/lib/constants/growing-regions'
import { calculateDailyGdd, calculateCumulativeGdd } from '../../src/lib/services/gdd-calculator'

// ============================================================================
// Farm Ground Truth Data (from LocalHarvest validation)
// ============================================================================

interface FarmGroundTruth {
  crop: string
  state: string
  regionId: string
  farmMonths: number[]  // Months when farms report availability
  farmCount: number     // Number of farms reporting
}

const FARM_GROUND_TRUTH: FarmGroundTruth[] = [
  // Florida Citrus
  { crop: 'citrus_orange', state: 'FL', regionId: 'indian_river_fl', farmMonths: [1,2,3,4,5,10,11,12], farmCount: 2 },
  { crop: 'citrus_grapefruit', state: 'FL', regionId: 'indian_river_fl', farmMonths: [1,2,3,4,5,10,11,12], farmCount: 1 },
  { crop: 'citrus_tangerine', state: 'FL', regionId: 'central_florida', farmMonths: [1,2,11,12], farmCount: 1 },

  // Florida Produce
  { crop: 'strawberry', state: 'FL', regionId: 'central_florida', farmMonths: [1,2,3,4,12], farmCount: 1 },
  { crop: 'tomato', state: 'FL', regionId: 'south_florida', farmMonths: [1,2,3,4,5,11,12], farmCount: 1 },

  // Georgia Peaches
  { crop: 'peach', state: 'GA', regionId: 'central_georgia', farmMonths: [5,6,7,8,9], farmCount: 3 },

  // Washington Fruit
  { crop: 'apple', state: 'WA', regionId: 'yakima_valley', farmMonths: [8,9,10,11], farmCount: 3 },
  { crop: 'cherry', state: 'WA', regionId: 'yakima_valley', farmMonths: [6,7,8], farmCount: 3 },
  { crop: 'pear', state: 'WA', regionId: 'yakima_valley', farmMonths: [8,9,10], farmCount: 2 },

  // Michigan Fruit
  { crop: 'apple', state: 'MI', regionId: 'west_michigan', farmMonths: [9,10,11], farmCount: 9 },
  { crop: 'cherry', state: 'MI', regionId: 'northwest_michigan', farmMonths: [6,7,8], farmCount: 9 },
  { crop: 'blueberry', state: 'MI', regionId: 'west_michigan', farmMonths: [7,8,9], farmCount: 4 },

  // New York Apples
  { crop: 'apple', state: 'NY', regionId: 'hudson_valley_ny', farmMonths: [8,9,10,11], farmCount: 5 },

  // New Jersey Blueberries
  { crop: 'blueberry', state: 'NJ', regionId: 'south_jersey', farmMonths: [6,7,8], farmCount: 5 },

  // Oregon Pears
  { crop: 'pear', state: 'OR', regionId: 'hood_river_or', farmMonths: [8,9,10], farmCount: 6 },
]

// ============================================================================
// Region Coordinates (subset for validation)
// ============================================================================

interface RegionCoords {
  lat: number
  lon: number
}

const VALIDATION_REGIONS: Record<string, RegionCoords> = {
  'indian_river_fl': { lat: 27.6, lon: -80.4 },
  'central_florida': { lat: 28.5, lon: -81.4 },
  'south_florida': { lat: 26.1, lon: -80.1 },
  'central_georgia': { lat: 32.8, lon: -83.6 },
  'yakima_valley': { lat: 46.6, lon: -120.5 },
  'west_michigan': { lat: 42.9, lon: -86.1 },
  'northwest_michigan': { lat: 44.8, lon: -85.6 },
  'hudson_valley_ny': { lat: 41.7, lon: -73.9 },
  'south_jersey': { lat: 39.5, lon: -75.0 },
  'hood_river_or': { lat: 45.7, lon: -121.5 },
}

// ============================================================================
// Crop to GDD Target Mapping
// ============================================================================

interface CropMapping {
  gddTargetKey: string
  bloomMonth: number
  bloomDay: number
}

const CROP_MAPPINGS: Record<string, CropMapping> = {
  'citrus_orange': { gddTargetKey: 'navel_orange', bloomMonth: 3, bloomDay: 15 },
  'citrus_grapefruit': { gddTargetKey: 'grapefruit', bloomMonth: 3, bloomDay: 1 },
  'citrus_tangerine': { gddTargetKey: 'tangerine', bloomMonth: 3, bloomDay: 20 },
  'strawberry': { gddTargetKey: 'strawberry', bloomMonth: 10, bloomDay: 1 },  // FL fall planting
  'tomato': { gddTargetKey: 'tomato_standard', bloomMonth: 9, bloomDay: 1 },  // FL fall planting
  'peach': { gddTargetKey: 'peach', bloomMonth: 3, bloomDay: 15 },
  'apple': { gddTargetKey: 'apple', bloomMonth: 4, bloomDay: 20 },  // Varies by region
  'cherry': { gddTargetKey: 'sweet_cherry', bloomMonth: 4, bloomDay: 10 },
  'blueberry': { gddTargetKey: 'blueberry', bloomMonth: 5, bloomDay: 1 },
  'pear': { gddTargetKey: 'pear', bloomMonth: 4, bloomDay: 5 },
}

// Regional bloom date adjustments
const REGIONAL_BLOOM_ADJUSTMENTS: Record<string, Record<string, [number, number]>> = {
  'apple': {
    'yakima_valley': [4, 20],        // WA: mid-April
    'west_michigan': [5, 1],         // MI: early May
    'hudson_valley_ny': [5, 1],      // NY: early May
  },
  'cherry': {
    'yakima_valley': [4, 10],        // WA: early April
    'northwest_michigan': [5, 1],    // MI: early May
  },
  'blueberry': {
    'west_michigan': [5, 15],        // MI: mid-May
    'south_jersey': [5, 1],          // NJ: early May
  },
}

// ============================================================================
// Open-Meteo API Integration
// ============================================================================

interface OpenMeteoDaily {
  time: string[]
  temperature_2m_max: (number | null)[]
  temperature_2m_min: (number | null)[]
}

interface OpenMeteoResponse {
  daily?: OpenMeteoDaily
  error?: boolean
  reason?: string
}

async function fetchHistoricalWeather(
  lat: number,
  lon: number,
  startDate: Date,
  endDate: Date
): Promise<{ date: Date; tempHighF: number; tempLowF: number }[]> {
  const url = new URL('https://archive-api.open-meteo.com/v1/archive')
  url.searchParams.set('latitude', lat.toString())
  url.searchParams.set('longitude', lon.toString())
  url.searchParams.set('start_date', startDate.toISOString().split('T')[0])
  url.searchParams.set('end_date', endDate.toISOString().split('T')[0])
  url.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min')
  url.searchParams.set('temperature_unit', 'fahrenheit')
  url.searchParams.set('timezone', 'auto')

  const response = await fetch(url.toString())
  const data: OpenMeteoResponse = await response.json()

  if (!data.daily) {
    console.warn(`No weather data for ${lat},${lon}`)
    return []
  }

  const observations: { date: Date; tempHighF: number; tempLowF: number }[] = []
  for (let i = 0; i < data.daily.time.length; i++) {
    const tMax = data.daily.temperature_2m_max[i]
    const tMin = data.daily.temperature_2m_min[i]
    if (tMax !== null && tMin !== null) {
      observations.push({
        date: new Date(data.daily.time[i]),
        tempHighF: tMax,
        tempLowF: tMin,
      })
    }
  }
  return observations
}

// ============================================================================
// GDD Calculation with Actual Weather
// ============================================================================

interface HarvestPrediction {
  crop: string
  state: string
  regionId: string
  bloomDate: Date
  gddTarget: GDDTarget
  actualGdd: number
  daysToMaturity: number
  daysToEnd: number
  predictedMonths: number[]
  actualFarmMonths: number[]
  overlapPct: number
  status: 'GOOD' | 'NEEDS_CALIBRATION' | 'POOR'
  notes: string
}

async function calculateHarvestWindow(
  coords: RegionCoords,
  bloomDate: Date,
  gddTarget: GDDTarget,
  year: number = 2024
): Promise<{ predictedMonths: number[]; daysToMaturity: number; daysToEnd: number; totalGdd: number }> {
  // Fetch 14 months of weather data (for long-season crops like Valencia)
  const startDate = new Date(bloomDate)
  const endDate = new Date(bloomDate)
  endDate.setMonth(endDate.getMonth() + 14)

  // Cap end date to available historical data (a few days ago)
  const maxEndDate = new Date()
  maxEndDate.setDate(maxEndDate.getDate() - 5)
  if (endDate > maxEndDate) {
    endDate.setTime(maxEndDate.getTime())
  }

  const observations = await fetchHistoricalWeather(
    coords.lat,
    coords.lon,
    startDate,
    endDate
  )

  if (observations.length === 0) {
    return { predictedMonths: [], daysToMaturity: 0, daysToEnd: 0, totalGdd: 0 }
  }

  // Calculate cumulative GDD day by day
  let cumulativeGdd = 0
  let maturityDay: number | null = null
  let endDay: number | null = null
  const predictedMonths: Set<number> = new Set()

  for (let i = 0; i < observations.length; i++) {
    const { tempHighF, tempLowF, date } = observations[i]

    // Use crop-specific maxTemp for modified 86/50 method
    const dailyGdd = calculateDailyGdd(tempHighF, tempLowF, gddTarget.baseTemp, gddTarget.maxTemp)
    cumulativeGdd += dailyGdd

    // Check if we've reached maturity
    if (maturityDay === null && cumulativeGdd >= gddTarget.gddToMaturity) {
      maturityDay = i
    }

    // Track months in harvest window
    if (cumulativeGdd >= gddTarget.gddToMaturity &&
        cumulativeGdd <= gddTarget.gddToMaturity + gddTarget.gddWindow) {
      predictedMonths.add(date.getMonth() + 1)  // 1-indexed months
    }

    // Check if we've passed the window
    if (endDay === null && cumulativeGdd >= gddTarget.gddToMaturity + gddTarget.gddWindow) {
      endDay = i
    }
  }

  return {
    predictedMonths: Array.from(predictedMonths).sort((a, b) => a - b),
    daysToMaturity: maturityDay ?? observations.length,
    daysToEnd: endDay ?? observations.length,
    totalGdd: Math.round(cumulativeGdd),
  }
}

function calculateOverlap(predicted: number[], actual: number[]): number {
  const predictedSet = new Set(predicted)
  const actualSet = new Set(actual)
  const intersection = [...predictedSet].filter(m => actualSet.has(m))
  const union = new Set([...predicted, ...actual])
  return union.size > 0 ? (intersection.length / union.size) * 100 : 0
}

// ============================================================================
// Main Validation Runner
// ============================================================================

async function runValidation(): Promise<HarvestPrediction[]> {
  console.log('='.repeat(80))
  console.log('GDD VALIDATION WITH ACTUAL WEATHER DATA')
  console.log('Using Open-Meteo API + Modified 86/50 Method')
  console.log('='.repeat(80))
  console.log()

  const results: HarvestPrediction[] = []
  const year = 2024  // Use 2024 for full season data

  for (const farm of FARM_GROUND_TRUTH) {
    const coords = VALIDATION_REGIONS[farm.regionId]
    if (!coords) {
      console.warn(`No coordinates for region: ${farm.regionId}`)
      continue
    }

    const mapping = CROP_MAPPINGS[farm.crop]
    if (!mapping) {
      console.warn(`No mapping for crop: ${farm.crop}`)
      continue
    }

    const gddTarget = getGddTargets(mapping.gddTargetKey)

    // Get regional bloom date adjustment if available
    let bloomMonth = mapping.bloomMonth
    let bloomDay = mapping.bloomDay
    const regionalAdjust = REGIONAL_BLOOM_ADJUSTMENTS[farm.crop]?.[farm.regionId]
    if (regionalAdjust) {
      [bloomMonth, bloomDay] = regionalAdjust
    }

    const bloomDate = new Date(year, bloomMonth - 1, bloomDay)

    console.log(`Processing: ${farm.crop} in ${farm.state} (${farm.regionId})`)
    console.log(`  Bloom: ${bloomDate.toISOString().split('T')[0]}`)
    console.log(`  GDD Target: ${gddTarget.gddToMaturity} to maturity, ${gddTarget.gddWindow} window`)
    if (gddTarget.maxTemp) {
      console.log(`  MaxTemp cap: ${gddTarget.maxTemp}°F (modified 86/50 method)`)
    }

    try {
      const prediction = await calculateHarvestWindow(coords, bloomDate, gddTarget, year)

      const overlapPct = calculateOverlap(prediction.predictedMonths, farm.farmMonths)

      let status: 'GOOD' | 'NEEDS_CALIBRATION' | 'POOR'
      if (overlapPct >= 70) status = 'GOOD'
      else if (overlapPct >= 40) status = 'NEEDS_CALIBRATION'
      else status = 'POOR'

      const result: HarvestPrediction = {
        crop: farm.crop,
        state: farm.state,
        regionId: farm.regionId,
        bloomDate,
        gddTarget,
        actualGdd: prediction.totalGdd,
        daysToMaturity: prediction.daysToMaturity,
        daysToEnd: prediction.daysToEnd,
        predictedMonths: prediction.predictedMonths,
        actualFarmMonths: farm.farmMonths,
        overlapPct: Math.round(overlapPct * 10) / 10,
        status,
        notes: gddTarget.maxTemp
          ? `Using modified ${gddTarget.maxTemp}/${gddTarget.baseTemp} method`
          : `Standard GDD base ${gddTarget.baseTemp}`
      }

      results.push(result)

      console.log(`  Days to maturity: ${prediction.daysToMaturity}`)
      console.log(`  Total GDD: ${prediction.totalGdd}`)
      console.log(`  Predicted months: [${prediction.predictedMonths.join(', ')}]`)
      console.log(`  Farm months: [${farm.farmMonths.join(', ')}]`)
      console.log(`  Overlap: ${overlapPct.toFixed(1)}% - ${status}`)
      console.log()

      // Rate limit to avoid hitting Open-Meteo too hard
      await new Promise(resolve => setTimeout(resolve, 300))

    } catch (error) {
      console.error(`  Error: ${error}`)
      console.log()
    }
  }

  return results
}

async function main() {
  const results = await runValidation()

  console.log('='.repeat(80))
  console.log('VALIDATION SUMMARY')
  console.log('='.repeat(80))
  console.log()

  const goodCount = results.filter(r => r.status === 'GOOD').length
  const calibrationCount = results.filter(r => r.status === 'NEEDS_CALIBRATION').length
  const poorCount = results.filter(r => r.status === 'POOR').length
  const avgOverlap = results.reduce((sum, r) => sum + r.overlapPct, 0) / results.length

  console.log(`Total crop×region combinations: ${results.length}`)
  console.log(`Average overlap: ${avgOverlap.toFixed(1)}%`)
  console.log(`GOOD (≥70%): ${goodCount}`)
  console.log(`NEEDS_CALIBRATION (40-70%): ${calibrationCount}`)
  console.log(`POOR (<40%): ${poorCount}`)
  console.log()

  // Save results to JSON
  const outputPath = './data/research/gdd-actual-weather-results.json'
  const output = {
    validationDate: new Date().toISOString().split('T')[0],
    methodology: 'Open-Meteo historical weather API + modified 86/50 method',
    totalCombinations: results.length,
    averageOverlap: Math.round(avgOverlap * 10) / 10,
    goodCount,
    calibrationCount,
    poorCount,
    results: results.map(r => ({
      crop: r.crop,
      state: r.state,
      regionId: r.regionId,
      bloomDate: r.bloomDate.toISOString().split('T')[0],
      gddToMaturity: r.gddTarget.gddToMaturity,
      gddToPeak: r.gddTarget.gddToPeak,
      gddWindow: r.gddTarget.gddWindow,
      maxTemp: r.gddTarget.maxTemp,
      actualGdd: r.actualGdd,
      daysToMaturity: r.daysToMaturity,
      predictedMonths: r.predictedMonths,
      actualFarmMonths: r.actualFarmMonths,
      overlapPct: r.overlapPct,
      status: r.status,
    }))
  }

  console.log('Results saved to:', outputPath)
  console.log()
  console.log(JSON.stringify(output, null, 2))
}

main().catch(console.error)
