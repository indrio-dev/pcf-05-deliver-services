/**
 * =============================================================================
 * ACCURACY REPORTER
 * =============================================================================
 *
 * F023: Generates accuracy reports comparing predictions to actuals.
 *
 * Key metrics:
 * - MAE (Mean Absolute Error): Average magnitude of errors
 * - RMSE (Root Mean Squared Error): Emphasizes larger errors
 * - MAPE (Mean Absolute Percentage Error): Scale-independent
 * - Within-threshold percentages: Practical accuracy measures
 *
 * Reports can be generated at different scopes:
 * - Overall (all predictions)
 * - By cultivar
 * - By region
 * - By prediction layer (deterministic/probabilistic)
 * - By data source (consumer/farm/lab)
 */

import { createClient } from '@supabase/supabase-js'

// =============================================================================
// TYPES
// =============================================================================

export type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'seasonal' | 'all_time'
export type SourceType = 'consumer' | 'farm' | 'lab' | 'all'
export type PredictionLayer = 'deterministic' | 'probabilistic' | 'exception'
export type TrendDirection = 'improving' | 'stable' | 'degrading'

export interface AccuracyMetrics {
  // Sample info
  sampleCount: number
  predictionCount: number
  actualCount: number
  matchedPairs: number

  // Error metrics
  mae: number          // Mean Absolute Error
  mse: number          // Mean Squared Error
  rmse: number         // Root Mean Squared Error
  mape: number         // Mean Absolute Percentage Error (%)

  // Bias metrics
  meanError: number    // Average error (positive = over-predicting)
  medianError: number
  errorStddev: number

  // Distribution metrics
  pctWithin05: number  // % within ±0.5 Brix
  pctWithin10: number  // % within ±1.0 Brix
  pctWithin15: number  // % within ±1.5 Brix
  pctWithin20: number  // % within ±2.0 Brix

  // Confidence correlation
  avgConfidence: number
  confidenceCorrelation: number
}

export interface TierAccuracy {
  artisan?: number
  premium?: number
  standard?: number
  commodity?: number
}

export interface AccuracyReport extends AccuracyMetrics {
  id: string
  reportDate: string
  reportPeriod: ReportPeriod
  cultivarId: string | null
  regionId: string | null
  predictionLayer: PredictionLayer | null
  sourceType: SourceType

  // Tier breakdown
  tierAccuracy: TierAccuracy

  // Trend
  maeTrend: TrendDirection
  maeChangePct: number

  // Alerts
  needsRetraining: boolean
  alertTriggered: boolean
  alertReason: string | null

  createdAt: string
}

export interface ReportOptions {
  period?: ReportPeriod
  cultivarId?: string
  regionId?: string
  predictionLayer?: PredictionLayer
  sourceType?: SourceType
  startDate?: string
  endDate?: string
}

export interface PredictionActualPair {
  predictionId: string
  cultivarId: string
  regionId: string | null
  predictedBrix: number
  actualBrix: number
  confidence: number
  qualityTier: string | null
  predictionDate: string
  measurementDate: string
}

// =============================================================================
// CONFIGURATION
// =============================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Alert thresholds
export const ALERT_THRESHOLDS = {
  mae: 1.5,           // Alert if MAE > 1.5 Brix
  maeIncrease: 0.25,  // Alert if MAE increases > 0.25 from previous
  pctWithin10: 0.60,  // Alert if < 60% within ±1.0 Brix
  retrainTrigger: 2.0, // Suggest retraining if MAE > 2.0
} as const

// Trend thresholds
export const TREND_THRESHOLDS = {
  improving: -0.05,   // >5% decrease = improving
  degrading: 0.10,    // >10% increase = degrading
} as const

// =============================================================================
// METRIC CALCULATIONS
// =============================================================================

/**
 * Calculate all accuracy metrics from prediction-actual pairs.
 */
export function calculateMetrics(pairs: PredictionActualPair[]): AccuracyMetrics {
  if (pairs.length === 0) {
    return emptyMetrics()
  }

  const errors = pairs.map(p => p.predictedBrix - p.actualBrix)
  const absErrors = errors.map(Math.abs)
  const squaredErrors = errors.map(e => e * e)
  const pctErrors = pairs.map((p, i) =>
    p.actualBrix !== 0 ? (absErrors[i] / p.actualBrix) * 100 : 0
  )

  // Basic metrics
  const mae = mean(absErrors)
  const mse = mean(squaredErrors)
  const rmse = Math.sqrt(mse)
  const mape = mean(pctErrors)

  // Bias metrics
  const meanError = mean(errors)
  const medianError = median(errors)
  const errorStddev = stddev(errors)

  // Distribution metrics
  const pctWithin05 = percentWithin(absErrors, 0.5)
  const pctWithin10 = percentWithin(absErrors, 1.0)
  const pctWithin15 = percentWithin(absErrors, 1.5)
  const pctWithin20 = percentWithin(absErrors, 2.0)

  // Confidence correlation
  const avgConfidence = mean(pairs.map(p => p.confidence))
  const confidenceCorrelation = calculateCorrelation(
    pairs.map(p => p.confidence),
    absErrors.map(e => 1 - Math.min(e / 5, 1)) // Convert error to "accuracy"
  )

  return {
    sampleCount: pairs.length,
    predictionCount: pairs.length,
    actualCount: pairs.length,
    matchedPairs: pairs.length,
    mae: round(mae, 3),
    mse: round(mse, 4),
    rmse: round(rmse, 3),
    mape: round(mape, 2),
    meanError: round(meanError, 3),
    medianError: round(medianError, 3),
    errorStddev: round(errorStddev, 3),
    pctWithin05: round(pctWithin05, 2),
    pctWithin10: round(pctWithin10, 2),
    pctWithin15: round(pctWithin15, 2),
    pctWithin20: round(pctWithin20, 2),
    avgConfidence: round(avgConfidence, 3),
    confidenceCorrelation: round(confidenceCorrelation, 3),
  }
}

/**
 * Calculate tier-specific accuracy.
 */
export function calculateTierAccuracy(pairs: PredictionActualPair[]): TierAccuracy {
  const tiers = ['artisan', 'premium', 'standard', 'commodity'] as const
  const result: TierAccuracy = {}

  for (const tier of tiers) {
    const tierPairs = pairs.filter(p => p.qualityTier === tier)
    if (tierPairs.length >= 5) {
      const absErrors = tierPairs.map(p => Math.abs(p.predictedBrix - p.actualBrix))
      result[tier] = round(percentWithin(absErrors, 1.0), 2)
    }
  }

  return result
}

/**
 * Determine trend direction based on MAE change.
 */
export function determineTrend(
  currentMae: number,
  previousMae: number | null
): { trend: TrendDirection; changePct: number } {
  if (previousMae === null || previousMae === 0) {
    return { trend: 'stable', changePct: 0 }
  }

  const changePct = (currentMae - previousMae) / previousMae

  if (changePct < TREND_THRESHOLDS.improving) {
    return { trend: 'improving', changePct: round(changePct * 100, 2) }
  }
  if (changePct > TREND_THRESHOLDS.degrading) {
    return { trend: 'degrading', changePct: round(changePct * 100, 2) }
  }
  return { trend: 'stable', changePct: round(changePct * 100, 2) }
}

/**
 * Check if alerts should be triggered.
 */
export function checkAlerts(metrics: AccuracyMetrics, maeChangePct: number): {
  needsRetraining: boolean
  alertTriggered: boolean
  alertReason: string | null
} {
  const reasons: string[] = []

  if (metrics.mae > ALERT_THRESHOLDS.retrainTrigger) {
    reasons.push(`MAE ${metrics.mae} exceeds retraining threshold ${ALERT_THRESHOLDS.retrainTrigger}`)
  }

  if (metrics.mae > ALERT_THRESHOLDS.mae) {
    reasons.push(`MAE ${metrics.mae} exceeds alert threshold ${ALERT_THRESHOLDS.mae}`)
  }

  if (maeChangePct > ALERT_THRESHOLDS.maeIncrease * 100) {
    reasons.push(`MAE increased ${maeChangePct}% from previous period`)
  }

  if (metrics.pctWithin10 < ALERT_THRESHOLDS.pctWithin10 * 100) {
    reasons.push(`Only ${metrics.pctWithin10}% within ±1.0 Brix (target: ${ALERT_THRESHOLDS.pctWithin10 * 100}%)`)
  }

  return {
    needsRetraining: metrics.mae > ALERT_THRESHOLDS.retrainTrigger,
    alertTriggered: reasons.length > 0,
    alertReason: reasons.length > 0 ? reasons.join('; ') : null,
  }
}

// =============================================================================
// REPORT GENERATION
// =============================================================================

/**
 * Generate an accuracy report for the given scope and period.
 */
export async function generateReport(options: ReportOptions = {}): Promise<AccuracyReport | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return null
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  const period = options.period || 'weekly'

  // Get prediction-actual pairs
  const pairs = await getPredictionActualPairs(supabase, options)

  if (pairs.length === 0) {
    return null
  }

  // Calculate metrics
  const metrics = calculateMetrics(pairs)
  const tierAccuracy = calculateTierAccuracy(pairs)

  // Get previous report for trend
  const previousMae = await getPreviousMae(supabase, options)
  const { trend, changePct } = determineTrend(metrics.mae, previousMae)

  // Check alerts
  const alerts = checkAlerts(metrics, changePct)

  // Build report
  const report: Omit<AccuracyReport, 'id' | 'createdAt'> = {
    reportDate: new Date().toISOString().split('T')[0],
    reportPeriod: period,
    cultivarId: options.cultivarId || null,
    regionId: options.regionId || null,
    predictionLayer: options.predictionLayer || null,
    sourceType: options.sourceType || 'all',
    ...metrics,
    tierAccuracy,
    maeTrend: trend,
    maeChangePct: changePct,
    ...alerts,
  }

  // Store report
  const { data, error } = await supabase
    .from('accuracy_reports')
    .insert({
      report_date: report.reportDate,
      report_period: report.reportPeriod,
      cultivar_id: report.cultivarId,
      region_id: report.regionId,
      prediction_layer: report.predictionLayer,
      source_type: report.sourceType,
      sample_count: report.sampleCount,
      prediction_count: report.predictionCount,
      actual_count: report.actualCount,
      matched_pairs: report.matchedPairs,
      mae: report.mae,
      mse: report.mse,
      rmse: report.rmse,
      mape: report.mape,
      mean_error: report.meanError,
      median_error: report.medianError,
      error_stddev: report.errorStddev,
      pct_within_05: report.pctWithin05,
      pct_within_10: report.pctWithin10,
      pct_within_15: report.pctWithin15,
      pct_within_20: report.pctWithin20,
      avg_confidence: report.avgConfidence,
      confidence_correlation: report.confidenceCorrelation,
      tier_accuracy: report.tierAccuracy,
      mae_trend: report.maeTrend,
      mae_change_pct: report.maeChangePct,
      needs_retraining: report.needsRetraining,
      alert_triggered: report.alertTriggered,
      alert_reason: report.alertReason,
    })
    .select('id, created_at')
    .single()

  if (error) {
    console.error('Failed to store accuracy report:', error)
    return null
  }

  return {
    ...report,
    id: data.id,
    createdAt: data.created_at,
  }
}

/**
 * Get prediction-actual pairs for the given scope.
 */
async function getPredictionActualPairs(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  options: ReportOptions
): Promise<PredictionActualPair[]> {
  // Build query for predictions with matching actuals
  let query = supabase
    .from('predictions')
    .select(`
      id,
      cultivar_id,
      region_id,
      predicted_brix,
      confidence,
      quality_tier,
      prediction_date,
      actuals!inner (
        actual_brix,
        measurement_date,
        source_type
      )
    `)
    .not('predicted_brix', 'is', null)

  // Apply filters
  if (options.cultivarId) {
    query = query.eq('cultivar_id', options.cultivarId)
  }
  if (options.regionId) {
    query = query.eq('region_id', options.regionId)
  }
  if (options.predictionLayer) {
    query = query.eq('prediction_layer', options.predictionLayer)
  }
  if (options.sourceType && options.sourceType !== 'all') {
    query = query.eq('actuals.source_type', options.sourceType)
  }

  // Date range
  const { startDate, endDate } = getDateRange(options.period || 'weekly', options.startDate, options.endDate)
  query = query.gte('prediction_date', startDate).lte('prediction_date', endDate)

  const { data, error } = await query

  if (error || !data) {
    return []
  }

  // Map to pairs with explicit typing for Supabase response
  interface PredictionRow {
    id: string
    cultivar_id: string
    region_id: string | null
    predicted_brix: number
    confidence: number | null
    quality_tier: string | null
    prediction_date: string
    actuals: ActualRow | ActualRow[]
  }
  interface ActualRow {
    actual_brix: number
    measurement_date: string
    source_type: string
  }

  return (data as PredictionRow[]).flatMap((pred: PredictionRow) => {
    const actuals = Array.isArray(pred.actuals) ? pred.actuals : [pred.actuals]
    return actuals.map((actual: ActualRow) => ({
      predictionId: pred.id,
      cultivarId: pred.cultivar_id,
      regionId: pred.region_id,
      predictedBrix: pred.predicted_brix,
      actualBrix: actual.actual_brix,
      confidence: pred.confidence || 0.5,
      qualityTier: pred.quality_tier,
      predictionDate: pred.prediction_date,
      measurementDate: actual.measurement_date,
    }))
  })
}

/**
 * Get MAE from previous period for trend comparison.
 */
async function getPreviousMae(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  options: ReportOptions
): Promise<number | null> {
  let query = supabase
    .from('accuracy_reports')
    .select('mae')
    .eq('report_period', options.period || 'weekly')
    .order('report_date', { ascending: false })
    .limit(1)

  if (options.cultivarId) {
    query = query.eq('cultivar_id', options.cultivarId)
  } else {
    query = query.is('cultivar_id', null)
  }

  if (options.regionId) {
    query = query.eq('region_id', options.regionId)
  } else {
    query = query.is('region_id', null)
  }

  const { data, error } = await query.single()

  if (error || !data) {
    return null
  }

  return data.mae
}

/**
 * Get historical reports.
 */
export async function getReportHistory(options: {
  period?: ReportPeriod
  cultivarId?: string
  regionId?: string
  limit?: number
}): Promise<AccuracyReport[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return []
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  let query = supabase
    .from('accuracy_reports')
    .select('*')
    .order('report_date', { ascending: false })

  if (options.period) {
    query = query.eq('report_period', options.period)
  }
  if (options.cultivarId) {
    query = query.eq('cultivar_id', options.cultivarId)
  }
  if (options.regionId) {
    query = query.eq('region_id', options.regionId)
  }
  if (options.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error || !data) {
    return []
  }

  return data.map(mapReportFromDb)
}

/**
 * Get reports with alerts.
 */
export async function getAlertedReports(limit = 10): Promise<AccuracyReport[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return []
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  const { data, error } = await supabase
    .from('accuracy_reports')
    .select('*')
    .eq('alert_triggered', true)
    .order('report_date', { ascending: false })
    .limit(limit)

  if (error || !data) {
    return []
  }

  return data.map(mapReportFromDb)
}

// =============================================================================
// HELPERS
// =============================================================================

function mean(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((a, b) => a + b, 0) / values.length
}

function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

function stddev(values: number[]): number {
  if (values.length < 2) return 0
  const avg = mean(values)
  const squaredDiffs = values.map(v => Math.pow(v - avg, 2))
  return Math.sqrt(mean(squaredDiffs))
}

function percentWithin(values: number[], threshold: number): number {
  if (values.length === 0) return 0
  const within = values.filter(v => v <= threshold).length
  return (within / values.length) * 100
}

function calculateCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length < 2) return 0

  const meanX = mean(x)
  const meanY = mean(y)
  const stdX = stddev(x)
  const stdY = stddev(y)

  if (stdX === 0 || stdY === 0) return 0

  const covariance = mean(x.map((xi, i) => (xi - meanX) * (y[i] - meanY)))
  return covariance / (stdX * stdY)
}

function round(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals)
  return Math.round(value * factor) / factor
}

function getDateRange(
  period: ReportPeriod,
  startDate?: string,
  endDate?: string
): { startDate: string; endDate: string } {
  if (startDate && endDate) {
    return { startDate, endDate }
  }

  const now = new Date()
  const end = endDate || now.toISOString().split('T')[0]

  let start: Date
  switch (period) {
    case 'daily':
      start = new Date(now)
      start.setDate(start.getDate() - 1)
      break
    case 'weekly':
      start = new Date(now)
      start.setDate(start.getDate() - 7)
      break
    case 'monthly':
      start = new Date(now)
      start.setMonth(start.getMonth() - 1)
      break
    case 'seasonal':
      start = new Date(now)
      start.setMonth(start.getMonth() - 3)
      break
    case 'all_time':
    default:
      start = new Date('2020-01-01')
  }

  return {
    startDate: startDate || start.toISOString().split('T')[0],
    endDate: end,
  }
}

function emptyMetrics(): AccuracyMetrics {
  return {
    sampleCount: 0,
    predictionCount: 0,
    actualCount: 0,
    matchedPairs: 0,
    mae: 0,
    mse: 0,
    rmse: 0,
    mape: 0,
    meanError: 0,
    medianError: 0,
    errorStddev: 0,
    pctWithin05: 0,
    pctWithin10: 0,
    pctWithin15: 0,
    pctWithin20: 0,
    avgConfidence: 0,
    confidenceCorrelation: 0,
  }
}

function mapReportFromDb(row: Record<string, unknown>): AccuracyReport {
  return {
    id: row.id as string,
    reportDate: row.report_date as string,
    reportPeriod: row.report_period as ReportPeriod,
    cultivarId: row.cultivar_id as string | null,
    regionId: row.region_id as string | null,
    predictionLayer: row.prediction_layer as PredictionLayer | null,
    sourceType: (row.source_type as SourceType) || 'all',
    sampleCount: (row.sample_count as number) || 0,
    predictionCount: (row.prediction_count as number) || 0,
    actualCount: (row.actual_count as number) || 0,
    matchedPairs: (row.matched_pairs as number) || 0,
    mae: (row.mae as number) || 0,
    mse: (row.mse as number) || 0,
    rmse: (row.rmse as number) || 0,
    mape: (row.mape as number) || 0,
    meanError: (row.mean_error as number) || 0,
    medianError: (row.median_error as number) || 0,
    errorStddev: (row.error_stddev as number) || 0,
    pctWithin05: (row.pct_within_05 as number) || 0,
    pctWithin10: (row.pct_within_10 as number) || 0,
    pctWithin15: (row.pct_within_15 as number) || 0,
    pctWithin20: (row.pct_within_20 as number) || 0,
    avgConfidence: (row.avg_confidence as number) || 0,
    confidenceCorrelation: (row.confidence_correlation as number) || 0,
    tierAccuracy: (row.tier_accuracy as TierAccuracy) || {},
    maeTrend: (row.mae_trend as TrendDirection) || 'stable',
    maeChangePct: (row.mae_change_pct as number) || 0,
    needsRetraining: (row.needs_retraining as boolean) || false,
    alertTriggered: (row.alert_triggered as boolean) || false,
    alertReason: row.alert_reason as string | null,
    createdAt: row.created_at as string,
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export const accuracyReporter = {
  // Report generation
  generateReport,
  getReportHistory,
  getAlertedReports,

  // Metric calculations
  calculateMetrics,
  calculateTierAccuracy,
  determineTrend,
  checkAlerts,

  // Configuration
  ALERT_THRESHOLDS,
  TREND_THRESHOLDS,
}
