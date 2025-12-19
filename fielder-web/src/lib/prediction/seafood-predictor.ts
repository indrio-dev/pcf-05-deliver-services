/**
 * Seafood Omega-3 Predictor
 *
 * Implements the CategoryPredictor interface for seafood quality prediction
 * based on omega-3 content (EPA + DHA) as the primary quality metric.
 *
 * Key factors:
 * - Species: Fatty fish (salmon, mackerel) vs lean fish (cod, tilapia)
 * - Source: Wild-caught vs farm-raised (affects omega-6:omega-3 ratio)
 * - Season: Cold water seasons have higher omega-3
 * - Feed type: Farm-raised omega-3 depends entirely on feed
 *
 * Research sources:
 * - Harvard Health: Wild vs farmed omega-3 comparison
 * - NIH Omega-3 Fatty Acids Fact Sheet
 * - Oregon State Seafood omega-3 content database
 *
 * Omega-3 Content Ranges (mg EPA+DHA per 100g):
 * - Mackerel: 2,500-3,000 (highest)
 * - Salmon (wild): 1,500-2,000
 * - Salmon (farmed): 1,000-1,500 (higher fat but worse omega ratio)
 * - Sardines: 1,400-1,800
 * - Anchovies: 1,400-2,000
 * - Herring: 1,700-2,000
 * - Trout: 800-1,200
 * - Tuna: 300-1,200 (varies by species)
 * - Oysters: 400-600
 * - Shrimp: 300-400
 * - Lobster: 200-400
 * - Cod: 200-300 (lean fish)
 * - Tilapia: 100-200 (very low)
 */

import type {
  CategoryPredictor,
  PredictionInput,
  PredictionResult,
  ProductCategory,
  PrimaryMetricType,
  SeafoodPredictionInput,
  SeafoodSourceType,
  SoilContribution,
  HeritageContribution,
  AgriculturalContribution,
  RipenContribution,
  EnrichContribution,
  ModelValidationStatus,
} from './predictor-interface'

import type { QualityTier } from '../constants/quality-tiers'

// =============================================================================
// SEAFOOD SPECIES DATABASE
// =============================================================================

/**
 * Seafood species data with omega-3 content baselines
 */
export interface SeafoodSpecies {
  id: string
  commonName: string
  scientificName?: string
  category: 'fatty_fish' | 'lean_fish' | 'shellfish' | 'crustacean' | 'mollusk'

  // Omega-3 content (mg EPA+DHA per 100g)
  omega3: {
    wild: { min: number; max: number; typical: number }
    farmed?: { min: number; max: number; typical: number }
  }

  // Omega-6:Omega-3 ratio (lower is better)
  omegaRatio: {
    wild: number      // Typically 0.05-0.5 for wild
    farmed?: number   // Often 0.5-2.0 for farmed
  }

  // Seasonal variation
  seasonalPeak?: string[]  // Months when omega-3 is highest
  coldWaterBonus: number   // % increase in cold water months

  // Quality tier baseline
  qualityTier: QualityTier
  notes?: string
}

/**
 * Seafood species database
 */
export const SEAFOOD_SPECIES: Record<string, SeafoodSpecies> = {
  // === FATTY FISH (Highest Omega-3) ===
  atlantic_mackerel: {
    id: 'atlantic_mackerel',
    commonName: 'Atlantic Mackerel',
    scientificName: 'Scomber scombrus',
    category: 'fatty_fish',
    omega3: {
      wild: { min: 2500, max: 3000, typical: 2700 },
    },
    omegaRatio: { wild: 0.08 },
    seasonalPeak: ['11', '12', '1', '2'], // Winter
    coldWaterBonus: 15,
    qualityTier: 'artisan',
    notes: 'Highest omega-3 of common fish. Best in winter.',
  },

  wild_salmon: {
    id: 'wild_salmon',
    commonName: 'Wild Salmon (Pacific)',
    scientificName: 'Oncorhynchus spp.',
    category: 'fatty_fish',
    omega3: {
      wild: { min: 1500, max: 2200, typical: 1800 },
    },
    omegaRatio: { wild: 0.05 },
    seasonalPeak: ['6', '7', '8', '9'], // Summer run
    coldWaterBonus: 10,
    qualityTier: 'artisan',
    notes: 'Premium wild-caught. Sockeye and King highest.',
  },

  farmed_salmon: {
    id: 'farmed_salmon',
    commonName: 'Farmed Atlantic Salmon',
    scientificName: 'Salmo salar',
    category: 'fatty_fish',
    omega3: {
      wild: { min: 1500, max: 2000, typical: 1700 }, // Escaped farmed
      farmed: { min: 1000, max: 1500, typical: 1200 },
    },
    omegaRatio: { wild: 0.05, farmed: 0.7 },
    coldWaterBonus: 5,
    qualityTier: 'standard',
    notes: 'Higher total omega-3 than wild but worse omega-6 ratio.',
  },

  sardines: {
    id: 'sardines',
    commonName: 'Sardines',
    scientificName: 'Sardina pilchardus',
    category: 'fatty_fish',
    omega3: {
      wild: { min: 1400, max: 1800, typical: 1600 },
    },
    omegaRatio: { wild: 0.1 },
    seasonalPeak: ['5', '6', '7', '8'],
    coldWaterBonus: 12,
    qualityTier: 'premium',
    notes: 'Excellent omega-3 source. Low mercury.',
  },

  herring: {
    id: 'herring',
    commonName: 'Atlantic Herring',
    scientificName: 'Clupea harengus',
    category: 'fatty_fish',
    omega3: {
      wild: { min: 1700, max: 2000, typical: 1850 },
    },
    omegaRatio: { wild: 0.08 },
    seasonalPeak: ['10', '11', '12'],
    coldWaterBonus: 15,
    qualityTier: 'premium',
    notes: 'Excellent cold-water fatty fish.',
  },

  anchovies: {
    id: 'anchovies',
    commonName: 'Anchovies',
    scientificName: 'Engraulis encrasicolus',
    category: 'fatty_fish',
    omega3: {
      wild: { min: 1400, max: 2000, typical: 1700 },
    },
    omegaRatio: { wild: 0.1 },
    coldWaterBonus: 10,
    qualityTier: 'premium',
    notes: 'Small fish, low mercury, high omega-3.',
  },

  rainbow_trout: {
    id: 'rainbow_trout',
    commonName: 'Rainbow Trout',
    scientificName: 'Oncorhynchus mykiss',
    category: 'fatty_fish',
    omega3: {
      wild: { min: 900, max: 1300, typical: 1100 },
      farmed: { min: 700, max: 1000, typical: 850 },
    },
    omegaRatio: { wild: 0.15, farmed: 0.6 },
    coldWaterBonus: 10,
    qualityTier: 'premium',
    notes: 'Good freshwater omega-3 source.',
  },

  // === MODERATE OMEGA-3 FISH ===
  albacore_tuna: {
    id: 'albacore_tuna',
    commonName: 'Albacore Tuna',
    scientificName: 'Thunnus alalunga',
    category: 'fatty_fish',
    omega3: {
      wild: { min: 800, max: 1500, typical: 1100 },
    },
    omegaRatio: { wild: 0.2 },
    coldWaterBonus: 8,
    qualityTier: 'premium',
    notes: 'Higher omega-3 than other tuna. Watch mercury.',
  },

  bluefin_tuna: {
    id: 'bluefin_tuna',
    commonName: 'Bluefin Tuna',
    scientificName: 'Thunnus thynnus',
    category: 'fatty_fish',
    omega3: {
      wild: { min: 1000, max: 1800, typical: 1400 },
    },
    omegaRatio: { wild: 0.15 },
    coldWaterBonus: 10,
    qualityTier: 'artisan',
    notes: 'Premium sushi grade. Sustainability concerns.',
  },

  skipjack_tuna: {
    id: 'skipjack_tuna',
    commonName: 'Skipjack Tuna (Light)',
    scientificName: 'Katsuwonus pelamis',
    category: 'lean_fish',
    omega3: {
      wild: { min: 300, max: 600, typical: 450 },
    },
    omegaRatio: { wild: 0.3 },
    coldWaterBonus: 5,
    qualityTier: 'standard',
    notes: 'Common canned tuna. Lower omega-3 than albacore.',
  },

  // === LEAN FISH (Lower Omega-3) ===
  cod: {
    id: 'cod',
    commonName: 'Atlantic Cod',
    scientificName: 'Gadus morhua',
    category: 'lean_fish',
    omega3: {
      wild: { min: 200, max: 350, typical: 280 },
    },
    omegaRatio: { wild: 0.2 },
    coldWaterBonus: 10,
    qualityTier: 'standard',
    notes: 'Lean white fish. Lower omega-3 but excellent protein.',
  },

  tilapia: {
    id: 'tilapia',
    commonName: 'Tilapia',
    scientificName: 'Oreochromis niloticus',
    category: 'lean_fish',
    omega3: {
      wild: { min: 100, max: 200, typical: 150 },
      farmed: { min: 80, max: 150, typical: 110 },
    },
    omegaRatio: { wild: 2.0, farmed: 3.0 },
    coldWaterBonus: 0,
    qualityTier: 'commodity',
    notes: 'Very low omega-3. High omega-6. Not recommended for omega balance.',
  },

  catfish: {
    id: 'catfish',
    commonName: 'Catfish',
    scientificName: 'Ictalurus punctatus',
    category: 'lean_fish',
    omega3: {
      wild: { min: 150, max: 300, typical: 220 },
      farmed: { min: 100, max: 200, typical: 150 },
    },
    omegaRatio: { wild: 1.0, farmed: 2.5 },
    coldWaterBonus: 0,
    qualityTier: 'standard',
    notes: 'Southern staple. Moderate omega-3.',
  },

  // === SHELLFISH & CRUSTACEANS ===
  oysters: {
    id: 'oysters',
    commonName: 'Oysters',
    scientificName: 'Crassostrea spp.',
    category: 'mollusk',
    omega3: {
      wild: { min: 400, max: 700, typical: 550 },
      farmed: { min: 350, max: 600, typical: 475 },
    },
    omegaRatio: { wild: 0.3, farmed: 0.4 },
    seasonalPeak: ['9', '10', '11', '12', '1', '2', '3', '4'], // R months
    coldWaterBonus: 15,
    qualityTier: 'premium',
    notes: 'Excellent for shellfish. Best in cold months.',
  },

  mussels: {
    id: 'mussels',
    commonName: 'Mussels',
    scientificName: 'Mytilus edulis',
    category: 'mollusk',
    omega3: {
      wild: { min: 500, max: 800, typical: 650 },
      farmed: { min: 400, max: 700, typical: 550 },
    },
    omegaRatio: { wild: 0.2, farmed: 0.3 },
    coldWaterBonus: 12,
    qualityTier: 'premium',
    notes: 'Sustainable farmed option. Good omega-3.',
  },

  shrimp: {
    id: 'shrimp',
    commonName: 'Shrimp',
    scientificName: 'Penaeus spp.',
    category: 'crustacean',
    omega3: {
      wild: { min: 300, max: 450, typical: 375 },
      farmed: { min: 200, max: 350, typical: 275 },
    },
    omegaRatio: { wild: 0.5, farmed: 1.5 },
    coldWaterBonus: 8,
    qualityTier: 'standard',
    notes: 'Wild Gulf shrimp preferred for omega profile.',
  },

  lobster: {
    id: 'lobster',
    commonName: 'American Lobster',
    scientificName: 'Homarus americanus',
    category: 'crustacean',
    omega3: {
      wild: { min: 200, max: 400, typical: 300 },
    },
    omegaRatio: { wild: 0.3 },
    seasonalPeak: ['6', '7', '8', '9', '10'],
    coldWaterBonus: 10,
    qualityTier: 'premium',
    notes: 'Maine lobster. Premium but lower omega-3.',
  },

  crab: {
    id: 'crab',
    commonName: 'Crab (various)',
    category: 'crustacean',
    omega3: {
      wild: { min: 350, max: 550, typical: 450 },
    },
    omegaRatio: { wild: 0.3 },
    coldWaterBonus: 10,
    qualityTier: 'premium',
    notes: 'King crab, Dungeness, blue crab all good omega sources.',
  },

  scallops: {
    id: 'scallops',
    commonName: 'Sea Scallops',
    scientificName: 'Placopecten magellanicus',
    category: 'mollusk',
    omega3: {
      wild: { min: 300, max: 500, typical: 400 },
    },
    omegaRatio: { wild: 0.2 },
    coldWaterBonus: 10,
    qualityTier: 'premium',
    notes: 'Dry-packed preferred. Good omega-3 for shellfish.',
  },
}

/**
 * Get a seafood species by ID
 */
export function getSeafoodSpecies(speciesId: string): SeafoodSpecies | undefined {
  return SEAFOOD_SPECIES[speciesId]
}

// =============================================================================
// OMEGA-3 QUALITY TIERS
// =============================================================================

/**
 * Omega-3 quality tier classification (mg per 100g)
 */
export function getOmega3Tier(omega3Mg: number): {
  tier: QualityTier
  description: string
} {
  if (omega3Mg >= 1500) return { tier: 'artisan', description: 'Exceptional omega-3 content (≥1500mg/100g)' }
  if (omega3Mg >= 800) return { tier: 'premium', description: 'High omega-3 content (800-1500mg/100g)' }
  if (omega3Mg >= 400) return { tier: 'standard', description: 'Moderate omega-3 content (400-800mg/100g)' }
  return { tier: 'commodity', description: 'Low omega-3 content (<400mg/100g)' }
}

// =============================================================================
// SEAFOOD PREDICTOR IMPLEMENTATION
// =============================================================================

export class SeafoodPredictor implements CategoryPredictor {
  category: ProductCategory = 'seafood'
  validationStatus: ModelValidationStatus = 'inferred'

  canHandle(input: PredictionInput): boolean {
    return input.category === 'seafood'
  }

  getPrimaryMetricType(): PrimaryMetricType {
    return 'omega_3'
  }

  predict(input: PredictionInput): PredictionResult {
    const seafoodInput = input as SeafoodPredictionInput

    // Get species data
    const species = seafoodInput.speciesId
      ? getSeafoodSpecies(seafoodInput.speciesId)
      : undefined

    // Calculate SHARE pillar contributions
    const soil = this.calculateSoil(seafoodInput, species)
    const heritage = this.calculateHeritage(seafoodInput, species)
    const agricultural = this.calculateAgricultural(seafoodInput, species)
    const ripen = this.calculateRipen(seafoodInput, species)

    // Calculate predicted omega-3
    const predictedOmega3 = this.calculateOmega3(seafoodInput, species)

    // Use actual measurement if available
    const finalOmega3 = seafoodInput.measurements?.omega3ContentMg ?? predictedOmega3

    // Get quality tier
    const tierInfo = getOmega3Tier(finalOmega3)

    // Calculate confidence
    const confidence = this.calculateConfidence(seafoodInput, species)

    // Create Enrich pillar
    const enrich = this.calculateEnrich(seafoodInput, finalOmega3, predictedOmega3)

    // Calculate overall quality score (0-100)
    const qualityScore = this.omega3ToScore(finalOmega3)

    // Collect warnings
    const warnings = this.collectWarnings(seafoodInput, species)

    return {
      qualityScore,
      qualityTier: tierInfo.tier,
      confidence,

      primaryMetric: {
        type: 'omega_3',
        value: finalOmega3,
        unit: 'mg/100g',
        displayName: 'Omega-3 (EPA+DHA)',
        lowerIsBetter: false,
      },

      soil,
      heritage,
      agricultural,
      ripen,
      enrich,

      modelInfo: {
        category: 'seafood',
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
    input: SeafoodPredictionInput,
    species?: SeafoodSpecies
  ): SoilContribution {
    const insights: string[] = []

    // For seafood, "Soil" represents water quality and ecosystem health
    if (input.sourceType === 'wild_caught') {
      insights.push('Wild-caught from natural marine ecosystem')
      if (input.regionId) {
        insights.push(`Catch region: ${input.regionId}`)
      }
    } else {
      insights.push('Farm-raised in aquaculture environment')
      insights.push('Water quality affects omega-3 through feed efficiency')
    }

    return {
      modifier: 0,
      confidence: 0.4,
      details: {
        regionId: input.regionId,
        waterQuality: input.sourceType === 'wild_caught' ? 'pristine' : 'good',
        waterBody: input.regionId,
      },
      insights,
    }
  }

  private calculateHeritage(
    input: SeafoodPredictionInput,
    species?: SeafoodSpecies
  ): HeritageContribution {
    const insights: string[] = []

    if (species) {
      insights.push(`${species.commonName}: ${species.notes || 'Quality seafood species'}`)
      if (species.scientificName) {
        insights.push(`Species: ${species.scientificName}`)
      }

      const omega3Data = input.sourceType === 'wild_caught' || !species.omega3.farmed
        ? species.omega3.wild
        : species.omega3.farmed

      insights.push(
        `Omega-3 range: ${omega3Data.min}-${omega3Data.max}mg/100g (typical: ${omega3Data.typical}mg)`
      )
    } else {
      insights.push('Species not specified - using generic baseline')
    }

    return {
      modifier: 0,
      confidence: species ? 0.8 : 0.4,
      details: {
        speciesId: species?.id,
        speciesName: species?.commonName,
        omega3Baseline: species?.omega3.wild.typical,
        isWildCaught: input.sourceType === 'wild_caught',
      },
      insights,
    }
  }

  private calculateAgricultural(
    input: SeafoodPredictionInput,
    species?: SeafoodSpecies
  ): AgriculturalContribution {
    const insights: string[] = []
    let modifier = 0

    // Source type is the biggest factor (like diet for livestock)
    if (input.sourceType === 'wild_caught') {
      insights.push('Wild-caught: Natural diet produces optimal omega-6:omega-3 ratio')
      if (species?.omegaRatio.wild) {
        insights.push(`Wild omega-6:omega-3 ratio: ${species.omegaRatio.wild}:1 (excellent)`)
      }
    } else {
      insights.push('Farm-raised: Omega profile depends on feed type')
      if (species?.omegaRatio.farmed) {
        insights.push(`Farmed omega-6:omega-3 ratio: ${species.omegaRatio.farmed}:1`)
        if (species.omegaRatio.farmed > 1) {
          insights.push('Higher omega-6 ratio than wild counterpart')
          modifier = -100 // Reduce predicted omega-3
        }
      }

      // Feed type modifier
      if (input.farmFeedType) {
        if (input.farmFeedType.includes('fish') || input.farmFeedType.includes('algae')) {
          insights.push('Fish/algae-based feed: Preserves omega-3 content')
          modifier += 50
        } else if (input.farmFeedType.includes('soy') || input.farmFeedType.includes('grain')) {
          insights.push('Grain/soy-based feed: Reduces omega-3, increases omega-6')
          modifier -= 100
        }
      }
    }

    // Catch method insight
    if (input.catchMethod) {
      insights.push(`Catch method: ${input.catchMethod}`)
    }

    return {
      modifier,
      confidence: 0.7,
      details: {
        sourceType: input.sourceType,
        catchMethod: input.catchMethod,
        farmFeedType: input.farmFeedType,
      },
      insights,
    }
  }

  private calculateRipen(
    input: SeafoodPredictionInput,
    species?: SeafoodSpecies
  ): RipenContribution {
    const insights: string[] = []
    let timingModifier = 0

    // Season affects omega-3 (cold water = higher omega-3)
    if (input.catchSeason && species) {
      const season = input.catchSeason
      const isPeakSeason = species.seasonalPeak?.includes(season)

      if (isPeakSeason) {
        insights.push(`Caught during peak season - optimal omega-3 content`)
        timingModifier = species.coldWaterBonus * 3 // Apply cold water bonus
      } else if (species.seasonalPeak) {
        insights.push(`Off-peak season catch`)
      }

      // Cold months bonus
      const coldMonths = ['11', '12', '1', '2', '3']
      if (coldMonths.includes(season)) {
        insights.push('Cold water season: Fish accumulate more omega-3')
        timingModifier += species.coldWaterBonus * 2
      }
    } else {
      insights.push('Catch season not specified')
    }

    return {
      timingModifier,
      confidence: input.catchSeason ? 0.6 : 0.4,
      details: {
        catchSeason: input.catchSeason,
        harvestStatus: 'optimal', // Seafood is harvested when ready
      },
      insights,
    }
  }

  private calculateEnrich(
    input: SeafoodPredictionInput,
    finalOmega3: number,
    predictedOmega3: number
  ): EnrichContribution {
    const tierInfo = getOmega3Tier(finalOmega3)
    const insights: string[] = []

    insights.push(`Omega-3 (EPA+DHA): ${finalOmega3}mg/100g (${tierInfo.description})`)

    if (input.measurements?.labVerified) {
      insights.push('Lab verified measurement')
      if (Math.abs(finalOmega3 - predictedOmega3) > 300) {
        insights.push(
          `Note: Measured differs from predicted (${predictedOmega3}mg)`
        )
      }
    }

    // Comparison to recommended daily intake
    // AHA recommends 250-500mg EPA+DHA per day
    const servingSize = 100 // grams
    const dailyRec = 500
    const percentDaily = Math.round((finalOmega3 / dailyRec) * 100)
    insights.push(`${servingSize}g serving provides ${percentDaily}% of daily omega-3 target`)

    return {
      verified: input.measurements?.labVerified || false,
      confidence: input.measurements?.labVerified ? 0.95 : 0.6,
      details: {
        primaryMetric: {
          type: 'omega_3',
          value: finalOmega3,
          unit: 'mg/100g',
          displayName: 'Omega-3 (EPA+DHA)',
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

  private calculateOmega3(
    input: SeafoodPredictionInput,
    species: SeafoodSpecies | undefined
  ): number {
    if (!species) {
      // Generic baseline for unknown species
      return input.sourceType === 'wild_caught' ? 600 : 400
    }

    // Get baseline for source type
    const omega3Data = input.sourceType === 'wild_caught' || !species.omega3.farmed
      ? species.omega3.wild
      : species.omega3.farmed

    let predicted = omega3Data.typical

    // Apply seasonal bonus for cold water
    if (input.catchSeason) {
      const coldMonths = ['11', '12', '1', '2', '3']
      if (coldMonths.includes(input.catchSeason)) {
        predicted += (species.coldWaterBonus / 100) * predicted
      }
    }

    // Farm feed penalty/bonus
    if (input.sourceType === 'farm_raised' && input.farmFeedType) {
      if (input.farmFeedType.includes('fish') || input.farmFeedType.includes('algae')) {
        predicted *= 1.1 // 10% bonus for good feed
      } else if (input.farmFeedType.includes('soy') || input.farmFeedType.includes('grain')) {
        predicted *= 0.7 // 30% penalty for grain feed
      }
    }

    // Clamp to species range
    return Math.max(omega3Data.min, Math.min(omega3Data.max, Math.round(predicted)))
  }

  private calculateConfidence(
    input: SeafoodPredictionInput,
    species?: SeafoodSpecies
  ): number {
    let confidence = 0.4

    if (species) confidence += 0.2
    if (input.sourceType) confidence += 0.1
    if (input.catchSeason) confidence += 0.05
    if (input.catchMethod) confidence += 0.05
    if (input.measurements?.labVerified) confidence += 0.3

    return Math.min(0.95, confidence)
  }

  private omega3ToScore(omega3Mg: number): number {
    // 0-3000mg range maps to 0-100
    return Math.min(100, Math.max(0, (omega3Mg / 3000) * 100))
  }

  private collectWarnings(
    input: SeafoodPredictionInput,
    species: SeafoodSpecies | undefined
  ): string[] {
    const warnings: string[] = []

    if (!species) {
      warnings.push('Species not specified - using generic baseline')
    }

    // Tilapia warning
    if (species?.id === 'tilapia') {
      warnings.push('Tilapia has very low omega-3 and unfavorable omega-6 ratio')
    }

    // Farmed with no feed info
    if (input.sourceType === 'farm_raised' && !input.farmFeedType) {
      warnings.push('Feed type unknown for farm-raised - omega-3 varies by feed')
    }

    // High omega-6 ratio warning
    if (species && input.sourceType === 'farm_raised' && species.omegaRatio.farmed) {
      if (species.omegaRatio.farmed > 1) {
        warnings.push(`Farmed ${species.commonName} has higher omega-6 ratio than wild`)
      }
    }

    return warnings
  }
}

// =============================================================================
// Export Predictor Instance
// =============================================================================

export const seafoodPredictor = new SeafoodPredictor()
