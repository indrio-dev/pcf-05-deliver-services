/**
 * =============================================================================
 * EXCEPTION HANDLER
 * =============================================================================
 *
 * F022: Manages exceptions for predictions that need human review.
 *
 * The exception handler identifies predictions that require attention:
 * - Low confidence scores below threshold
 * - Anomalous measurements (>3 stddev from mean)
 * - Missing critical data
 * - Validation warnings that couldn't be auto-resolved
 * - Calibration conflicts
 *
 * Exceptions are queued for human review with SLA tracking.
 */

import { createClient } from '@supabase/supabase-js'

// =============================================================================
// TYPES
// =============================================================================

export type ExceptionType =
  | 'low_confidence'
  | 'anomalous_measurement'
  | 'missing_data'
  | 'validation_warning'
  | 'calibration_conflict'
  | 'manual_flag'

export type ExceptionSeverity = 'low' | 'medium' | 'high' | 'critical'

export type ExceptionStatus =
  | 'pending'
  | 'in_review'
  | 'approved'
  | 'rejected'
  | 'escalated'
  | 'auto_resolved'

export type TriggerSource =
  | 'prediction_engine'
  | 'validation_engine'
  | 'calibration_engine'
  | 'scan_api'
  | 'manual'

export interface ExceptionContext {
  predictionId?: string
  cultivarId: string
  regionId?: string
  brixPredicted?: number
  brixActual?: number
  confidenceScore?: number
  calibrationOffset?: number
  validationErrors?: string[]
  validationWarnings?: string[]
  anomalyZScore?: number
  triggerReason?: string
  [key: string]: unknown
}

export interface ExceptionRecord {
  id: string
  predictionId: string | null
  cultivarId: string
  regionId: string | null
  exceptionDate: string
  exceptionType: ExceptionType
  severity: ExceptionSeverity
  triggerSource: TriggerSource
  confidenceScore: number | null
  expectedValue: number | null
  actualValue: number | null
  deviationStddev: number | null
  context: ExceptionContext
  status: ExceptionStatus
  assignedTo: string | null
  reviewedBy: string | null
  reviewedAt: string | null
  resolutionNotes: string | null
  createdAt: string
  updatedAt: string
  slaDeadline: string | null
  autoResolveEligible: boolean
  autoResolveAfter: string | null
}

export interface EscalationResult {
  shouldEscalate: boolean
  exceptionType?: ExceptionType
  severity?: ExceptionSeverity
  reasons: string[]
}

export interface ExceptionInput {
  predictionId?: string
  cultivarId: string
  regionId?: string
  exceptionType: ExceptionType
  triggerSource: TriggerSource
  severity?: ExceptionSeverity
  confidenceScore?: number
  expectedValue?: number
  actualValue?: number
  deviationStddev?: number
  context?: ExceptionContext
  autoResolveEligible?: boolean
  slaHours?: number
}

export interface QueueStats {
  pending: number
  inReview: number
  bySeverity: Record<ExceptionSeverity, number>
  byType: Record<ExceptionType, number>
  avgResolutionHours: number
  overdueCount: number
}

// =============================================================================
// CONFIGURATION
// =============================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Escalation thresholds
export const CONFIDENCE_THRESHOLDS = {
  critical: 0.3, // Below this = critical severity
  high: 0.5, // Below this = high severity
  medium: 0.7, // Below this = medium severity
  escalate: 0.6, // Below this = should escalate for review
} as const

export const ANOMALY_THRESHOLDS = {
  warning: 2.0, // Z-score for warning level
  escalate: 2.5, // Z-score for escalation
  critical: 3.5, // Z-score for critical level
} as const

// SLA times in hours by severity
export const SLA_HOURS: Record<ExceptionSeverity, number> = {
  critical: 4,
  high: 24,
  medium: 72,
  low: 168, // 1 week
}

// Auto-resolve after hours (for non-critical)
export const AUTO_RESOLVE_HOURS: Record<ExceptionSeverity, number | null> = {
  critical: null, // Never auto-resolve
  high: null, // Never auto-resolve
  medium: 168, // 1 week
  low: 72, // 3 days
}

// =============================================================================
// ESCALATION LOGIC
// =============================================================================

/**
 * Determine if a prediction result should be escalated for human review.
 */
export function shouldEscalate(params: {
  confidenceScore?: number
  hasValidationErrors?: boolean
  hasValidationWarnings?: boolean
  anomalyZScore?: number
  calibrationSampleCount?: number
  isMissingCriticalData?: boolean
}): EscalationResult {
  const {
    confidenceScore,
    hasValidationErrors = false,
    hasValidationWarnings = false,
    anomalyZScore,
    calibrationSampleCount,
    isMissingCriticalData = false,
  } = params

  const reasons: string[] = []
  let shouldEscalate = false
  let exceptionType: ExceptionType | undefined
  let severity: ExceptionSeverity = 'medium'

  // Check confidence score
  if (confidenceScore !== undefined) {
    if (confidenceScore < CONFIDENCE_THRESHOLDS.critical) {
      shouldEscalate = true
      exceptionType = 'low_confidence'
      severity = 'critical'
      reasons.push(`Confidence ${confidenceScore.toFixed(2)} below critical threshold ${CONFIDENCE_THRESHOLDS.critical}`)
    } else if (confidenceScore < CONFIDENCE_THRESHOLDS.escalate) {
      shouldEscalate = true
      exceptionType = 'low_confidence'
      severity = confidenceScore < CONFIDENCE_THRESHOLDS.high ? 'high' : 'medium'
      reasons.push(`Confidence ${confidenceScore.toFixed(2)} below escalation threshold ${CONFIDENCE_THRESHOLDS.escalate}`)
    }
  }

  // Check validation errors
  if (hasValidationErrors) {
    shouldEscalate = true
    exceptionType = exceptionType || 'validation_warning'
    severity = severity === 'critical' ? 'critical' : 'high'
    reasons.push('Validation errors present')
  }

  // Check validation warnings (only if no errors)
  if (hasValidationWarnings && !hasValidationErrors) {
    if (severity !== 'critical' && severity !== 'high') {
      shouldEscalate = true
      exceptionType = exceptionType || 'validation_warning'
      reasons.push('Validation warnings present')
    }
  }

  // Check anomaly score
  if (anomalyZScore !== undefined) {
    if (Math.abs(anomalyZScore) >= ANOMALY_THRESHOLDS.critical) {
      shouldEscalate = true
      exceptionType = 'anomalous_measurement'
      severity = 'critical'
      reasons.push(`Anomaly z-score ${anomalyZScore.toFixed(2)} exceeds critical threshold ${ANOMALY_THRESHOLDS.critical}`)
    } else if (Math.abs(anomalyZScore) >= ANOMALY_THRESHOLDS.escalate) {
      shouldEscalate = true
      exceptionType = exceptionType || 'anomalous_measurement'
      if (severity !== 'critical') {
        severity = 'high'
      }
      reasons.push(`Anomaly z-score ${anomalyZScore.toFixed(2)} exceeds escalation threshold ${ANOMALY_THRESHOLDS.escalate}`)
    }
  }

  // Check calibration sample count (low samples = less reliable)
  if (calibrationSampleCount !== undefined && calibrationSampleCount < 5) {
    if (!shouldEscalate) {
      reasons.push(`Low calibration sample count (${calibrationSampleCount})`)
    }
    // Don't escalate just for low samples, but note it
  }

  // Check missing critical data
  if (isMissingCriticalData) {
    shouldEscalate = true
    exceptionType = 'missing_data'
    if (severity !== 'critical') {
      severity = 'high'
    }
    reasons.push('Missing critical data')
  }

  return {
    shouldEscalate,
    exceptionType,
    severity,
    reasons,
  }
}

/**
 * Determine severity from confidence score alone.
 */
export function getSeverityFromConfidence(confidence: number): ExceptionSeverity {
  if (confidence < CONFIDENCE_THRESHOLDS.critical) return 'critical'
  if (confidence < CONFIDENCE_THRESHOLDS.high) return 'high'
  if (confidence < CONFIDENCE_THRESHOLDS.medium) return 'medium'
  return 'low'
}

/**
 * Determine severity from anomaly z-score.
 */
export function getSeverityFromAnomaly(zScore: number): ExceptionSeverity {
  const absZ = Math.abs(zScore)
  if (absZ >= ANOMALY_THRESHOLDS.critical) return 'critical'
  if (absZ >= ANOMALY_THRESHOLDS.escalate) return 'high'
  if (absZ >= ANOMALY_THRESHOLDS.warning) return 'medium'
  return 'low'
}

// =============================================================================
// QUEUE OPERATIONS
// =============================================================================

/**
 * Add a prediction to the review queue.
 */
export async function addToReviewQueue(input: ExceptionInput): Promise<{
  success: boolean
  exceptionId?: string
  error?: string
}> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return { success: false, error: 'Supabase not configured' }
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  const severity = input.severity || 'medium'
  const slaHours = input.slaHours || SLA_HOURS[severity]
  const autoResolveHours = AUTO_RESOLVE_HOURS[severity]

  const slaDeadline = new Date()
  slaDeadline.setHours(slaDeadline.getHours() + slaHours)

  let autoResolveAfter: Date | null = null
  if (input.autoResolveEligible !== false && autoResolveHours) {
    autoResolveAfter = new Date()
    autoResolveAfter.setHours(autoResolveAfter.getHours() + autoResolveHours)
  }

  const { data, error } = await supabase
    .from('exceptions')
    .insert({
      prediction_id: input.predictionId,
      cultivar_id: input.cultivarId,
      region_id: input.regionId,
      exception_type: input.exceptionType,
      trigger_source: input.triggerSource,
      severity,
      confidence_score: input.confidenceScore,
      expected_value: input.expectedValue,
      actual_value: input.actualValue,
      deviation_stddev: input.deviationStddev,
      context: input.context || {},
      sla_deadline: slaDeadline.toISOString(),
      auto_resolve_eligible: input.autoResolveEligible !== false && autoResolveHours !== null,
      auto_resolve_after: autoResolveAfter?.toISOString() || null,
    })
    .select('id')
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, exceptionId: data.id }
}

/**
 * Get pending exceptions from the queue.
 */
export async function getPendingExceptions(options?: {
  limit?: number
  severity?: ExceptionSeverity
  status?: ExceptionStatus
  exceptionType?: ExceptionType
  cultivarId?: string
}): Promise<ExceptionRecord[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return []
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  let query = supabase
    .from('exceptions')
    .select('*')
    .order('severity', { ascending: true }) // critical first
    .order('created_at', { ascending: true })

  // Status filter - default to active statuses if not specified
  if (options?.status) {
    query = query.eq('status', options.status)
  } else {
    query = query.in('status', ['pending', 'in_review'])
  }

  if (options?.severity) {
    query = query.eq('severity', options.severity)
  }
  if (options?.exceptionType) {
    query = query.eq('exception_type', options.exceptionType)
  }
  if (options?.cultivarId) {
    query = query.eq('cultivar_id', options.cultivarId)
  }
  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error || !data) {
    return []
  }

  return data.map(mapExceptionFromDb)
}

/**
 * Update exception status.
 */
export async function updateExceptionStatus(
  exceptionId: string,
  status: ExceptionStatus,
  options?: {
    reviewedBy?: string
    resolutionNotes?: string
  }
): Promise<boolean> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return false
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  const updates: Record<string, unknown> = { status }

  if (['approved', 'rejected', 'escalated'].includes(status)) {
    updates.reviewed_at = new Date().toISOString()
    if (options?.reviewedBy) {
      updates.reviewed_by = options.reviewedBy
    }
  }

  if (options?.resolutionNotes) {
    updates.resolution_notes = options.resolutionNotes
  }

  const { error } = await supabase
    .from('exceptions')
    .update(updates)
    .eq('id', exceptionId)

  return !error
}

/**
 * Assign exception to a reviewer.
 */
export async function assignException(
  exceptionId: string,
  assignedTo: string
): Promise<boolean> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return false
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  const { error } = await supabase
    .from('exceptions')
    .update({
      assigned_to: assignedTo,
      status: 'in_review',
    })
    .eq('id', exceptionId)

  return !error
}

/**
 * Auto-resolve eligible exceptions past their deadline.
 */
export async function autoResolveExpired(): Promise<number> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return 0
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  const { data, error } = await supabase
    .from('exceptions')
    .update({
      status: 'auto_resolved',
      resolution_notes: 'Auto-resolved after deadline passed',
    })
    .eq('status', 'pending')
    .eq('auto_resolve_eligible', true)
    .lt('auto_resolve_after', new Date().toISOString())
    .select('id')

  if (error || !data) {
    return 0
  }

  return data.length
}

// =============================================================================
// STATISTICS
// =============================================================================

/**
 * Get queue statistics.
 */
export async function getQueueStats(): Promise<QueueStats | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return null
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  // Get all non-resolved exceptions
  const { data: exceptions, error } = await supabase
    .from('exceptions')
    .select('status, severity, exception_type, created_at, reviewed_at, sla_deadline')

  if (error || !exceptions) {
    return null
  }

  const pending = exceptions.filter(e => e.status === 'pending').length
  const inReview = exceptions.filter(e => e.status === 'in_review').length

  // Count by severity for pending/in_review
  const activeSeverities = exceptions.filter(e => ['pending', 'in_review'].includes(e.status))
  const bySeverity: Record<ExceptionSeverity, number> = {
    critical: activeSeverities.filter(e => e.severity === 'critical').length,
    high: activeSeverities.filter(e => e.severity === 'high').length,
    medium: activeSeverities.filter(e => e.severity === 'medium').length,
    low: activeSeverities.filter(e => e.severity === 'low').length,
  }

  // Count by type for pending/in_review
  const byType: Record<ExceptionType, number> = {
    low_confidence: activeSeverities.filter(e => e.exception_type === 'low_confidence').length,
    anomalous_measurement: activeSeverities.filter(e => e.exception_type === 'anomalous_measurement').length,
    missing_data: activeSeverities.filter(e => e.exception_type === 'missing_data').length,
    validation_warning: activeSeverities.filter(e => e.exception_type === 'validation_warning').length,
    calibration_conflict: activeSeverities.filter(e => e.exception_type === 'calibration_conflict').length,
    manual_flag: activeSeverities.filter(e => e.exception_type === 'manual_flag').length,
  }

  // Calculate average resolution time for resolved exceptions
  const resolved = exceptions.filter(e => e.reviewed_at && ['approved', 'rejected', 'escalated'].includes(e.status))
  let avgResolutionHours = 0
  if (resolved.length > 0) {
    const totalHours = resolved.reduce((sum, e) => {
      const created = new Date(e.created_at).getTime()
      const reviewed = new Date(e.reviewed_at).getTime()
      return sum + (reviewed - created) / (1000 * 60 * 60)
    }, 0)
    avgResolutionHours = Math.round(totalHours / resolved.length * 10) / 10
  }

  // Count overdue
  const now = new Date()
  const overdueCount = activeSeverities.filter(e =>
    e.sla_deadline && new Date(e.sla_deadline) < now
  ).length

  return {
    pending,
    inReview,
    bySeverity,
    byType,
    avgResolutionHours,
    overdueCount,
  }
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Map database row to TypeScript interface.
 */
function mapExceptionFromDb(row: Record<string, unknown>): ExceptionRecord {
  return {
    id: row.id as string,
    predictionId: row.prediction_id as string | null,
    cultivarId: row.cultivar_id as string,
    regionId: row.region_id as string | null,
    exceptionDate: row.exception_date as string,
    exceptionType: row.exception_type as ExceptionType,
    severity: row.severity as ExceptionSeverity,
    triggerSource: row.trigger_source as TriggerSource,
    confidenceScore: row.confidence_score as number | null,
    expectedValue: row.expected_value as number | null,
    actualValue: row.actual_value as number | null,
    deviationStddev: row.deviation_stddev as number | null,
    context: (row.context as ExceptionContext) || {},
    status: row.status as ExceptionStatus,
    assignedTo: row.assigned_to as string | null,
    reviewedBy: row.reviewed_by as string | null,
    reviewedAt: row.reviewed_at as string | null,
    resolutionNotes: row.resolution_notes as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    slaDeadline: row.sla_deadline as string | null,
    autoResolveEligible: (row.auto_resolve_eligible as boolean) ?? true,
    autoResolveAfter: row.auto_resolve_after as string | null,
  }
}

/**
 * Check if an exception is overdue.
 */
export function isOverdue(exception: ExceptionRecord): boolean {
  if (!exception.slaDeadline) return false
  return new Date(exception.slaDeadline) < new Date()
}

/**
 * Get time remaining until SLA deadline.
 */
export function getTimeUntilSla(exception: ExceptionRecord): number | null {
  if (!exception.slaDeadline) return null
  return new Date(exception.slaDeadline).getTime() - Date.now()
}

// =============================================================================
// UI-FOCUSED API
// =============================================================================

/**
 * Get exception stats for admin UI.
 */
export async function getExceptionStats(): Promise<{
  pending: number
  inReview: number
  overdue: number
  resolvedToday: number
  avgResolutionHours: number
}> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return {
      pending: 0,
      inReview: 0,
      overdue: 0,
      resolvedToday: 0,
      avgResolutionHours: 0,
    }
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  const { data: exceptions, error } = await supabase
    .from('exceptions')
    .select('status, created_at, reviewed_at, sla_deadline')

  if (error || !exceptions) {
    return {
      pending: 0,
      inReview: 0,
      overdue: 0,
      resolvedToday: 0,
      avgResolutionHours: 0,
    }
  }

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const pending = exceptions.filter(e => e.status === 'pending').length
  const inReview = exceptions.filter(e => e.status === 'in_review').length

  const active = exceptions.filter(e => ['pending', 'in_review'].includes(e.status))
  const overdue = active.filter(e =>
    e.sla_deadline && new Date(e.sla_deadline) < now
  ).length

  const resolvedToday = exceptions.filter(e =>
    ['approved', 'rejected', 'escalated', 'auto_resolved'].includes(e.status) &&
    e.reviewed_at && new Date(e.reviewed_at) >= todayStart
  ).length

  const resolved = exceptions.filter(e =>
    e.reviewed_at && ['approved', 'rejected', 'escalated'].includes(e.status)
  )
  let avgResolutionHours = 0
  if (resolved.length > 0) {
    const totalHours = resolved.reduce((sum, e) => {
      const created = new Date(e.created_at).getTime()
      const reviewed = new Date(e.reviewed_at).getTime()
      return sum + (reviewed - created) / (1000 * 60 * 60)
    }, 0)
    avgResolutionHours = Math.round(totalHours / resolved.length * 10) / 10
  }

  return {
    pending,
    inReview,
    overdue,
    resolvedToday,
    avgResolutionHours,
  }
}

/**
 * Resolve an exception (approve/reject/escalate).
 */
export async function resolveException(
  exceptionId: string,
  status: 'approved' | 'rejected' | 'escalated',
  reviewedBy: string,
  resolutionNotes?: string
): Promise<{ success: boolean; error?: string; exception?: ExceptionRecord }> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return { success: false, error: 'Database not configured' }
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  const { data, error } = await supabase
    .from('exceptions')
    .update({
      status,
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
      resolution_notes: resolutionNotes || null,
    })
    .eq('id', exceptionId)
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  return {
    success: true,
    exception: mapExceptionFromDb(data),
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export const exceptionHandler = {
  // Escalation logic
  shouldEscalate,
  getSeverityFromConfidence,
  getSeverityFromAnomaly,

  // Queue operations
  addToReviewQueue,
  getPendingExceptions,
  updateExceptionStatus,
  assignException,
  autoResolveExpired,

  // Statistics
  getQueueStats,

  // Helpers
  isOverdue,
  getTimeUntilSla,

  // Thresholds
  CONFIDENCE_THRESHOLDS,
  ANOMALY_THRESHOLDS,
  SLA_HOURS,
  AUTO_RESOLVE_HOURS,
}
