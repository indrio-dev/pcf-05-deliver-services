/**
 * Vegetable Quality Predictor
 *
 * Implements the CategoryPredictor interface for vegetable quality prediction.
 * Vegetables are more diverse than tree fruit - each subcategory needs different logic.
 *
 * SUBCATEGORY QUALITY MODELS:
 *
 * | Subcategory  | Quality Driver           | Primary Metric  | Notes                           |
 * |--------------|--------------------------|-----------------|----------------------------------|
 * | Leafy        | Freshness (days)         | Freshness score | Harvest before bolting           |
 * | Cruciferous  | Freshness + sulfur       | Freshness score | Glucosinolates degrade           |
 * | Root         | Starch→sugar conversion  | Brix            | Frost/cold storage sweetens      |
 * | Nightshade   | GDD accumulation         | Brix            | Similar to fruit (tomatoes)      |
 * | Allium       | Curing + storage         | Storage score   | Onions/garlic improve w/ curing  |
 * | Legume       | Freshness                | Freshness score | Sugar→starch quickly post-harvest|
 * | Squash       | Curing + storage         | Storage score   | Winter squash cures 2-4 weeks    |
 *
 * KEY INSIGHT: Unlike fruit where Brix is universal, vegetables have diverse quality metrics.
 * "Quality" means different things for different vegetables:
 *   - Leafy greens: Crispness, no wilting, no bolting → Freshness
 *   - Root vegetables: Sweetness from cold storage → Brix
 *   - Tomatoes: Sugar content → Brix
 *   - Onions: Firm, no sprouting, proper cure → Storage quality
 */

import type {
  CategoryPredictor,
  PredictionInput,
  PredictionResult,
  ProductCategory,
  PrimaryMetricType,
  VegetablePredictionInput,
  SoilContribution,
  HeritageContribution,
  AgriculturalContribution,
  RipenContribution,
  EnrichContribution,
  PrimaryMetric,
} from './predictor-interface'

import type { QualityTier } from '../constants/quality-tiers'

// =============================================================================
// Vegetable Subcategory Types
// =============================================================================

export type VegetableSubcategory =
  | 'leafy'
  | 'cruciferous'
  | 'root'
  | 'nightshade'
  | 'allium'
  | 'legume'
  | 'squash'

/**
 * Quality model type for each subcategory
 */
export type VegetableQualityModel = 'freshness' | 'brix' | 'storage'

/**
 * Map subcategory to quality model
 */
const SUBCATEGORY_QUALITY_MODEL: Record<VegetableSubcategory, VegetableQualityModel> = {
  leafy: 'freshness',
  cruciferous: 'freshness',
  root: 'brix',         // Starch→sugar conversion
  nightshade: 'brix',   // GDD-based like fruit
  allium: 'storage',
  legume: 'freshness',
  squash: 'storage',
}

// =============================================================================
// Freshness Model (Leafy, Cruciferous, Legume)
// =============================================================================

/**
 * Freshness decay rates by subcategory (quality loss per day)
 * Higher = faster decay = more perishable
 */
const FRESHNESS_DECAY_RATE: Record<string, number> = {
  leafy: 0.15,       // Spinach, lettuce - very perishable
  cruciferous: 0.08, // Broccoli, cauliflower - moderate
  legume: 0.12,      // Peas, beans - sugar converts to starch quickly
}

/**
 * Optimal freshness window (days from harvest)
 */
const OPTIMAL_FRESHNESS_DAYS: Record<string, number> = {
  leafy: 3,          // Best within 3 days
  cruciferous: 5,    // Best within 5 days
  legume: 2,         // Best within 2 days (sugar→starch)
}

/**
 * Storage condition modifiers (extends freshness)
 */
const STORAGE_FRESHNESS_MODIFIER: Record<string, number> = {
  ambient: 1.0,        // No extension
  refrigerated: 0.5,   // 50% slower decay
  cold_storage: 0.3,   // 70% slower decay
}

/**
 * Calculate freshness score (0-100)
 * 100 = just harvested, 0 = past usable
 */
function calculateFreshnessScore(
  subcategory: VegetableSubcategory,
  daysSinceHarvest: number,
  storageConditions: 'ambient' | 'refrigerated' | 'cold_storage' = 'ambient'
): { score: number; status: string; daysRemaining: number } {
  const decayRate = FRESHNESS_DECAY_RATE[subcategory] || 0.1
  const optimalDays = OPTIMAL_FRESHNESS_DAYS[subcategory] || 3
  const storageModifier = STORAGE_FRESHNESS_MODIFIER[storageConditions] || 1.0

  // Effective days accounting for storage
  const effectiveDays = daysSinceHarvest * storageModifier

  // Freshness decays exponentially
  const score = Math.max(0, 100 * Math.exp(-decayRate * effectiveDays))

  // Estimate days remaining at current storage
  const daysRemaining = Math.max(0, Math.round((optimalDays * 2) / storageModifier - daysSinceHarvest))

  let status: string
  if (effectiveDays <= optimalDays * 0.5) {
    status = 'peak freshness'
  } else if (effectiveDays <= optimalDays) {
    status = 'fresh'
  } else if (effectiveDays <= optimalDays * 2) {
    status = 'acceptable'
  } else {
    status = 'past prime'
  }

  return { score, status, daysRemaining }
}

// =============================================================================
// Brix Model (Root, Nightshade)
// =============================================================================

/**
 * Base Brix by vegetable type
 */
const VEGETABLE_BASE_BRIX: Record<string, number> = {
  // Nightshades (GDD-based, similar to fruit)
  tomato: 5.0,
  pepper: 6.0,
  eggplant: 4.0,

  // Root vegetables (starch→sugar conversion)
  carrot: 8.0,
  beet: 10.0,
  parsnip: 6.0,
  sweet_potato: 12.0,
  potato: 4.0,      // Low base, increases with cold storage
  turnip: 5.0,
}

/**
 * Cold storage Brix increase for root vegetables (per week of cold storage)
 */
const COLD_STORAGE_BRIX_INCREASE: Record<string, number> = {
  carrot: 0.5,      // Frost/cold sweetens carrots
  parsnip: 0.8,     // Parsnips sweeten dramatically
  potato: 0.3,      // Starch converts slowly
  beet: 0.2,
  turnip: 0.4,
}

/**
 * Calculate Brix for vegetables
 */
function calculateVegetableBrix(
  varietyId: string,
  subcategory: VegetableSubcategory,
  daysSinceHarvest: number = 0,
  storageConditions: 'ambient' | 'refrigerated' | 'cold_storage' = 'ambient',
  measuredBrix?: number
): { brix: number; source: 'measured' | 'estimated' } {
  // If measured, use it
  if (measuredBrix !== undefined) {
    return { brix: measuredBrix, source: 'measured' }
  }

  // Base Brix from variety or subcategory default
  const baseBrix = VEGETABLE_BASE_BRIX[varietyId] ?? (subcategory === 'root' ? 6.0 : 5.0)

  // Root vegetables: cold storage increases Brix
  let coldStorageBonus = 0
  if (subcategory === 'root' && storageConditions === 'cold_storage') {
    const weeksInStorage = daysSinceHarvest / 7
    const brixIncreaseRate = COLD_STORAGE_BRIX_INCREASE[varietyId] || 0.3
    coldStorageBonus = Math.min(3.0, weeksInStorage * brixIncreaseRate) // Cap at +3 Brix
  }

  return { brix: baseBrix + coldStorageBonus, source: 'estimated' }
}

// =============================================================================
// Storage Model (Allium, Squash)
// =============================================================================

/**
 * Storage quality parameters by type
 */
const STORAGE_QUALITY_PARAMS: Record<string, {
  optimalCuringDays: number
  optimalStorageMonths: number
  requiresCuring: boolean
}> = {
  // Alliums
  onion: { optimalCuringDays: 14, optimalStorageMonths: 6, requiresCuring: true },
  garlic: { optimalCuringDays: 21, optimalStorageMonths: 8, requiresCuring: true },
  shallot: { optimalCuringDays: 14, optimalStorageMonths: 4, requiresCuring: true },
  leek: { optimalCuringDays: 0, optimalStorageMonths: 1, requiresCuring: false },

  // Squash
  butternut: { optimalCuringDays: 14, optimalStorageMonths: 3, requiresCuring: true },
  acorn: { optimalCuringDays: 10, optimalStorageMonths: 2, requiresCuring: true },
  spaghetti: { optimalCuringDays: 14, optimalStorageMonths: 3, requiresCuring: true },
  pumpkin: { optimalCuringDays: 10, optimalStorageMonths: 3, requiresCuring: true },
}

/**
 * Calculate storage quality score (0-100)
 * Accounts for curing time and storage duration
 */
function calculateStorageScore(
  varietyId: string,
  daysSinceHarvest: number,
  isCured: boolean = false
): { score: number; status: string } {
  const params = STORAGE_QUALITY_PARAMS[varietyId] || {
    optimalCuringDays: 14,
    optimalStorageMonths: 3,
    requiresCuring: true,
  }

  let score = 100
  let status = 'excellent'

  // Curing check
  if (params.requiresCuring && !isCured && daysSinceHarvest < params.optimalCuringDays) {
    // Not yet cured - quality still developing
    const curingProgress = daysSinceHarvest / params.optimalCuringDays
    score = 70 + curingProgress * 30
    status = 'curing in progress'
  } else if (params.requiresCuring && isCured) {
    // Properly cured
    const monthsInStorage = daysSinceHarvest / 30
    if (monthsInStorage <= params.optimalStorageMonths) {
      score = 100
      status = 'optimal storage'
    } else if (monthsInStorage <= params.optimalStorageMonths * 1.5) {
      score = 85 - (monthsInStorage - params.optimalStorageMonths) * 10
      status = 'good storage'
    } else {
      score = Math.max(20, 70 - (monthsInStorage - params.optimalStorageMonths * 1.5) * 15)
      status = 'past optimal'
    }
  }

  return { score: Math.max(0, Math.min(100, score)), status }
}

// =============================================================================
// Vegetable Predictor Implementation
// =============================================================================

export class VegetablePredictor implements CategoryPredictor {
  category: ProductCategory = 'vegetables'
  validationStatus = 'inferred' as const // Needs validation with real data

  canHandle(input: PredictionInput): boolean {
    return input.category === 'vegetables'
  }

  getPrimaryMetricType(): PrimaryMetricType {
    // Vegetables use different metrics by subcategory
    // Default to Brix, but freshness-based vegetables don't really have a numeric metric
    return 'brix'
  }

  predict(input: PredictionInput): PredictionResult {
    const vegInput = input as VegetablePredictionInput
    const subcategory = vegInput.subcategory as VegetableSubcategory
    const qualityModel = SUBCATEGORY_QUALITY_MODEL[subcategory] || 'freshness'

    // Calculate SHARE pillar contributions
    const soil = this.calculateSoil(vegInput)
    const heritage = this.calculateHeritage(vegInput)
    const agricultural = this.calculateAgricultural(vegInput)
    const ripen = this.calculateRipen(vegInput, qualityModel)

    // Calculate primary metric based on quality model
    const { primaryMetric, qualityScore } = this.calculateQuality(vegInput, qualityModel)

    // Determine tier
    const qualityTier = this.scoreToTier(qualityScore)

    // Calculate confidence
    const confidence = this.calculateConfidence(vegInput)

    // Create enrich pillar
    const enrich = this.calculateEnrich(vegInput, primaryMetric, qualityScore)

    // Collect warnings
    const warnings = this.collectWarnings(vegInput, qualityModel)

    return {
      qualityScore,
      qualityTier,
      confidence,
      primaryMetric,
      soil,
      heritage,
      agricultural,
      ripen,
      enrich,
      modelInfo: {
        category: 'vegetables',
        validationStatus: this.validationStatus,
        warnings,
        lastUpdated: new Date('2024-12-18'),
      },
    }
  }

  // ===========================================================================
  // Quality Calculation by Model
  // ===========================================================================

  private calculateQuality(
    input: VegetablePredictionInput,
    qualityModel: VegetableQualityModel
  ): { primaryMetric: PrimaryMetric; qualityScore: number } {
    switch (qualityModel) {
      case 'freshness': {
        const { score } = calculateFreshnessScore(
          input.subcategory as VegetableSubcategory,
          input.daysSinceHarvest || 0,
          input.storageConditions
        )
        return {
          primaryMetric: {
            type: 'brix', // Using brix type but value is freshness score
            value: score,
            unit: '%',
            displayName: 'Freshness',
            lowerIsBetter: false,
          },
          qualityScore: score,
        }
      }

      case 'brix': {
        const { brix } = calculateVegetableBrix(
          input.varietyId,
          input.subcategory as VegetableSubcategory,
          input.daysSinceHarvest,
          input.storageConditions,
          input.measurements?.brix
        )
        // Normalize vegetable Brix to score (4-14 range typical for vegetables)
        const qualityScore = Math.min(100, Math.max(0, ((brix - 4) / 10) * 100))
        return {
          primaryMetric: {
            type: 'brix',
            value: brix,
            unit: '°Bx',
            displayName: 'Brix',
            lowerIsBetter: false,
          },
          qualityScore,
        }
      }

      case 'storage': {
        const { score } = calculateStorageScore(
          input.varietyId,
          input.daysSinceHarvest || 0
        )
        return {
          primaryMetric: {
            type: 'brix', // Using brix type but value is storage score
            value: score,
            unit: '%',
            displayName: 'Storage Quality',
            lowerIsBetter: false,
          },
          qualityScore: score,
        }
      }
    }
  }

  // ===========================================================================
  // SHARE Pillar Calculations
  // ===========================================================================

  private calculateSoil(input: VegetablePredictionInput): SoilContribution {
    const insights: string[] = []
    let modifier = 0

    if (input.practices?.fertilityStrategy?.approach === 'mineralized_soil_science') {
      modifier = 0.5
      insights.push('Mineralized soil produces higher nutrient density vegetables')
    } else if (input.practices?.fertilityStrategy?.approach === 'soil_banking') {
      modifier = 0.3
      insights.push('Soil banking approach builds long-term fertility')
    }

    insights.push('Vegetable quality is highly dependent on soil mineral balance')

    return {
      modifier,
      confidence: 0.5,
      details: {
        regionId: input.regionId,
      },
      insights,
    }
  }

  private calculateHeritage(input: VegetablePredictionInput): HeritageContribution {
    const insights: string[] = []

    // Variety affects quality ceiling
    insights.push(`Variety: ${input.varietyId}`)
    insights.push('Heritage vegetable varieties often have superior flavor')

    return {
      modifier: 0,
      confidence: 0.5,
      details: {
        cultivarId: input.varietyId,
        cultivarName: input.varietyId,
      },
      insights,
    }
  }

  private calculateAgricultural(input: VegetablePredictionInput): AgriculturalContribution {
    const insights: string[] = []
    let modifier = 0

    if (input.practices?.pestManagement === 'organic' || input.practices?.pestManagement === 'no_spray') {
      modifier += 0.1
      insights.push('Organic/no-spray practices may improve secondary nutrition')
    }

    const subcategory = input.subcategory as VegetableSubcategory
    const qualityModel = SUBCATEGORY_QUALITY_MODEL[subcategory]

    if (qualityModel === 'freshness') {
      insights.push('Fresh vegetables lose quality quickly - minimize time from harvest')
    } else if (qualityModel === 'storage') {
      insights.push('Proper curing and storage are critical for alliums and squash')
    }

    return {
      modifier,
      confidence: 0.5,
      details: {
        fertilityStrategy: input.practices?.fertilityStrategy?.approach,
        pestManagement: input.practices?.pestManagement,
      },
      insights,
    }
  }

  private calculateRipen(
    input: VegetablePredictionInput,
    qualityModel: VegetableQualityModel
  ): RipenContribution {
    const insights: string[] = []
    let timingModifier = 0
    let harvestStatus: 'not_ready' | 'early' | 'optimal' | 'peak' | 'late' | 'past_peak' = 'optimal'

    const subcategory = input.subcategory as VegetableSubcategory

    switch (qualityModel) {
      case 'freshness': {
        const { status, daysRemaining } = calculateFreshnessScore(
          subcategory,
          input.daysSinceHarvest || 0,
          input.storageConditions
        )
        insights.push(`Freshness status: ${status}`)
        insights.push(`Estimated days remaining: ${daysRemaining}`)

        if (status === 'peak freshness') {
          harvestStatus = 'peak'
        } else if (status === 'fresh') {
          harvestStatus = 'optimal'
        } else if (status === 'acceptable') {
          harvestStatus = 'late'
        } else {
          harvestStatus = 'past_peak'
          timingModifier = -0.3
        }
        break
      }

      case 'brix': {
        if (subcategory === 'root') {
          insights.push('Root vegetables sweeten with cold storage')
          if (input.storageConditions === 'cold_storage') {
            insights.push('Cold storage is converting starch to sugar')
          }
        } else {
          insights.push('Nightshade vegetables (tomatoes, peppers) ripen like fruit')
        }
        break
      }

      case 'storage': {
        const { status } = calculateStorageScore(
          input.varietyId,
          input.daysSinceHarvest || 0
        )
        insights.push(`Storage status: ${status}`)

        if (status === 'curing in progress') {
          harvestStatus = 'early'
          insights.push('Allow more curing time for optimal quality')
        } else if (status === 'optimal storage') {
          harvestStatus = 'peak'
        } else if (status === 'past optimal') {
          harvestStatus = 'past_peak'
          timingModifier = -0.2
        }
        break
      }
    }

    return {
      timingModifier,
      confidence: 0.6,
      details: {
        daysToHarvest: 0, // Not applicable for harvested vegetables
        harvestStatus,
      },
      insights,
    }
  }

  private calculateEnrich(
    input: VegetablePredictionInput,
    primaryMetric: PrimaryMetric,
    qualityScore: number
  ): EnrichContribution {
    const insights: string[] = []
    const subcategory = input.subcategory as VegetableSubcategory
    const qualityModel = SUBCATEGORY_QUALITY_MODEL[subcategory]

    insights.push(`${primaryMetric.displayName}: ${primaryMetric.value.toFixed(1)}${primaryMetric.unit}`)

    // Subcategory-specific insights
    switch (qualityModel) {
      case 'freshness':
        insights.push('Freshness-based vegetables are best consumed quickly')
        if (input.storageConditions === 'cold_storage') {
          insights.push('Cold storage extends freshness significantly')
        }
        break

      case 'brix':
        if (subcategory === 'root') {
          insights.push('Cold-shocked root vegetables have higher sugar content')
        }
        if (input.measurements?.brix) {
          insights.push('Brix measured - verified quality')
        }
        break

      case 'storage':
        insights.push('Properly cured storage vegetables can last months')
        break
    }

    return {
      verified: input.measurements?.labVerified || false,
      confidence: input.measurements?.labVerified ? 0.9 : 0.5,
      details: {
        primaryMetric,
        labVerified: input.measurements?.labVerified,
      },
      insights,
    }
  }

  // ===========================================================================
  // Helpers
  // ===========================================================================

  private calculateConfidence(input: VegetablePredictionInput): number {
    let confidence = 0.4 // Base confidence for vegetables (less studied than fruit)

    if (input.measurements?.brix) {
      confidence += 0.25
    }

    if (input.daysSinceHarvest !== undefined) {
      confidence += 0.15
    }

    if (input.storageConditions) {
      confidence += 0.1
    }

    if (input.measurements?.labVerified) {
      confidence += 0.15
    }

    return Math.min(0.9, confidence)
  }

  private collectWarnings(
    input: VegetablePredictionInput,
    qualityModel: VegetableQualityModel
  ): string[] {
    const warnings: string[] = []

    if (input.daysSinceHarvest === undefined) {
      warnings.push('Days since harvest unknown - freshness estimate may be inaccurate')
    }

    if (qualityModel === 'freshness' && !input.storageConditions) {
      warnings.push('Storage conditions unknown - assuming ambient')
    }

    if (qualityModel === 'brix' && !input.measurements?.brix) {
      warnings.push('Using estimated Brix - actual measurement recommended')
    }

    warnings.push('Vegetable predictor using inferred models - validation needed')

    return warnings
  }

  private scoreToTier(score: number): QualityTier {
    if (score >= 85) return 'artisan'
    if (score >= 70) return 'premium'
    if (score >= 50) return 'standard'
    return 'commodity'
  }
}

// =============================================================================
// Export Predictor Instance
// =============================================================================

export const vegetablePredictor = new VegetablePredictor()
