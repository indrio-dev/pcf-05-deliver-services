/**
 * =============================================================================
 * BRIX ML SERVICE (MVP)
 * =============================================================================
 *
 * F024: ML-enhanced Brix prediction service.
 *
 * Architecture: Hybrid approach per ADR-001
 * - TypeScript handles feature extraction and inference routing
 * - External Python service handles training (future)
 * - A/B testing framework for formula vs ML comparison
 *
 * MVP Implementation:
 * - Feature extraction from SHARE pillars
 * - Stub for ML model inference
 * - A/B testing with consistent user assignment
 * - Fallback to deterministic predictions
 */

import { createClient } from '@supabase/supabase-js'

// =============================================================================
// TYPES
// =============================================================================

export type ModelVersion = 'formula_v1' | 'ml_v1' | 'ml_v2'
export type ABGroup = 'control' | 'treatment'

export interface MLFeatures {
  // Cultivar features
  cultivarId: string
  baseBrix: number
  qualityTier: string

  // Environmental features
  regionId: string
  currentGdd: number
  targetGdd: number
  gddProgress: number

  // Timing features
  daysFromPeakCenter: number
  seasonMonth: number
  isEarlySeasonDate: boolean
  isLateSeasonDate: boolean

  // Tree/plant features
  treeAgeYears?: number
  rootstockId?: string
  rootstockModifier?: number

  // Calibration features
  hasCalibration: boolean
  calibrationOffset: number
  calibrationSampleCount: number

  // Historical features
  regionAvgBrix?: number
  cultivarAvgBrix?: number

  // Practice features (encoded)
  fertilityApproach?: number  // 0=annual, 1=soil_banking, 2=mineralized
  pestManagement?: number     // 0=conventional, 1=ipm, 2=organic, 3=no_spray
  cropLoadManaged?: boolean
}

export interface MLPrediction {
  predictedBrix: number
  confidence: number
  modelVersion: ModelVersion
  features: MLFeatures
  enhancementDelta?: number  // How much ML changed from formula
}

export interface ABAssignment {
  userId: string
  group: ABGroup
  modelVersion: ModelVersion
  experimentId: string
}

export interface ABExperiment {
  id: string
  name: string
  controlModel: ModelVersion
  treatmentModel: ModelVersion
  trafficSplit: number  // 0-1, percentage in treatment
  isActive: boolean
  startDate: string
  endDate?: string
}

export interface ModelMetadata {
  version: ModelVersion
  trainedAt?: string
  mae?: number
  sampleCount?: number
  features: string[]
  isActive: boolean
}

// =============================================================================
// CONFIGURATION
// =============================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const ML_API_URL = process.env.ML_API_URL || ''

// Feature encoding maps
export const FERTILITY_ENCODING: Record<string, number> = {
  annual_fertility: 0,
  soil_banking: 1,
  mineralized_soil_science: 2,
}

export const PEST_MANAGEMENT_ENCODING: Record<string, number> = {
  conventional: 0,
  ipm: 1,
  organic: 2,
  no_spray: 3,
}

// Default experiment
export const DEFAULT_EXPERIMENT: ABExperiment = {
  id: 'default_ab_v1',
  name: 'Formula vs ML v1',
  controlModel: 'formula_v1',
  treatmentModel: 'ml_v1',
  trafficSplit: 0.1, // 10% to ML
  isActive: true,
  startDate: '2024-01-01',
}

// =============================================================================
// FEATURE EXTRACTION
// =============================================================================

/**
 * Extract ML features from prediction context.
 */
export function extractFeatures(context: {
  cultivarId: string
  baseBrix: number
  qualityTier?: string
  regionId?: string
  currentGdd?: number
  targetGdd?: number
  daysFromPeakCenter?: number
  treeAgeYears?: number
  rootstockId?: string
  rootstockModifier?: number
  calibrationOffset?: number
  calibrationSampleCount?: number
  fertilityApproach?: string
  pestManagement?: string
  cropLoadManaged?: boolean
}): MLFeatures {
  const targetGdd = context.targetGdd || 1500
  const currentGdd = context.currentGdd || 0

  return {
    // Cultivar
    cultivarId: context.cultivarId,
    baseBrix: context.baseBrix,
    qualityTier: context.qualityTier || 'standard',

    // Environment
    regionId: context.regionId || 'unknown',
    currentGdd,
    targetGdd,
    gddProgress: targetGdd > 0 ? currentGdd / targetGdd : 0,

    // Timing
    daysFromPeakCenter: context.daysFromPeakCenter || 0,
    seasonMonth: new Date().getMonth() + 1,
    isEarlySeasonDate: new Date().getMonth() < 3, // Before March
    isLateSeasonDate: new Date().getMonth() > 9, // After October

    // Tree/plant
    treeAgeYears: context.treeAgeYears,
    rootstockId: context.rootstockId,
    rootstockModifier: context.rootstockModifier || 0,

    // Calibration
    hasCalibration: (context.calibrationSampleCount || 0) >= 5,
    calibrationOffset: context.calibrationOffset || 0,
    calibrationSampleCount: context.calibrationSampleCount || 0,

    // Practices (encoded)
    fertilityApproach: context.fertilityApproach
      ? FERTILITY_ENCODING[context.fertilityApproach]
      : undefined,
    pestManagement: context.pestManagement
      ? PEST_MANAGEMENT_ENCODING[context.pestManagement]
      : undefined,
    cropLoadManaged: context.cropLoadManaged,
  }
}

/**
 * Convert features to numeric array for model input.
 */
export function featuresToArray(features: MLFeatures): number[] {
  return [
    features.baseBrix,
    features.currentGdd,
    features.targetGdd,
    features.gddProgress,
    features.daysFromPeakCenter,
    features.seasonMonth,
    features.isEarlySeasonDate ? 1 : 0,
    features.isLateSeasonDate ? 1 : 0,
    features.treeAgeYears || 0,
    features.rootstockModifier || 0,
    features.hasCalibration ? 1 : 0,
    features.calibrationOffset,
    features.calibrationSampleCount,
    features.fertilityApproach ?? -1,
    features.pestManagement ?? -1,
    features.cropLoadManaged ? 1 : 0,
  ]
}

/**
 * Get feature names for interpretability.
 */
export function getFeatureNames(): string[] {
  return [
    'base_brix',
    'current_gdd',
    'target_gdd',
    'gdd_progress',
    'days_from_peak',
    'season_month',
    'is_early_season',
    'is_late_season',
    'tree_age_years',
    'rootstock_modifier',
    'has_calibration',
    'calibration_offset',
    'calibration_sample_count',
    'fertility_approach',
    'pest_management',
    'crop_load_managed',
  ]
}

// =============================================================================
// A/B TESTING
// =============================================================================

/**
 * Assign user to A/B group using consistent hashing.
 */
export function assignABGroup(
  userId: string,
  experiment: ABExperiment = DEFAULT_EXPERIMENT
): ABAssignment {
  // Consistent hash based on userId + experimentId
  const hash = simpleHash(userId + experiment.id)
  const normalized = (hash % 100) / 100

  const group: ABGroup = normalized < experiment.trafficSplit ? 'treatment' : 'control'
  const modelVersion = group === 'treatment'
    ? experiment.treatmentModel
    : experiment.controlModel

  return {
    userId,
    group,
    modelVersion,
    experimentId: experiment.id,
  }
}

/**
 * Simple hash function for consistent group assignment.
 */
function simpleHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash)
}

/**
 * Check if user should get ML predictions.
 */
export function shouldUseML(userId: string, experiment?: ABExperiment): boolean {
  const assignment = assignABGroup(userId, experiment)
  return assignment.group === 'treatment'
}

// =============================================================================
// ML PREDICTION
// =============================================================================

/**
 * Get ML-enhanced prediction.
 *
 * MVP: Returns formula prediction with ML enhancement stub.
 * Future: Calls external ML service or runs local model.
 */
export async function getMLPrediction(
  features: MLFeatures,
  formulaPrediction: number,
  userId?: string
): Promise<MLPrediction> {
  // Check A/B assignment
  const useML = userId ? shouldUseML(userId) : false

  if (!useML) {
    // Control group: return formula prediction
    return {
      predictedBrix: formulaPrediction,
      confidence: 0.75, // Formula confidence baseline
      modelVersion: 'formula_v1',
      features,
    }
  }

  // Treatment group: try ML enhancement
  try {
    const mlPrediction = await callMLService(features)

    if (mlPrediction !== null) {
      return {
        predictedBrix: mlPrediction.brix,
        confidence: mlPrediction.confidence,
        modelVersion: 'ml_v1',
        features,
        enhancementDelta: mlPrediction.brix - formulaPrediction,
      }
    }
  } catch (error) {
    console.error('ML service error, falling back to formula:', error)
  }

  // Fallback to formula
  return {
    predictedBrix: formulaPrediction,
    confidence: 0.75,
    modelVersion: 'formula_v1',
    features,
  }
}

/**
 * Call external ML service.
 *
 * MVP: Returns null (stub).
 * Future: HTTP call to Python prediction service.
 */
async function callMLService(
  features: MLFeatures
): Promise<{ brix: number; confidence: number } | null> {
  if (!ML_API_URL) {
    // MVP: No external service configured
    // Apply simple ML enhancement heuristic
    return applyMLHeuristic(features)
  }

  try {
    const response = await fetch(`${ML_API_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        features: featuresToArray(features),
        feature_names: getFeatureNames(),
      }),
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return {
      brix: data.predicted_brix,
      confidence: data.confidence,
    }
  } catch {
    return null
  }
}

/**
 * Apply simple ML heuristic for MVP.
 *
 * This is a placeholder that applies learned patterns
 * until a real ML model is trained.
 */
function applyMLHeuristic(
  features: MLFeatures
): { brix: number; confidence: number } | null {
  // MVP heuristic: Use calibration offset + small adjustments
  let adjustment = 0
  let confidence = 0.70

  // Apply calibration if available
  if (features.hasCalibration) {
    adjustment += features.calibrationOffset
    confidence += Math.min(features.calibrationSampleCount / 100, 0.15)
  }

  // GDD progress adjustment
  if (features.gddProgress > 0.9 && features.gddProgress < 1.1) {
    confidence += 0.05 // High confidence at peak
  } else if (features.gddProgress < 0.5) {
    confidence -= 0.10 // Lower confidence early
  }

  // Timing penalty
  if (Math.abs(features.daysFromPeakCenter) > 14) {
    adjustment -= 0.1 // Slight penalty away from peak
  }

  // Practice bonus
  if (features.fertilityApproach === 2) { // mineralized
    adjustment += 0.1
    confidence += 0.02
  }

  const predictedBrix = features.baseBrix + adjustment
  return {
    brix: Math.round(predictedBrix * 100) / 100,
    confidence: Math.min(0.95, Math.max(0.5, confidence)),
  }
}

// =============================================================================
// MODEL MANAGEMENT
// =============================================================================

/**
 * Get active model metadata.
 */
export async function getActiveModel(): Promise<ModelMetadata | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    // Return default formula model
    return {
      version: 'formula_v1',
      features: getFeatureNames(),
      isActive: true,
    }
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  const { data, error } = await supabase
    .from('model_versions')
    .select('*')
    .eq('is_active', true)
    .single()

  if (error || !data) {
    return {
      version: 'formula_v1',
      features: getFeatureNames(),
      isActive: true,
    }
  }

  return {
    version: data.version as ModelVersion,
    trainedAt: data.trained_at,
    mae: data.mae,
    sampleCount: data.sample_count,
    features: data.features || getFeatureNames(),
    isActive: true,
  }
}

/**
 * Log prediction for A/B analysis.
 */
export async function logPrediction(
  prediction: MLPrediction,
  assignment: ABAssignment,
  actualBrix?: number
): Promise<boolean> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return false
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  const { error } = await supabase
    .from('ab_predictions')
    .insert({
      user_id: assignment.userId,
      experiment_id: assignment.experimentId,
      ab_group: assignment.group,
      model_version: prediction.modelVersion,
      predicted_brix: prediction.predictedBrix,
      actual_brix: actualBrix,
      confidence: prediction.confidence,
      enhancement_delta: prediction.enhancementDelta,
      features: prediction.features,
    })

  return !error
}

/**
 * Get A/B experiment results.
 */
export async function getExperimentResults(experimentId: string): Promise<{
  control: { mae: number; count: number }
  treatment: { mae: number; count: number }
  improvement?: number
} | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return null
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  const { data, error } = await supabase
    .from('ab_predictions')
    .select('ab_group, predicted_brix, actual_brix')
    .eq('experiment_id', experimentId)
    .not('actual_brix', 'is', null)

  if (error || !data) {
    return null
  }

  const control = data.filter(d => d.ab_group === 'control')
  const treatment = data.filter(d => d.ab_group === 'treatment')

  const calcMAE = (rows: typeof data) => {
    if (rows.length === 0) return 0
    const errors = rows.map(r => Math.abs(r.predicted_brix - r.actual_brix))
    return errors.reduce((a, b) => a + b, 0) / errors.length
  }

  const controlMAE = calcMAE(control)
  const treatmentMAE = calcMAE(treatment)

  return {
    control: { mae: Math.round(controlMAE * 1000) / 1000, count: control.length },
    treatment: { mae: Math.round(treatmentMAE * 1000) / 1000, count: treatment.length },
    improvement: controlMAE > 0
      ? Math.round((1 - treatmentMAE / controlMAE) * 1000) / 10
      : undefined,
  }
}

// =============================================================================
// MODEL VERSIONING
// =============================================================================

export interface ModelVersionRecord {
  id: string
  version: ModelVersion
  modelType: string
  isActive: boolean
  isProduction: boolean
  isRollbackTarget: boolean
  trainedAt: string | null
  sampleCount: number | null
  mae: number | null
  rmse: number | null
  features: string[]
  trafficPercentage: number
  experimentId: string | null
  createdAt: string
  deploymentNotes: string | null
}

/**
 * Get all model versions.
 */
export async function getAllModelVersions(modelType: string = 'brix'): Promise<ModelVersionRecord[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return []
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  const { data, error } = await supabase
    .from('model_versions')
    .select('*')
    .eq('model_type', modelType)
    .order('created_at', { ascending: false })

  if (error || !data) {
    return []
  }

  return data.map(mapModelVersionFromDb)
}

/**
 * Get production model.
 */
export async function getProductionModel(modelType: string = 'brix'): Promise<ModelVersionRecord | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return null
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  const { data, error } = await supabase
    .from('model_versions')
    .select('*')
    .eq('model_type', modelType)
    .eq('is_production', true)
    .single()

  if (error || !data) {
    return null
  }

  return mapModelVersionFromDb(data)
}

/**
 * Promote a model version to production.
 */
export async function setProductionModel(
  versionId: string,
  modelType: string = 'brix'
): Promise<{ success: boolean; error?: string }> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return { success: false, error: 'Database not configured' }
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  // First, get the current production model to mark as rollback target
  const { data: currentProd } = await supabase
    .from('model_versions')
    .select('id')
    .eq('model_type', modelType)
    .eq('is_production', true)
    .single()

  // Start transaction: remove current production flag
  const { error: clearError } = await supabase
    .from('model_versions')
    .update({ is_production: false })
    .eq('model_type', modelType)
    .eq('is_production', true)

  if (clearError) {
    return { success: false, error: clearError.message }
  }

  // Set new production model
  const { error: setError } = await supabase
    .from('model_versions')
    .update({
      is_production: true,
      is_active: true,
    })
    .eq('id', versionId)

  if (setError) {
    return { success: false, error: setError.message }
  }

  // Mark previous production as rollback target
  if (currentProd?.id) {
    await supabase
      .from('model_versions')
      .update({ is_rollback_target: true })
      .eq('id', currentProd.id)
  }

  return { success: true }
}

/**
 * Rollback to the previous production model.
 */
export async function rollbackModel(modelType: string = 'brix'): Promise<{
  success: boolean
  rolledBackTo?: string
  error?: string
}> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return { success: false, error: 'Database not configured' }
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  // Find the rollback target
  const { data: rollbackTarget, error: findError } = await supabase
    .from('model_versions')
    .select('id, version')
    .eq('model_type', modelType)
    .eq('is_rollback_target', true)
    .single()

  if (findError || !rollbackTarget) {
    return { success: false, error: 'No rollback target available' }
  }

  // Clear current production
  const { error: clearError } = await supabase
    .from('model_versions')
    .update({ is_production: false })
    .eq('model_type', modelType)
    .eq('is_production', true)

  if (clearError) {
    return { success: false, error: clearError.message }
  }

  // Set rollback target as production
  const { error: rollbackError } = await supabase
    .from('model_versions')
    .update({
      is_production: true,
      is_active: true,
      is_rollback_target: false,
    })
    .eq('id', rollbackTarget.id)

  if (rollbackError) {
    return { success: false, error: rollbackError.message }
  }

  return {
    success: true,
    rolledBackTo: rollbackTarget.version,
  }
}

/**
 * Register a new model version.
 */
export async function registerModelVersion(input: {
  version: string
  modelType?: string
  trainedAt?: string
  sampleCount?: number
  mae?: number
  rmse?: number
  features?: string[]
  experimentId?: string
  modelArtifactUrl?: string
  deploymentNotes?: string
}): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return { success: false, error: 'Database not configured' }
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  const { data, error } = await supabase
    .from('model_versions')
    .insert({
      version: input.version,
      model_type: input.modelType || 'brix',
      trained_at: input.trainedAt,
      sample_count: input.sampleCount,
      mae: input.mae,
      rmse: input.rmse,
      features: input.features || getFeatureNames(),
      experiment_id: input.experimentId,
      model_artifact_url: input.modelArtifactUrl,
      deployment_notes: input.deploymentNotes,
    })
    .select('id')
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, id: data.id }
}

/**
 * Update model traffic percentage for A/B routing.
 */
export async function updateModelTraffic(
  versionId: string,
  trafficPercentage: number
): Promise<{ success: boolean; error?: string }> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return { success: false, error: 'Database not configured' }
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  const { error } = await supabase
    .from('model_versions')
    .update({
      traffic_percentage: Math.max(0, Math.min(100, trafficPercentage)),
      is_active: trafficPercentage > 0,
    })
    .eq('id', versionId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Map database row to TypeScript interface.
 */
function mapModelVersionFromDb(row: Record<string, unknown>): ModelVersionRecord {
  return {
    id: row.id as string,
    version: row.version as ModelVersion,
    modelType: row.model_type as string,
    isActive: row.is_active as boolean,
    isProduction: row.is_production as boolean,
    isRollbackTarget: row.is_rollback_target as boolean,
    trainedAt: row.trained_at as string | null,
    sampleCount: row.sample_count as number | null,
    mae: row.mae as number | null,
    rmse: row.rmse as number | null,
    features: (row.features as string[]) || [],
    trafficPercentage: row.traffic_percentage as number || 0,
    experimentId: row.experiment_id as string | null,
    createdAt: row.created_at as string,
    deploymentNotes: row.deployment_notes as string | null,
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export const brixMLService = {
  // Feature extraction
  extractFeatures,
  featuresToArray,
  getFeatureNames,

  // A/B testing
  assignABGroup,
  shouldUseML,
  DEFAULT_EXPERIMENT,

  // Prediction
  getMLPrediction,

  // Model management
  getActiveModel,
  logPrediction,
  getExperimentResults,

  // Encodings
  FERTILITY_ENCODING,
  PEST_MANAGEMENT_ENCODING,
}
