/**
 * Claim-to-Prediction Bridge
 *
 * This module bridges the gap between:
 * 1. Marketing claims (what consumers see on labels)
 * 2. SHARE profile inference (what those claims actually mean)
 * 3. Prediction system (calculating quality metrics)
 *
 * The key insight: "pasture-raised" alone means CAFO is assumed.
 * Only with explicit CAFO exclusion ("no feedlot", "100% grass-fed") do we
 * infer true pasture practices.
 *
 * Usage:
 *   const result = predictFromClaims('beef', ['pasture-raised', 'no feedlot'])
 *   // Returns full prediction with inferred feeding regime
 */

import {
  inferBeefProfile,
  checkOrganicBeefWarning,
  type BeefProfile,
  type BeefProfileResult,
} from '../intelligence/claim-inference'

import {
  predictUnified,
  type PredictionInput,
  type PredictionResult,
  type LivestockPredictionInput,
  type ProductCategory,
  type LivestockSpecies,
} from './prediction-router'

// =============================================================================
// TYPES
// =============================================================================

export type AnimalCategory = 'beef' | 'pork' | 'poultry' | 'eggs' | 'dairy' | 'lamb'

export interface ClaimInferenceResult {
  category: AnimalCategory
  profile: string
  profileName: string
  isCAFO: boolean
  expectedOmegaRange: [number, number]
  inferredDiet: 'grass_only' | 'pasture_forage' | 'grain_finished' | 'grain_fed'
  inferredFinishingMonths: number
  confidence: number
  reasoning: string
  warnings: string[]
}

export interface ClaimPredictionResult {
  inference: ClaimInferenceResult
  prediction: PredictionResult
}

// =============================================================================
// PROFILE TO DIET MAPPING
// =============================================================================

/**
 * Map beef profiles (A-F) to feeding regime
 */
const BEEF_PROFILE_TO_DIET: Record<
  BeefProfile,
  { diet: 'grass_only' | 'pasture_forage' | 'grain_finished' | 'grain_fed'; finishingMonths: number }
> = {
  A_TRUE_GRASS: { diet: 'grass_only', finishingMonths: 0 },
  B_TRUE_PASTURE: { diet: 'pasture_forage', finishingMonths: 0 },
  C_MARKETING_GRASS: { diet: 'grain_finished', finishingMonths: 4 },
  D_MARKETING_PASTURE: { diet: 'grain_finished', finishingMonths: 5 },
  E_COMMODITY: { diet: 'grain_fed', finishingMonths: 7 },
  E2_NATURAL: { diet: 'grain_fed', finishingMonths: 7 },
  F_PREMIUM_CAFO: { diet: 'grain_fed', finishingMonths: 12 },
}

/**
 * Expected omega ranges by profile (for validation)
 */
const PROFILE_OMEGA_RANGES: Record<BeefProfile, [number, number]> = {
  A_TRUE_GRASS: [2, 3],
  B_TRUE_PASTURE: [4, 6],
  C_MARKETING_GRASS: [8, 15],
  D_MARKETING_PASTURE: [12, 18],
  E_COMMODITY: [15, 20],
  E2_NATURAL: [15, 20],
  F_PREMIUM_CAFO: [20, 26],
}

// =============================================================================
// PORK PROFILE INFERENCE
// =============================================================================

export type PorkProfile =
  | 'A_PASTURE_HERITAGE' // Pasture-raised heritage breed
  | 'B_PASTURE' // Pasture-raised, any breed
  | 'C_MARKETING_PASTURE' // "Pasture-raised" marketing only
  | 'D_ORGANIC' // Organic (often grain-fed)
  | 'E_COMMODITY' // Standard CAFO pork

const PORK_PROFILE_INFO: Record<
  PorkProfile,
  { name: string; isCAFO: boolean; omegaRange: [number, number]; diet: string; finishing: number }
> = {
  A_PASTURE_HERITAGE: {
    name: 'Pasture Heritage Pork',
    isCAFO: false,
    omegaRange: [4, 8],
    diet: 'pasture_forage',
    finishing: 0,
  },
  B_PASTURE: {
    name: 'Pasture-Raised Pork',
    isCAFO: false,
    omegaRange: [6, 12],
    diet: 'pasture_forage',
    finishing: 0,
  },
  C_MARKETING_PASTURE: {
    name: 'Marketing "Pasture" Pork',
    isCAFO: true,
    omegaRange: [10, 18],
    diet: 'grain_finished',
    finishing: 3,
  },
  D_ORGANIC: {
    name: 'Organic Pork',
    isCAFO: true,
    omegaRange: [12, 20],
    diet: 'grain_fed',
    finishing: 5,
  },
  E_COMMODITY: {
    name: 'Commodity Pork',
    isCAFO: true,
    omegaRange: [15, 25],
    diet: 'grain_fed',
    finishing: 5,
  },
}

function inferPorkProfile(claims: string[]): ClaimInferenceResult {
  const normalizedClaims = claims.map((c) => c.toLowerCase().trim())
  const warnings: string[] = []

  const hasHeritage = normalizedClaims.some(
    (c) =>
      c.includes('heritage') ||
      c.includes('berkshire') ||
      c.includes('duroc') ||
      c.includes('red wattle') ||
      c.includes('mangalitsa')
  )
  const hasPasture = normalizedClaims.some((c) => c.includes('pasture'))
  const hasCAFOExclusion = normalizedClaims.some(
    (c) =>
      c.includes('no confinement') ||
      c.includes('no cafo') ||
      c.includes('outdoor') ||
      c.includes('free range')
  )
  const hasOrganic = normalizedClaims.some((c) => c.includes('organic'))

  let profile: PorkProfile
  let reasoning: string

  if (hasPasture && hasHeritage && hasCAFOExclusion) {
    profile = 'A_PASTURE_HERITAGE'
    reasoning = 'Heritage breed + pasture-raised with CAFO exclusion = best pork profile'
  } else if (hasPasture && hasCAFOExclusion) {
    profile = 'B_PASTURE'
    reasoning = 'Pasture-raised with CAFO exclusion = true pasture pork'
  } else if (hasPasture) {
    profile = 'C_MARKETING_PASTURE'
    reasoning = '"Pasture-raised" without CAFO exclusion - assume confinement finishing'
    warnings.push('No explicit CAFO exclusion - likely finished in confinement')
  } else if (hasOrganic) {
    profile = 'D_ORGANIC'
    reasoning = 'Organic certification often means grain-fed in confinement'
    warnings.push('Organic pork is typically grain-fed - same omega-6 problem')
  } else {
    profile = 'E_COMMODITY'
    reasoning = 'No quality claims - default to commodity CAFO assumption'
  }

  const info = PORK_PROFILE_INFO[profile]
  return {
    category: 'pork',
    profile,
    profileName: info.name,
    isCAFO: info.isCAFO,
    expectedOmegaRange: info.omegaRange,
    inferredDiet: info.diet as 'grass_only' | 'pasture_forage' | 'grain_finished' | 'grain_fed',
    inferredFinishingMonths: info.finishing,
    confidence: claims.length > 0 ? 0.8 : 0.9,
    reasoning,
    warnings,
  }
}

// =============================================================================
// POULTRY PROFILE INFERENCE
// =============================================================================

export type PoultryProfile =
  | 'A_TRUE_PASTURE' // True pasture-raised with outdoor access
  | 'B_FREE_RANGE' // Free-range (outdoor access but grain-fed)
  | 'C_ORGANIC' // Organic (grain-fed, often indoor)
  | 'D_NATURAL' // "Natural" marketing
  | 'E_CONVENTIONAL' // Standard CAFO chicken

const POULTRY_PROFILE_INFO: Record<
  PoultryProfile,
  { name: string; isCAFO: boolean; omegaRange: [number, number]; diet: string; finishing: number }
> = {
  A_TRUE_PASTURE: {
    name: 'True Pasture-Raised Chicken',
    isCAFO: false,
    omegaRange: [4, 10],
    diet: 'pasture_forage',
    finishing: 0,
  },
  B_FREE_RANGE: {
    name: 'Free-Range Chicken',
    isCAFO: true,
    omegaRange: [8, 15],
    diet: 'grain_finished',
    finishing: 1,
  },
  C_ORGANIC: {
    name: 'Organic Chicken',
    isCAFO: true,
    omegaRange: [10, 18],
    diet: 'grain_fed',
    finishing: 2,
  },
  D_NATURAL: {
    name: '"Natural" Chicken',
    isCAFO: true,
    omegaRange: [15, 22],
    diet: 'grain_fed',
    finishing: 2,
  },
  E_CONVENTIONAL: {
    name: 'Conventional Chicken',
    isCAFO: true,
    omegaRange: [15, 25],
    diet: 'grain_fed',
    finishing: 2,
  },
}

function inferPoultryProfile(claims: string[]): ClaimInferenceResult {
  const normalizedClaims = claims.map((c) => c.toLowerCase().trim())
  const warnings: string[] = []

  const hasPasture = normalizedClaims.some((c) => c.includes('pasture'))
  const hasCAFOExclusion = normalizedClaims.some(
    (c) =>
      c.includes('no confinement') ||
      c.includes('outdoor raised') ||
      c.includes('no barn') ||
      c.includes('heritage')
  )
  const hasFreeRange = normalizedClaims.some((c) => c.includes('free range') || c.includes('free-range'))
  const hasOrganic = normalizedClaims.some((c) => c.includes('organic'))
  const hasNatural = normalizedClaims.some(
    (c) => c.includes('natural') || c.includes('no antibiotics') || c.includes('no hormones')
  )

  let profile: PoultryProfile
  let reasoning: string

  if (hasPasture && hasCAFOExclusion) {
    profile = 'A_TRUE_PASTURE'
    reasoning = 'Pasture-raised with explicit outdoor/no confinement = true pasture chicken'
  } else if (hasPasture) {
    // Pasture without exclusion - still likely better than free-range
    profile = 'A_TRUE_PASTURE'
    reasoning = 'Pasture-raised claim - assuming meaningful outdoor access'
    warnings.push('Verify actual outdoor time - "pasture-raised" can be marketing')
  } else if (hasFreeRange) {
    profile = 'B_FREE_RANGE'
    reasoning = '"Free-range" requires outdoor ACCESS but not actual pasture time'
    warnings.push('Free-range often means small concrete area access')
  } else if (hasOrganic) {
    profile = 'C_ORGANIC'
    reasoning = 'Organic chicken is typically grain-fed - the chicken IS a seed oil'
    warnings.push('Organic certification controls feed source, not diet type')
  } else if (hasNatural) {
    profile = 'D_NATURAL'
    reasoning = '"Natural" = conventional + marketing checkbox'
    warnings.push('"Natural" claims don\'t change the feeding regime')
  } else {
    profile = 'E_CONVENTIONAL'
    reasoning = 'No quality claims - default to conventional CAFO'
  }

  const info = POULTRY_PROFILE_INFO[profile]
  return {
    category: 'poultry',
    profile,
    profileName: info.name,
    isCAFO: info.isCAFO,
    expectedOmegaRange: info.omegaRange,
    inferredDiet: info.diet as 'grass_only' | 'pasture_forage' | 'grain_finished' | 'grain_fed',
    inferredFinishingMonths: info.finishing,
    confidence: claims.length > 0 ? 0.75 : 0.9,
    reasoning,
    warnings,
  }
}

// =============================================================================
// EGG PROFILE INFERENCE
// =============================================================================

export type EggProfile =
  | 'A_TRUE_PASTURE' // True pasture-raised (insects + forage)
  | 'B_ORGANIC_PASTURE' // Organic + pasture
  | 'C_FREE_RANGE' // Free-range (grain-fed with outdoor access)
  | 'D_CAGE_FREE' // Cage-free (indoor, grain-fed)
  | 'E_CONVENTIONAL' // Battery cage eggs

const EGG_PROFILE_INFO: Record<
  EggProfile,
  { name: string; isCAFO: boolean; omegaRange: [number, number]; diet: string }
> = {
  A_TRUE_PASTURE: {
    name: 'True Pasture-Raised Eggs',
    isCAFO: false,
    omegaRange: [1.5, 4],
    diet: 'pasture_forage',
  },
  B_ORGANIC_PASTURE: {
    name: 'Organic Pasture-Raised Eggs',
    isCAFO: false,
    omegaRange: [3, 6],
    diet: 'pasture_forage',
  },
  C_FREE_RANGE: {
    name: 'Free-Range Eggs',
    isCAFO: true,
    omegaRange: [8, 15],
    diet: 'grain_finished',
  },
  D_CAGE_FREE: {
    name: 'Cage-Free Eggs',
    isCAFO: true,
    omegaRange: [12, 18],
    diet: 'grain_fed',
  },
  E_CONVENTIONAL: {
    name: 'Conventional Eggs',
    isCAFO: true,
    omegaRange: [15, 20],
    diet: 'grain_fed',
  },
}

function inferEggProfile(claims: string[]): ClaimInferenceResult {
  const normalizedClaims = claims.map((c) => c.toLowerCase().trim())
  const warnings: string[] = []

  const hasPasture = normalizedClaims.some((c) => c.includes('pasture'))
  const hasCAFOExclusion = normalizedClaims.some(
    (c) => c.includes('no confinement') || c.includes('108 sq ft') || c.includes('rotational')
  )
  const hasOrganic = normalizedClaims.some((c) => c.includes('organic'))
  const hasFreeRange = normalizedClaims.some((c) => c.includes('free range') || c.includes('free-range'))
  const hasCageFree = normalizedClaims.some((c) => c.includes('cage free') || c.includes('cage-free'))

  let profile: EggProfile
  let reasoning: string

  if (hasPasture && hasCAFOExclusion) {
    profile = 'A_TRUE_PASTURE'
    reasoning = 'Pasture-raised with explicit standards (108 sq ft/bird or rotational) = best eggs'
  } else if (hasPasture && hasOrganic) {
    profile = 'B_ORGANIC_PASTURE'
    reasoning = 'Organic + pasture-raised - good but verify actual outdoor time'
    warnings.push('Organic pasture standards vary - look for specific sq ft claims')
  } else if (hasPasture) {
    // Pasture without exclusion - the Vital Farms problem
    profile = 'C_FREE_RANGE'
    reasoning =
      '"Pasture-raised" without specific standards - often industrial certification (tested at 23.5% omega-6)'
    warnings.push('Vital Farms tested worse than canola oil - verify actual practices')
  } else if (hasFreeRange) {
    profile = 'C_FREE_RANGE'
    reasoning = '"Free-range" requires outdoor access but hens often don\'t use it'
    warnings.push('Free-range hens are still primarily grain-fed')
  } else if (hasCageFree) {
    profile = 'D_CAGE_FREE'
    reasoning = '"Cage-free" = indoor barn, no outdoor access, all grain diet'
    warnings.push('Cage-free is marketing - same grain diet as conventional')
  } else {
    profile = 'E_CONVENTIONAL'
    reasoning = 'No claims - default to conventional battery cage assumption'
  }

  const info = EGG_PROFILE_INFO[profile]
  return {
    category: 'eggs',
    profile,
    profileName: info.name,
    isCAFO: info.isCAFO,
    expectedOmegaRange: info.omegaRange,
    inferredDiet: info.diet as 'grass_only' | 'pasture_forage' | 'grain_finished' | 'grain_fed',
    inferredFinishingMonths: 0, // Not applicable to eggs
    confidence: claims.length > 0 ? 0.75 : 0.9,
    reasoning,
    warnings,
  }
}

// =============================================================================
// DAIRY PROFILE INFERENCE
// =============================================================================

export type DairyProfile =
  | 'A_GRASS_A2' // 100% grass-fed + A2 genetics
  | 'B_GRASS' // 100% grass-fed
  | 'C_PASTURE' // Pasture-raised (some grain)
  | 'D_ORGANIC' // Organic (often grain-dominant)
  | 'E_CONVENTIONAL' // Standard dairy

const DAIRY_PROFILE_INFO: Record<
  DairyProfile,
  { name: string; isCAFO: boolean; omegaRange: [number, number]; diet: string }
> = {
  A_GRASS_A2: {
    name: '100% Grass-Fed A2 Dairy',
    isCAFO: false,
    omegaRange: [1, 3],
    diet: 'grass_only',
  },
  B_GRASS: {
    name: '100% Grass-Fed Dairy',
    isCAFO: false,
    omegaRange: [2, 4],
    diet: 'grass_only',
  },
  C_PASTURE: {
    name: 'Pasture-Raised Dairy',
    isCAFO: false,
    omegaRange: [3, 7],
    diet: 'pasture_forage',
  },
  D_ORGANIC: {
    name: 'Organic Dairy',
    isCAFO: true,
    omegaRange: [5, 12],
    diet: 'grain_finished',
  },
  E_CONVENTIONAL: {
    name: 'Conventional Dairy',
    isCAFO: true,
    omegaRange: [10, 20],
    diet: 'grain_fed',
  },
}

function inferDairyProfile(claims: string[]): ClaimInferenceResult {
  const normalizedClaims = claims.map((c) => c.toLowerCase().trim())
  const warnings: string[] = []

  const has100Grass = normalizedClaims.some(
    (c) => c.includes('100% grass') || c.includes('grass-finished') || c.includes('grass finished')
  )
  const hasGrass = normalizedClaims.some((c) => c.includes('grass'))
  const hasA2 = normalizedClaims.some((c) => c.includes('a2'))
  const hasPasture = normalizedClaims.some((c) => c.includes('pasture'))
  const hasOrganic = normalizedClaims.some((c) => c.includes('organic'))

  let profile: DairyProfile
  let reasoning: string

  if (has100Grass && hasA2) {
    profile = 'A_GRASS_A2'
    reasoning = '100% grass-fed + A2 genetics = best dairy profile for nutrition and digestibility'
  } else if (has100Grass) {
    profile = 'B_GRASS'
    reasoning = '100% grass-fed = excellent omega profile'
  } else if (hasGrass || hasPasture) {
    profile = 'C_PASTURE'
    reasoning = 'Grass-fed or pasture claim without "100%" - likely grain supplemented'
    warnings.push('"Grass-fed" without "100%" or "finished" often means grain supplemented')
  } else if (hasOrganic) {
    profile = 'D_ORGANIC'
    reasoning = 'Organic dairy is often primarily grain-fed'
    warnings.push('Organic doesn\'t mean grass-fed - many organic dairies use grain-dominant TMR')
  } else {
    profile = 'E_CONVENTIONAL'
    reasoning = 'No quality claims - default to conventional grain-fed dairy'
  }

  const info = DAIRY_PROFILE_INFO[profile]
  return {
    category: 'dairy',
    profile,
    profileName: info.name,
    isCAFO: info.isCAFO,
    expectedOmegaRange: info.omegaRange,
    inferredDiet: info.diet as 'grass_only' | 'pasture_forage' | 'grain_finished' | 'grain_fed',
    inferredFinishingMonths: 0, // Not applicable to dairy
    confidence: claims.length > 0 ? 0.75 : 0.9,
    reasoning,
    warnings,
  }
}

// =============================================================================
// UNIFIED INFERENCE FUNCTION
// =============================================================================

/**
 * Infer quality profile from marketing claims for any animal category
 */
export function inferAnimalProfile(category: AnimalCategory, claims: string[]): ClaimInferenceResult {
  switch (category) {
    case 'beef': {
      const beefResult = inferBeefProfile(claims)
      const dietMapping = BEEF_PROFILE_TO_DIET[beefResult.profile]
      return {
        category: 'beef',
        profile: beefResult.profile,
        profileName: beefResult.profileName,
        isCAFO: beefResult.isCAFO,
        expectedOmegaRange: PROFILE_OMEGA_RANGES[beefResult.profile],
        inferredDiet: dietMapping.diet,
        inferredFinishingMonths: dietMapping.finishingMonths,
        confidence: beefResult.confidence,
        reasoning: beefResult.reasoning,
        warnings: beefResult.warnings,
      }
    }
    case 'pork':
      return inferPorkProfile(claims)
    case 'poultry':
      return inferPoultryProfile(claims)
    case 'eggs':
      return inferEggProfile(claims)
    case 'dairy':
      return inferDairyProfile(claims)
    case 'lamb':
      // Lamb uses beef-like profiles
      const lambResult = inferBeefProfile(claims)
      const lambDiet = BEEF_PROFILE_TO_DIET[lambResult.profile]
      return {
        ...lambResult,
        category: 'lamb',
        inferredDiet: lambDiet.diet,
        inferredFinishingMonths: lambDiet.finishingMonths,
        expectedOmegaRange: PROFILE_OMEGA_RANGES[lambResult.profile],
      } as ClaimInferenceResult
    default:
      throw new Error(`Unknown animal category: ${category}`)
  }
}

// =============================================================================
// CLAIMS TO PREDICTION INPUT
// =============================================================================

/**
 * Convert marketing claims to a LivestockPredictionInput for the predictor
 */
export function claimsToLivestockInput(
  category: AnimalCategory,
  claims: string[],
  overrides?: Partial<LivestockPredictionInput>
): LivestockPredictionInput {
  const inference = inferAnimalProfile(category, claims)

  // Map category to species
  const speciesMap: Record<AnimalCategory, LivestockSpecies> = {
    beef: 'beef',
    pork: 'pork',
    poultry: 'poultry',
    eggs: 'poultry',
    dairy: 'dairy',
    lamb: 'lamb',
  }

  // Map category to prediction category (only livestock categories)
  const predictionCategory: Record<AnimalCategory, 'livestock' | 'eggs' | 'dairy'> = {
    beef: 'livestock',
    pork: 'livestock',
    poultry: 'livestock',
    eggs: 'eggs',
    dairy: 'dairy',
    lamb: 'livestock',
  }

  // Check for organic in claims
  const hasOrganic = claims.some((c) => c.toLowerCase().includes('organic'))

  // Check for animal welfare claims
  const animalWelfare = inference.isCAFO
    ? 'confinement'
    : claims.some((c) => c.toLowerCase().includes('pasture'))
      ? 'pasture_raised'
      : 'free_range'

  return {
    category: predictionCategory[category],
    species: speciesMap[category],
    feedingRegime: {
      diet: inference.inferredDiet,
      finishingMonths: inference.inferredFinishingMonths,
      isOrganicGrain: hasOrganic && inference.inferredDiet !== 'grass_only',
    },
    practices: {
      animalWelfare: animalWelfare as 'confinement' | 'free_range' | 'pasture_raised',
      isCertifiedOrganic: hasOrganic,
      noAntibiotics: claims.some((c) => c.toLowerCase().includes('no antibiotic')),
      noHormones: claims.some((c) => c.toLowerCase().includes('no hormone')),
    },
    ...overrides,
  }
}

// =============================================================================
// UNIFIED PREDICTION FROM CLAIMS
// =============================================================================

/**
 * Main entry point: Run prediction from marketing claims
 *
 * This is the function that wires together:
 * 1. Marketing claims → Profile inference
 * 2. Profile → Feeding regime
 * 3. Feeding regime → Omega prediction
 *
 * @example
 * // The "pasture-raised" ambiguity in action:
 *
 * // Pasture-raised WITHOUT CAFO exclusion (Vital Farms situation)
 * predictFromClaims('eggs', ['pasture-raised'])
 * // → Infers: C_FREE_RANGE profile, grain-finished diet
 * // → Predicts: ~11:1 omega ratio (same as free-range)
 *
 * // Pasture-raised WITH CAFO exclusion
 * predictFromClaims('eggs', ['pasture-raised', '108 sq ft/bird'])
 * // → Infers: A_TRUE_PASTURE profile, pasture_forage diet
 * // → Predicts: ~2.5:1 omega ratio (excellent)
 */
export function predictFromClaims(
  category: AnimalCategory,
  claims: string[],
  overrides?: Partial<LivestockPredictionInput>
): ClaimPredictionResult {
  // Step 1: Infer profile from claims
  const inference = inferAnimalProfile(category, claims)

  // Step 2: Convert to predictor input
  const input = claimsToLivestockInput(category, claims, overrides)

  // Step 3: Run prediction
  const prediction = predictUnified(input)

  // Step 4: Add inference context to warnings
  if (inference.warnings.length > 0) {
    prediction.modelInfo.warnings = [...prediction.modelInfo.warnings, ...inference.warnings]
  }

  // Step 5: Validate prediction against expected range
  const predictedOmega = prediction.primaryMetric.value
  const [expectedMin, expectedMax] = inference.expectedOmegaRange
  if (predictedOmega < expectedMin - 2 || predictedOmega > expectedMax + 2) {
    prediction.modelInfo.warnings.push(
      `Predicted ${predictedOmega.toFixed(1)}:1 outside expected range ${expectedMin}-${expectedMax}:1 for ${inference.profileName}`
    )
  }

  return {
    inference,
    prediction,
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  inferBeefProfile,
  checkOrganicBeefWarning,
  inferPorkProfile,
  inferPoultryProfile,
  inferEggProfile,
  inferDairyProfile,
}
