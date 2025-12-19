/**
 * =============================================================================
 * SHARE RULES ENGINE
 * =============================================================================
 *
 * F013: Deterministic rules engine for SHARE quality prediction.
 *
 * This engine extracts business rules from inline calculations into a
 * centralized, testable, maintainable service. Rules are deterministic
 * lookups and calculations based on agricultural science.
 *
 * Core Formula:
 *   Peak Brix = Cultivar_Base + Rootstock_Mod + Age_Mod + Timing_Mod
 *
 * Data Sources (via reference-data.ts):
 * - Cultivar base Brix: quality-tiers.ts → Supabase cultivars table
 * - Rootstock modifiers: rootstocks.ts → Supabase rootstocks table
 * - GDD targets: gdd-targets.ts → Supabase crops table
 */

import { referenceData, referenceDataSync } from '../data/reference-data'

// =============================================================================
// TYPES
// =============================================================================

export interface BrixComponents {
  cultivarBase: number
  rootstockModifier: number
  ageModifier: number
  timingModifier: number
  total: number
}

export interface AgeModifierResult {
  modifier: number
  phase: 'juvenile' | 'transition' | 'developing' | 'prime' | 'mature' | 'declining'
  description: string
}

export interface TimingModifierResult {
  modifier: number
  zone: 'peak' | 'optimal' | 'acceptable' | 'suboptimal'
  description: string
}

export interface SugarCurveParams {
  sscMin: number      // Minimum SSC (at bloom)
  sscMax: number      // Maximum SSC (at full maturity)
  dd50: number        // GDD at 50% sugar development
  steepness: number   // Steepness of logistic curve
}

export interface AcidDecayParams {
  ta0: number         // Initial titratable acidity
  decayRate: number   // Exponential decay rate (ka)
}

export interface SugarAcidResult {
  ssc: number         // Soluble Solids Content (Brix)
  ta: number          // Titratable Acidity
  ratio: number       // SSC/TA ratio
  brimA: number       // Flavor index: SSC - 4*TA
  gdd: number
}

// =============================================================================
// AGE MODIFIER RULES
// =============================================================================

/**
 * Age Modifier Lookup Table
 *
 * Trees shift from vegetative to reproductive energy allocation:
 * - Juvenile (0-2 yrs): Vegetative growth dominates, poor fruit
 * - Transition (3-4 yrs): Beginning to bear, still developing
 * - Developing (5-7 yrs): Canopy completion, approaching potential
 * - Prime (8-18 yrs): Genetic potential realized
 * - Mature (19-25 yrs): Slight decline, still productive
 * - Declining (25+ yrs): Significant quality decline
 */
const AGE_MODIFIER_TABLE: Array<{
  maxAge: number
  modifier: number
  phase: AgeModifierResult['phase']
  description: string
}> = [
  { maxAge: 2, modifier: -0.8, phase: 'juvenile', description: 'Vegetative phase - limited fruit quality' },
  { maxAge: 4, modifier: -0.5, phase: 'transition', description: 'Transition phase - beginning to bear' },
  { maxAge: 7, modifier: -0.2, phase: 'developing', description: 'Canopy completion - approaching potential' },
  { maxAge: 18, modifier: 0.0, phase: 'prime', description: 'Prime production - genetic potential realized' },
  { maxAge: 25, modifier: -0.2, phase: 'mature', description: 'Mature trees - slight decline' },
  { maxAge: Infinity, modifier: -0.3, phase: 'declining', description: 'Declining trees - reduced quality' },
]

/**
 * Calculate age modifier for tree crops.
 *
 * @param treeAgeYears - Tree age in years, or null if unknown
 * @returns Age modifier result with phase info
 */
export function getAgeModifier(treeAgeYears: number | null | undefined): AgeModifierResult {
  // Unknown age assumes prime (conservative approach)
  if (treeAgeYears === null || treeAgeYears === undefined) {
    return {
      modifier: 0.0,
      phase: 'prime',
      description: 'Unknown age - assumed prime',
    }
  }

  // Negative age is invalid
  if (treeAgeYears < 0) {
    return {
      modifier: 0.0,
      phase: 'prime',
      description: 'Invalid age - assumed prime',
    }
  }

  // Lookup in table
  for (const entry of AGE_MODIFIER_TABLE) {
    if (treeAgeYears <= entry.maxAge) {
      return {
        modifier: entry.modifier,
        phase: entry.phase,
        description: entry.description,
      }
    }
  }

  // Fallback (shouldn't reach here)
  return {
    modifier: -0.3,
    phase: 'declining',
    description: 'Very old tree - reduced quality',
  }
}

/**
 * Simple age modifier (number only, for backwards compatibility).
 */
export function calculateAgeModifier(treeAgeYears: number | null | undefined): number {
  return getAgeModifier(treeAgeYears).modifier
}

// =============================================================================
// TIMING MODIFIER RULES
// =============================================================================

/**
 * Calculate timing modifier based on GDD distance from peak.
 *
 * Uses parabolic penalty: Timing_Mod = -G × (d / H)²
 * Where:
 *   d = |currentGDD - peakGDD| (distance from peak)
 *   H = gddHalfwidth (half the harvest window)
 *   G = maxPenalty (maximum Brix penalty)
 *
 * @param currentGdd - Current accumulated GDD
 * @param peakGdd - GDD at peak quality
 * @param gddHalfwidth - Half-width of harvest window in GDD
 * @param maxPenalty - Maximum penalty (default 1.0 Brix)
 */
export function getTimingModifier(
  currentGdd: number,
  peakGdd: number,
  gddHalfwidth: number = 150,
  maxPenalty: number = 1.0
): TimingModifierResult {
  const d = Math.abs(currentGdd - peakGdd)
  const h = gddHalfwidth

  // Inner 25% of window - no penalty (peak zone)
  if (d <= h * 0.25) {
    return {
      modifier: 0.0,
      zone: 'peak',
      description: 'At peak quality - no timing penalty',
    }
  }

  // Inner 50% - minimal penalty (optimal zone)
  if (d <= h * 0.5) {
    return {
      modifier: 0.0,
      zone: 'optimal',
      description: 'Optimal timing - minimal penalty',
    }
  }

  // Calculate parabolic penalty
  const penalty = maxPenalty * Math.pow(d / h, 2)
  const cappedPenalty = Math.min(penalty, maxPenalty * 1.5)
  const modifier = -Math.round(cappedPenalty * 100) / 100

  // Determine zone
  if (d <= h) {
    return {
      modifier,
      zone: 'acceptable',
      description: `Acceptable timing - ${Math.abs(modifier).toFixed(1)} Brix penalty`,
    }
  }

  return {
    modifier,
    zone: 'suboptimal',
    description: `Suboptimal timing - ${Math.abs(modifier).toFixed(1)} Brix penalty`,
  }
}

/**
 * Simple timing modifier (number only, for backwards compatibility).
 */
export function calculateTimingModifier(
  currentGdd: number,
  peakGdd: number,
  gddHalfwidth: number = 150,
  maxPenalty: number = 1.0
): number {
  return getTimingModifier(currentGdd, peakGdd, gddHalfwidth, maxPenalty).modifier
}

// =============================================================================
// ROOTSTOCK MODIFIER RULES
// =============================================================================

/**
 * Get rootstock Brix modifier (async, uses reference data service).
 *
 * @param rootstockId - Rootstock ID or undefined
 * @returns Brix modifier (+0.6 for quality stocks to -0.8 for vigorous)
 */
export async function getRootstockModifier(rootstockId: string | undefined): Promise<number> {
  return referenceData.getRootstockBrixModifier(rootstockId)
}

/**
 * Get rootstock modifier (sync version, direct constants lookup).
 */
export function getRootstockModifierSync(rootstockId: string | undefined): number {
  return referenceDataSync.getRootstockBrixModifier(rootstockId)
}

// =============================================================================
// CULTIVAR BASE BRIX RULES
// =============================================================================

/**
 * Get cultivar base Brix (async, uses reference data service).
 *
 * @param cultivarId - Cultivar ID
 * @returns Base Brix from research data (default 10.0 if unknown)
 */
export async function getCultivarBaseBrix(cultivarId: string): Promise<number> {
  return referenceData.getCultivarBaseBrix(cultivarId)
}

/**
 * Get cultivar base Brix (sync version).
 */
export function getCultivarBaseBrixSync(cultivarId: string): number {
  const cultivar = referenceDataSync.getCultivar(cultivarId)
  return cultivar?.researchAvgBrix ?? 10.0
}

// =============================================================================
// SUGAR/ACID CURVE RULES
// =============================================================================

/**
 * Default sugar curve parameters (citrus).
 */
export const DEFAULT_SUGAR_PARAMS: SugarCurveParams = {
  sscMin: 6.0,
  sscMax: 12.0,
  dd50: 2050,
  steepness: 350,
}

/**
 * Default acid decay parameters (citrus).
 */
export const DEFAULT_ACID_PARAMS: AcidDecayParams = {
  ta0: 3.0,
  decayRate: 0.0005,
}

/**
 * Calculate SSC (sugar) at given GDD using logistic curve.
 *
 * Formula: SSC = SSC_min + (SSC_max - SSC_min) / (1 + exp(-(GDD - DD50) / s))
 */
export function calculateSugar(
  gdd: number,
  params: Partial<SugarCurveParams> = {}
): number {
  const { sscMin, sscMax, dd50, steepness } = { ...DEFAULT_SUGAR_PARAMS, ...params }
  const ssc = sscMin + (sscMax - sscMin) / (1 + Math.exp(-(gdd - dd50) / steepness))
  return Math.round(ssc * 100) / 100
}

/**
 * Calculate TA (acid) at given GDD using exponential decay.
 *
 * Formula: TA = TA0 × exp(-ka × GDD)
 */
export function calculateAcid(
  gdd: number,
  params: Partial<AcidDecayParams> = {}
): number {
  const { ta0, decayRate } = { ...DEFAULT_ACID_PARAMS, ...params }
  const ta = ta0 * Math.exp(-decayRate * gdd)
  return Math.round(ta * 100) / 100
}

/**
 * Calculate sugar/acid ratio.
 */
export function calculateRatio(ssc: number, ta: number): number {
  if (ta <= 0) return 0
  return Math.round((ssc / ta) * 10) / 10
}

/**
 * Calculate BrimA flavor index.
 *
 * BrimA = SSC - 4 × TA
 * Higher is sweeter/less acidic.
 */
export function calculateBrimA(ssc: number, ta: number): number {
  return Math.round((ssc - 4 * ta) * 100) / 100
}

/**
 * Estimate complete sugar/acid profile at given GDD.
 */
export function estimateSugarAcid(
  gdd: number,
  sugarParams: Partial<SugarCurveParams> = {},
  acidParams: Partial<AcidDecayParams> = {}
): SugarAcidResult {
  const ssc = calculateSugar(gdd, sugarParams)
  const ta = calculateAcid(gdd, acidParams)
  const ratio = calculateRatio(ssc, ta)
  const brimA = calculateBrimA(ssc, ta)

  return { ssc, ta, ratio, brimA, gdd: Math.round(gdd) }
}

// =============================================================================
// COMPLETE BRIX PREDICTION
// =============================================================================

/**
 * Calculate all Brix components and total predicted Brix.
 *
 * This is the core SHARE formula:
 *   Peak Brix = Cultivar_Base + Rootstock_Mod + Age_Mod + Timing_Mod
 */
export async function calculateBrixComponents(
  cultivarId: string,
  rootstockId: string | undefined,
  treeAgeYears: number | null | undefined,
  currentGdd: number,
  peakGdd: number,
  gddHalfwidth: number = 150
): Promise<BrixComponents> {
  const cultivarBase = await getCultivarBaseBrix(cultivarId)
  const rootstockModifier = await getRootstockModifier(rootstockId)
  const ageModifier = calculateAgeModifier(treeAgeYears)
  const timingModifier = calculateTimingModifier(currentGdd, peakGdd, gddHalfwidth)

  const total = cultivarBase + rootstockModifier + ageModifier + timingModifier

  return {
    cultivarBase,
    rootstockModifier,
    ageModifier,
    timingModifier: Math.round(timingModifier * 100) / 100,
    total: Math.round(total * 100) / 100,
  }
}

/**
 * Calculate Brix components (sync version).
 */
export function calculateBrixComponentsSync(
  cultivarId: string,
  rootstockId: string | undefined,
  treeAgeYears: number | null | undefined,
  currentGdd: number,
  peakGdd: number,
  gddHalfwidth: number = 150
): BrixComponents {
  const cultivarBase = getCultivarBaseBrixSync(cultivarId)
  const rootstockModifier = getRootstockModifierSync(rootstockId)
  const ageModifier = calculateAgeModifier(treeAgeYears)
  const timingModifier = calculateTimingModifier(currentGdd, peakGdd, gddHalfwidth)

  const total = cultivarBase + rootstockModifier + ageModifier + timingModifier

  return {
    cultivarBase,
    rootstockModifier,
    ageModifier,
    timingModifier: Math.round(timingModifier * 100) / 100,
    total: Math.round(total * 100) / 100,
  }
}

// =============================================================================
// VALIDATION RULES
// =============================================================================

/**
 * Physical constraints for Brix values.
 */
export const BRIX_CONSTRAINTS = {
  min: 0,
  max: 30,
  typicalMin: 6,
  typicalMax: 18,
}

/**
 * Validate Brix value is within physical constraints.
 */
export function isValidBrix(brix: number): boolean {
  return brix >= BRIX_CONSTRAINTS.min && brix <= BRIX_CONSTRAINTS.max
}

/**
 * Validate Brix value is within typical range.
 */
export function isTypicalBrix(brix: number): boolean {
  return brix >= BRIX_CONSTRAINTS.typicalMin && brix <= BRIX_CONSTRAINTS.typicalMax
}

/**
 * Clamp Brix to valid range.
 */
export function clampBrix(brix: number): number {
  return Math.max(BRIX_CONSTRAINTS.min, Math.min(BRIX_CONSTRAINTS.max, brix))
}

// =============================================================================
// EXPORTS
// =============================================================================

export const rulesEngine = {
  // Age rules
  getAgeModifier,
  calculateAgeModifier,

  // Timing rules
  getTimingModifier,
  calculateTimingModifier,

  // Rootstock rules
  getRootstockModifier,
  getRootstockModifierSync,

  // Cultivar rules
  getCultivarBaseBrix,
  getCultivarBaseBrixSync,

  // Sugar/Acid curves
  calculateSugar,
  calculateAcid,
  calculateRatio,
  calculateBrimA,
  estimateSugarAcid,

  // Complete calculation
  calculateBrixComponents,
  calculateBrixComponentsSync,

  // Validation
  isValidBrix,
  isTypicalBrix,
  clampBrix,

  // Constants
  BRIX_CONSTRAINTS,
  DEFAULT_SUGAR_PARAMS,
  DEFAULT_ACID_PARAMS,
}
