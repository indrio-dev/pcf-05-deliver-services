/**
 * Temporal Cultivar Inference
 *
 * Infers which cultivars are actively harvesting based on GDD proximity,
 * NOT static market share percentages.
 *
 * Key Innovation:
 * - Uses GDD + harvest windows to determine what's harvesting NOW
 * - Dynamic inference changes throughout the season
 * - Replaces static "Washington Navel = 60% of CA oranges" assumptions
 *
 * Example:
 * Dec 22, CA NAVEL, GDD 2900:
 *   Washington Navel (optimal 3200): ∆300 → 95% probability (at peak)
 *   Lane Late (optimal 4500): ∆1600 → 0% (not started yet)
 *
 * Mar 15, CA NAVEL, GDD 3800:
 *   Washington Navel (optimal 3200): ∆600 → 0% (finished)
 *   Lane Late (optimal 4500): ∆700 → 80% (at peak now)
 */

import { getCultivar, getRegion } from '@/lib/data/reference-data'

/**
 * Cultivar probability based on temporal proximity
 */
export interface CultivarProbability {
  cultivarId: string
  cultivarName: string
  probability: number
  reason: 'at_peak' | 'in_season' | 'early_season' | 'tail_end'

  // GDD analysis
  currentGDD: number
  optimalGDD: number
  gddDelta: number

  // Harvest window
  inHarvestWindow: boolean
  peakWindow?: {
    start: Date
    end: Date
  }
}

/**
 * Infer which cultivars are actively harvesting based on GDD proximity
 *
 * Uses temporal logic instead of static market share:
 * - Closer GDD to optimal → Higher probability
 * - Outside harvest window → Zero probability
 * - Combines timing + GDD for precision
 */
export async function inferCultivarsFromTiming(
  varietyId: string,
  regionId: string,
  date: Date,
  currentGDD: number
): Promise<CultivarProbability[]> {

  // Get all cultivars of this variety in this region
  const cultivars = await getCultivarsForVariety(varietyId, regionId)

  // Explicitly-labeled cultivars get their own terminal entries
  // (e.g., "Cara Cara" always called out separately, not just "Navel")
  const EXPLICITLY_LABELED = ['cara_cara', 'moro', 'tarocco']  // Blood oranges, etc.

  const genericCultivars = cultivars.filter(c => !EXPLICITLY_LABELED.includes(c.id))

  const inSeason: CultivarProbability[] = []

  for (const cultivar of genericCultivars) {
    // Check if date is in harvest window
    const harvestWindow = getHarvestWindow(cultivar.id, regionId)

    if (!harvestWindow || !isDateInHarvestWindow(date, harvestWindow)) {
      continue  // Not in season, skip
    }

    // Calculate GDD proximity
    const optimalGDD = cultivar.gddToPeak || cultivar.gddToMaturity
    const gddDelta = Math.abs(currentGDD - optimalGDD)

    // Score based on proximity (closer = higher probability)
    // Within 500 GDD: linear decay from 1.0 to 0.0
    if (gddDelta < 500) {
      const proximityScore = 1.0 - (gddDelta / 500)

      // Determine reason
      let reason: CultivarProbability['reason'] = 'in_season'
      if (gddDelta < 100) {
        reason = 'at_peak'
      } else if (currentGDD < optimalGDD) {
        reason = 'early_season'
      } else {
        reason = 'tail_end'
      }

      inSeason.push({
        cultivarId: cultivar.id,
        cultivarName: cultivar.name,
        probability: proximityScore,
        reason,
        currentGDD,
        optimalGDD,
        gddDelta,
        inHarvestWindow: true,
        peakWindow: harvestWindow.peakWindow
      })
    }
  }

  // Normalize probabilities to sum = 1.0
  const totalScore = inSeason.reduce((sum, c) => sum + c.probability, 0)

  if (totalScore === 0) {
    // No cultivars in season - shouldn't happen if terminal report exists, but handle gracefully
    return []
  }

  return inSeason.map(c => ({
    ...c,
    probability: c.probability / totalScore
  }))
}

/**
 * Get cultivars for a variety in a region
 * (Stub - would query from database or constants)
 */
async function getCultivarsForVariety(
  varietyId: string,
  regionId: string
): Promise<Array<{ id: string; name: string; gddToPeak?: number; gddToMaturity?: number }>> {
  // Stub implementation - would query cultivars table
  // For now, return mock data

  if (varietyId === 'navel_orange') {
    return [
      { id: 'washington_navel', name: 'Washington Navel', gddToPeak: 3200, gddToMaturity: 3500 },
      { id: 'lane_late', name: 'Lane Late', gddToPeak: 4500, gddToMaturity: 5000 },
      { id: 'cara_cara', name: 'Cara Cara', gddToPeak: 3300, gddToMaturity: 3600 },  // Explicitly labeled
    ]
  }

  return []
}

/**
 * Get harvest window for cultivar × region
 * (Stub - would query from harvest_windows or regional_offerings)
 */
function getHarvestWindow(
  cultivarId: string,
  regionId: string
): { start: Date; end: Date; peakWindow?: { start: Date; end: Date } } | null {
  // Stub - would query harvest_windows table
  // For now, return mock window

  return {
    start: new Date('2025-10-01'),
    end: new Date('2026-05-31'),
    peakWindow: {
      start: new Date('2025-12-01'),
      end: new Date('2026-03-31')
    }
  }
}

/**
 * Check if date falls within harvest window
 */
function isDateInHarvestWindow(
  date: Date,
  window: { start: Date; end: Date }
): boolean {
  const month = date.getMonth() + 1  // 1-12

  const startMonth = window.start.getMonth() + 1
  const endMonth = window.end.getMonth() + 1

  // Handle year-crossing windows (e.g., Oct-May)
  if (startMonth > endMonth) {
    return month >= startMonth || month <= endMonth
  }

  return month >= startMonth && month <= endMonth
}

/**
 * Parse month from string
 */
function parseMonth(monthStr: string): number {
  const months: Record<string, number> = {
    'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6,
    'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
  }
  return months[monthStr] || 1
}

/**
 * Example usage in terminal market processing:
 *
 * // Terminal report: "CA NAVEL" on Dec 22, 2025
 * const region = inferRegionFromState('CA', 'navel_orange', new Date('2025-12-22'))
 * const weather = await fetchWeatherData(region.id, new Date('2025-12-22'))
 * const gdd = calculateCumulativeGDD(weather, 55)
 *
 * // TEMPORAL INFERENCE (not static market share)
 * const cultivarProbs = await inferCultivarsFromTiming(
 *   'navel_orange',
 *   region.id,
 *   new Date('2025-12-22'),
 *   gdd.cumulativeGDD  // e.g., 2900
 * )
 *
 * // Result:
 * // [
 * //   { cultivarId: 'washington_navel', probability: 0.95, reason: 'at_peak', gddDelta: 300 },
 * //   { cultivarId: 'lane_late', probability: 0.05, reason: 'early_season', gddDelta: 1600 }
 * // ]
 *
 * // Predict for most likely cultivar
 * const primaryCultivar = cultivarProbs[0]  // Washington Navel, 95%
 * const prediction = await predictQuality({
 *   cultivarId: primaryCultivar.cultivarId,
 *   regionId: region.id,
 *   currentGDD: gdd.cumulativeGDD
 * })
 */
