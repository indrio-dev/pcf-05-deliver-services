/**
 * =============================================================================
 * SHARE QUALITY PREDICTION ORCHESTRATOR
 * =============================================================================
 *
 * Ported from: legacy/python_engine/fielder/models/quality.py
 *              legacy/python_engine/fielder/services/quality_predictor.py
 *
 * SHARE is the analytical framework for predicting INTERNAL quality
 * (flavor, nutrition, antioxidants) vs. USDA's external appearance focus.
 *
 * =============================================================================
 * THE UNIFYING THEORY
 * =============================================================================
 *
 * SHARE is built on the soil science theory from Alternative Agriculture
 * (Albrecht, Kempf, Kittredge, Chaboussou) - that perfectly balanced,
 * mineralized soil produces plants that:
 *   - Are naturally pest/disease resistant (trophobiosis)
 *   - Don't attract weeds (balanced soil = weeds unnecessary)
 *   - Maximize nutrient density
 *
 * FIELDER ADDS THE MISSING PIECES:
 *   H (Heritage) - Accounts for the DILUTION EFFECT
 *                  Modern cultivars bred for yield have lower nutrient density
 *                  Heritage cultivars = highest genetic potential per piece
 *
 *   R (Ripen)   - Accounts for PEAK HARVEST WINDOW
 *                  Even with best S+H, timing determines when you capture
 *                  the peak annual flavor/nutrition potential
 *
 * THE COMPLETE FRAMEWORK:
 *   S - Soil science foundation (from Alternative Ag)
 *   H - Heritage genetics (Fielder addition - dilution effect)
 *   A - Minimized when S is optimized (trophobiosis insight)
 *   R - Peak harvest timing (Fielder addition - annual window)
 *   E - Verification of both primary AND secondary nutrition
 *
 * =============================================================================
 * THE FIELDER THESIS (Unique in the world)
 * =============================================================================
 *
 * CURRENT STATE OF EACH CAMP:
 *
 * ORGANIC:
 *   - Soil they THINK is great (but often lacks mineralization)
 *   - Average genetics (not heritage-focused)
 *   - Low A inputs
 *   - Claims high E, but what's high is SECONDARY nutrition (polyphenols, antioxidants)
 *   - PRIMARY nutrition (Brix/minerals/vitamins) often NOT high
 *
 * CONVENTIONAL:
 *   - Average soil + precise annual fertility
 *   - Average genetics
 *   - High A inputs (compensates for lower S)
 *   - Can MEET OR EXCEED organic in PRIMARY nutrition (Brix/minerals/vitamins)
 *   - Lower in SECONDARY nutrition (polyphenols, antioxidants)
 *
 * ALTERNATIVE AG (Soil Science School):
 *   - The BEST soil (mineralized, ACRES USA, Albrecht, BioNutrient)
 *   - But often DON'T emphasize heritage cultivars (H pillar gap)
 *
 * FIELDER'S SYNTHESIS (No one else is doing this):
 *   Best S (Alternative Ag mineralized soil science)
 *   + Best H (Heritage cultivars - highest genetic potential)
 *   + Minimal A (best S + best H need fewer inputs)
 *   + Optimal R (proper harvest timing)
 *   = Highest E in BOTH primary AND secondary nutrition
 *
 * =============================================================================
 * WHY BEST S REDUCES A INPUTS (The Science)
 * =============================================================================
 *
 * TROPHOBIOSIS THEORY (Francis Chaboussou):
 *   - Pests feed on amino acids and simple sugars in plant sap
 *   - Healthy plants convert these into complete proteins + complex carbohydrates
 *   - Pests CANNOT DIGEST complex molecules → "A pest starves on a healthy plant"
 *   - Imbalanced soil → imbalanced plant → pest/disease magnet
 *
 * PLANT HEALTH PYRAMID (John Kempf / Advancing Eco Agriculture):
 *   Level 1: Complete Photosynthesis → Soil fungal disease resistance
 *   Level 2: Complete Protein Synthesis → Larval/sucking insect resistance
 *   Level 3: Lipid Synthesis → Airborne disease resistance
 *   Level 4: Secondary Metabolites → Beetle/chewing insect resistance
 *   → Each level requires specific mineral balance in soil
 *
 * WEEDS AS INDICATORS:
 *   - Weeds perform a FUNCTION (mechanical or nutritional)
 *   - They're "dynamic accumulators" drawing up minerals soil is deficient in
 *   - Balanced soil → weeds not needed → no herbicides needed
 *
 * ALBRECHT'S CHAIN:
 *   Soil deficiency → Plant deficiency → Animal deficiency →
 *   Animal disease → Human deficiency → Human disease
 *
 * THE INSIGHT:
 *   Advanced soil health (mineralized) is truly THE foundation that:
 *   - Reduces need for pesticides (plants naturally resistant)
 *   - Reduces need for herbicides (weeds don't thrive in balanced soil)
 *   - Minimizes A pillar inputs overall
 *   - Yet MAXIMIZES E (Enrich) in both primary AND secondary nutrition
 *
 * =============================================================================
 * HIERARCHICAL + ITERATIVE MODEL: S → H → A → R → E
 * =============================================================================
 *
 * GENETIC CEILING (cannot be exceeded):
 *   H (Heritage)       - Cultivar + rootstock sets the MAXIMUM potential
 *                        → Commodity H can't be overcome even with perfect S+A
 *
 * COMPENSATORY RELATIONSHIP (S ↔ A):
 *   S (Soil Health) and A (Agricultural) can COMPENSATE for each other:
 *
 *   | Scenario                    | S (Soil)  | A (Inputs) | Result     |
 *   |-----------------------------|-----------|------------|------------|
 *   | Annual precise fertility    | Average   | High       | Good Brix  |
 *   | Organic soil banking        | Good      | Lower      | Good Brix  |
 *   | Alternative Ag/mineralized  | Best      | Optimized  | BEST Brix  |
 *
 * TIMING AND VERIFICATION:
 *   R (Ripen)          - Express or waste the S+H+A potential
 *   E (Enrich)         - Proof: PRIMARY (Brix/minerals/vitamins) + SECONDARY (polyphenols/antioxidants)
 *
 * Core Formula:
 *   Peak Brix = Cultivar_Base + Rootstock_Mod + Age_Mod + Timing_Mod
 */

import { getCropPhenology, getBloomDate, CropPhenology } from '../constants/crop-phenology'
import { getRootstockBrixModifier, Rootstock } from '../constants/rootstocks'
import {
  getCultivarProfile,
  CultivarQualityProfile,
  QualityTier,
  HeritageIntent,
  inferTierFromBrix,
  getPostHarvestBehavior,
  PostHarvestBehavior,
} from '../constants/quality-tiers'
import { calculateCumulativeGDD, predictBrixFromGDD, predictHarvestWindow } from './gdd'
import {
  selectAlgorithm,
  getMethodologyDefinition,
  type RAlgorithmType,
  type EMetricType,
  type AlgorithmSelection,
} from '../constants/ripening-methodology'

// =============================================================================
// TYPES
// =============================================================================

export interface SoilContribution {
  score: number              // 0-100
  modifier: number           // -0.5 to +0.5 Brix adjustment
  factors: {
    organicMatter?: number
    ph?: number
    drainageClass?: string
  }
  confidence: number         // 0-1
}

export interface HeritageContribution {
  cultivarId: string
  cultivarName: string
  baseBrix: number           // Cultivar's genetic ceiling
  qualityTier: QualityTier
  rootstockId?: string
  rootstockModifier: number  // -0.8 to +0.6
  confidence: number
}

export interface AgriculturalContribution {
  modifier: number           // -0.5 to +0.5
  factors: {
    // Fertility strategy - shows S↔A pillar interconnectivity
    fertilityStrategy?: {
      approach: string       // Where grower invests: A pillar (annual) vs S pillar (soil banking)
      coverCropping?: boolean
      compostApplication?: boolean
      mineralizedSoil?: boolean      // Key differentiator for nutrition
    }

    // Pest management - separate axis, NOT deleterious to nutrition
    pestManagement?: 'conventional' | 'ipm' | 'organic' | 'no_spray'

    // Produce practices
    irrigationType?: string
    cropLoadManaged?: boolean

    // Universal
    residueTested?: boolean

    // Livestock practices
    feedingRegime?: {
      diet: string
      organicGrainWarning?: boolean  // True if organic cert + grain-fed (quality concern)
    }
    animalWelfare?: string
  }
  warnings: string[]
  insights: string[]         // Educational notes about SHARE interconnectivity
  confidence: number
}

export interface RipenContribution {
  currentGDD: number
  gddToMaturity: number
  gddToPeak: number
  percentToMaturity: number
  percentToPeak: number
  timingModifier: number     // -0.8 to +0.2
  harvestStatus: 'pre_season' | 'approaching' | 'harvest_window' | 'peak' | 'late_season' | 'post_season'
  daysToHarvest?: number
  daysToPeak?: number
  postHarvestBehavior: PostHarvestBehavior
  confidence: number
}

export interface EnrichMeasurement {
  // === PRIMARY NUTRITION (Brix, minerals, vitamins) ===
  // Conventional can meet/exceed organic here with precise annual fertility
  // Best achieved with: Best S (mineralized) + Best H (heritage genetics)
  actualBrix?: number
  titratableAcid?: number
  brixAcidRatio?: number
  mineralContent?: {
    calcium?: number
    magnesium?: number
    potassium?: number
    iron?: number
    zinc?: number
  }
  vitaminContent?: {
    vitaminC?: number
    vitaminA?: number
    // etc.
  }

  // === SECONDARY NUTRITION (polyphenols, antioxidants) ===
  // Organic often higher here (stress-induced compounds)
  // Best achieved with: Best S + Best H + Optimal R (timing)
  polyphenols?: number
  antioxidantCapacity?: number   // ORAC or similar
  flavonoids?: number
  carotenoids?: number

  // === LIVESTOCK MEASUREMENTS ===
  // Omega ratio is THE quality differentiator for meat/dairy
  // Grass-fed ~3:1, feedlot ~20:1 (from Alex's Edacious lab testing)
  omega6To3Ratio?: number
  omegaQualityTier?: 'exceptional' | 'premium' | 'standard' | 'commodity'
  marbling?: number              // 1-12 scale for beef
  fatContent?: number            // Percentage
  proteinContent?: number        // Percentage

  // === FRESHNESS ===
  daysSinceHarvest?: number

  // === VERIFICATION ===
  labVerified: boolean
  selfReported: boolean
  labName?: string               // e.g., "Edacious", "Texas A&M", "BioNutrient Institute"
  testDate?: Date
}

export interface QualityPredictionResult {
  // Core prediction
  predictedBrix: number
  predictedQualityScore: number      // 0-100
  predictedTier: QualityTier
  confidence: number                  // 0-1

  // SHARE breakdown
  soil: SoilContribution
  heritage: HeritageContribution
  agricultural: AgriculturalContribution
  ripen: RipenContribution
  enrich?: EnrichMeasurement

  // Timing
  optimalHarvestDate?: Date
  harvestWindowStart?: Date
  harvestWindowEnd?: Date
  daysToPeak?: number
  freshnessWindowDays?: number

  // R Methodology selection
  rMethodology?: {
    algorithmType: RAlgorithmType
    predictsMetric: EMetricType
    modelConfidence: 'high' | 'medium' | 'low'
    notes: string
    requiredInputs: string[]
  }

  // Metadata
  predictionBasis: string            // What data the prediction is based on
  warnings: string[]
}

export interface QualityPredictionInput {
  cultivarId: string
  regionId: string

  // Optional: more specific data improves prediction
  rootstockId?: string
  treeAgeYears?: number
  bloomDate?: Date                    // Override calculated bloom date

  // Soil data (if available)
  soil?: {
    organicMatterPct?: number
    ph?: number
    drainageClass?: 'poor' | 'moderate' | 'good' | 'excellent'
  }

  // Farm practices
  practices?: {
    // === FERTILITY STRATEGY (Shows S↔A interconnectivity) ===
    // This demonstrates the relationship between Soil Health (S) and Agricultural Practices (A):
    // - Annual fertility focus: Invest in A pillar inputs each season, less S pillar building
    // - Long-term soil banking: Invest in S pillar, which changes what A practices look like
    //
    // Conventional/IPM → tends toward annual fertility management
    // Organic/Alternative → tends toward long-term soil building
    fertilityStrategy?: {
      approach: 'annual_fertility' | 'soil_banking' | 'mineralized_soil_science'
      // annual_fertility: Conventional/IPM approach - input-output calculations each season
      //                   Focus on A pillar inputs, less investment in building S pillar
      // soil_banking: Organic/regenerative approach - long-term carbon/organic matter building
      //               Focus on S pillar investment, which then influences A practices
      // mineralized_soil_science: Alternative Ag (ACRES USA, Albrecht, BioNutrient, Dan Kittredge)
      //                           Long-term S focus + soil science + mineralization

      coverCropping?: boolean         // Cover crops for soil health (S pillar investment)
      compostApplication?: boolean    // Organic matter additions (S pillar investment)
      mineralizedSoil?: boolean       // Key differentiator - actual mineralization program
    }

    // === PEST MANAGEMENT (separate from soil - not deleterious to nutrition) ===
    // Pesticides/herbicides don't reduce nutritional quality
    // IPM practitioners often have same pragmatic mindset as alternative ag
    pestManagement?: 'conventional' | 'ipm' | 'organic' | 'no_spray'

    // === PRODUCE-SPECIFIC ===
    irrigationType?: 'drip' | 'flood' | 'sprinkler' | 'rainfed'
    cropLoadManaged?: boolean         // Thinning for tree fruit

    // === UNIVERSAL ===
    residueTested?: boolean           // Lab-tested for pesticide residues

    // === LIVESTOCK-SPECIFIC ===
    feedingRegime?: {
      diet: 'grass_only' | 'pasture_forage' | 'grass_supplemented' | 'grain_finished' | 'grain_fed'
      finishingMonths?: number        // Months on finishing diet
      isOrganicGrain?: boolean        // Flag: organic certification often means grain-fed
    }
    animalWelfare?: 'pasture_raised' | 'free_range' | 'cage_free' | 'conventional'
    noAntibiotics?: boolean
    noHormones?: boolean
  }

  // Actual measurements (if available)
  measurements?: {
    // Produce
    brix?: number
    acid?: number
    daysSinceHarvest?: number

    // Livestock - omega ratio is THE quality differentiator
    omega6To3Ratio?: number       // Grass-fed ~3:1, feedlot ~20:1
    marbling?: number             // 1-12 scale for beef
    fatContent?: number
    proteinContent?: number

    // Verification
    labVerified?: boolean
    labName?: string              // e.g., "Edacious", "Texas A&M"
    testDate?: Date
  }

  // For GDD calculation
  currentDate?: Date
  currentGDD?: number                 // If already calculated externally
}

// =============================================================================
// OMEGA RATIO CLASSIFICATION (E Pillar - Livestock)
// =============================================================================

/**
 * Classify omega-6:omega-3 ratio quality tier.
 *
 * The omega ratio is THE quality differentiator for meat/dairy:
 * - Grass-fed animals: ~3:1 (optimal for human health)
 * - Feedlot animals: ~20:1 (pro-inflammatory)
 *
 * This ratio is measurable PROOF of feeding regime and quality.
 * From Alex's Edacious lab testing and research.
 */
export function classifyOmegaRatio(ratio: number): {
  tier: 'exceptional' | 'premium' | 'standard' | 'commodity'
  description: string
  healthImplication: string
} {
  if (ratio <= 3) {
    return {
      tier: 'exceptional',
      description: 'Optimal grass-fed ratio (≤3:1)',
      healthImplication: 'Anti-inflammatory profile, optimal for human health',
    }
  } else if (ratio <= 6) {
    return {
      tier: 'premium',
      description: 'Good grass-finished ratio (3-6:1)',
      healthImplication: 'Balanced fatty acid profile',
    }
  } else if (ratio <= 12) {
    return {
      tier: 'standard',
      description: 'Mixed feeding regime (6-12:1)',
      healthImplication: 'Moderate omega balance, some supplementation may benefit',
    }
  } else {
    return {
      tier: 'commodity',
      description: 'Feedlot/grain-fed ratio (>12:1)',
      healthImplication: 'Pro-inflammatory profile, excess omega-6',
    }
  }
}

// =============================================================================
// AGE MODIFIERS
// =============================================================================

/**
 * Tree age affects quality expression.
 *
 * Young trees: Still developing root system, lower quality
 * Prime trees (8-18 years): Full genetic expression
 * Mature trees: May decline slightly but often stable
 *
 * Research sources: UF/IFAS tree maturity studies
 */
export function getAgeModifier(ageYears: number | undefined): { modifier: number; confidence: number } {
  if (ageYears === undefined) {
    return { modifier: 0, confidence: 0.5 }  // Unknown age - assume neutral
  }

  // Age modifier table (Brix points)
  if (ageYears <= 2) {
    return { modifier: -0.8, confidence: 0.9 }
  } else if (ageYears <= 4) {
    return { modifier: -0.5, confidence: 0.9 }
  } else if (ageYears <= 7) {
    return { modifier: -0.2, confidence: 0.85 }
  } else if (ageYears <= 18) {
    return { modifier: 0.0, confidence: 0.95 }  // Prime
  } else if (ageYears <= 25) {
    return { modifier: -0.2, confidence: 0.8 }
  } else {
    return { modifier: -0.3, confidence: 0.7 }  // Very old trees
  }
}

// =============================================================================
// TIMING MODIFIER
// =============================================================================

/**
 * Calculate timing modifier based on harvest position in window.
 *
 * Peak window (middle 50% of harvest window): No penalty
 * Outside peak: Parabolic penalty increases with distance
 *
 * Formula: penalty = max_penalty × (d / h)²
 * Where:
 *   d = days from peak center
 *   h = half-width of peak window
 *   max_penalty = 0.8 (for very early/late harvest)
 */
export function getTimingModifier(
  currentGDD: number,
  gddToMaturity: number,
  gddToPeak: number,
  gddWindow: number
): { modifier: number; status: RipenContribution['harvestStatus'] } {
  const gddWindowEnd = gddToMaturity + gddWindow
  const peakCenter = gddToPeak
  const peakHalfWidth = gddWindow * 0.25  // Peak is middle 50%

  // Determine status
  let status: RipenContribution['harvestStatus']
  let modifier: number

  if (currentGDD < gddToMaturity * 0.8) {
    status = 'pre_season'
    modifier = -0.8  // Max penalty for very early
  } else if (currentGDD < gddToMaturity) {
    status = 'approaching'
    // Linear ramp from -0.5 to 0 as we approach maturity
    const progress = (currentGDD - gddToMaturity * 0.8) / (gddToMaturity * 0.2)
    modifier = -0.5 * (1 - progress)
  } else if (currentGDD < gddToPeak - peakHalfWidth) {
    status = 'harvest_window'
    // Small penalty for early harvest window
    const distanceFromPeakStart = gddToPeak - peakHalfWidth - currentGDD
    const windowWidth = gddToPeak - peakHalfWidth - gddToMaturity
    modifier = -0.2 * (distanceFromPeakStart / windowWidth)
  } else if (currentGDD <= gddToPeak + peakHalfWidth) {
    status = 'peak'
    modifier = 0  // No penalty at peak
  } else if (currentGDD < gddWindowEnd) {
    status = 'late_season'
    // Penalty increases as we move past peak
    const distancePastPeak = currentGDD - (gddToPeak + peakHalfWidth)
    const lateWindowWidth = gddWindowEnd - (gddToPeak + peakHalfWidth)
    modifier = -0.3 * (distancePastPeak / lateWindowWidth)
  } else {
    status = 'post_season'
    modifier = -0.5  // Significant penalty for very late
  }

  return { modifier, status }
}

// =============================================================================
// SOIL CONTRIBUTION
// =============================================================================

/**
 * Calculate soil contribution to quality.
 *
 * Healthy soil = better nutrient availability = higher quality potential.
 * This is often the LEAST known factor but affects everything.
 */
export function calculateSoilContribution(
  soil?: QualityPredictionInput['soil']
): SoilContribution {
  // If no soil data, return neutral with low confidence
  if (!soil) {
    return {
      score: 50,
      modifier: 0,
      factors: {},
      confidence: 0.3,
    }
  }

  let score = 50
  const factors: SoilContribution['factors'] = {}

  // Organic matter contribution
  if (soil.organicMatterPct !== undefined) {
    factors.organicMatter = soil.organicMatterPct
    if (soil.organicMatterPct >= 5.0) {
      score += 15
    } else if (soil.organicMatterPct >= 3.0) {
      score += 10
    } else if (soil.organicMatterPct >= 2.0) {
      score += 5
    } else {
      score -= 5
    }
  }

  // pH contribution (ideal 6.0-7.0 for most crops)
  if (soil.ph !== undefined) {
    factors.ph = soil.ph
    if (soil.ph >= 6.0 && soil.ph <= 7.0) {
      score += 10
    } else if (soil.ph >= 5.5 && soil.ph <= 7.5) {
      score += 5
    } else {
      score -= 10
    }
  }

  // Drainage contribution
  if (soil.drainageClass) {
    factors.drainageClass = soil.drainageClass
    switch (soil.drainageClass) {
      case 'excellent': score += 10; break
      case 'good': score += 5; break
      case 'moderate': break
      case 'poor': score -= 10; break
    }
  }

  // Convert score to modifier (-0.5 to +0.5)
  const modifier = (score - 50) / 100

  // Confidence based on data completeness
  let confidence = 0.3
  if (soil.organicMatterPct !== undefined) confidence += 0.2
  if (soil.ph !== undefined) confidence += 0.15
  if (soil.drainageClass) confidence += 0.15

  return {
    score: Math.min(100, Math.max(0, score)),
    modifier: Math.min(0.5, Math.max(-0.5, modifier)),
    factors,
    confidence: Math.min(1, confidence),
  }
}

// =============================================================================
// AGRICULTURAL PRACTICES CONTRIBUTION
// =============================================================================

/**
 * Calculate agricultural practices contribution.
 *
 * KEY INSIGHT: S↔A PILLAR INTERCONNECTIVITY
 *
 * The fertility strategy demonstrates the relationship between Soil (S) and Agricultural (A) pillars:
 *
 * ANNUAL FERTILITY (Conventional/IPM tendency):
 *   - Grower invests in A pillar inputs each season
 *   - Input-output calculations: how much fertility for X yield
 *   - Less investment in building long-term S pillar
 *
 * SOIL BANKING (Organic/Regenerative tendency):
 *   - Grower invests in S pillar (long-term soil capital)
 *   - This changes what A practices look like over time
 *   - Focus on carbon building, cover crops, compost
 *
 * NEITHER IS INHERENTLY BETTER FOR NUTRITION:
 *   - Different strategies, different time horizons
 *   - ONLY mineralization actually impacts nutrition outcomes
 *   - Alternative Ag (ACRES USA, Albrecht, BioNutrient, Dan Kittredge) =
 *     soil banking + soil science + mineralization = actual nutrition focus
 *
 * OTHER KEY POINTS:
 *   - Pesticides/herbicides are NOT deleterious to nutrition (separate axis)
 *   - IPM practitioners often share pragmatic, all-tools mindset of alternative ag
 *   - Practices can help long-term, but CANNOT overcome bad genetics (H pillar)
 */
export function calculateAgriculturalContribution(
  practices?: QualityPredictionInput['practices']
): AgriculturalContribution {
  if (!practices) {
    return {
      modifier: 0,
      factors: {},
      warnings: [],
      insights: [],
      confidence: 0.3,
    }
  }

  let modifier = 0
  const factors: AgriculturalContribution['factors'] = {}
  const warnings: string[] = []
  const insights: string[] = []

  // === FERTILITY STRATEGY (Shows S↔A pillar interconnectivity) ===
  // This demonstrates the relationship between Soil Health (S) and Agricultural Practices (A):
  // - Annual fertility: Invest in A pillar inputs each season, less S pillar building
  // - Soil banking: Invest in S pillar, which then influences what A practices look like
  if (practices.fertilityStrategy) {
    factors.fertilityStrategy = {
      approach: practices.fertilityStrategy.approach,
      coverCropping: practices.fertilityStrategy.coverCropping,
      compostApplication: practices.fertilityStrategy.compostApplication,
      mineralizedSoil: practices.fertilityStrategy.mineralizedSoil,
    }

    // Annual vs Long-term are DIFFERENT STRATEGIES showing where grower invests
    // Conventional/IPM → tends toward annual fertility (A pillar focus)
    // Organic/Alternative → tends toward soil banking (S pillar focus)
    // Neither inherently produces higher nutrition - ONLY mineralization does that
    switch (practices.fertilityStrategy.approach) {
      case 'mineralized_soil_science':
        // Alternative Ag: ACRES USA, Albrecht, BioNutrient, Eco Ag, Dan Kittredge
        // Long-term S pillar investment + soil science + mineralization
        modifier += 0.15  // Bonus is for mineralization focus
        insights.push('Mineralized soil science approach (Alternative Ag) integrates long-term S pillar investment with soil science for actual nutrition outcomes')
        break
      case 'soil_banking':
        // Organic/regenerative model - long-term S pillar investment
        // Builds soil capital, but without mineralization doesn't inherently increase nutrition
        insights.push('Soil banking approach invests in S pillar (long-term soil capital) - influences what A practices look like over time')
        if (!practices.fertilityStrategy.mineralizedSoil) {
          insights.push('Long-term soil building is valuable, but mineralization is the key differentiator for nutrition outcomes')
        }
        // No base modifier - approach alone doesn't determine nutrition
        break
      case 'annual_fertility':
        // Conventional/IPM model - annual A pillar input-output calculations
        // Less investment in building S pillar, more focus on seasonal inputs
        insights.push('Annual fertility approach focuses on A pillar inputs each season - different strategy than soil banking, not inherently worse for nutrition')
        // No base modifier - approach alone doesn't determine nutrition
        break
    }

    // S pillar investments (regardless of overall approach)
    if (practices.fertilityStrategy.coverCropping) {
      modifier += 0.05
      insights.push('Cover cropping represents S pillar investment')
    }
    if (practices.fertilityStrategy.compostApplication) {
      modifier += 0.05
      insights.push('Compost application represents S pillar investment')
    }
    // Mineralization is THE key differentiator for nutrition
    if (practices.fertilityStrategy.mineralizedSoil) {
      modifier += 0.1
      insights.push('Soil mineralization program is THE key differentiator for actual nutrition outcomes')
    }
  }

  // === PEST MANAGEMENT (Separate axis - NOT deleterious to nutrition) ===
  // Pesticides/herbicides don't reduce nutritional quality
  // This is about mindset/approach signal, not nutrition impact
  if (practices.pestManagement) {
    factors.pestManagement = practices.pestManagement
    switch (practices.pestManagement) {
      case 'no_spray':
        // Premium positioning, but NOT because pesticides hurt nutrition
        modifier += 0.05
        break
      case 'organic':
      case 'ipm':
        // IPM practitioners often have same pragmatic, all-tools mindset as alternative ag
        // Both signal thoughtful approach - neither penalizes nutrition
        modifier += 0.02
        break
      case 'conventional':
        // NO PENALTY - pesticides are not deleterious from Enrich perspective
        break
    }
  }

  // === PRODUCE: CROP MANAGEMENT ===
  if (practices.cropLoadManaged) {
    factors.cropLoadManaged = true
    modifier += 0.2  // Thinning is critical for tree fruit quality
  }

  if (practices.irrigationType) {
    factors.irrigationType = practices.irrigationType
    switch (practices.irrigationType) {
      case 'drip': modifier += 0.1; break
      case 'rainfed': modifier += 0.05; break  // Natural timing
      case 'sprinkler': break
      case 'flood': modifier -= 0.1; break
    }
  }

  // === LIVESTOCK: FEEDING REGIME ===
  // "Organic meat often signals GRAIN-fed (red flag for quality)"
  if (practices.feedingRegime) {
    factors.feedingRegime = {
      diet: practices.feedingRegime.diet,
    }

    switch (practices.feedingRegime.diet) {
      case 'grass_only':
        modifier += 0.3  // Best for omega ratios and quality
        break
      case 'pasture_forage':
        modifier += 0.25
        break
      case 'grass_supplemented':
        modifier += 0.15
        break
      case 'grain_finished':
        modifier += 0.05  // Improves marbling but hurts omega ratio
        break
      case 'grain_fed':
        modifier -= 0.1   // Commodity approach
        break
    }

    // ORGANIC GRAIN WARNING
    if (practices.feedingRegime.isOrganicGrain) {
      factors.feedingRegime.organicGrainWarning = true
      warnings.push('Organic certification with grain feeding may not indicate premium quality - grass-finished typically yields better omega ratios')
    }
  }

  // === LIVESTOCK: ANIMAL WELFARE ===
  if (practices.animalWelfare) {
    factors.animalWelfare = practices.animalWelfare
    switch (practices.animalWelfare) {
      case 'pasture_raised': modifier += 0.15; break
      case 'free_range': modifier += 0.1; break
      case 'cage_free': modifier += 0.05; break
      case 'conventional': break
    }
  }

  // === UNIVERSAL: RESIDUE TESTING ===
  if (practices.residueTested) {
    factors.residueTested = true
    // Adds confidence, not modifier - residue-free is about safety, not nutrition
  }

  // === LIVESTOCK: CLEAN PRACTICES ===
  if (practices.noAntibiotics) {
    modifier += 0.05
  }
  if (practices.noHormones) {
    modifier += 0.05
  }

  // Cap modifier at ±0.5
  modifier = Math.min(0.5, Math.max(-0.5, modifier))

  // Confidence based on data completeness
  let confidence = 0.3
  if (factors.fertilityStrategy) confidence += 0.2
  if (factors.pestManagement || factors.feedingRegime) confidence += 0.15
  if (factors.cropLoadManaged || factors.animalWelfare) confidence += 0.1
  if (factors.irrigationType) confidence += 0.1
  if (factors.residueTested) confidence += 0.1

  return {
    modifier,
    factors,
    warnings,
    insights,
    confidence: Math.min(0.9, confidence),
  }
}

// =============================================================================
// MAIN PREDICTION FUNCTION
// =============================================================================

/**
 * Predict quality using the SHARE framework.
 *
 * Combines all five pillars to generate a comprehensive quality prediction.
 */
export function predictQuality(input: QualityPredictionInput): QualityPredictionResult {
  const warnings: string[] = []
  let predictionBasis = ''

  // === HERITAGE (H) ===
  const cultivarProfile = getCultivarProfile(input.cultivarId)
  let baseBrix: number
  let qualityTier: QualityTier

  if (cultivarProfile) {
    baseBrix = cultivarProfile.researchAvgBrix ?? cultivarProfile.researchPeakBrix ?? 10.0
    qualityTier = cultivarProfile.qualityTier
    predictionBasis = `Cultivar research data for ${cultivarProfile.cultivarName}`
  } else {
    baseBrix = 10.0  // Default assumption
    qualityTier = 'standard'
    warnings.push(`Unknown cultivar '${input.cultivarId}' - using default Brix estimate`)
    predictionBasis = 'Generic defaults (unknown cultivar)'
  }

  // Rootstock modifier
  const rootstockMod = getRootstockBrixModifier(input.rootstockId)
  if (input.rootstockId && rootstockMod === 0 && input.rootstockId !== 'unknown') {
    warnings.push(`Unknown rootstock '${input.rootstockId}' - no modifier applied`)
  }

  // Age modifier
  const ageResult = getAgeModifier(input.treeAgeYears)

  const heritage: HeritageContribution = {
    cultivarId: input.cultivarId,
    cultivarName: cultivarProfile?.cultivarName ?? input.cultivarId,
    baseBrix,
    qualityTier,
    rootstockId: input.rootstockId,
    rootstockModifier: rootstockMod,
    confidence: cultivarProfile ? 0.85 : 0.5,
  }

  // === SOIL (S) ===
  const soil = calculateSoilContribution(input.soil)
  if (!input.soil) {
    warnings.push('No soil data provided - using neutral estimate')
  }

  // === AGRICULTURAL (A) ===
  const agricultural = calculateAgriculturalContribution(input.practices)
  if (!input.practices) {
    warnings.push('No farm practice data - using neutral estimate')
  }

  // === R METHODOLOGY SELECTION ===
  // Determine which ripening algorithm to use based on product category
  // This maps product type to the appropriate prediction model and E metric
  const cropType = cultivarProfile?.cropType ?? input.cultivarId
  // Map cropType to ShareProfileCategory (e.g., 'orange' -> 'citrus', 'pecan' -> 'nuts')
  const categoryMapping: Record<string, string> = {
    // Citrus types
    orange: 'citrus', grapefruit: 'citrus', lemon: 'citrus', lime: 'citrus', tangerine: 'citrus', mandarin: 'citrus',
    // Stone fruit
    peach: 'stone_fruit', plum: 'stone_fruit', cherry: 'stone_fruit', apricot: 'stone_fruit', nectarine: 'stone_fruit',
    // Pome fruit
    apple: 'pome_fruit', pear: 'pome_fruit',
    // Berries
    blueberry: 'berry', strawberry: 'berry', raspberry: 'berry', blackberry: 'berry',
    // Nuts
    pecan: 'nuts', walnut: 'nuts', almond: 'nuts', pistachio: 'nuts', hazelnut: 'nuts',
    // Melon
    watermelon: 'melon', cantaloupe: 'melon', honeydew: 'melon',
    // Tropical
    mango: 'tropical', papaya: 'tropical', pineapple: 'tropical', banana: 'tropical', avocado: 'tropical',
    // Animal products
    beef: 'beef', bison: 'bison', pork: 'pork', chicken: 'poultry', turkey: 'poultry', eggs: 'eggs', dairy: 'dairy',
    // Seafood
    oyster: 'seafood', crab: 'seafood', shrimp: 'seafood', fish: 'seafood', salmon: 'seafood',
    // Other
    coffee: 'coffee', honey: 'honey',
  }
  const category = categoryMapping[cropType.toLowerCase()] ?? cropType.toLowerCase()
  const rMethodologySelection = selectAlgorithm(category as import('../constants/share-profiles').ShareProfileCategory)

  // Add warning if model needs validation
  if (rMethodologySelection.modelConfidence === 'low') {
    warnings.push(`R methodology for '${category}' needs validation - predictions may be less accurate`)
  }

  // === RIPEN (R) ===
  const phenology = getCropPhenology(
    cultivarProfile?.cropType ?? input.cultivarId,
    input.regionId
  )

  let ripen: RipenContribution
  let harvestWindowStart: Date | undefined
  let harvestWindowEnd: Date | undefined
  let optimalHarvestDate: Date | undefined

  if (phenology) {
    const currentDate = input.currentDate ?? new Date()
    const year = currentDate.getFullYear()
    const bloomDate = input.bloomDate ?? getBloomDate(
      cultivarProfile?.cropType ?? input.cultivarId,
      input.regionId,
      year
    )

    // Estimate current GDD if not provided
    let currentGDD = input.currentGDD
    if (currentGDD === undefined) {
      // Estimate based on average GDD accumulation
      if (bloomDate) {
        const daysSinceBloom = Math.floor(
          (currentDate.getTime() - bloomDate.getTime()) / (1000 * 60 * 60 * 24)
        )
        // Rough estimate: 20 GDD/day for citrus, 15 for stone fruit
        const avgGddPerDay = phenology.gddBase >= 55 ? 22 : 18
        currentGDD = Math.max(0, daysSinceBloom * avgGddPerDay)
      } else {
        currentGDD = 0
        warnings.push('Cannot estimate GDD without bloom date')
      }
    }

    const timingResult = getTimingModifier(
      currentGDD,
      phenology.gddToMaturity,
      phenology.gddToPeak,
      phenology.gddWindow
    )

    // Estimate days to harvest/peak
    const avgGddPerDay = phenology.gddBase >= 55 ? 22 : 18
    const daysToHarvest = currentGDD < phenology.gddToMaturity
      ? Math.ceil((phenology.gddToMaturity - currentGDD) / avgGddPerDay)
      : undefined
    const daysToPeak = currentGDD < phenology.gddToPeak
      ? Math.ceil((phenology.gddToPeak - currentGDD) / avgGddPerDay)
      : undefined

    // Calculate harvest window dates
    if (bloomDate) {
      const daysToMaturity = Math.ceil(phenology.gddToMaturity / avgGddPerDay)
      const daysToWindowEnd = Math.ceil((phenology.gddToMaturity + phenology.gddWindow) / avgGddPerDay)
      const daysToPeakFromBloom = Math.ceil(phenology.gddToPeak / avgGddPerDay)

      harvestWindowStart = new Date(bloomDate)
      harvestWindowStart.setDate(bloomDate.getDate() + daysToMaturity)

      harvestWindowEnd = new Date(bloomDate)
      harvestWindowEnd.setDate(bloomDate.getDate() + daysToWindowEnd)

      optimalHarvestDate = new Date(bloomDate)
      optimalHarvestDate.setDate(bloomDate.getDate() + daysToPeakFromBloom)
    }

    // Determine post-harvest behavior
    const maturityType = cultivarProfile?.maturityType ?? 'tree_fruit_non_climacteric'
    const postHarvestBehavior = getPostHarvestBehavior(maturityType)

    ripen = {
      currentGDD,
      gddToMaturity: phenology.gddToMaturity,
      gddToPeak: phenology.gddToPeak,
      percentToMaturity: Math.min(100, Math.round((currentGDD / phenology.gddToMaturity) * 100)),
      percentToPeak: Math.min(100, Math.round((currentGDD / phenology.gddToPeak) * 100)),
      timingModifier: timingResult.modifier,
      harvestStatus: timingResult.status,
      daysToHarvest,
      daysToPeak,
      postHarvestBehavior,
      confidence: input.currentGDD !== undefined ? 0.9 : 0.6,
    }
  } else {
    // No phenology data - use defaults
    warnings.push(`No phenology data for '${input.cultivarId}' in '${input.regionId}'`)
    ripen = {
      currentGDD: input.currentGDD ?? 0,
      gddToMaturity: 2000,
      gddToPeak: 2300,
      percentToMaturity: 0,
      percentToPeak: 0,
      timingModifier: 0,
      harvestStatus: 'pre_season',
      postHarvestBehavior: 'non_climacteric',
      confidence: 0.3,
    }
  }

  // === ENRICH (E) ===
  // This is the PROOF layer - actual measurements that validate predictions
  let enrich: EnrichMeasurement | undefined

  // Handle produce measurements (Brix)
  if (input.measurements?.brix !== undefined) {
    enrich = {
      actualBrix: input.measurements.brix,
      titratableAcid: input.measurements.acid,
      brixAcidRatio: input.measurements.acid
        ? Math.round((input.measurements.brix / input.measurements.acid) * 10) / 10
        : undefined,
      daysSinceHarvest: input.measurements.daysSinceHarvest,
      labVerified: input.measurements.labVerified ?? false,
      selfReported: !input.measurements.labVerified,
      labName: input.measurements.labName,
      testDate: input.measurements.testDate,
    }
    predictionBasis = 'Actual Brix measurement' + (enrich.labVerified ? ' (lab verified)' : ' (self-reported)')
  }

  // Handle livestock measurements (Omega ratio is THE quality differentiator)
  if (input.measurements?.omega6To3Ratio !== undefined) {
    const omegaClass = classifyOmegaRatio(input.measurements.omega6To3Ratio)

    enrich = {
      ...enrich,
      omega6To3Ratio: input.measurements.omega6To3Ratio,
      omegaQualityTier: omegaClass.tier,
      marbling: input.measurements.marbling,
      fatContent: input.measurements.fatContent,
      proteinContent: input.measurements.proteinContent,
      labVerified: input.measurements.labVerified ?? false,
      selfReported: !input.measurements.labVerified,
      labName: input.measurements.labName,
      testDate: input.measurements.testDate,
    }

    predictionBasis = `Omega-6:3 ratio ${input.measurements.omega6To3Ratio}:1 (${omegaClass.description})` +
      (enrich.labVerified ? ' - lab verified' : '')

    // Add warning if omega ratio contradicts feeding regime claim
    if (input.practices?.feedingRegime) {
      const claimedDiet = input.practices.feedingRegime.diet
      if ((claimedDiet === 'grass_only' || claimedDiet === 'pasture_forage') &&
          input.measurements.omega6To3Ratio > 6) {
        warnings.push(`Omega ratio (${input.measurements.omega6To3Ratio}:1) inconsistent with claimed ${claimedDiet} diet - expected <6:1`)
      }
      if ((claimedDiet === 'grain_fed' || claimedDiet === 'grain_finished') &&
          input.measurements.omega6To3Ratio < 6) {
        // This is actually good - verification that quality is better than expected
        predictionBasis += ' - quality exceeds expectations for feeding regime'
      }
    }
  }

  // === CALCULATE PREDICTED BRIX ===
  let predictedBrix: number

  if (enrich?.actualBrix !== undefined) {
    // Use actual measurement
    predictedBrix = enrich.actualBrix
  } else {
    // Predict from factors
    predictedBrix = baseBrix
      + rootstockMod
      + ageResult.modifier
      + soil.modifier
      + agricultural.modifier
      + ripen.timingModifier

    // Ensure reasonable bounds
    predictedBrix = Math.max(6, Math.min(20, predictedBrix))
  }

  // === CALCULATE QUALITY SCORE ===
  let qualityScore = 50  // Baseline

  // Brix contribution (0-40 points)
  if (predictedBrix >= 14) qualityScore += 40
  else if (predictedBrix >= 12) qualityScore += 30
  else if (predictedBrix >= 10) qualityScore += 20
  else if (predictedBrix >= 8) qualityScore += 10

  // Heritage intent bonus - nuanced scoring based on breeding focus
  // "Heritage equals flavor and nutrition, not yield"
  if (cultivarProfile?.heritageIntent) {
    switch (cultivarProfile.heritageIntent) {
      case 'heirloom_quality':
        qualityScore += 12  // Pre-1950 AND high quality = best
        break
      case 'true_heritage':
        qualityScore += 10  // Selected for flavor/nutrition
        break
      case 'modern_nutrient':
        qualityScore += 8   // Modern but nutrition-focused (e.g., Cara Cara)
        break
      case 'modern_flavor':
        qualityScore += 6   // Modern but flavor-focused (e.g., Honeycrisp)
        break
      case 'heirloom_utility':
        qualityScore += 2   // Old but not quality-focused
        break
      case 'commercial':
        // No bonus - bred for yield/shipping
        break
    }
  } else if (cultivarProfile?.isHeritage || cultivarProfile?.isHeirloom) {
    // Fallback for profiles without heritageIntent
    qualityScore += 10
  }

  // Timing bonus
  if (ripen.harvestStatus === 'peak') {
    qualityScore += 10
  } else if (ripen.harvestStatus === 'harvest_window') {
    qualityScore += 5
  }

  qualityScore = Math.min(100, qualityScore)

  // === CALCULATE OVERALL CONFIDENCE ===
  const confidenceFactors = [
    heritage.confidence * 0.3,
    soil.confidence * 0.15,
    agricultural.confidence * 0.1,
    ripen.confidence * 0.25,
    ageResult.confidence * 0.1,
  ]
  let confidence = confidenceFactors.reduce((a, b) => a + b, 0)

  // Boost confidence if we have actual measurement
  if (enrich?.actualBrix !== undefined) {
    confidence = Math.min(1, confidence + 0.2)
  }

  // === INFER TIER FROM PREDICTED BRIX ===
  const predictedTier = enrich?.actualBrix !== undefined
    ? inferTierFromBrix(enrich.actualBrix)
    : qualityTier

  return {
    predictedBrix: Math.round(predictedBrix * 10) / 10,
    predictedQualityScore: Math.round(qualityScore),
    predictedTier,
    confidence: Math.round(confidence * 100) / 100,
    soil,
    heritage,
    agricultural,
    ripen,
    enrich,
    rMethodology: {
      algorithmType: rMethodologySelection.algorithmType,
      predictsMetric: rMethodologySelection.predictsMetric,
      modelConfidence: rMethodologySelection.modelConfidence,
      notes: rMethodologySelection.notes,
      requiredInputs: rMethodologySelection.requiredInputs,
    },
    optimalHarvestDate,
    harvestWindowStart,
    harvestWindowEnd,
    daysToPeak: ripen.daysToPeak,
    freshnessWindowDays: calculateFreshnessWindow(cultivarProfile?.maturityType),
    predictionBasis,
    warnings,
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Calculate freshness window based on crop type.
 *
 * How long after harvest does the product maintain quality?
 */
function calculateFreshnessWindow(
  maturityType?: string
): number {
  switch (maturityType) {
    case 'leafy_green':
      return 5
    case 'berry_non_climacteric':
      return 7
    case 'tree_fruit_climacteric':
      return 14
    case 'tree_fruit_non_climacteric':
      return 21  // Citrus holds well
    case 'tropical_climacteric':
      return 10
    case 'root_vegetable':
      return 30
    case 'nut':
      return 180  // Nuts store well
    default:
      return 14
  }
}

/**
 * Compare quality predictions for multiple cultivars.
 */
export function compareCultivars(
  cultivarIds: string[],
  regionId: string,
  commonOptions?: Partial<QualityPredictionInput>
): QualityPredictionResult[] {
  return cultivarIds.map(cultivarId =>
    predictQuality({
      cultivarId,
      regionId,
      ...commonOptions,
    })
  )
}

/**
 * Find the best harvest time for a cultivar in a region.
 */
export function findOptimalHarvestTime(
  cultivarId: string,
  regionId: string,
  year?: number
): {
  harvestWindowStart: Date
  harvestWindowEnd: Date
  peakStart: Date
  peakEnd: Date
  recommendation: string
} | undefined {
  const cultivarProfile = getCultivarProfile(cultivarId)
  const cropType = cultivarProfile?.cropType ?? cultivarId
  const phenology = getCropPhenology(cropType, regionId)

  if (!phenology) return undefined

  const targetYear = year ?? new Date().getFullYear()
  const bloomDate = getBloomDate(cropType, regionId, targetYear)

  if (!bloomDate) return undefined

  // Calculate GDD accumulation rate (estimate)
  const avgGddPerDay = phenology.gddBase >= 55 ? 22 : 18

  // Calculate key dates
  const daysToMaturity = Math.ceil(phenology.gddToMaturity / avgGddPerDay)
  const daysToPeak = Math.ceil(phenology.gddToPeak / avgGddPerDay)
  const daysToWindowEnd = Math.ceil((phenology.gddToMaturity + phenology.gddWindow) / avgGddPerDay)

  const harvestWindowStart = new Date(bloomDate)
  harvestWindowStart.setDate(bloomDate.getDate() + daysToMaturity)

  const harvestWindowEnd = new Date(bloomDate)
  harvestWindowEnd.setDate(bloomDate.getDate() + daysToWindowEnd)

  // Peak is middle 50% of window
  const peakStart = new Date(bloomDate)
  peakStart.setDate(bloomDate.getDate() + daysToPeak - Math.ceil(phenology.gddWindow * 0.25 / avgGddPerDay))

  const peakEnd = new Date(bloomDate)
  peakEnd.setDate(bloomDate.getDate() + daysToPeak + Math.ceil(phenology.gddWindow * 0.25 / avgGddPerDay))

  const recommendation = `For optimal quality, harvest ${cultivarProfile?.cultivarName ?? cultivarId} between ${
    peakStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } and ${
    peakEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }. The window opens ${
    harvestWindowStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } and closes ${
    harvestWindowEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }.`

  return {
    harvestWindowStart,
    harvestWindowEnd,
    peakStart,
    peakEnd,
    recommendation,
  }
}
