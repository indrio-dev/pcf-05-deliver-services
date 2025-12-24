#!/usr/bin/env tsx
import { runWriteTransaction, closeDriver } from '../src/lib/graph/index'

/**
 * Connect 21K entities to GrowingRegions - BATCH OPTIMIZED VERSION
 *
 * Uses bulk Cypher queries instead of one-by-one processing
 * for 100x+ performance improvement.
 *
 * Matching strategy (in order of priority):
 * 1. City match (highest confidence)
 * 2. County match (medium confidence)
 * 3. State match (lowest confidence)
 */

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗')
  console.log('║  CONNECT 21K ENTITIES TO REGIONS (BATCH MODE)          ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  const startTime = Date.now()

  // =========================================================================
  // STEP 1: City-based matching (BATCH)
  // =========================================================================
  console.log('STEP 1: City-based matching (highest confidence)...\n')

  const cityMatchQuery = `
    MATCH (e:Entity)
    WHERE NOT (e)-[:LOCATED_IN]->(:GrowingRegion)
      AND e.city IS NOT NULL
      AND e.stateCode IS NOT NULL
    MATCH (r:GrowingRegion)
    WHERE e.city IN r.primaryCities
      AND e.stateCode = r.state
    WITH e, r
    ORDER BY e.id, size(r.counties) DESC
    WITH e, collect(r)[0] as bestRegion
    WHERE bestRegion IS NOT NULL
    CREATE (e)-[:LOCATED_IN {confidence: 'high', matchType: 'city'}]->(bestRegion)
    RETURN count(e) as connected
  `

  console.log('  Running city match query...')
  const cityResult = await runWriteTransaction(cityMatchQuery, {})
  const cityMatches = cityResult[0]?.connected || 0
  console.log(`  ✓ Connected ${cityMatches} entities via city match\n`)

  // =========================================================================
  // STEP 2: County-based matching (BATCH)
  // =========================================================================
  console.log('STEP 2: County-based matching (medium confidence)...\n')

  const countyMatchQuery = `
    MATCH (e:Entity)
    WHERE NOT (e)-[:LOCATED_IN]->(:GrowingRegion)
      AND e.county IS NOT NULL
      AND e.stateCode IS NOT NULL
    MATCH (r:GrowingRegion)
    WHERE e.county IN r.counties
      AND e.stateCode = r.state
    WITH e, r
    ORDER BY e.id, size(r.counties) DESC
    WITH e, collect(r)[0] as bestRegion
    WHERE bestRegion IS NOT NULL
    CREATE (e)-[:LOCATED_IN {confidence: 'medium', matchType: 'county'}]->(bestRegion)
    RETURN count(e) as connected
  `

  console.log('  Running county match query...')
  const countyResult = await runWriteTransaction(countyMatchQuery, {})
  const countyMatches = countyResult[0]?.connected || 0
  console.log(`  ✓ Connected ${countyMatches} entities via county match\n`)

  // =========================================================================
  // STEP 3: State-based matching (BATCH)
  // =========================================================================
  console.log('STEP 3: State-based matching (lowest confidence)...\n')

  const stateMatchQuery = `
    MATCH (e:Entity)
    WHERE NOT (e)-[:LOCATED_IN]->(:GrowingRegion)
      AND e.stateCode IS NOT NULL
    MATCH (r:GrowingRegion {state: e.stateCode})
    WITH e, r
    ORDER BY e.id,
      CASE r.dtcActivity
        WHEN 'high' THEN 1
        WHEN 'medium' THEN 2
        WHEN 'low' THEN 3
        ELSE 4
      END,
      size(r.counties) DESC
    WITH e, collect(r)[0] as bestRegion
    WHERE bestRegion IS NOT NULL
    CREATE (e)-[:LOCATED_IN {confidence: 'low', matchType: 'state'}]->(bestRegion)
    RETURN count(e) as connected
  `

  console.log('  Running state match query...')
  const stateResult = await runWriteTransaction(stateMatchQuery, {})
  const stateMatches = stateResult[0]?.connected || 0
  console.log(`  ✓ Connected ${stateMatches} entities via state match\n`)

  // =========================================================================
  // SUMMARY
  // =========================================================================
  const totalConnected = cityMatches + countyMatches + stateMatches
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)

  console.log('╔════════════════════════════════════════════════════════╗')
  console.log('║  CONNECTION SUMMARY                                    ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  console.log(`Total entities connected: ${totalConnected}`)
  console.log(`\nBy matching strategy:`)
  console.log(`  City match (high confidence):    ${cityMatches} (${Math.round(cityMatches / totalConnected * 100)}%)`)
  console.log(`  County match (medium confidence): ${countyMatches} (${Math.round(countyMatches / totalConnected * 100)}%)`)
  console.log(`  State match (low confidence):     ${stateMatches} (${Math.round(stateMatches / totalConnected * 100)}%)`)

  console.log(`\nElapsed time: ${elapsed}s`)
  console.log(`Throughput: ${Math.round(totalConnected / parseFloat(elapsed))} entities/sec`)

  // Check remaining unconnected
  const remainingQuery = `
    MATCH (e:Entity)
    WHERE NOT (e)-[:LOCATED_IN]->(:GrowingRegion)
    RETURN count(e) as remaining
  `

  const remainingResult = await runWriteTransaction(remainingQuery, {})
  const remaining = remainingResult[0]?.remaining || 0

  if (remaining > 0) {
    console.log(`\n⚠️  ${remaining} entities still not connected (missing location data)`)
  } else {
    console.log(`\n✅ All entities connected!`)
  }

  console.log('\n')

  await closeDriver()
}

main().catch(console.error)
