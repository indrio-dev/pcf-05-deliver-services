/**
 * US Growing Regions - Backwards Compatibility Layer
 *
 * This file maintains backwards compatibility with existing API routes
 * while using the new comprehensive growing-regions.ts as the source of truth.
 *
 * For new code, prefer importing directly from './growing-regions'
 */

import {
  ALL_GROWING_REGIONS,
  type GrowingRegionExtended,
} from './growing-regions'

export interface ClimateData {
  avgLastFrostDoy: number   // Day of year for last spring frost
  avgFirstFrostDoy: number  // Day of year for first fall frost
  frostFreeDays: number
  annualGdd50?: number      // GDD accumulation (base 50F)
  avgChillHours?: number    // Hours below 45F
  usdaZone?: string
}

export interface GrowingRegion {
  id: string
  name: string
  displayName: string
  state: string
  latitude: number
  longitude: number
  climate: ClimateData
  viableCrops: string[]
}

/**
 * Convert extended region to legacy format
 */
function toLegacyRegion(region: GrowingRegionExtended): GrowingRegion {
  return {
    id: region.id,
    name: region.name,
    displayName: region.displayName,
    state: region.state,
    latitude: region.latitude,
    longitude: region.longitude,
    climate: region.climate,
    viableCrops: region.primaryProducts,
  }
}

/**
 * All regions in legacy format
 * Derived from the comprehensive growing-regions.ts
 */
export const US_GROWING_REGIONS: Record<string, GrowingRegion> = Object.fromEntries(
  Object.entries(ALL_GROWING_REGIONS).map(([id, region]) => [
    id,
    toLegacyRegion(region),
  ])
)

/**
 * Region coordinates for weather API calls
 */
export const REGION_COORDINATES: Record<string, { lat: number; lon: number }> = Object.fromEntries(
  Object.entries(ALL_GROWING_REGIONS).map(([id, region]) => [
    id,
    { lat: region.latitude, lon: region.longitude },
  ])
)

/**
 * Get region by ID
 */
export function getRegion(regionId: string): GrowingRegion | undefined {
  const extended = ALL_GROWING_REGIONS[regionId]
  return extended ? toLegacyRegion(extended) : undefined
}

/**
 * Get all regions for a state
 */
export function getRegionsByState(state: string): GrowingRegion[] {
  return Object.values(ALL_GROWING_REGIONS)
    .filter((r) => r.state === state || r.states?.includes(state))
    .map(toLegacyRegion)
}
