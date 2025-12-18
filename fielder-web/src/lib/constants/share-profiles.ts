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
 */
export interface ShareProfile {
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

export const BEEF_PROFILES: ShareProfile[] = [
  // Profile A: True Grass-Fed (BEST)
  {
    id: 'beef_true_grass',
    code: 'B-A',
    name: 'True Grass-Fed Beef',
    category: 'beef',
    requiredClaims: ['100% grass-fed', 'grass-finished'],
    optionalClaims: ['no feedlot', 'no CAFO', 'never confined'],
    excludedClaims: ['grain-finished', 'grain-supplemented'],
    qualityTier: 'premium',
    qualityRank: 1,
    estimatedOmegaRatioRange: [2, 3],
    estimatedOmegaRatioMidpoint: 2.5,
    primaryQualityMetric: 'omega_ratio',
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
    id: 'beef_true_pasture',
    code: 'B-B',
    name: 'True Pasture-Raised Beef',
    category: 'beef',
    requiredClaims: ['pasture-raised'],
    optionalClaims: ['no feedlot', 'no CAFO', 'free-choice grain'],
    excludedClaims: ['feedlot', 'CAFO'],
    qualityTier: 'premium',
    qualityRank: 2,
    estimatedOmegaRatioRange: [4, 6],
    estimatedOmegaRatioMidpoint: 5,
    primaryQualityMetric: 'omega_ratio',
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
    id: 'beef_marketing_grass',
    code: 'B-C',
    name: '"Grass-Fed" (Marketing Claim)',
    category: 'beef',
    requiredClaims: ['grass-fed'],
    excludedClaims: ['grass-finished', '100% grass-fed', 'no feedlot'],
    qualityTier: 'standard',
    qualityRank: 3,
    estimatedOmegaRatioRange: [8, 15],
    estimatedOmegaRatioMidpoint: 11,
    primaryQualityMetric: 'omega_ratio',
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
    id: 'beef_marketing_pasture',
    code: 'B-D',
    name: '"Pasture-Raised" (Marketing Claim)',
    category: 'beef',
    requiredClaims: ['pasture-raised'],
    excludedClaims: ['no feedlot', 'no CAFO', '100% grass-fed'],
    qualityTier: 'standard',
    qualityRank: 4,
    estimatedOmegaRatioRange: [12, 18],
    estimatedOmegaRatioMidpoint: 15,
    primaryQualityMetric: 'omega_ratio',
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
    id: 'beef_commodity',
    code: 'B-E',
    name: 'Commodity Beef',
    category: 'beef',
    requiredClaims: [],
    excludedClaims: ['grass-fed', 'pasture-raised', 'organic'],
    qualityTier: 'commodity',
    qualityRank: 5,
    estimatedOmegaRatioRange: [15, 20],
    estimatedOmegaRatioMidpoint: 17,
    primaryQualityMetric: 'omega_ratio',
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
    id: 'beef_natural',
    code: 'B-E2',
    name: '"Natural" Beef',
    category: 'beef',
    requiredClaims: ['natural'],
    optionalClaims: ['no antibiotics', 'no hormones', 'no mRNA'],
    excludedClaims: ['grass-fed', 'pasture-raised', 'no feedlot'],
    qualityTier: 'commodity',
    qualityRank: 5,
    estimatedOmegaRatioRange: [15, 20],
    estimatedOmegaRatioMidpoint: 17,
    primaryQualityMetric: 'omega_ratio',
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
    id: 'beef_premium_cafo',
    code: 'B-F',
    name: 'Premium CAFO Beef (Wagyu/Prime)',
    category: 'beef',
    requiredClaims: ['wagyu', 'prime', 'american wagyu'],
    excludedClaims: ['grass-fed', 'grass-finished', 'pasture-raised', 'no feedlot'],
    qualityTier: 'commodity', // Health-wise it's worst despite price
    qualityRank: 6,
    estimatedOmegaRatioRange: [20, 26],
    estimatedOmegaRatioMidpoint: 23,
    primaryQualityMetric: 'omega_ratio',
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

export const CITRUS_PROFILES: ShareProfile[] = [
  // Regenerative Citrus (Best)
  {
    id: 'citrus_regenerative',
    code: 'C-A',
    name: 'Regenerative Citrus',
    category: 'citrus',
    requiredClaims: ['regenerative'],
    optionalClaims: ['organic', 'biodynamic'],
    excludedClaims: [],
    qualityTier: 'artisan',
    qualityRank: 1,
    estimatedBrixRange: [13, 18],
    primaryQualityMetric: 'brix',
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
    id: 'citrus_organic',
    code: 'C-B',
    name: 'Organic Citrus',
    category: 'citrus',
    requiredClaims: ['organic', 'USDA Organic'],
    excludedClaims: [],
    qualityTier: 'premium',
    qualityRank: 2,
    estimatedBrixRange: [10, 14],
    primaryQualityMetric: 'brix',
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
    id: 'citrus_ipm',
    code: 'C-C',
    name: 'IPM Citrus',
    category: 'citrus',
    requiredClaims: ['IPM', 'integrated pest management'],
    excludedClaims: [],
    qualityTier: 'premium',
    qualityRank: 3,
    estimatedBrixRange: [10, 14],
    primaryQualityMetric: 'brix',
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
    id: 'citrus_conventional',
    code: 'C-D',
    name: 'Conventional Citrus',
    category: 'citrus',
    requiredClaims: [],
    excludedClaims: ['organic', 'regenerative'],
    qualityTier: 'standard',
    qualityRank: 4,
    estimatedBrixRange: [8, 12],
    primaryQualityMetric: 'brix',
    soilPillarSummary: 'Annual fertility approach; soil health varies',
    heritagePillarSummary: 'Often commercial cultivars bred for yield',
    agriculturalPillarSummary: 'Conventional commercial practices. ~85% of citrus uses IPM (Integrated Pest Management)',
    ripenPillarSummary: 'Harvested when USDA minimum met, not peak',
    enrichPillarSummary: 'Lower Brix typical (8-12); meets minimum standards',
    notes: 'Default grocery store citrus. Quality determined by individual operation.',
    isActive: true,
    sortOrder: 4,
  },

  // Commodity Citrus
  {
    id: 'citrus_commodity',
    code: 'C-E',
    name: 'Commodity Citrus',
    category: 'citrus',
    requiredClaims: [],
    excludedClaims: ['organic', 'regenerative', 'premium', 'heritage'],
    qualityTier: 'commodity',
    qualityRank: 5,
    estimatedBrixRange: [8, 10],
    primaryQualityMetric: 'brix',
    soilPillarSummary: 'Industrial scale; minimal soil investment',
    heritagePillarSummary: 'Yield-focused cultivars on vigor rootstocks',
    agriculturalPillarSummary: 'Maximum yield focus. ~85% of citrus uses IPM (Integrated Pest Management)',
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

export const EGG_PROFILES: ShareProfile[] = [
  // True Pasture-Raised Eggs (Best)
  {
    id: 'eggs_true_pasture',
    code: 'E-A',
    name: 'True Pasture-Raised Eggs',
    category: 'eggs',
    requiredClaims: ['pasture-raised'],
    optionalClaims: ['108 sq ft/bird', 'rotational grazing', 'mobile coops'],
    excludedClaims: [],
    qualityTier: 'premium',
    qualityRank: 1,
    estimatedOmegaRatioRange: [1.5, 4],
    estimatedOmegaRatioMidpoint: 2.5,
    primaryQualityMetric: 'omega_ratio',
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
  {
    id: 'eggs_organic_pasture',
    code: 'E-B',
    name: 'Organic Pasture-Raised Eggs',
    category: 'eggs',
    requiredClaims: ['organic', 'pasture-raised'],
    excludedClaims: [],
    qualityTier: 'premium',
    qualityRank: 2,
    estimatedOmegaRatioRange: [3, 6],
    estimatedOmegaRatioMidpoint: 4.5,
    primaryQualityMetric: 'omega_ratio',
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
    id: 'eggs_free_range',
    code: 'E-C',
    name: 'Free-Range Eggs',
    category: 'eggs',
    requiredClaims: ['free-range'],
    excludedClaims: ['pasture-raised'],
    qualityTier: 'standard',
    qualityRank: 3,
    estimatedOmegaRatioRange: [8, 15],
    estimatedOmegaRatioMidpoint: 11,
    primaryQualityMetric: 'omega_ratio',
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
    id: 'eggs_cage_free',
    code: 'E-D',
    name: 'Cage-Free Eggs',
    category: 'eggs',
    requiredClaims: ['cage-free'],
    excludedClaims: ['free-range', 'pasture-raised'],
    qualityTier: 'standard',
    qualityRank: 4,
    estimatedOmegaRatioRange: [12, 18],
    estimatedOmegaRatioMidpoint: 15,
    primaryQualityMetric: 'omega_ratio',
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
    id: 'eggs_conventional',
    code: 'E-E',
    name: 'Conventional Eggs',
    category: 'eggs',
    requiredClaims: [],
    excludedClaims: ['organic', 'free-range', 'pasture-raised', 'cage-free'],
    qualityTier: 'commodity',
    qualityRank: 5,
    estimatedOmegaRatioRange: [15, 20],
    estimatedOmegaRatioMidpoint: 17,
    primaryQualityMetric: 'omega_ratio',
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

export const PORK_PROFILES: ShareProfile[] = [
  {
    id: 'pork_pasture_heritage',
    code: 'P-A',
    name: 'Pasture-Raised Heritage Pork',
    category: 'pork',
    requiredClaims: ['pasture-raised', 'heritage breed'],
    optionalClaims: ['Berkshire', 'Duroc', 'Red Wattle', 'no confinement'],
    excludedClaims: ['CAFO'],
    qualityTier: 'artisan',
    qualityRank: 1,
    estimatedOmegaRatioRange: [4, 8],
    estimatedOmegaRatioMidpoint: 6,
    primaryQualityMetric: 'omega_ratio',
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
    id: 'pork_pasture',
    code: 'P-B',
    name: 'Pasture-Raised Pork',
    category: 'pork',
    requiredClaims: ['pasture-raised'],
    excludedClaims: ['CAFO', 'confinement'],
    qualityTier: 'premium',
    qualityRank: 2,
    estimatedOmegaRatioRange: [6, 12],
    estimatedOmegaRatioMidpoint: 9,
    primaryQualityMetric: 'omega_ratio',
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
    id: 'pork_commodity',
    code: 'P-E',
    name: 'Commodity Pork',
    category: 'pork',
    requiredClaims: [],
    excludedClaims: ['pasture-raised', 'heritage'],
    qualityTier: 'commodity',
    qualityRank: 5,
    estimatedOmegaRatioRange: [15, 25],
    estimatedOmegaRatioMidpoint: 20,
    primaryQualityMetric: 'omega_ratio',
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

export const POULTRY_PROFILES: ShareProfile[] = [
  {
    id: 'chicken_pasture',
    code: 'CH-A',
    name: 'Pasture-Raised Chicken',
    category: 'poultry',
    requiredClaims: ['pasture-raised'],
    optionalClaims: ['no corn', 'no soy', 'heritage breed'],
    excludedClaims: [],
    qualityTier: 'premium',
    qualityRank: 1,
    estimatedOmegaRatioRange: [4, 10],
    estimatedOmegaRatioMidpoint: 7,
    primaryQualityMetric: 'omega_ratio',
    soilPillarSummary: 'Pasture quality affects insect/forage availability',
    heritagePillarSummary: 'Heritage breeds better foragers; slower growing',
    agriculturalPillarSummary: 'Outdoor access, insect foraging, supplemental grain',
    ripenPillarSummary: 'Longer grow-out (12+ weeks vs 6-8 commodity)',
    enrichPillarSummary: 'Better omega ratio (4-10:1) from forage; still grain impact',
    notes: 'True pasture-raised with meaningful outdoor time.',
    redFlags: ['Industrial "pasture-raised" with minimal outdoor time'],
    isActive: true,
    sortOrder: 1,
  },

  {
    id: 'chicken_organic',
    code: 'CH-B',
    name: 'Organic Chicken',
    category: 'poultry',
    requiredClaims: ['organic', 'USDA Organic'],
    excludedClaims: [],
    qualityTier: 'standard',
    qualityRank: 2,
    estimatedOmegaRatioRange: [10, 18],
    estimatedOmegaRatioMidpoint: 14,
    primaryQualityMetric: 'omega_ratio',
    soilPillarSummary: 'Minimal relevance - usually indoor',
    heritagePillarSummary: 'Non-GMO required; commercial breeds typical',
    agriculturalPillarSummary: 'Organic grain diet; "outdoor access" often minimal',
    ripenPillarSummary: 'Standard commercial timeline',
    enrichPillarSummary: 'Still grain-fed = high omega-6 (10-18:1); organic grain ≠ healthy fat profile',
    notes: 'Organic chicken is often grain-fed indoors. The chicken IS a seed oil.',
    redFlags: ['Assuming organic = healthy fat profile'],
    isActive: true,
    sortOrder: 2,
  },

  {
    id: 'chicken_conventional',
    code: 'CH-E',
    name: 'Conventional Chicken',
    category: 'poultry',
    requiredClaims: [],
    excludedClaims: ['organic', 'pasture-raised', 'free-range'],
    qualityTier: 'commodity',
    qualityRank: 5,
    estimatedOmegaRatioRange: [15, 25],
    estimatedOmegaRatioMidpoint: 20,
    primaryQualityMetric: 'omega_ratio',
    soilPillarSummary: 'No relevance - indoor confinement',
    heritagePillarSummary: 'Commercial Cornish Cross - fast growth genetics',
    agriculturalPillarSummary: 'Confinement, all corn/soy diet',
    ripenPillarSummary: 'Fast growth (6-8 weeks)',
    enrichPillarSummary: 'Worst omega ratio (15-25:1); pure grain = walking seed oil',
    notes: 'Standard grocery store chicken. Corn/soy fed = high omega-6.',
    isActive: true,
    sortOrder: 5,
  },
]

// =============================================================================
// DAIRY PROFILES
// =============================================================================

export const DAIRY_PROFILES: ShareProfile[] = [
  {
    id: 'dairy_grass_a2',
    code: 'D-A',
    name: 'Grass-Fed A2 Dairy',
    category: 'dairy',
    requiredClaims: ['grass-fed', 'A2'],
    optionalClaims: ['raw', 'pasture-raised'],
    excludedClaims: [],
    qualityTier: 'artisan',
    qualityRank: 1,
    estimatedOmegaRatioRange: [1, 3],
    estimatedOmegaRatioMidpoint: 2,
    primaryQualityMetric: 'omega_ratio',
    soilPillarSummary: 'Pasture quality critical for grass-fed',
    heritagePillarSummary: 'A2 genetics (Jersey, Guernsey, older breeds)',
    agriculturalPillarSummary: '100% grass diet, no grain supplementation',
    ripenPillarSummary: 'Seasonal availability in true grass-fed',
    enrichPillarSummary: 'Best omega ratio (1-3:1), high CLA, high vitamin K2',
    notes: 'True grass-fed with A2 protein genetics. Best for digestibility and nutrition.',
    isActive: true,
    sortOrder: 1,
  },

  {
    id: 'dairy_grass',
    code: 'D-B',
    name: 'Grass-Fed Dairy',
    category: 'dairy',
    requiredClaims: ['grass-fed'],
    excludedClaims: [],
    qualityTier: 'premium',
    qualityRank: 2,
    estimatedOmegaRatioRange: [2, 5],
    estimatedOmegaRatioMidpoint: 3.5,
    primaryQualityMetric: 'omega_ratio',
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
    id: 'dairy_organic',
    code: 'D-C',
    name: 'Organic Dairy',
    category: 'dairy',
    requiredClaims: ['organic'],
    excludedClaims: ['grass-fed'],
    qualityTier: 'standard',
    qualityRank: 3,
    estimatedOmegaRatioRange: [5, 12],
    estimatedOmegaRatioMidpoint: 8,
    primaryQualityMetric: 'omega_ratio',
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
    id: 'dairy_conventional',
    code: 'D-E',
    name: 'Conventional Dairy',
    category: 'dairy',
    requiredClaims: [],
    excludedClaims: ['organic', 'grass-fed'],
    qualityTier: 'commodity',
    qualityRank: 5,
    estimatedOmegaRatioRange: [10, 20],
    estimatedOmegaRatioMidpoint: 15,
    primaryQualityMetric: 'omega_ratio',
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

export const SEAFOOD_PROFILES: ShareProfile[] = [
  {
    id: 'seafood_wild_cold',
    code: 'SF-A',
    name: 'Wild-Caught Cold Water Fish',
    category: 'seafood',
    requiredClaims: ['wild-caught'],
    optionalClaims: ['Alaska', 'Pacific', 'MSC certified'],
    excludedClaims: ['farm-raised'],
    qualityTier: 'premium',
    qualityRank: 1,
    estimatedOmegaRatioRange: [0.1, 0.5],
    estimatedOmegaRatioMidpoint: 0.25,
    primaryQualityMetric: 'omega_ratio',
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
    id: 'seafood_farm_sustainable',
    code: 'SF-C',
    name: 'Sustainably Farm-Raised',
    category: 'seafood',
    requiredClaims: ['farm-raised'],
    optionalClaims: ['ASC certified', 'sustainable', 'no antibiotics'],
    excludedClaims: [],
    qualityTier: 'standard',
    qualityRank: 3,
    estimatedOmegaRatioRange: [2, 8],
    estimatedOmegaRatioMidpoint: 5,
    primaryQualityMetric: 'omega_ratio',
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
]

// =============================================================================
// HONEY PROFILES
// =============================================================================

export const HONEY_PROFILES: ShareProfile[] = [
  {
    id: 'honey_raw_local',
    code: 'H-A',
    name: 'Raw Local Honey',
    category: 'honey',
    requiredClaims: ['raw', 'unfiltered'],
    optionalClaims: ['local', 'single-source', 'varietal'],
    excludedClaims: ['pasteurized', 'filtered'],
    qualityTier: 'artisan',
    qualityRank: 1,
    estimatedBrixRange: [79, 84],
    primaryQualityMetric: 'brix',
    soilPillarSummary: 'Forage source determines flavor/nutrition',
    heritagePillarSummary: 'Bee genetics affect honey characteristics',
    agriculturalPillarSummary: 'Minimal processing; never heated above hive temp',
    ripenPillarSummary: 'Seasonal harvest; capped honey only',
    enrichPillarSummary: 'Maximum enzymes, pollen, propolis retained',
    notes: 'True raw honey with all enzymes intact. Local reduces allergy concerns.',
    isActive: true,
    sortOrder: 1,
  },

  {
    id: 'honey_commercial',
    code: 'H-E',
    name: 'Commercial Honey',
    category: 'honey',
    requiredClaims: [],
    excludedClaims: ['raw', 'unfiltered'],
    qualityTier: 'commodity',
    qualityRank: 5,
    estimatedBrixRange: [79, 82],
    primaryQualityMetric: 'brix',
    soilPillarSummary: 'Unknown forage sources; often blended',
    heritagePillarSummary: 'Unknown bee genetics',
    agriculturalPillarSummary: 'Pasteurized, ultra-filtered; often blended origins',
    ripenPillarSummary: 'Year-round availability',
    enrichPillarSummary: 'Enzymes destroyed; pollen removed; just sugar',
    notes: 'Much commercial honey is blended, potentially adulterated, and nutritionally degraded.',
    redFlags: ['Unknown origin', 'Ultra-filtered', 'Suspiciously low price'],
    isActive: true,
    sortOrder: 5,
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
  },
  byQualityTier: {
    artisan: ALL_SHARE_PROFILES.filter(p => p.qualityTier === 'artisan').length,
    premium: ALL_SHARE_PROFILES.filter(p => p.qualityTier === 'premium').length,
    standard: ALL_SHARE_PROFILES.filter(p => p.qualityTier === 'standard').length,
    commodity: ALL_SHARE_PROFILES.filter(p => p.qualityTier === 'commodity').length,
  },
}
