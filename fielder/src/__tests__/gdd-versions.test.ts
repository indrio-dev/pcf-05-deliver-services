/**
 * Tests for Versioned GDD Formulas
 */

import {
  calculateGDD_versioned,
  calculateCumulativeGDD_versioned,
  getRecommendedVersion,
  compareVersions,
  CURRENT_GDD_VERSION,
  GDD_VERSION_REGISTRY,
  type GDDFormulaParams,
  type GDDVersion,
} from '@/lib/prediction/gdd-versions'

describe('GDD Version Registry', () => {
  test('should have metadata for all versions', () => {
    expect(GDD_VERSION_REGISTRY.v1).toBeDefined()
    expect(GDD_VERSION_REGISTRY.v2).toBeDefined()
    expect(GDD_VERSION_REGISTRY.v3).toBeDefined()
  })

  test('should track deployment dates', () => {
    expect(GDD_VERSION_REGISTRY.v1.deployedDate).toBe('2024-12-01')
    expect(GDD_VERSION_REGISTRY.v2.deployedDate).toBe('2025-01-15')
    expect(GDD_VERSION_REGISTRY.v3.deployedDate).toBe('2025-02-01')
  })

  test('should show progressive MAE improvement', () => {
    const v1MAE = GDD_VERSION_REGISTRY.v1.meanAbsoluteError!
    const v2MAE = GDD_VERSION_REGISTRY.v2.meanAbsoluteError!
    const v3MAE = GDD_VERSION_REGISTRY.v3.meanAbsoluteError!

    expect(v2MAE).toBeLessThan(v1MAE)  // v2 better than v1
    expect(v3MAE).toBeLessThan(v2MAE)  // v3 better than v2
  })

  test('should have current version defined', () => {
    expect(CURRENT_GDD_VERSION).toBe('v3')
  })
})

describe('GDD v1: Simple Formula', () => {
  const params: GDDFormulaParams = { version: 'v1', baseTemp: 55 }

  test('should calculate basic GDD correctly', () => {
    const gdd = calculateGDD_versioned(80, 60, params)
    // avgTemp = 70, base = 55 → GDD = 15
    expect(gdd).toBe(15)
  })

  test('should return 0 when avgTemp below base', () => {
    const gdd = calculateGDD_versioned(50, 40, params)
    // avgTemp = 45, base = 55 → GDD = 0
    expect(gdd).toBe(0)
  })

  test('should handle extreme heat without cap', () => {
    const gdd = calculateGDD_versioned(105, 85, params)
    // avgTemp = 95, base = 55 → GDD = 40 (NO heat stress reduction in v1)
    expect(gdd).toBe(40)
  })
})

describe('GDD v2: Heat Stress Cap', () => {
  const params: GDDFormulaParams = {
    version: 'v2',
    baseTemp: 55,
    heatStressCap: 86
  }

  test('should cap temperatures above limit', () => {
    const gdd = calculateGDD_versioned(95, 75, params)
    // Capped: max=86, min=75 → avgTemp = 80.5, base = 55 → GDD = 25.5
    expect(gdd).toBe(25.5)
  })

  test('should not affect normal temperatures', () => {
    const gdd = calculateGDD_versioned(80, 60, params)
    // No capping needed: avgTemp = 70, base = 55 → GDD = 15
    expect(gdd).toBe(15)
  })

  test('should reduce GDD vs v1 in extreme heat', () => {
    const paramsV1: GDDFormulaParams = { version: 'v1', baseTemp: 55 }
    const paramsV2: GDDFormulaParams = { version: 'v2', baseTemp: 55, heatStressCap: 86 }

    const gddV1 = calculateGDD_versioned(105, 85, paramsV1)
    const gddV2 = calculateGDD_versioned(105, 85, paramsV2)

    expect(gddV2).toBeLessThan(gddV1)  // v2 prevents overestimation
  })

  test('should handle tomato heat sensitivity (86°F cap)', () => {
    const tomatoParams: GDDFormulaParams = {
      version: 'v2',
      baseTemp: 50,
      heatStressCap: 86
    }

    // Hot day: 98°F max, 72°F min
    const gdd = calculateGDD_versioned(98, 72, tomatoParams)
    // Capped: 86, 72 → avg 79 → GDD = 29 (not 35 from uncapped avg 85)
    expect(gdd).toBe(29)
  })
})

describe('GDD v3: Water Stress Modifier', () => {
  const params: GDDFormulaParams = {
    version: 'v3',
    baseTemp: 55,
    heatStressCap: 86,
    waterStressModifier: 0.8  // 20% reduction from water deficit
  }

  test('should reduce GDD by water stress factor', () => {
    const gdd = calculateGDD_versioned(80, 60, params)
    // Base GDD = 15, water stress = 0.8 → effective GDD = 12
    expect(gdd).toBe(12)
  })

  test('should handle no water stress (modifier = 1.0)', () => {
    const paramsNoStress: GDDFormulaParams = {
      ...params,
      waterStressModifier: 1.0
    }

    const gdd = calculateGDD_versioned(80, 60, paramsNoStress)
    expect(gdd).toBe(15)  // No reduction
  })

  test('should handle severe water stress (modifier = 0.5)', () => {
    const paramsSevere: GDDFormulaParams = {
      ...params,
      waterStressModifier: 0.5
    }

    const gdd = calculateGDD_versioned(80, 60, paramsSevere)
    expect(gdd).toBe(7.5)  // 50% reduction
  })

  test('should combine heat cap and water stress', () => {
    const extremeParams: GDDFormulaParams = {
      version: 'v3',
      baseTemp: 55,
      heatStressCap: 86,
      waterStressModifier: 0.7
    }

    const gdd = calculateGDD_versioned(100, 80, extremeParams)
    // Heat capped: 86, 80 → avg 83 → base GDD = 28
    // Water stress: 28 * 0.7 = 19.6
    expect(gdd).toBeCloseTo(19.6, 1)
  })
})

describe('Cumulative GDD Calculation', () => {
  test('should sum daily GDD correctly', () => {
    const dailyTemps = [
      { tMax: 75, tMin: 55, date: new Date('2025-03-01') },
      { tMax: 78, tMin: 58, date: new Date('2025-03-02') },
      { tMax: 72, tMin: 52, date: new Date('2025-03-03') },
    ]

    const params: GDDFormulaParams = { version: 'v1', baseTemp: 55 }
    const result = calculateCumulativeGDD_versioned(dailyTemps, params)

    // Day 1: avg 65 → 10
    // Day 2: avg 68 → 13
    // Day 3: avg 62 → 7
    // Total: 30
    expect(result.cumulativeGDD).toBe(30)
    expect(result.dailyGDD.length).toBe(3)
    expect(result.version).toBe('v1')
  })

  test('should track daily GDD values', () => {
    const dailyTemps = [
      { tMax: 80, tMin: 60, date: new Date('2025-03-01') },
      { tMax: 82, tMin: 62, date: new Date('2025-03-02') },
    ]

    const params: GDDFormulaParams = { version: 'v1', baseTemp: 55 }
    const result = calculateCumulativeGDD_versioned(dailyTemps, params)

    expect(result.dailyGDD[0].gdd).toBe(15)  // (80+60)/2 - 55
    expect(result.dailyGDD[1].gdd).toBe(17)  // (82+62)/2 - 55
  })

  test('should respect heat cap in cumulative calculation', () => {
    const dailyTemps = [
      { tMax: 95, tMin: 75, date: new Date('2025-07-01') },
      { tMax: 98, tMin: 78, date: new Date('2025-07-02') },
    ]

    const paramsV2: GDDFormulaParams = {
      version: 'v2',
      baseTemp: 50,
      heatStressCap: 86
    }

    const result = calculateCumulativeGDD_versioned(dailyTemps, paramsV2)

    // Both days capped: (86+75)/2 - 50 = 30.5, (86+78)/2 - 50 = 32
    expect(result.cumulativeGDD).toBeCloseTo(62.5, 1)
  })
})

describe('Version Recommendations', () => {
  test('should recommend v3 for heat-sensitive crops', () => {
    expect(getRecommendedVersion('tomato', 'central_valley_ca')).toBe('v3')
    expect(getRecommendedVersion('lettuce', 'salinas_valley_ca')).toBe('v3')
    expect(getRecommendedVersion('strawberry', 'plant_city_fl')).toBe('v3')
  })

  test('should recommend v3 for drought-prone regions', () => {
    expect(getRecommendedVersion('orange', 'central_valley_ca')).toBe('v3')
    expect(getRecommendedVersion('grapefruit', 'rio_grande_tx')).toBe('v3')
    expect(getRecommendedVersion('avocado', 'southern_ca')).toBe('v3')
  })

  test('should use current version for normal crops', () => {
    expect(getRecommendedVersion('apple', 'hudson_valley_ny')).toBe('v3')
    expect(getRecommendedVersion('peach', 'middle_ga')).toBe('v3')
  })
})

describe('Version Comparison', () => {
  test('should compare all versions', () => {
    const results = compareVersions(85, 65, 55, 'orange', 'indian_river_fl')

    expect(results.length).toBe(3)
    expect(results[0].version).toBe('v1')
    expect(results[1].version).toBe('v2')
    expect(results[2].version).toBe('v3')
  })

  test('should mark recommended version', () => {
    const results = compareVersions(90, 70, 50, 'tomato', 'central_valley_ca')

    const recommended = results.find(r => r.recommendedForCrop)
    expect(recommended?.version).toBe('v3')
  })

  test('should show progression under normal conditions', () => {
    const results = compareVersions(75, 55, 50, 'apple', 'wenatchee_wa')

    // Normal temps, no stress: all versions should be similar
    const v1GDD = results.find(r => r.version === 'v1')?.predictedBrix
    const v2GDD = results.find(r => r.version === 'v2')?.predictedBrix
    const v3GDD = results.find(r => r.version === 'v3')?.predictedBrix

    expect(v1GDD).toBeCloseTo(v2GDD!, 0.1)  // No heat stress
    expect(v2GDD! * 0.9).toBeCloseTo(v3GDD!, 1)  // v3 slightly lower (water stress)
  })
})

describe('Edge Cases', () => {
  test('should handle zero GDD days', () => {
    const params: GDDFormulaParams = { version: 'v1', baseTemp: 55 }
    const gdd = calculateGDD_versioned(50, 40, params)
    expect(gdd).toBe(0)
  })

  test('should handle exact base temperature', () => {
    const params: GDDFormulaParams = { version: 'v1', baseTemp: 55 }
    const gdd = calculateGDD_versioned(55, 55, params)
    expect(gdd).toBe(0)
  })

  test('should throw on unknown version', () => {
    const params = { version: 'v99' as GDDVersion, baseTemp: 55 }
    expect(() => calculateGDD_versioned(80, 60, params)).toThrow('Unknown GDD version')
  })

  test('should handle negative water stress modifier gracefully', () => {
    const params: GDDFormulaParams = {
      version: 'v3',
      baseTemp: 55,
      waterStressModifier: -0.5  // Invalid, but shouldn't crash
    }

    const gdd = calculateGDD_versioned(80, 60, params)
    expect(gdd).toBeGreaterThanOrEqual(0)  // Constrained to non-negative
  })

  test('should handle water stress > 1.0 (over-watered)', () => {
    const params: GDDFormulaParams = {
      version: 'v3',
      baseTemp: 55,
      waterStressModifier: 1.2  // Excess water
    }

    const gdd = calculateGDD_versioned(80, 60, params)
    // Base GDD = 15, modifier = 1.2 → 18
    expect(gdd).toBe(18)
  })
})

describe('Real-World Scenarios', () => {
  test('Florida citrus in mild winter (v1 vs v2 similar)', () => {
    const paramsV1: GDDFormulaParams = { version: 'v1', baseTemp: 55 }
    const paramsV2: GDDFormulaParams = { version: 'v2', baseTemp: 55, heatStressCap: 90 }

    const gddV1 = calculateGDD_versioned(75, 60, paramsV1)
    const gddV2 = calculateGDD_versioned(75, 60, paramsV2)

    expect(gddV1).toBe(gddV2)  // No heat stress, both = 12.5
  })

  test('Florida citrus in hot summer (v2 reduces)', () => {
    const paramsV1: GDDFormulaParams = { version: 'v1', baseTemp: 55 }
    const paramsV2: GDDFormulaParams = { version: 'v2', baseTemp: 55, heatStressCap: 90 }

    const gddV1 = calculateGDD_versioned(96, 78, paramsV1)
    const gddV2 = calculateGDD_versioned(96, 78, paramsV2)

    expect(gddV2).toBeLessThan(gddV1)  // v2 caps heat contribution
  })

  test('California drought year (v3 reduces)', () => {
    const paramsV2: GDDFormulaParams = {
      version: 'v2',
      baseTemp: 55,
      heatStressCap: 90
    }

    const paramsV3: GDDFormulaParams = {
      version: 'v3',
      baseTemp: 55,
      heatStressCap: 90,
      waterStressModifier: 0.6  // 40% precipitation deficit
    }

    const gddV2 = calculateGDD_versioned(85, 65, paramsV2)
    const gddV3 = calculateGDD_versioned(85, 65, paramsV3)

    expect(gddV3).toBe(gddV2 * 0.6)  // Water stress reduces accumulation
  })

  test('Season-long accumulation comparison', () => {
    // Simulate 30 days
    const dailyTemps = Array.from({ length: 30 }, (_, i) => ({
      tMax: 80 + Math.sin(i / 5) * 10,
      tMin: 60 + Math.sin(i / 5) * 8,
      date: new Date(2025, 2, i + 1)
    }))

    const paramsV1: GDDFormulaParams = { version: 'v1', baseTemp: 55 }
    const paramsV3: GDDFormulaParams = {
      version: 'v3',
      baseTemp: 55,
      heatStressCap: 90,
      waterStressModifier: 0.85
    }

    const resultV1 = calculateCumulativeGDD_versioned(dailyTemps, paramsV1)
    const resultV3 = calculateCumulativeGDD_versioned(dailyTemps, paramsV3)

    expect(resultV3.cumulativeGDD).toBeLessThan(resultV1.cumulativeGDD)
    expect(resultV3.cumulativeGDD).toBeGreaterThan(resultV1.cumulativeGDD * 0.7)
  })
})

describe('Crop-Specific Recommendations', () => {
  test('should recommend v3 for all heat-sensitive crops', () => {
    const heatSensitive = ['tomato', 'lettuce', 'strawberry', 'spinach']

    for (const crop of heatSensitive) {
      const version = getRecommendedVersion(crop, 'any_region')
      expect(version).toBe('v3')
    }
  })

  test('should recommend v3 for drought-prone regions', () => {
    const droughtRegions = ['central_valley_ca', 'rio_grande_tx', 'southern_ca']

    for (const region of droughtRegions) {
      const version = getRecommendedVersion('orange', region)
      expect(version).toBe('v3')
    }
  })

  test('should default to current version for standard crops', () => {
    const version = getRecommendedVersion('blueberry', 'traverse_city_mi')
    expect(version).toBe(CURRENT_GDD_VERSION)
  })
})

describe('Performance Tracking', () => {
  test('should track MAE for each version', () => {
    expect(GDD_VERSION_REGISTRY.v1.meanAbsoluteError).toBe(2.8)
    expect(GDD_VERSION_REGISTRY.v2.meanAbsoluteError).toBe(2.1)
    expect(GDD_VERSION_REGISTRY.v3.meanAbsoluteError).toBe(1.8)
  })

  test('should calculate improvement percentage', () => {
    const v1MAE = GDD_VERSION_REGISTRY.v1.meanAbsoluteError!
    const v3MAE = GDD_VERSION_REGISTRY.v3.meanAbsoluteError!

    const improvementPct = ((v1MAE - v3MAE) / v1MAE) * 100

    expect(improvementPct).toBeCloseTo(35.7, 1)  // ~36% improvement v1→v3
  })
})
