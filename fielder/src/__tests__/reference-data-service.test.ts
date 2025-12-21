/**
 * Reference Data Service Tests
 *
 * F009: Tests for reference data service with feature flag and caching.
 * Tests constants fallback path (database tests require integration setup).
 */

import {
  referenceData,
  referenceDataSync,
  USE_DATABASE_REFERENCE_DATA,
} from '@/lib/data/reference-data'

describe('Reference Data Service', () => {
  // Clear cache before each test
  beforeEach(() => {
    referenceData.clearCache()
  })

  // ===========================================================================
  // CONFIGURATION
  // ===========================================================================
  describe('Configuration', () => {
    it('has USE_DATABASE_REFERENCE_DATA flag defined', () => {
      expect(typeof USE_DATABASE_REFERENCE_DATA).toBe('boolean')
    })

    it('returns cache stats', () => {
      const stats = referenceData.getCacheStats()

      expect(stats).toHaveProperty('size')
      expect(stats).toHaveProperty('ttlMs')
      expect(stats).toHaveProperty('useDatabase')
      expect(typeof stats.size).toBe('number')
      expect(typeof stats.ttlMs).toBe('number')
    })
  })

  // ===========================================================================
  // CULTIVAR METHODS
  // ===========================================================================
  describe('Cultivar Methods', () => {
    describe('getCultivar', () => {
      it('returns Washington Navel cultivar', async () => {
        const cultivar = await referenceData.getCultivar('washington_navel')

        expect(cultivar).toBeDefined()
        expect(cultivar?.cultivarId).toBe('washington_navel')
        expect(cultivar?.cultivarName).toBe('Washington Navel')
        expect(cultivar?.cropType).toBe('navel_orange')
        expect(cultivar?.qualityTier).toBe('premium')
      })

      it('returns Cara Cara cultivar', async () => {
        const cultivar = await referenceData.getCultivar('cara_cara')

        expect(cultivar).toBeDefined()
        expect(cultivar?.researchPeakBrix).toBe(13.0)
        expect(cultivar?.researchAvgBrix).toBe(12.0)
      })

      it('returns null for unknown cultivar', async () => {
        const cultivar = await referenceData.getCultivar('unknown_cultivar_xyz')

        expect(cultivar).toBeNull()
      })

      it('caches cultivar on second call', async () => {
        // First call - cache miss
        const stats1 = referenceData.getCacheStats()
        const size1 = stats1.size

        await referenceData.getCultivar('washington_navel')

        // Cache should have entry now
        const stats2 = referenceData.getCacheStats()
        expect(stats2.size).toBeGreaterThan(size1)

        // Second call - cache hit (no size increase)
        await referenceData.getCultivar('washington_navel')
        const stats3 = referenceData.getCacheStats()
        expect(stats3.size).toBe(stats2.size)
      })
    })

    describe('getCultivarsForCrop', () => {
      it('returns navel orange cultivars', async () => {
        const cultivars = await referenceData.getCultivarsForCrop('navel_orange')

        expect(cultivars.length).toBeGreaterThanOrEqual(3)
        expect(cultivars.every(c => c.cropType === 'navel_orange')).toBe(true)
      })

      it('returns peach cultivars', async () => {
        const cultivars = await referenceData.getCultivarsForCrop('peach')

        expect(cultivars.length).toBeGreaterThanOrEqual(2)
        expect(cultivars.every(c => c.cropType === 'peach')).toBe(true)
      })

      it('returns empty array for unknown crop', async () => {
        const cultivars = await referenceData.getCultivarsForCrop('unknown_crop_xyz')

        expect(cultivars).toHaveLength(0)
      })
    })

    describe('getCultivarBaseBrix', () => {
      it('returns base Brix for known cultivar', async () => {
        const brix = await referenceData.getCultivarBaseBrix('washington_navel')

        expect(brix).toBe(11.5)
      })

      it('returns default 10.0 for unknown cultivar', async () => {
        const brix = await referenceData.getCultivarBaseBrix('unknown_cultivar')

        expect(brix).toBe(10.0)
      })
    })
  })

  // ===========================================================================
  // ROOTSTOCK METHODS
  // ===========================================================================
  describe('Rootstock Methods', () => {
    describe('getRootstock', () => {
      it('returns Carrizo rootstock', async () => {
        const rootstock = await referenceData.getRootstock('carrizo')

        expect(rootstock).toBeDefined()
        expect(rootstock?.id).toBe('carrizo')
        expect(rootstock?.name).toBe('Carrizo Citrange')
        expect(rootstock?.brixModifier).toBe(0.6)
        expect(rootstock?.vigor).toBe('medium')
      })

      it('returns Swingle rootstock', async () => {
        const rootstock = await referenceData.getRootstock('swingle')

        expect(rootstock).toBeDefined()
        expect(rootstock?.brixModifier).toBe(-0.5)
      })

      it('returns null for unknown rootstock', async () => {
        const rootstock = await referenceData.getRootstock('unknown_stock')

        expect(rootstock).toBeNull()
      })
    })

    describe('getRootstockBrixModifier', () => {
      it('returns correct modifier for high-quality rootstocks', async () => {
        expect(await referenceData.getRootstockBrixModifier('carrizo')).toBe(0.6)
        expect(await referenceData.getRootstockBrixModifier('c35')).toBe(0.6)
        expect(await referenceData.getRootstockBrixModifier('sour_orange')).toBe(0.5)
      })

      it('returns correct modifier for low-quality rootstocks', async () => {
        expect(await referenceData.getRootstockBrixModifier('swingle')).toBe(-0.5)
        expect(await referenceData.getRootstockBrixModifier('rough_lemon')).toBe(-0.7)
      })

      it('returns 0 for unknown rootstock', async () => {
        expect(await referenceData.getRootstockBrixModifier('unknown')).toBe(0)
      })

      it('returns 0 for undefined', async () => {
        expect(await referenceData.getRootstockBrixModifier(undefined)).toBe(0)
      })
    })

    describe('getRootstocksForCategory', () => {
      it('returns citrus rootstocks', async () => {
        const stocks = await referenceData.getRootstocksForCategory('citrus')

        expect(stocks.length).toBeGreaterThanOrEqual(8)
        expect(stocks.every(r => r.cropCategories.includes('citrus'))).toBe(true)
      })

      it('returns stone fruit rootstocks', async () => {
        const stocks = await referenceData.getRootstocksForCategory('stoneFruit')

        expect(stocks.length).toBeGreaterThanOrEqual(3)
        expect(stocks.every(r => r.cropCategories.includes('stoneFruit'))).toBe(true)
      })
    })
  })

  // ===========================================================================
  // REGION METHODS
  // ===========================================================================
  describe('Region Methods', () => {
    describe('getRegion', () => {
      it('returns Indian River region', async () => {
        const region = await referenceData.getRegion('indian_river')

        expect(region).toBeDefined()
        expect(region?.id).toBe('indian_river')
        expect(region?.state).toBe('FL')
      })

      it('returns null for unknown region', async () => {
        const region = await referenceData.getRegion('unknown_region_xyz')

        expect(region).toBeNull()
      })
    })

    describe('getRegionsByState', () => {
      it('returns Florida regions', async () => {
        const regions = await referenceData.getRegionsByState('FL')

        expect(regions.length).toBeGreaterThanOrEqual(1)
        expect(regions.every(r => r.state === 'FL')).toBe(true)
      })

      it('returns California regions', async () => {
        const regions = await referenceData.getRegionsByState('CA')

        expect(regions.length).toBeGreaterThanOrEqual(1)
        expect(regions.every(r => r.state === 'CA')).toBe(true)
      })
    })
  })

  // ===========================================================================
  // GDD TARGETS METHODS
  // ===========================================================================
  describe('GDD Targets Methods', () => {
    describe('getGddTargets', () => {
      it('returns correct targets for navel orange', async () => {
        const targets = await referenceData.getGddTargets('navel_orange')

        expect(targets.baseTemp).toBe(55)
        expect(targets.gddToMaturity).toBe(5100)
        expect(targets.gddToPeak).toBe(6100)
        expect(targets.gddWindow).toBe(3500)  // CALIBRATED 2025-12-21
      })

      it('returns correct targets for peach', async () => {
        const targets = await referenceData.getGddTargets('peach')

        expect(targets.baseTemp).toBe(45)
        expect(targets.gddToMaturity).toBe(1800)
        expect(targets.chillHoursRequired).toBe(650)
      })

      it('returns default targets for unknown crop', async () => {
        const targets = await referenceData.getGddTargets('unknown_crop')

        expect(targets.baseTemp).toBe(50)
        expect(targets.gddToMaturity).toBe(1800)
      })
    })

    describe('getAllCropIds', () => {
      it('returns list of crop IDs', async () => {
        const cropIds = await referenceData.getAllCropIds()

        expect(cropIds.length).toBeGreaterThanOrEqual(15)
        expect(cropIds).toContain('navel_orange')
        expect(cropIds).toContain('peach')
        expect(cropIds).toContain('strawberry')
      })
    })
  })

  // ===========================================================================
  // CACHE MANAGEMENT
  // ===========================================================================
  describe('Cache Management', () => {
    it('clears cache', async () => {
      // Add items to cache
      await referenceData.getCultivar('washington_navel')
      await referenceData.getRootstock('carrizo')

      const stats1 = referenceData.getCacheStats()
      expect(stats1.size).toBeGreaterThan(0)

      // Clear cache
      referenceData.clearCache()

      const stats2 = referenceData.getCacheStats()
      expect(stats2.size).toBe(0)
    })

    it('reports cache size correctly', async () => {
      referenceData.clearCache()

      expect(referenceData.getCacheStats().size).toBe(0)

      await referenceData.getCultivar('washington_navel')
      expect(referenceData.getCacheStats().size).toBe(1)

      await referenceData.getCultivar('cara_cara')
      expect(referenceData.getCacheStats().size).toBe(2)

      // Same key doesn't increase size
      await referenceData.getCultivar('washington_navel')
      expect(referenceData.getCacheStats().size).toBe(2)
    })
  })

  // ===========================================================================
  // SYNC VERSIONS
  // ===========================================================================
  describe('Sync Versions (referenceDataSync)', () => {
    it('getCultivar returns cultivar', () => {
      const cultivar = referenceDataSync.getCultivar('washington_navel')

      expect(cultivar).toBeDefined()
      expect(cultivar?.cultivarName).toBe('Washington Navel')
    })

    it('getRootstock returns rootstock', () => {
      const rootstock = referenceDataSync.getRootstock('carrizo')

      expect(rootstock).toBeDefined()
      expect(rootstock?.brixModifier).toBe(0.6)
    })

    it('getRootstockBrixModifier returns modifier', () => {
      expect(referenceDataSync.getRootstockBrixModifier('carrizo')).toBe(0.6)
      expect(referenceDataSync.getRootstockBrixModifier('unknown')).toBe(0)
    })

    it('getRegion returns region', () => {
      const region = referenceDataSync.getRegion('indian_river')

      expect(region).toBeDefined()
      expect(region?.state).toBe('FL')
    })

    it('getGddTargets returns targets', () => {
      const targets = referenceDataSync.getGddTargets('navel_orange')

      expect(targets.baseTemp).toBe(55)
      expect(targets.gddToMaturity).toBe(5100)
    })
  })
})
