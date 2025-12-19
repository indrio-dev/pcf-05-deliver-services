/**
 * Nut Oil Content Predictor
 *
 * Implements the CategoryPredictor interface for nut quality prediction
 * based on oil content as the primary quality metric.
 *
 * Oil content varies dramatically by nut type:
 * - Macadamia: 75-80% (highest)
 * - Pecan: 70-74%
 * - Hazelnut: 60-65%
 * - Walnut: 54-72% (wide range)
 * - Pistachio: ~54%
 * - Almond: ~53%
 * - Peanut: 48-50%
 * - Chestnut: <1% (starch-based, not oil-based)
 *
 * Key factors affecting oil content:
 * - H pillar (Heritage): Cultivar genetics set the ceiling
 * - R pillar (Ripen): Tree age maturity curve (pecans peak 15-75 years)
 * - A pillar (Agricultural): Water stress can concentrate oils
 * - S pillar (Soil): Soil health affects nutrient uptake and tree vigor
 *
 * Formula:
 *   Oil Content = Cultivar_Base + Age_Modifier + Stress_Modifier + Timing_Modifier
 */

import type {
  CategoryPredictor,
  PredictionInput,
  PredictionResult,
  ProductCategory,
  PrimaryMetricType,
  NutPredictionInput,
  SoilContribution,
  HeritageContribution,
  AgriculturalContribution,
  RipenContribution,
  EnrichContribution,
  ModelValidationStatus,
} from './predictor-interface'

import type { QualityTier } from '../constants/quality-tiers'

// =============================================================================
// NUT CULTIVAR DATA
// =============================================================================

/**
 * Nut cultivar data with genetic oil content potential
 */
export interface NutCultivar {
  id: string
  name: string
  nutType: 'tree_nut' | 'ground_nut'
  species: string

  // Oil content genetics (primary quality metric)
  baseOilPct: number      // Baseline oil content at optimal conditions
  minOilPct: number       // Minimum expected
  maxOilPct: number       // Maximum potential

  // Maturity characteristics
  maturityYears: {
    bearing: number       // Years to first bearing
    prime: { min: number; max: number }  // Prime production years
    decline: number       // When quality starts declining
  }

  // Harvest characteristics
  gddToMaturity?: number  // GDD from bloom to shuck split (tree nuts)
  harvestMethod: 'shuck_split' | 'shaking' | 'hand_harvest' | 'calendar'

  // Quality characteristics
  qualityTier: QualityTier
  flavorProfile?: string
  notes?: string
}

/**
 * Nut cultivar database
 */
export const NUT_CULTIVARS: Record<string, NutCultivar> = {
  // === PECANS ===
  desirable_pecan: {
    id: 'desirable_pecan',
    name: 'Desirable Pecan',
    nutType: 'tree_nut',
    species: 'Carya illinoinensis',
    baseOilPct: 71,
    minOilPct: 68,
    maxOilPct: 74,
    maturityYears: { bearing: 6, prime: { min: 15, max: 75 }, decline: 100 },
    gddToMaturity: 3200,
    harvestMethod: 'shaking',
    qualityTier: 'premium',
    flavorProfile: 'Rich, buttery, classic pecan flavor',
    notes: 'Most popular commercial variety',
  },
  stuart_pecan: {
    id: 'stuart_pecan',
    name: 'Stuart Pecan',
    nutType: 'tree_nut',
    species: 'Carya illinoinensis',
    baseOilPct: 70,
    minOilPct: 67,
    maxOilPct: 73,
    maturityYears: { bearing: 8, prime: { min: 20, max: 100 }, decline: 150 },
    gddToMaturity: 3000,
    harvestMethod: 'shaking',
    qualityTier: 'standard',
    flavorProfile: 'Reliable, mild flavor',
    notes: 'Old standard variety, extremely long-lived',
  },

  // === WALNUTS ===
  chandler_walnut: {
    id: 'chandler_walnut',
    name: 'Chandler Walnut',
    nutType: 'tree_nut',
    species: 'Juglans regia',
    baseOilPct: 65,
    minOilPct: 60,
    maxOilPct: 72,
    maturityYears: { bearing: 4, prime: { min: 8, max: 40 }, decline: 60 },
    gddToMaturity: 3000,
    harvestMethod: 'shaking',
    qualityTier: 'premium',
    flavorProfile: 'Mild, versatile, light-colored kernel',
    notes: 'Dominant California variety, 40%+ of production',
  },
  hartley_walnut: {
    id: 'hartley_walnut',
    name: 'Hartley Walnut',
    nutType: 'tree_nut',
    species: 'Juglans regia',
    baseOilPct: 63,
    minOilPct: 58,
    maxOilPct: 68,
    maturityYears: { bearing: 5, prime: { min: 10, max: 35 }, decline: 50 },
    gddToMaturity: 2800,
    harvestMethod: 'shaking',
    qualityTier: 'standard',
    flavorProfile: 'Traditional walnut flavor',
  },

  // === ALMONDS ===
  nonpareil_almond: {
    id: 'nonpareil_almond',
    name: 'Nonpareil Almond',
    nutType: 'tree_nut',
    species: 'Prunus dulcis',
    baseOilPct: 53,
    minOilPct: 50,
    maxOilPct: 56,
    maturityYears: { bearing: 3, prime: { min: 6, max: 25 }, decline: 30 },
    gddToMaturity: 2800,
    harvestMethod: 'shaking',
    qualityTier: 'artisan',
    flavorProfile: 'Sweet, delicate, paper-thin shell',
    notes: 'Premium grade, 40% of California production',
  },
  carmel_almond: {
    id: 'carmel_almond',
    name: 'Carmel Almond',
    nutType: 'tree_nut',
    species: 'Prunus dulcis',
    baseOilPct: 52,
    minOilPct: 49,
    maxOilPct: 55,
    maturityYears: { bearing: 3, prime: { min: 5, max: 20 }, decline: 25 },
    gddToMaturity: 2600,
    harvestMethod: 'shaking',
    qualityTier: 'premium',
    flavorProfile: 'Mild, soft shell',
    notes: 'Primary pollinator for Nonpareil',
  },

  // === HAZELNUTS ===
  barcelona_hazelnut: {
    id: 'barcelona_hazelnut',
    name: 'Barcelona Hazelnut',
    nutType: 'tree_nut',
    species: 'Corylus avellana',
    baseOilPct: 62,
    minOilPct: 58,
    maxOilPct: 66,
    maturityYears: { bearing: 4, prime: { min: 8, max: 40 }, decline: 60 },
    gddToMaturity: 2600,
    harvestMethod: 'shaking',
    qualityTier: 'artisan',
    flavorProfile: 'Intense flavor, Oregon classic',
    notes: 'Heritage variety, susceptible to EFB',
  },
  jefferson_hazelnut: {
    id: 'jefferson_hazelnut',
    name: 'Jefferson Hazelnut',
    nutType: 'tree_nut',
    species: 'Corylus avellana',
    baseOilPct: 64,
    minOilPct: 60,
    maxOilPct: 68,
    maturityYears: { bearing: 3, prime: { min: 7, max: 35 }, decline: 50 },
    gddToMaturity: 2500,
    harvestMethod: 'shaking',
    qualityTier: 'premium',
    flavorProfile: 'High oil content, EFB resistant',
    notes: 'OSU release, disease resistant',
  },

  // === MACADAMIA ===
  hawaii_macadamia: {
    id: 'hawaii_macadamia',
    name: 'Hawaiian Macadamia',
    nutType: 'tree_nut',
    species: 'Macadamia integrifolia',
    baseOilPct: 76,
    minOilPct: 72,
    maxOilPct: 80,
    maturityYears: { bearing: 7, prime: { min: 12, max: 40 }, decline: 60 },
    harvestMethod: 'hand_harvest', // Nuts drop when ripe
    qualityTier: 'artisan',
    flavorProfile: 'Buttery, rich, creamy',
    notes: 'Highest oil content of any nut',
  },

  // === PISTACHIOS ===
  kerman_pistachio: {
    id: 'kerman_pistachio',
    name: 'Kerman Pistachio',
    nutType: 'tree_nut',
    species: 'Pistacia vera',
    baseOilPct: 54,
    minOilPct: 50,
    maxOilPct: 58,
    maturityYears: { bearing: 7, prime: { min: 12, max: 50 }, decline: 80 },
    gddToMaturity: 3600,
    harvestMethod: 'shaking',
    qualityTier: 'premium',
    flavorProfile: 'Rich, green, California grown',
    notes: 'Dominant US variety',
  },

  // === CHESTNUTS (special case - starch-based, not oil-based) ===
  colossal_chestnut: {
    id: 'colossal_chestnut',
    name: 'Colossal Chestnut',
    nutType: 'tree_nut',
    species: 'Castanea spp.',
    baseOilPct: 2,      // Very low - chestnuts are starch-based
    minOilPct: 0.5,
    maxOilPct: 3,
    maturityYears: { bearing: 5, prime: { min: 10, max: 50 }, decline: 80 },
    harvestMethod: 'hand_harvest',
    qualityTier: 'artisan',
    flavorProfile: 'Sweet, starchy, for roasting',
    notes: 'Quality metric is starch content, not oil',
  },

  // === PEANUTS (ground nuts) ===
  virginia_peanut: {
    id: 'virginia_peanut',
    name: 'Virginia Peanut',
    nutType: 'ground_nut',
    species: 'Arachis hypogaea',
    baseOilPct: 48,
    minOilPct: 45,
    maxOilPct: 52,
    maturityYears: { bearing: 0, prime: { min: 0, max: 1 }, decline: 1 },
    harvestMethod: 'calendar',
    qualityTier: 'premium',
    flavorProfile: 'Large kernel, crunchy',
    notes: 'Annual crop, not a tree nut',
  },
}

/**
 * Get a nut cultivar by ID
 */
export function getNutCultivar(cultivarId: string): NutCultivar | undefined {
  return NUT_CULTIVARS[cultivarId]
}

// =============================================================================
// TREE AGE MODIFIERS
// =============================================================================

/**
 * Calculate age modifier for nut trees
 * Oil content tends to peak during prime production years
 */
function getTreeAgeModifier(
  treeAge: number | undefined,
  cultivar: NutCultivar
): { modifier: number; confidence: number; status: string } {
  if (!treeAge) {
    return { modifier: 0, confidence: 0.4, status: 'unknown' }
  }

  const { bearing, prime, decline } = cultivar.maturityYears

  // Not yet bearing
  if (treeAge < bearing) {
    return {
      modifier: -5,
      confidence: 0.3,
      status: `pre-bearing (${treeAge}yr, bearing at ${bearing}yr)`,
    }
  }

  // Young bearing but not prime
  if (treeAge < prime.min) {
    const progress = (treeAge - bearing) / (prime.min - bearing)
    const modifier = -3 * (1 - progress) // Ramps from -3 to 0
    return {
      modifier,
      confidence: 0.6,
      status: `young bearing (${treeAge}yr, prime at ${prime.min}+yr)`,
    }
  }

  // Prime production years
  if (treeAge <= prime.max) {
    // Slight bonus in middle of prime years
    const midPrime = (prime.min + prime.max) / 2
    const distanceFromMid = Math.abs(treeAge - midPrime)
    const primeRange = (prime.max - prime.min) / 2
    const modifier = 2 * (1 - distanceFromMid / primeRange) // Max +2 at peak
    return {
      modifier,
      confidence: 0.85,
      status: `prime (${treeAge}yr, optimal ${prime.min}-${prime.max}yr)`,
    }
  }

  // Past prime but not declining
  if (treeAge < decline) {
    const progress = (treeAge - prime.max) / (decline - prime.max)
    const modifier = -2 * progress // Gradual decline
    return {
      modifier,
      confidence: 0.7,
      status: `mature (${treeAge}yr)`,
    }
  }

  // In decline
  const yearsInDecline = treeAge - decline
  const modifier = Math.max(-8, -3 - yearsInDecline * 0.1)
  return {
    modifier,
    confidence: 0.6,
    status: `declining (${treeAge}yr)`,
  }
}

// =============================================================================
// WATER STRESS MODIFIER
// =============================================================================

/**
 * Water stress can concentrate oil content (deficit irrigation)
 * But excessive stress reduces overall quality
 */
const WATER_STRESS_MODIFIER = {
  none: 0,           // Normal irrigation
  mild: 1.5,         // Mild stress - concentrates oils
  moderate: 2.5,     // Deficit irrigation - optimal for oil
  severe: -2,        // Too much stress - reduces quality
}

// =============================================================================
// HARVEST TIMING MODIFIER
// =============================================================================

/**
 * Harvest timing affects oil content
 * - Early harvest: lower oil (less time to develop)
 * - Optimal: peak oil content
 * - Late: can lose oil to rancidity/kernel damage
 */
const HARVEST_TIMING_MODIFIER: Record<string, number> = {
  early: -3,
  optimal: 0,
  late: -1.5,
}

// =============================================================================
// OIL CONTENT TIERS
// =============================================================================

/**
 * Generic oil content quality tiers
 * Note: These vary by nut type - macadamia 75% is standard, while for almond it's exceptional
 */
export function getOilContentTier(oilPct: number, cultivar?: NutCultivar): {
  tier: QualityTier
  description: string
} {
  if (cultivar) {
    // Cultivar-relative tiers
    // Use more generous thresholds since nut oil ranges are often narrow (e.g., pecan 68-74%)
    // Position 0.5 = middle of range should be "premium" for a good cultivar
    const range = cultivar.maxOilPct - cultivar.minOilPct
    const position = (oilPct - cultivar.minOilPct) / range

    if (position >= 0.8 || oilPct >= cultivar.maxOilPct) {
      return { tier: 'artisan', description: 'Exceptional oil content for this variety' }
    }
    if (position >= 0.4) {
      return { tier: 'premium', description: 'Premium oil content' }
    }
    if (position >= 0.1) {
      return { tier: 'standard', description: 'Standard oil content' }
    }
    return { tier: 'commodity', description: 'Below average oil content' }
  }

  // Generic tiers (matches category-config.ts)
  if (oilPct >= 72) return { tier: 'artisan', description: 'Exceptional oil content' }
  if (oilPct >= 68) return { tier: 'premium', description: 'Premium oil content' }
  if (oilPct >= 64) return { tier: 'standard', description: 'Standard oil content' }
  return { tier: 'commodity', description: 'Below standard oil content' }
}

// =============================================================================
// NUT PREDICTOR IMPLEMENTATION
// =============================================================================

export class NutPredictor implements CategoryPredictor {
  category: ProductCategory = 'nuts'
  validationStatus: ModelValidationStatus = 'inferred' // Needs validation with real data

  canHandle(input: PredictionInput): boolean {
    return input.category === 'nuts'
  }

  getPrimaryMetricType(): PrimaryMetricType {
    return 'oil_content'
  }

  predict(input: PredictionInput): PredictionResult {
    const nutInput = input as NutPredictionInput

    // Get cultivar data
    const cultivar = nutInput.cultivarId
      ? getNutCultivar(nutInput.cultivarId)
      : undefined

    // Calculate SHARE pillar contributions
    const soil = this.calculateSoil(nutInput)
    const heritage = this.calculateHeritage(nutInput, cultivar)
    const agricultural = this.calculateAgricultural(nutInput)
    const ripen = this.calculateRipen(nutInput, cultivar)

    // Calculate predicted oil content
    const predictedOil = this.calculateOilContent(
      nutInput,
      cultivar,
      ripen.timingModifier
    )

    // Use actual measurement if available
    const finalOil = nutInput.measurements?.oilContentPct ?? predictedOil

    // Get quality tier
    const tierInfo = getOilContentTier(finalOil, cultivar)

    // Calculate confidence
    const confidence = this.calculateConfidence(nutInput, cultivar)

    // Create enrich pillar
    const enrich = this.calculateEnrich(nutInput, finalOil, predictedOil, cultivar)

    // Calculate overall quality score (0-100)
    const qualityScore = this.oilToScore(finalOil, cultivar)

    // Collect warnings
    const warnings = this.collectWarnings(nutInput, cultivar, predictedOil)

    return {
      qualityScore,
      qualityTier: tierInfo.tier,
      confidence,

      primaryMetric: {
        type: 'oil_content',
        value: finalOil,
        unit: '%',
        displayName: 'Oil Content',
        lowerIsBetter: false,
      },

      soil,
      heritage,
      agricultural,
      ripen,
      enrich,

      modelInfo: {
        category: 'nuts',
        validationStatus: this.validationStatus,
        warnings,
        lastUpdated: new Date('2024-12-18'),
      },
    }
  }

  // ===========================================================================
  // SHARE Pillar Calculations
  // ===========================================================================

  private calculateSoil(input: NutPredictionInput): SoilContribution {
    const insights: string[] = []

    // Nut trees need well-drained soil
    insights.push('Nut trees require deep, well-drained soil for optimal root development')

    if (input.regionId) {
      insights.push(`Region: ${input.regionId}`)
    }

    return {
      modifier: 0, // Soil affects tree health but we don't have specific data
      confidence: 0.4,
      details: {
        regionId: input.regionId,
        drainageClass: 'good', // Default assumption for nut orchards
      },
      insights,
    }
  }

  private calculateHeritage(
    input: NutPredictionInput,
    cultivar?: NutCultivar
  ): HeritageContribution {
    const insights: string[] = []

    if (cultivar) {
      insights.push(`${cultivar.name}: ${cultivar.flavorProfile || 'Quality nut variety'}`)
      insights.push(`Species: ${cultivar.species}`)
      insights.push(
        `Oil content potential: ${cultivar.minOilPct}-${cultivar.maxOilPct}% (base: ${cultivar.baseOilPct}%)`
      )

      if (cultivar.notes) {
        insights.push(cultivar.notes)
      }

      // Special case for chestnuts (starch-based)
      if (cultivar.id.includes('chestnut')) {
        insights.push('⚠️ Chestnuts are starch-based, not oil-based - different quality metric')
      }
    } else {
      insights.push('Cultivar not specified - using generic nut baseline')
    }

    return {
      modifier: 0, // Cultivar sets the BASE, not a modifier
      confidence: cultivar ? 0.8 : 0.4,
      details: {
        cultivarId: cultivar?.id,
        cultivarName: cultivar?.name,
        heritageIntent: cultivar?.qualityTier === 'artisan' ? 'heritage' : 'commercial',
      },
      insights,
    }
  }

  private calculateAgricultural(input: NutPredictionInput): AgriculturalContribution {
    const insights: string[] = []
    let modifier = 0

    // Water stress modifier
    if (input.waterStress !== undefined) {
      if (input.waterStress) {
        // Mild water stress can concentrate oils (deficit irrigation)
        modifier += WATER_STRESS_MODIFIER.moderate
        insights.push(
          'Deficit irrigation can concentrate oil content (+2-3% potential)'
        )
      } else {
        insights.push('Standard irrigation - consistent but not maximized oil content')
      }
    } else {
      insights.push('Irrigation status unknown')
    }

    return {
      modifier,
      confidence: input.waterStress !== undefined ? 0.6 : 0.4,
      details: {
        cropLoadManaged: true, // Common for commercial nut orchards
      },
      insights,
    }
  }

  private calculateRipen(
    input: NutPredictionInput,
    cultivar?: NutCultivar
  ): RipenContribution {
    const insights: string[] = []
    let timingModifier = 0
    let confidence = 0.5

    // Tree age modifier (for tree nuts only)
    if (cultivar && cultivar.nutType === 'tree_nut') {
      const ageResult = getTreeAgeModifier(input.treeAgeYears, cultivar)
      timingModifier += ageResult.modifier

      if (input.treeAgeYears) {
        insights.push(`Tree age: ${input.treeAgeYears} years (${ageResult.status})`)
        confidence = Math.max(confidence, ageResult.confidence)
      } else {
        insights.push('Tree age not specified')
      }
    }

    // Harvest timing modifier
    if (input.harvestTiming) {
      const harvestMod = HARVEST_TIMING_MODIFIER[input.harvestTiming] || 0
      timingModifier += harvestMod

      switch (input.harvestTiming) {
        case 'early':
          insights.push('Early harvest - reduced oil development time')
          break
        case 'optimal':
          insights.push('Optimal harvest timing - peak oil content')
          break
        case 'late':
          insights.push('Late harvest - risk of quality degradation')
          break
      }
    } else {
      insights.push('Harvest timing not specified')
    }

    return {
      timingModifier,
      confidence,
      details: {
        harvestStatus: this.mapTimingToStatus(input.harvestTiming),
      },
      insights,
    }
  }

  private calculateEnrich(
    input: NutPredictionInput,
    finalOil: number,
    predictedOil: number,
    cultivar?: NutCultivar
  ): EnrichContribution {
    const tierInfo = getOilContentTier(finalOil, cultivar)
    const insights: string[] = []

    insights.push(`Oil content: ${finalOil.toFixed(1)}% (${tierInfo.description})`)

    if (input.measurements?.labVerified) {
      insights.push('Lab verified measurement')
      if (Math.abs(finalOil - predictedOil) > 5) {
        insights.push(
          `Note: Measured differs from predicted (${predictedOil.toFixed(1)}%)`
        )
      }
    }

    // Cultivar-relative assessment
    if (cultivar) {
      const position =
        ((finalOil - cultivar.minOilPct) / (cultivar.maxOilPct - cultivar.minOilPct)) * 100
      if (position >= 90) {
        insights.push(`Near top of genetic potential for ${cultivar.name}`)
      } else if (position <= 30) {
        insights.push(`Below typical for ${cultivar.name} - check growing conditions`)
      }
    }

    return {
      verified: input.measurements?.labVerified || false,
      confidence: input.measurements?.labVerified ? 0.95 : 0.6,
      details: {
        primaryMetric: {
          type: 'oil_content',
          value: finalOil,
          unit: '%',
          displayName: 'Oil Content',
          lowerIsBetter: false,
        },
        labVerified: input.measurements?.labVerified,
      },
      insights,
    }
  }

  // ===========================================================================
  // Calculation Helpers
  // ===========================================================================

  private calculateOilContent(
    input: NutPredictionInput,
    cultivar: NutCultivar | undefined,
    timingModifier: number
  ): number {
    // Start with cultivar baseline or generic
    const baseOil = cultivar?.baseOilPct ?? 60 // Generic baseline

    // Apply water stress modifier
    let stressModifier = 0
    if (input.waterStress) {
      stressModifier = WATER_STRESS_MODIFIER.moderate
    }

    // Calculate predicted oil
    let predicted = baseOil + timingModifier + stressModifier

    // Clamp to cultivar range if known
    if (cultivar) {
      predicted = Math.max(cultivar.minOilPct, Math.min(cultivar.maxOilPct, predicted))
    } else {
      // Generic clamp
      predicted = Math.max(40, Math.min(80, predicted))
    }

    return predicted
  }

  private calculateConfidence(
    input: NutPredictionInput,
    cultivar?: NutCultivar
  ): number {
    let confidence = 0.4

    if (cultivar) confidence += 0.15
    if (input.treeAgeYears) confidence += 0.1
    if (input.harvestTiming) confidence += 0.05
    if (input.waterStress !== undefined) confidence += 0.05
    // Lab verification is high confidence - it's actual measurement
    if (input.measurements?.labVerified) confidence += 0.35

    return Math.min(0.95, confidence)
  }

  private oilToScore(oilPct: number, cultivar?: NutCultivar): number {
    if (cultivar) {
      // Cultivar-relative score
      const position =
        (oilPct - cultivar.minOilPct) / (cultivar.maxOilPct - cultivar.minOilPct)
      return Math.min(100, Math.max(0, position * 100))
    }

    // Generic: 40-75% range maps to 0-100
    return Math.min(100, Math.max(0, ((oilPct - 40) / 35) * 100))
  }

  private mapTimingToStatus(
    timing?: string
  ): 'not_ready' | 'early' | 'optimal' | 'peak' | 'late' | 'past_peak' {
    switch (timing) {
      case 'early':
        return 'early'
      case 'optimal':
        return 'peak'
      case 'late':
        return 'late'
      default:
        return 'optimal'
    }
  }

  private collectWarnings(
    input: NutPredictionInput,
    cultivar: NutCultivar | undefined,
    predictedOil: number
  ): string[] {
    const warnings: string[] = []

    if (!cultivar) {
      warnings.push('Cultivar not specified - using generic baseline')
    }

    if (!input.treeAgeYears && cultivar?.nutType === 'tree_nut') {
      warnings.push('Tree age not specified - age modifier not applied')
    }

    // Special warning for chestnuts
    if (cultivar?.id.includes('chestnut')) {
      warnings.push('Chestnuts use starch content, not oil content, as quality metric')
    }

    // Check if measurement differs significantly from prediction
    if (input.measurements?.oilContentPct) {
      const diff = Math.abs(input.measurements.oilContentPct - predictedOil)
      if (diff > 5) {
        warnings.push(
          `Large difference between measured (${input.measurements.oilContentPct.toFixed(1)}%) and predicted (${predictedOil.toFixed(1)}%) oil content`
        )
      }
    }

    return warnings
  }
}

// =============================================================================
// Export Predictor Instance
// =============================================================================

export const nutPredictor = new NutPredictor()
