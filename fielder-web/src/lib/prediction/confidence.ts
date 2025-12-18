/**
 * =============================================================================
 * CONFIDENCE & UNCERTAINTY QUANTIFICATION
 * =============================================================================
 *
 * Ported from: legacy/python_engine concepts
 *
 * Every prediction should have an uncertainty range. This module provides:
 * 1. Prediction ranges (low/mid/high) based on data quality
 * 2. Confidence levels (high/medium/low/speculative)
 * 3. Confidence decay over time (forecasts become less certain)
 * 4. Data quality assessment
 *
 * Philosophy:
 * - It's better to be honestly uncertain than confidently wrong
 * - Ranges communicate uncertainty better than point estimates
 * - Confidence should decay as predictions extend further into future
 */

// =============================================================================
// TYPES
// =============================================================================

export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'speculative'

export type DataQuality = 'high' | 'medium' | 'low' | 'unknown'

export interface PredictionRange {
  low: number
  mid: number
  high: number
  confidence: number            // 0-1
  confidenceLevel: ConfidenceLevel
  dataQuality: DataQuality
  basis: string                 // e.g., "cultivar research", "regional estimate"
}

export interface ConfidenceFactors {
  // Data availability (0-1 each)
  cultivarDataQuality: number      // Do we have research Brix data?
  rootstockDataQuality: number     // Do we know the rootstock?
  phenologyDataQuality: number     // Do we have region-specific bloom/GDD data?
  soilDataQuality: number          // Do we have soil test results?
  practiceDataQuality: number      // Do we know farm practices?
  measurementDataQuality: number   // Do we have actual Brix measurements?

  // Temporal factors
  daysUntilHarvest?: number        // Further = less certain
  hasWeatherForecast: boolean      // Forecast vs climatology

  // Model validation
  modelR2?: number                 // Model fit (e.g., tart cherry 0.971)
}

export interface UncertaintyBands {
  brixLow: number
  brixMid: number
  brixHigh: number
  qualityScoreLow: number
  qualityScoreMid: number
  qualityScoreHigh: number
  harvestDateEarly: Date | null
  harvestDateOptimal: Date | null
  harvestDateLate: Date | null
}

// =============================================================================
// CONFIDENCE LEVEL THRESHOLDS
// =============================================================================

/**
 * Map numeric confidence to qualitative level.
 */
export function getConfidenceLevel(confidence: number): ConfidenceLevel {
  if (confidence >= 0.8) return 'high'
  if (confidence >= 0.6) return 'medium'
  if (confidence >= 0.4) return 'low'
  return 'speculative'
}

/**
 * Get confidence level description for display.
 */
export function getConfidenceLevelDescription(level: ConfidenceLevel): string {
  switch (level) {
    case 'high':
      return 'High confidence prediction based on cultivar research and regional data'
    case 'medium':
      return 'Moderate confidence - some key data points available'
    case 'low':
      return 'Low confidence - prediction based on limited or generic data'
    case 'speculative':
      return 'Speculative estimate - treat as rough approximation only'
  }
}

// =============================================================================
// DATA QUALITY ASSESSMENT
// =============================================================================

/**
 * Assess overall data quality from factors.
 */
export function assessDataQuality(factors: Partial<ConfidenceFactors>): DataQuality {
  const scores = [
    factors.cultivarDataQuality ?? 0,
    factors.rootstockDataQuality ?? 0,
    factors.phenologyDataQuality ?? 0,
    factors.soilDataQuality ?? 0,
    factors.practiceDataQuality ?? 0,
    factors.measurementDataQuality ?? 0,
  ]

  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length

  if (avgScore >= 0.7) return 'high'
  if (avgScore >= 0.5) return 'medium'
  if (avgScore >= 0.3) return 'low'
  return 'unknown'
}

/**
 * Get data quality description for display.
 */
export function getDataQualityDescription(quality: DataQuality): string {
  switch (quality) {
    case 'high':
      return 'Based on cultivar-specific research data and regional phenology'
    case 'medium':
      return 'Based on partial data - some assumptions applied'
    case 'low':
      return 'Limited data available - using generic estimates'
    case 'unknown':
      return 'Insufficient data - prediction is highly uncertain'
  }
}

// =============================================================================
// CONFIDENCE CALCULATION
// =============================================================================

/**
 * Calculate overall confidence from individual factors.
 *
 * Weights reflect importance of each factor to prediction accuracy:
 * - Cultivar: 30% (genetic ceiling is most important)
 * - Phenology: 25% (timing determines actual quality expression)
 * - Measurement: 20% (actual data beats prediction)
 * - Rootstock: 10%
 * - Soil: 10%
 * - Practices: 5%
 */
export function calculateConfidence(factors: ConfidenceFactors): number {
  const weights = {
    cultivar: 0.30,
    phenology: 0.25,
    measurement: 0.20,
    rootstock: 0.10,
    soil: 0.10,
    practices: 0.05,
  }

  let confidence =
    factors.cultivarDataQuality * weights.cultivar +
    factors.phenologyDataQuality * weights.phenology +
    factors.measurementDataQuality * weights.measurement +
    factors.rootstockDataQuality * weights.rootstock +
    factors.soilDataQuality * weights.soil +
    factors.practiceDataQuality * weights.practices

  // Boost if we have actual measurements
  if (factors.measurementDataQuality > 0.8) {
    confidence = Math.min(1, confidence + 0.15)
  }

  // Apply temporal decay if predicting future
  if (factors.daysUntilHarvest !== undefined && factors.daysUntilHarvest > 0) {
    confidence = applyTemporalDecay(
      confidence,
      factors.daysUntilHarvest,
      factors.hasWeatherForecast
    )
  }

  // Boost if model is validated (e.g., tart cherry R² = 0.971)
  if (factors.modelR2 !== undefined && factors.modelR2 > 0.9) {
    confidence = Math.min(1, confidence + 0.1)
  }

  return Math.round(confidence * 100) / 100
}

// =============================================================================
// TEMPORAL DECAY
// =============================================================================

/**
 * Apply confidence decay based on prediction horizon.
 *
 * Predictions become less certain the further into the future they extend.
 *
 * @param baseConfidence - Starting confidence (0-1)
 * @param daysUntilEvent - Days until predicted harvest/event
 * @param hasWeatherForecast - True if using actual forecast, false if climatology
 * @returns Decayed confidence
 */
export function applyTemporalDecay(
  baseConfidence: number,
  daysUntilEvent: number,
  hasWeatherForecast: boolean
): number {
  if (daysUntilEvent <= 0) return baseConfidence

  // Weather forecasts reliable for ~7-10 days
  const forecastReliabilityDays = hasWeatherForecast ? 10 : 0

  // If within forecast window, minimal decay
  if (daysUntilEvent <= forecastReliabilityDays) {
    return baseConfidence * 0.95
  }

  // Exponential decay beyond forecast window
  // Halving time: ~60 days (2 months)
  const halfLife = 60
  const daysBeyondForecast = daysUntilEvent - forecastReliabilityDays
  const decayFactor = Math.exp(-0.693 * daysBeyondForecast / halfLife)

  // Floor at 30% of base confidence (never fully uncertain)
  const minConfidence = baseConfidence * 0.3
  const decayedConfidence = baseConfidence * decayFactor

  return Math.max(minConfidence, decayedConfidence)
}

// =============================================================================
// PREDICTION RANGES
// =============================================================================

/**
 * Calculate prediction range (low/mid/high) based on confidence and variance.
 *
 * @param midEstimate - Best estimate (point prediction)
 * @param confidence - Confidence level (0-1)
 * @param knownVariance - Standard deviation if known from research
 * @param basis - Description of prediction basis
 */
export function calculatePredictionRange(
  midEstimate: number,
  confidence: number,
  knownVariance?: number,
  basis: string = 'model estimate'
): PredictionRange {
  // Estimate variance based on confidence if not known
  // Lower confidence = wider bands
  const estimatedVariance = knownVariance ?? (midEstimate * (1 - confidence) * 0.15)

  // 80% prediction interval (approximately ±1.28 standard deviations)
  const halfWidth = estimatedVariance * 1.28

  return {
    low: Math.round((midEstimate - halfWidth) * 10) / 10,
    mid: Math.round(midEstimate * 10) / 10,
    high: Math.round((midEstimate + halfWidth) * 10) / 10,
    confidence,
    confidenceLevel: getConfidenceLevel(confidence),
    dataQuality: confidence >= 0.7 ? 'high' : confidence >= 0.5 ? 'medium' : 'low',
    basis,
  }
}

/**
 * Calculate Brix prediction range using cultivar and rootstock variance data.
 */
export function calculateBrixRange(
  baseBrix: number,
  confidence: number,
  options?: {
    cultivarBrixRange?: [number, number]      // From research
    rootstockModifierRange?: [number, number] // From research
    additionalModifiers?: number              // Sum of other modifiers
  }
): PredictionRange {
  const { cultivarBrixRange, rootstockModifierRange, additionalModifiers = 0 } = options ?? {}

  let low: number
  let high: number

  if (cultivarBrixRange && rootstockModifierRange) {
    // Use research-based ranges
    low = cultivarBrixRange[0] + rootstockModifierRange[0] + additionalModifiers
    high = cultivarBrixRange[1] + rootstockModifierRange[1] + additionalModifiers
  } else if (cultivarBrixRange) {
    // Just cultivar range
    low = cultivarBrixRange[0] + additionalModifiers
    high = cultivarBrixRange[1] + additionalModifiers
  } else {
    // Estimate based on confidence
    // Lower confidence = wider bands
    const spread = (1 - confidence) * 2  // Max ±2 Brix at 0% confidence
    low = baseBrix - spread + additionalModifiers
    high = baseBrix + spread + additionalModifiers
  }

  // Ensure reasonable bounds
  low = Math.max(4, low)
  high = Math.min(20, high)

  return {
    low: Math.round(low * 10) / 10,
    mid: Math.round(baseBrix * 10) / 10,
    high: Math.round(high * 10) / 10,
    confidence,
    confidenceLevel: getConfidenceLevel(confidence),
    dataQuality: cultivarBrixRange ? 'high' : 'medium',
    basis: cultivarBrixRange ? 'Cultivar research data' : 'Model estimate',
  }
}

// =============================================================================
// UNCERTAINTY COMMUNICATION
// =============================================================================

/**
 * Generate human-readable uncertainty summary.
 */
export function generateUncertaintySummary(
  prediction: {
    predictedBrix: number
    confidence: number
    dataQuality?: DataQuality
    basis?: string
  },
  range?: PredictionRange
): string {
  const level = getConfidenceLevel(prediction.confidence)
  const quality = prediction.dataQuality ?? assessDataQuality({})

  const parts: string[] = []

  // Main prediction
  if (range) {
    parts.push(
      `Predicted Brix: ${range.mid} (range: ${range.low} - ${range.high})`
    )
  } else {
    parts.push(`Predicted Brix: ${prediction.predictedBrix}`)
  }

  // Confidence statement
  switch (level) {
    case 'high':
      parts.push(`Confidence: ${Math.round(prediction.confidence * 100)}% (High)`)
      break
    case 'medium':
      parts.push(`Confidence: ${Math.round(prediction.confidence * 100)}% (Moderate)`)
      break
    case 'low':
      parts.push(`Confidence: ${Math.round(prediction.confidence * 100)}% (Low - treat as estimate)`)
      break
    case 'speculative':
      parts.push(`Confidence: ${Math.round(prediction.confidence * 100)}% (Speculative - significant uncertainty)`)
      break
  }

  // Data quality note
  if (quality === 'unknown' || quality === 'low') {
    parts.push('Note: Limited data available. Prediction accuracy may vary.')
  }

  // Basis
  if (prediction.basis) {
    parts.push(`Based on: ${prediction.basis}`)
  }

  return parts.join('\n')
}

/**
 * Generate actionable recommendations based on confidence level.
 */
export function generateConfidenceRecommendations(
  confidence: number,
  hasActualMeasurement: boolean
): string[] {
  const recommendations: string[] = []
  const level = getConfidenceLevel(confidence)

  if (level === 'speculative' || level === 'low') {
    recommendations.push('Consider obtaining actual Brix measurements to improve accuracy')
    recommendations.push('Check bloom date accuracy for your specific location')
    recommendations.push('Verify rootstock if known (affects quality prediction)')
  }

  if (!hasActualMeasurement) {
    recommendations.push('Take field Brix reading 2-3 weeks before expected harvest')
    recommendations.push('Multiple readings across the block improve accuracy')
  }

  if (level === 'medium') {
    recommendations.push('Prediction is reasonably reliable for planning purposes')
    recommendations.push('Confirm with actual measurement before final harvest decision')
  }

  if (level === 'high') {
    recommendations.push('Prediction is based on good data - suitable for planning')
    if (!hasActualMeasurement) {
      recommendations.push('Verify with field measurement before harvest')
    }
  }

  return recommendations
}

// =============================================================================
// MONTE CARLO SIMULATION (for advanced use)
// =============================================================================

/**
 * Run Monte Carlo simulation for Brix prediction.
 *
 * Uses variance data from cultivar and rootstock ranges to simulate
 * likely outcomes.
 *
 * @param baseBrix - Base Brix estimate
 * @param cultivarRange - [min, max] from research
 * @param rootstockRange - [min, max] modifier
 * @param otherModifiers - Sum of age, timing, etc. modifiers
 * @param iterations - Number of simulations
 * @returns Distribution statistics
 */
export function monteCarloSimulation(
  baseBrix: number,
  cultivarRange?: [number, number],
  rootstockRange?: [number, number],
  otherModifiers: number = 0,
  iterations: number = 1000
): {
  mean: number
  median: number
  p10: number      // 10th percentile (90% will be above this)
  p25: number      // 25th percentile
  p75: number      // 75th percentile
  p90: number      // 90th percentile (90% will be below this)
  stdDev: number
} {
  const results: number[] = []

  for (let i = 0; i < iterations; i++) {
    // Sample from cultivar range (uniform distribution)
    const cultivarSample = cultivarRange
      ? cultivarRange[0] + Math.random() * (cultivarRange[1] - cultivarRange[0])
      : baseBrix

    // Sample from rootstock range (uniform distribution)
    const rootstockSample = rootstockRange
      ? rootstockRange[0] + Math.random() * (rootstockRange[1] - rootstockRange[0])
      : 0

    // Add small noise for other factors (±0.3)
    const noise = (Math.random() - 0.5) * 0.6

    results.push(cultivarSample + rootstockSample + otherModifiers + noise)
  }

  // Sort for percentile calculation
  results.sort((a, b) => a - b)

  // Calculate statistics
  const mean = results.reduce((a, b) => a + b, 0) / results.length
  const median = results[Math.floor(results.length / 2)]
  const p10 = results[Math.floor(results.length * 0.1)]
  const p25 = results[Math.floor(results.length * 0.25)]
  const p75 = results[Math.floor(results.length * 0.75)]
  const p90 = results[Math.floor(results.length * 0.9)]

  // Standard deviation
  const variance = results.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / results.length
  const stdDev = Math.sqrt(variance)

  return {
    mean: Math.round(mean * 10) / 10,
    median: Math.round(median * 10) / 10,
    p10: Math.round(p10 * 10) / 10,
    p25: Math.round(p25 * 10) / 10,
    p75: Math.round(p75 * 10) / 10,
    p90: Math.round(p90 * 10) / 10,
    stdDev: Math.round(stdDev * 100) / 100,
  }
}
