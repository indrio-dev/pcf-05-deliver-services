/**
 * Growing Degree Day (GDD) Calculator
 *
 * GDD is the core mechanism for predicting crop development.
 * Crops develop based on accumulated heat, not calendar days.
 *
 * GDD = max(0, (Tmax + Tmin) / 2 - baseTemp)
 */

export interface DailyWeather {
  date: Date
  tempHighF: number
  tempLowF: number
  precipitationIn?: number
  humidityPct?: number
}

export interface GDDAccumulation {
  regionId: string
  cropId: string
  year: number
  baseTemp: number
  referenceDate: Date | null
  cumulativeGdd: number
  lastUpdated: Date | null
  gddToMaturity?: number
  gddToPeak?: number
}

/**
 * Calculate GDD for a single day
 */
export function calculateDailyGdd(
  tempHighF: number,
  tempLowF: number,
  baseTemp: number = 55.0
): number {
  const avgTemp = (tempHighF + tempLowF) / 2
  return Math.max(0, avgTemp - baseTemp)
}

/**
 * Calculate cumulative GDD from an array of daily weather
 */
export function calculateCumulativeGdd(
  dailyWeather: DailyWeather[],
  baseTemp: number = 55.0
): number {
  return dailyWeather.reduce((total, day) => {
    return total + calculateDailyGdd(day.tempHighF, day.tempLowF, baseTemp)
  }, 0)
}

/**
 * Calculate percentage progress toward a GDD target
 */
export function calculateProgress(
  currentGdd: number,
  targetGdd: number
): number {
  if (targetGdd <= 0) return 100
  return Math.min(100, (currentGdd / targetGdd) * 100)
}

/**
 * Estimate days until reaching a GDD target
 */
export function estimateDaysToTarget(
  currentGdd: number,
  targetGdd: number,
  avgDailyGdd: number
): number {
  const remainingGdd = targetGdd - currentGdd
  if (remainingGdd <= 0) return 0
  if (avgDailyGdd <= 0) return -1 // Cannot estimate
  return Math.ceil(remainingGdd / avgDailyGdd)
}

/**
 * Calculate average daily GDD from a weather array
 */
export function calculateAvgDailyGdd(
  dailyWeather: DailyWeather[],
  baseTemp: number = 55.0
): number {
  if (dailyWeather.length === 0) return 0
  const total = calculateCumulativeGdd(dailyWeather, baseTemp)
  return total / dailyWeather.length
}

/**
 * Project future GDD accumulation using average daily GDD
 */
export function projectGddAccumulation(
  currentGdd: number,
  avgDailyGdd: number,
  daysAhead: number
): number {
  return currentGdd + (avgDailyGdd * daysAhead)
}

/**
 * Calculate GDD from forecast data (with confidence decay)
 */
export interface ForecastDay {
  date: Date
  tempHighF: number
  tempLowF: number
  confidence: number // 0-1, decreases further out
}

export function calculateForecastGdd(
  forecast: ForecastDay[],
  baseTemp: number = 55.0
): { totalGdd: number; weightedGdd: number } {
  let totalGdd = 0
  let weightedGdd = 0

  for (const day of forecast) {
    const dailyGdd = calculateDailyGdd(day.tempHighF, day.tempLowF, baseTemp)
    totalGdd += dailyGdd
    weightedGdd += dailyGdd * day.confidence
  }

  return { totalGdd, weightedGdd }
}

/**
 * Determine harvest window status based on GDD progress
 */
export type HarvestStatus =
  | 'pre_season'
  | 'approaching'
  | 'in_window'
  | 'at_peak'
  | 'past_peak'
  | 'season_ended'

export function determineHarvestStatus(
  currentGdd: number,
  gddToMaturity: number,
  gddToPeak: number | undefined,
  gddWindow: number
): HarvestStatus {
  const gddEnd = gddToMaturity + gddWindow
  const gddPeak = gddToPeak ?? (gddToMaturity + gddWindow / 2)

  if (currentGdd < gddToMaturity * 0.9) {
    return 'pre_season'
  } else if (currentGdd < gddToMaturity) {
    return 'approaching'
  } else if (currentGdd < gddPeak - 100) {
    return 'in_window'
  } else if (currentGdd < gddPeak + 100) {
    return 'at_peak'
  } else if (currentGdd < gddEnd) {
    return 'past_peak'
  } else {
    return 'season_ended'
  }
}
