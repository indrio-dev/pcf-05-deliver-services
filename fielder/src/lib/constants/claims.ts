/**
 * =============================================================================
 * FOOD MARKETING CLAIMS (REGULATORY + REALITY)
 * =============================================================================
 *
 * This file structures food marketing claims for the Fielder inference system.
 * For each claim, we capture:
 *
 *   1. REGULATORY: What does the law require? Who enforces it?
 *   2. MARKETING: What do consumers think it means?
 *   3. REALITY: What does Fielder know it actually means for quality?
 *
 * THE THREE PERSPECTIVES:
 *   - Regulation: USDA/FDA definitions, enforcement status, loopholes
 *   - Marketing: Consumer perception, what brands want you to think
 *   - Reality: Fielder's assessment based on SHARE framework
 *
 * CLAIM CATEGORIES:
 *   - Production method (organic, conventional, IPM)
 *   - Animal welfare (pasture-raised, cage-free, etc.)
 *   - Feeding regime (grass-fed, grain-finished, etc.)
 *   - Environmental (regenerative, sustainable)
 *   - Heritage/Origin (heirloom, local, imported)
 *   - Processing (raw, cold-pressed, etc.)
 *
 * INFERENCE MODEL:
 *   Product claims → Claim lookup → ShareProfile match → Quality inference
 */

// =============================================================================
// TYPES
// =============================================================================

export type ClaimCategory =
  | 'production_method'
  | 'animal_welfare'
  | 'feeding_regime'
  | 'environmental'
  | 'heritage_origin'
  | 'processing'
  | 'health'
  | 'certification'

export type RegulatoryStatus =
  | 'legally_defined' // Clear legal definition exists
  | 'partially_defined' // Some definition, many loopholes
  | 'voluntary_standard' // Industry standard, not law
  | 'no_definition' // Unregulated marketing term
  | 'withdrawn' // Previously defined, now withdrawn (e.g., USDA grass-fed)

export type EnforcementLevel =
  | 'strong' // Active enforcement, penalties
  | 'moderate' // Some enforcement, complaints investigated
  | 'weak' // Rarely enforced
  | 'none' // No enforcement mechanism

export type ApplicableProduct = 'produce' | 'meat' | 'poultry' | 'dairy' | 'eggs' | 'seafood' | 'all'

/**
 * Core claim interface with three perspectives
 */
export interface Claim {
  id: string
  name: string // Display name (e.g., "Grass-Fed")
  alternativeNames: string[] // Other terms that map here
  category: ClaimCategory
  applicableProducts: ApplicableProduct[]

  // ---------------------------------------------------------------------------
  // REGULATORY PERSPECTIVE
  // ---------------------------------------------------------------------------
  regulatory: {
    status: RegulatoryStatus
    enforcementLevel: EnforcementLevel
    regulatoryBody?: string // USDA, FDA, FTC, state
    legalDefinition?: string // Actual legal text (summarized)
    requirements?: string[] // What must be true
    loopholes?: string[] // Known gaps/exceptions
    penaltiesExist: boolean
    lastUpdated?: string // When regulation changed
    notes?: string
  }

  // ---------------------------------------------------------------------------
  // MARKETING PERSPECTIVE
  // ---------------------------------------------------------------------------
  marketing: {
    consumerPerception: string // What consumers think it means
    brandUsage: string // How brands typically use it
    premiumJustification: string // Why consumers pay more
    commonMisconceptions: string[] // What consumers get wrong
    emotionalAppeal: string // The feeling it sells
  }

  // ---------------------------------------------------------------------------
  // REALITY PERSPECTIVE (FIELDER'S ASSESSMENT)
  // ---------------------------------------------------------------------------
  reality: {
    actualMeaning: string // What it really guarantees
    nutritionalImpact: 'positive' | 'neutral' | 'negative' | 'variable'
    qualityCorrelation: 'strong' | 'moderate' | 'weak' | 'none' | 'inverse'
    fielderAssessment: string // Fielder's expert take
    redFlags?: string[] // Warning signs when combined with other claims
    greenFlags?: string[] // Positive signals when combined with other claims
    shareImpact: {
      soil?: 'positive' | 'neutral' | 'negative' | 'unknown' | 'variable'
      heritage?: 'positive' | 'neutral' | 'negative' | 'unknown' | 'variable'
      agricultural?: 'positive' | 'neutral' | 'negative' | 'unknown' | 'variable'
      ripen?: 'positive' | 'neutral' | 'negative' | 'unknown' | 'variable'
      enrich?: 'positive' | 'neutral' | 'negative' | 'unknown' | 'variable'
    }
  }

  // ---------------------------------------------------------------------------
  // INFERENCE HELPERS
  // ---------------------------------------------------------------------------
  inference: {
    impliedClaims: string[] // Claims this implies (organic → non-GMO)
    excludedClaims: string[] // Claims this excludes
    requiredWith?: string[] // Must appear with these for validity
    suspiciousWith?: string[] // Red flag if combined with these
    omegaRatioHint?: [number, number] // Expected range if applicable
    brixImpact?: 'positive' | 'neutral' | 'negative' // Expected Brix impact
  }

  // Metadata
  confidenceLevel: 'high' | 'medium' | 'low'
  dataSource: string[]
  lastVerified: Date
}

// =============================================================================
// ORGANIC CLAIMS
// =============================================================================

export const CLAIM_ORGANIC: Claim = {
  id: 'organic',
  name: 'Organic',
  alternativeNames: ['USDA Organic', 'Certified Organic', 'Organically Grown'],
  category: 'production_method',
  applicableProducts: ['all'],

  regulatory: {
    status: 'legally_defined',
    enforcementLevel: 'strong',
    regulatoryBody: 'USDA NOP (National Organic Program)',
    legalDefinition:
      'Produced without synthetic pesticides, synthetic fertilizers, GMOs, or irradiation',
    requirements: [
      'No synthetic pesticides (natural pesticides allowed)',
      'No synthetic fertilizers',
      'No GMOs',
      'No irradiation',
      'Third-party certification required',
      '3-year transition period for land',
    ],
    loopholes: [
      'Natural pesticides (copper sulfate, rotenone, pyrethrin) ARE allowed',
      'Does NOT require soil health practices',
      'Does NOT require cover cropping',
      'Does NOT require mineralization',
      'For livestock: does NOT require pasture (grain-fed organic is common)',
    ],
    penaltiesExist: true,
    lastUpdated: '2023',
    notes:
      'Most regulated food label in US. But requirements focus on INPUTS, not OUTCOMES.',
  },

  marketing: {
    consumerPerception:
      'Healthier, no toxic chemicals, better for environment, premium quality',
    brandUsage:
      'Premium positioning, health-conscious marketing, environmental story',
    premiumJustification: 'Worth paying more for health and environment',
    commonMisconceptions: [
      'Organic means no pesticides (FALSE - natural pesticides used)',
      'Organic means higher nutrition (FALSE - not required, often not true)',
      'Organic means better for health (UNPROVEN - separate axis from nutrition)',
      'Organic meat means grass-fed (FALSE - often grain-fed)',
    ],
    emotionalAppeal: 'Purity, safety, environmental responsibility',
  },

  reality: {
    actualMeaning:
      'Produced without SYNTHETIC inputs. Does not guarantee nutrition or flavor.',
    nutritionalImpact: 'variable',
    qualityCorrelation: 'weak',
    fielderAssessment:
      'Organic certification measures INPUTS (what you avoid), not OUTCOMES (what you get). Higher secondary nutrition (polyphenols) is from stress response, NOT from pesticide absence. Primary nutrition (Brix, minerals) is NOT guaranteed higher. Organic meat is often GRAIN-FED, which is actually a red flag for omega ratios.',
    redFlags: [
      'Organic + meat without grass-fed claim → likely grain-fed CAFO with organic feed',
      'Organic + imported → long transport, early harvest, nutrients degraded',
    ],
    greenFlags: [
      'Organic + local + small farm → often correlates with soil-focused practices',
      'Organic + regenerative → real soil health investment',
    ],
    shareImpact: {
      soil: 'neutral', // Organic doesn't require soil health
      heritage: 'neutral', // No cultivar requirements
      agricultural: 'positive', // Limits synthetic inputs
      ripen: 'neutral', // No timing requirements
      enrich: 'neutral', // Outcome not measured
    },
  },

  inference: {
    impliedClaims: ['non_gmo', 'no_synthetic_pesticides', 'no_synthetic_fertilizers'],
    excludedClaims: ['gmo', 'irradiated'],
    suspiciousWith: [], // Organic alone isn't suspicious
    omegaRatioHint: undefined, // Organic doesn't predict omega ratio
    brixImpact: 'neutral', // Organic doesn't predict Brix
  },

  confidenceLevel: 'high',
  dataSource: ['USDA NOP', 'Academic research', 'Fielder analysis'],
  lastVerified: new Date('2024-12-01'),
}

// =============================================================================
// GRASS-FED CLAIMS
// =============================================================================

export const CLAIM_GRASS_FED: Claim = {
  id: 'grass_fed',
  name: 'Grass-Fed',
  alternativeNames: ['Grass Fed', 'Grassfed'],
  category: 'feeding_regime',
  applicableProducts: ['meat', 'dairy'],

  regulatory: {
    status: 'withdrawn',
    enforcementLevel: 'none',
    regulatoryBody: 'USDA (withdrew standard in 2016)',
    legalDefinition: 'NO LEGAL DEFINITION since 2016 withdrawal',
    requirements: [],
    loopholes: [
      'No federal definition - brands define it themselves',
      'Does NOT require grass-FINISHED',
      'Grain finishing is allowed under most interpretations',
      '3-4 month feedlot finishing is common with "grass-fed" label',
      'No third-party verification required',
    ],
    penaltiesExist: false,
    lastUpdated: '2016',
    notes:
      'USDA withdrew the grass-fed standard in 2016. The term is now essentially unregulated marketing.',
  },

  marketing: {
    consumerPerception:
      'Animal ate grass its whole life, healthier meat, better omega ratios',
    brandUsage: 'Premium positioning, health story, differentiation from commodity',
    premiumJustification: 'Healthier fat profile, animal welfare, more natural',
    commonMisconceptions: [
      'Grass-fed means 100% grass diet (FALSE without "grass-finished")',
      'Grass-fed means no feedlot (FALSE - feedlot finishing is common)',
      'Grass-fed has better omega ratio (ONLY IF grass-finished)',
      'Grass-fed is regulated (FALSE - USDA withdrew standard in 2016)',
    ],
    emotionalAppeal: 'Natural, healthy, how animals should be raised',
  },

  reality: {
    actualMeaning:
      'MARKETING TERM with no legal definition. Usually means started on grass, often finished in feedlot for 3-4 months. Does NOT guarantee omega profile.',
    nutritionalImpact: 'variable',
    qualityCorrelation: 'weak',
    fielderAssessment:
      '"Grass-fed" without "grass-finished" or "100% grass-fed" is a red flag. Feedlot finishing (even 3 months) dramatically shifts omega ratio from ~3:1 toward ~15:1. The claim is used to charge premium prices for beef that has similar omega profiles to commodity. Verify with "100% grass-fed" or "grass-finished" claims, or better yet, lab testing.',
    redFlags: [
      'Grass-fed without grass-finished claim → assume feedlot finishing',
      'Grass-fed + high marbling → grain finishing (marbling comes from grain)',
      'Grass-fed + USDA Prime → definitely grain-finished (Prime requires marbling)',
    ],
    greenFlags: [
      'Grass-fed + grass-finished → true 100% grass diet',
      'Grass-fed + no feedlot + no CAFO → explicit CAFO exclusion',
      'Grass-fed + omega ratio claim → brand is confident in their product',
    ],
    shareImpact: {
      soil: 'unknown', // Grass-fed doesn't indicate soil practices
      heritage: 'neutral', // No breed requirements
      agricultural: 'positive', // At least some pasture time
      ripen: 'neutral', // No age requirements
      enrich: 'variable', // Depends on finishing
    },
  },

  inference: {
    impliedClaims: [], // Grass-fed alone implies nothing
    excludedClaims: [], // Can still be CAFO finished
    requiredWith: ['grass_finished', '100_percent_grass', 'no_feedlot'], // Need these for quality
    suspiciousWith: ['usda_prime', 'high_marbling', 'wagyu'], // Red flags
    omegaRatioHint: [8, 15], // Typical "grass-fed" (with grain finishing)
    brixImpact: undefined, // N/A for meat
  },

  confidenceLevel: 'high',
  dataSource: ['USDA archives', 'Industry analysis', 'Lab test results'],
  lastVerified: new Date('2024-12-01'),
}

export const CLAIM_GRASS_FINISHED: Claim = {
  id: 'grass_finished',
  name: 'Grass-Finished',
  alternativeNames: ['Grass Finished', '100% Grass-Fed', '100% Grassfed'],
  category: 'feeding_regime',
  applicableProducts: ['meat', 'dairy'],

  regulatory: {
    status: 'voluntary_standard',
    enforcementLevel: 'weak',
    regulatoryBody: 'Various third-party certifiers',
    legalDefinition: 'No federal definition, but implies 100% grass diet through slaughter',
    requirements: [
      'Third-party certifications (AGA, PCO, etc.) require 100% grass/forage',
      'No grain at any point',
      'Must be on pasture',
    ],
    loopholes: [
      'Without certification, claim is self-declared',
      'Some allow hay/silage (still technically grass-finished)',
    ],
    penaltiesExist: false,
    notes:
      'Stronger claim than "grass-fed" but still not federally regulated. Look for certifications.',
  },

  marketing: {
    consumerPerception:
      '100% grass diet, optimal omega ratios, premium quality',
    brandUsage: 'Ultra-premium positioning, health-forward marketing',
    premiumJustification: 'Maximum health benefits, true grass-fed experience',
    commonMisconceptions: [
      'All grass-finished is equal (FALSE - soil quality varies)',
      'Grass-finished = tender/marbled (FALSE - leaner, different texture)',
    ],
    emotionalAppeal: 'Pure, optimal, uncompromised',
  },

  reality: {
    actualMeaning:
      'Significantly more reliable than "grass-fed" alone. Indicates no grain finishing. Should have omega ratio 2-4:1.',
    nutritionalImpact: 'positive',
    qualityCorrelation: 'strong',
    fielderAssessment:
      'This is the claim that matters for beef. "Grass-finished" or "100% grass-fed" indicates no feedlot finishing, which preserves the omega-3 profile built during pasture time. Lab testing typically confirms 2-4:1 omega ratio. This is what consumers think "grass-fed" means.',
    redFlags: [
      'Grass-finished + high marbling → suspicious, may not be true',
    ],
    greenFlags: [
      'Grass-finished + third-party certification → highest confidence',
      'Grass-finished + omega ratio on label → brand stands behind claim',
    ],
    shareImpact: {
      soil: 'unknown',
      heritage: 'neutral',
      agricultural: 'positive',
      ripen: 'neutral',
      enrich: 'positive', // Key claim for omega profile
    },
  },

  inference: {
    impliedClaims: ['grass_fed', 'no_feedlot', 'pasture_raised'],
    excludedClaims: ['grain_finished', 'feedlot'],
    omegaRatioHint: [2, 4], // True grass-finished range
    brixImpact: undefined,
  },

  confidenceLevel: 'high',
  dataSource: ['Lab testing', 'Industry certifications', 'Fielder analysis'],
  lastVerified: new Date('2024-12-01'),
}

// =============================================================================
// PASTURE-RAISED CLAIMS
// =============================================================================

export const CLAIM_PASTURE_RAISED: Claim = {
  id: 'pasture_raised',
  name: 'Pasture-Raised',
  alternativeNames: ['Pasture Raised', 'Pastured'],
  category: 'animal_welfare',
  applicableProducts: ['meat', 'poultry', 'eggs', 'dairy'],

  regulatory: {
    status: 'partially_defined',
    enforcementLevel: 'weak',
    regulatoryBody: 'USDA (minimal), third-party certifiers',
    legalDefinition:
      'No clear federal definition. USDA allows with documentation that animals were raised on pasture.',
    requirements: [
      'USDA: Must have continuous access to pasture',
      'No minimum outdoor time specified federally',
    ],
    loopholes: [
      'Does NOT exclude feedlot finishing',
      'Does NOT specify pasture quality',
      'Does NOT require specific outdoor time',
      'Can still be grain-fed on pasture',
    ],
    penaltiesExist: false,
    notes:
      'Better than cage-free/free-range but still has significant variance. Third-party certification (Certified Humane, etc.) adds specificity.',
  },

  marketing: {
    consumerPerception:
      'Animals roaming freely on green pastures, natural living',
    brandUsage: 'Premium positioning, welfare story, natural narrative',
    premiumJustification: 'Better animal welfare, more natural, healthier product',
    commonMisconceptions: [
      'Pasture-raised means no grain (FALSE - many are grain-supplemented)',
      'Pasture-raised means no CAFO (FALSE without explicit exclusion)',
      'Pasture-raised eggs are nutritionally superior (MODERATE - diet matters more)',
    ],
    emotionalAppeal: 'Freedom, nature, ethical treatment',
  },

  reality: {
    actualMeaning:
      'Animals had pasture access. Does NOT guarantee diet (grain vs grass) or exclude feedlot finishing for beef.',
    nutritionalImpact: 'variable',
    qualityCorrelation: 'moderate',
    fielderAssessment:
      'Pasture-raised is a welfare claim, not a nutrition claim. For beef, it\'s actually MORE honest than "grass-fed" because it doesn\'t promise grass diet - but without "no feedlot" claim, CAFO finishing is possible. For eggs, pasture-raised with good diet (insects, forage) produces better omega ratios than just "cage-free."',
    redFlags: [
      'Pasture-raised beef without "no feedlot" → assume CAFO finishing',
    ],
    greenFlags: [
      'Pasture-raised + no feedlot/CAFO → explicitly excludes confinement',
      'Pasture-raised eggs from small farms → likely good insect/forage access',
    ],
    shareImpact: {
      soil: 'neutral',
      heritage: 'neutral',
      agricultural: 'positive',
      ripen: 'neutral',
      enrich: 'variable',
    },
  },

  inference: {
    impliedClaims: [], // Pasture-raised alone doesn't imply grass diet
    excludedClaims: ['caged', 'confined'],
    suspiciousWith: [], // Pasture-raised is honest about what it is
    omegaRatioHint: [4, 12], // Wide range depending on finishing
    brixImpact: undefined,
  },

  confidenceLevel: 'high',
  dataSource: ['USDA', 'Third-party certifiers', 'Fielder analysis'],
  lastVerified: new Date('2024-12-01'),
}

// =============================================================================
// EGG CLAIMS
// =============================================================================

export const CLAIM_CAGE_FREE: Claim = {
  id: 'cage_free',
  name: 'Cage-Free',
  alternativeNames: ['Cage Free'],
  category: 'animal_welfare',
  applicableProducts: ['eggs', 'poultry'],

  regulatory: {
    status: 'legally_defined',
    enforcementLevel: 'moderate',
    regulatoryBody: 'USDA',
    legalDefinition: 'Hens not kept in cages. Can be fully indoors.',
    requirements: [
      'Hens not in cages',
      'Can move freely within enclosed building',
    ],
    loopholes: [
      'NO outdoor access required',
      'Can be packed in barn at high density',
      'Feed is typically grain-based (same as caged)',
    ],
    penaltiesExist: true,
    notes: 'Cage-free is the minimum improvement over conventional caged hens.',
  },

  marketing: {
    consumerPerception: 'Hens can move around, better welfare, better eggs',
    brandUsage: 'Entry-level premium, "better than conventional" positioning',
    premiumJustification: 'Better treatment of animals',
    commonMisconceptions: [
      'Cage-free means outdoor access (FALSE)',
      'Cage-free eggs are more nutritious (MINIMAL difference)',
      'Cage-free means spacious conditions (NOT necessarily)',
    ],
    emotionalAppeal: 'Freedom, basic decency',
  },

  reality: {
    actualMeaning:
      'Not in cages. Usually in large barns. Feed is same grain-based diet. Minimal nutritional difference from conventional.',
    nutritionalImpact: 'neutral',
    qualityCorrelation: 'none',
    fielderAssessment:
      'Cage-free is a welfare claim, not a nutrition claim. The hens eat the same corn/soy diet as caged hens, so omega ratios are similar (~15:1). If you\'re buying for nutrition, cage-free alone isn\'t enough. Look for pasture-raised with access to insects and forage.',
    redFlags: [
      'Cage-free marketed as "healthy" → misleading, same diet as conventional',
    ],
    greenFlags: [],
    shareImpact: {
      soil: 'neutral',
      heritage: 'neutral',
      agricultural: 'neutral', // Same grain diet
      ripen: 'neutral',
      enrich: 'neutral', // No omega improvement
    },
  },

  inference: {
    impliedClaims: ['no_cages'],
    excludedClaims: ['caged'],
    omegaRatioHint: [12, 18], // Similar to conventional due to grain diet
    brixImpact: undefined,
  },

  confidenceLevel: 'high',
  dataSource: ['USDA', 'Nutrition studies', 'Fielder analysis'],
  lastVerified: new Date('2024-12-01'),
}

export const CLAIM_FREE_RANGE: Claim = {
  id: 'free_range',
  name: 'Free-Range',
  alternativeNames: ['Free Range'],
  category: 'animal_welfare',
  applicableProducts: ['eggs', 'poultry'],

  regulatory: {
    status: 'legally_defined',
    enforcementLevel: 'moderate',
    regulatoryBody: 'USDA',
    legalDefinition: 'Must have access to outdoors. No minimum outdoor time.',
    requirements: [
      'Access to outdoors must exist',
      'No minimum time outdoors',
      'Outdoor area can be small',
    ],
    loopholes: [
      '"Access" can be a small door that hens rarely use',
      'No minimum outdoor space per bird',
      'No requirements for pasture quality',
      'Feed is still typically grain-based',
    ],
    penaltiesExist: true,
    notes:
      'Slightly better than cage-free but outdoor "access" is often minimal.',
  },

  marketing: {
    consumerPerception: 'Hens roaming outside, fresh air, healthier eggs',
    brandUsage: 'Mid-premium positioning, natural lifestyle image',
    premiumJustification: 'Outdoor access, more natural life',
    commonMisconceptions: [
      'Free-range means significant outdoor time (NOT necessarily)',
      'Free-range hens eat insects and forage (NOT required)',
      'Free-range eggs have better omega ratios (MINIMAL improvement)',
    ],
    emotionalAppeal: 'Sunshine, fresh air, freedom',
  },

  reality: {
    actualMeaning:
      'Door to outside exists. Hens may or may not use it. Diet is usually same grain-based feed.',
    nutritionalImpact: 'neutral',
    qualityCorrelation: 'weak',
    fielderAssessment:
      'Free-range is barely better than cage-free for nutrition. The "access to outdoors" loophole means many birds never actually go outside, and when they do, they\'re not foraging. Diet remains grain-based, so omega ratios don\'t significantly improve. Pasture-raised with actual foraging is what consumers imagine free-range to be.',
    redFlags: [
      'Free-range from large commercial operation → likely minimal actual outdoor time',
    ],
    greenFlags: [
      'Free-range + small farm → more likely meaningful outdoor access',
    ],
    shareImpact: {
      soil: 'neutral',
      heritage: 'neutral',
      agricultural: 'neutral',
      ripen: 'neutral',
      enrich: 'neutral',
    },
  },

  inference: {
    impliedClaims: ['cage_free', 'outdoor_access'],
    excludedClaims: ['caged'],
    omegaRatioHint: [10, 16], // Slight improvement possible
    brixImpact: undefined,
  },

  confidenceLevel: 'high',
  dataSource: ['USDA', 'Nutrition studies', 'Fielder analysis'],
  lastVerified: new Date('2024-12-01'),
}

// =============================================================================
// "NATURAL" CLAIMS
// =============================================================================

export const CLAIM_NATURAL: Claim = {
  id: 'natural',
  name: 'Natural',
  alternativeNames: ['All Natural', '100% Natural'],
  category: 'processing',
  applicableProducts: ['all'],

  regulatory: {
    status: 'partially_defined',
    enforcementLevel: 'weak',
    regulatoryBody: 'USDA (meat), FDA (other)',
    legalDefinition:
      'For meat: minimally processed, no artificial ingredients. For other foods: essentially meaningless.',
    requirements: [
      'Meat: No artificial ingredients, minimal processing',
      'Other foods: No specific requirements',
    ],
    loopholes: [
      'Does NOT mean organic',
      'Does NOT mean no pesticides',
      'Does NOT mean no GMO',
      'Does NOT mean no hormones (even for meat)',
      'Can still be factory farmed',
      'Can still be highly processed (for non-meat)',
    ],
    penaltiesExist: false,
    notes:
      '"Natural" is the most overused and meaningless food marketing term. It provides virtually no guarantees.',
  },

  marketing: {
    consumerPerception: 'Healthy, pure, not processed, no chemicals',
    brandUsage: 'Broad appeal, vague health halo, competitive differentiation',
    premiumJustification: 'Healthier, purer, less processed',
    commonMisconceptions: [
      'Natural means organic (FALSE)',
      'Natural means healthy (FALSE)',
      'Natural means no pesticides/chemicals (FALSE)',
      'Natural beef is grass-fed (FALSE - typically feedlot)',
    ],
    emotionalAppeal: 'Purity, simplicity, wholesome',
  },

  reality: {
    actualMeaning:
      'MARKETING TERM with almost no legal meaning. For beef, "natural" means commodity feedlot beef with no added preservatives in processing. Same omega ratio as conventional.',
    nutritionalImpact: 'neutral',
    qualityCorrelation: 'none',
    fielderAssessment:
      '"Natural" is the most deceptive term in food marketing. For beef, it\'s commodity CAFO beef with a marketing spin. Companies use it to capture health-conscious consumers without actually changing production practices. If someone sells "natural" beef, they\'re hiding behind a meaningless term while charging a premium. Avoid or verify with real claims.',
    redFlags: [
      'Natural beef as only claim → commodity feedlot, marketing play',
      'Natural + premium pricing → paying extra for nothing',
      'Natural without organic/grass-fed → definitely not special',
    ],
    greenFlags: [],
    shareImpact: {
      soil: 'neutral',
      heritage: 'neutral',
      agricultural: 'neutral',
      ripen: 'neutral',
      enrich: 'neutral',
    },
  },

  inference: {
    impliedClaims: [], // Natural implies nothing
    excludedClaims: [], // Natural excludes nothing
    suspiciousWith: [], // Natural itself is the red flag
    omegaRatioHint: [15, 20], // Same as commodity
    brixImpact: 'neutral',
  },

  confidenceLevel: 'high',
  dataSource: ['USDA', 'FDA', 'FTC', 'Industry analysis'],
  lastVerified: new Date('2024-12-01'),
}

// =============================================================================
// HORMONE/ANTIBIOTIC CLAIMS
// =============================================================================

export const CLAIM_NO_HORMONES: Claim = {
  id: 'no_hormones',
  name: 'No Hormones Added',
  alternativeNames: [
    'Hormone-Free',
    'No Added Hormones',
    'Raised Without Hormones',
  ],
  category: 'production_method',
  applicableProducts: ['meat', 'dairy'],

  regulatory: {
    status: 'legally_defined',
    enforcementLevel: 'moderate',
    regulatoryBody: 'USDA',
    legalDefinition: 'No growth hormones administered to the animal',
    requirements: ['No synthetic or natural growth hormones given'],
    loopholes: [
      'Pork and poultry NEVER get hormones (illegal) - so claim is meaningless on these',
      'Does NOT affect feeding regime, welfare, or other practices',
      'Does NOT affect omega ratios',
    ],
    penaltiesExist: true,
    notes:
      'Legitimate claim for beef. Meaningless marketing on pork and poultry (hormones already illegal).',
  },

  marketing: {
    consumerPerception: 'Cleaner, safer, no foreign substances',
    brandUsage: 'Health/safety positioning, especially effective for parents',
    premiumJustification: 'Avoiding potential hormone-related health concerns',
    commonMisconceptions: [
      'Hormone-free chicken is special (FALSE - ALL chicken is hormone-free by law)',
      'Hormone-free pork is special (FALSE - ALL pork is hormone-free by law)',
      'No hormones means healthier meat (UNPROVEN - no established link)',
      'No hormones means better omega ratio (FALSE - unrelated)',
    ],
    emotionalAppeal: 'Safety, purity, protecting family',
  },

  reality: {
    actualMeaning:
      'For beef: No growth hormones administered. For pork/chicken: Meaningless marketing (hormones already illegal). Does NOT affect nutrition.',
    nutritionalImpact: 'neutral',
    qualityCorrelation: 'none',
    fielderAssessment:
      'For beef, this is a legitimate claim but doesn\'t affect omega ratios or nutrition. For pork and poultry, it\'s pure marketing theater - hormones are ALREADY ILLEGAL in these animals. The claim preys on consumer fear without providing actual differentiation. Don\'t pay premium for this on chicken or pork.',
    redFlags: [
      'No hormones on chicken/pork → marketing play on ignorance',
      'No hormones as primary beef claim without grass-fed → still feedlot',
    ],
    greenFlags: [],
    shareImpact: {
      soil: 'neutral',
      heritage: 'neutral',
      agricultural: 'neutral',
      ripen: 'neutral',
      enrich: 'neutral',
    },
  },

  inference: {
    impliedClaims: [],
    excludedClaims: [],
    omegaRatioHint: undefined, // No impact on omega
    brixImpact: undefined,
  },

  confidenceLevel: 'high',
  dataSource: ['USDA', 'FDA', 'Fielder analysis'],
  lastVerified: new Date('2024-12-01'),
}

export const CLAIM_NO_ANTIBIOTICS: Claim = {
  id: 'no_antibiotics',
  name: 'No Antibiotics',
  alternativeNames: [
    'Antibiotic-Free',
    'Raised Without Antibiotics',
    'NAE (No Antibiotics Ever)',
  ],
  category: 'production_method',
  applicableProducts: ['meat', 'poultry', 'eggs', 'dairy'],

  regulatory: {
    status: 'legally_defined',
    enforcementLevel: 'moderate',
    regulatoryBody: 'USDA',
    legalDefinition:
      'No antibiotics administered to the animal at any point in its life',
    requirements: [
      'No antibiotics for treatment, prevention, or growth promotion',
      'Sick animals that need antibiotics must be removed from NAE program',
    ],
    loopholes: [
      'Does NOT affect feeding regime',
      'Does NOT require better welfare',
      'Does NOT affect nutrition',
    ],
    penaltiesExist: true,
    notes:
      'Legitimate claim addressing antibiotic resistance concerns. Does not affect nutrition.',
  },

  marketing: {
    consumerPerception: 'Safer, no superbugs, cleaner meat',
    brandUsage: 'Health/safety positioning, responsible farming narrative',
    premiumJustification: 'Avoiding antibiotic resistance, cleaner product',
    commonMisconceptions: [
      'No antibiotics means healthier meat (nutrition unaffected)',
      'No antibiotics means grass-fed (FALSE - unrelated claims)',
      'Antibiotics in meat transfer to humans (minimal - withdrawal periods)',
    ],
    emotionalAppeal: 'Safety, responsibility, avoiding chemicals',
  },

  reality: {
    actualMeaning:
      'No antibiotics given. Does not affect nutrition, omega ratios, or other quality metrics.',
    nutritionalImpact: 'neutral',
    qualityCorrelation: 'none',
    fielderAssessment:
      'NAE addresses antibiotic resistance concerns (legitimate public health issue), but does NOT affect the nutritional quality of the meat. An NAE feedlot steak has the same omega ratio (~20:1) as a conventional feedlot steak. This is a "minimize the bad" claim, not a "maximize the good" claim - and the "bad" it minimizes is population-level antibiotic resistance, not individual nutrition.',
    redFlags: [
      'No antibiotics as primary claim without grass-fed → still feedlot',
    ],
    greenFlags: [
      'No antibiotics + grass-finished → comprehensive quality approach',
    ],
    shareImpact: {
      soil: 'neutral',
      heritage: 'neutral',
      agricultural: 'neutral',
      ripen: 'neutral',
      enrich: 'neutral',
    },
  },

  inference: {
    impliedClaims: [],
    excludedClaims: [],
    omegaRatioHint: undefined, // No impact
    brixImpact: undefined,
  },

  confidenceLevel: 'high',
  dataSource: ['USDA', 'Public health research', 'Fielder analysis'],
  lastVerified: new Date('2024-12-01'),
}

// =============================================================================
// PRODUCE CLAIMS
// =============================================================================

export const CLAIM_NON_GMO: Claim = {
  id: 'non_gmo',
  name: 'Non-GMO',
  alternativeNames: ['GMO-Free', 'Non-GMO Project Verified'],
  category: 'heritage_origin',
  applicableProducts: ['all'],

  regulatory: {
    status: 'voluntary_standard',
    enforcementLevel: 'moderate',
    regulatoryBody: 'Non-GMO Project (third-party)',
    legalDefinition: 'Not genetically modified. No federal definition.',
    requirements: [
      'Non-GMO Project: <0.9% GMO contamination',
      'Third-party testing and certification',
    ],
    loopholes: [
      'Does NOT mean organic',
      'Does NOT mean no pesticides',
      'Some crops have NO GMO versions (citrus, most fruit) - claim is meaningless',
    ],
    penaltiesExist: false,
    notes:
      'Meaningful for crops with GMO versions (corn, soy, canola, papaya). Marketing theater for crops with no GMO versions.',
  },

  marketing: {
    consumerPerception: 'Natural genetics, no Frankenfoods, safer',
    brandUsage: 'Health positioning, fear-based marketing',
    premiumJustification: 'Avoiding potential unknown risks of GMOs',
    commonMisconceptions: [
      'Non-GMO means organic (FALSE)',
      'Non-GMO means healthier (UNPROVEN)',
      'Non-GMO produce is special (FALSE for most fruits/vegetables)',
      'GMOs are proven dangerous (FALSE after decades of research)',
    ],
    emotionalAppeal: 'Natural, traditional, avoiding unknown risks',
  },

  reality: {
    actualMeaning:
      'Not genetically modified. Meaningful for corn, soy, canola, papaya, some squash. Meaningless marketing for most produce.',
    nutritionalImpact: 'neutral',
    qualityCorrelation: 'none',
    fielderAssessment:
      'Non-GMO is appropriate to avoid under precautionary principle, but has NO proven nutritional impact. For citrus, apples, stone fruit, berries - there ARE no GMO versions, so the claim is pure marketing. Heritage cultivars are inherently non-GMO by definition. Fielder prefers heritage for QUALITY reasons (flavor/nutrition genetics), not GMO avoidance.',
    redFlags: [
      'Non-GMO claim on produce with no GMO versions → marketing play',
      'Non-GMO feed as primary meat claim → missing the point (omega ratio matters)',
    ],
    greenFlags: [
      'Non-GMO + heritage cultivar → real genetic quality focus',
    ],
    shareImpact: {
      soil: 'neutral',
      heritage: 'neutral', // Non-GMO ≠ heritage
      agricultural: 'neutral',
      ripen: 'neutral',
      enrich: 'neutral',
    },
  },

  inference: {
    impliedClaims: [],
    excludedClaims: ['gmo'],
    omegaRatioHint: undefined,
    brixImpact: 'neutral',
  },

  confidenceLevel: 'high',
  dataSource: ['Non-GMO Project', 'FDA', 'Academic research'],
  lastVerified: new Date('2024-12-01'),
}

// =============================================================================
// ALL CLAIMS (combined for export)
// =============================================================================

export const ALL_CLAIMS: Claim[] = [
  CLAIM_ORGANIC,
  CLAIM_GRASS_FED,
  CLAIM_GRASS_FINISHED,
  CLAIM_PASTURE_RAISED,
  CLAIM_CAGE_FREE,
  CLAIM_FREE_RANGE,
  CLAIM_NATURAL,
  CLAIM_NO_HORMONES,
  CLAIM_NO_ANTIBIOTICS,
  CLAIM_NON_GMO,
]

// =============================================================================
// LOOKUP HELPERS
// =============================================================================

/**
 * Find claim by ID or name
 */
export function findClaim(idOrName: string): Claim | undefined {
  const normalized = idOrName.toLowerCase().trim()
  return ALL_CLAIMS.find(
    (c) =>
      c.id === normalized ||
      c.name.toLowerCase() === normalized ||
      c.alternativeNames.some((alt) => alt.toLowerCase() === normalized)
  )
}

/**
 * Get claims by category
 */
export function getClaimsByCategory(category: ClaimCategory): Claim[] {
  return ALL_CLAIMS.filter((c) => c.category === category)
}

/**
 * Get claims applicable to a product type
 */
export function getClaimsForProduct(product: ApplicableProduct): Claim[] {
  return ALL_CLAIMS.filter(
    (c) => c.applicableProducts.includes(product) || c.applicableProducts.includes('all')
  )
}

/**
 * Analyze a set of claims for red flags
 */
export function analyzeClaimsForRedFlags(claimIds: string[]): string[] {
  const redFlags: string[] = []
  const claims = claimIds.map(findClaim).filter(Boolean) as Claim[]

  for (const claim of claims) {
    // Check individual red flags
    if (claim.reality.redFlags) {
      for (const flag of claim.reality.redFlags) {
        // Check if flag conditions are met by other claims
        // This is simplified - full implementation would parse flag conditions
        redFlags.push(`${claim.name}: ${flag}`)
      }
    }

    // Check suspicious combinations
    if (claim.inference.suspiciousWith) {
      for (const suspicious of claim.inference.suspiciousWith) {
        if (claimIds.includes(suspicious)) {
          redFlags.push(
            `${claim.name} combined with ${suspicious} is suspicious`
          )
        }
      }
    }
  }

  return redFlags
}

/**
 * Infer omega ratio range from claims
 */
export function inferOmegaRatioFromClaims(
  claimIds: string[]
): [number, number] | undefined {
  const claims = claimIds.map(findClaim).filter(Boolean) as Claim[]

  // Find the most specific omega hint
  let bestHint: [number, number] | undefined

  for (const claim of claims) {
    if (claim.inference.omegaRatioHint) {
      if (!bestHint || claim.inference.omegaRatioHint[1] < bestHint[1]) {
        // Prefer claims that suggest lower (better) omega ratio
        bestHint = claim.inference.omegaRatioHint
      }
    }
  }

  return bestHint
}

/**
 * Get regulatory summary for a claim
 */
export function getRegulatoryStatus(claimId: string): string {
  const claim = findClaim(claimId)
  if (!claim) return 'Unknown claim'

  const { regulatory } = claim
  return `${regulatory.status} - ${regulatory.enforcementLevel} enforcement by ${regulatory.regulatoryBody || 'no specific body'}`
}
