#!/usr/bin/env tsx
import { runWriteTransaction, closeDriver } from '../src/lib/graph/index'

/**
 * Link BFA measurements in BATCHES (small chunks to avoid timeout)
 */

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗')
  console.log('║  LINK BFA MEASUREMENTS (BATCH MODE)                    ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  let stats = {
    cultivarLinks: 0,
    regionLinks: 0,
    organicLinks: 0,
    regenLinks: 0,
  }

  // =========================================================================
  // STEP 1: Link to Cultivars (Batch by species)
  // =========================================================================
  console.log('STEP 1: Linking to cultivars by species...\n')

  const species = ['carrot', 'potato', 'beet', 'kale', 'tomato', 'lettuce',
                   'peppers', 'spinach', 'squash', 'wheat', 'oats']

  for (const sp of species) {
    const linkQuery = `
      MATCH (m:BFAMeasurement {species: $species})
      WHERE NOT (m)-[:MEASURED_FROM]->()
      WITH m LIMIT 500

      MATCH (c:Cultivar)
      WHERE c.productId = $species

      WITH m, c LIMIT 1
      MERGE (m)-[:MEASURED_FROM]->(c)
      RETURN count(*) as linked
    `

    const result = await runWriteTransaction(linkQuery, { species: sp })
    const linked = result[0]?.linked || 0
    stats.cultivarLinks += linked

    if (linked > 0) {
      console.log(`  ✓ ${sp}: ${linked} links`)
    }
  }

  console.log(`\n  Total cultivar links: ${stats.cultivarLinks}\n`)

  // =========================================================================
  // STEP 2: Link to Regions by State (Batch by state)
  // =========================================================================
  console.log('STEP 2: Linking to regions by state...\n')

  const states = ['california', 'new_jersey', 'pennsylvania', 'michigan',
                  'washington', 'colorado', 'illinois', 'texas', 'florida']

  for (const state of states) {
    const linkQuery = `
      MATCH (m:BFAMeasurement {state: $state})
      WHERE NOT (m)-[:FROM_REGION]->()
      WITH m LIMIT 500

      MATCH (r:GrowingRegion)
      WHERE toLower(r.state) = $state
        AND r.dtcActivity = 'high'

      WITH m, r LIMIT 1
      MERGE (m)-[:FROM_REGION]->(r)
      RETURN count(*) as linked
    `

    const result = await runWriteTransaction(linkQuery, { state })
    const linked = result[0]?.linked || 0
    stats.regionLinks += linked

    if (linked > 0) {
      console.log(`  ✓ ${state}: ${linked} links`)
    }
  }

  console.log(`\n  Total region links: ${stats.regionLinks}\n`)

  // =========================================================================
  // STEP 3: Link to Claims (Batch by practice type)
  // =========================================================================
  console.log('STEP 3: Linking to claims from practices...\n')

  // Organic
  const organicQuery = `
    MATCH (m:BFAMeasurement)
    WHERE m.farmPractices IS NOT NULL
      AND (toLower(m.farmPractices) CONTAINS 'organic')
      AND NOT (m)-[:HAS_PRACTICE]->(:Claim {id: 'organic'})
    WITH m LIMIT 1000

    MATCH (c:Claim {id: 'organic'})
    MERGE (m)-[:HAS_PRACTICE]->(c)
    RETURN count(*) as linked
  `

  const orgResult = await runWriteTransaction(organicQuery, {})
  stats.organicLinks = orgResult[0]?.linked || 0
  console.log(`  ✓ Organic: ${stats.organicLinks} links`)

  // Regenerative
  const regenQuery = `
    MATCH (m:BFAMeasurement)
    WHERE m.farmPractices IS NOT NULL
      AND (toLower(m.farmPractices) CONTAINS 'regenerative')
      AND NOT (m)-[:HAS_PRACTICE]->(:Claim {id: 'regenerative'})
    WITH m LIMIT 1000

    // Create regenerative claim if doesn't exist
    MERGE (c:Claim {id: 'regenerative'})
    ON CREATE SET c.name = 'Regenerative',
                  c.category = 'environmental'

    MERGE (m)-[:HAS_PRACTICE]->(c)
    RETURN count(*) as linked
  `

  const regResult = await runWriteTransaction(regenQuery, {})
  stats.regenLinks = regResult[0]?.linked || 0
  console.log(`  ✓ Regenerative: ${stats.regenLinks} links\n`)

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log('╔════════════════════════════════════════════════════════╗')
  console.log('║  BFA LINKING BATCH COMPLETE                            ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  console.log(`Relationships created:`)
  console.log(`  BFA→Cultivar: ${stats.cultivarLinks}`)
  console.log(`  BFA→Region: ${stats.regionLinks}`)
  console.log(`  BFA→Claim (organic): ${stats.organicLinks}`)
  console.log(`  BFA→Claim (regenerative): ${stats.regenLinks}`)
  console.log(`  Total: ${stats.cultivarLinks + stats.regionLinks + stats.organicLinks + stats.regenLinks}\n`)

  await closeDriver()
}

main().catch(console.error)
