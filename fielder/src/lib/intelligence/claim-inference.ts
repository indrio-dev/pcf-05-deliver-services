/**
 * =============================================================================
 * CLAIM INFERENCE ENGINE
 * =============================================================================
 *
 * F014: Infers SHARE pillar data from product claims and identifiers.
 *
 * This engine bridges the gap between limited product data (PLU codes,
 * marketing claims) and rich SHARE quality information. It applies
 * documented business rules to infer quality attributes.
 *
 * Key inference chains:
 * - PLU codes → Organic status, GMO status
 * - Marketing claims → Beef SHARE profiles (CAFO detection)
 * - Organic + Meat → Warning flags
 */

// =============================================================================
// TYPES
// =============================================================================

export type BeefProfile =
  | 'A_TRUE_GRASS'          // 100% grass-fed, no CAFO, omega 2-3:1
  | 'B_TRUE_PASTURE'        // Pasture-raised + no CAFO, omega 4-6:1
  | 'C_MARKETING_GRASS'     // "Grass-fed" only (likely grain-finished), omega 8-15:1
  | 'D_MARKETING_PASTURE'   // "Pasture-raised" only (likely CAFO), omega 12-18:1
  | 'E_COMMODITY'           // No claims, CAFO, omega 15-20:1
  | 'E2_NATURAL'            // "Natural" checkbox marketing, omega 15-20:1
  | 'F_PREMIUM_CAFO'        // Breed/grade only (Wagyu/Prime), extended CAFO, omega 20-26:1

export interface BeefProfileResult {
  profile: BeefProfile
  profileName: string
  isCAFO: boolean
  expectedOmegaRatio: string
  tier: 'premium' | 'standard' | 'commodity' | 'worst'
  confidence: number
  reasoning: string
  warnings: string[]
}

export interface PLUInference {
  pluCode: string
  isOrganic: boolean
  isGMO: 'no' | 'unknown' | 'possible'
  confidence: 'high' | 'medium' | 'low'
  reasoning: string
}

export interface OrganicBeefWarning {
  hasWarning: boolean
  severity: 'critical' | 'warning' | 'info' | 'none'
  message: string
  reasoning: string
}

// =============================================================================
// PLU CODE INFERENCE
// =============================================================================

/**
 * PLU Code Prefixes:
 * - 3xxx or 4xxx: Conventionally grown
 * - 9xxxx: Organic (5 digits, prefix 9)
 * - 8xxxx: GMO (rarely used, effectively deprecated)
 */
export function inferFromPLU(pluCode: string | undefined): PLUInference {
  if (!pluCode || pluCode.trim() === '') {
    return {
      pluCode: '',
      isOrganic: false,
      isGMO: 'unknown',
      confidence: 'low',
      reasoning: 'No PLU code provided - cannot infer organic/GMO status',
    }
  }

  const cleanPLU = pluCode.trim()

  // Organic: 5-digit code starting with 9
  if (cleanPLU.startsWith('9') && cleanPLU.length === 5) {
    return {
      pluCode: cleanPLU,
      isOrganic: true,
      isGMO: 'no',
      confidence: 'high',
      reasoning: 'PLU prefix 9 indicates USDA Organic, which requires non-GMO by regulation',
    }
  }

  // GMO: 5-digit code starting with 8 (rarely used)
  if (cleanPLU.startsWith('8') && cleanPLU.length === 5) {
    return {
      pluCode: cleanPLU,
      isOrganic: false,
      isGMO: 'possible',
      confidence: 'medium',
      reasoning: 'PLU prefix 8 indicates GMO (though rarely used in practice)',
    }
  }

  // Conventional: 4-digit codes (3xxx, 4xxx)
  if (cleanPLU.length === 4) {
    // Check if it's in a GMO-risk category
    // Only ~10 GMO crops approved in US: corn, soy, cotton, canola, sugar beet,
    // papaya, squash, apple (Arctic), potato, salmon
    return {
      pluCode: cleanPLU,
      isOrganic: false,
      isGMO: 'unknown',
      confidence: 'medium',
      reasoning: 'Conventional PLU (4-digit) - GMO status depends on crop type',
    }
  }

  // Unrecognized format
  return {
    pluCode: cleanPLU,
    isOrganic: false,
    isGMO: 'unknown',
    confidence: 'low',
    reasoning: `PLU code "${cleanPLU}" has non-standard format`,
  }
}

/**
 * Check if a crop is in a GMO-risk category.
 */
export function isGMORiskCrop(cropCategory: string): boolean {
  const gmoRiskCategories = [
    'corn',
    'soy',
    'soybean',
    'canola',
    'cotton',
    'cottonseed',
    'sugar_beet',
    'papaya',
    'squash',
    'zucchini',
    'apple', // Arctic brand only
    'potato', // Innate brand only
  ]
  return gmoRiskCategories.includes(cropCategory.toLowerCase())
}

// =============================================================================
// BEEF PROFILE INFERENCE
// =============================================================================

/**
 * Profile definitions with expected omega ratios.
 */
const BEEF_PROFILE_INFO: Record<BeefProfile, {
  name: string
  isCAFO: boolean
  omegaRatio: string
  tier: BeefProfileResult['tier']
}> = {
  A_TRUE_GRASS: {
    name: 'True Grass-Fed',
    isCAFO: false,
    omegaRatio: '2-3:1',
    tier: 'premium',
  },
  B_TRUE_PASTURE: {
    name: 'True Pasture-Raised',
    isCAFO: false,
    omegaRatio: '4-6:1',
    tier: 'premium',
  },
  C_MARKETING_GRASS: {
    name: 'Marketing "Grass-Fed"',
    isCAFO: true,
    omegaRatio: '8-15:1',
    tier: 'standard',
  },
  D_MARKETING_PASTURE: {
    name: 'Marketing "Pasture-Raised"',
    isCAFO: true,
    omegaRatio: '12-18:1',
    tier: 'standard',
  },
  E_COMMODITY: {
    name: 'Commodity',
    isCAFO: true,
    omegaRatio: '15-20:1',
    tier: 'commodity',
  },
  E2_NATURAL: {
    name: '"Natural" Marketing',
    isCAFO: true,
    omegaRatio: '15-20:1',
    tier: 'commodity',
  },
  F_PREMIUM_CAFO: {
    name: 'Premium CAFO (Wagyu/Prime)',
    isCAFO: true,
    omegaRatio: '20-26:1',
    tier: 'worst',
  },
}

/**
 * Normalize claim text for matching.
 */
function normalizeClaim(claim: string): string {
  return claim.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '')
}

/**
 * Check if claims array contains any of the target phrases.
 */
function claimsContain(claims: string[], targets: string[]): boolean {
  const normalizedClaims = claims.map(normalizeClaim)
  return targets.some(target =>
    normalizedClaims.some(claim => claim.includes(normalizeClaim(target)))
  )
}

/**
 * Check if claims indicate CAFO exclusion.
 *
 * CAFO exclusion claims: "100% grass-fed", "grass-finished",
 * "no feedlot", "no CAFO", "never confined"
 */
function hasCAFOExclusion(claims: string[]): boolean {
  const cafoExclusionPhrases = [
    '100% grass',
    '100 percent grass',
    'grass finished',
    'grassfinished',
    'no feedlot',
    'no cafo',
    'never confined',
    'never feedlot',
    'pasture finished',
  ]
  return claimsContain(claims, cafoExclusionPhrases)
}

/**
 * Check if claims contain process/feeding claims (vs just breed/grade).
 */
function hasProcessClaim(claims: string[]): boolean {
  const processPhrases = [
    'grass',
    'pasture',
    'free range',
    'organic',
    'natural',
    'no antibiotics',
    'no hormones',
    'humanely raised',
    'animal welfare',
  ]
  return claimsContain(claims, processPhrases)
}

/**
 * Check if claims contain only breed/grade markers (Wagyu, Prime, etc.).
 */
function hasOnlyBreedGradeClaims(claims: string[]): boolean {
  const breedGradePhrases = [
    'wagyu',
    'kobe',
    'prime',
    'choice',
    'angus',
    'hereford',
    'a5',
    'american wagyu',
    'australian wagyu',
  ]
  return claimsContain(claims, breedGradePhrases) && !hasProcessClaim(claims)
}

/**
 * Infer beef SHARE profile from marketing claims.
 *
 * Core insight: Feedlot = CAFO. Default assumption is CAFO unless
 * explicitly excluded by claims like "100% grass-fed" or "no feedlot".
 *
 * The silence in claims tells us as much as the claims themselves.
 */
export function inferBeefProfile(claims: string[]): BeefProfileResult {
  const warnings: string[] = []

  // Empty claims = commodity
  if (claims.length === 0) {
    return {
      profile: 'E_COMMODITY',
      ...BEEF_PROFILE_INFO.E_COMMODITY,
      profileName: BEEF_PROFILE_INFO.E_COMMODITY.name,
      expectedOmegaRatio: BEEF_PROFILE_INFO.E_COMMODITY.omegaRatio,
      confidence: 0.9,
      reasoning: 'No claims provided - default to commodity CAFO assumption',
      warnings: [],
    }
  }

  // Check for CAFO exclusion claims FIRST
  const noCAFO = hasCAFOExclusion(claims)

  if (noCAFO) {
    // True grass-fed: "100% grass-fed" or "grass-finished"
    if (claimsContain(claims, ['100% grass', 'grass finished', 'grassfinished', 'pasture finished'])) {
      return {
        profile: 'A_TRUE_GRASS',
        ...BEEF_PROFILE_INFO.A_TRUE_GRASS,
        profileName: BEEF_PROFILE_INFO.A_TRUE_GRASS.name,
        expectedOmegaRatio: BEEF_PROFILE_INFO.A_TRUE_GRASS.omegaRatio,
        confidence: 0.95,
        reasoning: 'CAFO exclusion + grass-finished claim = true grass-fed profile',
        warnings: [],
      }
    }

    // True pasture: pasture-raised with CAFO exclusion
    return {
      profile: 'B_TRUE_PASTURE',
      ...BEEF_PROFILE_INFO.B_TRUE_PASTURE,
      profileName: BEEF_PROFILE_INFO.B_TRUE_PASTURE.name,
      expectedOmegaRatio: BEEF_PROFILE_INFO.B_TRUE_PASTURE.omegaRatio,
      confidence: 0.9,
      reasoning: 'CAFO exclusion claim = true pasture-raised profile',
      warnings: [],
    }
  }

  // From here down, CAFO is assumed

  // Check for "grass-fed" without finishing claim = marketing grass
  if (claimsContain(claims, ['grass fed', 'grassfed', 'grass-fed']) &&
      !claimsContain(claims, ['grass finished', 'grassfinished', '100% grass'])) {
    warnings.push('Says "grass-fed" but no finishing claim - likely grain-finished in CAFO')
    return {
      profile: 'C_MARKETING_GRASS',
      ...BEEF_PROFILE_INFO.C_MARKETING_GRASS,
      profileName: BEEF_PROFILE_INFO.C_MARKETING_GRASS.name,
      expectedOmegaRatio: BEEF_PROFILE_INFO.C_MARKETING_GRASS.omegaRatio,
      confidence: 0.85,
      reasoning: '"Grass-fed" without finishing claim typically means grain-finished in CAFO',
      warnings,
    }
  }

  // Check for "pasture-raised" without CAFO exclusion = marketing pasture
  if (claimsContain(claims, ['pasture raised', 'pastured', 'pasture-raised'])) {
    warnings.push('Says "pasture-raised" but no CAFO exclusion - likely finished in feedlot')
    return {
      profile: 'D_MARKETING_PASTURE',
      ...BEEF_PROFILE_INFO.D_MARKETING_PASTURE,
      profileName: BEEF_PROFILE_INFO.D_MARKETING_PASTURE.name,
      expectedOmegaRatio: BEEF_PROFILE_INFO.D_MARKETING_PASTURE.omegaRatio,
      confidence: 0.85,
      reasoning: '"Pasture-raised" without CAFO exclusion typically means feedlot finishing',
      warnings,
    }
  }

  // Check for breed/grade only claims (Wagyu, Prime) = Premium CAFO (worst omega)
  if (hasOnlyBreedGradeClaims(claims)) {
    warnings.push('Premium breed/grade with no process claims = extended CAFO (worst omega profile)')
    return {
      profile: 'F_PREMIUM_CAFO',
      ...BEEF_PROFILE_INFO.F_PREMIUM_CAFO,
      profileName: BEEF_PROFILE_INFO.F_PREMIUM_CAFO.name,
      expectedOmegaRatio: BEEF_PROFILE_INFO.F_PREMIUM_CAFO.omegaRatio,
      confidence: 0.9,
      reasoning: 'Breed/grade claims without process claims = extended CAFO finishing (12+ months)',
      warnings,
    }
  }

  // Check for "natural" marketing (commodity with one checkbox)
  if (claimsContain(claims, ['natural', 'no antibiotics', 'no hormones', 'hormone free', 'antibiotic free', 'no mrna'])) {
    warnings.push('"Natural" claims are marketing - same feedlot duration as commodity')
    return {
      profile: 'E2_NATURAL',
      ...BEEF_PROFILE_INFO.E2_NATURAL,
      profileName: BEEF_PROFILE_INFO.E2_NATURAL.name,
      expectedOmegaRatio: BEEF_PROFILE_INFO.E2_NATURAL.omegaRatio,
      confidence: 0.85,
      reasoning: '"Natural" = commodity + one checkbox differentiator (same CAFO, same omega)',
      warnings,
    }
  }

  // Default to commodity
  return {
    profile: 'E_COMMODITY',
    ...BEEF_PROFILE_INFO.E_COMMODITY,
    profileName: BEEF_PROFILE_INFO.E_COMMODITY.name,
    expectedOmegaRatio: BEEF_PROFILE_INFO.E_COMMODITY.omegaRatio,
    confidence: 0.8,
    reasoning: 'No recognized quality claims - default to commodity CAFO assumption',
    warnings: [],
  }
}

// =============================================================================
// ORGANIC BEEF WARNING
// =============================================================================

/**
 * Check for organic beef red flag.
 *
 * Key insight: Organic certification for meat often signals grain-fed
 * (organic grain feed). Organic meat is not automatically healthier -
 * the omega ratio depends on FEEDING REGIME, not organic status.
 *
 * An organic chicken fed organic corn is still a walking seed oil.
 */
export function checkOrganicBeefWarning(
  isOrganic: boolean,
  claims: string[]
): OrganicBeefWarning {
  if (!isOrganic) {
    return {
      hasWarning: false,
      severity: 'none',
      message: '',
      reasoning: 'Not organic - no warning applicable',
    }
  }

  // Check if organic + grass claims present (good)
  const hasGrassClaim = claimsContain(claims, ['grass', 'pasture'])
  const hasCAFOExclusionClaim = hasCAFOExclusion(claims)

  if (hasGrassClaim && hasCAFOExclusionClaim) {
    return {
      hasWarning: false,
      severity: 'info',
      message: 'Organic + grass-fed/pasture-raised with CAFO exclusion - good combination',
      reasoning: 'Organic certification with explicit grass/pasture claims and CAFO exclusion',
    }
  }

  if (hasGrassClaim) {
    return {
      hasWarning: true,
      severity: 'warning',
      message: 'Organic with grass claim but no CAFO exclusion - verify finishing regime',
      reasoning: 'Organic + grass-fed but may still be grain-finished in feedlot',
    }
  }

  // Organic without grass claims = likely grain-fed (red flag)
  return {
    hasWarning: true,
    severity: 'critical',
    message: 'ORGANIC MEAT WARNING: Organic certification often means grain-fed (organic grains). Check feeding regime.',
    reasoning: 'Organic certification requires organic feed but NOT grass. Organic chicken/beef is often fed organic corn/soy = high omega-6, same as the seed oils you\'re trying to avoid.',
  }
}

// =============================================================================
// OMEGA RATIO VALIDATION
// =============================================================================

/**
 * Validate omega ratio against claimed feeding regime.
 *
 * If a brand claims "grass-fed" but lab tests show omega ratio >6:1,
 * something is inconsistent with the claim.
 */
export function validateOmegaClaim(
  beefProfile: BeefProfile,
  actualOmegaRatio: number
): { isConsistent: boolean; message: string } {
  const expectedRanges: Record<BeefProfile, [number, number]> = {
    A_TRUE_GRASS: [1, 4],
    B_TRUE_PASTURE: [3, 7],
    C_MARKETING_GRASS: [7, 16],
    D_MARKETING_PASTURE: [10, 20],
    E_COMMODITY: [14, 22],
    E2_NATURAL: [14, 22],
    F_PREMIUM_CAFO: [18, 30],
  }

  const [min, max] = expectedRanges[beefProfile]

  if (actualOmegaRatio < min) {
    return {
      isConsistent: true,
      message: `Omega ratio ${actualOmegaRatio}:1 is BETTER than expected for ${BEEF_PROFILE_INFO[beefProfile].name}`,
    }
  }

  if (actualOmegaRatio > max) {
    return {
      isConsistent: false,
      message: `WARNING: Omega ratio ${actualOmegaRatio}:1 is WORSE than expected for claimed ${BEEF_PROFILE_INFO[beefProfile].name}. Claims may be misleading.`,
    }
  }

  return {
    isConsistent: true,
    message: `Omega ratio ${actualOmegaRatio}:1 is consistent with ${BEEF_PROFILE_INFO[beefProfile].name}`,
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export const claimInference = {
  // PLU inference
  inferFromPLU,
  isGMORiskCrop,

  // Beef profile inference
  inferBeefProfile,
  checkOrganicBeefWarning,
  validateOmegaClaim,

  // Profile info
  BEEF_PROFILE_INFO,
}
