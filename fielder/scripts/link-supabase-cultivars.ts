#!/usr/bin/env tsx

/**
 * Link Supabase Cultivars to Varieties
 *
 * These are the enriched cultivars with full Brix data, GDD, etc.
 */

import { runWriteTransaction, closeDriver } from '../src/lib/graph/index'

// Specific mapping for the 12 Supabase cultivars
const SUPABASE_CULTIVAR_TO_VARIETY: Record<string, string> = {
  // APPLES
  'arkansas_black': 'heirloom_apple',
  'honeycrisp': 'honeycrisp',
  'cosmic_crisp': 'cosmic_crisp',

  // GRAPEFRUIT
  'rio_red': 'ruby_grapefruit',
  'ruby_red': 'ruby_grapefruit',

  // NAVEL ORANGES
  'cara_cara': 'navel',
  'lane_late': 'navel',
  'washington_navel': 'navel',

  // PEACHES
  'elberta': 'freestone_peach',
  'georgia_belle': 'freestone_peach',

  // STRAWBERRIES
  'sweet_charlie': 'june_bearing',
  'florida_radiance': 'june_bearing',
}

async function main() {
  console.log('='.repeat(80))
  console.log('LINK SUPABASE CULTIVARS TO VARIETIES')
  console.log('='.repeat(80))
  console.log()
  console.log(`Mapping ${Object.keys(SUPABASE_CULTIVAR_TO_VARIETY).length} Supabase cultivars...`)
  console.log()

  let linked = 0
  let errors = 0

  for (const [cultivarId, varietyId] of Object.entries(SUPABASE_CULTIVAR_TO_VARIETY)) {
    try {
      await runWriteTransaction(`
        // Update Cultivar with varietyId property
        MATCH (c:Cultivar {id: $cultivarId})
        WHERE c.source = "supabase"
        SET c.varietyId = $varietyId

        // Create relationship
        WITH c
        MATCH (v:Variety {id: $varietyId})
        MERGE (c)-[:BELONGS_TO_VARIETY]->(v)

        RETURN c.name as cultivarName, v.displayName as varietyName
      `, {
        cultivarId,
        varietyId
      })

      linked++
      console.log(`  ✓ Linked ${cultivarId} → ${varietyId}`)
    } catch (error) {
      console.error(`  ❌ Error linking ${cultivarId}:`, error)
      errors++
    }
  }

  console.log()
  console.log('='.repeat(80))
  console.log('RESULTS')
  console.log('='.repeat(80))
  console.log(`✅ Successfully linked: ${linked}`)
  console.log(`❌ Errors: ${errors}`)
  console.log()

  await closeDriver()
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
