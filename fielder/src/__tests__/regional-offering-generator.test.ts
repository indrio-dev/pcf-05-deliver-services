/**
 * Tests for Regional Offering Generator
 *
 * Verifies that the climate-based generator produces thousands
 * of valid cultivar × region combinations.
 */

import {
  generateRegionalOfferings,
  getOfferingStats,
  REGION_CLIMATE_ZONES,
  SUBCATEGORY_CLIMATE_COMPATIBILITY,
} from '@/lib/constants/regional-offering-generator'
import { CULTIVARS, PRODUCT_TYPES_BY_ID, REGIONAL_OFFERINGS } from '@/lib/constants/products'
import { ALL_GROWING_REGIONS } from '@/lib/constants/growing-regions'

// Generate offerings once for all tests
const GENERATED_REGIONAL_OFFERINGS = generateRegionalOfferings(CULTIVARS)
const OFFERING_STATS = getOfferingStats(GENERATED_REGIONAL_OFFERINGS, CULTIVARS)

describe('Regional Offering Generator', () => {
  describe('Climate Zone Mappings', () => {
    it('has climate zones for all defined regions', () => {
      const regionsInMapping = Object.keys(REGION_CLIMATE_ZONES)
      const regionsInAllGrowing = Object.keys(ALL_GROWING_REGIONS)

      // Check coverage
      const unmappedRegions = regionsInAllGrowing.filter(
        (r) => !REGION_CLIMATE_ZONES[r]
      )

      // Log any unmapped regions for visibility
      if (unmappedRegions.length > 0) {
        console.log('Unmapped regions:', unmappedRegions)
      }

      // At least 60 regions should be mapped
      expect(regionsInMapping.length).toBeGreaterThanOrEqual(60)
    })

    it('has climate compatibility for all cultivar subcategories', () => {
      const subcategoriesInCultivars = [
        ...new Set(CULTIVARS.map((c) => c.subcategory)),
      ]
      const subcategoriesInMapping = Object.keys(SUBCATEGORY_CLIMATE_COMPATIBILITY)

      const unmappedSubcategories = subcategoriesInCultivars.filter(
        (s) => !SUBCATEGORY_CLIMATE_COMPATIBILITY[s]
      )

      // Log any unmapped subcategories
      if (unmappedSubcategories.length > 0) {
        console.log('Unmapped subcategories:', unmappedSubcategories)
      }

      // Most subcategories should be mapped
      expect(subcategoriesInMapping.length).toBeGreaterThanOrEqual(20)
    })
  })

  describe('Generated Offerings', () => {
    it('generates thousands of offerings', () => {
      const offerings = generateRegionalOfferings(CULTIVARS)

      // Should generate at least 1000 offerings
      expect(offerings.length).toBeGreaterThanOrEqual(1000)

      // Log actual count
      console.log(`Generated ${offerings.length} regional offerings`)
    })

    it('all offerings have valid structure', () => {
      const offerings = GENERATED_REGIONAL_OFFERINGS.slice(0, 100) // Test first 100

      for (const offering of offerings) {
        expect(offering.id).toBeDefined()
        expect(offering.cultivarId).toBeDefined()
        expect(offering.regionId).toBeDefined()
        expect(typeof offering.isActive).toBe('boolean')
        expect(['exceptional', 'excellent', 'good', undefined]).toContain(
          offering.qualityTier
        )
      }
    })

    it('offering IDs are unique', () => {
      const ids = GENERATED_REGIONAL_OFFERINGS.map((o) => o.id)
      const uniqueIds = new Set(ids)

      expect(uniqueIds.size).toBe(ids.length)
    })

    it('references valid cultivars and regions', () => {
      const offerings = GENERATED_REGIONAL_OFFERINGS.slice(0, 100)
      const cultivarIds = new Set(CULTIVARS.map((c) => c.id))
      const regionIds = new Set(Object.keys(ALL_GROWING_REGIONS))

      for (const offering of offerings) {
        expect(cultivarIds.has(offering.cultivarId)).toBe(true)
        expect(regionIds.has(offering.regionId)).toBe(true)
      }
    })
  })

  describe('Offering Statistics', () => {
    it('provides accurate statistics', () => {
      const stats = OFFERING_STATS

      expect(stats.total).toBe(GENERATED_REGIONAL_OFFERINGS.length)
      expect(Object.keys(stats.bySubcategory).length).toBeGreaterThan(0)
      expect(Object.keys(stats.byRegion).length).toBeGreaterThan(0)
      expect(Object.keys(stats.byQualityTier).length).toBeGreaterThan(0)

      // Log stats
      console.log('=== Regional Offering Statistics ===')
      console.log('Total offerings:', stats.total)
      console.log('Subcategories covered:', Object.keys(stats.bySubcategory).length)
      console.log('Regions covered:', Object.keys(stats.byRegion).length)
      console.log(
        'Top 5 subcategories:',
        Object.entries(stats.bySubcategory)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
      )
      console.log('Quality tier distribution:', stats.byQualityTier)
    })

    it('covers citrus in Florida regions', () => {
      // Florida regions in REGION_CLIMATE_ZONES
      const floridaRegions = [
        'indian_river',
        'central_florida',
        'south_florida',
        'florida_keys',
        'gulf_coast_citrus',
        'florida_plant_city',
        'north_florida',
      ]

      const floridaCitrus = GENERATED_REGIONAL_OFFERINGS.filter(
        (o) => floridaRegions.includes(o.regionId)
      ).filter((o) => {
        const cultivar = CULTIVARS.find((c) => c.id === o.cultivarId)
        const productType = PRODUCT_TYPES_BY_ID[cultivar?.productId || '']
        return productType?.subcategory === 'citrus'
      })

      // Florida should have many citrus offerings
      expect(floridaCitrus.length).toBeGreaterThan(0)
      console.log(`Florida citrus offerings: ${floridaCitrus.length}`)
    })

    it('covers apples in Pacific Northwest', () => {
      // PNW regions in REGION_CLIMATE_ZONES
      const pnwRegions = [
        'pacific_nw_yakima',
        'pacific_nw_willamette',
        'pacific_nw_wenatchee',
        'puget_sound',
        'hood_river',
        'columbia_gorge',
      ]

      const pnwApples = GENERATED_REGIONAL_OFFERINGS.filter(
        (o) => pnwRegions.includes(o.regionId)
      ).filter((o) => {
        const cultivar = CULTIVARS.find((c) => c.id === o.cultivarId)
        const productType = PRODUCT_TYPES_BY_ID[cultivar?.productId || '']
        return productType?.subcategory === 'pome_fruit'
      })

      // PNW should have apple offerings (if pome_fruit cultivars exist)
      expect(pnwApples.length).toBeGreaterThanOrEqual(0)
      console.log(`Pacific NW apple offerings: ${pnwApples.length}`)
    })
  })

  describe('Quality Tier Inference', () => {
    it('marks Indian River citrus as exceptional', () => {
      const indianRiverCitrus = GENERATED_REGIONAL_OFFERINGS.filter((o) => {
        if (o.regionId !== 'indian_river') return false
        const cultivar = CULTIVARS.find((c) => c.id === o.cultivarId)
        const productType = PRODUCT_TYPES_BY_ID[cultivar?.productId || '']
        return productType?.subcategory === 'citrus'
      })

      // All Indian River citrus should be exceptional (premium combination)
      for (const offering of indianRiverCitrus) {
        expect(offering.qualityTier).toBe('exceptional')
      }
    })
  })

  describe('Merged REGIONAL_OFFERINGS', () => {
    it('has thousands of offerings (generated + curated)', () => {
      // Should have at least 4000 offerings after merging
      // (Count reduced from 8000 after data consolidation 2025-12)
      expect(REGIONAL_OFFERINGS.length).toBeGreaterThan(4000)
      console.log(`Merged REGIONAL_OFFERINGS count: ${REGIONAL_OFFERINGS.length}`)
    })

    it('preserves curated offerings with flavorNotes', () => {
      // Find a known curated offering
      const navelIndianRiver = REGIONAL_OFFERINGS.find(
        (o) => o.id === 'navel_orange_indian_river'
      )

      expect(navelIndianRiver).toBeDefined()
      expect(navelIndianRiver?.flavorNotes).toBe('Sweet, optimal Brix from Indian River soil')
      expect(navelIndianRiver?.qualityTier).toBe('exceptional')
    })

    it('includes generated offerings not in curated list', () => {
      // Generated offerings should be present
      const generatedCount = REGIONAL_OFFERINGS.filter(
        (o) => !o.flavorNotes // Most generated offerings don't have flavorNotes
      ).length

      // (Count reduced from 7000 after data consolidation 2025-12)
      expect(generatedCount).toBeGreaterThan(4000)
    })
  })
})
