#!/usr/bin/env tsx
import { runWriteTransaction, closeDriver } from '../src/lib/graph/index'

/**
 * Connect entities to regions - ULTRA SIMPLE
 * Just match by state, no sorting, batches of 1000
 */

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗')
  console.log('║  CONNECT ENTITIES (ULTRA SIMPLE)                       ║')
  console.log('╚═══════════════════════════════════════════════════════╝\n')

  const startTime = Date.now()

  // Single query - connect all entities at once by state
  console.log('Connecting all entities by state (single batch)...\n')

  const connectQuery = `
    MATCH (e:Entity)
    WHERE NOT (e)-[:LOCATED_IN]->()
      AND e.stateCode IS NOT NULL
    MATCH (r:GrowingRegion)
    WHERE r.state = e.stateCode
      AND r.dtcActivity = 'high'
    WITH e, r
    LIMIT 1
    CREATE (e)-[:LOCATED_IN {matchType: 'state'}]->(r)
    RETURN count(*) as connected
  `

  try {
    const result = await runWriteTransaction(connectQuery, {})
    const connected = result[0]?.connected || 0

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)

    console.log(`✓ Connected ${connected} entities in ${elapsed}s\n`)

  } catch (error) {
    console.error('Error:', error)
  }

  await closeDriver()
}

main().catch(console.error)
