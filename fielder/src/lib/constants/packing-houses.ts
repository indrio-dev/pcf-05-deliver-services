/**
 * =============================================================================
 * PACKING HOUSES (PRODUCE TRACEABILITY)
 * =============================================================================
 *
 * Packing houses are the critical link between farm/region and retail product.
 * The packinghouse code on a PLU sticker enables:
 *
 *   PLU Sticker → Packinghouse Code → Packinghouse → Region → S.H.A.R.E. inference
 *
 * TRACEABILITY CHAIN:
 *   1. Consumer scans PLU at store
 *   2. Sticker often includes packinghouse identifier
 *   3. Packinghouse → Known region (S pillar inference)
 *   4. Region → Typical cultivars, rootstocks (H pillar inference)
 *   5. Region + Season → Timing assessment (R pillar inference)
 *
 * DATA SOURCES:
 *   - USDA PACA (Perishable Agricultural Commodities Act) licensees
 *   - State agricultural marketing registrations
 *   - Industry directories (Citrus Administrative Committee, etc.)
 *
 * NOTE: Full packinghouse database is a significant data collection effort.
 * This file provides the data structure and sample entries for major houses.
 */

// =============================================================================
// TYPES
// =============================================================================

export type PackingHouseType =
  | 'grower_shipper' // Farm owns the packinghouse
  | 'independent' // Packs for multiple growers
  | 'cooperative' // Grower cooperative
  | 'processor' // Juice/concentrate (not fresh)
  | 'repack' // Repackages from other sources

export type CertificationType =
  | 'organic_usda'
  | 'organic_california'
  | 'gap' // Good Agricultural Practices
  | 'primus_gfs'
  | 'sqf' // Safe Quality Food
  | 'brc' // British Retail Consortium
  | 'global_gap'
  | 'fair_trade'
  | 'non_gmo_project'

export interface PackingHouse {
  id: string
  name: string
  code: string // Packinghouse code (varies by industry)
  alternativeCodes?: string[] // Other codes that map here

  // Location
  regionId: string // Links to growing-regions.ts
  regionName: string
  address?: {
    street?: string
    city: string
    state: string
    zip?: string
    country: string
  }
  coordinates?: {
    lat: number
    lng: number
  }

  // Type and scale
  type: PackingHouseType
  annualVolume?: number // Boxes or tons
  volumeUnit?: 'boxes' | 'tons' | 'cartons'

  // What they pack
  primaryCategories: string[] // 'citrus', 'stone_fruit', etc.
  primaryProducts: string[] // More specific: 'navel', 'grapefruit', etc.

  // Quality indicators
  certifications: CertificationType[]
  organicCapable: boolean
  hasOnSiteColdStorage: boolean
  qualityLabOnSite?: boolean

  // Sourcing (WHERE does their fruit come from)
  sourcingRegions: string[] // May source from multiple regions
  sourcingNotes?: string

  // Brand relationships
  houseBrands?: string[] // Brands they own/pack
  customerBrands?: string[] // Known retail customers

  // SHARE inference data
  typicalCultivarsHandled: string[] // Cultivar IDs
  typicalQualityTier: 'artisan' | 'premium' | 'standard' | 'commodity'

  // Data quality
  dataSource: string
  lastVerified?: Date
  confidence: 'high' | 'medium' | 'low'

  // Status
  isActive: boolean
  notes?: string
}

/**
 * Packinghouse lookup result for inference
 */
export interface PackingHouseLookup {
  packingHouse: PackingHouse
  inferredRegionId: string
  inferredSoilProfile?: string // From growing-regions.ts
  inferredQualityTier: 'artisan' | 'premium' | 'standard' | 'commodity'
  confidence: 'high' | 'medium' | 'low'
}

// =============================================================================
// FLORIDA CITRUS PACKING HOUSES
// =============================================================================

/**
 * Major Florida citrus packinghouses
 * Note: Post-Hurricane Ian (2022), many operations consolidated
 */
export const FLORIDA_PACKING_HOUSES: PackingHouse[] = [
  // ---------------------------------------------------------------------------
  // INDIAN RIVER DISTRICT (Premium fresh fruit)
  // ---------------------------------------------------------------------------
  {
    id: 'ph_indian_river_select',
    name: 'Indian River Select',
    code: 'IR001',
    alternativeCodes: ['IRS'],
    regionId: 'indian_river_fl',
    regionName: 'Indian River District, FL',
    address: {
      city: 'Vero Beach',
      state: 'FL',
      country: 'USA',
    },
    type: 'grower_shipper',
    primaryCategories: ['citrus'],
    primaryProducts: ['grapefruit', 'navel', 'tangerine'],
    certifications: ['gap', 'primus_gfs'],
    organicCapable: true,
    hasOnSiteColdStorage: true,
    qualityLabOnSite: true,
    sourcingRegions: ['indian_river_fl'],
    houseBrands: ['Indian River Select'],
    typicalCultivarsHandled: [
      'ruby_red',
      'marsh_white',
      'washington_navel',
      'murcott',
    ],
    typicalQualityTier: 'premium',
    dataSource: 'Florida Citrus Packers',
    confidence: 'high',
    isActive: true,
    notes: 'Premium Indian River operation, focus on gift fruit',
  },
  {
    id: 'ph_hale_groves',
    name: 'Hale Groves Packing',
    code: 'HG001',
    alternativeCodes: ['HALE'],
    regionId: 'indian_river_fl',
    regionName: 'Indian River District, FL',
    address: {
      city: 'Vero Beach',
      state: 'FL',
      country: 'USA',
    },
    type: 'grower_shipper',
    primaryCategories: ['citrus'],
    primaryProducts: ['grapefruit', 'navel', 'tangerine', 'honeybells'],
    certifications: ['gap'],
    organicCapable: false,
    hasOnSiteColdStorage: true,
    sourcingRegions: ['indian_river_fl', 'florida_ridge'],
    houseBrands: ['Hale Groves', 'Cushman'],
    typicalCultivarsHandled: [
      'ruby_red',
      'washington_navel',
      'minneola',
      'murcott',
    ],
    typicalQualityTier: 'premium',
    dataSource: 'Indrio Brands internal',
    confidence: 'high',
    isActive: true,
    notes: 'Indrio Brands company - premium D2C gift fruit',
  },
  {
    id: 'ph_florida_classic',
    name: 'Florida Classic Growers',
    code: 'FCG',
    regionId: 'indian_river_fl',
    regionName: 'Indian River District, FL',
    address: {
      city: 'Fort Pierce',
      state: 'FL',
      country: 'USA',
    },
    type: 'cooperative',
    primaryCategories: ['citrus'],
    primaryProducts: ['grapefruit', 'navel'],
    certifications: ['gap', 'primus_gfs', 'organic_usda'],
    organicCapable: true,
    hasOnSiteColdStorage: true,
    sourcingRegions: ['indian_river_fl'],
    typicalCultivarsHandled: ['ruby_red', 'flame', 'washington_navel'],
    typicalQualityTier: 'premium',
    dataSource: 'Florida Citrus Packers',
    confidence: 'medium',
    isActive: true,
  },

  // ---------------------------------------------------------------------------
  // CENTRAL RIDGE (Mixed fresh/juice)
  // ---------------------------------------------------------------------------
  {
    id: 'ph_dundee_citrus',
    name: 'Dundee Citrus Growers',
    code: 'DCG',
    regionId: 'florida_ridge',
    regionName: 'Florida Ridge (Central)',
    address: {
      city: 'Dundee',
      state: 'FL',
      country: 'USA',
    },
    type: 'cooperative',
    primaryCategories: ['citrus'],
    primaryProducts: ['navel', 'valencia', 'grapefruit'],
    certifications: ['gap'],
    organicCapable: false,
    hasOnSiteColdStorage: true,
    sourcingRegions: ['florida_ridge'],
    typicalCultivarsHandled: [
      'washington_navel',
      'hamlin',
      'valencia_late',
      'ruby_red',
    ],
    typicalQualityTier: 'standard',
    dataSource: 'Florida Citrus Packers',
    confidence: 'medium',
    isActive: true,
    notes: 'Ridge cooperative, mix of fresh and juice grades',
  },
  {
    id: 'ph_peace_river',
    name: 'Peace River Citrus Products',
    code: 'PRC',
    regionId: 'florida_ridge',
    regionName: 'Florida Ridge (Central)',
    address: {
      city: 'Arcadia',
      state: 'FL',
      country: 'USA',
    },
    type: 'processor',
    primaryCategories: ['citrus'],
    primaryProducts: ['orange_juice', 'grapefruit_juice'],
    certifications: ['sqf', 'organic_usda'],
    organicCapable: true,
    hasOnSiteColdStorage: true,
    qualityLabOnSite: true,
    sourcingRegions: ['florida_ridge', 'florida_flatwoods'],
    typicalCultivarsHandled: ['hamlin', 'valencia_late'],
    typicalQualityTier: 'commodity',
    dataSource: 'Florida Department of Citrus',
    confidence: 'high',
    isActive: true,
    notes: 'Juice processor - not fresh market (for reference)',
  },

  // ---------------------------------------------------------------------------
  // SOUTHWEST FLORIDA (Volume fresh)
  // ---------------------------------------------------------------------------
  {
    id: 'ph_immokalee',
    name: 'Immokalee Citrus',
    code: 'IMM',
    regionId: 'florida_flatwoods',
    regionName: 'SW Florida Flatwoods',
    address: {
      city: 'Immokalee',
      state: 'FL',
      country: 'USA',
    },
    type: 'independent',
    primaryCategories: ['citrus'],
    primaryProducts: ['navel', 'valencia', 'grapefruit'],
    certifications: ['gap'],
    organicCapable: false,
    hasOnSiteColdStorage: true,
    sourcingRegions: ['florida_flatwoods'],
    typicalCultivarsHandled: ['hamlin', 'washington_navel', 'valencia_late'],
    typicalQualityTier: 'commodity',
    dataSource: 'Florida Citrus Packers',
    confidence: 'medium',
    isActive: true,
    notes: 'Volume packer, multiple grower sources',
  },
]

// =============================================================================
// CALIFORNIA CITRUS PACKING HOUSES
// =============================================================================

export const CALIFORNIA_PACKING_HOUSES: PackingHouse[] = [
  // ---------------------------------------------------------------------------
  // CENTRAL VALLEY
  // ---------------------------------------------------------------------------
  {
    id: 'ph_sunkist_lindsay',
    name: 'Sunkist Growers (Lindsay)',
    code: 'SKL',
    alternativeCodes: ['SUNKIST'],
    regionId: 'california_central_valley',
    regionName: 'California Central Valley',
    address: {
      city: 'Lindsay',
      state: 'CA',
      country: 'USA',
    },
    type: 'cooperative',
    annualVolume: 5000000,
    volumeUnit: 'cartons',
    primaryCategories: ['citrus'],
    primaryProducts: ['navel', 'valencia', 'lemon', 'grapefruit'],
    certifications: ['gap', 'primus_gfs', 'sqf', 'organic_usda'],
    organicCapable: true,
    hasOnSiteColdStorage: true,
    qualityLabOnSite: true,
    sourcingRegions: [
      'california_central_valley',
      'ventura_county_ca',
      'riverside_county_ca',
    ],
    houseBrands: ['Sunkist'],
    customerBrands: ['Multiple retail'],
    typicalCultivarsHandled: [
      'washington_navel',
      'cara_cara',
      'lane_late',
      'valencia_late',
      'eureka',
    ],
    typicalQualityTier: 'premium',
    dataSource: 'California Citrus Mutual',
    confidence: 'high',
    isActive: true,
    notes: 'Major cooperative, premium brand recognition',
  },
  {
    id: 'ph_wonderful_citrus',
    name: 'Wonderful Citrus',
    code: 'WON',
    alternativeCodes: ['WONDERFUL', 'PARAMOUNT'],
    regionId: 'california_central_valley',
    regionName: 'California Central Valley',
    address: {
      city: 'Delano',
      state: 'CA',
      country: 'USA',
    },
    type: 'grower_shipper',
    primaryCategories: ['citrus'],
    primaryProducts: ['navel', 'mandarin', 'lemon', 'grapefruit'],
    certifications: ['gap', 'primus_gfs', 'sqf'],
    organicCapable: true,
    hasOnSiteColdStorage: true,
    qualityLabOnSite: true,
    sourcingRegions: [
      'california_central_valley',
      'texas_rio_grande',
      'mexico_sonora',
    ],
    houseBrands: ['Wonderful Halos', 'Wonderful Seedless Lemons'],
    typicalCultivarsHandled: [
      'washington_navel',
      'clemenules',
      'tango',
      'eureka',
    ],
    typicalQualityTier: 'standard',
    dataSource: 'California Citrus Mutual',
    confidence: 'high',
    isActive: true,
    notes: 'Large vertically integrated operation',
  },
  {
    id: 'ph_bee_sweet',
    name: 'Bee Sweet Citrus',
    code: 'BSC',
    regionId: 'california_central_valley',
    regionName: 'California Central Valley',
    address: {
      city: 'Fowler',
      state: 'CA',
      country: 'USA',
    },
    type: 'grower_shipper',
    primaryCategories: ['citrus'],
    primaryProducts: ['navel', 'mandarin', 'valencia'],
    certifications: ['gap', 'primus_gfs', 'organic_usda'],
    organicCapable: true,
    hasOnSiteColdStorage: true,
    sourcingRegions: ['california_central_valley'],
    houseBrands: ['Bee Sweet'],
    typicalCultivarsHandled: [
      'washington_navel',
      'cara_cara',
      'clemenules',
      'valencia_late',
    ],
    typicalQualityTier: 'premium',
    dataSource: 'California Citrus Mutual',
    confidence: 'medium',
    isActive: true,
  },

  // ---------------------------------------------------------------------------
  // VENTURA / COASTAL
  // ---------------------------------------------------------------------------
  {
    id: 'ph_limoneira',
    name: 'Limoneira Company',
    code: 'LIM',
    alternativeCodes: ['LIMONEIRA'],
    regionId: 'ventura_county_ca',
    regionName: 'Ventura County, CA',
    address: {
      city: 'Santa Paula',
      state: 'CA',
      country: 'USA',
    },
    type: 'grower_shipper',
    primaryCategories: ['citrus'],
    primaryProducts: ['lemon', 'avocado'],
    certifications: ['gap', 'primus_gfs', 'sqf', 'organic_usda', 'non_gmo_project'],
    organicCapable: true,
    hasOnSiteColdStorage: true,
    qualityLabOnSite: true,
    sourcingRegions: ['ventura_county_ca', 'california_central_valley'],
    houseBrands: ['Limoneira', 'Nature\'s Partner'],
    typicalCultivarsHandled: ['eureka', 'lisbon', 'meyer'],
    typicalQualityTier: 'premium',
    dataSource: 'Company public filings',
    confidence: 'high',
    isActive: true,
    notes: 'Historic California lemon producer, premium focus',
  },
]

// =============================================================================
// TEXAS CITRUS PACKING HOUSES
// =============================================================================

export const TEXAS_PACKING_HOUSES: PackingHouse[] = [
  {
    id: 'ph_pittman_davis',
    name: 'Pittman & Davis',
    code: 'PD001',
    alternativeCodes: ['P&D', 'PITTMAN'],
    regionId: 'rio_grande_valley_tx',
    regionName: 'Rio Grande Valley, TX',
    address: {
      city: 'Harlingen',
      state: 'TX',
      country: 'USA',
    },
    type: 'grower_shipper',
    primaryCategories: ['citrus'],
    primaryProducts: ['grapefruit', 'orange', 'smoked_meats'],
    certifications: ['gap'],
    organicCapable: false,
    hasOnSiteColdStorage: true,
    sourcingRegions: ['rio_grande_valley_tx'],
    houseBrands: ['Pittman & Davis'],
    typicalCultivarsHandled: ['ruby_red', 'rio_red', 'marrs', 'washington_navel'],
    typicalQualityTier: 'premium',
    dataSource: 'Indrio Brands internal',
    confidence: 'high',
    isActive: true,
    notes: 'Indrio Brands company - Texas Ruby Red specialist, D2C gift',
  },
  {
    id: 'ph_texas_citrus_exchange',
    name: 'Texas Citrus Exchange',
    code: 'TCE',
    regionId: 'rio_grande_valley_tx',
    regionName: 'Rio Grande Valley, TX',
    address: {
      city: 'Mission',
      state: 'TX',
      country: 'USA',
    },
    type: 'cooperative',
    primaryCategories: ['citrus'],
    primaryProducts: ['grapefruit', 'orange'],
    certifications: ['gap', 'primus_gfs'],
    organicCapable: true,
    hasOnSiteColdStorage: true,
    sourcingRegions: ['rio_grande_valley_tx'],
    typicalCultivarsHandled: ['ruby_red', 'rio_red', 'marrs'],
    typicalQualityTier: 'premium',
    dataSource: 'Texas Citrus Mutual',
    confidence: 'medium',
    isActive: true,
  },
]

// =============================================================================
// ALL PACKING HOUSES (combined)
// =============================================================================

export const ALL_PACKING_HOUSES: PackingHouse[] = [
  ...FLORIDA_PACKING_HOUSES,
  ...CALIFORNIA_PACKING_HOUSES,
  ...TEXAS_PACKING_HOUSES,
]

// =============================================================================
// LOOKUP HELPERS
// =============================================================================

/**
 * Find packinghouse by code
 */
export function findPackingHouseByCode(code: string): PackingHouse | undefined {
  const normalizedCode = code.toUpperCase().trim()

  return ALL_PACKING_HOUSES.find(
    (ph) =>
      ph.code.toUpperCase() === normalizedCode ||
      ph.alternativeCodes?.some((alt) => alt.toUpperCase() === normalizedCode)
  )
}

/**
 * Find packinghouses by region
 */
export function findPackingHousesByRegion(regionId: string): PackingHouse[] {
  return ALL_PACKING_HOUSES.filter((ph) => ph.regionId === regionId)
}

/**
 * Find packinghouses by product type
 */
export function findPackingHousesByProduct(productId: string): PackingHouse[] {
  return ALL_PACKING_HOUSES.filter((ph) =>
    ph.primaryProducts.some(
      (p) => p.toLowerCase() === productId.toLowerCase()
    )
  )
}

/**
 * Find packinghouses with specific certification
 */
export function findPackingHousesWithCertification(
  cert: CertificationType
): PackingHouse[] {
  return ALL_PACKING_HOUSES.filter((ph) => ph.certifications.includes(cert))
}

/**
 * Primary inference function: packinghouse code → regional quality inference
 * This is the key function for the traceability chain
 */
export function inferFromPackingHouseCode(code: string): PackingHouseLookup | undefined {
  const packingHouse = findPackingHouseByCode(code)
  if (!packingHouse) return undefined

  return {
    packingHouse,
    inferredRegionId: packingHouse.regionId,
    inferredQualityTier: packingHouse.typicalQualityTier,
    confidence: packingHouse.confidence,
  }
}

/**
 * Get all active packinghouses
 */
export function getActivePackingHouses(): PackingHouse[] {
  return ALL_PACKING_HOUSES.filter((ph) => ph.isActive)
}

/**
 * Get packinghouses capable of organic
 */
export function getOrganicCapablePackingHouses(): PackingHouse[] {
  return ALL_PACKING_HOUSES.filter((ph) => ph.organicCapable && ph.isActive)
}

/**
 * Search packinghouses by name (fuzzy)
 */
export function searchPackingHousesByName(query: string): PackingHouse[] {
  const normalizedQuery = query.toLowerCase().trim()

  return ALL_PACKING_HOUSES.filter((ph) =>
    ph.name.toLowerCase().includes(normalizedQuery)
  )
}

// =============================================================================
// PLU CODE PARSING (Future expansion)
// =============================================================================

/**
 * Structure for parsed PLU information
 * PLU codes can contain packinghouse info in various formats
 */
export interface ParsedPLUInfo {
  pluCode: string // The full PLU (e.g., "94011")
  isOrganic: boolean // Prefix 9 = organic
  baseCode: string // Code without prefix (e.g., "4011")
  commodity?: string // What the PLU represents (e.g., "banana")
  packingHouseCode?: string // Extracted packinghouse code if present
  countryOfOrigin?: string // If identifiable
  confidence: 'high' | 'medium' | 'low'
}

/**
 * Parse a PLU code for basic info
 * Note: Full PLU parsing requires PLU database (future work)
 */
export function parsePLUCode(pluCode: string): ParsedPLUInfo {
  const normalized = pluCode.trim()
  const isOrganic = normalized.startsWith('9')
  const baseCode = isOrganic ? normalized.slice(1) : normalized

  return {
    pluCode: normalized,
    isOrganic,
    baseCode,
    // commodity lookup would go here with full PLU database
    confidence: 'low', // Low until we have full PLU database
  }
}

/**
 * Common PLU codes for reference (not exhaustive)
 * Note: This is a tiny subset - full PLU database is thousands of codes
 */
export const COMMON_PLU_CODES: Record<
  string,
  { commodity: string; category: string }
> = {
  '4011': { commodity: 'Banana', category: 'tropical' },
  '4012': { commodity: 'Orange Navel Small', category: 'citrus' },
  '4013': { commodity: 'Orange Navel Large', category: 'citrus' },
  '4381': { commodity: 'Grapefruit Ruby Red', category: 'citrus' },
  '4046': { commodity: 'Avocado Hass Small', category: 'tropical' },
  '4225': { commodity: 'Avocado Hass Large', category: 'tropical' },
  '4015': { commodity: 'Apple Red Delicious', category: 'pome_fruit' },
  '4016': { commodity: 'Apple Granny Smith', category: 'pome_fruit' },
  '4017': { commodity: 'Apple Gala', category: 'pome_fruit' },
  '4020': { commodity: 'Apple Golden Delicious', category: 'pome_fruit' },
  '4131': { commodity: 'Apple Fuji', category: 'pome_fruit' },
  '4132': { commodity: 'Apple Honeycrisp', category: 'pome_fruit' },
  '3283': { commodity: 'Honeybells', category: 'citrus' },
  '3108': { commodity: 'Minneola Tangelo', category: 'citrus' },
  '4453': { commodity: 'Cara Cara Orange', category: 'citrus' },
}
