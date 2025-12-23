/**
 * Tests for Temporal Cultivar Inference
 */

import {
  inferCultivarsFromTiming,
  type CultivarProbability,
} from '@/lib/intelligence/temporal-cultivar-inference'

describe('Temporal Cultivar Inference', () => {
  test('should infer cultivar from GDD proximity', async () => {
    // Mock: CA Navel oranges, Dec 22, GDD 2900
    // Washington Navel (optimal 3200): ∆300 → high probability
    // Lane Late (optimal 4500): ∆1600 → low/zero probability

    const result = await inferCultivarsFromTiming(
      'navel_orange',
      'central_valley_ca',
      new Date('2025-12-22'),
      2900
    )

    expect(result.length).toBeGreaterThan(0)

    // Washington Navel should be primary (closest to its optimal GDD)
    const washington = result.find(c => c.cultivarId === 'washington_navel')
    expect(washington).toBeDefined()
    expect(washington?.probability).toBeGreaterThan(0.5)
    expect(washington?.reason).toMatch(/peak|season/)
  })

  test('should normalize probabilities to sum = 1.0', async () => {
    const result = await inferCultivarsFromTiming(
      'navel_orange',
      'central_valley_ca',
      new Date('2025-12-22'),
      3000
    )

    if (result.length === 0) return  // No cultivars in season

    const totalProb = result.reduce((sum, c) => sum + c.probability, 0)
    expect(totalProb).toBeCloseTo(1.0, 2)
  })

  test('should exclude cultivars outside harvest window', async () => {
    // Out of season date (e.g., August for FL citrus)
    const result = await inferCultivarsFromTiming(
      'navel_orange',
      'indian_river_fl',
      new Date('2025-08-15'),  // Summer - citrus not harvesting
      1500
    )

    // Should return empty or very low probabilities
    expect(result.length).toBe(0)
  })

  test('should score "at_peak" for GDD within 100 of optimal', async () => {
    const result = await inferCultivarsFromTiming(
      'navel_orange',
      'central_valley_ca',
      new Date('2025-12-22'),
      3180  // Very close to Washington Navel optimal 3200
    )

    const washington = result.find(c => c.cultivarId === 'washington_navel')
    expect(washington?.reason).toBe('at_peak')
    expect(washington?.gddDelta).toBeLessThan(100)
  })

  test('should handle early season (GDD < optimal)', async () => {
    const result = await inferCultivarsFromTiming(
      'navel_orange',
      'central_valley_ca',
      new Date('2025-11-15'),
      2700  // Below Washington Navel optimal 3200
    )

    const washington = result.find(c => c.cultivarId === 'washington_navel')
    if (washington) {
      expect(washington.reason).toMatch(/early|season/)
      expect(washington.currentGDD).toBeLessThan(washington.optimalGDD)
    }
  })

  test('should handle late season (GDD > optimal)', async () => {
    const result = await inferCultivarsFromTiming(
      'navel_orange',
      'central_valley_ca',
      new Date('2026-03-01'),
      3700  // Above Washington Navel optimal 3200
    )

    const washington = result.find(c => c.cultivarId === 'washington_navel')
    if (washington) {
      expect(washington.reason).toMatch(/tail/)
      expect(washington.currentGDD).toBeGreaterThan(washington.optimalGDD)
    }
  })

  test('should exclude explicitly-labeled cultivars', async () => {
    // Cara Cara is explicitly labeled (gets its own terminal entry)
    // So it shouldn't appear in generic "Navel" inference

    const result = await inferCultivarsFromTiming(
      'navel_orange',
      'central_valley_ca',
      new Date('2025-12-22'),
      3200
    )

    const caraCaraInGeneric = result.find(c => c.cultivarId === 'cara_cara')
    expect(caraCaraInGeneric).toBeUndefined()  // Not in generic "Navel" inference
  })

  test('should handle late-season cultivar taking over', async () => {
    // Mar 15: Early cultivars done, late cultivars at peak
    const result = await inferCultivarsFromTiming(
      'navel_orange',
      'central_valley_ca',
      new Date('2026-03-15'),
      4400  // Near Lane Late optimal 4500
    )

    const laneLate = result.find(c => c.cultivarId === 'lane_late')
    if (laneLate) {
      expect(laneLate.probability).toBeGreaterThan(0.5)  // Should dominate now
      expect(laneLate.reason).toMatch(/peak|season/)
    }
  })

  test('should provide reasoning for inference', async () => {
    const result = await inferCultivarsFromTiming(
      'navel_orange',
      'central_valley_ca',
      new Date('2025-12-22'),
      3000
    )

    for (const cultivar of result) {
      expect(cultivar.reason).toBeDefined()
      expect(cultivar.gddDelta).toBeGreaterThanOrEqual(0)
      expect(cultivar.inHarvestWindow).toBe(true)
    }
  })

  test('should handle no cultivars within GDD range', async () => {
    // Very early in season, no cultivars ready
    const result = await inferCultivarsFromTiming(
      'navel_orange',
      'central_valley_ca',
      new Date('2025-11-01'),
      1500  // Way too early (optimal GDD 3200-4500)
    )

    // Should return empty or very low probabilities
    expect(result.length).toBeLessThanOrEqual(1)
  })
})

describe('GDD Proximity Scoring', () => {
  test('should give higher probability to closer GDD', async () => {
    const result = await inferCultivarsFromTiming(
      'navel_orange',
      'central_valley_ca',
      new Date('2025-12-22'),
      3200  // Exactly at Washington Navel optimal
    )

    const washington = result.find(c => c.cultivarId === 'washington_navel')
    expect(washington?.probability).toBeGreaterThan(0.8)  // Very high (at optimal)
  })

  test('should score zero beyond 500 GDD threshold', async () => {
    // If GDD delta > 500, cultivar gets excluded
    const result = await inferCultivarsFromTiming(
      'navel_orange',
      'central_valley_ca',
      new Date('2025-11-01'),
      2500  // Washington at 3200: ∆700 > 500 threshold
    )

    const washington = result.find(c => c.cultivarId === 'washington_navel')
    expect(washington).toBeUndefined()  // Excluded (too far from optimal)
  })
})

describe('Integration with Prediction Pipeline', () => {
  test('should enable commodity baseline prediction', async () => {
    // Scenario: USDA terminal report "CA NAVEL" without cultivar specified
    // We use temporal inference to determine it's probably Washington Navel

    const cultivarProbs = await inferCultivarsFromTiming(
      'navel_orange',
      'central_valley_ca',
      new Date('2025-12-22'),
      3100
    )

    expect(cultivarProbs.length).toBeGreaterThan(0)

    const primary = cultivarProbs[0]
    expect(primary.cultivarId).toBeDefined()
    expect(primary.probability).toBeGreaterThan(0)

    // Can now use primary.cultivarId for predictQuality()
    expect(primary.cultivarId).toMatch(/navel/)
  })
})
