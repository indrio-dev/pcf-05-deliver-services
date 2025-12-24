#!/usr/bin/env tsx
import { runWriteTransaction, closeDriver } from '../src/lib/graph/index'
import { ALL_GROWING_REGIONS } from '../src/lib/constants/growing-regions'

async function loadGeographicBase() {
  const regions = Object.values(ALL_GROWING_REGIONS)
  console.log(`\nLoading ${regions.length} growing regions to Neo4j...\n`)

  let loaded = 0

  for (const region of regions) {
    // Create GrowingRegion with S pillar data
    await runWriteTransaction(`
      MERGE (r:GrowingRegion {id: $id})
      SET r.name = $name,
          r.lat = $lat,
          r.lon = $lon,
          r.state = $state,
          r.source = 'typescript'
    `, {
      id: region.id,
      name: region.name,
      lat: region.latitude,
      lon: region.longitude,
      state: region.state
    })

    loaded++
    if (loaded % 10 === 0) console.log(`  ${loaded}/${regions.length}...`)
  }

  console.log(`\n✅ Loaded ${regions.length} regions\n`)
}

loadGeographicBase().then(() => closeDriver()).catch(console.error)
