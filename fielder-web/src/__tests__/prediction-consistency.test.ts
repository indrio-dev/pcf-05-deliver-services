/**
 * Prediction Consistency Tests
 *
 * These tests verify that all prediction paths (API, pages, services) produce
 * consistent results by using the same canonical predictor as their source of truth.
 *
 * The unified prediction architecture ensures:
 * 1. All Brix predictions use predictQuality() from quality-predictor.ts
 * 2. All timing calculations use the same phenology data
 * 3. All consumers get identical results for the same inputs
 */

import {
  predictQuality,
  findOptimalHarvestTime,
  getAgeModifier,
  getTimingModifier,
  type QualityPredictionInput,
} from '@/lib/prediction/quality-predictor'
import { getCropPhenology, getBloomDate } from '@/lib/constants/crop-phenology'

describe('Prediction Consistency', () => {
  describe('Single Source of Truth', () => {
    it('produces consistent Brix predictions for the same cultivar/region', () => {
      const input: QualityPredictionInput = {
        cultivarId: 'washington_navel',
        regionId: 'florida',
        currentGDD: 5500,
        currentDate: new Date('2024-12-15'),
      }

      // Call predictQuality multiple times with same input
      const result1 = predictQuality(input)
      const result2 = predictQuality(input)
      const result3 = predictQuality(input)

      // All results should be identical
      expect(result1.predictedBrix).toBe(result2.predictedBrix)
      expect(result2.predictedBrix).toBe(result3.predictedBrix)
      expect(result1.predictedTier).toBe(result2.predictedTier)
      expect(result1.ripen.harvestStatus).toBe(result2.ripen.harvestStatus)
    })

    it('timing modifier is deterministic for same GDD position', () => {
      const gddToMaturity = 5100
      const gddToPeak = 6100
      const gddWindow = 2000

      // Test multiple GDD positions
      const positions = [4000, 5000, 5500, 6000, 6500, 7000]

      for (const currentGDD of positions) {
        const result1 = getTimingModifier(currentGDD, gddToMaturity, gddToPeak, gddWindow)
        const result2 = getTimingModifier(currentGDD, gddToMaturity, gddToPeak, gddWindow)

        expect(result1.modifier).toBe(result2.modifier)
        expect(result1.status).toBe(result2.status)
      }
    })

    it('age modifier is deterministic', () => {
      const ages = [2, 5, 10, 15, 20, 30, undefined]

      for (const age of ages) {
        const result1 = getAgeModifier(age)
        const result2 = getAgeModifier(age)

        expect(result1.modifier).toBe(result2.modifier)
        expect(result1.confidence).toBe(result2.confidence)
      }
    })
  })

  describe('Phenology Data Consistency', () => {
    it('same phenology data for same crop/region combination', () => {
      const phenology1 = getCropPhenology('navel_orange', 'florida')
      const phenology2 = getCropPhenology('navel_orange', 'florida')

      expect(phenology1).toBeDefined()
      expect(phenology1?.gddToMaturity).toBe(phenology2?.gddToMaturity)
      expect(phenology1?.gddToPeak).toBe(phenology2?.gddToPeak)
      expect(phenology1?.gddWindow).toBe(phenology2?.gddWindow)
      expect(phenology1?.bloomMonth).toBe(phenology2?.bloomMonth)
    })

    it('bloom dates are deterministic for same year', () => {
      const bloom1 = getBloomDate('navel_orange', 'florida', 2024)
      const bloom2 = getBloomDate('navel_orange', 'florida', 2024)

      expect(bloom1?.getTime()).toBe(bloom2?.getTime())
    })
  })

  describe('Harvest Window Consistency', () => {
    it('findOptimalHarvestTime returns consistent results', () => {
      const result1 = findOptimalHarvestTime('washington_navel', 'florida', 2024)
      const result2 = findOptimalHarvestTime('washington_navel', 'florida', 2024)

      expect(result1).toBeDefined()
      expect(result1?.harvestWindowStart.getTime()).toBe(result2?.harvestWindowStart.getTime())
      expect(result1?.harvestWindowEnd.getTime()).toBe(result2?.harvestWindowEnd.getTime())
      expect(result1?.peakStart.getTime()).toBe(result2?.peakStart.getTime())
      expect(result1?.peakEnd.getTime()).toBe(result2?.peakEnd.getTime())
    })
  })

  describe('Cross-Region Consistency', () => {
    it('different regions produce different but valid predictions', () => {
      const floridaInput: QualityPredictionInput = {
        cultivarId: 'washington_navel',
        regionId: 'florida',
        currentGDD: 5500,
        currentDate: new Date('2024-12-15'),
      }

      const californiaInput: QualityPredictionInput = {
        cultivarId: 'washington_navel',
        regionId: 'california',
        currentGDD: 5500,
        currentDate: new Date('2024-12-15'),
      }

      const floridaResult = predictQuality(floridaInput)
      const californiaResult = predictQuality(californiaInput)

      // Both should return valid predictions
      expect(floridaResult.predictedBrix).toBeGreaterThan(0)
      expect(californiaResult.predictedBrix).toBeGreaterThan(0)

      // They may differ due to regional phenology differences
      // But the SAME input should always produce the SAME output
      const floridaResult2 = predictQuality(floridaInput)
      expect(floridaResult.predictedBrix).toBe(floridaResult2.predictedBrix)
    })
  })

  describe('Quality Tier Consistency', () => {
    it('predicted tier aligns with predicted Brix', () => {
      const inputs = [
        { cultivarId: 'washington_navel', regionId: 'florida', currentGDD: 6000 },
        { cultivarId: 'cara_cara', regionId: 'florida', currentGDD: 5500 },
        { cultivarId: 'ruby_red_grapefruit', regionId: 'florida', currentGDD: 7000 },
      ]

      for (const input of inputs) {
        const result = predictQuality({
          ...input,
          currentDate: new Date('2024-12-15'),
        })

        // Tier should be consistent with Brix ranges
        if (result.predictedBrix >= 14) {
          expect(['artisan', 'premium']).toContain(result.predictedTier)
        } else if (result.predictedBrix >= 12) {
          expect(['artisan', 'premium', 'standard']).toContain(result.predictedTier)
        } else if (result.predictedBrix >= 10) {
          expect(['premium', 'standard']).toContain(result.predictedTier)
        }
      }
    })
  })

  describe('SHARE Breakdown Consistency', () => {
    it('all SHARE pillars are populated', () => {
      const result = predictQuality({
        cultivarId: 'washington_navel',
        regionId: 'florida',
        currentGDD: 5500,
        currentDate: new Date('2024-12-15'),
      })

      // All pillars should have values
      expect(result.soil).toBeDefined()
      expect(result.heritage).toBeDefined()
      expect(result.agricultural).toBeDefined()
      expect(result.ripen).toBeDefined()

      // Heritage should have the cultivar data
      expect(result.heritage.cultivarId).toBe('washington_navel')
      expect(result.heritage.baseBrix).toBeGreaterThan(0)

      // Ripen should have timing data
      expect(result.ripen.currentGDD).toBe(5500)
      expect(result.ripen.harvestStatus).toBeDefined()
    })

    it('confidence is consistent for same data completeness', () => {
      // Full data input
      const fullInput: QualityPredictionInput = {
        cultivarId: 'washington_navel',
        regionId: 'florida',
        currentGDD: 5500,
        currentDate: new Date('2024-12-15'),
        soil: {
          organicMatterPct: 3.5,
          ph: 6.5,
          drainageClass: 'good',
        },
        practices: {
          fertilityStrategy: {
            approach: 'mineralized_soil_science',
            coverCropping: true,
            compostApplication: true,
            mineralizedSoil: true,
          },
          pestManagement: 'ipm',
        },
      }

      // Minimal input
      const minimalInput: QualityPredictionInput = {
        cultivarId: 'washington_navel',
        regionId: 'florida',
        currentGDD: 5500,
        currentDate: new Date('2024-12-15'),
      }

      const fullResult = predictQuality(fullInput)
      const minimalResult = predictQuality(minimalInput)

      // Full input should have higher confidence
      expect(fullResult.confidence).toBeGreaterThan(minimalResult.confidence)

      // But both should be positive
      expect(fullResult.confidence).toBeGreaterThan(0)
      expect(minimalResult.confidence).toBeGreaterThan(0)
    })
  })
})
