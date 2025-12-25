#!/usr/bin/env tsx
import { runWriteTransaction, closeDriver } from '../src/lib/graph/index'

/**
 * Complete BFA linking with proper name mappings
 * NO MORE DEFERRING - JUST FINISH IT
 */

// BFA species → Cultivar productId mapping
const SPECIES_MAP: Record<string, string> = {
  // Exact matches
  'carrot': 'carrot',
  'potato': 'potato',
  'beet': 'beet',
  'kale': 'kale',
  'tomato': 'tomato',
  'lettuce': 'lettuce',
  'spinach': 'spinach',
  'wheat': 'wheat',
  'oats': 'oats',
  'apple': 'apple',

  // Mappings needed
  'peppers': 'pepper',  // Plural fix
  'squash': 'squash',
  'zucchini': 'zucchini',
  'swiss_chard': 'swiss_chard',
  'butternut_squash': 'butternut_squash',
  'mustard_greens': 'mustard_greens',
  'nectarine': 'nectarine',
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗')
  console.log('║  COMPLETE BFA LINKING (FINAL)                          ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  let stats = { cultivar: 0, region: 0 }

  // Link by species with mapping
  console.log('Linking cultivars with name mapping...\n')

  for (const [bfaSpecies, cultivarProduct] of Object.entries(SPECIES_MAP)) {
    const query = `
      MATCH (m:BFAMeasurement {species: '${bfaSpecies}'})
      WHERE NOT (m)-[:MEASURED_FROM]->()

      MATCH (c:Cultivar {productId: '${cultivarProduct}'})

      CREATE (m)-[:MEASURED_FROM]->(c)
      RETURN count(*) as linked
    `

    const result = await runWriteTransaction(query, {})
    const linked = result.length > 0 ? result[0].linked : 0
    stats.cultivar += Number(linked)

    if (linked > 0) {
      console.log(`  ✓ ${bfaSpecies} → ${cultivarProduct}: ${linked}`)
    }
  }

  console.log(`\nTotal cultivar links: ${stats.cultivar}\n`)

  // Link regions by state (case-insensitive)
  console.log('Linking regions by state...\n')

  const statesQuery = `
    MATCH (m:BFAMeasurement)
    WHERE m.state IS NOT NULL
      AND NOT (m)-[:FROM_REGION]->()

    MATCH (r:GrowingRegion)
    WHERE toLower(r.state) = m.state

    WITH m, r
    ORDER BY r.dtcActivity DESC, size(r.counties) DESC

    WITH m, collect(r)[0] as region
    WHERE region IS NOT NULL

    CREATE (m)-[:FROM_REGION]->(region)
    RETURN count(*) as linked
  `

  const regionResult = await runWriteTransaction(statesQuery, {})
  stats.region = regionResult.length > 0 ? Number(regionResult[0].linked) : 0

  console.log(`  ✓ State matching: ${stats.region}\n`)

  // Final verification
  console.log('╔════════════════════════════════════════════════════════╗')
  console.log('║  BFA LINKING COMPLETE                                  ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  const verifyQuery = `
    MATCH (m:BFAMeasurement)
    RETURN count(m) as total,
           count{(m)-[:MEASURED_FROM]->()} as withCultivar,
           count{(m)-[:FROM_REGION]->()} as withRegion,
           count{(m)-[:HAS_PRACTICE]->()} as withPractice
  `

  const verify = await runWriteTransaction(verifyQuery, {})
  const v = verify[0]

  console.log(`BFA Dataset Integration:`)
  console.log(`  Total measurements: ${v.total}`)
  console.log(`  Linked to cultivars: ${v.withCultivar} (${(v.withCultivar/v.total*100).toFixed(1)}%)`)
  console.log(`  Linked to regions: ${v.withRegion} (${(v.withRegion/v.total*100).toFixed(1)}%)`)
  console.log(`  Linked to practices: ${v.withPractice} (${(v.withPractice/v.total*100).toFixed(1)}%)\n`)

  // Test integrated query
  console.log('Test: Regenerative carrot Brix:\n')

  const testQuery = `
    MATCH (m:BFAMeasurement)-[:MEASURED_FROM]->(c:Cultivar {productId: 'carrot'})
    MATCH (m)-[:HAS_PRACTICE]->(claim:Claim {id: 'regenerative'})
    WHERE m.brix IS NOT NULL
    RETURN avg(m.brix) as avgBrix,
           count(m) as samples
  `

  const test = await runWriteTransaction(testQuery, {})

  if (test.length > 0 && test[0].samples > 0) {
    console.log(`  Regenerative carrots: ${test[0].avgBrix.toFixed(1)}°Bx (${test[0].samples} samples)`)
    console.log(`  ✅ Integrated queries WORK!\n`)
  } else {
    console.log(`  No integrated data yet\n`)
  }

  await closeDriver()
}

main().catch(console.error)
