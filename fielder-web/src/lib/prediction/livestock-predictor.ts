/**
 * Livestock Omega Predictor
 *
 * Implements the CategoryPredictor interface for livestock quality prediction
 * based on omega-6:omega-3 ratio as the primary quality metric.
 *
 * The omega ratio is THE key differentiator for livestock health value:
 *
 * TIER               RATIO       FEEDING REGIME
 * ─────────────────────────────────────────────────────────
 * True Grass         ≤3:1        100% grass-finished, strict protocol
 * True Pasture       3-7:1       No feedlot, pasture + free-choice grain (Indrio model)
 * Feedlot-Finished   7-20:1      Same outcome regardless of label ("grass-fed", "natural")
 * Extended Feedlot   >20:1       Premium CAFO (Wagyu) - WORST health profile
 *
 * KEY INSIGHT: "Marketing Grass" and "Commodity" produce the SAME omega outcome (10-20:1)
 * because both involve feedlot finishing. The label is marketing, not health outcome.
 *
 * Based on Edacious lab data from Indrio Brands beef (6.3-6.7:1 = True Pasture)
 *
 * Formula:
 *   Omega Ratio = Diet_Baseline + Finishing_Penalty + Soil_Modifier + Age_Modifier
 *   (Breed affects fat AMOUNT, not fat COMPOSITION - omega is 100% diet-driven)
 *
 * This predictor handles: beef, pork, poultry, eggs, dairy, lamb
 */

import type {
  CategoryPredictor,
  PredictionInput,
  PredictionResult,
  ProductCategory,
  PrimaryMetricType,
  LivestockPredictionInput,
  SoilContribution,
  HeritageContribution,
  AgriculturalContribution,
  RipenContribution,
  EnrichContribution,
  LivestockSpecies,
} from './predictor-interface'

import {
  getBreed,
  getOmegaClassification,
  DIET_OMEGA_MODIFIERS,
  FINISHING_PENALTY_PER_MONTH,
  type LivestockBreed,
} from '../constants/livestock-breeds'

// Note: livestock-omega-model.ts has the sophisticated diet sequence model
// This predictor uses a simplified version aligned with the same principles:
// - Omega ratio is 100% DIET-driven, NOT genetics
// - Breed affects fat AMOUNT (marbling), not fat COMPOSITION (omega ratio)

import type { QualityTier } from '../constants/quality-tiers'

// =============================================================================
// Age Modifiers (R Pillar for Livestock)
// =============================================================================

/**
 * Optimal harvest age by species (months)
 * Harvesting at optimal age = best flavor development
 */
const OPTIMAL_AGE: Record<LivestockSpecies, { min: number; max: number }> = {
  beef: { min: 24, max: 30 },
  pork: { min: 8, max: 12 },
  poultry: { min: 2, max: 4 },
  dairy: { min: 24, max: 48 }, // Milking age, not harvest
  lamb: { min: 6, max: 10 },
}

/**
 * Calculate age modifier for livestock
 * Optimal age = 0, too young/old = penalty
 */
function getAgeModifier(
  ageMonths: number | undefined,
  species: LivestockSpecies
): { modifier: number; confidence: number; status: string } {
  if (!ageMonths) {
    return { modifier: 0, confidence: 0.3, status: 'unknown' }
  }

  const optimal = OPTIMAL_AGE[species]
  if (!optimal) {
    return { modifier: 0, confidence: 0.4, status: 'unknown' }
  }

  if (ageMonths < optimal.min) {
    // Too young - not fully developed
    const deficit = optimal.min - ageMonths
    const penalty = Math.min(5, deficit * 0.5) // Up to +5 to omega ratio
    return {
      modifier: penalty,
      confidence: 0.7,
      status: `young (${ageMonths}mo, optimal ${optimal.min}-${optimal.max}mo)`,
    }
  }

  if (ageMonths > optimal.max) {
    // Older animals can have better flavor but slightly higher omega
    const excess = ageMonths - optimal.max
    const penalty = Math.min(2, excess * 0.2) // Smaller penalty
    return {
      modifier: penalty,
      confidence: 0.7,
      status: `mature (${ageMonths}mo, optimal ${optimal.min}-${optimal.max}mo)`,
    }
  }

  // Optimal age
  return {
    modifier: 0,
    confidence: 0.85,
    status: `optimal (${ageMonths}mo)`,
  }
}

// =============================================================================
// Forage Quality (S Pillar for Livestock)
// =============================================================================

/**
 * Forage quality impacts omega profile through the food chain
 * Better forage = more omega-3 in the animal
 */
const FORAGE_MODIFIERS: Record<string, number> = {
  native_grassland: -1.0, // Best omega-3 in native grasses
  improved_pasture: -0.5, // Good pasture management
  hay_supplemented: 0, // Neutral
  silage_heavy: 0.5, // Some fermentation changes profile
  poor_forage: 1.0, // Low-quality forage
}

function getForageModifier(
  diet: string,
  forageType?: string
): { modifier: number; confidence: number } {
  // Only grass-based diets get forage modifier
  if (diet === 'grass_only' || diet === 'pasture_forage') {
    const modifier = FORAGE_MODIFIERS[forageType || 'improved_pasture'] || 0
    return { modifier, confidence: 0.6 }
  }
  return { modifier: 0, confidence: 0.3 }
}

// =============================================================================
// Livestock Predictor Implementation
// =============================================================================

export class LivestockPredictor implements CategoryPredictor {
  category: ProductCategory = 'livestock'
  validationStatus = 'calibrated' as const // Has some real-world validation

  canHandle(input: PredictionInput): boolean {
    return (
      input.category === 'livestock' ||
      input.category === 'eggs' ||
      input.category === 'dairy'
    )
  }

  getPrimaryMetricType(): PrimaryMetricType {
    return 'omega_ratio'
  }

  predict(input: PredictionInput): PredictionResult {
    const livestockInput = input as LivestockPredictionInput

    // Get breed data
    const breed = livestockInput.breedId
      ? getBreed(livestockInput.breedId)
      : undefined

    // Calculate SHARE pillar contributions
    const soil = this.calculateSoil(livestockInput)
    const heritage = this.calculateHeritage(livestockInput, breed)
    const agricultural = this.calculateAgricultural(livestockInput, breed)
    const ripen = this.calculateRipen(livestockInput)

    // Calculate final omega ratio
    const predictedOmega = this.calculateOmegaRatio(
      livestockInput,
      breed,
      soil.modifier,
      ripen.timingModifier
    )

    // Use actual measurement if available
    const finalOmega =
      livestockInput.measurements?.omega6To3Ratio ?? predictedOmega

    // Get quality classification
    const classification = getOmegaClassification(finalOmega)

    // Calculate confidence
    const confidence = this.calculateConfidence(livestockInput)

    // Create enrich pillar
    const enrich = this.calculateEnrich(livestockInput, finalOmega, predictedOmega)

    // Calculate overall quality score (0-100)
    const qualityScore = this.omegaToScore(finalOmega)

    // Collect warnings
    const warnings = this.collectWarnings(livestockInput, breed, predictedOmega)

    return {
      qualityScore,
      qualityTier: classification.tier,
      confidence,

      primaryMetric: {
        type: 'omega_ratio',
        value: finalOmega,
        unit: ':1',
        displayName: 'Omega-6:3 Ratio',
        lowerIsBetter: true,
      },

      soil,
      heritage,
      agricultural,
      ripen,
      enrich,

      modelInfo: {
        category: livestockInput.category,
        validationStatus: this.validationStatus,
        warnings,
        lastUpdated: new Date('2024-12-18'),
      },
    }
  }

  // ===========================================================================
  // SHARE Pillar Calculations
  // ===========================================================================

  private calculateSoil(input: LivestockPredictionInput): SoilContribution {
    const forageResult = getForageModifier(
      input.feedingRegime.diet,
      input.feedingRegime.forageType
    )

    const insights: string[] = []

    if (input.feedingRegime.diet === 'grass_only') {
      insights.push('Grass-fed diet means forage quality directly impacts omega profile')
      if (input.feedingRegime.forageType === 'native_grassland') {
        insights.push('Native grassland provides highest omega-3 content in forage')
      }
    } else if (input.feedingRegime.diet === 'grain_fed') {
      insights.push('Grain-fed diet bypasses soil/forage quality benefits')
    }

    return {
      modifier: forageResult.modifier,
      confidence: forageResult.confidence,
      details: {
        regionId: input.regionId,
        forageQuality: this.inferForageQuality(input.feedingRegime.diet),
        forageType: input.feedingRegime.forageType,
      },
      insights,
    }
  }

  private calculateHeritage(
    input: LivestockPredictionInput,
    breed?: LivestockBreed
  ): HeritageContribution {
    const insights: string[] = []

    if (breed) {
      insights.push(`${breed.name}: ${breed.heritageIntent} breed`)

      if (breed.heritageIntent === 'heritage') {
        insights.push('Heritage breed selected for quality, not just yield')
      }

      // Marbling potential affects fat AMOUNT, not fat composition (omega ratio)
      if (breed.marblingPotential >= 10) {
        insights.push(
          `High marbling potential (${breed.marblingPotential}/12) - more fat at whatever omega ratio diet produces`
        )
      } else if (breed.marblingPotential <= 5) {
        insights.push(
          `Lean breed (${breed.marblingPotential}/12 marbling) - less intramuscular fat`
        )
      }

      // Note: Omega ratio is 100% diet-driven, NOT genetics
      // Wagyu on grass = 3:1, Wagyu on feedlot = 26:1 (same genetics, different diet)
    } else {
      insights.push('Breed not specified')
    }

    return {
      modifier: 0, // Heritage does NOT affect omega ratio - diet is 100%
      confidence: breed ? 0.8 : 0.4,
      details: {
        breedId: breed?.id,
        breedName: breed?.name,
        marblingPotential: breed?.marblingPotential,
        // omegaBaseline is informational only - "typical" due to typical management, not genetics
        omegaBaseline: breed?.omegaBaseline,
        maturityMonths: breed?.maturityMonths,
      },
      insights,
    }
  }

  private calculateAgricultural(
    input: LivestockPredictionInput,
    breed?: LivestockBreed
  ): AgriculturalContribution {
    const dietModifier = DIET_OMEGA_MODIFIERS[input.feedingRegime.diet] || 0
    const finishingPenalty =
      (input.feedingRegime.finishingMonths || 0) * FINISHING_PENALTY_PER_MONTH

    const insights: string[] = []

    // Diet insights
    switch (input.feedingRegime.diet) {
      case 'grass_only':
        insights.push('TRUE GRASS: 100% grass-finished produces optimal omega ratio (≤3:1)')
        insights.push('Rare, strict protocol - anti-inflammatory profile')
        break
      case 'pasture_forage':
        insights.push('TRUE PASTURE: Pasture-raised with free-choice grain produces excellent omega ratio (3-7:1)')
        insights.push('Indrio model - no feedlot, animal stays on pasture')
        break
      case 'pasture_grain_supplemented':
        insights.push('TRUE PASTURE: Concurrent pasture + grain access (3-7:1)')
        insights.push('Key: Animal stays on pasture (no feedlot removal)')
        break
      case 'grain_finished':
        insights.push('FEEDLOT-FINISHED: Omega ratio 10-20:1 regardless of marketing label')
        insights.push('"Grass-fed" without "grass-finished" = feedlot finished = same as commodity')
        if (input.feedingRegime.finishingMonths) {
          insights.push(
            `${input.feedingRegime.finishingMonths} months of grain finishing adds ~${finishingPenalty.toFixed(1)} to omega ratio`
          )
        }
        break
      case 'grain_fed':
        insights.push('EXTENDED FEEDLOT: High omega-6 (>20:1) - WORST health profile')
        insights.push('Includes "Premium" Wagyu with 12+ month feedlot')
        break
    }

    // Organic warning
    if (
      input.practices?.isCertifiedOrganic &&
      (input.feedingRegime.diet === 'grain_finished' ||
        input.feedingRegime.diet === 'grain_fed')
    ) {
      insights.push(
        '⚠️ Organic certification with grain diet - organic doesn\'t mean grass-fed'
      )
    }

    return {
      modifier: dietModifier + finishingPenalty,
      confidence: 0.8,
      details: {
        feedingRegime: input.feedingRegime.diet,
        finishingDays: (input.feedingRegime.finishingMonths || 0) * 30,
        animalWelfare: input.practices?.animalWelfare,
        noAntibiotics: input.practices?.noAntibiotics,
        noHormones: input.practices?.noHormones,
        isCertifiedOrganic: input.practices?.isCertifiedOrganic,
      },
      insights,
    }
  }

  private calculateRipen(input: LivestockPredictionInput): RipenContribution {
    const ageResult = getAgeModifier(input.ageMonths, input.species)

    const insights: string[] = []

    if (input.ageMonths) {
      insights.push(`Age at harvest: ${input.ageMonths} months (${ageResult.status})`)
    } else {
      insights.push('Age not specified - timing impact unknown')
    }

    if (input.feedingRegime.finishingMonths) {
      insights.push(
        `Finishing period: ${input.feedingRegime.finishingMonths} months on grain`
      )
    }

    return {
      timingModifier: ageResult.modifier,
      confidence: ageResult.confidence,
      details: {
        ageMonths: input.ageMonths,
        optimalAgeMonths: OPTIMAL_AGE[input.species]?.min,
        finishingMonths: input.feedingRegime.finishingMonths,
        harvestStatus: this.mapAgeToStatus(ageResult.status),
      },
      insights,
    }
  }

  private calculateEnrich(
    input: LivestockPredictionInput,
    finalOmega: number,
    predictedOmega: number
  ): EnrichContribution {
    const classification = getOmegaClassification(finalOmega)
    const insights: string[] = []

    insights.push(`Omega ratio: ${finalOmega.toFixed(1)}:1 (${classification.description})`)
    insights.push(classification.healthImplication)

    if (input.measurements?.labVerified) {
      insights.push(`Lab verified by ${input.measurements.labName || 'third party'}`)
      if (Math.abs(finalOmega - predictedOmega) > 3) {
        insights.push(
          `Note: Measured ratio differs from predicted (${predictedOmega.toFixed(1)}:1)`
        )
      }
    }

    return {
      verified: input.measurements?.labVerified || false,
      confidence: input.measurements?.labVerified ? 0.95 : 0.6,
      details: {
        primaryMetric: {
          type: 'omega_ratio',
          value: finalOmega,
          unit: ':1',
          displayName: 'Omega-6:3 Ratio',
          lowerIsBetter: true,
        },
        labVerified: input.measurements?.labVerified,
        labName: input.measurements?.labName,
      },
      insights,
    }
  }

  // ===========================================================================
  // Calculation Helpers
  // ===========================================================================

  private calculateOmegaRatio(
    input: LivestockPredictionInput,
    _breed: LivestockBreed | undefined, // Breed does NOT affect omega - diet is 100%
    soilModifier: number,
    ageModifier: number
  ): number {
    // CORRECTED MODEL: Omega ratio is 100% DIET-driven, NOT genetics
    // Breed genetics affect fat AMOUNT (marbling), not fat COMPOSITION (omega ratio)
    // Proof: Snake River Wagyu (26:1) vs Everglades Ranch Wagyu (6:1) = same genetics, different diet

    // Diet baseline (the finishing diet determines the ratio)
    // Based on Edacious lab testing of Indrio Brands beef (6.3-6.7:1 = True Pasture)
    const DIET_BASELINE: Record<string, number> = {
      grass_only: 2.5,            // TRUE GRASS (≤3:1): Strict 100% grass-finished
      pasture_forage: 4,          // TRUE PASTURE (3-7:1): No feedlot, pasture + free-choice grain
      pasture_grain_supplemented: 6,  // TRUE PASTURE (3-7:1): Concurrent pasture + grain (Indrio model = 6.3-6.7)
      grain_finished: 14,         // FEEDLOT-FINISHED (7-20:1): Same as "marketing grass" or commodity
      grain_fed: 22,              // EXTENDED FEEDLOT (>20:1): 12+ months CAFO, worst profile
    }

    const dietBaseline = DIET_BASELINE[input.feedingRegime.diet] ?? 14

    // Finishing duration penalty (each month of grain adds to ratio)
    const finishingPenalty =
      (input.feedingRegime.finishingMonths || 0) * FINISHING_PENALTY_PER_MONTH

    // Note: Age modifier has minimal effect on omega, included for completeness
    // Soil/forage modifier only applies to grass-based diets
    const effectiveSoilModifier =
      input.feedingRegime.diet === 'grass_only' || input.feedingRegime.diet === 'pasture_forage'
        ? soilModifier
        : 0

    // Omega ratio cannot go below 1.5 (physiological limit)
    return Math.max(
      1.5,
      dietBaseline + finishingPenalty + effectiveSoilModifier + ageModifier
    )
  }

  private calculateConfidence(input: LivestockPredictionInput): number {
    let confidence = 0.5

    // Breed known
    if (input.breedId && getBreed(input.breedId)) {
      confidence += 0.15
    }

    // Diet specified
    if (input.feedingRegime.diet) {
      confidence += 0.1
    }

    // Age known
    if (input.ageMonths) {
      confidence += 0.1
    }

    // Lab verified
    if (input.measurements?.labVerified) {
      confidence += 0.15
    }

    return Math.min(0.95, confidence)
  }

  private collectWarnings(
    input: LivestockPredictionInput,
    breed: LivestockBreed | undefined,
    predictedOmega: number
  ): string[] {
    const warnings: string[] = []

    if (!breed) {
      warnings.push('Breed not specified - using generic omega baseline')
    }

    if (!input.ageMonths) {
      warnings.push('Age not specified - timing modifier not applied')
    }

    if (input.measurements?.omega6To3Ratio) {
      const diff = Math.abs(input.measurements.omega6To3Ratio - predictedOmega)
      if (diff > 5) {
        warnings.push(
          `Large difference between measured (${input.measurements.omega6To3Ratio.toFixed(1)}) and predicted (${predictedOmega.toFixed(1)}) omega ratio`
        )
      }
    }

    // Organic + grain warning
    if (
      input.practices?.isCertifiedOrganic &&
      input.feedingRegime.diet !== 'grass_only' &&
      input.feedingRegime.diet !== 'pasture_forage'
    ) {
      warnings.push('Organic certification with grain-based diet - verify feeding regime')
    }

    return warnings
  }

  private omegaToScore(ratio: number): number {
    // Score mapping based on omega tier boundaries:
    // ≤3:1 (True Grass) = 90-100
    // 3-7:1 (True Pasture) = 70-90
    // 7-20:1 (Feedlot-Finished) = 20-70
    // >20:1 (Extended Feedlot) = 0-20
    if (ratio <= 3) {
      return 90 + ((3 - ratio) / 1.5) * 10 // 1.5:1 = 100, 3:1 = 90
    }
    if (ratio <= 7) {
      return 70 + ((7 - ratio) / 4) * 20 // 3:1 = 90, 7:1 = 70
    }
    if (ratio <= 20) {
      return 20 + ((20 - ratio) / 13) * 50 // 7:1 = 70, 20:1 = 20
    }
    // Extended feedlot (>20:1)
    return Math.max(0, 20 - (ratio - 20) * 2) // 20:1 = 20, 30:1 = 0
  }

  private inferForageQuality(
    diet: string
  ): 'poor' | 'fair' | 'good' | 'excellent' {
    switch (diet) {
      case 'grass_only':
        return 'excellent'
      case 'pasture_forage':
        return 'good'
      case 'grain_finished':
        return 'fair'
      default:
        return 'poor'
    }
  }

  private mapAgeToStatus(
    ageStatus: string
  ): 'not_ready' | 'early' | 'optimal' | 'peak' | 'late' | 'past_peak' {
    if (ageStatus.includes('young')) return 'early'
    if (ageStatus.includes('optimal')) return 'peak'
    if (ageStatus.includes('mature')) return 'late'
    return 'optimal'
  }
}

// =============================================================================
// Eggs Predictor (Extends Livestock Logic)
// =============================================================================

export class EggsPredictor implements CategoryPredictor {
  category: ProductCategory = 'eggs'
  validationStatus = 'calibrated' as const

  private livestockPredictor = new LivestockPredictor()

  canHandle(input: PredictionInput): boolean {
    return input.category === 'eggs'
  }

  getPrimaryMetricType(): PrimaryMetricType {
    return 'omega_ratio'
  }

  predict(input: PredictionInput): PredictionResult {
    // Eggs use similar logic but with hen-specific adjustments
    const eggsInput = input as LivestockPredictionInput

    // Convert to livestock input for base calculation
    const result = this.livestockPredictor.predict({
      ...eggsInput,
      species: 'poultry',
    })

    // Eggs-specific adjustments
    result.enrich.insights.push(
      'Egg omega ratio directly reflects hen diet over ~2 weeks'
    )

    if (eggsInput.feedingRegime.diet === 'grass_only') {
      result.enrich.insights.push(
        'Pasture-raised hens eating insects/greens produce best omega eggs'
      )
    }

    // Adjust model info
    result.modelInfo.category = 'eggs'

    return result
  }
}

// =============================================================================
// Dairy Predictor (Extends Livestock Logic)
// =============================================================================

export class DairyPredictor implements CategoryPredictor {
  category: ProductCategory = 'dairy'
  validationStatus = 'inferred' as const

  private livestockPredictor = new LivestockPredictor()

  canHandle(input: PredictionInput): boolean {
    return input.category === 'dairy'
  }

  getPrimaryMetricType(): PrimaryMetricType {
    return 'omega_ratio' // Could also be fat_percentage for some products
  }

  predict(input: PredictionInput): PredictionResult {
    const dairyInput = input as LivestockPredictionInput

    // Convert to livestock input
    const result = this.livestockPredictor.predict({
      ...dairyInput,
      species: 'dairy',
    })

    // Dairy-specific insights
    result.enrich.insights.push(
      'Dairy fat profile changes within days of diet change'
    )

    if (dairyInput.breedId === 'jersey' || dairyInput.breedId === 'guernsey') {
      result.enrich.insights.push(
        'Heritage dairy breed - higher butterfat, better omega profile'
      )
    }

    // A2 casein note
    result.heritage.insights.push(
      'A2/A2 genetics (common in Jersey) may be better tolerated'
    )

    result.modelInfo.category = 'dairy'
    result.modelInfo.validationStatus = 'inferred'
    result.modelInfo.warnings.push(
      'Dairy omega prediction needs validation with real data'
    )

    return result
  }
}

// =============================================================================
// Export Predictor Instances
// =============================================================================

export const livestockPredictor = new LivestockPredictor()
export const eggsPredictor = new EggsPredictor()
export const dairyPredictor = new DairyPredictor()

// =============================================================================
// Registration Helper
// =============================================================================

/**
 * Register all livestock predictors with the router
 */
export function registerLivestockPredictors(
  registerFn: (predictor: CategoryPredictor) => void
): void {
  registerFn(livestockPredictor)
  registerFn(eggsPredictor)
  registerFn(dairyPredictor)
}
