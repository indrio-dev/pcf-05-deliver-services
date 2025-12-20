/**
 * Seed-Based Product Nutrition Theory
 *
 * This module documents the theoretical framework for predicting quality
 * in products where we consume the seed (coffee, cacao, nuts) rather than
 * the fruit flesh (citrus, berries).
 *
 * Core Insights:
 * 1. Fruit Brix correlates with seed nutrient accumulation (same source, parallel sinks)
 * 2. Fruit accumulates PRIMARY nutrition, seed accumulates SECONDARY nutrition
 * 3. Seed compounds are defensive (anti-nutrients) that require TRANSFORMATION to unlock
 * 4. Fruit is the seed's germination package (nutrient delivery system)
 * 5. Tree maturity determines reproductive energy allocation
 *
 * Research Basis:
 * - Cacao pod maturity → bean polyphenol correlation (PMC, 2018)
 * - Coffee cherry Brix as harvest indicator (industry practice)
 * - Plant source-sink physiology (BioNutrient Food Association)
 * - Seed filling and nutrient accumulation (IntechOpen)
 */

// =============================================================================
// THEORETICAL FRAMEWORK
// =============================================================================

/**
 * PRINCIPLE 1: Fruit-Seed Correlation (Same Source, Parallel Sinks)
 *
 * The tree is a single photosynthetic system. When conditions are good:
 * - More photosynthesis → More sucrose production
 * - Sucrose goes to ALL sinks (fruit AND seed)
 * - High fruit Brix indicates high seed nutrient accumulation
 *
 * Evidence:
 * - Cacao: As pods mature (higher sugar), beans accumulate more polyphenols,
 *   caffeine, and theobromine. Proanthocyanidins increased 69%, caffeine 74%,
 *   theobromine 70% from immature to mature pods.
 * - Coffee: Industry measures cherry Brix (18-26°Bx) as harvest indicator
 *   regardless of processing method (even washed producers measure it)
 * - Citrus seeds: Contain naringin, limonoids, polyphenols - parallel to fruit
 *
 * ```
 *                     TREE (Photosynthetic Source)
 *                              │
 *                    SUCROSE PRODUCTION
 *                              │
 *                 ┌────────────┴────────────┐
 *                 ▼                         ▼
 *            FRUIT SINK               SEED SINK
 *          (Cherry Brix)           (Bean nutrients)
 *                 │                         │
 *                 └─────── CORRELATE ───────┘
 *                    (same upstream driver)
 * ```
 */
export interface FruitSeedCorrelation {
  /**
   * Fruit quality metric (measured at harvest)
   */
  fruitBrix: number

  /**
   * Confidence that fruit Brix correlates with seed quality
   * Based on plant physiology principles
   */
  correlationConfidence: number

  /**
   * Expected seed quality tier based on fruit Brix
   */
  expectedSeedTier: 'exceptional' | 'premium' | 'standard' | 'commodity'
}

/**
 * PRINCIPLE 2: Primary vs Secondary Nutrition Distribution
 *
 * Fruit and seed serve different biological purposes, so they accumulate
 * different types of compounds:
 *
 * FRUIT (attract dispersal agents):
 * - Sugars (energy, sweetness)
 * - Organic acids (flavor)
 * - Vitamins (especially C)
 * - Carotenoids (color attraction)
 * → PRIMARY NUTRITION (directly bioavailable)
 *
 * SEED (survive and germinate):
 * - Polyphenols (UV protection, antimicrobial)
 * - Alkaloids (pest deterrent - caffeine, theobromine)
 * - Tannins (anti-digestive)
 * - Lipids (energy reserve for germination)
 * - Phytic acid (mineral binding)
 * → SECONDARY NUTRITION (often locked behind anti-nutrients)
 *
 * ```
 *           FRUIT                          SEED
 *           ─────                          ────
 *     Primary nutrition             Secondary nutrition
 *   (sugars, acids, vitamins)    (polyphenols, alkaloids, lipids)
 *            │                              │
 *            │                              │
 *     Ready to consume              LOCKED behind anti-nutrients
 *            │                              │
 *            ▼                              ▼
 *        Eat raw                    REQUIRES TRANSFORMATION
 *                                   to become bioavailable
 * ```
 */
export interface NutritionDistribution {
  /**
   * Primary nutrition in the fruit
   */
  primary: {
    sugars: number // Brix or % TSS
    acids: number // % titratable acidity
    vitamins?: Record<string, number>
  }

  /**
   * Secondary nutrition in the seed
   */
  secondary: {
    polyphenols?: number // mg/g
    alkaloids?: number // mg/100g (caffeine, theobromine)
    lipids?: number // % fat content
    tannins?: number // mg/g
  }
}

/**
 * PRINCIPLE 3: Seeds Contain Anti-Nutrients (Defense Compounds)
 *
 * The compounds in seeds are often "anti-nutrients" or natural pesticides
 * because they're designed to:
 * 1. NOT be eaten (bitter, toxic compounds)
 * 2. OR survive digestion and germinate elsewhere
 *
 * | Compound         | Found In           | Biological Purpose              |
 * |------------------|--------------------|---------------------------------|
 * | Caffeine         | Coffee, cacao      | Insecticide - kills/deters pests|
 * | Theobromine      | Cacao              | Pest deterrent                  |
 * | Tannins          | Coffee, cacao, nuts| Anti-digestive, makes unpalatable|
 * | Phytic acid      | Nuts, seeds, grains| Mineral binding                 |
 * | Chlorogenic acids| Coffee             | Antimicrobial, UV protection    |
 * | Naringin         | Citrus seeds       | Extremely bitter                |
 * | Limonoids        | Citrus seeds       | Pest deterrent                  |
 *
 * TRANSFORMATION (fermentation, roasting, soaking) neutralizes these defenses
 * and makes the secondary nutrition bioavailable.
 */
export interface AntiNutrientProfile {
  compound: string
  type: 'alkaloid' | 'tannin' | 'phytate' | 'phenolic_acid' | 'bitter_compound'
  biologicalPurpose: string
  transformationRequired: string // How to neutralize it
  transformedBenefit: string // What it becomes after transformation
}

/**
 * Anti-nutrient profiles for common seed-based products
 */
export const ANTI_NUTRIENT_PROFILES: Record<string, AntiNutrientProfile[]> = {
  coffee: [
    {
      compound: 'Caffeine',
      type: 'alkaloid',
      biologicalPurpose: 'Insecticide - kills/deters insects',
      transformationRequired: 'Roasting (reduces slightly)',
      transformedBenefit: 'Stimulant, cognitive enhancer',
    },
    {
      compound: 'Chlorogenic acids',
      type: 'phenolic_acid',
      biologicalPurpose: 'Antimicrobial, UV protection',
      transformationRequired: 'Light roasting preserves, dark roasting degrades',
      transformedBenefit: 'Antioxidant, blood sugar regulation',
    },
    {
      compound: 'Tannins',
      type: 'tannin',
      biologicalPurpose: 'Astringent, deters consumption',
      transformationRequired: 'Roasting reduces',
      transformedBenefit: 'Antioxidant (in moderation)',
    },
  ],
  cacao: [
    {
      compound: 'Theobromine',
      type: 'alkaloid',
      biologicalPurpose: 'Pest deterrent',
      transformationRequired: 'Fermentation + roasting',
      transformedBenefit: 'Mild stimulant, vasodilator',
    },
    {
      compound: 'Caffeine',
      type: 'alkaloid',
      biologicalPurpose: 'Insecticide',
      transformationRequired: 'Fermentation reduces',
      transformedBenefit: 'Stimulant (lower than coffee)',
    },
    {
      compound: 'Proanthocyanidins',
      type: 'tannin',
      biologicalPurpose: 'Astringent, antimicrobial',
      transformationRequired: 'Fermentation reduces bitterness',
      transformedBenefit: 'Powerful antioxidant',
    },
  ],
  citrus_seeds: [
    {
      compound: 'Naringin',
      type: 'bitter_compound',
      biologicalPurpose: 'Extremely bitter - deters consumption',
      transformationRequired: 'Extraction concentrates beneficial compounds',
      transformedBenefit: 'Antimicrobial, antioxidant (GSE)',
    },
    {
      compound: 'Limonoids',
      type: 'bitter_compound',
      biologicalPurpose: 'Pest deterrent, bitter',
      transformationRequired: 'Extraction',
      transformedBenefit: 'Anticancer potential, antioxidant',
    },
  ],
  nuts: [
    {
      compound: 'Phytic acid',
      type: 'phytate',
      biologicalPurpose: 'Binds minerals - prevents nutrient theft',
      transformationRequired: 'Soaking, sprouting, roasting',
      transformedBenefit: 'Minerals become bioavailable',
    },
    {
      compound: 'Tannins',
      type: 'tannin',
      biologicalPurpose: 'Astringent, deters consumption',
      transformationRequired: 'Roasting reduces',
      transformedBenefit: 'Antioxidant',
    },
  ],
}

/**
 * PRINCIPLE 4: Fruit as Germination Package
 *
 * The fruit isn't just "bait for animals" - it's the complete starter kit
 * for the seed. When the fruit falls and decomposes:
 *
 * 1. Flesh decomposes
 * 2. Nutrients release into soil
 * 3. Creates nutrient-rich microenvironment
 * 4. Seed germinates in its own "starter pack"
 *
 * | Fruit Component | Germination Function                    |
 * |-----------------|----------------------------------------|
 * | Sugars          | Energy for cell division, root emergence|
 * | Minerals        | Building blocks (K, P, Mg for enzymes) |
 * | Organic acids   | pH modification, soil conditioning      |
 * | Water content   | Hydration for germination              |
 * | Vitamins        | Cofactors for metabolic processes      |
 *
 * A tree investing heavily in reproduction:
 * - Makes nutrient-dense fruit (better germination fuel)
 * - Makes nutrient-dense seed (better survival odds)
 *
 * They're not parallel sinks - they're ONE INTEGRATED PACKAGE.
 */
export interface GerminationPackage {
  /**
   * Fruit nutrients that support seed germination
   */
  germinationFuel: {
    sugars: number // Energy source
    minerals: string[] // Building blocks
    acids: string[] // Soil conditioning
    moisture: number // Hydration
  }

  /**
   * Seed's survival equipment
   */
  seedPayload: {
    lipids: number // Energy reserve for germination
    proteins: number // Building blocks
    defensiveCompounds: string[] // Protection until germination
  }

  /**
   * Total reproductive investment indicator
   */
  reproductiveInvestment: 'high' | 'medium' | 'low'
}

/**
 * PRINCIPLE 5: Tree Maturity and Reproductive Allocation
 *
 * Trees shift energy allocation as they mature:
 *
 * | Stage     | Age (Citrus) | Primary Sink              | Fruit Quality        |
 * |-----------|--------------|---------------------------|----------------------|
 * | Seedling  | 0-2 years    | 100% vegetative           | None                 |
 * | Juvenile  | 2-5 years    | Mostly vegetative         | Low (competing)      |
 * | Mature    | 5+ years     | Mostly reproductive       | High (full allocation)|
 * | Prime     | 8-25 years   | Optimized reproductive    | Peak                 |
 * | Declining | 25+ years    | Reduced capacity          | Still excellent/piece|
 *
 * DECLINING TREE PARADOX:
 * Old trees produce fewer fruits, but each fruit gets MORE of the tree's
 * reproductive energy. This is "natural thinning."
 *
 * | Tree Stage | Total Capacity | Fruit Count | Energy Per Fruit |
 * |------------|----------------|-------------|------------------|
 * | Peak       | 100 units      | 100 fruits  | 1 unit each      |
 * | Declining  | 50 units       | 25 fruits   | 2 units each     |
 */
export interface TreeMaturityModel {
  /**
   * Tree life stage
   */
  stage: 'seedling' | 'juvenile' | 'mature' | 'prime' | 'declining'

  /**
   * Age range for this stage (varies by species)
   */
  ageRange: { min: number; max: number }

  /**
   * Percentage of energy going to reproduction vs vegetation
   */
  reproductiveAllocation: number // 0-100%

  /**
   * Expected fruit quality at this stage
   */
  expectedQuality: 'none' | 'low' | 'medium' | 'high' | 'peak'

  /**
   * Whether declining tree paradox applies (fewer but better fruits)
   */
  decliningParadox?: boolean
}

/**
 * PRINCIPLE 6: The Nutrient Balance Equation (SHARE Integration)
 *
 * The farm is a nutrient flow system:
 *
 * INPUTS (Source):
 * - Soil (S): Native mineral/nutrient supply
 * - Agricultural (A): External supplementation
 *
 * PROCESSING:
 * - Photosynthesis: Converts water + CO2 + minerals into carbohydrates
 * - Translocation: Moves nutrients to sinks
 *
 * OUTPUTS (Sink):
 * - Total fruit load = Number of pieces × Nutrients per piece
 * - Measured as "pound solids per acre" in juice industry
 *
 * GENETIC MODULATOR:
 * - Heritage (H): Determines yield vs. quality tradeoff
 *   - High yield cultivar: Many pieces × Lower Brix
 *   - High quality cultivar: Fewer pieces × Higher Brix
 *
 * ```
 * INPUTS                    GENETICS                   OUTPUTS
 * ──────                    ────────                   ───────
 * Soil nutrients     ×      Cultivar         =        Pound solids/acre
 * + Fertilization           (yield strategy)          (pieces × Brix)
 * + Water
 * + Sunlight (photosynthesis)
 * ```
 *
 * SHARE pillars map to this:
 * - S provides the nutrient pool
 * - A supplements what soil lacks
 * - H determines yield/quality tradeoff
 * - R determines how much goes to reproduction vs vegetation
 * - E is the measurement of the output
 */
export interface NutrientBalanceEquation {
  /**
   * Input factors
   */
  inputs: {
    soilNutrients: number // S pillar contribution
    fertilization: number // A pillar contribution
    waterAvailability: number
    photosyntheticCapacity: number // Based on sunlight, leaf health
  }

  /**
   * Genetic allocation strategy (H pillar)
   */
  geneticStrategy: {
    cultivar: string
    yieldFocus: number // 0-1 scale (1 = all yield, 0 = all quality)
    typicalPiecesPerTree: number
    typicalBrixPerPiece: number
  }

  /**
   * Maturity/timing factors (R pillar)
   */
  maturityFactors: {
    treeAge: number
    reproductiveAllocationPercent: number
    harvestTiming: 'early' | 'optimal' | 'late'
  }

  /**
   * Measured output (E pillar)
   */
  output: {
    totalPieces: number
    averageBrix: number
    poundSolidsPerAcre: number // pieces × brix × juice content
  }
}

// =============================================================================
// TRANSFORMATION MODEL
// =============================================================================

/**
 * Transformation Process
 *
 * For seed-based products, transformation is not just "processing" -
 * it's UNLOCKING the seed's nutrition by neutralizing its defenses.
 *
 * | Process        | What It Does                              |
 * |----------------|-------------------------------------------|
 * | Fermentation   | Breaks down tannins, reduces bitterness   |
 * | Roasting       | Converts chlorogenic acids → flavor       |
 * | Soaking        | Reduces phytic acid, unlocks minerals     |
 * | Nixtamalization| Releases niacin from corn                 |
 */
export interface TransformationProcess {
  id: string
  name: string

  /**
   * What defensive compounds this process neutralizes
   */
  neutralizes: string[]

  /**
   * How much of the seed's secondary nutrition gets unlocked (0-1)
   */
  unlockCoefficient: number

  /**
   * Risk of degrading nutrition if done incorrectly
   */
  degradationRisk: 'low' | 'medium' | 'high'

  /**
   * What the transformation creates (flavor, bioavailable compounds)
   */
  creates: string[]
}

/**
 * Two-Stage Transformation Model for Coffee/Cacao
 *
 * Stage 1: Processing (at mill/farm)
 * - Input: Cherry/Pod Brix + Processing Method
 * - Output: Green bean quality
 *
 * Stage 2: Roasting (at roaster)
 * - Input: Green bean quality + Roast Level
 * - Output: Final cupping score
 */
export interface TwoStageTransformation {
  /**
   * Stage 1: Processing at farm/mill level
   */
  stage1_processing: {
    /**
     * Fruit quality input (Cherry Brix for coffee, Pod Brix for cacao)
     */
    fruitBrix: number

    /**
     * Processing method applied
     */
    processingMethod: string

    /**
     * How much of fruit Brix gets utilized by this processing
     * (Natural = 90-100%, Washed = 5-10%)
     */
    brixUtilization: number

    /**
     * Resulting green bean quality score
     */
    greenBeanQuality: number
  }

  /**
   * Stage 2: Roasting/final transformation
   */
  stage2_roasting: {
    /**
     * Green bean quality input
     */
    greenBeanQuality: number

    /**
     * Roast level applied
     */
    roastLevel: string

    /**
     * Preservation factor (light = 1.0, dark = 0.7)
     */
    preservationFactor: number

    /**
     * Final quality score (cupping score for coffee)
     */
    finalScore: number
  }
}

/**
 * Processing method Brix utilization rates
 *
 * For coffee, this determines how much of the cherry's sugar content
 * contributes to final bean quality:
 */
export const PROCESSING_BRIX_UTILIZATION: Record<string, number> = {
  // Natural: Whole cherry dries with bean - maximum sugar contact
  natural: 0.95,
  black_honey: 0.85,
  red_honey: 0.65,
  honey: 0.50,
  yellow_honey: 0.35,
  // Washed: Cherry removed before drying - minimal sugar contact
  washed: 0.10,
  // Experimental: Variable based on execution
  anaerobic: 0.70,
  carbonic_maceration: 0.75,
}

// =============================================================================
// QUALITY PREDICTION HELPERS
// =============================================================================

/**
 * Estimate seed quality tier from fruit Brix
 *
 * Based on the correlation principle: high fruit Brix = high seed nutrients
 */
export function estimateSeedTierFromFruitBrix(
  fruitBrix: number,
  productType: 'coffee' | 'cacao'
): FruitSeedCorrelation {
  // Coffee cherry Brix ranges: 15-18 (commodity), 18-22 (standard), 22-26 (premium), 26+ (exceptional)
  // Cacao pod Brix ranges: 10-12 (commodity), 12-14 (standard), 14-16 (premium), 16+ (exceptional)

  const thresholds =
    productType === 'coffee'
      ? { exceptional: 26, premium: 22, standard: 18 }
      : { exceptional: 16, premium: 14, standard: 12 }

  let expectedSeedTier: FruitSeedCorrelation['expectedSeedTier']

  if (fruitBrix >= thresholds.exceptional) {
    expectedSeedTier = 'exceptional'
  } else if (fruitBrix >= thresholds.premium) {
    expectedSeedTier = 'premium'
  } else if (fruitBrix >= thresholds.standard) {
    expectedSeedTier = 'standard'
  } else {
    expectedSeedTier = 'commodity'
  }

  return {
    fruitBrix,
    correlationConfidence: 0.75, // Based on plant physiology, not direct measurement
    expectedSeedTier,
  }
}

/**
 * Calculate green bean quality from cherry Brix and processing method
 *
 * This is Stage 1 of the two-stage transformation model.
 */
export function calculateGreenBeanQuality(
  cherryBrix: number,
  processingMethod: string,
  varietyBaseline: number
): number {
  // Get Brix utilization rate for processing method
  const utilization = PROCESSING_BRIX_UTILIZATION[processingMethod] ?? 0.5

  // Effective Brix contribution from processing
  const effectiveBrix = cherryBrix * utilization

  // Scale effective Brix to quality points (rough conversion)
  // Cherry Brix 22 with natural (95% utilization) = ~21 effective Brix
  // This might add ~2-3 points to variety baseline
  const brixContribution = (effectiveBrix - 18) * 0.15 // 0.15 points per Brix above 18

  // Green bean quality = variety baseline + Brix contribution
  return varietyBaseline + brixContribution
}

/**
 * Calculate final cupping score from green bean quality and roast level
 *
 * This is Stage 2 of the two-stage transformation model.
 */
export function calculateFinalScore(
  greenBeanQuality: number,
  roastLevel: string,
  roastModifiers: Record<string, number>
): number {
  const roastModifier = roastModifiers[roastLevel] ?? 0
  return greenBeanQuality + roastModifier
}

/**
 * Get tree maturity stage from age
 */
export function getTreeMaturityStage(
  ageYears: number,
  species: 'citrus' | 'coffee' | 'cacao' = 'citrus'
): TreeMaturityModel {
  // Species-specific age ranges
  const ranges =
    species === 'citrus'
      ? {
          seedling: { max: 2, repro: 0 },
          juvenile: { max: 5, repro: 20 },
          mature: { max: 8, repro: 70 },
          prime: { max: 25, repro: 85 },
          declining: { max: 100, repro: 60 },
        }
      : species === 'coffee'
        ? {
            seedling: { max: 1, repro: 0 },
            juvenile: { max: 3, repro: 30 },
            mature: { max: 6, repro: 75 },
            prime: { max: 20, repro: 85 },
            declining: { max: 50, repro: 60 },
          }
        : {
            // cacao
            seedling: { max: 2, repro: 0 },
            juvenile: { max: 4, repro: 25 },
            mature: { max: 8, repro: 70 },
            prime: { max: 30, repro: 85 },
            declining: { max: 60, repro: 55 },
          }

  if (ageYears <= ranges.seedling.max) {
    return {
      stage: 'seedling',
      ageRange: { min: 0, max: ranges.seedling.max },
      reproductiveAllocation: ranges.seedling.repro,
      expectedQuality: 'none',
    }
  }
  if (ageYears <= ranges.juvenile.max) {
    return {
      stage: 'juvenile',
      ageRange: { min: ranges.seedling.max + 1, max: ranges.juvenile.max },
      reproductiveAllocation: ranges.juvenile.repro,
      expectedQuality: 'low',
    }
  }
  if (ageYears <= ranges.mature.max) {
    return {
      stage: 'mature',
      ageRange: { min: ranges.juvenile.max + 1, max: ranges.mature.max },
      reproductiveAllocation: ranges.mature.repro,
      expectedQuality: 'medium',
    }
  }
  if (ageYears <= ranges.prime.max) {
    return {
      stage: 'prime',
      ageRange: { min: ranges.mature.max + 1, max: ranges.prime.max },
      reproductiveAllocation: ranges.prime.repro,
      expectedQuality: 'peak',
    }
  }

  return {
    stage: 'declining',
    ageRange: { min: ranges.prime.max + 1, max: ranges.declining.max },
    reproductiveAllocation: ranges.declining.repro,
    expectedQuality: 'high', // Still high per-piece due to natural thinning
    decliningParadox: true,
  }
}

// =============================================================================
// All types are already exported via their interface declarations above.
// Additional exports: ANTI_NUTRIENT_PROFILES, PROCESSING_BRIX_UTILIZATION,
// estimateSeedTierFromFruitBrix(), calculateGreenBeanQuality(),
// calculateFinalScore(), getTreeMaturityStage()
// =============================================================================
