#!/usr/bin/env tsx
import { runWriteTransaction, closeDriver } from '../src/lib/graph/index'
import { ALL_GROWING_REGIONS } from '../src/lib/constants/growing-regions'

/**
 * Load additional soil data to GrowingRegion nodes
 *
 * TypeScript defines soil mineral structure but it's NOT POPULATED in the data yet.
 * This script loads what IS available:
 * - mineralNotes (descriptive text - 5 regions)
 * - organicMatterPct (5 regions)
 * - phRange (already loaded during geography load)
 *
 * What's NOT available (defined in interface but not in data):
 * - Structured minerals: phosphorus, potassium, calcium, magnesium
 * - Would need soil testing data to populate
 */

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗')
  console.log('║  LOAD ADDITIONAL SOIL DATA TO REGIONS                  ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  const regions = Object.values(ALL_GROWING_REGIONS)
  console.log(`Processing ${regions.length} regions for soil data...\n`)

  let stats = {
    regionsProcessed: 0,
    withMineralNotes: 0,
    withOrganicMatter: 0,
    withPhRange: 0,
  }

  // =========================================================================
  // Load available soil data
  // =========================================================================
  console.log('Loading available soil data fields...\n')

  for (const region of regions) {
    if (!region.typicalSoil) continue

    const soil = region.typicalSoil
    const params: Record<string, any> = { id: region.id }
    const setFields: string[] = []

    // mineralNotes (descriptive text)
    if (soil.mineralNotes) {
      setFields.push('r.soilMineralNotes = $mineralNotes')
      params.mineralNotes = soil.mineralNotes
      stats.withMineralNotes++
    }

    // organicMatterPct
    if (soil.organicMatterPct !== undefined) {
      setFields.push('r.soilOrganicMatterPct = $organicMatterPct')
      params.organicMatterPct = soil.organicMatterPct
      stats.withOrganicMatter++
    }

    // phRange (may already be loaded, but ensure it's there)
    if (soil.phRange) {
      setFields.push('r.soilPhMin = $phMin')
      setFields.push('r.soilPhMax = $phMax')
      params.phMin = soil.phRange[0]
      params.phMax = soil.phRange[1]
      stats.withPhRange++
    }

    if (setFields.length > 0) {
      const setClause = setFields.join(',\n          ')

      await runWriteTransaction(`
        MATCH (r:GrowingRegion {id: $id})
        SET ${setClause}
        RETURN r.id
      `, params)

      stats.regionsProcessed++
    }
  }

  console.log(`✓ Updated ${stats.regionsProcessed} regions with soil data\n`)

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log('╔════════════════════════════════════════════════════════╗')
  console.log('║  SOIL DATA LOAD COMPLETE                               ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  console.log(`Regions updated: ${stats.regionsProcessed}`)
  console.log(`\nSoil fields added:`)
  console.log(`  mineralNotes (descriptive): ${stats.withMineralNotes}`)
  console.log(`  organicMatterPct: ${stats.withOrganicMatter}`)
  console.log(`  phRange: ${stats.withPhRange}`)

  console.log(`\n⚠️  NOTE: Structured mineral data (P, K, Ca, Mg) not available`)
  console.log(`   TypeScript interface defines it, but data is not populated`)
  console.log(`   Would require soil testing to populate`)
  console.log(`   Current: Have descriptive mineralNotes for ${stats.withMineralNotes} regions\n`)

  // =========================================================================
  // VERIFICATION
  // =========================================================================
  console.log('Sample region with soil data:')
  console.log('─────────────────────────────────────────────────────────\n')

  const sampleQuery = `
    MATCH (r:GrowingRegion {id: 'sacramento_valley'})
    RETURN r.displayName as region,
           r.soilMineralNotes as mineralNotes,
           r.soilOrganicMatterPct as organicMatter,
           r.soilPhMin as phMin,
           r.soilPhMax as phMax
  `

  const sample = await runWriteTransaction(sampleQuery, {})

  if (sample.length > 0) {
    const s = sample[0]
    console.log(`  Region: ${s.region}`)
    console.log(`  Mineral Notes: ${s.mineralNotes}`)
    console.log(`  Organic Matter: ${s.organicMatter}%`)
    console.log(`  pH Range: ${s.phMin} - ${s.phMax}`)
  }

  console.log('\n')

  await closeDriver()
}

main().catch(console.error)
