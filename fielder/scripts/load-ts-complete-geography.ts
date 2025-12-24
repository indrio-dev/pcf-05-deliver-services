#!/usr/bin/env tsx
import { runWriteTransaction, closeDriver } from '../src/lib/graph/index'
import { ALL_GROWING_REGIONS } from '../src/lib/constants/growing-regions'

async function main() {
  const regions = Object.values(ALL_GROWING_REGIONS)
  console.log('╔════════════════════════════════════════════════════════╗')
  console.log('║  LOAD COMPLETE TYPESCRIPT GEOGRAPHY TO NEO4J           ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')
  console.log(`Processing ${regions.length} regions...\n`)

  const countySet = new Set<string>()
  const citySet = new Set<string>()
  let progress = 0

  for (const region of regions) {
    // Create GrowingRegion
    await runWriteTransaction(`
      MERGE (r:GrowingRegion {id: $id})
      SET r.name = $name,
          r.displayName = $displayName,
          r.state = $state,
          r.lat = $lat,
          r.lon = $lon,
          r.dtcActivity = $dtcActivity,
          r.source = 'typescript'
      
      // Link to State
      MERGE (s:State {code: $state})
      MERGE (r)-[:IN_STATE]->(s)
    `, {
      id: region.id,
      name: region.name,
      displayName: region.displayName,
      state: region.state,
      lat: region.latitude,
      lon: region.longitude,
      dtcActivity: region.dtcActivity
    })

    // Create Counties
    for (const countyName of region.counties || []) {
      countySet.add(`${countyName}|${region.state}`)

      await runWriteTransaction(`
        MERGE (county:County {name: $name, state: $state})
        MERGE (region:GrowingRegion {id: $regionId})
        MERGE (stateNode:State {code: $state})
        MERGE (region)-[:HAS_COUNTY]->(county)
        MERGE (county)-[:IN_STATE]->(stateNode)
      `, {
        name: countyName,
        state: region.state,
        regionId: region.id
      })
    }

    // Create Cities
    for (const cityName of region.primaryCities || []) {
      citySet.add(`${cityName}|${region.state}`)

      await runWriteTransaction(`
        MERGE (city:City {name: $name, state: $state})
        MERGE (region:GrowingRegion {id: $regionId})
        MERGE (stateNode:State {code: $state})
        MERGE (region)-[:HAS_CITY]->(city)
        MERGE (city)-[:IN_STATE]->(stateNode)
      `, {
        name: cityName,
        state: region.state,
        regionId: region.id
      })
    }

    // Create SoilProfile (S PILLAR!)
    if (region.typicalSoil) {
      const soil = region.typicalSoil

      await runWriteTransaction(`
        MERGE (soil:SoilProfile {id: $soilId})
        SET soil.type = $type,
            soil.drainage = $drainage,
            soil.ph = $ph,
            soil.organic_matter = $organicMatter,
            soil.natural_mineralization = $naturalMineralization,
            soil.terroir_effect = $terroirEffect
        
        WITH soil
        MERGE (region:GrowingRegion {id: $regionId})
        MERGE (region)-[:HAS_TYPICAL_SOIL]->(soil)
      `, {
        soilId: `${region.id}_soil`,
        regionId: region.id,
        type: soil.type,
        drainage: soil.drainage,
        ph: soil.pH || null,
        organicMatter: soil.organicMatter || null,
        naturalMineralization: soil.naturalMineralization || null,
        terroirEffect: soil.terroirEffect || null
      })
    }

    // Create Zone relationships
    for (const zone of region.typicalUSDAZones || []) {
      await runWriteTransaction(`
        MERGE (zone:USDAZone {id: $zone})
        MERGE (region:GrowingRegion {id: $regionId})
        MERGE (region)-[:IN_ZONE]->(zone)
      `, {
        zone,
        regionId: region.id
      })
    }

    progress++
    if (progress % 20 === 0) {
      console.log(`  Progress: ${progress}/${regions.length} regions`)
    }
  }

  console.log('\n╔════════════════════════════════════════════════════════╗')
  console.log('║                  COMPLETE                              ║')
  console.log('╠════════════════════════════════════════════════════════╣')
  console.log(`║  Regions: ${regions.length.toString().padStart(6)}                                     ║`)
  console.log(`║  Counties: ${countySet.size.toString().padStart(5)}                                     ║`)
  console.log(`║  Cities: ${citySet.size.toString().padStart(7)}                                     ║`)
  console.log(`║  SoilProfiles: ${regions.length.toString().padStart(3)}                                     ║`)
  console.log('╚════════════════════════════════════════════════════════╝\n')
  console.log('Complete TypeScript geographic base loaded.')
  console.log('Entities can now link to this foundation.\n')
}

main().then(() => closeDriver()).catch(console.error)
