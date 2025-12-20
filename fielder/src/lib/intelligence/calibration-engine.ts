/**
 * =============================================================================
 * CALIBRATION ENGINE
 * =============================================================================
 *
 * F020: Manages regional calibration offsets for prediction refinement.
 *
 * The calibration engine enables the feedback loop:
 * 1. Predictions are made using deterministic rules
 * 2. Actuals are collected (consumer, farm, lab)
 * 3. Calibrations are updated with prediction-actual deltas
 * 4. Future predictions incorporate calibration offsets
 *
 * This creates a self-improving system where predictions get more accurate
 * over time as more actuals are collected for each cultivar x region pair.
 */

import { createClient } from '@supabase/supabase-js'

// =============================================================================
// TYPES
// =============================================================================

export interface RegionalCalibration {
  id: string
  cultivarId: string
  regionId: string
  seasonYear: number | null
  sampleCount: number
  brixOffsetMean: number
  brixOffsetStddev: number
  brixOffsetMin: number | null
  brixOffsetMax: number | null
  maeBefore: number | null
  maeAfter: number | null
  improvementPct: number | null
  confidenceBoost: number
  minSamplesForConfidence: number
  isActive: boolean
  lastActualDate: string | null
  lastCalculationAt: string | null
}

export interface CalibrationResult {
  hasCalibration: boolean
  calibratedBrix: number
  originalBrix: number
  offset: number
  confidenceBoost: number
  sampleCount: number
  calibrationId?: string
}

export interface CalibrationStats {
  totalCalibrations: number
  activeCalibrations: number
  avgSampleCount: number
  avgOffset: number
  topCultivars: Array<{ cultivarId: string; sampleCount: number }>
  topRegions: Array<{ regionId: string; sampleCount: number }>
}

export interface ActualSubmission {
  predictionId?: string
  cultivarId?: string
  regionId?: string
  pluCode?: string
  actualBrix: number
  actualTa?: number
  actualOmegaRatio?: number
  sourceType: 'consumer' | 'farm' | 'lab'
  storeName?: string
  storeCity?: string
  storeState?: string
  measurementDate?: string
  harvestDate?: string
  labName?: string
  userId?: string
  deviceId?: string
  photoUrl?: string
}

// =============================================================================
// CONFIGURATION
// =============================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const MIN_SAMPLES_FOR_CALIBRATION = 5
export const MAX_CONFIDENCE_BOOST = 0.1
export const SAMPLES_FOR_MAX_CONFIDENCE = 50

// =============================================================================
// CALIBRATION RETRIEVAL
// =============================================================================

/**
 * Get calibration offset for a cultivar x region pair.
 *
 * @param cultivarId - Cultivar ID
 * @param regionId - Region ID
 * @param seasonYear - Optional season year (null for all-time)
 */
export async function getCalibration(
  cultivarId: string,
  regionId: string,
  seasonYear?: number
): Promise<RegionalCalibration | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return null
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  const { data, error } = await supabase
    .from('regional_calibrations')
    .select('*')
    .eq('cultivar_id', cultivarId)
    .eq('region_id', regionId)
    .eq('season_year', seasonYear ?? null)
    .eq('is_active', true)
    .single()

  if (error || !data) {
    return null
  }

  return mapCalibrationFromDb(data)
}

/**
 * Get calibration, falling back to all-time if season-specific not found.
 */
export async function getCalibrationWithFallback(
  cultivarId: string,
  regionId: string,
  seasonYear?: number
): Promise<RegionalCalibration | null> {
  // Try season-specific first
  if (seasonYear) {
    const seasonal = await getCalibration(cultivarId, regionId, seasonYear)
    if (seasonal && seasonal.sampleCount >= MIN_SAMPLES_FOR_CALIBRATION) {
      return seasonal
    }
  }

  // Fall back to all-time
  return getCalibration(cultivarId, regionId)
}

// =============================================================================
// CALIBRATION APPLICATION
// =============================================================================

/**
 * Apply calibration offset to a predicted Brix value.
 *
 * @param predictedBrix - Original predicted Brix
 * @param cultivarId - Cultivar ID
 * @param regionId - Region ID
 * @param seasonYear - Optional season year
 */
export async function applyCalibration(
  predictedBrix: number,
  cultivarId: string,
  regionId: string,
  seasonYear?: number
): Promise<CalibrationResult> {
  const calibration = await getCalibrationWithFallback(cultivarId, regionId, seasonYear)

  if (!calibration || calibration.sampleCount < MIN_SAMPLES_FOR_CALIBRATION) {
    return {
      hasCalibration: false,
      calibratedBrix: predictedBrix,
      originalBrix: predictedBrix,
      offset: 0,
      confidenceBoost: 0,
      sampleCount: calibration?.sampleCount ?? 0,
    }
  }

  // Apply offset
  const calibratedBrix = predictedBrix + calibration.brixOffsetMean

  // Clamp to valid range
  const clampedBrix = Math.max(0, Math.min(30, calibratedBrix))

  return {
    hasCalibration: true,
    calibratedBrix: Math.round(clampedBrix * 100) / 100,
    originalBrix: predictedBrix,
    offset: calibration.brixOffsetMean,
    confidenceBoost: calibration.confidenceBoost,
    sampleCount: calibration.sampleCount,
    calibrationId: calibration.id,
  }
}

/**
 * Apply calibration synchronously using cached calibration data.
 * Use when calibration data has already been fetched.
 */
export function applyCalibrationSync(
  predictedBrix: number,
  calibration: RegionalCalibration | null
): CalibrationResult {
  if (!calibration || calibration.sampleCount < MIN_SAMPLES_FOR_CALIBRATION) {
    return {
      hasCalibration: false,
      calibratedBrix: predictedBrix,
      originalBrix: predictedBrix,
      offset: 0,
      confidenceBoost: 0,
      sampleCount: calibration?.sampleCount ?? 0,
    }
  }

  const calibratedBrix = predictedBrix + calibration.brixOffsetMean
  const clampedBrix = Math.max(0, Math.min(30, calibratedBrix))

  return {
    hasCalibration: true,
    calibratedBrix: Math.round(clampedBrix * 100) / 100,
    originalBrix: predictedBrix,
    offset: calibration.brixOffsetMean,
    confidenceBoost: calibration.confidenceBoost,
    sampleCount: calibration.sampleCount,
    calibrationId: calibration.id,
  }
}

// =============================================================================
// CALIBRATION UPDATE
// =============================================================================

/**
 * Calculate running statistics for calibration update.
 * Uses Welford's online algorithm for numerical stability.
 */
export function calculateRunningStats(
  currentMean: number,
  currentStddev: number,
  currentCount: number,
  newValue: number
): { mean: number; stddev: number; count: number } {
  const newCount = currentCount + 1

  // Welford's online algorithm for mean
  const delta = newValue - currentMean
  const newMean = currentMean + delta / newCount

  // Welford's for variance (simplified for stddev)
  // Note: Full implementation would track M2 for accurate stddev
  // This is a simplified approximation
  const newStddev = currentStddev // Placeholder - DB trigger handles this

  return {
    mean: Math.round(newMean * 1000) / 1000,
    stddev: newStddev,
    count: newCount,
  }
}

/**
 * Calculate confidence boost based on sample count.
 */
export function calculateConfidenceBoost(sampleCount: number): number {
  if (sampleCount < MIN_SAMPLES_FOR_CALIBRATION) {
    return 0
  }

  // Linear scale up to max
  const boost = (sampleCount / SAMPLES_FOR_MAX_CONFIDENCE) * MAX_CONFIDENCE_BOOST
  return Math.min(MAX_CONFIDENCE_BOOST, Math.round(boost * 1000) / 1000)
}

/**
 * Update calibration from a new actual measurement.
 * Note: Primary update happens via database trigger, this is for manual updates.
 */
export async function updateCalibration(
  cultivarId: string,
  regionId: string,
  predictedBrix: number,
  actualBrix: number,
  seasonYear?: number
): Promise<boolean> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return false
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  const offset = actualBrix - predictedBrix
  const year = seasonYear ?? new Date().getFullYear()

  // Upsert calibration
  const { error } = await supabase.rpc('upsert_calibration', {
    p_cultivar_id: cultivarId,
    p_region_id: regionId,
    p_season_year: year,
    p_offset: offset,
  })

  return !error
}

// =============================================================================
// ACTUAL SUBMISSION
// =============================================================================

/**
 * Submit an actual measurement to the database.
 * This triggers the calibration update via database trigger.
 */
export async function submitActual(submission: ActualSubmission): Promise<{
  success: boolean
  actualId?: string
  error?: string
}> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return { success: false, error: 'Supabase not configured' }
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  const { data, error } = await supabase
    .from('actuals')
    .insert({
      prediction_id: submission.predictionId,
      cultivar_id: submission.cultivarId,
      region_id: submission.regionId,
      plu_code: submission.pluCode,
      actual_brix: submission.actualBrix,
      actual_ta: submission.actualTa,
      actual_omega_ratio: submission.actualOmegaRatio,
      source_type: submission.sourceType,
      store_name: submission.storeName,
      store_location_city: submission.storeCity,
      store_location_state: submission.storeState,
      measurement_date: submission.measurementDate || new Date().toISOString().split('T')[0],
      harvest_date: submission.harvestDate,
      lab_name: submission.labName,
      user_id: submission.userId,
      device_id: submission.deviceId,
      photo_url: submission.photoUrl,
    })
    .select('id')
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, actualId: data.id }
}

// =============================================================================
// STATISTICS & REPORTING
// =============================================================================

/**
 * Get calibration statistics across all calibrations.
 */
export async function getCalibrationStats(): Promise<CalibrationStats | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return null
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  // Get overall stats
  const { data: calibrations, error } = await supabase
    .from('regional_calibrations')
    .select('cultivar_id, region_id, sample_count, brix_offset_mean, is_active')

  if (error || !calibrations) {
    return null
  }

  const active = calibrations.filter(c => c.is_active)
  const totalSamples = active.reduce((sum, c) => sum + (c.sample_count || 0), 0)
  const totalOffset = active.reduce((sum, c) => sum + (c.brix_offset_mean || 0) * (c.sample_count || 0), 0)

  // Aggregate by cultivar
  const cultivarMap = new Map<string, number>()
  active.forEach(c => {
    const current = cultivarMap.get(c.cultivar_id) || 0
    cultivarMap.set(c.cultivar_id, current + (c.sample_count || 0))
  })

  // Aggregate by region
  const regionMap = new Map<string, number>()
  active.forEach(c => {
    const current = regionMap.get(c.region_id) || 0
    regionMap.set(c.region_id, current + (c.sample_count || 0))
  })

  // Sort and take top 5
  const topCultivars = Array.from(cultivarMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([cultivarId, sampleCount]) => ({ cultivarId, sampleCount }))

  const topRegions = Array.from(regionMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([regionId, sampleCount]) => ({ regionId, sampleCount }))

  return {
    totalCalibrations: calibrations.length,
    activeCalibrations: active.length,
    avgSampleCount: active.length > 0 ? Math.round(totalSamples / active.length) : 0,
    avgOffset: totalSamples > 0 ? Math.round((totalOffset / totalSamples) * 100) / 100 : 0,
    topCultivars,
    topRegions,
  }
}

/**
 * Get calibrations for a specific cultivar across all regions.
 */
export async function getCalibrationsForCultivar(
  cultivarId: string
): Promise<RegionalCalibration[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return []
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  const { data, error } = await supabase
    .from('regional_calibrations')
    .select('*')
    .eq('cultivar_id', cultivarId)
    .eq('is_active', true)
    .order('sample_count', { ascending: false })

  if (error || !data) {
    return []
  }

  return data.map(mapCalibrationFromDb)
}

/**
 * Get calibrations for a specific region across all cultivars.
 */
export async function getCalibrationsForRegion(
  regionId: string
): Promise<RegionalCalibration[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return []
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  const { data, error } = await supabase
    .from('regional_calibrations')
    .select('*')
    .eq('region_id', regionId)
    .eq('is_active', true)
    .order('sample_count', { ascending: false })

  if (error || !data) {
    return []
  }

  return data.map(mapCalibrationFromDb)
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Map database row to TypeScript interface.
 */
function mapCalibrationFromDb(row: Record<string, unknown>): RegionalCalibration {
  return {
    id: row.id as string,
    cultivarId: row.cultivar_id as string,
    regionId: row.region_id as string,
    seasonYear: row.season_year as number | null,
    sampleCount: (row.sample_count as number) || 0,
    brixOffsetMean: (row.brix_offset_mean as number) || 0,
    brixOffsetStddev: (row.brix_offset_stddev as number) || 0,
    brixOffsetMin: row.brix_offset_min as number | null,
    brixOffsetMax: row.brix_offset_max as number | null,
    maeBefore: row.mae_before as number | null,
    maeAfter: row.mae_after as number | null,
    improvementPct: row.improvement_pct as number | null,
    confidenceBoost: (row.confidence_boost as number) || 0,
    minSamplesForConfidence: (row.min_samples_for_confidence as number) || 10,
    isActive: (row.is_active as boolean) ?? true,
    lastActualDate: row.last_actual_date as string | null,
    lastCalculationAt: row.last_calculation_at as string | null,
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export const calibrationEngine = {
  // Retrieval
  getCalibration,
  getCalibrationWithFallback,
  getCalibrationsForCultivar,
  getCalibrationsForRegion,

  // Application
  applyCalibration,
  applyCalibrationSync,

  // Update
  updateCalibration,
  submitActual,

  // Statistics
  calculateRunningStats,
  calculateConfidenceBoost,
  getCalibrationStats,

  // Constants
  MIN_SAMPLES_FOR_CALIBRATION,
  MAX_CONFIDENCE_BOOST,
  SAMPLES_FOR_MAX_CONFIDENCE,
}
