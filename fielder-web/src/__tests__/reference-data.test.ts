/**
 * Reference Data Tests
 *
 * SPIKE-B: Regression tests for reference data lookups.
 * These tests capture the CURRENT behavior as a baseline.
 * F009 Reference Data Service must maintain these exact outputs.
 */

import {
  getRootstockBrixModifier,
  getRootstock,
  getRootstocksForCategory,
  CITRUS_ROOTSTOCKS,
  STONE_FRUIT_ROOTSTOCKS,
} from '@/lib/constants/rootstocks'

import {
  getCultivarProfile,
  getCultivarsForCrop,
  inferTierFromBrix,
  getExpectedBrixRange,
  CULTIVAR_QUALITY_PROFILES,
  QUALITY_TIER_INFO,
} from '@/lib/constants/quality-tiers'

import {
  getGddTargets,
  CROP_GDD_TARGETS,
} from '@/lib/constants/gdd-targets'

describe('Reference Data', () => {
  // ==========================================================================
  // ROOTSTOCK DATA TESTS
  // ==========================================================================
  describe('Rootstocks', () => {
    describe('getRootstockBrixModifier', () => {
      it('returns correct modifier for high-quality citrus rootstocks', () => {
        expect(getRootstockBrixModifier('carrizo')).toBe(0.6)
        expect(getRootstockBrixModifier('c35')).toBe(0.6)
        expect(getRootstockBrixModifier('sour_orange')).toBe(0.5)
        expect(getRootstockBrixModifier('trifoliate')).toBe(0.5)
      })

      it('returns correct modifier for neutral rootstocks', () => {
        expect(getRootstockBrixModifier('cleopatra')).toBe(0.2)
      })

      it('returns correct modifier for low-quality rootstocks', () => {
        expect(getRootstockBrixModifier('swingle')).toBe(-0.5)
        expect(getRootstockBrixModifier('rough_lemon')).toBe(-0.7)
        expect(getRootstockBrixModifier('volkamer')).toBe(-0.7)
        expect(getRootstockBrixModifier('macrophylla')).toBe(-0.8)
      })

      it('returns 0 for unknown rootstock', () => {
        expect(getRootstockBrixModifier('unknown_rootstock')).toBe(0)
      })

      it('returns 0 for undefined', () => {
        expect(getRootstockBrixModifier(undefined)).toBe(0)
      })
    })

    describe('getRootstock', () => {
      it('returns full rootstock object for valid ID', () => {
        const carrizo = getRootstock('carrizo')

        expect(carrizo).toBeDefined()
        expect(carrizo?.name).toBe('Carrizo Citrange')
        expect(carrizo?.brixModifier).toBe(0.6)
        expect(carrizo?.vigor).toBe('medium')
        expect(carrizo?.cropCategories).toContain('citrus')
      })

      it('returns undefined for unknown ID', () => {
        expect(getRootstock('unknown')).toBeUndefined()
      })
    })

    describe('getRootstocksForCategory', () => {
      it('returns citrus rootstocks for citrus category', () => {
        const citrusStocks = getRootstocksForCategory('citrus')

        expect(citrusStocks.length).toBe(9)  // All 9 citrus rootstocks
        expect(citrusStocks.every(r => r.cropCategories.includes('citrus'))).toBe(true)
      })

      it('returns stone fruit rootstocks for stoneFruit category', () => {
        const stoneStocks = getRootstocksForCategory('stoneFruit')

        expect(stoneStocks.length).toBe(3)  // 3 stone fruit rootstocks
        expect(stoneStocks.every(r => r.cropCategories.includes('stoneFruit'))).toBe(true)
      })
    })

    describe('rootstock data integrity', () => {
      it('has 9 citrus rootstocks', () => {
        expect(CITRUS_ROOTSTOCKS.length).toBe(9)
      })

      it('has 3 stone fruit rootstocks', () => {
        expect(STONE_FRUIT_ROOTSTOCKS.length).toBe(3)
      })

      it('all rootstocks have required fields', () => {
        const allStocks = [...CITRUS_ROOTSTOCKS, ...STONE_FRUIT_ROOTSTOCKS]

        allStocks.forEach(r => {
          expect(r.id).toBeDefined()
          expect(r.name).toBeDefined()
          expect(r.brixModifier).toBeDefined()
          expect(typeof r.brixModifier).toBe('number')
          expect(r.vigor).toBeDefined()
          expect(r.cropCategories.length).toBeGreaterThan(0)
        })
      })

      it('brix modifiers are within expected range', () => {
        const allStocks = [...CITRUS_ROOTSTOCKS, ...STONE_FRUIT_ROOTSTOCKS]

        allStocks.forEach(r => {
          expect(r.brixModifier).toBeGreaterThanOrEqual(-1.0)
          expect(r.brixModifier).toBeLessThanOrEqual(1.0)
        })
      })
    })
  })

  // ==========================================================================
  // CULTIVAR/QUALITY TIER DATA TESTS
  // ==========================================================================
  describe('Cultivar Quality Profiles', () => {
    describe('getCultivarProfile', () => {
      it('returns Washington Navel profile', () => {
        const profile = getCultivarProfile('washington_navel')

        expect(profile).toBeDefined()
        expect(profile?.cultivarName).toBe('Washington Navel')
        expect(profile?.cropType).toBe('navel_orange')
        expect(profile?.qualityTier).toBe('premium')
        expect(profile?.researchPeakBrix).toBe(12.5)
        expect(profile?.researchAvgBrix).toBe(11.5)
        expect(profile?.heritageIntent).toBe('heirloom_quality')
        expect(profile?.isHeirloom).toBe(true)
      })

      it('returns Cara Cara profile', () => {
        const profile = getCultivarProfile('cara_cara')

        expect(profile).toBeDefined()
        expect(profile?.researchPeakBrix).toBe(13.0)
        expect(profile?.researchAvgBrix).toBe(12.0)
        expect(profile?.heritageIntent).toBe('modern_nutrient')
        expect(profile?.isHeirloom).toBe(false)
      })

      it('returns Georgia Belle (artisan tier)', () => {
        const profile = getCultivarProfile('georgia_belle')

        expect(profile).toBeDefined()
        expect(profile?.qualityTier).toBe('artisan')
        expect(profile?.researchPeakBrix).toBe(16.0)
      })

      it('returns undefined for unknown cultivar', () => {
        expect(getCultivarProfile('unknown_cultivar')).toBeUndefined()
      })
    })

    describe('getCultivarsForCrop', () => {
      it('returns navel orange cultivars', () => {
        const navels = getCultivarsForCrop('navel_orange')

        expect(navels.length).toBe(3)  // Washington, Cara Cara, Lane Late
        expect(navels.every(c => c.cropType === 'navel_orange')).toBe(true)
      })

      it('returns peach cultivars', () => {
        const peaches = getCultivarsForCrop('peach')

        expect(peaches.length).toBe(2)  // Elberta, Georgia Belle
        expect(peaches.every(c => c.cropType === 'peach')).toBe(true)
      })

      it('returns empty array for unknown crop', () => {
        expect(getCultivarsForCrop('unknown_crop')).toHaveLength(0)
      })
    })

    describe('inferTierFromBrix', () => {
      it('returns artisan for Brix >= 14', () => {
        expect(inferTierFromBrix(14)).toBe('artisan')
        expect(inferTierFromBrix(15)).toBe('artisan')
        expect(inferTierFromBrix(18)).toBe('artisan')
      })

      it('returns premium for Brix 12-13.9', () => {
        expect(inferTierFromBrix(12)).toBe('premium')
        expect(inferTierFromBrix(13)).toBe('premium')
        expect(inferTierFromBrix(13.9)).toBe('premium')
      })

      it('returns standard for Brix 10-11.9', () => {
        expect(inferTierFromBrix(10)).toBe('standard')
        expect(inferTierFromBrix(11)).toBe('standard')
        expect(inferTierFromBrix(11.9)).toBe('standard')
      })

      it('returns commodity for Brix < 10', () => {
        expect(inferTierFromBrix(9)).toBe('commodity')
        expect(inferTierFromBrix(8)).toBe('commodity')
        expect(inferTierFromBrix(5)).toBe('commodity')
      })
    })

    describe('getExpectedBrixRange', () => {
      it('returns correct ranges for each tier', () => {
        expect(getExpectedBrixRange('artisan')).toEqual([14, 18])
        expect(getExpectedBrixRange('premium')).toEqual([12, 15])
        expect(getExpectedBrixRange('standard')).toEqual([10, 12])
        expect(getExpectedBrixRange('commodity')).toEqual([8, 10])
      })
    })

    describe('quality tier info integrity', () => {
      it('has all 4 quality tiers defined', () => {
        expect(Object.keys(QUALITY_TIER_INFO)).toHaveLength(4)
        expect(QUALITY_TIER_INFO.artisan).toBeDefined()
        expect(QUALITY_TIER_INFO.premium).toBeDefined()
        expect(QUALITY_TIER_INFO.standard).toBeDefined()
        expect(QUALITY_TIER_INFO.commodity).toBeDefined()
      })

      it('has non-overlapping Brix ranges', () => {
        // Artisan starts at 14
        expect(QUALITY_TIER_INFO.artisan.typicalBrixRange[0]).toBe(14)
        // Premium: 12-15 (overlaps with artisan at top, standard at bottom)
        expect(QUALITY_TIER_INFO.premium.typicalBrixRange).toEqual([12, 15])
        // Standard: 10-12
        expect(QUALITY_TIER_INFO.standard.typicalBrixRange).toEqual([10, 12])
        // Commodity: 8-10
        expect(QUALITY_TIER_INFO.commodity.typicalBrixRange).toEqual([8, 10])
      })
    })

    describe('cultivar data integrity', () => {
      it('has 12 cultivar profiles', () => {
        expect(CULTIVAR_QUALITY_PROFILES.length).toBe(12)
      })

      it('all cultivars have required fields', () => {
        CULTIVAR_QUALITY_PROFILES.forEach(c => {
          expect(c.cultivarId).toBeDefined()
          expect(c.cultivarName).toBeDefined()
          expect(c.cropType).toBeDefined()
          expect(c.qualityTier).toBeDefined()
          expect(c.heritageIntent).toBeDefined()
          expect(c.maturityType).toBeDefined()
          expect(c.timingClass).toBeDefined()
        })
      })

      it('all cultivars have research Brix data', () => {
        CULTIVAR_QUALITY_PROFILES.forEach(c => {
          expect(c.researchPeakBrix).toBeGreaterThan(0)
          expect(c.researchAvgBrix).toBeGreaterThan(0)
          expect(c.researchPeakBrix).toBeGreaterThanOrEqual(c.researchAvgBrix!)
        })
      })
    })
  })

  // ==========================================================================
  // GDD TARGETS DATA TESTS
  // ==========================================================================
  describe('GDD Targets', () => {
    describe('getGddTargets', () => {
      it('returns correct targets for navel orange', () => {
        const targets = getGddTargets('navel_orange')

        expect(targets.baseTemp).toBe(55)
        expect(targets.gddToMaturity).toBe(5100)
        expect(targets.gddToPeak).toBe(6100)
        expect(targets.gddWindow).toBe(2000)
      })

      it('returns correct targets for peach', () => {
        const targets = getGddTargets('peach')

        expect(targets.baseTemp).toBe(45)
        expect(targets.gddToMaturity).toBe(1800)
        expect(targets.gddToPeak).toBe(2000)
        expect(targets.gddWindow).toBe(150)
        expect(targets.chillHoursRequired).toBe(650)
      })

      it('returns correct targets for strawberry', () => {
        const targets = getGddTargets('strawberry')

        expect(targets.baseTemp).toBe(50)
        expect(targets.gddToMaturity).toBe(700)
        expect(targets.gddToPeak).toBe(1300)
        expect(targets.gddWindow).toBe(1100)
      })

      it('returns default targets for unknown crop', () => {
        const targets = getGddTargets('unknown_crop')

        expect(targets.baseTemp).toBe(50)
        expect(targets.gddToMaturity).toBe(1800)
        expect(targets.gddToPeak).toBe(2100)
        expect(targets.gddWindow).toBe(200)
      })
    })

    describe('GDD targets data integrity', () => {
      it('has 15 crops defined', () => {
        expect(Object.keys(CROP_GDD_TARGETS)).toHaveLength(15)
      })

      it('all crops have required fields', () => {
        Object.entries(CROP_GDD_TARGETS).forEach(([cropId, targets]) => {
          expect(targets.baseTemp).toBeGreaterThan(0)
          expect(targets.gddToMaturity).toBeGreaterThan(0)
          expect(targets.gddWindow).toBeGreaterThan(0)
        })
      })

      it('citrus crops have base temp 55', () => {
        const citrusCrops = ['navel_orange', 'valencia', 'grapefruit', 'tangerine', 'satsuma']

        citrusCrops.forEach(crop => {
          expect(CROP_GDD_TARGETS[crop].baseTemp).toBe(55)
        })
      })

      it('stone fruit has lower base temps', () => {
        expect(CROP_GDD_TARGETS['peach'].baseTemp).toBeLessThan(50)
        expect(CROP_GDD_TARGETS['sweet_cherry'].baseTemp).toBeLessThan(45)
      })

      it('gddToPeak > gddToMaturity for all crops', () => {
        Object.entries(CROP_GDD_TARGETS).forEach(([cropId, targets]) => {
          if (targets.gddToPeak) {
            expect(targets.gddToPeak).toBeGreaterThan(targets.gddToMaturity)
          }
        })
      })
    })
  })
})
