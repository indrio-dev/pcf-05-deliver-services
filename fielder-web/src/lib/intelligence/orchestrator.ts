/**
 * =============================================================================
 * INTELLIGENCE ORCHESTRATOR
 * =============================================================================
 *
 * F016: Central orchestration service for SHARE quality prediction.
 *
 * This orchestrator routes prediction requests through the appropriate layers:
 * 1. DETERMINISTIC: Rules engine for known cultivar/rootstock combinations
 * 2. PROBABILISTIC: ML models for enhanced predictions (stub for future)
 * 3. EXCEPTION: Escalation to human review for low-confidence cases
 *
 * Architecture follows the hybrid intelligence pattern:
 * - Fast path: Deterministic rules for high-confidence cases
 * - Enhanced path: ML overlay for calibrated predictions
 * - Exception path: Human review for outliers and novel cases
 */

import {
  calculateBrixComponentsSync,
  getAgeModifier,
  getTimingModifier,
  estimateSugarAcid,
  BRIX_CONSTRAINTS,
  type BrixComponents,
  type SugarAcidResult,
} from './rules-engine'

import {
  inferFromPLU,
  inferBeefProfile,
  checkOrganicBeefWarning,
  validateOmegaClaim,
  type PLUInference,
  type BeefProfileResult,
  type OrganicBeefWarning,
} from './claim-inference'

import {
  validateMeasurement,
  enforcePhysicalConstraints,
  assessDataQuality,
  detectBrixAnomaly,
  clampToPhysical,
  type ValidationResult,
  type DataQualityResult,
  type MeasurementInput,
} from './validation-engine'

// =============================================================================
// TYPES
// =============================================================================

export type PredictionLayer = 'deterministic' | 'probabilistic' | 'exception'

export interface PredictionInput {
  // Product identification
  cultivarId?: string
  rootstockId?: string
  pluCode?: string

  // Location and timing
  regionId?: string
  currentGdd?: number
  peakGdd?: number
  gddHalfwidth?: number

  // Tree/plant characteristics
  treeAgeYears?: number

  // For livestock
  productCategory?: 'produce' | 'meat' | 'dairy' | 'eggs'
  marketingClaims?: string[]
  isOrganic?: boolean

  // Measurements (if available)
  actualBrix?: number
  actualOmegaRatio?: number

  // Request context
  source?: 'consumer' | 'farm' | 'lab' | 'api'
  requestId?: string
}

export interface PredictionResult {
  // Routing information
  layer: PredictionLayer
  routingReason: string

  // Quality predictions (produce)
  predictedBrix?: number
  brixComponents?: BrixComponents
  sugarAcid?: SugarAcidResult

  // Quality tier
  qualityTier?: 'artisan' | 'premium' | 'standard' | 'commodity'

  // Inference results (from claims)
  pluInference?: PLUInference
  beefProfile?: BeefProfileResult
  organicWarning?: OrganicBeefWarning

  // Confidence and validation
  confidence: number
  confidenceFactors: ConfidenceFactor[]
  validation: ValidationResult
  dataQuality: DataQualityResult

  // Anomaly flags
  isAnomaly: boolean
  anomalyReason?: string

  // ML enhancement (stub)
  mlEnhanced: boolean
  mlModelVersion?: string

  // Exception handling
  needsReview: boolean
  reviewReason?: string

  // Metadata
  timestamp: Date
  processingTimeMs: number
}

export interface ConfidenceFactor {
  factor: string
  impact: number  // -1 to +1 impact on confidence
  reason: string
}

export interface OrchestratorConfig {
  // Feature flags
  enableMLEnhancement: boolean
  enableExceptionHandling: boolean

  // Thresholds
  mlConfidenceThreshold: number     // Below this, use deterministic only
  exceptionThreshold: number         // Below this, escalate to review

  // Model settings
  mlModelVersion?: string
}

// =============================================================================
// DEFAULT CONFIGURATION
// =============================================================================

export const DEFAULT_CONFIG: OrchestratorConfig = {
  enableMLEnhancement: false,      // Disabled until F024
  enableExceptionHandling: true,
  mlConfidenceThreshold: 0.7,
  exceptionThreshold: 0.5,
}

// =============================================================================
// ROUTING LOGIC
// =============================================================================

/**
 * Determine which prediction layer to use.
 */
export function routeToLayer(
  input: PredictionInput,
  config: OrchestratorConfig = DEFAULT_CONFIG
): { layer: PredictionLayer; reason: string } {
  // Check for produce vs livestock routing
  if (input.productCategory === 'meat' || input.marketingClaims?.length) {
    return {
      layer: 'deterministic',
      reason: 'Livestock inference uses deterministic claim analysis',
    }
  }

  // Check if we have enough data for deterministic prediction
  const hasMinimumData = input.cultivarId && input.currentGdd !== undefined && input.peakGdd !== undefined

  if (!hasMinimumData) {
    if (input.pluCode) {
      return {
        layer: 'deterministic',
        reason: 'PLU-only inference available',
      }
    }
    return {
      layer: 'exception',
      reason: 'Insufficient data for prediction - needs review',
    }
  }

  // Check for ML enhancement eligibility
  if (config.enableMLEnhancement && hasEnhancementData(input)) {
    return {
      layer: 'probabilistic',
      reason: 'ML enhancement available for calibrated prediction',
    }
  }

  // Default to deterministic
  return {
    layer: 'deterministic',
    reason: 'Using rules engine for known cultivar/conditions',
  }
}

/**
 * Check if input has enough data for ML enhancement.
 */
function hasEnhancementData(input: PredictionInput): boolean {
  // ML enhancement requires regional calibration data
  // This is a stub - F024 will implement actual checks
  return Boolean(
    input.regionId &&
    input.cultivarId &&
    input.currentGdd !== undefined
  )
}

// =============================================================================
// CONFIDENCE CALCULATION
// =============================================================================

/**
 * Calculate prediction confidence based on input completeness and quality.
 */
function calculateConfidence(
  input: PredictionInput,
  validation: ValidationResult,
  dataQuality: DataQualityResult
): { confidence: number; factors: ConfidenceFactor[] } {
  const factors: ConfidenceFactor[] = []
  let confidence = 0.8 // Base confidence

  // Cultivar knowledge
  if (input.cultivarId) {
    factors.push({
      factor: 'cultivar',
      impact: 0.1,
      reason: 'Known cultivar with quality baseline',
    })
    confidence += 0.1
  } else {
    factors.push({
      factor: 'cultivar',
      impact: -0.2,
      reason: 'Unknown cultivar reduces prediction accuracy',
    })
    confidence -= 0.2
  }

  // Rootstock knowledge
  if (input.rootstockId) {
    factors.push({
      factor: 'rootstock',
      impact: 0.05,
      reason: 'Known rootstock modifier',
    })
    confidence += 0.05
  }

  // GDD accuracy
  if (input.currentGdd !== undefined && input.peakGdd !== undefined) {
    factors.push({
      factor: 'timing',
      impact: 0.1,
      reason: 'GDD timing data available',
    })
    confidence += 0.1
  } else {
    factors.push({
      factor: 'timing',
      impact: -0.15,
      reason: 'Missing GDD timing data',
    })
    confidence -= 0.15
  }

  // Tree age
  if (input.treeAgeYears !== undefined) {
    factors.push({
      factor: 'age',
      impact: 0.05,
      reason: 'Tree age modifier applied',
    })
    confidence += 0.05
  }

  // Validation issues reduce confidence
  if (validation.errors.length > 0) {
    const penalty = validation.errors.length * 0.1
    factors.push({
      factor: 'validation',
      impact: -penalty,
      reason: `${validation.errors.length} validation error(s)`,
    })
    confidence -= penalty
  }

  // Data quality affects confidence
  const qualityImpact = (dataQuality.score - 0.5) * 0.2
  factors.push({
    factor: 'dataQuality',
    impact: qualityImpact,
    reason: `Data quality score: ${(dataQuality.score * 100).toFixed(0)}%`,
  })
  confidence += qualityImpact

  // Source reliability
  if (input.source === 'lab') {
    factors.push({
      factor: 'source',
      impact: 0.05,
      reason: 'Lab-verified data',
    })
    confidence += 0.05
  } else if (input.source === 'consumer') {
    factors.push({
      factor: 'source',
      impact: -0.05,
      reason: 'Consumer-submitted data',
    })
    confidence -= 0.05
  }

  // Clamp confidence to [0.1, 0.99]
  confidence = Math.max(0.1, Math.min(0.99, confidence))

  return { confidence, factors }
}

// =============================================================================
// QUALITY TIER CLASSIFICATION
// =============================================================================

/**
 * Classify predicted Brix into quality tier.
 */
function classifyQualityTier(brix: number): PredictionResult['qualityTier'] {
  if (brix >= 14) return 'artisan'
  if (brix >= 12) return 'premium'
  if (brix >= 10) return 'standard'
  return 'commodity'
}

// =============================================================================
// MAIN PREDICTION FUNCTION
// =============================================================================

/**
 * Main entry point for quality prediction.
 * Routes through deterministic, probabilistic, or exception layers.
 */
export function predictQuality(
  input: PredictionInput,
  config: OrchestratorConfig = DEFAULT_CONFIG
): PredictionResult {
  const startTime = Date.now()

  // Initialize result
  const result: PredictionResult = {
    layer: 'deterministic',
    routingReason: '',
    confidence: 0,
    confidenceFactors: [],
    validation: { isValid: true, errors: [], warnings: [] },
    dataQuality: { score: 0, issues: [], recommendations: [] },
    isAnomaly: false,
    mlEnhanced: false,
    needsReview: false,
    timestamp: new Date(),
    processingTimeMs: 0,
  }

  // Step 1: Validate input
  // Map 'api' source to 'prediction' for validation engine compatibility
  const sourceMap: Record<string, 'consumer' | 'farm' | 'lab' | 'prediction'> = {
    consumer: 'consumer',
    farm: 'farm',
    lab: 'lab',
    api: 'prediction',
    prediction: 'prediction',
  }
  const measurementSource = input.source ? sourceMap[input.source] : undefined
  const measurementInput: MeasurementInput = {
    brix: input.actualBrix,
    omegaRatio: input.actualOmegaRatio,
    gdd: input.currentGdd,
    treeAgeYears: input.treeAgeYears,
    source: measurementSource,
    timestamp: new Date(),
  }
  result.validation = validateMeasurement(measurementInput)
  result.dataQuality = assessDataQuality(measurementInput)

  // Step 2: Route to appropriate layer
  const routing = routeToLayer(input, config)
  result.layer = routing.layer
  result.routingReason = routing.reason

  // Step 3: Calculate confidence
  const { confidence, factors } = calculateConfidence(input, result.validation, result.dataQuality)
  result.confidence = confidence
  result.confidenceFactors = factors

  // Step 4: Execute prediction based on layer
  switch (result.layer) {
    case 'deterministic':
      executeDeterministicPrediction(input, result)
      break

    case 'probabilistic':
      executeProbabilisticPrediction(input, result)
      break

    case 'exception':
      result.needsReview = true
      result.reviewReason = routing.reason
      break
  }

  // Step 5: Check for exception escalation
  if (config.enableExceptionHandling) {
    checkForExceptions(input, result, config)
  }

  // Step 6: Detect anomalies
  detectAnomalies(input, result)

  // Finalize timing
  result.processingTimeMs = Date.now() - startTime

  return result
}

// =============================================================================
// LAYER EXECUTION
// =============================================================================

/**
 * Execute deterministic prediction using rules engine.
 */
function executeDeterministicPrediction(
  input: PredictionInput,
  result: PredictionResult
): void {
  // PLU inference
  if (input.pluCode) {
    result.pluInference = inferFromPLU(input.pluCode)
  }

  // Livestock inference
  if (input.productCategory === 'meat' || input.marketingClaims?.length) {
    if (input.marketingClaims?.length) {
      result.beefProfile = inferBeefProfile(input.marketingClaims)
    }

    if (input.isOrganic !== undefined) {
      result.organicWarning = checkOrganicBeefWarning(
        input.isOrganic,
        input.marketingClaims || []
      )
    }

    // Validate omega if measured
    if (result.beefProfile && input.actualOmegaRatio !== undefined) {
      const omegaValidation = validateOmegaClaim(result.beefProfile.profile, input.actualOmegaRatio)
      if (!omegaValidation.isConsistent) {
        result.isAnomaly = true
        result.anomalyReason = omegaValidation.message
      }
    }

    return
  }

  // Produce prediction
  if (input.cultivarId && input.currentGdd !== undefined && input.peakGdd !== undefined) {
    // Calculate Brix components
    result.brixComponents = calculateBrixComponentsSync(
      input.cultivarId,
      input.rootstockId,
      input.treeAgeYears,
      input.currentGdd,
      input.peakGdd,
      input.gddHalfwidth
    )

    // Set predicted Brix (clamped to valid range)
    result.predictedBrix = clampToPhysical(result.brixComponents.total, 'brix')
    result.qualityTier = classifyQualityTier(result.predictedBrix)

    // Calculate sugar/acid profile
    result.sugarAcid = estimateSugarAcid(input.currentGdd)
  }
}

/**
 * Execute probabilistic prediction (ML-enhanced).
 * Currently a stub - will be implemented in F024.
 */
function executeProbabilisticPrediction(
  input: PredictionInput,
  result: PredictionResult
): void {
  // First, run deterministic as baseline
  executeDeterministicPrediction(input, result)

  // ML enhancement stub - will be implemented in F024
  // For now, just mark as not enhanced
  result.mlEnhanced = false
  result.mlModelVersion = undefined

  // TODO (F024): Apply ML calibration
  // - Load regional calibration offsets
  // - Apply model prediction adjustment
  // - Blend with deterministic baseline
}

// =============================================================================
// EXCEPTION HANDLING
// =============================================================================

/**
 * Check if result should be escalated to exception handling.
 */
function checkForExceptions(
  input: PredictionInput,
  result: PredictionResult,
  config: OrchestratorConfig
): void {
  // Low confidence triggers review
  if (result.confidence < config.exceptionThreshold) {
    result.needsReview = true
    result.reviewReason = `Low confidence (${(result.confidence * 100).toFixed(0)}%) - needs human review`
    return
  }

  // Validation errors trigger review
  if (result.validation.errors.length > 0) {
    result.needsReview = true
    result.reviewReason = `Validation errors: ${result.validation.errors.map(e => e.message).join('; ')}`
    return
  }

  // Anomaly detection triggers review
  if (result.isAnomaly) {
    result.needsReview = true
    result.reviewReason = result.anomalyReason || 'Anomaly detected'
  }
}

// =============================================================================
// ANOMALY DETECTION
// =============================================================================

/**
 * Detect anomalies in prediction or measurement.
 */
function detectAnomalies(
  input: PredictionInput,
  result: PredictionResult
): void {
  // Check actual vs predicted Brix
  if (input.actualBrix !== undefined && result.predictedBrix !== undefined) {
    const expectedMean = result.predictedBrix
    const expectedStdDev = 1.5 // Typical cultivar variation

    const anomaly = detectBrixAnomaly(input.actualBrix, expectedMean, expectedStdDev)
    if (anomaly.isAnomaly) {
      result.isAnomaly = true
      result.anomalyReason = anomaly.reason
    }
  }

  // Check for critical organic warning
  if (result.organicWarning?.severity === 'critical') {
    result.isAnomaly = true
    result.anomalyReason = result.organicWarning.message
  }
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Quick Brix prediction for known produce.
 */
export function predictBrix(
  cultivarId: string,
  currentGdd: number,
  peakGdd: number,
  options?: {
    rootstockId?: string
    treeAgeYears?: number
    gddHalfwidth?: number
  }
): PredictionResult {
  return predictQuality({
    cultivarId,
    currentGdd,
    peakGdd,
    productCategory: 'produce',
    ...options,
  })
}

/**
 * Infer beef quality from marketing claims.
 */
export function assessBeefQuality(
  claims: string[],
  options?: {
    isOrganic?: boolean
    actualOmegaRatio?: number
  }
): PredictionResult {
  return predictQuality({
    productCategory: 'meat',
    marketingClaims: claims,
    isOrganic: options?.isOrganic,
    actualOmegaRatio: options?.actualOmegaRatio,
  })
}

/**
 * Validate a PLU code and infer quality attributes.
 */
export function assessFromPLU(pluCode: string): PredictionResult {
  return predictQuality({
    pluCode,
    productCategory: 'produce',
  })
}

// =============================================================================
// EXPORTS
// =============================================================================

export const orchestrator = {
  // Main prediction
  predictQuality,

  // Convenience functions
  predictBrix,
  assessBeefQuality,
  assessFromPLU,

  // Internal functions (exported for testing)
  routeToLayer,
  calculateConfidence,
  classifyQualityTier,

  // Configuration
  DEFAULT_CONFIG,
}
