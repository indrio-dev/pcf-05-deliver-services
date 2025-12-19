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

/**
 * GENERIC quality tier info - Brix ranges vary SIGNIFICANTLY by crop type.
 *
 * IMPORTANT: These ranges are calibrated from research + industry feedback.
 *
 * | Crop Type    | Artisan    | Premium    | Standard   | Commodity  | Sources                        |
 * |--------------|------------|------------|------------|------------|--------------------------------|
 * | Citrus       | 12-16      | 11-12      | 8-11       | <8         | Industry pro + UF IFAS + UC Davis |
 * | Stone Fruit  | 14-17      | 12-14      | 10-12      | 8-10       | UC Davis Crisosto Lab          |
 * | Berries      | 9-14       | 8-10       | 7-8        | 5-7        | Federal juice standards        |
 * | Apples       | 14-17      | 12-14      | 10-12      | 8-10       | MSU Extension + Stemilt        |
 * | Table Grapes | 18-20      | 16-18      | 14-16      | 12-14      | Felix Instruments + CA/EU std  |
 * | Wine Grapes  | 24-26      | 22-24      | 20-22      | 18-20      | Need high Brix for fermentation|
 * | Cherries     | 18-24      | 16-18      | 14-16      | 12-14      | Cherry Times + PMC research    |
 * | Tomatoes     | 6-10       | 5-6        | 4-5        | 3-4        | Ohio State Extension           |
 *
 * Real-world context (from citrus industry professional, 40+ years):
 * - Navel oranges: ≤8 = poor, 8-10 = average, 11-12 = very good, 12-14 = excellent
 * - Max ever seen: 16 Brix (80-year-old heirloom CA navels at peak) - RARE
 * - Rarely see > 15 Brix even with best available fruit
 * - Table grapes at 18°Brix = perfect (20-26 only for wine grapes)
 * - Cherries naturally high - 18-24 Brix for premium
 * - Tomatoes are LOW Brix crops - 6+ is exceptional (cherry tomatoes reach 10-12)
 */
export const QUALITY_TIER_INFO: Record<QualityTier, {
  name: string
  description: string
  typicalBrixRange: [number, number]  // Generic - see crop-specific ranges above
  priceMultiplier: number
}> = {
  artisan: {
    name: 'Artisan',
    description: 'Exceptional flavor, specialty or boutique cultivars. Often from small producers with meticulous practices.',
    typicalBrixRange: [14, 17],  // Generic - citrus max ~16, cherries ~24
    priceMultiplier: 2.5,
  },
  premium: {
    name: 'Premium',
    description: 'Heritage or heirloom varieties bred for flavor and nutrition. Superior genetics with proper growing conditions.',
    typicalBrixRange: [12, 14],  // Generic - citrus ~11-13
    priceMultiplier: 1.5,
  },
  standard: {
    name: 'Standard',
    description: 'Modern commercial cultivars with balanced traits. Good quality under good conditions.',
    typicalBrixRange: [10, 12],  // Generic - citrus ~9-11
    priceMultiplier: 1.0,
  },
  commodity: {
    name: 'Commodity',
    description: 'Bred primarily for yield, appearance, and shipping durability. Lower genetic ceiling for flavor.',
    typicalBrixRange: [8, 10],   // Generic - citrus ~7-9
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
// USDA MINIMUM QUALITY STANDARDS
// =============================================================================

/**
 * USDA Minimum Quality Standards by Crop Type
 *
 * IMPORTANT DISTINCTION - Two different USDA systems:
 *
 * 1. USDA GRADES (Fancy, No. 1, No. 2) = EXTERIOR APPEARANCE
 *    - Color, size, shape, freedom from defects
 *    - A "US Fancy" orange can have 10 Brix or 14 Brix
 *    - Grade says NOTHING about internal quality
 *
 * 2. USDA MINIMUM BRIX = MINIMUM QUALITY STANDARD (the floor)
 *    - Legal minimum Brix before produce can be shipped
 *    - This IS a quality standard - the LOWEST acceptable internal quality
 *    - Brix is a direct measure of sugar content (quality)
 *    - The minimum protects consumers from immature/low-quality fruit
 *
 * Fielder shows the USDA minimum alongside SHARE predictions so consumers
 * can see how much the product exceeds the government FLOOR.
 *
 * Display: "USDA Minimum: 10.0 Brix | Fielder Prediction: 12.5 Brix"
 *
 * Note: Some states (FL, CA, TX) have stricter standards than federal.
 */
export interface USDAMinimumStandard {
  cropType: string
  minimumBrix: number
  standardType: 'quality_floor' | 'appearance_grade'  // quality_floor = Brix minimum, appearance_grade = visual
  gradeLevel: string          // Description of what this standard represents
  notes?: string
  source: string
}

export const USDA_MINIMUM_STANDARDS: USDAMinimumStandard[] = [
  // CITRUS - Minimum quality standards (Brix floor to ship)
  {
    cropType: 'navel_orange',
    minimumBrix: 10.0,
    standardType: 'quality_floor',
    gradeLevel: 'Minimum quality to ship',
    notes: 'FL requires 9.0 Brix:acid ratio; CA 8.0. Premium navels reach 12-14 Brix.',
    source: 'USDA Citrus Maturity Standards',
  },
  {
    cropType: 'valencia_orange',
    minimumBrix: 10.0,
    standardType: 'quality_floor',
    gradeLevel: 'Minimum quality to ship',
    notes: 'Juice oranges often reach 11-13 Brix at peak.',
    source: 'USDA Citrus Maturity Standards',
  },
  {
    cropType: 'grapefruit',
    minimumBrix: 9.0,
    standardType: 'quality_floor',
    gradeLevel: 'Minimum quality to ship',
    notes: 'Texas Rio Star may reach 12+ Brix at peak.',
    source: 'USDA Citrus Maturity Standards',
  },
  {
    cropType: 'tangerine',
    minimumBrix: 9.0,
    standardType: 'quality_floor',
    gradeLevel: 'Minimum quality to ship',
    source: 'USDA Citrus Maturity Standards',
  },
  {
    cropType: 'lemon',
    minimumBrix: 7.0,
    standardType: 'quality_floor',
    gradeLevel: 'Minimum quality to ship',
    notes: 'Lemons valued for acidity, not sugar. Lower Brix is normal.',
    source: 'USDA Citrus Standards',
  },

  // STONE FRUIT
  {
    cropType: 'peach',
    minimumBrix: 10.0,
    standardType: 'quality_floor',
    gradeLevel: 'Minimum quality to ship',
    notes: 'Heirloom varieties (Georgia Belle) can reach 16+ Brix.',
    source: 'USDA Stone Fruit Maturity Standards',
  },
  {
    cropType: 'nectarine',
    minimumBrix: 10.0,
    standardType: 'quality_floor',
    gradeLevel: 'Minimum quality to ship',
    source: 'USDA Stone Fruit Maturity Standards',
  },
  {
    cropType: 'plum',
    minimumBrix: 12.0,
    standardType: 'quality_floor',
    gradeLevel: 'Minimum quality to ship',
    source: 'USDA Stone Fruit Maturity Standards',
  },
  {
    cropType: 'cherry',
    minimumBrix: 14.0,
    standardType: 'quality_floor',
    gradeLevel: 'Minimum quality to ship',
    notes: 'Cherries naturally high sugar. Premium: 18+ Brix.',
    source: 'USDA Cherry Maturity Standards',
  },

  // POME FRUIT
  {
    cropType: 'apple',
    minimumBrix: 10.0,
    standardType: 'quality_floor',
    gradeLevel: 'Minimum quality to ship',
    notes: 'Honeycrisp averages 13+ Brix; heirlooms 16+.',
    source: 'USDA Apple Maturity Standards',
  },
  {
    cropType: 'pear',
    minimumBrix: 10.0,
    standardType: 'quality_floor',
    gradeLevel: 'Minimum quality to ship',
    source: 'USDA Pear Maturity Standards',
  },

  // BERRIES
  {
    cropType: 'strawberry',
    minimumBrix: 7.0,
    standardType: 'quality_floor',
    gradeLevel: 'Minimum quality to ship',
    notes: 'Commercial averages 7-8 Brix. Premium: 10+ Brix.',
    source: 'USDA Strawberry Standards',
  },
  {
    cropType: 'blueberry',
    minimumBrix: 10.0,
    standardType: 'quality_floor',
    gradeLevel: 'Minimum quality to ship',
    source: 'USDA Blueberry Standards',
  },

  // GRAPES
  {
    cropType: 'table_grape',
    minimumBrix: 16.0,
    standardType: 'quality_floor',
    gradeLevel: 'Minimum quality to ship',
    notes: 'Wine grapes often 22-26 Brix.',
    source: 'USDA Grape Maturity Standards',
  },

  // MELONS
  {
    cropType: 'cantaloupe',
    minimumBrix: 9.0,
    standardType: 'quality_floor',
    gradeLevel: 'Minimum quality to ship',
    notes: 'Premium melons: 12+ Brix.',
    source: 'USDA Melon Standards',
  },
  {
    cropType: 'watermelon',
    minimumBrix: 10.0,
    standardType: 'quality_floor',
    gradeLevel: 'Minimum quality to ship',
    source: 'USDA Melon Standards',
  },

  // TOMATOES
  {
    cropType: 'tomato',
    minimumBrix: 4.0,
    standardType: 'quality_floor',
    gradeLevel: 'Minimum quality to ship',
    notes: 'Heirloom tomatoes: 6-8 Brix. Commercial hybrids: 4-5 Brix.',
    source: 'USDA Tomato Standards',
  },
]

/**
 * Get USDA minimum standard for a crop type.
 */
export function getUSDAMinimum(cropType: string): USDAMinimumStandard | undefined {
  return USDA_MINIMUM_STANDARDS.find(s => s.cropType === cropType)
}

/**
 * Calculate how much a Brix reading exceeds USDA minimum.
 * Returns { exceeds: boolean, delta: number, percentAbove: number }
 */
export function compareToUSDAMinimum(cropType: string, actualBrix: number): {
  exceeds: boolean
  delta: number
  percentAbove: number
  usdaMinimum: number
  gradeLevel: string
} | null {
  const standard = getUSDAMinimum(cropType)
  if (!standard) return null

  const delta = actualBrix - standard.minimumBrix
  const percentAbove = (delta / standard.minimumBrix) * 100

  return {
    exceeds: delta >= 0,
    delta: Math.round(delta * 10) / 10,
    percentAbove: Math.round(percentAbove),
    usdaMinimum: standard.minimumBrix,
    gradeLevel: standard.gradeLevel,
  }
}

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
 * Crop-specific Brix tier thresholds.
 *
 * Based on real-world industry data:
 * - Citrus: Max ~16 Brix for exceptional 80-year heirloom navels at peak
 * - Citrus: Rarely see > 15 Brix even with best available
 * - Cherries/Grapes naturally much higher
 * - Tomatoes are LOW Brix crops
 */
export const CROP_BRIX_TIERS: Record<string, {
  artisan: number    // >= this is artisan (excellent)
  premium: number    // >= this is premium (very good)
  standard: number   // >= this is standard (average)
  // Below standard = commodity (poor)
}> = {
  // Citrus - calibrated from industry professional (40+ years citrus experience):
  // Navel oranges: ≤8 = poor, 8-10 = average, 11-12 = very good, 12-14 = excellent
  // Max ever seen: 16 Brix (80-year-old heirloom CA navels at peak). Rarely see > 15.
  navel_orange: { artisan: 12, premium: 11, standard: 8 },    // 12-14=excellent, 11-12=very good, 8-10=average, <8=poor
  valencia_orange: { artisan: 12, premium: 11, standard: 8 },
  grapefruit: { artisan: 10, premium: 9, standard: 8 },       // Grapefruit naturally lower than navels
  tangerine: { artisan: 12, premium: 11, standard: 8 },
  mandarin: { artisan: 12, premium: 11, standard: 8 },
  lemon: { artisan: 9, premium: 7, standard: 6 },  // Lemons valued for acidity, low Brix is normal

  // Stone fruit
  peach: { artisan: 14, premium: 12, standard: 10 },
  nectarine: { artisan: 14, premium: 12, standard: 10 },
  plum: { artisan: 16, premium: 14, standard: 12 },
  cherry: { artisan: 18, premium: 16, standard: 14 },
  apricot: { artisan: 14, premium: 12, standard: 10 },

  // Pome fruit
  apple: { artisan: 14, premium: 12, standard: 10 },
  pear: { artisan: 14, premium: 12, standard: 10 },

  // Berries - Research shows strawberries 7-10 typical, blueberries 10-14, raspberries 9-13
  // Federal juice standards: strawberry 8.0, blueberry 10.0, raspberry 9.2-11.1
  strawberry: { artisan: 9, premium: 8, standard: 7 },     // 9-10=artisan, 8-9=premium, 7-8=standard, <7=commodity
  blueberry: { artisan: 12, premium: 10, standard: 8 },    // 12-14=artisan, 10-12=premium, 8-10=standard
  raspberry: { artisan: 11, premium: 9, standard: 7 },     // Black raspberries naturally higher (11.1 standard)

  // Grapes - Research: CA/EU standards 14-18 typical; 20+ only for wine grapes
  // Felix Instruments: table grape at 18°Brix = perfect; 20-26 unrealistic except wine
  table_grape: { artisan: 18, premium: 16, standard: 14 }, // 18-20=artisan, 16-18=premium, 14-16=standard
  wine_grape: { artisan: 24, premium: 22, standard: 20 },  // Wine grapes need higher Brix for fermentation

  // Melons
  cantaloupe: { artisan: 12, premium: 10, standard: 9 },
  watermelon: { artisan: 12, premium: 10, standard: 9 },
  honeydew: { artisan: 12, premium: 10, standard: 9 },

  // Vegetables (LOW Brix crops)
  tomato: { artisan: 6, premium: 5, standard: 4 },
  pepper: { artisan: 8, premium: 6, standard: 5 },
  carrot: { artisan: 10, premium: 8, standard: 6 },
  beet: { artisan: 12, premium: 10, standard: 8 },
}

/**
 * Infer quality tier from Brix reading.
 *
 * Use the crop-specific version when you know the crop type
 * for accurate tier assignment.
 */
export function inferTierFromBrix(brix: number, cropType?: string): QualityTier {
  // Use crop-specific thresholds if available
  if (cropType && CROP_BRIX_TIERS[cropType]) {
    const thresholds = CROP_BRIX_TIERS[cropType]
    if (brix >= thresholds.artisan) return 'artisan'
    if (brix >= thresholds.premium) return 'premium'
    if (brix >= thresholds.standard) return 'standard'
    return 'commodity'
  }

  // Generic fallback (use conservatively)
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
