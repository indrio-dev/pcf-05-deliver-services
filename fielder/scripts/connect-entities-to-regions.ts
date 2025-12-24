#!/usr/bin/env tsx
import { runWriteTransaction, closeDriver } from '../src/lib/graph/index'

/**
 * Connect 21K entities (growers, packinghouses, retailers) to GrowingRegions
 *
 * Matching strategy (in order of confidence):
 * 1. City match (highest confidence) - entity.city in region.primaryCities
 * 2. County match (medium confidence) - entity.county in region.counties
 * 3. State match (lowest confidence) - region in entity.state
 *
 * Creates LOCATED_IN relationships from entities to GrowingRegions
 */

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗')
  console.log('║  CONNECT 21K ENTITIES TO GROWING REGIONS               ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  let stats = {
    total: 0,
    cityMatch: 0,
    countyMatch: 0,
    stateMatch: 0,
    noMatch: 0,
    alreadyConnected: 0,
  }

  // =========================================================================
  // STEP 1: Get all entities that need connecting
  // =========================================================================
  console.log('STEP 1: Finding entities to connect...\n')

  const getEntitiesQuery = `
    MATCH (e:Entity)
    WHERE NOT (e)-[:LOCATED_IN]->(:GrowingRegion)
    RETURN e.id as id,
           e.name as name,
           e.city as city,
           e.county as county,
           e.stateCode as state,
           labels(e) as labels
  `

  const entities = await runWriteTransaction(getEntitiesQuery, {})

  console.log(`Found ${entities.length} entities to connect\n`)

  // =========================================================================
  // STEP 2: Connect entities using city, county, or state matching
  // =========================================================================
  console.log('STEP 2: Connecting entities to regions...\n')

  for (const entity of entities) {
    stats.total++

    const entityId = entity.id
    const city = entity.city?.trim()
    const county = entity.county?.trim()
    const state = entity.state?.trim()

    let matched = false

    // Strategy 1: City match (highest confidence)
    if (city && !matched) {
      const cityMatchQuery = `
        MATCH (e:Entity {id: $entityId})
        MATCH (r:GrowingRegion)
        WHERE $city IN r.primaryCities
          AND r.state = $state
        WITH e, r
        LIMIT 1
        MERGE (e)-[:LOCATED_IN {confidence: 'high', matchType: 'city'}]->(r)
        RETURN r.id as regionId, r.displayName as regionName
      `

      const cityMatch = await runWriteTransaction(cityMatchQuery, {
        entityId,
        city,
        state,
      })

      if (cityMatch.length > 0) {
        stats.cityMatch++
        matched = true
      }
    }

    // Strategy 2: County match (medium confidence)
    if (county && !matched) {
      const countyMatchQuery = `
        MATCH (e:Entity {id: $entityId})
        MATCH (r:GrowingRegion)
        WHERE $county IN r.counties
          AND r.state = $state
        WITH e, r
        LIMIT 1
        MERGE (e)-[:LOCATED_IN {confidence: 'medium', matchType: 'county'}]->(r)
        RETURN r.id as regionId, r.displayName as regionName
      `

      const countyMatch = await runWriteTransaction(countyMatchQuery, {
        entityId,
        county,
        state,
      })

      if (countyMatch.length > 0) {
        stats.countyMatch++
        matched = true
      }
    }

    // Strategy 3: State match (lowest confidence)
    // Pick the region with highest dtcActivity or most counties
    if (state && !matched) {
      const stateMatchQuery = `
        MATCH (e:Entity {id: $entityId})
        MATCH (r:GrowingRegion {state: $state})
        WITH e, r
        ORDER BY
          CASE r.dtcActivity
            WHEN 'high' THEN 1
            WHEN 'medium' THEN 2
            WHEN 'low' THEN 3
            ELSE 4
          END,
          size(r.counties) DESC
        LIMIT 1
        MERGE (e)-[:LOCATED_IN {confidence: 'low', matchType: 'state'}]->(r)
        RETURN r.id as regionId, r.displayName as regionName
      `

      const stateMatch = await runWriteTransaction(stateMatchQuery, {
        entityId,
        state,
      })

      if (stateMatch.length > 0) {
        stats.stateMatch++
        matched = true
      }
    }

    if (!matched) {
      stats.noMatch++
    }

    // Show progress
    if (stats.total % 1000 === 0) {
      console.log(`  ✓ Processed ${stats.total} entities...`)
      console.log(`    City: ${stats.cityMatch}, County: ${stats.countyMatch}, State: ${stats.stateMatch}, No match: ${stats.noMatch}`)
    }
  }

  console.log(`\n✓ Processed all ${stats.total} entities\n`)

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log('╔════════════════════════════════════════════════════════╗')
  console.log('║  CONNECTION SUMMARY                                    ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  console.log(`Total entities: ${stats.total}`)
  console.log(`\nBy matching strategy:`)
  console.log(`  City match (high confidence):    ${stats.cityMatch} (${Math.round(stats.cityMatch / stats.total * 100)}%)`)
  console.log(`  County match (medium confidence): ${stats.countyMatch} (${Math.round(stats.countyMatch / stats.total * 100)}%)`)
  console.log(`  State match (low confidence):     ${stats.stateMatch} (${Math.round(stats.stateMatch / stats.total * 100)}%)`)
  console.log(`  No match:                         ${stats.noMatch} (${Math.round(stats.noMatch / stats.total * 100)}%)`)

  const connected = stats.cityMatch + stats.countyMatch + stats.stateMatch
  console.log(`\n✓ Total connected: ${connected} (${Math.round(connected / stats.total * 100)}%)`)

  // =========================================================================
  // VERIFICATION
  // =========================================================================
  console.log('\n╔════════════════════════════════════════════════════════╗')
  console.log('║  VERIFICATION                                          ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  // Verify connections by match type
  const verifyQuery = `
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

  const verification = await runWriteTransaction(verifyQuery, {})

  console.log('Verification (by match type):')
  for (const row of verification) {
    console.log(`  ${row.matchType} (${row.confidence} confidence): ${row.count}`)
  }

  // Sample connections
  console.log('\n\nSample Connections:')
  console.log('─────────────────────────────────────────────────────────\n')

  const sampleQuery = `
    MATCH (e:Entity)-[r:LOCATED_IN]->(g:GrowingRegion)
    WHERE e:Grower OR e:Packinghouse
    RETURN e.name as entity,
           e.city as city,
           e.county as county,
           g.displayName as region,
           r.matchType as matchType,
           r.confidence as confidence
    LIMIT 10
  `

  const samples = await runWriteTransaction(sampleQuery, {})

  for (const row of samples) {
    console.log(`  • ${row.entity}`)
    console.log(`    ${row.city || '?'}, ${row.county || '?'}`)
    console.log(`    → ${row.region} (${row.matchType} match, ${row.confidence} confidence)`)
    console.log('')
  }

  // Entity type breakdown
  console.log('\nBy Entity Type:')
  console.log('─────────────────────────────────────────────────────────\n')

  const typeQuery = `
    MATCH (e:Entity)-[:LOCATED_IN]->(g:GrowingRegion)
    WITH e, labels(e) as labels
    UNWIND labels as label
    WITH label, count(DISTINCT e) as count
    WHERE label IN ['Grower', 'Packinghouse', 'Retailer']
    RETURN label, count
    ORDER BY count DESC
  `

  const types = await runWriteTransaction(typeQuery, {})

  for (const row of types) {
    console.log(`  ${row.label}: ${row.count} connected`)
  }

  console.log('\n╔════════════════════════════════════════════════════════╗')
  console.log('║  ENTITY CONNECTIONS COMPLETE                           ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  await closeDriver()
}

main().catch(console.error)
