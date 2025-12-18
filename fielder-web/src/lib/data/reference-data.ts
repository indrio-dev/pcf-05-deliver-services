/**
 * =============================================================================
 * REFERENCE DATA SERVICE
 * =============================================================================
 *
 * F009: Unified access layer for reference data (cultivars, rootstocks, regions).
 *
 * Features:
 * - Feature flag: USE_DATABASE_REFERENCE_DATA
 * - In-memory cache with TTL
 * - Database queries with constants fallback
 * - Consistent interface regardless of data source
 *
 * Usage:
 *   import { referenceData } from '@/lib/data/reference-data'
 *
 *   const cultivar = await referenceData.getCultivar('washington_navel')
 *   const rootstock = await referenceData.getRootstock('carrizo')
 *   const region = await referenceData.getRegion('indian_river')
 */

import { createClient } from '@supabase/supabase-js'

// Constants imports (fallback data source)
import {
  getRootstock as getConstantRootstock,
  getRootstockBrixModifier as getConstantRootstockBrixModifier,
  getRootstocksForCategory as getConstantRootstocksForCategory,
  type Rootstock,
  type RootstockCropCategory,
} from '@/lib/constants/rootstocks'

import {
  getCultivarProfile as getConstantCultivarProfile,
  getCultivarsForCrop as getConstantCultivarsForCrop,
  type CultivarQualityProfile,
  type QualityTier,
} from '@/lib/constants/quality-tiers'

import {
  getRegion as getConstantRegion,
  getRegionsByState as getConstantRegionsByState,
  type GrowingRegion,
} from '@/lib/constants/regions'

import { CROP_GDD_TARGETS, getGddTargets as getConstantGddTargets } from '@/lib/constants/gdd-targets'

// =============================================================================
// CONFIGURATION
// =============================================================================

/**
 * Feature flag: When true, queries Supabase first; falls back to constants.
 * When false, uses constants directly (no database calls).
 *
 * Set via environment variable: USE_DATABASE_REFERENCE_DATA=true
 */
export const USE_DATABASE_REFERENCE_DATA =
  process.env.USE_DATABASE_REFERENCE_DATA === 'true'

/**
 * Cache TTL in milliseconds (default: 5 minutes)
 * Reference data rarely changes, so longer TTL is fine.
 */
const CACHE_TTL_MS = parseInt(process.env.REFERENCE_DATA_CACHE_TTL || '300000', 10)

// =============================================================================
// TYPES
// =============================================================================

export interface GddTargets {
  baseTemp: number
  gddToMaturity: number
  gddToPeak?: number
  gddWindow: number
  chillHoursRequired?: number
}

interface CacheEntry<T> {
  data: T
  timestamp: number
}

type CacheKey = string

// =============================================================================
// CACHE IMPLEMENTATION
// =============================================================================

/**
 * Simple in-memory cache with TTL.
 * Thread-safe for Node.js single-threaded event loop.
 */
class ReferenceDataCache {
  private cache: Map<CacheKey, CacheEntry<unknown>> = new Map()
  private ttlMs: number

  constructor(ttlMs: number = CACHE_TTL_MS) {
    this.ttlMs = ttlMs
  }

  /**
   * Get cached value if not expired.
   */
  get<T>(key: CacheKey): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const isExpired = Date.now() - entry.timestamp > this.ttlMs
    if (isExpired) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  /**
   * Set cached value with current timestamp.
   */
  set<T>(key: CacheKey, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    })
  }

  /**
   * Clear entire cache.
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Clear specific key.
   */
  delete(key: CacheKey): void {
    this.cache.delete(key)
  }

  /**
   * Get cache stats for monitoring.
   */
  stats(): { size: number; ttlMs: number } {
    return {
      size: this.cache.size,
      ttlMs: this.ttlMs,
    }
  }
}

// Global cache instance
const cache = new ReferenceDataCache()

// =============================================================================
// SUPABASE CLIENT (lazy initialization)
// =============================================================================

let supabaseClient: ReturnType<typeof createClient> | null = null

function getSupabaseClient() {
  if (!supabaseClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !key) {
      console.warn('Supabase credentials not configured, using constants fallback')
      return null
    }

    supabaseClient = createClient(url, key)
  }
  return supabaseClient
}

// =============================================================================
// REFERENCE DATA SERVICE
// =============================================================================

/**
 * Reference Data Service
 *
 * Provides unified access to reference data with:
 * - Feature flag for database vs constants
 * - In-memory caching with TTL
 * - Graceful fallback to constants on database errors
 */
export const referenceData = {
  // ===========================================================================
  // CULTIVAR METHODS
  // ===========================================================================

  /**
   * Get cultivar profile by ID.
   */
  async getCultivar(cultivarId: string): Promise<CultivarQualityProfile | null> {
    const cacheKey = `cultivar:${cultivarId}`

    // Check cache first
    const cached = cache.get<CultivarQualityProfile>(cacheKey)
    if (cached) return cached

    // Use constants if database disabled
    if (!USE_DATABASE_REFERENCE_DATA) {
      const result = getConstantCultivarProfile(cultivarId) || null
      if (result) cache.set(cacheKey, result)
      return result
    }

    // Try database
    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        const result = getConstantCultivarProfile(cultivarId) || null
        if (result) cache.set(cacheKey, result)
        return result
      }

      const { data, error } = await supabase
        .from('cultivars')
        .select('*')
        .eq('cultivar_id', cultivarId)
        .single()

      if (error || !data) {
        // Fallback to constants
        const result = getConstantCultivarProfile(cultivarId) || null
        if (result) cache.set(cacheKey, result)
        return result
      }

      // Map database row to CultivarQualityProfile
      const result = mapDbCultivar(data)
      cache.set(cacheKey, result)
      return result
    } catch {
      // Fallback to constants on any error
      const result = getConstantCultivarProfile(cultivarId) || null
      if (result) cache.set(cacheKey, result)
      return result
    }
  },

  /**
   * Get all cultivars for a crop type.
   */
  async getCultivarsForCrop(cropType: string): Promise<CultivarQualityProfile[]> {
    const cacheKey = `cultivars:crop:${cropType}`

    const cached = cache.get<CultivarQualityProfile[]>(cacheKey)
    if (cached) return cached

    if (!USE_DATABASE_REFERENCE_DATA) {
      const result = getConstantCultivarsForCrop(cropType)
      cache.set(cacheKey, result)
      return result
    }

    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        const result = getConstantCultivarsForCrop(cropType)
        cache.set(cacheKey, result)
        return result
      }

      const { data, error } = await supabase
        .from('cultivars')
        .select('*')
        .eq('crop_type', cropType)

      if (error || !data?.length) {
        const result = getConstantCultivarsForCrop(cropType)
        cache.set(cacheKey, result)
        return result
      }

      const result = data.map(mapDbCultivar)
      cache.set(cacheKey, result)
      return result
    } catch {
      const result = getConstantCultivarsForCrop(cropType)
      cache.set(cacheKey, result)
      return result
    }
  },

  /**
   * Get cultivar base Brix value.
   * Convenience method for prediction engine.
   */
  async getCultivarBaseBrix(cultivarId: string): Promise<number> {
    const profile = await this.getCultivar(cultivarId)
    return profile?.researchAvgBrix ?? 10.0 // Default to 10 if unknown
  },

  // ===========================================================================
  // ROOTSTOCK METHODS
  // ===========================================================================

  /**
   * Get rootstock by ID.
   */
  async getRootstock(rootstockId: string): Promise<Rootstock | null> {
    const cacheKey = `rootstock:${rootstockId}`

    const cached = cache.get<Rootstock>(cacheKey)
    if (cached) return cached

    if (!USE_DATABASE_REFERENCE_DATA) {
      const result = getConstantRootstock(rootstockId) || null
      if (result) cache.set(cacheKey, result)
      return result
    }

    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        const result = getConstantRootstock(rootstockId) || null
        if (result) cache.set(cacheKey, result)
        return result
      }

      const { data, error } = await supabase
        .from('rootstocks')
        .select('*')
        .eq('rootstock_id', rootstockId)
        .single()

      if (error || !data) {
        const result = getConstantRootstock(rootstockId) || null
        if (result) cache.set(cacheKey, result)
        return result
      }

      const result = mapDbRootstock(data)
      cache.set(cacheKey, result)
      return result
    } catch {
      const result = getConstantRootstock(rootstockId) || null
      if (result) cache.set(cacheKey, result)
      return result
    }
  },

  /**
   * Get Brix modifier for a rootstock.
   * Convenience method for prediction engine.
   */
  async getRootstockBrixModifier(rootstockId: string | undefined): Promise<number> {
    if (!rootstockId) return 0

    const cacheKey = `rootstock:modifier:${rootstockId}`
    const cached = cache.get<number>(cacheKey)
    if (cached !== null) return cached

    if (!USE_DATABASE_REFERENCE_DATA) {
      const result = getConstantRootstockBrixModifier(rootstockId)
      cache.set(cacheKey, result)
      return result
    }

    const rootstock = await this.getRootstock(rootstockId)
    const result = rootstock?.brixModifier ?? 0
    cache.set(cacheKey, result)
    return result
  },

  /**
   * Get rootstocks for a crop category.
   */
  async getRootstocksForCategory(category: RootstockCropCategory): Promise<Rootstock[]> {
    const cacheKey = `rootstocks:category:${category}`

    const cached = cache.get<Rootstock[]>(cacheKey)
    if (cached) return cached

    if (!USE_DATABASE_REFERENCE_DATA) {
      const result = getConstantRootstocksForCategory(category)
      cache.set(cacheKey, result)
      return result
    }

    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        const result = getConstantRootstocksForCategory(category)
        cache.set(cacheKey, result)
        return result
      }

      const { data, error } = await supabase
        .from('rootstocks')
        .select('*')
        .contains('crop_categories', [category])

      if (error || !data?.length) {
        const result = getConstantRootstocksForCategory(category)
        cache.set(cacheKey, result)
        return result
      }

      const result = data.map(mapDbRootstock)
      cache.set(cacheKey, result)
      return result
    } catch {
      const result = getConstantRootstocksForCategory(category)
      cache.set(cacheKey, result)
      return result
    }
  },

  // ===========================================================================
  // REGION METHODS
  // ===========================================================================

  /**
   * Get region by ID.
   */
  async getRegion(regionId: string): Promise<GrowingRegion | null> {
    const cacheKey = `region:${regionId}`

    const cached = cache.get<GrowingRegion>(cacheKey)
    if (cached) return cached

    if (!USE_DATABASE_REFERENCE_DATA) {
      const result = getConstantRegion(regionId) || null
      if (result) cache.set(cacheKey, result)
      return result
    }

    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        const result = getConstantRegion(regionId) || null
        if (result) cache.set(cacheKey, result)
        return result
      }

      const { data, error } = await supabase
        .from('growing_regions')
        .select('*')
        .eq('region_id', regionId)
        .single()

      if (error || !data) {
        const result = getConstantRegion(regionId) || null
        if (result) cache.set(cacheKey, result)
        return result
      }

      const result = mapDbRegion(data)
      cache.set(cacheKey, result)
      return result
    } catch {
      const result = getConstantRegion(regionId) || null
      if (result) cache.set(cacheKey, result)
      return result
    }
  },

  /**
   * Get regions by state.
   */
  async getRegionsByState(state: string): Promise<GrowingRegion[]> {
    const cacheKey = `regions:state:${state}`

    const cached = cache.get<GrowingRegion[]>(cacheKey)
    if (cached) return cached

    if (!USE_DATABASE_REFERENCE_DATA) {
      const result = getConstantRegionsByState(state)
      cache.set(cacheKey, result)
      return result
    }

    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        const result = getConstantRegionsByState(state)
        cache.set(cacheKey, result)
        return result
      }

      const { data, error } = await supabase
        .from('growing_regions')
        .select('*')
        .eq('state', state)

      if (error || !data?.length) {
        const result = getConstantRegionsByState(state)
        cache.set(cacheKey, result)
        return result
      }

      const result = data.map(mapDbRegion)
      cache.set(cacheKey, result)
      return result
    } catch {
      const result = getConstantRegionsByState(state)
      cache.set(cacheKey, result)
      return result
    }
  },

  // ===========================================================================
  // GDD TARGETS METHODS
  // ===========================================================================

  /**
   * Get GDD targets for a crop.
   */
  async getGddTargets(cropId: string): Promise<GddTargets> {
    const cacheKey = `gdd:${cropId}`

    const cached = cache.get<GddTargets>(cacheKey)
    if (cached) return cached

    if (!USE_DATABASE_REFERENCE_DATA) {
      const result = getConstantGddTargets(cropId)
      cache.set(cacheKey, result)
      return result
    }

    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        const result = getConstantGddTargets(cropId)
        cache.set(cacheKey, result)
        return result
      }

      const { data, error } = await supabase
        .from('crops')
        .select('base_temp, gdd_to_maturity, gdd_to_peak, gdd_window, chill_hours_required')
        .eq('crop_id', cropId)
        .single()

      if (error || !data) {
        const result = getConstantGddTargets(cropId)
        cache.set(cacheKey, result)
        return result
      }

      const result: GddTargets = {
        baseTemp: data.base_temp,
        gddToMaturity: data.gdd_to_maturity,
        gddToPeak: data.gdd_to_peak,
        gddWindow: data.gdd_window,
        chillHoursRequired: data.chill_hours_required,
      }
      cache.set(cacheKey, result)
      return result
    } catch {
      const result = getConstantGddTargets(cropId)
      cache.set(cacheKey, result)
      return result
    }
  },

  /**
   * Get all crop IDs with GDD data.
   */
  async getAllCropIds(): Promise<string[]> {
    const cacheKey = 'crops:all_ids'

    const cached = cache.get<string[]>(cacheKey)
    if (cached) return cached

    if (!USE_DATABASE_REFERENCE_DATA) {
      const result = Object.keys(CROP_GDD_TARGETS)
      cache.set(cacheKey, result)
      return result
    }

    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        const result = Object.keys(CROP_GDD_TARGETS)
        cache.set(cacheKey, result)
        return result
      }

      const { data, error } = await supabase
        .from('crops')
        .select('crop_id')

      if (error || !data?.length) {
        const result = Object.keys(CROP_GDD_TARGETS)
        cache.set(cacheKey, result)
        return result
      }

      const result = data.map(d => d.crop_id)
      cache.set(cacheKey, result)
      return result
    } catch {
      const result = Object.keys(CROP_GDD_TARGETS)
      cache.set(cacheKey, result)
      return result
    }
  },

  // ===========================================================================
  // CACHE MANAGEMENT
  // ===========================================================================

  /**
   * Clear entire cache.
   * Useful for testing or when data is updated.
   */
  clearCache(): void {
    cache.clear()
  },

  /**
   * Get cache statistics.
   */
  getCacheStats(): { size: number; ttlMs: number; useDatabase: boolean } {
    return {
      ...cache.stats(),
      useDatabase: USE_DATABASE_REFERENCE_DATA,
    }
  },
}

// =============================================================================
// DATABASE ROW MAPPERS
// =============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapDbCultivar(row: any): CultivarQualityProfile {
  return {
    cultivarId: row.cultivar_id,
    cultivarName: row.cultivar_name,
    cropType: row.crop_type,
    qualityTier: row.quality_tier as QualityTier,
    breedingFocus: row.breeding_focus || [],
    heritageIntent: row.heritage_intent,
    isHeritage: row.is_heritage ?? false,
    isHeirloom: row.is_heirloom ?? false,
    yearIntroduced: row.year_introduced,
    researchPeakBrix: row.research_peak_brix,
    researchAvgBrix: row.research_avg_brix,
    researchBrixRange: row.research_brix_range,
    maturityType: row.maturity_type,
    timingClass: row.timing_class,
    daysToMaturity: row.days_to_maturity,
    flavorProfile: row.flavor_profile,
    bestUse: row.best_use,
    nutritionHighlights: row.nutrition_highlights,
    sources: row.sources || [],
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapDbRootstock(row: any): Rootstock {
  return {
    id: row.rootstock_id,
    name: row.name,
    cropCategories: row.crop_categories || [],
    brixModifier: row.brix_modifier,
    brixModifierRange: row.brix_modifier_range,
    vigor: row.vigor,
    coldHardyToF: row.cold_hardy_to_f,
    diseaseResistance: row.disease_resistance,
    notes: row.notes,
    sources: row.sources || [],
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapDbRegion(row: any): GrowingRegion {
  return {
    id: row.region_id,
    name: row.name,
    displayName: row.display_name,
    state: row.state,
    latitude: row.latitude,
    longitude: row.longitude,
    climate: row.climate || {},
    viableCrops: row.viable_crops || [],
  }
}

// =============================================================================
// SYNC VERSIONS (for use in non-async contexts)
// =============================================================================

/**
 * Synchronous reference data access using constants only.
 * Use when async is not possible (e.g., in class constructors).
 */
export const referenceDataSync = {
  getCultivar: getConstantCultivarProfile,
  getCultivarsForCrop: getConstantCultivarsForCrop,
  getRootstock: getConstantRootstock,
  getRootstockBrixModifier: getConstantRootstockBrixModifier,
  getRootstocksForCategory: getConstantRootstocksForCategory,
  getRegion: getConstantRegion,
  getRegionsByState: getConstantRegionsByState,
  getGddTargets: getConstantGddTargets,
}
