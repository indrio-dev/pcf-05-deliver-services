/**
 * Livestock Breed Database
 *
 * Heritage (H) pillar data for livestock: breed genetics that set the
 * quality ceiling for FAT AMOUNT (marbling), NOT fat composition.
 *
 * KEY INSIGHT: Breed genetics affect HOW MUCH fat, not WHAT KIND of fat.
 *   - Wagyu = more marbling (fat amount)
 *   - But fat composition (omega ratio) is 100% DIET-driven
 *   - Snake River Wagyu (26:1) vs Everglades Ranch Wagyu (6:1) = same genetics, different diet
 *
 * Formula: Final Omega = Diet Contribution + Finishing Duration Penalty
 *   (NO breed modifier - omega is diet-driven, not genetics)
 *
 * H pillar for livestock = marbling potential, maturity timing, flavor profile
 * A pillar for livestock = diet sequence → omega ratio
 *
 * Sources:
 * - USDA National Nutrient Database
 * - OSU Meat Science Extension
 * - Various breed association publications
 * - Peer-reviewed fatty acid research
 */

import type { QualityTier } from './quality-tiers'

// =============================================================================
// Types
// =============================================================================

export type LivestockSpecies = 'beef' | 'pork' | 'poultry' | 'dairy' | 'lamb'

export type HeritageIntent =
  | 'heritage' // Traditional breeds selected for flavor/hardiness
  | 'dual_purpose' // Can be quality or commercial depending on management
  | 'commercial' // Selected for yield/efficiency

export interface LivestockBreed {
  id: string
  species: LivestockSpecies
  name: string
  heritageIntent: HeritageIntent

  // Genetic quality potential
  marblingPotential: number // 1-12 scale (Wagyu = 12)
  omegaBaseline: number // Baseline omega ratio on NEUTRAL diet (~10:1)
  maturityMonths: number // Age for full flavor development

  // Fat characteristics
  fatType: 'saturated_dominant' | 'balanced' | 'unsaturated_dominant'
  intramuscularlFatPct?: number // Marbling %

  // Quality classification
  qualityTier: QualityTier
  flavorProfile?: string
  notes?: string

  // Regional associations
  typicalRegions?: string[]
}

// =============================================================================
// Diet Modifiers (A Pillar Impact on Omega Ratio)
// =============================================================================

/**
 * How diet modifies the omega ratio from breed baseline
 *
 * These are SUBTRACTIVE from a baseline of ~15:1 for grain-fed
 * Better diets = more negative modifier = lower (better) omega ratio
 */
export const DIET_OMEGA_MODIFIERS: Record<string, number> = {
  // Best: 100% grass/forage
  grass_only: -12, // 15 - 12 = ~3:1 ratio

  // Good: Pasture with supplemental forage
  pasture_forage: -10, // 15 - 10 = ~5:1 ratio

  // Mixed: Some grain in diet
  pasture_grain_supplemented: -6, // 15 - 6 = ~9:1 ratio

  // Grain finished: Last 90-120 days on grain
  grain_finished: -2, // 15 - 2 = ~13:1 ratio

  // Full grain: Feedlot/CAFO
  grain_fed: 0, // 15 - 0 = ~15:1 ratio
}

/**
 * Finishing duration penalty per month
 * Each month of grain finishing adds to omega ratio
 */
export const FINISHING_PENALTY_PER_MONTH = 2.5

// =============================================================================
// Beef Breeds
// =============================================================================

export const BEEF_BREEDS: Record<string, LivestockBreed> = {
  // Heritage / High Quality
  angus: {
    id: 'angus',
    species: 'beef',
    name: 'Angus',
    heritageIntent: 'dual_purpose',
    marblingPotential: 8,
    omegaBaseline: 14, // Good baseline
    maturityMonths: 24,
    fatType: 'balanced',
    qualityTier: 'premium',
    flavorProfile: 'Rich, beefy, well-marbled',
    notes: 'Most common premium beef breed in US. Quality depends heavily on management.',
    typicalRegions: ['texas', 'nebraska', 'kansas', 'montana'],
  },

  hereford: {
    id: 'hereford',
    species: 'beef',
    name: 'Hereford',
    heritageIntent: 'heritage',
    marblingPotential: 6,
    omegaBaseline: 12, // Better baseline than Angus
    maturityMonths: 24,
    fatType: 'balanced',
    qualityTier: 'premium',
    flavorProfile: 'Traditional beefy flavor, leaner',
    notes: 'Heritage breed known for hardiness. Lower marbling but cleaner fat profile.',
    typicalRegions: ['texas', 'missouri', 'oklahoma'],
  },

  red_angus: {
    id: 'red_angus',
    species: 'beef',
    name: 'Red Angus',
    heritageIntent: 'heritage',
    marblingPotential: 7,
    omegaBaseline: 13,
    maturityMonths: 24,
    fatType: 'balanced',
    qualityTier: 'premium',
    flavorProfile: 'Similar to Angus, slightly leaner',
    notes: 'Color variant with similar quality traits',
  },

  // Wagyu family (high marbling - affects fat AMOUNT, not composition)
  japanese_wagyu: {
    id: 'japanese_wagyu',
    species: 'beef',
    name: 'Japanese Wagyu',
    heritageIntent: 'commercial', // Selected for fat quantity, not health
    marblingPotential: 12,
    omegaBaseline: 14, // NEUTRAL - Wagyu genetics do NOT affect omega ratio
                       // High omega in luxury Wagyu = extended feedlot, not genetics
    maturityMonths: 30,
    fatType: 'unsaturated_dominant',
    intramuscularlFatPct: 25,
    qualityTier: 'premium', // Premium for flavor
    flavorProfile: 'Extremely rich, buttery, melt-in-mouth',
    notes: 'Highest marbling (fat AMOUNT). Omega ratio determined by DIET, not genetics. Extended feedlot worsens ratio.',
  },

  american_wagyu: {
    id: 'american_wagyu',
    species: 'beef',
    name: 'American Wagyu',
    heritageIntent: 'commercial',
    marblingPotential: 11,
    omegaBaseline: 14, // NEUTRAL - same as Angus. Fat composition = diet, not genetics.
                       // Snake River (26:1) vs Everglades Ranch (6:1) = DIET, same genetics
    maturityMonths: 28,
    fatType: 'unsaturated_dominant',
    intramuscularlFatPct: 20,
    qualityTier: 'premium',
    flavorProfile: 'Rich, well-marbled, less extreme than Japanese',
    notes: 'Wagyu genetics = more fat (marbling), NOT worse fat composition. ' +
           'PROOF: Everglades Ranch (concurrent pasture+grain) grades USDA Prime with 6:1 omega. ' +
           'You do NOT need feedlot to achieve Prime grade - just Wagyu genetics + grain access on pasture.',
    typicalRegions: ['texas', 'idaho', 'california', 'florida'],
  },

  // Dual Purpose
  charolais: {
    id: 'charolais',
    species: 'beef',
    name: 'Charolais',
    heritageIntent: 'dual_purpose',
    marblingPotential: 5,
    omegaBaseline: 13,
    maturityMonths: 26,
    fatType: 'balanced',
    qualityTier: 'standard',
    flavorProfile: 'Lean, mild beefy flavor',
    notes: 'French breed, lean muscle mass',
  },

  simmental: {
    id: 'simmental',
    species: 'beef',
    name: 'Simmental',
    heritageIntent: 'dual_purpose',
    marblingPotential: 6,
    omegaBaseline: 13,
    maturityMonths: 24,
    fatType: 'balanced',
    qualityTier: 'standard',
    flavorProfile: 'Lean, moderate beef flavor',
    notes: 'Swiss breed, good feed efficiency',
  },

  // Commercial
  holstein_beef: {
    id: 'holstein_beef',
    species: 'beef',
    name: 'Holstein (Beef)',
    heritageIntent: 'commercial',
    marblingPotential: 4,
    omegaBaseline: 16, // Dairy genetics, poor beef quality
    maturityMonths: 18,
    fatType: 'saturated_dominant',
    qualityTier: 'commodity',
    flavorProfile: 'Mild, less beefy',
    notes: 'Dairy breed males raised for beef. Lower quality baseline.',
  },

  // Grass-Specialist Breeds
  devon: {
    id: 'devon',
    species: 'beef',
    name: 'Devon (Red Ruby)',
    heritageIntent: 'heritage',
    marblingPotential: 6,
    omegaBaseline: 10, // Excellent grass conversion
    maturityMonths: 26,
    fatType: 'balanced',
    qualityTier: 'premium',
    flavorProfile: 'Deep beefy flavor, excellent grass-fed',
    notes: 'One of the best breeds for 100% grass-fed. Excellent omega profile.',
    typicalRegions: ['vermont', 'virginia'],
  },

  galloway: {
    id: 'galloway',
    species: 'beef',
    name: 'Galloway',
    heritageIntent: 'heritage',
    marblingPotential: 5,
    omegaBaseline: 9, // Excellent omega genetics
    maturityMonths: 28,
    fatType: 'balanced',
    qualityTier: 'premium',
    flavorProfile: 'Rich, complex grass-fed flavor',
    notes: 'Scottish breed optimized for grass. Lowest omega baseline of major breeds.',
  },
}

// =============================================================================
// Pork Breeds
// =============================================================================

export const PORK_BREEDS: Record<string, LivestockBreed> = {
  // Heritage
  berkshire: {
    id: 'berkshire',
    species: 'pork',
    name: 'Berkshire (Kurobuta)',
    heritageIntent: 'heritage',
    marblingPotential: 9,
    omegaBaseline: 10,
    maturityMonths: 10,
    fatType: 'balanced',
    qualityTier: 'premium',
    flavorProfile: 'Rich, sweet, excellent marbling',
    notes: 'The "Wagyu of pork" - but with much better omega profile when pastured.',
  },

  duroc: {
    id: 'duroc',
    species: 'pork',
    name: 'Duroc',
    heritageIntent: 'dual_purpose',
    marblingPotential: 8,
    omegaBaseline: 12,
    maturityMonths: 8,
    fatType: 'balanced',
    qualityTier: 'premium',
    flavorProfile: 'Good marbling, red meat',
    notes: 'Popular for crossbreeding. Good quality when well-managed.',
  },

  hampshire: {
    id: 'hampshire',
    species: 'pork',
    name: 'Hampshire',
    heritageIntent: 'heritage',
    marblingPotential: 6,
    omegaBaseline: 11,
    maturityMonths: 9,
    fatType: 'balanced',
    qualityTier: 'premium',
    flavorProfile: 'Lean, mild flavor',
    notes: 'Leaner heritage breed',
  },

  red_wattle: {
    id: 'red_wattle',
    species: 'pork',
    name: 'Red Wattle',
    heritageIntent: 'heritage',
    marblingPotential: 7,
    omegaBaseline: 9, // Excellent foraging genetics
    maturityMonths: 12,
    fatType: 'balanced',
    qualityTier: 'artisan',
    flavorProfile: 'Deep pork flavor, excellent fat quality',
    notes: 'Rare heritage breed. Exceptional when pastured.',
  },

  gloucestershire_old_spots: {
    id: 'gloucestershire_old_spots',
    species: 'pork',
    name: 'Gloucestershire Old Spots',
    heritageIntent: 'heritage',
    marblingPotential: 7,
    omegaBaseline: 10,
    maturityMonths: 10,
    fatType: 'balanced',
    qualityTier: 'artisan',
    flavorProfile: 'Sweet, rich pork flavor',
    notes: 'Traditional orchard pig. Excellent forager.',
  },

  // Commercial
  yorkshire: {
    id: 'yorkshire',
    species: 'pork',
    name: 'Yorkshire (Large White)',
    heritageIntent: 'commercial',
    marblingPotential: 4,
    omegaBaseline: 16, // Selected for lean, fast growth
    maturityMonths: 5,
    fatType: 'saturated_dominant',
    qualityTier: 'commodity',
    flavorProfile: 'Mild, lean',
    notes: 'Most common commercial breed. Fast growth, lean meat.',
  },

  landrace: {
    id: 'landrace',
    species: 'pork',
    name: 'Landrace',
    heritageIntent: 'commercial',
    marblingPotential: 4,
    omegaBaseline: 15,
    maturityMonths: 5,
    fatType: 'saturated_dominant',
    qualityTier: 'commodity',
    flavorProfile: 'Mild, lean, long body',
    notes: 'Bacon breed. Commercial efficiency.',
  },
}

// =============================================================================
// Poultry Breeds
// =============================================================================

export const POULTRY_BREEDS: Record<string, LivestockBreed> = {
  // Heritage Meat Birds
  freedom_ranger: {
    id: 'freedom_ranger',
    species: 'poultry',
    name: 'Freedom Ranger',
    heritageIntent: 'heritage',
    marblingPotential: 6,
    omegaBaseline: 8,
    maturityMonths: 3,
    fatType: 'balanced',
    qualityTier: 'premium',
    flavorProfile: 'Rich chicken flavor, firm texture',
    notes: 'Bred for pasture systems. Slower growth, better flavor.',
  },

  red_ranger: {
    id: 'red_ranger',
    species: 'poultry',
    name: 'Red Ranger',
    heritageIntent: 'heritage',
    marblingPotential: 6,
    omegaBaseline: 8,
    maturityMonths: 3,
    fatType: 'balanced',
    qualityTier: 'premium',
    flavorProfile: 'Traditional chicken flavor',
    notes: 'Good forager, colored bird.',
  },

  poulet_rouge: {
    id: 'poulet_rouge',
    species: 'poultry',
    name: 'Poulet Rouge',
    heritageIntent: 'heritage',
    marblingPotential: 7,
    omegaBaseline: 7,
    maturityMonths: 4,
    fatType: 'balanced',
    qualityTier: 'artisan',
    flavorProfile: 'Deep, complex chicken flavor',
    notes: 'French Label Rouge standard. Exceptional pasture breed.',
  },

  // Commercial
  cornish_cross: {
    id: 'cornish_cross',
    species: 'poultry',
    name: 'Cornish Cross',
    heritageIntent: 'commercial',
    marblingPotential: 4,
    omegaBaseline: 18, // Very poor on typical diet
    maturityMonths: 1.5, // 6-8 weeks
    fatType: 'saturated_dominant',
    qualityTier: 'commodity',
    flavorProfile: 'Mild, tender',
    notes: 'Standard commercial broiler. 99% of US chicken. Can improve with pasture.',
  },

  // Dual Purpose / Eggs
  rhode_island_red: {
    id: 'rhode_island_red',
    species: 'poultry',
    name: 'Rhode Island Red',
    heritageIntent: 'dual_purpose',
    marblingPotential: 5,
    omegaBaseline: 10,
    maturityMonths: 5,
    fatType: 'balanced',
    qualityTier: 'standard',
    flavorProfile: 'Good flavor, darker meat',
    notes: 'Classic dual-purpose American breed.',
  },
}

// =============================================================================
// Dairy Breeds (for dairy products, not beef)
// =============================================================================

export const DAIRY_BREEDS: Record<string, LivestockBreed> = {
  jersey: {
    id: 'jersey',
    species: 'dairy',
    name: 'Jersey',
    heritageIntent: 'heritage',
    marblingPotential: 0, // N/A for dairy
    omegaBaseline: 6, // Excellent milk fat profile
    maturityMonths: 24,
    fatType: 'balanced',
    qualityTier: 'artisan',
    flavorProfile: 'Rich, high butterfat milk',
    notes: 'Best omega profile of dairy breeds. A2/A2 genetics common.',
  },

  guernsey: {
    id: 'guernsey',
    species: 'dairy',
    name: 'Guernsey',
    heritageIntent: 'heritage',
    marblingPotential: 0,
    omegaBaseline: 7,
    maturityMonths: 24,
    fatType: 'balanced',
    qualityTier: 'premium',
    flavorProfile: 'Golden milk, high beta-carotene',
    notes: 'Heritage breed with excellent milk quality.',
  },

  holstein: {
    id: 'holstein',
    species: 'dairy',
    name: 'Holstein',
    heritageIntent: 'commercial',
    marblingPotential: 0,
    omegaBaseline: 12, // Selected for volume, not quality
    maturityMonths: 24,
    fatType: 'saturated_dominant',
    qualityTier: 'standard',
    flavorProfile: 'Standard milk',
    notes: 'Dominant commercial breed. High volume, lower fat quality.',
  },

  brown_swiss: {
    id: 'brown_swiss',
    species: 'dairy',
    name: 'Brown Swiss',
    heritageIntent: 'dual_purpose',
    marblingPotential: 0,
    omegaBaseline: 9,
    maturityMonths: 26,
    fatType: 'balanced',
    qualityTier: 'premium',
    flavorProfile: 'Good protein, cheese-making milk',
    notes: 'Excellent for cheese production.',
  },
}

// =============================================================================
// Lamb Breeds
// =============================================================================

export const LAMB_BREEDS: Record<string, LivestockBreed> = {
  dorper: {
    id: 'dorper',
    species: 'lamb',
    name: 'Dorper',
    heritageIntent: 'dual_purpose',
    marblingPotential: 6,
    omegaBaseline: 8, // Sheep have better baseline than cattle
    maturityMonths: 8,
    fatType: 'balanced',
    qualityTier: 'premium',
    flavorProfile: 'Mild lamb flavor, tender',
    notes: 'Hair sheep, good for pasture.',
  },

  katahdin: {
    id: 'katahdin',
    species: 'lamb',
    name: 'Katahdin',
    heritageIntent: 'heritage',
    marblingPotential: 5,
    omegaBaseline: 7,
    maturityMonths: 9,
    fatType: 'balanced',
    qualityTier: 'premium',
    flavorProfile: 'Clean lamb flavor',
    notes: 'American hair sheep. Excellent forager.',
  },

  suffolk: {
    id: 'suffolk',
    species: 'lamb',
    name: 'Suffolk',
    heritageIntent: 'commercial',
    marblingPotential: 7,
    omegaBaseline: 10,
    maturityMonths: 7,
    fatType: 'balanced',
    qualityTier: 'standard',
    flavorProfile: 'Traditional lamb flavor',
    notes: 'Most common commercial meat sheep.',
  },
}

// =============================================================================
// Combined Registry
// =============================================================================

export const ALL_BREEDS: Record<string, LivestockBreed> = {
  ...BEEF_BREEDS,
  ...PORK_BREEDS,
  ...POULTRY_BREEDS,
  ...DAIRY_BREEDS,
  ...LAMB_BREEDS,
}

// =============================================================================
// Lookup Functions
// =============================================================================

/**
 * Get breed by ID
 */
export function getBreed(breedId: string): LivestockBreed | undefined {
  return ALL_BREEDS[breedId]
}

/**
 * Get all breeds for a species
 */
export function getBreedsBySpecies(species: LivestockSpecies): LivestockBreed[] {
  return Object.values(ALL_BREEDS).filter((breed) => breed.species === species)
}

/**
 * Get heritage breeds (quality-focused)
 */
export function getHeritageBreeds(species?: LivestockSpecies): LivestockBreed[] {
  return Object.values(ALL_BREEDS).filter(
    (breed) =>
      (breed.heritageIntent === 'heritage' || breed.heritageIntent === 'dual_purpose') &&
      (!species || breed.species === species)
  )
}

/**
 * Calculate predicted omega ratio for a breed + feeding regime
 */
export function predictOmegaRatio(
  breedId: string,
  diet: keyof typeof DIET_OMEGA_MODIFIERS,
  finishingMonths: number = 0
): number {
  const breed = getBreed(breedId)
  const baseline = breed?.omegaBaseline ?? 14 // Default to average

  const dietModifier = DIET_OMEGA_MODIFIERS[diet] ?? 0
  const finishingPenalty = finishingMonths * FINISHING_PENALTY_PER_MONTH

  // Omega ratio cannot go below 1.5 (physiological limit)
  return Math.max(1.5, baseline + dietModifier + finishingPenalty)
}

/**
 * Get quality tier from omega ratio
 */
export function getOmegaTier(ratio: number): QualityTier {
  if (ratio <= 3) return 'artisan'
  if (ratio <= 6) return 'premium'
  if (ratio <= 12) return 'standard'
  return 'commodity'
}

/**
 * Get omega classification description
 */
export function getOmegaClassification(ratio: number): {
  tier: QualityTier
  description: string
  healthImplication: string
} {
  if (ratio <= 3) {
    return {
      tier: 'artisan',
      description: 'Exceptional (≤3:1)',
      healthImplication: 'Optimal anti-inflammatory profile, matches evolutionary diet',
    }
  }
  if (ratio <= 6) {
    return {
      tier: 'premium',
      description: 'Premium (3-6:1)',
      healthImplication: 'Good grass-finished profile, reduced inflammation risk',
    }
  }
  if (ratio <= 12) {
    return {
      tier: 'standard',
      description: 'Standard (6-12:1)',
      healthImplication: 'Mixed feeding regime, moderate omega-6 content',
    }
  }
  return {
    tier: 'commodity',
    description: 'Commodity (>12:1)',
    healthImplication: 'Pro-inflammatory profile, typical of feedlot/grain-fed',
  }
}
