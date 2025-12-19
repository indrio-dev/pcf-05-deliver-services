/**
 * Prediction Router - Routes predictions to category-specific predictors
 *
 * This is the main entry point for the polymorphic SHARE prediction system.
 * It determines the appropriate predictor based on input category and
 * delegates to category-specific implementations.
 *
 * Usage:
 *   import { predictUnified } from '@/lib/prediction/prediction-router'
 *
 *   // Produce prediction
 *   const result = predictUnified({
 *     category: 'produce',
 *     cultivarId: 'washington_navel',
 *     regionId: 'florida',
 *     currentGDD: 5500,
 *   })
 *
 *   // Livestock prediction
 *   const beefResult = predictUnified({
 *     category: 'livestock',
 *     species: 'beef',
 *     breedId: 'angus',
 *     feedingRegime: { diet: 'grass_only' },
 *   })
 */

import type {
  ProductCategory,
  PredictionInput,
  PredictionResult,
  CategoryPredictor,
  ProducePredictionInput,
  LivestockPredictionInput,
  SeafoodPredictionInput,
  NutPredictionInput,
  TransformedPredictionInput,
  HoneyPredictionInput,
  VegetablePredictionInput,
  LivestockSpecies,
} from './predictor-interface'

// Import category-specific predictors
import {
  livestockPredictor,
  eggsPredictor,
  dairyPredictor,
} from './livestock-predictor'
import { vegetablePredictor } from './vegetable-predictor'
import { nutPredictor } from './nut-predictor'
import { seafoodPredictor } from './seafood-predictor'
import { honeyPredictor } from './honey-predictor'
import { transformationPredictor } from './transformation-predictor'

// For now, import the existing quality predictor for produce
import { predictQuality, type QualityPredictionInput } from './quality-predictor'

// =============================================================================
// Predictor Registry
// =============================================================================

/**
 * Registry of available category predictors
 * Predictors are registered as they are implemented
 */
const predictorRegistry: Map<ProductCategory, CategoryPredictor> = new Map()

/**
 * Register a category predictor
 */
export function registerPredictor(predictor: CategoryPredictor): void {
  predictorRegistry.set(predictor.category, predictor)
}

/**
 * Get a predictor for a category
 */
export function getPredictor(category: ProductCategory): CategoryPredictor | undefined {
  return predictorRegistry.get(category)
}

/**
 * Check if a category has a registered predictor
 */
export function hasPredictor(category: ProductCategory): boolean {
  return predictorRegistry.has(category)
}

/**
 * Get all registered categories
 */
export function getRegisteredCategories(): ProductCategory[] {
  return Array.from(predictorRegistry.keys())
}

// =============================================================================
// Auto-Register Implemented Predictors
// =============================================================================

// Register livestock predictors
registerPredictor(livestockPredictor)
registerPredictor(eggsPredictor)
registerPredictor(dairyPredictor)

// Register vegetable predictor
registerPredictor(vegetablePredictor)

// Register nut predictor
registerPredictor(nutPredictor)

// Register seafood predictor
registerPredictor(seafoodPredictor)

// Register honey predictor
registerPredictor(honeyPredictor)

// Register transformation predictor (coffee, tea, cacao)
registerPredictor(transformationPredictor)

// =============================================================================
// Main Prediction Function
// =============================================================================

/**
 * Unified prediction entry point
 *
 * Routes to the appropriate category predictor based on input.
 * Falls back to legacy predictor for produce if new system not ready.
 */
export function predictUnified(input: PredictionInput): PredictionResult {
  const category = input.category

  // Check for registered predictor
  const predictor = predictorRegistry.get(category)

  if (predictor && predictor.canHandle(input)) {
    return predictor.predict(input)
  }

  // Fallback handling for categories without full predictors yet
  switch (category) {
    case 'produce':
      return predictProduceFallback(input as ProducePredictionInput)

    case 'vegetables':
      return predictVegetablePlaceholder(input as VegetablePredictionInput)

    case 'livestock':
    case 'eggs':
    case 'dairy':
      return predictLivestockFallback(input as LivestockPredictionInput)

    case 'seafood':
      return predictSeafoodPlaceholder(input as SeafoodPredictionInput)

    case 'nuts':
      return predictNutPlaceholder(input as NutPredictionInput)

    case 'honey':
      return predictHoneyPlaceholder(input as HoneyPredictionInput)

    case 'transformed':
      return predictTransformedPlaceholder(input as TransformedPredictionInput)

    default:
      throw new Error(`No predictor available for category: ${category}`)
  }
}

// =============================================================================
// Fallback Implementations
// =============================================================================

/**
 * Produce fallback - uses existing quality-predictor.ts
 */
function predictProduceFallback(input: ProducePredictionInput): PredictionResult {
  // Convert to legacy input format with explicit type handling
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const legacyInput: QualityPredictionInput = {
    cultivarId: input.cultivarId,
    regionId: input.regionId || 'unknown',
    rootstockId: input.rootstockId,
    treeAgeYears: input.treeAgeYears,
    currentGDD: input.currentGDD,
    currentDate: input.currentDate || new Date(),
    bloomDate: input.bloomDate,
    soil: input.soil,
    // Convert practices to legacy format
    practices: input.practices
      ? {
          fertilityStrategy: input.practices.fertilityStrategy?.approach
            ? {
                approach: input.practices.fertilityStrategy.approach,
                coverCropping: input.practices.fertilityStrategy.coverCropping,
                compostApplication: input.practices.fertilityStrategy.compostApplication,
                mineralizedSoil: input.practices.fertilityStrategy.mineralizedSoil,
              }
            : undefined,
          pestManagement: input.practices.pestManagement,
          cropLoadManaged: input.practices.cropLoadManaged,
        }
      : undefined,
  }

  // Call existing predictor
  const legacyResult = predictQuality(legacyInput)

  // Extract insights from legacy result (only agricultural has insights in legacy)
  const agriculturalInsights = legacyResult.agricultural?.insights || []

  // Convert to unified result format
  return {
    qualityScore: normalizeProduceBrixToScore(legacyResult.predictedBrix),
    qualityTier: legacyResult.predictedTier,
    confidence: legacyResult.confidence,

    primaryMetric: {
      type: 'brix',
      value: legacyResult.predictedBrix,
      unit: '°Bx',
      displayName: 'Brix',
      lowerIsBetter: false,
    },

    soil: {
      modifier: legacyResult.soil?.modifier || 0,
      confidence: legacyResult.soil?.confidence || 0.5,
      details: {
        regionId: input.regionId,
        organicMatterPct: input.soil?.organicMatterPct,
        ph: input.soil?.ph,
        drainageClass: input.soil?.drainageClass,
      },
      insights: [], // Legacy soil doesn't have insights
    },

    heritage: {
      modifier: legacyResult.heritage?.rootstockModifier || 0,
      confidence: legacyResult.heritage?.confidence || 0.8,
      details: {
        cultivarId: legacyResult.heritage?.cultivarId,
        cultivarName: legacyResult.heritage?.cultivarName,
        baseBrix: legacyResult.heritage?.baseBrix,
        rootstockId: legacyResult.heritage?.rootstockId,
        rootstockModifier: legacyResult.heritage?.rootstockModifier,
        // heritageIntent not available in legacy result
      },
      insights: [], // Legacy heritage doesn't have insights
    },

    agricultural: {
      modifier: legacyResult.agricultural?.modifier || 0,
      confidence: legacyResult.agricultural?.confidence || 0.5,
      details: {
        fertilityStrategy: input.practices?.fertilityStrategy?.approach,
        pestManagement: input.practices?.pestManagement,
        cropLoadManaged: input.practices?.cropLoadManaged,
        coverCropping: input.practices?.fertilityStrategy?.coverCropping,
      },
      insights: agriculturalInsights,
    },

    ripen: {
      timingModifier: legacyResult.ripen?.timingModifier || 0,
      confidence: legacyResult.ripen?.confidence || 0.7,
      details: {
        currentGDD: legacyResult.ripen?.currentGDD,
        targetGDD: legacyResult.ripen?.gddToPeak,
        gddToMaturity: legacyResult.ripen?.gddToMaturity,
        gddToPeak: legacyResult.ripen?.gddToPeak,
        percentToMaturity: legacyResult.ripen?.percentToMaturity,
        daysToHarvest: legacyResult.ripen?.daysToHarvest || legacyResult.ripen?.daysToPeak,
        harvestStatus: mapHarvestStatus(legacyResult.ripen?.harvestStatus),
      },
      insights: [], // Legacy ripen doesn't have insights
    },

    enrich: {
      verified: false, // No lab verification in prediction
      confidence: legacyResult.confidence,
      details: {
        primaryMetric: {
          type: 'brix',
          value: legacyResult.predictedBrix,
          unit: '°Bx',
          displayName: 'Brix',
          lowerIsBetter: false,
        },
      },
      insights: [
        `Predicted Brix: ${legacyResult.predictedBrix.toFixed(1)}°Bx`,
        `Quality Tier: ${legacyResult.predictedTier}`,
      ],
    },

    modelInfo: {
      category: 'produce',
      validationStatus: 'validated', // Produce model is well-tested
      warnings: [],
      lastUpdated: new Date('2024-12-15'),
    },
  }
}

/**
 * Livestock fallback - basic omega prediction
 * Will be replaced by full livestock-predictor.ts
 */
function predictLivestockFallback(input: LivestockPredictionInput): PredictionResult {
  // Basic omega prediction formula
  const dietModifiers: Record<string, number> = {
    grass_only: -12, // Baseline 15 - 12 = 3:1
    pasture_forage: -10, // Baseline 15 - 10 = 5:1
    grain_finished: -2, // Baseline 15 - 2 = 13:1
    grain_fed: 0, // Baseline 15 - 0 = 15:1
  }

  const baseLine = 15.0
  const dietModifier = dietModifiers[input.feedingRegime.diet] || 0
  const finishingPenalty = (input.feedingRegime.finishingMonths || 0) * 2.5

  // If we have actual measurement, use it
  const predictedOmega = input.measurements?.omega6To3Ratio
    || Math.max(1.5, baseLine + dietModifier + finishingPenalty)

  // Classify omega ratio
  const { tier, score } = classifyOmegaRatio(predictedOmega)

  return {
    qualityScore: score,
    qualityTier: tier,
    confidence: input.measurements?.labVerified ? 0.95 : 0.6,

    primaryMetric: {
      type: 'omega_ratio',
      value: predictedOmega,
      unit: ':1',
      displayName: 'Omega-6:3 Ratio',
      lowerIsBetter: true,
    },

    soil: {
      modifier: 0,
      confidence: 0.3,
      details: {
        regionId: input.regionId,
        forageQuality: input.feedingRegime.diet === 'grass_only' ? 'good' : 'fair',
        forageType: input.feedingRegime.forageType,
      },
      insights: ['Forage quality affects omega profile through the food chain'],
    },

    heritage: {
      modifier: 0,
      confidence: 0.5,
      details: {
        breedId: input.breedId,
        breedName: input.breedId, // Will be enriched by breed database
      },
      insights: ['Breed genetics influence omega accumulation rate'],
    },

    agricultural: {
      modifier: dietModifier,
      confidence: 0.7,
      details: {
        feedingRegime: input.feedingRegime.diet,
        finishingDays: (input.feedingRegime.finishingMonths || 0) * 30,
        animalWelfare: input.practices?.animalWelfare,
        noAntibiotics: input.practices?.noAntibiotics,
        noHormones: input.practices?.noHormones,
        isCertifiedOrganic: input.practices?.isCertifiedOrganic,
      },
      insights: getFeedingInsights(input.feedingRegime.diet, input.practices?.isCertifiedOrganic),
    },

    ripen: {
      timingModifier: 0,
      confidence: 0.5,
      details: {
        ageMonths: input.ageMonths,
        finishingMonths: input.feedingRegime.finishingMonths,
        harvestStatus: 'optimal', // Simplified for now
      },
      insights: input.ageMonths
        ? [`Age at harvest: ${input.ageMonths} months`]
        : ['Age not specified'],
    },

    enrich: {
      verified: input.measurements?.labVerified || false,
      confidence: input.measurements?.labVerified ? 0.95 : 0.6,
      details: {
        primaryMetric: {
          type: 'omega_ratio',
          value: predictedOmega,
          unit: ':1',
          displayName: 'Omega-6:3 Ratio',
          lowerIsBetter: true,
        },
        labVerified: input.measurements?.labVerified,
        labName: input.measurements?.labName,
      },
      insights: getOmegaInsights(predictedOmega),
    },

    modelInfo: {
      category: input.category,
      validationStatus: 'inferred', // Needs validation with real data
      warnings: [
        'Omega prediction using simplified formula',
        'Breed-specific modifiers not yet applied',
      ],
      lastUpdated: new Date('2024-12-18'),
    },
  }
}

/**
 * Vegetable placeholder
 */
function predictVegetablePlaceholder(input: VegetablePredictionInput): PredictionResult {
  // Basic placeholder - use Brix if available, or estimate based on subcategory
  const estimatedBrix = input.measurements?.brix || getVegetableBrixEstimate(input.subcategory)

  return createPlaceholderResult({
    category: 'vegetables',
    primaryMetric: {
      type: 'brix',
      value: estimatedBrix,
      unit: '°Bx',
      displayName: 'Brix',
      lowerIsBetter: false,
    },
    warnings: ['Vegetable predictor not yet implemented - using placeholder'],
  })
}

function getVegetableBrixEstimate(subcategory: string): number {
  const estimates: Record<string, number> = {
    leafy: 6,
    root: 8,
    cruciferous: 7,
    allium: 10,
    legume: 5,
    nightshade: 5,
  }
  return estimates[subcategory] || 6
}

/**
 * Seafood placeholder
 */
function predictSeafoodPlaceholder(input: SeafoodPredictionInput): PredictionResult {
  // Very basic placeholder - wild caught assumed better
  const baseOmega3 = input.sourceType === 'wild_caught' ? 1500 : 800

  return createPlaceholderResult({
    category: 'seafood',
    primaryMetric: {
      type: 'omega_3',
      value: input.measurements?.omega3ContentMg || baseOmega3,
      unit: 'mg/100g',
      displayName: 'Omega-3 Content',
      lowerIsBetter: false,
    },
    warnings: ['Seafood predictor not yet implemented - using placeholder'],
  })
}

/**
 * Nut placeholder
 */
function predictNutPlaceholder(input: NutPredictionInput): PredictionResult {
  return createPlaceholderResult({
    category: 'nuts',
    primaryMetric: {
      type: 'oil_content',
      value: input.measurements?.oilContentPct || 55,
      unit: '%',
      displayName: 'Oil Content',
      lowerIsBetter: false,
    },
    warnings: ['Nut predictor not yet implemented - using placeholder'],
  })
}

/**
 * Honey placeholder
 */
function predictHoneyPlaceholder(input: HoneyPredictionInput): PredictionResult {
  const diastase = input.measurements?.diastaseNumber || 12

  return createPlaceholderResult({
    category: 'honey',
    primaryMetric: {
      type: 'diastase',
      value: diastase,
      unit: 'DN',
      displayName: 'Diastase Number',
      lowerIsBetter: false,
    },
    warnings: ['Honey predictor not yet implemented - using placeholder'],
  })
}

/**
 * Transformed product placeholder
 */
function predictTransformedPlaceholder(input: TransformedPredictionInput): PredictionResult {
  return createPlaceholderResult({
    category: 'transformed',
    primaryMetric: {
      type: 'cupping_score',
      value: input.measurements?.cuppingScore || 80,
      unit: 'pts',
      displayName: 'Cupping Score',
      lowerIsBetter: false,
    },
    warnings: ['Transformation predictor not yet implemented - using placeholder'],
  })
}

// =============================================================================
// Helper Functions
// =============================================================================

function normalizeProduceBrixToScore(brix: number): number {
  // 8 Brix = 0, 18 Brix = 100
  return Math.min(100, Math.max(0, ((brix - 8) / 10) * 100))
}

function mapHarvestStatus(
  status?: string
): 'not_ready' | 'early' | 'optimal' | 'peak' | 'late' | 'past_peak' {
  const mapping: Record<string, 'not_ready' | 'early' | 'optimal' | 'peak' | 'late' | 'past_peak'> = {
    not_ready: 'not_ready',
    too_early: 'early',
    early: 'early',
    approaching_maturity: 'early',
    at_maturity: 'optimal',
    optimal: 'optimal',
    peak: 'peak',
    past_peak: 'past_peak',
    late: 'late',
    overripe: 'past_peak',
  }
  return mapping[status?.toLowerCase() || ''] || 'optimal'
}

function classifyOmegaRatio(ratio: number): { tier: 'artisan' | 'premium' | 'standard' | 'commodity'; score: number } {
  if (ratio <= 3) {
    return { tier: 'artisan', score: 90 + (3 - ratio) * 3.33 }
  }
  if (ratio <= 6) {
    return { tier: 'premium', score: 70 + (6 - ratio) * 6.67 }
  }
  if (ratio <= 12) {
    return { tier: 'standard', score: 40 + (12 - ratio) * 5 }
  }
  return { tier: 'commodity', score: Math.max(0, 40 - (ratio - 12) * 2) }
}

function getFeedingInsights(diet: string, isOrganic?: boolean): string[] {
  const insights: string[] = []

  switch (diet) {
    case 'grass_only':
      insights.push('100% grass-fed produces optimal omega ratio (≤3:1)')
      insights.push('No grain finishing preserves anti-inflammatory profile')
      break
    case 'pasture_forage':
      insights.push('Pasture-raised with forage produces good omega ratio (3-6:1)')
      break
    case 'grain_finished':
      insights.push('Grain finishing degrades omega ratio significantly')
      insights.push('Each month of grain finishing adds ~2.5 to omega ratio')
      break
    case 'grain_fed':
      insights.push('Grain-fed produces high omega-6 (pro-inflammatory profile)')
      break
  }

  if (isOrganic && (diet === 'grain_finished' || diet === 'grain_fed')) {
    insights.push('⚠️ Organic certification often indicates grain-fed - verify feeding regime')
  }

  return insights
}

function getOmegaInsights(ratio: number): string[] {
  const insights: string[] = []

  if (ratio <= 3) {
    insights.push('Exceptional omega ratio (≤3:1) - optimal grass-fed profile')
    insights.push('Anti-inflammatory fatty acid balance')
  } else if (ratio <= 6) {
    insights.push('Premium omega ratio (3-6:1) - good grass-finished profile')
  } else if (ratio <= 12) {
    insights.push('Standard omega ratio (6-12:1) - mixed feeding regime')
  } else {
    insights.push('High omega ratio (>12:1) - feedlot/grain-fed profile')
    insights.push('Pro-inflammatory fatty acid profile')
  }

  return insights
}

interface PlaceholderParams {
  category: ProductCategory
  primaryMetric: {
    type: 'brix' | 'omega_3' | 'oil_content' | 'diastase' | 'cupping_score'
    value: number
    unit: string
    displayName: string
    lowerIsBetter: boolean
  }
  warnings: string[]
}

function createPlaceholderResult(params: PlaceholderParams): PredictionResult {
  return {
    qualityScore: 50,
    qualityTier: 'standard',
    confidence: 0.3,

    primaryMetric: params.primaryMetric,

    soil: {
      modifier: 0,
      confidence: 0.2,
      details: {},
      insights: ['Soil contribution not implemented for this category'],
    },

    heritage: {
      modifier: 0,
      confidence: 0.2,
      details: {},
      insights: ['Heritage contribution not implemented for this category'],
    },

    agricultural: {
      modifier: 0,
      confidence: 0.2,
      details: {},
      insights: ['Agricultural contribution not implemented for this category'],
    },

    ripen: {
      timingModifier: 0,
      confidence: 0.2,
      details: {
        harvestStatus: 'optimal',
      },
      insights: ['Timing contribution not implemented for this category'],
    },

    enrich: {
      verified: false,
      confidence: 0.3,
      details: {
        primaryMetric: params.primaryMetric,
      },
      insights: ['Using placeholder values'],
    },

    modelInfo: {
      category: params.category,
      validationStatus: 'placeholder',
      warnings: params.warnings,
      lastUpdated: new Date('2024-12-18'),
    },
  }
}

// =============================================================================
// Exports
// =============================================================================

// Functions are already exported via `export function` declarations above
// Export additional helper function that wasn't exported inline
export { classifyOmegaRatio }

// Re-export types for convenience
export type {
  PredictionInput,
  PredictionResult,
  ProductCategory,
  CategoryPredictor,
  ProducePredictionInput,
  LivestockPredictionInput,
  LivestockSpecies,
}
