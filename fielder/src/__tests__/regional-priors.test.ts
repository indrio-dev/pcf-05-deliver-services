/**
 * Tests for Regional Practice Priors
 */

import {
  getRegionalPracticePrior,
  sampleFromPrior,
  applyRegionalPrior,
} from '@/lib/types/regional-priors'

import {
  getRegionalPracticePrior as getPriorFromConstants,
  REGIONAL_PRACTICE_PRIORS,
} from '@/lib/constants/regional-practice-priors'

describe('Regional Practice Priors System', () => {
  test('should have priors for major states', () => {
    expect(REGIONAL_PRACTICE_PRIORS.length).toBeGreaterThan(10)
  })

  test('should sample from distribution', () => {
    const dist = { 'a': 0.5, 'b': 0.5 }
    const sample = sampleFromPrior(dist)
    expect(['a', 'b']).toContain(sample)
  })

  test('should get prior for state', () => {
    const prior = getPriorFromConstants('state_ny', 'general')
    expect(prior).toBeDefined()
    expect(prior?.confidence).toBeGreaterThan(0)
  })

  test('should apply regional prior', () => {
    const prior = getPriorFromConstants('state_ca', 'general')
    const result = applyRegionalPrior(prior!, 'most_likely')
    expect(result.confidence).toBeGreaterThan(0)
  })

  test('should fallback to national default', () => {
    const prior = getPriorFromConstants('unknown_region', 'general')
    expect(prior?.regionId).toBe('national')
  })
})
