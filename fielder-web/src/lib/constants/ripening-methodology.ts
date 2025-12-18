/**
 * =============================================================================
 * RIPENING METHODOLOGY (R Pillar Algorithm Mapping)
 * =============================================================================
 *
 * KEY INSIGHT: Different products need different R (Ripen) prediction algorithms
 * based on their E (Enrich) quality metrics.
 *
 * The R algorithm should PREDICT the E metric:
 * - GDD-Brix algorithm → predicts Brix (E metric for produce)
 * - GDD-Oil algorithm → predicts oil content (E metric for nuts)
 * - Age-Maturity algorithm → predicts omega ratio readiness (E metric for animals)
 * - Calendar-Season → predicts quality window (when E metric is optimal)
 *
 * This file maps each product category to its appropriate R methodology.
 */

import type { ShareProfileCategory } from './share-profiles'

// =============================================================================
// R ALGORITHM TYPES
// =============================================================================

/**
 * RAlgorithmType - The different prediction methodologies for the R pillar
 *
 * Each type has different inputs and predicts different E outcomes.
 */
export type RAlgorithmType =
  | 'gdd_brix'           // GDD accumulation → Brix prediction (tree fruit, berries)
  | 'gdd_oil'            // GDD accumulation → Oil content prediction (nuts)
  | 'gdd_starch'         // GDD accumulation → Starch conversion (potatoes, root veg)
  | 'calendar_season'    // Fixed seasonal windows (seafood, seasonal products)
  | 'age_maturity'       // Animal age/weight → Omega ratio readiness
  | 'transformation'     // Post-harvest time-based (aging, fermentation, roasting)
  | 'harvest_window'     // Simple calendar-based peak window (honey, maple)

/**
 * EMetricType - What quality metric the R algorithm predicts
 */
export type EMetricType =
  | 'brix'               // Sugar content (produce)
  | 'oil_content'        // Oil percentage (nuts)
  | 'omega_ratio'        // Omega-6:Omega-3 ratio (animal products)
  | 'omega_3_content'    // Absolute omega-3 (cold water fish)
  | 'starch_sugar'       // Starch-to-sugar conversion (root vegetables)
  | 'mineral_content'    // Mineral profile (oysters - merroir)
  | 'cupping_score'      // SCA score (coffee - post transformation)
  | 'enzyme_activity'    // Enzyme preservation (honey, raw products)
  | 'none'               // No predictable metric (calendar-only products)

// =============================================================================
// R METHODOLOGY DEFINITION
// =============================================================================

export interface RMethodology {
  algorithmType: RAlgorithmType
  predictsMetric: EMetricType

  // Algorithm-specific parameters
  requiresGDD: boolean              // Needs Growing Degree Days calculation
  requiresBloomDate: boolean        // Needs bloom/flowering date
  requiresAge: boolean              // Needs animal/tree age
  requiresCalendar: boolean         // Uses fixed calendar windows
  requiresTransformation: boolean   // Links to transformation profiles

  // Prediction characteristics
  seasonalVariation: 'high' | 'moderate' | 'low' | 'none'
  geographicVariation: 'high' | 'moderate' | 'low'

  // Model confidence
  modelMaturity: 'research_backed' | 'inferred' | 'needs_validation'

  // Description
  description: string
  keyFactors: string[]              // What affects the prediction
  limitations: string[]             // Known limitations of the model
}

// =============================================================================
// R METHODOLOGY DEFINITIONS BY ALGORITHM TYPE
// =============================================================================

export const R_METHODOLOGY_DEFINITIONS: Record<RAlgorithmType, RMethodology> = {
  gdd_brix: {
    algorithmType: 'gdd_brix',
    predictsMetric: 'brix',
    requiresGDD: true,
    requiresBloomDate: true,
    requiresAge: true,              // Tree age affects Brix ceiling
    requiresCalendar: false,
    requiresTransformation: false,
    seasonalVariation: 'high',
    geographicVariation: 'high',
    modelMaturity: 'research_backed',
    description: 'Growing Degree Days accumulation predicts sugar (Brix) development. Well-researched for citrus, stone fruit, and berries.',
    keyFactors: [
      'Accumulated GDD from bloom',
      'Cultivar genetic ceiling',
      'Rootstock modifier',
      'Tree age (prime vs young/old)',
      'Crop load (fruit per tree)',
    ],
    limitations: [
      'Requires accurate bloom date',
      'Weather variability affects accuracy',
      'Late-season heat can degrade quality',
    ],
  },

  gdd_oil: {
    algorithmType: 'gdd_oil',
    predictsMetric: 'oil_content',
    requiresGDD: true,
    requiresBloomDate: true,        // Nut crops bloom/pollinate
    requiresAge: true,              // Nut trees take 5-10 years to peak
    requiresCalendar: false,
    requiresTransformation: false,
    seasonalVariation: 'moderate',
    geographicVariation: 'moderate',
    modelMaturity: 'needs_validation',
    description: 'GDD accumulation predicts oil content development in nuts. Similar to Brix model but needs validation for oil accumulation curves.',
    keyFactors: [
      'Accumulated GDD from pollination',
      'Cultivar oil content ceiling',
      'Tree age (pecans peak 15-75 years)',
      'Water stress (mild stress can concentrate oil)',
      'Zinc availability (critical for pecans)',
    ],
    limitations: [
      'Less research than Brix models',
      'Oil accumulation curve may differ from sugar',
      'Kernel fill timing affects measurement',
      'Shell-out timing critical for accuracy',
    ],
  },

  gdd_starch: {
    algorithmType: 'gdd_starch',
    predictsMetric: 'starch_sugar',
    requiresGDD: true,
    requiresBloomDate: false,       // Root vegetables don't bloom for harvest
    requiresAge: false,
    requiresCalendar: true,         // Planting date matters
    requiresTransformation: false,
    seasonalVariation: 'moderate',
    geographicVariation: 'moderate',
    modelMaturity: 'inferred',
    description: 'GDD accumulation predicts starch development and sugar conversion in root vegetables. Post-harvest cold storage converts starch to sugar.',
    keyFactors: [
      'Days from planting',
      'Soil temperature',
      'Frost exposure (sweetens carrots, parsnips)',
      'Post-harvest cold storage duration',
    ],
    limitations: [
      'Quality changes significantly post-harvest',
      'Storage conditions as important as field',
      'Less standardized than fruit models',
    ],
  },

  calendar_season: {
    algorithmType: 'calendar_season',
    predictsMetric: 'none',         // Predicts WHEN, not WHAT level
    requiresGDD: false,
    requiresBloomDate: false,
    requiresAge: false,
    requiresCalendar: true,
    requiresTransformation: false,
    seasonalVariation: 'high',
    geographicVariation: 'low',     // Seasons are biologically fixed
    modelMaturity: 'research_backed',
    description: 'Fixed calendar windows based on biology (spawning, molting, migration). Quality is binary: in-season vs out-of-season.',
    keyFactors: [
      'Species biology (spawning cycles)',
      'Water temperature',
      'Regulatory seasons (stone crab Oct-May)',
      'Traditional knowledge (oyster R months)',
    ],
    limitations: [
      'Binary quality prediction (good/avoid)',
      'Climate change may shift windows',
      'Local regulations may differ from biology',
    ],
  },

  age_maturity: {
    algorithmType: 'age_maturity',
    predictsMetric: 'omega_ratio',
    requiresGDD: false,
    requiresBloomDate: false,
    requiresAge: true,              // THE key factor
    requiresCalendar: false,
    requiresTransformation: false,
    seasonalVariation: 'none',
    geographicVariation: 'low',
    modelMaturity: 'research_backed',
    description: 'Animal age and feeding duration determines omega ratio. Longer pasture time = better ratio; longer feedlot = worse ratio.',
    keyFactors: [
      'Total age at harvest',
      'Time on pasture vs feedlot',
      'Feeding regime (grass vs grain)',
      'Breed (affects maturity rate)',
      'Full maturity achievement',
    ],
    limitations: [
      'Requires knowing feeding history',
      'Marketing claims may not match reality',
      'Lab verification needed for accuracy',
    ],
  },

  transformation: {
    algorithmType: 'transformation',
    predictsMetric: 'cupping_score', // Or other transformed metric
    requiresGDD: false,
    requiresBloomDate: false,
    requiresAge: false,
    requiresCalendar: false,
    requiresTransformation: true,   // Links to TransformationProfiles
    seasonalVariation: 'none',
    geographicVariation: 'low',
    modelMaturity: 'research_backed',
    description: 'Post-harvest processing determines final quality. Origin SHARE sets ceiling; transformation realizes or degrades it.',
    keyFactors: [
      'Origin quality (cherry Brix, milk quality)',
      'Processing method (washed, natural, aged)',
      'Processing parameters (roast level, aging time)',
      'Processor skill and equipment',
    ],
    limitations: [
      'Two-stage prediction (origin + transformation)',
      'Processor variation significant',
      'Freshness/storage affects final quality',
    ],
  },

  harvest_window: {
    algorithmType: 'harvest_window',
    predictsMetric: 'enzyme_activity',
    requiresGDD: false,
    requiresBloomDate: false,
    requiresAge: false,
    requiresCalendar: true,
    requiresTransformation: false,
    seasonalVariation: 'high',
    geographicVariation: 'moderate',
    modelMaturity: 'inferred',
    description: 'Simple calendar-based peak windows for products where timing matters but complex models don\'t apply.',
    keyFactors: [
      'Regional harvest traditions',
      'Nectar flow timing (honey)',
      'Sap flow timing (maple)',
      'Weather conditions',
    ],
    limitations: [
      'Less precise than GDD models',
      'Year-to-year variation significant',
      'Quality range rather than point estimate',
    ],
  },
}

// =============================================================================
// CATEGORY TO METHODOLOGY MAPPING
// =============================================================================

export interface CategoryMethodologyMapping {
  category: ShareProfileCategory
  subcategories?: string[]          // More specific mappings if needed
  methodology: RAlgorithmType
  eMetric: EMetricType
  notes?: string
}

/**
 * Maps each product category to its appropriate R methodology
 */
export const CATEGORY_METHODOLOGY_MAP: CategoryMethodologyMapping[] = [
  // === PRODUCE (GDD-Brix) ===
  {
    category: 'citrus',
    methodology: 'gdd_brix',
    eMetric: 'brix',
    notes: 'Well-researched GDD models for all citrus. Bloom date + GDD = harvest window.',
  },
  {
    category: 'stone_fruit',
    methodology: 'gdd_brix',
    eMetric: 'brix',
    notes: 'Peaches, plums, cherries. GDD from bloom. Zavalloni model for cherries (R²=0.971).',
  },
  {
    category: 'pome_fruit',
    methodology: 'gdd_brix',
    eMetric: 'brix',
    notes: 'Apples, pears. GDD models well-established. Starch-iodine test common for apples.',
  },
  {
    category: 'berry',
    methodology: 'gdd_brix',
    eMetric: 'brix',
    notes: 'Blueberries, strawberries. GDD from bloom. Shorter accumulation period than tree fruit.',
  },
  {
    category: 'melon',
    methodology: 'gdd_brix',
    eMetric: 'brix',
    notes: 'Watermelon, cantaloupe. GDD from fruit set. Slip test for cantaloupes.',
  },
  {
    category: 'tropical',
    methodology: 'gdd_brix',
    eMetric: 'brix',
    notes: 'Mango, papaya, pineapple. GDD models less precise in tropical climates.',
  },

  // === VEGETABLES (Various) ===
  {
    category: 'leafy_greens',
    methodology: 'harvest_window',
    eMetric: 'none',
    notes: 'Quality is freshness-based. Harvest before bolting. No complex ripening.',
  },
  {
    category: 'root_vegetable',
    methodology: 'gdd_starch',
    eMetric: 'starch_sugar',
    notes: 'Carrots, beets, parsnips. Frost exposure sweetens. Post-harvest storage converts starch.',
  },
  {
    category: 'nightshade',
    methodology: 'gdd_brix',
    eMetric: 'brix',
    notes: 'Tomatoes use Brix. Peppers less standardized. Days-to-maturity common proxy.',
  },
  {
    category: 'cruciferous',
    methodology: 'harvest_window',
    eMetric: 'none',
    notes: 'Broccoli, cabbage. Harvest at size before flowering. Temperature-sensitive.',
  },

  // === NUTS (GDD-Oil) ===
  {
    category: 'nuts',
    methodology: 'gdd_oil',
    eMetric: 'oil_content',
    notes: 'Pecans, walnuts, almonds. GDD from pollination. Oil accumulates through kernel fill. NEEDS VALIDATION.',
  },

  // === ANIMAL PRODUCTS (Age-Maturity) ===
  {
    category: 'beef',
    methodology: 'age_maturity',
    eMetric: 'omega_ratio',
    notes: 'Age + feeding regime = omega ratio. 24mo grass-fed vs 14-18mo feedlot.',
  },
  {
    category: 'bison',
    methodology: 'age_maturity',
    eMetric: 'omega_ratio',
    notes: 'Similar to beef. Often grass-fed by default. 24-30mo maturity.',
  },
  {
    category: 'pork',
    methodology: 'age_maturity',
    eMetric: 'omega_ratio',
    notes: 'Heritage 10-12mo vs commodity 5-6mo. Feeding regime critical.',
  },
  {
    category: 'poultry',
    methodology: 'age_maturity',
    eMetric: 'omega_ratio',
    notes: 'Weeks not months. Heritage 12+ weeks vs commodity 6-8 weeks. Feed composition key.',
  },
  {
    category: 'eggs',
    methodology: 'age_maturity',
    eMetric: 'omega_ratio',
    notes: 'Hen diet determines egg omega ratio. Pasture + insects vs grain-only.',
  },
  {
    category: 'dairy',
    methodology: 'age_maturity',
    eMetric: 'omega_ratio',
    notes: 'Cow diet = milk omega ratio. Grass-fed vs grain-fed. Seasonal variation in pasture systems.',
  },

  // === SEAFOOD (Calendar-Season or Age) ===
  {
    category: 'seafood',
    subcategories: ['shellfish'],
    methodology: 'calendar_season',
    eMetric: 'mineral_content',
    notes: 'Oysters: R months rule. Spawning season (May-Aug) reduces quality. Merroir = water body terroir.',
  },
  {
    category: 'seafood',
    subcategories: ['crustacean'],
    methodology: 'calendar_season',
    eMetric: 'none',
    notes: 'Stone crab Oct-May. Lobster varies by region. Regulatory seasons often match biology.',
  },
  {
    category: 'seafood',
    subcategories: ['fish'],
    methodology: 'calendar_season',
    eMetric: 'omega_3_content',
    notes: 'Wild fish: seasonal runs (salmon June-Sept). Fat content varies with season and spawning.',
  },

  // === POST-HARVEST (Various) ===
  {
    category: 'honey',
    methodology: 'harvest_window',
    eMetric: 'enzyme_activity',
    notes: 'Nectar flow timing varies by region. Raw = enzyme preservation. Varietal timing matters.',
  },
  {
    category: 'oil',
    methodology: 'harvest_window',
    eMetric: 'none',
    notes: 'Olive oil harvest timing affects polyphenols. Early harvest = more bitter, more polyphenols.',
  },

  // === TRANSFORMED (Transformation) ===
  {
    category: 'coffee',
    methodology: 'transformation',
    eMetric: 'cupping_score',
    notes: 'Two-stage: Origin SHARE (cherry Brix) + Transformation (processing, roasting). Final = cupping score.',
  },
  {
    category: 'grains',
    methodology: 'harvest_window',
    eMetric: 'none',
    notes: 'Harvest at proper moisture. Quality is freshness and storage. Minimal ripening complexity.',
  },
]

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get the R methodology for a product category
 */
export function getMethodologyForCategory(
  category: ShareProfileCategory,
  subcategory?: string
): CategoryMethodologyMapping | undefined {
  // First try to find a specific subcategory match
  if (subcategory) {
    const specificMatch = CATEGORY_METHODOLOGY_MAP.find(
      m => m.category === category && m.subcategories?.includes(subcategory)
    )
    if (specificMatch) return specificMatch
  }

  // Fall back to category-level match
  return CATEGORY_METHODOLOGY_MAP.find(
    m => m.category === category && !m.subcategories
  )
}

/**
 * Get the R methodology definition
 */
export function getMethodologyDefinition(algorithmType: RAlgorithmType): RMethodology {
  return R_METHODOLOGY_DEFINITIONS[algorithmType]
}

/**
 * Check if a category requires GDD calculation
 */
export function categoryRequiresGDD(category: ShareProfileCategory): boolean {
  const mapping = getMethodologyForCategory(category)
  if (!mapping) return false
  return R_METHODOLOGY_DEFINITIONS[mapping.methodology].requiresGDD
}

/**
 * Check if a category uses calendar-based prediction
 */
export function categoryUsesCalendar(category: ShareProfileCategory): boolean {
  const mapping = getMethodologyForCategory(category)
  if (!mapping) return false
  return R_METHODOLOGY_DEFINITIONS[mapping.methodology].requiresCalendar
}

/**
 * Get the E metric predicted for a category
 */
export function getEMetricForCategory(category: ShareProfileCategory): EMetricType | undefined {
  const mapping = getMethodologyForCategory(category)
  return mapping?.eMetric
}

// =============================================================================
// VALIDATION STATUS
// =============================================================================

/**
 * Tracks which category methodologies need validation
 */
export const METHODOLOGY_VALIDATION_STATUS: Record<ShareProfileCategory, 'validated' | 'needs_research' | 'inferred'> = {
  // Validated (research-backed GDD models)
  citrus: 'validated',
  stone_fruit: 'validated',
  pome_fruit: 'validated',
  berry: 'validated',

  // Needs research (GDD-oil model not validated)
  nuts: 'needs_research',

  // Inferred (applying similar logic)
  melon: 'inferred',
  tropical: 'inferred',
  leafy_greens: 'inferred',
  root_vegetable: 'inferred',
  nightshade: 'inferred',
  cruciferous: 'inferred',

  // Validated (age-maturity well understood)
  beef: 'validated',
  bison: 'inferred',
  pork: 'validated',
  poultry: 'validated',
  eggs: 'validated',
  dairy: 'validated',

  // Validated (calendar-season biology well documented)
  seafood: 'validated',

  // Needs research (E pillar now defined but methodology not validated)
  honey: 'needs_research',
  oil: 'inferred',
  grains: 'inferred',

  // Validated (transformation profiles complete)
  coffee: 'validated',
}

// =============================================================================
// ALGORITHM SELECTION LOGIC
// =============================================================================

/**
 * Determines which prediction algorithm to use for a product
 *
 * This is the entry point for the prediction engine to select
 * the appropriate R pillar calculation method.
 */
export interface AlgorithmSelection {
  algorithmType: RAlgorithmType
  predictsMetric: EMetricType
  requiredInputs: string[]
  modelConfidence: 'high' | 'medium' | 'low'
  notes: string
}

export function selectAlgorithm(
  category: ShareProfileCategory,
  subcategory?: string
): AlgorithmSelection {
  const mapping = getMethodologyForCategory(category, subcategory)

  if (!mapping) {
    // Default fallback
    return {
      algorithmType: 'harvest_window',
      predictsMetric: 'none',
      requiredInputs: ['harvest_date', 'region'],
      modelConfidence: 'low',
      notes: `No specific methodology defined for ${category}. Using simple calendar model.`,
    }
  }

  const methodology = R_METHODOLOGY_DEFINITIONS[mapping.methodology]
  const validationStatus = METHODOLOGY_VALIDATION_STATUS[category]

  // Build required inputs list
  const requiredInputs: string[] = []
  if (methodology.requiresGDD) requiredInputs.push('bloom_date', 'daily_temperatures', 'base_temperature')
  if (methodology.requiresAge) requiredInputs.push('age', 'maturity_date')
  if (methodology.requiresCalendar) requiredInputs.push('harvest_date', 'season')
  if (methodology.requiresTransformation) requiredInputs.push('transformation_profile_id')

  // Determine confidence
  let modelConfidence: 'high' | 'medium' | 'low'
  if (validationStatus === 'validated' && methodology.modelMaturity === 'research_backed') {
    modelConfidence = 'high'
  } else if (validationStatus === 'inferred' || methodology.modelMaturity === 'inferred') {
    modelConfidence = 'medium'
  } else {
    modelConfidence = 'low'
  }

  return {
    algorithmType: mapping.methodology,
    predictsMetric: mapping.eMetric,
    requiredInputs,
    modelConfidence,
    notes: mapping.notes || methodology.description,
  }
}
