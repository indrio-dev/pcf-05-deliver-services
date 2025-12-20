/**
 * =============================================================================
 * S.H.A.R.E. PROFILES
 * =============================================================================
 *
 * A ShareProfile is the CLASSIFICATION UNIT for inference.
 *
 * KEY INSIGHT: Test ONE representative product per S.H.A.R.E. Profile,
 * then infer nutrition for ALL products that map to that profile.
 *
 * Example: Scan "Happy Farms Pasture-Raised Eggs" → Extract claims →
 * Map to "Eggs > Pasture-Raised Profile" → Return grid + inferred nutrition
 *
 * Each profile represents a distinct claim-combination that produces a unique
 * grid across all 5 SHARE pillars from 3 perspectives (regulation, marketing, reality).
 *
 * ESTIMATED TOTAL: ~150-200 profiles across all food categories
 */

import type { QualityTier } from './quality-tiers'

// =============================================================================
// TYPES
// =============================================================================

export type ShareProfileCategory =
  | 'citrus'
  | 'stone_fruit'
  | 'pome_fruit'
  | 'berry'
  | 'melon'
  | 'tropical'
  | 'leafy_greens'
  | 'root_vegetable'
  | 'nightshade'
  | 'cruciferous'
  | 'beef'
  | 'bison'
  | 'pork'
  | 'poultry'
  | 'eggs'
  | 'dairy'
  | 'seafood'
  | 'honey'
  | 'oil'
  | 'nuts'
  | 'grains'
  | 'coffee'

export type ProfilePerspective = 'regulation' | 'marketing' | 'reality'

export type EnrichLevel = 'E0' | 'E1' | 'E2' | 'E3'

/**
 * ShareProfile - The classification unit for inference
 *
 * A profile is defined by:
 * 1. Category (what type of product)
 * 2. Required claims (what claims MUST be present)
 * 3. Excluded claims (what claims MUST NOT be present)
 *
 * The combination determines the quality tier and E0 estimates.
 *
 * POLYMORPHIC STRUCTURE:
 * Different product categories have different profile structures:
 * - Produce profiles have Brix estimates
 * - Animal profiles have omega ratio estimates
 * - Transformed products link to TransformationProfiles
 */

// =============================================================================
// BASE PROFILE (shared fields for all profile types)
// =============================================================================

export interface ShareProfileBase {
  id: string                          // e.g., "beef_true_grass"
  code: string                        // Short code e.g., "B-A"
  name: string                        // Display name e.g., "True Grass-Fed Beef"
  category: ShareProfileCategory
  subcategory?: string                // More specific if needed

  // Claim matching
  requiredClaims: string[]            // Claims that MUST be present
  optionalClaims?: string[]           // Claims that enhance but aren't required
  excludedClaims: string[]            // Claims that disqualify from this profile

  // Quality classification
  qualityTier: QualityTier
  qualityRank: number                 // 1 = best within category, higher = worse

  // SHARE Pillar Summaries (one-liner for each)
  soilPillarSummary: string
  heritagePillarSummary: string
  agriculturalPillarSummary: string
  ripenPillarSummary: string
  enrichPillarSummary: string

  // Metadata
  notes?: string
  redFlags?: string[]                 // Warning signs to look for
  isActive: boolean
  sortOrder: number
}

// =============================================================================
// PROFILE TYPE DISCRIMINATOR
// =============================================================================

export type ShareProfileType =
  | 'produce'           // Citrus, stone fruit, berries, vegetables - uses Brix
  | 'nut'               // Pecans, almonds, walnuts - uses oil content
  | 'animal_fresh'      // Beef, pork, poultry, eggs, dairy - uses omega ratio, no transformation
  | 'seafood'           // Fish, shellfish - uses omega-3, catch method
  | 'transformed'       // Coffee, tea, cacao, cheese, wine - links to TransformationProfiles
  | 'post_harvest'      // Honey, oils, syrups - minimal/no transformation

// =============================================================================
// PRODUCE PROFILE (Citrus, stone fruit, berries, vegetables)
// =============================================================================

export interface ProduceShareProfile extends ShareProfileBase {
  profileType: 'produce'
  primaryQualityMetric: 'brix'

  // Produce-specific fields
  estimatedBrixRange: [number, number]
  brixMidpoint: number
  optimalHarvestWindow?: string       // e.g., "middle 50% of season"
  rootstockConsiderations?: string    // For tree crops
}

// =============================================================================
// NUT PROFILE (Pecans, almonds, walnuts, etc.)
// =============================================================================
// Nuts use oil content as primary quality metric (E pillar)
// Higher oil content = better flavor, more nutrient-dense (healthy fats)

export interface NutShareProfile extends ShareProfileBase {
  profileType: 'nut'
  primaryQualityMetric: 'oil_content'

  // Nut-specific fields (E pillar - oil content is THE quality metric for nuts)
  estimatedOilContentRange: [number, number]   // % oil content [low, high]
  oilContentMidpoint: number                   // Central estimate
  kernelPercentage?: number                    // Meat vs shell ratio (higher = better value)
  shellType?: 'papershell' | 'medium' | 'hardshell'
  optimalHarvestWindow?: string                // e.g., "September-November"
  // Nut trees have even longer maturity curves than citrus
  treeMaturityConsiderations?: string          // e.g., "Peak production 15-30 years"
}

// =============================================================================
// ANIMAL FRESH PROFILE (Beef, pork, poultry, eggs, dairy)
// =============================================================================

export interface AnimalFreshShareProfile extends ShareProfileBase {
  profileType: 'animal_fresh'
  primaryQualityMetric: 'omega_ratio'

  // Animal-specific fields
  estimatedOmegaRatioRange: [number, number]   // [low, high] - lower is better
  estimatedOmegaRatioMidpoint: number
  // Feeding regime determines omega ratio outcome:
  // - grass_only: 100% grass-fed, never grains (Omega 2-3:1, True Grass profile)
  // - pasture_forage: Pasture-raised with grass + some grains/supplements (Omega 4-6:1, True Pasture profile)
  // - grain_finished: Grass-fed then finished on grain in CAFO (Omega 8-15:1, Marketing Grass profile)
  // - grain_fed: CAFO/feedlot from start (Omega 15-20:1+, Commodity profile)
  feedingRegime: 'grass_only' | 'pasture_forage' | 'grain_finished' | 'grain_fed'
  hasCAFOExclusion?: boolean          // "No feedlot" / "No CAFO" claim - distinguishes True Pasture from Marketing Pasture

  // R pillar: Age at harvest - structured data for age_maturity algorithm
  // Longer time on proper feeding regime (A pillar) = better omega ratio (E pillar)
  ageAtHarvest?: {
    range: [number, number]           // [min, max] in specified unit
    unit: 'weeks' | 'months'          // Poultry in weeks, beef/pork in months
    optimal?: number                  // Optimal harvest age for quality
    commodity?: number                // Typical commodity timeline for comparison
  }

  maturityConsiderations?: string     // e.g., "24mo for beef" - legacy text field
  agingProfile?: string               // e.g., "dry-aged 21 days"
}

// =============================================================================
// SEAFOOD PROFILE
// =============================================================================

export interface SeafoodShareProfile extends ShareProfileBase {
  profileType: 'seafood'
  primaryQualityMetric: 'omega_ratio'

  // Seafood-specific fields
  estimatedOmega3Content?: number     // mg per serving
  estimatedOmegaRatioRange?: [number, number]
  catchMethod: 'wild' | 'farmed' | 'sustainable_farmed'
  waterType?: 'cold_ocean' | 'warm_ocean' | 'freshwater' | 'brackish'
  seasonality?: string                // e.g., "R months for oysters"
}

// =============================================================================
// TRANSFORMED PRODUCT PROFILE (Coffee, tea, cacao, cheese, wine)
// =============================================================================
// These products have a transformation chain where quality can be gained/lost
// They link to TransformationProfiles for post-harvest quality inference

export interface TransformedShareProfile extends ShareProfileBase {
  profileType: 'transformed'
  primaryQualityMetric: 'brix' | 'none'  // Origin metric (e.g., cherry Brix for coffee)

  // Origin quality (SHARE applies here)
  estimatedOriginQuality?: {
    metric: string                    // "cherry_brix", "leaf_grade", "milk_quality"
    range?: [number, number]
    description: string
  }

  // Transformation link - THIS IS THE KEY ADDITION
  hasTransformation: true
  transformationCategory: string      // e.g., "coffee", "tea", "cacao", "cheese"
  compatibleTransformationProfiles: string[]  // IDs of TransformationProfiles that apply
  defaultTransformationProfileId?: string     // Default if not specified

  // Final quality expectation (after transformation)
  expectedFinalQuality?: {
    metric: string                    // "cupping_score", "flavor_profile"
    range?: [number, number]
    description: string
  }
}

// =============================================================================
// POST-HARVEST PROFILE (Honey, oils, syrups - minimal transformation)
// =============================================================================

export interface PostHarvestShareProfile extends ShareProfileBase {
  profileType: 'post_harvest'
  primaryQualityMetric: 'none' | 'polyphenols' | 'enzyme_activity'

  // Post-harvest specific
  processingLevel: 'raw' | 'minimally_processed' | 'processed'
  qualityIndicators?: string[]        // e.g., ["raw", "unfiltered", "cold-pressed"]

  // E pillar: Honey-specific quality metrics
  // These are the measurable attributes that S+H+A+R combine to produce
  honeyQuality?: {
    // Enzyme activity - THE key quality indicator for raw vs processed
    // Diastase enzyme destroyed by heating - measures processing damage
    estimatedDiastaseNumber?: [number, number]  // DN units; raw >8, good >15, exceptional >25
    // Moisture content - affects shelf stability and quality
    estimatedMoistureContent?: [number, number] // %; premium <18%, acceptable <20%
    // Pollen diversity - indicates forage variety and authenticity
    pollenDiversity?: 'high' | 'medium' | 'low' | 'filtered'  // filtered = ultra-processed
    // HMF (hydroxymethylfurfural) - heat damage indicator
    estimatedHMF?: [number, number]             // mg/kg; fresh <10, acceptable <40, processed >40
    // Color/grade (USDA)
    colorGrade?: 'water_white' | 'extra_white' | 'white' | 'extra_light_amber' | 'light_amber' | 'amber' | 'dark_amber'
    // Varietal purity - single vs blended forage source
    varietalPurity?: 'monofloral' | 'polyfloral' | 'blended' | 'unknown'
  }

  // E pillar: Olive oil-specific quality metrics (for future expansion)
  oilQuality?: {
    estimatedPolyphenolContent?: [number, number]  // mg/kg; high >300, premium >500
    estimatedFreeAcidity?: [number, number]        // %; extra virgin <0.8%
    estimatedPeroxideValue?: [number, number]      // mEq/kg; fresh <20
    harvestTiming?: 'early' | 'mid' | 'late'       // Early = more polyphenols, more bitter
  }
}

// =============================================================================
// UNION TYPE (discriminated union for type safety)
// =============================================================================

export type ShareProfile =
  | ProduceShareProfile
  | NutShareProfile
  | AnimalFreshShareProfile
  | SeafoodShareProfile
  | TransformedShareProfile
  | PostHarvestShareProfile

// =============================================================================
// LEGACY INTERFACE (for backwards compatibility during migration)
// =============================================================================
// TODO: Migrate all existing profiles to new discriminated union types

export interface ShareProfileLegacy {
  id: string                          // e.g., "beef_true_grass"
  code: string                        // Short code e.g., "B-A"
  name: string                        // Display name e.g., "True Grass-Fed Beef"
  category: ShareProfileCategory
  subcategory?: string                // More specific if needed

  // Claim matching
  requiredClaims: string[]            // Claims that MUST be present
  optionalClaims?: string[]           // Claims that enhance but aren't required
  excludedClaims: string[]            // Claims that disqualify from this profile

  // Quality classification
  qualityTier: QualityTier
  qualityRank: number                 // 1 = best within category, higher = worse

  // E0 Estimates (profile-based inference)
  estimatedBrixRange?: [number, number]       // For produce
  estimatedOmegaRatioRange?: [number, number] // For animal products [low, high]
  estimatedOmegaRatioMidpoint?: number        // Central estimate
  primaryQualityMetric: 'brix' | 'omega_ratio' | 'usda_grade' | 'polyphenols'

  // SHARE Pillar Summaries (one-liner for each)
  soilPillarSummary: string
  heritagePillarSummary: string
  agriculturalPillarSummary: string
  ripenPillarSummary: string
  enrichPillarSummary: string

  // Metadata
  notes?: string
  redFlags?: string[]                 // Warning signs to look for
  isActive: boolean
  sortOrder: number
}

/**
 * ShareProfileGrid - The 3x5 grid for a profile
 *
 * 3 perspectives (rows):
 *   - regulation: What the law actually requires/allows
 *   - marketing: What brands claim/imply
 *   - reality: What Fielder assessment shows
 *
 * 5 pillars (columns):
 *   - S: Soil/Foundation
 *   - H: Heritage/Genetics
 *   - A: Agricultural Practices
 *   - R: Ripen/Timing
 *   - E: Enrich/Quality
 */
export interface ShareProfileGrid {
  id: string
  shareProfileId: string
  perspective: ProfilePerspective

  // The 5 pillar contents
  soilContent: string
  heritageContent: string
  agriculturalContent: string
  ripenContent: string
  enrichContent: string

  // Cell states (what the claim addresses)
  soilState: 'silence' | 'partial' | 'addressed'
  heritageState: 'silence' | 'partial' | 'addressed'
  agriculturalState: 'silence' | 'partial' | 'addressed'
  ripenState: 'silence' | 'partial' | 'addressed'
  enrichState: 'silence' | 'partial' | 'addressed'
}

// =============================================================================
// BEEF PROFILES (A-F Classification from CLAUDE.md)
// =============================================================================
// These use AnimalFreshShareProfile with the 'animal_fresh' discriminator

export const BEEF_PROFILES: AnimalFreshShareProfile[] = [
  // Profile A: True Grass-Fed (BEST)
  {
    profileType: 'animal_fresh',
    id: 'beef_true_grass',
    code: 'B-A',
    name: 'True Grass-Fed Beef',
    category: 'beef',
    requiredClaims: ['100% grass-fed', 'grass-finished'],
    optionalClaims: ['no feedlot', 'no CAFO', 'never confined'],
    excludedClaims: ['grain-finished', 'grain-supplemented'],
    qualityTier: 'premium',
    qualityRank: 1,
    primaryQualityMetric: 'omega_ratio',
    estimatedOmegaRatioRange: [2, 3],
    estimatedOmegaRatioMidpoint: 2.5,
    feedingRegime: 'grass_only',
    hasCAFOExclusion: true,           // Implicitly excluded by "100% grass-fed" or "grass-finished"
    maturityConsiderations: '24-30 months for full maturity on grass-only diet',
    soilPillarSummary: 'Pasture quality determines nutrition foundation',
    heritagePillarSummary: 'Any breed can be grass-fed; breed affects marbling potential',
    agriculturalPillarSummary: '100% forage diet, no grain, no feedlot time',
    ripenPillarSummary: 'Variable age at harvest; grass-only takes longer to finish',
    enrichPillarSummary: 'Optimal omega ratio (2-3:1), high CLA, anti-inflammatory profile',
    notes: 'The gold standard for beef health. Requires explicit "grass-finished" or "100%" claim.',
    redFlags: ['Says "grass-fed" without "finished" or "100%"'],
    isActive: true,
    sortOrder: 1,
  },

  // Profile B: True Pasture-Raised
  {
    profileType: 'animal_fresh',
    id: 'beef_true_pasture',
    code: 'B-B',
    name: 'True Pasture-Raised Beef',
    category: 'beef',
    requiredClaims: ['pasture-raised'],
    optionalClaims: ['no feedlot', 'no CAFO', 'free-choice grain'],
    excludedClaims: ['feedlot', 'CAFO'],
    qualityTier: 'premium',
    qualityRank: 2,
    primaryQualityMetric: 'omega_ratio',
    estimatedOmegaRatioRange: [4, 6],
    estimatedOmegaRatioMidpoint: 5,
    feedingRegime: 'pasture_forage',  // Grass + some grains/supplements, but NO feedlot
    hasCAFOExclusion: true,           // Must have "no feedlot" / "no CAFO" claim
    maturityConsiderations: '20-24 months typical for pasture-finished',
    soilPillarSummary: 'Pasture quality varies; rotational grazing improves',
    heritagePillarSummary: 'Any breed; some better suited to pasture than others',
    agriculturalPillarSummary: 'On pasture with possible grain supplementation, NO feedlot',
    ripenPillarSummary: 'Full maturity possible on pasture',
    enrichPillarSummary: 'Good omega ratio (4-6:1), some grain impact but not feedlot-level',
    notes: 'Requires explicit CAFO exclusion claim. "Pasture-raised" alone is marketing.',
    redFlags: ['No explicit "no feedlot" or "no CAFO" claim'],
    isActive: true,
    sortOrder: 2,
  },

  // Profile C: Marketing Grass-Fed
  {
    profileType: 'animal_fresh',
    id: 'beef_marketing_grass',
    code: 'B-C',
    name: '"Grass-Fed" (Marketing Claim)',
    category: 'beef',
    requiredClaims: ['grass-fed'],
    excludedClaims: ['grass-finished', '100% grass-fed', 'no feedlot'],
    qualityTier: 'standard',
    qualityRank: 3,
    primaryQualityMetric: 'omega_ratio',
    estimatedOmegaRatioRange: [8, 15],
    estimatedOmegaRatioMidpoint: 11,
    feedingRegime: 'grain_finished',
    maturityConsiderations: '18-22 months with 3-4 month feedlot finishing',
    soilPillarSummary: 'Unknown - likely started on pasture',
    heritagePillarSummary: 'Any breed',
    agriculturalPillarSummary: 'Grass-fed but likely grain-FINISHED in feedlot (3-4 months)',
    ripenPillarSummary: 'Standard feedlot finishing timeline',
    enrichPillarSummary: 'Moderate omega ratio (8-15:1) - grain finishing degrades profile',
    notes: 'USDA withdrew grass-fed standard in 2016. Anyone can use term. Assume grain-finished.',
    redFlags: ['No finishing claim', 'No CAFO exclusion'],
    isActive: true,
    sortOrder: 3,
  },

  // Profile D: Marketing Pasture-Raised
  {
    profileType: 'animal_fresh',
    id: 'beef_marketing_pasture',
    code: 'B-D',
    name: '"Pasture-Raised" (Marketing Claim)',
    category: 'beef',
    requiredClaims: ['pasture-raised'],
    excludedClaims: ['no feedlot', 'no CAFO', '100% grass-fed'],
    qualityTier: 'standard',
    qualityRank: 4,
    primaryQualityMetric: 'omega_ratio',
    estimatedOmegaRatioRange: [12, 18],
    estimatedOmegaRatioMidpoint: 15,
    feedingRegime: 'grain_finished',
    maturityConsiderations: '18-24 months with extended feedlot finishing',
    soilPillarSummary: 'Unknown - started on pasture',
    heritagePillarSummary: 'Any breed',
    agriculturalPillarSummary: 'Started on pasture, finished in feedlot (3-6 months)',
    ripenPillarSummary: 'Extended feedlot time common',
    enrichPillarSummary: 'Poor omega ratio (12-18:1) due to feedlot finishing',
    notes: 'Without explicit CAFO exclusion, assume feedlot finishing.',
    redFlags: ['No explicit CAFO/feedlot exclusion'],
    isActive: true,
    sortOrder: 4,
  },

  // Profile E: Commodity Beef
  {
    profileType: 'animal_fresh',
    id: 'beef_commodity',
    code: 'B-E',
    name: 'Commodity Beef',
    category: 'beef',
    requiredClaims: [],
    excludedClaims: ['grass-fed', 'pasture-raised', 'organic'],
    qualityTier: 'commodity',
    qualityRank: 5,
    primaryQualityMetric: 'omega_ratio',
    estimatedOmegaRatioRange: [15, 20],
    estimatedOmegaRatioMidpoint: 17,
    feedingRegime: 'grain_fed',
    maturityConsiderations: '14-18 months fast finishing in feedlot',
    soilPillarSummary: 'Feedlot - no pasture relevance',
    heritagePillarSummary: 'Commercial breeds selected for growth rate',
    agriculturalPillarSummary: 'Conventional feedlot: 6-8 months grain finishing',
    ripenPillarSummary: 'Fast finishing (14-18 months total age)',
    enrichPillarSummary: 'Poor omega ratio (15-20:1), pro-inflammatory',
    notes: 'Default assumption when no claims made. Includes most grocery store beef.',
    isActive: true,
    sortOrder: 5,
  },

  // Profile E2: "Natural" Beef (Commodity + Marketing)
  {
    profileType: 'animal_fresh',
    id: 'beef_natural',
    code: 'B-E2',
    name: '"Natural" Beef',
    category: 'beef',
    requiredClaims: ['natural'],
    optionalClaims: ['no antibiotics', 'no hormones', 'no mRNA'],
    excludedClaims: ['grass-fed', 'pasture-raised', 'no feedlot'],
    qualityTier: 'commodity',
    qualityRank: 5,
    primaryQualityMetric: 'omega_ratio',
    estimatedOmegaRatioRange: [15, 20],
    estimatedOmegaRatioMidpoint: 17,
    feedingRegime: 'grain_fed',
    maturityConsiderations: '14-18 months same as commodity',
    soilPillarSummary: 'Feedlot - same as commodity',
    heritagePillarSummary: 'Commercial breeds',
    agriculturalPillarSummary: 'Same feedlot as commodity + one checkbox (no antibiotics/hormones)',
    ripenPillarSummary: 'Same as commodity',
    enrichPillarSummary: 'Same omega ratio as commodity (15-20:1) - the checkbox doesn\'t change this',
    notes: '"Natural" is commodity beef with marketing. Same feedlot duration = same omega profile.',
    redFlags: ['Implying health benefit from "natural" claim'],
    isActive: true,
    sortOrder: 6,
  },

  // Profile F: Premium CAFO (WORST for health)
  {
    profileType: 'animal_fresh',
    id: 'beef_premium_cafo',
    code: 'B-F',
    name: 'Premium CAFO Beef (Wagyu/Prime)',
    category: 'beef',
    requiredClaims: ['wagyu', 'prime', 'american wagyu'],
    excludedClaims: ['grass-fed', 'grass-finished', 'pasture-raised', 'no feedlot'],
    qualityTier: 'commodity', // Health-wise it's worst despite price
    qualityRank: 6,
    primaryQualityMetric: 'omega_ratio',
    estimatedOmegaRatioRange: [20, 26],
    estimatedOmegaRatioMidpoint: 23,
    feedingRegime: 'grain_fed',
    maturityConsiderations: '24-30+ months with 12+ months extended feedlot for marbling',
    soilPillarSummary: 'Feedlot - extended duration',
    heritagePillarSummary: 'Wagyu genetics (marbling focus)',
    agriculturalPillarSummary: 'EXTENDED feedlot (12+ months) for maximum marbling',
    ripenPillarSummary: 'Longest feedlot time (24-30+ months total age)',
    enrichPillarSummary: 'WORST omega ratio (20-26:1) due to extended grain feeding',
    notes: 'The price/health INVERSION. Most expensive = worst omega ratio. Extended feedlot time for marbling.',
    redFlags: ['High price implies health benefit', 'No process claims beyond breed/grade'],
    isActive: true,
    sortOrder: 7,
  },
]

// =============================================================================
// CITRUS PROFILES
// =============================================================================
// These use ProduceShareProfile with the 'produce' discriminator

export const CITRUS_PROFILES: ProduceShareProfile[] = [
  // Regenerative Citrus (Best)
  {
    profileType: 'produce',
    id: 'citrus_regenerative',
    code: 'C-A',
    name: 'Regenerative Citrus',
    category: 'citrus',
    requiredClaims: ['regenerative'],
    optionalClaims: ['organic', 'biodynamic'],
    excludedClaims: [],
    qualityTier: 'artisan',
    qualityRank: 1,
    primaryQualityMetric: 'brix',
    estimatedBrixRange: [13, 18],
    brixMidpoint: 15.5,
    optimalHarvestWindow: 'middle 50% of season',
    soilPillarSummary: 'Mineralized soil, cover crops, soil biology focus',
    heritagePillarSummary: 'Often heritage cultivars; quality-focused selection',
    agriculturalPillarSummary: 'Regenerative practices: minimal inputs, soil-building',
    ripenPillarSummary: 'Tree-ripened to peak; quality over yield',
    enrichPillarSummary: 'Highest Brix potential (13-18), high polyphenols from stress response',
    notes: 'Best of both worlds: high primary AND secondary nutrition',
    isActive: true,
    sortOrder: 1,
  },

  // Organic Citrus
  {
    profileType: 'produce',
    id: 'citrus_organic',
    code: 'C-B',
    name: 'Organic Citrus',
    category: 'citrus',
    requiredClaims: ['organic', 'USDA Organic'],
    excludedClaims: [],
    qualityTier: 'premium',
    qualityRank: 2,
    primaryQualityMetric: 'brix',
    estimatedBrixRange: [10, 14],
    brixMidpoint: 12,
    optimalHarvestWindow: 'middle 50% of season',
    soilPillarSummary: 'Soil management required; quality varies widely',
    heritagePillarSummary: 'Non-GMO required; cultivar varies',
    agriculturalPillarSummary: 'No synthetic inputs; organic-approved only',
    ripenPillarSummary: 'Same harvest timing pressures as conventional',
    enrichPillarSummary: 'Variable Brix (10-14); higher polyphenols from stress',
    notes: 'Organic certification is about INPUTS, not outcomes. Brix can be high or low.',
    redFlags: ['Assuming organic = higher nutrition'],
    isActive: true,
    sortOrder: 2,
  },

  // IPM Citrus
  {
    profileType: 'produce',
    id: 'citrus_ipm',
    code: 'C-C',
    name: 'IPM Citrus',
    category: 'citrus',
    requiredClaims: ['IPM', 'integrated pest management'],
    excludedClaims: [],
    qualityTier: 'premium',
    qualityRank: 3,
    primaryQualityMetric: 'brix',
    estimatedBrixRange: [10, 14],
    brixMidpoint: 12,
    optimalHarvestWindow: 'middle 50% of season',
    soilPillarSummary: 'Varies by operation; some excellent soil programs',
    heritagePillarSummary: 'Any cultivar; often quality-focused operations',
    agriculturalPillarSummary: 'Pragmatic: inputs only when needed, threshold-based',
    ripenPillarSummary: 'Quality-focused operations often hold for better timing',
    enrichPillarSummary: 'Can match or exceed organic in primary nutrition',
    notes: '70%+ of citrus uses IPM. Often indicates quality-focused mindset.',
    isActive: true,
    sortOrder: 3,
  },

  // Conventional Citrus
  {
    profileType: 'produce',
    id: 'citrus_conventional',
    code: 'C-D',
    name: 'Conventional Citrus',
    category: 'citrus',
    requiredClaims: [],
    excludedClaims: ['organic', 'regenerative'],
    qualityTier: 'standard',
    qualityRank: 4,
    primaryQualityMetric: 'brix',
    estimatedBrixRange: [8, 12],
    brixMidpoint: 10,
    optimalHarvestWindow: 'full season',
    soilPillarSummary: 'Annual fertility approach; soil health varies',
    heritagePillarSummary: 'Often commercial cultivars bred for yield',
    agriculturalPillarSummary: 'Conventional commercial practices with careful pest monitoring',
    ripenPillarSummary: 'Harvested when USDA minimum met, not peak',
    enrichPillarSummary: 'Lower Brix typical (8-12); meets minimum standards',
    notes: 'Default grocery store citrus. Quality determined by individual operation.',
    isActive: true,
    sortOrder: 4,
  },

  // Commodity Citrus
  {
    profileType: 'produce',
    id: 'citrus_commodity',
    code: 'C-E',
    name: 'Commodity Citrus',
    category: 'citrus',
    requiredClaims: [],
    excludedClaims: ['organic', 'regenerative', 'premium', 'heritage'],
    qualityTier: 'commodity',
    qualityRank: 5,
    primaryQualityMetric: 'brix',
    estimatedBrixRange: [8, 10],
    brixMidpoint: 9,
    optimalHarvestWindow: 'full season',
    soilPillarSummary: 'Industrial scale; minimal soil investment',
    heritagePillarSummary: 'Yield-focused cultivars on vigor rootstocks',
    agriculturalPillarSummary: 'High-volume production focused on yield and shipping durability',
    ripenPillarSummary: 'Early harvest for shipping; meets minimums',
    enrichPillarSummary: 'Lowest Brix (8-10); dilution effect from yield focus',
    notes: 'Large-scale commodity production. Appearance over internal quality.',
    isActive: true,
    sortOrder: 5,
  },
]

// =============================================================================
// EGG PROFILES
// =============================================================================
// These use AnimalFreshShareProfile with the 'animal_fresh' discriminator

export const EGG_PROFILES: AnimalFreshShareProfile[] = [
  // True Pasture-Raised Eggs (Best)
  // Requires explicit verification - "pasture-raised" alone is marketing
  {
    profileType: 'animal_fresh',
    id: 'eggs_true_pasture',
    code: 'E-A',
    name: 'True Pasture-Raised Eggs',
    category: 'eggs',
    requiredClaims: ['pasture-raised', 'no confinement'],  // Must have explicit exclusion
    optionalClaims: ['108 sq ft/bird', 'rotational grazing', 'mobile coops'],
    excludedClaims: ['barn-raised', 'indoor'],
    qualityTier: 'premium',
    qualityRank: 1,
    primaryQualityMetric: 'omega_ratio',
    estimatedOmegaRatioRange: [1.5, 4],
    estimatedOmegaRatioMidpoint: 2.5,
    feedingRegime: 'pasture_forage',  // Hens forage grass/insects + supplemental grain
    hasCAFOExclusion: true,           // Required for this profile
    soilPillarSummary: 'Pasture quality affects forage nutrition',
    heritagePillarSummary: 'Heritage breeds often better foragers',
    agriculturalPillarSummary: 'True outdoor access, rotating pastures, insect/forage diet',
    ripenPillarSummary: 'Freshness critical; local = better',
    enrichPillarSummary: 'Best omega ratio (1.5-4:1), high vitamin D, orange yolks',
    notes: 'Look for specific sq ft claims (108+ sq ft/bird). Vital Farms tested at 23.5% omega-6.',
    redFlags: ['No space-per-bird claim', 'Industrial "pasture-raised" certification'],
    isActive: true,
    sortOrder: 1,
  },

  // Organic Pasture-Raised
  // Requires explicit verification - organic + pasture-raised alone is still marketing
  {
    profileType: 'animal_fresh',
    id: 'eggs_organic_pasture',
    code: 'E-B',
    name: 'Organic Pasture-Raised Eggs',
    category: 'eggs',
    requiredClaims: ['organic', 'pasture-raised', 'no confinement'],  // Must have explicit exclusion
    excludedClaims: ['barn-raised', 'indoor'],
    qualityTier: 'premium',
    qualityRank: 2,
    primaryQualityMetric: 'omega_ratio',
    estimatedOmegaRatioRange: [3, 6],
    estimatedOmegaRatioMidpoint: 4.5,
    feedingRegime: 'pasture_forage',  // Organic pasture + organic supplemental grain
    hasCAFOExclusion: true,           // Required for this profile
    soilPillarSummary: 'Organic pasture management',
    heritagePillarSummary: 'Non-GMO required; breed varies',
    agriculturalPillarSummary: 'Organic feed + outdoor access; feed quality matters',
    ripenPillarSummary: 'Standard freshness considerations',
    enrichPillarSummary: 'Good omega ratio (3-6:1) if true pasture access',
    notes: 'Organic feed is still often grain-based. Pasture access is the key variable.',
    redFlags: ['Organic without space claims'],
    isActive: true,
    sortOrder: 2,
  },

  // Free-Range Eggs
  {
    profileType: 'animal_fresh',
    id: 'eggs_free_range',
    code: 'E-C',
    name: 'Free-Range Eggs',
    category: 'eggs',
    requiredClaims: ['free-range'],
    excludedClaims: ['pasture-raised'],
    qualityTier: 'standard',
    qualityRank: 3,
    primaryQualityMetric: 'omega_ratio',
    estimatedOmegaRatioRange: [8, 15],
    estimatedOmegaRatioMidpoint: 11,
    feedingRegime: 'grain_finished',
    soilPillarSummary: 'Minimal pasture relevance',
    heritagePillarSummary: 'Commercial laying breeds',
    agriculturalPillarSummary: 'Access to outdoors (often small concrete area); mainly grain-fed',
    ripenPillarSummary: 'Standard commercial timeline',
    enrichPillarSummary: 'Moderate omega ratio (8-15:1); grain diet dominates',
    notes: '"Free-range" requires outdoor ACCESS but not actual pasture time.',
    redFlags: ['Implying equivalent to pasture-raised'],
    isActive: true,
    sortOrder: 3,
  },

  // Cage-Free Eggs
  {
    profileType: 'animal_fresh',
    id: 'eggs_cage_free',
    code: 'E-D',
    name: 'Cage-Free Eggs',
    category: 'eggs',
    requiredClaims: ['cage-free'],
    excludedClaims: ['free-range', 'pasture-raised'],
    qualityTier: 'standard',
    qualityRank: 4,
    primaryQualityMetric: 'omega_ratio',
    estimatedOmegaRatioRange: [12, 18],
    estimatedOmegaRatioMidpoint: 15,
    feedingRegime: 'grain_fed',
    soilPillarSummary: 'No pasture relevance',
    heritagePillarSummary: 'Commercial laying breeds',
    agriculturalPillarSummary: 'Barn housing, no outdoor access, all-grain diet',
    ripenPillarSummary: 'Standard commercial timeline',
    enrichPillarSummary: 'Poor omega ratio (12-18:1); same as commodity grain-fed',
    notes: '"Cage-free" just means not in battery cages. Still indoor, grain-fed.',
    redFlags: ['Marketing as significantly healthier than conventional'],
    isActive: true,
    sortOrder: 4,
  },

  // Conventional Eggs
  {
    profileType: 'animal_fresh',
    id: 'eggs_conventional',
    code: 'E-E',
    name: 'Conventional Eggs',
    category: 'eggs',
    requiredClaims: [],
    excludedClaims: ['organic', 'free-range', 'pasture-raised', 'cage-free'],
    qualityTier: 'commodity',
    qualityRank: 5,
    primaryQualityMetric: 'omega_ratio',
    estimatedOmegaRatioRange: [15, 20],
    estimatedOmegaRatioMidpoint: 17,
    feedingRegime: 'grain_fed',
    soilPillarSummary: 'No pasture relevance',
    heritagePillarSummary: 'Commercial laying breeds, yield-focused',
    agriculturalPillarSummary: 'Battery cages or high-density barns, all-grain diet',
    ripenPillarSummary: 'Industrial efficiency timeline',
    enrichPillarSummary: 'Worst omega ratio (15-20:1); pure grain diet',
    notes: 'Standard commodity eggs. The chicken IS a seed oil in egg form.',
    isActive: true,
    sortOrder: 5,
  },
]

// =============================================================================
// PORK PROFILES
// =============================================================================
// These use AnimalFreshShareProfile with the 'animal_fresh' discriminator

export const PORK_PROFILES: AnimalFreshShareProfile[] = [
  {
    profileType: 'animal_fresh',
    id: 'pork_pasture_heritage',
    code: 'P-A',
    name: 'Pasture-Raised Heritage Pork',
    category: 'pork',
    requiredClaims: ['pasture-raised', 'heritage breed'],
    optionalClaims: ['Berkshire', 'Duroc', 'Red Wattle', 'no confinement'],
    excludedClaims: ['CAFO'],
    qualityTier: 'artisan',
    qualityRank: 1,
    primaryQualityMetric: 'omega_ratio',
    estimatedOmegaRatioRange: [4, 8],
    estimatedOmegaRatioMidpoint: 6,
    feedingRegime: 'pasture_forage',  // Pigs forage + supplemental grain on pasture
    hasCAFOExclusion: true,           // Explicit "no confinement" claim
    maturityConsiderations: '10-12 months for full maturity',
    soilPillarSummary: 'Pasture and woodland access',
    heritagePillarSummary: 'Heritage breeds (Berkshire, Duroc, etc.) with flavor genetics',
    agriculturalPillarSummary: 'Outdoor raising, forage + supplemental feed',
    ripenPillarSummary: 'Full maturity (10-12 months vs 5-6 commodity)',
    enrichPillarSummary: 'Better omega ratio (4-8:1), higher intramuscular fat',
    notes: 'True heritage pork with outdoor access. Significant flavor difference.',
    isActive: true,
    sortOrder: 1,
  },

  {
    profileType: 'animal_fresh',
    id: 'pork_pasture',
    code: 'P-B',
    name: 'Pasture-Raised Pork',
    category: 'pork',
    requiredClaims: ['pasture-raised'],
    excludedClaims: ['CAFO', 'confinement'],
    qualityTier: 'premium',
    qualityRank: 2,
    primaryQualityMetric: 'omega_ratio',
    estimatedOmegaRatioRange: [6, 12],
    estimatedOmegaRatioMidpoint: 9,
    feedingRegime: 'pasture_forage',  // Pigs forage + supplemental grain
    hasCAFOExclusion: true,           // Explicit exclusion required
    maturityConsiderations: '8-10 months typical',
    soilPillarSummary: 'Pasture access',
    heritagePillarSummary: 'May be commercial or heritage breeds',
    agriculturalPillarSummary: 'Outdoor raising with grain supplementation',
    ripenPillarSummary: 'Usually longer than commodity (8-10 months)',
    enrichPillarSummary: 'Moderate omega ratio (6-12:1)',
    notes: 'Pasture-raised without heritage breed claim.',
    isActive: true,
    sortOrder: 2,
  },

  {
    profileType: 'animal_fresh',
    id: 'pork_commodity',
    code: 'P-E',
    name: 'Commodity Pork',
    category: 'pork',
    requiredClaims: [],
    excludedClaims: ['pasture-raised', 'heritage'],
    qualityTier: 'commodity',
    qualityRank: 5,
    primaryQualityMetric: 'omega_ratio',
    estimatedOmegaRatioRange: [15, 25],
    estimatedOmegaRatioMidpoint: 20,
    feedingRegime: 'grain_fed',
    maturityConsiderations: '5-6 months fast growth',
    soilPillarSummary: 'Confinement - no relevance',
    heritagePillarSummary: 'Commercial breeds selected for leanness/growth',
    agriculturalPillarSummary: 'CAFO confinement, all-grain diet',
    ripenPillarSummary: 'Fast growth (5-6 months)',
    enrichPillarSummary: 'Poor omega ratio (15-25:1), lean but inflammatory',
    notes: 'Standard grocery store pork. Confinement operations.',
    isActive: true,
    sortOrder: 5,
  },
]

// =============================================================================
// POULTRY PROFILES
// =============================================================================
// These use AnimalFreshShareProfile with the 'animal_fresh' discriminator

export const POULTRY_PROFILES: AnimalFreshShareProfile[] = [
  // True Pasture-Raised Chicken
  // Requires explicit verification - "pasture-raised" alone is marketing
  {
    profileType: 'animal_fresh',
    id: 'chicken_pasture',
    code: 'CH-A',
    name: 'True Pasture-Raised Chicken',
    category: 'poultry',
    requiredClaims: ['pasture-raised', 'no confinement'],  // Must have explicit exclusion
    optionalClaims: ['no corn', 'no soy', 'heritage breed'],
    excludedClaims: ['barn-raised', 'indoor', 'house-raised'],
    qualityTier: 'premium',
    qualityRank: 1,
    primaryQualityMetric: 'omega_ratio',
    estimatedOmegaRatioRange: [4, 10],
    estimatedOmegaRatioMidpoint: 7,
    feedingRegime: 'pasture_forage',  // Chickens forage insects/grass + supplemental grain
    hasCAFOExclusion: true,           // Required for this profile
    // R pillar: Structured age at harvest data
    ageAtHarvest: {
      range: [12, 16],                // 12-16 weeks for heritage/pasture birds
      unit: 'weeks',
      optimal: 14,                    // Peak flavor/nutrition at ~14 weeks
      commodity: 6,                   // Commodity birds harvested at 6-8 weeks
    },
    maturityConsiderations: '12+ weeks grow-out for full flavor and nutrient development',
    soilPillarSummary: 'Pasture quality affects insect/forage availability and diet diversity',
    heritagePillarSummary: 'Heritage breeds better foragers; slower growing genetics = more time for nutrient accumulation',
    agriculturalPillarSummary: 'Outdoor access, insect foraging (protein + micronutrients), supplemental grain',
    ripenPillarSummary: 'Longer grow-out (12-16 weeks vs 6-8 commodity) allows full muscular development and omega profile accumulation',
    enrichPillarSummary: 'Better omega ratio (4-10:1) from forage. Higher micronutrient density from diet variety (insects, grass). More developed protein structure from slower growth. Still some grain impact on omega-6.',
    notes: 'True pasture-raised with meaningful outdoor time. The longer growth period + diverse diet = measurably different nutrition profile vs fast-grown grain-fed birds.',
    redFlags: ['Industrial "pasture-raised" with minimal outdoor time'],
    isActive: true,
    sortOrder: 1,
  },

  {
    profileType: 'animal_fresh',
    id: 'chicken_organic',
    code: 'CH-B',
    name: 'Organic Chicken',
    category: 'poultry',
    requiredClaims: ['organic', 'USDA Organic'],
    excludedClaims: [],
    qualityTier: 'standard',
    qualityRank: 2,
    primaryQualityMetric: 'omega_ratio',
    estimatedOmegaRatioRange: [10, 18],
    estimatedOmegaRatioMidpoint: 14,
    feedingRegime: 'grain_fed',
    // R pillar: Structured age at harvest data
    ageAtHarvest: {
      range: [7, 9],                  // Slightly longer than conventional
      unit: 'weeks',
      optimal: 8,
      commodity: 6,
    },
    maturityConsiderations: 'Standard commercial timeline (7-9 weeks)',
    soilPillarSummary: 'Minimal relevance - usually indoor with "outdoor access" technicality',
    heritagePillarSummary: 'Non-GMO feed required; commercial fast-growth breeds typical (Cornish Cross)',
    agriculturalPillarSummary: 'Organic grain diet (corn/soy); "outdoor access" often minimal door to concrete pad',
    ripenPillarSummary: 'Standard commercial timeline (7-9 weeks) - slightly longer than conventional but not enough for significant nutrient difference',
    enrichPillarSummary: 'Still grain-fed = high omega-6 (10-18:1). Organic grain ≠ healthy fat profile - the DIET matters, not certification. Limited micronutrient diversity without forage. Protein quality similar to conventional.',
    notes: 'Organic chicken is often grain-fed indoors. The chicken IS a seed oil. Organic certification controls inputs (no synthetic pesticides on feed), not nutritional outcomes.',
    redFlags: ['Assuming organic = healthy fat profile', 'Organic + grain-fed = same omega problem'],
    isActive: true,
    sortOrder: 2,
  },

  {
    profileType: 'animal_fresh',
    id: 'chicken_conventional',
    code: 'CH-E',
    name: 'Conventional Chicken',
    category: 'poultry',
    requiredClaims: [],
    excludedClaims: ['organic', 'pasture-raised', 'free-range'],
    qualityTier: 'commodity',
    qualityRank: 5,
    primaryQualityMetric: 'omega_ratio',
    estimatedOmegaRatioRange: [15, 25],
    estimatedOmegaRatioMidpoint: 20,
    feedingRegime: 'grain_fed',
    // R pillar: Structured age at harvest data
    ageAtHarvest: {
      range: [6, 8],                  // Fast-growth commodity timeline
      unit: 'weeks',
      optimal: 7,                     // Optimized for weight gain speed, not quality
      commodity: 6,                   // This IS the commodity baseline
    },
    maturityConsiderations: '6-8 weeks fast growth optimized for weight, not nutrition',
    soilPillarSummary: 'No relevance - indoor confinement, no soil contact',
    heritagePillarSummary: 'Commercial Cornish Cross - genetics selected for maximum growth speed, breast meat yield. Dilution effect: bred for yield, not nutrition.',
    agriculturalPillarSummary: 'Confinement, all corn/soy diet. Diet lacks diversity = limited micronutrient profile.',
    ripenPillarSummary: 'Fast growth (6-8 weeks) - harvested before full muscular/skeletal development. Speed prioritized over nutrient accumulation.',
    enrichPillarSummary: 'Worst omega ratio (15-25:1) - pure grain = walking seed oil. Limited micronutrients from monotonous diet. Incomplete protein development from rushed growth. High omega-6 accumulation from corn/soy.',
    notes: 'Standard grocery store chicken. Corn/soy fed = high omega-6. The fast growth + grain-only diet creates measurably inferior nutrition vs slower-grown, diverse-diet birds.',
    isActive: true,
    sortOrder: 5,
  },
]

// =============================================================================
// DAIRY PROFILES
// =============================================================================
// These use AnimalFreshShareProfile with the 'animal_fresh' discriminator

export const DAIRY_PROFILES: AnimalFreshShareProfile[] = [
  // True 100% Grass-Fed A2 Dairy
  // Requires "100% grass-fed" which implicitly excludes confinement
  {
    profileType: 'animal_fresh',
    id: 'dairy_grass_a2',
    code: 'D-A',
    name: '100% Grass-Fed A2 Dairy',
    category: 'dairy',
    requiredClaims: ['100% grass-fed', 'A2'],  // "100%" required - "grass-fed" alone is marketing
    optionalClaims: ['raw', 'pasture-raised'],
    excludedClaims: ['grain-supplemented', 'confinement'],
    qualityTier: 'artisan',
    qualityRank: 1,
    primaryQualityMetric: 'omega_ratio',
    estimatedOmegaRatioRange: [1, 3],
    estimatedOmegaRatioMidpoint: 2,
    feedingRegime: 'grass_only',
    hasCAFOExclusion: true,           // Implicit via "100% grass-fed"
    soilPillarSummary: 'Pasture quality critical for grass-fed',
    heritagePillarSummary: 'A2 genetics (Jersey, Guernsey, older breeds)',
    agriculturalPillarSummary: '100% grass diet, no grain supplementation',
    ripenPillarSummary: 'Seasonal availability in true grass-fed',
    enrichPillarSummary: 'Best omega ratio (1-3:1), high CLA, high vitamin K2',
    notes: 'True grass-fed with A2 protein genetics. Best for digestibility and nutrition.',
    isActive: true,
    sortOrder: 1,
  },

  // Verified Grass-Fed Dairy
  // Requires explicit verification - "grass-fed" alone is marketing
  {
    profileType: 'animal_fresh',
    id: 'dairy_grass',
    code: 'D-B',
    name: 'Verified Grass-Fed Dairy',
    category: 'dairy',
    requiredClaims: ['grass-fed', 'pasture-raised'],  // Both claims required for verification
    excludedClaims: ['confinement', 'feedlot'],
    qualityTier: 'premium',
    qualityRank: 2,
    primaryQualityMetric: 'omega_ratio',
    estimatedOmegaRatioRange: [2, 5],
    estimatedOmegaRatioMidpoint: 3.5,
    feedingRegime: 'pasture_forage',  // Predominantly grass + possible grain supplement
    hasCAFOExclusion: true,           // Required for this profile
    soilPillarSummary: 'Pasture quality matters',
    heritagePillarSummary: 'Various breeds; A1 protein common',
    agriculturalPillarSummary: 'Predominantly grass with possible grain supplementation',
    ripenPillarSummary: 'May have year-round availability',
    enrichPillarSummary: 'Good omega ratio (2-5:1), good CLA',
    notes: 'Grass-fed without A2 claim. Still much better than grain-fed.',
    isActive: true,
    sortOrder: 2,
  },

  {
    profileType: 'animal_fresh',
    id: 'dairy_organic',
    code: 'D-C',
    name: 'Organic Dairy',
    category: 'dairy',
    requiredClaims: ['organic'],
    excludedClaims: ['grass-fed'],
    qualityTier: 'standard',
    qualityRank: 3,
    primaryQualityMetric: 'omega_ratio',
    estimatedOmegaRatioRange: [5, 12],
    estimatedOmegaRatioMidpoint: 8,
    feedingRegime: 'grain_finished',
    soilPillarSummary: 'Some pasture access required by organic standards',
    heritagePillarSummary: 'Non-GMO required; commercial breeds common',
    agriculturalPillarSummary: 'Organic grain + some pasture; grain often dominates',
    ripenPillarSummary: 'Year-round availability',
    enrichPillarSummary: 'Moderate omega ratio (5-12:1); grain impact evident',
    notes: 'Organic doesn\'t mean grass-fed. Many organic dairies are primarily grain-fed.',
    redFlags: ['Assuming organic = grass-fed'],
    isActive: true,
    sortOrder: 3,
  },

  {
    profileType: 'animal_fresh',
    id: 'dairy_conventional',
    code: 'D-E',
    name: 'Conventional Dairy',
    category: 'dairy',
    requiredClaims: [],
    excludedClaims: ['organic', 'grass-fed'],
    qualityTier: 'commodity',
    qualityRank: 5,
    primaryQualityMetric: 'omega_ratio',
    estimatedOmegaRatioRange: [10, 20],
    estimatedOmegaRatioMidpoint: 15,
    feedingRegime: 'grain_fed',
    soilPillarSummary: 'Confinement - no pasture relevance',
    heritagePillarSummary: 'Holstein primarily; bred for volume',
    agriculturalPillarSummary: 'Grain-fed in confinement; TMR (total mixed ration)',
    ripenPillarSummary: 'Year-round industrial production',
    enrichPillarSummary: 'Poor omega ratio (10-20:1); low CLA',
    notes: 'Standard commodity dairy. Grain-fed confinement operations.',
    isActive: true,
    sortOrder: 5,
  },
]

// =============================================================================
// SEAFOOD PROFILES
// =============================================================================
// These use SeafoodShareProfile with the 'seafood' discriminator

export const SEAFOOD_PROFILES: SeafoodShareProfile[] = [
  {
    profileType: 'seafood',
    id: 'seafood_wild_cold',
    code: 'SF-A',
    name: 'Wild-Caught Cold Water Fish',
    category: 'seafood',
    requiredClaims: ['wild-caught'],
    optionalClaims: ['Alaska', 'Pacific', 'MSC certified'],
    excludedClaims: ['farm-raised'],
    qualityTier: 'premium',
    qualityRank: 1,
    primaryQualityMetric: 'omega_ratio',
    estimatedOmegaRatioRange: [0.1, 0.5],
    catchMethod: 'wild',
    waterType: 'cold_ocean',
    seasonality: 'Seasonal runs (salmon June-Sept, halibut March-Nov)',
    soilPillarSummary: 'Cold, clean ocean waters (Alaska, Pacific Northwest)',
    heritagePillarSummary: 'Wild species (salmon, halibut, cod)',
    agriculturalPillarSummary: 'Wild-caught; sustainable fishing practices',
    ripenPillarSummary: 'Seasonal runs; flash-frozen at sea preserves quality',
    enrichPillarSummary: 'Exceptional omega ratio (<1:1), high omega-3',
    notes: 'Wild cold-water fish is the gold standard for omega-3.',
    isActive: true,
    sortOrder: 1,
  },

  {
    profileType: 'seafood',
    id: 'seafood_farm_sustainable',
    code: 'SF-C',
    name: 'Sustainably Farm-Raised',
    category: 'seafood',
    requiredClaims: ['farm-raised'],
    optionalClaims: ['ASC certified', 'sustainable', 'no antibiotics'],
    excludedClaims: [],
    qualityTier: 'standard',
    qualityRank: 3,
    primaryQualityMetric: 'omega_ratio',
    estimatedOmegaRatioRange: [2, 8],
    catchMethod: 'sustainable_farmed',
    waterType: 'cold_ocean',
    seasonality: 'Year-round availability',
    soilPillarSummary: 'Aquaculture water quality varies',
    heritagePillarSummary: 'Farmed varieties; may differ from wild',
    agriculturalPillarSummary: 'Controlled feeding; feed composition determines omega profile',
    ripenPillarSummary: 'Year-round availability',
    enrichPillarSummary: 'Moderate omega ratio (2-8:1) depending on feed',
    notes: 'Farm-raised quality depends heavily on feed composition.',
    redFlags: ['Unknown feed composition'],
    isActive: true,
    sortOrder: 3,
  },

  // ---------------------------------------------------------------------------
  // OYSTER PROFILES
  // ---------------------------------------------------------------------------
  // Oysters are unique: filter-feeders that directly reflect their water body (merroir)
  // Quality metric: Not omega ratio (already excellent) but mineral content & salinity profile
  // The S pillar equivalent for oysters is WATER QUALITY, not soil

  {
    profileType: 'seafood',
    id: 'oyster_wild_premium',
    code: 'OY-A',
    name: 'Wild-Harvested Premium Oysters',
    category: 'seafood',
    subcategory: 'shellfish',
    requiredClaims: ['wild-caught', 'wild-harvested'],
    optionalClaims: ['Apalachicola', 'Chesapeake', 'Gulf', 'Atlantic', 'single-source'],
    excludedClaims: ['farm-raised', 'imported'],
    qualityTier: 'artisan',
    qualityRank: 1,
    primaryQualityMetric: 'omega_ratio',
    estimatedOmegaRatioRange: [0.1, 0.3],
    catchMethod: 'wild',
    waterType: 'brackish',  // Oysters need brackish (mix of fresh/salt)
    seasonality: 'R months (Sept-April) - avoid May-August spawning season',
    soilPillarSummary: 'Water body quality is the S pillar for oysters - salinity, minerals, cleanliness',
    heritagePillarSummary: 'Wild populations adapted to specific estuaries over generations',
    agriculturalPillarSummary: 'Wild harvest; sustainable harvest practices; size regulations',
    ripenPillarSummary: 'R months rule: harvest Sept-April, avoid spawning season (May-Aug) when quality drops',
    enrichPillarSummary: 'Exceptional omega profile, high zinc, reflects water body mineral content (merroir)',
    notes: 'Wild oysters reflect their water body - "merroir" is the oyster equivalent of terroir. Apalachicola, Chesapeake Bay, Gulf Coast each have distinct flavor profiles.',
    redFlags: ['Out of season (May-Aug)', 'Unknown water source', 'No harvest location'],
    isActive: true,
    sortOrder: 4,
  },

  {
    profileType: 'seafood',
    id: 'oyster_cultured_premium',
    code: 'OY-B',
    name: 'Cultured Premium Oysters',
    category: 'seafood',
    subcategory: 'shellfish',
    requiredClaims: ['farm-raised', 'cultured'],
    optionalClaims: ['single-origin', 'Pacific', 'Kumamoto', 'tumbled', 'cage-raised'],
    excludedClaims: ['wild-caught', 'imported'],
    qualityTier: 'premium',
    qualityRank: 2,
    primaryQualityMetric: 'omega_ratio',
    estimatedOmegaRatioRange: [0.1, 0.4],
    catchMethod: 'sustainable_farmed',
    waterType: 'cold_ocean',  // Many cultured oysters in cold Pacific waters
    seasonality: 'Year-round (cold water farms) or R months (warm water)',
    soilPillarSummary: 'Cultured in selected water bodies; farmer monitors water quality',
    heritagePillarSummary: 'Selected varieties (Pacific, Kumamoto, Eastern) bred for cup shape and flavor',
    agriculturalPillarSummary: 'Tumbling creates deep cups; cage-raising protects from predators; no feed needed (filter feeders)',
    ripenPillarSummary: 'Farmer controls harvest timing; consistent size and shape',
    enrichPillarSummary: 'Same excellent omega profile as wild; consistent mineral content from controlled environment',
    notes: 'Cultured oysters can be as good or better than wild - consistency is the advantage. Kumamotos from cold Pacific waters are exceptionally sweet.',
    isActive: true,
    sortOrder: 5,
  },

  {
    profileType: 'seafood',
    id: 'oyster_commodity',
    code: 'OY-E',
    name: 'Commodity Oysters',
    category: 'seafood',
    subcategory: 'shellfish',
    requiredClaims: [],
    excludedClaims: ['wild-caught', 'single-origin', 'premium', 'artisan'],
    qualityTier: 'commodity',
    qualityRank: 5,
    primaryQualityMetric: 'omega_ratio',
    estimatedOmegaRatioRange: [0.2, 0.6],
    catchMethod: 'farmed',
    waterType: 'brackish',
    seasonality: 'Year-round',
    soilPillarSummary: 'Unknown water source; may be questionable quality',
    heritagePillarSummary: 'Fast-growing commercial varieties',
    agriculturalPillarSummary: 'High-volume production; minimal quality controls',
    ripenPillarSummary: 'Harvested at minimum commercial size regardless of season',
    enrichPillarSummary: 'Still decent omega profile (oysters inherently healthy) but less mineral complexity',
    notes: 'Commodity oysters are often from unknown sources. Imported oysters may come from waters with less oversight.',
    redFlags: ['No origin information', 'Imported', 'Very low price point', 'Pre-shucked/jarred'],
    isActive: true,
    sortOrder: 10,
  },

  // ---------------------------------------------------------------------------
  // STONE CRAB PROFILE
  // ---------------------------------------------------------------------------
  // Stone crab is unique: ONLY claws are harvested, crab is released to regenerate
  // This is 100% sustainable by design - the gold standard for A pillar

  {
    profileType: 'seafood',
    id: 'stone_crab_florida',
    code: 'SC-A',
    name: 'Florida Stone Crab',
    category: 'seafood',
    subcategory: 'crustacean',
    requiredClaims: ['Florida', 'stone crab'],
    optionalClaims: ['colossal', 'jumbo', 'large', 'Keys', 'Gulf'],
    excludedClaims: ['imported'],
    qualityTier: 'artisan',
    qualityRank: 1,
    primaryQualityMetric: 'omega_ratio',
    estimatedOmegaRatioRange: [0.2, 0.5],
    catchMethod: 'wild',
    waterType: 'warm_ocean',
    seasonality: 'October 15 - May 1 (Florida season; strictly enforced)',
    soilPillarSummary: 'Florida Gulf and Atlantic waters; warm ocean habitat',
    heritagePillarSummary: 'Wild Menippe mercenaria - unchanged, natural population',
    agriculturalPillarSummary: 'THE sustainable harvest gold standard: only claws harvested (3.5"+ minimum), crab released to regenerate new claws',
    ripenPillarSummary: 'Strict season (Oct 15 - May 1). Claws must meet size minimum. Crab must be returned alive.',
    enrichPillarSummary: 'Dense, sweet claw meat. Exceptional protein. Low fat, high mineral content.',
    notes: 'Florida Stone Crab is the model for sustainable seafood: 100% of crabs survive harvest and regenerate claws. Size regulations ensure reproductive viability. This is what responsible A pillar practices look like.',
    redFlags: ['Out of season', 'Undersized claws (<3.5")', 'Not from Florida', 'Dead crab (claws should be fresh-cooked)'],
    isActive: true,
    sortOrder: 6,
  },
]

// =============================================================================
// HONEY PROFILES
// =============================================================================
// These use PostHarvestShareProfile with the 'post_harvest' discriminator

export const HONEY_PROFILES: PostHarvestShareProfile[] = [
  {
    profileType: 'post_harvest',
    id: 'honey_raw_local',
    code: 'H-A',
    name: 'Raw Local Honey',
    category: 'honey',
    requiredClaims: ['raw', 'unfiltered'],
    optionalClaims: ['local', 'single-source', 'varietal'],
    excludedClaims: ['pasteurized', 'filtered'],
    qualityTier: 'artisan',
    qualityRank: 1,
    primaryQualityMetric: 'enzyme_activity',
    processingLevel: 'raw',
    qualityIndicators: ['raw', 'unfiltered', 'local', 'varietal'],
    // E pillar: Structured honey quality metrics
    honeyQuality: {
      estimatedDiastaseNumber: [15, 30],        // DN >15 = good enzyme preservation
      estimatedMoistureContent: [16, 18],       // <18% = premium quality
      pollenDiversity: 'high',                  // Unfiltered retains all pollen
      estimatedHMF: [0, 15],                    // Low = never overheated
      varietalPurity: 'monofloral',             // Single-source = monofloral possible
    },
    soilPillarSummary: 'Forage source determines flavor and nutrition profile. Local terroir = unique flavor. Healthy forage = healthier bees and richer honey.',
    heritagePillarSummary: 'Bee genetics affect foraging behavior, honey composition. Italian, Carniolan, Russian breeds have different characteristics.',
    agriculturalPillarSummary: 'Never heated above hive temperature (~95°F). Gravity-strained, not filtered. No antibiotics or chemical treatments in hive.',
    ripenPillarSummary: 'Harvested only when frames are capped (bees signal readiness). Seasonal harvest timing affects flavor (spring vs fall nectar flows).',
    enrichPillarSummary: 'Maximum enzyme preservation (diastase >15). Full pollen content (nutrition + authenticity). Propolis and royal jelly traces. HMF <15 mg/kg (fresh). Moisture <18% (proper curing).',
    notes: 'True raw honey with all enzymes intact. Diastase number is THE quality metric - destroyed by heating above 104°F. Unfiltered means pollen intact, which provides protein and allows origin verification.',
    isActive: true,
    sortOrder: 1,
  },

  {
    profileType: 'post_harvest',
    id: 'honey_commercial',
    code: 'H-E',
    name: 'Commercial Honey',
    category: 'honey',
    requiredClaims: [],
    excludedClaims: ['raw', 'unfiltered'],
    qualityTier: 'commodity',
    qualityRank: 5,
    primaryQualityMetric: 'enzyme_activity',
    processingLevel: 'processed',
    qualityIndicators: [],
    // E pillar: Structured honey quality metrics
    honeyQuality: {
      estimatedDiastaseNumber: [0, 8],          // DN <8 = enzymes destroyed by pasteurization
      estimatedMoistureContent: [17, 20],       // Acceptable but not premium
      pollenDiversity: 'filtered',              // Ultra-filtered removes all pollen
      estimatedHMF: [40, 150],                  // High = heat damaged
      varietalPurity: 'blended',                // Multiple unknown origins
    },
    soilPillarSummary: 'Unknown forage sources; often blended from multiple countries (China, Argentina, India). Soil/forage quality unknown and irrelevant to buyer.',
    heritagePillarSummary: 'Unknown bee genetics. May be from colonies treated with antibiotics or chemical mite treatments.',
    agriculturalPillarSummary: 'Pasteurized (heated to 160°F+). Ultra-filtered to remove pollen (hides origin, extends shelf life). Often blended to achieve consistent color/flavor.',
    ripenPillarSummary: 'Year-round availability through global sourcing. Harvest timing unknown. May be cut with cheaper syrups.',
    enrichPillarSummary: 'Enzymes destroyed (diastase <8 or 0). Pollen removed (no nutrition, no origin verification). HMF >40 mg/kg (heat damage). Essentially flavored sugar - none of the health benefits of real honey.',
    notes: 'Commercial honey is often "honey laundered" - origin hidden through ultra-filtering. FDA found 76% of store honey had no pollen. Much is adulterated with corn syrup or rice syrup. If it doesn\'t crystallize, it\'s probably fake.',
    redFlags: ['Unknown origin', 'Ultra-filtered', 'Suspiciously low price', 'Never crystallizes', 'Perfectly clear', 'Bears/teddy bear containers'],
    isActive: true,
    sortOrder: 5,
  },
]

// =============================================================================
// NUT PROFILES (Pecans, almonds, walnuts, etc.)
// =============================================================================
// These use NutShareProfile with the 'nut' discriminator
// Primary quality metric: oil content (higher = better flavor, more nutrient-dense)
// Key SHARE insight: Native/heritage cultivars often have highest oil content
// but lowest kernel percentage - the quality/yield tradeoff

export const NUT_PROFILES: NutShareProfile[] = [
  // Native/Seedling Pecans (Best flavor, hardest to crack)
  {
    profileType: 'nut',
    id: 'pecan_native',
    code: 'N-A',
    name: 'Native/Seedling Pecans',
    category: 'nuts',
    requiredClaims: ['native', 'wild'],
    optionalClaims: ['foraged', 'heirloom grove', 'seedling'],
    excludedClaims: ['grafted', 'improved variety'],
    qualityTier: 'artisan',
    qualityRank: 1,
    primaryQualityMetric: 'oil_content',
    estimatedOilContentRange: [68, 76],
    oilContentMidpoint: 72,
    kernelPercentage: 45,
    shellType: 'hardshell',
    optimalHarvestWindow: 'October-November (after first frost)',
    treeMaturityConsiderations: 'Native groves 50-200+ years; peak flavor from mature trees',
    soilPillarSummary: 'River bottomland (alluvial) ideal; evolved in Texas/Oklahoma flood plains',
    heritagePillarSummary: 'True heritage - unchanged genetics for thousands of years',
    agriculturalPillarSummary: 'Minimal inputs; often no irrigation or spraying on native groves',
    ripenPillarSummary: 'Late harvest (Oct-Nov); frost triggers shuck split and flavor development',
    enrichPillarSummary: 'Highest oil content (68-76%), most complex flavor, hardest shell',
    notes: 'Native pecans are the gold standard for flavor - intense, complex, wild pecan taste. Small nuts, hard shells, but exceptional quality. San Saba, TX is "Pecan Capital of the World" for native groves.',
    redFlags: ['Selling "native" but from grafted trees'],
    isActive: true,
    sortOrder: 1,
  },

  // Heritage/Heirloom Pecans (Western Schley, Stuart pre-1950)
  {
    profileType: 'nut',
    id: 'pecan_heritage',
    code: 'N-B',
    name: 'Heritage Pecan Cultivars',
    category: 'nuts',
    requiredClaims: ['heritage', 'heirloom'],
    optionalClaims: ['Western Schley', 'Stuart', 'pre-1950 variety'],
    excludedClaims: ['native', 'wild'],
    qualityTier: 'premium',
    qualityRank: 2,
    primaryQualityMetric: 'oil_content',
    estimatedOilContentRange: [66, 73],
    oilContentMidpoint: 70,
    kernelPercentage: 52,
    shellType: 'papershell',
    optimalHarvestWindow: 'September-November (cultivar dependent)',
    treeMaturityConsiderations: 'Peak production 15-75 years; trees can produce for 100+ years',
    soilPillarSummary: 'Deep alluvial soil preferred; good drainage essential',
    heritagePillarSummary: 'Pre-1950 cultivars bred for flavor: Western Schley (1895), Stuart (1886)',
    agriculturalPillarSummary: 'Traditional orchard management; often lower inputs than modern varieties',
    ripenPillarSummary: 'Cultivar-specific timing; full maturity essential for oil development',
    enrichPillarSummary: 'High oil content (66-73%), excellent flavor, better cracking than native',
    notes: 'Heritage cultivars like Western Schley are considered finest-flavored commercial pecans. Stuart is the "Old Faithful" - reliable, flavorful, widely adapted.',
    isActive: true,
    sortOrder: 2,
  },

  // Premium Modern Cultivars (Desirable, Pawnee, Kanza)
  {
    profileType: 'nut',
    id: 'pecan_premium_modern',
    code: 'N-C',
    name: 'Premium Modern Pecans',
    category: 'nuts',
    requiredClaims: ['Desirable', 'Pawnee', 'Kanza'],
    optionalClaims: ['orchard grown', 'quality cultivar'],
    excludedClaims: ['native', 'heritage'],
    qualityTier: 'premium',
    qualityRank: 3,
    primaryQualityMetric: 'oil_content',
    estimatedOilContentRange: [65, 72],
    oilContentMidpoint: 68,
    kernelPercentage: 55,
    shellType: 'papershell',
    optimalHarvestWindow: 'September-October (Pawnee early), October-November (Desirable/Kanza)',
    treeMaturityConsiderations: 'Earlier bearing than heritage (5-8 years); peak at 15-40 years',
    soilPillarSummary: 'Tolerates varied soils; proper zinc supplementation important',
    heritagePillarSummary: 'Modern cultivars (post-1950) bred for balance of flavor, yield, and disease resistance',
    agriculturalPillarSummary: 'Modern orchard management; may require more inputs for optimal production',
    ripenPillarSummary: 'Predictable harvest windows; Pawnee notably early, Kanza northern-adapted',
    enrichPillarSummary: 'Good oil content (65-72%), consistent quality, easier processing',
    notes: 'Desirable (1920) is industry standard for good reason - excellent balance of flavor, size, and yield. Pawnee (1984) offers early harvest. Kanza (1996) extends pecan range northward.',
    isActive: true,
    sortOrder: 3,
  },

  // Commercial/Commodity Pecans
  {
    profileType: 'nut',
    id: 'pecan_commodity',
    code: 'N-E',
    name: 'Commodity Pecans',
    category: 'nuts',
    requiredClaims: [],
    excludedClaims: ['native', 'heritage', 'Desirable', 'Western Schley', 'artisan'],
    qualityTier: 'commodity',
    qualityRank: 5,
    primaryQualityMetric: 'oil_content',
    estimatedOilContentRange: [60, 68],
    oilContentMidpoint: 64,
    kernelPercentage: 58,
    shellType: 'papershell',
    optimalHarvestWindow: 'September-November',
    treeMaturityConsiderations: 'High-density plantings; shorter productive lifespan',
    soilPillarSummary: 'Large-scale irrigation; annual fertility approach',
    heritagePillarSummary: 'Yield-focused cultivars; genetics prioritize size and shell-out',
    agriculturalPillarSummary: 'Industrial orchard management; high inputs, mechanical harvest',
    ripenPillarSummary: 'Harvest timing optimized for volume, not peak quality',
    enrichPillarSummary: 'Lower oil content (60-68%), blander flavor, best shell-out ratio',
    notes: 'Commodity pecans prioritize yield and processing ease over flavor. Often sold in bulk for baking industry. Wichita is common commodity cultivar.',
    redFlags: ['Unspecified cultivar', 'Bulk/industrial packaging', 'Origin: China (re-shelled)'],
    isActive: true,
    sortOrder: 5,
  },
]

// =============================================================================
// COFFEE SHARE PROFILES (Origin Quality)
// =============================================================================
// Coffee is a tree crop - SHARE applies at origin level:
// - S: Volcanic soil, elevation, shade cover
// - H: Cultivar genetics (Typica, Bourbon, Gesha, SL28, Caturra)
// - A: Organic/conventional, shade-grown/sun-grown, hand-picked/strip-harvested
// - R: Cherry ripeness at harvest (selective picking vs bulk)
// - E: Cherry Brix predicts final cup quality
//
// These ORIGIN profiles link to TRANSFORMATION profiles for final quality prediction.
// Total coffee quality = Origin SHARE + Transformation (processing + roasting)

export const COFFEE_SHARE_PROFILES: TransformedShareProfile[] = [
  // Hawaiian Kona - True Terroir (Artisan)
  {
    profileType: 'transformed',
    id: 'coffee_kona_estate',
    code: 'CF-A',
    name: 'Kona Estate Coffee',
    category: 'coffee',
    subcategory: 'hawaiian',
    requiredClaims: ['100% Kona', 'Kona', 'estate grown'],
    optionalClaims: ['single estate', 'hand-picked', 'shade-grown', 'Typica'],
    excludedClaims: ['Kona blend', '10% Kona', 'blended'],
    qualityTier: 'artisan',
    qualityRank: 1,
    primaryQualityMetric: 'brix',
    estimatedOriginQuality: {
      metric: 'cherry_brix',
      range: [22, 26],
      description: 'Fully ripe cherry Brix from volcanic Kona slopes',
    },
    hasTransformation: true,
    transformationCategory: 'coffee',
    compatibleTransformationProfiles: ['coffee_washed_light', 'coffee_washed_medium', 'coffee_natural_light', 'coffee_honey_light'],
    defaultTransformationProfileId: 'coffee_washed_light',
    expectedFinalQuality: {
      metric: 'cupping_score',
      range: [85, 92],
      description: 'Kona origin + light roast = exceptional cup clarity and terroir expression',
    },
    soilPillarSummary: 'Volcanic Hualalai slopes (1500-2500ft); mineral-rich, porous soil; perfect drainage',
    heritagePillarSummary: 'Typica cultivar heritage from 1828; slow-maturing, low-yield, highest quality genetics',
    agriculturalPillarSummary: 'Hand-picked selective harvest; shade-grown under macadamia/ohia; minimal inputs needed in volcanic soil',
    ripenPillarSummary: 'Multiple selective passes (3-5 picks per season); only fully ripe cherry harvested',
    enrichPillarSummary: 'Cherry Brix 22-26; volcanic mineralization creates distinctive bright acidity and clean sweetness',
    notes: '100% Kona is strictly regulated - must be grown in Kona district. Beware "Kona Blend" (often only 10% Kona). The volcanic terroir + Typica heritage + hand-picking creates one of the world\'s most distinctive coffees.',
    redFlags: ['Kona Blend (10% rule)', 'Machine harvested', 'No estate name', 'Suspiciously low price'],
    isActive: true,
    sortOrder: 1,
  },

  // Hawaiian Specialty Other Regions (Premium)
  {
    profileType: 'transformed',
    id: 'coffee_hawaiian_specialty',
    code: 'CF-B',
    name: 'Hawaiian Specialty Coffee',
    category: 'coffee',
    subcategory: 'hawaiian',
    requiredClaims: ['Hawaiian', 'Hawaii'],
    optionalClaims: ['Maui', 'Ka\'u', 'Molokai', 'single estate', 'hand-picked', 'shade-grown'],
    excludedClaims: ['Kona', 'blended'],
    qualityTier: 'premium',
    qualityRank: 2,
    primaryQualityMetric: 'brix',
    estimatedOriginQuality: {
      metric: 'cherry_brix',
      range: [20, 24],
      description: 'Hawaiian volcanic soil cherry quality',
    },
    hasTransformation: true,
    transformationCategory: 'coffee',
    compatibleTransformationProfiles: ['coffee_washed_light', 'coffee_washed_medium', 'coffee_natural_light', 'coffee_honey_light'],
    defaultTransformationProfileId: 'coffee_washed_light',
    expectedFinalQuality: {
      metric: 'cupping_score',
      range: [82, 88],
      description: 'Hawaiian origin quality with proper processing',
    },
    soilPillarSummary: 'Hawaiian volcanic soils; elevation and microclimate vary by island',
    heritagePillarSummary: 'Various cultivars; Ka\'u gaining recognition for Typica and newer varietals',
    agriculturalPillarSummary: 'Often hand-picked; mix of shade and sun-grown; organic practices common',
    ripenPillarSummary: 'Selective harvest typical for specialty; timing varies by elevation',
    enrichPillarSummary: 'Cherry Brix 20-24; volcanic mineralization present across Hawaiian origins',
    notes: 'Ka\'u district (Big Island) is emerging as quality rival to Kona at lower prices. Maui and Molokai also produce excellent coffee. All benefit from volcanic soil.',
    isActive: true,
    sortOrder: 2,
  },

  // US Territory Specialty - Puerto Rico (Premium)
  {
    profileType: 'transformed',
    id: 'coffee_puerto_rico_specialty',
    code: 'CF-C',
    name: 'Puerto Rico Specialty Coffee',
    category: 'coffee',
    subcategory: 'us_territory',
    requiredClaims: ['Puerto Rico', 'Puerto Rican'],
    optionalClaims: ['Yauco', 'Yauco Selecto', 'shade-grown', 'hand-picked', 'Bourbon', 'Typica'],
    excludedClaims: ['blended'],
    qualityTier: 'premium',
    qualityRank: 2,
    primaryQualityMetric: 'brix',
    estimatedOriginQuality: {
      metric: 'cherry_brix',
      range: [19, 23],
      description: 'Puerto Rican mountain-grown cherry quality',
    },
    hasTransformation: true,
    transformationCategory: 'coffee',
    compatibleTransformationProfiles: ['coffee_washed_light', 'coffee_washed_medium'],
    defaultTransformationProfileId: 'coffee_washed_medium',
    expectedFinalQuality: {
      metric: 'cupping_score',
      range: [80, 86],
      description: 'Puerto Rican specialty with balanced profile',
    },
    soilPillarSummary: 'Central mountain range (Cordillera Central); volcanic-influenced clay soils; good elevation',
    heritagePillarSummary: 'Bourbon and Typica cultivars; coffee heritage since 1736; Yauco Selecto is protected designation',
    agriculturalPillarSummary: 'Traditionally shade-grown; hand-picked; small family farms predominate',
    ripenPillarSummary: 'Seasonal harvest October-February; selective picking for specialty grades',
    enrichPillarSummary: 'Cherry Brix 19-23; balanced sweetness and mild acidity characteristic of Caribbean origin',
    notes: 'Puerto Rico was once a major coffee exporter. Yauco Selecto is a protected regional designation. US territory means no import concerns.',
    isActive: true,
    sortOrder: 3,
  },

  // Single-Origin Specialty (Premium) - With Claims
  {
    profileType: 'transformed',
    id: 'coffee_single_origin_specialty',
    code: 'CF-D',
    name: 'Single-Origin Specialty Coffee',
    category: 'coffee',
    requiredClaims: ['single-origin', 'specialty'],
    optionalClaims: ['estate', 'micro-lot', 'hand-picked', 'shade-grown', 'high altitude', 'organic'],
    excludedClaims: ['blend', 'blended'],
    qualityTier: 'premium',
    qualityRank: 3,
    primaryQualityMetric: 'brix',
    estimatedOriginQuality: {
      metric: 'cherry_brix',
      range: [18, 24],
      description: 'Specialty-grade cherry from identified origin',
    },
    hasTransformation: true,
    transformationCategory: 'coffee',
    compatibleTransformationProfiles: ['coffee_washed_light', 'coffee_washed_medium', 'coffee_natural_light', 'coffee_natural_medium', 'coffee_honey_light', 'coffee_anaerobic_light'],
    defaultTransformationProfileId: 'coffee_washed_light',
    expectedFinalQuality: {
      metric: 'cupping_score',
      range: [80, 90],
      description: 'Wide range depending on origin and processing; specialty grade means 80+ SCA score',
    },
    soilPillarSummary: 'Varies by origin; specialty implies good terroir (elevation, soil, climate)',
    heritagePillarSummary: 'Cultivar often specified; heritage varieties (Bourbon, Typica) or quality-focused (Gesha, SL28)',
    agriculturalPillarSummary: 'Specialty implies care in farming; often organic or minimal-input; shade-grown common',
    ripenPillarSummary: 'Selective harvest implied for specialty grade; ripe cherry only',
    enrichPillarSummary: 'Cherry Brix 18-24; specialty grade requires 80+ cupping score which demands quality origin',
    notes: 'Single-origin specialty from traceable farms/regions. Specialty Coffee Association (SCA) 80+ score requirement ensures baseline quality.',
    isActive: true,
    sortOrder: 4,
  },

  // Organic Coffee (Select) - Organic Without Specialty Claims
  {
    profileType: 'transformed',
    id: 'coffee_organic',
    code: 'CF-E',
    name: 'Organic Coffee',
    category: 'coffee',
    requiredClaims: ['organic', 'USDA Organic'],
    excludedClaims: ['specialty', 'single-origin', 'estate'],
    qualityTier: 'standard',
    qualityRank: 4,
    primaryQualityMetric: 'brix',
    estimatedOriginQuality: {
      metric: 'cherry_brix',
      range: [16, 20],
      description: 'Organic certification without specialty quality focus',
    },
    hasTransformation: true,
    transformationCategory: 'coffee',
    compatibleTransformationProfiles: ['coffee_washed_medium', 'coffee_washed_dark'],
    defaultTransformationProfileId: 'coffee_washed_medium',
    expectedFinalQuality: {
      metric: 'cupping_score',
      range: [75, 82],
      description: 'Organic process claims but not specialty quality tier',
    },
    soilPillarSummary: 'Organic-certified farms; soil quality varies widely; certification is about inputs not outcomes',
    heritagePillarSummary: 'Often commercial cultivars; organic doesn\'t specify variety',
    agriculturalPillarSummary: 'No synthetic pesticides/fertilizers; organic-approved inputs only; NOT necessarily shade-grown or hand-picked',
    ripenPillarSummary: 'Harvest practices vary; organic doesn\'t require selective picking',
    enrichPillarSummary: 'Cherry Brix 16-20; organic certification is about A pillar (inputs), not E pillar (outcomes)',
    notes: 'Organic coffee is about INPUTS (no synthetic chemicals), not OUTCOMES (flavor/nutrition). Same lesson as produce: organic doesn\'t guarantee quality. Often roasted dark to mask origin defects.',
    redFlags: ['Assuming organic = specialty quality', 'Dark roast masking origin', 'No origin information'],
    isActive: true,
    sortOrder: 5,
  },

  // Commodity Coffee (Worst)
  {
    profileType: 'transformed',
    id: 'coffee_commodity',
    code: 'CF-F',
    name: 'Commodity Coffee',
    category: 'coffee',
    requiredClaims: [],
    excludedClaims: ['specialty', 'single-origin', 'estate', 'organic', 'Kona', 'Hawaiian'],
    qualityTier: 'commodity',
    qualityRank: 6,
    primaryQualityMetric: 'brix',
    estimatedOriginQuality: {
      metric: 'cherry_brix',
      range: [14, 18],
      description: 'Bulk commodity cherry; ripe and unripe mixed',
    },
    hasTransformation: true,
    transformationCategory: 'coffee',
    compatibleTransformationProfiles: ['coffee_washed_dark'],
    defaultTransformationProfileId: 'coffee_washed_dark',
    expectedFinalQuality: {
      metric: 'cupping_score',
      range: [65, 75],
      description: 'Below specialty grade; dark roast hides defects',
    },
    soilPillarSummary: 'Unknown origins; bulk commodity market; soil quality irrelevant to buyer',
    heritagePillarSummary: 'High-yield commercial cultivars (Catimor, Robusta blends); bred for disease resistance and volume',
    agriculturalPillarSummary: 'Conventional farming; often sun-grown monoculture; machine or strip harvested',
    ripenPillarSummary: 'Strip harvesting takes all cherries regardless of ripeness; speed over quality',
    enrichPillarSummary: 'Cherry Brix 14-18; mixed ripeness and defects; dark roast required to mask',
    notes: 'Commodity coffee is the default when no claims are made. Blended from multiple low-cost origins. You do NOT taste the harvest - dark roasting eliminates origin character (and defects). This is "coffee" the way seed oils are "fat."',
    redFlags: ['No origin information', 'Very dark roast', 'Pre-ground', '"100% coffee" claim (means nothing)'],
    isActive: true,
    sortOrder: 6,
  },
]

// =============================================================================
// EXPORT ALL PROFILES
// =============================================================================

export const ALL_SHARE_PROFILES: ShareProfile[] = [
  ...BEEF_PROFILES,
  ...CITRUS_PROFILES,
  ...EGG_PROFILES,
  ...PORK_PROFILES,
  ...POULTRY_PROFILES,
  ...DAIRY_PROFILES,
  ...SEAFOOD_PROFILES,
  ...HONEY_PROFILES,
  ...NUT_PROFILES,
  ...COFFEE_SHARE_PROFILES,
]

// =============================================================================
// LOOKUP HELPERS
// =============================================================================

export function getProfileById(id: string): ShareProfile | undefined {
  return ALL_SHARE_PROFILES.find(p => p.id === id)
}

export function getProfilesByCategory(category: ShareProfileCategory): ShareProfile[] {
  return ALL_SHARE_PROFILES.filter(p => p.category === category)
}

export function getProfileByCode(code: string): ShareProfile | undefined {
  return ALL_SHARE_PROFILES.find(p => p.code === code)
}

/**
 * Match claims to a ShareProfile
 * Returns the best matching profile for a set of claims
 */
export function matchClaimsToProfile(
  category: ShareProfileCategory,
  claims: string[]
): ShareProfile | undefined {
  const categoryProfiles = getProfilesByCategory(category)
  const normalizedClaims = claims.map(c => c.toLowerCase().trim())

  // Score each profile based on claim matching
  const scored = categoryProfiles.map(profile => {
    let score = 0

    // Check required claims (must all be present)
    const hasAllRequired = profile.requiredClaims.every(req =>
      normalizedClaims.some(c => c.includes(req.toLowerCase()))
    )
    if (!hasAllRequired && profile.requiredClaims.length > 0) {
      return { profile, score: -1000 } // Disqualify
    }

    // Check excluded claims (none can be present)
    const hasExcluded = profile.excludedClaims.some(exc =>
      normalizedClaims.some(c => c.includes(exc.toLowerCase()))
    )
    if (hasExcluded) {
      return { profile, score: -1000 } // Disqualify
    }

    // Score based on required claims matched
    score += profile.requiredClaims.length * 10

    // Bonus for optional claims
    if (profile.optionalClaims) {
      const optionalMatched = profile.optionalClaims.filter(opt =>
        normalizedClaims.some(c => c.includes(opt.toLowerCase()))
      ).length
      score += optionalMatched * 5
    }

    return { profile, score }
  })

  // Return highest scoring non-disqualified profile
  const valid = scored.filter(s => s.score >= 0)
  if (valid.length === 0) {
    // Return the commodity/default profile for the category
    return categoryProfiles.find(p => p.qualityTier === 'commodity')
  }

  valid.sort((a, b) => b.score - a.score)
  return valid[0].profile
}

// =============================================================================
// PROFILE STATISTICS
// =============================================================================

export const PROFILE_STATISTICS = {
  totalProfiles: ALL_SHARE_PROFILES.length,
  byCategory: {
    beef: BEEF_PROFILES.length,
    citrus: CITRUS_PROFILES.length,
    eggs: EGG_PROFILES.length,
    pork: PORK_PROFILES.length,
    poultry: POULTRY_PROFILES.length,
    dairy: DAIRY_PROFILES.length,
    seafood: SEAFOOD_PROFILES.length,
    honey: HONEY_PROFILES.length,
    nuts: NUT_PROFILES.length,
    coffee: COFFEE_SHARE_PROFILES.length,
  },
  byQualityTier: {
    artisan: ALL_SHARE_PROFILES.filter(p => p.qualityTier === 'artisan').length,
    premium: ALL_SHARE_PROFILES.filter(p => p.qualityTier === 'premium').length,
    standard: ALL_SHARE_PROFILES.filter(p => p.qualityTier === 'standard').length,
    commodity: ALL_SHARE_PROFILES.filter(p => p.qualityTier === 'commodity').length,
  },
}
