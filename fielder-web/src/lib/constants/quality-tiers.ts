/**
 * =============================================================================
 * QUALITY TIER CLASSIFICATION SYSTEM
 * =============================================================================
 *
 * Ported from: legacy/python_engine/fielder/models/cultivar_database.py
 *
 * Quality tiers classify cultivars based on their breeding focus and
 * genetic potential for internal quality (flavor, nutrition).
 *
 * The Problem:
 * - Modern cultivars selected for yield + appearance have LOWER quality ceilings
 * - Heritage varieties selected for flavor/nutrition have HIGHER ceilings
 * - USDA grades focus on appearance, not internal quality
 *
 * Tier System:
 * - ARTISAN: Exceptional flavor, specialty/boutique cultivars
 * - PREMIUM: Heritage/heirloom, bred for flavor/nutrition
 * - STANDARD: Modern commercial, balanced traits
 * - COMMODITY: Bred for yield/shipping, lower quality ceiling
 */

// =============================================================================
// TYPES
// =============================================================================

export type QualityTier = 'artisan' | 'premium' | 'standard' | 'commodity'

export type BreedingFocus =
  | 'flavor'
  | 'nutrition'
  | 'yield'
  | 'appearance'
  | 'shipping'
  | 'disease_resistance'

/**
 * Heritage Intent Classification
 *
 * More nuanced than simple isHeritage/isHeirloom boolean flags.
 * Key insight: "Heritage equals flavor and nutrition, not yield"
 * But not ALL old varieties are high quality - some were bred for hardiness.
 *
 * - TRUE_HERITAGE: Selected specifically for flavor/nutrition over generations
 * - HEIRLOOM_QUALITY: Pre-1950 open-pollinated AND high quality
 * - HEIRLOOM_UTILITY: Pre-1950 but bred for hardiness/yield (not quality-focused)
 * - MODERN_NUTRIENT: Modern breeding with nutrition focus (e.g., Cara Cara, lycopene tomatoes)
 * - MODERN_FLAVOR: Modern breeding with flavor focus (e.g., Honeycrisp)
 * - COMMERCIAL: Modern breeding for yield/shipping/appearance
 */
export type HeritageIntent =
  | 'true_heritage'       // Selected for flavor/nutrition over generations
  | 'heirloom_quality'    // Pre-1950 AND high internal quality
  | 'heirloom_utility'    // Pre-1950 but bred for hardiness/yield
  | 'modern_nutrient'     // Modern with nutrition focus (not just yield)
  | 'modern_flavor'       // Modern with flavor focus
  | 'commercial'          // Modern yield/shipping/appearance focus

export type CropMaturityType =
  | 'tree_fruit_non_climacteric'   // Citrus, cherries - must ripen on tree
  | 'tree_fruit_climacteric'       // Apples, peaches - can ripen post-harvest
  | 'vine_climacteric'             // Tomatoes, melons
  | 'vine_non_climacteric'         // Grapes, cucumbers
  | 'berry_non_climacteric'        // Strawberries, blueberries
  | 'root_vegetable'               // Carrots, potatoes
  | 'leafy_green'                  // Lettuce, spinach
  | 'tropical_climacteric'         // Bananas, mangoes, avocados
  | 'nut'                          // Pecans, almonds - quality = oil content

export type PostHarvestBehavior = 'climacteric' | 'non_climacteric'

/**
 * Climacteric vs Non-climacteric is critical for harvest timing:
 * - Climacteric: produces ethylene, CAN ripen after harvest, but early harvest sacrifices quality
 * - Non-climacteric: MUST ripen on plant, quality fixed at harvest (citrus, berries, cherries)
 */
export const MATURITY_TYPE_BEHAVIOR: Record<CropMaturityType, PostHarvestBehavior> = {
  tree_fruit_non_climacteric: 'non_climacteric',
  tree_fruit_climacteric: 'climacteric',
  vine_climacteric: 'climacteric',
  vine_non_climacteric: 'non_climacteric',
  berry_non_climacteric: 'non_climacteric',
  root_vegetable: 'non_climacteric',
  leafy_green: 'non_climacteric',
  tropical_climacteric: 'climacteric',
  nut: 'non_climacteric',
}

// =============================================================================
// CULTIVAR QUALITY PROFILE
// =============================================================================

export interface CultivarQualityProfile {
  cultivarId: string
  cultivarName: string
  cropType: string              // e.g., 'navel_orange', 'strawberry'

  // Quality classification
  qualityTier: QualityTier
  breedingFocus: BreedingFocus[]

  // Heritage status - nuanced classification
  heritageIntent: HeritageIntent  // Primary classification
  isHeritage: boolean             // Selected for flavor/quality traits (convenience flag)
  isHeirloom: boolean             // Pre-1950 open-pollinated (convenience flag)
  yearIntroduced?: number

  // Research-based Brix data (genetic potential)
  researchPeakBrix?: number     // Peak Brix from studies
  researchAvgBrix?: number      // Average Brix from studies
  researchBrixRange?: [number, number]  // Min-max observed

  // Maturity characteristics
  maturityType: CropMaturityType
  timingClass: 'early' | 'mid' | 'late'
  daysToMaturity?: number

  // Quality characteristics
  flavorProfile?: string
  bestUse?: string[]            // ['fresh', 'juice', 'cooking', 'processing']
  nutritionHighlights?: string[]

  // Rootstock recommendations (tree crops)
  recommendedRootstocks?: string[]

  // Research sources
  sources: string[]
}

// =============================================================================
// QUALITY TIER DESCRIPTIONS
// =============================================================================

export const QUALITY_TIER_INFO: Record<QualityTier, {
  name: string
  description: string
  typicalBrixRange: [number, number]
  priceMultiplier: number
}> = {
  artisan: {
    name: 'Artisan',
    description: 'Exceptional flavor, specialty or boutique cultivars. Often from small producers with meticulous practices.',
    typicalBrixRange: [14, 18],
    priceMultiplier: 2.5,
  },
  premium: {
    name: 'Premium',
    description: 'Heritage or heirloom varieties bred for flavor and nutrition. Superior genetics with proper growing conditions.',
    typicalBrixRange: [12, 15],
    priceMultiplier: 1.5,
  },
  standard: {
    name: 'Standard',
    description: 'Modern commercial cultivars with balanced traits. Good quality under good conditions.',
    typicalBrixRange: [10, 12],
    priceMultiplier: 1.0,
  },
  commodity: {
    name: 'Commodity',
    description: 'Bred primarily for yield, appearance, and shipping durability. Lower genetic ceiling for flavor.',
    typicalBrixRange: [8, 10],
    priceMultiplier: 0.7,
  },
}

// =============================================================================
// CULTIVAR QUALITY DATABASE
// =============================================================================

/**
 * Cultivar quality profiles based on research data.
 *
 * This is the foundation for quality prediction - knowing the genetic
 * ceiling of a cultivar tells us the MAXIMUM quality achievable.
 */
export const CULTIVAR_QUALITY_PROFILES: CultivarQualityProfile[] = [
  // ==========================================================================
  // CITRUS - NAVEL ORANGES
  // ==========================================================================
  {
    cultivarId: 'washington_navel',
    cultivarName: 'Washington Navel',
    cropType: 'navel_orange',
    qualityTier: 'premium',
    breedingFocus: ['flavor'],
    heritageIntent: 'heirloom_quality',  // Pre-1950 AND high quality
    isHeritage: true,
    isHeirloom: true,
    yearIntroduced: 1870,
    researchPeakBrix: 12.5,
    researchAvgBrix: 11.5,
    researchBrixRange: [10.5, 13.0],
    maturityType: 'tree_fruit_non_climacteric',
    timingClass: 'mid',
    daysToMaturity: 270,
    flavorProfile: 'Sweet, low acid, classic navel flavor',
    bestUse: ['fresh'],
    nutritionHighlights: ['High vitamin C', 'Good fiber'],
    recommendedRootstocks: ['carrizo', 'c35', 'sour_orange'],
    sources: ['UF/IFAS Citrus Extension', 'USDA Citrus Maturity Studies'],
  },
  {
    cultivarId: 'cara_cara',
    cultivarName: 'Cara Cara Navel',
    cropType: 'navel_orange',
    qualityTier: 'premium',
    breedingFocus: ['flavor', 'nutrition'],
    heritageIntent: 'modern_nutrient',  // Modern but nutrition-focused (lycopene)
    isHeritage: false,
    isHeirloom: false,
    yearIntroduced: 1976,
    researchPeakBrix: 13.0,
    researchAvgBrix: 12.0,
    researchBrixRange: [11.0, 14.0],
    maturityType: 'tree_fruit_non_climacteric',
    timingClass: 'mid',
    daysToMaturity: 260,
    flavorProfile: 'Sweeter than Washington, berry-like undertones, pink flesh',
    bestUse: ['fresh'],
    nutritionHighlights: ['High vitamin C', 'Lycopene (pink pigment)', 'Antioxidants'],
    recommendedRootstocks: ['carrizo', 'c35'],
    sources: ['UC Davis', 'UF/IFAS'],
  },
  {
    cultivarId: 'lane_late',
    cultivarName: 'Lane Late Navel',
    cropType: 'navel_orange',
    qualityTier: 'standard',
    breedingFocus: ['shipping', 'yield'],
    heritageIntent: 'commercial',  // Bred for shipping/yield
    isHeritage: false,
    isHeirloom: false,
    yearIntroduced: 1950,
    researchPeakBrix: 11.5,
    researchAvgBrix: 10.5,
    researchBrixRange: [9.5, 12.0],
    maturityType: 'tree_fruit_non_climacteric',
    timingClass: 'late',
    daysToMaturity: 310,
    flavorProfile: 'Mild, consistent sweetness, holds well on tree',
    bestUse: ['fresh'],
    recommendedRootstocks: ['carrizo', 'swingle'],
    sources: ['UC Davis', 'California Citrus Mutual'],
  },

  // ==========================================================================
  // CITRUS - GRAPEFRUIT
  // ==========================================================================
  {
    cultivarId: 'rio_red',
    cultivarName: 'Rio Red Grapefruit',
    cropType: 'grapefruit',
    qualityTier: 'premium',
    breedingFocus: ['flavor', 'nutrition'],
    heritageIntent: 'modern_nutrient',  // Modern mutation selection for nutrition
    isHeritage: false,
    isHeirloom: false,
    yearIntroduced: 1984,
    researchPeakBrix: 11.0,
    researchAvgBrix: 10.0,
    researchBrixRange: [9.0, 12.0],
    maturityType: 'tree_fruit_non_climacteric',
    timingClass: 'mid',
    daysToMaturity: 290,
    flavorProfile: 'Deep red flesh, sweet with mild tartness',
    bestUse: ['fresh', 'juice'],
    nutritionHighlights: ['High vitamin C', 'Lycopene', 'Antioxidants'],
    recommendedRootstocks: ['sour_orange', 'carrizo'],
    sources: ['Texas A&M', 'UF/IFAS'],
  },
  {
    cultivarId: 'ruby_red',
    cultivarName: 'Ruby Red Grapefruit',
    cropType: 'grapefruit',
    qualityTier: 'premium',
    breedingFocus: ['flavor'],
    heritageIntent: 'true_heritage',  // Selected for flavor traits
    isHeritage: true,
    isHeirloom: false,
    yearIntroduced: 1929,
    researchPeakBrix: 10.5,
    researchAvgBrix: 9.5,
    researchBrixRange: [8.5, 11.5],
    maturityType: 'tree_fruit_non_climacteric',
    timingClass: 'mid',
    daysToMaturity: 280,
    flavorProfile: 'Classic grapefruit, balanced sweet-tart',
    bestUse: ['fresh', 'juice'],
    nutritionHighlights: ['High vitamin C', 'Beta-carotene'],
    recommendedRootstocks: ['sour_orange', 'cleopatra'],
    sources: ['Texas A&M', 'UF/IFAS'],
  },

  // ==========================================================================
  // STONE FRUIT - PEACHES
  // ==========================================================================
  {
    cultivarId: 'elberta',
    cultivarName: 'Elberta Peach',
    cropType: 'peach',
    qualityTier: 'premium',
    breedingFocus: ['flavor'],
    heritageIntent: 'heirloom_quality',  // Pre-1950 AND high quality
    isHeritage: true,
    isHeirloom: true,
    yearIntroduced: 1870,
    researchPeakBrix: 14.0,
    researchAvgBrix: 12.5,
    researchBrixRange: [11.0, 15.0],
    maturityType: 'tree_fruit_climacteric',
    timingClass: 'mid',
    daysToMaturity: 95,
    flavorProfile: 'Rich, aromatic, freestone, yellow flesh',
    bestUse: ['fresh', 'canning'],
    nutritionHighlights: ['Vitamin A', 'Vitamin C', 'Potassium'],
    recommendedRootstocks: ['lovell', 'guardian'],
    sources: ['UGA Extension', 'Clemson Extension'],
  },
  {
    cultivarId: 'georgia_belle',
    cultivarName: 'Georgia Belle Peach',
    cropType: 'peach',
    qualityTier: 'artisan',
    breedingFocus: ['flavor'],
    heritageIntent: 'heirloom_quality',  // Pre-1950 AND exceptional quality
    isHeritage: true,
    isHeirloom: true,
    yearIntroduced: 1870,
    researchPeakBrix: 16.0,
    researchAvgBrix: 14.0,
    researchBrixRange: [12.0, 17.0],
    maturityType: 'tree_fruit_climacteric',
    timingClass: 'mid',
    daysToMaturity: 100,
    flavorProfile: 'White flesh, exceptionally sweet, aromatic, freestone',
    bestUse: ['fresh'],
    nutritionHighlights: ['Vitamin C', 'Antioxidants'],
    recommendedRootstocks: ['lovell', 'guardian'],
    sources: ['UGA Extension', 'Southern Living'],
  },

  // ==========================================================================
  // BERRIES - STRAWBERRIES
  // ==========================================================================
  {
    cultivarId: 'sweet_charlie',
    cultivarName: 'Sweet Charlie',
    cropType: 'strawberry',
    qualityTier: 'premium',
    breedingFocus: ['flavor'],
    heritageIntent: 'modern_flavor',  // Modern breeding with flavor focus
    isHeritage: false,
    isHeirloom: false,
    yearIntroduced: 1992,
    researchPeakBrix: 10.0,
    researchAvgBrix: 8.5,
    researchBrixRange: [7.0, 11.0],
    maturityType: 'berry_non_climacteric',
    timingClass: 'early',
    daysToMaturity: 55,
    flavorProfile: 'Very sweet, low acid, good aroma',
    bestUse: ['fresh'],
    nutritionHighlights: ['High vitamin C', 'Antioxidants'],
    sources: ['UF/IFAS', 'NC State Extension'],
  },
  {
    cultivarId: 'florida_radiance',
    cultivarName: 'Florida Radiance',
    cropType: 'strawberry',
    qualityTier: 'standard',
    breedingFocus: ['yield', 'disease_resistance'],
    heritageIntent: 'commercial',  // Bred for yield/disease resistance
    isHeritage: false,
    isHeirloom: false,
    yearIntroduced: 2008,
    researchPeakBrix: 9.0,
    researchAvgBrix: 7.5,
    researchBrixRange: [6.5, 10.0],
    maturityType: 'berry_non_climacteric',
    timingClass: 'early',
    daysToMaturity: 50,
    flavorProfile: 'Mild sweetness, firm texture',
    bestUse: ['fresh', 'shipping'],
    nutritionHighlights: ['Vitamin C'],
    sources: ['UF/IFAS'],
  },

  // ==========================================================================
  // POME FRUIT - APPLES
  // ==========================================================================
  {
    cultivarId: 'honeycrisp',
    cultivarName: 'Honeycrisp',
    cropType: 'apple',
    qualityTier: 'premium',
    breedingFocus: ['flavor', 'appearance'],
    heritageIntent: 'modern_flavor',  // Modern breeding with flavor as primary goal
    isHeritage: false,
    isHeirloom: false,
    yearIntroduced: 1991,
    researchPeakBrix: 14.5,
    researchAvgBrix: 13.0,
    researchBrixRange: [11.5, 15.5],
    maturityType: 'tree_fruit_climacteric',
    timingClass: 'mid',
    daysToMaturity: 135,
    flavorProfile: 'Explosive crunch, balanced sweet-tart, honey notes',
    bestUse: ['fresh'],
    nutritionHighlights: ['Fiber', 'Vitamin C'],
    sources: ['University of Minnesota', 'MSU Extension'],
  },
  {
    cultivarId: 'cosmic_crisp',
    cultivarName: 'Cosmic Crisp',
    cropType: 'apple',
    qualityTier: 'standard',
    breedingFocus: ['shipping', 'appearance', 'yield'],
    heritageIntent: 'commercial',  // Commercial breeding for shipping/storage
    isHeritage: false,
    isHeirloom: false,
    yearIntroduced: 2019,
    researchPeakBrix: 13.0,
    researchAvgBrix: 12.0,
    researchBrixRange: [11.0, 14.0],
    maturityType: 'tree_fruit_climacteric',
    timingClass: 'late',
    daysToMaturity: 150,
    flavorProfile: 'Crisp, sweet, stores exceptionally well',
    bestUse: ['fresh', 'shipping'],
    nutritionHighlights: ['Fiber'],
    sources: ['WSU Extension', 'Cosmic Crisp LLC'],
  },
  {
    cultivarId: 'arkansas_black',
    cultivarName: 'Arkansas Black',
    cropType: 'apple',
    qualityTier: 'artisan',
    breedingFocus: ['flavor'],
    heritageIntent: 'heirloom_quality',  // Pre-1950 AND exceptional flavor
    isHeritage: true,
    isHeirloom: true,
    yearIntroduced: 1870,
    researchPeakBrix: 16.0,
    researchAvgBrix: 14.5,
    researchBrixRange: [13.0, 17.0],
    maturityType: 'tree_fruit_climacteric',
    timingClass: 'late',
    daysToMaturity: 170,
    flavorProfile: 'Complex, wine-like, improves in storage, very firm',
    bestUse: ['fresh', 'cider'],
    nutritionHighlights: ['High antioxidants', 'Fiber'],
    sources: ['Arkansas Extension', 'Seed Savers Exchange'],
  },
]

// =============================================================================
// LOOKUP FUNCTIONS
// =============================================================================

/**
 * Get cultivar quality profile by ID.
 */
export function getCultivarProfile(cultivarId: string): CultivarQualityProfile | undefined {
  return CULTIVAR_QUALITY_PROFILES.find(c => c.cultivarId === cultivarId)
}

/**
 * Get all cultivars for a crop type.
 */
export function getCultivarsForCrop(cropType: string): CultivarQualityProfile[] {
  return CULTIVAR_QUALITY_PROFILES.filter(c => c.cropType === cropType)
}

/**
 * Get cultivars by quality tier.
 */
export function getCultivarsByTier(tier: QualityTier): CultivarQualityProfile[] {
  return CULTIVAR_QUALITY_PROFILES.filter(c => c.qualityTier === tier)
}

/**
 * Get heritage/heirloom cultivars for a crop.
 */
export function getHeritageCultivars(cropType?: string): CultivarQualityProfile[] {
  let cultivars = CULTIVAR_QUALITY_PROFILES.filter(c => c.isHeritage || c.isHeirloom)
  if (cropType) {
    cultivars = cultivars.filter(c => c.cropType === cropType)
  }
  return cultivars
}

/**
 * Get cultivars by heritage intent classification.
 *
 * This provides more nuanced filtering than isHeritage/isHeirloom booleans:
 * - 'true_heritage' - Selected specifically for flavor/nutrition
 * - 'heirloom_quality' - Pre-1950 AND high internal quality
 * - 'modern_nutrient' - Modern breeding with nutrition focus
 * - 'modern_flavor' - Modern breeding with flavor focus
 * - 'commercial' - Yield/shipping/appearance focus
 */
export function getCultivarsByHeritageIntent(
  intent: HeritageIntent,
  cropType?: string
): CultivarQualityProfile[] {
  let cultivars = CULTIVAR_QUALITY_PROFILES.filter(c => c.heritageIntent === intent)
  if (cropType) {
    cultivars = cultivars.filter(c => c.cropType === cropType)
  }
  return cultivars
}

/**
 * Get all quality-focused cultivars (not commercial).
 *
 * Includes: true_heritage, heirloom_quality, modern_nutrient, modern_flavor
 * Excludes: commercial, heirloom_utility
 */
export function getQualityFocusedCultivars(cropType?: string): CultivarQualityProfile[] {
  const qualityIntents: HeritageIntent[] = [
    'true_heritage',
    'heirloom_quality',
    'modern_nutrient',
    'modern_flavor',
  ]
  let cultivars = CULTIVAR_QUALITY_PROFILES.filter(c => qualityIntents.includes(c.heritageIntent))
  if (cropType) {
    cultivars = cultivars.filter(c => c.cropType === cropType)
  }
  return cultivars
}

/**
 * Get premium and artisan cultivars for a crop.
 */
export function getPremiumCultivars(cropType?: string): CultivarQualityProfile[] {
  let cultivars = CULTIVAR_QUALITY_PROFILES.filter(
    c => c.qualityTier === 'premium' || c.qualityTier === 'artisan'
  )
  if (cropType) {
    cultivars = cultivars.filter(c => c.cropType === cropType)
  }
  return cultivars
}

/**
 * Infer quality tier from Brix reading.
 */
export function inferTierFromBrix(brix: number): QualityTier {
  if (brix >= 14) return 'artisan'
  if (brix >= 12) return 'premium'
  if (brix >= 10) return 'standard'
  return 'commodity'
}

/**
 * Get expected Brix range for a quality tier.
 */
export function getExpectedBrixRange(tier: QualityTier): [number, number] {
  return QUALITY_TIER_INFO[tier].typicalBrixRange
}

/**
 * Get post-harvest behavior for a maturity type.
 */
export function getPostHarvestBehavior(maturityType: CropMaturityType): PostHarvestBehavior {
  return MATURITY_TYPE_BEHAVIOR[maturityType]
}

/**
 * Get all unique crop types in the database.
 */
export function getAvailableCropTypes(): string[] {
  const types = new Set(CULTIVAR_QUALITY_PROFILES.map(c => c.cropType))
  return Array.from(types).sort()
}
