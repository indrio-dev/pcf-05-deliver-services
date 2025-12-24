#!/usr/bin/env tsx
import { runWriteTransaction, closeDriver } from '../src/lib/graph/index'

/**
 * Connect entities to regions - SIMPLIFIED APPROACH
 *
 * Process in batches of 100 with simple matching logic
 */

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗')
  console.log('║  CONNECT ENTITIES TO REGIONS (SIMPLIFIED)              ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  const startTime = Date.now()

  // Just use state matching for now - it's fastest
  console.log('Connecting all entities by state...\n')

  const stateMatchQuery = `
    MATCH (e:Entity)
    WHERE NOT (e)-[:LOCATED_IN]->(:GrowingRegion)
      AND e.stateCode IS NOT NULL
    WITH e
    LIMIT 5000
    MATCH (r:GrowingRegion {state: e.stateCode})
    WITH e, r
    ORDER BY
      CASE r.dtcActivity
        WHEN 'high' THEN 1
        WHEN 'medium' THEN 2
        WHEN 'low' THEN 3
      END,
      size(r.counties) DESC
    WITH e, r
    LIMIT 1
    CREATE (e)-[:LOCATED_IN {confidence: 'medium', matchType: 'state'}]->(r)
    RETURN count(e) as connected
  `

  let totalConnected = 0
  let iterations = 0

  while (true) {
    console.log(`  Batch ${iterations + 1}...`)
    const result = await runWriteTransaction(stateMatchQuery, {})
    const connected = result[0]?.connected || 0

    totalConnected += connected
    iterations++

    console.log(`    ✓ Connected ${connected} entities (total: ${totalConnected})`)

    if (connected === 0) {
      console.log(`\n  ✓ All entities processed\n`)
      break
    }

    if (iterations >= 10) {
      console.log(`\n  ⚠️  Stopping after 10 iterations (connected ${totalConnected} entities)\n`)
      break
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)

  console.log('╔════════════════════════════════════════════════════════╗')
  console.log('║  CONNECTION COMPLETE                                   ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  console.log(`Total connected: ${totalConnected}`)
  console.log(`Elapsed time: ${elapsed}s`)
  console.log(`Throughput: ${Math.round(totalConnected / parseFloat(elapsed))} entities/sec\n`)

  await closeDriver()
}

main().catch(console.error)
