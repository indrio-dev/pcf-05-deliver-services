/**
 * =============================================================================
 * LIVESTOCK OMEGA RATIO PREDICTION MODEL
 * =============================================================================
 *
 * Statistical model for predicting omega-6:omega-3 ratio from SHARE pillars.
 *
 * MODEL: E_omega = f(A, R)
 *
 * Where:
 *   A = Diet sequence (what the animal ate, in order) - THE DRIVER
 *   R = Duration on each diet phase (how long) - AMPLIFIES A
 *
 * KEY INSIGHT: Omega ratio is 100% DIET-driven. Breed genetics do NOT affect it.
 *
 * The science:
 *   - DIET determines omega outcome (especially finishing diet)
 *   - BREED affects fat AMOUNT (marbling), NOT fat COMPOSITION (omega ratio)
 *   - On identical diet, Wagyu and Angus achieve the SAME omega ratio
 *   - Wagyu just has MORE fat at that ratio (higher marbling)
 *
 * PROOF: Same genetics, different omega:
 *   - Snake River Farms American Wagyu (12mo feedlot): 26:1 omega
 *   - Everglades Ranch American Wagyu (pasture+grain): 6:1 omega
 *   - SAME genetics, 4x difference = DIET determines omega, not breed
 *
 * H pillar (breed) affects:
 *   - HOW MUCH fat is deposited (marbling potential) - Wagyu deposits more
 *   - Maturity timing - when animal reaches full expression
 *   - Flavor profile characteristics
 *   - But NOT omega ratio - that's 100% A pillar (diet)
 *
 * The model uses a weighted accumulation approach where:
 *   - Finishing diet dominates (~75% of outcome)
 *   - Early phases contribute (~25% of outcome)
 *   - Duration penalty for extended grain finishing
 */

import { BEEF_BREEDS, DIET_OMEGA_MODIFIERS, type LivestockBreed } from '../constants/livestock-breeds'

// =============================================================================
// TYPES
// =============================================================================

/**
 * A diet phase in the animal's feeding history
 */
export interface DietPhaseInput {
  dietType: DietType
  durationMonths: number
  feedComposition?: FeedCompositionInput  // Optional detailed breakdown
}

export type DietType =
  | 'grass_only'           // 100% pasture grass
  | 'pasture_forage'       // Pasture + hay/forage
  | 'pasture_grain_supplemented'  // Pasture with grain supplement
  | 'grain_finished'       // Feedlot grain ration (finishing)
  | 'grain_fed'            // Full grain diet (CAFO)
  | 'milk'                 // Nursing phase

/**
 * Detailed feed composition (optional, for fine-grained modeling)
 */
export interface FeedCompositionInput {
  pastureGrassPct?: number    // Omega-3 rich
  hayPct?: number             // Preserved grass
  cornSilagePct?: number      // Higher omega-6
  cornGrainPct?: number       // High omega-6
  soyMealPct?: number         // Very high omega-6
  distillersGrainsPct?: number // Concentrated omega-6
}

/**
 * Full input for omega prediction
 */
export interface OmegaPredictionInput {
  breedId: string
  dietSequence: DietPhaseInput[]
  ageAtHarvestMonths: number
}

/**
 * Prediction result with uncertainty
 */
export interface OmegaPredictionResult {
  // Point estimate
  predictedRatio: number

  // Uncertainty bounds (95% CI)
  confidenceInterval: {
    low: number
    high: number
  }

  // Quality tier
  tier: 'exceptional' | 'premium' | 'standard' | 'commodity'
  tierDescription: string

  // Breakdown by SHARE pillar contribution
  breakdown: {
    H: {
      breedName: string
      marblingPotential: number
      maturityMonths: number
      breedOmegaBaseline: number    // Breed's genetic omega baseline
      breedOmegaModifier: number    // How much breed shifts final ratio
      note: string
    }
    A: {
      finishingDiet: string
      finishingOmegaBaseline: number
      finishingDurationMonths: number
      finishingDurationPenalty: number   // Extra penalty for extended grain finishing
      earlyDietAverage: number
      phases: PhaseContribution[]
    }
    R: {
      ageAtHarvest: number
      maturityFactor: number
      isFullyMature: boolean
    }
  }

  // Model metadata
  modelVersion: string
  confidence: 'high' | 'medium' | 'low'
  dataQuality: string[]
}

interface PhaseContribution {
  dietType: DietType
  durationMonths: number
  omegaContribution: number
  weight: number
}

// =============================================================================
// MODEL PARAMETERS
// =============================================================================

/**
 * BASE OMEGA RATIOS BY DIET TYPE
 *
 * These represent the omega ratio that results from sustained feeding on each diet.
 * The FINISHING diet (last phase) is what primarily determines the final ratio.
 *
 * Key insight: Earlier phases matter less because:
 *   1. Less fat is deposited during growth phases
 *   2. Finishing is when animals put on the most fat
 *   3. Fat composition reflects recent sustained diet
 *
 * Research basis:
 *   - 100% grass-fed cattle: ~2-4:1 omega ratio
 *   - Grass with grain supplement (on pasture): ~5-8:1
 *   - Feedlot grain finished: ~12-18:1
 *   - Full feedlot/CAFO: ~15-25:1
 */
const DIET_OMEGA_BASELINE: Record<DietType, number> = {
  milk: 4,                  // Mother's milk, natural ratio
  grass_only: 3,            // Best achievable: ~3:1
  pasture_forage: 4,        // Pasture + hay: ~4:1
  pasture_grain_supplemented: 6,  // CONCURRENT grass + grain on pasture: ~6:1
                                  // Key: animal is STILL ON PASTURE, grazing grass
                                  // Grain is FREE CHOICE supplement, not replacement
                                  // This is TRUE PASTURE RAISED finishing
                                  // (Everglades Ranch model)
                                  //
                                  // CRITICAL DISTINCTION:
                                  // pasture_grain_supplemented = CONCURRENT (grass AND grain)
                                  // grain_finished = SEQUENTIAL (grass THEN grain in feedlot)
  grain_finished: 14,       // FEEDLOT finishing: ~14:1
                            // Key: animal REMOVED from pasture, in feedlot
                            // Grain is primary diet, not supplement
  grain_fed: 22,            // Full CAFO/extended feedlot: ~22:1 baseline
                            // Calibrated to real data: Snake River American Wagyu
                            // (12mo feedlot) = 26:1 vs Everglades Ranch = 6:1
                            // Same genetics, 4x difference = DIET determines omega
}

// CALIBRATION ANCHOR: Snake River vs Everglades Ranch (same American Wagyu genetics)
// - Everglades Ranch: 6:1 (concurrent pasture + grain, 5 months)
// - Snake River Farms: 26:1 (feedlot grain, 12 months)
// This proves: Diet sequence × duration = omega outcome, NOT genetics

/**
 * FINISHING PHASE WEIGHT
 *
 * The finishing diet dominates the final omega ratio because:
 *   - Most fat is deposited during finishing
 *   - Fatty acids in fat tissue reflect recent diet
 *
 * Model: Final ratio = diet_contribution + breed_modifier
 *   where diet_contribution = (finishing_weight × finishing_diet) + (early_weight × early_diet_avg)
 *   and breed_modifier = (breedBaseline - NEUTRAL_BASELINE) × BREED_MODIFIER_WEIGHT
 */
const FINISHING_PHASE_WEIGHT = 0.75  // 75% of diet contribution from finishing
const EARLY_PHASES_WEIGHT = 0.25     // 25% of diet contribution from earlier phases

/**
 * BREED MODIFIER: REMOVED
 *
 * Previous model assumed breed genetics affected omega ratio.
 * This was INCORRECT.
 *
 * The science:
 *   - Breed genetics affect fat AMOUNT (marbling), NOT fat COMPOSITION
 *   - On identical diet, all breeds achieve similar omega ratios
 *   - Wagyu just has MORE fat at whatever ratio the diet produces
 *
 * PROOF: Snake River vs Everglades Ranch (same American Wagyu genetics)
 *   - Snake River (12mo feedlot): 26:1 omega
 *   - Everglades Ranch (pasture+grain): 6:1 omega
 *   - If genetics mattered, both would be similar. They're not.
 *   - DIET is the only determinant of omega ratio.
 *
 * The omegaBaseline field in breed data is now informational only,
 * representing what that breed TYPICALLY achieves (due to typical management),
 * not what the breed is genetically capable of.
 */

/**
 * FINISHING DURATION MODIFIER
 *
 * The DURATION of grain finishing matters enormously:
 *   - 4 months grain finish: moderate omega-6 accumulation
 *   - 12+ months grain finish (luxury Wagyu): EXTREME omega-6 accumulation
 *
 * Each month of grain finishing adds to the omega ratio.
 * This explains why luxury Wagyu (Snake River, etc.) reaches 25:1 despite
 * the same finishing TYPE as standard grain-finished beef.
 *
 * ALTERNATIVE MENTAL MODEL: Grain-to-Life Ratio
 *   Think of it as: (grain finishing months / total life months)
 *   Higher percentage on grain = worse omega
 *
 *   SCENARIO                    GRAIN %     PREDICTED OMEGA
 *   Everglades Ranch            5/24 = 21%  ~6:1 (pasture+grain)
 *   Commodity beef              8/24 = 33%  ~18:1
 *   Luxury Wagyu               12/24 = 50%  ~21:1
 *
 *   The luxury Wagyu spends HALF its life on grain → worst omega of all
 *
 * CRITICAL NUANCE: CONCURRENT vs 100% GRAIN
 *   The Everglades Ranch 5/24 is NOT equivalent to 5 months in a feedlot!
 *
 *   Everglades Ranch (CONCURRENT):
 *     - Animal STAYS on pasture during those 5 months
 *     - Still eating grass (omega-3 source) + offered grain
 *     - Free choice - animal chooses balance
 *     - Omega-3 supply continues, just diluted
 *
 *   Feedlot (100% GRAIN):
 *     - Animal REMOVED from pasture
 *     - 100% grain diet - no grass access
 *     - Omega-3 supply COMPLETELY CUT OFF
 *     - Omega-6 accumulates rapidly with no omega-3 intake
 *
 *   This is why pasture_grain_supplemented (6:1) << grain_finished (14:1)
 *
 * THE LINEAR RELATIONSHIP:
 *   Omega-6 accumulation = Grain Duration × Grain Exclusivity
 *
 *   DURATION: How many months on grain finishing
 *   EXCLUSIVITY: What % of diet is grain (vs grass)
 *
 *   SCENARIO                 DURATION    EXCLUSIVITY    OMEGA IMPACT
 *   ─────────────────────────────────────────────────────────────────
 *   Everglades Ranch         5 months    ~30% grain     LOW (still grazing)
 *   Commodity beef           8 months    100% grain     HIGH (feedlot)
 *   Luxury Wagyu            12 months    100% grain     HIGHEST (extended feedlot)
 *
 *   The relationship is essentially linear:
 *   - Double the duration → roughly double the omega-6 accumulation
 *   - Double the exclusivity → roughly double the omega-6 accumulation
 *   - Concurrent grass+grain (Everglades) = fraction of feedlot impact
 */
const STANDARD_FINISHING_MONTHS = 4        // Typical grain finishing duration
const FINISHING_DURATION_PENALTY = 1.0     // +1.0 ratio per month BEYOND standard

// Examples (calibrated to real-world data):
// - 4 months grain finish: 0 extra penalty (standard)
// - 6 months grain finish: +2.0 ratio ((6-4) × 1.0) ← "Grass-fed" marketing
// - 8 months grain finish: +4.0 ratio ((8-4) × 1.0) ← Commodity beef
// - 12 months grain finish: +8.0 ratio ((12-4) × 1.0) ← Luxury Wagyu → 25:1+
//
// Real-world omega targets:
// - True grass-fed/finished: 2:1 to 3:1
// - Everglades Ranch (concurrent pasture+grain): ~6:1
// - Commodity beef (8mo feedlot): 10:1 to 20:1
// - Luxury Wagyu (12mo feedlot): 25:1+

/**
 * Maturity modifier - young animals don't express full genetic potential
 * Returns 0.0 to 1.0 multiplier
 */
function getMaturityModifier(ageMonths: number, targetMaturityMonths: number): number {
  const ratio = ageMonths / targetMaturityMonths
  if (ratio < 0.5) return 0.6    // Very young
  if (ratio < 0.75) return 0.8   // Developing
  if (ratio < 1.0) return 0.95   // Approaching maturity
  return 1.0                      // Fully mature
}

/**
 * Model uncertainty parameters
 */
const BASE_UNCERTAINTY = 1.5  // ±1.5 ratio points baseline
const UNKNOWN_BREED_PENALTY = 2.0  // Additional uncertainty for unknown breed
const SHORT_HISTORY_PENALTY = 1.0  // Additional uncertainty for incomplete diet history

// =============================================================================
// MAIN PREDICTION FUNCTION
// =============================================================================

/**
 * Predict omega ratio from SHARE pillar inputs
 *
 * REVISED MODEL (Finishing-Dominated):
 *   E_omega = (FINISHING_WEIGHT × finishing_diet_ratio) + (EARLY_WEIGHT × early_diet_avg)
 *
 * The finishing phase (last diet phase) determines ~75% of the final omega ratio
 * because that's when most fat is deposited.
 *
 * Example: Everglades Ranch American Wagyu
 *   - 18 months grass_only → 5 months pasture_grain_supplemented
 *   - Finishing diet = pasture_grain_supplemented (7:1 baseline)
 *   - Early diet = grass_only (3:1 baseline)
 *   - Predicted = 0.75 × 7 + 0.25 × 3 = 5.25 + 0.75 = 6:1
 *
 * Example: Snake River Farms Wagyu
 *   - 12 months grass → 12 months grain_fed (feedlot)
 *   - Finishing diet = grain_fed (20:1 baseline)
 *   - Early diet = grass_only (3:1 baseline)
 *   - Predicted = 0.75 × 20 + 0.25 × 3 = 15 + 0.75 = 15.75:1
 *
 * H pillar (breed) affects:
 *   - HOW MUCH fat (marbling) - Wagyu deposits more
 *   - HOW QUICKLY ratio shifts - higher marbling breeds show diet impact faster
 *   - But NOT the composition itself - that's 100% diet
 */
export function predictOmegaRatio(input: OmegaPredictionInput): OmegaPredictionResult {
  const breed = BEEF_BREEDS[input.breedId]

  // Identify finishing phase (last phase) and early phases
  const finishingPhase = input.dietSequence[input.dietSequence.length - 1]
  const earlyPhases = input.dietSequence.slice(0, -1)

  // Get omega baseline for finishing diet
  const finishingOmega = DIET_OMEGA_BASELINE[finishingPhase?.dietType] ?? 10

  // Calculate weighted average of early phases
  let earlyPhasesOmega = 4  // Default to neutral
  if (earlyPhases.length > 0) {
    const totalEarlyMonths = earlyPhases.reduce((sum, p) => sum + p.durationMonths, 0)
    earlyPhasesOmega = earlyPhases.reduce((sum, phase) => {
      const phaseOmega = DIET_OMEGA_BASELINE[phase.dietType] ?? 10
      const weight = phase.durationMonths / totalEarlyMonths
      return sum + (phaseOmega * weight)
    }, 0)
  }

  // Build phase contributions for breakdown
  const phaseContributions: PhaseContribution[] = []
  const totalMonths = input.dietSequence.reduce((sum, phase) => sum + phase.durationMonths, 0)

  input.dietSequence.forEach((phase, index) => {
    const isFinishing = index === input.dietSequence.length - 1
    const weight = isFinishing ? FINISHING_PHASE_WEIGHT : (EARLY_PHASES_WEIGHT / Math.max(1, earlyPhases.length))
    const phaseOmega = DIET_OMEGA_BASELINE[phase.dietType] ?? 10

    phaseContributions.push({
      dietType: phase.dietType,
      durationMonths: phase.durationMonths,
      omegaContribution: phaseOmega * weight,
      weight: weight,
    })
  })

  // Core prediction: finishing-dominated weighted average (diet contribution)
  const dietContribution = (FINISHING_PHASE_WEIGHT * finishingOmega) + (EARLY_PHASES_WEIGHT * earlyPhasesOmega)

  // BREED MODIFIER REMOVED - omega is 100% diet-driven
  // Breed genetics affect fat AMOUNT (marbling), NOT fat COMPOSITION (omega ratio)
  // On same diet, Wagyu and Angus achieve same omega ratio
  // Wagyu just has MORE fat at that ratio

  // Finishing DURATION penalty - extended grain finishing compounds omega-6
  // Only applies to grain-based finishing (grain_finished or grain_fed)
  const isGrainFinishing = finishingPhase?.dietType === 'grain_finished' ||
                           finishingPhase?.dietType === 'grain_fed'
  const finishingMonths = finishingPhase?.durationMonths ?? 0
  const extendedFinishingMonths = Math.max(0, finishingMonths - STANDARD_FINISHING_MONTHS)
  const finishingDurationPenalty = isGrainFinishing
    ? extendedFinishingMonths * FINISHING_DURATION_PENALTY
    : 0

  // Maturity factor - affects how fully the diet is expressed
  const targetMaturity = breed?.maturityMonths ?? 24
  const maturityFactor = getMaturityModifier(input.ageAtHarvestMonths, targetMaturity)
  const isFullyMature = input.ageAtHarvestMonths >= targetMaturity

  // Final prediction: diet contribution + duration penalty (NO breed modifier)
  const rawPrediction = dietContribution + finishingDurationPenalty

  // Biological constraints: omega ratio can't go below ~2 or above ~30
  // (Snake River Wagyu at 26:1 is real data, so cap must allow for that)
  const predictedRatio = Math.max(2, Math.min(30, rawPrediction))

  // Calculate uncertainty
  let uncertainty = BASE_UNCERTAINTY
  if (!breed) uncertainty += UNKNOWN_BREED_PENALTY
  if (totalMonths < input.ageAtHarvestMonths * 0.8) uncertainty += SHORT_HISTORY_PENALTY

  const confidenceInterval = {
    low: Math.max(1.5, predictedRatio - uncertainty),
    high: Math.min(30, predictedRatio + uncertainty),
  }

  // Determine tier
  const { tier, description } = classifyOmegaTier(predictedRatio)

  // Determine confidence level
  let confidence: 'high' | 'medium' | 'low' = 'medium'
  if (breed && totalMonths >= input.ageAtHarvestMonths * 0.9) confidence = 'high'
  if (!breed || totalMonths < input.ageAtHarvestMonths * 0.5) confidence = 'low'

  // Data quality notes
  const dataQuality: string[] = []
  if (!breed) dataQuality.push('Unknown breed - using default baseline')
  if (totalMonths < input.ageAtHarvestMonths) {
    dataQuality.push(`Diet history covers ${Math.round(totalMonths / input.ageAtHarvestMonths * 100)}% of life`)
  }
  if (!isFullyMature) dataQuality.push('Harvested before full maturity')

  return {
    predictedRatio: Math.round(predictedRatio * 10) / 10,  // Round to 1 decimal
    confidenceInterval,
    tier,
    tierDescription: description,
    breakdown: {
      H: {
        breedName: breed?.name ?? 'Unknown',
        marblingPotential: breed?.marblingPotential ?? 5,
        maturityMonths: targetMaturity,
        breedOmegaBaseline: 0,  // Breed does NOT affect omega
        breedOmegaModifier: 0,  // Breed does NOT affect omega
        // Breed affects fat AMOUNT (marbling), NOT fat COMPOSITION (omega)
        note: `${breed?.name ?? 'This breed'} marbling potential: ${breed?.marblingPotential ?? 5}/12. Omega ratio determined by DIET, not genetics.`,
      },
      A: {
        finishingDiet: finishingPhase?.dietType ?? 'unknown',
        finishingOmegaBaseline: finishingOmega,
        finishingDurationMonths: finishingMonths,
        finishingDurationPenalty: Math.round(finishingDurationPenalty * 10) / 10,
        earlyDietAverage: Math.round(earlyPhasesOmega * 10) / 10,
        phases: phaseContributions,
      },
      R: {
        ageAtHarvest: input.ageAtHarvestMonths,
        maturityFactor,
        isFullyMature,
      },
    },
    modelVersion: '2.0.0',  // Updated model - finishing-dominated
    confidence,
    dataQuality,
  }
}

/**
 * Classify omega ratio into quality tiers
 */
function classifyOmegaTier(ratio: number): { tier: OmegaPredictionResult['tier']; description: string } {
  if (ratio <= 3) return { tier: 'exceptional', description: 'Exceptional (≤3:1) - True grass-fed' }
  if (ratio <= 6) return { tier: 'premium', description: 'Premium (3-6:1) - Good grass-finished' }
  if (ratio <= 12) return { tier: 'standard', description: 'Standard (6-12:1) - Mixed feeding' }
  return { tier: 'commodity', description: 'Commodity (>12:1) - Feedlot/grain-fed' }
}

// =============================================================================
// EXAMPLE: AMERICAN WAGYU SCENARIOS
// =============================================================================

/**
 * Example scenarios for American Wagyu to demonstrate model behavior
 */
export const AMERICAN_WAGYU_SCENARIOS = {
  /**
   * Scenario 1: True grass-fed American Wagyu
   * 30 months on grass only
   * Expected: Excellent omega ratio despite Wagyu genetics
   */
  trueGrassFed: {
    breedId: 'american_wagyu',
    dietSequence: [
      { dietType: 'milk' as DietType, durationMonths: 6 },
      { dietType: 'grass_only' as DietType, durationMonths: 24 },
    ],
    ageAtHarvestMonths: 30,
  },

  /**
   * Scenario 2: "Grass-fed, Grain-Finished" (misleading marketing term)
   *
   * MARKETING CLAIM: "Grass-fed" (but silence on finishing = GRAIN FINISH IN FEEDLOT)
   *
   * 12 months on grass (first sequence: grass-fed ✓)
   * 6 months on grain IN FEEDLOT (second sequence: grain-finished)
   *
   * This is what most "grass-fed" beef actually is when they don't say "grass-finished"
   * Expected: Standard to commodity - grain finishing in feedlot degrades omega
   */
  grassFinished: {
    breedId: 'american_wagyu',
    dietSequence: [
      { dietType: 'milk' as DietType, durationMonths: 6 },
      { dietType: 'grass_only' as DietType, durationMonths: 12 },
      { dietType: 'grain_finished' as DietType, durationMonths: 6 },
    ],
    ageAtHarvestMonths: 24,
  },

  /**
   * Scenario 3: Extended grain feeding (luxury Wagyu brands: Snake River, etc.)
   *
   * 6 months backgrounding on grass
   * 12+ months grain feeding in feedlot (maximizes marbling)
   *
   * This is the PRICE/HEALTH INVERSION:
   * - HIGHEST price (luxury brand)
   * - WORST omega ratio
   * - Consumers pay 5x more for beef that's actively worse for them
   *
   * USDA GRADE: Prime+ / BMS 8-12 (Japanese Beef Marbling Score)
   *   - Often exceeds USDA Prime scale
   *   - BMS is not official USDA but widely used for luxury Wagyu
   *   - Highest marbling grade, but WORST omega profile
   *
   * Expected: Commodity tier (health), 25-26:1 omega
   */
  extendedGrain: {
    breedId: 'american_wagyu',
    dietSequence: [
      { dietType: 'milk' as DietType, durationMonths: 6 },
      { dietType: 'grass_only' as DietType, durationMonths: 6 },
      { dietType: 'grain_fed' as DietType, durationMonths: 12 },
    ],
    ageAtHarvestMonths: 24,
  },

  /**
   * Scenario 4: Commodity Beef (what most Americans eat)
   *
   * REALISTIC COMMODITY TIMELINE:
   * - 6 months nursing/weaning
   * - 8-10 months backgrounding on grass (pasture or hay)
   * - 6-8 months in feedlot on grain (finishing)
   *
   * This is the STANDARD American beef production model.
   * Total age at harvest: ~18-24 months for commodity, 24-28 for "premium"
   *
   * USDA GRADE: Select, Choice, OR Prime (varies by individual animal)
   *   - Commodity beef spans all grades based on marbling
   *   - Grade does NOT indicate feeding regime or omega profile
   *   - A commodity Prime steak still has poor omega (feedlot-finished)
   *
   * Expected: Commodity tier, 15-20:1 omega
   */
  fullCAFO: {
    breedId: 'american_wagyu',
    dietSequence: [
      { dietType: 'milk' as DietType, durationMonths: 6 },
      { dietType: 'grass_only' as DietType, durationMonths: 10 },  // Backgrounding
      { dietType: 'grain_fed' as DietType, durationMonths: 8 },    // Feedlot finishing
    ],
    ageAtHarvestMonths: 24,
  },

  /**
   * Scenario 5: Generic pasture + free choice grain
   * On pasture entire life with access to grain
   * Expected: Good ratio - pasture dominates
   */
  pastureWithGrainAccess: {
    breedId: 'american_wagyu',
    dietSequence: [
      { dietType: 'milk' as DietType, durationMonths: 6 },
      { dietType: 'pasture_grain_supplemented' as DietType, durationMonths: 22 },
    ],
    ageAtHarvestMonths: 28,
  },

  /**
   * Scenario 6: EVERGLADES RANCH (Actual Farm Data)
   *
   * Real-world American Wagyu operation:
   * - 24 months total pasture-raised
   * - NO feedlot (critical distinction)
   * - First 18-20 months: 100% grass on pasture
   * - Final 4-6 months: CONCURRENT grass + grain (still on pasture, free choice)
   * - No antibiotics, no growth hormones, no mRNA vaccines
   *
   * THIS IS TRUE PASTURE RAISED FINISHING:
   *   - Animal STAYS on pasture during grain supplementation
   *   - Grain is FREE CHOICE (animal chooses how much)
   *   - Animal continues to graze grass CONCURRENTLY with grain access
   *   - This is NOT "grass-fed then grain-finished" (sequential)
   *   - This IS "grass AND grain finishing" (concurrent)
   *
   * CRITICAL DISTINCTION:
   *   Everglades Ranch: CONCURRENT (grass + grain on pasture) → 6:1 omega
   *   Snake River Farms: SEQUENTIAL (grass THEN grain in feedlot) → 26:1 omega
   *
   * USDA GRADE: Prime
   *   - High marbling = from Wagyu genetics + grain supplement on pasture
   *   - Healthy omega = from staying on pasture (grass provides omega-3)
   *   - PROVES: You do NOT need extended feedlot to achieve Prime grade
   *   - Conventional wisdom wrong: "Prime requires feedlot" is FALSE
   *   - Same grade as Snake River, 4x better omega profile
   *
   * Expected: Premium tier - TRUE pasture raised finishing preserves omega profile
   */
  evergladesRanch: {
    breedId: 'american_wagyu',
    dietSequence: [
      { dietType: 'milk' as DietType, durationMonths: 6 },
      { dietType: 'grass_only' as DietType, durationMonths: 13 },  // ~18-19 months grass only
      { dietType: 'pasture_grain_supplemented' as DietType, durationMonths: 5 },  // Final 5 months: CONCURRENT grass + grain
    ],
    ageAtHarvestMonths: 24,
  },
}

/**
 * Run all scenarios and return results for comparison
 */
export function runAmericanWagyuScenarios(): Record<string, OmegaPredictionResult> {
  const results: Record<string, OmegaPredictionResult> = {}

  for (const [name, input] of Object.entries(AMERICAN_WAGYU_SCENARIOS)) {
    results[name] = predictOmegaRatio(input)
  }

  return results
}

// =============================================================================
// CLAIM-TO-DIET INFERENCE
// =============================================================================

/**
 * Marketing Claim → Diet Sequence Inference
 *
 * CRITICAL INSIGHT: Marketing claims tell you about PHASES of feeding, not duration.
 *   - "Grass-fed" = FIRST sequence (growth phase)
 *   - "Grass-finished" = SECOND sequence (finishing phase)
 *   - SILENCE on finishing = ASSUME GRAIN FINISHING
 *
 * The absence of a claim is informative - producers who grass-finish WILL say so.
 * If they don't mention finishing, they're hiding it.
 */
export type MarketingClaim =
  | '100_percent_grass_fed'      // Grass throughout → grass_only finishing
  | 'grass_fed_grass_finished'   // Explicit: grass + grass finish
  | 'grass_fed'                  // Grass early, SILENCE on finish → grain_finished
  | 'pasture_raised'             // Pasture early, SILENCE on finish → grain_finished
  | 'pasture_raised_no_feedlot'  // Explicit CAFO exclusion → pasture throughout
  | 'natural'                    // Marketing term, means nothing → assume grain_fed
  | 'no_claims'                  // Nothing specified → assume grain_fed

/**
 * Infer diet sequence from marketing claims
 *
 * Returns the inferred diet sequence with confidence level.
 * Lower confidence = more assumptions made.
 */
export function inferDietFromClaims(
  claims: MarketingClaim[],
  totalAgeMonths: number = 24
): { sequence: DietPhaseInput[]; confidence: 'high' | 'medium' | 'low'; reasoning: string } {

  // Default: 6mo nursing + remaining split between growth and finish
  const nursingMonths = 6
  const remainingMonths = totalAgeMonths - nursingMonths
  const finishingMonths = 4  // Typical finishing period

  // Check for CAFO exclusion claims
  const noCAFO = claims.includes('pasture_raised_no_feedlot') ||
                 claims.includes('100_percent_grass_fed') ||
                 claims.includes('grass_fed_grass_finished')

  // Check for grass claims
  const grassFed = claims.includes('grass_fed') ||
                   claims.includes('100_percent_grass_fed') ||
                   claims.includes('grass_fed_grass_finished')

  const grassFinished = claims.includes('grass_fed_grass_finished') ||
                        claims.includes('100_percent_grass_fed')

  // BEST: Explicit grass throughout
  if (grassFinished || claims.includes('100_percent_grass_fed')) {
    return {
      sequence: [
        { dietType: 'milk', durationMonths: nursingMonths },
        { dietType: 'grass_only', durationMonths: remainingMonths },
      ],
      confidence: 'high',
      reasoning: 'Explicit grass-finished or 100% grass-fed claim → grass throughout',
    }
  }

  // GOOD: Pasture-raised with no-feedlot exclusion (like Everglades Ranch)
  if (claims.includes('pasture_raised_no_feedlot')) {
    return {
      sequence: [
        { dietType: 'milk', durationMonths: nursingMonths },
        { dietType: 'grass_only', durationMonths: remainingMonths - finishingMonths },
        { dietType: 'pasture_grain_supplemented', durationMonths: finishingMonths },
      ],
      confidence: 'high',
      reasoning: 'Pasture-raised + no feedlot → grass with pasture grain supplement finish',
    }
  }

  // MEDIUM: Grass-fed without finish claim = GRAIN FINISHED
  if (grassFed && !grassFinished) {
    return {
      sequence: [
        { dietType: 'milk', durationMonths: nursingMonths },
        { dietType: 'grass_only', durationMonths: remainingMonths - finishingMonths },
        { dietType: 'grain_finished', durationMonths: finishingMonths },
      ],
      confidence: 'medium',
      reasoning: '"Grass-fed" alone (no finishing claim) → infer grain finishing',
    }
  }

  // MEDIUM: Pasture-raised without CAFO exclusion = likely grain finished
  if (claims.includes('pasture_raised') && !noCAFO) {
    return {
      sequence: [
        { dietType: 'milk', durationMonths: nursingMonths },
        { dietType: 'pasture_forage', durationMonths: remainingMonths - finishingMonths },
        { dietType: 'grain_finished', durationMonths: finishingMonths },
      ],
      confidence: 'medium',
      reasoning: '"Pasture-raised" without CAFO exclusion → infer grain finishing',
    }
  }

  // POOR: "Natural" or no claims = assume full grain fed
  return {
    sequence: [
      { dietType: 'milk', durationMonths: nursingMonths },
      { dietType: 'pasture_grain_supplemented', durationMonths: 6 },
      { dietType: 'grain_fed', durationMonths: remainingMonths - 6 },
    ],
    confidence: 'low',
    reasoning: 'No process claims or just "Natural" → assume CAFO/grain-fed',
  }
}

/**
 * EXAMPLES: How claims map to omega predictions
 *
 * "100% grass-fed" American Wagyu:
 *   → Diet: grass throughout
 *   → Finishing: grass_only (3:1 baseline)
 *   → Predicted omega: ~3:1 (exceptional)
 *
 * "Grass-fed" American Wagyu (NO finishing claim):
 *   → Diet: grass early, grain finish INFERRED
 *   → Finishing: grain_finished (14:1 baseline)
 *   → Predicted omega: ~12:1 (standard)
 *
 * "Pasture-raised, no feedlot" American Wagyu (Everglades Ranch):
 *   → Diet: grass early, pasture+grain supplement finish
 *   → Finishing: pasture_grain_supplemented (7:1 baseline)
 *   → Predicted omega: ~6:1 (premium)
 *
 * "American Wagyu" (breed only, no process claims):
 *   → Diet: assumed CAFO
 *   → Finishing: grain_fed (20:1 baseline)
 *   → Predicted omega: ~18:1 (commodity)
 */
