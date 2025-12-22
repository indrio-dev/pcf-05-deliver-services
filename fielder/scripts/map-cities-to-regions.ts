#!/usr/bin/env tsx
/**
 * Map Cities to Growing Regions
 *
 * Creates city → growing region mappings based on:
 * - Known agricultural geography
 * - County boundaries
 * - Existing entity locations
 *
 * Usage:
 *   npx tsx scripts/map-cities-to-regions.ts
 */

import fs from 'fs'

// City → Growing Region mapping (curated based on agricultural geography)
const CITY_TO_REGION: Record<string, { state: string, city: string, regionId: string }[]> = {
  // Florida
  FL: [
    // Indian River
    { state: 'FL', city: 'Vero Beach', regionId: 'indian_river_fl' },
    { state: 'FL', city: 'Fort Pierce', regionId: 'indian_river_fl' },
    { state: 'FL', city: 'Sebastian', regionId: 'indian_river_fl' },
    { state: 'FL', city: 'Fellsmere', regionId: 'indian_river_fl' },
    { state: 'FL', city: 'Indian River Region', regionId: 'indian_river_fl' },
    // Central Florida
    { state: 'FL', city: 'Citra', regionId: 'central_fl' },
    { state: 'FL', city: 'Dundee', regionId: 'central_fl' },
    { state: 'FL', city: 'Winter Haven', regionId: 'central_fl' },
    { state: 'FL', city: 'Lakeland', regionId: 'central_fl' },
    { state: 'FL', city: 'Maitland', regionId: 'central_fl' },
    { state: 'FL', city: 'Haines City', regionId: 'central_fl' },
    // Plant City
    { state: 'FL', city: 'Plant City', regionId: 'plant_city_fl' },
    // South Florida
    { state: 'FL', city: 'Homestead', regionId: 'south_fl' },
    { state: 'FL', city: 'West Palm Beach', regionId: 'south_fl' },
    { state: 'FL', city: 'Miami', regionId: 'south_fl' },
    { state: 'FL', city: 'Florida', regionId: 'central_fl' },  // Generic - default to central
  ],

  // California (Central Valley = Fresno, Tulare, Kern, Kings, Madera counties)
  CA: [
    // Central Valley
    { state: 'CA', city: 'Bakersfield', regionId: 'central_valley_ca' },
    { state: 'CA', city: 'Fresno', regionId: 'central_valley_ca' },
    { state: 'CA', city: 'Delano', regionId: 'central_valley_ca' },
    { state: 'CA', city: 'Reedley', regionId: 'central_valley_ca' },
    { state: 'CA', city: 'Madera', regionId: 'central_valley_ca' },
    { state: 'CA', city: 'Madera/Fresno County', regionId: 'central_valley_ca' },
    { state: 'CA', city: 'Visalia', regionId: 'central_valley_ca' },
    { state: 'CA', city: 'Tulare', regionId: 'central_valley_ca' },
    { state: 'CA', city: 'Brentwood', regionId: 'central_valley_ca' },
    { state: 'CA', city: 'Kingsburg', regionId: 'central_valley_ca' },
    { state: 'CA', city: 'Dinuba', regionId: 'central_valley_ca' },
    { state: 'CA', city: 'Parlier', regionId: 'central_valley_ca' },
    { state: 'CA', city: 'Selma', regionId: 'central_valley_ca' },
    { state: 'CA', city: 'Sanger', regionId: 'central_valley_ca' },
    { state: 'CA', city: 'Fowler', regionId: 'central_valley_ca' },
    { state: 'CA', city: 'Orange Cove', regionId: 'central_valley_ca' },
    { state: 'CA', city: 'Earlimart', regionId: 'central_valley_ca' },
    { state: 'CA', city: 'Cutler', regionId: 'central_valley_ca' },
    { state: 'CA', city: 'Exeter', regionId: 'central_valley_ca' },
    { state: 'CA', city: 'Porterville', regionId: 'central_valley_ca' },
    { state: 'CA', city: 'Lindsay', regionId: 'central_valley_ca' },
    { state: 'CA', city: 'Arvin', regionId: 'central_valley_ca' },
    { state: 'CA', city: 'Ducor', regionId: 'central_valley_ca' },
    { state: 'CA', city: 'Lost Hills', regionId: 'central_valley_ca' },
    { state: 'CA', city: 'Wasco', regionId: 'central_valley_ca' },
    { state: 'CA', city: 'Shafter', regionId: 'central_valley_ca' },
    { state: 'CA', city: 'Los Angeles', regionId: 'southern_ca' },
    { state: 'CA', city: 'Vernon', regionId: 'southern_ca' },
    { state: 'CA', city: 'South San Francisco', regionId: 'central_valley_ca' },  // Bay Area produce distribution
    { state: 'CA', city: 'San Joaquin Valley', regionId: 'central_valley_ca' },
    { state: 'CA', city: 'Coachella', regionId: 'southern_ca' },
    { state: 'CA', city: 'Riverside', regionId: 'southern_ca' },
    { state: 'CA', city: 'Fillmore', regionId: 'southern_ca' },
    { state: 'CA', city: 'Fallbrook', regionId: 'southern_ca' },
    { state: 'CA', city: 'Escondido', regionId: 'southern_ca' },
    { state: 'CA', city: 'Carpinteria', regionId: 'southern_ca' },
    // Wine Country
    { state: 'CA', city: 'Napa', regionId: 'napa_valley_ca' },
    { state: 'CA', city: 'St. Helena', regionId: 'napa_valley_ca' },
    { state: 'CA', city: 'Yountville', regionId: 'napa_valley_ca' },
    { state: 'CA', city: 'Sonoma', regionId: 'sonoma_ca' },
    { state: 'CA', city: 'Sebastopol', regionId: 'sonoma_ca' },
    // Salinas Valley
    { state: 'CA', city: 'Salinas', regionId: 'salinas_valley_ca' },
    { state: 'CA', city: 'Watsonville', regionId: 'salinas_valley_ca' },
    { state: 'CA', city: 'Castroville', regionId: 'salinas_valley_ca' },
    { state: 'CA', city: 'Monterey', regionId: 'salinas_valley_ca' },
    { state: 'CA', city: 'Hollister', regionId: 'salinas_valley_ca' },
    { state: 'CA', city: 'Santa Maria', regionId: 'salinas_valley_ca' },
    // Southern CA
    { state: 'CA', city: 'Oxnard', regionId: 'southern_ca' },
    { state: 'CA', city: 'Santa Paula', regionId: 'southern_ca' },
    { state: 'CA', city: 'Ventura', regionId: 'southern_ca' },
  ],

  // Washington
  WA: [
    { state: 'WA', city: 'Wenatchee', regionId: 'wenatchee_wa' },
    { state: 'WA', city: 'East Wenatchee', regionId: 'wenatchee_wa' },
    { state: 'WA', city: 'Cashmere', regionId: 'wenatchee_wa' },
    { state: 'WA', city: 'Yakima', regionId: 'yakima_valley_wa' },
    { state: 'WA', city: 'Tieton', regionId: 'yakima_valley_wa' },
    { state: 'WA', city: 'Selah', regionId: 'yakima_valley_wa' },
    { state: 'WA', city: 'Naches', regionId: 'yakima_valley_wa' },
    { state: 'WA', city: 'Brewster', regionId: 'okanogan_wa' },
    { state: 'WA', city: 'Chelan', regionId: 'okanogan_wa' },
    { state: 'WA', city: 'Lake Chelan', regionId: 'okanogan_wa' },
  ],

  // Texas
  TX: [
    // Rio Grande Valley
    { state: 'TX', city: 'Mission', regionId: 'rio_grande_tx' },
    { state: 'TX', city: 'McAllen', regionId: 'rio_grande_tx' },
    { state: 'TX', city: 'Edinburg', regionId: 'rio_grande_tx' },
    { state: 'TX', city: 'Weslaco', regionId: 'rio_grande_tx' },
    { state: 'TX', city: 'Alamo', regionId: 'rio_grande_tx' },
    { state: 'TX', city: 'Pharr', regionId: 'rio_grande_tx' },
    { state: 'TX', city: 'Harlingen', regionId: 'rio_grande_tx' },
    { state: 'TX', city: 'Brownsville', regionId: 'rio_grande_tx' },
    { state: 'TX', city: 'Donna', regionId: 'rio_grande_tx' },
    { state: 'TX', city: 'Mercedes', regionId: 'rio_grande_tx' },
    { state: 'TX', city: 'Rio Grande Valley', regionId: 'rio_grande_tx' },
    { state: 'TX', city: 'Mercedes / Donna', regionId: 'rio_grande_tx' },
    // Hill Country
    { state: 'TX', city: 'Fredericksburg', regionId: 'hill_country_tx' },
    { state: 'TX', city: 'Stonewall', regionId: 'hill_country_tx' },
    { state: 'TX', city: 'Johnson City', regionId: 'hill_country_tx' },
    { state: 'TX', city: 'Blanco', regionId: 'hill_country_tx' },
    { state: 'TX', city: 'Dripping Springs', regionId: 'hill_country_tx' },
    // Pecan Belt (Central TX)
    { state: 'TX', city: 'San Saba', regionId: 'texas_pecan_belt' },
    { state: 'TX', city: 'Brownwood', regionId: 'texas_pecan_belt' },
    { state: 'TX', city: 'Lampasas', regionId: 'texas_pecan_belt' },
    { state: 'TX', city: 'Llano', regionId: 'texas_pecan_belt' },
    { state: 'TX', city: 'Caldwell', regionId: 'texas_pecan_belt' },
    { state: 'TX', city: 'Burleson County', regionId: 'texas_pecan_belt' },
    { state: 'TX', city: 'Bayview', regionId: 'texas_pecan_belt' },
    // Major cities - use closest agricultural region
    { state: 'TX', city: 'Houston', regionId: 'rio_grande_tx' },  // Closer to RGV than Hill Country
    { state: 'TX', city: 'Dallas', regionId: 'texas_pecan_belt' },  // Central TX
    { state: 'TX', city: 'San Antonio', regionId: 'hill_country_tx' },
    { state: 'TX', city: 'Austin', regionId: 'hill_country_tx' },
    { state: 'TX', city: 'El Paso', regionId: 'rio_grande_tx' },  // Western TX, similar climate
  ],

  // Georgia
  GA: [
    { state: 'GA', city: 'Fort Valley', regionId: 'middle_ga' },
    { state: 'GA', city: 'Byron', regionId: 'middle_ga' },
    { state: 'GA', city: 'Musella', regionId: 'middle_ga' },
    { state: 'GA', city: 'Vidalia', regionId: 'vidalia_ga' },
    { state: 'GA', city: 'Glennville', regionId: 'vidalia_ga' },
    { state: 'GA', city: 'Vienna', regionId: 'south_ga' },
    { state: 'GA', city: 'Ocilla', regionId: 'south_ga' },
  ],

  // Michigan
  MI: [
    { state: 'MI', city: 'Traverse City', regionId: 'traverse_city_mi' },
    { state: 'MI', city: 'Suttons Bay', regionId: 'traverse_city_mi' },
    { state: 'MI', city: 'Sparta', regionId: 'southwest_mi' },
    { state: 'MI', city: 'Bangor', regionId: 'southwest_mi' },
    { state: 'MI', city: 'South Haven', regionId: 'southwest_mi' },
  ],

  // New York
  NY: [
    // Hudson Valley
    { state: 'NY', city: 'Hudson', regionId: 'hudson_valley_ny' },
    { state: 'NY', city: 'Highland', regionId: 'hudson_valley_ny' },
    { state: 'NY', city: 'Hudson Valley', regionId: 'hudson_valley_ny' },
    { state: 'NY', city: 'New Paltz', regionId: 'hudson_valley_ny' },
    { state: 'NY', city: 'Milton', regionId: 'hudson_valley_ny' },
    // Finger Lakes
    { state: 'NY', city: 'Geneva', regionId: 'finger_lakes_ny' },
    { state: 'NY', city: 'Penn Yan', regionId: 'finger_lakes_ny' },
    // Generic fallback
    { state: 'NY', city: 'New York State', regionId: 'hudson_valley_ny' },  // Default to Hudson Valley
  ],

  // Oregon
  OR: [
    { state: 'OR', city: 'Hood River', regionId: 'hood_river_or' },
    { state: 'OR', city: 'Odell', regionId: 'hood_river_or' },
    { state: 'OR', city: 'Hillsboro', regionId: 'willamette_valley_or' },
    { state: 'OR', city: 'Salem', regionId: 'willamette_valley_or' },
    { state: 'OR', city: 'Eugene', regionId: 'willamette_valley_or' },
  ],
}

async function main() {
  console.log('╔════════════════════════════════════════════════════╗')
  console.log('║     MAP CITIES TO GROWING REGIONS                  ║')
  console.log('╚════════════════════════════════════════════════════╝\n')

  // Load entity data
  const packinghouses = JSON.parse(fs.readFileSync('consolidated_packinghouses_enriched.json', 'utf-8'))
  const localharvest = JSON.parse(fs.readFileSync('data/research/localharvest-farms.json', 'utf-8'))

  // Flatten city mapping
  const cityMap = new Map<string, string>()
  for (const state in CITY_TO_REGION) {
    for (const mapping of CITY_TO_REGION[state]) {
      const key = `${mapping.city}|${mapping.state}`
      cityMap.set(key, mapping.regionId)
    }
  }

  console.log(`📍 City → Region mapping table: ${cityMap.size} cities\n`)

  // Map packinghouses
  let packersMapped = 0
  for (const packer of packinghouses) {
    if (!packer.city || packer.growingRegion) continue  // Skip if no city or already has region

    const key = `${packer.city}|${packer.state}`
    const regionId = cityMap.get(key)

    if (regionId) {
      packer.growingRegion = regionId
      packersMapped++
    }
  }

  console.log(`✅ Mapped ${packersMapped} packinghouses to growing regions`)

  // Map LocalHarvest farms
  let farmsMapped = 0
  for (const stateCode in localharvest.states) {
    const stateData = localharvest.states[stateCode]
    for (const farm of stateData.farms || []) {
      const city = farm.location?.city
      if (!city || farm.growingRegion) continue

      const key = `${city}|${stateCode}`
      const regionId = cityMap.get(key)

      if (regionId) {
        farm.growingRegion = regionId
        farmsMapped++
      }
    }
  }

  console.log(`✅ Mapped ${farmsMapped} LocalHarvest farms to growing regions\n`)

  // Save enriched data
  fs.writeFileSync('consolidated_packinghouses_with_regions.json', JSON.stringify(packinghouses, null, 2))
  fs.writeFileSync('data/research/localharvest-farms-with-regions.json', JSON.stringify(localharvest, null, 2))

  console.log('💾 Saved:')
  console.log('   - consolidated_packinghouses_with_regions.json')
  console.log('   - data/research/localharvest-farms-with-regions.json\n')

  // Report unmapped (need research)
  const unmappedPackers = packinghouses.filter((p: any) => p.city && !p.growingRegion)
  console.log(`⚠️  Unmapped packinghouses: ${unmappedPackers.length}`)

  if (unmappedPackers.length > 0) {
    console.log('\nTop 10 unmapped cities (need region research):')
    const cityCount = new Map<string, number>()
    for (const p of unmappedPackers) {
      const key = `${p.city}, ${p.state}`
      cityCount.set(key, (cityCount.get(key) || 0) + 1)
    }
    const sorted = Array.from(cityCount.entries()).sort((a, b) => b[1] - a[1])
    for (const [city, count] of sorted.slice(0, 10)) {
      console.log(`  - ${city}: ${count} entities`)
    }
  }

  console.log('\n✨ Region mapping complete!')
  console.log(`\nNext: Regenerate TypeScript entities and reload to Neo4j\n`)
}

main()
