/**
 * Unified Predict API Tests
 *
 * Tests for POST /api/predict/unified endpoint
 * Validates routing to all category predictors and error handling.
 */

import { predictUnified, getRegisteredCategories } from '@/lib/prediction/prediction-router'

describe('Unified Predict API', () => {
  describe('Category Registration', () => {
    it('has all 9 categories registered', () => {
      const categories = getRegisteredCategories()
      expect(categories).toHaveLength(9)
      expect(categories).toContain('produce')
      expect(categories).toContain('livestock')
      expect(categories).toContain('eggs')
      expect(categories).toContain('dairy')
      expect(categories).toContain('vegetables')
      expect(categories).toContain('nuts')
      expect(categories).toContain('seafood')
      expect(categories).toContain('honey')
      expect(categories).toContain('transformed')
    })
  })

  describe('Produce Predictions', () => {
    it('predicts Brix for citrus', () => {
      const result = predictUnified({
        category: 'produce',
        cultivarId: 'washington_navel',
        regionId: 'indian_river_fl',
        currentGDD: 5500,
      })

      expect(result.primaryMetric.type).toBe('brix')
      expect(result.primaryMetric.value).toBeGreaterThan(10)
      expect(result.primaryMetric.value).toBeLessThan(15)
      expect(result.primaryMetric.unit).toBe('°Bx')
      expect(result.qualityTier).toBe('premium')
      expect(result.modelInfo.category).toBe('produce')
      expect(result.modelInfo.validationStatus).toBe('validated')
    })

    it('includes SHARE breakdown', () => {
      const result = predictUnified({
        category: 'produce',
        cultivarId: 'washington_navel',
        regionId: 'indian_river_fl',
        currentGDD: 5500,
      })

      expect(result.soil).toBeDefined()
      expect(result.heritage).toBeDefined()
      expect(result.agricultural).toBeDefined()
      expect(result.ripen).toBeDefined()
      expect(result.enrich).toBeDefined()
    })
  })

  describe('Livestock Predictions', () => {
    it('predicts excellent omega ratio for grass-fed beef', () => {
      const result = predictUnified({
        category: 'livestock',
        species: 'beef',
        breedId: 'angus',
        feedingRegime: {
          diet: 'grass_only',
          finishingMonths: 0,
        },
      })

      expect(result.primaryMetric.type).toBe('omega_ratio')
      expect(result.primaryMetric.value).toBeLessThanOrEqual(3)
      expect(result.primaryMetric.lowerIsBetter).toBe(true)
      expect(result.qualityTier).toBe('artisan')
    })

    it('predicts poor omega ratio for grain-finished beef', () => {
      const result = predictUnified({
        category: 'livestock',
        species: 'beef',
        breedId: 'angus',
        feedingRegime: {
          diet: 'grain_finished',
          finishingMonths: 4,
        },
      })

      expect(result.primaryMetric.type).toBe('omega_ratio')
      expect(result.primaryMetric.value).toBeGreaterThan(12)
      expect(result.qualityTier).toBe('commodity')
    })

    it('predicts omega ratio for pork', () => {
      const result = predictUnified({
        category: 'livestock',
        species: 'pork',
        breedId: 'berkshire',
        feedingRegime: {
          diet: 'pasture_forage',
        },
      })

      expect(result.primaryMetric.type).toBe('omega_ratio')
      expect(result.qualityTier).toMatch(/artisan|premium/)
    })
  })

  describe('Eggs Predictions', () => {
    it('predicts omega ratio for pasture-raised eggs', () => {
      const result = predictUnified({
        category: 'eggs',
        breedId: 'heritage_layers',
        feedingRegime: {
          diet: 'pasture_forage',
          isOrganic: true,
        },
      })

      expect(result.primaryMetric.type).toBe('omega_ratio')
      expect(result.modelInfo.category).toBe('eggs')
    })
  })

  describe('Dairy Predictions', () => {
    it('predicts omega ratio for grass-fed dairy', () => {
      const result = predictUnified({
        category: 'dairy',
        breedId: 'jersey',
        feedingRegime: {
          diet: 'grass_only',
        },
      })

      expect(result.primaryMetric.type).toBe('omega_ratio')
      expect(result.modelInfo.category).toBe('dairy')
    })
  })

  describe('Vegetable Predictions', () => {
    it('predicts Brix for leafy greens', () => {
      const result = predictUnified({
        category: 'vegetables',
        subcategory: 'leafy',
        varietyId: 'romaine',
        daysSinceHarvest: 2,
      })

      expect(result.primaryMetric.type).toBe('brix')
      expect(result.modelInfo.category).toBe('vegetables')
    })

    it('predicts Brix for root vegetables', () => {
      const result = predictUnified({
        category: 'vegetables',
        subcategory: 'root',
        varietyId: 'carrot',
      })

      expect(result.primaryMetric.type).toBe('brix')
    })
  })

  describe('Nut Predictions', () => {
    it('predicts oil content for pecans', () => {
      const result = predictUnified({
        category: 'nuts',
        nutType: 'pecan',
        cultivarId: 'stuart',
        treeAgeYears: 25,
      })

      expect(result.primaryMetric.type).toBe('oil_content')
      expect(result.primaryMetric.unit).toBe('%')
      expect(result.modelInfo.category).toBe('nuts')
    })

    it('predicts oil content for walnuts', () => {
      const result = predictUnified({
        category: 'nuts',
        nutType: 'walnut',
        treeAgeYears: 15,
      })

      expect(result.primaryMetric.type).toBe('oil_content')
    })
  })

  describe('Seafood Predictions', () => {
    it('predicts omega-3 for wild salmon', () => {
      const result = predictUnified({
        category: 'seafood',
        speciesId: 'wild_salmon',
        sourceType: 'wild_caught',
        catchSeason: 'summer',
      })

      expect(result.primaryMetric.type).toBe('omega_3')
      expect(result.primaryMetric.unit).toBe('mg/100g')
      expect(result.primaryMetric.value).toBeGreaterThan(1000)
      expect(result.qualityTier).toBe('artisan')
    })

    it('predicts lower omega-3 for farm-raised', () => {
      const result = predictUnified({
        category: 'seafood',
        speciesId: 'atlantic_salmon',
        sourceType: 'farm_raised',
      })

      expect(result.primaryMetric.type).toBe('omega_3')
      // Farm-raised typically lower
      expect(result.qualityTier).toMatch(/premium|standard/)
    })
  })

  describe('Honey Predictions', () => {
    it('predicts diastase for raw honey', () => {
      const result = predictUnified({
        category: 'honey',
        varietalId: 'clover',
        isRaw: true,
        regionId: 'midwest',
      })

      expect(result.primaryMetric.type).toBe('diastase')
      expect(result.primaryMetric.unit).toBe('DN')
      expect(result.modelInfo.category).toBe('honey')
    })

    it('predicts lower diastase for pasteurized honey', () => {
      const result = predictUnified({
        category: 'honey',
        varietalId: 'clover',
        isRaw: false,
      })

      expect(result.primaryMetric.type).toBe('diastase')
      // Pasteurized should have lower enzyme activity
      expect(result.primaryMetric.value).toBeLessThan(15)
    })
  })

  describe('Transformed Product Predictions', () => {
    it('predicts cupping score for coffee', () => {
      const result = predictUnified({
        category: 'transformed',
        productType: 'coffee',
        varietyId: 'bourbon',
        originId: 'ethiopia_yirgacheffe',
        processingMethod: 'washed',
        roastLevel: 'light',
      })

      expect(result.primaryMetric.type).toBe('cupping_score')
      expect(result.primaryMetric.unit).toBe('pts')
      expect(result.modelInfo.category).toBe('transformed')
    })

    it('predicts cupping score for tea', () => {
      const result = predictUnified({
        category: 'transformed',
        productType: 'tea',
        varietyId: 'first_flush',
        originId: 'darjeeling',
      })

      expect(result.primaryMetric.type).toBe('cupping_score')
    })

    it('predicts cupping score for cacao', () => {
      const result = predictUnified({
        category: 'transformed',
        productType: 'cacao',
        varietyId: 'criollo',
        originId: 'venezuela',
      })

      expect(result.primaryMetric.type).toBe('cupping_score')
    })
  })

  describe('Error Handling', () => {
    it('throws for unknown category', () => {
      expect(() =>
        predictUnified({
          category: 'unknown' as any,
        })
      ).toThrow('No predictor available for category: unknown')
    })
  })

  describe('Quality Score Consistency', () => {
    it('qualityScore is between 0 and 100', () => {
      const categories = [
        { category: 'produce', cultivarId: 'washington_navel', regionId: 'fl', currentGDD: 5000 },
        { category: 'livestock', species: 'beef', feedingRegime: { diet: 'grass_only' } },
        { category: 'vegetables', subcategory: 'leafy' },
        { category: 'nuts', nutType: 'pecan' },
        { category: 'seafood', speciesId: 'wild_salmon', sourceType: 'wild_caught' },
        { category: 'honey', isRaw: true },
        { category: 'transformed', productType: 'coffee' },
      ]

      categories.forEach((input) => {
        const result = predictUnified(input as any)
        expect(result.qualityScore).toBeGreaterThanOrEqual(0)
        expect(result.qualityScore).toBeLessThanOrEqual(100)
      })
    })

    it('confidence is between 0 and 1', () => {
      const result = predictUnified({
        category: 'produce',
        cultivarId: 'washington_navel',
        regionId: 'indian_river_fl',
        currentGDD: 5500,
      })

      expect(result.confidence).toBeGreaterThanOrEqual(0)
      expect(result.confidence).toBeLessThanOrEqual(1)
    })
  })

  describe('SHARE Pillar Structure', () => {
    it('all pillars have required fields', () => {
      const result = predictUnified({
        category: 'livestock',
        species: 'beef',
        feedingRegime: { diet: 'grass_only' },
      })

      // Soil
      expect(result.soil).toHaveProperty('modifier')
      expect(result.soil).toHaveProperty('confidence')
      expect(result.soil).toHaveProperty('details')
      expect(result.soil).toHaveProperty('insights')

      // Heritage
      expect(result.heritage).toHaveProperty('modifier')
      expect(result.heritage).toHaveProperty('confidence')
      expect(result.heritage).toHaveProperty('details')
      expect(result.heritage).toHaveProperty('insights')

      // Agricultural
      expect(result.agricultural).toHaveProperty('modifier')
      expect(result.agricultural).toHaveProperty('confidence')
      expect(result.agricultural).toHaveProperty('details')
      expect(result.agricultural).toHaveProperty('insights')

      // Ripen
      expect(result.ripen).toHaveProperty('timingModifier')
      expect(result.ripen).toHaveProperty('confidence')
      expect(result.ripen).toHaveProperty('details')
      expect(result.ripen).toHaveProperty('insights')

      // Enrich
      expect(result.enrich).toHaveProperty('verified')
      expect(result.enrich).toHaveProperty('confidence')
      expect(result.enrich).toHaveProperty('details')
      expect(result.enrich).toHaveProperty('insights')
    })
  })
})
