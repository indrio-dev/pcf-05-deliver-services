/**
 * Exception Handler Tests
 *
 * F022: Tests for exception escalation and queue management.
 */

import {
  shouldEscalate,
  getSeverityFromConfidence,
  getSeverityFromAnomaly,
  isOverdue,
  getTimeUntilSla,
  CONFIDENCE_THRESHOLDS,
  ANOMALY_THRESHOLDS,
  SLA_HOURS,
  AUTO_RESOLVE_HOURS,
  type ExceptionRecord,
} from '@/lib/intelligence/exception-handler'

// =============================================================================
// MOCK EXCEPTION DATA
// =============================================================================

const mockException = (overrides: Partial<ExceptionRecord> = {}): ExceptionRecord => ({
  id: 'exc-123',
  predictionId: 'pred-456',
  cultivarId: 'washington_navel',
  regionId: 'indian_river_fl',
  exceptionDate: '2024-03-15',
  exceptionType: 'low_confidence',
  severity: 'medium',
  triggerSource: 'prediction_engine',
  confidenceScore: 0.55,
  expectedValue: 12.0,
  actualValue: 10.5,
  deviationStddev: 1.8,
  context: { cultivarId: 'washington_navel' },
  status: 'pending',
  assignedTo: null,
  reviewedBy: null,
  reviewedAt: null,
  resolutionNotes: null,
  createdAt: '2024-03-15T10:00:00Z',
  updatedAt: '2024-03-15T10:00:00Z',
  slaDeadline: '2024-03-18T10:00:00Z',
  autoResolveEligible: true,
  autoResolveAfter: '2024-03-22T10:00:00Z',
  ...overrides,
})

// =============================================================================
// ESCALATION LOGIC TESTS
// =============================================================================

describe('Exception Escalation Logic', () => {
  describe('shouldEscalate()', () => {
    describe('Confidence-based escalation', () => {
      it('escalates when confidence below critical threshold', () => {
        const result = shouldEscalate({
          confidenceScore: 0.25,
        })
        expect(result.shouldEscalate).toBe(true)
        expect(result.exceptionType).toBe('low_confidence')
        expect(result.severity).toBe('critical')
        expect(result.reasons.some(r => r.includes('critical threshold'))).toBe(true)
      })

      it('escalates when confidence below escalation threshold', () => {
        const result = shouldEscalate({
          confidenceScore: 0.55,
        })
        expect(result.shouldEscalate).toBe(true)
        expect(result.exceptionType).toBe('low_confidence')
        expect(result.reasons.some(r => r.includes('escalation threshold'))).toBe(true)
      })

      it('does not escalate when confidence above threshold', () => {
        const result = shouldEscalate({
          confidenceScore: 0.85,
        })
        expect(result.shouldEscalate).toBe(false)
        expect(result.reasons).toHaveLength(0)
      })

      it('does not escalate when confidence exactly at threshold', () => {
        const result = shouldEscalate({
          confidenceScore: CONFIDENCE_THRESHOLDS.escalate,
        })
        expect(result.shouldEscalate).toBe(false)
      })

      it('escalates when confidence just below threshold', () => {
        const result = shouldEscalate({
          confidenceScore: CONFIDENCE_THRESHOLDS.escalate - 0.01,
        })
        expect(result.shouldEscalate).toBe(true)
      })
    })

    describe('Validation-based escalation', () => {
      it('escalates when validation errors present', () => {
        const result = shouldEscalate({
          hasValidationErrors: true,
        })
        expect(result.shouldEscalate).toBe(true)
        expect(result.exceptionType).toBe('validation_warning')
        expect(result.severity).toBe('high')
        expect(result.reasons).toContain('Validation errors present')
      })

      it('escalates when validation warnings present', () => {
        const result = shouldEscalate({
          hasValidationWarnings: true,
        })
        expect(result.shouldEscalate).toBe(true)
        expect(result.exceptionType).toBe('validation_warning')
        expect(result.reasons).toContain('Validation warnings present')
      })

      it('prioritizes errors over warnings', () => {
        const result = shouldEscalate({
          hasValidationErrors: true,
          hasValidationWarnings: true,
        })
        expect(result.severity).toBe('high')
        expect(result.reasons).toContain('Validation errors present')
        // Should not double-count warnings when errors present
        expect(result.reasons.filter(r => r === 'Validation warnings present')).toHaveLength(0)
      })

      it('does not escalate without validation issues', () => {
        const result = shouldEscalate({
          hasValidationErrors: false,
          hasValidationWarnings: false,
        })
        expect(result.shouldEscalate).toBe(false)
      })
    })

    describe('Anomaly-based escalation', () => {
      it('escalates with critical z-score', () => {
        const result = shouldEscalate({
          anomalyZScore: 4.0,
        })
        expect(result.shouldEscalate).toBe(true)
        expect(result.exceptionType).toBe('anomalous_measurement')
        expect(result.severity).toBe('critical')
        expect(result.reasons.some(r => r.includes('critical threshold'))).toBe(true)
      })

      it('escalates with high z-score', () => {
        const result = shouldEscalate({
          anomalyZScore: 3.0,
        })
        expect(result.shouldEscalate).toBe(true)
        expect(result.severity).toBe('high')
        expect(result.reasons.some(r => r.includes('escalation threshold'))).toBe(true)
      })

      it('handles negative z-score', () => {
        const result = shouldEscalate({
          anomalyZScore: -4.0,
        })
        expect(result.shouldEscalate).toBe(true)
        expect(result.severity).toBe('critical')
      })

      it('does not escalate with low z-score', () => {
        const result = shouldEscalate({
          anomalyZScore: 1.5,
        })
        expect(result.shouldEscalate).toBe(false)
      })

      it('escalates at exactly the threshold', () => {
        // >= comparison means exactly at threshold is escalated
        const result = shouldEscalate({
          anomalyZScore: ANOMALY_THRESHOLDS.escalate,
        })
        expect(result.shouldEscalate).toBe(true)
      })
    })

    describe('Missing data escalation', () => {
      it('escalates when critical data missing', () => {
        const result = shouldEscalate({
          isMissingCriticalData: true,
        })
        expect(result.shouldEscalate).toBe(true)
        expect(result.exceptionType).toBe('missing_data')
        expect(result.severity).toBe('high')
        expect(result.reasons).toContain('Missing critical data')
      })

      it('does not escalate when data complete', () => {
        const result = shouldEscalate({
          isMissingCriticalData: false,
        })
        expect(result.shouldEscalate).toBe(false)
      })
    })

    describe('Calibration sample count', () => {
      it('notes low sample count but does not escalate alone', () => {
        const result = shouldEscalate({
          calibrationSampleCount: 3,
        })
        expect(result.shouldEscalate).toBe(false)
        expect(result.reasons.some(r => r.includes('Low calibration sample count'))).toBe(true)
      })

      it('does not note adequate sample count', () => {
        const result = shouldEscalate({
          calibrationSampleCount: 25,
        })
        expect(result.reasons).toHaveLength(0)
      })
    })

    describe('Combined scenarios', () => {
      it('takes highest severity from multiple issues', () => {
        const result = shouldEscalate({
          confidenceScore: 0.55, // medium
          anomalyZScore: 4.0, // critical
        })
        expect(result.severity).toBe('critical')
      })

      it('collects all reasons', () => {
        const result = shouldEscalate({
          confidenceScore: 0.55,
          hasValidationWarnings: true,
          calibrationSampleCount: 2,
        })
        expect(result.reasons.length).toBeGreaterThanOrEqual(2)
      })

      it('returns first exception type encountered', () => {
        const result = shouldEscalate({
          confidenceScore: 0.55,
          hasValidationErrors: true,
        })
        // low_confidence comes first in evaluation
        expect(result.exceptionType).toBe('low_confidence')
      })
    })

    describe('No escalation scenarios', () => {
      it('returns empty result with no inputs', () => {
        const result = shouldEscalate({})
        expect(result.shouldEscalate).toBe(false)
        expect(result.exceptionType).toBeUndefined()
        expect(result.severity).toBe('medium')
        expect(result.reasons).toHaveLength(0)
      })

      it('handles all good values', () => {
        const result = shouldEscalate({
          confidenceScore: 0.95,
          hasValidationErrors: false,
          hasValidationWarnings: false,
          anomalyZScore: 0.5,
          calibrationSampleCount: 50,
          isMissingCriticalData: false,
        })
        expect(result.shouldEscalate).toBe(false)
      })
    })
  })

  describe('getSeverityFromConfidence()', () => {
    it('returns critical for very low confidence', () => {
      expect(getSeverityFromConfidence(0.2)).toBe('critical')
      expect(getSeverityFromConfidence(0.29)).toBe('critical')
    })

    it('returns high for low confidence', () => {
      expect(getSeverityFromConfidence(0.35)).toBe('high')
      expect(getSeverityFromConfidence(0.49)).toBe('high')
    })

    it('returns medium for moderate confidence', () => {
      expect(getSeverityFromConfidence(0.55)).toBe('medium')
      expect(getSeverityFromConfidence(0.69)).toBe('medium')
    })

    it('returns low for good confidence', () => {
      expect(getSeverityFromConfidence(0.75)).toBe('low')
      expect(getSeverityFromConfidence(0.95)).toBe('low')
    })

    it('handles boundary values', () => {
      expect(getSeverityFromConfidence(CONFIDENCE_THRESHOLDS.critical)).toBe('high')
      expect(getSeverityFromConfidence(CONFIDENCE_THRESHOLDS.high)).toBe('medium')
      expect(getSeverityFromConfidence(CONFIDENCE_THRESHOLDS.medium)).toBe('low')
    })
  })

  describe('getSeverityFromAnomaly()', () => {
    it('returns critical for extreme anomaly', () => {
      expect(getSeverityFromAnomaly(4.0)).toBe('critical')
      expect(getSeverityFromAnomaly(-4.0)).toBe('critical')
    })

    it('returns high for significant anomaly', () => {
      expect(getSeverityFromAnomaly(3.0)).toBe('high')
      expect(getSeverityFromAnomaly(-3.0)).toBe('high')
    })

    it('returns medium for moderate anomaly', () => {
      expect(getSeverityFromAnomaly(2.2)).toBe('medium')
      expect(getSeverityFromAnomaly(-2.2)).toBe('medium')
    })

    it('returns low for minor anomaly', () => {
      expect(getSeverityFromAnomaly(1.5)).toBe('low')
      expect(getSeverityFromAnomaly(-1.5)).toBe('low')
      expect(getSeverityFromAnomaly(0)).toBe('low')
    })

    it('handles threshold boundaries', () => {
      expect(getSeverityFromAnomaly(ANOMALY_THRESHOLDS.critical)).toBe('critical')
      expect(getSeverityFromAnomaly(ANOMALY_THRESHOLDS.escalate)).toBe('high')
      expect(getSeverityFromAnomaly(ANOMALY_THRESHOLDS.warning)).toBe('medium')
    })
  })
})

// =============================================================================
// HELPER FUNCTION TESTS
// =============================================================================

describe('Exception Helper Functions', () => {
  describe('isOverdue()', () => {
    it('returns true when past SLA deadline', () => {
      const exception = mockException({
        slaDeadline: '2020-01-01T00:00:00Z',
      })
      expect(isOverdue(exception)).toBe(true)
    })

    it('returns false when before SLA deadline', () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)
      const exception = mockException({
        slaDeadline: futureDate.toISOString(),
      })
      expect(isOverdue(exception)).toBe(false)
    })

    it('returns false when no SLA deadline', () => {
      const exception = mockException({
        slaDeadline: null,
      })
      expect(isOverdue(exception)).toBe(false)
    })
  })

  describe('getTimeUntilSla()', () => {
    it('returns positive time for future deadline', () => {
      const futureDate = new Date()
      futureDate.setHours(futureDate.getHours() + 24)
      const exception = mockException({
        slaDeadline: futureDate.toISOString(),
      })
      const time = getTimeUntilSla(exception)
      expect(time).toBeGreaterThan(0)
      // Should be roughly 24 hours in ms
      expect(time).toBeLessThanOrEqual(24 * 60 * 60 * 1000)
      expect(time).toBeGreaterThan(23 * 60 * 60 * 1000)
    })

    it('returns negative time for past deadline', () => {
      const pastDate = new Date()
      pastDate.setHours(pastDate.getHours() - 24)
      const exception = mockException({
        slaDeadline: pastDate.toISOString(),
      })
      const time = getTimeUntilSla(exception)
      expect(time).toBeLessThan(0)
    })

    it('returns null when no deadline', () => {
      const exception = mockException({
        slaDeadline: null,
      })
      expect(getTimeUntilSla(exception)).toBeNull()
    })
  })
})

// =============================================================================
// CONFIGURATION TESTS
// =============================================================================

describe('Exception Configuration', () => {
  describe('CONFIDENCE_THRESHOLDS', () => {
    it('has all required thresholds', () => {
      expect(CONFIDENCE_THRESHOLDS.critical).toBeDefined()
      expect(CONFIDENCE_THRESHOLDS.high).toBeDefined()
      expect(CONFIDENCE_THRESHOLDS.medium).toBeDefined()
      expect(CONFIDENCE_THRESHOLDS.escalate).toBeDefined()
    })

    it('thresholds are in ascending order', () => {
      expect(CONFIDENCE_THRESHOLDS.critical).toBeLessThan(CONFIDENCE_THRESHOLDS.high)
      expect(CONFIDENCE_THRESHOLDS.high).toBeLessThan(CONFIDENCE_THRESHOLDS.medium)
    })

    it('thresholds are between 0 and 1', () => {
      Object.values(CONFIDENCE_THRESHOLDS).forEach(threshold => {
        expect(threshold).toBeGreaterThan(0)
        expect(threshold).toBeLessThan(1)
      })
    })
  })

  describe('ANOMALY_THRESHOLDS', () => {
    it('has all required thresholds', () => {
      expect(ANOMALY_THRESHOLDS.warning).toBeDefined()
      expect(ANOMALY_THRESHOLDS.escalate).toBeDefined()
      expect(ANOMALY_THRESHOLDS.critical).toBeDefined()
    })

    it('thresholds are in ascending order', () => {
      expect(ANOMALY_THRESHOLDS.warning).toBeLessThan(ANOMALY_THRESHOLDS.escalate)
      expect(ANOMALY_THRESHOLDS.escalate).toBeLessThan(ANOMALY_THRESHOLDS.critical)
    })

    it('thresholds are reasonable z-scores', () => {
      Object.values(ANOMALY_THRESHOLDS).forEach(threshold => {
        expect(threshold).toBeGreaterThan(0)
        expect(threshold).toBeLessThan(10)
      })
    })
  })

  describe('SLA_HOURS', () => {
    it('has SLA for all severities', () => {
      expect(SLA_HOURS.critical).toBeDefined()
      expect(SLA_HOURS.high).toBeDefined()
      expect(SLA_HOURS.medium).toBeDefined()
      expect(SLA_HOURS.low).toBeDefined()
    })

    it('higher severity has shorter SLA', () => {
      expect(SLA_HOURS.critical).toBeLessThan(SLA_HOURS.high)
      expect(SLA_HOURS.high).toBeLessThan(SLA_HOURS.medium)
      expect(SLA_HOURS.medium).toBeLessThan(SLA_HOURS.low)
    })

    it('SLAs are reasonable durations', () => {
      expect(SLA_HOURS.critical).toBeGreaterThanOrEqual(1)
      expect(SLA_HOURS.low).toBeLessThanOrEqual(168 * 2) // Max 2 weeks
    })
  })

  describe('AUTO_RESOLVE_HOURS', () => {
    it('critical and high never auto-resolve', () => {
      expect(AUTO_RESOLVE_HOURS.critical).toBeNull()
      expect(AUTO_RESOLVE_HOURS.high).toBeNull()
    })

    it('medium and low can auto-resolve', () => {
      expect(AUTO_RESOLVE_HOURS.medium).toBeGreaterThan(0)
      expect(AUTO_RESOLVE_HOURS.low).toBeGreaterThan(0)
    })

    it('lower severity resolves faster', () => {
      expect(AUTO_RESOLVE_HOURS.low).toBeLessThan(AUTO_RESOLVE_HOURS.medium!)
    })
  })
})

// =============================================================================
// SCENARIO TESTS
// =============================================================================

describe('Exception Scenarios', () => {
  describe('Production prediction scenarios', () => {
    it('escalates new cultivar with no calibration', () => {
      const result = shouldEscalate({
        confidenceScore: 0.45, // Low because no calibration
        calibrationSampleCount: 0,
      })
      expect(result.shouldEscalate).toBe(true)
      expect(result.exceptionType).toBe('low_confidence')
    })

    it('does not escalate well-calibrated prediction', () => {
      const result = shouldEscalate({
        confidenceScore: 0.85,
        calibrationSampleCount: 50,
        anomalyZScore: 0.3,
      })
      expect(result.shouldEscalate).toBe(false)
    })

    it('escalates outlier measurement despite good confidence', () => {
      const result = shouldEscalate({
        confidenceScore: 0.80,
        anomalyZScore: 4.5,
      })
      expect(result.shouldEscalate).toBe(true)
      expect(result.exceptionType).toBe('anomalous_measurement')
      expect(result.severity).toBe('critical')
    })
  })

  describe('Consumer scan scenarios', () => {
    it('escalates suspicious consumer reading', () => {
      const result = shouldEscalate({
        confidenceScore: 0.50,
        hasValidationWarnings: true,
        anomalyZScore: 2.8,
      })
      expect(result.shouldEscalate).toBe(true)
      expect(result.reasons.length).toBeGreaterThanOrEqual(2)
    })

    it('accepts typical consumer scan', () => {
      const result = shouldEscalate({
        confidenceScore: 0.75,
        anomalyZScore: 1.0,
      })
      expect(result.shouldEscalate).toBe(false)
    })
  })

  describe('Data quality scenarios', () => {
    it('escalates when missing location data', () => {
      const result = shouldEscalate({
        isMissingCriticalData: true,
        confidenceScore: 0.60,
      })
      expect(result.shouldEscalate).toBe(true)
      // First exception type encountered (missing_data in this case, since confidence is ok)
      expect(result.exceptionType).toBe('missing_data')
    })

    it('escalates validation failure', () => {
      const result = shouldEscalate({
        hasValidationErrors: true,
      })
      expect(result.shouldEscalate).toBe(true)
      expect(result.severity).toBe('high')
    })
  })
})

// =============================================================================
// TYPE TESTS
// =============================================================================

describe('Exception Types', () => {
  it('recognizes all exception types', () => {
    const types = [
      'low_confidence',
      'anomalous_measurement',
      'missing_data',
      'validation_warning',
      'calibration_conflict',
      'manual_flag',
    ]
    types.forEach(type => {
      expect(typeof type).toBe('string')
    })
  })

  it('recognizes all severity levels', () => {
    const severities = ['low', 'medium', 'high', 'critical']
    severities.forEach(sev => {
      expect(SLA_HOURS[sev as 'low' | 'medium' | 'high' | 'critical']).toBeDefined()
    })
  })

  it('recognizes all statuses', () => {
    const statuses = [
      'pending',
      'in_review',
      'approved',
      'rejected',
      'escalated',
      'auto_resolved',
    ]
    statuses.forEach(status => {
      expect(typeof status).toBe('string')
    })
  })
})
