/**
 * GDD Validation with Actual Weather Data
 *
 * Self-contained validation script using Open-Meteo API.
 * Run with: npx tsx data/research/validate-with-weather.ts
 */

// ============================================================================
// GDD Calculator (inline to avoid import issues)
// ============================================================================

function calculateDailyGdd(
  tempHighF: number,
  tempLowF: number,
  baseTemp: number = 55.0,
  maxTemp?: number
): number {
  // Apply maxTemp cap if specified (modified 86/50 method)
  const effectiveHigh = maxTemp !== undefined
    ? Math.min(tempHighF, maxTemp)
    : tempHighF

  const avgTemp = (effectiveHigh + tempLowF) / 2
  return Math.max(0, avgTemp - baseTemp)
}

// ============================================================================
// GDD Targets (calibrated values from gdd-targets.ts)
// ============================================================================

interface GDDTarget {
  baseTemp: number
  maxTemp?: number
  gddToMaturity: number
  gddToPeak?: number
  gddWindow: number
}

const GDD_TARGETS: Record<string, GDDTarget> = {
  // Citrus: maxTemp 94F - photosynthesis declines >86F, stomata issues above 94F
  navel_orange: { baseTemp: 55, maxTemp: 94, gddToMaturity: 5100, gddToPeak: 6100, gddWindow: 3500 },
  grapefruit: { baseTemp: 55, maxTemp: 94, gddToMaturity: 5500, gddToPeak: 7100, gddWindow: 4000 },
  tangerine: { baseTemp: 55, maxTemp: 94, gddToMaturity: 4800, gddToPeak: 5700, gddWindow: 1800 },
  // Berries: maxTemp 86F - heat-sensitive
  strawberry: { baseTemp: 50, maxTemp: 86, gddToMaturity: 700, gddToPeak: 1300, gddWindow: 1700 },
  blueberry: { baseTemp: 45, maxTemp: 86, gddToMaturity: 1050, gddToPeak: 1350, gddWindow: 900 },  // v2: 900→1050, window 700→900
  // Vegetables: standard 86/50 method
  tomato_standard: { baseTemp: 50, maxTemp: 86, gddToMaturity: 2400, gddToPeak: 2600, gddWindow: 2400 },
  // Stone fruit: maxTemp 86F per MSU GDD models
  peach: { baseTemp: 45, maxTemp: 86, gddToMaturity: 1800, gddToPeak: 2200, gddWindow: 1800 },  // v2: 1600→1800, window 1200→1800
  sweet_cherry: { baseTemp: 40, maxTemp: 86, gddToMaturity: 1100, gddToPeak: 1500, gddWindow: 900 },  // v2: window 600→900
  // Pome fruit: maxTemp 86F per MSU GDD models
  apple: { baseTemp: 43, maxTemp: 86, gddToMaturity: 2400, gddToPeak: 2900, gddWindow: 1600 },  // v3: 2100→2400 for MI late harvest
  pear: { baseTemp: 40, maxTemp: 86, gddToMaturity: 2800, gddToPeak: 3300, gddWindow: 1200 },  // v3: 2500→2800 for WA late harvest
}

// ============================================================================
// Farm Ground Truth Data
// ============================================================================

interface FarmGroundTruth {
  crop: string
  gddKey: string
  state: string
  lat: number
  lon: number
  bloomMonth: number
  bloomDay: number
  farmMonths: number[]
  farmCount: number
}

const FARM_GROUND_TRUTH: FarmGroundTruth[] = [
  // Florida Citrus
  { crop: 'citrus_orange', gddKey: 'navel_orange', state: 'FL', lat: 27.6, lon: -80.4,
    bloomMonth: 3, bloomDay: 15, farmMonths: [1,2,3,4,5,10,11,12], farmCount: 2 },
  { crop: 'citrus_grapefruit', gddKey: 'grapefruit', state: 'FL', lat: 27.6, lon: -80.4,
    bloomMonth: 3, bloomDay: 1, farmMonths: [1,2,3,4,5,10,11,12], farmCount: 1 },
  { crop: 'citrus_tangerine', gddKey: 'tangerine', state: 'FL', lat: 28.5, lon: -81.4,
    bloomMonth: 3, bloomDay: 20, farmMonths: [1,2,11,12], farmCount: 1 },

  // Florida Produce
  { crop: 'strawberry', gddKey: 'strawberry', state: 'FL', lat: 28.5, lon: -81.4,
    bloomMonth: 10, bloomDay: 1, farmMonths: [1,2,3,4,12], farmCount: 1 },
  { crop: 'tomato', gddKey: 'tomato_standard', state: 'FL', lat: 26.1, lon: -80.1,
    bloomMonth: 9, bloomDay: 1, farmMonths: [1,2,3,4,5,11,12], farmCount: 1 },

  // Georgia Peaches
  { crop: 'peach', gddKey: 'peach', state: 'GA', lat: 32.8, lon: -83.6,
    bloomMonth: 3, bloomDay: 15, farmMonths: [5,6,7,8,9], farmCount: 3 },

  // Washington Fruit
  { crop: 'apple', gddKey: 'apple', state: 'WA', lat: 46.6, lon: -120.5,
    bloomMonth: 4, bloomDay: 20, farmMonths: [8,9,10,11], farmCount: 3 },
  { crop: 'cherry', gddKey: 'sweet_cherry', state: 'WA', lat: 46.6, lon: -120.5,
    bloomMonth: 4, bloomDay: 10, farmMonths: [6,7,8], farmCount: 3 },
  { crop: 'pear', gddKey: 'pear', state: 'WA', lat: 46.6, lon: -120.5,
    bloomMonth: 4, bloomDay: 5, farmMonths: [8,9,10], farmCount: 2 },

  // Michigan Fruit
  { crop: 'apple', gddKey: 'apple', state: 'MI', lat: 42.9, lon: -86.1,
    bloomMonth: 5, bloomDay: 1, farmMonths: [9,10,11], farmCount: 9 },
  { crop: 'cherry', gddKey: 'sweet_cherry', state: 'MI', lat: 44.8, lon: -85.6,
    bloomMonth: 5, bloomDay: 1, farmMonths: [6,7,8], farmCount: 9 },
  { crop: 'blueberry', gddKey: 'blueberry', state: 'MI', lat: 42.9, lon: -86.1,
    bloomMonth: 5, bloomDay: 15, farmMonths: [7,8,9], farmCount: 4 },

  // New York Apples
  { crop: 'apple', gddKey: 'apple', state: 'NY', lat: 41.7, lon: -73.9,
    bloomMonth: 5, bloomDay: 1, farmMonths: [8,9,10,11], farmCount: 5 },

  // New Jersey Blueberries
  { crop: 'blueberry', gddKey: 'blueberry', state: 'NJ', lat: 39.5, lon: -75.0,
    bloomMonth: 5, bloomDay: 1, farmMonths: [6,7,8], farmCount: 5 },

  // Oregon Pears
  { crop: 'pear', gddKey: 'pear', state: 'OR', lat: 45.7, lon: -121.5,
    bloomMonth: 4, bloomDay: 5, farmMonths: [8,9,10], farmCount: 6 },
]

// ============================================================================
// Open-Meteo API
// ============================================================================

interface OpenMeteoResponse {
  daily?: {
    time: string[]
    temperature_2m_max: (number | null)[]
    temperature_2m_min: (number | null)[]
  }
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

  if (!data.daily) return []

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
// Validation Logic
// ============================================================================

async function calculateHarvestWindow(
  farm: FarmGroundTruth,
  gddTarget: GDDTarget,
  year: number
): Promise<{ predictedMonths: number[]; daysToMaturity: number; totalGdd: number }> {
  const bloomDate = new Date(year, farm.bloomMonth - 1, farm.bloomDay)
  const endDate = new Date(bloomDate)
  endDate.setMonth(endDate.getMonth() + 14)

  // Cap to available historical data
  const maxEndDate = new Date()
  maxEndDate.setDate(maxEndDate.getDate() - 5)
  if (endDate > maxEndDate) endDate.setTime(maxEndDate.getTime())

  const observations = await fetchHistoricalWeather(farm.lat, farm.lon, bloomDate, endDate)
  if (observations.length === 0) {
    return { predictedMonths: [], daysToMaturity: 0, totalGdd: 0 }
  }

  let cumulativeGdd = 0
  let maturityDay: number | null = null
  const predictedMonths: Set<number> = new Set()

  for (let i = 0; i < observations.length; i++) {
    const { tempHighF, tempLowF, date } = observations[i]
    const dailyGdd = calculateDailyGdd(tempHighF, tempLowF, gddTarget.baseTemp, gddTarget.maxTemp)
    cumulativeGdd += dailyGdd

    if (maturityDay === null && cumulativeGdd >= gddTarget.gddToMaturity) {
      maturityDay = i
    }

    if (cumulativeGdd >= gddTarget.gddToMaturity &&
        cumulativeGdd <= gddTarget.gddToMaturity + gddTarget.gddWindow) {
      predictedMonths.add(date.getMonth() + 1)
    }
  }

  return {
    predictedMonths: Array.from(predictedMonths).sort((a, b) => a - b),
    daysToMaturity: maturityDay ?? observations.length,
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
// Main
// ============================================================================

async function main() {
  console.log('='.repeat(80))
  console.log('GDD VALIDATION WITH ACTUAL WEATHER DATA (Open-Meteo API)')
  console.log('Using modified 86/50 method with crop-specific maxTemp capping')
  console.log('='.repeat(80))
  console.log()

  const results: any[] = []
  const year = 2024

  for (const farm of FARM_GROUND_TRUTH) {
    const gddTarget = GDD_TARGETS[farm.gddKey]
    if (!gddTarget) {
      console.warn(`No GDD target for: ${farm.gddKey}`)
      continue
    }

    console.log(`Processing: ${farm.crop} in ${farm.state}`)
    console.log(`  Location: (${farm.lat}, ${farm.lon})`)
    console.log(`  Bloom: ${farm.bloomMonth}/${farm.bloomDay}/${year}`)
    console.log(`  GDD: ${gddTarget.gddToMaturity} to maturity, window ${gddTarget.gddWindow}`)
    if (gddTarget.maxTemp) {
      console.log(`  MaxTemp cap: ${gddTarget.maxTemp}°F`)
    }

    try {
      const prediction = await calculateHarvestWindow(farm, gddTarget, year)
      const overlapPct = calculateOverlap(prediction.predictedMonths, farm.farmMonths)

      let status: string
      if (overlapPct >= 70) status = 'GOOD'
      else if (overlapPct >= 40) status = 'NEEDS_CALIBRATION'
      else status = 'POOR'

      console.log(`  Days to maturity: ${prediction.daysToMaturity}`)
      console.log(`  Total GDD: ${prediction.totalGdd}`)
      console.log(`  Predicted: [${prediction.predictedMonths.join(', ')}]`)
      console.log(`  Farm data: [${farm.farmMonths.join(', ')}]`)
      console.log(`  Overlap: ${overlapPct.toFixed(1)}% - ${status}`)
      console.log()

      results.push({
        crop: farm.crop,
        state: farm.state,
        bloomDate: `${year}-${farm.bloomMonth.toString().padStart(2, '0')}-${farm.bloomDay.toString().padStart(2, '0')}`,
        gddToMaturity: gddTarget.gddToMaturity,
        gddWindow: gddTarget.gddWindow,
        maxTemp: gddTarget.maxTemp,
        actualGdd: prediction.totalGdd,
        daysToMaturity: prediction.daysToMaturity,
        predictedMonths: prediction.predictedMonths,
        farmMonths: farm.farmMonths,
        overlapPct: Math.round(overlapPct * 10) / 10,
        status,
      })

      // Rate limit
      await new Promise(resolve => setTimeout(resolve, 300))
    } catch (error) {
      console.error(`  Error: ${error}`)
    }
  }

  // Summary
  console.log('='.repeat(80))
  console.log('VALIDATION SUMMARY')
  console.log('='.repeat(80))

  const goodCount = results.filter(r => r.status === 'GOOD').length
  const calibrationCount = results.filter(r => r.status === 'NEEDS_CALIBRATION').length
  const poorCount = results.filter(r => r.status === 'POOR').length
  const avgOverlap = results.reduce((sum, r) => sum + r.overlapPct, 0) / results.length

  console.log(`Total: ${results.length}`)
  console.log(`Average overlap: ${avgOverlap.toFixed(1)}%`)
  console.log(`GOOD (≥70%): ${goodCount}`)
  console.log(`NEEDS_CALIBRATION (40-70%): ${calibrationCount}`)
  console.log(`POOR (<40%): ${poorCount}`)
  console.log()

  // Output JSON
  const output = {
    validationDate: new Date().toISOString().split('T')[0],
    methodology: 'Open-Meteo historical weather + modified 86/50 method',
    year,
    totalCombinations: results.length,
    averageOverlap: Math.round(avgOverlap * 10) / 10,
    goodCount,
    calibrationCount,
    poorCount,
    results,
  }

  console.log(JSON.stringify(output, null, 2))
}

main().catch(console.error)
