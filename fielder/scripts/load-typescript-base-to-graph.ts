#!/usr/bin/env tsx
/**
 * Load TypeScript Base Model to Neo4j
 *
 * Transforms embedded TypeScript relationships into explicit graph structure:
 * - 119 GrowingRegions with counties, cities, soil profiles
 * - 500 Cultivars with product hierarchy
 * - Complete geographic and product hierarchies
 *
 * This creates the FOUNDATION that entities link to.
 *
 * Usage:
 *   source .env.local && npx tsx scripts/load-typescript-base-to-graph.ts
 */

import { runWriteTransaction, closeDriver } from '../src/lib/graph/index'
import { US_GROWING_REGIONS } from '../src/lib/constants/growing-regions'

async function loadGeographicBase() {
  console.log('╔════════════════════════════════════════════════════════╗')
  console.log('║  LOAD TYPESCRIPT GEOGRAPHIC BASE TO NEO4J              ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  const regions = Object.values(US_GROWING_REGIONS)
  console.log(`Loading ${regions.length} growing regions...\n`)

  const countySet = new Set<string>()
  const citySet = new Set<string>()
  let regionsLoaded = 0

  for (const region of regions) {
    // Create GrowingRegion node
    await runWriteTransaction(`
      MERGE (r:GrowingRegion {id: $id})
      SET r.name = $name,
          r.displayName = $displayName,
          r.lat = $lat,
          r.lon = $lon,
          r.climate = $climate,
          r.primaryProducts = $primaryProducts,
          r.dtcActivity = $dtcActivity,
          r.sourceSystem = 'typescript'
    `, {
      id: region.id,
      name: region.name,
      displayName: region.displayName,
      lat: region.latitude,
      lon: region.longitude,
      climate: region.climate,
      primaryProducts: region.primaryProducts,
      dtcActivity: region.dtcActivity
    })

    // Create State relationship
    await runWriteTransaction(`
      MATCH (r:GrowingRegion {id: $regionId})
      MERGE (s:State {code: $stateCode})
      SET s.name = $stateCode
      MERGE (r)-[:IN_STATE]->(s)
    `, {
      regionId: region.id,
      stateCode: region.state
    })

    // Create Counties and relationships
    for (const countyName of region.counties) {
      countySet.add(`${countyName}|${region.state}`)

      await runWriteTransaction(`
        MATCH (r:GrowingRegion {id: $regionId})
        MERGE (c:County {name: $countyName, state: $state})
        MERGE (s:State {code: $state})
        MERGE (r)-[:HAS_COUNTY]->(c)
        MERGE (c)-[:IN_STATE]->(s)
      `, {
        regionId: region.id,
        countyName,
        state: region.state
      })
    }

    // Create Cities and relationships
    for (const cityName of region.primaryCities) {
      citySet.add(`${cityName}|${region.state}`)

      // Link city to first county (simplified - would need better mapping)
      const primaryCounty = region.counties[0]

      await runWriteTransaction(`
        MATCH (r:GrowingRegion {id: $regionId})
        MERGE (city:City {name: $cityName, state: $state})
        MERGE (county:County {name: $countyName, state: $state})
        MERGE (r)-[:HAS_CITY]->(city)
        MERGE (city)-[:IN_COUNTY]->(county)
        MERGE (city)-[:IN_STATE]->(:State {code: $state})
      `, {
        regionId: region.id,
        cityName,
        state: region.state,
        countyName: primaryCounty
      })
    }

    // Create SoilProfile node
    const soil = region.typicalSoil
    await runWriteTransaction(`
      MATCH (r:GrowingRegion {id: $regionId})
      MERGE (soil:SoilProfile {id: $soilId})
      SET soil.type = $type,
          soil.drainage = $drainage,
          soil.ph = $ph,
          soil.texture = $texture,
          soil.organic_matter = $organicMatter,
          soil.natural_mineralization = $naturalMineralization,
          soil.terroir_effect = $terroirEffect
      MERGE (r)-[:HAS_TYPICAL_SOIL]->(soil)
    `, {
      regionId: region.id,
      soilId: `${region.id}_soil`,
      type: soil.type,
      drainage: soil.drainage,
      ph: soil.pH,
      texture: soil.texture || null,
      organicMatter: soil.organicMatter || null,
      naturalMineralization: soil.naturalMineralization || null,
      terroirEffect: soil.terroirEffect || null
    })

    // Create Zone relationships
    for (const zone of region.typicalUSDAZones || []) {
      await runWriteTransaction(`
        MATCH (r:GrowingRegion {id: $regionId})
        MERGE (z:USDAZone {id: $zone})
        MERGE (r)-[:IN_ZONE]->(z)
      `, {
        regionId: region.id,
        zone
      })
    }

    regionsLoaded++
    if (regionsLoaded % 10 === 0) {
      console.log(`  Loaded ${regionsLoaded}/${regions.length} regions...`)
    }
  }

  console.log(`\n✅ Complete Geographic Hierarchy Loaded:`)
  console.log(`   GrowingRegions: ${regions.length}`)
  console.log(`   Counties: ${countySet.size}`)
  console.log(`   Cities: ${citySet.size}`)
  console.log(`   SoilProfiles: ${ALL_GROWING_REGIONS.length}`)
  console.log()
}

async function main() {
  try {
    await loadGeographicBase()

    console.log('✨ TypeScript base model loaded to Neo4j')
    console.log('\nNext: Load cultivar hierarchy (products.ts)')
    console.log('      Then: Connect 21K entities to this base\n')

  } catch (error) {
    console.error('❌ Failed:', error)
    throw error
  } finally {
    await closeDriver()
  }
}

main()
