/**
 * =============================================================================
 * BRAND DATABASE (COMPETITIVE INTELLIGENCE)
 * =============================================================================
 *
 * This file structures brand data for Fielder's competitive intelligence system.
 * For each brand, we capture:
 *
 *   1. WHO: Company info, ownership, scale
 *   2. WHAT: Products they sell, categories
 *   3. CLAIMS: What they say on labels and website
 *   4. SILENCE: What they DON'T say (often more telling)
 *   5. PROFILE: Assigned ShareProfile based on claim analysis
 *
 * USE CASES:
 *   - Flavor App: User scans product → brand lookup → claims analysis → quality score
 *   - Competitive intelligence: "Same Label, Different Nutrition" content
 *   - Market research: Which claims correlate with actual quality
 *
 * DATA COLLECTION:
 *   - Manual research (website, packaging, third-party reviews)
 *   - NOT real-time AI scraping (curated database approach)
 *   - Lab testing results when available (Edacious, etc.)
 *
 * BRAND CATEGORIES:
 *   - D2C (Direct-to-Consumer online)
 *   - Retail (grocery/supermarket brands)
 *   - Foodservice (restaurant supply)
 *   - Private Label (store brands)
 */

import type { ShareProfileCategory } from './share-profiles'

// =============================================================================
// TYPES
// =============================================================================

export type BrandCategory =
  | 'd2c' // Direct-to-consumer online
  | 'retail' // Grocery store brands
  | 'foodservice' // Restaurant/institutional
  | 'private_label' // Store brands (Costco Kirkland, etc.)
  | 'producer_direct' // Farm-direct sales

export type BrandTier =
  | 'ultra_premium' // >2x conventional pricing
  | 'premium' // 1.5-2x conventional
  | 'mid_market' // 1-1.5x conventional
  | 'value' // At or below conventional
  | 'commodity' // Bulk/wholesale pricing

export type DistributionChannel =
  | 'online_only'
  | 'grocery_national'
  | 'grocery_regional'
  | 'specialty_retail' // Whole Foods, Sprouts, etc.
  | 'club_store' // Costco, Sam's
  | 'foodservice'
  | 'farmers_market'
  | 'multi_channel'

export interface BrandClaim {
  claim: string // The actual claim text
  location: 'packaging' | 'website' | 'marketing' | 'certification'
  verified: boolean // Has Fielder verified this?
  notes?: string
}

export interface BrandSilence {
  topic: string // What they DON'T mention
  significance: 'high' | 'medium' | 'low'
  implication: string // What the silence likely means
}

export interface LabTestResult {
  testDate: Date
  labName: string
  metric: string // 'omega_ratio', 'brix', etc.
  value: number
  unit?: string
  notes?: string
  sourceUrl?: string
}

/**
 * Core brand interface
 */
export interface Brand {
  id: string
  name: string
  parentCompany?: string
  websiteUrl?: string

  // Classification
  category: BrandCategory
  tier: BrandTier
  channels: DistributionChannel[]

  // Products
  productCategories: ShareProfileCategory[] // What categories they sell
  primaryCategory: ShareProfileCategory // Main focus
  flagshipProducts?: string[] // Key products

  // Geography
  headquartersLocation?: string
  sourcingRegions?: string[]
  distributionRegion: 'national' | 'regional' | 'local'

  // Claims analysis
  explicitClaims: BrandClaim[] // What they SAY
  silences: BrandSilence[] // What they DON'T say
  claimsAnalysis: string // Fielder's summary

  // ShareProfile assignment
  assignedShareProfileId: string // Which profile fits
  shareProfileConfidence: 'high' | 'medium' | 'low'
  shareProfileReasoning: string

  // Lab verification (if available)
  labTests?: LabTestResult[]
  hasBeenLabTested: boolean

  // Quality assessment
  fielderAssessment: string // Overall take
  qualityScore?: number // 1-100 if we can calculate
  valueScore?: number // Quality per dollar
  redFlags: string[]
  greenFlags: string[]

  // Metadata
  researchDate: Date
  researchSources: string[]
  lastVerified?: Date
  confidence: 'high' | 'medium' | 'low'
  notes?: string
}

// =============================================================================
// BEEF BRANDS
// =============================================================================

/**
 * Example beef brands with full claim analysis
 * This demonstrates the competitive intelligence model
 */
export const BEEF_BRANDS: Brand[] = [
  // ---------------------------------------------------------------------------
  // TRUE GRASS-FED (Profile A)
  // ---------------------------------------------------------------------------
  {
    id: 'brand_force_of_nature',
    name: 'Force of Nature',
    websiteUrl: 'https://forceofnature.com',
    category: 'd2c',
    tier: 'ultra_premium',
    channels: ['online_only', 'specialty_retail'],
    productCategories: ['beef', 'bison'],
    primaryCategory: 'beef',
    flagshipProducts: ['Regenerative Ground Beef', 'Bison Ground'],
    headquartersLocation: 'Austin, TX',
    sourcingRegions: ['texas', 'montana', 'colorado'],
    distributionRegion: 'national',

    explicitClaims: [
      {
        claim: '100% Grass-Fed & Finished',
        location: 'packaging',
        verified: false,
        notes: 'Clear finishing claim',
      },
      {
        claim: 'Regenerative',
        location: 'packaging',
        verified: false,
        notes: 'Land management focus',
      },
      {
        claim: 'No Added Hormones',
        location: 'packaging',
        verified: false,
      },
      {
        claim: 'No Antibiotics Ever',
        location: 'packaging',
        verified: false,
      },
    ],

    silences: [
      {
        topic: 'Specific omega ratio',
        significance: 'medium',
        implication:
          'Confident brands would publish this. May vary by source.',
      },
    ],

    claimsAnalysis:
      'Strong claims with explicit 100% grass-fed and finished. Regenerative positioning adds soil health story. Full claim stack (no hormones, no antibiotics) rounds out premium positioning.',

    assignedShareProfileId: 'beef_true_grass',
    shareProfileConfidence: 'high',
    shareProfileReasoning:
      '100% grass-fed AND finished explicitly stated. No feedlot. Meets Profile A criteria.',

    hasBeenLabTested: false,
    labTests: [],

    fielderAssessment:
      'Force of Nature represents the true grass-fed standard. Explicit finishing claim, regenerative focus, and premium positioning. Worth lab testing to verify omega ratios match claims.',
    redFlags: [],
    greenFlags: [
      'Explicit grass-finished claim',
      'Regenerative soil focus',
      'Complete claim transparency',
    ],

    researchDate: new Date('2024-12-01'),
    researchSources: ['Company website', 'Packaging analysis'],
    confidence: 'high',
  },

  // ---------------------------------------------------------------------------
  // MARKETING GRASS-FED (Profile C)
  // ---------------------------------------------------------------------------
  {
    id: 'brand_verde_farms',
    name: 'Verde Farms',
    websiteUrl: 'https://verdefarms.com',
    category: 'retail',
    tier: 'premium',
    channels: ['grocery_national', 'specialty_retail', 'club_store'],
    productCategories: ['beef'],
    primaryCategory: 'beef',
    flagshipProducts: ['Organic Grass-Fed Ground Beef', 'Grass-Fed Ribeye'],
    headquartersLocation: 'Woburn, MA',
    sourcingRegions: ['australia', 'uruguay', 'usa'],
    distributionRegion: 'national',

    explicitClaims: [
      {
        claim: 'Grass-Fed',
        location: 'packaging',
        verified: false,
        notes: 'No finishing claim',
      },
      {
        claim: 'Organic (some products)',
        location: 'packaging',
        verified: false,
      },
      {
        claim: 'No Added Hormones',
        location: 'packaging',
        verified: false,
      },
      {
        claim: 'No Antibiotics',
        location: 'packaging',
        verified: false,
      },
    ],

    silences: [
      {
        topic: 'Grass-finished',
        significance: 'high',
        implication:
          'Absence of finishing claim suggests grain finishing is possible/likely',
      },
      {
        topic: 'Feedlot/CAFO',
        significance: 'high',
        implication: 'No explicit "no feedlot" claim',
      },
      {
        topic: 'Omega ratio',
        significance: 'medium',
        implication: 'May vary significantly based on finishing',
      },
    ],

    claimsAnalysis:
      '"Grass-fed" without "grass-finished" is the key gap. International sourcing (Australia, Uruguay) may have different standards. Organic claim on some products but not all suggests product-line variance.',

    assignedShareProfileId: 'beef_marketing_grass',
    shareProfileConfidence: 'medium',
    shareProfileReasoning:
      'Grass-fed claim without finishing claim = Profile C. International sourcing adds uncertainty. May be true grass-finished for some products but can\'t assume.',

    hasBeenLabTested: false,
    labTests: [],

    fielderAssessment:
      'Verde Farms is a mainstream "grass-fed" brand with the typical gaps. No finishing claim = assume grain finishing is possible. International sourcing = standards uncertainty. Not bad, but not the premium health product consumers think they\'re buying.',
    redFlags: [
      'No grass-finished claim',
      'International sourcing with variable standards',
      'Product line inconsistency (some organic, some not)',
    ],
    greenFlags: ['Wide distribution makes grass-fed accessible'],

    researchDate: new Date('2024-12-01'),
    researchSources: ['Company website', 'Retail packaging'],
    confidence: 'medium',
  },

  // ---------------------------------------------------------------------------
  // PREMIUM CAFO / WAGYU (Profile F - WORST for omega)
  // ---------------------------------------------------------------------------
  {
    id: 'brand_snake_river_farms',
    name: 'Snake River Farms',
    parentCompany: 'Agri Beef Co.',
    websiteUrl: 'https://www.snakeriverfarms.com',
    category: 'd2c',
    tier: 'ultra_premium',
    channels: ['online_only', 'specialty_retail', 'foodservice'],
    productCategories: ['beef'],
    primaryCategory: 'beef',
    flagshipProducts: [
      'American Wagyu Ribeye',
      'American Wagyu Brisket',
      'Gold Grade Striploin',
    ],
    headquartersLocation: 'Boise, ID',
    sourcingRegions: ['idaho', 'pacific_northwest'],
    distributionRegion: 'national',

    explicitClaims: [
      {
        claim: 'American Wagyu',
        location: 'packaging',
        verified: false,
        notes: 'Breed claim only',
      },
      {
        claim: 'USDA Prime and above',
        location: 'website',
        verified: false,
        notes: 'High marbling grades',
      },
      {
        claim: 'No Added Hormones',
        location: 'website',
        verified: false,
      },
    ],

    silences: [
      {
        topic: 'Feeding regime',
        significance: 'high',
        implication:
          'Complete silence on grass/grain = extended grain feeding for marbling',
      },
      {
        topic: 'Feedlot/CAFO duration',
        significance: 'high',
        implication: 'Wagyu marbling requires 12+ months grain in feedlot',
      },
      {
        topic: 'Omega ratio',
        significance: 'high',
        implication: 'Would be damning - likely 20-26:1',
      },
      {
        topic: 'Grass-fed/pasture',
        significance: 'high',
        implication: 'Not claimed because not true',
      },
    ],

    claimsAnalysis:
      'ALL breed/grade claims, ZERO process claims. This is the red flag pattern. Wagyu marbling requires extended grain feeding (12+ months in feedlot). Silence on feeding regime is intentional - the truth would hurt their health positioning.',

    assignedShareProfileId: 'beef_premium_cafo',
    shareProfileConfidence: 'high',
    shareProfileReasoning:
      'Premium breed + high marbling grades + complete silence on feeding = Profile F. Extended CAFO for Wagyu marbling. Expected omega ratio 20-26:1 (WORST).',

    hasBeenLabTested: false,
    labTests: [],

    fielderAssessment:
      'Snake River Farms is the poster child for "expensive ≠ healthy." Consumers pay $100+/lb thinking they\'re getting the best, but Wagyu marbling requires the longest feedlot time of any beef category. Expected omega ratio 20-26:1 is WORSE than commodity beef. This is premium flavor, commodity (or worse) nutrition. The brand\'s silence on feeding regime is telling.',
    qualityScore: 90, // Flavor/eating quality is excellent
    valueScore: 20, // Health value is terrible
    redFlags: [
      'Complete silence on feeding regime',
      'High marbling requires extended grain feeding',
      'Breed positioning hides CAFO reality',
      'Premium pricing for worst-omega product',
    ],
    greenFlags: ['Excellent eating quality', 'Transparent about breed/grade'],

    researchDate: new Date('2024-12-01'),
    researchSources: [
      'Company website',
      'Industry knowledge of Wagyu production',
    ],
    confidence: 'high',
    notes:
      'This brand exemplifies the price vs health inversion. Most expensive beef in the market has worst omega profile.',
  },
]

// =============================================================================
// EGG BRANDS
// =============================================================================

export const EGG_BRANDS: Brand[] = [
  // ---------------------------------------------------------------------------
  // PREMIUM PASTURE-RAISED
  // ---------------------------------------------------------------------------
  {
    id: 'brand_vital_farms',
    name: 'Vital Farms',
    websiteUrl: 'https://vitalfarms.com',
    category: 'retail',
    tier: 'premium',
    channels: ['grocery_national', 'specialty_retail'],
    productCategories: ['eggs'],
    primaryCategory: 'eggs',
    flagshipProducts: ['Pasture-Raised Eggs', 'Organic Pasture-Raised Eggs'],
    headquartersLocation: 'Austin, TX',
    sourcingRegions: ['texas', 'arkansas', 'georgia', 'missouri'],
    distributionRegion: 'national',

    explicitClaims: [
      {
        claim: 'Pasture-Raised',
        location: 'packaging',
        verified: true,
        notes: 'Certified Humane verified',
      },
      {
        claim: '108 sq ft per bird',
        location: 'packaging',
        verified: true,
      },
      {
        claim: 'Certified Humane',
        location: 'packaging',
        verified: true,
      },
    ],

    silences: [
      {
        topic: 'Omega ratio',
        significance: 'high',
        implication:
          'Testing shows 23.5% omega-6 - worse than expected for "pasture-raised"',
      },
      {
        topic: 'Specific diet composition',
        significance: 'medium',
        implication: 'Grain-heavy diet supplementation',
      },
    ],

    claimsAnalysis:
      'Strong pasture-raised claim with certification. However, independent testing revealed 23.5% omega-6 content - higher than canola oil. Pasture access doesn\'t guarantee good omega ratios if feed is grain-heavy.',

    assignedShareProfileId: 'eggs_organic_pasture',
    shareProfileConfidence: 'medium',
    shareProfileReasoning:
      'Certified pasture-raised but lab tests show omega profile is not as good as positioning suggests. Diet matters more than outdoor access.',

    hasBeenLabTested: true,
    labTests: [
      {
        testDate: new Date('2024-06-01'),
        labName: 'Independent analysis (Nourish Food Club)',
        metric: 'omega_6_percent',
        value: 23.5,
        unit: '%',
        notes: 'Higher than canola oil (21%)',
        sourceUrl: 'https://nourishfoodclub.com/vital-farms-test',
      },
    ],

    fielderAssessment:
      'Vital Farms is the "premium pasture-raised" brand, but lab testing tells a different story. 23.5% omega-6 is actually WORSE than canola oil. This shows that outdoor access alone doesn\'t fix nutrition - the supplemental feed is grain-heavy. Consumers are paying premium for welfare, not nutrition.',
    qualityScore: 60,
    valueScore: 40,
    redFlags: [
      'Lab-tested omega-6 (23.5%) worse than canola oil',
      'Premium pricing despite poor omega profile',
      'Pasture-raised positioning masks grain-heavy diet',
    ],
    greenFlags: [
      'Third-party welfare certification',
      'Transparent about outdoor space',
      'Better than cage-free/free-range',
    ],

    researchDate: new Date('2024-12-01'),
    researchSources: ['Company website', 'Independent lab testing'],
    confidence: 'high',
    notes:
      'Example of how lab testing reveals gaps between marketing and reality.',
  },

  // ---------------------------------------------------------------------------
  // CAGE-FREE (Commodity with label)
  // ---------------------------------------------------------------------------
  {
    id: 'brand_happy_egg',
    name: 'Happy Egg Co.',
    websiteUrl: 'https://happyegg.com',
    category: 'retail',
    tier: 'mid_market',
    channels: ['grocery_national'],
    productCategories: ['eggs'],
    primaryCategory: 'eggs',
    flagshipProducts: ['Free Range Eggs', 'Organic Free Range Eggs'],
    headquartersLocation: 'Rogers, AR',
    distributionRegion: 'national',

    explicitClaims: [
      {
        claim: 'Free Range',
        location: 'packaging',
        verified: false,
      },
      {
        claim: 'Certified Humane',
        location: 'packaging',
        verified: false,
      },
    ],

    silences: [
      {
        topic: 'Pasture-raised',
        significance: 'high',
        implication:
          'Free-range ≠ pasture-raised. Minimal actual outdoor foraging.',
      },
      {
        topic: 'Omega ratio',
        significance: 'medium',
        implication: 'Grain-fed diet = commodity-like omega profile',
      },
    ],

    claimsAnalysis:
      '"Free Range" sounds similar to pasture-raised but legally just means door to outside exists. Diet is standard grain-based, so omega profile is not significantly better than conventional.',

    assignedShareProfileId: 'eggs_free_range',
    shareProfileConfidence: 'high',
    shareProfileReasoning:
      'Free-range claim = Profile C. Better welfare than cage-free but grain diet means similar omega profile.',

    hasBeenLabTested: false,

    fielderAssessment:
      'Happy Egg positions itself as premium with cheerful branding, but "free range" is barely better than cage-free for nutrition. The marketing makes consumers feel good about animal welfare while paying premium for essentially grain-fed eggs.',
    redFlags: [
      'Free-range positioning masks minimal outdoor access',
      'Premium branding for mid-tier product',
    ],
    greenFlags: ['Better than cage-free', 'Welfare certification'],

    researchDate: new Date('2024-12-01'),
    researchSources: ['Company website', 'Retail packaging'],
    confidence: 'medium',
  },
]

// =============================================================================
// ALL BRANDS (combined)
// =============================================================================

export const ALL_BRANDS: Brand[] = [...BEEF_BRANDS, ...EGG_BRANDS]

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Find brand by ID
 */
export function findBrandById(id: string): Brand | undefined {
  return ALL_BRANDS.find((b) => b.id === id)
}

/**
 * Find brand by name (fuzzy)
 */
export function findBrandByName(name: string): Brand | undefined {
  const normalized = name.toLowerCase().trim()
  return ALL_BRANDS.find((b) => b.name.toLowerCase().includes(normalized))
}

/**
 * Get brands by category
 */
export function getBrandsByCategory(category: ShareProfileCategory): Brand[] {
  return ALL_BRANDS.filter((b) => b.productCategories.includes(category))
}

/**
 * Get brands by ShareProfile
 */
export function getBrandsByShareProfile(shareProfileId: string): Brand[] {
  return ALL_BRANDS.filter((b) => b.assignedShareProfileId === shareProfileId)
}

/**
 * Get brands with lab test data
 */
export function getLabTestedBrands(): Brand[] {
  return ALL_BRANDS.filter((b) => b.hasBeenLabTested && b.labTests && b.labTests.length > 0)
}

/**
 * Get high-confidence brand assessments
 */
export function getHighConfidenceBrands(): Brand[] {
  return ALL_BRANDS.filter((b) => b.confidence === 'high')
}

/**
 * Analyze brand claims vs silences
 */
export function analyzeClaimGaps(brandId: string): {
  strongClaims: string[]
  suspiciousSilences: string[]
  overallAssessment: string
} | undefined {
  const brand = findBrandById(brandId)
  if (!brand) return undefined

  const strongClaims = brand.explicitClaims
    .filter((c) => c.verified || c.location === 'packaging')
    .map((c) => c.claim)

  const suspiciousSilences = brand.silences
    .filter((s) => s.significance === 'high')
    .map((s) => `${s.topic}: ${s.implication}`)

  return {
    strongClaims,
    suspiciousSilences,
    overallAssessment: brand.fielderAssessment,
  }
}

/**
 * Compare two brands
 */
export function compareBrands(
  brandId1: string,
  brandId2: string
): {
  brand1: Brand
  brand2: Brand
  shareProfileComparison: string
  priceTierComparison: string
  redFlagComparison: string
} | undefined {
  const brand1 = findBrandById(brandId1)
  const brand2 = findBrandById(brandId2)

  if (!brand1 || !brand2) return undefined

  return {
    brand1,
    brand2,
    shareProfileComparison: `${brand1.name}: ${brand1.assignedShareProfileId} vs ${brand2.name}: ${brand2.assignedShareProfileId}`,
    priceTierComparison: `${brand1.name}: ${brand1.tier} vs ${brand2.name}: ${brand2.tier}`,
    redFlagComparison: `${brand1.name} red flags: ${brand1.redFlags.length}, ${brand2.name} red flags: ${brand2.redFlags.length}`,
  }
}

/**
 * Get brands that need lab testing (high confidence claims but no lab data)
 */
export function getBrandsNeedingLabTesting(): Brand[] {
  return ALL_BRANDS.filter(
    (b) =>
      !b.hasBeenLabTested &&
      b.tier === 'ultra_premium' &&
      b.assignedShareProfileId.includes('true') // Claims to be "true" something
  )
}

/**
 * Get "Same Label Different Nutrition" candidates
 * Brands with similar claims but different expected quality
 */
export function getSameLabelDifferentNutritionCandidates(
  category: ShareProfileCategory
): Array<{ brandA: Brand; brandB: Brand; comparison: string }> {
  const categoryBrands = getBrandsByCategory(category)
  const candidates: Array<{ brandA: Brand; brandB: Brand; comparison: string }> =
    []

  for (let i = 0; i < categoryBrands.length; i++) {
    for (let j = i + 1; j < categoryBrands.length; j++) {
      const a = categoryBrands[i]
      const b = categoryBrands[j]

      // Look for similar tier but different ShareProfile
      if (
        (a.tier === b.tier || Math.abs(getTierRank(a.tier) - getTierRank(b.tier)) <= 1) &&
        a.assignedShareProfileId !== b.assignedShareProfileId
      ) {
        candidates.push({
          brandA: a,
          brandB: b,
          comparison: `Both ${a.tier}/${b.tier} tier but ${a.name} is ${a.assignedShareProfileId} while ${b.name} is ${b.assignedShareProfileId}`,
        })
      }
    }
  }

  return candidates
}

function getTierRank(tier: BrandTier): number {
  const ranks: Record<BrandTier, number> = {
    ultra_premium: 5,
    premium: 4,
    mid_market: 3,
    value: 2,
    commodity: 1,
  }
  return ranks[tier]
}
