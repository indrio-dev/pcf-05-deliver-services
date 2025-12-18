/**
 * =============================================================================
 * REGIONAL CULTIVAR & ROOTSTOCK DISTRIBUTIONS
 * =============================================================================
 *
 * When we know a product's origin region but NOT its specific cultivar,
 * we can still make quality predictions using regional distribution data.
 *
 * INFERENCE MODEL:
 *   PLU scan → Packinghouse code → Region → RegionalCultivarDistribution
 *   → Weighted average of cultivar quality expectations
 *
 * DATA SOURCES:
 *   - USDA NASS (National Agricultural Statistics Service)
 *   - State agricultural statistics
 *   - Industry associations (Florida Citrus Mutual, CA Citrus Mutual)
 *   - Extension service publications
 *
 * PRECISION LEVELS:
 *   - Regional: "California Central Valley" (broad)
 *   - Sub-regional: "Kern County" (medium)
 *   - District: "Lindsay-Strathmore" (precise)
 */

// =============================================================================
// TYPES
// =============================================================================

export interface RegionalCultivarDistribution {
  id: string
  regionId: string
  regionName: string

  // What is grown
  categoryId: string // 'citrus', 'stone_fruit', etc.
  varietyId: string // 'navel', 'valencia', etc.
  cultivarId: string // 'washington_navel', 'cara_cara', etc.

  // Market share
  marketSharePct: number // 0-100
  acreage?: number // Approximate acres in production
  productionVolume?: number // Annual boxes/tons
  productionUnit?: 'boxes' | 'tons' | 'cwt'

  // Harvest timing for this cultivar in this region
  harvestWindow: {
    typicalStart: string // 'Nov' or 'Nov-01'
    typicalEnd: string // 'Mar' or 'Mar-31'
    peakStart?: string
    peakEnd?: string
  }

  // Quality characteristics for this cultivar in this region
  typicalBrixRange: [number, number]
  expectedQualityTier: 'artisan' | 'premium' | 'standard' | 'commodity'

  // Data quality
  dataSource: string
  dataYear?: number
  confidence: 'high' | 'medium' | 'low' | 'estimated'

  // Metadata
  notes?: string
  updatedAt: Date
}

export interface RegionalRootstockDistribution {
  id: string
  regionId: string
  regionName: string

  // Rootstock info
  rootstockId: string
  rootstockName: string

  // Market share
  marketSharePct: number // 0-100
  acreage?: number

  // Why used in this region
  primaryReason:
    | 'disease_resistance'
    | 'cold_hardiness'
    | 'soil_adaptation'
    | 'yield'
    | 'quality'
    | 'tradition'
  secondaryReasons?: string[]

  // Quality impact
  brixModifier: number // From rootstocks.ts

  // Data quality
  dataSource: string
  dataYear?: number
  confidence: 'high' | 'medium' | 'low' | 'estimated'

  updatedAt: Date
}

/**
 * Combined distribution for a region - used for inference
 */
export interface RegionalQualityProfile {
  regionId: string
  regionName: string
  categoryId: string

  // Cultivar breakdown
  cultivarDistributions: RegionalCultivarDistribution[]

  // Rootstock breakdown
  rootstockDistributions: RegionalRootstockDistribution[]

  // Aggregate quality expectations
  weightedAverageBrix: number
  dominantQualityTier: 'artisan' | 'premium' | 'standard' | 'commodity'

  // Seasonality
  overallHarvestWindow: {
    start: string
    end: string
    peakMonths: string[]
  }
}

// =============================================================================
// FLORIDA CITRUS DISTRIBUTIONS
// =============================================================================

/**
 * Florida citrus is primarily Navels and Valencias
 * Indian River (east coast) known for premium grapefruit
 * Central Ridge known for quality oranges
 */
export const FLORIDA_CITRUS_DISTRIBUTIONS: RegionalCultivarDistribution[] = [
  // ---------------------------------------------------------------------------
  // INDIAN RIVER (Premium grapefruit region)
  // ---------------------------------------------------------------------------
  {
    id: 'dist_ir_ruby_red',
    regionId: 'indian_river_fl',
    regionName: 'Indian River District, FL',
    categoryId: 'citrus',
    varietyId: 'grapefruit',
    cultivarId: 'ruby_red',
    marketSharePct: 45,
    acreage: 12000,
    harvestWindow: {
      typicalStart: 'Nov',
      typicalEnd: 'May',
      peakStart: 'Dec',
      peakEnd: 'Mar',
    },
    typicalBrixRange: [10.5, 12.5],
    expectedQualityTier: 'premium',
    dataSource: 'Florida Citrus Mutual, USDA NASS',
    dataYear: 2023,
    confidence: 'high',
    notes: 'Indian River has unique microclimate - sandy soil + ocean influence',
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'dist_ir_marsh_white',
    regionId: 'indian_river_fl',
    regionName: 'Indian River District, FL',
    categoryId: 'citrus',
    varietyId: 'grapefruit',
    cultivarId: 'marsh_white',
    marketSharePct: 20,
    acreage: 5300,
    harvestWindow: {
      typicalStart: 'Nov',
      typicalEnd: 'May',
      peakStart: 'Dec',
      peakEnd: 'Feb',
    },
    typicalBrixRange: [9.5, 11.5],
    expectedQualityTier: 'premium',
    dataSource: 'Florida Citrus Mutual',
    dataYear: 2023,
    confidence: 'high',
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'dist_ir_flame',
    regionId: 'indian_river_fl',
    regionName: 'Indian River District, FL',
    categoryId: 'citrus',
    varietyId: 'grapefruit',
    cultivarId: 'flame',
    marketSharePct: 15,
    acreage: 4000,
    harvestWindow: {
      typicalStart: 'Nov',
      typicalEnd: 'Apr',
      peakStart: 'Jan',
      peakEnd: 'Mar',
    },
    typicalBrixRange: [11.0, 13.0],
    expectedQualityTier: 'premium',
    dataSource: 'Florida Citrus Mutual',
    dataYear: 2023,
    confidence: 'medium',
    notes: 'Flame gaining popularity for deeper color and higher sugar',
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'dist_ir_washington_navel',
    regionId: 'indian_river_fl',
    regionName: 'Indian River District, FL',
    categoryId: 'citrus',
    varietyId: 'navel',
    cultivarId: 'washington_navel',
    marketSharePct: 12,
    acreage: 3200,
    harvestWindow: {
      typicalStart: 'Nov',
      typicalEnd: 'Jan',
      peakStart: 'Dec',
      peakEnd: 'Dec',
    },
    typicalBrixRange: [11.0, 13.0],
    expectedQualityTier: 'premium',
    dataSource: 'Florida Citrus Mutual',
    dataYear: 2023,
    confidence: 'high',
    updatedAt: new Date('2024-01-15'),
  },

  // ---------------------------------------------------------------------------
  // CENTRAL RIDGE (Quality orange region)
  // ---------------------------------------------------------------------------
  {
    id: 'dist_ridge_hamlin',
    regionId: 'florida_ridge',
    regionName: 'Florida Ridge (Central)',
    categoryId: 'citrus',
    varietyId: 'juice_orange',
    cultivarId: 'hamlin',
    marketSharePct: 35,
    acreage: 85000,
    harvestWindow: {
      typicalStart: 'Oct',
      typicalEnd: 'Jan',
      peakStart: 'Nov',
      peakEnd: 'Dec',
    },
    typicalBrixRange: [9.5, 11.5],
    expectedQualityTier: 'standard',
    dataSource: 'USDA NASS Florida Field Office',
    dataYear: 2023,
    confidence: 'high',
    notes: 'Early season juice orange, primary processing variety',
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'dist_ridge_valencia',
    regionId: 'florida_ridge',
    regionName: 'Florida Ridge (Central)',
    categoryId: 'citrus',
    varietyId: 'valencia',
    cultivarId: 'valencia_late',
    marketSharePct: 40,
    acreage: 95000,
    harvestWindow: {
      typicalStart: 'Mar',
      typicalEnd: 'Jun',
      peakStart: 'Apr',
      peakEnd: 'May',
    },
    typicalBrixRange: [11.0, 13.5],
    expectedQualityTier: 'premium',
    dataSource: 'USDA NASS Florida Field Office',
    dataYear: 2023,
    confidence: 'high',
    notes: 'Late season premium juice orange',
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'dist_ridge_washington_navel',
    regionId: 'florida_ridge',
    regionName: 'Florida Ridge (Central)',
    categoryId: 'citrus',
    varietyId: 'navel',
    cultivarId: 'washington_navel',
    marketSharePct: 15,
    acreage: 35000,
    harvestWindow: {
      typicalStart: 'Nov',
      typicalEnd: 'Jan',
      peakStart: 'Dec',
      peakEnd: 'Dec',
    },
    typicalBrixRange: [10.5, 12.5],
    expectedQualityTier: 'premium',
    dataSource: 'USDA NASS Florida Field Office',
    dataYear: 2023,
    confidence: 'high',
    updatedAt: new Date('2024-01-15'),
  },

  // ---------------------------------------------------------------------------
  // SOUTHWEST FLORIDA (Flatwoods - more commodity)
  // ---------------------------------------------------------------------------
  {
    id: 'dist_sw_hamlin',
    regionId: 'florida_flatwoods',
    regionName: 'SW Florida Flatwoods',
    categoryId: 'citrus',
    varietyId: 'juice_orange',
    cultivarId: 'hamlin',
    marketSharePct: 50,
    acreage: 60000,
    harvestWindow: {
      typicalStart: 'Oct',
      typicalEnd: 'Jan',
      peakStart: 'Nov',
      peakEnd: 'Dec',
    },
    typicalBrixRange: [8.5, 10.5],
    expectedQualityTier: 'commodity',
    dataSource: 'USDA NASS Florida Field Office',
    dataYear: 2023,
    confidence: 'high',
    notes: 'Higher water table, more vigorous growth, lower Brix',
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'dist_sw_valencia',
    regionId: 'florida_flatwoods',
    regionName: 'SW Florida Flatwoods',
    categoryId: 'citrus',
    varietyId: 'valencia',
    cultivarId: 'valencia_late',
    marketSharePct: 35,
    acreage: 42000,
    harvestWindow: {
      typicalStart: 'Mar',
      typicalEnd: 'Jun',
      peakStart: 'Apr',
      peakEnd: 'May',
    },
    typicalBrixRange: [10.0, 12.0],
    expectedQualityTier: 'standard',
    dataSource: 'USDA NASS Florida Field Office',
    dataYear: 2023,
    confidence: 'high',
    updatedAt: new Date('2024-01-15'),
  },
]

// =============================================================================
// CALIFORNIA CITRUS DISTRIBUTIONS
// =============================================================================

/**
 * California citrus is predominantly Navels (fresh) and Valencias
 * Central Valley for volume, Coastal for specialty
 */
export const CALIFORNIA_CITRUS_DISTRIBUTIONS: RegionalCultivarDistribution[] = [
  // ---------------------------------------------------------------------------
  // CENTRAL VALLEY (Primary production region)
  // ---------------------------------------------------------------------------
  {
    id: 'dist_cv_washington_navel',
    regionId: 'california_central_valley',
    regionName: 'California Central Valley',
    categoryId: 'citrus',
    varietyId: 'navel',
    cultivarId: 'washington_navel',
    marketSharePct: 35,
    acreage: 55000,
    harvestWindow: {
      typicalStart: 'Nov',
      typicalEnd: 'May',
      peakStart: 'Dec',
      peakEnd: 'Feb',
    },
    typicalBrixRange: [11.0, 13.0],
    expectedQualityTier: 'premium',
    dataSource: 'California Citrus Mutual, USDA NASS',
    dataYear: 2023,
    confidence: 'high',
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'dist_cv_cara_cara',
    regionId: 'california_central_valley',
    regionName: 'California Central Valley',
    categoryId: 'citrus',
    varietyId: 'navel',
    cultivarId: 'cara_cara',
    marketSharePct: 12,
    acreage: 19000,
    harvestWindow: {
      typicalStart: 'Dec',
      typicalEnd: 'Apr',
      peakStart: 'Jan',
      peakEnd: 'Mar',
    },
    typicalBrixRange: [12.0, 14.0],
    expectedQualityTier: 'premium',
    dataSource: 'California Citrus Mutual',
    dataYear: 2023,
    confidence: 'high',
    notes: 'Pink flesh, higher lycopene, premium market',
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'dist_cv_lane_late',
    regionId: 'california_central_valley',
    regionName: 'California Central Valley',
    categoryId: 'citrus',
    varietyId: 'navel',
    cultivarId: 'lane_late',
    marketSharePct: 18,
    acreage: 28000,
    harvestWindow: {
      typicalStart: 'Feb',
      typicalEnd: 'Jun',
      peakStart: 'Mar',
      peakEnd: 'May',
    },
    typicalBrixRange: [10.5, 12.5],
    expectedQualityTier: 'standard',
    dataSource: 'California Citrus Mutual',
    dataYear: 2023,
    confidence: 'high',
    notes: 'Late season extension, lower quality than Washington',
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'dist_cv_valencia',
    regionId: 'california_central_valley',
    regionName: 'California Central Valley',
    categoryId: 'citrus',
    varietyId: 'valencia',
    cultivarId: 'valencia_late',
    marketSharePct: 20,
    acreage: 31000,
    harvestWindow: {
      typicalStart: 'Apr',
      typicalEnd: 'Oct',
      peakStart: 'Jun',
      peakEnd: 'Aug',
    },
    typicalBrixRange: [11.5, 13.5],
    expectedQualityTier: 'premium',
    dataSource: 'California Citrus Mutual',
    dataYear: 2023,
    confidence: 'high',
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'dist_cv_meyer_lemon',
    regionId: 'california_central_valley',
    regionName: 'California Central Valley',
    categoryId: 'citrus',
    varietyId: 'lemon',
    cultivarId: 'meyer',
    marketSharePct: 5,
    acreage: 8000,
    harvestWindow: {
      typicalStart: 'Nov',
      typicalEnd: 'Mar',
      peakStart: 'Dec',
      peakEnd: 'Feb',
    },
    typicalBrixRange: [8.5, 10.5],
    expectedQualityTier: 'premium',
    dataSource: 'California Citrus Mutual',
    dataYear: 2023,
    confidence: 'medium',
    notes: 'Specialty lemon, sweeter than Eureka',
    updatedAt: new Date('2024-01-15'),
  },

  // ---------------------------------------------------------------------------
  // VENTURA/COASTAL (Premium specialty region)
  // ---------------------------------------------------------------------------
  {
    id: 'dist_ventura_eureka_lemon',
    regionId: 'ventura_county_ca',
    regionName: 'Ventura County, CA',
    categoryId: 'citrus',
    varietyId: 'lemon',
    cultivarId: 'eureka',
    marketSharePct: 60,
    acreage: 12000,
    harvestWindow: {
      typicalStart: 'Jan',
      typicalEnd: 'Dec', // Year-round in coastal CA
      peakStart: 'May',
      peakEnd: 'Aug',
    },
    typicalBrixRange: [6.0, 8.0],
    expectedQualityTier: 'premium',
    dataSource: 'Ventura County Agriculture Report',
    dataYear: 2023,
    confidence: 'high',
    notes: 'Year-round production due to coastal climate',
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'dist_ventura_lisbon_lemon',
    regionId: 'ventura_county_ca',
    regionName: 'Ventura County, CA',
    categoryId: 'citrus',
    varietyId: 'lemon',
    cultivarId: 'lisbon',
    marketSharePct: 25,
    acreage: 5000,
    harvestWindow: {
      typicalStart: 'Jan',
      typicalEnd: 'Dec',
      peakStart: 'Jun',
      peakEnd: 'Sep',
    },
    typicalBrixRange: [6.0, 8.0],
    expectedQualityTier: 'premium',
    dataSource: 'Ventura County Agriculture Report',
    dataYear: 2023,
    confidence: 'high',
    updatedAt: new Date('2024-01-15'),
  },
]

// =============================================================================
// TEXAS CITRUS DISTRIBUTIONS
// =============================================================================

/**
 * Texas citrus concentrated in Rio Grande Valley
 * Known for Ruby Red grapefruit
 */
export const TEXAS_CITRUS_DISTRIBUTIONS: RegionalCultivarDistribution[] = [
  {
    id: 'dist_rgv_ruby_red',
    regionId: 'rio_grande_valley_tx',
    regionName: 'Rio Grande Valley, TX',
    categoryId: 'citrus',
    varietyId: 'grapefruit',
    cultivarId: 'ruby_red',
    marketSharePct: 50,
    acreage: 8000,
    harvestWindow: {
      typicalStart: 'Oct',
      typicalEnd: 'May',
      peakStart: 'Nov',
      peakEnd: 'Mar',
    },
    typicalBrixRange: [10.0, 12.5],
    expectedQualityTier: 'premium',
    dataSource: 'Texas Citrus Mutual, Texas A&M AgriLife',
    dataYear: 2023,
    confidence: 'high',
    notes: 'Ruby Red originated in Texas, premium quality',
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'dist_rgv_rio_red',
    regionId: 'rio_grande_valley_tx',
    regionName: 'Rio Grande Valley, TX',
    categoryId: 'citrus',
    varietyId: 'grapefruit',
    cultivarId: 'rio_red',
    marketSharePct: 25,
    acreage: 4000,
    harvestWindow: {
      typicalStart: 'Oct',
      typicalEnd: 'May',
      peakStart: 'Dec',
      peakEnd: 'Mar',
    },
    typicalBrixRange: [11.0, 13.0],
    expectedQualityTier: 'premium',
    dataSource: 'Texas Citrus Mutual',
    dataYear: 2023,
    confidence: 'high',
    notes: 'Deeper red than Ruby Red, Texas development',
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'dist_rgv_marrs',
    regionId: 'rio_grande_valley_tx',
    regionName: 'Rio Grande Valley, TX',
    categoryId: 'citrus',
    varietyId: 'orange',
    cultivarId: 'marrs',
    marketSharePct: 15,
    acreage: 2400,
    harvestWindow: {
      typicalStart: 'Sep',
      typicalEnd: 'Nov',
      peakStart: 'Oct',
      peakEnd: 'Oct',
    },
    typicalBrixRange: [9.0, 11.0],
    expectedQualityTier: 'standard',
    dataSource: 'Texas Citrus Mutual',
    dataYear: 2023,
    confidence: 'medium',
    notes: 'Early season orange, not as sweet',
    updatedAt: new Date('2024-01-15'),
  },
]

// =============================================================================
// ROOTSTOCK DISTRIBUTIONS
// =============================================================================

/**
 * Rootstock choices vary by region based on disease pressure,
 * soil conditions, and cold hardiness needs.
 */
export const FLORIDA_ROOTSTOCK_DISTRIBUTIONS: RegionalRootstockDistribution[] = [
  // ---------------------------------------------------------------------------
  // INDIAN RIVER
  // ---------------------------------------------------------------------------
  {
    id: 'rs_ir_sour_orange',
    regionId: 'indian_river_fl',
    regionName: 'Indian River District, FL',
    rootstockId: 'sour_orange',
    rootstockName: 'Sour Orange',
    marketSharePct: 10, // Declining due to CTV
    primaryReason: 'quality',
    secondaryReasons: ['soil_adaptation', 'tradition'],
    brixModifier: 0.5,
    dataSource: 'UF/IFAS Citrus Extension',
    dataYear: 2023,
    confidence: 'high',
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'rs_ir_carrizo',
    regionId: 'indian_river_fl',
    regionName: 'Indian River District, FL',
    rootstockId: 'carrizo',
    rootstockName: 'Carrizo Citrange',
    marketSharePct: 45,
    primaryReason: 'disease_resistance',
    secondaryReasons: ['quality', 'yield'],
    brixModifier: 0.6,
    dataSource: 'UF/IFAS Citrus Extension',
    dataYear: 2023,
    confidence: 'high',
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'rs_ir_swingle',
    regionId: 'indian_river_fl',
    regionName: 'Indian River District, FL',
    rootstockId: 'swingle',
    rootstockName: 'Swingle Citrumelo',
    marketSharePct: 30,
    primaryReason: 'disease_resistance',
    secondaryReasons: ['cold_hardiness'],
    brixModifier: -0.5,
    dataSource: 'UF/IFAS Citrus Extension',
    dataYear: 2023,
    confidence: 'high',
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'rs_ir_uf_rootstocks',
    regionId: 'indian_river_fl',
    regionName: 'Indian River District, FL',
    rootstockId: 'uf_rootstocks',
    rootstockName: 'UF New Rootstocks (US-802, US-897, etc.)',
    marketSharePct: 15,
    primaryReason: 'disease_resistance',
    secondaryReasons: ['yield'],
    brixModifier: 0.0, // Varies, conservative estimate
    dataSource: 'UF/IFAS Citrus Extension',
    dataYear: 2023,
    confidence: 'medium',
    updatedAt: new Date('2024-01-15'),
  },

  // ---------------------------------------------------------------------------
  // CENTRAL RIDGE
  // ---------------------------------------------------------------------------
  {
    id: 'rs_ridge_carrizo',
    regionId: 'florida_ridge',
    regionName: 'Florida Ridge (Central)',
    rootstockId: 'carrizo',
    rootstockName: 'Carrizo Citrange',
    marketSharePct: 40,
    primaryReason: 'disease_resistance',
    secondaryReasons: ['quality'],
    brixModifier: 0.6,
    dataSource: 'UF/IFAS Citrus Extension',
    dataYear: 2023,
    confidence: 'high',
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'rs_ridge_swingle',
    regionId: 'florida_ridge',
    regionName: 'Florida Ridge (Central)',
    rootstockId: 'swingle',
    rootstockName: 'Swingle Citrumelo',
    marketSharePct: 35,
    primaryReason: 'disease_resistance',
    secondaryReasons: ['soil_adaptation'],
    brixModifier: -0.5,
    dataSource: 'UF/IFAS Citrus Extension',
    dataYear: 2023,
    confidence: 'high',
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'rs_ridge_rough_lemon',
    regionId: 'florida_ridge',
    regionName: 'Florida Ridge (Central)',
    rootstockId: 'rough_lemon',
    rootstockName: 'Rough Lemon',
    marketSharePct: 15,
    primaryReason: 'yield',
    brixModifier: -0.7,
    dataSource: 'UF/IFAS Citrus Extension',
    dataYear: 2023,
    confidence: 'high',
    updatedAt: new Date('2024-01-15'),
  },
]

export const CALIFORNIA_ROOTSTOCK_DISTRIBUTIONS: RegionalRootstockDistribution[] =
  [
    {
      id: 'rs_cv_carrizo',
      regionId: 'california_central_valley',
      regionName: 'California Central Valley',
      rootstockId: 'carrizo',
      rootstockName: 'Carrizo Citrange',
      marketSharePct: 50,
      primaryReason: 'quality',
      secondaryReasons: ['disease_resistance'],
      brixModifier: 0.6,
      dataSource: 'UC Davis Citrus Program',
      dataYear: 2023,
      confidence: 'high',
      updatedAt: new Date('2024-01-15'),
    },
    {
      id: 'rs_cv_c35',
      regionId: 'california_central_valley',
      regionName: 'California Central Valley',
      rootstockId: 'c35',
      rootstockName: 'C-35 Citrange',
      marketSharePct: 25,
      primaryReason: 'quality',
      secondaryReasons: ['cold_hardiness'],
      brixModifier: 0.6,
      dataSource: 'UC Davis Citrus Program',
      dataYear: 2023,
      confidence: 'high',
      updatedAt: new Date('2024-01-15'),
    },
    {
      id: 'rs_cv_trifoliate',
      regionId: 'california_central_valley',
      regionName: 'California Central Valley',
      rootstockId: 'trifoliate',
      rootstockName: 'Trifoliate Orange',
      marketSharePct: 15,
      primaryReason: 'cold_hardiness',
      secondaryReasons: ['quality'],
      brixModifier: 0.5,
      dataSource: 'UC Davis Citrus Program',
      dataYear: 2023,
      confidence: 'medium',
      updatedAt: new Date('2024-01-15'),
    },
    {
      id: 'rs_cv_macrophylla',
      regionId: 'california_central_valley',
      regionName: 'California Central Valley',
      rootstockId: 'macrophylla',
      rootstockName: 'Alemow/Macrophylla',
      marketSharePct: 10,
      primaryReason: 'yield',
      brixModifier: -0.8,
      dataSource: 'UC Davis Citrus Program',
      dataYear: 2023,
      confidence: 'medium',
      updatedAt: new Date('2024-01-15'),
    },
  ]

// =============================================================================
// ALL DISTRIBUTIONS (combined for easy lookup)
// =============================================================================

export const ALL_CULTIVAR_DISTRIBUTIONS: RegionalCultivarDistribution[] = [
  ...FLORIDA_CITRUS_DISTRIBUTIONS,
  ...CALIFORNIA_CITRUS_DISTRIBUTIONS,
  ...TEXAS_CITRUS_DISTRIBUTIONS,
]

export const ALL_ROOTSTOCK_DISTRIBUTIONS: RegionalRootstockDistribution[] = [
  ...FLORIDA_ROOTSTOCK_DISTRIBUTIONS,
  ...CALIFORNIA_ROOTSTOCK_DISTRIBUTIONS,
]

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get all cultivar distributions for a region
 */
export function getCultivarDistributionsForRegion(
  regionId: string
): RegionalCultivarDistribution[] {
  return ALL_CULTIVAR_DISTRIBUTIONS.filter((d) => d.regionId === regionId)
}

/**
 * Get all rootstock distributions for a region
 */
export function getRootstockDistributionsForRegion(
  regionId: string
): RegionalRootstockDistribution[] {
  return ALL_ROOTSTOCK_DISTRIBUTIONS.filter((d) => d.regionId === regionId)
}

/**
 * Get cultivar distributions for a specific category in a region
 */
export function getCultivarDistributionsForCategoryInRegion(
  regionId: string,
  categoryId: string
): RegionalCultivarDistribution[] {
  return ALL_CULTIVAR_DISTRIBUTIONS.filter(
    (d) => d.regionId === regionId && d.categoryId === categoryId
  )
}

/**
 * Calculate weighted average Brix for a region based on cultivar distributions
 * Used for inference when specific cultivar is unknown
 */
export function calculateWeightedAverageBrix(
  regionId: string,
  categoryId: string
): number | undefined {
  const distributions = getCultivarDistributionsForCategoryInRegion(
    regionId,
    categoryId
  )

  if (distributions.length === 0) return undefined

  let weightedSum = 0
  let totalWeight = 0

  for (const dist of distributions) {
    const midBrix = (dist.typicalBrixRange[0] + dist.typicalBrixRange[1]) / 2
    weightedSum += midBrix * dist.marketSharePct
    totalWeight += dist.marketSharePct
  }

  return totalWeight > 0 ? weightedSum / totalWeight : undefined
}

/**
 * Calculate weighted average rootstock Brix modifier for a region
 */
export function calculateWeightedRootstockModifier(
  regionId: string
): number | undefined {
  const distributions = getRootstockDistributionsForRegion(regionId)

  if (distributions.length === 0) return undefined

  let weightedSum = 0
  let totalWeight = 0

  for (const dist of distributions) {
    weightedSum += dist.brixModifier * dist.marketSharePct
    totalWeight += dist.marketSharePct
  }

  return totalWeight > 0 ? weightedSum / totalWeight : undefined
}

/**
 * Get the dominant quality tier for a region
 */
export function getDominantQualityTier(
  regionId: string,
  categoryId: string
): 'artisan' | 'premium' | 'standard' | 'commodity' | undefined {
  const distributions = getCultivarDistributionsForCategoryInRegion(
    regionId,
    categoryId
  )

  if (distributions.length === 0) return undefined

  const tierCounts = {
    artisan: 0,
    premium: 0,
    standard: 0,
    commodity: 0,
  }

  for (const dist of distributions) {
    tierCounts[dist.expectedQualityTier] += dist.marketSharePct
  }

  // Return the tier with highest weighted market share
  const entries = Object.entries(tierCounts) as [
    keyof typeof tierCounts,
    number,
  ][]
  return entries.sort((a, b) => b[1] - a[1])[0][0]
}

/**
 * Get harvest window for a region (earliest start to latest end)
 */
export function getRegionalHarvestWindow(
  regionId: string,
  categoryId: string
): { start: string; end: string; peakMonths: string[] } | undefined {
  const distributions = getCultivarDistributionsForCategoryInRegion(
    regionId,
    categoryId
  )

  if (distributions.length === 0) return undefined

  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]

  // Find earliest start and latest end
  let earliestStartIdx = 11
  let latestEndIdx = 0

  const peakMonthCounts: Record<string, number> = {}

  for (const dist of distributions) {
    const startIdx = months.indexOf(dist.harvestWindow.typicalStart)
    const endIdx = months.indexOf(dist.harvestWindow.typicalEnd)

    if (startIdx !== -1 && startIdx < earliestStartIdx) {
      earliestStartIdx = startIdx
    }
    if (endIdx !== -1 && endIdx > latestEndIdx) {
      latestEndIdx = endIdx
    }

    // Track peak months weighted by market share
    if (dist.harvestWindow.peakStart && dist.harvestWindow.peakEnd) {
      const peakStartIdx = months.indexOf(dist.harvestWindow.peakStart)
      const peakEndIdx = months.indexOf(dist.harvestWindow.peakEnd)
      for (let i = peakStartIdx; i <= peakEndIdx; i++) {
        peakMonthCounts[months[i]] =
          (peakMonthCounts[months[i]] || 0) + dist.marketSharePct
      }
    }
  }

  // Get top peak months
  const sortedPeakMonths = Object.entries(peakMonthCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([month]) => month)

  return {
    start: months[earliestStartIdx],
    end: months[latestEndIdx],
    peakMonths: sortedPeakMonths,
  }
}

/**
 * Build complete regional quality profile for inference
 */
export function buildRegionalQualityProfile(
  regionId: string,
  categoryId: string
): RegionalQualityProfile | undefined {
  const cultivarDist = getCultivarDistributionsForCategoryInRegion(
    regionId,
    categoryId
  )
  const rootstockDist = getRootstockDistributionsForRegion(regionId)

  if (cultivarDist.length === 0) return undefined

  const weightedBrix = calculateWeightedAverageBrix(regionId, categoryId)
  const dominantTier = getDominantQualityTier(regionId, categoryId)
  const harvestWindow = getRegionalHarvestWindow(regionId, categoryId)

  if (!weightedBrix || !dominantTier || !harvestWindow) return undefined

  return {
    regionId,
    regionName: cultivarDist[0].regionName,
    categoryId,
    cultivarDistributions: cultivarDist,
    rootstockDistributions: rootstockDist,
    weightedAverageBrix: weightedBrix,
    dominantQualityTier: dominantTier,
    overallHarvestWindow: harvestWindow,
  }
}

/**
 * Infer expected quality when only region is known
 * This is the key inference function for the data architecture
 */
export function inferQualityFromRegion(
  regionId: string,
  categoryId: string,
  varietyId?: string
): {
  expectedBrixRange: [number, number]
  expectedQualityTier: 'artisan' | 'premium' | 'standard' | 'commodity'
  rootstockModifier: number
  confidence: 'high' | 'medium' | 'low'
  reasoning: string
} | undefined {
  let distributions = getCultivarDistributionsForCategoryInRegion(
    regionId,
    categoryId
  )

  // Filter by variety if provided
  if (varietyId) {
    const varietyFiltered = distributions.filter(
      (d) => d.varietyId === varietyId
    )
    if (varietyFiltered.length > 0) {
      distributions = varietyFiltered
    }
  }

  if (distributions.length === 0) return undefined

  // Calculate weighted averages
  let brixLow = 0
  let brixHigh = 0
  let totalWeight = 0

  for (const dist of distributions) {
    brixLow += dist.typicalBrixRange[0] * dist.marketSharePct
    brixHigh += dist.typicalBrixRange[1] * dist.marketSharePct
    totalWeight += dist.marketSharePct
  }

  brixLow = brixLow / totalWeight
  brixHigh = brixHigh / totalWeight

  const rootstockMod = calculateWeightedRootstockModifier(regionId) || 0
  const dominantTier =
    getDominantQualityTier(regionId, categoryId) || 'standard'

  // Confidence based on how much we know
  let confidence: 'high' | 'medium' | 'low' = 'medium'
  if (varietyId && distributions.length <= 2) {
    confidence = 'high' // Variety specified, narrow match
  } else if (distributions.length > 5) {
    confidence = 'low' // Many cultivars, wide variance
  }

  const reasoning = varietyId
    ? `Based on ${distributions.length} ${varietyId} cultivars grown in ${distributions[0].regionName}`
    : `Based on ${distributions.length} cultivars grown in ${distributions[0].regionName}`

  return {
    expectedBrixRange: [Math.round(brixLow * 10) / 10, Math.round(brixHigh * 10) / 10],
    expectedQualityTier: dominantTier,
    rootstockModifier: Math.round(rootstockMod * 100) / 100,
    confidence,
    reasoning,
  }
}
