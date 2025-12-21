/**
 * =============================================================================
 * LIFECYCLE-AWARE AGE MODIFIERS
 * =============================================================================
 *
 * R_MATURITY: The long-term component of the R (Ripen) pillar.
 *
 * For perennial crops (tree, bush, vine), age affects how much of the genetic
 * ceiling (H pillar) can be expressed. This is distinct from R_TIMING (seasonal
 * GDD-based harvest window).
 *
 * For annual crops, there is no age component - only R_TIMING applies.
 *
 * THE SCIENCE:
 *
 * TREE CROPS (Citrus, Stone Fruit, Pome Fruit, Nuts):
 *   Trees shift energy allocation as they mature. Young trees invest in
 *   vegetative growth (roots, canopy). Prime trees maximize reproductive
 *   allocation (fruit). Declining trees produce fewer but often higher-quality
 *   fruits (the "declining tree paradox" - natural thinning effect).
 *
 * BUSH CROPS (Blueberry, Blackberry, Raspberry):
 *   Faster maturity cycle than trees. Prime production typically 3-8 years.
 *   Bushes are often replaced after 15-20 years when productivity declines.
 *
 * VINE CROPS (Grapes, Kiwi, Passion Fruit):
 *   Similar to bushes but with longer productive lifespans.
 *   Old vines (30+ years) are prized in wine grapes for concentrated flavors.
 *
 * ANNUALS (Vegetables, Herbs):
 *   No age modifier - plants are grown from seed each season.
 *   Only R_TIMING (GDD-based) applies.
 *
 * =============================================================================
 */

import type { CropLifecycle, MaturityProfile } from '../constants/products'
import { CROP_GDD_TARGETS, type GDDTarget } from '../constants/gdd-targets'

// =============================================================================
// TYPES
// =============================================================================

export type AgeModifierType = 'tree_standard' | 'bush_standard' | 'vine_standard' | 'none'

export type MaturityStage =
  | 'pre_bearing'   // Not yet producing commercial fruit
  | 'juvenile'      // First years of bearing, low allocation to fruit
  | 'developing'    // Building toward prime, quality improving
  | 'prime'         // Optimal reproductive allocation, peak quality potential
  | 'mature'        // Past prime but still productive
  | 'declining'     // Reduced capacity, but concentrated quality per fruit

export interface AgeModifierResult {
  modifier: number              // Brix adjustment (-0.8 to +0.0)
  stage: MaturityStage
  reproductiveAllocation: number  // 0-100 percentage of energy to fruit
  confidence: number            // 0-1
  insight: string               // Human-readable explanation
  decliningParadox?: boolean    // True if old with concentrated fruit quality
}

// =============================================================================
// AGE MODIFIER CURVES
// =============================================================================

/**
 * Tree Standard Age Curve
 *
 * Based on citrus research (UF/IFAS) and stone fruit studies.
 * Trees have long productive lives but take years to reach prime.
 *
 * | Age Range   | Modifier | Stage        | Reproductive Allocation |
 * |-------------|----------|--------------|-------------------------|
 * | 0-2 years   | -0.8     | Pre-bearing  | 0% (all vegetative)     |
 * | 3-4 years   | -0.5     | Juvenile     | 20%                     |
 * | 5-7 years   | -0.2     | Developing   | 50%                     |
 * | 8-18 years  | 0.0      | Prime        | 85%                     |
 * | 19-25 years | -0.2     | Mature       | 70%                     |
 * | 25+ years   | -0.3     | Declining    | 60% (concentrated)      |
 */
function getTreeStandardModifier(ageYears: number): AgeModifierResult {
  if (ageYears <= 2) {
    return {
      modifier: -0.8,
      stage: 'pre_bearing',
      reproductiveAllocation: 0,
      confidence: 0.9,
      insight: 'Pre-bearing: All energy to vegetative growth (roots, canopy), no fruit production',
    }
  }

  if (ageYears <= 4) {
    return {
      modifier: -0.5,
      stage: 'juvenile',
      reproductiveAllocation: 20,
      confidence: 0.9,
      insight: 'Juvenile: First bearing years, fruit competes with canopy development',
    }
  }

  if (ageYears <= 7) {
    return {
      modifier: -0.2,
      stage: 'developing',
      reproductiveAllocation: 50,
      confidence: 0.85,
      insight: 'Developing: Balanced allocation, quality improving each year',
    }
  }

  if (ageYears <= 18) {
    return {
      modifier: 0.0,
      stage: 'prime',
      reproductiveAllocation: 85,
      confidence: 0.95,
      insight: 'Prime production: Optimized reproductive allocation, peak quality potential',
    }
  }

  if (ageYears <= 25) {
    return {
      modifier: -0.2,
      stage: 'mature',
      reproductiveAllocation: 70,
      confidence: 0.85,
      insight: 'Mature: Past prime but still highly productive',
    }
  }

  // 25+ years - declining tree paradox
  return {
    modifier: -0.3,
    stage: 'declining',
    reproductiveAllocation: 60,
    confidence: 0.8,
    insight: 'Declining tree paradox: Fewer fruits but each receives concentrated energy',
    decliningParadox: true,
  }
}

/**
 * Bush Standard Age Curve
 *
 * Based on blueberry research (MSU, UF/IFAS).
 * Bushes mature faster than trees but have shorter productive lifespans.
 *
 * | Age Range  | Modifier | Stage       | Reproductive Allocation |
 * |------------|----------|-------------|-------------------------|
 * | 0-1 years  | -0.8     | Pre-bearing | 0%                      |
 * | 1-2 years  | -0.5     | Juvenile    | 20%                     |
 * | 3-5 years  | 0.0      | Prime       | 85%                     |
 * | 6-10 years | -0.1     | Mature      | 75%                     |
 * | 10+ years  | -0.3     | Declining   | 50%                     |
 */
function getBushStandardModifier(ageYears: number): AgeModifierResult {
  if (ageYears < 1) {
    return {
      modifier: -0.8,
      stage: 'pre_bearing',
      reproductiveAllocation: 0,
      confidence: 0.9,
      insight: 'Pre-bearing: Establishing root system, no fruit production',
    }
  }

  if (ageYears <= 2) {
    return {
      modifier: -0.5,
      stage: 'juvenile',
      reproductiveAllocation: 20,
      confidence: 0.9,
      insight: 'Juvenile: Light first crop, plant still establishing',
    }
  }

  if (ageYears <= 5) {
    return {
      modifier: 0.0,
      stage: 'prime',
      reproductiveAllocation: 85,
      confidence: 0.95,
      insight: 'Prime production: Maximum fruit quality and yield',
    }
  }

  if (ageYears <= 10) {
    return {
      modifier: -0.1,
      stage: 'mature',
      reproductiveAllocation: 75,
      confidence: 0.85,
      insight: 'Mature: Still productive, beginning gradual decline',
    }
  }

  // 10+ years
  return {
    modifier: -0.3,
    stage: 'declining',
    reproductiveAllocation: 50,
    confidence: 0.8,
    insight: 'Declining: Often replaced for economic productivity',
    decliningParadox: true,
  }
}

/**
 * Vine Standard Age Curve
 *
 * Based on grape viticulture research.
 * Vines have intermediate maturity between bushes and trees.
 * Old vines (especially in wine grapes) are prized for concentrated flavors.
 *
 * | Age Range   | Modifier | Stage       | Reproductive Allocation |
 * |-------------|----------|-------------|-------------------------|
 * | 0-2 years   | -0.8     | Pre-bearing | 0%                      |
 * | 3-4 years   | -0.4     | Juvenile    | 30%                     |
 * | 5-10 years  | 0.0      | Prime       | 85%                     |
 * | 11-25 years | -0.1     | Mature      | 80%                     |
 * | 25+ years   | -0.2     | Old Vine    | 70% (concentrated)      |
 *
 * Note: "Old vine" is a quality designation in wine - lower yield but
 * more concentrated flavors. This is the "declining paradox" for vines.
 */
function getVineStandardModifier(ageYears: number): AgeModifierResult {
  if (ageYears <= 2) {
    return {
      modifier: -0.8,
      stage: 'pre_bearing',
      reproductiveAllocation: 0,
      confidence: 0.9,
      insight: 'Pre-bearing: Vine establishment, training the structure',
    }
  }

  if (ageYears <= 4) {
    return {
      modifier: -0.4,
      stage: 'juvenile',
      reproductiveAllocation: 30,
      confidence: 0.9,
      insight: 'Juvenile: First crops, vine maturing',
    }
  }

  if (ageYears <= 10) {
    return {
      modifier: 0.0,
      stage: 'prime',
      reproductiveAllocation: 85,
      confidence: 0.95,
      insight: 'Prime production: Full vigor, balanced yield and quality',
    }
  }

  if (ageYears <= 25) {
    return {
      modifier: -0.1,
      stage: 'mature',
      reproductiveAllocation: 80,
      confidence: 0.85,
      insight: 'Mature: Excellent quality, moderate yield',
    }
  }

  // 25+ years - old vine designation
  return {
    modifier: -0.2,
    stage: 'declining',
    reproductiveAllocation: 70,
    confidence: 0.85,
    insight: 'Old vine: Lower yield but concentrated, complex flavors (quality premium)',
    decliningParadox: true,
  }
}

// =============================================================================
// MAIN FUNCTIONS
// =============================================================================

/**
 * Get age modifier based on lifecycle type and age.
 *
 * This is the primary function for lifecycle-aware age modifiers.
 * It looks up the crop's lifecycle and applies the appropriate curve.
 *
 * @param ageYears - Plant/tree age in years
 * @param cropIdOrLifecycle - Either a crop ID (to look up lifecycle) or a CropLifecycle directly
 * @param ageModifierType - Optional override for the age modifier type
 */
export function getLifecycleAgeModifier(
  ageYears: number | undefined,
  cropIdOrLifecycle: string | CropLifecycle,
  ageModifierType?: AgeModifierType
): AgeModifierResult {
  // Handle undefined age
  if (ageYears === undefined) {
    return {
      modifier: 0,
      stage: 'prime',
      reproductiveAllocation: 70,
      confidence: 0.5,
      insight: 'Age unknown - assuming prime production',
    }
  }

  // Determine the modifier type
  let modifierType: AgeModifierType = 'none'

  if (ageModifierType) {
    // Use explicit override
    modifierType = ageModifierType
  } else {
    // Look up from crop ID or lifecycle
    const lifecycle = resolveLifecycle(cropIdOrLifecycle)

    switch (lifecycle) {
      case 'tree_perennial':
        modifierType = 'tree_standard'
        break
      case 'bush_perennial':
        modifierType = 'bush_standard'
        break
      case 'vine_perennial':
        modifierType = 'vine_standard'
        break
      case 'annual_row':
      case 'annual_replanted':
      default:
        modifierType = 'none'
    }
  }

  // Apply the appropriate curve
  switch (modifierType) {
    case 'tree_standard':
      return getTreeStandardModifier(ageYears)
    case 'bush_standard':
      return getBushStandardModifier(ageYears)
    case 'vine_standard':
      return getVineStandardModifier(ageYears)
    case 'none':
    default:
      return getAnnualResult()
  }
}

/**
 * Result for annual crops - no age modifier applies.
 */
function getAnnualResult(): AgeModifierResult {
  return {
    modifier: 0,
    stage: 'prime',
    reproductiveAllocation: 100,  // Annuals go all-in on reproduction
    confidence: 1.0,
    insight: 'Annual crop: Age modifier not applicable (R_timing only)',
  }
}

/**
 * Resolve a crop ID or lifecycle string to a CropLifecycle.
 */
function resolveLifecycle(cropIdOrLifecycle: string | CropLifecycle): CropLifecycle {
  // Check if it's already a lifecycle
  const validLifecycles: CropLifecycle[] = [
    'tree_perennial',
    'bush_perennial',
    'vine_perennial',
    'annual_row',
    'annual_replanted',
  ]

  if (validLifecycles.includes(cropIdOrLifecycle as CropLifecycle)) {
    return cropIdOrLifecycle as CropLifecycle
  }

  // Look up from CROP_GDD_TARGETS
  const gddTarget = CROP_GDD_TARGETS[cropIdOrLifecycle]
  if (gddTarget?.lifecycle) {
    return gddTarget.lifecycle
  }

  // Fallback: infer from crop ID patterns
  return inferLifecycleFromCropId(cropIdOrLifecycle)
}

/**
 * Infer lifecycle from crop ID when not explicitly defined.
 * This is a fallback for crops not yet in CROP_GDD_TARGETS.
 */
function inferLifecycleFromCropId(cropId: string): CropLifecycle {
  const lower = cropId.toLowerCase()

  // Tree crops
  if (
    lower.includes('orange') ||
    lower.includes('grapefruit') ||
    lower.includes('lemon') ||
    lower.includes('lime') ||
    lower.includes('tangerine') ||
    lower.includes('citrus') ||
    lower.includes('apple') ||
    lower.includes('pear') ||
    lower.includes('peach') ||
    lower.includes('cherry') ||
    lower.includes('plum') ||
    lower.includes('apricot') ||
    lower.includes('nectarine') ||
    lower.includes('mango') ||
    lower.includes('avocado') ||
    lower.includes('pecan') ||
    lower.includes('walnut') ||
    lower.includes('almond') ||
    lower.includes('pomegranate') ||
    lower.includes('fig') ||
    lower.includes('olive') ||
    lower.includes('persimmon')
  ) {
    return 'tree_perennial'
  }

  // Bush crops
  if (
    lower.includes('blueberry') ||
    lower.includes('blackberry') ||
    lower.includes('raspberry') ||
    lower.includes('currant') ||
    lower.includes('gooseberry')
  ) {
    return 'bush_perennial'
  }

  // Vine crops
  if (
    lower.includes('grape') ||
    lower.includes('kiwi') ||
    lower.includes('passion') ||
    lower.includes('hop')
  ) {
    return 'vine_perennial'
  }

  // Strawberry is special - perennial grown as annual
  if (lower.includes('strawberry')) {
    return 'annual_replanted'
  }

  // Default to annual
  return 'annual_row'
}

/**
 * Check if a crop lifecycle requires age modifiers.
 */
export function requiresAgeModifier(lifecycle: CropLifecycle): boolean {
  return lifecycle === 'tree_perennial' ||
         lifecycle === 'bush_perennial' ||
         lifecycle === 'vine_perennial'
}

/**
 * Get the prime age range for a crop.
 * Returns undefined for annuals.
 */
export function getPrimeAgeRange(
  cropIdOrLifecycle: string | CropLifecycle
): [number, number] | undefined {
  const lifecycle = resolveLifecycle(cropIdOrLifecycle)

  // Check for explicit maturityProfile in GDD targets
  if (typeof cropIdOrLifecycle === 'string') {
    const gddTarget = CROP_GDD_TARGETS[cropIdOrLifecycle]
    if (gddTarget?.maturityProfile?.primeAgeRangeYears) {
      return gddTarget.maturityProfile.primeAgeRangeYears
    }
  }

  // Default ranges by lifecycle
  switch (lifecycle) {
    case 'tree_perennial':
      return [8, 18]
    case 'bush_perennial':
      return [3, 5]
    case 'vine_perennial':
      return [5, 10]
    default:
      return undefined
  }
}

/**
 * Legacy compatibility wrapper.
 * Maps to the existing getTreeMaturityStage interface.
 */
export function getTreeMaturityStageCompat(
  ageYears: number | undefined,
  cropType?: string
): {
  stage: MaturityStage
  modifier: number
  reproductiveAllocation: number
  confidence: number
  insight: string
  decliningParadox?: boolean
} {
  const result = getLifecycleAgeModifier(ageYears, cropType || 'tree_perennial')
  return result
}
