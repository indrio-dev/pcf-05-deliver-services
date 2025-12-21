/**
 * Regional Offering Generator
 *
 * Automatically generates valid Cultivar × Region combinations
 * based on climate compatibility and growing requirements.
 *
 * This replaces the manual REGIONAL_OFFERINGS array with a
 * comprehensive, data-driven approach.
 */

import { type Cultivar, type RegionalOffering } from './products'
import { PRODUCT_TYPES_BY_ID } from './product-types'
import { ALL_GROWING_REGIONS } from './growing-regions'
import {
  type ClimateZone,
  REGION_CLIMATE_ZONES,
  SUBCATEGORY_CLIMATE_COMPATIBILITY,
  PREMIUM_COMBINATIONS,
} from './climate-zones'

// Re-export for convenience
export type { ClimateZone } from './climate-zones'
export { REGION_CLIMATE_ZONES, SUBCATEGORY_CLIMATE_COMPATIBILITY } from './climate-zones'

/**
 * Get the subcategory for a cultivar by looking up its ProductType
 */
function getCultivarSubcategory(cultivar: Cultivar): string | undefined {
  const productType = PRODUCT_TYPES_BY_ID[cultivar.productId]
  return productType?.subcategory
}

// =============================================================================
// Quality Tier Inference
// =============================================================================

/**
 * Infer quality tier based on region reputation for this crop type
 */
function inferQualityTier(
  cultivar: Cultivar,
  regionId: string
): 'exceptional' | 'excellent' | 'good' | undefined {
  const subcategory = getCultivarSubcategory(cultivar) || ''

  // Check if this is a premium combination
  const premiumRegions = PREMIUM_COMBINATIONS[subcategory] || []
  if (premiumRegions.includes(regionId)) {
    return 'exceptional'
  }

  // Heritage cultivars get a boost
  const heritageIntent = cultivar.heritageIntent
  if (
    heritageIntent === 'true_heritage' ||
    heritageIntent === 'heirloom_quality' ||
    cultivar.isHeritage
  ) {
    return 'excellent'
  }

  return 'good'
}

// =============================================================================
// Generator Function
// =============================================================================

/**
 * Generate all valid Regional Offerings based on climate compatibility
 *
 * @param cultivars - Array of cultivars to generate offerings for.
 *                   Passed as parameter to avoid circular dependency with products.ts
 */
export function generateRegionalOfferings(cultivars: Cultivar[]): RegionalOffering[] {
  const offerings: RegionalOffering[] = []
  const seen = new Set<string>()

  // Build region → climate zone lookup
  const regionsByZone = new Map<ClimateZone, string[]>()
  for (const [regionId, zone] of Object.entries(REGION_CLIMATE_ZONES)) {
    const regions = regionsByZone.get(zone) || []
    regions.push(regionId)
    regionsByZone.set(zone, regions)
  }

  // Generate offerings for each cultivar
  for (const cultivar of cultivars) {
    // Skip origin-locked cultivars (e.g., Kona Coffee, Vidalia Onion)
    // These only appear via curated offerings in their specific origin regions
    if (cultivar.originLocked) continue

    const subcategory = getCultivarSubcategory(cultivar)
    if (!subcategory) continue  // Skip cultivars without a valid product type

    const compatibleZones = SUBCATEGORY_CLIMATE_COMPATIBILITY[subcategory]

    if (!compatibleZones) {
      console.warn(`No climate compatibility defined for subcategory: ${subcategory}`)
      continue
    }

    // Get all regions in compatible climate zones
    const compatibleRegions: string[] = []
    for (const zone of compatibleZones) {
      const regionsInZone = regionsByZone.get(zone) || []
      compatibleRegions.push(...regionsInZone)
    }

    // Create an offering for each compatible region
    for (const regionId of compatibleRegions) {
      const offeringId = `${cultivar.id}_${regionId}`

      // Skip duplicates
      if (seen.has(offeringId)) continue
      seen.add(offeringId)

      // Verify region exists
      const region = ALL_GROWING_REGIONS[regionId as keyof typeof ALL_GROWING_REGIONS]
      if (!region) {
        continue
      }

      // If cultivar has validatedStates, only generate for regions in those states
      // This ensures e.g., Blood Oranges only appear in CA, not all citrus-capable states
      if (cultivar.validatedStates && cultivar.validatedStates.length > 0) {
        if (!cultivar.validatedStates.includes(region.state)) {
          continue
        }
      }

      const offering: RegionalOffering = {
        id: offeringId,
        cultivarId: cultivar.id,
        varietyId: cultivar.id, // Backwards compat
        regionId,
        isActive: true,
        qualityTier: inferQualityTier(cultivar, regionId),
      }

      offerings.push(offering)
    }
  }

  return offerings
}

/**
 * Get statistics about generated offerings
 *
 * @param offerings - Array of regional offerings to analyze
 * @param cultivars - Array of cultivars (passed to avoid circular dependency)
 */
export function getOfferingStats(
  offerings: RegionalOffering[],
  cultivars: Cultivar[]
): {
  total: number
  bySubcategory: Record<string, number>
  byRegion: Record<string, number>
  byQualityTier: Record<string, number>
} {
  const bySubcategory: Record<string, number> = {}
  const byRegion: Record<string, number> = {}
  const byQualityTier: Record<string, number> = {}

  for (const offering of offerings) {
    const cultivar = cultivars.find(c => c.id === offering.cultivarId)
    const subcategory = cultivar ? getCultivarSubcategory(cultivar) || 'unknown' : 'unknown'

    bySubcategory[subcategory] = (bySubcategory[subcategory] || 0) + 1
    byRegion[offering.regionId] = (byRegion[offering.regionId] || 0) + 1
    byQualityTier[offering.qualityTier || 'unrated'] = (byQualityTier[offering.qualityTier || 'unrated'] || 0) + 1
  }

  return {
    total: offerings.length,
    bySubcategory,
    byRegion,
    byQualityTier,
  }
}
