/**
 * Predictor Interface - Common interface for all category-specific predictors
 *
 * This defines the polymorphic contract that enables SHARE predictions
 * across all product categories (produce, livestock, seafood, etc.)
 *
 * Each predictor implements category-specific logic but returns a
 * standardized result format for consistent UI/API consumption.
 */

import type { QualityTier } from '../constants/quality-tiers'

// =============================================================================
// Product Categories
// =============================================================================

/**
 * Top-level product categories for prediction routing
 */
export type ProductCategory =
  | 'produce' // Tree fruit, berries, melons, nightshades (GDD + Brix)
  | 'vegetables' // Leafy, root, cruciferous, allium, legume
  | 'nuts' // Tree nuts, ground nuts (oil content)
  | 'livestock' // Beef, pork, poultry (omega ratio)
  | 'eggs' // Hen eggs (omega ratio)
  | 'dairy' // Milk, cheese, butter (fat % + omega)
  | 'seafood' // Fish, shellfish, crustacean (omega-3)
  | 'honey' // Raw honey (diastase + moisture)
  | 'transformed' // Coffee, tea, cacao (cupping score, etc.)

/**
 * Livestock species for omega prediction
 */
export type LivestockSpecies = 'beef' | 'pork' | 'poultry' | 'dairy' | 'lamb'

/**
 * Seafood sourcing type
 */
export type SeafoodSourceType = 'wild_caught' | 'farm_raised'

// =============================================================================
// Primary Metrics (E Pillar - The Proof)
// =============================================================================

/**
 * Category-specific primary quality metrics
 */
export type PrimaryMetricType =
  | 'brix' // Sugar content for produce (°Bx)
  | 'omega_ratio' // Omega-6:Omega-3 ratio for livestock
  | 'omega_3' // Absolute omega-3 content for seafood (mg/100g)
  | 'oil_content' // Oil percentage for nuts (%)
  | 'cupping_score' // SCA score for coffee (0-100)
  | 'diastase' // Enzyme activity for honey
  | 'fat_percentage' // Fat % for dairy

/**
 * The measured/predicted primary quality metric
 */
export interface PrimaryMetric {
  type: PrimaryMetricType
  value: number
  unit: string
  displayName: string
  // Whether lower is better (omega ratio) or higher is better (brix)
  lowerIsBetter: boolean
}

// =============================================================================
// SHARE Pillar Contributions
// =============================================================================

/**
 * S (Soil) Pillar - Foundation
 */
export interface SoilContribution {
  modifier: number
  confidence: number
  details: {
    regionId?: string
    soilType?: string
    organicMatterPct?: number
    ph?: number
    drainageClass?: 'poor' | 'moderate' | 'good' | 'excellent'
    // Livestock: forage quality instead of soil
    forageQuality?: 'poor' | 'fair' | 'good' | 'excellent'
    forageType?: string // e.g., 'native grasses', 'improved pasture', 'hay'
    // Seafood: water quality instead of soil
    waterQuality?: 'pristine' | 'good' | 'moderate' | 'poor'
    waterBody?: string // e.g., 'Gulf of Mexico', 'Apalachicola Bay'
    waterTemperature?: number
    // Honey: floral source (terroir equivalent)
    floralSource?: string // e.g., 'clover', 'wildflower', 'orange blossom'
    floralDiversity?: 'monofloral' | 'multifloral' | 'wildflower'
  }
  insights: string[]
}

/**
 * H (Heritage) Pillar - Genetic Ceiling
 */
export interface HeritageContribution {
  modifier: number
  confidence: number
  details: {
    // Produce
    cultivarId?: string
    cultivarName?: string
    baseBrix?: number
    rootstockId?: string
    rootstockModifier?: number
    heritageIntent?: string
    // Livestock
    breedId?: string
    breedName?: string
    marblingPotential?: number
    omegaBaseline?: number
    maturityMonths?: number
    // Seafood
    speciesId?: string
    speciesName?: string
    omega3Baseline?: number // mg/100g baseline for species
    isWildCaught?: boolean
    // Honey
    varietalId?: string
    varietalName?: string
    isPremiumVarietal?: boolean // e.g., Manuka, Sourwood
  }
  insights: string[]
}

/**
 * A (Agricultural) Pillar - Practices
 */
export interface AgriculturalContribution {
  modifier: number
  confidence: number
  details: {
    // Produce
    fertilityStrategy?: string
    pestManagement?: string
    cropLoadManaged?: boolean
    coverCropping?: boolean
    // Livestock
    feedingRegime?: 'grass_only' | 'pasture_forage' | 'grain_finished' | 'grain_fed'
    finishingDays?: number
    animalWelfare?: string
    noAntibiotics?: boolean
    noHormones?: boolean
    // Seafood
    sourceType?: 'wild_caught' | 'farm_raised'
    catchMethod?: string // e.g., 'line caught', 'net', 'trap'
    farmFeedType?: string // for farm-raised
    sustainabilityCertified?: boolean
    // Honey
    isRaw?: boolean
    isFiltered?: boolean
    processingMethod?: 'raw' | 'strained' | 'filtered' | 'pasteurized'
    // Universal
    isCertifiedOrganic?: boolean
  }
  insights: string[]
}

/**
 * R (Ripen) Pillar - Has TWO Components
 *
 * R_MATURITY: How much of genetic ceiling (H) can be expressed
 * - Tree crops: Reproductive allocation shifts from vegetative to fruit as tree matures
 * - Livestock: Full maturity needed to express breed's genetic potential
 * - The "declining tree paradox": Old trees produce fewer fruits but each gets more energy
 *
 * R_TIMING: When to capture the expressible potential
 * - GDD accumulation for produce (when is Brix optimal?)
 * - Age/feeding duration for livestock (when is omega optimal?)
 * - Calendar seasons for seafood (spawning cycles)
 *
 * Full R = R_MATURITY × R_TIMING
 * A prime tree (85% reproductive allocation) at peak GDD = maximum Brix
 */
export interface RipenContribution {
  timingModifier: number
  confidence: number
  details: {
    // === R_TIMING: GDD-based (produce) ===
    currentGDD?: number
    targetGDD?: number
    gddToMaturity?: number
    gddToPeak?: number
    percentToMaturity?: number
    daysToHarvest?: number

    // === R_TIMING: Age-based (livestock) ===
    ageMonths?: number
    optimalAgeMonths?: number
    finishingMonths?: number

    // === R_MATURITY: Tree/animal maturity ===
    maturityStage?: 'seedling' | 'juvenile' | 'mature' | 'prime' | 'declining'
    reproductiveAllocation?: number  // 0-100% of energy directed to fruit/reproduction
    maturityModifier?: number        // Brix/quality modifier from maturity stage

    // === R_TIMING: Calendar-based (seafood) ===
    catchSeason?: string // e.g., 'summer', 'winter', 'spawning'
    isInSeason?: boolean
    seasonalQualityFactor?: number // 0-1 multiplier

    // === R_TIMING: Harvest-based (honey) ===
    harvestSeason?: string // e.g., 'spring', 'fall'
    nectarFlowTiming?: 'early' | 'peak' | 'late'

    // === Harvest status (all categories) ===
    harvestStatus: 'not_ready' | 'early' | 'optimal' | 'peak' | 'late' | 'past_peak'
  }
  insights: string[]
}

/**
 * E (Enrich) Pillar - Verification/Proof
 */
export interface EnrichContribution {
  verified: boolean
  confidence: number
  details: {
    // Primary metric (what was measured/predicted)
    primaryMetric: PrimaryMetric
    // Secondary metrics
    labVerified?: boolean
    labName?: string
    measurementDate?: Date
    // Additional quality indicators
    secondaryMetrics?: {
      name: string
      value: number
      unit: string
    }[]
    // Honey-specific quality metrics
    moisturePct?: number // <18% ideal for raw honey
    diastaseNumber?: number // enzyme activity
    hmfLevel?: number // hydroxymethylfurfural (heat damage indicator)
    // Seafood-specific
    mercuryLevel?: number // ppm
    freshnessScore?: number // 0-100
  }
  insights: string[]
}

// =============================================================================
// Prediction Input (Category-Specific)
// =============================================================================

/**
 * Base prediction input - common to all categories
 */
export interface BasePredictionInput {
  category: ProductCategory
  productId?: string
  regionId?: string
  currentDate?: Date
}

/**
 * Produce-specific input (GDD-based, Brix metric)
 */
export interface ProducePredictionInput extends BasePredictionInput {
  category: 'produce'
  cultivarId: string
  rootstockId?: string
  treeAgeYears?: number
  currentGDD?: number
  bloomDate?: Date
  soil?: {
    organicMatterPct?: number
    ph?: number
    drainageClass?: 'poor' | 'moderate' | 'good' | 'excellent'
  }
  practices?: {
    fertilityStrategy?: {
      approach?: 'annual_fertility' | 'soil_banking' | 'mineralized_soil_science'
      coverCropping?: boolean
      compostApplication?: boolean
      mineralizedSoil?: boolean
    }
    pestManagement?: 'conventional' | 'ipm' | 'organic' | 'no_spray'
    cropLoadManaged?: boolean
  }
}

/**
 * Livestock-specific input (age + feeding, omega metric)
 */
export interface LivestockPredictionInput extends BasePredictionInput {
  category: 'livestock' | 'eggs' | 'dairy'
  species: LivestockSpecies
  breedId?: string
  ageMonths?: number
  feedingRegime: {
    diet: 'grass_only' | 'pasture_forage' | 'grain_finished' | 'grain_fed'
    finishingMonths?: number // Time on grain finishing
    isOrganicGrain?: boolean
    forageType?: string
  }
  practices?: {
    animalWelfare?: 'confinement' | 'free_range' | 'pasture_raised'
    noAntibiotics?: boolean
    noHormones?: boolean
    isCertifiedOrganic?: boolean
  }
  // If we have actual measurement
  measurements?: {
    omega6To3Ratio?: number
    labVerified?: boolean
    labName?: string
  }
}

/**
 * Seafood-specific input
 */
export interface SeafoodPredictionInput extends BasePredictionInput {
  category: 'seafood'
  speciesId: string
  sourceType: SeafoodSourceType
  catchMethod?: string
  catchSeason?: string
  // Farm-raised specific
  farmFeedType?: string
  measurements?: {
    omega3ContentMg?: number
    labVerified?: boolean
  }
}

/**
 * Nut-specific input
 */
export interface NutPredictionInput extends BasePredictionInput {
  category: 'nuts'
  cultivarId: string
  treeAgeYears?: number
  harvestTiming?: 'early' | 'optimal' | 'late'
  waterStress?: boolean
  measurements?: {
    oilContentPct?: number
    labVerified?: boolean
  }
}

/**
 * Transformed product input (coffee, tea, cacao)
 *
 * For seed-based products, the fruit quality (Brix) correlates with seed quality
 * because they're parallel sinks from the same photosynthetic source.
 * See seed-nutrition-theory.ts for the theoretical framework.
 */
export interface TransformedPredictionInput extends BasePredictionInput {
  category: 'transformed'
  productType: 'coffee' | 'tea' | 'cacao' | 'olive_oil'
  originRegion?: string
  variety?: string
  processingMethod?: string
  roastLevel?: string // coffee only

  /**
   * Farm-level quality indicator (Stage 1 input)
   * Cherry Brix for coffee (18-26 typical), Pod Brix for cacao (12-16 typical)
   * This correlates with seed nutrient accumulation (same source-sink physiology)
   */
  fruitBrix?: number

  /**
   * Tree age affects reproductive allocation (R pillar)
   * Mature trees (5+ years) allocate more energy to fruit/seed quality
   */
  treeAgeYears?: number

  measurements?: {
    cuppingScore?: number
    acidity?: number
    body?: number
    /**
     * Green bean quality score (intermediate between farm and consumer)
     * For coffee: defect count, screen size, moisture, density
     */
    greenBeanScore?: number
  }
}

/**
 * Honey-specific input
 */
export interface HoneyPredictionInput extends BasePredictionInput {
  category: 'honey'
  varietalType?: string // e.g., 'clover', 'wildflower', 'manuka'
  harvestSeason?: string
  isRaw?: boolean
  measurements?: {
    diastaseNumber?: number
    moisturePct?: number
    labVerified?: boolean
  }
}

/**
 * Vegetable-specific input
 */
export interface VegetablePredictionInput extends BasePredictionInput {
  category: 'vegetables'
  varietyId: string
  subcategory: 'leafy' | 'root' | 'cruciferous' | 'allium' | 'legume' | 'nightshade' | 'squash'
  daysSinceHarvest?: number // For freshness-based quality
  currentGDD?: number // For GDD-based vegetables
  storageConditions?: 'ambient' | 'refrigerated' | 'cold_storage'
  practices?: {
    fertilityStrategy?: {
      approach?: 'annual_fertility' | 'soil_banking' | 'mineralized_soil_science'
    }
    pestManagement?: 'conventional' | 'ipm' | 'organic' | 'no_spray'
  }
  measurements?: {
    brix?: number
    labVerified?: boolean
  }
}

/**
 * Union type for all prediction inputs
 */
export type PredictionInput =
  | ProducePredictionInput
  | LivestockPredictionInput
  | SeafoodPredictionInput
  | NutPredictionInput
  | TransformedPredictionInput
  | HoneyPredictionInput
  | VegetablePredictionInput

// =============================================================================
// Prediction Result
// =============================================================================

/**
 * Validation status for prediction models
 */
export type ModelValidationStatus =
  | 'validated' // Research-backed, tested predictions
  | 'calibrated' // Has some real-world validation data
  | 'inferred' // Logic-based but needs validation
  | 'placeholder' // Minimal implementation, needs development

/**
 * Unified prediction result - returned by all predictors
 */
export interface PredictionResult {
  // Core prediction
  qualityScore: number // 0-100 normalized score
  qualityTier: QualityTier
  confidence: number // 0-1

  // The primary quality metric for this category
  primaryMetric: PrimaryMetric

  // Full SHARE breakdown
  soil: SoilContribution
  heritage: HeritageContribution
  agricultural: AgriculturalContribution
  ripen: RipenContribution
  enrich: EnrichContribution

  // Model metadata
  modelInfo: {
    category: ProductCategory
    validationStatus: ModelValidationStatus
    warnings: string[] // E.g., "Using inferred omega baseline for breed"
    lastUpdated?: Date
  }
}

// =============================================================================
// Predictor Interface
// =============================================================================

/**
 * The common interface all category predictors must implement
 */
export interface CategoryPredictor {
  /**
   * The category this predictor handles
   */
  category: ProductCategory

  /**
   * Model validation status
   */
  validationStatus: ModelValidationStatus

  /**
   * Run prediction for the given input
   */
  predict(input: PredictionInput): PredictionResult

  /**
   * Check if this predictor can handle the given input
   */
  canHandle(input: PredictionInput): boolean

  /**
   * Get the primary metric type for this category
   */
  getPrimaryMetricType(): PrimaryMetricType
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Create a primary metric object
 */
export function createPrimaryMetric(
  type: PrimaryMetricType,
  value: number
): PrimaryMetric {
  const metricConfig: Record<
    PrimaryMetricType,
    { unit: string; displayName: string; lowerIsBetter: boolean }
  > = {
    brix: { unit: '°Bx', displayName: 'Brix', lowerIsBetter: false },
    omega_ratio: {
      unit: ':1',
      displayName: 'Omega-6:3 Ratio',
      lowerIsBetter: true,
    },
    omega_3: {
      unit: 'mg/100g',
      displayName: 'Omega-3 Content',
      lowerIsBetter: false,
    },
    oil_content: { unit: '%', displayName: 'Oil Content', lowerIsBetter: false },
    cupping_score: {
      unit: 'pts',
      displayName: 'Cupping Score',
      lowerIsBetter: false,
    },
    diastase: { unit: 'DN', displayName: 'Diastase Number', lowerIsBetter: false },
    fat_percentage: { unit: '%', displayName: 'Fat Content', lowerIsBetter: false },
  }

  const config = metricConfig[type]
  return {
    type,
    value,
    ...config,
  }
}

/**
 * Normalize a metric value to a 0-100 quality score
 */
export function normalizeToQualityScore(
  value: number,
  type: PrimaryMetricType,
  category: ProductCategory
): number {
  // Category-specific normalization
  switch (type) {
    case 'brix':
      // Produce: 8-18 Brix range
      return Math.min(100, Math.max(0, ((value - 8) / 10) * 100))

    case 'omega_ratio':
      // Livestock: 1:1 = 100, 20:1 = 0 (lower is better)
      return Math.min(100, Math.max(0, ((20 - value) / 19) * 100))

    case 'omega_3':
      // Seafood: 0-3000 mg/100g range
      return Math.min(100, Math.max(0, (value / 3000) * 100))

    case 'oil_content':
      // Nuts: 40-75% range
      return Math.min(100, Math.max(0, ((value - 40) / 35) * 100))

    case 'cupping_score':
      // Coffee: 60-100 SCA scale
      return Math.min(100, Math.max(0, ((value - 60) / 40) * 100))

    case 'diastase':
      // Honey: 8+ is good, 15+ is excellent
      return Math.min(100, Math.max(0, (value / 20) * 100))

    case 'fat_percentage':
      // Dairy: varies by product
      return Math.min(100, Math.max(0, (value / 10) * 100))

    default:
      return 50 // Unknown metric
  }
}

/**
 * Determine quality tier from normalized score
 */
export function scoreToTier(score: number): QualityTier {
  if (score >= 85) return 'artisan'
  if (score >= 70) return 'premium'
  if (score >= 50) return 'standard'
  return 'commodity'
}
