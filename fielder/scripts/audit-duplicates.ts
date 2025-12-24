#!/usr/bin/env tsx
import { runWriteTransaction, closeDriver } from '../src/lib/graph/index'

/**
 * Audit duplicate nodes to understand what needs cleanup
 *
 * Expected vs Actual:
 * - Variety: 20 expected, 44 actual (24 duplicates)
 * - GrowingRegion: 153 expected, 185 actual (32 duplicates/aliases)
 */

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗')
  console.log('║  AUDIT DUPLICATE NODES                                 ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  // =========================================================================
  // VARIETY Duplicates
  // =========================================================================
  console.log('VARIETY NODE AUDIT')
  console.log('─────────────────────────────────────────────────────────\n')

  const varietyCountQuery = `
    MATCH (v:Variety)
    RETURN count(v) as total
  `

  const vCount = await runWriteTransaction(varietyCountQuery, {})
  console.log(`Total Variety nodes: ${vCount[0].total}`)
  console.log(`Expected: 20`)
  console.log(`Duplicates: ${vCount[0].total - 20}\n`)

  // Find potential duplicates by displayName
  const varietyDupsQuery = `
    MATCH (v:Variety)
    WITH v.displayName as name, collect(v) as nodes, count(v) as count
    WHERE count > 1
    RETURN name, count, [n IN nodes | n.id] as ids, [n IN nodes | n.source] as sources
    ORDER BY count DESC
  `

  const varietyDups = await runWriteTransaction(varietyDupsQuery, {})

  if (varietyDups.length > 0) {
    console.log('Duplicate Variety nodes (by displayName):')
    for (const row of varietyDups) {
      console.log(`  "${row.name}": ${row.count} nodes`)
      console.log(`    IDs: ${row.ids.join(', ')}`)
      console.log(`    Sources: ${row.sources.join(', ')}`)
    }
  } else {
    console.log('No exact duplicates by displayName')
    console.log('(May be different varieties or test data)\n')

    // Show all varieties
    const allVarietiesQuery = `
      MATCH (v:Variety)
      RETURN v.id as id,
             v.displayName as name,
             v.productId as productId,
             v.source as source
      ORDER BY v.id
    `

    const allVarieties = await runWriteTransaction(allVarietiesQuery, {})
    console.log('\nAll Variety nodes:')
    for (const row of allVarieties) {
      console.log(`  ${row.id.padEnd(25)} "${row.name || 'null'}"  (${row.productId || '?'})  [${row.source || '?'}]`)
    }
  }

  // =========================================================================
  // GROWING REGION Duplicates
  // =========================================================================
  console.log('\n\nGROWINGREGION NODE AUDIT')
  console.log('─────────────────────────────────────────────────────────\n')

  const regionCountQuery = `
    MATCH (r:GrowingRegion)
    RETURN count(r) as total
  `

  const rCount = await runWriteTransaction(regionCountQuery, {})
  console.log(`Total GrowingRegion nodes: ${rCount[0].total}`)
  console.log(`Expected: 153`)
  console.log(`Duplicates/Aliases: ${rCount[0].total - 153}\n`)

  // Find duplicates by displayName
  const regionDupsQuery = `
    MATCH (r:GrowingRegion)
    WITH r.displayName as name, collect(r) as nodes, count(r) as count
    WHERE count > 1
    RETURN name, count, [n IN nodes | n.id] as ids, [n IN nodes | n.source] as sources
    ORDER BY count DESC
    LIMIT 20
  `

  const regionDups = await runWriteTransaction(regionDupsQuery, {})

  if (regionDups.length > 0) {
    console.log('Duplicate GrowingRegion nodes (by displayName):')
    for (const row of regionDups) {
      console.log(`  "${row.name}": ${row.count} nodes`)
      console.log(`    IDs: ${row.ids.join(', ')}`)
      console.log(`    Sources: ${row.sources.join(', ')}`)
    }
  }

  // Check for regions with source != 'typescript' (cleanup candidates)
  const nonTypescriptQuery = `
    MATCH (r:GrowingRegion)
    WHERE r.source IS NULL OR r.source <> 'typescript'
    RETURN count(r) as count,
           [r.id][0..10] as sampleIds
  `

  const nonTS = await runWriteTransaction(nonTypescriptQuery, {})
  if (nonTS.length > 0 && nonTS[0].count > 0) {
    console.log(`\n\nRegions without source='typescript': ${nonTS[0].count}`)
    console.log(`  Sample IDs: ${nonTS[0].sampleIds.join(', ')}`)
    console.log(`  These are candidates for cleanup (aliases or old data)`)
  }

  // =========================================================================
  // RECOMMENDATIONS
  // =========================================================================
  console.log('\n\n╔════════════════════════════════════════════════════════╗')
  console.log('║  CLEANUP RECOMMENDATIONS                               ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  console.log('VARIETY CLEANUP STRATEGY:')
  console.log('  1. Identify canonical variety (source=\'typescript\' preferred)')
  console.log('  2. Merge relationships from duplicates to canonical')
  console.log('  3. Delete duplicate nodes')
  console.log('  Target: 44 → 20 nodes\n')

  console.log('GROWINGREGION CLEANUP STRATEGY:')
  console.log('  1. Keep regions with source=\'typescript\'')
  console.log('  2. Identify aliases (different IDs, same location)')
  console.log('  3. Merge relationships to canonical region')
  console.log('  4. Delete aliases and old test data')
  console.log('  Target: 185 → 153 nodes\n')

  console.log('VALIDATION:')
  console.log('  - Node counts should match TypeScript constants')
  console.log('  - All relationships preserved (merged to canonical)')
  console.log('  - No data loss, just deduplication\n')

  await closeDriver()
}

main().catch(console.error)
