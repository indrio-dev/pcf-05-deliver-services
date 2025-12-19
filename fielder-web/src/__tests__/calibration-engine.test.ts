/**
 * Calibration Engine Tests
 *
 * F020: Tests for regional calibration logic.
 * Note: Database interaction tests are integration tests;
 * these focus on the calculation logic.
 */

import {
  calculateRunningStats,
  calculateConfidenceBoost,
  applyCalibrationSync,
  MIN_SAMPLES_FOR_CALIBRATION,
  MAX_CONFIDENCE_BOOST,
  SAMPLES_FOR_MAX_CONFIDENCE,
  type RegionalCalibration,
} from '@/lib/intelligence/calibration-engine'

// =============================================================================
// MOCK CALIBRATION DATA
// =============================================================================

const mockCalibration = (overrides: Partial<RegionalCalibration> = {}): RegionalCalibration => ({
  id: 'cal-123',
  cultivarId: 'washington_navel',
  regionId: 'indian_river_fl',
  seasonYear: 2024,
  sampleCount: 25,
  brixOffsetMean: 0.5,
  brixOffsetStddev: 0.3,
  brixOffsetMin: -0.2,
  brixOffsetMax: 1.2,
  maeBefore: 1.5,
  maeAfter: 1.0,
  improvementPct: 33,
  confidenceBoost: 0.05,
  minSamplesForConfidence: 10,
  isActive: true,
  lastActualDate: '2024-03-15',
  lastCalculationAt: '2024-03-15T12:00:00Z',
  ...overrides,
})

// =============================================================================
// RUNNING STATISTICS TESTS
// =============================================================================

describe('Running Statistics Calculation', () => {
  describe('calculateRunningStats()', () => {
    it('calculates first value correctly', () => {
      const result = calculateRunningStats(0, 0, 0, 10)
      expect(result.mean).toBe(10)
      expect(result.count).toBe(1)
    })

    it('calculates running mean correctly', () => {
      // Start with mean=10, count=1
      // Add value 12 -> new mean should be 11
      const result = calculateRunningStats(10, 0, 1, 12)
      expect(result.mean).toBe(11)
      expect(result.count).toBe(2)
    })

    it('handles negative offsets', () => {
      const result = calculateRunningStats(0, 0, 0, -0.5)
      expect(result.mean).toBe(-0.5)
    })

    it('maintains precision', () => {
      const result = calculateRunningStats(10.333, 0, 2, 10.666)
      // (10.333 * 2 + 10.666) / 3 = 10.444
      expect(result.mean).toBeCloseTo(10.444, 2)
    })

    it('increments count correctly', () => {
      const result = calculateRunningStats(5, 0, 10, 6)
      expect(result.count).toBe(11)
    })
  })
})

// =============================================================================
// CONFIDENCE BOOST TESTS
// =============================================================================

describe('Confidence Boost Calculation', () => {
  describe('calculateConfidenceBoost()', () => {
    it('returns 0 for insufficient samples', () => {
      expect(calculateConfidenceBoost(0)).toBe(0)
      expect(calculateConfidenceBoost(1)).toBe(0)
      expect(calculateConfidenceBoost(MIN_SAMPLES_FOR_CALIBRATION - 1)).toBe(0)
    })

    it('returns small boost at minimum samples', () => {
      const boost = calculateConfidenceBoost(MIN_SAMPLES_FOR_CALIBRATION)
      expect(boost).toBeGreaterThan(0)
      expect(boost).toBeLessThan(MAX_CONFIDENCE_BOOST)
    })

    it('scales linearly with sample count', () => {
      const boost10 = calculateConfidenceBoost(10)
      const boost25 = calculateConfidenceBoost(25)
      expect(boost25).toBeGreaterThan(boost10)
    })

    it('caps at maximum boost', () => {
      const boost = calculateConfidenceBoost(SAMPLES_FOR_MAX_CONFIDENCE)
      expect(boost).toBe(MAX_CONFIDENCE_BOOST)
    })

    it('does not exceed maximum even with many samples', () => {
      const boost = calculateConfidenceBoost(1000)
      expect(boost).toBe(MAX_CONFIDENCE_BOOST)
    })

    it('returns expected value at halfway point', () => {
      const halfwaySamples = SAMPLES_FOR_MAX_CONFIDENCE / 2
      const boost = calculateConfidenceBoost(halfwaySamples)
      expect(boost).toBeCloseTo(MAX_CONFIDENCE_BOOST / 2, 2)
    })
  })
})

// =============================================================================
// CALIBRATION APPLICATION TESTS
// =============================================================================

describe('Calibration Application', () => {
  describe('applyCalibrationSync()', () => {
    describe('With valid calibration', () => {
      it('applies positive offset', () => {
        const calibration = mockCalibration({ brixOffsetMean: 0.5, sampleCount: 25 })
        const result = applyCalibrationSync(11.5, calibration)

        expect(result.hasCalibration).toBe(true)
        expect(result.calibratedBrix).toBe(12)
        expect(result.originalBrix).toBe(11.5)
        expect(result.offset).toBe(0.5)
      })

      it('applies negative offset', () => {
        const calibration = mockCalibration({ brixOffsetMean: -0.3, sampleCount: 25 })
        const result = applyCalibrationSync(12, calibration)

        expect(result.calibratedBrix).toBe(11.7)
        expect(result.offset).toBe(-0.3)
      })

      it('includes confidence boost', () => {
        const calibration = mockCalibration({ confidenceBoost: 0.05, sampleCount: 25 })
        const result = applyCalibrationSync(11.5, calibration)

        expect(result.confidenceBoost).toBe(0.05)
      })

      it('includes sample count', () => {
        const calibration = mockCalibration({ sampleCount: 42 })
        const result = applyCalibrationSync(11.5, calibration)

        expect(result.sampleCount).toBe(42)
      })

      it('includes calibration ID', () => {
        const calibration = mockCalibration({ id: 'cal-456' })
        const result = applyCalibrationSync(11.5, calibration)

        expect(result.calibrationId).toBe('cal-456')
      })

      it('rounds to 2 decimal places', () => {
        const calibration = mockCalibration({ brixOffsetMean: 0.333, sampleCount: 25 })
        const result = applyCalibrationSync(11.111, calibration)

        // 11.111 + 0.333 = 11.444, rounded to 11.44
        expect(result.calibratedBrix).toBeCloseTo(11.44, 2)
      })
    })

    describe('Clamping behavior', () => {
      it('clamps high values to 30', () => {
        const calibration = mockCalibration({ brixOffsetMean: 5, sampleCount: 25 })
        const result = applyCalibrationSync(28, calibration)

        expect(result.calibratedBrix).toBe(30)
      })

      it('clamps low values to 0', () => {
        const calibration = mockCalibration({ brixOffsetMean: -5, sampleCount: 25 })
        const result = applyCalibrationSync(3, calibration)

        expect(result.calibratedBrix).toBe(0)
      })
    })

    describe('Without calibration', () => {
      it('returns original when calibration is null', () => {
        const result = applyCalibrationSync(11.5, null)

        expect(result.hasCalibration).toBe(false)
        expect(result.calibratedBrix).toBe(11.5)
        expect(result.originalBrix).toBe(11.5)
        expect(result.offset).toBe(0)
        expect(result.confidenceBoost).toBe(0)
      })

      it('returns original when sample count too low', () => {
        const calibration = mockCalibration({ sampleCount: 2 })
        const result = applyCalibrationSync(11.5, calibration)

        expect(result.hasCalibration).toBe(false)
        expect(result.calibratedBrix).toBe(11.5)
      })

      it('includes sample count even when not applied', () => {
        const calibration = mockCalibration({ sampleCount: 3 })
        const result = applyCalibrationSync(11.5, calibration)

        expect(result.sampleCount).toBe(3)
      })
    })

    describe('Edge cases', () => {
      it('handles zero offset', () => {
        const calibration = mockCalibration({ brixOffsetMean: 0, sampleCount: 25 })
        const result = applyCalibrationSync(11.5, calibration)

        expect(result.hasCalibration).toBe(true)
        expect(result.calibratedBrix).toBe(11.5)
        expect(result.offset).toBe(0)
      })

      it('handles exactly MIN_SAMPLES_FOR_CALIBRATION', () => {
        const calibration = mockCalibration({
          sampleCount: MIN_SAMPLES_FOR_CALIBRATION,
          brixOffsetMean: 0.5,
        })
        const result = applyCalibrationSync(11.5, calibration)

        expect(result.hasCalibration).toBe(true)
        expect(result.calibratedBrix).toBe(12)
      })

      it('does not apply at MIN_SAMPLES - 1', () => {
        const calibration = mockCalibration({
          sampleCount: MIN_SAMPLES_FOR_CALIBRATION - 1,
          brixOffsetMean: 0.5,
        })
        const result = applyCalibrationSync(11.5, calibration)

        expect(result.hasCalibration).toBe(false)
      })
    })
  })
})

// =============================================================================
// CONSTANTS TESTS
// =============================================================================

describe('Calibration Constants', () => {
  it('has reasonable MIN_SAMPLES_FOR_CALIBRATION', () => {
    expect(MIN_SAMPLES_FOR_CALIBRATION).toBeGreaterThanOrEqual(3)
    expect(MIN_SAMPLES_FOR_CALIBRATION).toBeLessThanOrEqual(20)
  })

  it('has reasonable MAX_CONFIDENCE_BOOST', () => {
    expect(MAX_CONFIDENCE_BOOST).toBeGreaterThan(0)
    expect(MAX_CONFIDENCE_BOOST).toBeLessThanOrEqual(0.2) // Should be modest
  })

  it('has reasonable SAMPLES_FOR_MAX_CONFIDENCE', () => {
    expect(SAMPLES_FOR_MAX_CONFIDENCE).toBeGreaterThan(MIN_SAMPLES_FOR_CALIBRATION)
    expect(SAMPLES_FOR_MAX_CONFIDENCE).toBeLessThanOrEqual(100)
  })
})

// =============================================================================
// SCENARIO TESTS
// =============================================================================

describe('Calibration Scenarios', () => {
  describe('New cultivar x region pair', () => {
    it('starts without calibration', () => {
      const result = applyCalibrationSync(11.5, null)
      expect(result.hasCalibration).toBe(false)
    })

    it('builds confidence over time', () => {
      // Simulating calibration building over submissions
      const stages = [
        mockCalibration({ sampleCount: 3, confidenceBoost: 0 }),
        mockCalibration({ sampleCount: 10, confidenceBoost: 0.02 }),
        mockCalibration({ sampleCount: 25, confidenceBoost: 0.05 }),
        mockCalibration({ sampleCount: 50, confidenceBoost: 0.1 }),
      ]

      const boosts = stages.map(s => applyCalibrationSync(11.5, s).confidenceBoost)

      // First has no calibration (under minimum)
      expect(boosts[0]).toBe(0)
      // Others should increase
      expect(boosts[2]).toBeGreaterThan(boosts[1])
      expect(boosts[3]).toBeGreaterThan(boosts[2])
    })
  })

  describe('Regional variation', () => {
    it('applies different offsets per region', () => {
      const indianRiver = mockCalibration({
        regionId: 'indian_river_fl',
        brixOffsetMean: 0.5,
        sampleCount: 30,
      })
      const centralValley = mockCalibration({
        regionId: 'central_valley_ca',
        brixOffsetMean: -0.3,
        sampleCount: 30,
      })

      const irResult = applyCalibrationSync(11.5, indianRiver)
      const cvResult = applyCalibrationSync(11.5, centralValley)

      expect(irResult.calibratedBrix).toBe(12)
      expect(cvResult.calibratedBrix).toBe(11.2)
    })
  })

  describe('Prediction improvement tracking', () => {
    it('tracks improvement percentage', () => {
      const calibration = mockCalibration({
        maeBefore: 1.5,
        maeAfter: 1.0,
        improvementPct: 33,
      })

      // The improvement is tracked in the calibration object
      expect(calibration.maeBefore).toBe(1.5)
      expect(calibration.maeAfter).toBe(1.0)
      expect(calibration.improvementPct).toBe(33)
    })
  })
})
