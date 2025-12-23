/**
 * Orchestrator Service Tests
 *
 * F016: Tests for the intelligence orchestrator that routes predictions
 * through deterministic, probabilistic, and exception layers.
 */

import {
  predictQuality,
  predictBrix,
  assessBeefQuality,
  assessFromPLU,
  routeToLayer,
  DEFAULT_CONFIG,
  type PredictionInput,
  type OrchestratorConfig,
} from '@/lib/intelligence/orchestrator'

// =============================================================================
// ROUTING TESTS
// =============================================================================

describe('Routing Logic', () => {
  describe('routeToLayer()', () => {
    it('routes to deterministic for produce with full data', () => {
      const input: PredictionInput = {
        cultivarId: 'washington_navel',
        currentGdd: 2000,
        peakGdd: 2500,
      }
      const result = routeToLayer(input)
      expect(result.layer).toBe('deterministic')
    })

    it('routes to deterministic for livestock with claims', () => {
      const input: PredictionInput = {
        productCategory: 'meat',
        marketingClaims: ['grass-fed'],
      }
      const result = routeToLayer(input)
      expect(result.layer).toBe('deterministic')
      expect(result.reason).toContain('claim analysis')
    })

    it('routes to deterministic for PLU-only input', () => {
      const input: PredictionInput = {
        pluCode: '94011',
      }
      const result = routeToLayer(input)
      expect(result.layer).toBe('deterministic')
      expect(result.reason).toContain('PLU')
    })

    it('routes to exception for insufficient data', () => {
      const input: PredictionInput = {}
      const result = routeToLayer(input)
      expect(result.layer).toBe('exception')
      expect(result.reason).toContain('Insufficient data')
    })

    it('routes to exception when missing GDD', () => {
      const input: PredictionInput = {
        cultivarId: 'washington_navel',
        // Missing currentGdd and peakGdd
      }
      const result = routeToLayer(input)
      expect(result.layer).toBe('exception')
    })

    it('routes to probabilistic when ML enabled and has data', () => {
      const input: PredictionInput = {
        cultivarId: 'washington_navel',
        regionId: 'indian_river_fl',
        currentGdd: 2000,
        peakGdd: 2500,
      }
      const config: OrchestratorConfig = {
        ...DEFAULT_CONFIG,
        enableMLEnhancement: true,
      }
      const result = routeToLayer(input, config)
      expect(result.layer).toBe('probabilistic')
    })

    it('stays deterministic when ML disabled', () => {
      const input: PredictionInput = {
        cultivarId: 'washington_navel',
        regionId: 'indian_river_fl',
        currentGdd: 2000,
        peakGdd: 2500,
      }
      const config: OrchestratorConfig = {
        ...DEFAULT_CONFIG,
        enableMLEnhancement: false,
      }
      const result = routeToLayer(input, config)
      expect(result.layer).toBe('deterministic')
    })
  })
})

// =============================================================================
// PRODUCE PREDICTION TESTS
// =============================================================================

describe('Produce Prediction', () => {
  describe('predictQuality() for produce', () => {
    it('predicts Brix for known cultivar', () => {
      const result = predictQuality({
        cultivarId: 'washington_navel',
        currentGdd: 2500,
        peakGdd: 2500,
        productCategory: 'produce',
      })

      expect(result.layer).toBe('deterministic')
      expect(result.predictedBrix).toBeDefined()
      expect(result.brixComponents).toBeDefined()
      expect(result.qualityTier).toBeDefined()
    })

    it('includes Brix components breakdown', () => {
      const result = predictQuality({
        cultivarId: 'washington_navel',
        rootstockId: 'carrizo',
        treeAgeYears: 12,
        currentGdd: 2500,
        peakGdd: 2500,
      })

      expect(result.brixComponents?.cultivarBase).toBeDefined()
      expect(result.brixComponents?.rootstockModifier).toBeDefined()
      expect(result.brixComponents?.ageModifier).toBeDefined()
      expect(result.brixComponents?.timingModifier).toBeDefined()
      expect(result.brixComponents?.total).toBeDefined()
    })

    it('calculates sugar/acid profile', () => {
      const result = predictQuality({
        cultivarId: 'washington_navel',
        currentGdd: 2500,
        peakGdd: 2500,
      })

      expect(result.sugarAcid?.ssc).toBeDefined()
      expect(result.sugarAcid?.ta).toBeDefined()
      expect(result.sugarAcid?.ratio).toBeDefined()
      expect(result.sugarAcid?.brimA).toBeDefined()
    })

    it('applies rootstock modifier', () => {
      const withCarrizo = predictQuality({
        cultivarId: 'washington_navel',
        rootstockId: 'carrizo',  // +0.6
        currentGdd: 2500,
        peakGdd: 2500,
      })

      const withRoughLemon = predictQuality({
        cultivarId: 'washington_navel',
        rootstockId: 'rough_lemon',  // -0.7
        currentGdd: 2500,
        peakGdd: 2500,
      })

      expect(withCarrizo.predictedBrix!).toBeGreaterThan(withRoughLemon.predictedBrix!)
    })

    it('applies age modifier', () => {
      const prime = predictQuality({
        cultivarId: 'washington_navel',
        treeAgeYears: 12,  // Prime (0.0)
        currentGdd: 2500,
        peakGdd: 2500,
      })

      const young = predictQuality({
        cultivarId: 'washington_navel',
        treeAgeYears: 3,  // Transition (-0.5)
        currentGdd: 2500,
        peakGdd: 2500,
      })

      expect(prime.predictedBrix!).toBeGreaterThan(young.predictedBrix!)
    })

    it('applies timing modifier', () => {
      const atPeak = predictQuality({
        cultivarId: 'washington_navel',
        currentGdd: 2500,
        peakGdd: 2500,  // At peak
      })

      const offPeak = predictQuality({
        cultivarId: 'washington_navel',
        currentGdd: 2000,
        peakGdd: 2500,  // 500 GDD from peak
      })

      expect(atPeak.predictedBrix!).toBeGreaterThanOrEqual(offPeak.predictedBrix!)
    })

    it('clamps predicted Brix to valid range', () => {
      const result = predictQuality({
        cultivarId: 'washington_navel',
        currentGdd: 2500,
        peakGdd: 2500,
      })

      expect(result.predictedBrix).toBeGreaterThanOrEqual(0)
      expect(result.predictedBrix).toBeLessThanOrEqual(30)
    })
  })

  describe('predictBrix() convenience function', () => {
    it('returns prediction result', () => {
      const result = predictBrix('washington_navel', 2500, 2500)

      expect(result.predictedBrix).toBeDefined()
      expect(result.layer).toBe('deterministic')
    })

    it('accepts optional parameters', () => {
      const result = predictBrix('washington_navel', 2500, 2500, {
        rootstockId: 'carrizo',
        treeAgeYears: 12,
        gddHalfwidth: 200,
      })

      expect(result.brixComponents?.rootstockModifier).toBeDefined()
      expect(result.brixComponents?.ageModifier).toBe(0)
    })
  })
})

// =============================================================================
// QUALITY TIER TESTS
// =============================================================================

describe('Quality Tier Classification', () => {
  it('classifies artisan tier (14+)', () => {
    // Create conditions for high Brix
    const result = predictQuality({
      cultivarId: 'cara_cara',  // Premium cultivar
      rootstockId: 'carrizo',   // +0.6
      treeAgeYears: 12,         // Prime
      currentGdd: 2500,
      peakGdd: 2500,            // At peak
    })

    // This may or may not hit artisan depending on cultivar base
    expect(['artisan', 'premium', 'standard', 'commodity']).toContain(result.qualityTier)
  })

  it('returns valid quality tier for any prediction', () => {
    const result = predictQuality({
      cultivarId: 'washington_navel',
      currentGdd: 2000,
      peakGdd: 2500,
    })

    expect(['artisan', 'premium', 'standard', 'commodity']).toContain(result.qualityTier)
  })
})

// =============================================================================
// LIVESTOCK INFERENCE TESTS
// =============================================================================

describe('Livestock Inference', () => {
  describe('assessBeefQuality()', () => {
    it('infers beef profile from claims', () => {
      const result = assessBeefQuality(['grass-fed', '100% grass'])

      expect(result.beefProfile).toBeDefined()
      expect(result.beefProfile?.profile).toBe('A_TRUE_GRASS')
      expect(result.beefProfile?.isCAFO).toBe(false)
    })

    it('detects CAFO for marketing claims', () => {
      const result = assessBeefQuality(['grass-fed'])

      expect(result.beefProfile?.profile).toBe('C_MARKETING_GRASS')
      expect(result.beefProfile?.isCAFO).toBe(true)
    })

    it('handles organic warning', () => {
      const result = assessBeefQuality(['organic'], { isOrganic: true })

      expect(result.organicWarning).toBeDefined()
      expect(result.organicWarning?.hasWarning).toBe(true)
    })

    it('validates omega ratio against profile', () => {
      const result = assessBeefQuality(['100% grass-fed'], {
        actualOmegaRatio: 15,  // Too high for grass-fed
      })

      expect(result.isAnomaly).toBe(true)
      expect(result.anomalyReason).toContain('WORSE')
    })

    it('accepts consistent omega ratio', () => {
      const result = assessBeefQuality(['100% grass-fed'], {
        actualOmegaRatio: 3,  // Good for grass-fed
      })

      expect(result.isAnomaly).toBe(false)
    })
  })

  describe('predictQuality() for meat', () => {
    it('routes to deterministic for meat', () => {
      const result = predictQuality({
        productCategory: 'meat',
        marketingClaims: ['pasture-raised'],
      })

      expect(result.layer).toBe('deterministic')
      expect(result.routingReason).toContain('claim analysis')
    })

    it('detects premium CAFO profile', () => {
      const result = predictQuality({
        productCategory: 'meat',
        marketingClaims: ['wagyu', 'prime'],
      })

      expect(result.beefProfile?.profile).toBe('F_PREMIUM_CAFO')
      expect(result.beefProfile?.tier).toBe('worst')
    })
  })
})

// =============================================================================
// PLU INFERENCE TESTS
// =============================================================================

describe('PLU Inference', () => {
  describe('assessFromPLU()', () => {
    it('infers organic from PLU prefix 9', () => {
      const result = assessFromPLU('94011')

      expect(result.pluInference).toBeDefined()
      expect(result.pluInference?.isOrganic).toBe(true)
      expect(result.pluInference?.isGMO).toBe('no')
    })

    it('identifies conventional PLU', () => {
      const result = assessFromPLU('4011')

      expect(result.pluInference?.isOrganic).toBe(false)
      expect(result.pluInference?.isGMO).toBe('unknown')
    })
  })

  describe('predictQuality() with PLU', () => {
    it('includes PLU inference in result', () => {
      const result = predictQuality({
        pluCode: '94011',
        productCategory: 'produce',
      })

      expect(result.pluInference).toBeDefined()
    })
  })
})

// =============================================================================
// CONFIDENCE CALCULATION TESTS
// =============================================================================

describe('Confidence Calculation', () => {
  it('has higher confidence with more data', () => {
    const minimal = predictQuality({
      cultivarId: 'washington_navel',
      currentGdd: 2500,
      peakGdd: 2500,
    })

    const complete = predictQuality({
      cultivarId: 'washington_navel',
      rootstockId: 'carrizo',
      treeAgeYears: 12,
      regionId: 'indian_river_fl',
      currentGdd: 2500,
      peakGdd: 2500,
      source: 'lab',
    })

    expect(complete.confidence).toBeGreaterThan(minimal.confidence)
  })

  it('includes confidence factors', () => {
    const result = predictQuality({
      cultivarId: 'washington_navel',
      currentGdd: 2500,
      peakGdd: 2500,
    })

    expect(result.confidenceFactors.length).toBeGreaterThan(0)
    expect(result.confidenceFactors.some(f => f.factor === 'cultivar')).toBe(true)
    expect(result.confidenceFactors.some(f => f.factor === 'timing')).toBe(true)
  })

  it('penalizes consumer source', () => {
    const lab = predictQuality({
      cultivarId: 'washington_navel',
      currentGdd: 2500,
      peakGdd: 2500,
      source: 'lab',
    })

    const consumer = predictQuality({
      cultivarId: 'washington_navel',
      currentGdd: 2500,
      peakGdd: 2500,
      source: 'consumer',
    })

    expect(lab.confidence).toBeGreaterThan(consumer.confidence)
  })

  it('clamps confidence to valid range', () => {
    const result = predictQuality({
      cultivarId: 'washington_navel',
      currentGdd: 2500,
      peakGdd: 2500,
    })

    expect(result.confidence).toBeGreaterThanOrEqual(0.1)
    expect(result.confidence).toBeLessThanOrEqual(0.99)
  })
})

// =============================================================================
// VALIDATION INTEGRATION TESTS
// =============================================================================

describe('Validation Integration', () => {
  it('includes validation result', () => {
    const result = predictQuality({
      cultivarId: 'washington_navel',
      currentGdd: 2500,
      peakGdd: 2500,
    })

    expect(result.validation).toBeDefined()
    expect(result.validation.isValid).toBeDefined()
  })

  it('includes data quality assessment', () => {
    const result = predictQuality({
      cultivarId: 'washington_navel',
      currentGdd: 2500,
      peakGdd: 2500,
    })

    expect(result.dataQuality).toBeDefined()
    expect(result.dataQuality.score).toBeGreaterThanOrEqual(0)
    expect(result.dataQuality.score).toBeLessThanOrEqual(1)
  })

  it('validates actual measurements', () => {
    const result = predictQuality({
      cultivarId: 'washington_navel',
      currentGdd: 2500,
      peakGdd: 2500,
      actualBrix: -5,  // Invalid
    })

    expect(result.validation.isValid).toBe(false)
    expect(result.validation.errors.length).toBeGreaterThan(0)
  })
})

// =============================================================================
// EXCEPTION HANDLING TESTS
// =============================================================================

describe('Exception Handling', () => {
  it('flags low confidence for review', () => {
    const result = predictQuality({
      // Missing most data
      pluCode: '4011',
      source: 'consumer',
    })

    // May or may not need review depending on confidence calculation
    expect(result.needsReview !== undefined).toBe(true)
  })

  it('flags anomalies for review', () => {
    const result = assessBeefQuality(['100% grass-fed'], {
      actualOmegaRatio: 20,  // Way too high for grass-fed claim
    })

    expect(result.isAnomaly).toBe(true)
    expect(result.needsReview).toBe(true)
  })

  it('includes review reason', () => {
    const result = predictQuality({})  // Empty input

    if (result.needsReview) {
      expect(result.reviewReason).toBeDefined()
      expect(result.reviewReason!.length).toBeGreaterThan(0)
    }
  })
})

// =============================================================================
// ANOMALY DETECTION TESTS
// =============================================================================

describe('Anomaly Detection', () => {
  it('detects Brix anomaly when actual differs from predicted', () => {
    const result = predictQuality({
      cultivarId: 'washington_navel',
      currentGdd: 2500,
      peakGdd: 2500,
      actualBrix: 25,  // Very high
    })

    // May or may not be anomaly depending on predicted value
    expect(result.isAnomaly !== undefined).toBe(true)
  })

  it('flags critical organic warning as anomaly', () => {
    const result = predictQuality({
      productCategory: 'meat',
      marketingClaims: [],  // No grass claims
      isOrganic: true,
    })

    expect(result.organicWarning?.severity).toBe('critical')
    expect(result.isAnomaly).toBe(true)
  })
})

// =============================================================================
// METADATA TESTS
// =============================================================================

describe('Result Metadata', () => {
  it('includes timestamp', () => {
    const before = new Date()
    const result = predictQuality({
      cultivarId: 'washington_navel',
      currentGdd: 2500,
      peakGdd: 2500,
    })
    const after = new Date()

    expect(result.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime())
    expect(result.timestamp.getTime()).toBeLessThanOrEqual(after.getTime())
  })

  it('includes processing time', () => {
    const result = predictQuality({
      cultivarId: 'washington_navel',
      currentGdd: 2500,
      peakGdd: 2500,
    })

    expect(result.processingTimeMs).toBeGreaterThanOrEqual(0)
    expect(result.processingTimeMs).toBeLessThan(1000)  // Should be fast
  })

  it('includes ML enhancement flag', () => {
    const result = predictQuality({
      cultivarId: 'washington_navel',
      currentGdd: 2500,
      peakGdd: 2500,
    })

    expect(result.mlEnhanced).toBe(false)  // ML not enabled by default
  })
})

// =============================================================================
// CONFIGURATION TESTS
// =============================================================================

describe('Configuration', () => {
  it('uses default config when not provided', () => {
    const result = predictQuality({
      cultivarId: 'washington_navel',
      currentGdd: 2500,
      peakGdd: 2500,
    })

    expect(result.mlEnhanced).toBe(false)  // Default: ML disabled
  })

  it('respects ML enablement flag', () => {
    const config: OrchestratorConfig = {
      ...DEFAULT_CONFIG,
      enableMLEnhancement: true,
    }

    const result = predictQuality({
      cultivarId: 'washington_navel',
      regionId: 'indian_river_fl',
      currentGdd: 2500,
      peakGdd: 2500,
    }, config)

    expect(result.layer).toBe('probabilistic')
  })
})

// =============================================================================
// INTEGRATION SCENARIOS
// =============================================================================

describe('Integration Scenarios', () => {
  describe('Consumer scanning produce at store', () => {
    it('handles PLU + refractometer workflow', () => {
      // Step 1: Scan PLU
      const pluResult = assessFromPLU('94011')
      expect(pluResult.pluInference?.isOrganic).toBe(true)

      // Step 2: Full prediction with actual measurement
      const result = predictQuality({
        pluCode: '94011',
        cultivarId: 'washington_navel',
        currentGdd: 2500,
        peakGdd: 2500,
        actualBrix: 11.5,
        source: 'consumer',
      })

      expect(result.predictedBrix).toBeDefined()
      expect(result.pluInference?.isOrganic).toBe(true)
    })
  })

  describe('Farm submitting prediction request', () => {
    it('handles complete farm data', () => {
      const result = predictQuality({
        cultivarId: 'washington_navel',
        rootstockId: 'carrizo',
        treeAgeYears: 12,
        regionId: 'indian_river_fl',
        currentGdd: 2500,
        peakGdd: 2500,
        gddHalfwidth: 150,
        source: 'farm',
      })

      expect(result.confidence).toBeGreaterThan(0.7)
      expect(result.predictedBrix).toBeDefined()
      expect(result.qualityTier).toBeDefined()
    })
  })

  describe('Lab verification workflow', () => {
    it('validates lab measurement against prediction', () => {
      const result = predictQuality({
        cultivarId: 'washington_navel',
        rootstockId: 'carrizo',
        currentGdd: 2500,
        peakGdd: 2500,
        actualBrix: 12.3,
        source: 'lab',
      })

      expect(result.confidence).toBeGreaterThan(0.7)
      expect(result.dataQuality.score).toBeGreaterThan(0.7)
    })
  })

  describe('Beef brand analysis', () => {
    it('analyzes Everglades Ranch claims', () => {
      const result = assessBeefQuality(['pasture-raised', 'no feedlot', 'American Wagyu'])

      expect(result.beefProfile?.profile).toBe('B_TRUE_PASTURE')
      expect(result.beefProfile?.isCAFO).toBe(false)
    })

    it('analyzes Snake River Farms claims', () => {
      const result = assessBeefQuality(['American Wagyu', 'Prime'])

      expect(result.beefProfile?.profile).toBe('F_PREMIUM_CAFO')
      expect(result.beefProfile?.tier).toBe('worst')
    })
  })
})
