/**
 * =============================================================================
 * SHARE INFERENCE CHAINS
 * =============================================================================
 *
 * This module documents how Fielder infers SHARE pillar data when direct
 * farm-level data is unavailable. The inference system enables quality
 * estimation across the entire supply chain.
 *
 * CORE INSIGHT: Every data point has a dimensional model:
 *   Product × Origin × Destination × Time × Quality
 *   = H (Heritage) × S (Soil) × R (Ripen) × E (Enrich)
 *   with A (Agricultural practices) attached to origin
 *
 * DATA ATTRIBUTION LEVELS (from most to least specific):
 *   1. Farm-level: Direct from farmer (highest confidence)
 *   2. Packinghouse-level: Known packer, region inferred
 *   3. Region-level: Growing region known, farm unknown
 *   4. State-level: Only state origin known
 *   5. Unknown: "Product of USA" only
 *
 * The inference chains below show how to estimate SHARE pillars at each level.
 */

// =============================================================================
// H - HERITAGE INFERENCE CHAINS
// =============================================================================
/**
 * H-Pillar: Genetic heritage / cultivar identification
 *
 * INFERENCE CHAIN:
 *   Trade Name → Cultivar → Known Attributes
 *
 * EXAMPLES:
 *   - "SUMO" (trade name) → Shiranui cultivar → Known non-GMO, Brix 12-16
 *   - "Cosmic Crisp" (trade name) → WA 38 cultivar → Known heritage
 *   - "Pink Lady" (trade name) → Cripps Pink cultivar → Known attributes
 *
 * PLU CODE INFERENCE:
 *   - Prefix 9 (organic) → Must be non-GMO (organic standards)
 *   - PLU lookup → Category → Known GMO/non-GMO status
 *   - Example: 94011 (organic banana) → non-GMO verified
 *
 * CONFIDENCE LEVELS:
 *   - High: Cultivar explicitly identified (DNA/variety tag)
 *   - Medium: Trade name mapped to cultivar
 *   - Low: Only product category known
 */
export type HeritageInferenceSource =
  | 'cultivar_identified'    // Farmer/label specifies cultivar
  | 'trade_name_mapped'      // Trade name → cultivar lookup
  | 'plu_code_lookup'        // PLU code inference
  | 'organic_certified'      // Organic → non-GMO
  | 'category_default'       // Category-level assumptions

export interface HeritageInference {
  source: HeritageInferenceSource
  isNonGmo: boolean | 'inferred' | 'unknown'
  cultivarId?: string
  confidence: 'high' | 'medium' | 'low'
  reasoning: string
}

/**
 * Infer heritage status from available data
 */
export function inferHeritage(
  productCategory: string,
  pluCode?: string,
  tradeName?: string,
  organicCertified?: boolean
): HeritageInference {
  // Organic → non-GMO (regulatory requirement)
  if (organicCertified) {
    return {
      source: 'organic_certified',
      isNonGmo: true,
      confidence: 'high',
      reasoning: 'USDA Organic certification requires non-GMO'
    }
  }

  // PLU prefix 9 = organic
  if (pluCode?.startsWith('9')) {
    return {
      source: 'plu_code_lookup',
      isNonGmo: true,
      confidence: 'high',
      reasoning: 'PLU prefix 9 indicates organic, which requires non-GMO'
    }
  }

  // Trade name inference would use CULTIVARS lookup
  if (tradeName) {
    // This would lookup tradeName → cultivar → isNonGmo
    return {
      source: 'trade_name_mapped',
      isNonGmo: 'inferred',
      confidence: 'medium',
      reasoning: `Trade name "${tradeName}" mapped to cultivar with known attributes`
    }
  }

  // Category-level: Most produce is non-GMO
  // Only ~10 GMO crops approved in US: corn, soy, cotton, canola, sugar beet, papaya, squash, apple (Arctic), potato, salmon
  const gmoRiskCategories = ['corn', 'soy', 'canola', 'papaya', 'squash']
  const isGmoRisk = gmoRiskCategories.includes(productCategory)

  return {
    source: 'category_default',
    isNonGmo: isGmoRisk ? 'unknown' : 'inferred',
    confidence: 'low',
    reasoning: isGmoRisk
      ? `${productCategory} has GMO varieties available - requires verification`
      : `${productCategory} has no approved GMO varieties in US market`
  }
}


// =============================================================================
// S - SOIL/FOUNDATION INFERENCE CHAINS
// =============================================================================
/**
 * S-Pillar: Soil/foundation environment
 *
 * INFERENCE CHAIN:
 *   Farm → Packinghouse → Region → typicalSoil
 *
 * EXAMPLES:
 *   - Farm in Vero Beach → Indian River District → Ridge soils (sandy, well-drained)
 *   - Packinghouse in Lakeland → Central FL → Mixed Ridge/Flatwoods (medium confidence)
 *   - "Product of California" → State-level → Multiple soil types (low confidence)
 *
 * FLORIDA CASE STUDY:
 *   - Ridge soils (Indian River, Lake Wales Ridge): Sandy, deep, well-drained
 *     → Premium citrus, higher Brix, stress-concentrated sugars
 *   - Flatwoods soils (interior): Sandy over spodic horizon, higher water table
 *     → Higher yields, lower Brix, volume production
 *
 * CONFIDENCE LEVELS:
 *   - High: Farm GPS or consistent regional soil (e.g., Homestead limestone)
 *   - Medium: Region known but soil varies (e.g., Central FL mix)
 *   - Low: Only state or multi-region known
 */
export type SoilInferenceSource =
  | 'farm_provided'         // Direct from farmer
  | 'packinghouse_region'   // Packinghouse → region lookup
  | 'region_typical'        // Region's typicalSoil profile
  | 'state_general'         // State-level generalization

export interface SoilInference {
  source: SoilInferenceSource
  soilType?: string
  drainage?: 'excellent' | 'good' | 'moderate' | 'poor'
  terroirEffect?: string
  confidence: 'high' | 'medium' | 'low'
  reasoning: string
}

/**
 * Florida-specific soil zone classification
 *
 * The Ridge vs Flatwoods distinction is critical for citrus quality inference
 */
export const FLORIDA_SOIL_ZONES = {
  /**
   * Ridge = elevated sandy spine through interior FL (Lake Wales Ridge)
   * Deep, well-drained Entisols - the PREMIUM citrus terroir
   */
  ridge: {
    regions: ['lake_wales_ridge', 'highlands'],
    counties: ['Highlands', 'Polk', 'Lake'],
    soilType: 'deep sandy Entisols (Ridge)',
    drainage: 'excellent' as const,
    terroirEffect: 'Premium citrus - stress-induced sugar concentration, higher Brix',
    qualityIndicator: 'premium'
  },
  /**
   * Indian River = east coast flatwoods, NOT Ridge
   * Famous for "Indian River" brand but actually coastal flatwoods soil
   * Still excellent citrus due to microclimate + marketing, but not Ridge geology
   */
  indian_river: {
    regions: ['indian_river', 'treasure_coast'],
    counties: ['Indian River', 'St. Lucie', 'Martin'],
    soilType: 'coastal flatwoods (sandy over hardpan)',
    drainage: 'moderate' as const,
    terroirEffect: 'Indian River District - famous brand, coastal microclimate, good quality',
    qualityIndicator: 'premium'  // Premium due to brand/microclimate, not geology
  },
  /**
   * Flatwoods = interior sandy plains with spodic horizon (hardpan)
   * Volume production areas
   */
  flatwoods: {
    regions: ['central_florida_flatwoods', 'southwest_florida'],
    counties: ['DeSoto', 'Hendry', 'Hardee', 'Collier'],
    soilType: 'sandy over spodic horizon',
    drainage: 'moderate' as const,
    terroirEffect: 'Volume production - higher yields, adequate but not premium quality',
    qualityIndicator: 'standard'
  },
  /**
   * Rockland = Miami-Dade oolitic limestone
   * Unique tropical terroir
   */
  rockland: {
    regions: ['homestead_redland'],
    counties: ['Miami-Dade'],
    soilType: 'oolitic limestone',
    drainage: 'excellent' as const,
    terroirEffect: 'Unique tropical terroir - alkaline pH creates distinctive fruit flavors',
    qualityIndicator: 'specialty'
  }
} as const


// =============================================================================
// A - AGRICULTURAL PRACTICES INFERENCE CHAINS
// =============================================================================
/**
 * A-Pillar: Agricultural/harvesting practices
 *
 * INFERENCE CHAIN:
 *   PLU Code → Organic Status → Practice Assumptions
 *   + Category → Industry Standard Assumptions
 *
 * KEY INSIGHTS:
 *   - 70% of conventional farms practice IPM (Integrated Pest Management)
 *   - Organic certification → non-GMO + no synthetic pesticides
 *   - Pasture-raised meat → grass diet → better Omega-3:6 ratio
 *
 * PLU PREFIX MEANING:
 *   - 3xxx or 4xxx: Conventionally grown
 *   - 9xxxx: Organic
 *   - 8xxxx: GMO (rarely used in practice)
 *
 * CONFIDENCE LEVELS:
 *   - High: Certification (USDA Organic, AWA, etc.)
 *   - Medium: PLU code + industry statistics
 *   - Low: Category-level assumptions only
 */
export type PracticeInferenceSource =
  | 'certification'         // USDA Organic, Animal Welfare Approved, etc.
  | 'plu_code'              // PLU prefix inference
  | 'industry_statistics'   // 70% IPM assumption, etc.
  | 'category_default'      // Category-level assumptions

export interface PracticeInference {
  source: PracticeInferenceSource
  isOrganic: boolean | 'unknown'
  pestManagement?: 'organic' | 'ipm' | 'conventional' | 'unknown'
  animalWelfare?: 'pasture_raised' | 'free_range' | 'cage_free' | 'conventional' | 'unknown'
  confidence: 'high' | 'medium' | 'low'
  reasoning: string
}

/**
 * IPM (Integrated Pest Management) adoption rates by category
 *
 * Source: USDA NASS, agricultural extension data
 * Used for practice inference when no certification available
 */
export const IPM_ADOPTION_RATES = {
  citrus: 0.85,        // 85% of citrus uses IPM
  stone_fruit: 0.75,   // 75%
  pome_fruit: 0.70,    // 70% (apples, pears)
  berries: 0.65,       // 65%
  vegetables: 0.70,    // 70%
  nuts: 0.60,          // 60%
  default: 0.70        // 70% overall estimate
} as const


// =============================================================================
// R - RIPEN/TIMING INFERENCE CHAINS
// =============================================================================
/**
 * R-Pillar: Ripening/timing to peak quality
 *
 * INFERENCE CHAIN:
 *   Scan Location + Date + Product → Freshness Estimate
 *   + Cultivar → Ripening Behavior → Quality Window
 *
 * KEY CONCEPTS:
 *   - Non-climacteric (citrus, berries): Quality locked at harvest
 *   - Climacteric (stone fruit, bananas): Continues ripening post-harvest
 *   - Days since harvest matters for freshness scoring
 *
 * FRESHNESS ESTIMATION:
 *   - Regional shipping times: FL→Northeast = 3-5 days, CA→Midwest = 2-4 days
 *   - Seasonal peak windows affect quality (in-season vs storage)
 *   - Cold chain maintenance critical for perishables
 *
 * CONFIDENCE LEVELS:
 *   - High: Known harvest date + tracking
 *   - Medium: Region + typical shipping estimates
 *   - Low: Only product category known
 */
export type TimingInferenceSource =
  | 'harvest_date_known'    // Direct from farmer/packer
  | 'shipping_estimated'    // Region → destination time estimate
  | 'seasonal_assumption'   // In peak season vs off-season
  | 'storage_indicator'     // CA storage, frozen, etc.

export interface TimingInference {
  source: TimingInferenceSource
  estimatedDaysSinceHarvest?: number
  isInPeakSeason: boolean
  freshnessScore?: 'optimal' | 'good' | 'acceptable' | 'declining'
  confidence: 'high' | 'medium' | 'low'
  reasoning: string
}

/**
 * Typical shipping times from major growing regions to consumption markets
 * Used for freshness estimation when harvest date unknown
 */
export const REGIONAL_SHIPPING_DAYS = {
  // Florida origins
  indian_river_to_northeast: 3,
  indian_river_to_midwest: 4,
  indian_river_to_west_coast: 5,

  // California origins
  central_coast_to_midwest: 3,
  central_coast_to_northeast: 4,
  san_joaquin_to_midwest: 3,

  // Pacific Northwest
  washington_to_midwest: 2,
  washington_to_northeast: 4,

  // Default
  default_domestic: 4
} as const


// =============================================================================
// E - ENRICH/QUALITY INFERENCE CHAINS
// =============================================================================
/**
 * E-Pillar: Measurable quality indicators (Brix, Omega-3, etc.)
 *
 * INFERENCE CHAIN:
 *   Consumer Scan (CV Brix) + Refractometer → Actual Measurement
 *   OR Cultivar + Region + Season → Expected Brix Range
 *
 * FIELDER DATA FLYWHEEL:
 *   1. Consumer scans product (CV-based Brix estimate)
 *   2. OR uses $10 refractometer (actual Brix)
 *   3. Data tagged: Product × Location × Time × Quality
 *   4. Aggregated data improves predictions
 *   5. Even grocery store scans feed the model
 *
 * BRIX AS PROXY:
 *   - Brix correlates with: Carbohydrates, minerals, vitamins
 *   - Higher Brix generally = better nutrition + flavor
 *   - Cultivar × Region × Season determines expected range
 *
 * CONFIDENCE LEVELS:
 *   - High: Lab-tested or refractometer measurement
 *   - Medium: CV-estimated Brix (±1-2 Brix accuracy)
 *   - Low: Cultivar/region expected range only
 */
export type QualityInferenceSource =
  | 'lab_tested'            // Lab analysis (gold standard)
  | 'refractometer'         // Consumer $10 refractometer
  | 'cv_estimated'          // Computer vision Brix estimate
  | 'cultivar_expected'     // Cultivar's typical range
  | 'region_seasonal'       // Region + season adjustment

export interface QualityInference {
  source: QualityInferenceSource
  brixEstimate?: number
  brixRange?: [number, number]
  qualityScore?: 'exceptional' | 'excellent' | 'good' | 'average'
  confidence: 'high' | 'medium' | 'low'
  reasoning: string
}

/**
 * Example Brix ranges by cultivar (baseline expectations)
 * Actual values vary by region, season, and farm practices
 */
export const CULTIVAR_BRIX_EXPECTATIONS = {
  // Citrus
  shiranui: { min: 12, max: 16, optimal: 14 },      // SUMO orange
  cara_cara: { min: 11, max: 14, optimal: 13 },
  moro_blood: { min: 10, max: 13, optimal: 12 },
  meyer_lemon: { min: 8, max: 12, optimal: 10 },

  // Stone fruit
  elberta_peach: { min: 10, max: 14, optimal: 12 },
  arctic_star_nectarine: { min: 12, max: 16, optimal: 14 },

  // Berries
  chandler_strawberry: { min: 8, max: 12, optimal: 10 },
  driscoll_blueberry: { min: 12, max: 16, optimal: 14 },

  // Apples
  honeycrisp: { min: 12, max: 15, optimal: 14 },
  cosmic_crisp: { min: 13, max: 16, optimal: 15 }
} as const


// =============================================================================
// UNIFIED INFERENCE ENGINE
// =============================================================================
/**
 * Master inference result combining all SHARE pillars
 *
 * This is the output of running all inference chains on a scanned product
 */
export interface ShareInferenceResult {
  // Input data
  productId: string
  scanLocation: { lat: number; lng: number }
  scanDate: string
  pluCode?: string
  tradeName?: string

  // Inferred SHARE pillars
  heritage: HeritageInference
  soil: SoilInference
  agricultural: PracticeInference
  ripen: TimingInference
  enrich: QualityInference

  // Overall confidence
  overallConfidence: 'high' | 'medium' | 'low'
  dataGaps: string[]  // What additional data would improve confidence
}

/**
 * Example inference for a SUMO orange scanned at a grocery store
 *
 * This demonstrates the full inference chain from minimal input data
 *
 * INPUT: PLU 3456 (conventional mandarin), sticker says "California"
 *
 * INFERENCE:
 *   H: SUMO → Shiranui cultivar → non-GMO (known cultivar)
 *   S: California → Ventura region (likely) → coastal alluvium
 *   A: Conventional PLU → 85% chance IPM (citrus industry stats)
 *   R: Scan in February → peak season → optimal freshness expected
 *   E: Shiranui → Brix 12-16 range expected
 *
 * This is the power of the Product → Variety → Cultivar hierarchy:
 * Even minimal input data enables rich inference across all SHARE pillars
 */
export const EXAMPLE_INFERENCE: ShareInferenceResult = {
  productId: 'tangerine',
  scanLocation: { lat: 41.8781, lng: -87.6298 }, // Chicago
  scanDate: '2025-02-15',
  pluCode: '3456',
  tradeName: 'SUMO',

  heritage: {
    source: 'trade_name_mapped',
    isNonGmo: true,
    cultivarId: 'shiranui',
    confidence: 'high',
    reasoning: 'SUMO is trademarked name for Shiranui/Dekopon cultivar, known non-GMO'
  },

  soil: {
    source: 'region_typical',
    soilType: 'coastal alluvium/loam',
    drainage: 'excellent',
    terroirEffect: 'CA coastal citrus belt - mild stress, morning fog, premium quality',
    confidence: 'medium',
    reasoning: 'California origin likely Ventura/Ojai region (SUMO epicenter)'
  },

  agricultural: {
    source: 'industry_statistics',
    isOrganic: false,
    pestManagement: 'ipm',
    confidence: 'medium',
    reasoning: 'Conventional PLU + 85% citrus IPM adoption rate'
  },

  ripen: {
    source: 'seasonal_assumption',
    estimatedDaysSinceHarvest: 5,
    isInPeakSeason: true,
    freshnessScore: 'optimal',
    confidence: 'medium',
    reasoning: 'February is peak Shiranui season, CA→Chicago shipping ~3 days'
  },

  enrich: {
    source: 'cultivar_expected',
    brixRange: [12, 16],
    brixEstimate: 14,
    qualityScore: 'excellent',
    confidence: 'medium',
    reasoning: 'Shiranui cultivar typical Brix range, peak season expected quality'
  },

  overallConfidence: 'medium',
  dataGaps: [
    'Farm/packinghouse attribution would improve S pillar confidence',
    'Actual Brix measurement would confirm E pillar',
    'Organic certification status unclear'
  ]
}
