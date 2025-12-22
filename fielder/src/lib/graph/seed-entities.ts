/**
 * Supply Chain Entity Seed Data
 *
 * Seeds the knowledge graph with multi-role supply chain entities.
 * An entity can have multiple roles: Grower, Packinghouse, Retailer.
 *
 * Supply Chain Flow:
 *   Grower → Packer → Distributor → Retailer → Consumer
 *
 * THE KNOWLEDGE GAP:
 *   Consumers struggle to understand farm-level quality because there are
 *   typically 3 intermediaries (packer, distributor, retailer) between them
 *   and the grower. Only Growers and Packers truly understand what's
 *   happening at the farm level - cultivars, soil health, practices, timing.
 *
 *   Distributors aggregate from multiple packers and lose specificity.
 *   Retailers see brands and PLUs, not farm details.
 *   Consumers just see price and label claims.
 *
 *   Fielder bridges this gap by capturing SHARE data at the Grower/Packer
 *   level and transmitting it to consumers.
 *
 * Supply Chain Roles (entities we model directly):
 *   - Grower: Grows/raises products. Has farm-level SHARE knowledge.
 *   - Packinghouse: Packs and handles B2B sales. Knows source farms.
 *   - Retailer: Sells to consumers (B2C).
 *
 *   Note: We don't model Distributors as entities - they're external
 *   aggregators (Sysco, US Foods, etc.) that buy from Packers. We track
 *   whether a Packer sells to_distributors vs to_retailers directly.
 *
 * Facility Types (for Packinghouse role):
 *   - wet_packinghouse: Full processing - wash, grade, wax, pack (traditional packer)
 *   - gift_repack: Assembling gift boxes for D2C shipment (sources from wet packinghouse)
 *   - retail_repack: Regrading and repackaging into grocery SKUs for B2B (sources from wet packinghouse)
 *   - processor: Value-added - juice, dried, chocolate-covered, etc.
 *
 * Note: A wet packinghouse may have its own repack operation (vertically integrated)
 * OR wholesale to a separate repack facility. For example, Hale Groves operates a
 * gift_repack facility that sources from traditional wet packinghouses.
 *
 * RESEARCH NEEDED: The lines blur between packer, repack facility, and distributor:
 *   - Wet packinghouse may do their own repack (vertically integrated)
 *   - Standalone repack facilities source from packers
 *   - Some distributors add repack services (less common)
 *   - Most distributors are pure logistics + sales/marketing (no repack)
 * Need to research where retail_repack typically lives in the supply chain.
 *
 * B2B Channels (for Packinghouse role) - Packers handle B2B sales:
 *   - to_distributors: Selling to aggregators (Sysco, US Foods, produce distributors)
 *   - to_retailers: Selling direct to retail chains (grocery is a subset of retail)
 *
 * Retail Channels (for Retailer role) - B2C, selling to end consumers:
 *   - d2c: Remote direct sales (e-commerce, catalog, call center)
 *   - specialty_retail: Own specialty retail store(s) - NOT grocery (e.g., Sun Harvest)
 *   - csa: Community Supported Agriculture (subscription shares)
 *   - farm_stand: On-farm retail stand
 *   - farmers_market: Sells at farmers markets
 *
 * Note: A CSA can source from multiple farms. The lead farm is both Grower + Retailer,
 * and may have SOURCES_FROM relationships to partner farms in the CSA.
 *
 * Note: An entity can have multiple channels. For example, Sun Harvest
 * has both d2c (e-commerce) and specialty_retail (physical stores).
 */

import { runWriteTransaction } from './neo4j'

// =============================================================================
// TYPES
// =============================================================================

type SupplyChainRole = 'grower' | 'packinghouse' | 'retailer'
type FacilityType =
  | 'wet_packinghouse'  // Full processing - wash, grade, wax, pack
  | 'gift_repack'       // Assembling gift boxes for D2C shipment
  | 'retail_repack'     // Regrading and repackaging into grocery SKUs for B2B
  | 'processor'         // Value-added - juice, dried, chocolate-covered, etc.

// B2B channels - Packers handle B2B sales as part of their function
// These describe WHO the packer sells to
type B2BChannel =
  | 'to_distributors'  // Selling to aggregators (Sysco, US Foods, produce distributors)
  | 'to_retailers'     // Selling direct to retail chains (grocery stores, etc.)

// Retail channels are B2C (selling to end consumers)
type RetailChannel =
  | 'd2c'              // E-commerce, catalog, call center (remote direct sales)
  | 'specialty_retail' // Own specialty retail store(s) - NOT grocery
  | 'csa'              // Community Supported Agriculture subscriptions
  | 'farm_stand'       // On-farm retail stand
  | 'farmers_market'   // Sells at farmers markets

type VerificationLevel = 'unverified' | 'website_verified' | 'field_verified' | 'lab_verified'

interface SupplyChainEntity {
  id: string
  name: string
  website?: string
  stateCode: string
  city?: string
  county?: string
  growingRegion?: string

  // Multi-role support
  roles: SupplyChainRole[]

  // Role-specific attributes
  facilityTypes?: FacilityType[]      // For packinghouse role
  b2bChannels?: B2BChannel[]          // For packinghouse role (B2B sales)
  retailChannels?: RetailChannel[]    // For retailer role (B2C sales)

  // What they grow (grower role) or sell (retailer role)
  products: string[]

  // Who they source from (if not a grower, or if grower + sources from others)
  sourcesFrom?: string[]              // Entity IDs

  certifications?: string[]
  features?: string[]

  // Extracted from notes/research
  foundedYear?: number
  acreage?: number
  scaleIndicators?: string[]
  yearsInBusiness?: number

  verificationLevel: VerificationLevel
  dataSource: string
}

// =============================================================================
// INDRIO FIELDS FAMILY OF BRANDS
// =============================================================================

const INDRIO_ENTITIES: SupplyChainEntity[] = [
  {
    id: 'hale_groves',
    name: 'Hale Groves',
    website: 'https://www.halegroves.com/',
    stateCode: 'FL',
    city: 'Vero Beach',
    county: 'Indian River',
    growingRegion: 'indian_river_fl',
    roles: ['grower', 'packinghouse', 'retailer'],
    facilityTypes: ['gift_repack'],  // Sources from wet packinghouses for gift box assembly
    retailChannels: ['d2c'],
    products: ['orange', 'grapefruit', 'tangerine', 'mango'],
    features: ['picked_to_order', 'no_storage', 'indian_river_citrus', 'sources_from_growers'],
    verificationLevel: 'field_verified',
    dataSource: 'internal'
  },
  {
    id: 'pittman_davis',
    name: 'Pittman & Davis',
    website: 'https://www.pittmandavis.com/',
    stateCode: 'TX',
    city: 'Harlingen',
    county: 'Cameron',
    growingRegion: 'rio_grande_tx',
    roles: ['grower', 'packinghouse', 'retailer'],
    facilityTypes: ['gift_repack'],  // Sources from wet packinghouses for gift box assembly
    retailChannels: ['d2c'],
    products: ['orange', 'grapefruit'],
    features: ['rio_red_grapefruit', 'texas_citrus', 'sources_from_growers'],
    verificationLevel: 'field_verified',
    dataSource: 'internal'
  },
  {
    id: 'sun_harvest',
    name: 'Sun Harvest',
    website: 'https://www.sunharvestcitrus.com/',
    stateCode: 'FL',
    city: 'Fort Myers',
    county: 'Lee',
    growingRegion: 'indian_river_fl',  // TODO: verify region
    roles: ['retailer'],  // D2C + specialty retail, sources from growers
    retailChannels: ['d2c', 'specialty_retail'],
    products: ['orange', 'grapefruit', 'tangerine'],
    features: ['sources_from_growers'],
    verificationLevel: 'field_verified',
    dataSource: 'internal'
  },
]

// =============================================================================
// FLORIDA ENTITIES
// =============================================================================

const FLORIDA_ENTITIES: SupplyChainEntity[] = [
  // INDIAN RIVER CITRUS - Grower + D2C
  {
    id: 'indian_river_fruit_company',
    name: 'Indian River Fruit Company',
    website: 'https://www.indianriverfruits.com/',
    stateCode: 'FL',
    city: 'Vero Beach',
    county: 'Indian River',
    growingRegion: 'indian_river_fl',
    roles: ['grower', 'retailer'],
    retailChannels: ['d2c'],
    products: ['orange', 'grapefruit', 'tangerine'],
    features: ['tree_ripened', 'shipped_within_24h', 'family_owned'],
    verificationLevel: 'website_verified',
    dataSource: 'florida-dtc-farms-research.md'
  },
  {
    id: 'peterson_groves',
    name: 'Peterson Groves',
    website: 'https://petersongroves.com/',
    stateCode: 'FL',
    growingRegion: 'indian_river_fl',
    roles: ['grower', 'retailer'],
    retailChannels: ['d2c'],
    products: ['orange', 'grapefruit', 'tangerine'],
    features: ['family_owned_1913', 'fruit_of_month_club'],
    verificationLevel: 'website_verified',
    dataSource: 'florida-dtc-farms-research.md'
  },
  {
    id: 'countryside_citrus',
    name: 'Countryside Citrus',
    website: 'https://www.countrysidecitrus.com/',
    stateCode: 'FL',
    growingRegion: 'indian_river_fl',
    roles: ['grower', 'retailer'],
    retailChannels: ['d2c'],
    products: ['orange', 'grapefruit', 'tangerine'],
    features: ['five_generations'],
    verificationLevel: 'website_verified',
    dataSource: 'florida-dtc-farms-research.md'
  },
  {
    id: 'schacht_groves',
    name: 'Schacht Groves',
    website: 'https://schachtgroves.com/',
    stateCode: 'FL',
    growingRegion: 'indian_river_fl',
    roles: ['grower', 'retailer'],
    retailChannels: ['d2c'],
    products: ['orange', 'grapefruit', 'tangerine'],
    features: ['family_owned_1950'],
    verificationLevel: 'website_verified',
    dataSource: 'florida-dtc-farms-research.md'
  },

  // SOUTH FLORIDA TROPICAL
  {
    id: 'miami_fruit',
    name: 'Miami Fruit',
    website: 'https://miamifruit.org/',
    stateCode: 'FL',
    city: 'Homestead',
    county: 'Miami-Dade',
    growingRegion: 'south_fl',
    roles: ['grower', 'retailer'],
    retailChannels: ['d2c'],
    products: ['mango', 'avocado'],
    features: ['year_round', 'ships_nationwide', 'tropical_specialist'],
    verificationLevel: 'website_verified',
    dataSource: 'florida-dtc-farms-research.md'
  },
  {
    id: 'robert_is_here',
    name: 'Robert Is Here',
    website: 'https://www.robertishere.com/',
    stateCode: 'FL',
    city: 'Homestead',
    county: 'Miami-Dade',
    growingRegion: 'south_fl',
    roles: ['grower', 'retailer'],
    retailChannels: ['d2c', 'farm_stand'],
    products: ['mango', 'avocado'],
    features: ['operating_since_1959', 'ships_nationwide', 'iconic_farm_stand'],
    verificationLevel: 'website_verified',
    dataSource: 'florida-dtc-farms-research.md'
  },
  {
    id: 'tropical_acres_farms',
    name: 'Tropical Acres Farms',
    website: 'https://www.tropicalacresfarms.com/',
    stateCode: 'FL',
    city: 'West Palm Beach',
    county: 'Palm Beach',
    growingRegion: 'south_fl',
    roles: ['grower', 'retailer'],
    retailChannels: ['d2c'],
    products: ['mango', 'avocado'],
    features: ['300_mango_varieties', '40_avocado_varieties'],
    verificationLevel: 'website_verified',
    dataSource: 'florida-dtc-farms-research.md'
  },
  {
    id: 'bee_heaven_farm',
    name: 'Bee Heaven Farm',
    website: 'https://beeheavenfarm.com/',
    stateCode: 'FL',
    city: 'Homestead',
    county: 'Miami-Dade',
    growingRegion: 'south_fl',
    roles: ['grower', 'retailer'],
    retailChannels: ['d2c', 'farmers_market'],
    products: ['avocado'],
    certifications: ['usda_organic'],
    verificationLevel: 'website_verified',
    dataSource: 'florida-dtc-farms-research.md'
  },

  // CENTRAL FLORIDA
  {
    id: 'frog_song_organics',
    name: 'Frog Song Organics',
    website: 'https://frogsongorganics.com/',
    stateCode: 'FL',
    growingRegion: 'central_fl',
    roles: ['grower', 'retailer'],
    retailChannels: ['csa', 'farmers_market'],
    products: ['strawberry', 'peach', 'tomato'],
    certifications: ['usda_organic'],
    features: ['accepts_snap'],
    verificationLevel: 'website_verified',
    dataSource: 'florida-dtc-farms-research.md'
  },

  // PLANT CITY STRAWBERRIES
  {
    id: 'wish_farms',
    name: 'Wish Farms',
    website: 'https://wishfarms.com/',
    stateCode: 'FL',
    city: 'Plant City',
    county: 'Hillsborough',
    growingRegion: 'plant_city_fl',
    roles: ['grower', 'packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers'],
    products: ['strawberry', 'blueberry', 'blackberry'],
    features: ['family_owned', 'florida_born'],
    verificationLevel: 'website_verified',
    dataSource: 'florida-dtc-farms-research.md'
  },
]

// =============================================================================
// CALIFORNIA ENTITIES
// =============================================================================

const CALIFORNIA_ENTITIES: SupplyChainEntity[] = [
  {
    id: 'frog_hollow_farm',
    name: 'Frog Hollow Farm',
    website: 'https://www.froghollow.com/',
    stateCode: 'CA',
    city: 'Brentwood',
    county: 'Contra Costa',
    growingRegion: 'central_valley_ca',
    roles: ['grower', 'retailer'],
    retailChannels: ['d2c', 'farmers_market'],
    products: ['peach', 'cherry', 'apple', 'pear'],
    certifications: ['usda_organic'],
    features: ['stone_fruit_specialist', 'direct_to_consumer'],
    verificationLevel: 'website_verified',
    dataSource: 'california-dtc-farms-research.md'
  },
  {
    id: 'andy_boy',
    name: 'Andy Boy',
    website: 'https://www.andyboy.com/',
    stateCode: 'CA',
    city: 'Salinas',
    county: 'Monterey',
    growingRegion: 'salinas_valley_ca',
    roles: ['grower', 'packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_distributors', 'to_retailers'],
    products: ['tomato'],
    features: ['family_owned_since_1924', 'vertically_integrated'],
    verificationLevel: 'website_verified',
    dataSource: 'california-dtc-farms-research.md'
  },
  {
    id: 'twin_girls_farm',
    name: 'Twin Girls Farm',
    website: 'https://twingirlsfarm.com/',
    stateCode: 'CA',
    city: 'Sebastopol',
    county: 'Sonoma',
    growingRegion: 'sonoma_ca',
    roles: ['grower', 'retailer'],
    retailChannels: ['d2c', 'farmers_market'],
    products: ['apple', 'pear'],
    features: ['heritage_apples', 'heirloom_varieties'],
    verificationLevel: 'website_verified',
    dataSource: 'california-dtc-farms-research.md'
  },
  {
    id: 'honey_crisp_farms',
    name: 'Honey Crisp Farms',
    stateCode: 'CA',
    growingRegion: 'central_valley_ca',
    roles: ['grower'],
    products: ['apple'],
    verificationLevel: 'website_verified',
    dataSource: 'california-dtc-farms-research.md'
  },
]

// =============================================================================
// PACIFIC NORTHWEST ENTITIES
// =============================================================================

const PACIFIC_NW_ENTITIES: SupplyChainEntity[] = [
  // Stemilt moved to PACKINGHOUSE_ENTITIES with complete data
  {
    id: 'chukar_cherries',
    name: 'Chukar Cherries',
    website: 'https://www.chukar.com/',
    stateCode: 'WA',
    city: 'Prosser',
    county: 'Benton',
    growingRegion: 'wenatchee_wa',
    roles: ['packinghouse', 'retailer'],
    facilityTypes: ['processor'],
    b2bChannels: ['to_distributors'],
    retailChannels: ['d2c'],
    products: ['cherry'],
    features: ['dried_cherries', 'chocolate_covered', 'value_added'],
    verificationLevel: 'website_verified',
    dataSource: 'pacific-northwest-dtc-farms-research.md'
  },
  {
    id: 'harry_david',
    name: 'Harry & David',
    website: 'https://www.harryanddavid.com/',
    stateCode: 'OR',
    city: 'Medford',
    county: 'Jackson',
    growingRegion: 'willamette_valley_or',
    roles: ['grower', 'retailer'],  // Has own orchards + sources from other growers
    retailChannels: ['d2c'],
    products: ['pear', 'apple', 'cherry'],
    features: ['royal_riviera_pears', 'gift_boxes', 'premium_positioning', 'sources_from_growers'],
    verificationLevel: 'website_verified',
    dataSource: 'pacific-northwest-dtc-farms-research.md'
  },
]

// =============================================================================
// MIDWEST ENTITIES
// =============================================================================

const MIDWEST_ENTITIES: SupplyChainEntity[] = [
  {
    id: 'cherry_republic',
    name: 'Cherry Republic',
    website: 'https://www.cherryrepublic.com/',
    stateCode: 'MI',
    city: 'Glen Arbor',
    county: 'Leelanau',
    growingRegion: 'traverse_city_mi',
    roles: ['packinghouse', 'retailer'],
    facilityTypes: ['processor'],
    retailChannels: ['d2c', 'farm_stand'],
    products: ['cherry'],
    features: ['tart_cherry_specialist', 'value_added_products'],
    verificationLevel: 'website_verified',
    dataSource: 'midwest-dtc-farms-research.md'
  },
  {
    id: 'king_orchards',
    name: 'King Orchards',
    website: 'https://www.kingorchards.com/',
    stateCode: 'MI',
    city: 'Central Lake',
    county: 'Antrim',
    growingRegion: 'traverse_city_mi',
    roles: ['grower', 'retailer'],
    retailChannels: ['d2c', 'farm_stand'],
    products: ['cherry', 'apple'],
    features: ['montmorency_cherries', 'family_farm'],
    verificationLevel: 'website_verified',
    dataSource: 'midwest-dtc-farms-research.md'
  },
]

// =============================================================================
// TEXAS/SOUTHWEST ENTITIES
// =============================================================================

const TEXAS_ENTITIES: SupplyChainEntity[] = [
  // Lone Star Citrus - now properly classified as wet packinghouse
  // (moved to PACKINGHOUSE_ENTITIES below with complete data)
]

// =============================================================================
// SOUTHEAST ENTITIES
// =============================================================================

const SOUTHEAST_ENTITIES: SupplyChainEntity[] = [
  // Pearson Farm and Dickey Farms moved to PACKINGHOUSE_ENTITIES with complete data
  {
    id: 'southern_grace_farms',
    name: 'Southern Grace Farms',
    website: 'https://southerngracefarms.com/',
    stateCode: 'GA',
    growingRegion: 'middle_ga',
    roles: ['grower', 'retailer'],
    retailChannels: ['farm_stand'],
    products: ['blueberry', 'strawberry'],
    features: ['u_pick', 'family_farm'],
    verificationLevel: 'website_verified',
    dataSource: 'southeast-dtc-farms-research.md'
  },
]

// =============================================================================
// PACKINGHOUSE ENTITIES (from 2024 research)
// =============================================================================
//
// These are wet packinghouses, processors, and other supply chain entities
// discovered through systematic research. Each is classified with proper roles.
//
// Origin Inference Rules:
//   - Wet packinghouse location → CAN infer fruit origin (sources from nearby growers)
//   - Gift/retail repack location → CANNOT infer origin (sources from anywhere)
//   - Processor location → Usually CAN infer (sources regionally, but check)
//   - If entity is also Grower → At least SOME product is from that region
//
// =============================================================================

// -----------------------------------------------------------------------------
// FLORIDA PACKINGHOUSES
// -----------------------------------------------------------------------------

const FL_PACKINGHOUSE_ENTITIES: SupplyChainEntity[] = [
  {
    id: 'img_citrus',
    name: 'IMG Citrus',
    website: 'https://imgcitrus.com/',
    stateCode: 'FL',
    city: 'Vero Beach',
    county: 'Indian River',
    growingRegion: 'indian_river_fl',
    roles: ['grower', 'packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_distributors', 'to_retailers'],
    products: ['orange', 'grapefruit'],
    features: ['11000_acres', 'sweet_sixty_facility', '185000_sqft', 'largest_grapefruit_grower_fl'],
    verificationLevel: 'website_verified',
    dataSource: 'packinghouse-research-2024'
  },
  {
    id: 'peace_river_packing',
    name: 'Peace River Packing Company',
    website: 'https://floridasnaturalgrowersinc.com/',
    stateCode: 'FL',
    city: 'Fort Meade',
    county: 'Polk',
    growingRegion: 'central_fl',
    roles: ['grower', 'packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_distributors', 'to_retailers'],
    products: ['orange', 'tangerine', 'grapefruit'],
    features: ['3900_acres', 'family_owned_4_generations', 'since_1928', 'floridas_natural_coop'],
    verificationLevel: 'website_verified',
    dataSource: 'packinghouse-research-2024'
  },
  {
    id: 'southern_gardens_citrus',
    name: 'Southern Gardens Citrus',
    website: 'https://www.ussugar.com/southern-gardens-citrus/',
    stateCode: 'FL',
    city: 'Clewiston',
    county: 'Hendry',
    growingRegion: 'central_fl',
    roles: ['grower', 'packinghouse'],
    facilityTypes: ['processor'],  // NFC juice, not fresh packing
    b2bChannels: ['to_distributors'],
    products: ['orange'],
    features: ['16500_acres', 'us_sugar_division', 'nfc_juice', 'largest_private_label_supplier'],
    verificationLevel: 'website_verified',
    dataSource: 'packinghouse-research-2024'
  },
  {
    id: 'premier_citrus',
    name: 'Premier Citrus Packers',
    website: 'https://premiercitrus.com/',
    stateCode: 'FL',
    city: 'Vero Beach',
    county: 'Indian River',
    growingRegion: 'indian_river_fl',
    roles: ['grower', 'packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_distributors', 'to_retailers'],
    products: ['grapefruit', 'orange', 'tangerine'],
    features: ['1_million_cartons_annually', 'compac_grading', 'brix_sensing_nir', 'haccp_certified'],
    verificationLevel: 'website_verified',
    dataSource: 'packinghouse-research-2024'
  },
  {
    id: 'haines_city_cga',
    name: 'Haines City Citrus Growers Association',
    stateCode: 'FL',
    city: 'Haines City',
    county: 'Polk',
    growingRegion: 'central_fl',
    roles: ['packinghouse'],  // Cooperative - no owned groves
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_distributors', 'to_retailers'],
    products: ['orange', 'grapefruit'],
    features: ['cooperative', 'since_1909', 'hill_top_label', 'floridas_natural_member', '5th_largest_fl'],
    verificationLevel: 'website_verified',
    dataSource: 'packinghouse-research-2024'
  },
  {
    id: 'dundee_cga',
    name: 'Dundee Citrus Growers Association',
    website: 'https://dun-d.com/',
    stateCode: 'FL',
    city: 'Dundee',
    county: 'Polk',
    growingRegion: 'central_fl',
    roles: ['packinghouse'],  // Cooperative - packs for 10K+ member acres
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_distributors', 'to_retailers'],
    products: ['orange', 'grapefruit', 'tangerine'],
    features: ['cooperative', '10000_plus_member_acres', 'two_packinghouses', '100000_sqft_cold_storage'],
    verificationLevel: 'website_verified',
    dataSource: 'packinghouse-research-2024'
  },
  {
    id: 'packers_indian_river',
    name: 'Packers of Indian River',
    website: 'http://packersindianriver.com/',
    stateCode: 'FL',
    city: 'Fort Pierce',
    county: 'St. Lucie',
    growingRegion: 'indian_river_fl',
    roles: ['grower', 'packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_distributors', 'to_retailers'],
    products: ['grapefruit', 'tangerine', 'orange'],
    features: ['6000_acres', 'two_packinghouses', '2_5_million_carton_capacity'],
    verificationLevel: 'website_verified',
    dataSource: 'packinghouse-research-2024'
  },
  {
    id: 'riverfront_packing',
    name: 'Riverfront Packing Company',
    website: 'http://www.scottcitrus.com/',
    stateCode: 'FL',
    city: 'Vero Beach',
    county: 'Indian River',
    growingRegion: 'indian_river_fl',
    roles: ['grower', 'packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_distributors', 'to_retailers'],
    products: ['grapefruit', 'orange'],
    features: ['4000_acres', 'scott_family', 'largest_grapefruit_packinghouse_fl', 'since_1961'],
    verificationLevel: 'website_verified',
    dataSource: 'packinghouse-research-2024'
  },
  {
    id: 'als_family_farms',
    name: "Al's Family Farms",
    website: 'https://www.alsfamilyfarms.com/',
    stateCode: 'FL',
    city: 'Fort Pierce',
    county: 'St. Lucie',
    growingRegion: 'indian_river_fl',
    roles: ['grower', 'retailer'],  // Small grower + D2C, some packing
    facilityTypes: ['gift_repack'],
    retailChannels: ['d2c', 'farm_stand'],
    products: ['grapefruit', 'orange', 'tangerine'],
    features: ['family_owned_3_generations', 'since_1970s', 'big_red_barn_packinghouse', 'tours_available'],
    verificationLevel: 'website_verified',
    dataSource: 'packinghouse-research-2024'
  },
]

// -----------------------------------------------------------------------------
// CALIFORNIA PACKINGHOUSES
// -----------------------------------------------------------------------------

const CA_PACKINGHOUSE_ENTITIES: SupplyChainEntity[] = [
  {
    id: 'porterville_citrus',
    name: 'Porterville Citrus, Inc.',
    website: 'https://portervillecitrus.com/',
    stateCode: 'CA',
    city: 'Porterville',
    county: 'Tulare',
    growingRegion: 'central_valley_ca',
    roles: ['packinghouse'],  // Packs for 30K+ acres, Sunkist member
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_distributors', 'to_retailers'],
    products: ['orange', 'tangerine', 'lemon'],
    features: ['30000_plus_acres_packed', 'sunkist_member', '8_packing_facilities', 'employee_owned_since_2010'],
    verificationLevel: 'website_verified',
    dataSource: 'packinghouse-research-2024'
  },
  {
    id: 'hmc_farms',
    name: 'HMC Farms',
    website: 'https://www.hmcfarms.com/',
    stateCode: 'CA',
    city: 'Kingsburg',
    county: 'Fresno',
    growingRegion: 'central_valley_ca',
    roles: ['grower', 'packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_distributors', 'to_retailers'],
    products: ['peach', 'plum', 'nectarine', 'grape'],
    features: ['6000_plus_acres', 'five_generations', 'since_1887', 'chile_peru_mexico_sourcing'],
    verificationLevel: 'website_verified',
    dataSource: 'packinghouse-research-2024'
  },
  {
    id: 'kingsburg_orchards',
    name: 'Kingsburg Orchards',
    website: 'https://www.kingsburgorchards.com/',
    stateCode: 'CA',
    city: 'Kingsburg',
    county: 'Fresno',
    growingRegion: 'central_valley_ca',
    roles: ['grower', 'packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_distributors', 'to_retailers'],
    products: ['peach', 'nectarine', 'plum', 'pluot', 'apple', 'pear', 'kiwi'],
    features: ['8000_to_9500_acres', 'fifth_generation', '8_million_cases_season', '200_plus_varieties', 'proprietary_nursery'],
    verificationLevel: 'website_verified',
    dataSource: 'packinghouse-research-2024'
  },
  {
    id: 'well_pict',
    name: 'Well-Pict Berries',
    website: 'https://www.wellpict.com/',
    stateCode: 'CA',
    city: 'Watsonville',
    county: 'Santa Cruz',
    growingRegion: 'salinas_valley_ca',
    roles: ['packinghouse'],  // Uses independent grower network
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_distributors', 'to_retailers'],
    products: ['strawberry', 'raspberry', 'blackberry'],
    features: ['1200_acres_oxnard', 'since_1969', 'proprietary_varieties', 'year_round_supply', 'costco_walmart_target'],
    verificationLevel: 'website_verified',
    dataSource: 'packinghouse-research-2024'
  },
  {
    id: 'blue_banner',
    name: 'Blue Banner Company',
    website: 'https://bluebannerco.com/',
    stateCode: 'CA',
    city: 'Riverside',
    county: 'Riverside',
    growingRegion: 'southern_ca',
    roles: ['packinghouse'],  // 200 growers, no owned groves
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_distributors', 'to_retailers'],
    products: ['grapefruit', 'orange'],
    features: ['200_growers', 'since_1950', 'largest_ca_grapefruit_packer', 'sunkist_member', '3_million_cartons'],
    verificationLevel: 'website_verified',
    dataSource: 'packinghouse-research-2024'
  },
  {
    id: 'kings_river_packing',
    name: 'Kings River Packing',
    website: 'https://kingorange.com/',
    stateCode: 'CA',
    city: 'Sanger',
    county: 'Fresno',
    growingRegion: 'central_valley_ca',
    roles: ['grower', 'packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_distributors', 'to_retailers'],
    products: ['orange', 'tangerine', 'lemon', 'grapefruit'],
    features: ['3500_acres', 'eight_generations', 'since_1866', '1500_field_workers', '1000_packinghouse_workers'],
    verificationLevel: 'website_verified',
    dataSource: 'packinghouse-research-2024'
  },
  {
    id: 'mountain_view_fruit',
    name: 'Mountain View Fruit Sales',
    website: 'https://mvfruit.com/',
    stateCode: 'CA',
    city: 'Reedley',
    county: 'Fresno',
    growingRegion: 'central_valley_ca',
    roles: ['packinghouse'],  // Packs for family growers
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_distributors', 'to_retailers'],
    products: ['peach', 'plum', 'nectarine'],
    features: ['since_1994', 'three_family_founders', 'largest_stone_fruit_grower_groups', '25_plus_varieties'],
    verificationLevel: 'website_verified',
    dataSource: 'packinghouse-research-2024'
  },
  {
    id: 'booth_ranches',
    name: 'Booth Ranches',
    website: 'https://boothranches.com/',
    stateCode: 'CA',
    city: 'Orange Cove',
    county: 'Fresno',
    growingRegion: 'central_valley_ca',
    roles: ['grower', 'packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_distributors', 'to_retailers'],
    products: ['orange'],
    features: ['7500_acres', 'since_1957', 'one_grower_one_owner', 'global_gap_certified'],
    verificationLevel: 'website_verified',
    dataSource: 'packinghouse-research-2024'
  },
  {
    id: 'rincon_fresh',
    name: 'Rincon Fresh',
    website: 'https://www.rinconfresh.com/',
    stateCode: 'CA',
    city: 'Camarillo',
    county: 'Ventura',
    growingRegion: 'southern_ca',
    roles: ['grower', 'packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_distributors', 'to_retailers'],
    products: ['strawberry', 'raspberry', 'blackberry', 'blueberry'],
    features: ['hasegawa_family', 'largest_ca_family_berry_farm', 'quality_over_quantity'],
    verificationLevel: 'website_verified',
    dataSource: 'packinghouse-research-2024'
  },
  {
    id: 'terry_berries',
    name: 'Terry Berries',
    website: 'https://terryberries.com/',
    stateCode: 'CA',
    city: 'Ventura',
    county: 'Ventura',
    growingRegion: 'southern_ca',
    roles: ['grower', 'retailer'],  // Direct sales, farm stand
    facilityTypes: ['wet_packinghouse'],
    retailChannels: ['farm_stand'],
    products: ['strawberry'],
    features: ['240_acres', 'fifth_generation', 'since_1890', '125_years_ventura_county'],
    verificationLevel: 'website_verified',
    dataSource: 'packinghouse-research-2024'
  },
]

// -----------------------------------------------------------------------------
// TEXAS PACKINGHOUSES
// -----------------------------------------------------------------------------

const TX_PACKINGHOUSE_ENTITIES: SupplyChainEntity[] = [
  {
    id: 'lone_star_citrus',
    name: 'Lone Star Citrus Growers',
    website: 'https://lonestarcitrus.com/',
    stateCode: 'TX',
    city: 'Mission',
    county: 'Hidalgo',
    growingRegion: 'rio_grande_tx',
    roles: ['grower', 'packinghouse'],
    facilityTypes: ['wet_packinghouse', 'processor'],  // Also juice
    b2bChannels: ['to_distributors', 'to_retailers'],
    products: ['grapefruit', 'orange'],
    features: ['7000_plus_acres', 'since_2007', 'vertically_integrated', 'rio_star_grapefruit', 'last_independent_tx_citrus'],
    verificationLevel: 'website_verified',
    dataSource: 'packinghouse-research-2024'
  },
  {
    id: 'edinburg_citrus_tx',
    name: 'Edinburg Citrus Association',
    stateCode: 'TX',
    city: 'Edinburg',
    county: 'Hidalgo',
    growingRegion: 'rio_grande_tx',
    roles: ['packinghouse'],  // Cooperative - 100+ members
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_distributors', 'to_retailers'],
    products: ['grapefruit', 'orange'],
    features: ['cooperative', 'since_1932', '100_plus_members', '4000_member_acres', 'last_tx_citrus_coop', 'historic_1944_shed'],
    verificationLevel: 'website_verified',
    dataSource: 'packinghouse-research-2024'
  },
  {
    id: 'south_tex_organics',
    name: 'South Tex Organics',
    website: 'https://www.stxorganics.com/',
    stateCode: 'TX',
    city: 'Harlingen',
    county: 'Cameron',
    growingRegion: 'rio_grande_tx',
    roles: ['grower', 'packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_distributors', 'to_retailers'],
    products: ['grapefruit', 'orange', 'lemon'],
    certifications: ['usda_organic', 'ccof'],
    features: ['500_plus_organic_acres', 'since_1984', 'largest_tx_organic_citrus', '14_million_lbs_annually'],
    verificationLevel: 'website_verified',
    dataSource: 'packinghouse-research-2024'
  },
  {
    id: 'navarro_pecan',
    name: 'Navarro Pecan Company',
    website: 'https://navarropecan.com/',
    stateCode: 'TX',
    city: 'Corsicana',
    county: 'Navarro',
    growingRegion: 'texas_pecan_belt',
    roles: ['packinghouse'],  // Processor only - NO owned orchards
    facilityTypes: ['processor'],  // Shelling
    b2bChannels: ['to_distributors'],
    products: ['pecan'],
    features: ['no_owned_orchards', 'buys_from_16_states', '50_million_lbs_annually', '200000_sqft_facility', 'since_1977'],
    verificationLevel: 'website_verified',
    dataSource: 'packinghouse-research-2024'
  },
  {
    id: 'tex_mex_sales',
    name: 'Tex Mex Sales',
    stateCode: 'TX',
    city: 'Weslaco',
    county: 'Hidalgo',
    growingRegion: 'rio_grande_tx',
    roles: ['grower', 'packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_distributors', 'to_retailers'],
    products: ['onion'],
    features: ['100_percent_own_acreage', 'since_1968', 'texas_1015_onions', 'onioncare_strategy'],
    verificationLevel: 'website_verified',
    dataSource: 'packinghouse-research-2024'
  },
  {
    id: 'little_bear_produce',
    name: 'Little Bear Produce',
    website: 'https://www.littlebearproduce.com/',
    stateCode: 'TX',
    city: 'Edinburg',
    county: 'Hidalgo',
    growingRegion: 'rio_grande_tx',
    roles: ['grower', 'packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_distributors', 'to_retailers'],
    products: ['onion', 'greens', 'melon'],
    features: ['7000_acres', 'since_1986', 'three_countries_four_states', 'honeysweet_onions'],
    verificationLevel: 'website_verified',
    dataSource: 'packinghouse-research-2024'
  },
  {
    id: 'onion_house',
    name: 'The Onion House',
    stateCode: 'TX',
    city: 'Weslaco',
    county: 'Hidalgo',
    growingRegion: 'rio_grande_tx',
    roles: ['grower', 'packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_distributors', 'to_retailers'],
    products: ['onion'],
    features: ['600_acres_tx', 'holmes_family', 'year_round_supply', 'colorado_utah_sourcing'],
    verificationLevel: 'website_verified',
    dataSource: 'packinghouse-research-2024'
  },
  {
    id: 'peace_river_citrus_products',
    name: 'Peace River Citrus Products',
    website: 'http://www.peacerivercitrus.com/',
    stateCode: 'FL',  // HQ in Vero Beach, plants in Arcadia/Bartow
    city: 'Vero Beach',
    county: 'Indian River',
    growingRegion: 'indian_river_fl',
    roles: ['packinghouse'],
    facilityTypes: ['processor'],  // Juice concentrates
    b2bChannels: ['to_distributors'],
    products: ['orange', 'grapefruit'],
    features: ['juice_processor', 'arcadia_bartow_plants', '10_million_boxes_annually'],
    verificationLevel: 'website_verified',
    dataSource: 'packinghouse-research-2024'
  },
]

// -----------------------------------------------------------------------------
// WASHINGTON PACKINGHOUSES
// -----------------------------------------------------------------------------

const WA_PACKINGHOUSE_ENTITIES: SupplyChainEntity[] = [
  {
    id: 'stemilt',
    name: 'Stemilt Growers',
    website: 'https://www.stemilt.com/',
    stateCode: 'WA',
    city: 'Wenatchee',
    county: 'Chelan',
    growingRegion: 'wenatchee_wa',
    roles: ['grower', 'packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_distributors', 'to_retailers'],
    products: ['apple', 'cherry', 'pear'],
    features: ['since_1964', 'vertically_integrated', '26_percent_wa_organic_apples', '32_percent_pnw_organic_pears'],
    verificationLevel: 'website_verified',
    dataSource: 'packinghouse-research-2024'
  },
  {
    id: 'cmi_orchards',
    name: 'CMI Orchards',
    website: 'https://www.cmiorchards.com/',
    stateCode: 'WA',
    city: 'Wenatchee',
    county: 'Chelan',
    growingRegion: 'wenatchee_wa',
    roles: ['grower', 'packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_distributors', 'to_retailers'],
    products: ['apple', 'pear', 'cherry'],
    features: ['100_plus_years', 'sugarbee_ambrosia_kiku', 'exports_60_countries', 'multi_valley_sourcing'],
    verificationLevel: 'website_verified',
    dataSource: 'packinghouse-research-2024'
  },
  {
    id: 'gebbers_farms',
    name: 'Gebbers Farms',
    website: 'https://gebbersfarms.com/',
    stateCode: 'WA',
    city: 'Brewster',
    county: 'Okanogan',
    growingRegion: 'okanogan_wa',
    roles: ['grower', 'packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_distributors', 'to_retailers'],
    products: ['apple', 'cherry'],
    features: ['12000_acres', 'six_generations', 'since_1900', 'largest_late_cherry_supplier_world', 'brewster_heights_packing'],
    verificationLevel: 'website_verified',
    dataSource: 'packinghouse-research-2024'
  },
  {
    id: 'washington_fruit_growers',
    name: 'Washington Fruit Growers',
    website: 'https://washfruitgrowers.com/',
    stateCode: 'WA',
    city: 'Yakima',
    county: 'Yakima',
    growingRegion: 'yakima_valley_wa',
    roles: ['grower', 'packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_distributors', 'to_retailers'],
    products: ['apple', 'pear', 'cherry'],
    features: ['since_1916', '90_acres_industrial', 'roche_fruit_partner', 'gilbert_orchards_partner'],
    verificationLevel: 'website_verified',
    dataSource: 'packinghouse-research-2024'
  },
  {
    id: 'mcdougall_sons',
    name: 'McDougall & Sons',
    website: 'https://www.royalblufforchards.com/',
    stateCode: 'WA',
    city: 'Wenatchee',
    county: 'Chelan',
    growingRegion: 'wenatchee_wa',
    roles: ['grower', 'packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_distributors', 'to_retailers'],
    products: ['apple', 'pear', 'cherry'],
    features: ['4000_acres_managed', '2200_acres_owned', '5_million_packages_year', 'since_1976', '2022_good_fruit_growers_of_year'],
    verificationLevel: 'website_verified',
    dataSource: 'packinghouse-research-2024'
  },
  {
    id: 'allan_brothers',
    name: 'Allan Brothers',
    website: 'https://allanbrosfruit.com/',
    stateCode: 'WA',
    city: 'Naches',
    county: 'Yakima',
    growingRegion: 'yakima_valley_wa',
    roles: ['grower', 'packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_distributors', 'to_retailers'],
    products: ['apple', 'cherry', 'pear'],
    features: ['2500_to_3500_acres', 'fifth_generation', 'since_1901', '303000_sqft_facility', 'jazz_envy_varieties'],
    verificationLevel: 'website_verified',
    dataSource: 'packinghouse-research-2024'
  },
  {
    id: 'johnson_orchards',
    name: 'Johnson Orchards',
    website: 'https://www.johnsonorchardsfruit.com/',
    stateCode: 'WA',
    city: 'Yakima',
    county: 'Yakima',
    growingRegion: 'yakima_valley_wa',
    roles: ['grower', 'retailer'],  // Direct market, farm stand
    retailChannels: ['farm_stand'],
    products: ['cherry', 'peach', 'nectarine', 'pear', 'apple'],
    features: ['fourth_generation', 'since_1904', '40_acres_naches_heights', 'snokist_member', 'little_bake_shop'],
    verificationLevel: 'website_verified',
    dataSource: 'packinghouse-research-2024'
  },
  {
    id: 'columbia_fruit_packers',
    name: 'Columbia Fruit Packers',
    website: 'https://www.columbiafruit.com/',
    stateCode: 'WA',
    city: 'Wenatchee',
    county: 'Chelan',
    growingRegion: 'wenatchee_wa',
    roles: ['grower', 'packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_distributors', 'to_retailers'],
    products: ['apple', 'cherry'],
    features: ['since_1946', 'family_of_families', '100_acre_riverview_ranch', 'two_facilities'],
    verificationLevel: 'website_verified',
    dataSource: 'packinghouse-research-2024'
  },
  {
    id: 'apple_king',
    name: 'Apple King',
    website: 'https://appleking.com/',
    stateCode: 'WA',
    city: 'Yakima',
    county: 'Yakima',
    growingRegion: 'yakima_valley_wa',
    roles: ['grower', 'packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_distributors', 'to_retailers'],
    products: ['apple'],
    features: ['since_1914', 'first_electronic_packing_line_1992', 'cmi_affiliate'],
    verificationLevel: 'website_verified',
    dataSource: 'packinghouse-research-2024'
  },
]

// -----------------------------------------------------------------------------
// GEORGIA PACKINGHOUSES
// -----------------------------------------------------------------------------

const GA_PACKINGHOUSE_ENTITIES: SupplyChainEntity[] = [
  {
    id: 'lane_southern_orchards',
    name: 'Lane Southern Orchards',
    website: 'https://lanesouthernorchards.com/',
    stateCode: 'GA',
    city: 'Fort Valley',
    county: 'Peach',
    growingRegion: 'middle_ga',
    roles: ['grower', 'packinghouse', 'retailer'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_distributors', 'to_retailers'],
    retailChannels: ['farm_stand', 'd2c'],
    products: ['peach', 'pecan', 'strawberry'],
    features: ['11000_acres', 'since_1908', '1_million_carton_capacity', 'genuine_georgia_group', 'taylor_orchards_merger'],
    verificationLevel: 'website_verified',
    dataSource: 'packinghouse-research-2024'
  },
  {
    id: 'pearson_farm',
    name: 'Pearson Farm',
    website: 'https://pearsonfarm.com/',
    stateCode: 'GA',
    city: 'Fort Valley',
    county: 'Crawford',
    growingRegion: 'middle_ga',
    roles: ['grower', 'packinghouse', 'retailer'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_distributors'],
    retailChannels: ['d2c'],
    products: ['peach', 'pecan'],
    features: ['3800_to_4300_acres', 'since_1885', 'sixth_generation', '50_peach_varieties', 'zenith_schoolhouse_packinghouse'],
    verificationLevel: 'website_verified',
    dataSource: 'packinghouse-research-2024'
  },
  {
    id: 'bland_farms',
    name: 'Bland Farms',
    website: 'https://blandfarms.com/',
    stateCode: 'GA',
    city: 'Glennville',
    county: 'Tattnall',
    growingRegion: 'vidalia_ga',
    roles: ['grower', 'packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_distributors', 'to_retailers'],
    products: ['onion'],
    features: ['2000_acres_vidalia', 'since_1982', 'largest_vidalia_grower', '50_percent_vidalia_market', 'ca_storage_pioneer'],
    verificationLevel: 'website_verified',
    dataSource: 'packinghouse-research-2024'
  },
  {
    id: 'dickey_farms',
    name: 'Dickey Farms',
    website: 'https://gapeaches.com/',
    stateCode: 'GA',
    city: 'Musella',
    county: 'Crawford',
    growingRegion: 'middle_ga',
    roles: ['grower', 'packinghouse', 'retailer'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_distributors'],
    retailChannels: ['farm_stand', 'd2c'],
    products: ['peach', 'strawberry', 'pecan'],
    features: ['1000_acres', 'since_1897', 'oldest_ga_packinghouse', '100000_peach_trees', 'genuine_georgia_group'],
    verificationLevel: 'website_verified',
    dataSource: 'packinghouse-research-2024'
  },
  {
    id: 'ellis_bros_pecans',
    name: 'Ellis Bros Pecans',
    website: 'https://ellisbrospecans.com/',
    stateCode: 'GA',
    city: 'Vienna',
    county: 'Dooly',
    growingRegion: 'south_ga',
    roles: ['grower', 'packinghouse', 'retailer'],
    facilityTypes: ['processor'],  // Shelling + candy
    retailChannels: ['d2c', 'farm_stand'],
    products: ['pecan'],
    features: ['3000_acres', 'since_1944', 'irenes_candy_kitchen', '9_million_revenue'],
    verificationLevel: 'website_verified',
    dataSource: 'packinghouse-research-2024'
  },
  {
    id: 'hudson_pecan',
    name: 'Hudson Pecan Company',
    website: 'https://www.hudsonpecan.com/',
    stateCode: 'GA',
    city: 'Ocilla',
    county: 'Irwin',
    growingRegion: 'south_ga',
    roles: ['grower', 'packinghouse'],
    facilityTypes: ['processor'],  // Shelling
    b2bChannels: ['to_distributors'],
    products: ['pecan'],
    features: ['2200_acres', '5_million_lbs_annually', 'china_export_pioneer'],
    verificationLevel: 'website_verified',
    dataSource: 'packinghouse-research-2024'
  },
  {
    id: 'stanley_farms',
    name: 'Stanley Farms',
    stateCode: 'GA',
    city: 'Vidalia',
    county: 'Toombs',
    growingRegion: 'vidalia_ga',
    roles: ['grower', 'packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_distributors', 'to_retailers'],
    products: ['onion'],
    features: ['1000_plus_acres', 'third_largest_vidalia', 'vidalia_valley_facility', '50_plus_branded_products'],
    verificationLevel: 'website_verified',
    dataSource: 'packinghouse-research-2024'
  },
]

// =============================================================================

// LOCALHARVEST FARM ENTITIES (2025-12-21)
// Total: 266 farms across 50 states
// Source: LocalHarvest.org farm directory
// Rich timing data: harvestMonths per product

// LOCALHARVEST FARM ENTITIES WITH GROWING REGIONS (2025-12-21)
// Total: 266 farms

const LOCALHARVEST_ENTITIES: SupplyChainEntity[] = [
  {
    id: 'down_to_earth_u_pick_garden',
    name: "Down To Earth U-Pick Garden",
    stateCode: 'AK',
    city: "Sitka",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["vegetable", "berries"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'spring_creek_farm',
    name: "Spring Creek Farm",
    stateCode: 'AK',
    city: "Palmer",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["vegetable", "potato"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'birch_creek_ranch',
    name: "Birch Creek Ranch",
    stateCode: 'AK',
    city: "Palmer area",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["vegetable", "berries"],
    features: ["established_1982"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'sutherland_acres',
    name: "Sutherland Acres",
    stateCode: 'AL',
    county: "Winston County",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["vegetable"],
    features: ["established_1880", "organic_practices"],
    certifications: ["usda_organic"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'robertsdale_organic_farm',
    name: "Robertsdale Organic Farm",
    stateCode: 'AL',
    city: "Robertsdale",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["vegetable", "eggs", "blueberry", "honey"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'foley_farmers_market',
    name: "Foley Farmers Market",
    stateCode: 'AL',
    city: "Foley",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["vegetable", "shrimp"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'bentonville_greens_farm',
    name: "Bentonville Greens Farm",
    stateCode: 'AR',
    city: "Bentonville",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["greens", "vegetable", "herbs", "fruit"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'springdale_u_pick',
    name: "Springdale U-Pick",
    stateCode: 'AR',
    city: "Springdale",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["strawberry", "vegetable"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'sweet_iron_farm',
    name: "Sweet Iron Farm",
    stateCode: 'AR',
    city: "Huntsville",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["berries", "fruit", "eggs", "meat"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'sphinx_date_co',
    name: "Sphinx Date Co.",
    stateCode: 'AZ',
    city: "Scottsdale",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["date", "citrus"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'arizona_citrus_farm',
    name: "Arizona Citrus Farm",
    stateCode: 'AZ',
    city: "Mesa area",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["orange", "grapefruit", "tangerine"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'agritopia_farm',
    name: "Agritopia Farm",
    stateCode: 'AZ',
    city: "Gilbert",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["citrus"],
    features: ["organic_practices"],
    certifications: ["usda_organic"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'blue_sky_organic_farms',
    name: "Blue Sky Organic Farms",
    stateCode: 'AZ',
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["vegetable"],
    features: ["established_1994", "organic_practices"],
    certifications: ["usda_organic"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'flower_fly_farm',
    name: "Flower Fly Farm",
    stateCode: 'AZ',
    city: "Gilbert",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["vegetable", "fruit"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'griffith_family_farms',
    name: "Griffith Family Farms",
    website: "https://www.localharvest.org/griffith-family-farms-M56110",
    stateCode: 'CA',
    city: "Riverside",
    county: "Riverside County",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["citrus_orange", "citrus_grapefruit", "avocado", "persimmon"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'sierra_nevada_citrus',
    name: "Sierra Nevada Citrus",
    website: "https://www.localharvest.org/sierra-nevada-citrus-M12152",
    stateCode: 'CA',
    city: "Exeter",
    county: "Tulare County",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["citrus_orange"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'sunset_ridge_fine_fruits',
    name: "Sunset Ridge Fine Fruits",
    website: "https://www.localharvest.org/sunset-ridge-mandarins-M52705",
    stateCode: 'CA',
    city: "Newcastle",
    county: "Placer County",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["citrus_mandarin", "citrus_orange", "citrus_grapefruit", "citrus_lemon"],
    features: ["organic_practices"],
    certifications: ["usda_organic"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'rising_c_ranches',
    name: "Rising C Ranches",
    website: "https://www.localharvest.org/rising-c-ranches-M3190",
    stateCode: 'CA',
    city: "Orange Cove",
    county: "Tulare County",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["citrus_orange", "citrus_mandarin", "citrus_grapefruit", "citrus_lemon"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'rodriguez_farms',
    name: "Rodriguez Farms",
    website: "https://www.localharvest.org/rodriguez-farms-M58868",
    stateCode: 'CA',
    city: "Castroville",
    county: "Monterey County",
    growingRegion: 'salinas_valley_ca',
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["strawberry", "berry_raspberry", "berry_blackberry", "artichoke"],
    features: ["organic_practices"],
    certifications: ["usda_organic"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'brian_ranch_airport_u_pick_orchard',
    name: "Brian Ranch Airport U-Pick Orchard",
    website: "https://www.localharvest.org/brian-ranch-airport-upick-orchard-M3363",
    stateCode: 'CA',
    city: "Llano",
    county: "Los Angeles County",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["apple", "peach", "cherry", "apricot", "pear"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'twin_hill_ranch',
    name: "Twin Hill Ranch",
    website: "https://www.localharvest.org/twin-hill-ranch-M53956",
    stateCode: 'CA',
    city: "Sebastopol",
    county: "Sonoma County",
    growingRegion: 'sonoma_ca',
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["apple"],
    features: ["established_60+ years"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'schmidt_road_ranch',
    name: "Schmidt Road Ranch",
    website: "https://www.localharvest.org/schmidt-road-ranch-M31189",
    stateCode: 'CA',
    city: "Sebastopol",
    county: "Sonoma County",
    growingRegion: 'sonoma_ca',
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["apple", "berry_blackberry"],
    features: ["established_Trees from 1887"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'solana_gold_organics__appleseed_orchards',
    name: "Solana Gold Organics / Appleseed Orchards",
    website: "https://www.localharvest.org/solana-gold-organics-appleseed-orchards-M69604",
    stateCode: 'CA',
    city: "Sebastopol",
    county: "Sonoma County",
    growingRegion: 'sonoma_ca',
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["apple"],
    features: ["established_Since 1979", "organic_practices"],
    certifications: ["usda_organic"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'high_ground_organics',
    name: "High Ground Organics",
    website: "https://www.localharvest.org/high-ground-organics-M519",
    stateCode: 'CA',
    city: "Watsonville",
    county: "Santa Cruz County",
    growingRegion: 'salinas_valley_ca',
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["berry_blueberry", "vegetables"],
    features: ["organic_practices"],
    certifications: ["usda_organic"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'ela_family_farms',
    name: "Ela Family Farms",
    stateCode: 'CO',
    city: "Hotchkiss",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["peach", "apple", "pear", "cherry", "berries", "tomato"],
    features: ["organic_practices"],
    certifications: ["usda_organic"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'tate_orchards',
    name: "Tate Orchards",
    stateCode: 'CO',
    city: "Palisade",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["peach"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'rancho_durazno',
    name: "Rancho Durazno",
    stateCode: 'CO',
    city: "Palisade",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["cherry", "apricot", "plum", "peach"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'simplygrown',
    name: "SimplyGrown",
    stateCode: 'CO',
    city: "Western CO",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["peach"],
    features: ["organic_practices"],
    certifications: ["usda_organic"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'borden_farms',
    name: "Borden Farms",
    stateCode: 'CO',
    city: "Uncompahgre Valley",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["vegetable", "fruit"],
    features: ["organic_practices"],
    certifications: ["usda_organic"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'hotchkiss_family_orchard',
    name: "Hotchkiss Family Orchard",
    stateCode: 'CO',
    city: "Hotchkiss",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["cherry", "peach", "plum", "apple"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'autumn_harvest_orchard',
    name: "Autumn Harvest Orchard",
    stateCode: 'CT',
    city: "Norfolk",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["apple", "pear", "nectarine", "blueberry", "chestnut", "raspberry"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'maple_bank_farm',
    name: "Maple Bank Farm",
    stateCode: 'CT',
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["apple", "blueberry", "greens"],
    features: ["established_1730"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'easy_pickin_s_orchard',
    name: "Easy Pickin's Orchard",
    stateCode: 'CT',
    city: "Enfield",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["vegetable", "fruit", "strawberry", "blueberry"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'sullivan_farm',
    name: "Sullivan Farm",
    stateCode: 'CT',
    city: "New Milford",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["vegetable", "berries", "maple_syrup"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'fifer_orchards',
    name: "Fifer Orchards",
    stateCode: 'DE',
    city: "Camden-Wyoming",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["strawberry", "peach", "blueberry", "apple", "pumpkin"],
    features: ["established_1919"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'north_star_orchard',
    name: "North Star Orchard",
    stateCode: 'DE',
    city: "Newark area",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["apple", "peach", "plum", "asian_pear"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'kingsley_orchards',
    name: "Kingsley Orchards",
    stateCode: 'DE',
    city: "Felton",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["blueberry"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'dittmar_family_farms',
    name: "Dittmar Family Farms",
    stateCode: 'DE',
    city: "Felton",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["vegetable"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'the_orange_shop',
    name: "The Orange Shop",
    website: "https://www.localharvest.org/the-orange-shop-M21401",
    stateCode: 'FL',
    city: "Citra",
    county: "Marion County",
    growingRegion: 'central_fl',
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["citrus_orange", "citrus_grapefruit", "citrus_tangerine"],
    features: ["established_1936", "organic_practices", "ipm"],
    certifications: ["usda_organic"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'parkesdale_farm_market',
    name: "Parkesdale Farm Market",
    website: "https://www.localharvest.org/parkesdale-farm-market-M52329",
    stateCode: 'FL',
    city: "Plant City",
    county: "Hillsborough County",
    growingRegion: 'plant_city_fl',
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["strawberry", "citrus_orange", "tomato"],
    features: ["established_1956"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'jaemor_farms',
    name: "Jaemor Farms",
    website: "https://www.localharvest.org/jaemor-farms-M55894",
    stateCode: 'GA',
    city: "Alto",
    county: "Habersham County",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["peach", "apple", "strawberry"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'pearson_farm',
    name: "Pearson Farm",
    website: "https://www.localharvest.org/pearson-farm-M45517",
    stateCode: 'GA',
    city: "Fort Valley",
    county: "Peach County",
    growingRegion: 'middle_ga',
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["peach", "pecan"],
    features: ["established_5 generations (100+ years)"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'grier_orchard',
    name: "Grier Orchard",
    stateCode: 'GA',
    city: "Northeast Georgia",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["peach"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'la_iku_organic_farm',
    name: "La'iku Organic Farm",
    stateCode: 'HI',
    city: "Mauna Loa slopes",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["tropical_fruit"],
    features: ["organic_practices"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'cito_farm',
    name: "CITO Farm",
    stateCode: 'HI',
    city: "Big Island",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["lychee", "longan"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'hamakua_liquid_gold',
    name: "Hamakua Liquid Gold",
    stateCode: 'HI',
    city: "Hamakua Coast",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["honey"],
    features: ["organic_practices"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'hawaii_ginger_farm',
    name: "Hawaii Ginger Farm",
    stateCode: 'HI',
    city: "Big Island",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["ginger", "turmeric"],
    features: ["organic_practices"],
    certifications: ["usda_organic"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'iowa_grown_market',
    name: "Iowa Grown Market",
    stateCode: 'IA',
    city: "Iowa City/Solon",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["vegetable", "fruit", "mushroom", "flower"],
    features: ["organic_practices"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'rolling_acres_farm',
    name: "Rolling Acres Farm",
    stateCode: 'IA',
    city: "Avoca",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["vegetable", "fruit"],
    features: ["organic_practices"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'botna_burrow',
    name: "Botna Burrow",
    stateCode: 'IA',
    city: "Hancock",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["vegetable", "herbs"],
    features: ["organic_practices"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'iowana_farm',
    name: "Iowana Farm",
    stateCode: 'IA',
    city: "Loess Hills",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["vegetable", "herbs"],
    features: ["organic_practices"],
    certifications: ["usda_organic"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'full_circle_farm',
    name: "Full Circle Farm",
    stateCode: 'ID',
    city: "Victor",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["vegetable"],
    features: ["organic_practices"],
    certifications: ["usda_organic"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'earthly_delights_farm',
    name: "Earthly Delights Farm",
    stateCode: 'ID',
    city: "Boise",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["vegetable", "fruit", "herbs", "flower"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'idaho_small_fruits_farm',
    name: "Idaho Small Fruits Farm",
    stateCode: 'ID',
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["strawberry", "raspberry", "vegetable", "flower"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'woodstock_apple_orchard',
    name: "Woodstock Apple Orchard",
    stateCode: 'IL',
    city: "Woodstock",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["apple", "pumpkin"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'harvard_apple_orchard',
    name: "Harvard Apple Orchard",
    stateCode: 'IL',
    city: "Harvard",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["apple"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'stade_s_farm__market',
    name: "Stade's Farm & Market",
    stateCode: 'IL',
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["apple", "vegetable"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'larson_s_family_farm',
    name: "Larson's Family Farm",
    stateCode: 'IL',
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["pumpkin", "christmas_tree"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'plow_creek_farm',
    name: "Plow Creek Farm",
    stateCode: 'IL',
    city: "Chicagoland area",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["berries", "vegetable"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'garden_patch_farms',
    name: "Garden Patch Farms",
    stateCode: 'IL',
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["apple", "peach", "plum", "pear", "blackberry", "strawberry", "raspberry"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'orchard_ridge_farms',
    name: "Orchard Ridge Farms",
    stateCode: 'IL',
    city: "Rockton",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["apple"],
    features: ["organic_practices"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'clark_s_berry_farm',
    name: "Clark's Berry Farm",
    stateCode: 'IN',
    city: "North Vernon",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["strawberry", "raspberry", "blueberry", "blackberry"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'cedar_creek_produce',
    name: "Cedar Creek Produce",
    stateCode: 'IN',
    city: "Leo",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["strawberry", "raspberry", "blueberry", "blackberry"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'tanglewood_berry_farm',
    name: "Tanglewood Berry Farm",
    stateCode: 'IN',
    city: "Fort Wayne",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["blueberry", "strawberry"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'tuttle_orchards',
    name: "Tuttle Orchards",
    stateCode: 'IN',
    city: "Indianapolis area",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["apple", "pumpkin"],
    features: ["established_1928"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'small_apple_farm__winery',
    name: "Small Apple Farm & Winery",
    stateCode: 'IN',
    city: "Peru",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["apple"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'berry_goods_farm',
    name: "Berry Goods Farm",
    stateCode: 'IN',
    city: "Indianapolis area",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["strawberry", "vegetable"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'wabash_view_farm',
    name: "Wabash View Farm",
    stateCode: 'IN',
    city: "West Lafayette",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["vegetable", "fruit"],
    features: ["established_2020"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'chautauqua_hills_farm',
    name: "Chautauqua Hills Farm",
    stateCode: 'KS',
    city: "Sedan",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["vegetable", "fruit"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'grant_creek_ranch',
    name: "Grant Creek Ranch",
    stateCode: 'KS',
    county: "Chautauqua County",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["beef"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'hickory_grove_farm',
    name: "Hickory Grove Farm",
    stateCode: 'KY',
    county: "Shelby County",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["vegetable"],
    features: ["established_1780", "organic_practices"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'georgetown_u_pick',
    name: "Georgetown U-Pick",
    stateCode: 'KY',
    city: "Georgetown",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["strawberry", "blackberry", "raspberry", "vegetable"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'back_to_the_garden',
    name: "Back to the Garden",
    stateCode: 'KY',
    county: "Madison County",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["vegetable", "berries", "ginger"],
    features: ["organic_practices"],
    certifications: ["usda_organic"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'warren_county_blueberry_farm',
    name: "Warren County Blueberry Farm",
    stateCode: 'KY',
    county: "Warren County",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["blueberry", "strawberry", "blackberry"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'coulter_s_good_earth_farm',
    name: "Coulter's Good Earth Farm",
    stateCode: 'KY',
    city: "Bluegrass Region",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["vegetable", "fruit"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'stonewall_apiaries',
    name: "Stonewall Apiaries",
    stateCode: 'LA',
    city: "Shreveport area",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["honey"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'nw_louisiana_dairy',
    name: "NW Louisiana Dairy",
    stateCode: 'LA',
    city: "Northwest LA",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["dairy", "eggs"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'pearl_river_farms',
    name: "Pearl River Farms",
    stateCode: 'LA',
    city: "Pearl River area",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["vegetable", "fruit"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'tougas_family_farm',
    name: "Tougas Family Farm",
    stateCode: 'MA',
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["strawberry", "blueberry", "cherry", "raspberry", "peach", "plum", "apple", "pumpkin"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'westward_orchards',
    name: "Westward Orchards",
    stateCode: 'MA',
    city: "Harvard",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["blueberry", "peach", "pear", "plum", "apple", "tomato"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'blackstone_valley_farm',
    name: "Blackstone Valley Farm",
    stateCode: 'MA',
    city: "Blackstone Valley",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["strawberry", "blueberry", "raspberry", "apple", "corn", "vegetable"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'parlee_farms',
    name: "Parlee Farms",
    stateCode: 'MA',
    city: "Tyngsboro",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["apple", "blueberry", "pumpkin"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'ward_s_berry_farm',
    name: "Ward's Berry Farm",
    stateCode: 'MA',
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["berries", "vegetable", "fruit"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'baugher_s_orchard__farm',
    name: "Baugher's Orchard & Farm",
    stateCode: 'MD',
    city: "Westminster",
    county: "Carroll County",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["strawberry", "cherry", "peach", "plum", "nectarine", "apple", "pumpkin"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'hybridoma_organic_fruit_farm',
    name: "Hybridoma Organic Fruit Farm",
    stateCode: 'MD',
    city: "Baldwin",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["blueberry", "blackberry", "raspberry"],
    features: ["organic_practices"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'rock_hill_orchard',
    name: "Rock Hill Orchard",
    stateCode: 'MD',
    county: "Montgomery County",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["strawberry", "peach", "apple", "pumpkin"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'redemption_farms',
    name: "Redemption Farms",
    stateCode: 'MD',
    city: "Denton",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["apple"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'weber_s_farm',
    name: "Weber's Farm",
    stateCode: 'MD',
    city: "Parkville",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["apple", "vegetable"],
    features: ["established_1920"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'shlagel_farms',
    name: "Shlagel Farms",
    stateCode: 'MD',
    city: "Waldorf",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["vegetable", "fruit"],
    features: ["established_1920"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'mcdougal_orchards',
    name: "McDougal Orchards",
    stateCode: 'ME',
    city: "Sanford",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["apple"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'libby_and_son_u_picks',
    name: "Libby and Son U-Picks",
    stateCode: 'ME',
    city: "Southern ME",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["blueberry", "apple", "pumpkin"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'spiller_farm',
    name: "Spiller Farm",
    stateCode: 'ME',
    city: "Wells",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["strawberry", "raspberry", "blueberry", "apple", "pumpkin"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'the_berry_best_farm',
    name: "The Berry Best Farm",
    stateCode: 'ME',
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["blueberry", "raspberry", "peach"],
    features: ["established_1950"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'hildebrand_fruit_farms',
    name: "Hildebrand Fruit Farms",
    website: "https://www.localharvest.org/hildebrand-fruit-farms-M76711",
    stateCode: 'MI',
    city: "Berrien Springs",
    county: "Berrien County",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["apple", "peach", "cherry_tart", "pear"],
    features: ["established_4th generation"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'royal_farms_inc',
    name: "Royal Farms, Inc.",
    website: "https://www.localharvest.org/royal-farms-inc-M18262",
    stateCode: 'MI',
    city: "Atwood",
    county: "Charlevoix County",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["cherry_tart", "cherry_sweet", "peach", "apple"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'springhope_farm',
    name: "Springhope Farm",
    website: "https://www.localharvest.org/springhope-farm-M10803",
    stateCode: 'MI',
    city: "Galien",
    county: "Berrien County",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["cherry_sweet", "peach", "apple"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'understory_farm_and_orchard',
    name: "Understory Farm and Orchard",
    website: "https://www.localharvest.org/understory-farm-and-orchard-M62397",
    stateCode: 'MI',
    city: "Bangor",
    county: "Van Buren County",
    growingRegion: 'southwest_mi',
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["apple", "cherry_tart", "berry_blueberry", "berry_raspberry", "berry_strawberry"],
    features: ["organic_practices"],
    certifications: ["usda_organic"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'mcmanus_southview_orchards_farm_market',
    name: "McManus Southview Orchards/Farm Market",
    website: "https://www.localharvest.org/mcmanus-southview-orchards-farm-market-M51919",
    stateCode: 'MI',
    city: "Traverse City",
    county: "Grand Traverse County",
    growingRegion: 'traverse_city_mi',
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["cherry_sweet", "cherry_tart", "berry_blueberry", "peach", "apple"],
    features: ["established_60+ years"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'michigan_farm_fresh_produce',
    name: "Michigan Farm Fresh Produce",
    website: "https://www.localharvest.org/michigan-farm-fresh-produce-M50043",
    stateCode: 'MI',
    city: "Clare",
    county: "Clare County",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["apple", "berry_blueberry", "cherry_sweet", "cherry_tart", "peach", "berry_strawberry"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'king_orchards',
    name: "King Orchards",
    stateCode: 'MI',
    city: "Central Lake",
    county: "Antrim County",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["cherry_tart", "cherry_sweet", "apple", "peach"],
    features: ["established_45+ years"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'santucci_farm',
    name: "Santucci Farm",
    stateCode: 'MI',
    city: "Traverse City",
    county: "Grand Traverse County",
    growingRegion: 'traverse_city_mi',
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["cherry_sweet", "cherry_tart"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'rennie_orchards',
    name: "Rennie Orchards",
    stateCode: 'MI',
    city: "Williamsburg",
    county: "Grand Traverse County",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["cherry_sweet", "cherry_tart", "apple", "peach"],
    features: ["established_Since 1938"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'reenders_blueberry_farm',
    name: "Reenders Blueberry Farm",
    stateCode: 'MI',
    city: "West Olive",
    county: "Ottawa County",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["berry_blueberry", "cherry", "peach", "berry_raspberry", "berry_strawberry"],
    features: ["established_4th generation since 1956"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'good_nature_farms',
    name: "Good Nature Farms",
    stateCode: 'MI',
    city: "Kewadin",
    county: "Grand Traverse County",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["apple", "peach", "cherry_tart"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'gallagher_farm_market',
    name: "Gallagher Farm Market",
    stateCode: 'MI',
    city: "Traverse City",
    county: "Grand Traverse County",
    growingRegion: 'traverse_city_mi',
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["cherry"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'the_honeyberry_farm',
    name: "The Honeyberry Farm",
    stateCode: 'MN',
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["honeyberry", "cherry", "saskatoon", "currant", "gooseberry", "kiwi"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'abbies_acres_berry_farm',
    name: "Abbies Acres Berry Farm",
    stateCode: 'MN',
    city: "Minnesota Northland",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["maple_syrup", "berries"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'white_pine_berry_farm',
    name: "White Pine Berry Farm",
    stateCode: 'MN',
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["strawberry", "raspberry", "pumpkin", "vegetable"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'blueberry_fields_of_stillwater',
    name: "Blueberry Fields of Stillwater",
    stateCode: 'MN',
    city: "Stillwater",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["blueberry"],
    features: ["organic_practices"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'twin_oaks_orchard',
    name: "Twin Oaks Orchard",
    stateCode: 'MN',
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["apple", "vegetable"],
    features: ["organic_practices"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'thierbach_orchards__berry_farm',
    name: "Thierbach Orchards & Berry Farm",
    stateCode: 'MO',
    city: "Marthasville",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["strawberry", "blueberry", "cherry", "peach", "blackberry", "apple"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'sunshine_valley_farm',
    name: "Sunshine Valley Farm",
    stateCode: 'MO',
    city: "Rogersville",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["blueberry", "raspberry", "blackberry", "peach", "apple"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'historic_weston_orchard_and_vineyard',
    name: "Historic Weston Orchard and Vineyard",
    stateCode: 'MO',
    city: "Weston",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["strawberry", "cherry", "peach", "blackberry", "apple"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'bates_city_farm',
    name: "Bates City Farm",
    stateCode: 'MO',
    city: "Bates City",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["strawberry", "cherry", "blueberry", "raspberry", "gooseberry", "peach", "blackberry", "plum", "pear", "apple", "asian_pear"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'chesterfield_berry_farm',
    name: "Chesterfield Berry Farm",
    stateCode: 'MO',
    city: "Chesterfield/St. Louis area",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["strawberry", "blueberry", "blackberry", "raspberry", "gooseberry", "cherry", "peach", "apple"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'farmington_organic_orchard',
    name: "Farmington Organic Orchard",
    stateCode: 'MO',
    city: "Farmington",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["peach", "apple"],
    features: ["organic_practices"],
    certifications: ["usda_organic"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'madison_growers',
    name: "Madison Growers",
    stateCode: 'MS',
    city: "Madison",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["vegetable"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'homestead_farms',
    name: "Homestead Farms",
    stateCode: 'MS',
    city: "Hernando",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["vegetable", "plant"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'hopes_produce',
    name: "Hopes Produce",
    stateCode: 'MS',
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["vegetable", "herbs", "flower"],
    features: ["established_1975"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'cloud_nine_farm',
    name: "Cloud Nine Farm",
    stateCode: 'MT',
    city: "Wilsall",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["vegetable", "fruit", "herbs"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'flathead_lake_cherries',
    name: "Flathead Lake Cherries",
    stateCode: 'MT',
    city: "Flathead Valley",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["cherry", "apple"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'happy_acres_farm',
    name: "Happy Acres Farm",
    website: "https://www.localharvest.org/happy-acres-farm-llc-M41114",
    stateCode: 'NC',
    city: "Roanoke Rapids",
    county: "Halifax County",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["strawberry", "blueberry", "blackberry", "peach", "melon"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'hill_s_orchard_and_vineyard',
    name: "Hill's Orchard and Vineyard",
    website: "https://www.localharvest.org/hills-orchard-and-vineyard-M3997",
    stateCode: 'NC',
    city: "Trinity",
    county: "Randolph County",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["apple", "blueberry", "plum", "peach", "muscadine"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'windy_knoll_farm',
    name: "Windy Knoll Farm",
    website: "https://www.localharvest.org/windy-knoll-farm-M59688",
    stateCode: 'NC',
    city: "Gibsonville",
    county: "Guilford County",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["apple", "pear", "muscadine", "fig", "persimmon", "pawpaw", "chestnut"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'many_rivers_farm',
    name: "Many Rivers Farm",
    website: "https://www.localharvest.org/many-rivers-farm-M23301",
    stateCode: 'NC',
    city: "Durham area",
    county: "Orange County",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["apple", "peach", "asian_pear", "blackberry"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'blueberry_thrill_farms',
    name: "Blueberry Thrill Farms",
    website: "https://www.localharvest.org/blueberry-thrill-farms-M3928",
    stateCode: 'NC',
    city: "Burlington",
    county: "Alamance County",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["blueberry", "blackberry", "apple"],
    features: ["established_1982"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'brushy_mountain_berry_farm',
    name: "Brushy Mountain Berry Farm",
    website: "https://www.localharvest.org/brushy-mountain-berry-farm-M11426",
    stateCode: 'NC',
    city: "Wilkesboro area",
    county: "Wilkes County",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["blueberry", "blackberry", "raspberry"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'c_v_pilson_farm',
    name: "C.V. Pilson Farm",
    website: "https://www.localharvest.org/cv-pilson-farm-M52891",
    stateCode: 'NC',
    city: "Cameron",
    county: "Moore County",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["sweet_potato", "strawberry", "blueberry", "blackberry", "apple", "peach"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'cedar_grove_blueberry_farm',
    name: "Cedar Grove Blueberry Farm",
    website: "https://www.localharvest.org/cedar-grove-blueberry-farm-M71892",
    stateCode: 'NC',
    city: "Cedar Grove",
    county: "Orange County",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["blueberry"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'timberwood_organics',
    name: "Timberwood Organics",
    website: "https://www.localharvest.org/timberwood-organics-M4016",
    stateCode: 'NC',
    city: "Efland",
    county: "Orange County",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["vegetable", "herbs", "melon"],
    features: ["established_1998", "organic_practices"],
    certifications: ["usda_organic"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'ten_mothers_farm',
    name: "Ten Mothers Farm",
    website: "https://www.localharvest.org/ten-mothers-farm-M67612",
    stateCode: 'NC',
    city: "Cedar Grove",
    county: "Orange County",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["vegetable"],
    features: ["established_2015"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'lake_ida_apple_farm',
    name: "Lake Ida Apple Farm",
    stateCode: 'ND',
    city: "Fargo area",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["apple", "crabapple"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'third_generation_family_farm',
    name: "Third Generation Family Farm",
    stateCode: 'ND',
    city: "Fargo",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["strawberry", "watermelon", "muskmelon", "vegetable"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'north_dakota_berry_farm',
    name: "North Dakota Berry Farm",
    stateCode: 'ND',
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["honeyberry", "aronia", "vegetable"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'fertile_ground_farms',
    name: "Fertile Ground Farms",
    stateCode: 'NE',
    city: "Blair",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["vegetable", "fruit"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'shadow_brook_farm',
    name: "Shadow Brook Farm",
    stateCode: 'NE',
    city: "Lincoln",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["vegetable"],
    features: ["established_1996"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'robinette_farms',
    name: "Robinette Farms",
    stateCode: 'NE',
    city: "Martell",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["vegetable"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'west_end_farm',
    name: "West End Farm",
    stateCode: 'NE',
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["vegetable", "berries", "melon"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'alyson_s_orchard',
    name: "Alyson's Orchard",
    stateCode: 'NH',
    city: "Walpole",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["apple", "peach", "plum", "pear", "nectarine", "berries"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'grounding_stone_farm',
    name: "Grounding Stone Farm",
    stateCode: 'NH',
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["blueberry"],
    features: ["organic_practices"],
    certifications: ["usda_organic"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'grandpa_s_farm',
    name: "Grandpa's Farm",
    stateCode: 'NH',
    city: "Loudon",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["blueberry"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'heron_pond_farm',
    name: "Heron Pond Farm",
    stateCode: 'NH',
    city: "South Hampton",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["vegetable", "fruit", "flower"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'millville_berry_farm',
    name: "Millville Berry Farm",
    stateCode: 'NJ',
    city: "Millville",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["asparagus", "strawberry", "blueberry", "peach", "cherry", "corn", "tomato"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'fruit_valley_farms',
    name: "Fruit Valley Farms",
    stateCode: 'NJ',
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["tomato", "corn", "peach", "nectarine", "plum", "cherry", "apple"],
    features: ["established_1965"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'bridgeton_orchard',
    name: "Bridgeton Orchard",
    stateCode: 'NJ',
    city: "Bridgeton",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["cherry", "raspberry", "blueberry", "peach", "plum", "blackberry", "pear", "nectarine", "apple", "pumpkin"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'old_orchard_farm',
    name: "Old Orchard Farm",
    stateCode: 'NJ',
    city: "Hackettstown",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["apple", "peach", "cherry", "pear", "plum", "blueberry", "blackberry", "raspberry"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'rosedale_farms',
    name: "Rosedale Farms",
    stateCode: 'NJ',
    city: "Hammonton",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["blueberry", "blackberry"],
    features: ["established_1996", "organic_practices"],
    certifications: ["usda_organic"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'dimeo_farms',
    name: "DiMeo Farms",
    stateCode: 'NJ',
    city: "Hammonton",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["blueberry"],
    features: ["organic_practices"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'chester_county_heirloom_farm',
    name: "Chester County Heirloom Farm",
    stateCode: 'NJ',
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["corn", "tomato"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'khalsa_family_farms',
    name: "Khalsa Family Farms",
    stateCode: 'NM',
    city: "Espanola Valley",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["vegetable"],
    features: ["organic_practices"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'j__l_gardens',
    name: "J & L Gardens",
    stateCode: 'NM',
    city: "Espanola",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["tomato", "vegetable"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'velarde_family_farms',
    name: "Velarde Family Farms",
    stateCode: 'NM',
    city: "Northern NM",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["chile", "pepper", "apple", "pear", "cherry", "plum", "apricot"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'skarsgard_farms',
    name: "Skarsgard Farms",
    stateCode: 'NM',
    city: "Albuquerque",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["vegetable"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'lattin_farms',
    name: "Lattin Farms",
    stateCode: 'NV',
    city: "Fallon",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["cantaloupe", "watermelon", "corn", "vegetable"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'kutavi_mystical_farm',
    name: "KuTaVi Mystical Farm",
    stateCode: 'NV',
    city: "Fallon",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["vegetable", "pumpkin", "watermelon", "cantaloupe", "berries", "lavender"],
    features: ["organic_practices"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'boulder_city_farm',
    name: "Boulder City Farm",
    stateCode: 'NV',
    city: "Boulder City",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["fig", "pomegranate", "grape", "vegetable"],
    features: ["organic_practices"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'brick_house_acres__garden_center__berry_farm',
    name: "Brick House Acres - Garden Center & Berry Farm",
    website: "https://www.localharvest.org/brick-house-acres-garden-center-berry-farm-M23256",
    stateCode: 'NY',
    city: "Frankfort",
    county: "Herkimer County",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["berry_raspberry", "berry_blueberry", "berry_blackberry"],
    features: ["organic_practices"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'strawberry_fields_u_pick_hydroponic_farm',
    name: "Strawberry Fields U-Pick Hydroponic Farm",
    website: "https://www.localharvest.org/strawberry-fields-u-pick-hydroponic-farm-M40446",
    stateCode: 'NY',
    city: "West Skaneateles",
    county: "Cayuga County",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["strawberry", "berry_raspberry", "berry_blueberry", "berry_blackberry"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'greg_s_u_pick_farm_market__csa',
    name: "Greg's U-Pick Farm Market & CSA",
    website: "https://www.localharvest.org/gregs-u-pick-farm-M4722",
    stateCode: 'NY',
    city: "Clarence Center",
    county: "Erie County",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["strawberry", "berry_blueberry", "berry_raspberry", "apple"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'samascott_orchards',
    name: "Samascott Orchards",
    website: "https://www.localharvest.org/samascott-orchards-M50360",
    stateCode: 'NY',
    city: "Kinderhook",
    county: "Columbia County",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["apple", "peach", "cherry", "berry_strawberry", "berry_raspberry", "berry_blueberry"],
    features: ["established_Early 1900s"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'soons_orchards',
    name: "Soons Orchards",
    website: "https://www.localharvest.org/soons-orchards-M28682",
    stateCode: 'NY',
    city: "New Hampton",
    county: "Orange County",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["apple", "peach", "nectarine"],
    features: ["established_Since 1910"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'fishkill_farms',
    name: "Fishkill Farms",
    website: "https://www.localharvest.org/fishkill-farms-M30739",
    stateCode: 'NY',
    city: "East Fishkill",
    county: "Dutchess County",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["apple", "peach", "vegetables"],
    features: ["established_Third generation", "organic_practices"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'berry_hill_farm',
    name: "Berry Hill Farm",
    website: "https://www.localharvest.org/berry-hill-farm-M21845",
    stateCode: 'NY',
    city: "Deansboro",
    county: "Oneida County",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["beef", "pork", "poultry"],
    features: ["organic_practices"],
    certifications: ["usda_organic"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'reeves_farms',
    name: "Reeves Farms",
    website: "https://www.localharvest.org/reeves-farms-M54321",
    stateCode: 'NY',
    city: "Baldwinsville",
    county: "Onondaga County",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["strawberry", "vegetables"],
    features: ["established_Over 100 years"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'terry_s_berry_farm',
    name: "Terry's Berry Farm",
    website: "https://www.localharvest.org/terrys-berry-farm-M65646",
    stateCode: 'NY',
    city: "Barton",
    county: "Tioga County",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["strawberry"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'trapani_farms',
    name: "Trapani Farms",
    website: "https://www.localharvest.org/trapani-farms-M62817",
    stateCode: 'NY',
    city: "Milton",
    county: "Ulster County",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["apple", "peach", "vegetables"],
    features: ["established_Since 1923, fourth generation"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'schultz_fruit_farm',
    name: "Schultz Fruit Farm",
    website: "https://www.localharvest.org/schultz-fruit-farm-M12960",
    stateCode: 'OH',
    city: "Chesterland",
    county: "Geauga County",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["apple", "peach", "berry_blackberry", "tomato"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'greenfield_berry_farm',
    name: "Greenfield Berry Farm",
    website: "https://www.localharvest.org/greenfield-berry-farm-M22048",
    stateCode: 'OH',
    city: "Peninsula",
    county: "Cuyahoga County",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["berry_blueberry"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'branstool_orchards',
    name: "Branstool Orchards",
    website: "https://www.localharvest.org/branstool-orchards-M71630",
    stateCode: 'OH',
    city: "Utica",
    county: "Delaware County",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["apple", "peach"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'monroe_s_orchard__farm_market_llc',
    name: "Monroe's Orchard & Farm Market, LLC",
    website: "https://www.localharvest.org/monroes-orchard-farm-market-llc-M18939",
    stateCode: 'OH',
    city: "Hiram",
    county: "Portage County",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["apple", "peach", "berry_strawberry"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'champaign_berry_farm',
    name: "Champaign Berry Farm",
    website: "https://www.localharvest.org/champaign-berry-farm-M25005",
    stateCode: 'OH',
    city: "Urbana",
    county: "Champaign County",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["berry_raspberry"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'granny_b_farm',
    name: "Granny B Farm",
    website: "https://www.localharvest.org/granny-b-farm-M74217",
    stateCode: 'OH',
    city: "Centerburg",
    county: "Delaware County",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["berry_strawberry", "tomato"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'ridgeview_farm',
    name: "Ridgeview Farm",
    website: "https://www.localharvest.org/ridgeview-farm-M37664",
    stateCode: 'OH',
    city: "Middlefield",
    county: "Geauga County",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["berry_strawberry"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'mitchell_s_berries_llc',
    name: "Mitchell's Berries, LLC",
    website: "https://www.localharvest.org/mitchells-berries-llc-also-known-as-mitchells-farm-M13037",
    stateCode: 'OH',
    city: "Plain City",
    county: "Union County",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["berry_strawberry", "tomato"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'pringles_orchard',
    name: "Pringles Orchard",
    website: "https://www.localharvest.org/pringles-orchard-M46474",
    stateCode: 'OH',
    city: "Goshen",
    county: "Clermont County",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["apple"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'dillon_fruit_farm',
    name: "Dillon Fruit Farm",
    website: "https://www.localharvest.org/dillon-fruit-farm-M68373",
    stateCode: 'OH',
    city: "Lisbon",
    county: "Columbiana County",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["berry_blueberry", "apple"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'earth7_farms',
    name: "Earth7 Farms",
    website: "https://www.localharvest.org/earth7-farms-M31768",
    stateCode: 'OH',
    city: "Olmsted Township",
    county: "Cuyahoga County",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["tomato"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'tillow_acres_farm',
    name: "Tillow Acres Farm",
    website: "https://www.localharvest.org/tillow-acres-farm-M79618",
    stateCode: 'OH',
    city: "Mount Victory",
    county: "Hardin County",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["berry_strawberry", "apple", "tomato"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'bartlesville_organic_farm',
    name: "Bartlesville Organic Farm",
    stateCode: 'OK',
    city: "Bartlesville",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["vegetable", "fruit"],
    features: ["organic_practices"],
    certifications: ["usda_organic"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'outback_farm',
    name: "Outback Farm",
    stateCode: 'OK',
    city: "Claremore",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["blueberry"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'gibson_gardens',
    name: "Gibson Gardens",
    stateCode: 'OK',
    city: "Muskogee",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["strawberry", "blackberry", "tomato"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'okc_family_farm',
    name: "OKC Family Farm",
    stateCode: 'OK',
    city: "Oklahoma City",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["vegetable", "fruit", "herbs", "eggs"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'sweet_oregon_farm',
    name: "Sweet Oregon Farm",
    stateCode: 'OR',
    city: "Hillsboro/Helvetia",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["apple", "pear", "plum", "cherry", "strawberry", "marionberry", "blueberry", "raspberry", "blackberry"],
    features: ["organic_practices"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'queener_farm',
    name: "Queener Farm",
    stateCode: 'OR',
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["apple", "peach", "pear", "currant", "gooseberry", "boysenberry", "aronia", "plum"],
    features: ["organic_practices"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'mcminnville_family_farm',
    name: "McMinnville Family Farm",
    stateCode: 'OR',
    city: "McMinnville",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["apple", "pear", "berries", "grape"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'vaughn_farm_and_orchard',
    name: "Vaughn Farm and Orchard",
    stateCode: 'OR',
    city: "Central Point",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["pear", "walnut", "apricot", "plum", "apple", "peach"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'barefoot_farm__flowers',
    name: "Barefoot Farm & Flowers",
    stateCode: 'OR',
    city: "Clatskanie",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["apple", "pear", "cherry", "plum", "peach"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'corvallis_organic_farm',
    name: "Corvallis Organic Farm",
    stateCode: 'OR',
    city: "Corvallis",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["apple", "pear", "blueberry", "raspberry"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'albany_corvallis_farm',
    name: "Albany-Corvallis Farm",
    stateCode: 'OR',
    city: "Albany",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["peach", "apple", "nectarine", "raspberry", "strawberry"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'boyer_nurseries__orchards',
    name: "Boyer Nurseries & Orchards",
    website: "https://www.localharvest.org/boyer-nurseries-orchards-inc-M38879",
    stateCode: 'PA',
    city: "Biglerville",
    county: "Adams County",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["cherry", "peach", "apple", "pear", "blueberry"],
    features: ["established_1900"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'daugherty_s_orchards',
    name: "Daugherty's Orchards",
    website: "https://www.localharvest.org/daughertys-orchards-M15201",
    stateCode: 'PA',
    city: "Murrysville",
    county: "Westmoreland County",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["apple", "vegetable"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'orchard_country_produce_and_fruit_farm',
    name: "Orchard Country Produce and Fruit Farm",
    website: "https://www.localharvest.org/orchard-country-produce-M72356",
    stateCode: 'PA',
    city: "Gardners",
    county: "Cumberland County",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["berries", "vegetable"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'pete_s_berry_farm',
    name: "Pete's Berry Farm",
    website: "https://www.localharvest.org/petes-berry-farm-M18623",
    stateCode: 'PA',
    city: "Sharpsville",
    county: "Mercer County",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["blueberry", "blackberry"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'the_berry_patch',
    name: "The Berry Patch",
    website: "https://www.localharvest.org/the-berry-patch-M3856",
    stateCode: 'PA',
    city: "Weedville",
    county: "Clearfield County",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["berries", "fruit"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'dawson_s_orchards',
    name: "Dawson's Orchards",
    website: "https://www.localharvest.org/dawsons-orchards-M10652",
    stateCode: 'PA',
    city: "Enon Valley",
    county: "Lawrence County",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["apple", "peach", "berries"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'post_apples_csa',
    name: "Post Apples CSA",
    website: "https://www.localharvest.org/post-apples-csa-M39401",
    stateCode: 'PA',
    city: "North East",
    county: "Erie County",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["apple", "vegetable"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'livengood_family_farm',
    name: "Livengood Family Farm",
    website: "https://www.localharvest.org/livengood-family-farm-M48791",
    stateCode: 'PA',
    city: "Lancaster",
    county: "Lancaster County",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["vegetable", "meat"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'yellow_hill_farm',
    name: "Yellow Hill Farm",
    website: "https://www.localharvest.org/yellow-hill-farm-M7658",
    stateCode: 'PA',
    city: "Harrisburg area",
    county: "Dauphin County",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["rhubarb", "blueberry", "blackberry"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'apple_castle',
    name: "Apple Castle",
    website: "https://www.localharvest.org/apple-castle-M5077",
    stateCode: 'PA',
    city: "Hermitage",
    county: "Mercer County",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["apple", "fruit"],
    features: ["established_1861"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'barden_family_orchard',
    name: "Barden Family Orchard",
    stateCode: 'RI',
    city: "North Scituate",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["apple", "peach", "nectarine", "plum", "raspberry", "blueberry"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'rocky_point_farm',
    name: "Rocky Point Farm",
    stateCode: 'RI',
    city: "Warwick",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["pawpaw", "blueberry"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'casey_farm',
    name: "Casey Farm",
    stateCode: 'RI',
    city: "West Kingston area",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["vegetable", "fruit"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'cedar_edge_farm',
    name: "Cedar Edge Farm",
    stateCode: 'RI',
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["vegetable", "fruit", "flower"],
    features: ["organic_practices"],
    certifications: ["usda_organic"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'garman_farm',
    name: "Garman Farm",
    stateCode: 'RI',
    city: "Middletown",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["vegetable", "fruit"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'bush_n_vine_farm',
    name: "Bush-N-Vine Farm",
    stateCode: 'SC',
    city: "York",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["strawberry", "blueberry", "peach", "blackberry", "tomato", "pumpkin"],
    features: ["established_1979"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'gurosik_s_berry_plantation',
    name: "Gurosik's Berry Plantation",
    stateCode: 'SC',
    city: "N. Augusta",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["strawberry", "blackberry"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'cottle_strawberry_farm',
    name: "Cottle Strawberry Farm",
    stateCode: 'SC',
    city: "Columbia",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["strawberry"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'anderson_berry_farm',
    name: "Anderson Berry Farm",
    stateCode: 'SC',
    city: "Anderson",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["strawberry", "blueberry", "raspberry", "blackberry", "peach", "muscadine"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'water_oak_farms',
    name: "Water Oak Farms",
    stateCode: 'SC',
    city: "Richburg",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["strawberry", "vegetable"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'eden_valley_apple_orchard',
    name: "Eden Valley Apple Orchard",
    stateCode: 'SD',
    city: "Loess Hills",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["apple", "aronia"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'berrybrook_u_pick',
    name: "Berrybrook U-Pick",
    stateCode: 'SD',
    city: "Vermillion area",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["strawberry", "raspberry"],
    features: ["organic_practices"],
    certifications: ["usda_organic"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'brookings_apple_farm',
    name: "Brookings Apple Farm",
    stateCode: 'SD',
    city: "Brookings",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["apple", "pumpkin"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'custer_farmers_market_farms',
    name: "Custer Farmers Market Farms",
    stateCode: 'SD',
    city: "Custer",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["vegetable", "fruit"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'walton_s_hill_farm',
    name: "Walton's Hill Farm",
    stateCode: 'TN',
    city: "near Springfield",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["blueberry", "strawberry", "blackberry", "muscadine", "apple", "mulberry"],
    features: ["organic_practices"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'valley_home_farm',
    name: "Valley Home Farm",
    stateCode: 'TN',
    city: "Wartrace",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["strawberry", "tomato", "blueberry", "blackberry"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'allenbrooke_farms',
    name: "Allenbrooke Farms",
    stateCode: 'TN',
    city: "Spring Hill",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["strawberry", "pumpkin", "flower"],
    features: ["organic_practices"],
    certifications: ["usda_organic"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'tn_u_pick_farm',
    name: "TN U-Pick Farm",
    stateCode: 'TN',
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["strawberry", "blackberry", "peach", "apple", "vegetable"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'south_tex_organics_lc',
    name: "South Tex Organics, LC",
    stateCode: 'TX',
    city: "Mission",
    county: "Hidalgo County",
    growingRegion: 'rio_grande_tx',
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["citrus_grapefruit", "citrus_orange"],
    features: ["organic_practices"],
    certifications: ["usda_organic"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'triple_j_organics_llc',
    name: "Triple J Organics, LLC",
    website: "https://www.localharvest.org/triple-j-organics-llc-M75226",
    stateCode: 'TX',
    city: "Mission",
    county: "Hidalgo County",
    growingRegion: 'rio_grande_tx',
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["citrus_orange", "citrus_grapefruit"],
    features: ["organic_practices"],
    certifications: ["usda_organic"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'winter_sweetz',
    name: "Winter Sweetz",
    stateCode: 'TX',
    city: "Mission",
    county: "Hidalgo County",
    growingRegion: 'rio_grande_tx',
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["citrus_grapefruit"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'acacia_farms',
    name: "Acacia Farms",
    website: "https://www.localharvest.org/acacia-farms-growing-in-harmony-with-nature-M30827",
    stateCode: 'TX',
    city: "Bayview",
    county: "Cameron County",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["citrus_grapefruit", "citrus_orange", "citrus_lemon", "peach"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'familias_productores_del_valle',
    name: "Familias Productores del Valle",
    website: "https://www.localharvest.org/familias-productores-del-valle-M12522",
    stateCode: 'TX',
    city: "San Juan",
    county: "Hidalgo County",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["citrus"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'jenschke_orchards',
    name: "Jenschke Orchards",
    stateCode: 'TX',
    city: "Fredericksburg",
    county: "Gillespie County",
    growingRegion: 'hill_country_tx',
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["peach"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'burg_s_corner_jimmy_duecker_orchards',
    name: "Burg's Corner (Jimmy Duecker Orchards)",
    stateCode: 'TX',
    city: "Stonewall",
    county: "Gillespie County",
    growingRegion: 'hill_country_tx',
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["peach", "pecan"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'vogel_orchard',
    name: "Vogel Orchard",
    stateCode: 'TX',
    city: "Stonewall",
    county: "Gillespie County",
    growingRegion: 'hill_country_tx',
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["peach"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'studebaker_farm',
    name: "Studebaker Farm",
    stateCode: 'TX',
    city: "Fredericksburg",
    county: "Gillespie County",
    growingRegion: 'hill_country_tx',
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["peach"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'royalty_pecan_farms',
    name: "Royalty Pecan Farms",
    website: "https://www.localharvest.org/royalty-pecan-farms-M53831",
    stateCode: 'TX',
    city: "Caldwell",
    county: "Burleson County",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["pecan"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'oliver_pecan_co_inc',
    name: "Oliver Pecan Co. Inc.",
    website: "https://www.localharvest.org/oliver-pecan-co-inc-M6658",
    stateCode: 'TX',
    city: "San Saba",
    county: "San Saba County",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["pecan"],
    features: ["established_6 generations"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'millican_pecan_co',
    name: "Millican Pecan Co",
    website: "https://www.localharvest.org/millican-pecan-co-M5639",
    stateCode: 'TX',
    city: "San Saba",
    county: "San Saba County",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["pecan"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'yahweh_s_all_natural_farm_and_garden',
    name: "Yahweh's All Natural Farm and Garden",
    website: "https://www.localharvest.org/yahweh-s-all-natural-farm-and-garden-M18621",
    stateCode: 'TX',
    city: "Harlingen",
    county: "Cameron County",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["vegetables"],
    features: ["organic_practices"],
    certifications: ["usda_organic"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'first_frost_farm',
    name: "First Frost Farm",
    stateCode: 'UT',
    city: "Northern UT",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["vegetable"],
    features: ["organic_practices"],
    certifications: ["usda_organic"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'cache_valley_family_farm',
    name: "Cache Valley Family Farm",
    stateCode: 'UT',
    city: "Cache Valley",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["vegetable", "wheat"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'utah_orchard_farm',
    name: "Utah Orchard Farm",
    stateCode: 'UT',
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["apple", "peach", "cherry", "grape", "vegetable"],
    features: ["organic_practices"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'westmoreland_berry_farm',
    name: "Westmoreland Berry Farm",
    stateCode: 'VA',
    city: "Oak Grove",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["strawberry", "blueberry", "blackberry", "raspberry", "peach"],
    features: ["established_1983"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'graves_mountain_farm',
    name: "Graves Mountain Farm",
    stateCode: 'VA',
    city: "Syria",
    county: "Madison County",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["apple", "peach"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'agriberry_farm',
    name: "Agriberry Farm",
    stateCode: 'VA',
    city: "Hanover",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["strawberry", "raspberry", "blackberry", "peach", "cherry", "blueberry", "muscadine"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'dickie_bros_orchard',
    name: "Dickie Bros. Orchard",
    stateCode: 'VA',
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["apple", "peach", "nectarine", "plum", "pear", "blackberry"],
    features: ["established_1752"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'chiles_peach_orchard',
    name: "Chiles Peach Orchard",
    stateCode: 'VA',
    county: "Albemarle County",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["strawberry", "peach", "apple", "pumpkin"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'mt_olympus_berry_farm',
    name: "Mt Olympus Berry Farm",
    stateCode: 'VA',
    city: "Ruther Glen",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["strawberry", "blueberry", "blackberry", "vegetable"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'the_market_at_grelen',
    name: "The Market at Grelen",
    stateCode: 'VA',
    city: "Somerset",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["berries", "peach", "apple"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'sweet_seasons_farm',
    name: "Sweet Seasons Farm",
    stateCode: 'VT',
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["apple", "blueberry", "raspberry", "strawberry", "pumpkin"],
    features: ["organic_practices"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'river_berry_farm',
    name: "River Berry Farm",
    stateCode: 'VT',
    city: "Fairfax",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["berries", "vegetable"],
    features: ["established_1992", "organic_practices"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'adam_s_berry_farm',
    name: "Adam's Berry Farm",
    stateCode: 'VT',
    city: "Intervale",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["strawberry", "blueberry", "raspberry", "grape", "gooseberry"],
    features: ["organic_practices"],
    certifications: ["usda_organic"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'mcilrath_family_farms',
    name: "McIlrath Family Farms",
    website: "https://www.localharvest.org/mcilrath-farm-market-produce-delivery-M73876",
    stateCode: 'WA',
    city: "Tieton",
    county: "Yakima County",
    growingRegion: 'yakima_valley_wa',
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["apple", "pear", "cherry", "peach"],
    features: ["established_1976"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'the_fallon_farm',
    name: "The Fallon Farm",
    stateCode: 'WA',
    city: "Lake Chelan",
    growingRegion: 'okanogan_wa',
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["cherry", "apple", "pear"],
    features: ["organic_practices"],
    certifications: ["usda_organic"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'central_washington_farm',
    name: "Central Washington Farm",
    stateCode: 'WA',
    city: "Yakima",
    growingRegion: 'yakima_valley_wa',
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["apple", "cherry", "blueberry"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'james_lake_farms',
    name: "James Lake Farms",
    website: "https://www.localharvest.org/james-lake-farms-M39852",
    stateCode: 'WI',
    city: "Three Lakes",
    county: "Oneida County",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["cranberry"],
    features: ["organic_practices"],
    certifications: ["usda_organic"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'appleberry_farm_llc',
    name: "Appleberry Farm LLC",
    website: "https://www.localharvest.org/appleberry-farm-llc-M7971",
    stateCode: 'WI',
    city: "Cross Plains",
    county: "Dane County",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["apple", "berry_strawberry"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'log_cabin_orchard',
    name: "Log Cabin Orchard",
    website: "https://www.localharvest.org/log-cabin-orchard-M12005",
    stateCode: 'WI',
    city: "Plymouth",
    county: "Sheboygan County",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["apple", "pear"],
    features: ["ipm"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'old_homestead_orchard',
    name: "Old Homestead Orchard",
    website: "https://www.localharvest.org/old-homestead-orchard-M40140",
    stateCode: 'WI',
    city: "Franksville",
    county: "Racine County",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["apple", "pear"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'brynteg_farm_llc',
    name: "BrynTeg Farm LLC",
    website: "https://www.localharvest.org/brynteg-farm-llc-M33073",
    stateCode: 'WI',
    city: "Oconomowoc",
    county: "Waukesha County",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["vegetables", "apple", "cherry"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'turkey_ridge_organic_orchard',
    name: "Turkey Ridge Organic Orchard",
    website: "https://www.localharvest.org/turkey-ridge-organic-orchard-M51829",
    stateCode: 'WI',
    city: "Gays Mills",
    county: "Crawford County",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["apple", "pear", "berry_raspberry"],
    features: ["organic_practices"],
    certifications: ["usda_organic"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'blue_roof_orchard',
    name: "Blue Roof Orchard",
    website: "https://www.localharvest.org/blue-roof-orchard-M9632",
    stateCode: 'WI',
    city: "Belmont",
    county: "Lafayette County",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["apple"],
    features: ["organic_practices"],
    certifications: ["usda_organic"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'silver_pond_farm',
    name: "Silver Pond Farm",
    website: "https://www.localharvest.org/silver-pond-farm-M74189",
    stateCode: 'WI',
    city: "Berlin",
    county: "Green Lake County",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["vegetables", "dairy", "beef"],
    features: ["organic_practices"],
    certifications: ["usda_organic"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'the_farmstead',
    name: "The Farmstead",
    website: "https://www.localharvest.org/the-farmstead-M74256",
    stateCode: 'WI',
    city: "Burlington",
    county: "Racine County",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["vegetables", "melon"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'white_pine_berry_farm',
    name: "White Pine Berry Farm",
    website: "https://www.localharvest.org/white-pine-berry-farm-M66482",
    stateCode: 'WI',
    city: "River Falls",
    county: "Pierce County",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["berry_strawberry", "berry_raspberry", "berry_blueberry"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'lindy_s_berries_inc',
    name: "Lindy's Berries, Inc.",
    website: "https://www.localharvest.org/lindys-berries-M11528",
    stateCode: 'WI',
    city: "Shell Lake",
    county: "Washburn County",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["berry_strawberry"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'blue_skies_farm_llc',
    name: "Blue Skies Farm LLC",
    website: "https://www.localharvest.org/blue-skies-farm-llc-M4040",
    stateCode: 'WI',
    city: "Brooklyn",
    county: "Dane County",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["berry_raspberry", "tomato"],
    features: ["organic_practices"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'harmony_valley_farm',
    name: "Harmony Valley Farm",
    website: "https://www.localharvest.org/harmony-valley-farm-M493",
    stateCode: 'WI',
    city: "Viroqua",
    county: "Vernon County",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["vegetables", "beef", "berry_strawberry"],
    features: ["organic_practices"],
    certifications: ["usda_organic"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'the_maple_dude',
    name: "The Maple Dude",
    website: "https://www.localharvest.org/the-maple-dude-M49123",
    stateCode: 'WI',
    city: "Granton",
    county: "Wood County",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["maple_syrup", "bison"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'inn_the_nook_farm',
    name: "Inn the Nook Farm",
    stateCode: 'WV',
    city: "Burnsville",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["apple"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'ohio_river_organic_farm',
    name: "Ohio River Organic Farm",
    stateCode: 'WV',
    city: "Parkersburg area",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["apple", "raspberry", "blueberry", "honey", "maple_syrup"],
    features: ["organic_practices"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'rainbow_hill_organic_farm',
    name: "Rainbow Hill Organic Farm",
    stateCode: 'WV',
    city: "Charles Town",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["vegetable"],
    features: ["organic_practices"],
    certifications: ["usda_organic"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'hampshire_county_farm',
    name: "Hampshire County Farm",
    stateCode: 'WV',
    county: "Hampshire County",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["beef", "chicken", "honey"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'powell_valley_farm',
    name: "Powell Valley Farm",
    stateCode: 'WY',
    city: "Powell",
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["vegetable", "fruit"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  },

  {
    id: 'wyoming_homestead',
    name: "Wyoming Homestead",
    stateCode: 'WY',
    roles: ['grower', 'retailer'],
    retailChannels: ['farmers_market', 'd2c'],
    products: ["vegetable", "beef"],
    verificationLevel: 'website_verified',
    dataSource: 'localharvest_2025_12_21_with_regions'
  }
]



// PACKINGHOUSE ENTITIES (2025-12-21 AGENT SWARM)
// =============================================================================

// Consolidated from 72-agent swarm research (10 JSON files)
// See: consolidated_packinghouses.json
// 303 packinghouses across all 50 states
// PACKINGHOUSE ENTITIES (Agent Swarm 2025-12-21)
// Total: 303 packinghouses

// PACKINGHOUSE ENTITIES - ENRICHED (2025-12-21)
// Total: 303 packinghouses with extracted attributes
// +149 data points: founded year, acreage, certifications, scale

// PACKINGHOUSE ENTITIES WITH GROWING REGIONS (2025-12-21)
// Total: 303 packinghouses
// With growing regions: 72

const PACKINGHOUSE_ENTITIES_2025: SupplyChainEntity[] = [
  {
    id: 'stemilt_growers',
    name: "Stemilt Growers",
    website: "https://www.stemilt.com",
    stateCode: 'WA',
    city: "Wenatchee",
    growingRegion: 'wenatchee_wa',
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["apple", "pear", "cherry", "stone fruit"],
    foundedYear: 1964,
    scaleIndicators: ["largest"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'mcdougall_and_sons',
    name: "McDougall & Sons",
    website: "https://www.cmiorchards.com",
    stateCode: 'WA',
    city: "Wenatchee",
    growingRegion: 'wenatchee_wa',
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["apple", "pear", "cherry"],
    foundedYear: 1976,
    acreage: 2200,
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'borton_fruit',
    name: "Borton Fruit",
    website: "https://bortonfruit.com",
    stateCode: 'WA',
    city: "Yakima",
    growingRegion: 'yakima_valley_wa',
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["apple", "pear", "cherry"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'allan_brothers',
    name: "Allan Brothers",
    website: "https://allanbrosfruit.com",
    stateCode: 'WA',
    city: "Naches",
    growingRegion: 'yakima_valley_wa',
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["apple", "cherry"],
    yearsInBusiness: 100,
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'domex_superfresh_growers',
    name: "Domex Superfresh Growers",
    website: "https://superfreshgrowers.com",
    stateCode: 'WA',
    city: "Yakima",
    growingRegion: 'yakima_valley_wa',
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["apple", "pear", "cherry", "blueberry", "kiwi berry"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'rainier_fruit_company',
    name: "Rainier Fruit Company",
    website: "https://waapple.org/suppliers/",
    stateCode: 'WA',
    city: "Brewster",
    growingRegion: 'okanogan_wa',
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["apple", "pear", "cherry"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'washington_fruit_growers',
    name: "Washington Fruit Growers",
    website: "https://washfruitgrowers.com",
    stateCode: 'WA',
    city: "Yakima",
    growingRegion: 'yakima_valley_wa',
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["apple"],
    foundedYear: 1916,
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'gebbers_farms',
    name: "Gebbers Farms",
    website: "https://gebbersfarms.com",
    stateCode: 'WA',
    city: "Cascade Range Base",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["apple", "cherry"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'starr_ranch_growers',
    name: "Starr Ranch Growers",
    website: "https://starranch.com",
    stateCode: 'WA',
    city: "Washington's apple country",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["apple", "pear", "cherry", "stone fruit"],
    foundedYear: 1934,
    scaleIndicators: ["leading"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'cmi_orchards',
    name: "CMI Orchards",
    website: "https://www.wagrown.com/wagrown-farms/farms/item/cmi-orchards",
    stateCode: 'WA',
    city: "Washington State",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["apple", "pear", "cherry"],
    scaleIndicators: ["largest"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'matson_fruit',
    name: "Matson Fruit",
    website: "http://matsonfruit.com",
    stateCode: 'WA',
    city: "Selah",
    growingRegion: 'yakima_valley_wa',
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["apple", "pear", "cherry"],
    yearsInBusiness: 100,
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'chelan_fresh_marketing',
    name: "Chelan Fresh Marketing",
    website: "https://chelanfresh.com",
    stateCode: 'WA',
    city: "Chelan",
    growingRegion: 'okanogan_wa',
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["apple", "cherry", "pear"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'apple_king',
    name: "Apple King",
    website: "https://www.appleking.com",
    stateCode: 'WA',
    city: "Yakima",
    growingRegion: 'yakima_valley_wa',
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["apple", "pear", "cherry"],
    foundedYear: 1914,
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'fowler_packing_company',
    name: "Fowler Packing Company",
    website: "https://fowlerpacking.com",
    stateCode: 'CA',
    city: "Fresno",
    growingRegion: 'central_valley_ca',
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["grape", "apricot", "mandarin orange", "nectarine", "peach", "plum", "pomegranate"],
    foundedYear: 1950,
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'bari_produce',
    name: "Bari Produce",
    website: "http://www.bariproduce.com",
    stateCode: 'CA',
    city: "Madera/Fresno County",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["apricot", "peach", "plum", "nectarine", "grape"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'trinity_fruit_company',
    name: "Trinity Fruit Company",
    website: "https://www.trinityfruit.com",
    stateCode: 'CA',
    city: "Fresno",
    growingRegion: 'central_valley_ca',
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["stone fruit", "citrus"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'sunnyside_packing_company',
    name: "Sunnyside Packing Company",
    website: "http://sunnysidepacking.com",
    stateCode: 'CA',
    city: "Fresno",
    growingRegion: 'central_valley_ca',
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["fresh fruit", "vegetable"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'family_tree_farms',
    name: "Family Tree Farms",
    website: "https://familytreefarms.com",
    stateCode: 'CA',
    city: "Reedley",
    growingRegion: 'central_valley_ca',
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["stone fruit", "grape", "citrus"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'giumarra_vineyards',
    name: "Giumarra Vineyards",
    website: "http://www.giumarravineyards.com",
    stateCode: 'CA',
    city: "Edison/Bakersfield",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["table grape"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'pandol_bros_inc',
    name: "Pandol Bros Inc",
    website: "https://www.producemarketguide.com/company/108248/pandol-bros-inc-hq",
    stateCode: 'CA',
    city: "Delano",
    growingRegion: 'central_valley_ca',
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["table grape"],
    scaleIndicators: ["leading"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'delano_farms',
    name: "Delano Farms",
    website: "https://www.delanofarms.com",
    stateCode: 'CA',
    city: "Delano",
    growingRegion: 'central_valley_ca',
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["table grape"],
    foundedYear: 1991,
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'four_star_fruit',
    name: "Four Star Fruit",
    website: "https://www.fourstarfruit.com",
    stateCode: 'CA',
    city: "Delano",
    growingRegion: 'central_valley_ca',
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["table grape"],
    foundedYear: 1987,
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'castle_rock_vineyards',
    name: "Castle Rock Vineyards",
    website: "http://www.castlerockvineyards.com",
    stateCode: 'CA',
    city: "Delano",
    growingRegion: 'central_valley_ca',
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["table grape"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'jasmine_vineyards',
    name: "Jasmine Vineyards",
    website: "https://jasminevineyards.com",
    stateCode: 'CA',
    city: "San Joaquin Valley",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["table grape"],
    foundedYear: 1947,
    scaleIndicators: ["largest"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'anthony_vineyards_inc',
    name: "Anthony Vineyards Inc",
    website: "https://cafreshfruit.com/membership/members-links/",
    stateCode: 'CA',
    city: "Bakersfield/Delano area",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["table grape", "stone fruit"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'lane_southern_orchards',
    name: "Lane Southern Orchards",
    website: "https://www.n-georgia.com/lane-packing-company.html",
    stateCode: 'GA',
    city: "Fort Valley",
    growingRegion: 'middle_ga',
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["peach", "pecan"],
    scaleIndicators: ["largest"],
    yearsInBusiness: 100,
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'pearson_farm',
    name: "Pearson Farm",
    website: "https://pearsonfarm.com",
    stateCode: 'GA',
    city: "Fort Valley",
    growingRegion: 'middle_ga',
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["peach", "pecan"],
    acreage: 1500,
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'dickey_farms',
    name: "Dickey Farms",
    website: "http://www.genuinega.com",
    stateCode: 'GA',
    city: "Musella",
    growingRegion: 'middle_ga',
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["peach"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'fitzgerald_fruit_farms',
    name: "Fitzgerald Fruit Farms",
    website: "http://www.genuinega.com",
    stateCode: 'GA',
    city: "Woodbury",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["peach"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'img_citrus',
    name: "IMG Citrus",
    website: "https://citrusindustry.net/2025/12/03/img-citrus-completes-packinghouse-consolidation/",
    stateCode: 'FL',
    city: "Vero Beach",
    growingRegion: 'indian_river_fl',
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["orange", "grapefruit", "citrus"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'dundee_citrus_growers_association',
    name: "Dundee Citrus Growers Association",
    website: "https://dun-d.com",
    stateCode: 'FL',
    city: "Dundee",
    growingRegion: 'central_fl',
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["orange", "grapefruit", "citrus"],
    foundedYear: 1924,
    acreage: 10000,
    scaleIndicators: ["largest"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'florida_classic_growers',
    name: "Florida Classic Growers",
    website: "https://flclassic.com",
    stateCode: 'FL',
    city: "Dundee",
    growingRegion: 'central_fl',
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["citrus", "blueberry", "peach"],
    foundedYear: 1924,
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'hollieanna_groves',
    name: "Hollieanna Groves",
    website: "https://www.hollieanna.com",
    stateCode: 'FL',
    city: "Maitland",
    growingRegion: 'central_fl',
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["orange", "grapefruit", "citrus"],
    foundedYear: 1954,
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'countryside_citrus',
    name: "Countryside Citrus",
    website: "https://www.countrysidecitrus.com",
    stateCode: 'FL',
    city: "Indian River Region",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["orange", "grapefruit"],
    scaleIndicators: ["leading"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'hyatt_fruit_company',
    name: "Hyatt Fruit Company",
    website: "https://www.hyattfruitco.com",
    stateCode: 'FL',
    city: "Vero Beach",
    growingRegion: 'indian_river_fl',
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["orange", "grapefruit", "honeybell"],
    foundedYear: 1946,
    yearsInBusiness: 75,
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'al_s_family_farms',
    name: "Al's Family Farms",
    website: "https://www.alsfamilyfarms.com",
    stateCode: 'FL',
    city: "Florida",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["grapefruit", "orange", "tangerine", "honeybell"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'lone_star_citrus_growers',
    name: "Lone Star Citrus Growers",
    website: "https://www.linkedin.com/company/lonestarcitrusgrowers",
    stateCode: 'TX',
    city: "Mission",
    growingRegion: 'rio_grande_tx',
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["grapefruit", "orange"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'rio_grande_juice_company',
    name: "Rio Grande Juice Company",
    website: "https://www.riograndejuice.com",
    stateCode: 'TX',
    city: "Mission",
    growingRegion: 'rio_grande_tx',
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["citrus juice"],
    foundedYear: 2015,
    scaleIndicators: ["largest"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'hudson_river_fruit_distributors',
    name: "Hudson River Fruit Distributors",
    website: "https://www.hudsonriverfruit.com",
    stateCode: 'NY',
    city: "Hudson Valley",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["apple"],
    acreage: 10000,
    scaleIndicators: ["largest"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'george_w_saulpaugh_and_son',
    name: "George W. Saulpaugh & Son",
    website: "https://www.saulpaughapples.com",
    stateCode: 'NY',
    city: "Hudson Valley",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["apple"],
    certifications: ["GlobalGAP"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'dressel_farms',
    name: "Dressel Farms",
    website: "https://www.applesfromny.com/food-service-retail/directories/",
    stateCode: 'NY',
    city: "Hudson Valley",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["apple"],
    acreage: 300,
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'apple_acres',
    name: "Apple Acres",
    website: "https://www.thepacker.com/news/produce-crops-news/packer-tech/apple-acres-opens-ny-packing-facility",
    stateCode: 'NY',
    city: "New York State",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["apple"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'fowler_farms',
    name: "Fowler Farms",
    website: "https://www.thepacker.com/article/fowler-farms-begins-major-expansion-0",
    stateCode: 'NY',
    city: "New York State",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["apple"],
    certifications: ["USDA_Organic"],
    acreage: 30,
    scaleIndicators: ["largest"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'applewood_fresh_growers_llc',
    name: "Applewood Fresh Growers LLC",
    website: "https://applewoodfresh.com",
    stateCode: 'MI',
    city: "Multiple locations",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["apple"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'ridgeking_apple_packing__heeren_brothers',
    name: "Ridgeking Apple Packing / Heeren Brothers",
    website: "https://www.goodfruit.com/packing-capacity-grows-in-michigan/",
    stateCode: 'MI',
    city: "Michigan",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["apple"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'underwood_fruit_and_warehouse_co',
    name: "Underwood Fruit and Warehouse Co",
    website: "https://underwoodfruit.com",
    stateCode: 'OR',
    city: "Hood River",
    growingRegion: 'hood_river_or',
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["pear", "apple", "cherry"],
    scaleIndicators: ["major"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'stadelman_fruit_llc',
    name: "Stadelman Fruit LLC",
    website: "https://www.chamberofcommerce.com/united-states/oregon/hood-river/fruit-and-vegetable-growers-and-shippers/5848845-stadelman-fruit-llc-pear-facility",
    stateCode: 'OR',
    city: "Hood River",
    growingRegion: 'hood_river_or',
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["pear"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'oregon_growers_and_shippers_llc',
    name: "Oregon Growers & Shippers LLC",
    website: "https://oregongrowers.com",
    stateCode: 'OR',
    city: "Hood River",
    growingRegion: 'hood_river_or',
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["apple", "pear", "cherry", "specialty food"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'pearl_s_place_fruit__viewmont_orchards',
    name: "Pearl's Place Fruit / Viewmont Orchards",
    website: "https://shop.pearlsplacefruit.com",
    stateCode: 'OR',
    city: "Hood River",
    growingRegion: 'hood_river_or',
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["apple", "pear"],
    foundedYear: 1901,
    acreage: 500,
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'diamond_fruit_growers',
    name: "Diamond Fruit Growers",
    website: "https://nwhort.org/packersshippersmarketers/",
    stateCode: 'OR',
    city: "Odell",
    growingRegion: 'hood_river_or',
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["pear", "apple", "cherry"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'rice_fruit_company',
    name: "Rice Fruit Company",
    website: "https://ricefruit.com",
    stateCode: 'PA',
    city: "Gardners",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["apple"],
    foundedYear: 1913,
    scaleIndicators: ["largest"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'bear_mountain_orchards',
    name: "Bear Mountain Orchards",
    website: "https://www.bearmountainorchards.com",
    stateCode: 'PA',
    city: "Aspers",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["peach", "apple", "nectarine"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'associated_citrus_packers_inc',
    name: "Associated Citrus Packers Inc",
    website: "https://www.manta.com/mb_45_C2094000_03/fresh_fruits_and_vegetables/arizona",
    stateCode: 'AZ',
    city: "Yuma",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["citrus"],
    yearsInBusiness: 48,
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'limoneira_company',
    name: "Limoneira Company",
    website: "https://www.yellowpages.com/yuma-az/citrus-growers",
    stateCode: 'AZ',
    city: "Yuma County",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["citrus"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'mission_citrus',
    name: "Mission Citrus",
    website: "https://www.yellowpages.com/yuma-az/citrus-growers",
    stateCode: 'AZ',
    city: "Yuma County",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["citrus"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'sun_pacific',
    name: "Sun Pacific",
    website: "https://sunpacific.com/",
    stateCode: 'CA',
    city: "Bakersfield",
    growingRegion: 'central_valley_ca',
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["citrus", "mandarins", "navel oranges", "valencia oranges", "lemons", "table grapes", "tomatoes"],
    acreage: 30000,
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'wonderful_citrus_packing_llc',
    name: "Wonderful Citrus Packing LLC",
    website: "https://www.wonderfulcitrus.com",
    stateCode: 'CA',
    city: "Delano",
    growingRegion: 'central_valley_ca',
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["mandarins", "navel oranges", "valencia oranges", "lemons", "limes", "grapefruit"],
    scaleIndicators: ["worlds_largest", "largest"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'grimmway_farms_inc',
    name: "Grimmway Farms Inc.",
    website: "https://www.grimmway.com",
    stateCode: 'CA',
    city: "Lamont",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["carrots", "organic vegetables"],
    acreage: 60000,
    scaleIndicators: ["worlds_largest", "largest"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'church_brothers_farms',
    name: "Church Brothers Farms",
    website: "https://www.churchbrothers.com",
    stateCode: 'CA',
    city: "Salinas",
    growingRegion: 'salinas_valley_ca',
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["lettuce", "salad mix", "broccoli", "green onions", "coleslaw", "romaine", "arugula", "organic greens", "spinach"],
    foundedYear: 1999,
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'tanimura_and_antle_corporation',
    name: "Tanimura & Antle Corporation",
    website: "https://www.taproduce.com",
    stateCode: 'CA',
    city: "Salinas",
    growingRegion: 'salinas_valley_ca',
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["lettuce", "iceberg", "romaine", "hydroponic boston lettuce"],
    foundedYear: 1982,
    acreage: 40000,
    scaleIndicators: ["largest"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'mann_packing_acquired_by_church_brothers_2025_formerly_fresh',
    name: "Mann Packing (acquired by Church Brothers 2025, formerly Fresh Del Monte)",
    website: "https://freshdelmonte.com",
    stateCode: 'CA',
    city: "Gonzales",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["vegetables", "fruits", "fresh-cut produce"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'oregon_berry_packing_inc',
    name: "Oregon Berry Packing, Inc.",
    website: "https://oregonberry.com",
    stateCode: 'OR',
    city: "Hillsboro",
    growingRegion: 'willamette_valley_or',
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["blueberries", "strawberries", "black raspberries"],
    certifications: ["USDA_Organic"],
    foundedYear: 1948,
    yearsInBusiness: 70,
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'naumes_inc',
    name: "Naumes, Inc.",
    website: "https://www.naumesinc.com",
    stateCode: 'OR',
    city: "Medford",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["pears", "apples"],
    scaleIndicators: ["largest"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'rio_fresh_inc',
    name: "Rio Fresh, Inc.",
    website: "https://riofresh.com",
    stateCode: 'TX',
    city: "Mission",
    growingRegion: 'rio_grande_tx',
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["vegetables", "produce"],
    certifications: ["GAP"],
    foundedYear: 1970,
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'growers_select_produce_inc',
    name: "Growers Select Produce Inc.",
    website: "https://www.groselpro.com",
    stateCode: 'TX',
    city: "Mission",
    growingRegion: 'rio_grande_tx',
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["watermelon"],
    foundedYear: 1987,
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'jandd_produce',
    name: "J&D Produce",
    stateCode: 'TX',
    city: "Edinburg",
    growingRegion: 'rio_grande_tx',
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["vegetables"],
    scaleIndicators: ["largest"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'frontera_produce',
    name: "Frontera Produce",
    stateCode: 'TX',
    city: "Edinburg",
    growingRegion: 'rio_grande_tx',
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["onions", "chiles", "vegetables"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'south_georgia_pecan_company',
    name: "South Georgia Pecan Company",
    website: "https://georgiapecan.com",
    stateCode: 'GA',
    city: "Valdosta",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["pecans"],
    foundedYear: 1913,
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'sunnyland_farms',
    name: "Sunnyland Farms",
    website: "https://www.sunnylandfarms.com",
    stateCode: 'GA',
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["pecans"],
    certifications: ["Kosher"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'farm_pak__barnes_farming',
    name: "Farm Pak / Barnes Farming",
    website: "https://www.farmpak.com",
    stateCode: 'NC',
    city: "Spring Hope",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["sweet potatoes"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'boyette_brothers_produce',
    name: "Boyette Brothers Produce",
    website: "https://www.boyettebrothersproduce.com",
    stateCode: 'NC',
    city: "Wilson",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["sweet potatoes"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'scott_farms',
    name: "Scott Farms",
    stateCode: 'NC',
    city: "Lucama",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["sweet potatoes"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'millstream_farms',
    name: "Millstream Farms",
    website: "http://sweetpotatoesnc.com",
    stateCode: 'NC',
    city: "Eastern NC",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["sweet potatoes"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'b_and_b_produce',
    name: "B & B Produce",
    stateCode: 'NC',
    city: "Benson",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["sweet potatoes"],
    certifications: ["GRASP"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'riveridge_produce_marketing',
    name: "Riveridge Produce Marketing",
    stateCode: 'MI',
    city: "Sparta",
    growingRegion: 'southwest_mi',
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["cherries", "apples"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'a_l_johnson_and_sons_inc',
    name: "A.L. Johnson & Sons, Inc.",
    stateCode: 'MI',
    city: "Suttons Bay",
    growingRegion: 'traverse_city_mi',
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["cherries", "apples"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'driscoll_s_inc',
    name: "Driscoll's, Inc.",
    website: "https://www.driscolls.com",
    stateCode: 'CA',
    city: "Watsonville",
    growingRegion: 'salinas_valley_ca',
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["strawberries", "blueberries", "raspberries", "blackberries"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'fresh_del_monte_produce_inc',
    name: "Fresh Del Monte Produce Inc.",
    website: "https://freshdelmonte.com",
    stateCode: 'FL',
    city: "Coral Gables",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["prepared fruit", "vegetables", "fresh-cut", "juices", "beverages", "snacks"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'peterson_groves',
    name: "Peterson Groves",
    website: "https://petersongroves.com/",
    stateCode: 'FL',
    city: "Vero Beach",
    growingRegion: 'indian_river_fl',
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["citrus", "grapefruit", "oranges", "tangelos"],
    foundedYear: 1913,
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'schacht_groves',
    name: "Schacht Groves",
    website: "https://schachtgroves.com/",
    stateCode: 'FL',
    city: "Vero Beach",
    growingRegion: 'indian_river_fl',
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["citrus", "oranges", "grapefruit", "tangelos"],
    foundedYear: 1950,
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'bee_heaven_farm__redland_organics',
    name: "Bee Heaven Farm / Redland Organics",
    website: "https://www.localharvest.org/bee-heaven-farm-redland-organics-M4119",
    stateCode: 'FL',
    city: "Homestead",
    growingRegion: 'south_fl',
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["vegetables", "tropical_produce", "organic"],
    certifications: ["USDA_Organic"],
    foundedYear: 2002,
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'three_sisters_farm',
    name: "Three Sisters Farm",
    stateCode: 'FL',
    city: "Homestead",
    growingRegion: 'south_fl',
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["vegetables", "organic", "tropical_produce"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'pernas_groves',
    name: "Pernas Groves",
    stateCode: 'FL',
    city: "Homestead",
    growingRegion: 'south_fl',
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["mango", "avocado"],
    foundedYear: 1975,
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'tropical_acres_farms',
    name: "Tropical Acres Farms",
    website: "https://www.tropicalacresfarms.com/",
    stateCode: 'FL',
    city: "West Palm Beach",
    growingRegion: 'south_fl',
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["mango", "avocado", "sapodilla", "tropical_fruit"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'fairchild_farm',
    name: "Fairchild Farm",
    website: "https://fairchildgarden.org/",
    stateCode: 'FL',
    city: "Homestead",
    growingRegion: 'south_fl',
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["mango", "avocado", "jackfruit", "mamey_sapote", "sapodilla"],
    scaleIndicators: ["worlds_largest", "largest"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'bland_farms',
    name: "Bland Farms",
    website: "https://blandfarms.com/",
    stateCode: 'GA',
    city: "Glennville",
    growingRegion: 'vidalia_ga',
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["vidalia_onion"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'mclain_farms',
    name: "McLain Farms",
    website: "https://mclainfarms.com/",
    stateCode: 'GA',
    city: "Lyons",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["vidalia_onion"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'aandm_farms',
    name: "A&M Farms",
    website: "https://www.vidaliaonions.com/",
    stateCode: 'GA',
    city: "Lyons",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["vidalia_onion"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'shuman_farms',
    name: "Shuman Farms",
    website: "https://www.shumanfarmsga.com/",
    stateCode: 'GA',
    city: "Vidalia region",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["vidalia_onion", "sweet_onion"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'burton_brooks_orchard_corporation',
    name: "Burton Brooks Orchard Corporation",
    stateCode: 'GA',
    city: "Barney",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["peach", "pecan", "watermelon", "cantaloupe", "blueberry", "blackberry", "tomato", "vidalia_onion"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'southern_grace_farms',
    name: "Southern Grace Farms",
    stateCode: 'GA',
    city: "Enigma",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["blackberry", "blueberry", "nectarine", "peach", "plum", "strawberry", "citrus", "muscadine", "grape", "sunflower"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'the_market_at_rutland_farms',
    name: "The Market at Rutland Farms",
    stateCode: 'GA',
    city: "Tifton",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["blackberry", "blueberry", "cotton", "peach", "strawberry"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'fisher_s_orchard',
    name: "Fisher's Orchard",
    website: "https://www.fishersorchard.com",
    stateCode: 'SC',
    city: "Greer",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["peach"],
    foundedYear: 1930,
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'chappell_farms',
    name: "Chappell Farms",
    website: "https://chappellfarms.com/",
    stateCode: 'SC',
    city: "Barnwell",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["peach"],
    foundedYear: 1927,
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'mcleod_farms',
    name: "McLeod Farms",
    website: "https://www.macspride.com/",
    stateCode: 'SC',
    city: "McBee",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["peach", "pecan"],
    foundedYear: 1916,
    acreage: 1000,
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'chattooga_belle_farm',
    name: "Chattooga Belle Farm",
    stateCode: 'SC',
    city: "Long Creek",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["peach", "apple"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'st_julien_plantation',
    name: "St. Julien Plantation",
    stateCode: 'SC',
    city: "Eutawville",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["peach", "corn", "melon", "beans", "tomato", "squash", "cucumber", "peanut", "okra", "nectarine"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'hinnant_farm',
    name: "Hinnant Farm",
    stateCode: 'SC',
    city: "Eutawville",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["strawberry", "blackberry", "blueberry", "peach", "corn", "vegetables"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'windy_hill_farm',
    name: "Windy Hill Farm",
    stateCode: 'SC',
    city: "Piedmont region",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["beef", "goat", "vegetables", "blueberry", "flowers"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'growing_green_family_farms',
    name: "Growing Green Family Farms",
    stateCode: 'SC',
    city: "Anderson",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["vegetables", "hydroponic"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'barefoot_farms_of_belton',
    name: "Barefoot Farms of Belton",
    stateCode: 'SC',
    city: "Belton",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["vegetables", "dairy", "honey", "eggs"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'dempsey_farms',
    name: "Dempsey Farms",
    stateCode: 'SC',
    city: "St. Helena Island",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["strawberry", "seasonal_produce"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'drawdy_farms',
    name: "Drawdy Farms",
    stateCode: 'SC',
    city: "Early Branch",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["vegetables", "fruit", "seasonal"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'okatee_river_farms',
    name: "Okatee River Farms",
    stateCode: 'SC',
    city: "Bluffton",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["vegetables", "fruit"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'spade_and_clover_gardens',
    name: "Spade & Clover Gardens",
    stateCode: 'SC',
    city: "Johns Island",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["carrot", "beet", "cabbage", "lettuce", "spinach", "ginger", "turmeric"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'freeman_produce',
    name: "Freeman Produce",
    stateCode: 'SC',
    city: "Johns Island",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["strawberry", "okra", "butter_beans", "potato", "seasonal"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'sandhills_farm_to_table_cooperative',
    name: "Sandhills Farm to Table Cooperative",
    website: "https://www.localharvest.org/sandhills-farm-to-table-cooperative-M34237",
    stateCode: 'NC',
    city: "Pinehurst area",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["vegetables", "fruit", "meat", "cheese", "honey", "baked_goods"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'riley_s_ranch',
    name: "Riley's Ranch",
    website: "https://www.localharvest.org/rileys-ranch-M56577",
    stateCode: 'NC',
    city: "Carthage",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["beef", "poultry", "eggs"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'hickory_nut_gap_farm',
    name: "Hickory Nut Gap Farm",
    stateCode: 'NC',
    city: "Asheville area",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["beef", "pork", "chicken"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'hominy_valley_farms',
    name: "Hominy Valley Farms",
    stateCode: 'NC',
    city: "Candler",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["beef", "chicken", "vegetables"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'fickle_creek_farm',
    name: "Fickle Creek Farm",
    stateCode: 'NC',
    city: "North Carolina Piedmont",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["vegetables", "meat"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'harland_s_creek_farm',
    name: "Harland's Creek Farm",
    stateCode: 'NC',
    city: "Pittsboro",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["vegetables", "flowers", "herbs", "organic"],
    certifications: ["USDA_Organic"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'greene_s_blueberry_patch',
    name: "Greene's Blueberry Patch",
    stateCode: 'NC',
    city: "Boone",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["blueberry"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'avery_farms',
    name: "Avery Farms",
    stateCode: 'NC',
    city: "Plumtree",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["raspberry", "strawberry", "blueberry", "blackberry", "christmas_trees"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'brushy_mountain_berry_farm',
    name: "Brushy Mountain Berry Farm",
    stateCode: 'NC',
    city: "Moravian Falls",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["blueberry", "blackberry", "eggs"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'the_berry_farm',
    name: "The Berry Farm",
    stateCode: 'NC',
    city: "Marshall",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["black_raspberry", "blackberry", "blueberry", "red_raspberry"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'pilot_mountain_fresh_berries',
    name: "Pilot Mountain Fresh Berries",
    stateCode: 'NC',
    city: "Pilot Mountain",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["blueberry"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'muzzarelli_farms',
    name: "Muzzarelli Farms",
    website: "https://www.muzzarellifarms.com/",
    stateCode: 'NC',
    city: "NC Coastal Plains/Sandhills",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["sweet_potato", "organic"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'sullivan_farms',
    name: "Sullivan Farms",
    website: "http://www.sullivanfarmsinc.com/",
    stateCode: 'NC',
    city: "NC region",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["sweet_potato"],
    acreage: 500,
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'strawberries_on_903',
    name: "Strawberries on 903",
    website: "https://strawberrieson903.com/",
    stateCode: 'NC',
    city: "Greenville",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["strawberry", "vegetables", "flowers", "eggs"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'underwood_pecan_farm',
    name: "Underwood Pecan Farm",
    website: "https://www.underwoodpecanfarm.com/",
    stateCode: 'AL',
    city: "Summerdale",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["pecan"],
    foundedYear: 1980,
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'b_and_b_pecan_company',
    name: "B & B Pecan Company",
    stateCode: 'AL',
    city: "Fairhope",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["pecan"],
    foundedYear: 1956,
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'bayou_pecan_company',
    name: "Bayou Pecan Company",
    website: "https://bayoupecanco.com/",
    stateCode: 'AL',
    city: "Bayou La Batre",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["pecan"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'price_pecan_farm',
    name: "Price Pecan Farm",
    stateCode: 'AL',
    city: "Baldwin County",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["pecan"],
    foundedYear: 1970,
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'futral_farms',
    name: "Futral Farms",
    website: "https://www.futralfarms.com/",
    stateCode: 'AL',
    city: "East Alabama",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["pecan"],
    scaleIndicators: ["premier"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: '1818_farms',
    name: "1818 Farms",
    stateCode: 'AL',
    city: "Mooresville",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["sheep", "goat", "eggs", "pork", "agritourism"],
    acreage: 3,
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'reeves_farm',
    name: "Reeves Farm",
    stateCode: 'AL',
    city: "Hartselle",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["peach", "fruit", "vegetables"],
    foundedYear: 1959,
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'louallen_farms',
    name: "LouAllen Farms",
    stateCode: 'AL',
    city: "Moulton",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["strawberry", "peach", "tomato", "pepper", "eggplant", "cabbage", "squash", "cucumber"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'esneul_farms',
    name: "Esneul Farms",
    stateCode: 'AL',
    city: "Gulf Coast area",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["beef"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'shipshape_urban_farms',
    name: "Shipshape Urban Farms",
    stateCode: 'AL',
    city: "Irvington",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["vegetables", "hydroponic"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'weeks_bay_plantation',
    name: "Weeks Bay Plantation",
    stateCode: 'AL',
    city: "Baldwin County",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["blueberry"],
    certifications: ["USDA_Organic"],
    acreage: 12,
    scaleIndicators: ["largest"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'hickman_s_farm',
    name: "Hickman's Farm",
    stateCode: 'AL',
    city: "North Alabama",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["eggs", "vegetables", "pickles"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'flying_s_land_and_livestock',
    name: "Flying S Land & Livestock",
    stateCode: 'AL',
    city: "North Alabama",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["beef", "sheep"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'duncan_farms',
    name: "Duncan Farms",
    stateCode: 'AL',
    city: "Gurley",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["vegetables", "permaculture"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'mountain_view_fruit_sales',
    name: "Mountain View Fruit Sales",
    website: "https://mvfruit.com",
    stateCode: 'CA',
    city: "Reedley",
    growingRegion: 'central_valley_ca',
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["peach", "nectarine", "plum", "pluot"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'brandt_farms',
    name: "Brandt Farms",
    website: "https://www.brandtfarms.com",
    stateCode: 'CA',
    city: "Reedley",
    growingRegion: 'central_valley_ca',
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["peach", "nectarine", "plum", "grape", "persimmon", "orange", "mandarin", "kiwi"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'kings_river_packing',
    name: "Kings River Packing",
    website: "https://kingorange.com",
    stateCode: 'CA',
    city: "Sanger",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["orange", "mandarin", "lemon", "grapefruit", "minneola", "cara cara"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'cecelia_packing_corporation',
    name: "Cecelia Packing Corporation",
    website: "https://ceceliapack.com",
    stateCode: 'CA',
    city: "Orange Cove",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["orange", "mandarin", "tangelo", "tangerine", "lemon", "grapefruit"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'porterville_citrus_inc',
    name: "Porterville Citrus, Inc.",
    website: "https://portervillecitrus.com",
    stateCode: 'CA',
    city: "Porterville",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["orange", "mandarin", "lemon", "grapefruit", "tangelo", "cara cara"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'california_fruit_depot',
    name: "California Fruit Depot",
    website: "https://www.calfruitdepot.com",
    stateCode: 'CA',
    city: "Bakersfield",
    growingRegion: 'central_valley_ca',
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["orange", "mandarin", "tangelo", "lemon", "sweet lime"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'wonderful_citrus',
    name: "Wonderful Citrus",
    website: "https://www.wonderfulcitrus.com",
    stateCode: 'CA',
    city: "Lost Hills",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["orange", "mandarin", "grapefruit", "lemon"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'grapeman_farms',
    name: "Grapeman Farms",
    website: "https://grapeman.com",
    stateCode: 'CA',
    city: "Bakersfield",
    growingRegion: 'central_valley_ca',
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["table grape"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'sunview_marketing',
    name: "Sunview Marketing",
    website: "https://sunviewmarketing.com",
    stateCode: 'CA',
    city: "Delano",
    growingRegion: 'central_valley_ca',
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["table grape"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'royal_madera_vineyards',
    name: "Royal Madera Vineyards",
    website: "https://www.royalmaderavineyards.com",
    stateCode: 'CA',
    city: "Madera",
    growingRegion: 'central_valley_ca',
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["table grape"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'wonderful_pistachios',
    name: "Wonderful Pistachios",
    website: "https://www.wonderfulpistachios.com",
    stateCode: 'CA',
    city: "Lost Hills",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["pistachio", "almond"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'setton_farms_setton_pistachio',
    name: "Setton Farms (Setton Pistachio)",
    website: "https://www.settonfarms.com",
    stateCode: 'CA',
    city: "Terra Bella",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["pistachio"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'hansen_ranches',
    name: "Hansen Ranches",
    website: "https://www.hansenranches.com",
    stateCode: 'CA',
    city: "Corcoran",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["pistachio", "almond", "pomegranate", "cotton"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'california_almond_packers_and_exporters_capex',
    name: "California Almond Packers & Exporters (CAPEX)",
    website: "https://capex.apesteve.com",
    stateCode: 'CA',
    city: "Corning",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["almond", "walnut"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'peach_on_earth_farm',
    name: "Peach on Earth Farm",
    stateCode: 'CA',
    city: "Fresno",
    growingRegion: 'central_valley_ca',
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["peach", "plum", "nectarine"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'fowler_packing__peelz_citrus_brand',
    name: "Fowler Packing - Peelz Citrus Brand",
    website: "https://fowlerpacking.com",
    stateCode: 'CA',
    city: "Fresno",
    growingRegion: 'central_valley_ca',
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["mandarin orange"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'jim_durbin_farms',
    name: "Jim Durbin Farms",
    website: "https://jimdurbinfarms.com/",
    stateCode: 'AL',
    city: "Clanton",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["peaches"],
    acreage: 600,
    scaleIndicators: ["largest", "major"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'bentley_farms',
    name: "Bentley Farms",
    stateCode: 'AL',
    city: "Thorsby",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["peaches", "nectarines", "sweet potatoes"],
    scaleIndicators: ["largest"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'culp_fruits',
    name: "Culp Fruits",
    website: "http://www.culpfruits.com/",
    stateCode: 'AL',
    city: "Jemison",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["peaches"],
    acreage: 100,
    scaleIndicators: ["largest"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'sirmon_farms_sweet_potato_processing_facility',
    name: "Sirmon Farms (Sweet Potato Processing Facility)",
    website: "https://sirmonfarms.com/",
    stateCode: 'AL',
    city: "Daphne",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["sweet potatoes", "corn", "cotton", "peanuts", "hydroponic lettuce"],
    certifications: ["GAP"],
    acreage: 4500,
    scaleIndicators: ["largest"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'wildfork_blueberries',
    name: "Wildfork Blueberries",
    website: "https://wildforkblueberries.com/",
    stateCode: 'AL',
    city: "Brewton",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["blueberries"],
    scaleIndicators: ["largest"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'regional_produce_distributors_llc',
    name: "Regional Produce Distributors, LLC",
    website: "https://regionalproduce.net/",
    stateCode: 'AL',
    city: "Birmingham",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["fresh produce", "dairy products"],
    scaleIndicators: ["premier"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'forestwood_farm_inc',
    name: "Forestwood Farm Inc",
    website: "https://www.forestwood.com/",
    stateCode: 'AL',
    city: "Birmingham",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["fresh produce", "vegetables", "fruits", "dairy products", "eggs"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'forestwood_farm_huntsville_location',
    name: "Forestwood Farm (Huntsville Location)",
    website: "https://www.forestwood.com/",
    stateCode: 'AL',
    city: "Huntsville",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["fresh produce", "vegetables", "fruits", "dairy products", "eggs"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'peach_park',
    name: "Peach Park",
    stateCode: 'AL',
    city: "Clanton",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["peaches", "produce", "farm market products"],
    foundedYear: 1984,
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'reeves_peach_farm',
    name: "Reeves Peach Farm",
    website: "https://www.reevespeaches.com/",
    stateCode: 'AL',
    city: "Hartselle",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["peaches", "crops"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'first_fruit_farms_inc',
    name: "First Fruit Farms Inc",
    website: "http://www.firstfruitfarms.com/",
    stateCode: 'AL',
    city: "Birmingham",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["fresh produce", "fruits"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'muzzarelli_farms_curing_packing_facility_for_sweet_potatoes',
    name: "Muzzarelli Farms (Curing/Packing Facility for Sweet Potatoes)",
    website: "https://www.muzzarellifarms.com/",
    stateCode: 'AL',
    city: "Vineland",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["sweet potatoes"],
    certifications: ["USDA_Organic"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'oakes_farms_flat_rock_alabama_operation',
    name: "Oakes Farms (Flat Rock, Alabama Operation)",
    website: "https://oakesfarms.com/",
    stateCode: 'AL',
    city: "Flat Rock",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["grower-packer-shipper", "fresh produce", "fruits", "vegetables"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'alabama_sweet_potato_growers_association',
    name: "Alabama Sweet Potato Growers Association",
    stateCode: 'AL',
    city: "Multiple",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["sweet potatoes"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'alabama_fruit_and_vegetable_growers_association_afvga',
    name: "Alabama Fruit and Vegetable Growers Association (AFVGA)",
    website: "https://www.afvga.org/",
    stateCode: 'AL',
    city: "Montgomery",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["peaches", "strawberries", "blueberries", "sweet potatoes", "pumpkins", "squash", "tomatoes", "watermelons", "sweet corn", "pecans"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'kimball_and_thompson_produce_company',
    name: "Kimball & Thompson Produce Company",
    website: "https://www.ktproduce.com/",
    stateCode: 'AR',
    city: "Lowell",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Fresh fruits", "Fresh vegetables", "Mixed produce"],
    scaleIndicators: ["major"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'matthews_ridgeview_farms',
    name: "Matthews Ridgeview Farms",
    website: "https://www.arsweetpotatoes.com/",
    stateCode: 'AR',
    city: "Wynne",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Sweet potatoes", "Yams"],
    foundedYear: 2006,
    scaleIndicators: ["largest", "major"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'proffer_wholesale_produce',
    name: "Proffer Wholesale Produce",
    website: "https://www.profferproduce.com/",
    stateCode: 'AR',
    city: "Crossett",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Tomatoes", "Green peppers", "Cucumbers", "Eggplant", "Okra", "Yellow squash", "Zucchini", "Chili peppers", "Cabbage", "Corn", "Winter squash"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'barnhill_orchards',
    name: "Barnhill Orchards",
    website: "https://www.barnhillorchards.com/",
    stateCode: 'AR',
    city: "Lonoke",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Strawberries", "Blackberries", "Blueberries", "Peaches", "Watermelons", "Cantaloupes", "Summer vegetables"],
    foundedYear: 1980,
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'arkansas_natural_produce',
    name: "Arkansas Natural Produce",
    website: "https://www.arkansasnaturalproduce.com/",
    stateCode: 'AR',
    city: "Malvern",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Salad greens", "Baby greens", "Fresh herbs", "Seasonal vegetables"],
    foundedYear: 1988,
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'peebles_organic_farms_llc',
    name: "Peebles Organic Farms LLC",
    website: "https://www.peeblesorganics.com/",
    stateCode: 'AR',
    city: "Augusta",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Organic edamame", "Green beans", "Sweet potatoes", "Processor pumpkins", "Corn", "Rice", "Soybeans", "Watermelon", "Wheat"],
    certifications: ["USDA_Organic"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'liberty_fruit_company',
    name: "Liberty Fruit Company",
    website: "https://www.libertyfruit.com/",
    stateCode: 'AR',
    city: "Multiple locations",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Fresh fruits", "Fresh vegetables", "USDA Organic", "Custom-cut produce", "Made-to-order fresh-cut products"],
    certifications: ["Kosher"],
    foundedYear: 1965,
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'muzzarelli_farms_arkansas_operations',
    name: "Muzzarelli Farms (Arkansas Operations)",
    website: "https://www.muzzarellifarms.com/",
    stateCode: 'AR',
    city: "Various",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Sweet potatoes", "Yams", "Seasonal greens", "Kale", "Peppers", "Grape tomatoes", "Plum tomatoes", "Pickles", "Cucumbers"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'lexington_produce_terminal',
    name: "Lexington Produce Terminal",
    website: "Not available",
    stateCode: 'KY',
    city: "Lexington",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["vegetables", "fruits", "produce", "seasonal produce"],
    scaleIndicators: ["major"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'warren_county_produce_cooperative',
    name: "Warren County Produce Cooperative",
    website: "Not available",
    stateCode: 'KY',
    city: "Bowling Green",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["vegetables", "melons", "squash", "cucumbers", "tomatoes"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'kentucky_apple_association_member_facilities',
    name: "Kentucky Apple Association Member Facilities",
    website: "Not available",
    stateCode: 'KY',
    city: "Multiple locations",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["apples", "apple products"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'homestead_seed_company_historical',
    name: "Homestead Seed Company (Historical)",
    website: "Not available",
    stateCode: 'KY',
    city: "Lancaster",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["seeds", "vegetables"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'kentucky_department_of_agriculture__produce_safety_program',
    name: "Kentucky Department of Agriculture - Produce Safety Program",
    website: "https://www.kyagr.com/",
    stateCode: 'KY',
    city: "Frankfort",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["all produce types"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'glacier_fresh_cherries',
    name: "Glacier Fresh Cherries",
    website: "https://glacierfreshcherries.com",
    stateCode: 'MT',
    city: "Bigfork",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["cherries"],
    foundedYear: 2005,
    acreage: 115,
    scaleIndicators: ["largest"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'flathead_lake_cherry_growers_inc',
    name: "Flathead Lake Cherry Growers, Inc.",
    website: "https://montanacherries.com",
    stateCode: 'MT',
    city: "Bigfork",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["cherries"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'mission_mountain_food_enterprise_center',
    name: "Mission Mountain Food Enterprise Center",
    website: "https://www.missionwestcdp.org/food-enterprise-center/",
    stateCode: 'MT',
    city: "Ronan",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["cherries", "vegetables", "squash", "pumpkin", "green beans", "peppers", "onions", "carrots", "cucumbers", "melons"],
    certifications: ["USDA_Organic"],
    foundedYear: 2000,
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'western_montana_growers_cooperative',
    name: "Western Montana Growers Cooperative",
    website: "https://www.wmgcoop.com",
    stateCode: 'MT',
    city: "Missoula",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["fresh vegetables", "frozen vegetables", "fresh fruits", "frozen fruits", "prepared foods"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'shelby_elevator_ardent_mills',
    name: "Shelby Elevator (Ardent Mills)",
    website: "https://www.ardentmills.com/our-facilities/montana/shelby/",
    stateCode: 'MT',
    city: "Shelby",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["wheat", "chickpeas", "grain"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'new_century_ag__westby_location',
    name: "New Century Ag - Westby Location",
    website: "https://newcentag.com",
    stateCode: 'MT',
    city: "Westby",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["durum wheat", "spring wheat", "canola", "peas", "lentils", "grain"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'cream_of_the_west',
    name: "Cream of the West",
    stateCode: 'MT',
    city: "Montana",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["dry mixes", "flour", "grains", "tea"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'montana_cookie_company',
    name: "Montana Cookie Company",
    stateCode: 'MT',
    city: "Bozeman",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["gluten-free cookies", "gluten-free snacks"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'west_fork_creations',
    name: "West Fork Creations",
    stateCode: 'MT',
    city: "Red Lodge",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["chocolate sauces"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'roots_kitchen_and_cannery',
    name: "Roots Kitchen & Cannery",
    website: "https://www.rootskitchencannery.com/co-packing",
    stateCode: 'MT',
    city: "Belgrade",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["canned goods", "preserved foods"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'muzzarelli_farms',
    name: "Muzzarelli Farms",
    website: "https://www.muzzarellifarms.com/",
    stateCode: 'NJ',
    city: "Vineland",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["sweet potatoes", "kale", "blueberries", "romaine lettuce", "tomatoes", "peppers", "cucumbers"],
    certifications: ["Non-GMO"],
    acreage: 350,
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'atlantic_blueberry_company',
    name: "Atlantic Blueberry Company",
    website: "https://www.atlanticblueberry.com/",
    stateCode: 'NJ',
    city: "Hammonton",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["blueberries (highbush)"],
    acreage: 750,
    scaleIndicators: ["largest"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'd_ottavio_produce',
    name: "D'Ottavio Produce",
    website: "https://www.mdottavioproduce.com/",
    stateCode: 'NJ',
    city: "Minotola",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["blueberries", "organic blackberries", "raspberries", "golden berries", "wine grapes", "New Jersey vegetables"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'consalo_family_farms',
    name: "Consalo Family Farms",
    website: "https://www.consalofamilyfarms.com/",
    stateCode: 'NJ',
    city: "Vineland",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["blueberries", "mixed vegetables"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'dandrea_produce_llc',
    name: "Dandrea Produce, LLC",
    website: "https://dandreaproduce.com/",
    stateCode: 'NJ',
    city: "Vineland",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["mixed produce", "fresh vegetables", "fruits"],
    foundedYear: 1917,
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'whalen_farms_llc',
    name: "Whalen Farms LLC",
    website: "http://www.whalenfarms.com/",
    stateCode: 'NJ',
    city: "Shamong",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["blueberries", "cranberries"],
    foundedYear: 1985,
    acreage: 180,
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'american_cranberry_co',
    name: "American Cranberry Co.",
    website: "https://www.americancranberryco.com/",
    stateCode: 'NJ',
    city: "Pemberton",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["cranberries (whole, frozen, fresh)", "blueberries", "produce"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'eastern_propak',
    name: "Eastern Propak",
    website: "https://easternpropak.com/",
    stateCode: 'NJ',
    city: "Glassboro",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["all fresh produce types"],
    certifications: ["USDA_Organic"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'jsm_blueberries_llc',
    name: "JSM Blueberries LLC",
    website: "https://www.manta.com/c/mmn3tzh/jsm-blueberries-llc",
    stateCode: 'NJ',
    city: "Hammonton",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["blueberries"],
    foundedYear: 2005,
    acreage: 10,
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'glossy_fruit_farms',
    name: "Glossy Fruit Farms",
    website: "https://glossy-fruit-farms.wheree.com/",
    stateCode: 'NJ',
    city: "Hammonton",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["blueberries", "tomatoes", "sweet potatoes"],
    foundedYear: 1887,
    acreage: 500,
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'stoney_creek_blueberries',
    name: "Stoney Creek Blueberries",
    stateCode: 'NJ',
    city: "Hammonton",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["blueberries"],
    foundedYear: 1970,
    acreage: 155,
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'big_buck_farms_llc',
    name: "Big Buck Farms LLC",
    website: "https://jerseyfruit.com/about/growers/",
    stateCode: 'NJ',
    city: "Hammonton",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["blueberries (organic)"],
    certifications: ["USDA_Organic", "Kosher"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'losasso_farms',
    name: "LoSasso Farms",
    website: "https://jerseyfruit.com/about/growers/",
    stateCode: 'NJ',
    city: "Hammonton",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["blueberries"],
    foundedYear: 1956,
    acreage: 21,
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'pine_island_cranberry_co__inc',
    name: "Pine Island Cranberry Co., Inc.",
    website: "https://www.picranberry.com/",
    stateCode: 'NJ',
    city: "Chatsworth",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["cranberries"],
    acreage: 1400,
    scaleIndicators: ["largest"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'jersey_fruit_cooperative',
    name: "Jersey Fruit Cooperative",
    website: "https://jerseyfruit.com/",
    stateCode: 'NJ',
    city: "Multiple locations",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["blueberries", "stone fruits", "peaches", "nectarines"],
    foundedYear: 1940,
    scaleIndicators: ["premier"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'summer_wind_farms',
    name: "Summer Wind Farms",
    website: "https://www.summerwindfarms.com/",
    stateCode: 'NJ',
    city: "Vineland area",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["certified organic vegetables"],
    certifications: ["USDA_Organic"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'cuttler_produce_nj',
    name: "Cuttler Produce NJ",
    website: "https://cuttlerproduce.com/",
    stateCode: 'NJ',
    city: "Linden",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["wholesale produce"],
    scaleIndicators: ["largest"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'taylor_farms',
    name: "Taylor Farms",
    website: "https://www.taylorfarms.com",
    stateCode: 'California',
    city: "Salinas",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Fresh-cut salads", "Meal kits", "Salad kits", "Fresh blends", "Fruits", "Vegetables"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'mission_produce',
    name: "Mission Produce",
    website: "https://www.missionproduce.com",
    stateCode: 'California',
    city: "Oxnard",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Avocados", "Hass avocados"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'duda_farm_fresh_foods',
    name: "Duda Farm Fresh Foods",
    website: "https://www.dudafresh.com",
    stateCode: 'Florida',
    city: "Oviedo",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Celery", "Radishes", "Corn", "Lettuce", "Leafy greens"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'fresh_express_inc',
    name: "Fresh Express Inc",
    website: "https://www.freshexpress.com",
    stateCode: 'Florida',
    city: "Windermere",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Salads", "Leafy greens", "Vegetables", "Fruits"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'boskovich_farms',
    name: "Boskovich Farms",
    website: "https://www.boskovichfarms.com",
    stateCode: 'California',
    city: "Oxnard",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Fresh produce", "Vegetables"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'gills_onions',
    name: "Gills Onions",
    website: "https://www.gillsonions.com",
    stateCode: 'California',
    city: "Oxnard",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Onions", "Whole peeled onions", "Pre-sliced onions", "Diced onions", "Pureed onions"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'dole_fresh_fruit',
    name: "Dole Fresh Fruit",
    website: "https://www.dole.com",
    stateCode: 'Delaware',
    city: "Wilmington",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Bananas", "Pineapples", "Tropical fruits"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'calavo',
    name: "Calavo",
    website: "https://www.calavo.com",
    stateCode: 'California',
    city: "Santa Paula",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Avocados"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'cal_flavor',
    name: "Cal Flavor",
    stateCode: 'California',
    city: "Los Angeles",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Avocados"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'cal_sun_produce',
    name: "Cal Sun Produce",
    stateCode: 'California',
    city: "Oxnard",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Avocados"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'corona_college_heights_orange_and_lemon_association',
    name: "Corona College Heights Orange and Lemon Association",
    website: "https://www.cchcitrus.com",
    stateCode: 'California',
    city: "Riverside",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Oranges", "Lemons", "Citrus"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'del_monte_fresh_produce_n_a__inc',
    name: "Del Monte Fresh Produce N.A., Inc.",
    stateCode: 'California',
    city: "Santa Fe Springs",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Fresh produce"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'del_rey_avocado',
    name: "Del Rey Avocado",
    website: "https://www.delreyavocado.com",
    stateCode: 'California',
    city: "Fallbrook",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Avocados"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'eco_farms_avocados_inc',
    name: "Eco Farms Avocados, Inc.",
    website: "https://www.ecofarmsusa.com",
    stateCode: 'California',
    city: "Temecula",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Avocados"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'henry_avocado',
    name: "Henry Avocado",
    website: "https://www.henryavocado.com",
    stateCode: 'California',
    city: "Escondido",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Avocados"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'las_palmalitas_ranch',
    name: "Las Palmalitas Ranch",
    stateCode: 'California',
    city: "Carpinteria",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Avocados (Organic)"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'index_fresh',
    name: "Index Fresh",
    website: "https://www.indexfresh.com",
    stateCode: 'California',
    city: "Corona",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Avocados"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'mcdaniel_fruit',
    name: "McDaniel Fruit",
    website: "https://www.mcdanielavocado.com",
    stateCode: 'California',
    city: "Fallbrook",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Avocados"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'rincon_farms_produce',
    name: "Rincon Farms Produce",
    website: "https://www.rinconfarms.com",
    stateCode: 'California',
    city: "Carpinteria",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Avocados"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'stehly_farms_organics',
    name: "Stehly Farms Organics",
    website: "https://www.stehlyfarmsorganics.com",
    stateCode: 'California',
    city: "Bonsall",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Avocados (Organic)"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'the_giumarra_companies',
    name: "The Giumarra Companies",
    website: "https://www.giumarra.com",
    stateCode: 'California',
    city: "Escondido",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Fresh produce", "Grapes", "Citrus"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'westfalia_fruit_marketing',
    name: "Westfalia Fruit Marketing",
    website: "https://www.westfaliafruit.com",
    stateCode: 'California',
    city: "Oxnard",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Avocados", "Fresh fruit"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'west_pak_avocado_inc',
    name: "West Pak Avocado, Inc.",
    website: "https://www.westpakavocado.com",
    stateCode: 'California',
    city: "Murrieta",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Avocados"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'e_armata_inc',
    name: "E. Armata Inc.",
    website: "earmata.com",
    stateCode: 'NY',
    city: "Bronx",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Strawberries", "Blackberries", "Blueberries", "Raspberries", "Grapes", "Apples", "Pears", "Stone fruit", "Citrus", "Exotic fruits", "Honeydews", "Cantaloupes", "Watermelons", "Mushrooms", "Potatoes", "Onions", "Carrots", "Arugula", "Spring mix", "Romaine", "Spinach", "Kale", "Tomatoes"],
    scaleIndicators: ["largest"],
    yearsInBusiness: 100,
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'dole_fresh_vegetables',
    name: "Dole Fresh Vegetables",
    website: "dole.com",
    stateCode: 'CA',
    city: "Monterey",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Fresh vegetables", "Leafy greens", "Lettuce", "Specialty crops"],
    scaleIndicators: ["major"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'calavo_growers',
    name: "Calavo Growers",
    website: "calavo.com",
    stateCode: 'CA',
    city: "Santa Paula",
    growingRegion: 'southern_ca',
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Avocados"],
    scaleIndicators: ["major"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'driscoll_s',
    name: "Driscoll's",
    website: "driscoll-s.com",
    stateCode: 'CA',
    city: "Watsonville",
    growingRegion: 'salinas_valley_ca',
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Berries", "Strawberries", "Raspberries", "Blueberries", "Blackberries"],
    scaleIndicators: ["major"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'crystal_valley_west',
    name: "Crystal Valley West",
    stateCode: 'CA',
    city: "Los Angeles",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Fresh produce", "Vegetables", "Fruits"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'specialty_produce',
    name: "Specialty Produce",
    stateCode: 'CA',
    city: "San Diego",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Fresh produce", "Specialty items"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'produce_services_of_los_angeles',
    name: "Produce Services of Los Angeles",
    stateCode: 'CA',
    city: "Los Angeles",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Fresh produce", "Vegetables", "Fruits"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'charlie_s_produce',
    name: "Charlie's Produce",
    stateCode: 'CA',
    city: "Los Angeles",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Fruits", "Vegetables"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'hacienda_foods_distribution',
    name: "Hacienda Foods Distribution",
    stateCode: 'CA',
    city: "San Bernardino",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Fresh produce"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'sunrise_produce_company',
    name: "Sunrise Produce Company",
    stateCode: 'CA',
    city: "Fullerton",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Fresh produce", "Vegetables", "Fruits"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'global_best_produce',
    name: "Global Best Produce",
    stateCode: 'CA',
    city: "Vernon",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Asian produce"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'shasta_produce',
    name: "Shasta Produce",
    stateCode: 'CA',
    city: "South San Francisco",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Fruits", "Vegetables"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'general_produce_company',
    name: "General Produce Company",
    stateCode: 'CA',
    city: "Sacramento",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Fresh produce", "Vegetables", "Fruits"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'd_h_oriental_produce',
    name: "D.H. Oriental Produce",
    stateCode: 'CA',
    city: "Vernon",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Exotic fruits", "Exotic vegetables"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'carcione_s_fresh_produce',
    name: "Carcione's Fresh Produce",
    stateCode: 'CA',
    city: "South San Francisco",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Fresh produce"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'hitchcock_farms',
    name: "Hitchcock Farms",
    website: "hitchcockfarms.com",
    stateCode: 'CA',
    city: "Salinas",
    growingRegion: 'salinas_valley_ca',
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Fresh vegetables", "Leafy greens"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'may_food_produce_wholesale',
    name: "May Food Produce Wholesale",
    stateCode: 'TX',
    city: "Houston",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Asian fresh fruits", "Asian vegetables"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'longhing_wholesale',
    name: "Longhing Wholesale",
    stateCode: 'TX',
    city: "Stafford",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Fresh produce"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'nicho_produce',
    name: "Nicho Produce",
    stateCode: 'TX',
    city: "Edinburg",
    growingRegion: 'rio_grande_tx',
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Fresh fruits", "Fresh vegetables"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'dimare_fresh__dallas_fort_worth',
    name: "DiMare Fresh - Dallas/Fort Worth",
    stateCode: 'TX',
    city: "Dallas",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Full line produce"],
    scaleIndicators: ["major"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'dimare_fresh__houston',
    name: "DiMare Fresh - Houston",
    stateCode: 'TX',
    city: "Houston",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Full line produce"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'gilmore_produce_ltd',
    name: "Gilmore Produce Ltd",
    stateCode: 'TX',
    city: "Dallas",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Fresh produce", "Wholesale"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'flavorful_fresh_inc',
    name: "Flavorful Fresh Inc.",
    stateCode: 'TX',
    city: "Houston",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Fresh produce"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'segovia_s_distributing_inc',
    name: "Segovia's Distributing Inc.",
    stateCode: 'TX',
    city: "El Paso",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Fresh produce"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'quality_fruit_and_veg_co',
    name: "Quality Fruit & Veg. Co.",
    stateCode: 'TX',
    city: "El Paso",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Fresh produce", "Vegetables"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'river_city_produce_company',
    name: "River City Produce Company",
    stateCode: 'TX',
    city: "San Antonio",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Fresh fruit", "Fresh vegetables"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'chefs_produce_company',
    name: "Chefs Produce Company",
    stateCode: 'TX',
    city: "Houston",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Fresh produce"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'rio_produce',
    name: "Rio Produce",
    stateCode: 'TX',
    city: "Edinburg",
    growingRegion: 'rio_grande_tx',
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Mexican produce"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'j_luna_produce_co_inc',
    name: "J Luna Produce Co Inc",
    stateCode: 'TX',
    city: "Houston",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Fresh produce", "Wholesale"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'brothers_produce',
    name: "Brothers Produce",
    stateCode: 'TX',
    city: "Houston",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Fresh produce"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'potato_specialty_company',
    name: "Potato Specialty Company",
    stateCode: 'TX',
    city: "Lubbock",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Fresh produce", "Potatoes"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'coast_citrus_distributors',
    name: "Coast Citrus Distributors",
    stateCode: 'TX',
    city: "McAllen",
    growingRegion: 'rio_grande_tx',
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Fresh fruits", "Fresh vegetables", "Citrus"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'brothers_food_service',
    name: "Brothers Food Service",
    stateCode: 'TX',
    city: "Dallas",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Fresh produce", "Specialty items"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'franks_distributing_inc',
    name: "Franks Distributing, Inc",
    stateCode: 'TX',
    city: "Edinburg",
    growingRegion: 'rio_grande_tx',
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Fresh fruits", "Fresh vegetables"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'empire_fresh_produce',
    name: "Empire Fresh Produce",
    stateCode: 'TX',
    city: "Dallas",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Fresh produce"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'allied_produce_inc',
    name: "Allied Produce Inc.",
    stateCode: 'TX',
    city: "Houston",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Asian vegetables"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'fresh_tex_produce',
    name: "Fresh Tex Produce",
    stateCode: 'TX',
    city: "Alamo",
    growingRegion: 'rio_grande_tx',
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Mexican produce"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'sandoval_produce_company',
    name: "Sandoval Produce Company",
    stateCode: 'TX',
    city: "Houston",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Fresh produce"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'superior_trading_dallas',
    name: "Superior Trading Dallas",
    stateCode: 'TX',
    city: "Dallas",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Asian produce"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'nbc_foods_inc',
    name: "NBC Foods Inc.",
    stateCode: 'TX',
    city: "Dallas",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Fresh produce", "Food items"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'scarmardo_foodservice_inc',
    name: "Scarmardo Foodservice Inc.",
    stateCode: 'TX',
    city: "Bryan",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Fresh produce"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'nogales_produce_inc',
    name: "Nogales Produce Inc.",
    stateCode: 'TX',
    city: "Dallas",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Mexican produce", "Grocery items"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'taxco_produce_inc',
    name: "Taxco Produce, Inc.",
    stateCode: 'TX',
    city: "Dallas",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Mexican products", "Hispanic products"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'mex_flores_produce_company_inc',
    name: "Mex Flores Produce Company Inc.",
    stateCode: 'TX',
    city: "Houston",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Hispanic produce", "Mexican specialty products"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'best_choice_food_group',
    name: "Best Choice Food Group",
    stateCode: 'TX',
    city: "Fort Worth",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Fresh produce", "Institutional food"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'latin_specialties_llc',
    name: "Latin Specialties LLC",
    stateCode: 'TX',
    city: "Houston",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Specialty produce"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'grande_produce_ltd',
    name: "Grande Produce Ltd.",
    stateCode: 'TX',
    city: "San Juan",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Fresh fruits", "Fresh vegetables"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'panamerican_farms',
    name: "Panamerican Farms",
    stateCode: 'CA',
    city: "Camarillo",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Fresh produce"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'sofia_produce_llc',
    name: "Sofia Produce LLC",
    stateCode: 'AZ',
    city: "Nogales",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Fresh produce"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'fresh_alliance',
    name: "Fresh Alliance",
    stateCode: 'GA',
    city: "Suwanee",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Fresh produce"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'davis_elite_group_llc',
    name: "Davis Elite Group LLC",
    stateCode: 'TX',
    city: "Conroe",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Fresh produce"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'gold_coast_produce_inc',
    name: "Gold Coast Produce Inc",
    stateCode: 'IL',
    city: "Gurnee",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Fresh produce"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'viva_chestnuts_inc',
    name: "Viva Chestnuts Inc",
    stateCode: 'DE',
    city: "Dover",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Chestnuts"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'pico_bravo_llc',
    name: "Pico Bravo LLC",
    stateCode: 'NM',
    city: "Las Cruces",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Fresh produce"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'american_onion_inc',
    name: "American Onion, Inc.",
    stateCode: 'OR',
    city: "Hermiston",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Onions"],
    scaleIndicators: ["major"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'baker_packing_and_murakami_produce_co',
    name: "Baker Packing & Murakami Produce Co.",
    stateCode: 'ID',
    city: "Boise",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Onions"],
    scaleIndicators: ["largest"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'cheney_brothers',
    name: "Cheney Brothers",
    stateCode: 'FL',
    city: "Riviera Beach",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Fresh produce", "Foodservice items"],
    scaleIndicators: ["major"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'divine_flavor_llc',
    name: "Divine Flavor LLC",
    stateCode: 'AZ',
    city: "Rio Rico",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Specialty produce"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'export_fresh_company',
    name: "Export Fresh Company",
    stateCode: 'AZ',
    city: "Rio Rico",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Fresh produce"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'farmer_s_best_international',
    name: "Farmer's Best International",
    stateCode: 'AZ',
    city: "Rio Rico",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Fresh produce"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'divine_ripe_llc',
    name: "Divine Ripe LLC",
    stateCode: 'TX',
    city: "Pharr",
    growingRegion: 'rio_grande_tx',
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Specialty produce"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'dixon_tom_a_toe',
    name: "Dixon Tom-A-Toe",
    stateCode: 'TX',
    city: "Grand Prairie",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Tomatoes"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'lone_star_citrus_growers',
    name: "Lone Star Citrus Growers",
    website: "lonestarcitrus.com",
    stateCode: 'Texas',
    city: "Mission",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Grapefruit", "Ruby Red Grapefruit", "Sweet Oranges", "Navel Oranges", "Valencia Oranges", "Pineapples"],
    foundedYear: 2007,
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'south_tex_organics_lc',
    name: "South Tex Organics, LC",
    website: "stxorganics.com",
    stateCode: 'Texas',
    city: "Mission",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Rio Star Grapefruit", "Oranges", "Navel Oranges", "Meyer Lemons", "Onions", "Watermelons"],
    certifications: ["USDA_Organic"],
    scaleIndicators: ["largest"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'triple_j_organics_llc',
    name: "Triple J Organics, LLC",
    website: "triplejorganics.com",
    stateCode: 'Texas',
    city: "Mission",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Early Season Oranges", "Marrs Oranges", "Navel Oranges", "Ruby Sweet Grapefruit", "Rio Star Grapefruit", "Meyer Lemons", "Tangerines", "Tangelos"],
    certifications: ["USDA_Organic"],
    foundedYear: 1995,
    acreage: 83,
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'wonderful_citrus',
    name: "Wonderful Citrus",
    website: "wonderfulcitrus.com",
    stateCode: 'Texas',
    city: "Mission",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Grapefruit", "Texas Red Grapefruit", "Sweet Scarletts Grapefruit", "Oranges", "Navel Oranges", "Valencia Oranges", "Lemons", "Limes", "Mandarins", "Wonderful Halos", "Citrus Juice"],
    scaleIndicators: ["largest"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'growers_select_produce_inc',
    name: "Growers Select Produce Inc",
    website: "groselpro.com",
    stateCode: 'Texas',
    city: "Mission",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Seedless Watermelon"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'rio_fresh',
    name: "Rio Fresh",
    website: "riofresh.com",
    stateCode: 'Texas',
    city: "Rio Grande Valley",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Greens", "Herbs", "Onions", "Various leaf vegetables"],
    yearsInBusiness: 75,
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'thompson_farms',
    name: "Thompson Farms",
    stateCode: 'Texas',
    city: "Mission",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Citrus"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'paul_obst_farm',
    name: "Paul Obst Farm",
    stateCode: 'Texas',
    city: "Alamo",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Citrus"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'perez_groves_llc',
    name: "Perez Groves, LLC",
    stateCode: 'Texas',
    city: "Edinburg",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Citrus"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'river_star_farms',
    name: "River Star Farms",
    website: "riverstarfarms.com",
    stateCode: 'Texas',
    city: "Mercedes / Donna",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Produce"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'saenz_produce_company',
    name: "Saenz Produce Company",
    stateCode: 'Texas',
    city: "Edinburg",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Produce"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'strohmeyer_family_farm_llc',
    name: "Strohmeyer Family Farm LLC",
    stateCode: 'Texas',
    city: "McAllen",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Citrus"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  },

  {
    id: 'xo_produce_inc',
    name: "XO Produce Inc",
    website: "xoproduce.com",
    stateCode: 'Texas',
    city: "Rio Grande Valley",
    roles: ['packinghouse'],
    facilityTypes: ['wet_packinghouse'],
    b2bChannels: ['to_retailers', 'to_distributors'],
    products: ["Citrus", "Onions", "Peppers", "Green Vegetables"],
    verificationLevel: 'website_verified',
    dataSource: 'agent_swarm_2025_12_21_with_regions'
  }
]



// ALL ENTITIES COMBINED
// =============================================================================

const ALL_ENTITIES: SupplyChainEntity[] = [
  ...INDRIO_ENTITIES,
  ...FLORIDA_ENTITIES,
  ...CALIFORNIA_ENTITIES,
  ...PACIFIC_NW_ENTITIES,
  ...MIDWEST_ENTITIES,
  ...TEXAS_ENTITIES,
  ...SOUTHEAST_ENTITIES,
  // New packinghouse entities from 2024 research
  ...FL_PACKINGHOUSE_ENTITIES,
  ...CA_PACKINGHOUSE_ENTITIES,
  ...TX_PACKINGHOUSE_ENTITIES,
  ...WA_PACKINGHOUSE_ENTITIES,
  ...GA_PACKINGHOUSE_ENTITIES,
  // LocalHarvest farms with seasonal timing data (266 farms, 50 states)
  ...LOCALHARVEST_ENTITIES,
  // Packinghouse entities from 2025-12-21 agent swarm (303 facilities)
  ...PACKINGHOUSE_ENTITIES_2025,
]

// =============================================================================
// ROLE LABEL MAP
// =============================================================================

const ROLE_TO_LABEL: Record<SupplyChainRole, string> = {
  grower: 'Grower',
  packinghouse: 'Packinghouse',
  retailer: 'Retailer',
}

// =============================================================================
// SEED FUNCTIONS
// =============================================================================

/**
 * Build the Cypher labels string for an entity's roles.
 * Example: "Entity:Grower:Packinghouse:Retailer"
 */
function buildLabels(roles: SupplyChainRole[]): string {
  const roleLabels = roles.map(r => ROLE_TO_LABEL[r]).join(':')
  return `Entity:${roleLabels}`
}

export async function seedEntities(): Promise<void> {
  console.log('\n=== Seeding Supply Chain Entities ===\n')

  let entityCount = 0
  let updatedCount = 0
  let productLinkCount = 0
  let regionLinkCount = 0
  let sourcingLinkCount = 0

  for (const entity of ALL_ENTITIES) {
    // Build role labels for SET operation
    const roleLabels = entity.roles.map(r => ROLE_TO_LABEL[r])

    // MERGE on Entity:id only, then SET role labels dynamically
    // This handles both new entities and updates to existing Farm→Entity migrations
    //
    // IMPORTANT: First REMOVE all possible role labels to clear stale data,
    // then SET only the labels that should be there based on entity.roles.
    // This ensures role changes in seed data are reflected in the graph.
    const setLabelsClause = roleLabels.map(label => `SET e:${label}`).join(' ')

    await runWriteTransaction(`
      MATCH (s:State {code: $stateCode})
      MERGE (e:Entity {id: $id})
      REMOVE e:Grower, e:Packinghouse, e:Retailer, e:Distributor, e:Farm
      ${setLabelsClause}
      SET e.name = $name,
          e.website = $website,
          e.city = $city,
          e.county = $county,
          e.stateCode = $stateCode,
          e.verificationLevel = $verificationLevel,
          e.dataSource = $dataSource,
          e.features = $features,
          e.certifications = $certifications,
          e.facilityTypes = $facilityTypes,
          e.retailChannels = $retailChannels,
          e.b2bChannels = $b2bChannels,
          e.foundedYear = $foundedYear,
          e.acreage = $acreage,
          e.scaleIndicators = $scaleIndicators,
          e.yearsInBusiness = $yearsInBusiness
      MERGE (e)-[:LOCATED_IN_STATE]->(s)
    `, {
      id: entity.id,
      name: entity.name,
      stateCode: entity.stateCode,
      website: entity.website || null,
      city: entity.city || null,
      county: entity.county || null,
      verificationLevel: entity.verificationLevel,
      dataSource: entity.dataSource,
      features: entity.features || [],
      certifications: entity.certifications || [],
      facilityTypes: entity.facilityTypes || [],
      retailChannels: entity.retailChannels || [],
      b2bChannels: entity.b2bChannels || [],
      foundedYear: entity.foundedYear || null,
      acreage: entity.acreage || null,
      scaleIndicators: entity.scaleIndicators || [],
      yearsInBusiness: entity.yearsInBusiness || null,
    })
    entityCount++

    // Link to GrowingRegion if specified
    if (entity.growingRegion) {
      await runWriteTransaction(`
        MATCH (e:Entity {id: $entityId})
        MATCH (gr:GrowingRegion {id: $growingRegionId})
        MERGE (e)-[:IN_GROWING_REGION]->(gr)
      `, {
        entityId: entity.id,
        growingRegionId: entity.growingRegion,
      })
      regionLinkCount++
    }

    // Link to ProductTypes
    // Growers use GROWS, non-growers use SELLS
    const relationship = entity.roles.includes('grower') ? 'GROWS' : 'SELLS'
    for (const productId of entity.products) {
      await runWriteTransaction(`
        MATCH (e:Entity {id: $entityId})
        MATCH (pt:ProductType {id: $productId})
        MERGE (e)-[:${relationship}]->(pt)
      `, {
        entityId: entity.id,
        productId: productId,
      })
      productLinkCount++
    }

    // Link SOURCES_FROM relationships
    if (entity.sourcesFrom) {
      for (const sourceId of entity.sourcesFrom) {
        await runWriteTransaction(`
          MATCH (e:Entity {id: $entityId})
          MATCH (source:Entity {id: $sourceId})
          MERGE (e)-[:SOURCES_FROM]->(source)
        `, {
          entityId: entity.id,
          sourceId: sourceId,
        })
        sourcingLinkCount++
      }
    }
  }

  // Print role distribution
  const roleStats: Record<string, number> = {}
  for (const entity of ALL_ENTITIES) {
    for (const role of entity.roles) {
      roleStats[role] = (roleStats[role] || 0) + 1
    }
  }

  console.log(`  ✓ ${entityCount} entities created`)
  console.log(`    Role distribution:`)
  for (const [role, count] of Object.entries(roleStats).sort()) {
    console.log(`      - ${role}: ${count}`)
  }
  console.log(`  ✓ ${productLinkCount} product relationships`)
  console.log(`  ✓ ${regionLinkCount} region relationships`)
  if (sourcingLinkCount > 0) {
    console.log(`  ✓ ${sourcingLinkCount} sourcing relationships`)
  }
  console.log('\n=== Entity seeding complete ===\n')
}
