/**
 * Tests for Uncertainty Quantification
 */

import {
  generateBrixDistribution,
  getUncertaintyComponents,
} from '@/lib/intelligence/uncertainty-quantification'

import {
  deriveConfidenceScore,
  normalInverseCDF,
  createParametricDistribution,
  createEmpiricalDistribution,
  classifyQualityTierFromDistribution,
} from '@/lib/types/uncertainty'

describe('Monte Carlo Brix Distribution', () => {
  test('should generate distribution with correct mean', () => {
    const dist = generateBrixDistribution(12.0, {}, 1000)

    expect(dist.mean).toBeCloseTo(12.0, 0)
    expect(dist.median).toBeCloseTo(12.0, 0)
  })

  test('should have p50 near mean', () => {
    const dist = generateBrixDistribution(13.5, {}, 1000)

    expect(dist.p50).toBeCloseTo(dist.mean, 0.5)
  })

  test('should have p25 < p50 < p75', () => {
    const dist = generateBrixDistribution(12.0, {}, 1000)

    expect(dist.p25).toBeLessThan(dist.p50)
    expect(dist.p50).toBeLessThan(dist.p75)
  })

  test('should have 90% CI bounds', () => {
    const dist = generateBrixDistribution(12.0, {}, 1000)

    expect(dist.p5).toBeLessThan(dist.p95)
    expect(dist.confidenceInterval90[0]).toBeCloseTo(dist.p5, 1)
    expect(dist.confidenceInterval90[1]).toBeCloseTo(dist.p95, 1)
  })

  test('should respect sample size', () => {
    const dist = generateBrixDistribution(12.0, {}, 100)

    expect(dist.monteCarloParams?.nSamples).toBe(100)
  })
})

describe('Confidence Score Derivation', () => {
  test('should derive high confidence from narrow distribution', () => {
    const dist = generateBrixDistribution(12.0, { cultivarVariance: 0.2 }, 1000)
    const confidence = deriveConfidenceScore(dist, 12.0)

    expect(confidence).toBeGreaterThan(0.8)  // Narrow → high confidence
  })

  test('should derive low confidence from wide distribution', () => {
    const dist = generateBrixDistribution(12.0, { cultivarVariance: 1.5 }, 1000)
    const confidence = deriveConfidenceScore(dist, 12.0)

    expect(confidence).toBeLessThan(0.7)  // Wide → lower confidence
  })

  test('should be bounded [0.5, 0.99]', () => {
    const narrowDist = generateBrixDistribution(12.0, { cultivarVariance: 0.05 }, 1000)
    const wideDist = generateBrixDistribution(12.0, { cultivarVariance: 5.0 }, 1000)

    const highConf = deriveConfidenceScore(narrowDist, 12.0)
    const lowConf = deriveConfidenceScore(wideDist, 12.0)

    expect(highConf).toBeLessThanOrEqual(0.99)
    expect(lowConf).toBeGreaterThanOrEqual(0.5)
  })
})

describe('Quality Tier from Distribution', () => {
  const thresholds = { artisan: 14, premium: 12, standard: 10 }

  test('should use p25 (conservative) for classification', () => {
    const dist = generateBrixDistribution(13.0, {}, 1000)

    const tier = classifyQualityTierFromDistribution(dist, thresholds)

    // Uses p25, not mean, for conservative classification
    expect(['premium', 'standard', 'commodity']).toContain(tier)
  })

  test('should classify artisan for high p25', () => {
    // Narrow distribution, high mean → p25 likely > 14
    const dist = generateBrixDistribution(15.0, { cultivarVariance: 0.3 }, 1000)

    const tier = classifyQualityTierFromDistribution(dist, thresholds)

    expect(tier).toBe('artisan')
  })

  test('should classify commodity for low p25', () => {
    const dist = generateBrixDistribution(9.0, {}, 1000)

    const tier = classifyQualityTierFromDistribution(dist, thresholds)

    expect(tier).toBe('commodity')
  })
})

describe('Parametric Distribution', () => {
  test('should create normal distribution', () => {
    const dist = createParametricDistribution(12.0, 1.0, 'normal')

    expect(dist.mean).toBe(12.0)
    expect(dist.stdDev).toBe(1.0)
    expect(dist.method).toBe('parametric')
  })

  test('should have correct percentiles for normal', () => {
    const dist = createParametricDistribution(100, 15, 'normal')

    // Normal: p50 = mean
    expect(dist.p50).toBe(100)

    // p25/p75 should be ~±0.674 stdDev from mean
    expect(dist.p25).toBeCloseTo(100 - 0.674 * 15, 1)
    expect(dist.p75).toBeCloseTo(100 + 0.674 * 15, 1)
  })

  test('should constrain to non-negative Brix', () => {
    const dist = createParametricDistribution(2.0, 5.0, 'normal')

    // Even though mean-3*std would be negative, p5 should be >= 0
    expect(dist.p5).toBeGreaterThanOrEqual(0)
  })
})

describe('Empirical Distribution', () => {
  test('should create from measurements', () => {
    const measurements = [11.5, 12.0, 12.2, 12.5, 13.0]
    const dist = createEmpiricalDistribution(measurements, 'test_lab')

    expect(dist.method).toBe('empirical')
    expect(dist.empiricalParams?.nMeasurements).toBe(5)
  })

  test('should calculate correct percentiles', () => {
    const measurements = Array.from({ length: 100 }, (_, i) => 10 + i * 0.1)
    const dist = createEmpiricalDistribution(measurements, 'test')

    expect(dist.p50).toBeCloseTo(14.5, 1)  // Median of 10-19.9
  })

  test('should throw on empty dataset', () => {
    expect(() => createEmpiricalDistribution([], 'test')).toThrow()
  })
})

describe('Normal Inverse CDF', () => {
  test('should return value near 0 for p=0.5', () => {
    const z = normalInverseCDF(0.5)
    expect(Math.abs(z)).toBeLessThan(0.1)  // Close to 0
  })

  test('should be roughly symmetric', () => {
    const z025 = normalInverseCDF(0.25)
    const z075 = normalInverseCDF(0.75)

    // Should be opposite signs and similar magnitude
    expect(z025).toBeLessThan(0)
    expect(z075).toBeGreaterThan(0)
    expect(Math.abs(z025 + z075)).toBeLessThan(1)  // Roughly symmetric
  })

  test('should approximate standard normal bounds', () => {
    // p=0.05 should be negative (left tail)
    const z005 = normalInverseCDF(0.05)
    expect(z005).toBeLessThan(-1)
    expect(z005).toBeGreaterThan(-2)

    // p=0.95 should be positive (right tail)
    const z095 = normalInverseCDF(0.95)
    expect(z095).toBeGreaterThan(1)
    expect(z095).toBeLessThan(2)
  })
})

describe('Uncertainty Components', () => {
  test('should combine variances correctly', () => {
    const components = getUncertaintyComponents('washington_navel', 'indian_river_fl')

    expect(components.totalVariance).toBeGreaterThan(0)
    expect(components.totalStdDev).toBeGreaterThan(0)
    expect(components.totalStdDev).toBe(Math.sqrt(components.totalVariance))
  })

  test('should track which components used', () => {
    const components = getUncertaintyComponents('washington_navel', 'indian_river_fl')

    expect(components.componentsUsed).toContain('cultivarVariance')
    expect(components.componentsUsed).toContain('regionVariance')
  })
})
