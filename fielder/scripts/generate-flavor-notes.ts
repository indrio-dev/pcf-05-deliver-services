#!/usr/bin/env tsx
import { runWriteTransaction, closeDriver } from '../src/lib/graph/index'

/**
 * Generate flavor notes for all GROWN_IN relationships
 *
 * Combines:
 * 1. Cultivar.flavorProfile (genetic flavor base)
 * 2. Region terroir effect (if available from SoilProfile)
 * 3. Quality tier modifier (exceptional/excellent/good)
 *
 * Result: All 4,614 GROWN_IN relationships get region-specific flavor notes
 */

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗')
  console.log('║  GENERATE FLAVOR NOTES FOR ALL OFFERINGS               ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  // =========================================================================
  // STEP 1: Check current coverage
  // =========================================================================
  console.log('STEP 1: Checking current flavor note coverage...\n')

  const coverageQuery = `
    MATCH ()-[g:GROWN_IN]->()
    WITH count(g) as total
    MATCH ()-[g2:GROWN_IN]->()
    WHERE g2.flavorNotes IS NOT NULL AND g2.flavorNotes <> ''
    RETURN total, count(g2) as withNotes
  `

  const coverage = await runWriteTransaction(coverageQuery, {})

  if (coverage.length > 0) {
    const c = coverage[0]
    console.log(`  Total GROWN_IN relationships: ${c.total}`)
    console.log(`  With flavor notes: ${c.withNotes}`)
    console.log(`  Missing flavor notes: ${c.total - c.withNotes}\n`)
  }

  // =========================================================================
  // STEP 2: Generate flavor notes
  // =========================================================================
  console.log('STEP 2: Generating flavor notes for all offerings...\n')

  const generateQuery = `
    MATCH (c:Cultivar)-[g:GROWN_IN]->(r:GrowingRegion)
    WHERE g.flavorNotes IS NULL OR g.flavorNotes = ''
    WITH c, g, r
    LIMIT 5000  // Process in batches

    // Get soil profile for terroir
    OPTIONAL MATCH (r)-[:HAS_SOIL]->(s:SoilProfile)

    // Generate flavor note combining cultivar + region + tier
    WITH c, g, r, s,
      c.flavorProfile as baseFlavor,
      s.terroirEffect as terroir,
      g.quality_tier as tier

    WHERE baseFlavor IS NOT NULL

    // Build flavor note
    SET g.flavorNotes =
      CASE
        WHEN terroir IS NOT NULL AND tier = 'exceptional' THEN
          baseFlavor + ' with exceptional terroir from ' + r.displayName + ' - ' + terroir
        WHEN terroir IS NOT NULL THEN
          baseFlavor + ' from ' + r.displayName + '; ' + terroir
        WHEN tier = 'exceptional' THEN
          baseFlavor + ' at its finest from ' + r.displayName
        WHEN tier = 'excellent' THEN
          baseFlavor + ' from premium ' + r.displayName
        ELSE
          baseFlavor + ' grown in ' + r.displayName
      END

    RETURN count(*) as updated
  `

  let totalUpdated = 0
  let iterations = 0

  while (iterations < 5) {
    console.log(`  Batch ${iterations + 1}...`)

    const result = await runWriteTransaction(generateQuery, {})
    const updated = result[0]?.updated || 0

    totalUpdated += updated
    console.log(`    ✓ Generated ${updated} flavor notes (total: ${totalUpdated})`)

    if (updated === 0) {
      break
    }

    iterations++
  }

  console.log(`\n✓ Generated ${totalUpdated} flavor notes\n`)

  // =========================================================================
  // VERIFICATION
  // =========================================================================
  console.log('╔════════════════════════════════════════════════════════╗')
  console.log('║  FLAVOR NOTES GENERATION COMPLETE                      ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  const finalCoverageQuery = `
    MATCH ()-[g:GROWN_IN]->()
    WITH count(g) as total
    MATCH ()-[g2:GROWN_IN]->()
    WHERE g2.flavorNotes IS NOT NULL AND g2.flavorNotes <> ''
    RETURN total,
           count(g2) as withNotes,
           round(100.0 * count(g2) / total) as pctCoverage
  `

  const final = await runWriteTransaction(finalCoverageQuery, {})

  if (final.length > 0) {
    const f = final[0]
    console.log(`Final coverage:`)
    console.log(`  Total offerings: ${f.total}`)
    console.log(`  With flavor notes: ${f.withNotes} (${f.pctCoverage}%)`)
  }

  // Show samples
  console.log('\n\nSample Generated Flavor Notes:')
  console.log('─────────────────────────────────────────────────────────\n')

  const sampleQuery = `
    MATCH (c:Cultivar)-[g:GROWN_IN]->(r:GrowingRegion)
    WHERE g.flavorNotes IS NOT NULL
    RETURN c.displayName as cultivar,
           r.displayName as region,
           g.quality_tier as tier,
           g.flavorNotes as notes
    ORDER BY g.quality_tier, c.displayName
    LIMIT 15
  `

  const samples = await runWriteTransaction(sampleQuery, {})

  for (const row of samples) {
    console.log(`  • ${row.cultivar} from ${row.region} (${row.tier})`)
    console.log(`    "${row.notes}"`)
    console.log('')
  }

  console.log('\n')

  await closeDriver()
}

main().catch(console.error)
