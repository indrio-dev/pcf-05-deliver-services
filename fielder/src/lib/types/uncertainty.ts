/**
 * Uncertainty Quantification Types
 *
 * Replaces opaque confidence scalars with explicit probability distributions
 * for transparent risk assessment.
 *
 * Instead of: { predictedBrix: 12.1, confidence: 0.85 }
 * We provide: { mean: 12.1, p25: 11.5, p50: 12.1, p75: 12.8, ... }
 */

/**
 * Probability distribution for continuous quality metrics
 */
export interface ProbabilityDistribution {
  // Central tendency
  mean: number
  median: number
  stdDev: number

  // Percentiles for risk assessment
  p5: number     // 90% CI lower bound
  p10: number
  p25: number    // Conservative estimate (1st quartile)
  p50: number    // Median
  p75: number    // Optimistic estimate (3rd quartile)
  p90: number
  p95: number    // 90% CI upper bound

  // Spread measures
  interquartileRange: number      // p75 - p25
  confidenceInterval90: [number, number]  // [p5, p95]

  // Generation method
  method: 'parametric' | 'monte_carlo' | 'empirical'

  // Method-specific parameters
  parametricParams?: {
    distribution: 'normal' | 'lognormal'
    params: Record<string, number>
  }

  monteCarloParams?: {
    nSamples: number
    samplingMethod: string
  }

  empiricalParams?: {
    nMeasurements: number
    dataSource: string
    lastUpdated: string
  }
}

/**
 * Derive confidence score from distribution
 * (for backward compatibility with existing code expecting confidence scalar)
 *
 * Narrower distributions = higher confidence
 * Wider distributions = lower confidence
 */
export function deriveConfidenceScore(
  dist: ProbabilityDistribution,
  mean: number
): number {
  // Coefficient of variation: stdDev / mean
  const cv = dist.stdDev / mean

  // Map CV to confidence score
  // cv=0.0 → confidence=0.99 (perfect certainty)
  // cv=0.2 → confidence=0.75 (moderate uncertainty)
  // cv=0.4 → confidence=0.50 (high uncertainty)

  const confidence = Math.max(0.5, Math.min(0.99, 1.0 - (cv * 2.5)))

  return confidence
}

/**
 * Classify quality tier using conservative estimate (p25)
 *
 * Consumer-facing quality tiers should use p25 (1st quartile) not mean,
 * so we're conservative and don't overpromise.
 */
export function classifyQualityTierFromDistribution(
  dist: ProbabilityDistribution,
  thresholds: {
    artisan: number
    premium: number
    standard: number
  }
): 'artisan' | 'premium' | 'standard' | 'commodity' {
  const conservativeEstimate = dist.p25

  if (conservativeEstimate >= thresholds.artisan) return 'artisan'
  if (conservativeEstimate >= thresholds.premium) return 'premium'
  if (conservativeEstimate >= thresholds.standard) return 'standard'
  return 'commodity'
}

/**
 * Normal distribution inverse CDF (for percentile calculation)
 * Approximation using Abramowitz and Stegun method
 */
export function normalInverseCDF(p: number): number {
  // Handle edge cases
  if (p <= 0) return -Infinity
  if (p >= 1) return Infinity

  // Coefficients for approximation
  const a1 = -39.6968302866538
  const a2 = 220.946098424521
  const a3 = -275.928510446969
  const a4 = 138.357751867269
  const a5 = -30.6647980661472
  const a6 = 2.50662827745924

  // For p < 0.5, reflect to get positive z-score
  const pInput = Math.min(p, 1 - p)

  const t = Math.sqrt(-2 * Math.log(pInput))
  const numerator = a1 + a2 * t
  const denominator = 1 + a3 * t + a4 * Math.pow(t, 2) + a5 * Math.pow(t, 3) + a6 * Math.pow(t, 4)
  const z = t - (numerator / denominator)

  return p < 0.5 ? -z : z
}

/**
 * Calculate percentile from normal distribution
 */
export function normalPercentile(mean: number, stdDev: number, p: number): number {
  const z = normalInverseCDF(p)
  return mean + (z * stdDev)
}

/**
 * Uncertainty components for variance decomposition
 *
 * Total variance = sum of component variances (assuming independence)
 */
export interface UncertaintyComponents {
  cultivarVariance: number      // H pillar: genetic variation
  regionVariance: number         // S pillar: soil/climate variation
  practiceVariance: number       // A pillar: management variation
  timingVariance: number         // R pillar: harvest timing variation
  measurementError: number       // E pillar: measurement uncertainty

  // Metadata
  componentsUsed: string[]
  totalVariance: number
  totalStdDev: number
}

/**
 * Combine uncertainty components
 */
export function combineUncertaintyComponents(
  components: Partial<UncertaintyComponents>
): UncertaintyComponents {
  const defaults = {
    cultivarVariance: 0.5,
    regionVariance: 0.3,
    practiceVariance: 0.4,
    timingVariance: 0.6,
    measurementError: 0.2,
  }

  const used = { ...defaults, ...components }

  const totalVariance =
    Math.pow(used.cultivarVariance, 2) +
    Math.pow(used.regionVariance, 2) +
    Math.pow(used.practiceVariance, 2) +
    Math.pow(used.timingVariance, 2) +
    Math.pow(used.measurementError, 2)

  return {
    ...used,
    componentsUsed: Object.keys(components),
    totalVariance,
    totalStdDev: Math.sqrt(totalVariance)
  }
}
