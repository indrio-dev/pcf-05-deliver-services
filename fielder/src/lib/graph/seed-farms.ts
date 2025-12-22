/**
 * Farm Seed Data
 *
 * Seeds the knowledge graph with DTC (direct-to-consumer) farms
 * researched from LocalHarvest and regional research.
 */

import { runWriteTransaction } from './neo4j'

// =============================================================================
// FARM DATA STRUCTURE
// =============================================================================

interface Farm {
  id: string
  name: string
  website?: string
  stateCode: string
  city?: string
  county?: string
  growingRegion?: string  // Links to GrowingRegion node
  products: string[]       // Product type IDs
  certifications?: string[]
  features?: string[]
  verificationLevel: 'unverified' | 'website_verified' | 'field_verified' | 'lab_verified'
  dataSource: string
}

// =============================================================================
// FLORIDA FARMS
// =============================================================================

const FLORIDA_FARMS: Farm[] = [
  // INDIAN RIVER CITRUS
  {
    id: 'indian_river_fruit_company',
    name: 'Indian River Fruit Company',
    website: 'https://www.indianriverfruits.com/',
    stateCode: 'FL',
    city: 'Vero Beach',
    county: 'Indian River',
    growingRegion: 'indian_river_fl',
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
    products: ['orange', 'grapefruit', 'tangerine'],
    features: ['family_owned_1950'],
    verificationLevel: 'website_verified',
    dataSource: 'florida-dtc-farms-research.md'
  },
  {
    id: 'hale_groves',
    name: 'Hale Groves',
    website: 'https://www.halegroves.com/',
    stateCode: 'FL',
    growingRegion: 'indian_river_fl',
    products: ['orange', 'grapefruit', 'tangerine', 'mango'],
    features: ['picked_to_order', 'no_storage'],
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
    products: ['mango', 'avocado'],
    features: ['year_round', 'ships_nationwide'],
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
    products: ['mango', 'avocado'],
    features: ['operating_since_1959', 'ships_nationwide'],
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
    products: ['strawberry', 'peach', 'tomato'],
    certifications: ['usda_organic'],
    features: ['csa_program', 'accepts_snap'],
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
    products: ['strawberry', 'blueberry', 'blackberry'],
    features: ['family_owned', 'florida_born'],
    verificationLevel: 'website_verified',
    dataSource: 'florida-dtc-farms-research.md'
  },
]

// =============================================================================
// CALIFORNIA FARMS
// =============================================================================

const CALIFORNIA_FARMS: Farm[] = [
  {
    id: 'frog_hollow_farm',
    name: 'Frog Hollow Farm',
    website: 'https://www.froghollow.com/',
    stateCode: 'CA',
    city: 'Brentwood',
    county: 'Contra Costa',
    growingRegion: 'central_valley_ca',
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
    products: ['tomato'],
    features: ['family_owned_since_1924'],
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
    products: ['apple'],
    verificationLevel: 'website_verified',
    dataSource: 'california-dtc-farms-research.md'
  },
]

// =============================================================================
// PACIFIC NORTHWEST FARMS
// =============================================================================

const PACIFIC_NW_FARMS: Farm[] = [
  {
    id: 'stemilt',
    name: 'Stemilt Growers',
    website: 'https://www.stemilt.com/',
    stateCode: 'WA',
    city: 'Wenatchee',
    county: 'Chelan',
    growingRegion: 'wenatchee_wa',
    products: ['apple', 'cherry', 'pear'],
    features: ['world_famous_fruit', 'family_owned'],
    verificationLevel: 'website_verified',
    dataSource: 'pacific-northwest-dtc-farms-research.md'
  },
  {
    id: 'chukar_cherries',
    name: 'Chukar Cherries',
    website: 'https://www.chukar.com/',
    stateCode: 'WA',
    city: 'Prosser',
    county: 'Benton',
    growingRegion: 'wenatchee_wa',
    products: ['cherry'],
    features: ['dried_cherries', 'chocolate_covered'],
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
    products: ['pear', 'apple', 'cherry'],
    features: ['royal_riviera_pears', 'gift_boxes'],
    verificationLevel: 'website_verified',
    dataSource: 'pacific-northwest-dtc-farms-research.md'
  },
]

// =============================================================================
// MIDWEST FARMS
// =============================================================================

const MIDWEST_FARMS: Farm[] = [
  {
    id: 'cherry_republic',
    name: 'Cherry Republic',
    website: 'https://www.cherryrepublic.com/',
    stateCode: 'MI',
    city: 'Glen Arbor',
    county: 'Leelanau',
    growingRegion: 'traverse_city_mi',
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
    products: ['cherry', 'apple'],
    features: ['montmorency_cherries', 'family_farm'],
    verificationLevel: 'website_verified',
    dataSource: 'midwest-dtc-farms-research.md'
  },
]

// =============================================================================
// TEXAS/SOUTHWEST FARMS
// =============================================================================

const TEXAS_FARMS: Farm[] = [
  {
    id: 'pittman_davis',
    name: 'Pittman & Davis',
    website: 'https://www.pittmandavis.com/',
    stateCode: 'TX',
    city: 'Harlingen',
    county: 'Cameron',
    growingRegion: 'rio_grande_tx',
    products: ['orange', 'grapefruit'],
    features: ['rio_red_grapefruit', 'texas_citrus'],
    verificationLevel: 'website_verified',
    dataSource: 'texas-southwest-dtc-farms-research.md'
  },
  {
    id: 'lone_star_citrus',
    name: 'Lone Star Citrus',
    website: 'https://www.lonestarcitrus.com/',
    stateCode: 'TX',
    growingRegion: 'rio_grande_tx',
    products: ['orange', 'grapefruit'],
    verificationLevel: 'website_verified',
    dataSource: 'texas-southwest-dtc-farms-research.md'
  },
]

// =============================================================================
// GEORGIA/SOUTHEAST FARMS
// =============================================================================

const SOUTHEAST_FARMS: Farm[] = [
  {
    id: 'pearson_farm',
    name: 'Pearson Farm',
    website: 'https://pearsonfarm.com/',
    stateCode: 'GA',
    city: 'Fort Valley',
    county: 'Peach',
    growingRegion: 'middle_ga',
    products: ['peach'],
    features: ['georgia_peaches', 'fifth_generation'],
    verificationLevel: 'website_verified',
    dataSource: 'southeast-dtc-farms-research.md'
  },
  {
    id: 'dickey_farms',
    name: 'Dickey Farms',
    website: 'https://dickeyfarms.com/',
    stateCode: 'GA',
    city: 'Musella',
    county: 'Crawford',
    growingRegion: 'middle_ga',
    products: ['peach'],
    features: ['heritage_peaches', 'farm_since_1897'],
    verificationLevel: 'website_verified',
    dataSource: 'southeast-dtc-farms-research.md'
  },
  {
    id: 'southern_grace_farms',
    name: 'Southern Grace Farms',
    website: 'https://southerngracefarms.com/',
    stateCode: 'GA',
    growingRegion: 'middle_ga',
    products: ['blueberry', 'strawberry'],
    features: ['u_pick', 'family_farm'],
    verificationLevel: 'website_verified',
    dataSource: 'southeast-dtc-farms-research.md'
  },
]

// =============================================================================
// ALL FARMS COMBINED
// =============================================================================

const ALL_FARMS: Farm[] = [
  ...FLORIDA_FARMS,
  ...CALIFORNIA_FARMS,
  ...PACIFIC_NW_FARMS,
  ...MIDWEST_FARMS,
  ...TEXAS_FARMS,
  ...SOUTHEAST_FARMS,
]

// =============================================================================
// SEED FUNCTIONS
// =============================================================================

export async function seedFarms(): Promise<void> {
  console.log('\n=== Seeding Farm Data ===\n')

  let farmCount = 0
  let productLinkCount = 0
  let regionLinkCount = 0

  for (const farm of ALL_FARMS) {
    // Create Farm node and link to State
    await runWriteTransaction(`
      MATCH (s:State {code: $stateCode})
      MERGE (f:Farm {id: $id})
      SET f.name = $name,
          f.website = $website,
          f.city = $city,
          f.county = $county,
          f.verificationLevel = $verificationLevel,
          f.dataSource = $dataSource,
          f.features = $features,
          f.certifications = $certifications
      MERGE (f)-[:LOCATED_IN]->(s)
    `, {
      id: farm.id,
      name: farm.name,
      stateCode: farm.stateCode,
      website: farm.website || null,
      city: farm.city || null,
      county: farm.county || null,
      verificationLevel: farm.verificationLevel,
      dataSource: farm.dataSource,
      features: farm.features || [],
      certifications: farm.certifications || [],
    })
    farmCount++

    // Link to GrowingRegion if specified
    if (farm.growingRegion) {
      await runWriteTransaction(`
        MATCH (f:Farm {id: $farmId})
        MATCH (gr:GrowingRegion {id: $growingRegionId})
        MERGE (f)-[:IN_GROWING_REGION]->(gr)
      `, {
        farmId: farm.id,
        growingRegionId: farm.growingRegion,
      })
      regionLinkCount++
    }

    // Link to ProductTypes
    for (const productId of farm.products) {
      await runWriteTransaction(`
        MATCH (f:Farm {id: $farmId})
        MATCH (pt:ProductType {id: $productId})
        MERGE (f)-[:GROWS]->(pt)
      `, {
        farmId: farm.id,
        productId: productId,
      })
      productLinkCount++
    }
  }

  console.log(`  ✓ ${farmCount} farms`)
  console.log(`  ✓ ${productLinkCount} farm→product links`)
  console.log(`  ✓ ${regionLinkCount} farm→region links`)
  console.log('\n=== Farm seeding complete ===\n')
}
