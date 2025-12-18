/**
 * =============================================================================
 * TRANSFORMATION PROFILES
 * =============================================================================
 *
 * A TransformationProfile is the CLASSIFICATION UNIT for post-harvest inference.
 *
 * KEY INSIGHT: Just as SHARE Profiles let us infer ORIGIN quality from claims,
 * Transformation Profiles let us infer FINAL quality from processing methods.
 *
 * CORE PRINCIPLE: "You should TASTE THE HARVEST"
 * All transformation should preserve/enhance origin quality, not mask it.
 *
 * Example: Scan "Kona Coffee - Natural Process, Light Roast" → Extract methods →
 * Map to "Coffee Natural Light Profile" → Return expected cupping score range
 *
 * Each profile represents a distinct processing-combination that produces
 * predictable quality outcomes.
 *
 * HIERARCHY:
 *   ShareProfile (Origin)    → "What quality to expect from this farm/practices"
 *   TransformationProfile    → "What quality to expect from this processing"
 *   Actual Product Data      → "What we measured for THIS specific product"
 */

import type { QualityTier } from './quality-tiers'

// =============================================================================
// TYPES
// =============================================================================

export type TransformationCategory =
  | 'coffee'
  | 'tea'
  | 'cacao'
  | 'cheese'
  | 'cured_meat'
  | 'wine'
  | 'olive_oil'
  | 'maple_syrup'
  | 'honey'  // Honey has minimal transformation but some (raw vs processed)

/**
 * TransformationProfile - The classification unit for post-harvest inference
 *
 * A profile is defined by:
 * 1. Category (what type of product)
 * 2. Processing method (key transformation step)
 * 3. Secondary methods (roast level, aging time, etc.)
 *
 * The combination determines expected final quality.
 */
export interface TransformationProfile {
  id: string                          // e.g., "coffee_natural_light"
  code: string                        // Short code e.g., "C-NL"
  name: string                        // Display name e.g., "Natural Process Light Roast"
  category: TransformationCategory
  subcategory?: string                // More specific if needed

  // Method matching (parallel to claim matching in ShareProfile)
  primaryMethod: string               // Main processing method e.g., "natural", "washed"
  secondaryMethods?: string[]         // Additional methods e.g., ["light_roast", "sun_dried"]
  excludedMethods?: string[]          // Methods that disqualify e.g., ["dark_roast"]

  // Quality classification
  qualityTier: QualityTier
  qualityRank: number                 // 1 = best within category

  // Expected quality outcomes (inference)
  estimatedFinalQuality: {
    metric: string                    // "cupping_score", "flavor_intensity", etc.
    unit?: string                     // "SCA points", etc.
    range: [number, number]           // Expected range
    midpoint: number                  // Central estimate
  }

  // How transformation affects origin quality
  originPreservation: 'enhances' | 'preserves' | 'neutral' | 'risks_masking'

  // Expected flavor characteristics
  expectedCharacteristics: string[]   // ["bright acidity", "fruity", "clean finish"]

  // Stage summaries (parallel to pillar summaries in ShareProfile)
  stageSummaries: {
    [stageId: string]: string         // e.g., { processing: "Natural drying preserves fruit notes" }
  }

  // Metadata
  description: string
  notes?: string
  qualityFactors?: string[]           // Key factors that affect outcome
  redFlags?: string[]                 // Warning signs of poor processing
  isActive: boolean
  sortOrder: number
}

// =============================================================================
// COFFEE TRANSFORMATION PROFILES
// =============================================================================
// Processing methods: washed, natural, honey, anaerobic
// Roast levels: light, medium, dark
// Combinations create distinct quality expectations

export const COFFEE_TRANSFORMATION_PROFILES: TransformationProfile[] = [
  // ---------------------------------------------------------------------------
  // WASHED PROCESS PROFILES (clean, bright, origin-forward)
  // ---------------------------------------------------------------------------
  {
    id: 'coffee_washed_light',
    code: 'C-WL',
    name: 'Washed Process, Light Roast',
    category: 'coffee',
    primaryMethod: 'washed',
    secondaryMethods: ['light_roast'],
    excludedMethods: ['dark_roast'],
    qualityTier: 'artisan',
    qualityRank: 1,
    estimatedFinalQuality: {
      metric: 'cupping_score',
      unit: 'SCA points',
      range: [85, 92],
      midpoint: 88,
    },
    originPreservation: 'enhances',
    expectedCharacteristics: [
      'bright acidity',
      'clean finish',
      'floral notes',
      'origin-forward',
      'tea-like complexity',
    ],
    stageSummaries: {
      processing: 'Washed process removes fruit before drying, producing clean cup with bright acidity',
      drying: 'Controlled drying preserves delicate aromatics',
      roasting: 'Light roast preserves origin terroir and maximizes complexity',
    },
    description: 'The gold standard for showcasing coffee origin. Washed processing creates clarity, light roast preserves terroir.',
    qualityFactors: ['cherry ripeness', 'water quality', 'fermentation control', 'roast precision'],
    redFlags: ['grassy/underdeveloped', 'baked flavors', 'ferment defect'],
    isActive: true,
    sortOrder: 1,
  },
  {
    id: 'coffee_washed_medium',
    code: 'C-WM',
    name: 'Washed Process, Medium Roast',
    category: 'coffee',
    primaryMethod: 'washed',
    secondaryMethods: ['medium_roast'],
    qualityTier: 'premium',
    qualityRank: 2,
    estimatedFinalQuality: {
      metric: 'cupping_score',
      unit: 'SCA points',
      range: [82, 88],
      midpoint: 85,
    },
    originPreservation: 'preserves',
    expectedCharacteristics: [
      'balanced acidity',
      'caramel sweetness',
      'chocolate notes',
      'approachable complexity',
    ],
    stageSummaries: {
      processing: 'Washed process creates clean foundation',
      roasting: 'Medium roast balances origin character with developed sweetness',
    },
    description: 'Balanced approach that preserves origin while adding roast sweetness. Most versatile profile.',
    qualityFactors: ['cherry ripeness', 'roast development'],
    isActive: true,
    sortOrder: 2,
  },
  {
    id: 'coffee_washed_dark',
    code: 'C-WD',
    name: 'Washed Process, Dark Roast',
    category: 'coffee',
    primaryMethod: 'washed',
    secondaryMethods: ['dark_roast'],
    qualityTier: 'standard',
    qualityRank: 5,
    estimatedFinalQuality: {
      metric: 'cupping_score',
      unit: 'SCA points',
      range: [78, 84],
      midpoint: 81,
    },
    originPreservation: 'risks_masking',
    expectedCharacteristics: [
      'low acidity',
      'bold body',
      'smoky/roasty',
      'bitter-sweet',
    ],
    stageSummaries: {
      processing: 'Washed process benefits largely masked by roast',
      roasting: 'Dark roast dominates flavor, origin character diminished',
    },
    description: 'Roast-forward profile. Origin quality matters less as dark roast dominates. You do NOT taste the harvest.',
    redFlags: ['burnt/ashy', 'thin body (roast defect)', 'oily surface (over-roasted)'],
    isActive: true,
    sortOrder: 5,
  },

  // ---------------------------------------------------------------------------
  // NATURAL PROCESS PROFILES (fruity, complex, wine-like)
  // ---------------------------------------------------------------------------
  {
    id: 'coffee_natural_light',
    code: 'C-NL',
    name: 'Natural Process, Light Roast',
    category: 'coffee',
    primaryMethod: 'natural',
    secondaryMethods: ['light_roast'],
    excludedMethods: ['dark_roast'],
    qualityTier: 'artisan',
    qualityRank: 1,
    estimatedFinalQuality: {
      metric: 'cupping_score',
      unit: 'SCA points',
      range: [86, 93],
      midpoint: 89,
    },
    originPreservation: 'enhances',
    expectedCharacteristics: [
      'intense fruit',
      'berry notes',
      'wine-like complexity',
      'heavy body',
      'wild/funky (positive)',
    ],
    stageSummaries: {
      processing: 'Natural process ferments fruit on bean, creating intense fruit character',
      drying: 'Extended drying concentrates sugars and develops complexity',
      roasting: 'Light roast preserves fruit-forward character',
    },
    description: 'Maximum fruit expression. Natural process + light roast creates most distinctive, fruit-forward profile.',
    qualityFactors: ['cherry ripeness critical', 'drying conditions', 'fermentation control'],
    redFlags: ['over-fermented/boozy', 'mold/musty', 'unclean cup'],
    isActive: true,
    sortOrder: 1,
  },
  {
    id: 'coffee_natural_medium',
    code: 'C-NM',
    name: 'Natural Process, Medium Roast',
    category: 'coffee',
    primaryMethod: 'natural',
    secondaryMethods: ['medium_roast'],
    qualityTier: 'premium',
    qualityRank: 2,
    estimatedFinalQuality: {
      metric: 'cupping_score',
      unit: 'SCA points',
      range: [83, 89],
      midpoint: 86,
    },
    originPreservation: 'preserves',
    expectedCharacteristics: [
      'fruit sweetness',
      'chocolate undertones',
      'full body',
      'jammy',
    ],
    stageSummaries: {
      processing: 'Natural fruit character partially preserved',
      roasting: 'Medium roast adds sweetness while retaining some fruit',
    },
    description: 'Balanced fruit and roast. Approachable natural process for those who find light naturals too intense.',
    isActive: true,
    sortOrder: 3,
  },

  // ---------------------------------------------------------------------------
  // HONEY PROCESS PROFILES (sweet, balanced)
  // ---------------------------------------------------------------------------
  {
    id: 'coffee_honey_light',
    code: 'C-HL',
    name: 'Honey Process, Light Roast',
    category: 'coffee',
    primaryMethod: 'honey',
    secondaryMethods: ['light_roast'],
    qualityTier: 'artisan',
    qualityRank: 2,
    estimatedFinalQuality: {
      metric: 'cupping_score',
      unit: 'SCA points',
      range: [84, 90],
      midpoint: 87,
    },
    originPreservation: 'enhances',
    expectedCharacteristics: [
      'honey sweetness',
      'stone fruit',
      'balanced acidity',
      'silky body',
      'clean but complex',
    ],
    stageSummaries: {
      processing: 'Honey process leaves mucilage on bean, adding sweetness without ferment risk',
      roasting: 'Light roast preserves delicate honey character',
    },
    description: 'Best of both worlds - cleaner than natural, sweeter than washed. Excellent origin expression.',
    qualityFactors: ['mucilage percentage (yellow/red/black honey)', 'drying speed'],
    isActive: true,
    sortOrder: 2,
  },

  // ---------------------------------------------------------------------------
  // ANAEROBIC/EXPERIMENTAL PROFILES
  // ---------------------------------------------------------------------------
  {
    id: 'coffee_anaerobic_light',
    code: 'C-AL',
    name: 'Anaerobic Fermentation, Light Roast',
    category: 'coffee',
    primaryMethod: 'anaerobic',
    secondaryMethods: ['light_roast'],
    qualityTier: 'artisan',
    qualityRank: 1,
    estimatedFinalQuality: {
      metric: 'cupping_score',
      unit: 'SCA points',
      range: [87, 94],
      midpoint: 90,
    },
    originPreservation: 'enhances',
    expectedCharacteristics: [
      'exotic fruit',
      'tropical',
      'candy-like sweetness',
      'unique/experimental',
      'competition-grade',
    ],
    stageSummaries: {
      processing: 'Controlled oxygen-free fermentation creates unique flavor compounds',
      roasting: 'Light roast showcases experimental processing',
    },
    description: 'Cutting-edge processing for competition and connoisseurs. Highest price point, most distinctive.',
    qualityFactors: ['fermentation control critical', 'temperature monitoring', 'timing precision'],
    redFlags: ['off-fermentation', 'too funky/vinegar', 'inconsistent'],
    isActive: true,
    sortOrder: 1,
  },
]

// =============================================================================
// TEA TRANSFORMATION PROFILES
// =============================================================================
// Oxidation levels: unoxidized (green), light (white), partial (oolong), full (black)
// Firing methods: pan-fired, steamed, sun-dried, charcoal

export const TEA_TRANSFORMATION_PROFILES: TransformationProfile[] = [
  {
    id: 'tea_green_steamed',
    code: 'T-GS',
    name: 'Green Tea, Steamed (Japanese Style)',
    category: 'tea',
    primaryMethod: 'unoxidized',
    secondaryMethods: ['steamed'],
    qualityTier: 'artisan',
    qualityRank: 1,
    estimatedFinalQuality: {
      metric: 'leaf_grade',
      range: [85, 95],
      midpoint: 90,
    },
    originPreservation: 'enhances',
    expectedCharacteristics: [
      'vegetal',
      'umami',
      'marine notes',
      'bright green color',
      'fresh/grassy',
    ],
    stageSummaries: {
      oxidation: 'Zero oxidation preserves maximum catechins and L-theanine',
      drying: 'Steaming halts oxidation quickly, preserving vegetal character',
    },
    description: 'Japanese approach maximizes umami and preserves nutrients. First flush steamed green = highest quality.',
    qualityFactors: ['flush timing', 'shade growing (for gyokuro)', 'steaming precision'],
    isActive: true,
    sortOrder: 1,
  },
  {
    id: 'tea_green_panfired',
    code: 'T-GP',
    name: 'Green Tea, Pan-Fired (Chinese Style)',
    category: 'tea',
    primaryMethod: 'unoxidized',
    secondaryMethods: ['pan_fired'],
    qualityTier: 'artisan',
    qualityRank: 2,
    estimatedFinalQuality: {
      metric: 'leaf_grade',
      range: [82, 92],
      midpoint: 87,
    },
    originPreservation: 'enhances',
    expectedCharacteristics: [
      'nutty',
      'toasty',
      'chestnut notes',
      'smooth',
      'less vegetal than steamed',
    ],
    stageSummaries: {
      oxidation: 'Minimal oxidation, halted by wok firing',
      drying: 'Pan-firing adds toasty notes while preserving green character',
    },
    description: 'Chinese approach adds subtle roast character. Dragonwell (Longjing) is iconic example.',
    isActive: true,
    sortOrder: 2,
  },
  {
    id: 'tea_oolong_light',
    code: 'T-OL',
    name: 'Oolong, Light Oxidation (High Mountain)',
    category: 'tea',
    primaryMethod: 'partial_oxidation',
    secondaryMethods: ['light_oxidation', 'rolled'],
    qualityTier: 'artisan',
    qualityRank: 1,
    estimatedFinalQuality: {
      metric: 'leaf_grade',
      range: [88, 96],
      midpoint: 92,
    },
    originPreservation: 'enhances',
    expectedCharacteristics: [
      'floral',
      'orchid notes',
      'butter/cream',
      'light body',
      'lingering sweetness',
    ],
    stageSummaries: {
      oxidation: '15-30% oxidation develops floral complexity',
      rolling: 'Tight rolling creates signature ball shape, concentrates flavor',
    },
    description: 'Taiwan high mountain style. Altitude + light oxidation = ethereal floral complexity.',
    qualityFactors: ['altitude', 'spring harvest', 'rolling skill'],
    isActive: true,
    sortOrder: 1,
  },
  {
    id: 'tea_black_orthodox',
    code: 'T-BO',
    name: 'Black Tea, Orthodox Full Oxidation',
    category: 'tea',
    primaryMethod: 'full_oxidation',
    secondaryMethods: ['orthodox_process'],
    qualityTier: 'premium',
    qualityRank: 2,
    estimatedFinalQuality: {
      metric: 'leaf_grade',
      range: [80, 90],
      midpoint: 85,
    },
    originPreservation: 'preserves',
    expectedCharacteristics: [
      'malty',
      'brisk',
      'full body',
      'robust',
      'muscatel (Darjeeling)',
    ],
    stageSummaries: {
      oxidation: 'Full oxidation creates bold, malty character',
      processing: 'Orthodox rolling preserves whole leaf integrity',
    },
    description: 'Classic black tea processing. Second flush Darjeeling muscatel is the benchmark.',
    isActive: true,
    sortOrder: 3,
  },
]

// =============================================================================
// CACAO TRANSFORMATION PROFILES
// =============================================================================

export const CACAO_TRANSFORMATION_PROFILES: TransformationProfile[] = [
  {
    id: 'cacao_fine_light',
    code: 'CA-FL',
    name: 'Fine Cacao, Light Roast (Bean-to-Bar)',
    category: 'cacao',
    primaryMethod: 'controlled_fermentation',
    secondaryMethods: ['light_roast', 'minimal_conching'],
    qualityTier: 'artisan',
    qualityRank: 1,
    estimatedFinalQuality: {
      metric: 'flavor_complexity',
      range: [85, 95],
      midpoint: 90,
    },
    originPreservation: 'enhances',
    expectedCharacteristics: [
      'fruit-forward',
      'origin-specific',
      'complex acidity',
      'floral notes',
      'terroir expression',
    ],
    stageSummaries: {
      fermentation: 'Controlled box fermentation develops flavor precursors',
      roasting: 'Light roast preserves origin character and fruit notes',
      conching: 'Minimal conching preserves bright, complex flavors',
    },
    description: 'Craft chocolate approach - showcasing cacao origin like fine wine. Criollo genetics preferred.',
    qualityFactors: ['genetic variety (Criollo best)', 'fermentation skill', 'roast precision'],
    isActive: true,
    sortOrder: 1,
  },
  {
    id: 'cacao_balanced_medium',
    code: 'CA-BM',
    name: 'Balanced Cacao, Medium Roast',
    category: 'cacao',
    primaryMethod: 'standard_fermentation',
    secondaryMethods: ['medium_roast', 'standard_conching'],
    qualityTier: 'premium',
    qualityRank: 2,
    estimatedFinalQuality: {
      metric: 'flavor_complexity',
      range: [78, 88],
      midpoint: 83,
    },
    originPreservation: 'preserves',
    expectedCharacteristics: [
      'chocolate-forward',
      'nutty',
      'balanced',
      'smooth',
      'classic chocolate taste',
    ],
    stageSummaries: {
      fermentation: 'Standard fermentation develops classic chocolate notes',
      roasting: 'Medium roast balances origin and roast character',
      conching: 'Standard conching smooths texture and flavor',
    },
    description: 'Quality chocolate that balances origin with familiar chocolate character. Trinitario genetics typical.',
    isActive: true,
    sortOrder: 2,
  },
]

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get all transformation profiles for a category
 */
export function getTransformationProfiles(category: TransformationCategory): TransformationProfile[] {
  switch (category) {
    case 'coffee':
      return COFFEE_TRANSFORMATION_PROFILES
    case 'tea':
      return TEA_TRANSFORMATION_PROFILES
    case 'cacao':
      return CACAO_TRANSFORMATION_PROFILES
    default:
      return []
  }
}

/**
 * Find a transformation profile by ID
 */
export function getTransformationProfileById(id: string): TransformationProfile | undefined {
  const allProfiles = [
    ...COFFEE_TRANSFORMATION_PROFILES,
    ...TEA_TRANSFORMATION_PROFILES,
    ...CACAO_TRANSFORMATION_PROFILES,
  ]
  return allProfiles.find(p => p.id === id)
}

/**
 * Match processing methods to a transformation profile
 */
export function matchTransformationProfile(
  category: TransformationCategory,
  primaryMethod: string,
  secondaryMethods?: string[]
): TransformationProfile | undefined {
  const profiles = getTransformationProfiles(category)

  // Find best match based on method matching
  return profiles.find(profile => {
    // Primary method must match
    if (profile.primaryMethod !== primaryMethod) return false

    // If profile requires secondary methods, check them
    if (profile.secondaryMethods && secondaryMethods) {
      const hasRequired = profile.secondaryMethods.some(m =>
        secondaryMethods.includes(m)
      )
      if (!hasRequired) return false
    }

    // If profile excludes certain methods, check them
    if (profile.excludedMethods && secondaryMethods) {
      const hasExcluded = profile.excludedMethods.some(m =>
        secondaryMethods.includes(m)
      )
      if (hasExcluded) return false
    }

    return true
  })
}

/**
 * Get expected quality range for a transformation profile
 */
export function getExpectedQuality(profileId: string): { range: [number, number]; midpoint: number } | undefined {
  const profile = getTransformationProfileById(profileId)
  if (!profile) return undefined

  return {
    range: profile.estimatedFinalQuality.range,
    midpoint: profile.estimatedFinalQuality.midpoint,
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export const ALL_TRANSFORMATION_PROFILES: TransformationProfile[] = [
  ...COFFEE_TRANSFORMATION_PROFILES,
  ...TEA_TRANSFORMATION_PROFILES,
  ...CACAO_TRANSFORMATION_PROFILES,
]

export const TRANSFORMATION_PROFILE_COUNT = ALL_TRANSFORMATION_PROFILES.length
