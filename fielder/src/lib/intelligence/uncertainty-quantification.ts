/**
 * Uncertainty Quantification
 *
 * Generates full probability distributions for quality predictions
 * using Monte Carlo simulation and variance decomposition.
 */

import {
  type ProbabilityDistribution,
  type UncertaintyComponents,
  combineUncertaintyComponents,
  createParametricDistribution,
  createEmpiricalDistribution,
  normalInverseCDF,
} from '@/lib/types/uncertainty'

// Re-export from types for convenience
export {
  createParametricDistribution,
  createEmpiricalDistribution,
  normalInverseCDF,
} from '@/lib/types/uncertainty'

// Placeholder sync functions - would import from reference-data
function getCultivarSync(id: string): any {
  // Stub - returns generic data
  return { heritageIntent: 'commercial' }
}

function getRegionSync(id: string): any {
  // Stub - returns generic data
  return { climateStability: 'medium' }
}

/**
 * Generate Brix probability distribution using Monte Carlo simulation
 */
export function generateBrixDistribution(
  predictedBrix: number,
  components: Partial<UncertaintyComponents>,
  nSamples: number = 10000
): ProbabilityDistribution {
  // Combine uncertainty components
  const uncertainty = combineUncertaintyComponents(components)

  // Generate samples using Box-Muller transform
  const samples: number[] = []

  for (let i = 0; i < nSamples; i++) {
    // Box-Muller transform: uniform → normal
    const u1 = Math.random()
    const u2 = Math.random()
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)

    // Generate sample: mean + (z-score × stdDev)
    const sample = predictedBrix + (z * uncertainty.totalStdDev)

    // Constrain to physical limits (Brix can't be negative)
    samples.push(Math.max(0, sample))
  }

  // Sort for percentile calculation
  samples.sort((a, b) => a - b)

  // Calculate percentiles
  const getPercentile = (p: number): number => {
    const index = Math.floor((p / 100) * samples.length)
    return samples[Math.min(index, samples.length - 1)]
  }

  // Calculate moments
  const mean = samples.reduce((sum, x) => sum + x, 0) / samples.length
  const variance = samples.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / samples.length
  const stdDev = Math.sqrt(variance)

  const p5 = getPercentile(5)
  const p25 = getPercentile(25)
  const p50 = getPercentile(50)
  const p75 = getPercentile(75)
  const p95 = getPercentile(95)

  return {
    mean,
    median: p50,
    stdDev,
    p5,
    p10: getPercentile(10),
    p25,
    p50,
    p75,
    p90: getPercentile(90),
    p95,
    interquartileRange: p75 - p25,
    confidenceInterval90: [p5, p95],
    method: 'monte_carlo',
    monteCarloParams: {
      nSamples,
      samplingMethod: 'box_muller'
    }
  }
}

/**
 * Get uncertainty components for a prediction
 *
 * Analyzes SHARE pillars to determine variance contributions
 */
export function getUncertaintyComponents(
  cultivarId?: string,
  regionId?: string,
  practices?: any,
  harvestWindow?: any,
  currentDate?: Date
): UncertaintyComponents {
  const components: Partial<UncertaintyComponents> = {}

  // H pillar: Cultivar variance
  if (cultivarId) {
    components.cultivarVariance = getCultivarVariance(cultivarId)
  }

  // S pillar: Region variance
  if (regionId) {
    components.regionVariance = getRegionVariance(regionId)
  }

  // A pillar: Practice variance
  if (practices) {
    components.practiceVariance = getPracticeVariance(practices)
  }

  // R pillar: Timing variance
  if (harvestWindow && currentDate) {
    components.timingVariance = getTimingVariance(harvestWindow, currentDate)
  }

  // E pillar: Measurement error (constant)
  components.measurementError = 0.2

  return combineUncertaintyComponents(components)
}

/**
 * Cultivar variance (H pillar)
 *
 * Heritage cultivars: Lower variance (bred for consistency)
 * Commercial cultivars: Higher variance (bred for yield, less quality focus)
 */
function getCultivarVariance(cultivarId: string): number {
  const cultivar = getCultivarSync(cultivarId)
  if (!cultivar) return 0.5  // Default

  const varianceByHeritage: Record<string, number> = {
    'true_heritage': 0.4,         // Consistent (generations of selection)
    'heirloom_quality': 0.5,      // Moderate (older, stable genetics)
    'modern_flavor': 0.6,         // Higher (modern breeding, less time to stabilize)
    'modern_nutrient': 0.6,
    'commercial': 0.8,            // Highest (bred for yield, quality varies)
    'heirloom_utility': 0.7,
  }

  return varianceByHeritage[cultivar.heritageIntent || 'commercial'] || 0.5
}

/**
 * Region variance (S pillar)
 *
 * Stable climates: Lower variance
 * Variable climates: Higher variance
 */
function getRegionVariance(regionId: string): number {
  const region = getRegionSync(regionId)
  if (!region) return 0.4  // Default

  // Climate stability (would be in region data)
  const varianceByClimate: Record<string, number> = {
    'high': 0.2,      // Very stable (e.g., Southern CA consistent weather)
    'medium': 0.3,    // Moderate (most regions)
    'low': 0.5,       // Variable (e.g., Michigan with lake effects, frost risk)
  }

  // Placeholder - would use region.climateStability
  return 0.3
}

/**
 * Practice variance (A pillar)
 *
 * Mineralized soil: Lower variance (stable soil, consistent quality)
 * Annual fertility: Higher variance (depends on application timing/amount)
 */
function getPracticeVariance(practices: any): number {
  if (!practices) return 0.5  // No data, higher uncertainty

  // Mineralized soil science has lowest variance
  if (practices.fertilityStrategy?.mineralizedSoil) return 0.2

  // Soil banking (organic) has moderate variance
  if (practices.fertilityStrategy?.approach === 'soil_banking') return 0.35

  // Annual fertility has higher variance (application-dependent)
  if (practices.fertilityStrategy?.approach === 'annual_fertility') return 0.5

  return 0.4
}

/**
 * Timing variance (R pillar)
 *
 * At peak: Low variance (optimal timing)
 * Early/late: Higher variance (not at peak quality)
 */
function getTimingVariance(harvestWindow: any, currentDate: Date): number {
  if (!harvestWindow || !currentDate) return 0.6  // Unknown timing, high uncertainty

  // Calculate distance from peak
  const peakCenter = harvestWindow.peakCenterDate || new Date()
  const daysFromPeak = Math.abs(
    (currentDate.getTime() - peakCenter.getTime()) / (1000 * 60 * 60 * 24)
  )

  const halfWidth = (harvestWindow.peakWindowDays || 30) / 2

  // Normalize: 0 at peak, 1 at edge, >1 outside window
  const normalizedDistance = daysFromPeak / halfWidth

  // Variance increases quadratically with distance from peak
  // At peak (0): variance = 0.3
  // At edge (1): variance = 0.8
  // Outside (2): variance = 1.3 (capped at 1.5)
  const variance = 0.3 + (0.5 * Math.pow(Math.min(normalizedDistance, 2), 2))

  return Math.min(variance, 1.5)
}

/**
 * Create parametric distribution (normal or lognormal)
 *
 * Faster than Monte Carlo, good for simple cases
 */
