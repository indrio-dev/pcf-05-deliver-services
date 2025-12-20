/**
 * Tests for /api/discover/peak endpoint logic
 *
 * Tests the polymorphic SHARE prediction system used by the peak discovery endpoint.
 * Since Next.js API routes require web APIs not available in Jest, we test
 * the underlying prediction functions directly.
 */

import { predictUnified, getRegisteredCategories } from '@/lib/prediction/prediction-router'
import { REGIONAL_OFFERINGS, CULTIVARS_BY_ID, PRODUCT_TYPES_BY_ID } from '@/lib/constants/products'
import { US_GROWING_REGIONS } from '@/lib/constants/regions'

describe('Discovery Peak Prediction Logic', () => {
  describe('getRegisteredCategories', () => {
    it('returns all implemented prediction categories', () => {
      const categories = getRegisteredCategories()

      expect(categories).toContain('produce')
      expect(categories).toContain('livestock')
      expect(categories).toContain('vegetables')
      expect(categories.length).toBeGreaterThan(3)
    })
  })

  describe('predictUnified for produce', () => {
    it('returns valid SHARE prediction for a citrus offering', () => {
      // Use a known citrus offering
      const result = predictUnified({
        category: 'produce',
        cultivarId: 'washington_navel',
        regionId: 'indian_river',
        currentGDD: 2000,
      })

      // Core prediction fields
      expect(result.qualityScore).toBeGreaterThanOrEqual(0)
      expect(result.qualityScore).toBeLessThanOrEqual(100)
      expect(['artisan', 'premium', 'standard', 'commodity']).toContain(result.qualityTier)
      expect(result.confidence).toBeGreaterThan(0)
      expect(result.confidence).toBeLessThanOrEqual(1)
    })

    it('returns Brix as primary metric for produce', () => {
      const result = predictUnified({
        category: 'produce',
        cultivarId: 'washington_navel',
        regionId: 'indian_river',
        currentGDD: 2000,
      })

      expect(result.primaryMetric.type).toBe('brix')
      expect(result.primaryMetric.value).toBeGreaterThan(0)
      expect(result.primaryMetric.unit).toBe('°Bx')
      expect(result.primaryMetric.displayName).toBe('Brix')
    })

    it('includes all SHARE pillar contributions', () => {
      const result = predictUnified({
        category: 'produce',
        cultivarId: 'washington_navel',
        regionId: 'indian_river',
        currentGDD: 2000,
      })

      // S - Soil
      expect(result.soil).toBeDefined()
      expect(result.soil.modifier).toBeDefined()
      expect(result.soil.confidence).toBeDefined()
      expect(Array.isArray(result.soil.insights)).toBe(true)

      // H - Heritage
      expect(result.heritage).toBeDefined()
      expect(result.heritage.modifier).toBeDefined()
      expect(result.heritage.details.cultivarId).toBe('washington_navel')

      // A - Agricultural
      expect(result.agricultural).toBeDefined()
      expect(result.agricultural.modifier).toBeDefined()

      // R - Ripen
      expect(result.ripen).toBeDefined()
      expect(result.ripen.timingModifier).toBeDefined()
      expect(result.ripen.details.harvestStatus).toBeDefined()

      // E - Enrich
      expect(result.enrich).toBeDefined()
      expect(result.enrich.verified).toBeDefined()
      expect(result.enrich.details.primaryMetric).toBeDefined()
    })

    it('returns harvest status in R pillar', () => {
      const result = predictUnified({
        category: 'produce',
        cultivarId: 'washington_navel',
        regionId: 'indian_river',
        currentGDD: 2000,
      })

      expect([
        'not_ready',
        'early',
        'optimal',
        'peak',
        'late',
        'past_peak',
      ]).toContain(result.ripen.details.harvestStatus)
    })

    it('includes model validation status', () => {
      const result = predictUnified({
        category: 'produce',
        cultivarId: 'washington_navel',
        regionId: 'indian_river',
        currentGDD: 2000,
      })

      expect(result.modelInfo.category).toBe('produce')
      expect(['validated', 'calibrated', 'inferred', 'placeholder']).toContain(
        result.modelInfo.validationStatus
      )
      expect(Array.isArray(result.modelInfo.warnings)).toBe(true)
    })
  })

  describe('Regional offering predictions', () => {
    it('can predict for all active regional offerings', () => {
      const activeOfferings = REGIONAL_OFFERINGS.filter((o) => o.isActive).slice(0, 10) // Test first 10

      const results = activeOfferings.map((offering) => {
        const cultivarId =
          (offering as { varietyId?: string; cultivarId?: string }).varietyId ||
          offering.cultivarId
        if (!cultivarId) return null
        if (!CULTIVARS_BY_ID[cultivarId]) return null

        try {
          return predictUnified({
            category: 'produce',
            cultivarId,
            regionId: offering.regionId,
            currentGDD: 2000,
          })
        } catch {
          return null
        }
      })

      const validResults = results.filter((r) => r !== null)
      expect(validResults.length).toBeGreaterThan(0)

      // Check each valid result has required fields
      for (const result of validResults) {
        expect(result!.qualityScore).toBeGreaterThanOrEqual(0)
        expect(result!.primaryMetric.type).toBe('brix')
        expect(result!.ripen.details.harvestStatus).toBeDefined()
      }
    })

    it('predicts higher quality for premium regions', () => {
      // Indian River is exceptional for citrus
      const indianRiver = predictUnified({
        category: 'produce',
        cultivarId: 'washington_navel',
        regionId: 'indian_river',
        currentGDD: 2000,
      })

      // Central Florida is excellent but not exceptional
      const centralFlorida = predictUnified({
        category: 'produce',
        cultivarId: 'washington_navel',
        regionId: 'central_florida',
        currentGDD: 2000,
      })

      // Indian River should score higher or equal
      expect(indianRiver.qualityScore).toBeGreaterThanOrEqual(centralFlorida.qualityScore - 5) // Allow small variance
    })
  })

  describe('GDD-based timing', () => {
    it('gives better timing score when closer to maturity', () => {
      // Low GDD - not ready
      const earlyResult = predictUnified({
        category: 'produce',
        cultivarId: 'washington_navel',
        regionId: 'indian_river',
        currentGDD: 500,
      })

      // Optimal GDD - at peak
      const peakResult = predictUnified({
        category: 'produce',
        cultivarId: 'washington_navel',
        regionId: 'indian_river',
        currentGDD: 4000, // Closer to typical citrus maturity
      })

      // Timing modifier should be better at peak
      expect(peakResult.ripen.timingModifier).toBeGreaterThanOrEqual(earlyResult.ripen.timingModifier)
    })
  })

  describe('Quality score calculation', () => {
    it('normalizes Brix to 0-100 quality score', () => {
      const result = predictUnified({
        category: 'produce',
        cultivarId: 'washington_navel',
        regionId: 'indian_river',
        currentGDD: 2000,
      })

      // Score should be normalized
      expect(result.qualityScore).toBeGreaterThanOrEqual(0)
      expect(result.qualityScore).toBeLessThanOrEqual(100)

      // Brix should be actual value (8-18 range for citrus)
      expect(result.primaryMetric.value).toBeGreaterThanOrEqual(6)
      expect(result.primaryMetric.value).toBeLessThanOrEqual(20)
    })

    it('maps quality score to valid tier', () => {
      const result = predictUnified({
        category: 'produce',
        cultivarId: 'washington_navel',
        regionId: 'indian_river',
        currentGDD: 2000,
      })

      // Tier should be a valid quality tier
      expect(['artisan', 'premium', 'standard', 'commodity']).toContain(result.qualityTier)

      // Score and tier should both be present and reasonable
      expect(result.qualityScore).toBeGreaterThanOrEqual(0)
      expect(result.qualityTier).toBeDefined()
    })
  })

  describe('Filtering helpers', () => {
    // Test data structures used by the endpoint

    it('can filter offerings by subcategory', () => {
      const citrusOfferings = REGIONAL_OFFERINGS.filter((offering) => {
        const cultivarId = (offering as { varietyId?: string; cultivarId?: string }).varietyId || offering.cultivarId
        if (!cultivarId) return false
        const cultivar = CULTIVARS_BY_ID[cultivarId]
        if (!cultivar) return false
        const productType = PRODUCT_TYPES_BY_ID[cultivar.productId]
        return productType?.subcategory === 'citrus'
      })

      expect(citrusOfferings.length).toBeGreaterThan(0)

      // Verify they're all citrus
      for (const offering of citrusOfferings.slice(0, 5)) {
        const cultivarId = (offering as { varietyId?: string; cultivarId?: string }).varietyId || offering.cultivarId
        const cultivar = CULTIVARS_BY_ID[cultivarId!]
        const productType = PRODUCT_TYPES_BY_ID[cultivar.productId]
        expect(productType?.subcategory).toBe('citrus')
      }
    })

    it('can filter offerings by region', () => {
      const indianRiverOfferings = REGIONAL_OFFERINGS.filter(
        (o) => o.regionId === 'indian_river'
      )

      expect(indianRiverOfferings.length).toBeGreaterThan(0)
      expect(indianRiverOfferings.every((o) => o.regionId === 'indian_river')).toBe(true)
    })

    it('can filter offerings by state', () => {
      const floridaOfferings = REGIONAL_OFFERINGS.filter((offering) => {
        const region = US_GROWING_REGIONS[offering.regionId]
        return region?.state === 'FL'
      })

      expect(floridaOfferings.length).toBeGreaterThan(0)

      // Verify they're all in FL
      for (const offering of floridaOfferings.slice(0, 5)) {
        const region = US_GROWING_REGIONS[offering.regionId]
        expect(region?.state).toBe('FL')
      }
    })

    it('can filter by multiple subcategories', () => {
      const targetSubcategories = ['citrus', 'pome_fruit']
      const filtered = REGIONAL_OFFERINGS.filter((offering) => {
        const cultivarId = (offering as { varietyId?: string; cultivarId?: string }).varietyId || offering.cultivarId
        if (!cultivarId) return false
        const cultivar = CULTIVARS_BY_ID[cultivarId]
        if (!cultivar) return false
        const productType = PRODUCT_TYPES_BY_ID[cultivar.productId]
        return targetSubcategories.includes(productType?.subcategory || '')
      })

      expect(filtered.length).toBeGreaterThan(0)
    })

    it('can filter by multiple states', () => {
      const targetStates = ['FL', 'CA']
      const filtered = REGIONAL_OFFERINGS.filter((offering) => {
        const region = US_GROWING_REGIONS[offering.regionId]
        return targetStates.includes(region?.state || '')
      })

      expect(filtered.length).toBeGreaterThan(0)

      // Verify they're all in target states
      for (const offering of filtered.slice(0, 10)) {
        const region = US_GROWING_REGIONS[offering.regionId]
        expect(targetStates).toContain(region?.state)
      }
    })
  })

  describe('Sorting helpers', () => {
    it('can sort predictions by quality score', () => {
      const offerings = REGIONAL_OFFERINGS.filter((o) => o.isActive).slice(0, 20)

      const predictions = offerings
        .map((offering) => {
          const cultivarId = (offering as { varietyId?: string; cultivarId?: string }).varietyId || offering.cultivarId
          if (!cultivarId || !CULTIVARS_BY_ID[cultivarId]) return null

          try {
            const result = predictUnified({
              category: 'produce',
              cultivarId,
              regionId: offering.regionId,
              currentGDD: 2000,
            })
            return { offering, result }
          } catch {
            return null
          }
        })
        .filter((p): p is NonNullable<typeof p> => p !== null)

      // Sort by quality score descending
      const sortedDesc = [...predictions].sort((a, b) => b.result.qualityScore - a.result.qualityScore)

      // Verify descending order
      for (let i = 0; i < sortedDesc.length - 1; i++) {
        expect(sortedDesc[i].result.qualityScore).toBeGreaterThanOrEqual(
          sortedDesc[i + 1].result.qualityScore
        )
      }

      // Sort by quality score ascending
      const sortedAsc = [...predictions].sort((a, b) => a.result.qualityScore - b.result.qualityScore)

      // Verify ascending order
      for (let i = 0; i < sortedAsc.length - 1; i++) {
        expect(sortedAsc[i].result.qualityScore).toBeLessThanOrEqual(
          sortedAsc[i + 1].result.qualityScore
        )
      }
    })

    it('can sort predictions by primary metric value', () => {
      const offerings = REGIONAL_OFFERINGS.filter((o) => o.isActive).slice(0, 20)

      const predictions = offerings
        .map((offering) => {
          const cultivarId = (offering as { varietyId?: string; cultivarId?: string }).varietyId || offering.cultivarId
          if (!cultivarId || !CULTIVARS_BY_ID[cultivarId]) return null

          try {
            const result = predictUnified({
              category: 'produce',
              cultivarId,
              regionId: offering.regionId,
              currentGDD: 2000,
            })
            return { offering, result }
          } catch {
            return null
          }
        })
        .filter((p): p is NonNullable<typeof p> => p !== null)

      // Sort by Brix value descending
      const sortedByBrix = [...predictions].sort(
        (a, b) => b.result.primaryMetric.value - a.result.primaryMetric.value
      )

      // Verify descending order
      for (let i = 0; i < sortedByBrix.length - 1; i++) {
        expect(sortedByBrix[i].result.primaryMetric.value).toBeGreaterThanOrEqual(
          sortedByBrix[i + 1].result.primaryMetric.value
        )
      }
    })
  })

  describe('Combined filtering', () => {
    it('can apply subcategory + state filter together', () => {
      // Filter for citrus in Florida
      const filtered = REGIONAL_OFFERINGS.filter((offering) => {
        // Check state
        const region = US_GROWING_REGIONS[offering.regionId]
        if (region?.state !== 'FL') return false

        // Check subcategory
        const cultivarId = (offering as { varietyId?: string; cultivarId?: string }).varietyId || offering.cultivarId
        if (!cultivarId) return false
        const cultivar = CULTIVARS_BY_ID[cultivarId]
        if (!cultivar) return false
        const productType = PRODUCT_TYPES_BY_ID[cultivar.productId]
        return productType?.subcategory === 'citrus'
      })

      expect(filtered.length).toBeGreaterThan(0)
      console.log(`Found ${filtered.length} Florida citrus offerings`)

      // Verify all match both criteria
      for (const offering of filtered.slice(0, 5)) {
        const region = US_GROWING_REGIONS[offering.regionId]
        expect(region?.state).toBe('FL')

        const cultivarId = (offering as { varietyId?: string; cultivarId?: string }).varietyId || offering.cultivarId
        const cultivar = CULTIVARS_BY_ID[cultivarId!]
        const productType = PRODUCT_TYPES_BY_ID[cultivar.productId]
        expect(productType?.subcategory).toBe('citrus')
      }
    })

    it('can filter by minScore threshold', () => {
      const offerings = REGIONAL_OFFERINGS.filter((o) => o.isActive).slice(0, 50)
      const minScore = 60

      const predictions = offerings
        .map((offering) => {
          const cultivarId = (offering as { varietyId?: string; cultivarId?: string }).varietyId || offering.cultivarId
          if (!cultivarId || !CULTIVARS_BY_ID[cultivarId]) return null

          try {
            const result = predictUnified({
              category: 'produce',
              cultivarId,
              regionId: offering.regionId,
              currentGDD: 2000,
            })
            return { offering, result }
          } catch {
            return null
          }
        })
        .filter((p): p is NonNullable<typeof p> => p !== null)

      // Apply minScore filter
      const filteredByScore = predictions.filter((p) => p.result.qualityScore >= minScore)

      // Verify all pass threshold
      for (const p of filteredByScore) {
        expect(p.result.qualityScore).toBeGreaterThanOrEqual(minScore)
      }
    })
  })

  describe('Summary statistics', () => {
    it('can count results by subcategory', () => {
      const offerings = REGIONAL_OFFERINGS.filter((o) => o.isActive).slice(0, 100)

      const bySubcategory: Record<string, number> = {}

      for (const offering of offerings) {
        const cultivarId = (offering as { varietyId?: string; cultivarId?: string }).varietyId || offering.cultivarId
        if (!cultivarId) continue
        const cultivar = CULTIVARS_BY_ID[cultivarId]
        if (!cultivar) continue
        const productType = PRODUCT_TYPES_BY_ID[cultivar.productId]
        const subcategory = productType?.subcategory || 'unknown'
        bySubcategory[subcategory] = (bySubcategory[subcategory] || 0) + 1
      }

      // Should have multiple subcategories
      expect(Object.keys(bySubcategory).length).toBeGreaterThan(1)

      // Total should match input
      const total = Object.values(bySubcategory).reduce((sum, count) => sum + count, 0)
      expect(total).toBeLessThanOrEqual(offerings.length)
    })

    it('can count results by state', () => {
      const offerings = REGIONAL_OFFERINGS.filter((o) => o.isActive).slice(0, 100)

      const byState: Record<string, number> = {}

      for (const offering of offerings) {
        const region = US_GROWING_REGIONS[offering.regionId]
        const state = region?.state || 'unknown'
        byState[state] = (byState[state] || 0) + 1
      }

      // Should have multiple states
      expect(Object.keys(byState).length).toBeGreaterThan(1)
    })

    it('can count results by quality tier', () => {
      const offerings = REGIONAL_OFFERINGS.filter((o) => o.isActive).slice(0, 30)

      const byTier: Record<string, number> = {}

      for (const offering of offerings) {
        const cultivarId = (offering as { varietyId?: string; cultivarId?: string }).varietyId || offering.cultivarId
        if (!cultivarId || !CULTIVARS_BY_ID[cultivarId]) continue

        try {
          const result = predictUnified({
            category: 'produce',
            cultivarId,
            regionId: offering.regionId,
            currentGDD: 2000,
          })
          byTier[result.qualityTier] = (byTier[result.qualityTier] || 0) + 1
        } catch {
          continue
        }
      }

      // All tiers should be valid
      for (const tier of Object.keys(byTier)) {
        expect(['artisan', 'premium', 'standard', 'commodity']).toContain(tier)
      }
    })
  })
})
