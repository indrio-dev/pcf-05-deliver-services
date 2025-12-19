/**
 * Accuracy Reporter Tests
 *
 * F023: Tests for accuracy metrics calculation and reporting.
 */

import {
  calculateMetrics,
  calculateTierAccuracy,
  determineTrend,
  checkAlerts,
  ALERT_THRESHOLDS,
  TREND_THRESHOLDS,
  type PredictionActualPair,
  type AccuracyMetrics,
} from '@/lib/analytics/accuracy-reporter'

// =============================================================================
// TEST DATA
// =============================================================================

const mockPair = (overrides: Partial<PredictionActualPair> = {}): PredictionActualPair => ({
  predictionId: 'pred-123',
  cultivarId: 'washington_navel',
  regionId: 'indian_river_fl',
  predictedBrix: 12.0,
  actualBrix: 11.5,
  confidence: 0.85,
  qualityTier: 'premium',
  predictionDate: '2024-03-01',
  measurementDate: '2024-03-15',
  ...overrides,
})

// Generate pairs with specific errors
const generatePairs = (
  count: number,
  errorRange: [number, number] = [-0.5, 0.5]
): PredictionActualPair[] => {
  const pairs: PredictionActualPair[] = []
  for (let i = 0; i < count; i++) {
    const actual = 10 + Math.random() * 4 // Random actual between 10-14
    const errorFraction = (i / count) * (errorRange[1] - errorRange[0]) + errorRange[0]
    const predicted = actual + errorFraction
    pairs.push(mockPair({
      predictionId: `pred-${i}`,
      predictedBrix: predicted,
      actualBrix: actual,
      confidence: 0.7 + Math.random() * 0.2,
    }))
  }
  return pairs
}

// =============================================================================
// METRIC CALCULATION TESTS
// =============================================================================

describe('Accuracy Metrics Calculation', () => {
  describe('calculateMetrics()', () => {
    describe('Basic metrics', () => {
      it('calculates MAE correctly', () => {
        const pairs = [
          mockPair({ predictedBrix: 12.0, actualBrix: 11.0 }), // Error: +1.0
          mockPair({ predictedBrix: 10.0, actualBrix: 11.0 }), // Error: -1.0
          mockPair({ predictedBrix: 12.0, actualBrix: 12.0 }), // Error: 0.0
        ]
        const metrics = calculateMetrics(pairs)
        // MAE = (1.0 + 1.0 + 0.0) / 3 = 0.667
        expect(metrics.mae).toBeCloseTo(0.667, 2)
      })

      it('calculates RMSE correctly', () => {
        const pairs = [
          mockPair({ predictedBrix: 12.0, actualBrix: 11.0 }), // Error: 1.0
          mockPair({ predictedBrix: 12.0, actualBrix: 12.0 }), // Error: 0.0
        ]
        const metrics = calculateMetrics(pairs)
        // MSE = (1.0 + 0.0) / 2 = 0.5, RMSE = sqrt(0.5) = 0.707
        expect(metrics.rmse).toBeCloseTo(0.707, 2)
      })

      it('calculates sample counts', () => {
        const pairs = generatePairs(25)
        const metrics = calculateMetrics(pairs)
        expect(metrics.sampleCount).toBe(25)
        expect(metrics.matchedPairs).toBe(25)
      })

      it('handles empty array', () => {
        const metrics = calculateMetrics([])
        expect(metrics.sampleCount).toBe(0)
        expect(metrics.mae).toBe(0)
        expect(metrics.rmse).toBe(0)
      })
    })

    describe('Bias metrics', () => {
      it('detects positive bias (over-predicting)', () => {
        const pairs = [
          mockPair({ predictedBrix: 12.0, actualBrix: 11.0 }), // +1.0
          mockPair({ predictedBrix: 13.0, actualBrix: 11.5 }), // +1.5
          mockPair({ predictedBrix: 11.5, actualBrix: 11.0 }), // +0.5
        ]
        const metrics = calculateMetrics(pairs)
        expect(metrics.meanError).toBeGreaterThan(0)
      })

      it('detects negative bias (under-predicting)', () => {
        const pairs = [
          mockPair({ predictedBrix: 10.0, actualBrix: 11.0 }), // -1.0
          mockPair({ predictedBrix: 10.5, actualBrix: 12.0 }), // -1.5
          mockPair({ predictedBrix: 11.0, actualBrix: 11.5 }), // -0.5
        ]
        const metrics = calculateMetrics(pairs)
        expect(metrics.meanError).toBeLessThan(0)
      })

      it('detects no bias when balanced', () => {
        const pairs = [
          mockPair({ predictedBrix: 12.0, actualBrix: 11.0 }), // +1.0
          mockPair({ predictedBrix: 10.0, actualBrix: 11.0 }), // -1.0
        ]
        const metrics = calculateMetrics(pairs)
        expect(metrics.meanError).toBeCloseTo(0, 2)
      })

      it('calculates median error', () => {
        const pairs = [
          mockPair({ predictedBrix: 12.0, actualBrix: 11.0 }), // +1.0
          mockPair({ predictedBrix: 11.5, actualBrix: 11.0 }), // +0.5
          mockPair({ predictedBrix: 11.0, actualBrix: 11.0 }), // 0.0
        ]
        const metrics = calculateMetrics(pairs)
        expect(metrics.medianError).toBeCloseTo(0.5, 2)
      })

      it('calculates error standard deviation', () => {
        const pairs = generatePairs(50, [-1, 1])
        const metrics = calculateMetrics(pairs)
        expect(metrics.errorStddev).toBeGreaterThan(0)
      })
    })

    describe('Distribution metrics', () => {
      it('calculates percentage within thresholds', () => {
        const pairs = [
          mockPair({ predictedBrix: 11.3, actualBrix: 11.0 }), // 0.3 - within all
          mockPair({ predictedBrix: 11.8, actualBrix: 11.0 }), // 0.8 - within 1.0, 1.5, 2.0
          mockPair({ predictedBrix: 12.2, actualBrix: 11.0 }), // 1.2 - within 1.5, 2.0
          mockPair({ predictedBrix: 12.8, actualBrix: 11.0 }), // 1.8 - within 2.0 only
          mockPair({ predictedBrix: 14.0, actualBrix: 11.0 }), // 3.0 - outside all
        ]
        const metrics = calculateMetrics(pairs)

        expect(metrics.pctWithin05).toBeCloseTo(20, 0) // 1/5 = 20%
        expect(metrics.pctWithin10).toBeCloseTo(40, 0) // 2/5 = 40%
        expect(metrics.pctWithin15).toBeCloseTo(60, 0) // 3/5 = 60%
        expect(metrics.pctWithin20).toBeCloseTo(80, 0) // 4/5 = 80%
      })

      it('returns 100% for perfect predictions', () => {
        const pairs = [
          mockPair({ predictedBrix: 11.0, actualBrix: 11.0 }),
          mockPair({ predictedBrix: 12.0, actualBrix: 12.0 }),
          mockPair({ predictedBrix: 13.0, actualBrix: 13.0 }),
        ]
        const metrics = calculateMetrics(pairs)

        expect(metrics.pctWithin05).toBe(100)
        expect(metrics.pctWithin10).toBe(100)
        expect(metrics.pctWithin15).toBe(100)
        expect(metrics.pctWithin20).toBe(100)
      })
    })

    describe('Confidence metrics', () => {
      it('calculates average confidence', () => {
        const pairs = [
          mockPair({ confidence: 0.8 }),
          mockPair({ confidence: 0.9 }),
          mockPair({ confidence: 0.7 }),
        ]
        const metrics = calculateMetrics(pairs)
        expect(metrics.avgConfidence).toBeCloseTo(0.8, 2)
      })

      it('calculates confidence correlation', () => {
        // Higher confidence should correlate with better accuracy
        const pairs = [
          mockPair({ predictedBrix: 11.0, actualBrix: 11.0, confidence: 0.95 }), // Perfect, high conf
          mockPair({ predictedBrix: 14.0, actualBrix: 11.0, confidence: 0.50 }), // Bad, low conf
        ]
        const metrics = calculateMetrics(pairs)
        // Should be positive (higher confidence = better accuracy)
        expect(metrics.confidenceCorrelation).toBeGreaterThan(0)
      })
    })
  })

  describe('calculateTierAccuracy()', () => {
    it('calculates accuracy by tier', () => {
      const pairs = [
        mockPair({ qualityTier: 'premium', predictedBrix: 13.0, actualBrix: 13.5 }),
        mockPair({ qualityTier: 'premium', predictedBrix: 12.5, actualBrix: 12.0 }),
        mockPair({ qualityTier: 'premium', predictedBrix: 14.0, actualBrix: 13.8 }),
        mockPair({ qualityTier: 'premium', predictedBrix: 13.5, actualBrix: 13.5 }),
        mockPair({ qualityTier: 'premium', predictedBrix: 12.8, actualBrix: 12.5 }),
        mockPair({ qualityTier: 'standard', predictedBrix: 10.0, actualBrix: 11.5 }),
        mockPair({ qualityTier: 'standard', predictedBrix: 10.5, actualBrix: 11.0 }),
        mockPair({ qualityTier: 'standard', predictedBrix: 11.0, actualBrix: 10.5 }),
        mockPair({ qualityTier: 'standard', predictedBrix: 10.2, actualBrix: 10.0 }),
        mockPair({ qualityTier: 'standard', predictedBrix: 10.8, actualBrix: 10.5 }),
      ]

      const tierAccuracy = calculateTierAccuracy(pairs)
      expect(tierAccuracy.premium).toBeDefined()
      expect(tierAccuracy.standard).toBeDefined()
    })

    it('requires minimum samples per tier', () => {
      const pairs = [
        mockPair({ qualityTier: 'artisan' }), // Only 1
        mockPair({ qualityTier: 'premium' }),
        mockPair({ qualityTier: 'premium' }),
      ]

      const tierAccuracy = calculateTierAccuracy(pairs)
      expect(tierAccuracy.artisan).toBeUndefined() // Not enough samples
      expect(tierAccuracy.premium).toBeUndefined() // Not enough samples
    })

    it('handles empty pairs', () => {
      const tierAccuracy = calculateTierAccuracy([])
      expect(Object.keys(tierAccuracy)).toHaveLength(0)
    })
  })
})

// =============================================================================
// TREND ANALYSIS TESTS
// =============================================================================

describe('Trend Analysis', () => {
  describe('determineTrend()', () => {
    it('detects improving trend', () => {
      const { trend, changePct } = determineTrend(0.8, 1.0)
      expect(trend).toBe('improving')
      expect(changePct).toBeLessThan(0) // Negative means MAE decreased
    })

    it('detects degrading trend', () => {
      const { trend, changePct } = determineTrend(1.5, 1.0)
      expect(trend).toBe('degrading')
      expect(changePct).toBeGreaterThan(0) // Positive means MAE increased
    })

    it('detects stable trend', () => {
      const { trend } = determineTrend(1.05, 1.0)
      expect(trend).toBe('stable')
    })

    it('handles null previous MAE', () => {
      const { trend, changePct } = determineTrend(1.0, null)
      expect(trend).toBe('stable')
      expect(changePct).toBe(0)
    })

    it('handles zero previous MAE', () => {
      const { trend, changePct } = determineTrend(1.0, 0)
      expect(trend).toBe('stable')
      expect(changePct).toBe(0)
    })

    it('calculates correct percentage change', () => {
      const { changePct } = determineTrend(1.2, 1.0)
      expect(changePct).toBeCloseTo(20, 0) // 20% increase
    })
  })
})

// =============================================================================
// ALERT TESTS
// =============================================================================

describe('Alert System', () => {
  describe('checkAlerts()', () => {
    const baseMetrics: AccuracyMetrics = {
      sampleCount: 100,
      predictionCount: 100,
      actualCount: 100,
      matchedPairs: 100,
      mae: 0.8,
      mse: 0.64,
      rmse: 0.8,
      mape: 7.5,
      meanError: 0.1,
      medianError: 0.05,
      errorStddev: 0.5,
      pctWithin05: 35,
      pctWithin10: 70,
      pctWithin15: 90,
      pctWithin20: 98,
      avgConfidence: 0.85,
      confidenceCorrelation: 0.6,
    }

    it('no alerts for good metrics', () => {
      const alerts = checkAlerts(baseMetrics, 0)
      expect(alerts.alertTriggered).toBe(false)
      expect(alerts.needsRetraining).toBe(false)
      expect(alerts.alertReason).toBeNull()
    })

    it('triggers alert for high MAE', () => {
      const metrics = { ...baseMetrics, mae: 1.8 }
      const alerts = checkAlerts(metrics, 0)
      expect(alerts.alertTriggered).toBe(true)
      expect(alerts.alertReason).toContain('MAE')
    })

    it('triggers retraining for very high MAE', () => {
      const metrics = { ...baseMetrics, mae: 2.5 }
      const alerts = checkAlerts(metrics, 0)
      expect(alerts.needsRetraining).toBe(true)
      expect(alerts.alertReason).toContain('retraining')
    })

    it('triggers alert for MAE increase', () => {
      const alerts = checkAlerts(baseMetrics, 30) // 30% increase
      expect(alerts.alertTriggered).toBe(true)
      expect(alerts.alertReason).toContain('increased')
    })

    it('triggers alert for low within-threshold percentage', () => {
      const metrics = { ...baseMetrics, pctWithin10: 50 }
      const alerts = checkAlerts(metrics, 0)
      expect(alerts.alertTriggered).toBe(true)
      expect(alerts.alertReason).toContain('±1.0 Brix')
    })

    it('collects multiple alert reasons', () => {
      const metrics = { ...baseMetrics, mae: 2.5, pctWithin10: 40 }
      const alerts = checkAlerts(metrics, 50)
      expect(alerts.alertReason).toContain('retraining')
      expect(alerts.alertReason).toContain('increased')
      expect(alerts.alertReason).toContain('±1.0 Brix')
    })
  })
})

// =============================================================================
// CONFIGURATION TESTS
// =============================================================================

describe('Configuration', () => {
  describe('ALERT_THRESHOLDS', () => {
    it('has all required thresholds', () => {
      expect(ALERT_THRESHOLDS.mae).toBeDefined()
      expect(ALERT_THRESHOLDS.maeIncrease).toBeDefined()
      expect(ALERT_THRESHOLDS.pctWithin10).toBeDefined()
      expect(ALERT_THRESHOLDS.retrainTrigger).toBeDefined()
    })

    it('has reasonable values', () => {
      expect(ALERT_THRESHOLDS.mae).toBeGreaterThan(0)
      expect(ALERT_THRESHOLDS.mae).toBeLessThan(5)
      expect(ALERT_THRESHOLDS.retrainTrigger).toBeGreaterThan(ALERT_THRESHOLDS.mae)
      expect(ALERT_THRESHOLDS.pctWithin10).toBeGreaterThan(0)
      expect(ALERT_THRESHOLDS.pctWithin10).toBeLessThan(1)
    })
  })

  describe('TREND_THRESHOLDS', () => {
    it('has improving and degrading thresholds', () => {
      expect(TREND_THRESHOLDS.improving).toBeDefined()
      expect(TREND_THRESHOLDS.degrading).toBeDefined()
    })

    it('improving is negative (MAE decrease)', () => {
      expect(TREND_THRESHOLDS.improving).toBeLessThan(0)
    })

    it('degrading is positive (MAE increase)', () => {
      expect(TREND_THRESHOLDS.degrading).toBeGreaterThan(0)
    })
  })
})

// =============================================================================
// SCENARIO TESTS
// =============================================================================

describe('Accuracy Reporting Scenarios', () => {
  describe('Production accuracy monitoring', () => {
    it('detects calibration drift', () => {
      // Simulate predictions that are systematically over-predicting
      const pairs = [
        mockPair({ predictedBrix: 12.5, actualBrix: 11.0 }), // +1.5
        mockPair({ predictedBrix: 13.0, actualBrix: 11.5 }), // +1.5
        mockPair({ predictedBrix: 12.8, actualBrix: 11.3 }), // +1.5
        mockPair({ predictedBrix: 13.2, actualBrix: 11.8 }), // +1.4
        mockPair({ predictedBrix: 12.0, actualBrix: 10.5 }), // +1.5
      ]

      const metrics = calculateMetrics(pairs)

      // Should detect positive bias
      expect(metrics.meanError).toBeGreaterThan(1)
      // MAE should be around 1.5
      expect(metrics.mae).toBeGreaterThan(1)
    })

    it('validates good model performance', () => {
      // Simulate well-calibrated predictions
      const pairs = [
        mockPair({ predictedBrix: 11.1, actualBrix: 11.0 }),
        mockPair({ predictedBrix: 12.0, actualBrix: 11.8 }),
        mockPair({ predictedBrix: 10.5, actualBrix: 10.7 }),
        mockPair({ predictedBrix: 13.0, actualBrix: 13.2 }),
        mockPair({ predictedBrix: 11.8, actualBrix: 12.0 }),
      ]

      const metrics = calculateMetrics(pairs)

      expect(metrics.mae).toBeLessThan(0.5)
      expect(metrics.pctWithin05).toBeGreaterThan(60)
      expect(Math.abs(metrics.meanError)).toBeLessThan(0.3)
    })
  })

  describe('Source comparison', () => {
    it('compares consumer vs lab accuracy', () => {
      // Consumer measurements have more noise
      const consumerPairs = generatePairs(20, [-1.5, 1.5])
      // Lab measurements are more accurate
      const labPairs = generatePairs(20, [-0.3, 0.3])

      const consumerMetrics = calculateMetrics(consumerPairs)
      const labMetrics = calculateMetrics(labPairs)

      // Lab should have lower MAE
      expect(labMetrics.mae).toBeLessThan(consumerMetrics.mae)
    })
  })

  describe('Trend monitoring', () => {
    it('identifies degrading performance', () => {
      const previousMae = 0.8
      const currentMae = 1.2 // 50% increase

      const { trend, changePct } = determineTrend(currentMae, previousMae)

      expect(trend).toBe('degrading')
      expect(changePct).toBeGreaterThan(10) // More than 10% degradation
    })

    it('identifies stable performance', () => {
      const previousMae = 0.8
      const currentMae = 0.82 // 2.5% increase

      const { trend } = determineTrend(currentMae, previousMae)

      expect(trend).toBe('stable')
    })

    it('identifies improving performance', () => {
      const previousMae = 1.2
      const currentMae = 0.8 // 33% decrease

      const { trend, changePct } = determineTrend(currentMae, previousMae)

      expect(trend).toBe('improving')
      expect(changePct).toBeLessThan(-5) // More than 5% improvement
    })
  })
})

// =============================================================================
// EDGE CASES
// =============================================================================

describe('Edge Cases', () => {
  it('handles single prediction-actual pair', () => {
    const pairs = [mockPair({ predictedBrix: 12.0, actualBrix: 11.5 })]
    const metrics = calculateMetrics(pairs)

    expect(metrics.sampleCount).toBe(1)
    expect(metrics.mae).toBe(0.5)
    expect(metrics.errorStddev).toBe(0) // Can't calculate stddev with 1 sample
  })

  it('handles very large errors', () => {
    const pairs = [
      mockPair({ predictedBrix: 20.0, actualBrix: 10.0 }), // Error: 10
      mockPair({ predictedBrix: 5.0, actualBrix: 15.0 }),  // Error: -10
    ]
    const metrics = calculateMetrics(pairs)

    expect(metrics.mae).toBe(10)
    expect(metrics.pctWithin20).toBe(0) // Both errors > 2.0
  })

  it('handles zero actual Brix for MAPE', () => {
    const pairs = [mockPair({ predictedBrix: 1.0, actualBrix: 0 })]
    const metrics = calculateMetrics(pairs)

    // Should handle divide by zero gracefully
    expect(isFinite(metrics.mape)).toBe(true)
  })

  it('handles identical predictions and actuals', () => {
    const pairs = [
      mockPair({ predictedBrix: 12.0, actualBrix: 12.0 }),
      mockPair({ predictedBrix: 12.0, actualBrix: 12.0 }),
      mockPair({ predictedBrix: 12.0, actualBrix: 12.0 }),
    ]
    const metrics = calculateMetrics(pairs)

    expect(metrics.mae).toBe(0)
    expect(metrics.rmse).toBe(0)
    expect(metrics.pctWithin05).toBe(100)
    expect(metrics.confidenceCorrelation).toBe(0) // No variance to correlate
  })
})
