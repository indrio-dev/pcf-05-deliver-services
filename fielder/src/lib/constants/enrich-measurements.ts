/**
 * =============================================================================
 * ENRICH MEASUREMENT HIERARCHY (E0-E3)
 * =============================================================================
 *
 * The E (Enrich) pillar has a formal hierarchy of measurement confidence:
 *
 * E0: Profile Estimate     - Classification-based inference (ALL products)
 * E1: Predictor Estimate   - Fielder models with S+H+A+R inputs
 * E2: Primary Actual       - Field measurements (Brix, omega ratio, USDA grade)
 * E3: Secondary Actual     - Full lab nutrient panel (Edacious, Texas A&M)
 *
 * PROGRESSION:
 *   Every product starts with E0 (from ShareProfile assignment)
 *   → Add known attributes → E1 predictor refinement
 *   → Field measurement → E2 actual data
 *   → Lab testing → E3 gold standard
 *
 * DATA FLYWHEEL:
 *   E2/E3 measurements feed back to improve E0/E1 estimates over time
 */

import type { ShareProfileCategory } from './share-profiles'

// =============================================================================
// TYPES
// =============================================================================

export type EnrichLevel = 'E0' | 'E1' | 'E2' | 'E3'

export type MeasurementTargetType =
  | 'share_profile'    // E0: Profile-level estimate
  | 'listing'          // E1/E2: Listing-level (see product-model.ts)
  | 'listing_variant'  // E1/E2: SKU-level variant (see product-model.ts)
  | 'harvest'          // E2/E3: Lot/batch-level

export type MeasurementSource =
  // E0 sources
  | 'profile_default'          // ShareProfile E0 estimate
  // E1 sources
  | 'predictor_gdd'            // GDD-based prediction
  | 'predictor_cultivar'       // Cultivar baseline + modifiers
  | 'predictor_regional'       // Regional inference chain
  // E2 sources
  | 'farmer_reported'          // Farmer-provided measurement
  | 'consumer_refractometer'   // Consumer $10 refractometer reading
  | 'fielder_staff'            // Fielder team measurement
  | 'cv_estimated'             // Computer vision Brix estimate
  | 'third_party_field'        // Third-party field tester
  // E3 sources
  | 'lab_edacious'             // Edacious lab
  | 'lab_texas_am'             // Texas A&M lab
  | 'lab_bionutrient'          // BioNutrient Food Association
  | 'lab_other'                // Other certified lab

export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'estimated'

// =============================================================================
// E0: PROFILE ESTIMATE
// =============================================================================

/**
 * E0 estimates come directly from the ShareProfile assignment.
 * Every product gets an E0 estimate just by being classified.
 */
export interface E0ProfileEstimate {
  id: string
  level: 'E0'
  targetType: 'share_profile'
  shareProfileId: string
  shareProfileCode: string

  // Estimated values (from ShareProfile)
  brixEstimatedRange?: [number, number]
  brixEstimatedMidpoint?: number
  omegaRatioEstimatedRange?: [number, number]
  omegaRatioEstimatedMidpoint?: number

  // Confidence
  confidence: 'estimated'
  confidenceReasoning: string

  // Metadata
  createdAt: Date
  updatedAt: Date
}

// =============================================================================
// E1: PREDICTOR ESTIMATE
// =============================================================================

/**
 * E1 estimates use Fielder prediction models with known inputs.
 * More specific than E0 because we have actual attributes.
 */
export interface E1PredictorEstimate {
  id: string
  level: 'E1'
  targetType: MeasurementTargetType
  targetId: string                    // Product, variant, or harvest ID

  // Input attributes (what we know)
  inputs: {
    shareProfileId: string
    cultivarId?: string
    rootstockId?: string              // H pillar
    regionId?: string                 // S pillar inference
    farmId?: string                   // S pillar if known
    harvestDate?: string              // R pillar
    treeAgeYears?: number             // For tree crops
    practiceProfile?: {
      isOrganic?: boolean
      pestManagement?: string
      fertilityApproach?: string
    }
  }

  // Predictor used
  predictorModelId: string            // e.g., 'citrus_gdd_v2', 'beef_omega_v1'
  predictorVersion: string

  // Predicted values
  brixPredicted?: number
  brixPredictedRange?: [number, number]
  omegaRatioPredicted?: number
  omegaRatioPredictedRange?: [number, number]
  qualityTierPredicted?: string

  // Confidence
  confidence: ConfidenceLevel
  confidenceScore?: number            // 0-1 score
  confidenceReasoning: string
  uncertaintyFactors?: string[]       // What's reducing confidence

  // Metadata
  createdAt: Date
  updatedAt: Date
}

// =============================================================================
// E2: PRIMARY ACTUAL MEASUREMENT
// =============================================================================

/**
 * E2 measurements are actual field measurements.
 * "Primary" = commonly measurable metrics (Brix, omega ratio, USDA grade).
 */
export interface E2PrimaryActual {
  id: string
  level: 'E2'
  targetType: MeasurementTargetType
  targetId: string

  // Who measured
  source: MeasurementSource
  measuredBy?: string                 // User ID or name
  measuredByRole?: 'farmer' | 'consumer' | 'fielder_staff' | 'third_party'

  // When/where
  measurementDate: Date
  measurementLocation?: {
    lat: number
    lng: number
    description?: string
  }

  // Primary measurements
  brix?: number
  brixMethod?: 'refractometer' | 'lab' | 'cv_estimate'
  acidity?: number                    // For citrus, tomatoes
  brixAcidRatio?: number              // Calculated

  // Omega measurements (animal products)
  omega3Content?: number              // mg per serving
  omega6Content?: number              // mg per serving
  omegaRatio?: number                 // omega-6:omega-3
  omegaMethod?: 'lab' | 'estimated_from_claim'

  // USDA grade (meat, eggs)
  usdaGrade?: 'prime' | 'choice' | 'select' | 'standard' | 'AA' | 'A' | 'B'

  // Other primary metrics
  marblingScore?: number              // Beef (100-1200)
  fatPercentage?: number
  moisturePercentage?: number

  // Quality assessment
  flavorScore?: number                // 1-10 subjective
  textureScore?: number               // 1-10 subjective
  appearanceScore?: number            // 1-10 subjective
  overallQualityScore?: number        // 1-10 composite

  // Verification
  isVerified: boolean
  verificationMethod?: string
  photoUrls?: string[]                // Evidence photos

  // Confidence
  confidence: ConfidenceLevel
  confidenceReasoning?: string

  // Metadata
  createdAt: Date
  updatedAt: Date
}

// =============================================================================
// E3: SECONDARY ACTUAL (FULL LAB PANEL)
// =============================================================================

/**
 * E3 is the gold standard - full laboratory nutrient analysis.
 * "Secondary" = comprehensive panel including vitamins, minerals, polyphenols.
 */
export interface E3SecondaryActual {
  id: string
  level: 'E3'
  targetType: MeasurementTargetType
  targetId: string

  // Lab info
  labId: string
  labName: string
  labCertifications?: string[]
  testDate: Date
  reportUrl?: string
  reportNumber?: string

  // Include all E2 primary measurements
  primaryMeasurements?: Partial<E2PrimaryActual>

  // Vitamin panel
  vitamins?: {
    vitaminA_iu?: number
    vitaminC_mg?: number
    vitaminD_iu?: number
    vitaminE_mg?: number
    vitaminK_mcg?: number
    vitaminB1_mg?: number
    vitaminB2_mg?: number
    vitaminB3_mg?: number
    vitaminB6_mg?: number
    vitaminB12_mcg?: number
    folate_mcg?: number
    biotin_mcg?: number
    pantothenicAcid_mg?: number
  }

  // Mineral panel
  minerals?: {
    calcium_mg?: number
    iron_mg?: number
    magnesium_mg?: number
    phosphorus_mg?: number
    potassium_mg?: number
    sodium_mg?: number
    zinc_mg?: number
    copper_mg?: number
    manganese_mg?: number
    selenium_mcg?: number
    boron_mcg?: number
    chromium_mcg?: number
    molybdenum_mcg?: number
    iodine_mcg?: number
  }

  // Fatty acid profile (detailed)
  fattyAcids?: {
    // Saturated
    saturatedTotal_g?: number
    palmitic_g?: number
    stearic_g?: number
    // Monounsaturated
    monounsaturatedTotal_g?: number
    oleic_g?: number
    // Polyunsaturated
    polyunsaturatedTotal_g?: number
    linoleic_g?: number               // Omega-6
    alphaLinolenic_g?: number         // Omega-3 (ALA)
    epa_mg?: number                   // Omega-3 (EPA)
    dha_mg?: number                   // Omega-3 (DHA)
    // Calculated
    omega3Total_g?: number
    omega6Total_g?: number
    omega6to3Ratio?: number
    // Special
    cla_mg?: number                   // Conjugated linoleic acid (grass-fed indicator)
    transFat_g?: number
  }

  // Antioxidant/polyphenol panel
  antioxidants?: {
    totalPolyphenols_mg?: number
    oracScore?: number                // Oxygen Radical Absorbance Capacity
    anthocyanins_mg?: number          // Berries, red produce
    lycopene_mg?: number              // Tomatoes, watermelon
    betaCarotene_mcg?: number
    lutein_mcg?: number
    zeaxanthin_mcg?: number
    quercetin_mg?: number
    resveratrol_mg?: number
    catechins_mg?: number
  }

  // Amino acid profile (protein quality)
  aminoAcids?: {
    totalProtein_g?: number
    // Essential
    leucine_mg?: number
    isoleucine_mg?: number
    valine_mg?: number
    lysine_mg?: number
    methionine_mg?: number
    phenylalanine_mg?: number
    threonine_mg?: number
    tryptophan_mg?: number
    histidine_mg?: number
    // Non-essential
    alanine_mg?: number
    arginine_mg?: number
    glycine_mg?: number
    proline_mg?: number
    glutamine_mg?: number
  }

  // Contaminant testing (minimize the bad)
  contaminants?: {
    pesticidesDetected: boolean
    pesticideResidues?: Array<{
      name: string
      level_ppb: number
      limit_ppb: number
    }>
    herbicidesDetected: boolean
    glyphosate_ppb?: number
    heavyMetals?: {
      lead_ppb?: number
      cadmium_ppb?: number
      arsenic_ppb?: number
      mercury_ppb?: number
    }
    mycotoxins?: {
      aflatoxin_ppb?: number
      ochratoxin_ppb?: number
    }
  }

  // Confidence
  confidence: 'high'                  // Lab results are high confidence by definition
  confidenceReasoning: string

  // Metadata
  sampleId?: string
  sampleWeight?: number
  sampleCondition?: string
  createdAt: Date
  updatedAt: Date
}

// =============================================================================
// UNIFIED ENRICH MEASUREMENT TYPE
// =============================================================================

export type EnrichMeasurement =
  | E0ProfileEstimate
  | E1PredictorEstimate
  | E2PrimaryActual
  | E3SecondaryActual

// =============================================================================
// MEASUREMENT COMPARISON UTILITIES
// =============================================================================

/**
 * Compare E1 prediction to E2/E3 actual
 * Used to validate and improve prediction models
 */
export interface PredictionValidation {
  id: string
  predictionId: string                // E1 measurement ID
  actualId: string                    // E2 or E3 measurement ID
  actualLevel: 'E2' | 'E3'

  // Prediction vs Actual
  brixPredicted?: number
  brixActual?: number
  brixError?: number                  // Actual - Predicted
  brixErrorPct?: number               // Error as %

  omegaRatioPredicted?: number
  omegaRatioActual?: number
  omegaRatioError?: number
  omegaRatioErrorPct?: number

  // Analysis
  isPredictionAccurate: boolean       // Within acceptable tolerance
  tolerance: number                   // What was the tolerance used
  insights?: string[]                 // What we learned

  createdAt: Date
}

// =============================================================================
// LEVEL DESCRIPTIONS
// =============================================================================

export const ENRICH_LEVEL_DESCRIPTIONS = {
  E0: {
    name: 'Profile Estimate',
    description: 'Classification-based inference from S.H.A.R.E. Profile assignment',
    dataSource: 'ShareProfile default values',
    confidence: 'Low - based on claim classification only',
    example: 'Product labeled "grass-fed beef" → True Grass-Fed profile → estimated omega 2-3:1',
  },
  E1: {
    name: 'Predictor Estimate',
    description: 'Fielder models using known attributes (cultivar, region, timing, etc.)',
    dataSource: 'GDD models, cultivar baselines, regional inference',
    confidence: 'Medium - refined by specific product attributes',
    example: 'Washington Navel on Carrizo, Indian River region, December harvest → predicted Brix 11.8',
  },
  E2: {
    name: 'Primary Actual',
    description: 'Field measurements of key quality indicators',
    dataSource: 'Refractometer, USDA grade, farmer reports',
    confidence: 'High - actual measured values',
    example: 'Consumer refractometer reading: Brix 12.1',
  },
  E3: {
    name: 'Secondary Actual',
    description: 'Full laboratory nutrient panel',
    dataSource: 'Certified labs (Edacious, Texas A&M, BioNutrient)',
    confidence: 'Highest - gold standard verification',
    example: 'Lab report: Omega-6:3 ratio 2.8:1, Vitamin C 53mg, CLA 4.2mg',
  },
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get the best available measurement for a target
 * Prefers higher levels (E3 > E2 > E1 > E0)
 */
export function getBestMeasurement(
  measurements: EnrichMeasurement[]
): EnrichMeasurement | undefined {
  const levelPriority: Record<EnrichLevel, number> = {
    E3: 4,
    E2: 3,
    E1: 2,
    E0: 1,
  }

  return measurements
    .sort((a, b) => levelPriority[b.level] - levelPriority[a.level])[0]
}

/**
 * Calculate confidence score based on measurement level and other factors
 */
export function calculateConfidenceScore(measurement: EnrichMeasurement): number {
  const baseScores: Record<EnrichLevel, number> = {
    E0: 0.25,
    E1: 0.50,
    E2: 0.85,
    E3: 0.95,
  }

  let score = baseScores[measurement.level]

  // Adjust based on confidence level
  if ('confidence' in measurement) {
    const confidenceAdjust: Record<ConfidenceLevel | 'estimated', number> = {
      high: 0.1,
      medium: 0,
      low: -0.1,
      estimated: -0.15,
    }
    score += confidenceAdjust[measurement.confidence as ConfidenceLevel | 'estimated'] || 0
  }

  return Math.max(0, Math.min(1, score))
}

/**
 * Determine what additional data would improve confidence
 */
export function getDataGaps(
  currentLevel: EnrichLevel,
  category: ShareProfileCategory
): string[] {
  const gaps: string[] = []

  if (currentLevel === 'E0') {
    gaps.push('Cultivar identification would enable E1 prediction')
    gaps.push('Region/farm attribution would improve S pillar inference')
  }

  if (currentLevel === 'E1') {
    if (['citrus', 'stone_fruit', 'pome_fruit', 'berry'].includes(category)) {
      gaps.push('Refractometer Brix reading would provide E2 verification')
    }
    if (['beef', 'pork', 'poultry', 'eggs', 'dairy'].includes(category)) {
      gaps.push('Lab omega ratio test would verify E1 prediction')
    }
  }

  if (currentLevel === 'E2') {
    gaps.push('Full lab panel (E3) would provide complete nutrient profile')
  }

  return gaps
}
