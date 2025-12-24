#!/usr/bin/env tsx
import { runWriteTransaction, closeDriver } from '../src/lib/graph/index'

/**
 * Verify entity→region connections and demonstrate entity-based queries
 */

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗')
  console.log('║  VERIFY ENTITY CONNECTIONS TO REGIONS                  ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  // Query 1: Connection statistics
  console.log('Query 1: Connection Statistics')
  console.log('─────────────────────────────────────────────────────────\n')

  const statsQuery = `
    MATCH (e:Entity)
    WITH count(e) as totalEntities
    MATCH (e2:Entity)-[:LOCATED_IN]->(g:GrowingRegion)
    WITH totalEntities, count(DISTINCT e2) as connected
    RETURN totalEntities,
           connected,
           (totalEntities - connected) as notConnected,
           round(100.0 * connected / totalEntities) as pctConnected
  `

  const stats = await runWriteTransaction(statsQuery, {})

  if (stats.length > 0) {
    const s = stats[0]
    console.log(`Total entities: ${s.totalEntities}`)
    console.log(`Connected: ${s.connected} (${s.pctConnected}%)`)
    console.log(`Not connected: ${s.notConnected}`)
  }

  // Query 2: By match type
  console.log('\n\nQuery 2: Connections by Match Type')
  console.log('─────────────────────────────────────────────────────────\n')

  const matchTypeQuery = `
    MATCH (e:Entity)-[r:LOCATED_IN]->(g:GrowingRegion)
    RETURN r.matchType as matchType,
           r.confidence as confidence,
           count(e) as count
    ORDER BY
      CASE r.matchType
        WHEN 'city' THEN 1
        WHEN 'county' THEN 2
        WHEN 'state' THEN 3
      END
  `

  const matchTypes = await runWriteTransaction(matchTypeQuery, {})

  for (const row of matchTypes) {
    console.log(`  ${row.matchType} (${row.confidence} confidence): ${row.count}`)
  }

  // Query 3: By entity type
  console.log('\n\nQuery 3: Connections by Entity Type')
  console.log('─────────────────────────────────────────────────────────\n')

  const entityTypeQuery = `
    MATCH (e:Entity)-[:LOCATED_IN]->(g:GrowingRegion)
    WITH e, labels(e) as entityLabels
    UNWIND entityLabels as label
    WITH label, count(DISTINCT e) as count
    WHERE label IN ['Grower', 'Packinghouse', 'Retailer']
    RETURN label, count
    ORDER BY count DESC
  `

  const entityTypes = await runWriteTransaction(entityTypeQuery, {})

  for (const row of entityTypes) {
    console.log(`  ${row.label}: ${row.count}`)
  }

  // Query 4: Top regions by entity count
  console.log('\n\nQuery 4: Regions with Most Entities')
  console.log('─────────────────────────────────────────────────────────\n')

  const topRegionsQuery = `
    MATCH (e:Entity)-[:LOCATED_IN]->(g:GrowingRegion)
    WITH g, count(e) as entityCount
    ORDER BY entityCount DESC
    LIMIT 15
    RETURN g.displayName as region,
           g.state as state,
           entityCount
  `

  const topRegions = await runWriteTransaction(topRegionsQuery, {})

  for (const row of topRegions) {
    console.log(`  • ${row.region}, ${row.state}: ${row.entityCount} entities`)
  }

  // Query 5: Sample entity connections
  console.log('\n\nQuery 5: Sample Entity Connections')
  console.log('─────────────────────────────────────────────────────────\n')

  const sampleQuery = `
    MATCH (e:Entity)-[r:LOCATED_IN]->(g:GrowingRegion)
    WHERE e:Grower OR e:Packinghouse
    RETURN e.name as entity,
           e.city as city,
           e.county as county,
           g.displayName as region,
           r.matchType as matchType,
           r.confidence as confidence,
           labels(e) as types
    ORDER BY r.matchType, e.name
    LIMIT 12
  `

  const samples = await runWriteTransaction(sampleQuery, {})

  for (const row of samples) {
    const entityTypes = row.types.filter((t: string) => t !== 'Entity').join(', ')
    console.log(`  • ${row.entity} (${entityTypes})`)
    console.log(`    ${row.city || '?'}, ${row.county || '?'}`)
    console.log(`    → ${row.region} (${row.matchType} match, ${row.confidence} confidence)`)
    console.log('')
  }

  // Query 6: Cross-pillar query with entities
  console.log('\nQuery 6: Cross-Pillar Query with Entities')
  console.log('(Growers in Indian River growing heritage citrus)')
  console.log('─────────────────────────────────────────────────────────\n')

  const crossPillarQuery = `
    MATCH (e:Entity:Grower)-[:LOCATED_IN]->(r:GrowingRegion {id: 'indian_river'})
    OPTIONAL MATCH (c:Cultivar)-[:GROWN_IN]->(r)
    WHERE c.isHeritage = true
      AND c.productId IN ['orange', 'grapefruit', 'tangerine']
    WITH e, r, collect(DISTINCT c.displayName)[0..5] as heritageCitrus
    RETURN e.name as grower,
           e.city as city,
           r.displayName as region,
           heritageCitrus
    LIMIT 10
  `

  const crossPillar = await runWriteTransaction(crossPillarQuery, {})

  if (crossPillar.length > 0) {
    for (const row of crossPillar) {
      console.log(`  • ${row.grower}`)
      console.log(`    Location: ${row.city}, ${row.region}`)
      if (row.heritageCitrus && row.heritageCitrus.length > 0) {
        console.log(`    Can grow: ${row.heritageCitrus.join(', ')}`)
      }
      console.log('')
    }
  } else {
    console.log('  (Query returned no results)')
  }

  // Query 7: Find growers by region
  console.log('\nQuery 7: Growers by Region')
  console.log('─────────────────────────────────────────────────────────\n')

  const growersByRegionQuery = `
    MATCH (e:Entity:Grower)-[:LOCATED_IN]->(g:GrowingRegion)
    WITH g.displayName as region, g.state as state, count(e) as growerCount
    ORDER BY growerCount DESC
    LIMIT 10
    RETURN region, state, growerCount
  `

  const growersByRegion = await runWriteTransaction(growersByRegionQuery, {})

  for (const row of growersByRegion) {
    console.log(`  • ${row.region}, ${row.state}: ${row.growerCount} growers`)
  }

  // Query 8: D2C growers in premium regions
  console.log('\n\nQuery 8: D2C Growers in High-Activity Regions')
  console.log('─────────────────────────────────────────────────────────\n')

  const d2cQuery = `
    MATCH (e:Entity:Grower)-[:LOCATED_IN]->(g:GrowingRegion)
    WHERE 'd2c' IN e.retailChannels
      AND g.dtcActivity = 'high'
    RETURN e.name as grower,
           e.city as city,
           g.displayName as region,
           e.features as features
    LIMIT 12
  `

  const d2c = await runWriteTransaction(d2cQuery, {})

  for (const row of d2c) {
    console.log(`  • ${row.grower}`)
    console.log(`    ${row.city}, ${row.region}`)
    if (row.features && row.features.length > 0) {
      console.log(`    Features: ${row.features.join(', ')}`)
    }
    console.log('')
  }

  console.log('\n╔════════════════════════════════════════════════════════╗')
  console.log('║  ENTITY CONNECTION VERIFICATION COMPLETE               ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  await closeDriver()
}

main().catch(console.error)
