/**
 * =============================================================================
 * HARVEST TIMING UTILITIES
 * =============================================================================
 *
 * Converts GDD-based phenology data into simplified DOY (day-of-year) ranges
 * for consumer-facing harvest timing displays.
 *
 * This is a SIMPLIFIED model for the Harvest Timer tool. For precise predictions,
 * use the full GDD prediction engine.
 */

import { CROP_PHENOLOGY, type CropPhenology } from '@/lib/constants/crop-phenology'

export interface HarvestWindow {
  cropType: string
  region: string
  bloomStartDoy: number
  bloomEndDoy: number
  harvestStartDoy: number
  harvestEndDoy: number
  peakStartDoy: number
  peakEndDoy: number
  expectedBrix?: number
  gddBase?: number
}

/**
 * Convert month/day to day-of-year (1-365)
 */
function toDayOfYear(month: number, day: number): number {
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  let doy = day
  for (let i = 0; i < month - 1; i++) {
    doy += daysInMonth[i]
  }
  return doy
}

/**
 * Add days to a DOY, wrapping around year boundary
 */
function addDays(doy: number, days: number): number {
  let result = doy + days
  if (result > 365) result -= 365
  return result
}

/**
 * Estimate days from bloom to harvest using GDD and typical accumulation rates
 */
function estimateDaysFromGDD(gdd: number, gddBase: number, region: string): number {
  // Typical GDD accumulation rates by region type
  const rateMap: Record<string, number> = {
    florida: 22,
    texas: 25,
    california: 20,
    georgia: 20,
    washington: 16,
    michigan: 16,
    new_york: 16,
  }

  // Find matching rate or use default
  const rate = Object.entries(rateMap).find(([key]) =>
    region.toLowerCase().includes(key)
  )?.[1] || 18

  return Math.round(gdd / rate)
}

/**
 * Convert crop phenology data to simplified DOY harvest windows
 */
export function generateHarvestWindows(): HarvestWindow[] {
  return CROP_PHENOLOGY.map((crop) => {
    const bloomDoy = toDayOfYear(crop.bloomMonth, crop.bloomDay)

    // Estimate days from bloom to various stages
    const daysToMaturity = estimateDaysFromGDD(crop.gddToMaturity, crop.gddBase, crop.region)
    const daysToPeak = estimateDaysFromGDD(crop.gddToPeak, crop.gddBase, crop.region)
    const windowDays = estimateDaysFromGDD(crop.gddWindow, crop.gddBase, crop.region)

    // Calculate DOY for each stage
    const harvestStartDoy = addDays(bloomDoy, daysToMaturity)
    const peakStartDoy = addDays(bloomDoy, daysToPeak)
    const harvestEndDoy = addDays(harvestStartDoy, windowDays)

    // Peak window is typically centered around gddToPeak
    const peakWindowDays = Math.round(windowDays * 0.4) // Peak is ~40% of total window
    const peakEndDoy = addDays(peakStartDoy, peakWindowDays)

    // Format crop type nicely
    const cropType = crop.cropId
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')

    return {
      cropType,
      region: crop.region
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' '),
      bloomStartDoy: bloomDoy - 5, // Bloom typically spans ~10 days
      bloomEndDoy: bloomDoy + 5,
      harvestStartDoy,
      harvestEndDoy,
      peakStartDoy,
      peakEndDoy,
      gddBase: crop.gddBase,
    }
  })
}

/**
 * Get current day of year
 */
export function getCurrentDayOfYear(date: Date = new Date()): number {
  const start = new Date(date.getFullYear(), 0, 0)
  const diff = date.getTime() - start.getTime()
  const oneDay = 1000 * 60 * 60 * 24
  return Math.floor(diff / oneDay)
}

/**
 * Check if current DOY is within a range (handles year wrap)
 */
export function isDoyInRange(doy: number, start: number, end: number): boolean {
  if (start <= end) {
    return doy >= start && doy <= end
  } else {
    // Wraps around year boundary (e.g., Dec 15 to Jan 31)
    return doy >= start || doy <= end
  }
}

/**
 * Calculate days remaining in a window
 */
export function daysRemainingInWindow(currentDoy: number, endDoy: number): number {
  if (currentDoy <= endDoy) {
    return endDoy - currentDoy
  } else {
    // Wrapped around year
    return (365 - currentDoy) + endDoy
  }
}

/**
 * Calculate days until a DOY
 */
export function daysUntilDoy(currentDoy: number, targetDoy: number): number {
  if (targetDoy >= currentDoy) {
    return targetDoy - currentDoy
  } else {
    // Next year
    return (365 - currentDoy) + targetDoy
  }
}

/**
 * Calculate progress through a window (0-1)
 */
export function windowProgress(currentDoy: number, startDoy: number, endDoy: number): number {
  const totalDays = daysRemainingInWindow(startDoy, endDoy)
  const elapsed = daysRemainingInWindow(startDoy, currentDoy)
  return Math.min(1, Math.max(0, elapsed / totalDays))
}

/**
 * Calculate peak quality window from harvest months (middle 50% for tree crops)
 *
 * For tree crops, the harvest window is the full season, but peak quality
 * is typically the middle 50% of that window when sugars are optimally developed.
 *
 * IMPORTANT: This calculates in DAYS, not months.
 * For Nov 1 - Jan 31 (~92 days), middle 50% = ~46 days = Nov 24 - Jan 8
 *
 * @param harvestMonths - Array of months (1-12) representing full harvest season
 * @param peakPercentage - What portion of the window is "peak" (default 0.5 = middle 50%)
 * @returns Object with harvest range and peak range as formatted date strings
 */
export function calculatePeakWindow(
  harvestMonths: number[] | undefined,
  peakPercentage: number = 0.5
): {
  harvestStart: string
  harvestEnd: string
  peakStart: string
  peakEnd: string
  harvestMonthNames: string[]
  peakMonthNames: string[]
  // New: actual date info for more precise displays
  harvestStartDate: { month: number; day: number }
  harvestEndDate: { month: number; day: number }
  peakStartDate: { month: number; day: number }
  peakEndDate: { month: number; day: number }
  totalDays: number
  peakDays: number
} | null {
  if (!harvestMonths || harvestMonths.length === 0) {
    return null
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const monthAbbrev = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ]

  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

  // Handle month arrays that may wrap around year (e.g., [11, 12, 1, 2, 3])
  // Sort to find contiguous ranges
  const sortedMonths = [...harvestMonths].sort((a, b) => {
    // Check for year wrap - if diff > 6, they're probably on opposite sides of Dec/Jan
    if (Math.abs(a - b) > 6) {
      // Treat months 1-6 as 13-18 for sorting purposes if there's a year wrap
      const aAdj = a <= 6 ? a + 12 : a
      const bAdj = b <= 6 ? b + 12 : b
      return aAdj - bAdj
    }
    return a - b
  })

  // Find first and last months
  const firstMonth = sortedMonths[0]
  const lastMonth = sortedMonths[sortedMonths.length - 1]

  // Calculate harvest window in DAYS
  // Start: 1st day of first month
  // End: last day of last month
  const harvestStartDate = { month: firstMonth, day: 1 }
  const harvestEndDate = { month: lastMonth, day: daysInMonth[lastMonth - 1] }

  // Calculate total days in harvest window
  let totalDays = 0
  for (const month of sortedMonths) {
    totalDays += daysInMonth[month - 1]
  }

  // Calculate peak window: middle X% of total days
  const peakDays = Math.round(totalDays * peakPercentage)
  const marginDays = Math.round((totalDays - peakDays) / 2)

  // Helper: add days to a month/day, handling month transitions
  function addDaysToDate(startMonth: number, startDay: number, daysToAdd: number): { month: number; day: number } {
    let month = startMonth
    let day = startDay + daysToAdd

    // Walk through months in the sorted order
    let monthIndex = sortedMonths.indexOf(month)

    while (day > daysInMonth[month - 1]) {
      day -= daysInMonth[month - 1]
      monthIndex++
      if (monthIndex >= sortedMonths.length) {
        // Wrap to end of last month
        month = sortedMonths[sortedMonths.length - 1]
        day = daysInMonth[month - 1]
        break
      }
      month = sortedMonths[monthIndex]
    }

    return { month, day }
  }

  // Helper: subtract days from end, walking backwards
  function subtractDaysFromDate(endMonth: number, endDay: number, daysToSubtract: number): { month: number; day: number } {
    let month = endMonth
    let day = endDay - daysToSubtract

    // Walk backwards through months
    let monthIndex = sortedMonths.indexOf(month)

    while (day < 1) {
      monthIndex--
      if (monthIndex < 0) {
        // Wrap to start of first month
        month = sortedMonths[0]
        day = 1
        break
      }
      month = sortedMonths[monthIndex]
      day += daysInMonth[month - 1]
    }

    return { month, day }
  }

  // Calculate peak start: harvest start + margin days
  const peakStartDate = addDaysToDate(firstMonth, 1, marginDays)

  // Calculate peak end: harvest end - margin days
  const peakEndDate = subtractDaysFromDate(lastMonth, daysInMonth[lastMonth - 1], marginDays)

  // Format dates as "Mon D" (e.g., "Nov 24")
  const formatDate = (m: number, d: number) => `${monthAbbrev[m - 1]} ${d}`

  return {
    harvestStart: formatDate(firstMonth, 1),
    harvestEnd: formatDate(lastMonth, daysInMonth[lastMonth - 1]),
    peakStart: formatDate(peakStartDate.month, peakStartDate.day),
    peakEnd: formatDate(peakEndDate.month, peakEndDate.day),
    harvestMonthNames: sortedMonths.map(m => monthNames[m - 1]),
    peakMonthNames: [], // Deprecated - use date fields instead
    harvestStartDate,
    harvestEndDate,
    peakStartDate,
    peakEndDate,
    totalDays,
    peakDays,
  }
}

/**
 * Format a month range for display
 * Handles single months and multi-month ranges
 */
export function formatMonthRange(start: string, end: string): string {
  if (start === end) {
    return start
  }
  // Abbreviate month names for compact display
  const abbrev = (m: string) => m.slice(0, 3)
  return `${abbrev(start)} – ${abbrev(end)}`
}
