/**
 * Honey Quality Predictor
 *
 * Implements the CategoryPredictor interface for honey quality prediction
 * based on diastase number and moisture content as primary metrics.
 *
 * Key quality indicators:
 * - Diastase Number (DN): Enzyme activity, indicates raw/unprocessed state
 *   - Higher DN = more raw, less heated/processed
 *   - Minimum standard: 8 DN (EU), 3 DN (some standards)
 *   - Premium raw honey: 15-30+ DN
 *
 * - Moisture Content:
 *   - USDA Grade A: ≤18.6%
 *   - Acceptable: ≤20%
 *   - Risk of fermentation above 20%
 *
 * - HMF (Hydroxymethylfurfural):
 *   - Forms during heating/storage
 *   - Fresh honey: <15 mg/kg
 *   - Maximum standard: 40 mg/kg
 *
 * SHARE Framework for Honey:
 * - Soil: Region, floral source availability
 * - Heritage: Bee breed, apiary practices
 * - Agricultural: Processing level (raw vs pasteurized)
 * - Ripen: Bloom timing, harvest season
 * - Enrich: Diastase, moisture, HMF measurements
 *
 * Research sources:
 * - USDA Extracted Honey Grades and Standards
 * - Codex Alimentarius honey standards (FAO/WHO)
 * - EU Council Directive 2001/110/EC
 */

import type {
  CategoryPredictor,
  PredictionInput,
  PredictionResult,
  ProductCategory,
  PrimaryMetricType,
  HoneyPredictionInput,
  SoilContribution,
  HeritageContribution,
  AgriculturalContribution,
  RipenContribution,
  EnrichContribution,
  ModelValidationStatus,
} from './predictor-interface'

import type { QualityTier } from '../constants/quality-tiers'

// =============================================================================
// HONEY VARIETAL DATABASE
// =============================================================================

/**
 * Honey varietal data with quality characteristics
 */
export interface HoneyVarietal {
  id: string
  name: string
  floralSource: string

  // Quality characteristics
  typicalDiastase: { min: number; max: number; typical: number }
  typicalMoisture: { min: number; max: number; typical: number }

  // Flavor and appearance
  colorRange: 'water_white' | 'extra_white' | 'white' | 'extra_light_amber' | 'light_amber' | 'amber' | 'dark_amber'
  flavorProfile: string
  crystallization: 'fast' | 'medium' | 'slow' | 'very_slow'

  // Premium status
  qualityTier: QualityTier
  isPremiumVarietal: boolean
  notes?: string
}

/**
 * Honey varietal database
 */
export const HONEY_VARIETALS: Record<string, HoneyVarietal> = {
  // === PREMIUM VARIETALS ===
  manuka: {
    id: 'manuka',
    name: 'Manuka Honey',
    floralSource: 'Manuka bush (Leptospermum scoparium)',
    typicalDiastase: { min: 5, max: 15, typical: 10 },
    typicalMoisture: { min: 16, max: 19, typical: 17.5 },
    colorRange: 'dark_amber',
    flavorProfile: 'Earthy, herbaceous, slightly bitter',
    crystallization: 'medium',
    qualityTier: 'artisan',
    isPremiumVarietal: true,
    notes: 'New Zealand origin. Unique antibacterial properties (MGO/UMF rated).',
  },

  acacia: {
    id: 'acacia',
    name: 'Acacia Honey',
    floralSource: 'Black locust (Robinia pseudoacacia)',
    typicalDiastase: { min: 8, max: 20, typical: 14 },
    typicalMoisture: { min: 15, max: 18, typical: 16.5 },
    colorRange: 'water_white',
    flavorProfile: 'Mild, delicate, floral',
    crystallization: 'very_slow',
    qualityTier: 'artisan',
    isPremiumVarietal: true,
    notes: 'Very light color, slow crystallization. European premium.',
  },

  tupelo: {
    id: 'tupelo',
    name: 'Tupelo Honey',
    floralSource: 'White tupelo (Nyssa ogeche)',
    typicalDiastase: { min: 12, max: 25, typical: 18 },
    typicalMoisture: { min: 17, max: 19, typical: 18 },
    colorRange: 'light_amber',
    flavorProfile: 'Buttery, floral, unique',
    crystallization: 'very_slow',
    qualityTier: 'artisan',
    isPremiumVarietal: true,
    notes: 'Georgia/Florida Panhandle only. Never crystallizes. High fructose.',
  },

  sourwood: {
    id: 'sourwood',
    name: 'Sourwood Honey',
    floralSource: 'Sourwood tree (Oxydendrum arboreum)',
    typicalDiastase: { min: 15, max: 25, typical: 20 },
    typicalMoisture: { min: 16, max: 18, typical: 17 },
    colorRange: 'light_amber',
    flavorProfile: 'Buttery, caramel, anise notes',
    crystallization: 'slow',
    qualityTier: 'artisan',
    isPremiumVarietal: true,
    notes: 'Appalachian Mountains. Limited production, high demand.',
  },

  // === STANDARD VARIETALS ===
  clover: {
    id: 'clover',
    name: 'Clover Honey',
    floralSource: 'Clover (Trifolium spp.)',
    typicalDiastase: { min: 10, max: 20, typical: 15 },
    typicalMoisture: { min: 16, max: 19, typical: 17.5 },
    colorRange: 'extra_white',
    flavorProfile: 'Mild, sweet, classic honey',
    crystallization: 'medium',
    qualityTier: 'standard',
    isPremiumVarietal: false,
    notes: 'Most common US honey. Reliable, mild flavor.',
  },

  wildflower: {
    id: 'wildflower',
    name: 'Wildflower Honey',
    floralSource: 'Mixed wildflowers',
    typicalDiastase: { min: 12, max: 22, typical: 16 },
    typicalMoisture: { min: 16, max: 19, typical: 17.5 },
    colorRange: 'light_amber',
    flavorProfile: 'Complex, varies by region and season',
    crystallization: 'medium',
    qualityTier: 'premium',
    isPremiumVarietal: false,
    notes: 'Multi-floral. Flavor varies by location.',
  },

  orange_blossom: {
    id: 'orange_blossom',
    name: 'Orange Blossom Honey',
    floralSource: 'Citrus blossoms (Citrus spp.)',
    typicalDiastase: { min: 10, max: 18, typical: 14 },
    typicalMoisture: { min: 16, max: 18, typical: 17 },
    colorRange: 'extra_light_amber',
    flavorProfile: 'Citrusy, floral, fruity',
    crystallization: 'medium',
    qualityTier: 'premium',
    isPremiumVarietal: true,
    notes: 'Florida, California, Texas. Distinctive citrus aroma.',
  },

  buckwheat: {
    id: 'buckwheat',
    name: 'Buckwheat Honey',
    floralSource: 'Buckwheat (Fagopyrum esculentum)',
    typicalDiastase: { min: 15, max: 30, typical: 22 },
    typicalMoisture: { min: 16, max: 18, typical: 17 },
    colorRange: 'dark_amber',
    flavorProfile: 'Bold, molasses-like, malty',
    crystallization: 'medium',
    qualityTier: 'premium',
    isPremiumVarietal: true,
    notes: 'Highest antioxidants. Strong flavor, not for everyone.',
  },

  sage: {
    id: 'sage',
    name: 'Sage Honey',
    floralSource: 'California sage (Salvia spp.)',
    typicalDiastase: { min: 10, max: 18, typical: 14 },
    typicalMoisture: { min: 15, max: 17, typical: 16 },
    colorRange: 'white',
    flavorProfile: 'Mild, herbal, clean finish',
    crystallization: 'very_slow',
    qualityTier: 'premium',
    isPremiumVarietal: true,
    notes: 'California specialty. Very slow crystallization.',
  },

  alfalfa: {
    id: 'alfalfa',
    name: 'Alfalfa Honey',
    floralSource: 'Alfalfa (Medicago sativa)',
    typicalDiastase: { min: 8, max: 16, typical: 12 },
    typicalMoisture: { min: 16, max: 19, typical: 17.5 },
    colorRange: 'extra_white',
    flavorProfile: 'Mild, grassy, light',
    crystallization: 'fast',
    qualityTier: 'standard',
    isPremiumVarietal: false,
    notes: 'Common in Western US. Mild flavor, fast crystallization.',
  },

  // === COMMODITY ===
  blended: {
    id: 'blended',
    name: 'Blended Honey',
    floralSource: 'Mixed/unknown sources',
    typicalDiastase: { min: 3, max: 12, typical: 8 },
    typicalMoisture: { min: 17, max: 20, typical: 18.5 },
    colorRange: 'light_amber',
    flavorProfile: 'Generic honey flavor',
    crystallization: 'medium',
    qualityTier: 'commodity',
    isPremiumVarietal: false,
    notes: 'Often imported, blended. Quality varies widely.',
  },
}

/**
 * Get a honey varietal by ID
 */
export function getHoneyVarietal(varietalId: string): HoneyVarietal | undefined {
  return HONEY_VARIETALS[varietalId]
}

// =============================================================================
// QUALITY TIER CLASSIFICATION
// =============================================================================

/**
 * Diastase quality tier classification
 */
export function getDiastaseTier(dn: number): {
  tier: QualityTier
  description: string
} {
  if (dn >= 20) return { tier: 'artisan', description: 'Exceptional enzyme activity (≥20 DN) - truly raw' }
  if (dn >= 12) return { tier: 'premium', description: 'High enzyme activity (12-20 DN) - minimally processed' }
  if (dn >= 8) return { tier: 'standard', description: 'Standard enzyme activity (8-12 DN)' }
  return { tier: 'commodity', description: 'Low enzyme activity (<8 DN) - likely heated/processed' }
}

/**
 * Moisture quality classification
 */
export function getMoistureQuality(moisture: number): {
  quality: 'excellent' | 'good' | 'acceptable' | 'poor'
  description: string
  fermentationRisk: boolean
} {
  if (moisture <= 17) {
    return { quality: 'excellent', description: 'Excellent moisture level (≤17%)', fermentationRisk: false }
  }
  if (moisture <= 18.6) {
    return { quality: 'good', description: 'USDA Grade A moisture (≤18.6%)', fermentationRisk: false }
  }
  if (moisture <= 20) {
    return { quality: 'acceptable', description: 'Acceptable moisture (≤20%)', fermentationRisk: false }
  }
  return { quality: 'poor', description: 'High moisture (>20%) - fermentation risk', fermentationRisk: true }
}

// =============================================================================
// HONEY PREDICTOR IMPLEMENTATION
// =============================================================================

export class HoneyPredictor implements CategoryPredictor {
  category: ProductCategory = 'honey'
  validationStatus: ModelValidationStatus = 'inferred'

  canHandle(input: PredictionInput): boolean {
    return input.category === 'honey'
  }

  getPrimaryMetricType(): PrimaryMetricType {
    return 'diastase'
  }

  predict(input: PredictionInput): PredictionResult {
    const honeyInput = input as HoneyPredictionInput

    // Get varietal data
    const varietal = honeyInput.varietalType
      ? getHoneyVarietal(honeyInput.varietalType)
      : undefined

    // Calculate SHARE pillar contributions
    const soil = this.calculateSoil(honeyInput, varietal)
    const heritage = this.calculateHeritage(honeyInput, varietal)
    const agricultural = this.calculateAgricultural(honeyInput, varietal)
    const ripen = this.calculateRipen(honeyInput, varietal)

    // Calculate predicted diastase
    const predictedDiastase = this.calculateDiastase(honeyInput, varietal)

    // Use actual measurement if available
    const finalDiastase = honeyInput.measurements?.diastaseNumber ?? predictedDiastase

    // Get quality tier
    const tierInfo = getDiastaseTier(finalDiastase)

    // Calculate confidence
    const confidence = this.calculateConfidence(honeyInput, varietal)

    // Create Enrich pillar
    const enrich = this.calculateEnrich(honeyInput, finalDiastase, predictedDiastase, varietal)

    // Calculate overall quality score (0-100)
    const qualityScore = this.diastaseToScore(finalDiastase)

    // Collect warnings
    const warnings = this.collectWarnings(honeyInput, varietal)

    return {
      qualityScore,
      qualityTier: tierInfo.tier,
      confidence,

      primaryMetric: {
        type: 'diastase',
        value: finalDiastase,
        unit: 'DN',
        displayName: 'Diastase Number',
        lowerIsBetter: false,
      },

      soil,
      heritage,
      agricultural,
      ripen,
      enrich,

      modelInfo: {
        category: 'honey',
        validationStatus: this.validationStatus,
        warnings,
        lastUpdated: new Date('2024-12-18'),
      },
    }
  }

  // ===========================================================================
  // SHARE Pillar Calculations
  // ===========================================================================

  private calculateSoil(
    input: HoneyPredictionInput,
    varietal?: HoneyVarietal
  ): SoilContribution {
    const insights: string[] = []

    // For honey, "Soil" represents the floral ecosystem
    if (varietal) {
      insights.push(`Floral source: ${varietal.floralSource}`)
    }

    if (input.regionId) {
      insights.push(`Region: ${input.regionId}`)
      insights.push('Local flora determines honey characteristics')
    } else {
      insights.push('Region not specified')
    }

    return {
      modifier: 0,
      confidence: 0.4,
      details: {
        regionId: input.regionId,
        floralSource: varietal?.floralSource,
      },
      insights,
    }
  }

  private calculateHeritage(
    input: HoneyPredictionInput,
    varietal?: HoneyVarietal
  ): HeritageContribution {
    const insights: string[] = []

    if (varietal) {
      insights.push(`${varietal.name}: ${varietal.flavorProfile}`)
      insights.push(`Color: ${varietal.colorRange.replace(/_/g, ' ')}`)
      insights.push(`Crystallization rate: ${varietal.crystallization}`)

      if (varietal.isPremiumVarietal) {
        insights.push('Premium varietal with distinctive characteristics')
      }

      if (varietal.notes) {
        insights.push(varietal.notes)
      }
    } else {
      insights.push('Varietal not specified - using generic honey baseline')
    }

    return {
      modifier: varietal?.isPremiumVarietal ? 2 : 0,
      confidence: varietal ? 0.7 : 0.4,
      details: {
        varietalId: varietal?.id,
        varietalName: varietal?.name,
        isPremiumVarietal: varietal?.isPremiumVarietal,
      },
      insights,
    }
  }

  private calculateAgricultural(
    input: HoneyPredictionInput,
    varietal?: HoneyVarietal
  ): AgriculturalContribution {
    const insights: string[] = []
    let modifier = 0

    // Raw vs processed is the key factor (like feeding regime for livestock)
    if (input.isRaw === true) {
      insights.push('Raw honey: Unheated, retains natural enzymes and pollen')
      insights.push('Higher diastase activity expected')
      modifier = 5 // Boost predicted diastase
    } else if (input.isRaw === false) {
      insights.push('Processed honey: May be heated/filtered')
      insights.push('Heat degrades diastase enzyme activity')
      modifier = -8 // Reduce predicted diastase
    } else {
      insights.push('Processing status unknown')
    }

    return {
      modifier,
      confidence: input.isRaw !== undefined ? 0.7 : 0.4,
      details: {
        isRaw: input.isRaw,
        processingMethod: input.isRaw ? 'raw' : input.isRaw === false ? 'pasteurized' : undefined,
      },
      insights,
    }
  }

  private calculateRipen(
    input: HoneyPredictionInput,
    varietal?: HoneyVarietal
  ): RipenContribution {
    const insights: string[] = []
    let timingModifier = 0

    // Harvest season affects honey quality
    if (input.harvestSeason) {
      insights.push(`Harvest season: ${input.harvestSeason}`)

      // Spring/early summer honey typically has higher enzyme activity
      const springSeasons = ['spring', 'early_summer', 'may', 'june']
      if (springSeasons.some(s => input.harvestSeason?.toLowerCase().includes(s))) {
        insights.push('Spring/early harvest: Typically higher enzyme activity')
        timingModifier = 2
      }
    } else {
      insights.push('Harvest season not specified')
    }

    return {
      timingModifier,
      confidence: input.harvestSeason ? 0.5 : 0.3,
      details: {
        harvestSeason: input.harvestSeason,
        harvestStatus: 'optimal',
      },
      insights,
    }
  }

  private calculateEnrich(
    input: HoneyPredictionInput,
    finalDiastase: number,
    predictedDiastase: number,
    varietal?: HoneyVarietal
  ): EnrichContribution {
    const tierInfo = getDiastaseTier(finalDiastase)
    const insights: string[] = []

    insights.push(`Diastase Number: ${finalDiastase} DN (${tierInfo.description})`)

    // Moisture quality
    if (input.measurements?.moisturePct) {
      const moistureInfo = getMoistureQuality(input.measurements.moisturePct)
      insights.push(`Moisture: ${input.measurements.moisturePct}% (${moistureInfo.description})`)
      if (moistureInfo.fermentationRisk) {
        insights.push('Warning: High moisture increases fermentation risk')
      }
    }

    if (input.measurements?.labVerified) {
      insights.push('Lab verified measurements')
    }

    // Compare to varietal typical
    if (varietal) {
      if (finalDiastase >= varietal.typicalDiastase.max) {
        insights.push(`Exceptional diastase for ${varietal.name}`)
      } else if (finalDiastase < varietal.typicalDiastase.min) {
        insights.push(`Below typical diastase for ${varietal.name} - may be processed`)
      }
    }

    return {
      verified: input.measurements?.labVerified || false,
      confidence: input.measurements?.labVerified ? 0.95 : 0.5,
      details: {
        primaryMetric: {
          type: 'diastase',
          value: finalDiastase,
          unit: 'DN',
          displayName: 'Diastase Number',
          lowerIsBetter: false,
        },
        moisturePct: input.measurements?.moisturePct,
        labVerified: input.measurements?.labVerified,
      },
      insights,
    }
  }

  // ===========================================================================
  // Calculation Helpers
  // ===========================================================================

  private calculateDiastase(
    input: HoneyPredictionInput,
    varietal: HoneyVarietal | undefined
  ): number {
    // Start with varietal baseline or generic
    let baseDiastase = varietal?.typicalDiastase.typical ?? 12

    // Raw/processed modifier
    if (input.isRaw === true) {
      baseDiastase += 3
    } else if (input.isRaw === false) {
      baseDiastase -= 5
    }

    // Clamp to reasonable range
    if (varietal) {
      baseDiastase = Math.max(
        varietal.typicalDiastase.min - 3,
        Math.min(varietal.typicalDiastase.max + 5, baseDiastase)
      )
    } else {
      baseDiastase = Math.max(3, Math.min(35, baseDiastase))
    }

    return Math.round(baseDiastase)
  }

  private calculateConfidence(
    input: HoneyPredictionInput,
    varietal?: HoneyVarietal
  ): number {
    let confidence = 0.3

    if (varietal) confidence += 0.2
    if (input.isRaw !== undefined) confidence += 0.15
    if (input.harvestSeason) confidence += 0.05
    if (input.measurements?.labVerified) confidence += 0.35

    return Math.min(0.95, confidence)
  }

  private diastaseToScore(dn: number): number {
    // 0-30 DN range maps to 0-100
    return Math.min(100, Math.max(0, (dn / 30) * 100))
  }

  private collectWarnings(
    input: HoneyPredictionInput,
    varietal: HoneyVarietal | undefined
  ): string[] {
    const warnings: string[] = []

    if (!varietal) {
      warnings.push('Varietal not specified - using generic baseline')
    }

    if (input.isRaw === undefined) {
      warnings.push('Raw/processed status unknown - affects diastase prediction')
    }

    // High moisture warning
    if (input.measurements?.moisturePct && input.measurements.moisturePct > 20) {
      warnings.push('Moisture above 20% - risk of fermentation')
    }

    // Low diastase warning (commodity)
    if (varietal?.id === 'blended') {
      warnings.push('Blended honey quality varies - lab testing recommended')
    }

    return warnings
  }
}

// =============================================================================
// Export Predictor Instance
// =============================================================================

export const honeyPredictor = new HoneyPredictor()
