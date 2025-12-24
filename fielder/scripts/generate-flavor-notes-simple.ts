#!/usr/bin/env tsx
import { runWriteTransaction, closeDriver } from '../src/lib/graph/index'

/**
 * Generate flavor notes for all GROWN_IN relationships - SIMPLIFIED
 *
 * Fetch data, generate in TypeScript, update in batches
 */

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗')
  console.log('║  GENERATE FLAVOR NOTES (SIMPLE BATCH)                  ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  // Check current coverage
  const coverageQuery = `
    MATCH ()-[g:GROWN_IN]->()
    RETURN count(g) as total,
           sum(CASE WHEN g.flavorNotes IS NOT NULL THEN 1 ELSE 0 END) as withNotes
  `

  const coverage = await runWriteTransaction(coverageQuery, {})
  console.log(`Current: ${coverage[0].withNotes} / ${coverage[0].total} have flavor notes\n`)

  // Batch process - simple approach
  console.log('Generating flavor notes in batches...\n')

  const batchQuery = `
    MATCH (c:Cultivar)-[g:GROWN_IN]->(r:GrowingRegion)
    WHERE (g.flavorNotes IS NULL OR g.flavorNotes = '')
      AND c.flavorProfile IS NOT NULL
    WITH c, g, r
    LIMIT 1000
    SET g.flavorNotes =
      CASE g.quality_tier
        WHEN 'exceptional' THEN c.flavorProfile + ' at its finest from ' + r.displayName
        WHEN 'excellent' THEN c.flavorProfile + ' from premium ' + r.displayName
        ELSE c.flavorProfile + ' grown in ' + r.displayName
      END
    RETURN count(*) as updated
  `

  let totalUpdated = 0
  let batch = 0

  while (batch < 10) {
    batch++
    console.log(`  Batch ${batch}...`)

    const result = await runWriteTransaction(batchQuery, {})
    const updated = result[0]?.updated || 0

    totalUpdated += updated
    console.log(`    ✓ ${updated} flavor notes generated (total: ${totalUpdated})`)

    if (updated === 0) {
      console.log(`\n  ✓ All offerings processed\n`)
      break
    }
  }

  // Final coverage
  const finalCoverage = await runWriteTransaction(coverageQuery, {})
  const f = finalCoverage[0]

  console.log('╔════════════════════════════════════════════════════════╗')
  console.log('║  FLAVOR NOTES COMPLETE                                 ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  console.log(`Total offerings: ${f.total}`)
  console.log(`With flavor notes: ${f.withNotes} (${Math.round(f.withNotes / f.total * 100)}%)`)
  console.log(`Generated this run: ${totalUpdated}\n`)

  // Show samples
  const sampleQuery = `
    MATCH (c:Cultivar)-[g:GROWN_IN]->(r:GrowingRegion)
    WHERE g.flavorNotes IS NOT NULL
    RETURN c.displayName as cultivar,
           r.displayName as region,
           g.quality_tier as tier,
           g.flavorNotes as notes
    ORDER BY rand()
    LIMIT 12
  `

  const samples = await runWriteTransaction(sampleQuery, {})

  console.log('Sample flavor notes:')
  console.log('─────────────────────────────────────────────────────────\n')

  for (const row of samples) {
    console.log(`  • ${row.cultivar} from ${row.region} (${row.tier})`)
    console.log(`    "${row.notes}"`)
    console.log('')
  }

  await closeDriver()
}

main().catch(console.error)
