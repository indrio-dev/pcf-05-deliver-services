/**
 * =============================================================================
 * S.H.A.R.E. PROFILE GRIDS
 * =============================================================================
 *
 * Each ShareProfile has a 3×5 grid showing what the profile addresses:
 *
 * ROWS (3 Perspectives):
 *   - regulation: What the law actually requires/allows
 *   - marketing: What brands typically claim/imply
 *   - reality: What Fielder assessment shows (the truth)
 *
 * COLUMNS (5 SHARE Pillars):
 *   - S: Soil/Foundation environment
 *   - H: Heritage/Genetics
 *   - A: Agricultural practices
 *   - R: Ripen/Timing
 *   - E: Enrich/Quality outcomes
 *
 * CELL STATES:
 *   - 'silence': The claim says nothing about this pillar
 *   - 'partial': The claim partially addresses this pillar
 *   - 'addressed': The claim directly addresses this pillar
 */

import type { ShareProfileGrid, ProfilePerspective } from './share-profiles'

// Re-export types for external use
export type { ShareProfileGrid, ProfilePerspective }

// =============================================================================
// BEEF PROFILE GRIDS
// =============================================================================

export const BEEF_TRUE_GRASS_GRIDS: ShareProfileGrid[] = [
  {
    id: 'beef_true_grass_regulation',
    shareProfileId: 'beef_true_grass',
    perspective: 'regulation',
    soilContent: 'No federal requirement for pasture quality',
    heritageContent: 'No breed requirement; any cattle breed qualifies',
    agriculturalContent: 'USDA withdrew grass-fed standard in 2016. "100% grass-fed" claims rely on third-party certifications (AGA, PCO) or self-attestation.',
    ripenContent: 'No minimum age requirement. Grass-only finishing takes longer than grain.',
    enrichContent: 'No fatty acid testing required. No omega ratio standards.',
    soilState: 'silence',
    heritageState: 'silence',
    agriculturalState: 'partial',
    ripenState: 'silence',
    enrichState: 'silence',
  },
  {
    id: 'beef_true_grass_marketing',
    shareProfileId: 'beef_true_grass',
    perspective: 'marketing',
    soilContent: 'May mention "pristine pastures" or "lush grasslands"',
    heritageContent: 'Often highlights breed if premium (Angus, Wagyu crosses)',
    agriculturalContent: '"100% grass-fed and grass-finished" - the key differentiator from marketing grass-fed',
    ripenContent: 'May mention "slow-raised" or "naturally matured"',
    enrichContent: 'Highlights omega-3 benefits, anti-inflammatory claims, "heart healthy"',
    soilState: 'partial',
    heritageState: 'partial',
    agriculturalState: 'addressed',
    ripenState: 'partial',
    enrichState: 'addressed',
  },
  {
    id: 'beef_true_grass_reality',
    shareProfileId: 'beef_true_grass',
    perspective: 'reality',
    soilContent: 'Pasture quality varies widely. Rotational grazing indicates quality operation.',
    heritageContent: 'Breed matters less than feeding regime for omega profile. Any breed can be grass-fed.',
    agriculturalContent: 'TRUE 100% grass-fed: No grain ever, no feedlot time. Verified by omega ratio testing.',
    ripenContent: 'Takes 24-30 months vs 14-18 for grain-finished. Slower but healthier.',
    enrichContent: 'BEST omega ratio: 2-3:1. High CLA. Anti-inflammatory profile. Lab-verifiable.',
    soilState: 'partial',
    heritageState: 'partial',
    agriculturalState: 'addressed',
    ripenState: 'addressed',
    enrichState: 'addressed',
  },
]

export const BEEF_MARKETING_GRASS_GRIDS: ShareProfileGrid[] = [
  {
    id: 'beef_marketing_grass_regulation',
    shareProfileId: 'beef_marketing_grass',
    perspective: 'regulation',
    soilContent: 'No requirement',
    heritageContent: 'No requirement',
    agriculturalContent: 'No federal definition since 2016. Anyone can use "grass-fed" on labels.',
    ripenContent: 'No requirement',
    enrichContent: 'No requirement',
    soilState: 'silence',
    heritageState: 'silence',
    agriculturalState: 'silence',
    ripenState: 'silence',
    enrichState: 'silence',
  },
  {
    id: 'beef_marketing_grass_marketing',
    shareProfileId: 'beef_marketing_grass',
    perspective: 'marketing',
    soilContent: 'Same pasture imagery as true grass-fed',
    heritageContent: 'May highlight breed',
    agriculturalContent: '"Grass-fed" prominently displayed. Finishing claim often absent or buried.',
    ripenContent: 'May not mention timeline',
    enrichContent: 'Same health claims as true grass-fed despite different omega profile',
    soilState: 'partial',
    heritageState: 'partial',
    agriculturalState: 'partial',
    ripenState: 'silence',
    enrichState: 'partial',
  },
  {
    id: 'beef_marketing_grass_reality',
    shareProfileId: 'beef_marketing_grass',
    perspective: 'reality',
    soilContent: 'Started on pasture, finished in feedlot',
    heritageContent: 'Same breeds as conventional',
    agriculturalContent: 'Typically grain-FINISHED in feedlot for final 3-4 months. The finishing destroys the omega profile.',
    ripenContent: 'Standard feedlot finishing timeline (18-24 months total)',
    enrichContent: 'MODERATE omega ratio: 8-15:1. Grain finishing degrades profile significantly.',
    soilState: 'partial',
    heritageState: 'silence',
    agriculturalState: 'partial',
    ripenState: 'partial',
    enrichState: 'partial',
  },
]

export const BEEF_PREMIUM_CAFO_GRIDS: ShareProfileGrid[] = [
  {
    id: 'beef_premium_cafo_regulation',
    shareProfileId: 'beef_premium_cafo',
    perspective: 'regulation',
    soilContent: 'No requirement - feedlot operation',
    heritageContent: 'Wagyu genetics verified for "Wagyu" label',
    agriculturalContent: 'USDA grading based on marbling, not production method',
    ripenContent: 'No age requirement for grade',
    enrichContent: 'Marbling score determines grade, not fatty acid profile',
    soilState: 'silence',
    heritageState: 'addressed',
    agriculturalState: 'silence',
    ripenState: 'silence',
    enrichState: 'partial',
  },
  {
    id: 'beef_premium_cafo_marketing',
    shareProfileId: 'beef_premium_cafo',
    perspective: 'marketing',
    soilContent: 'Not mentioned - would reveal feedlot',
    heritageContent: '"American Wagyu", "Prime", "A5" - breed/grade as quality signal',
    agriculturalContent: 'Silence on feeding regime. Focus on luxury positioning.',
    ripenContent: 'May mention extended aging',
    enrichContent: '"Exceptional marbling", "melt-in-your-mouth" - sensory, not health claims',
    soilState: 'silence',
    heritageState: 'addressed',
    agriculturalState: 'silence',
    ripenState: 'partial',
    enrichState: 'partial',
  },
  {
    id: 'beef_premium_cafo_reality',
    shareProfileId: 'beef_premium_cafo',
    perspective: 'reality',
    soilContent: 'Feedlot - no pasture relevance',
    heritageContent: 'Wagyu genetics do create superior marbling',
    agriculturalContent: 'EXTENDED feedlot: 12+ months grain feeding for maximum marbling. Longest CAFO time of any beef.',
    ripenContent: '24-30+ months total. Extended grain feeding = extended omega-6 accumulation.',
    enrichContent: 'WORST omega ratio: 20-26:1. The most expensive beef is the WORST for health.',
    soilState: 'silence',
    heritageState: 'addressed',
    agriculturalState: 'addressed',
    ripenState: 'addressed',
    enrichState: 'addressed',
  },
]

// =============================================================================
// CITRUS PROFILE GRIDS
// =============================================================================

export const CITRUS_ORGANIC_GRIDS: ShareProfileGrid[] = [
  {
    id: 'citrus_organic_regulation',
    shareProfileId: 'citrus_organic',
    perspective: 'regulation',
    soilContent: 'Requires soil management plan, cover crops, 3-year transition',
    heritageContent: 'No GMO allowed under organic standards',
    agriculturalContent: 'No synthetic pesticides, herbicides, or fertilizers. Organic-approved inputs only.',
    ripenContent: 'No harvest timing requirements',
    enrichContent: 'No Brix or nutrient requirements',
    soilState: 'partial',
    heritageState: 'addressed',
    agriculturalState: 'addressed',
    ripenState: 'silence',
    enrichState: 'silence',
  },
  {
    id: 'citrus_organic_marketing',
    shareProfileId: 'citrus_organic',
    perspective: 'marketing',
    soilContent: '"Grown in rich, healthy soil"',
    heritageContent: '"Non-GMO" highlighted',
    agriculturalContent: '"No toxic chemicals", "pesticide-free" (misleading - organic uses pesticides)',
    ripenContent: 'May mention "sun-ripened"',
    enrichContent: '"More nutritious", "healthier" (often unsubstantiated)',
    soilState: 'partial',
    heritageState: 'addressed',
    agriculturalState: 'addressed',
    ripenState: 'partial',
    enrichState: 'partial',
  },
  {
    id: 'citrus_organic_reality',
    shareProfileId: 'citrus_organic',
    perspective: 'reality',
    soilContent: 'Soil health varies widely. Organic certification doesn\'t guarantee mineralized soil.',
    heritageContent: 'Non-GMO verified. Cultivar selection varies by operation.',
    agriculturalContent: 'Organic inputs only. May have higher polyphenols from stress response. Primary nutrition (Brix) varies.',
    ripenContent: 'Same harvest timing pressures as conventional - harvested for shipping, not peak.',
    enrichContent: 'Brix 10-14 (variable). Higher secondary nutrition possible, primary nutrition same as conventional.',
    soilState: 'partial',
    heritageState: 'addressed',
    agriculturalState: 'addressed',
    ripenState: 'partial',
    enrichState: 'partial',
  },
]

export const CITRUS_CONVENTIONAL_GRIDS: ShareProfileGrid[] = [
  {
    id: 'citrus_conventional_regulation',
    shareProfileId: 'citrus_conventional',
    perspective: 'regulation',
    soilContent: 'No federal soil requirements',
    heritageContent: 'No cultivar requirements',
    agriculturalContent: 'EPA-approved pesticides within tolerance limits',
    ripenContent: 'USDA minimum maturity standards (Brix:acid ratio)',
    enrichContent: 'USDA grades focus on external appearance, not internal quality',
    soilState: 'silence',
    heritageState: 'silence',
    agriculturalState: 'partial',
    ripenState: 'partial',
    enrichState: 'partial',
  },
  {
    id: 'citrus_conventional_marketing',
    shareProfileId: 'citrus_conventional',
    perspective: 'marketing',
    soilContent: 'Not mentioned',
    heritageContent: 'Variety name (Navel, Valencia) may be highlighted',
    agriculturalContent: 'Usually silence on practices',
    ripenContent: '"Fresh", "sweet" generic claims',
    enrichContent: 'Generic health claims about vitamin C',
    soilState: 'silence',
    heritageState: 'partial',
    agriculturalState: 'silence',
    ripenState: 'partial',
    enrichState: 'partial',
  },
  {
    id: 'citrus_conventional_reality',
    shareProfileId: 'citrus_conventional',
    perspective: 'reality',
    soilContent: 'Varies by operation. Annual fertility approach common.',
    heritageContent: 'Often commercial cultivars on vigor rootstocks (yield focus)',
    agriculturalContent: 'Conventional inputs. 70%+ use IPM (integrated pest management).',
    ripenContent: 'Harvested when USDA minimum met, not peak. Early harvest for shipping.',
    enrichContent: 'Brix 8-12 typical. Quality depends on individual operation, not certification.',
    soilState: 'partial',
    heritageState: 'partial',
    agriculturalState: 'partial',
    ripenState: 'partial',
    enrichState: 'partial',
  },
]

// =============================================================================
// EGG PROFILE GRIDS
// =============================================================================

export const EGG_TRUE_PASTURE_GRIDS: ShareProfileGrid[] = [
  {
    id: 'eggs_true_pasture_regulation',
    shareProfileId: 'eggs_true_pasture',
    perspective: 'regulation',
    soilContent: 'No federal pasture quality requirements',
    heritageContent: 'No breed requirements',
    agriculturalContent: '"Pasture-raised" has no federal definition. Third-party certifications (Certified Humane) require 108 sq ft/bird.',
    ripenContent: 'Standard egg freshness requirements',
    enrichContent: 'No fatty acid or nutrient requirements',
    soilState: 'silence',
    heritageState: 'silence',
    agriculturalState: 'partial',
    ripenState: 'partial',
    enrichState: 'silence',
  },
  {
    id: 'eggs_true_pasture_marketing',
    shareProfileId: 'eggs_true_pasture',
    perspective: 'marketing',
    soilContent: '"Lush pastures", "green grass"',
    heritageContent: 'May highlight heritage breeds',
    agriculturalContent: '"True pasture-raised", specific sq ft claims, "rotating pastures"',
    ripenContent: '"Farm fresh"',
    enrichContent: '"Rich orange yolks", "high in omega-3", "vitamin D"',
    soilState: 'partial',
    heritageState: 'partial',
    agriculturalState: 'addressed',
    ripenState: 'partial',
    enrichState: 'addressed',
  },
  {
    id: 'eggs_true_pasture_reality',
    shareProfileId: 'eggs_true_pasture',
    perspective: 'reality',
    soilContent: 'Pasture quality affects insect/forage availability. Rotation prevents depletion.',
    heritageContent: 'Heritage breeds are often better foragers than commercial layers.',
    agriculturalContent: 'TRUE pasture-raised: Meaningful outdoor time, insect/forage diet, mobile coops common.',
    ripenContent: 'Local = fresher. Direct farm sales often same-day.',
    enrichContent: 'BEST omega ratio: 1.5-4:1. Orange yolks from beta-carotene. High vitamin D from sun exposure.',
    soilState: 'partial',
    heritageState: 'partial',
    agriculturalState: 'addressed',
    ripenState: 'addressed',
    enrichState: 'addressed',
  },
]

export const EGG_CAGE_FREE_GRIDS: ShareProfileGrid[] = [
  {
    id: 'eggs_cage_free_regulation',
    shareProfileId: 'eggs_cage_free',
    perspective: 'regulation',
    soilContent: 'No requirement - indoor operation',
    heritageContent: 'No requirement',
    agriculturalContent: 'USDA: Hens not in battery cages, can move in enclosed area',
    ripenContent: 'Standard freshness requirements',
    enrichContent: 'No nutritional requirements',
    soilState: 'silence',
    heritageState: 'silence',
    agriculturalState: 'partial',
    ripenState: 'partial',
    enrichState: 'silence',
  },
  {
    id: 'eggs_cage_free_marketing',
    shareProfileId: 'eggs_cage_free',
    perspective: 'marketing',
    soilContent: 'Not mentioned',
    heritageContent: 'Not typically mentioned',
    agriculturalContent: '"Cage-free" prominently displayed. Happy hen imagery.',
    ripenContent: '"Fresh"',
    enrichContent: 'May imply healthier than conventional',
    soilState: 'silence',
    heritageState: 'silence',
    agriculturalState: 'partial',
    ripenState: 'partial',
    enrichState: 'partial',
  },
  {
    id: 'eggs_cage_free_reality',
    shareProfileId: 'eggs_cage_free',
    perspective: 'reality',
    soilContent: 'No pasture - indoor barn housing',
    heritageContent: 'Commercial laying breeds (White Leghorn)',
    agriculturalContent: 'Barn housing, no outdoor access, all-grain diet. Better than battery cages but NOT pasture-raised.',
    ripenContent: 'Standard commercial timeline',
    enrichContent: 'POOR omega ratio: 12-18:1. Same grain diet as conventional. Nutritionally similar.',
    soilState: 'silence',
    heritageState: 'silence',
    agriculturalState: 'partial',
    ripenState: 'silence',
    enrichState: 'addressed',
  },
]

// =============================================================================
// ALL GRIDS EXPORT
// =============================================================================

export const ALL_PROFILE_GRIDS: ShareProfileGrid[] = [
  // Beef
  ...BEEF_TRUE_GRASS_GRIDS,
  ...BEEF_MARKETING_GRASS_GRIDS,
  ...BEEF_PREMIUM_CAFO_GRIDS,
  // Citrus
  ...CITRUS_ORGANIC_GRIDS,
  ...CITRUS_CONVENTIONAL_GRIDS,
  // Eggs
  ...EGG_TRUE_PASTURE_GRIDS,
  ...EGG_CAGE_FREE_GRIDS,
]

// =============================================================================
// LOOKUP HELPERS
// =============================================================================

export function getGridsForProfile(shareProfileId: string): ShareProfileGrid[] {
  return ALL_PROFILE_GRIDS.filter(g => g.shareProfileId === shareProfileId)
}

export function getGridByPerspective(
  shareProfileId: string,
  perspective: ProfilePerspective
): ShareProfileGrid | undefined {
  return ALL_PROFILE_GRIDS.find(
    g => g.shareProfileId === shareProfileId && g.perspective === perspective
  )
}

/**
 * Get the full 3x5 grid matrix for a profile
 */
export function getFullGridMatrix(shareProfileId: string): {
  regulation: ShareProfileGrid | undefined
  marketing: ShareProfileGrid | undefined
  reality: ShareProfileGrid | undefined
} {
  return {
    regulation: getGridByPerspective(shareProfileId, 'regulation'),
    marketing: getGridByPerspective(shareProfileId, 'marketing'),
    reality: getGridByPerspective(shareProfileId, 'reality'),
  }
}

/**
 * Analyze what pillars a profile addresses well vs poorly
 */
export function analyzeGridCoverage(shareProfileId: string): {
  pillar: string
  regulationState: string
  marketingState: string
  realityState: string
  isWellAddressed: boolean
}[] {
  const grids = getFullGridMatrix(shareProfileId)
  const pillars = ['soil', 'heritage', 'agricultural', 'ripen', 'enrich'] as const

  return pillars.map(pillar => {
    const stateKey = `${pillar}State` as keyof ShareProfileGrid
    const regState = grids.regulation?.[stateKey] as string || 'silence'
    const mktState = grids.marketing?.[stateKey] as string || 'silence'
    const realState = grids.reality?.[stateKey] as string || 'silence'

    // A pillar is "well addressed" if reality shows it as addressed or partial
    const isWellAddressed = realState === 'addressed' || realState === 'partial'

    return {
      pillar,
      regulationState: regState,
      marketingState: mktState,
      realityState: realState,
      isWellAddressed,
    }
  })
}
