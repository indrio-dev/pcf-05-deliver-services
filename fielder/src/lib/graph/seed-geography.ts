/**
 * Geographic Hierarchy Seed Data
 *
 * Seeds the knowledge graph with:
 * - US regions
 * - States
 * - USDA Hardiness Zones
 * - Key growing regions
 */

import { runWriteTransaction } from './neo4j'

// =============================================================================
// US REGIONS
// =============================================================================

const US_REGIONS = [
  { id: 'northeast', name: 'Northeast', states: ['CT', 'DE', 'MA', 'MD', 'ME', 'NH', 'NJ', 'NY', 'PA', 'RI', 'VT'] },
  { id: 'southeast', name: 'Southeast', states: ['AL', 'AR', 'FL', 'GA', 'KY', 'LA', 'MS', 'NC', 'SC', 'TN', 'VA', 'WV'] },
  { id: 'midwest', name: 'Midwest', states: ['IA', 'IL', 'IN', 'KS', 'MI', 'MN', 'MO', 'ND', 'NE', 'OH', 'SD', 'WI'] },
  { id: 'southwest', name: 'Southwest', states: ['AZ', 'NM', 'OK', 'TX'] },
  { id: 'west', name: 'West', states: ['CA', 'CO', 'ID', 'MT', 'NV', 'OR', 'UT', 'WA', 'WY'] },
  { id: 'pacific', name: 'Pacific', states: ['AK', 'HI'] },
]

// =============================================================================
// US STATES
// =============================================================================

const US_STATES: Array<{ code: string; name: string; fips: string }> = [
  { code: 'AL', name: 'Alabama', fips: '01' },
  { code: 'AK', name: 'Alaska', fips: '02' },
  { code: 'AZ', name: 'Arizona', fips: '04' },
  { code: 'AR', name: 'Arkansas', fips: '05' },
  { code: 'CA', name: 'California', fips: '06' },
  { code: 'CO', name: 'Colorado', fips: '08' },
  { code: 'CT', name: 'Connecticut', fips: '09' },
  { code: 'DE', name: 'Delaware', fips: '10' },
  { code: 'FL', name: 'Florida', fips: '12' },
  { code: 'GA', name: 'Georgia', fips: '13' },
  { code: 'HI', name: 'Hawaii', fips: '15' },
  { code: 'ID', name: 'Idaho', fips: '16' },
  { code: 'IL', name: 'Illinois', fips: '17' },
  { code: 'IN', name: 'Indiana', fips: '18' },
  { code: 'IA', name: 'Iowa', fips: '19' },
  { code: 'KS', name: 'Kansas', fips: '20' },
  { code: 'KY', name: 'Kentucky', fips: '21' },
  { code: 'LA', name: 'Louisiana', fips: '22' },
  { code: 'ME', name: 'Maine', fips: '23' },
  { code: 'MD', name: 'Maryland', fips: '24' },
  { code: 'MA', name: 'Massachusetts', fips: '25' },
  { code: 'MI', name: 'Michigan', fips: '26' },
  { code: 'MN', name: 'Minnesota', fips: '27' },
  { code: 'MS', name: 'Mississippi', fips: '28' },
  { code: 'MO', name: 'Missouri', fips: '29' },
  { code: 'MT', name: 'Montana', fips: '30' },
  { code: 'NE', name: 'Nebraska', fips: '31' },
  { code: 'NV', name: 'Nevada', fips: '32' },
  { code: 'NH', name: 'New Hampshire', fips: '33' },
  { code: 'NJ', name: 'New Jersey', fips: '34' },
  { code: 'NM', name: 'New Mexico', fips: '35' },
  { code: 'NY', name: 'New York', fips: '36' },
  { code: 'NC', name: 'North Carolina', fips: '37' },
  { code: 'ND', name: 'North Dakota', fips: '38' },
  { code: 'OH', name: 'Ohio', fips: '39' },
  { code: 'OK', name: 'Oklahoma', fips: '40' },
  { code: 'OR', name: 'Oregon', fips: '41' },
  { code: 'PA', name: 'Pennsylvania', fips: '42' },
  { code: 'RI', name: 'Rhode Island', fips: '44' },
  { code: 'SC', name: 'South Carolina', fips: '45' },
  { code: 'SD', name: 'South Dakota', fips: '46' },
  { code: 'TN', name: 'Tennessee', fips: '47' },
  { code: 'TX', name: 'Texas', fips: '48' },
  { code: 'UT', name: 'Utah', fips: '49' },
  { code: 'VT', name: 'Vermont', fips: '50' },
  { code: 'VA', name: 'Virginia', fips: '51' },
  { code: 'WA', name: 'Washington', fips: '53' },
  { code: 'WV', name: 'West Virginia', fips: '54' },
  { code: 'WI', name: 'Wisconsin', fips: '55' },
  { code: 'WY', name: 'Wyoming', fips: '56' },
]

// =============================================================================
// USDA HARDINESS ZONES
// =============================================================================

interface USDAZone {
  zone: string
  minTempF: number
  maxTempF: number
  typicalChillHours: [number, number]
  chillHoursReliability: 'high' | 'medium' | 'low'
  growingSeasonDays: [number, number]
  suitableCrops: string[]
  marginalCrops: string[]
}

const USDA_ZONES: USDAZone[] = [
  // Zone 3
  { zone: '3a', minTempF: -40, maxTempF: -35, typicalChillHours: [2000, 2500], chillHoursReliability: 'high', growingSeasonDays: [90, 120], suitableCrops: ['cold_hardy_apple', 'tart_cherry', 'currant'], marginalCrops: ['peach', 'sweet_cherry'] },
  { zone: '3b', minTempF: -35, maxTempF: -30, typicalChillHours: [1800, 2200], chillHoursReliability: 'high', growingSeasonDays: [100, 130], suitableCrops: ['cold_hardy_apple', 'tart_cherry', 'currant'], marginalCrops: ['peach', 'sweet_cherry'] },

  // Zone 4
  { zone: '4a', minTempF: -30, maxTempF: -25, typicalChillHours: [1600, 2000], chillHoursReliability: 'high', growingSeasonDays: [120, 150], suitableCrops: ['apple', 'tart_cherry', 'plum'], marginalCrops: ['peach', 'sweet_cherry'] },
  { zone: '4b', minTempF: -25, maxTempF: -20, typicalChillHours: [1400, 1800], chillHoursReliability: 'high', growingSeasonDays: [130, 160], suitableCrops: ['apple', 'tart_cherry', 'plum'], marginalCrops: ['peach'] },

  // Zone 5
  { zone: '5a', minTempF: -20, maxTempF: -15, typicalChillHours: [1200, 1600], chillHoursReliability: 'high', growingSeasonDays: [150, 180], suitableCrops: ['apple', 'peach', 'cherry', 'plum'], marginalCrops: ['apricot'] },
  { zone: '5b', minTempF: -15, maxTempF: -10, typicalChillHours: [1000, 1400], chillHoursReliability: 'high', growingSeasonDays: [160, 190], suitableCrops: ['apple', 'peach', 'cherry', 'plum'], marginalCrops: ['apricot', 'fig'] },

  // Zone 6
  { zone: '6a', minTempF: -10, maxTempF: -5, typicalChillHours: [800, 1200], chillHoursReliability: 'high', growingSeasonDays: [170, 200], suitableCrops: ['apple', 'peach', 'cherry', 'plum', 'blackberry'], marginalCrops: ['fig', 'grape'] },
  { zone: '6b', minTempF: -5, maxTempF: 0, typicalChillHours: [700, 1000], chillHoursReliability: 'high', growingSeasonDays: [180, 210], suitableCrops: ['apple', 'peach', 'cherry', 'grape', 'blueberry'], marginalCrops: ['fig', 'pomegranate'] },

  // Zone 7
  { zone: '7a', minTempF: 0, maxTempF: 5, typicalChillHours: [600, 800], chillHoursReliability: 'medium', growingSeasonDays: [200, 230], suitableCrops: ['peach', 'blueberry', 'blackberry', 'grape', 'fig'], marginalCrops: ['citrus_cold_hardy'] },
  { zone: '7b', minTempF: 5, maxTempF: 10, typicalChillHours: [500, 700], chillHoursReliability: 'medium', growingSeasonDays: [210, 240], suitableCrops: ['peach', 'blueberry', 'blackberry', 'grape', 'fig'], marginalCrops: ['satsuma'] },

  // Zone 8
  { zone: '8a', minTempF: 10, maxTempF: 15, typicalChillHours: [400, 600], chillHoursReliability: 'medium', growingSeasonDays: [230, 260], suitableCrops: ['low_chill_peach', 'blueberry', 'blackberry', 'fig', 'satsuma'], marginalCrops: ['orange', 'grapefruit'] },
  { zone: '8b', minTempF: 15, maxTempF: 20, typicalChillHours: [300, 500], chillHoursReliability: 'low', growingSeasonDays: [250, 280], suitableCrops: ['low_chill_peach', 'citrus', 'fig', 'olive'], marginalCrops: ['mango', 'avocado'] },

  // Zone 9
  { zone: '9a', minTempF: 20, maxTempF: 25, typicalChillHours: [200, 400], chillHoursReliability: 'low', growingSeasonDays: [270, 300], suitableCrops: ['citrus', 'fig', 'olive', 'low_chill_stone_fruit'], marginalCrops: ['mango', 'avocado'] },
  { zone: '9b', minTempF: 25, maxTempF: 30, typicalChillHours: [100, 300], chillHoursReliability: 'low', growingSeasonDays: [280, 320], suitableCrops: ['citrus', 'subtropical', 'low_chill_stone_fruit'], marginalCrops: ['tropical'] },

  // Zone 10
  { zone: '10a', minTempF: 30, maxTempF: 35, typicalChillHours: [50, 150], chillHoursReliability: 'low', growingSeasonDays: [300, 340], suitableCrops: ['citrus', 'avocado', 'mango', 'tropical'], marginalCrops: ['lychee', 'starfruit'] },
  { zone: '10b', minTempF: 35, maxTempF: 40, typicalChillHours: [0, 100], chillHoursReliability: 'low', growingSeasonDays: [320, 365], suitableCrops: ['citrus', 'avocado', 'mango', 'tropical', 'banana'], marginalCrops: [] },

  // Zone 11+
  { zone: '11a', minTempF: 40, maxTempF: 45, typicalChillHours: [0, 50], chillHoursReliability: 'low', growingSeasonDays: [350, 365], suitableCrops: ['tropical', 'banana', 'papaya', 'pineapple'], marginalCrops: [] },
  { zone: '11b', minTempF: 45, maxTempF: 50, typicalChillHours: [0, 25], chillHoursReliability: 'low', growingSeasonDays: [365, 365], suitableCrops: ['tropical', 'banana', 'papaya', 'coconut'], marginalCrops: [] },
]

// =============================================================================
// KEY GROWING REGIONS
// =============================================================================

interface GrowingRegion {
  id: string
  name: string
  state: string
  description: string
  primaryCrops: string[]
  climateZone: string
  typicalUSDAZones: string[]
}

const GROWING_REGIONS: GrowingRegion[] = [
  // Florida
  { id: 'indian_river_fl', name: 'Indian River District', state: 'FL', description: "Florida's premium citrus belt along the Indian River Lagoon", primaryCrops: ['citrus', 'blueberry'], climateZone: 'subtropical_humid', typicalUSDAZones: ['9b', '10a'] },
  { id: 'central_fl', name: 'Central Florida', state: 'FL', description: 'Polk, Highlands, and surrounding citrus counties', primaryCrops: ['citrus', 'blueberry', 'strawberry'], climateZone: 'subtropical_humid', typicalUSDAZones: ['9a', '9b'] },
  { id: 'plant_city_fl', name: 'Plant City', state: 'FL', description: 'Winter strawberry capital', primaryCrops: ['strawberry'], climateZone: 'subtropical_humid', typicalUSDAZones: ['9b'] },
  { id: 'south_fl', name: 'South Florida', state: 'FL', description: 'Tropical and subtropical fruit region', primaryCrops: ['avocado', 'mango', 'tropical_fruit'], climateZone: 'tropical', typicalUSDAZones: ['10b', '11a'] },

  // California
  { id: 'central_valley_ca', name: 'Central Valley', state: 'CA', description: "World's most productive agricultural region", primaryCrops: ['stone_fruit', 'citrus', 'grapes', 'nuts', 'vegetables'], climateZone: 'mediterranean', typicalUSDAZones: ['9a', '9b'] },
  { id: 'napa_valley_ca', name: 'Napa Valley', state: 'CA', description: 'Premium wine grape region', primaryCrops: ['wine_grapes'], climateZone: 'mediterranean', typicalUSDAZones: ['9a', '9b'] },
  { id: 'sonoma_ca', name: 'Sonoma County', state: 'CA', description: 'Wine and heirloom apple region', primaryCrops: ['wine_grapes', 'apple', 'pear'], climateZone: 'mediterranean', typicalUSDAZones: ['9a', '9b'] },
  { id: 'salinas_valley_ca', name: 'Salinas Valley', state: 'CA', description: 'Salad bowl of America', primaryCrops: ['lettuce', 'vegetables', 'strawberry'], climateZone: 'mediterranean_cool', typicalUSDAZones: ['9a', '9b'] },
  { id: 'southern_ca', name: 'Southern California', state: 'CA', description: 'Citrus and avocado region', primaryCrops: ['citrus', 'avocado'], climateZone: 'mediterranean', typicalUSDAZones: ['10a', '10b'] },

  // Texas
  { id: 'rio_grande_tx', name: 'Rio Grande Valley', state: 'TX', description: 'Texas citrus region', primaryCrops: ['citrus', 'vegetables'], climateZone: 'subtropical', typicalUSDAZones: ['9b', '10a'] },
  { id: 'hill_country_tx', name: 'Texas Hill Country', state: 'TX', description: 'Peach and wine region', primaryCrops: ['peach', 'wine_grapes'], climateZone: 'subtropical_continental', typicalUSDAZones: ['8a', '8b'] },
  { id: 'texas_pecan_belt', name: 'Texas Pecan Belt (Central)', state: 'TX', description: 'Central Texas pecan region along river valleys', primaryCrops: ['pecan'], climateZone: 'subtropical_continental', typicalUSDAZones: ['8a', '8b'] },

  // Georgia
  { id: 'middle_ga', name: 'Middle Georgia', state: 'GA', description: 'Peach and pecan region', primaryCrops: ['peach', 'pecan', 'blueberry'], climateZone: 'humid_subtropical', typicalUSDAZones: ['8a', '8b'] },
  { id: 'vidalia_ga', name: 'Vidalia Onion Region', state: 'GA', description: 'Southeast Georgia Vidalia onion growing area', primaryCrops: ['onion'], climateZone: 'humid_subtropical', typicalUSDAZones: ['8b', '9a'] },
  { id: 'south_ga', name: 'South Georgia', state: 'GA', description: 'South Georgia pecan and peanut region', primaryCrops: ['pecan', 'peanut'], climateZone: 'humid_subtropical', typicalUSDAZones: ['8b', '9a'] },

  // Washington
  { id: 'yakima_valley_wa', name: 'Yakima Valley', state: 'WA', description: 'Apple and cherry region', primaryCrops: ['apple', 'cherry', 'wine_grapes', 'hops'], climateZone: 'continental', typicalUSDAZones: ['6b', '7a'] },
  { id: 'wenatchee_wa', name: 'Wenatchee Valley', state: 'WA', description: 'Apple capital of America', primaryCrops: ['apple', 'cherry', 'pear'], climateZone: 'continental', typicalUSDAZones: ['6a', '6b'] },
  { id: 'okanogan_wa', name: 'Okanogan Valley', state: 'WA', description: 'Northern Washington apple and cherry region', primaryCrops: ['apple', 'cherry'], climateZone: 'continental', typicalUSDAZones: ['5b', '6a'] },

  // Michigan
  { id: 'traverse_city_mi', name: 'Traverse City', state: 'MI', description: 'Cherry capital of America', primaryCrops: ['tart_cherry', 'sweet_cherry', 'wine_grapes'], climateZone: 'continental_lake_effect', typicalUSDAZones: ['5b', '6a'] },
  { id: 'southwest_mi', name: 'Southwest Michigan', state: 'MI', description: 'Fruit belt along Lake Michigan', primaryCrops: ['blueberry', 'apple', 'peach'], climateZone: 'continental_lake_effect', typicalUSDAZones: ['5b', '6a'] },

  // New York
  { id: 'hudson_valley_ny', name: 'Hudson Valley', state: 'NY', description: 'Historic apple region', primaryCrops: ['apple', 'pear'], climateZone: 'continental', typicalUSDAZones: ['5b', '6a'] },
  { id: 'finger_lakes_ny', name: 'Finger Lakes', state: 'NY', description: 'Wine and apple region', primaryCrops: ['wine_grapes', 'apple'], climateZone: 'continental_lake_effect', typicalUSDAZones: ['5b', '6a'] },

  // Oregon
  { id: 'willamette_valley_or', name: 'Willamette Valley', state: 'OR', description: 'Premium berry and wine region', primaryCrops: ['berries', 'wine_grapes', 'hazelnut'], climateZone: 'mediterranean_cool', typicalUSDAZones: ['8a', '8b'] },
  { id: 'hood_river_or', name: 'Hood River Valley', state: 'OR', description: 'Pear and cherry region', primaryCrops: ['pear', 'cherry', 'apple'], climateZone: 'continental', typicalUSDAZones: ['6b', '7a'] },
]

// =============================================================================
// SEED FUNCTIONS
// =============================================================================

export async function seedCountry(): Promise<void> {
  console.log('Seeding country...')
  await runWriteTransaction(`
    MERGE (c:Country {code: 'US'})
    SET c.name = 'United States'
    RETURN c
  `)
  console.log('  ✓ United States')
}

export async function seedRegions(): Promise<void> {
  console.log('Seeding US regions...')
  for (const region of US_REGIONS) {
    await runWriteTransaction(`
      MATCH (c:Country {code: 'US'})
      MERGE (r:Region {id: $id})
      SET r.name = $name, r.states = $states
      MERGE (c)-[:CONTAINS_REGION]->(r)
    `, region)
    console.log(`  ✓ ${region.name}`)
  }
}

export async function seedStates(): Promise<void> {
  console.log('Seeding US states...')
  for (const state of US_STATES) {
    // Find which region this state belongs to
    const region = US_REGIONS.find(r => r.states.includes(state.code))
    if (!region) continue

    await runWriteTransaction(`
      MATCH (r:Region {id: $regionId})
      MERGE (s:State {code: $code})
      SET s.name = $name, s.fips = $fips
      MERGE (r)-[:CONTAINS_STATE]->(s)
    `, { ...state, regionId: region.id })
  }
  console.log(`  ✓ ${US_STATES.length} states`)
}

export async function seedUSDAZones(): Promise<void> {
  console.log('Seeding USDA hardiness zones...')
  for (const zone of USDA_ZONES) {
    await runWriteTransaction(`
      MERGE (z:USDAZone {zone: $zone})
      SET z.minTempF = $minTempF,
          z.maxTempF = $maxTempF,
          z.typicalChillHours = $typicalChillHours,
          z.chillHoursReliability = $chillHoursReliability,
          z.growingSeasonDays = $growingSeasonDays,
          z.suitableCrops = $suitableCrops,
          z.marginalCrops = $marginalCrops
    `, zone)
  }
  console.log(`  ✓ ${USDA_ZONES.length} zones (3a through 11b)`)
}

export async function seedGrowingRegions(): Promise<void> {
  console.log('Seeding growing regions...')
  for (const region of GROWING_REGIONS) {
    await runWriteTransaction(`
      MATCH (s:State {code: $state})
      MERGE (gr:GrowingRegion {id: $id})
      SET gr.name = $name,
          gr.description = $description,
          gr.primaryCrops = $primaryCrops,
          gr.climateZone = $climateZone,
          gr.typicalUSDAZones = $typicalUSDAZones
      MERGE (s)-[:CONTAINS_GROWING_REGION]->(gr)
    `, region)

    // Link to USDA zones
    for (const zone of region.typicalUSDAZones) {
      await runWriteTransaction(`
        MATCH (gr:GrowingRegion {id: $regionId})
        MATCH (z:USDAZone {zone: $zone})
        MERGE (gr)-[:TYPICALLY_IN_ZONE]->(z)
      `, { regionId: region.id, zone })
    }
  }
  console.log(`  ✓ ${GROWING_REGIONS.length} growing regions`)
}

/**
 * Run all geographic seeding.
 */
export async function seedGeography(): Promise<void> {
  console.log('\n=== Seeding Geographic Hierarchy ===\n')
  await seedCountry()
  await seedRegions()
  await seedStates()
  await seedUSDAZones()
  await seedGrowingRegions()
  console.log('\n=== Geographic seeding complete ===\n')
}
