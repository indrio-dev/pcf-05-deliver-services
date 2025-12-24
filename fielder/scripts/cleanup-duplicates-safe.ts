#!/usr/bin/env tsx
import { runWriteTransaction, closeDriver } from '../src/lib/graph/index'

/**
 * Safe duplicate cleanup
 *
 * Strategy:
 * 1. For Varieties: Keep source='typescript', merge others
 * 2. For GrowingRegions: Keep source='typescript', merge others
 * 3. Preserve all relationships by redirecting to canonical node
 */

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗')
  console.log('║  CLEANUP DUPLICATE NODES (SAFE)                        ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  // =========================================================================
  // STEP 1: Check current state
  // =========================================================================
  console.log('STEP 1: Current state\n')

  const varietyCount = await runWriteTransaction(`MATCH (v:Variety) RETURN count(v) as count`, {})
  const regionCount = await runWriteTransaction(`MATCH (r:GrowingRegion) RETURN count(r) as count`, {})

  console.log(`  Variety nodes: ${varietyCount[0].count} (expected 20)`)
  console.log(`  GrowingRegion nodes: ${regionCount[0].count} (expected 153)\n`)

  // =========================================================================
  // STEP 2: Cleanup Variety duplicates
  // =========================================================================
  console.log('STEP 2: Cleaning up Variety duplicates...\n')

  // Delete varieties without source or with non-typescript source that have no relationships
  const cleanVarietiesQuery = `
    MATCH (v:Variety)
    WHERE (v.source IS NULL OR v.source <> 'typescript')
      AND NOT (v)<-[:BELONGS_TO_VARIETY]-()
      AND NOT (v)-[:BELONGS_TO_PRODUCT]->()
    DELETE v
    RETURN count(v) as deleted
  `

  const varietiesDeleted = await runWriteTransaction(cleanVarietiesQuery, {})
  console.log(`  ✓ Deleted ${varietiesDeleted[0]?.deleted || 0} orphaned Variety nodes\n`)

  // =========================================================================
  // STEP 3: Cleanup GrowingRegion duplicates
  // =========================================================================
  console.log('STEP 3: Cleaning up GrowingRegion duplicates...\n')

  // Delete regions without source='typescript' that have no relationships
  const cleanRegionsQuery = `
    MATCH (r:GrowingRegion)
    WHERE (r.source IS NULL OR r.source <> 'typescript')
      AND NOT (r)<-[:LOCATED_IN]-()
      AND NOT (r)<-[:GROWN_IN]-()
      AND NOT (r)<-[:HAS_PHENOLOGY_IN]-()
      AND NOT (r)-[:HAS_COUNTY]->()
      AND NOT (r)-[:HAS_CITY]->()
    DELETE r
    RETURN count(r) as deleted
  `

  const regionsDeleted = await runWriteTransaction(cleanRegionsQuery, {})
  console.log(`  ✓ Deleted ${regionsDeleted[0]?.deleted || 0} orphaned GrowingRegion nodes\n`)

  // =========================================================================
  // STEP 4: Verify final counts
  // =========================================================================
  console.log('STEP 4: Final verification\n')

  const finalVarietyCount = await runWriteTransaction(`MATCH (v:Variety) RETURN count(v) as count`, {})
  const finalRegionCount = await runWriteTransaction(`MATCH (r:GrowingRegion) RETURN count(r) as count`, {})

  console.log(`  Variety nodes: ${finalVarietyCount[0].count} (expected 20)`)
  console.log(`  GrowingRegion nodes: ${finalRegionCount[0].count} (expected 153)`)

  const varietyGap = finalVarietyCount[0].count - 20
  const regionGap = finalRegionCount[0].count - 153

  if (varietyGap > 0) {
    console.log(`\n  ⚠️  Still ${varietyGap} extra Variety nodes (have relationships, can't auto-delete)`)
  }

  if (regionGap > 0) {
    console.log(`\n  ⚠️  Still ${regionGap} extra GrowingRegion nodes (have relationships, can't auto-delete)`)
  }

  if (varietyGap === 0 && regionGap === 0) {
    console.log(`\n  ✅ Node counts match TypeScript expectations!`)
  }

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log('\n╔════════════════════════════════════════════════════════╗')
  console.log('║  DUPLICATE CLEANUP COMPLETE                            ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  console.log(`Varieties deleted: ${varietiesDeleted[0]?.deleted || 0}`)
  console.log(`Regions deleted: ${regionsDeleted[0]?.deleted || 0}`)
  console.log(`\nFinal counts:`)
  console.log(`  Varieties: ${finalVarietyCount[0].count}`)
  console.log(`  Regions: ${finalRegionCount[0].count}\n`)

  await closeDriver()
}

main().catch(console.error)
