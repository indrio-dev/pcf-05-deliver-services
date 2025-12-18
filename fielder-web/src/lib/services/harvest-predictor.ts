/**
 * Harvest Window Prediction Service
 *
 * Predicts when crops will hit peak quality based on GDD accumulation,
 * cultivar characteristics, and current weather patterns.
 *
 * Key insights:
 * - Citrus base temp: 55F
 * - Sugar follows logistic curve
 * - Acid follows exponential decay
 * - Peak = SSC ~12, TA ~1.0, ratio ~12:1
 */

import { CROP_GDD_TARGETS, getGddTargets } from '../constants/gdd-targets'
import { addDays, format } from 'date-fns'

// ============================================================================
// Types
// ============================================================================

export interface BrixPrediction {
  predictedBrix: number
  cultivarBase: number
  rootstockModifier: number
  ageModifier: number
  timingModifier: number
  confidence: number
}

export interface HarvestWindow {
  cropId: string
  cultivarId?: string
  regionId: string
  year: number
  harvestStart: Date
  harvestEnd: Date
  optimalStart: Date
  optimalEnd: Date
  gddAtHarvestStart: number
  gddAtPeak: number
  predictedBrix?: number
  confidence: number
}

export interface SugarAcidEstimate {
  ssc: number      // Soluble Solids Content (Brix)
  ta: number       // Titratable Acidity
  ratio: number    // SSC/TA ratio
  brimA: number    // Flavor index: SSC - 4*TA
  gdd: number
}

// ============================================================================
// Harvest Predictor Class
// ============================================================================

class HarvestPredictor {

  /**
   * Calculate Brix modifier based on tree age
   *
   * Trees shift from vegetative to reproductive energy allocation:
   * - 0-2 yrs: -0.8 (vegetative phase)
   * - 3-4 yrs: -0.5 (transition)
   * - 5-7 yrs: -0.2 (canopy completion)
   * - 8-18 yrs: 0.0 (prime - genetic potential realized)
   * - 19-25 yrs: -0.2
   * - >25 yrs: -0.3
   */
  calculateAgeModifier(treeAgeYears: number | null): number {
    if (treeAgeYears === null) return 0.0 // Assume prime if unknown

    if (treeAgeYears <= 2) return -0.8
    if (treeAgeYears <= 4) return -0.5
    if (treeAgeYears <= 7) return -0.2
    if (treeAgeYears <= 18) return 0.0 // Prime
    if (treeAgeYears <= 25) return -0.2
    return -0.3
  }

  /**
   * Calculate Brix modifier based on timing relative to peak
   *
   * Uses parabolic penalty: Timing_Mod = -G * (d / H)^2
   */
  calculateTimingModifier(
    currentGdd: number,
    peakGdd: number,
    gddHalfwidth: number = 150.0,
    maxPenalty: number = 1.0
  ): number {
    const d = Math.abs(currentGdd - peakGdd)
    const h = gddHalfwidth

    if (d <= h / 2) return 0.0 // In inner quartile, no penalty

    const penalty = maxPenalty * Math.pow(d / h, 2)
    return -Math.min(penalty, maxPenalty * 1.5) // Cap at 1.5x max
  }

  /**
   * Predict Brix for a crop at current GDD
   *
   * Algorithm: Peak Brix = Cultivar Base + Rootstock Mod + Age Mod + Timing Mod
   */
  predictBrix(
    cultivarBaseBrix: number,
    rootstockBrixMod: number = 0,
    treeAgeYears: number | null,
    currentGdd: number,
    peakGdd: number
  ): BrixPrediction {
    const ageModifier = this.calculateAgeModifier(treeAgeYears)
    const timingModifier = this.calculateTimingModifier(currentGdd, peakGdd)

    const predicted = cultivarBaseBrix + rootstockBrixMod + ageModifier + timingModifier

    return {
      predictedBrix: Math.round(predicted * 100) / 100,
      cultivarBase: cultivarBaseBrix,
      rootstockModifier: rootstockBrixMod,
      ageModifier,
      timingModifier: Math.round(timingModifier * 100) / 100,
      confidence: treeAgeYears !== null ? 0.8 : 0.6
    }
  }

  /**
   * Estimate sugar (SSC) and acid (TA) at current GDD
   *
   * - SSC follows logistic curve: SSC = SSC_min + (SSC_max - SSC_min) / (1 + exp(-(DD - DD50)/s))
   * - TA follows exponential decay: TA = TA0 * exp(-ka * DD)
   */
  estimateSugarAcid(
    currentGdd: number,
    params: {
      sscMin?: number
      sscMax?: number
      dd50?: number      // GDD at 50% sugar development
      s?: number         // Steepness of logistic curve
      ta0?: number       // Initial acidity
      ka?: number        // Acid decay rate
    } = {}
  ): SugarAcidEstimate {
    const {
      sscMin = 6.0,
      sscMax = 12.0,
      dd50 = 2050.0,
      s = 350.0,
      ta0 = 3.0,
      ka = 0.0005
    } = params

    // Sugar (logistic rise)
    const ssc = sscMin + (sscMax - sscMin) / (1 + Math.exp(-(currentGdd - dd50) / s))

    // Acid (exponential decay)
    const ta = ta0 * Math.exp(-ka * currentGdd)

    // Quality indices
    const ratio = ta > 0 ? ssc / ta : 0
    const brimA = ssc - 4 * ta // Flavor index

    return {
      ssc: Math.round(ssc * 100) / 100,
      ta: Math.round(ta * 100) / 100,
      ratio: Math.round(ratio * 10) / 10,
      brimA: Math.round(brimA * 100) / 100,
      gdd: Math.round(currentGdd)
    }
  }

  /**
   * Predict harvest window for a crop based on GDD accumulation
   */
  predictHarvestWindow(
    cropId: string,
    regionId: string,
    currentGdd: number,
    avgDailyGdd: number,
    bloomDate?: Date
  ): HarvestWindow {
    const targets = getGddTargets(cropId)
    const gddToMaturity = targets.gddToMaturity
    const gddToPeak = targets.gddToPeak ?? (gddToMaturity + targets.gddWindow / 2)
    const gddWindow = targets.gddWindow

    const today = new Date()

    // Calculate days to key milestones (can be negative if already past)
    const daysToMaturity = avgDailyGdd > 0
      ? Math.round((gddToMaturity - currentGdd) / avgDailyGdd)
      : 0
    const daysToPeak = avgDailyGdd > 0
      ? Math.round((gddToPeak - currentGdd) / avgDailyGdd)
      : 0
    const daysToEnd = avgDailyGdd > 0
      ? Math.round((gddToMaturity + gddWindow - currentGdd) / avgDailyGdd)
      : 0

    // Calculate dates (negative days = already started in the past)
    const harvestStart = addDays(today, daysToMaturity)
    const peakCenter = addDays(today, daysToPeak)
    const harvestEnd = addDays(today, daysToEnd)

    // Optimal window is middle 50% of harvest window
    const windowDuration = daysToEnd - daysToMaturity
    const optimalOffset = Math.round(windowDuration * 0.25)
    const optimalStart = addDays(harvestStart, optimalOffset)
    const optimalEnd = addDays(harvestEnd, -optimalOffset)

    // Estimate confidence based on how far out the prediction is
    const maxDays = Math.max(daysToMaturity, daysToPeak, daysToEnd)
    const confidence = Math.max(0.5, 1 - (maxDays / 365) * 0.3)

    return {
      cropId,
      regionId,
      year: today.getFullYear(),
      harvestStart,
      harvestEnd,
      optimalStart,
      optimalEnd,
      gddAtHarvestStart: gddToMaturity,
      gddAtPeak: gddToPeak,
      confidence: Math.round(confidence * 100) / 100
    }
  }

  /**
   * Format harvest window dates as strings
   */
  formatHarvestWindow(window: HarvestWindow): {
    harvestStartDate: string
    harvestEndDate: string
    optimalStartDate: string
    optimalEndDate: string
  } {
    return {
      harvestStartDate: format(window.harvestStart, 'MMMM dd'),
      harvestEndDate: format(window.harvestEnd, 'MMMM dd'),
      optimalStartDate: format(window.optimalStart, 'MMMM dd'),
      optimalEndDate: format(window.optimalEnd, 'MMMM dd')
    }
  }

  /**
   * Determine current harvest status
   */
  getHarvestStatus(window: HarvestWindow): {
    status: 'pre_season' | 'approaching' | 'in_season' | 'at_peak' | 'past_peak' | 'ended'
    message: string
    daysUntil?: number
  } {
    const today = new Date()

    if (today < window.harvestStart) {
      const daysUntil = Math.round((window.harvestStart.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      if (daysUntil > 30) {
        return { status: 'pre_season', message: 'Not yet in season', daysUntil }
      }
      return { status: 'approaching', message: `${daysUntil} days until harvest`, daysUntil }
    }

    if (today > window.harvestEnd) {
      return { status: 'ended', message: 'Season ended' }
    }

    if (today >= window.optimalStart && today <= window.optimalEnd) {
      return { status: 'at_peak', message: 'At peak quality!' }
    }

    if (today < window.optimalStart) {
      const daysUntil = Math.round((window.optimalStart.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      return { status: 'in_season', message: `${daysUntil} days to peak`, daysUntil }
    }

    return { status: 'past_peak', message: 'Past peak, quality declining' }
  }
}

// Export singleton instance
export const harvestPredictor = new HarvestPredictor()
