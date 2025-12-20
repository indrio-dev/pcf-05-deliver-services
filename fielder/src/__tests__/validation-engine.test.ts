/**
 * Validation Engine Tests
 *
 * F015: Tests for physical constraint enforcement, data quality validation,
 * and anomaly detection.
 */

import {
  enforcePhysicalBrix,
  enforcePhysicalOmega,
  enforcePhysicalGDD,
  enforcePhysicalTreeAge,
  enforcePhysicalConstraints,
  validateMeasurement,
  assessDataQuality,
  calculateZScore,
  isAnomalousMeasurement,
  detectBrixAnomaly,
  detectOmegaAnomaly,
  clampToPhysical,
  isTypicalValue,
  getDeviationSeverity,
  PHYSICAL_CONSTRAINTS,
  TYPICAL_RANGES,
} from '@/lib/intelligence/validation-engine'

// =============================================================================
// PHYSICAL CONSTRAINT TESTS
// =============================================================================

describe('Physical Constraint Enforcement', () => {
  describe('enforcePhysicalBrix()', () => {
    // Valid values
    describe('Valid Brix values', () => {
      it('accepts Brix within physical range', () => {
        const result = enforcePhysicalBrix(10)
        expect(result.isValid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })

      it('accepts minimum Brix (0)', () => {
        const result = enforcePhysicalBrix(0)
        expect(result.isValid).toBe(true)
      })

      it('accepts maximum Brix (30)', () => {
        const result = enforcePhysicalBrix(30)
        expect(result.isValid).toBe(true)
      })

      it('accepts decimal Brix values', () => {
        const result = enforcePhysicalBrix(12.5)
        expect(result.isValid).toBe(true)
      })
    })

    // Invalid values
    describe('Invalid Brix values', () => {
      it('rejects negative Brix', () => {
        const result = enforcePhysicalBrix(-5)
        expect(result.isValid).toBe(false)
        expect(result.errors[0].code).toBe('OUT_OF_PHYSICAL_RANGE')
      })

      it('rejects Brix above 30', () => {
        const result = enforcePhysicalBrix(35)
        expect(result.isValid).toBe(false)
        expect(result.errors[0].code).toBe('OUT_OF_PHYSICAL_RANGE')
      })

      it('provides corrected value when out of range', () => {
        const result = enforcePhysicalBrix(35)
        expect(result.correctedValue).toBe(30)
      })

      it('rejects undefined', () => {
        const result = enforcePhysicalBrix(undefined)
        expect(result.isValid).toBe(false)
        expect(result.errors[0].code).toBe('MISSING_REQUIRED_FIELD')
      })

      it('rejects null', () => {
        const result = enforcePhysicalBrix(null)
        expect(result.isValid).toBe(false)
      })

      it('rejects NaN', () => {
        const result = enforcePhysicalBrix(NaN)
        expect(result.isValid).toBe(false)
        expect(result.errors[0].code).toBe('INVALID_FORMAT')
      })
    })

    // Warnings for atypical values
    describe('Atypical value warnings', () => {
      it('warns for Brix below typical range', () => {
        const result = enforcePhysicalBrix(2)
        expect(result.isValid).toBe(true)
        expect(result.warnings).toHaveLength(1)
        expect(result.warnings[0].code).toBe('OUTSIDE_TYPICAL_RANGE')
      })

      it('warns for Brix above typical range', () => {
        const result = enforcePhysicalBrix(25)
        expect(result.isValid).toBe(true)
        expect(result.warnings).toHaveLength(1)
      })

      it('no warning for typical values', () => {
        const result = enforcePhysicalBrix(12)
        expect(result.warnings).toHaveLength(0)
      })
    })
  })

  describe('enforcePhysicalOmega()', () => {
    it('accepts valid omega ratio', () => {
      const result = enforcePhysicalOmega(15)
      expect(result.isValid).toBe(true)
    })

    it('accepts undefined (optional field)', () => {
      const result = enforcePhysicalOmega(undefined)
      expect(result.isValid).toBe(true)
    })

    it('accepts null (optional field)', () => {
      const result = enforcePhysicalOmega(null)
      expect(result.isValid).toBe(true)
    })

    it('rejects impossibly low omega ratio', () => {
      const result = enforcePhysicalOmega(0.3)
      expect(result.isValid).toBe(false)
      expect(result.errors[0].code).toBe('IMPOSSIBLE_VALUE')
    })

    it('warns for extremely high omega ratio', () => {
      const result = enforcePhysicalOmega(55)
      expect(result.isValid).toBe(true) // Still valid but suspicious
      expect(result.warnings).toHaveLength(1)
      expect(result.warnings[0].code).toBe('POSSIBLE_MEASUREMENT_ERROR')
    })

    it('provides corrected value for extreme high', () => {
      const result = enforcePhysicalOmega(55)
      expect(result.correctedValue).toBe(50)
    })

    it('warns for exceptionally good omega ratio', () => {
      const result = enforcePhysicalOmega(2)
      expect(result.isValid).toBe(true)
      expect(result.warnings.some(w => w.message.includes('exceptional'))).toBe(true)
    })

    it('rejects NaN', () => {
      const result = enforcePhysicalOmega(NaN)
      expect(result.isValid).toBe(false)
    })
  })

  describe('enforcePhysicalGDD()', () => {
    it('accepts valid GDD', () => {
      const result = enforcePhysicalGDD(2500)
      expect(result.isValid).toBe(true)
    })

    it('accepts zero GDD', () => {
      const result = enforcePhysicalGDD(0)
      expect(result.isValid).toBe(true)
    })

    it('accepts undefined (optional)', () => {
      const result = enforcePhysicalGDD(undefined)
      expect(result.isValid).toBe(true)
    })

    it('rejects negative GDD', () => {
      const result = enforcePhysicalGDD(-100)
      expect(result.isValid).toBe(false)
      expect(result.errors[0].code).toBe('IMPOSSIBLE_VALUE')
      expect(result.correctedValue).toBe(0)
    })

    it('warns for unusually high GDD', () => {
      const result = enforcePhysicalGDD(12000)
      expect(result.isValid).toBe(true)
      expect(result.warnings).toHaveLength(1)
    })
  })

  describe('enforcePhysicalTreeAge()', () => {
    it('accepts valid tree age', () => {
      const result = enforcePhysicalTreeAge(15)
      expect(result.isValid).toBe(true)
    })

    it('accepts undefined (optional)', () => {
      const result = enforcePhysicalTreeAge(undefined)
      expect(result.isValid).toBe(true)
    })

    it('rejects negative age', () => {
      const result = enforcePhysicalTreeAge(-5)
      expect(result.isValid).toBe(false)
      expect(result.errors[0].code).toBe('IMPOSSIBLE_VALUE')
    })

    it('warns for very old trees', () => {
      const result = enforcePhysicalTreeAge(60)
      expect(result.isValid).toBe(true)
      expect(result.warnings.some(w => w.message.includes('old'))).toBe(true)
    })

    it('warns for extremely old trees (>150 years)', () => {
      const result = enforcePhysicalTreeAge(160)
      expect(result.isValid).toBe(true)
      expect(result.warnings).toHaveLength(2) // Unusual + very old
    })
  })

  describe('enforcePhysicalConstraints() - combined', () => {
    it('validates all fields together', () => {
      const result = enforcePhysicalConstraints({
        brix: 12,
        omegaRatio: 5,
        gdd: 2500,
        treeAgeYears: 15,
      })
      expect(result.isValid).toBe(true)
    })

    it('aggregates errors from all fields', () => {
      const result = enforcePhysicalConstraints({
        brix: -5,
        gdd: -100,
      })
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThanOrEqual(2)
    })

    it('aggregates warnings from all fields', () => {
      const result = enforcePhysicalConstraints({
        brix: 2, // Below typical
        omegaRatio: 2, // Exceptional
      })
      expect(result.isValid).toBe(true)
      expect(result.warnings.length).toBeGreaterThanOrEqual(2)
    })
  })
})

// =============================================================================
// DATA QUALITY VALIDATION TESTS
// =============================================================================

describe('Data Quality Validation', () => {
  describe('validateMeasurement()', () => {
    it('validates complete valid measurement', () => {
      const result = validateMeasurement({
        brix: 12,
        ta: 0.8,
        timestamp: new Date(),
        source: 'lab',
      })
      expect(result.isValid).toBe(true)
    })

    it('includes physical constraint errors', () => {
      const result = validateMeasurement({
        brix: -5,
      })
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.code === 'OUT_OF_PHYSICAL_RANGE')).toBe(true)
    })

    it('warns about unusual Brix/TA ratio', () => {
      const result = validateMeasurement({
        brix: 12,
        ta: 10, // Would give ratio of 1.2, very low
      })
      expect(result.warnings.some(w => w.message.includes('ratio'))).toBe(true)
    })

    it('catches invalid timestamp format', () => {
      const result = validateMeasurement({
        brix: 12,
        timestamp: 'invalid-date',
      })
      expect(result.errors.some(e => e.code === 'INVALID_FORMAT')).toBe(true)
    })

    it('warns about future timestamps', () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)
      const result = validateMeasurement({
        brix: 12,
        timestamp: futureDate,
      })
      expect(result.warnings.some(w => w.message.includes('future'))).toBe(true)
    })

    it('warns about consumer-submitted data', () => {
      const result = validateMeasurement({
        brix: 12,
        source: 'consumer',
      })
      expect(result.warnings.some(w => w.code === 'LOW_CONFIDENCE')).toBe(true)
    })
  })

  describe('assessDataQuality()', () => {
    it('returns high score for complete lab data', () => {
      const result = assessDataQuality({
        brix: 12,
        timestamp: new Date(),
        source: 'lab',
      })
      expect(result.score).toBeGreaterThanOrEqual(0.9)
    })

    it('returns lower score for incomplete data', () => {
      const result = assessDataQuality({})
      expect(result.score).toBeLessThan(0.7)
      expect(result.issues.some(i => i.includes('Missing Brix'))).toBe(true)
    })

    it('penalizes consumer data source', () => {
      const labResult = assessDataQuality({
        brix: 12,
        timestamp: new Date(),
        source: 'lab',
      })
      const consumerResult = assessDataQuality({
        brix: 12,
        timestamp: new Date(),
        source: 'consumer',
      })
      expect(consumerResult.score).toBeLessThan(labResult.score)
    })

    it('provides recommendations', () => {
      const result = assessDataQuality({})
      expect(result.recommendations.length).toBeGreaterThan(0)
    })

    it('clamps score to [0, 1]', () => {
      const goodResult = assessDataQuality({
        brix: 12,
        timestamp: new Date(),
        source: 'lab',
      })
      const badResult = assessDataQuality({
        brix: -100,
        source: 'consumer',
      })
      expect(goodResult.score).toBeLessThanOrEqual(1)
      expect(badResult.score).toBeGreaterThanOrEqual(0)
    })
  })
})

// =============================================================================
// ANOMALY DETECTION TESTS
// =============================================================================

describe('Anomaly Detection', () => {
  describe('calculateZScore()', () => {
    it('calculates z-score correctly', () => {
      // Value at mean = z-score 0
      expect(calculateZScore(100, 100, 10)).toBe(0)

      // 1 standard deviation above
      expect(calculateZScore(110, 100, 10)).toBe(1)

      // 2 standard deviations below
      expect(calculateZScore(80, 100, 10)).toBe(-2)
    })

    it('handles zero standard deviation', () => {
      expect(calculateZScore(100, 100, 0)).toBe(0)
    })
  })

  describe('isAnomalousMeasurement()', () => {
    it('returns not anomaly for value at mean', () => {
      const result = isAnomalousMeasurement(100, 100, 10)
      expect(result.isAnomaly).toBe(false)
    })

    it('returns not anomaly for value within threshold', () => {
      const result = isAnomalousMeasurement(120, 100, 10, 2.5)
      expect(result.isAnomaly).toBe(false)
    })

    it('returns anomaly for value beyond threshold', () => {
      const result = isAnomalousMeasurement(130, 100, 10, 2.5)
      expect(result.isAnomaly).toBe(true)
      expect(result.reason).toContain('above mean')
    })

    it('returns anomaly for value below threshold', () => {
      const result = isAnomalousMeasurement(70, 100, 10, 2.5)
      expect(result.isAnomaly).toBe(true)
      expect(result.reason).toContain('below mean')
    })

    it('respects custom threshold', () => {
      // z=2 with threshold=1.5 = anomaly
      const result = isAnomalousMeasurement(120, 100, 10, 1.5)
      expect(result.isAnomaly).toBe(true)
    })

    it('provides z-score in result', () => {
      const result = isAnomalousMeasurement(130, 100, 10)
      expect(result.zScore).toBe(3)
    })

    it('handles constant population (stdDev=0)', () => {
      const result = isAnomalousMeasurement(101, 100, 0)
      expect(result.isAnomaly).toBe(true)
    })
  })

  describe('detectBrixAnomaly()', () => {
    const cultivarMean = 11.5
    const cultivarStdDev = 1.2

    it('returns not anomaly for typical value', () => {
      const result = detectBrixAnomaly(12, cultivarMean, cultivarStdDev)
      expect(result.isAnomaly).toBe(false)
    })

    it('returns anomaly for physically impossible value', () => {
      const result = detectBrixAnomaly(-5, cultivarMean, cultivarStdDev)
      expect(result.isAnomaly).toBe(true)
    })

    it('returns anomaly for statistical outlier', () => {
      const result = detectBrixAnomaly(18, cultivarMean, cultivarStdDev)
      expect(result.isAnomaly).toBe(true)
    })

    it('uses default stdDev when not provided', () => {
      const result = detectBrixAnomaly(12, cultivarMean)
      expect(result.isAnomaly).toBe(false)
    })
  })

  describe('detectOmegaAnomaly()', () => {
    // Grass-fed expected range: 1-6:1
    describe('Grass-fed profile', () => {
      it('returns not anomaly for value in range', () => {
        const result = detectOmegaAnomaly(3, 1, 6)
        expect(result.isAnomaly).toBe(false)
      })

      it('returns anomaly (better) for value below range', () => {
        const result = detectOmegaAnomaly(0.8, 1, 6)
        expect(result.isAnomaly).toBe(true)
        expect(result.reason).toContain('better')
      })

      it('returns anomaly (worse) for value above range', () => {
        const result = detectOmegaAnomaly(10, 1, 6)
        expect(result.isAnomaly).toBe(true)
        expect(result.reason).toContain('worse')
      })
    })

    // Commodity expected range: 15-20:1
    describe('Commodity profile', () => {
      it('returns not anomaly for typical commodity value', () => {
        const result = detectOmegaAnomaly(17, 15, 20)
        expect(result.isAnomaly).toBe(false)
      })

      it('returns anomaly for suspiciously good commodity', () => {
        const result = detectOmegaAnomaly(8, 15, 20)
        expect(result.isAnomaly).toBe(true)
        expect(result.reason).toContain('better')
      })
    })
  })
})

// =============================================================================
// UTILITY FUNCTION TESTS
// =============================================================================

describe('Utility Functions', () => {
  describe('clampToPhysical()', () => {
    it('clamps Brix to range', () => {
      expect(clampToPhysical(-5, 'brix')).toBe(0)
      expect(clampToPhysical(35, 'brix')).toBe(30)
      expect(clampToPhysical(12, 'brix')).toBe(12)
    })

    it('clamps omega to range', () => {
      expect(clampToPhysical(0.3, 'omegaRatio')).toBe(0.5)
      expect(clampToPhysical(60, 'omegaRatio')).toBe(50)
    })

    it('clamps GDD to range', () => {
      expect(clampToPhysical(-100, 'gdd')).toBe(0)
      expect(clampToPhysical(15000, 'gdd')).toBe(10000)
    })

    it('clamps tree age to range', () => {
      expect(clampToPhysical(-5, 'treeAge')).toBe(0)
      expect(clampToPhysical(200, 'treeAge')).toBe(150)
    })
  })

  describe('isTypicalValue()', () => {
    const range = { min: 8, max: 16 }

    it('returns true for value in range', () => {
      expect(isTypicalValue(12, range)).toBe(true)
    })

    it('returns true for value at min', () => {
      expect(isTypicalValue(8, range)).toBe(true)
    })

    it('returns true for value at max', () => {
      expect(isTypicalValue(16, range)).toBe(true)
    })

    it('returns false for value below range', () => {
      expect(isTypicalValue(5, range)).toBe(false)
    })

    it('returns false for value above range', () => {
      expect(isTypicalValue(20, range)).toBe(false)
    })
  })

  describe('getDeviationSeverity()', () => {
    const typical = { min: 8, max: 16 } // range = 8

    it('returns normal for typical value', () => {
      expect(getDeviationSeverity(12, typical)).toBe('normal')
    })

    it('returns low for small deviation', () => {
      // Less than 25% of range outside
      expect(getDeviationSeverity(7, typical)).toBe('low') // 1 below, 12.5% of range
    })

    it('returns medium for moderate deviation', () => {
      // 25-50% of range outside
      expect(getDeviationSeverity(5, typical)).toBe('medium') // 3 below, 37.5% of range
    })

    it('returns high for large deviation', () => {
      // More than 50% of range outside
      expect(getDeviationSeverity(2, typical)).toBe('high') // 6 below, 75% of range
    })
  })
})

// =============================================================================
// CONSTRAINT CONSTANTS TESTS
// =============================================================================

describe('Physical Constraint Constants', () => {
  it('defines Brix constraints', () => {
    expect(PHYSICAL_CONSTRAINTS.brix.min).toBe(0)
    expect(PHYSICAL_CONSTRAINTS.brix.max).toBe(30)
  })

  it('defines omega constraints', () => {
    expect(PHYSICAL_CONSTRAINTS.omegaRatio.min).toBe(0.5)
    expect(PHYSICAL_CONSTRAINTS.omegaRatio.max).toBe(50)
  })

  it('defines GDD constraints', () => {
    expect(PHYSICAL_CONSTRAINTS.gdd.min).toBe(0)
    expect(PHYSICAL_CONSTRAINTS.gdd.max).toBe(10000)
  })

  it('defines tree age constraints', () => {
    expect(PHYSICAL_CONSTRAINTS.treeAge.min).toBe(0)
    expect(PHYSICAL_CONSTRAINTS.treeAge.max).toBe(150)
  })

  it('defines pH constraints', () => {
    expect(PHYSICAL_CONSTRAINTS.ph.min).toBe(0)
    expect(PHYSICAL_CONSTRAINTS.ph.max).toBe(14)
  })
})

describe('Typical Range Constants', () => {
  it('defines produce Brix typical range', () => {
    expect(TYPICAL_RANGES.brix.produce.min).toBe(4)
    expect(TYPICAL_RANGES.brix.produce.max).toBe(20)
  })

  it('defines citrus-specific Brix range', () => {
    expect(TYPICAL_RANGES.brix.citrus.min).toBe(8)
    expect(TYPICAL_RANGES.brix.citrus.max).toBe(16)
  })

  it('defines omega ranges by category', () => {
    expect(TYPICAL_RANGES.omegaRatio.grassFed.max).toBe(6)
    expect(TYPICAL_RANGES.omegaRatio.commodity.min).toBe(12)
    expect(TYPICAL_RANGES.omegaRatio.cafoExtended.min).toBe(18)
  })
})

// =============================================================================
// INTEGRATION TESTS
// =============================================================================

describe('Integration Scenarios', () => {
  describe('Consumer refractometer submission', () => {
    it('validates typical consumer measurement', () => {
      const measurement = {
        brix: 11.5,
        timestamp: new Date(),
        source: 'consumer' as const,
      }
      const validation = validateMeasurement(measurement)
      const quality = assessDataQuality(measurement)

      expect(validation.isValid).toBe(true)
      expect(quality.score).toBeGreaterThan(0.5)
      expect(quality.recommendations.some(r => r.includes('lab verification'))).toBe(true)
    })
  })

  describe('Lab measurement validation', () => {
    it('validates complete lab measurement', () => {
      const measurement = {
        brix: 12.3,
        ta: 0.85,
        omegaRatio: 4.2,
        timestamp: new Date(),
        source: 'lab' as const,
      }
      const validation = validateMeasurement(measurement)
      const quality = assessDataQuality(measurement)

      expect(validation.isValid).toBe(true)
      expect(quality.score).toBeGreaterThanOrEqual(0.9)
    })
  })

  describe('Anomaly detection workflow', () => {
    it('detects inconsistent grass-fed claim', () => {
      // Brand claims grass-fed but omega ratio is 18:1
      const claimedProfile = { min: 1, max: 6 } // True grass-fed
      const actualOmega = 18

      const result = detectOmegaAnomaly(actualOmega, claimedProfile.min, claimedProfile.max)
      expect(result.isAnomaly).toBe(true)
      expect(result.reason).toContain('worse')
    })

    it('validates consistent claim', () => {
      const claimedProfile = { min: 1, max: 6 }
      const actualOmega = 3.5

      const result = detectOmegaAnomaly(actualOmega, claimedProfile.min, claimedProfile.max)
      expect(result.isAnomaly).toBe(false)
    })
  })

  describe('Brix prediction validation', () => {
    it('validates prediction within expected range', () => {
      const predictedBrix = 11.8
      const cultivarMean = 11.5
      const cultivarStdDev = 1.2

      const anomaly = detectBrixAnomaly(predictedBrix, cultivarMean, cultivarStdDev)
      const physical = enforcePhysicalBrix(predictedBrix)

      expect(anomaly.isAnomaly).toBe(false)
      expect(physical.isValid).toBe(true)
    })
  })
})
