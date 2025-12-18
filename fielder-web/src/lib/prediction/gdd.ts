/**
 * =============================================================================
 * GROWING DEGREE DAYS (GDD) PREDICTION ENGINE
 * =============================================================================
 *
 * Ported from: legacy/python_engine/fielder/models/weather.py
 *
 * GDD is the scientific basis for predicting harvest timing. Crops develop
 * based on accumulated heat, not calendar days.
 *
 * Formula: GDD = max(0, (Tmax + Tmin) / 2 - base_temp)
 *
 * Each crop has a base temperature below which no development occurs:
 * - Citrus: 55°F (12.8°C)
 * - Stone fruit: 40-45°F
 * - Berries: 50°F
 *
 * Sources:
 * - UF/IFAS Citrus Extension
 * - UC Davis fruit production guides
 * - MSU/JASHS Zavalloni et al. 2006 (tart cherry model)
 */

// =============================================================================
// TYPES
// =============================================================================

export interface DailyWeather {
  date: string              // YYYY-MM-DD
  tempMaxF: number
  tempMinF: number
  precipitation?: number    // inches
}

export interface GDDAccumulation {
  date: string
  dailyGDD: number
  cumulativeGDD: number
  daysFromBloom: number
}

export interface HarvestPrediction {
  harvestWindowStart: Date
  harvestWindowEnd: Date
  peakWindowStart: Date
  peakWindowEnd: Date
  currentGDD: number
  gddToMaturity: number
  gddToPeak: number
  percentToMaturity: number
  percentToPeak: number
  status: 'pre_season' | 'approaching' | 'harvest_window' | 'peak' | 'late_season' | 'post_season'
  daysToHarvest: number | null
  daysToPeak: number | null
  confidence: number        // 0-1 based on data quality
}

// =============================================================================
// GDD CALCULATION
// =============================================================================

/**
 * Calculate Growing Degree Days for a single day.
 *
 * @param tempMaxF - Maximum temperature in Fahrenheit
 * @param tempMinF - Minimum temperature in Fahrenheit
 * @param baseTemp - Base temperature for the crop (default 55°F for citrus)
 * @returns GDD for that day (minimum 0)
 */
export function calculateDailyGDD(
  tempMaxF: number,
  tempMinF: number,
  baseTemp: number = 55
): number {
  const avgTemp = (tempMaxF + tempMinF) / 2
  return Math.max(0, avgTemp - baseTemp)
}

/**
 * Calculate cumulative GDD from bloom date to target date.
 *
 * @param weatherData - Array of daily weather observations
 * @param bloomDate - Date when bloom occurred (starts GDD clock)
 * @param baseTemp - Base temperature for the crop
 * @returns Array of daily GDD accumulations
 */
export function calculateCumulativeGDD(
  weatherData: DailyWeather[],
  bloomDate: Date,
  baseTemp: number = 55
): GDDAccumulation[] {
  const results: GDDAccumulation[] = []
  let cumulativeGDD = 0

  // Sort by date and filter to after bloom
  const sorted = [...weatherData]
    .filter(d => new Date(d.date) >= bloomDate)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  for (const day of sorted) {
    const dailyGDD = calculateDailyGDD(day.tempMaxF, day.tempMinF, baseTemp)
    cumulativeGDD += dailyGDD

    const dayDate = new Date(day.date)
    const daysFromBloom = Math.floor(
      (dayDate.getTime() - bloomDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    results.push({
      date: day.date,
      dailyGDD: Math.round(dailyGDD * 10) / 10,
      cumulativeGDD: Math.round(cumulativeGDD),
      daysFromBloom
    })
  }

  return results
}

/**
 * Estimate average daily GDD for a region during growing season.
 * Used for projecting future GDD when forecast unavailable.
 *
 * Typical values by region:
 * - Florida citrus: 20-25 GDD/day
 * - California citrus: 18-22 GDD/day
 * - Pacific Northwest: 12-18 GDD/day
 * - Midwest summer: 15-20 GDD/day
 */
export function estimateAverageGDDPerDay(
  region: string,
  month: number
): number {
  // Regional estimates based on climatological data
  const regionalEstimates: Record<string, number[]> = {
    // [Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, Dec]
    florida: [15, 17, 20, 23, 25, 26, 26, 26, 25, 22, 18, 15],
    california: [10, 12, 15, 18, 22, 25, 28, 27, 24, 19, 13, 10],
    texas: [12, 14, 18, 22, 26, 28, 30, 30, 27, 22, 16, 12],
    georgia: [8, 10, 15, 20, 24, 27, 28, 28, 25, 18, 12, 8],
    washington: [2, 4, 8, 12, 16, 20, 24, 23, 18, 11, 5, 2],
    michigan: [0, 2, 6, 12, 18, 22, 25, 24, 18, 10, 4, 0],
  }

  const monthIndex = month - 1 // Convert to 0-indexed
  const estimate = regionalEstimates[region.toLowerCase()]

  if (estimate) {
    return estimate[monthIndex]
  }

  // Default: moderate climate
  return [5, 7, 12, 16, 20, 24, 26, 25, 20, 14, 8, 5][monthIndex]
}

// =============================================================================
// HARVEST PREDICTION
// =============================================================================

/**
 * Predict harvest window based on GDD accumulation.
 *
 * @param currentGDD - Current cumulative GDD from bloom
 * @param gddToMaturity - GDD threshold for harvest-ready
 * @param gddToPeak - GDD threshold for peak quality
 * @param gddWindow - GDD range for harvest window
 * @param avgGDDPerDay - Average daily GDD accumulation rate
 * @returns Harvest prediction with timing and status
 */
export function predictHarvestWindow(
  bloomDate: Date,
  currentGDD: number,
  gddToMaturity: number,
  gddToPeak: number,
  gddWindow: number,
  avgGDDPerDay: number
): HarvestPrediction {
  const today = new Date()

  // Calculate window boundaries
  const gddWindowEnd = gddToMaturity + gddWindow

  // Estimate dates based on GDD targets
  const daysToMaturity = Math.ceil((gddToMaturity - currentGDD) / avgGDDPerDay)
  const daysToPeak = Math.ceil((gddToPeak - currentGDD) / avgGDDPerDay)
  const daysToWindowEnd = Math.ceil((gddWindowEnd - currentGDD) / avgGDDPerDay)

  const harvestStart = new Date(today)
  harvestStart.setDate(harvestStart.getDate() + Math.max(0, daysToMaturity))

  const harvestEnd = new Date(today)
  harvestEnd.setDate(harvestEnd.getDate() + Math.max(0, daysToWindowEnd))

  // Peak window is middle portion of harvest window
  const peakStart = new Date(today)
  peakStart.setDate(peakStart.getDate() + Math.max(0, daysToPeak - 15))

  const peakEnd = new Date(today)
  peakEnd.setDate(peakEnd.getDate() + Math.max(0, daysToPeak + 15))

  // Determine status
  let status: HarvestPrediction['status']
  if (currentGDD < gddToMaturity * 0.8) {
    status = 'pre_season'
  } else if (currentGDD < gddToMaturity) {
    status = 'approaching'
  } else if (currentGDD < gddToPeak - (gddWindow * 0.25)) {
    status = 'harvest_window'
  } else if (currentGDD < gddToPeak + (gddWindow * 0.25)) {
    status = 'peak'
  } else if (currentGDD < gddWindowEnd) {
    status = 'late_season'
  } else {
    status = 'post_season'
  }

  // Calculate percentages
  const percentToMaturity = Math.min(100, (currentGDD / gddToMaturity) * 100)
  const percentToPeak = Math.min(100, (currentGDD / gddToPeak) * 100)

  // Confidence based on how much actual vs projected data
  // Higher confidence when closer to harvest (more actual data)
  const confidence = Math.min(0.95, 0.5 + (percentToMaturity / 200))

  return {
    harvestWindowStart: harvestStart,
    harvestWindowEnd: harvestEnd,
    peakWindowStart: peakStart,
    peakWindowEnd: peakEnd,
    currentGDD,
    gddToMaturity,
    gddToPeak,
    percentToMaturity: Math.round(percentToMaturity),
    percentToPeak: Math.round(percentToPeak),
    status,
    daysToHarvest: daysToMaturity > 0 ? daysToMaturity : null,
    daysToPeak: daysToPeak > 0 ? daysToPeak : null,
    confidence: Math.round(confidence * 100) / 100
  }
}

// =============================================================================
// BRIX PREDICTION BASED ON GDD
// =============================================================================

/**
 * Predict Brix (sugar content) based on GDD position in harvest window.
 *
 * Brix development follows a sigmoid curve:
 * - Slow increase early in season
 * - Rapid increase as maturity approaches
 * - Plateau at genetic ceiling
 *
 * Formula from research:
 * SSC = SSC_min + (SSC_max - SSC_min) / (1 + exp(-(GDD - DD50) / s))
 *
 * Where:
 * - SSC_min: Minimum Brix at start of window
 * - SSC_max: Maximum Brix (genetic ceiling)
 * - DD50: GDD at which Brix reaches 50% of range
 * - s: Slope factor (steepness of curve)
 */
export function predictBrixFromGDD(
  currentGDD: number,
  gddToMaturity: number,
  gddToPeak: number,
  brixMin: number,
  brixMax: number
): { predictedBrix: number; confidence: number } {
  // DD50 is approximately at maturity GDD
  const dd50 = gddToMaturity

  // Slope factor - controls steepness of sigmoid
  // Lower = steeper, faster transition
  const slopeFactor = (gddToPeak - gddToMaturity) / 4

  // Sigmoid calculation
  const exponent = -(currentGDD - dd50) / slopeFactor
  const sigmoidValue = 1 / (1 + Math.exp(exponent))

  // Predicted Brix
  const predictedBrix = brixMin + (brixMax - brixMin) * sigmoidValue

  // Confidence based on position in window
  // Highest confidence at peak, lower at extremes
  let confidence: number
  if (currentGDD < gddToMaturity * 0.7) {
    confidence = 0.5
  } else if (currentGDD < gddToMaturity) {
    confidence = 0.7
  } else if (currentGDD < gddToPeak) {
    confidence = 0.85
  } else {
    confidence = 0.75 // Post-peak, Brix may decline
  }

  return {
    predictedBrix: Math.round(predictedBrix * 10) / 10,
    confidence
  }
}

// =============================================================================
// ACID DECLINE MODEL
// =============================================================================

/**
 * Predict titratable acid (TA) based on GDD.
 *
 * Acid declines exponentially as fruit matures:
 * TA = TA0 × exp(-ka × GDD)
 *
 * Higher temperatures accelerate acid breakdown.
 * This affects the Brix:Acid ratio which determines eating quality.
 */
export function predictAcidFromGDD(
  currentGDD: number,
  initialAcid: number = 2.0,  // Starting TA%
  decayRate: number = 0.0003  // ka factor
): number {
  const predictedAcid = initialAcid * Math.exp(-decayRate * currentGDD)
  return Math.round(predictedAcid * 100) / 100
}

/**
 * Calculate Brix:Acid ratio - key indicator of eating quality.
 *
 * Optimal ratios vary by fruit:
 * - Oranges: 10-16 (legal minimum varies by state)
 * - Grapefruit: 5-8
 * - Mandarins: 10-20
 */
export function calculateBrixAcidRatio(brix: number, acid: number): number {
  if (acid === 0) return 0
  return Math.round((brix / acid) * 10) / 10
}

/**
 * Calculate BrimA score (flavor index).
 *
 * BrimA = Brix - (4 × TA)
 *
 * This adjusts for the masking effect of acid on perceived sweetness.
 * Higher BrimA = more perceived sweetness.
 */
export function calculateBrimA(brix: number, acid: number): number {
  return Math.round((brix - 4 * acid) * 10) / 10
}
