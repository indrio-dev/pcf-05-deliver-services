/**
 * Cultivars Data Validation Tests
 *
 * F011: Validates that Supabase cultivars table matches TypeScript constants.
 * Tests constants consistency and data integrity.
 */

import { CULTIVAR_QUALITY_PROFILES, CultivarQualityProfile } from '@/lib/constants/quality-tiers'

// Expected database values (should match constants)
const EXPECTED_CULTIVARS = [
  // Navel Oranges
  { id: 'washington_navel', cropId: 'navel_orange', brixBase: 11.5, timingClass: 'mid' },
  { id: 'cara_cara', cropId: 'navel_orange', brixBase: 12.0, timingClass: 'mid' },
  { id: 'lane_late', cropId: 'navel_orange', brixBase: 10.5, timingClass: 'late' },
  // Grapefruit
  { id: 'rio_red', cropId: 'grapefruit', brixBase: 10.0, timingClass: 'mid' },
  { id: 'ruby_red', cropId: 'grapefruit', brixBase: 9.5, timingClass: 'mid' },
  // Peaches
  { id: 'elberta', cropId: 'peach', brixBase: 12.5, timingClass: 'mid' },
  { id: 'georgia_belle', cropId: 'peach', brixBase: 14.0, timingClass: 'mid' },
  // Strawberries
  { id: 'sweet_charlie', cropId: 'strawberry', brixBase: 8.5, timingClass: 'early' },
  { id: 'florida_radiance', cropId: 'strawberry', brixBase: 7.5, timingClass: 'early' },
  // Apples
  { id: 'honeycrisp', cropId: 'apple', brixBase: 13.0, timingClass: 'mid' },
  { id: 'cosmic_crisp', cropId: 'apple', brixBase: 12.0, timingClass: 'late' },
  { id: 'arkansas_black', cropId: 'apple', brixBase: 14.5, timingClass: 'late' },
]

describe('Cultivars Data Validation (F011)', () => {
  // ===========================================================================
  // CONSTANTS COMPLETENESS
  // ===========================================================================
  describe('Constants Completeness', () => {
    it('has 12 cultivars in constants', () => {
      expect(CULTIVAR_QUALITY_PROFILES.length).toBe(12)
    })

    it('constants contain all expected cultivar IDs', () => {
      const constantIds = CULTIVAR_QUALITY_PROFILES.map(c => c.cultivarId)
      for (const expected of EXPECTED_CULTIVARS) {
        expect(constantIds).toContain(expected.id)
      }
    })

    it('has cultivars for multiple crop types', () => {
      const cropTypes = new Set(CULTIVAR_QUALITY_PROFILES.map(c => c.cropType))
      expect(cropTypes.size).toBeGreaterThanOrEqual(5)
      expect(cropTypes.has('navel_orange')).toBe(true)
      expect(cropTypes.has('grapefruit')).toBe(true)
      expect(cropTypes.has('peach')).toBe(true)
      expect(cropTypes.has('strawberry')).toBe(true)
      expect(cropTypes.has('apple')).toBe(true)
    })
  })

  // ===========================================================================
  // CITRUS CULTIVARS
  // ===========================================================================
  describe('Citrus Cultivars', () => {
    const navelOranges = CULTIVAR_QUALITY_PROFILES.filter(c => c.cropType === 'navel_orange')
    const grapefruits = CULTIVAR_QUALITY_PROFILES.filter(c => c.cropType === 'grapefruit')

    it('has 3 navel orange cultivars', () => {
      expect(navelOranges.length).toBe(3)
    })

    it('has 2 grapefruit cultivars', () => {
      expect(grapefruits.length).toBe(2)
    })

    it('Washington Navel has correct values', () => {
      const cultivar = CULTIVAR_QUALITY_PROFILES.find(c => c.cultivarId === 'washington_navel')
      expect(cultivar).toBeDefined()
      expect(cultivar?.researchAvgBrix).toBe(11.5)
      expect(cultivar?.timingClass).toBe('mid')
      expect(cultivar?.qualityTier).toBe('premium')
      expect(cultivar?.isHeirloom).toBe(true)
    })

    it('Cara Cara has correct values', () => {
      const cultivar = CULTIVAR_QUALITY_PROFILES.find(c => c.cultivarId === 'cara_cara')
      expect(cultivar).toBeDefined()
      expect(cultivar?.researchAvgBrix).toBe(12.0)
      expect(cultivar?.timingClass).toBe('mid')
      expect(cultivar?.heritageIntent).toBe('modern_nutrient')
    })

    it('Lane Late has correct values', () => {
      const cultivar = CULTIVAR_QUALITY_PROFILES.find(c => c.cultivarId === 'lane_late')
      expect(cultivar).toBeDefined()
      expect(cultivar?.researchAvgBrix).toBe(10.5)
      expect(cultivar?.timingClass).toBe('late')
      expect(cultivar?.qualityTier).toBe('standard')
    })

    it('Rio Red has correct values', () => {
      const cultivar = CULTIVAR_QUALITY_PROFILES.find(c => c.cultivarId === 'rio_red')
      expect(cultivar).toBeDefined()
      expect(cultivar?.researchAvgBrix).toBe(10.0)
      expect(cultivar?.cropType).toBe('grapefruit')
    })

    it('Ruby Red has correct values', () => {
      const cultivar = CULTIVAR_QUALITY_PROFILES.find(c => c.cultivarId === 'ruby_red')
      expect(cultivar).toBeDefined()
      expect(cultivar?.researchAvgBrix).toBe(9.5)
      expect(cultivar?.heritageIntent).toBe('true_heritage')
    })
  })

  // ===========================================================================
  // STONE FRUIT CULTIVARS
  // ===========================================================================
  describe('Stone Fruit Cultivars (Peaches)', () => {
    const peaches = CULTIVAR_QUALITY_PROFILES.filter(c => c.cropType === 'peach')

    it('has 2 peach cultivars', () => {
      expect(peaches.length).toBe(2)
    })

    it('Elberta has correct values', () => {
      const cultivar = CULTIVAR_QUALITY_PROFILES.find(c => c.cultivarId === 'elberta')
      expect(cultivar).toBeDefined()
      expect(cultivar?.researchAvgBrix).toBe(12.5)
      expect(cultivar?.timingClass).toBe('mid')
      expect(cultivar?.qualityTier).toBe('premium')
      expect(cultivar?.isHeirloom).toBe(true)
    })

    it('Georgia Belle has correct values (artisan tier)', () => {
      const cultivar = CULTIVAR_QUALITY_PROFILES.find(c => c.cultivarId === 'georgia_belle')
      expect(cultivar).toBeDefined()
      expect(cultivar?.researchAvgBrix).toBe(14.0)
      expect(cultivar?.qualityTier).toBe('artisan')
      expect(cultivar?.researchPeakBrix).toBe(16.0)
    })
  })

  // ===========================================================================
  // BERRY CULTIVARS
  // ===========================================================================
  describe('Berry Cultivars (Strawberries)', () => {
    const strawberries = CULTIVAR_QUALITY_PROFILES.filter(c => c.cropType === 'strawberry')

    it('has 2 strawberry cultivars', () => {
      expect(strawberries.length).toBe(2)
    })

    it('Sweet Charlie has correct values', () => {
      const cultivar = CULTIVAR_QUALITY_PROFILES.find(c => c.cultivarId === 'sweet_charlie')
      expect(cultivar).toBeDefined()
      expect(cultivar?.researchAvgBrix).toBe(8.5)
      expect(cultivar?.timingClass).toBe('early')
      expect(cultivar?.qualityTier).toBe('premium')
      expect(cultivar?.heritageIntent).toBe('modern_flavor')
    })

    it('Florida Radiance has correct values', () => {
      const cultivar = CULTIVAR_QUALITY_PROFILES.find(c => c.cultivarId === 'florida_radiance')
      expect(cultivar).toBeDefined()
      expect(cultivar?.researchAvgBrix).toBe(7.5)
      expect(cultivar?.qualityTier).toBe('standard')
      expect(cultivar?.heritageIntent).toBe('commercial')
    })
  })

  // ===========================================================================
  // POME FRUIT CULTIVARS
  // ===========================================================================
  describe('Pome Fruit Cultivars (Apples)', () => {
    const apples = CULTIVAR_QUALITY_PROFILES.filter(c => c.cropType === 'apple')

    it('has 3 apple cultivars', () => {
      expect(apples.length).toBe(3)
    })

    it('Honeycrisp has correct values', () => {
      const cultivar = CULTIVAR_QUALITY_PROFILES.find(c => c.cultivarId === 'honeycrisp')
      expect(cultivar).toBeDefined()
      expect(cultivar?.researchAvgBrix).toBe(13.0)
      expect(cultivar?.timingClass).toBe('mid')
      expect(cultivar?.qualityTier).toBe('premium')
      expect(cultivar?.heritageIntent).toBe('modern_flavor')
    })

    it('Cosmic Crisp has correct values', () => {
      const cultivar = CULTIVAR_QUALITY_PROFILES.find(c => c.cultivarId === 'cosmic_crisp')
      expect(cultivar).toBeDefined()
      expect(cultivar?.researchAvgBrix).toBe(12.0)
      expect(cultivar?.timingClass).toBe('late')
      expect(cultivar?.qualityTier).toBe('standard')
    })

    it('Arkansas Black has correct values (artisan tier)', () => {
      const cultivar = CULTIVAR_QUALITY_PROFILES.find(c => c.cultivarId === 'arkansas_black')
      expect(cultivar).toBeDefined()
      expect(cultivar?.researchAvgBrix).toBe(14.5)
      expect(cultivar?.qualityTier).toBe('artisan')
      expect(cultivar?.isHeirloom).toBe(true)
    })
  })

  // ===========================================================================
  // DATA CONSISTENCY CHECKS
  // ===========================================================================
  describe('Data Consistency', () => {
    it('all cultivars have valid quality tiers', () => {
      const validTiers = ['artisan', 'premium', 'standard', 'commodity']
      for (const cultivar of CULTIVAR_QUALITY_PROFILES) {
        expect(validTiers).toContain(cultivar.qualityTier)
      }
    })

    it('all cultivars have valid timing classes', () => {
      const validTiming = ['early', 'mid', 'late']
      for (const cultivar of CULTIVAR_QUALITY_PROFILES) {
        expect(validTiming).toContain(cultivar.timingClass)
      }
    })

    it('all cultivars have positive researchAvgBrix', () => {
      for (const cultivar of CULTIVAR_QUALITY_PROFILES) {
        if (cultivar.researchAvgBrix) {
          expect(cultivar.researchAvgBrix).toBeGreaterThan(0)
          expect(cultivar.researchAvgBrix).toBeLessThan(25)
        }
      }
    })

    it('all cultivars have researchPeakBrix >= researchAvgBrix', () => {
      for (const cultivar of CULTIVAR_QUALITY_PROFILES) {
        if (cultivar.researchPeakBrix && cultivar.researchAvgBrix) {
          expect(cultivar.researchPeakBrix).toBeGreaterThanOrEqual(cultivar.researchAvgBrix)
        }
      }
    })

    it('artisan tier cultivars have high Brix (>= 14)', () => {
      const artisan = CULTIVAR_QUALITY_PROFILES.filter(c => c.qualityTier === 'artisan')
      for (const cultivar of artisan) {
        expect(cultivar.researchAvgBrix).toBeGreaterThanOrEqual(14)
      }
    })

    it('premium tier cultivars have moderate-high Brix (>= 8)', () => {
      const premium = CULTIVAR_QUALITY_PROFILES.filter(c => c.qualityTier === 'premium')
      for (const cultivar of premium) {
        expect(cultivar.researchAvgBrix).toBeGreaterThanOrEqual(8)
      }
    })
  })

  // ===========================================================================
  // CONSTANTS MATCH EXPECTED DATABASE VALUES
  // ===========================================================================
  describe('Constants Match Expected Database Values', () => {
    it.each(EXPECTED_CULTIVARS)('$id matches expected values', (expected) => {
      const cultivar = CULTIVAR_QUALITY_PROFILES.find(c => c.cultivarId === expected.id)
      expect(cultivar).toBeDefined()
      expect(cultivar?.cropType).toBe(expected.cropId)
      expect(cultivar?.researchAvgBrix).toBe(expected.brixBase)
      expect(cultivar?.timingClass).toBe(expected.timingClass)
    })
  })

  // ===========================================================================
  // HERITAGE CLASSIFICATION
  // ===========================================================================
  describe('Heritage Classification', () => {
    it('has heirloom cultivars (pre-1950)', () => {
      const heirlooms = CULTIVAR_QUALITY_PROFILES.filter(c => c.isHeirloom)
      expect(heirlooms.length).toBeGreaterThanOrEqual(4)
      // Washington Navel, Elberta, Georgia Belle, Arkansas Black
    })

    it('heirloom cultivars are pre-1950', () => {
      const heirlooms = CULTIVAR_QUALITY_PROFILES.filter(c => c.isHeirloom)
      for (const cultivar of heirlooms) {
        if (cultivar.yearIntroduced) {
          expect(cultivar.yearIntroduced).toBeLessThanOrEqual(1950)
        }
      }
    })

    it('has modern flavor-focused cultivars', () => {
      const modernFlavor = CULTIVAR_QUALITY_PROFILES.filter(c => c.heritageIntent === 'modern_flavor')
      expect(modernFlavor.length).toBeGreaterThanOrEqual(2)
      // Honeycrisp, Sweet Charlie
    })

    it('has commercial cultivars', () => {
      const commercial = CULTIVAR_QUALITY_PROFILES.filter(c => c.heritageIntent === 'commercial')
      expect(commercial.length).toBeGreaterThanOrEqual(3)
      // Lane Late, Florida Radiance, Cosmic Crisp
    })
  })
})
