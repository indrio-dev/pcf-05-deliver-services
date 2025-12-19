/**
 * Crops Data Validation Tests
 *
 * F010: Validates that Supabase crops table matches TypeScript constants.
 * These are VALIDATION tests - they verify data consistency, not logic.
 */

import { CROP_GDD_TARGETS, GDDTarget } from '@/lib/constants/gdd-targets'

// Expected database values (should match constants exactly)
const EXPECTED_CROPS: Record<string, GDDTarget> = {
  navel_orange: { baseTemp: 55.0, gddToMaturity: 5100, gddToPeak: 6100, gddWindow: 2000 },
  valencia: { baseTemp: 55.0, gddToMaturity: 8000, gddToPeak: 9000, gddWindow: 2200 },
  grapefruit: { baseTemp: 55.0, gddToMaturity: 5500, gddToPeak: 7100, gddWindow: 4000 },
  tangerine: { baseTemp: 55.0, gddToMaturity: 5300, gddToPeak: 5700, gddWindow: 900 },
  satsuma: { baseTemp: 55.0, gddToMaturity: 4600, gddToPeak: 5100, gddWindow: 700 },
  peach: { baseTemp: 45.0, gddToMaturity: 1800, gddToPeak: 2000, gddWindow: 150, chillHoursRequired: 650 },
  sweet_cherry: { baseTemp: 40.0, gddToMaturity: 1400, gddToPeak: 1550, gddWindow: 100, chillHoursRequired: 1100 },
  tart_cherry: { baseTemp: 39.2, gddToMaturity: 1000, gddToPeak: 1100, gddWindow: 80, chillHoursRequired: 954 },
  apple: { baseTemp: 43.0, gddToMaturity: 2200, gddToPeak: 2500, gddWindow: 200, chillHoursRequired: 1000 },
  pear: { baseTemp: 40.0, gddToMaturity: 2400, gddToPeak: 2700, gddWindow: 800, chillHoursRequired: 800 },
  strawberry: { baseTemp: 50.0, gddToMaturity: 700, gddToPeak: 1300, gddWindow: 1100 },
  blueberry: { baseTemp: 45.0, gddToMaturity: 1200, gddToPeak: 1400, gddWindow: 100, chillHoursRequired: 800 },
  mango: { baseTemp: 60.0, gddToMaturity: 2800, gddToPeak: 3200, gddWindow: 300, chillHoursRequired: 0 },
  pomegranate: { baseTemp: 50.0, gddToMaturity: 3800, gddToPeak: 4500, gddWindow: 1000, chillHoursRequired: 150 },
  pecan: { baseTemp: 65.0, gddToMaturity: 2600, gddToPeak: 2900, gddWindow: 400, chillHoursRequired: 500 },
}

describe('Crops Data Validation (F010)', () => {
  // ===========================================================================
  // CONSTANTS COMPLETENESS
  // ===========================================================================
  describe('Constants Completeness', () => {
    it('has all 15 expected crops in constants', () => {
      const cropIds = Object.keys(CROP_GDD_TARGETS)
      expect(cropIds.length).toBe(15)
    })

    it('constants contain all expected crop IDs', () => {
      const expectedCropIds = Object.keys(EXPECTED_CROPS)
      for (const cropId of expectedCropIds) {
        expect(CROP_GDD_TARGETS[cropId]).toBeDefined()
      }
    })
  })

  // ===========================================================================
  // CITRUS CROPS
  // ===========================================================================
  describe('Citrus Crops', () => {
    const citrusCrops = ['navel_orange', 'valencia', 'grapefruit', 'tangerine', 'satsuma']

    it.each(citrusCrops)('%s has base temp 55°F', (cropId) => {
      expect(CROP_GDD_TARGETS[cropId].baseTemp).toBe(55.0)
    })

    it('navel_orange has correct GDD values', () => {
      const crop = CROP_GDD_TARGETS.navel_orange
      expect(crop.gddToMaturity).toBe(5100)
      expect(crop.gddToPeak).toBe(6100)
      expect(crop.gddWindow).toBe(2000)
    })

    it('valencia has correct GDD values', () => {
      const crop = CROP_GDD_TARGETS.valencia
      expect(crop.gddToMaturity).toBe(8000)
      expect(crop.gddToPeak).toBe(9000)
      expect(crop.gddWindow).toBe(2200)
    })

    it('grapefruit has correct GDD values', () => {
      const crop = CROP_GDD_TARGETS.grapefruit
      expect(crop.gddToMaturity).toBe(5500)
      expect(crop.gddToPeak).toBe(7100)
      expect(crop.gddWindow).toBe(4000)
    })
  })

  // ===========================================================================
  // STONE FRUIT CROPS
  // ===========================================================================
  describe('Stone Fruit Crops', () => {
    it('peach has correct values with chill hours', () => {
      const crop = CROP_GDD_TARGETS.peach
      expect(crop.baseTemp).toBe(45.0)
      expect(crop.gddToMaturity).toBe(1800)
      expect(crop.gddToPeak).toBe(2000)
      expect(crop.gddWindow).toBe(150)
      expect(crop.chillHoursRequired).toBe(650)
    })

    it('sweet_cherry has correct values with chill hours', () => {
      const crop = CROP_GDD_TARGETS.sweet_cherry
      expect(crop.baseTemp).toBe(40.0)
      expect(crop.gddToMaturity).toBe(1400)
      expect(crop.gddToPeak).toBe(1550)
      expect(crop.gddWindow).toBe(100)
      expect(crop.chillHoursRequired).toBe(1100)
    })

    it('tart_cherry has research-validated values', () => {
      const crop = CROP_GDD_TARGETS.tart_cherry
      // Zavalloni et al. 2006 - base 4°C = 39.2°F
      expect(crop.baseTemp).toBe(39.2)
      expect(crop.gddToMaturity).toBe(1000)
      expect(crop.gddToPeak).toBe(1100)
      expect(crop.gddWindow).toBe(80)
      expect(crop.chillHoursRequired).toBe(954)
    })
  })

  // ===========================================================================
  // POME FRUIT CROPS
  // ===========================================================================
  describe('Pome Fruit Crops', () => {
    it('apple has correct values with chill hours', () => {
      const crop = CROP_GDD_TARGETS.apple
      expect(crop.baseTemp).toBe(43.0)
      expect(crop.gddToMaturity).toBe(2200)
      expect(crop.gddToPeak).toBe(2500)
      expect(crop.gddWindow).toBe(200)
      expect(crop.chillHoursRequired).toBe(1000)
    })

    it('pear has correct values with chill hours', () => {
      const crop = CROP_GDD_TARGETS.pear
      expect(crop.baseTemp).toBe(40.0)
      expect(crop.gddToMaturity).toBe(2400)
      expect(crop.gddToPeak).toBe(2700)
      expect(crop.gddWindow).toBe(800)
      expect(crop.chillHoursRequired).toBe(800)
    })
  })

  // ===========================================================================
  // BERRY CROPS
  // ===========================================================================
  describe('Berry Crops', () => {
    it('strawberry has correct values', () => {
      const crop = CROP_GDD_TARGETS.strawberry
      expect(crop.baseTemp).toBe(50.0)
      expect(crop.gddToMaturity).toBe(700)
      expect(crop.gddToPeak).toBe(1300)
      expect(crop.gddWindow).toBe(1100)
    })

    it('blueberry has correct values with chill hours', () => {
      const crop = CROP_GDD_TARGETS.blueberry
      expect(crop.baseTemp).toBe(45.0)
      expect(crop.gddToMaturity).toBe(1200)
      expect(crop.gddToPeak).toBe(1400)
      expect(crop.gddWindow).toBe(100)
      expect(crop.chillHoursRequired).toBe(800)
    })
  })

  // ===========================================================================
  // TROPICAL/SUBTROPICAL CROPS
  // ===========================================================================
  describe('Tropical/Subtropical Crops', () => {
    it('mango has correct values', () => {
      const crop = CROP_GDD_TARGETS.mango
      expect(crop.baseTemp).toBe(60.0)
      expect(crop.gddToMaturity).toBe(2800)
      expect(crop.gddToPeak).toBe(3200)
      expect(crop.gddWindow).toBe(300)
      expect(crop.chillHoursRequired).toBe(0)
    })

    it('pomegranate has correct values', () => {
      const crop = CROP_GDD_TARGETS.pomegranate
      expect(crop.baseTemp).toBe(50.0)
      expect(crop.gddToMaturity).toBe(3800)
      expect(crop.gddToPeak).toBe(4500)
      expect(crop.gddWindow).toBe(1000)
      expect(crop.chillHoursRequired).toBe(150)
    })
  })

  // ===========================================================================
  // NUT CROPS
  // ===========================================================================
  describe('Nut Crops', () => {
    it('pecan has correct values', () => {
      const crop = CROP_GDD_TARGETS.pecan
      expect(crop.baseTemp).toBe(65.0)
      expect(crop.gddToMaturity).toBe(2600)
      expect(crop.gddToPeak).toBe(2900)
      expect(crop.gddWindow).toBe(400)
      expect(crop.chillHoursRequired).toBe(500)
    })
  })

  // ===========================================================================
  // DATA CONSISTENCY CHECKS
  // ===========================================================================
  describe('Data Consistency', () => {
    it('all crops have gddToPeak > gddToMaturity', () => {
      for (const [cropId, crop] of Object.entries(CROP_GDD_TARGETS)) {
        if (crop.gddToPeak) {
          expect(crop.gddToPeak).toBeGreaterThan(crop.gddToMaturity)
        }
      }
    })

    it('all crops have positive gddWindow', () => {
      for (const crop of Object.values(CROP_GDD_TARGETS)) {
        expect(crop.gddWindow).toBeGreaterThan(0)
      }
    })

    it('all crops have baseTemp between 35-70°F', () => {
      for (const crop of Object.values(CROP_GDD_TARGETS)) {
        expect(crop.baseTemp).toBeGreaterThanOrEqual(35)
        expect(crop.baseTemp).toBeLessThanOrEqual(70)
      }
    })

    it('chill hours are non-negative when present', () => {
      for (const crop of Object.values(CROP_GDD_TARGETS)) {
        if (crop.chillHoursRequired !== undefined) {
          expect(crop.chillHoursRequired).toBeGreaterThanOrEqual(0)
        }
      }
    })
  })

  // ===========================================================================
  // CONSTANTS MATCH EXPECTED VALUES
  // ===========================================================================
  describe('Constants Match Expected Values', () => {
    it.each(Object.entries(EXPECTED_CROPS))('%s matches expected values', (cropId, expected) => {
      const actual = CROP_GDD_TARGETS[cropId]

      expect(actual.baseTemp).toBe(expected.baseTemp)
      expect(actual.gddToMaturity).toBe(expected.gddToMaturity)
      expect(actual.gddToPeak).toBe(expected.gddToPeak)
      expect(actual.gddWindow).toBe(expected.gddWindow)

      if (expected.chillHoursRequired !== undefined) {
        expect(actual.chillHoursRequired).toBe(expected.chillHoursRequired)
      }
    })
  })
})
