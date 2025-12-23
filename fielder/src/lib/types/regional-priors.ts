/**
 * Regional Practice Priors
 *
 * Inference system for agricultural practices when farm-specific data is missing.
 * Uses regional distributions derived from Knowledge Graph analysis.
 *
 * Hierarchy: Region → State → National (with decreasing confidence)
 */

export interface RegionalPracticePriors {
  regionId: string
  cropCategory: string

  // Practice distributions that AFFECT QUALITY (sum to 1.0)
  fertilityStrategyDist?: Record<string, number>  // Affects Brix via soil quality
  feedingRegimeDist?: Record<string, number>      // Affects omega ratio (livestock)

  // Note: pestManagementDist REMOVED - doesn't affect Brix/nutrition
  // (pesticides on separate axis from quality - see CLAUDE.md)

  // Metadata
  nFarmsInSample: number
  dataSource: string
  confidence: number
}

/**
 * Get regional practice prior with fallback hierarchy
 */
export async function getRegionalPracticePrior(
  regionId: string,
  cropCategory: string
): Promise<RegionalPracticePriors | null> {
  // Try region-specific first
  const regionPrior = await queryPriorFromDB(regionId, cropCategory)
  if (regionPrior) return regionPrior

  // Fallback to state-level
  const stateId = extractStateFromRegion(regionId)
  if (stateId) {
    const statePrior = await queryPriorFromDB(`state_${stateId.toLowerCase()}`, cropCategory)
    if (statePrior) {
      // Reduce confidence for state-level fallback
      return { ...statePrior, confidence: statePrior.confidence * 0.8 }
    }
  }

  // Fallback to national defaults
  return getNationalDefaultPrior(cropCategory)
}

/**
 * Query priors from database (stub - would query Supabase regional_practice_priors table)
 */
async function queryPriorFromDB(
  regionId: string,
  cropCategory: string
): Promise<RegionalPracticePriors | null> {
  // TODO: Query from regional_practice_priors table
  // For now, use constants
  const { getRegionalPracticePrior: getPriorFromConstants } =
    await import('@/lib/constants/regional-practice-priors')

  return getPriorFromConstants(regionId, cropCategory)
}

/**
 * Extract state code from region ID
 * Example: 'indian_river_fl' → 'FL'
 */
function extractStateFromRegion(regionId: string): string | null {
  // Pattern: region_name_{state}
  const match = regionId.match(/_([a-z]{2})$/i)
  if (match) return match[1].toUpperCase()

  // Pattern: state_{state}
  const stateMatch = regionId.match(/^state_([a-z]{2})$/i)
  if (stateMatch) return stateMatch[1].toUpperCase()

  return null
}

/**
 * National defaults when regional data unavailable
 */
function getNationalDefaultPrior(cropCategory: string): RegionalPracticePriors {
  const defaults: Record<string, Partial<RegionalPracticePriors>> = {
    citrus: {
      fertilityStrategyDist: {
        'annual_fertility': 0.65,
        'soil_banking': 0.25,
        'mineralized_soil_science': 0.10
      },
      pestManagementDist: {
        'conventional': 0.40,
        'ipm': 0.35,
        'organic': 0.20,
        'no_spray': 0.05
      }
    },

    stone_fruit: {
      fertilityStrategyDist: {
        'annual_fertility': 0.60,
        'soil_banking': 0.30,
        'mineralized_soil_science': 0.10
      },
      pestManagementDist: {
        'conventional': 0.35,
        'ipm': 0.40,
        'organic': 0.20,
        'no_spray': 0.05
      }
    },

    pome_fruit: {
      fertilityStrategyDist: {
        'annual_fertility': 0.55,
        'soil_banking': 0.35,
        'mineralized_soil_science': 0.10
      },
      pestManagementDist: {
        'conventional': 0.30,
        'ipm': 0.45,
        'organic': 0.20,
        'no_spray': 0.05
      }
    },

    berries: {
      fertilityStrategyDist: {
        'annual_fertility': 0.50,
        'soil_banking': 0.35,
        'mineralized_soil_science': 0.15
      },
      pestManagementDist: {
        'conventional': 0.25,
        'ipm': 0.40,
        'organic': 0.30,
        'no_spray': 0.05
      }
    },

    beef: {
      feedingRegimeDist: {
        'grass_only': 0.05,
        'pasture_grain_supp': 0.10,
        'grain_finished': 0.70,
        'grain_fed': 0.15
      }
    },

    general: {
      fertilityStrategyDist: {
        'annual_fertility': 0.60,
        'soil_banking': 0.30,
        'mineralized_soil_science': 0.10
      },
      pestManagementDist: {
        'conventional': 0.35,
        'ipm': 0.40,
        'organic': 0.20,
        'no_spray': 0.05
      }
    }
  }

  const categoryDefaults = defaults[cropCategory] || defaults.general

  return {
    regionId: 'national',
    cropCategory,
    nFarmsInSample: 1000,
    dataSource: 'usda_nass_2022',
    confidence: 0.60,
    ...categoryDefaults
  }
}

/**
 * Sample a practice from a probability distribution
 *
 * Example:
 *   dist = { 'annual_fertility': 0.65, 'soil_banking': 0.25, 'mineralized': 0.10 }
 *   → Returns 'annual_fertility' 65% of the time
 */
export function sampleFromPrior(distribution: Record<string, number>): string {
  const rand = Math.random()
  let cumulative = 0

  for (const [practice, prob] of Object.entries(distribution)) {
    cumulative += prob
    if (rand < cumulative) return practice
  }

  // Fallback to first entry if rounding causes issues
  return Object.keys(distribution)[0]
}

/**
 * Apply regional prior when farm data is missing
 *
 * Used in prediction pipeline:
 * - Farm provides practices → Use actual data (high confidence)
 * - Farm missing practices → Use regional prior (medium confidence)
 */
export function applyRegionalPrior(
  prior: RegionalPracticePriors,
  method: 'sample' | 'most_likely' = 'most_likely'
): {
  fertilityStrategy?: string
  feedingRegime?: string
  confidence: number
  inferenceNote: string
} {
  const result: any = {
    confidence: prior.confidence,
    inferenceNote: `Inferred from ${prior.nFarmsInSample} ${prior.regionId} farms`
  }

  if (prior.fertilityStrategyDist) {
    result.fertilityStrategy = method === 'sample'
      ? sampleFromPrior(prior.fertilityStrategyDist)
      : getMostLikely(prior.fertilityStrategyDist)
  }

  if (prior.feedingRegimeDist) {
    result.feedingRegime = method === 'sample'
      ? sampleFromPrior(prior.feedingRegimeDist)
      : getMostLikely(prior.feedingRegimeDist)
  }

  return result
}

/**
 * Get most likely value from distribution
 */
function getMostLikely(distribution: Record<string, number>): string {
  let maxProb = 0
  let maxKey = Object.keys(distribution)[0]

  for (const [key, prob] of Object.entries(distribution)) {
    if (prob > maxProb) {
      maxProb = prob
      maxKey = key
    }
  }

  return maxKey
}
