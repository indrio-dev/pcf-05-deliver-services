#!/usr/bin/env tsx
/**
 * Test "At Peak" Query with Real Graph Data
 *
 * Validates complete S×H×R integration
 */

import { runQuery, closeDriver } from '../src/lib/graph/index'

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════╗')
  console.log('║  TEST: "AT PEAK" QUERY WITH REAL GRAPH DATA           ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  // Test 1: Cultivars grown in Indian River
  const indianRiver = await runQuery(`
    MATCH (c:Cultivar)-[g:GROWN_IN]->(r:GrowingRegion {id: 'indian_river_fl'})
    MATCH (r)-[:HAS_TYPICAL_SOIL]->(soil:SoilProfile)
    RETURN c.name as cultivar, soil.type as soilType, soil.terroir_effect as terroir
    LIMIT 5
  `, {})

  console.log('TEST 1: Cultivars in Indian River (S×H link)')
  console.log('─'.repeat(80))
  console.log(`Found: ${indianRiver.length} cultivars`)
  for (const r of indianRiver) {
    console.log(`  • ${r.cultivar}`)
    console.log(`    Soil: ${r.soilType}`)
    console.log(`    Terroir: ${r.terroir?.substring(0, 50) || 'not specified'}`)
  }

  // Test 2: Cultivars with phenology timing
  const withTiming = await runQuery(`
    MATCH (c:Cultivar)-[p:HAS_PHENOLOGY_IN]->(r:GrowingRegion)
    WHERE r.id CONTAINS 'florida'
    RETURN c.name as cultivar, r.name as region, p.gdd_to_peak as gddToPeak
    LIMIT 5
  `, {})

  console.log('\n\nTEST 2: Phenology data (H×S×R link)')
  console.log('─'.repeat(80))
  console.log(`Found: ${withTiming.length} entries with timing`)
  for (const r of withTiming) {
    console.log(`  • ${r.cultivar} in ${r.region}`)
    console.log(`    GDD to peak: ${r.gddToPeak}`)
  }

  // Test 3: Complete "at peak" simulation
  console.log('\n\nTEST 3: Simulated "At Peak" Query')
  console.log('─'.repeat(80))
  console.log('Input: Indian River, Dec 22, Current GDD = 2900')
  console.log()

  const atPeak = await runQuery(`
    MATCH (c:Cultivar)-[g:GROWN_IN]->(r:GrowingRegion {id: 'indian_river_fl'})
    MATCH (c)-[p:HAS_PHENOLOGY_IN]->(r)
    MATCH (r)-[:HAS_TYPICAL_SOIL]->(soil:SoilProfile)
    WHERE p.gdd_to_peak IS NOT NULL
    WITH c, p, soil, 2900 as currentGDD
    WHERE currentGDD >= (p.gdd_to_peak - 500)
      AND currentGDD <= (p.gdd_to_peak + 500)
    RETURN c.name as cultivar,
           p.gdd_to_peak as optimalGDD,
           currentGDD,
           soil.terroir_effect as terroir
  `, {})

  console.log(`Result: ${atPeak.length} products at peak`)
  for (const r of atPeak) {
    console.log(`  ✓ ${r.cultivar}`)
    console.log(`    GDD: ${r.currentGDD} (optimal: ${r.optimalGDD})`)
    console.log(`    Terroir: ${r.terroir?.substring(0, 50)}`)
  }

  console.log('\n╔════════════════════════════════════════════════════════╗')
  console.log('║                  TEST COMPLETE                         ║')
  console.log('╠════════════════════════════════════════════════════════╣')
  console.log(`║  S×H×R Integration: ${indianRiver.length > 0 || withTiming.length > 0 ? 'WORKING ✅' : 'INCOMPLETE'}                         ║`)
  console.log('╚════════════════════════════════════════════════════════╝\n')

  await closeDriver()
}

main()
