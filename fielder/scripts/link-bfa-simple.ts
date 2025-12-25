#!/usr/bin/env tsx
import { runWriteTransaction, closeDriver } from '../src/lib/graph/index'

/**
 * Link BFA measurements - SIMPLE approach avoiding BigInt issues
 */

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗')
  console.log('║  LINK BFA MEASUREMENTS (SIMPLE)                        ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  let totalLinks = 0

  // =========================================================================
  // STEP 1: Link to Cultivars (Direct species match)
  // =========================================================================
  console.log('STEP 1: Linking to cultivars by species...\n')

  const species = ['carrot', 'potato', 'beet', 'kale', 'tomato', 'lettuce',
                   'peppers', 'spinach', 'squash', 'wheat', 'oats', 'swiss_chard',
                   'mustard_greens', 'zucchini', 'butternut_squash', 'apple']

  for (const sp of species) {
    const query = `
      MATCH (m:BFAMeasurement)
      WHERE m.species = '${sp}'
        AND NOT (m)-[:MEASURED_FROM]->()

      MATCH (c:Cultivar)
      WHERE c.productId = '${sp}'

      WITH m, c LIMIT 1
      WITH m, collect(c)[0] as cultivar
      WHERE cultivar IS NOT NULL

      CREATE (m)-[:MEASURED_FROM]->(cultivar)
      RETURN 1
    `

    try {
      const result = await runWriteTransaction(query, {})
      const linked = result.length
      totalLinks += linked

      if (linked > 0) {
        console.log(`  ✓ ${sp}: ${linked}`)
      }
    } catch (e) {
      console.log(`  ⚠️  ${sp}: error`)
    }
  }

  console.log(`\n  Total cultivar links: ${totalLinks}\n`)

  // =========================================================================
  // STEP 2: Link to Regions by State
  // =========================================================================
  console.log('STEP 2: Linking to regions by state...\n')

  let regionLinks = 0
  const states = ['california', 'new_jersey', 'pennsylvania', 'michigan',
                  'new_york', 'colorado', 'texas', 'florida', 'washington']

  for (const state of states) {
    const query = `
      MATCH (m:BFAMeasurement)
      WHERE m.state = '${state}'
        AND NOT (m)-[:FROM_REGION]->()

      MATCH (r:GrowingRegion)
      WHERE toLower(r.state) = '${state}'

      WITH m, r
      ORDER BY r.dtcActivity DESC
      LIMIT 1

      WITH m, collect(r)[0] as region
      WHERE region IS NOT NULL

      CREATE (m)-[:FROM_REGION]->(region)
      RETURN 1
    `

    try {
      const result = await runWriteTransaction(query, {})
      const linked = result.length
      regionLinks += linked

      if (linked > 0) {
        console.log(`  ✓ ${state}: ${linked}`)
      }
    } catch (e) {
      console.log(`  ⚠️  ${state}: error`)
    }
  }

  console.log(`\n  Total region links: ${regionLinks}\n`)

  // =========================================================================
  // STEP 3: Link to Claims (Direct MERGE, no counting)
  // =========================================================================
  console.log('STEP 3: Linking to claims...\n')

  // Organic
  const orgQuery = `
    MATCH (m:BFAMeasurement)
    WHERE m.farmPractices IS NOT NULL
      AND toLower(m.farmPractices) CONTAINS 'organic'

    MATCH (c:Claim {id: 'organic'})

    WITH m, c
    WHERE NOT (m)-[:HAS_PRACTICE]->(c)

    CREATE (m)-[:HAS_PRACTICE]->(c)
    RETURN 1
  `

  try {
    const orgResult = await runWriteTransaction(orgQuery, {})
    console.log(`  ✓ Organic: ${orgResult.length}`)
  } catch (e) {
    console.log(`  ⚠️  Organic: error`)
  }

  // Regenerative (create claim if needed)
  const regenQuery = `
    MERGE (c:Claim {id: 'regenerative'})
    ON CREATE SET c.name = 'Regenerative',
                  c.category = 'environmental'

    WITH c
    MATCH (m:BFAMeasurement)
    WHERE m.farmPractices IS NOT NULL
      AND toLower(m.farmPractices) CONTAINS 'regenerative'
      AND NOT (m)-[:HAS_PRACTICE]->(c)

    CREATE (m)-[:HAS_PRACTICE]->(c)
    RETURN 1
  `

  try {
    const regenResult = await runWriteTransaction(regenQuery, {})
    console.log(`  ✓ Regenerative: ${regenResult.length}\n`)
  } catch (e) {
    console.log(`  ⚠️  Regenerative: error\n`)
  }

  // =========================================================================
  // VERIFICATION
  // =========================================================================
  console.log('╔════════════════════════════════════════════════════════╗')
  console.log('║  BFA LINKING COMPLETE                                  ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  console.log('Verifying relationships...\n')

  // Count relationships
  const verifyQuery = `
    MATCH (m:BFAMeasurement)-[r]->()
    RETURN type(r) as relType, count(r) as count
    ORDER BY count DESC
  `

  const verification = await runWriteTransaction(verifyQuery, {})

  for (const row of verification) {
    console.log(`  ${row.relType}: ${row.count}`)
  }

  console.log('\n')

  await closeDriver()
}

main().catch(console.error)
