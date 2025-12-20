/**
 * =============================================================================
 * SHARE PILLAR ATTRIBUTE TYPES
 * =============================================================================
 *
 * This module defines typed attribute classes for each SHARE pillar.
 * Every data point in the system maps to one of these attribute types.
 *
 * SHARE PILLARS (in order):
 *   S - Soil Health
 *   H - Heritage Cultivars
 *   A - Agricultural Practices
 *   R - Ripen
 *   E - Enrich
 *
 * DESIGN PRINCIPLE: Every consumer-visible data point should be presentable
 * as an attribute under one of these pillars. No orphan data.
 *
 * =============================================================================
 * PILLAR RELATIONSHIPS
 * =============================================================================
 *
 * The pillars are not independent - they have specific relationships:
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  H (Heritage Cultivars)                                                 │
 * │  └── Sets GENETIC CEILING (fixed at planting/birth)                     │
 * │      • Cultivar/breed determines maximum achievable quality             │
 * │      • Rootstock modifies ceiling for tree crops                        │
 * │      • Cannot be exceeded regardless of other pillars                   │
 * │                                                                         │
 * │      ▼                                                                  │
 * │  R (Ripen) - Long-term maturity                                         │
 * │  └── DEGREE OF GENETIC EXPRESSION                                       │
 * │      • Tree age (years) - young trees can't express full potential      │
 * │      • Animal age (months) - rushed animals don't fully mature          │
 * │      • Expressible ceiling = H × maturity modifier                      │
 * │                                                                         │
 * │      ▼                                                                  │
 * │  R (Ripen) - Seasonal/cycle timing                                      │
 * │  └── CAPTURE of expressible potential                                   │
 * │      • GDD accumulation for produce (days/weeks)                        │
 * │      • Harvest window timing                                            │
 * │      • Miss the window = waste potential                                │
 * │                                                                         │
 * │  S (Soil Health) ↔ A (Agricultural Practices)                           │
 * │  └── COMPENSATORY relationship                                          │
 * │      • Better S = fewer A inputs needed                                 │
 * │      • Lower S = more A inputs to compensate                            │
 * │      • Together create CONDITIONS for reaching ceiling                  │
 * │      • Cannot EXCEED the ceiling set by H × R                           │
 * │                                                                         │
 * │  E (Enrich)                                                             │
 * │  └── MEASURES actual outcome                                            │
 * │      • Validates predictions                                            │
 * │      • Feeds back to improve future predictions                         │
 * │      • For livestock: A (diet sequence) × R (duration) → E (omega)      │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * KEY FORMULAS:
 *
 *   Produce:
 *   Actual Quality = H (genetic ceiling) × R_maturity × R_timing
 *                    supported by S ↔ A conditions
 *
 *   Livestock:
 *   Omega Ratio = H (breed baseline) + A (diet sequence) × R (duration on each diet)
 *
 * TIMESCALE VARIES BY CATEGORY:
 *
 *   | Category    | R Long-term    | R Short-term      |
 *   |-------------|----------------|-------------------|
 *   | Tree Fruit  | Years (tree)   | Days (GDD)        |
 *   | Vegetables  | Weeks (plant)  | Days (harvest)    |
 *   | Beef        | Months (24-30) | —                 |
 *   | Pork        | Months (5-12)  | —                 |
 *   | Poultry     | Weeks (6-12)   | —                 |
 *   | Nuts        | Years (15-75)  | Days (shuck split)|
 */

// =============================================================================
// COMMON TYPES
// =============================================================================

export type Confidence = 'high' | 'medium' | 'low'

export interface AttributeBase {
  confidence: Confidence
  source: string
  reasoning: string
}

// =============================================================================
// S - SOIL HEALTH
// =============================================================================

/**
 * S (Soil Health) - Where it grew and the soil characteristics that influence quality
 */
export interface SoilHealthAttributes extends AttributeBase {
  pillar: 'S'

  // Location identification
  regionId: string                    // Internal ID: 'indian_river_fl', 'lake_wales_ridge_fl'
  regionName: string                  // Display name: 'Indian River, FL'
  country?: string                    // 'USA', 'Chile', 'Mexico'
  state?: string                      // 'FL', 'CA', 'WA'

  // Soil characteristics
  soilType?: string                   // 'coastal flatwoods (sandy over hardpan)', 'deep sandy Entisols'
  soilClassification?: string         // USDA soil taxonomy if known
  drainage: 'excellent' | 'good' | 'moderate' | 'poor' | 'unknown'

  // Quality influence
  terroirEffect?: string              // Human-readable quality impact description
  qualityIndicator: 'premium' | 'standard' | 'commodity' | 'specialty' | 'unknown'
  microclimate?: 'coastal' | 'inland' | 'mountain' | 'valley' | 'unknown'

  // Elevation (affects temperature, GDD)
  elevationFeet?: number
}

export type SoilSource =
  | 'farm_gps'              // Exact farm location with GPS
  | 'packinghouse_region'   // Packinghouse → region lookup
  | 'origin_sticker'        // "Product of Indian River" sticker
  | 'region_typical'        // Region's typical soil profile
  | 'state_general'         // State-level generalization
  | 'inferred'              // Inferred from other data points

// =============================================================================
// H - HERITAGE CULTIVARS
// =============================================================================

/**
 * H (Heritage Cultivars) - Genetic potential and cultivar identification
 */
export interface HeritageCultivarsAttributes extends AttributeBase {
  pillar: 'H'

  // Product identification
  productType: string                 // 'Orange', 'Apple', 'Beef'
  variety?: string                    // 'Navel', 'Mandarin', 'Ribeye'
  cropType: string                    // 'orange', 'apple', 'beef_cattle'
  category: string                    // 'citrus', 'pome_fruit', 'beef'

  // Cultivar specifics
  cultivarId?: string                 // Internal ID: 'shiranui', 'honeycrisp'
  cultivarName?: string               // Display name: 'Shiranui/Dekopon', 'Honeycrisp'
  tradeName?: string                  // Marketing name: 'SUMO', 'Cosmic Crisp'

  // Genetic characteristics
  geneticCeiling?: {                  // Maximum achievable quality from genetics
    brixMax?: number                  // For produce
    marblingMax?: number              // For meat (1-12 scale)
    omegaBaseline?: number            // For meat - baseline omega ratio on neutral diet
  }
  heritageIntent?: HeritageIntent

  // Tree crops only (rootstock affects genetic ceiling, so belongs in H)
  rootstock?: string                  // 'carrizo', 'swingle' (affects quality ceiling)
  rootstockModifier?: number          // Brix modifier from rootstock: +0.6, -0.7, etc.
  // NOTE: treeAgeYears moved to R pillar - it's about maturity/expression, not genetics

  // GMO status
  isNonGmo: boolean | 'inferred' | 'unknown'
  isGmoRisk: boolean                  // True for crops with approved GMO varieties
}

export type HeritageIntent =
  | 'true_heritage'        // Selected specifically for flavor/nutrition
  | 'heirloom_quality'     // Pre-1950 AND high internal quality
  | 'heirloom_utility'     // Pre-1950 but bred for hardiness (not quality)
  | 'modern_nutrient'      // Modern breeding with nutrition focus
  | 'modern_flavor'        // Modern breeding with flavor focus
  | 'commercial'           // Yield/shipping/appearance focus

export type HeritageSource =
  | 'cultivar_tag'         // Label specifies cultivar
  | 'trade_name_mapped'    // Trade name → cultivar lookup
  | 'plu_lookup'           // PLU code database match
  | 'organic_certified'    // Organic → non-GMO implication
  | 'category_default'     // Category-level assumptions
  | 'unknown'

// =============================================================================
// A - AGRICULTURAL PRACTICES
// =============================================================================

/**
 * A (Agricultural Practices) - Farming and ranching practices
 */
export interface AgriculturalPracticesAttributes extends AttributeBase {
  pillar: 'A'

  // Organic status
  isOrganic: boolean

  // Pest management (produce)
  pestManagement?: 'organic' | 'ipm' | 'conventional' | 'no_spray' | 'unknown'
  ipmProbability?: number             // Statistical likelihood of IPM (0-1)

  // Fertility strategy
  fertilityStrategy?: 'annual_fertility' | 'soil_banking' | 'mineralized_soil_science' | 'unknown'
  coverCropping?: boolean
  compostApplication?: boolean
  mineralizedSoil?: boolean           // THE key differentiator for nutrition

  // Livestock specific - Diet Sequence
  // NOTE: The diet sequence (A) combined with duration on each diet (R) determines omega outcome (E)
  // Example: 12 months grass → 12 months grain = A describes WHAT, R captures durations
  dietSequence?: DietPhase[]          // Full feeding history in order
  feedingRegimeSummary?: 'grass_only' | 'pasture_forage' | 'grain_finished' | 'grain_fed' | 'unknown'

  animalWelfare?: 'pasture_raised' | 'free_range' | 'cage_free' | 'conventional' | 'unknown'
  noAntibiotics?: boolean
  noHormones?: boolean
}

/**
 * A single phase in an animal's diet sequence
 * The sequence of phases (A pillar) combined with duration (R pillar) determines omega outcome (E)
 */
export interface DietPhase {
  phase: 'nursing' | 'weaning' | 'backgrounding' | 'finishing' | 'laying'
  dietType: 'milk' | 'pasture_grass' | 'hay' | 'silage' | 'grain_mix' | 'mixed'
  durationMonths?: number             // How long on this diet (also captured in R)
  feedComposition?: FeedMix           // What's in the feed
  isOrganicFeed?: boolean             // Warning: organic often = grain-fed
}

/**
 * Composition of a feed mix - determines omega profile contribution
 */
export interface FeedMix {
  // Each component has different omega profile
  pastureGrass?: number               // % - Omega-3 rich
  hay?: number                        // % - Preserved grass, similar profile
  cornSilage?: number                 // % - Higher omega-6
  cornGrain?: number                  // % - High omega-6
  soyMeal?: number                    // % - Very high omega-6
  distillersGrains?: number           // % - Concentrated omega-6 (DDGs)
  other?: number                      // %
}

export type AgriculturalSource =
  | 'certification'        // USDA Organic, AWA, etc.
  | 'plu_prefix'           // PLU prefix 9 = organic
  | 'farm_provided'        // Direct from farmer
  | 'industry_statistics'  // 70% IPM assumption, etc.
  | 'label_claim'          // Marketing claim on package
  | 'inferred'             // Inferred from other data

// =============================================================================
// R - RIPEN
// =============================================================================

/**
 * R (Ripen) - Timing, maturity, and degree of genetic expression
 *
 * R has TWO temporal dimensions:
 *   1. Long-term maturity: Is the asset (tree/animal) at prime production age?
 *   2. Seasonal timing: Within this cycle, is it at peak expression?
 *
 * Long-term maturity determines what PERCENTAGE of H (genetic ceiling) can be expressed.
 * Seasonal timing determines whether that expressible potential is CAPTURED at harvest.
 *
 * Timescales vary dramatically by category:
 *   - Tree fruit: Years (tree age) + Days (GDD)
 *   - Vegetables: Weeks (plant maturity) + Days (harvest window)
 *   - Beef: 24-30 months to full maturity
 *   - Pork: 5-12 months (commodity vs heritage)
 *   - Poultry: 6-12 weeks
 */
export interface RipenAttributes extends AttributeBase {
  pillar: 'R'

  // =========================================================================
  // LONG-TERM MATURITY (Degree of H expression)
  // =========================================================================

  // Tree/perennial crops: age of the producing asset
  assetAgeYears?: number              // Tree age, vine age, etc.
  assetMaturityStage?: 'juvenile' | 'developing' | 'prime' | 'mature' | 'declining'
  maturityModifier?: number           // 0.0-1.0, multiplier on genetic ceiling

  // Livestock: age at harvest
  ageAtHarvestMonths?: number         // For meat quality assessment
  ageAtHarvestWeeks?: number          // For poultry (weeks, not months)
  targetMaturityMonths?: number       // Full maturity target for this breed/species
  isFullyMature?: boolean             // Reached full maturity before harvest

  // =========================================================================
  // SEASONAL/CYCLE TIMING (Capture of expressible potential)
  // =========================================================================

  // Season status
  isInSeason: boolean
  isInPeakSeason?: boolean
  season?: 'peak' | 'early' | 'late' | 'off_season' | 'year_round'

  // Freshness (post-harvest)
  estimatedDaysSinceHarvest?: number
  freshnessScore: 'optimal' | 'good' | 'acceptable' | 'declining' | 'unknown'

  // Harvest window (for predictions)
  harvestWindowStart?: Date
  harvestWindowEnd?: Date
  daysToPeak?: number                 // Days until predicted peak

  // GDD-based calculations (produce)
  gddAccumulated?: number             // Growing degree days accumulated
  gddTarget?: number                  // Target GDD for peak harvest
  gddPercentComplete?: number         // 0-100%

  // Climacteric behavior (produce)
  isClimacteric?: boolean             // Can ripen post-harvest?
  ripenPostHarvest?: boolean          // Will continue ripening
}

export type RipenSource =
  | 'harvest_date_known'   // Direct from farmer/packer
  | 'gdd_calculation'      // GDD model prediction
  | 'shipping_estimated'   // Region → destination time estimate
  | 'seasonal_calendar'    // Peak season calendar lookup
  | 'storage_indicator'    // CA storage, frozen, etc.
  | 'inferred'

// =============================================================================
// E - ENRICH
// =============================================================================

/**
 * E (Enrich) - Quality measurements and proof
 */
export interface EnrichAttributes extends AttributeBase {
  pillar: 'E'

  // PRODUCE: Brix measurements
  brixMeasurement?: number            // Actual measured value
  brixEstimate?: number               // Predicted/expected value
  brixRange?: {
    min: number
    max: number
    optimal: number
  }

  // Quality scoring
  qualityScore: 'exceptional' | 'good' | 'fair' | 'poor' | 'unknown'
  qualityTier?: 'artisan' | 'premium' | 'standard' | 'commodity'

  // Measurement details
  measurementMethod?: 'refractometer' | 'cv_estimate' | 'lab_analysis' | 'cultivar_expected' | 'unknown'
  measurementDate?: Date
  labName?: string                    // 'Edacious', 'Texas A&M', etc.

  // LIVESTOCK: Fatty acid profile
  omega6To3Ratio?: number             // THE key differentiator: 3:1 (grass) vs 20:1 (feedlot)
  omegaClassification?: 'exceptional' | 'premium' | 'standard' | 'commodity'

  // PRODUCE: Additional quality metrics
  acidityTA?: number                  // Titratable acidity
  brixAcidRatio?: number              // Brix/TA ratio (flavor balance)

  // Did prediction match measurement?
  predictionAccuracy?: {
    predicted: number
    actual: number
    variance: number
    isWithinExpected: boolean
  }
}

export type EnrichSource =
  | 'refractometer'        // Consumer handheld measurement
  | 'cv_estimate'          // Computer vision estimate
  | 'lab_analysis'         // Full lab panel (Edacious, etc.)
  | 'cultivar_expected'    // Expected range from cultivar data
  | 'seasonal_average'     // Historical seasonal average
  | 'farm_provided'        // Farmer's reported measurements

// =============================================================================
// COMBINED SHARE PROFILE
// =============================================================================

/**
 * Complete SHARE profile combining all pillar attributes
 */
export interface ShareProfile {
  // Pillar attributes (always in S-H-A-R-E order)
  soilHealth: SoilHealthAttributes
  heritageCultivars: HeritageCultivarsAttributes
  agriculturalPractices: AgriculturalPracticesAttributes
  ripen: RipenAttributes
  enrich: EnrichAttributes

  // Overall assessment
  overallConfidence: Confidence
  overallQualityTier?: 'artisan' | 'premium' | 'standard' | 'commodity'

  // Data quality indicators
  dataGaps: string[]                  // List of missing/low-confidence attributes
  reasoning: string[]                 // Explanation of inferences made
}

// =============================================================================
// FACTORY FUNCTIONS
// =============================================================================

/**
 * Create default Soil Health attributes
 */
export function createDefaultSoilHealthAttributes(): SoilHealthAttributes {
  return {
    pillar: 'S',
    regionId: 'unknown',
    regionName: 'Unknown',
    drainage: 'unknown',
    qualityIndicator: 'unknown',
    confidence: 'low',
    source: 'unknown',
    reasoning: 'No origin data available',
  }
}

/**
 * Create default Heritage Cultivars attributes
 */
export function createDefaultHeritageCultivarsAttributes(productType = 'Unknown'): HeritageCultivarsAttributes {
  return {
    pillar: 'H',
    productType,
    cropType: 'unknown',
    category: 'unknown',
    isNonGmo: 'unknown',
    isGmoRisk: false,
    confidence: 'low',
    source: 'unknown',
    reasoning: 'No cultivar data available',
  }
}

/**
 * Create default Agricultural Practices attributes
 */
export function createDefaultAgriculturalPracticesAttributes(): AgriculturalPracticesAttributes {
  return {
    pillar: 'A',
    isOrganic: false,
    confidence: 'low',
    source: 'inferred',
    reasoning: 'No practice data available - using defaults',
  }
}

/**
 * Create default Ripen attributes
 */
export function createDefaultRipenAttributes(): RipenAttributes {
  return {
    pillar: 'R',
    isInSeason: true,
    freshnessScore: 'unknown',
    confidence: 'low',
    source: 'inferred',
    reasoning: 'No timing data available',
  }
}

/**
 * Create default Enrich attributes
 */
export function createDefaultEnrichAttributes(): EnrichAttributes {
  return {
    pillar: 'E',
    qualityScore: 'unknown',
    confidence: 'low',
    source: 'unknown',
    reasoning: 'No quality measurements available',
  }
}

/**
 * Create a full SHARE profile with defaults
 */
export function createDefaultShareProfile(productType = 'Unknown'): ShareProfile {
  return {
    soilHealth: createDefaultSoilHealthAttributes(),
    heritageCultivars: createDefaultHeritageCultivarsAttributes(productType),
    agriculturalPractices: createDefaultAgriculturalPracticesAttributes(),
    ripen: createDefaultRipenAttributes(),
    enrich: createDefaultEnrichAttributes(),
    overallConfidence: 'low',
    dataGaps: ['No data available for any pillar'],
    reasoning: ['Default profile - requires data input'],
  }
}
