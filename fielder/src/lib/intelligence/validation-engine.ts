/**
 * =============================================================================
 * VALIDATION ENGINE
 * =============================================================================
 *
 * F015: Enforces physical constraints and data quality for SHARE measurements.
 *
 * This engine ensures all predictions and measurements are physically possible
 * and flags anomalous data for review. It acts as a quality gate between
 * raw data and the prediction/calibration systems.
 *
 * Key functions:
 * - Physical constraint enforcement (Brix 0-30, omega 1-30, etc.)
 * - Data quality validation (completeness, range, consistency)
 * - Anomaly detection (statistical outliers)
 */

// =============================================================================
// TYPES
// =============================================================================

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  correctedValue?: number
}

export interface ValidationError {
  field: string
  message: string
  code: ValidationErrorCode
  actualValue?: number | string
  constraint?: string
}

export interface ValidationWarning {
  field: string
  message: string
  code: ValidationWarningCode
  severity: 'low' | 'medium' | 'high'
}

export type ValidationErrorCode =
  | 'OUT_OF_PHYSICAL_RANGE'
  | 'MISSING_REQUIRED_FIELD'
  | 'INVALID_FORMAT'
  | 'INCONSISTENT_DATA'
  | 'IMPOSSIBLE_VALUE'

export type ValidationWarningCode =
  | 'OUTSIDE_TYPICAL_RANGE'
  | 'STATISTICAL_OUTLIER'
  | 'LOW_CONFIDENCE'
  | 'DATA_QUALITY_CONCERN'
  | 'POSSIBLE_MEASUREMENT_ERROR'

export interface MeasurementInput {
  brix?: number
  ta?: number                  // Titratable acidity
  omegaRatio?: number          // Omega-6:Omega-3 ratio
  gdd?: number                 // Growing degree days
  treeAgeYears?: number
  moisturePercent?: number
  phValue?: number
  timestamp?: Date | string
  source?: 'consumer' | 'farm' | 'lab' | 'prediction'
}

export interface DataQualityResult {
  score: number                // 0-1 quality score
  issues: string[]
  recommendations: string[]
}

export interface AnomalyResult {
  isAnomaly: boolean
  zScore?: number
  reason?: string
  confidence: number
}

// =============================================================================
// PHYSICAL CONSTRAINTS
// =============================================================================

/**
 * Physical constraints for agricultural measurements.
 * These represent absolute physical limits - values outside these
 * are physically impossible or indicate measurement errors.
 */
export const PHYSICAL_CONSTRAINTS = {
  brix: {
    min: 0,
    max: 30,
    unit: '°Brix',
    description: 'Soluble solids content (sugar equivalent)',
  },
  ta: {
    min: 0,
    max: 10,
    unit: '%',
    description: 'Titratable acidity (citric acid equivalent)',
  },
  omegaRatio: {
    min: 0.5,
    max: 50,
    unit: ':1',
    description: 'Omega-6 to Omega-3 ratio',
  },
  gdd: {
    min: 0,
    max: 10000,
    unit: 'GDD',
    description: 'Accumulated growing degree days',
  },
  treeAge: {
    min: 0,
    max: 150,
    unit: 'years',
    description: 'Tree age',
  },
  moisture: {
    min: 0,
    max: 100,
    unit: '%',
    description: 'Moisture percentage',
  },
  ph: {
    min: 0,
    max: 14,
    unit: 'pH',
    description: 'Acidity/alkalinity scale',
  },
} as const

/**
 * Typical ranges for agricultural measurements.
 * Values outside these are unusual and warrant investigation,
 * but are not physically impossible.
 */
export const TYPICAL_RANGES = {
  brix: {
    produce: { min: 4, max: 20 },
    citrus: { min: 8, max: 16 },
    stoneFruit: { min: 10, max: 22 },
    berries: { min: 6, max: 16 },
  },
  ta: {
    citrus: { min: 0.4, max: 2.5 },
    stoneFruit: { min: 0.3, max: 1.5 },
    berries: { min: 0.5, max: 2.0 },
  },
  omegaRatio: {
    grassFed: { min: 1, max: 6 },
    pasture: { min: 3, max: 8 },
    commodity: { min: 12, max: 25 },
    cafoExtended: { min: 18, max: 30 },
  },
  ratio: {
    // Brix/Acid ratio
    citrus: { min: 5, max: 25 },
    stoneFruit: { min: 15, max: 50 },
  },
} as const

// =============================================================================
// PHYSICAL CONSTRAINT ENFORCEMENT
// =============================================================================

/**
 * Enforce physical constraints on a Brix value.
 * Returns validation result with optional clamped value.
 */
export function enforcePhysicalBrix(value: number | undefined | null): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  }

  if (value === undefined || value === null) {
    result.isValid = false
    result.errors.push({
      field: 'brix',
      message: 'Brix value is required',
      code: 'MISSING_REQUIRED_FIELD',
    })
    return result
  }

  if (typeof value !== 'number' || isNaN(value)) {
    result.isValid = false
    result.errors.push({
      field: 'brix',
      message: 'Brix must be a valid number',
      code: 'INVALID_FORMAT',
      actualValue: value,
    })
    return result
  }

  const { min, max } = PHYSICAL_CONSTRAINTS.brix

  if (value < min || value > max) {
    result.isValid = false
    result.errors.push({
      field: 'brix',
      message: `Brix ${value} is outside physical range [${min}-${max}]`,
      code: 'OUT_OF_PHYSICAL_RANGE',
      actualValue: value,
      constraint: `${min}-${max}`,
    })
    result.correctedValue = Math.max(min, Math.min(max, value))
    return result
  }

  // Check typical range
  const typical = TYPICAL_RANGES.brix.produce
  if (value < typical.min || value > typical.max) {
    result.warnings.push({
      field: 'brix',
      message: `Brix ${value} is outside typical range [${typical.min}-${typical.max}]`,
      code: 'OUTSIDE_TYPICAL_RANGE',
      severity: 'medium',
    })
  }

  return result
}

/**
 * Enforce physical constraints on an omega ratio.
 */
export function enforcePhysicalOmega(value: number | undefined | null): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  }

  if (value === undefined || value === null) {
    // Omega is optional for produce
    return result
  }

  if (typeof value !== 'number' || isNaN(value)) {
    result.isValid = false
    result.errors.push({
      field: 'omegaRatio',
      message: 'Omega ratio must be a valid number',
      code: 'INVALID_FORMAT',
      actualValue: value,
    })
    return result
  }

  const { min, max } = PHYSICAL_CONSTRAINTS.omegaRatio

  if (value < min) {
    result.isValid = false
    result.errors.push({
      field: 'omegaRatio',
      message: `Omega ratio ${value}:1 is impossibly low (minimum ${min}:1)`,
      code: 'IMPOSSIBLE_VALUE',
      actualValue: value,
      constraint: `${min}-${max}`,
    })
    return result
  }

  if (value > max) {
    result.warnings.push({
      field: 'omegaRatio',
      message: `Omega ratio ${value}:1 is extremely high - verify measurement`,
      code: 'POSSIBLE_MEASUREMENT_ERROR',
      severity: 'high',
    })
    result.correctedValue = max
  }

  // Check if suspiciously good for non-grass-fed context
  if (value < 3) {
    result.warnings.push({
      field: 'omegaRatio',
      message: 'Omega ratio under 3:1 is exceptional - verify source and feeding claims',
      code: 'DATA_QUALITY_CONCERN',
      severity: 'low',
    })
  }

  return result
}

/**
 * Enforce physical constraints on GDD.
 */
export function enforcePhysicalGDD(value: number | undefined | null): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  }

  if (value === undefined || value === null) {
    return result
  }

  if (typeof value !== 'number' || isNaN(value)) {
    result.isValid = false
    result.errors.push({
      field: 'gdd',
      message: 'GDD must be a valid number',
      code: 'INVALID_FORMAT',
    })
    return result
  }

  const { min, max } = PHYSICAL_CONSTRAINTS.gdd

  if (value < min) {
    result.isValid = false
    result.errors.push({
      field: 'gdd',
      message: 'GDD cannot be negative',
      code: 'IMPOSSIBLE_VALUE',
      actualValue: value,
    })
    result.correctedValue = 0
    return result
  }

  if (value > max) {
    result.warnings.push({
      field: 'gdd',
      message: `GDD ${value} is unusually high - verify calculation`,
      code: 'OUTSIDE_TYPICAL_RANGE',
      severity: 'medium',
    })
  }

  return result
}

/**
 * Enforce physical constraints on tree age.
 */
export function enforcePhysicalTreeAge(value: number | undefined | null): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  }

  if (value === undefined || value === null) {
    return result
  }

  if (typeof value !== 'number' || isNaN(value)) {
    result.isValid = false
    result.errors.push({
      field: 'treeAge',
      message: 'Tree age must be a valid number',
      code: 'INVALID_FORMAT',
    })
    return result
  }

  const { min, max } = PHYSICAL_CONSTRAINTS.treeAge

  if (value < min) {
    result.isValid = false
    result.errors.push({
      field: 'treeAge',
      message: 'Tree age cannot be negative',
      code: 'IMPOSSIBLE_VALUE',
      actualValue: value,
    })
    return result
  }

  if (value > max) {
    result.warnings.push({
      field: 'treeAge',
      message: `Tree age ${value} years is unusually high - verify`,
      code: 'OUTSIDE_TYPICAL_RANGE',
      severity: 'low',
    })
  }

  // Most tree crops peak at 8-18 years
  if (value > 50) {
    result.warnings.push({
      field: 'treeAge',
      message: 'Very old trees typically have reduced quality',
      code: 'DATA_QUALITY_CONCERN',
      severity: 'low',
    })
  }

  return result
}

/**
 * Enforce all physical constraints on a measurement.
 */
export function enforcePhysicalConstraints(input: MeasurementInput): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  }

  // Validate each field
  const brixResult = enforcePhysicalBrix(input.brix)
  const omegaResult = enforcePhysicalOmega(input.omegaRatio)
  const gddResult = enforcePhysicalGDD(input.gdd)
  const ageResult = enforcePhysicalTreeAge(input.treeAgeYears)

  // Aggregate results
  result.errors.push(...brixResult.errors, ...omegaResult.errors, ...gddResult.errors, ...ageResult.errors)
  result.warnings.push(...brixResult.warnings, ...omegaResult.warnings, ...gddResult.warnings, ...ageResult.warnings)
  result.isValid = result.errors.length === 0

  return result
}

// =============================================================================
// DATA QUALITY VALIDATION
// =============================================================================

/**
 * Validate a measurement for data quality.
 * Checks completeness, consistency, and reasonableness.
 */
export function validateMeasurement(input: MeasurementInput): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  }

  // Check physical constraints first
  const physicalResult = enforcePhysicalConstraints(input)
  result.errors.push(...physicalResult.errors)
  result.warnings.push(...physicalResult.warnings)

  // Check for consistency between related fields
  if (input.brix !== undefined && input.ta !== undefined) {
    const ratio = input.brix / input.ta
    if (ratio < 2 || ratio > 50) {
      result.warnings.push({
        field: 'brix/ta ratio',
        message: `Brix/TA ratio ${ratio.toFixed(1)} is unusual - verify measurements`,
        code: 'DATA_QUALITY_CONCERN',
        severity: 'medium',
      })
    }
  }

  // Check timestamp validity
  if (input.timestamp) {
    const ts = typeof input.timestamp === 'string' ? new Date(input.timestamp) : input.timestamp
    if (isNaN(ts.getTime())) {
      result.errors.push({
        field: 'timestamp',
        message: 'Invalid timestamp format',
        code: 'INVALID_FORMAT',
      })
    } else if (ts > new Date()) {
      result.warnings.push({
        field: 'timestamp',
        message: 'Timestamp is in the future',
        code: 'DATA_QUALITY_CONCERN',
        severity: 'medium',
      })
    }
  }

  // Check source reliability
  if (input.source === 'consumer') {
    result.warnings.push({
      field: 'source',
      message: 'Consumer-submitted data has higher error potential',
      code: 'LOW_CONFIDENCE',
      severity: 'low',
    })
  }

  result.isValid = result.errors.length === 0
  return result
}

/**
 * Assess overall data quality for a measurement.
 */
export function assessDataQuality(input: MeasurementInput): DataQualityResult {
  const issues: string[] = []
  const recommendations: string[] = []
  let score = 1.0

  // Check completeness
  if (input.brix === undefined) {
    issues.push('Missing Brix measurement')
    recommendations.push('Add Brix reading for quality assessment')
    score -= 0.3
  }

  if (input.source === undefined) {
    issues.push('Unknown data source')
    recommendations.push('Specify data source (consumer, farm, lab, prediction)')
    score -= 0.1
  }

  if (input.timestamp === undefined) {
    issues.push('Missing timestamp')
    recommendations.push('Add measurement timestamp for tracking')
    score -= 0.1
  }

  // Penalize for validation issues
  const validation = validateMeasurement(input)
  score -= validation.errors.length * 0.2
  score -= validation.warnings.length * 0.05

  for (const error of validation.errors) {
    issues.push(error.message)
  }

  for (const warning of validation.warnings) {
    if (warning.severity === 'high') {
      issues.push(warning.message)
    }
  }

  // Source quality adjustment
  if (input.source === 'lab') {
    score = Math.min(1.0, score + 0.1) // Lab data gets boost
    recommendations.push('Lab verification provides highest confidence')
  } else if (input.source === 'consumer') {
    score = Math.max(0, score - 0.1) // Consumer data gets penalty
    recommendations.push('Consider lab verification for important decisions')
  }

  return {
    score: Math.max(0, Math.min(1, score)),
    issues,
    recommendations,
  }
}

// =============================================================================
// ANOMALY DETECTION
// =============================================================================

/**
 * Calculate z-score for a value given population statistics.
 */
export function calculateZScore(value: number, mean: number, stdDev: number): number {
  if (stdDev === 0) return 0
  return (value - mean) / stdDev
}

/**
 * Detect if a measurement is a statistical anomaly.
 *
 * @param value - The measured value
 * @param mean - Population mean
 * @param stdDev - Population standard deviation
 * @param threshold - Z-score threshold for anomaly (default 2.5)
 */
export function isAnomalousMeasurement(
  value: number,
  mean: number,
  stdDev: number,
  threshold: number = 2.5
): AnomalyResult {
  if (stdDev === 0) {
    return {
      isAnomaly: value !== mean,
      reason: value !== mean ? 'Value differs from constant population' : undefined,
      confidence: 1.0,
    }
  }

  const zScore = calculateZScore(value, mean, stdDev)
  const absZ = Math.abs(zScore)
  const isAnomaly = absZ > threshold

  let reason: string | undefined
  if (isAnomaly) {
    const direction = zScore > 0 ? 'above' : 'below'
    reason = `Value ${value} is ${absZ.toFixed(1)} standard deviations ${direction} mean (${mean.toFixed(1)})`
  }

  // Confidence in anomaly detection based on z-score
  // Higher z-score = higher confidence it's truly an outlier
  const confidence = Math.min(1.0, absZ / 4) // Max confidence at z=4

  return {
    isAnomaly,
    zScore,
    reason,
    confidence: isAnomaly ? confidence : 1 - confidence,
  }
}

/**
 * Detect anomalies in a Brix measurement for a specific cultivar.
 *
 * @param brix - Measured Brix value
 * @param cultivarMean - Expected mean for cultivar
 * @param cultivarStdDev - Expected standard deviation
 */
export function detectBrixAnomaly(
  brix: number,
  cultivarMean: number,
  cultivarStdDev: number = 1.5
): AnomalyResult {
  // First check physical constraints
  const physical = enforcePhysicalBrix(brix)
  if (!physical.isValid) {
    return {
      isAnomaly: true,
      reason: physical.errors[0]?.message,
      confidence: 1.0,
    }
  }

  return isAnomalousMeasurement(brix, cultivarMean, cultivarStdDev)
}

/**
 * Detect anomalies in omega ratio for a claimed beef profile.
 */
export function detectOmegaAnomaly(
  omegaRatio: number,
  expectedMin: number,
  expectedMax: number
): AnomalyResult {
  // Calculate "center" of expected range
  const mean = (expectedMin + expectedMax) / 2
  const halfRange = (expectedMax - expectedMin) / 2

  // Treat range as ~2 standard deviations
  const stdDev = halfRange / 2

  // Check if within expected range (not anomalous)
  if (omegaRatio >= expectedMin && omegaRatio <= expectedMax) {
    return {
      isAnomaly: false,
      zScore: calculateZScore(omegaRatio, mean, stdDev),
      confidence: 0.9,
    }
  }

  // Outside expected range - calculate how far
  const distanceFromRange = omegaRatio < expectedMin
    ? expectedMin - omegaRatio
    : omegaRatio - expectedMax

  const direction = omegaRatio < expectedMin ? 'better' : 'worse'

  return {
    isAnomaly: true,
    zScore: calculateZScore(omegaRatio, mean, stdDev),
    reason: `Omega ratio ${omegaRatio}:1 is ${direction} than expected range [${expectedMin}-${expectedMax}:1]`,
    confidence: Math.min(1.0, distanceFromRange / 5),
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Clamp a value to physical constraints.
 */
export function clampToPhysical(
  value: number,
  field: keyof typeof PHYSICAL_CONSTRAINTS
): number {
  const constraint = PHYSICAL_CONSTRAINTS[field]
  return Math.max(constraint.min, Math.min(constraint.max, value))
}

/**
 * Check if a value is within typical range.
 */
export function isTypicalValue(
  value: number,
  range: { min: number; max: number }
): boolean {
  return value >= range.min && value <= range.max
}

/**
 * Get severity of how far outside typical range a value is.
 */
export function getDeviationSeverity(
  value: number,
  typical: { min: number; max: number }
): 'normal' | 'low' | 'medium' | 'high' {
  if (isTypicalValue(value, typical)) {
    return 'normal'
  }

  const range = typical.max - typical.min
  const distance = value < typical.min
    ? typical.min - value
    : value - typical.max
  const relativeDistance = distance / range

  if (relativeDistance < 0.25) return 'low'
  if (relativeDistance < 0.5) return 'medium'
  return 'high'
}

// =============================================================================
// EXPORTS
// =============================================================================

export const validationEngine = {
  // Physical constraint enforcement
  enforcePhysicalBrix,
  enforcePhysicalOmega,
  enforcePhysicalGDD,
  enforcePhysicalTreeAge,
  enforcePhysicalConstraints,

  // Data quality
  validateMeasurement,
  assessDataQuality,

  // Anomaly detection
  calculateZScore,
  isAnomalousMeasurement,
  detectBrixAnomaly,
  detectOmegaAnomaly,

  // Utilities
  clampToPhysical,
  isTypicalValue,
  getDeviationSeverity,

  // Constants
  PHYSICAL_CONSTRAINTS,
  TYPICAL_RANGES,
}
