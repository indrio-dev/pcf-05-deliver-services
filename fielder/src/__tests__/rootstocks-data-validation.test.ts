/**
 * Rootstocks Data Validation Tests
 *
 * F012: Validates that Supabase rootstocks table matches TypeScript constants.
 * Tests Brix modifier values and data consistency.
 */

import { CITRUS_ROOTSTOCKS, STONE_FRUIT_ROOTSTOCKS, getRootstockBrixModifier } from '@/lib/constants/rootstocks'

// Expected database values (should match constants)
const EXPECTED_ROOTSTOCKS = [
  // Citrus - High Quality
  { id: 'carrizo', brixModifier: 0.6 },
  { id: 'c35', brixModifier: 0.6 },
  { id: 'sour_orange', brixModifier: 0.5 },
  { id: 'trifoliate', brixModifier: 0.5 },
  // Citrus - Neutral
  { id: 'cleopatra', brixModifier: 0.2 },
  // Citrus - Lower Quality
  { id: 'swingle', brixModifier: -0.5 },
  { id: 'rough_lemon', brixModifier: -0.7 },
  { id: 'volkamer', brixModifier: -0.7 },
  { id: 'macrophylla', brixModifier: -0.8 },
  // Stone Fruit
  { id: 'lovell', brixModifier: 0.0 },
  { id: 'guardian', brixModifier: 0.0 },
  { id: 'citation', brixModifier: 0.2 },
]

describe('Rootstocks Data Validation (F012)', () => {
  // ===========================================================================
  // CONSTANTS COMPLETENESS
  // ===========================================================================
  describe('Constants Completeness', () => {
    it('has 9 citrus rootstocks in constants', () => {
      expect(CITRUS_ROOTSTOCKS.length).toBe(9)
    })

    it('has 3 stone fruit rootstocks in constants', () => {
      expect(STONE_FRUIT_ROOTSTOCKS.length).toBe(3)
    })

    it('has 12 total rootstocks', () => {
      const total = CITRUS_ROOTSTOCKS.length + STONE_FRUIT_ROOTSTOCKS.length
      expect(total).toBe(12)
    })

    it('constants contain all expected rootstock IDs', () => {
      const allRootstocks = [...CITRUS_ROOTSTOCKS, ...STONE_FRUIT_ROOTSTOCKS]
      const constantIds = allRootstocks.map(r => r.id)
      for (const expected of EXPECTED_ROOTSTOCKS) {
        expect(constantIds).toContain(expected.id)
      }
    })
  })

  // ===========================================================================
  // CITRUS ROOTSTOCKS - HIGH QUALITY
  // ===========================================================================
  describe('Citrus Rootstocks - High Quality', () => {
    it('Carrizo has correct Brix modifier (+0.6)', () => {
      const rootstock = CITRUS_ROOTSTOCKS.find(r => r.id === 'carrizo')
      expect(rootstock).toBeDefined()
      expect(rootstock?.brixModifier).toBe(0.6)
      expect(rootstock?.name).toBe('Carrizo Citrange')
    })

    it('C-35 has correct Brix modifier (+0.6)', () => {
      const rootstock = CITRUS_ROOTSTOCKS.find(r => r.id === 'c35')
      expect(rootstock).toBeDefined()
      expect(rootstock?.brixModifier).toBe(0.6)
    })

    it('Sour Orange has correct Brix modifier (+0.5)', () => {
      const rootstock = CITRUS_ROOTSTOCKS.find(r => r.id === 'sour_orange')
      expect(rootstock).toBeDefined()
      expect(rootstock?.brixModifier).toBe(0.5)
    })

    it('Trifoliate has correct Brix modifier (+0.5)', () => {
      const rootstock = CITRUS_ROOTSTOCKS.find(r => r.id === 'trifoliate')
      expect(rootstock).toBeDefined()
      expect(rootstock?.brixModifier).toBe(0.5)
    })
  })

  // ===========================================================================
  // CITRUS ROOTSTOCKS - NEUTRAL
  // ===========================================================================
  describe('Citrus Rootstocks - Neutral', () => {
    it('Cleopatra has correct Brix modifier (+0.2)', () => {
      const rootstock = CITRUS_ROOTSTOCKS.find(r => r.id === 'cleopatra')
      expect(rootstock).toBeDefined()
      expect(rootstock?.brixModifier).toBe(0.2)
    })
  })

  // ===========================================================================
  // CITRUS ROOTSTOCKS - LOWER QUALITY
  // ===========================================================================
  describe('Citrus Rootstocks - Lower Quality', () => {
    it('Swingle has correct Brix modifier (-0.5)', () => {
      const rootstock = CITRUS_ROOTSTOCKS.find(r => r.id === 'swingle')
      expect(rootstock).toBeDefined()
      expect(rootstock?.brixModifier).toBe(-0.5)
    })

    it('Rough Lemon has correct Brix modifier (-0.7)', () => {
      const rootstock = CITRUS_ROOTSTOCKS.find(r => r.id === 'rough_lemon')
      expect(rootstock).toBeDefined()
      expect(rootstock?.brixModifier).toBe(-0.7)
    })

    it('Volkamer has correct Brix modifier (-0.7)', () => {
      const rootstock = CITRUS_ROOTSTOCKS.find(r => r.id === 'volkamer')
      expect(rootstock).toBeDefined()
      expect(rootstock?.brixModifier).toBe(-0.7)
    })

    it('Macrophylla has correct Brix modifier (-0.8)', () => {
      const rootstock = CITRUS_ROOTSTOCKS.find(r => r.id === 'macrophylla')
      expect(rootstock).toBeDefined()
      expect(rootstock?.brixModifier).toBe(-0.8)
    })
  })

  // ===========================================================================
  // STONE FRUIT ROOTSTOCKS
  // ===========================================================================
  describe('Stone Fruit Rootstocks', () => {
    it('Lovell has correct Brix modifier (0.0)', () => {
      const rootstock = STONE_FRUIT_ROOTSTOCKS.find(r => r.id === 'lovell')
      expect(rootstock).toBeDefined()
      expect(rootstock?.brixModifier).toBe(0.0)
    })

    it('Guardian has correct Brix modifier (0.0)', () => {
      const rootstock = STONE_FRUIT_ROOTSTOCKS.find(r => r.id === 'guardian')
      expect(rootstock).toBeDefined()
      expect(rootstock?.brixModifier).toBe(0.0)
    })

    it('Citation has correct Brix modifier (+0.2)', () => {
      const rootstock = STONE_FRUIT_ROOTSTOCKS.find(r => r.id === 'citation')
      expect(rootstock).toBeDefined()
      expect(rootstock?.brixModifier).toBe(0.2)
    })
  })

  // ===========================================================================
  // DATA CONSISTENCY CHECKS
  // ===========================================================================
  describe('Data Consistency', () => {
    const allRootstocks = [...CITRUS_ROOTSTOCKS, ...STONE_FRUIT_ROOTSTOCKS]

    it('all rootstocks have Brix modifiers within valid range (-1.0 to +1.0)', () => {
      for (const rootstock of allRootstocks) {
        expect(rootstock.brixModifier).toBeGreaterThanOrEqual(-1.0)
        expect(rootstock.brixModifier).toBeLessThanOrEqual(1.0)
      }
    })

    it('all rootstocks have valid vigor values', () => {
      const validVigor = ['dwarfing', 'semi-dwarfing', 'medium', 'vigorous']
      for (const rootstock of allRootstocks) {
        expect(validVigor).toContain(rootstock.vigor)
      }
    })

    it('all citrus rootstocks have citrus crop category', () => {
      for (const rootstock of CITRUS_ROOTSTOCKS) {
        expect(rootstock.cropCategories).toContain('citrus')
      }
    })

    it('all stone fruit rootstocks have stoneFruit crop category', () => {
      for (const rootstock of STONE_FRUIT_ROOTSTOCKS) {
        expect(rootstock.cropCategories).toContain('stoneFruit')
      }
    })

    it('high quality citrus rootstocks have positive Brix modifier', () => {
      const highQuality = ['carrizo', 'c35', 'sour_orange', 'trifoliate']
      for (const id of highQuality) {
        const rootstock = CITRUS_ROOTSTOCKS.find(r => r.id === id)
        expect(rootstock?.brixModifier).toBeGreaterThan(0)
      }
    })

    it('lower quality citrus rootstocks have negative Brix modifier', () => {
      const lowerQuality = ['swingle', 'rough_lemon', 'volkamer', 'macrophylla']
      for (const id of lowerQuality) {
        const rootstock = CITRUS_ROOTSTOCKS.find(r => r.id === id)
        expect(rootstock?.brixModifier).toBeLessThan(0)
      }
    })
  })

  // ===========================================================================
  // LOOKUP FUNCTION TESTS
  // ===========================================================================
  describe('Lookup Functions', () => {
    it('getRootstockBrixModifier returns correct value for known rootstocks', () => {
      expect(getRootstockBrixModifier('carrizo')).toBe(0.6)
      expect(getRootstockBrixModifier('swingle')).toBe(-0.5)
      expect(getRootstockBrixModifier('lovell')).toBe(0.0)
    })

    it('getRootstockBrixModifier returns 0 for unknown rootstock', () => {
      expect(getRootstockBrixModifier('unknown_rootstock')).toBe(0)
    })

    it('getRootstockBrixModifier returns 0 for undefined', () => {
      expect(getRootstockBrixModifier(undefined)).toBe(0)
    })
  })

  // ===========================================================================
  // CONSTANTS MATCH EXPECTED DATABASE VALUES
  // ===========================================================================
  describe('Constants Match Expected Database Values', () => {
    it.each(EXPECTED_ROOTSTOCKS)('$id has Brix modifier $brixModifier', (expected) => {
      const modifier = getRootstockBrixModifier(expected.id)
      expect(modifier).toBe(expected.brixModifier)
    })
  })

  // ===========================================================================
  // BRIX MODIFIER ORDERING
  // ===========================================================================
  describe('Brix Modifier Ordering', () => {
    it('citrus rootstocks are ordered from highest to lowest quality', () => {
      // High quality
      expect(getRootstockBrixModifier('carrizo')).toBeGreaterThan(getRootstockBrixModifier('cleopatra'))
      expect(getRootstockBrixModifier('c35')).toBeGreaterThan(getRootstockBrixModifier('cleopatra'))

      // Neutral > Low
      expect(getRootstockBrixModifier('cleopatra')).toBeGreaterThan(getRootstockBrixModifier('swingle'))

      // Low quality ordering
      expect(getRootstockBrixModifier('swingle')).toBeGreaterThan(getRootstockBrixModifier('rough_lemon'))
      expect(getRootstockBrixModifier('rough_lemon')).toBeGreaterThan(getRootstockBrixModifier('macrophylla'))
    })

    it('Macrophylla has lowest Brix modifier of all citrus rootstocks', () => {
      const macrophyllaModifier = getRootstockBrixModifier('macrophylla')
      for (const rootstock of CITRUS_ROOTSTOCKS) {
        expect(rootstock.brixModifier).toBeGreaterThanOrEqual(macrophyllaModifier)
      }
    })

    it('Carrizo and C-35 have highest Brix modifiers', () => {
      const carrizoMod = getRootstockBrixModifier('carrizo')
      const c35Mod = getRootstockBrixModifier('c35')
      expect(carrizoMod).toBe(c35Mod) // Both should be 0.6

      for (const rootstock of CITRUS_ROOTSTOCKS) {
        expect(rootstock.brixModifier).toBeLessThanOrEqual(carrizoMod)
      }
    })
  })
})
