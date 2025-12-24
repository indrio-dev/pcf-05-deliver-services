#!/usr/bin/env tsx
/**
 * Audit Graph Data
 *
 * Shows ACTUAL data in the graph for human verification
 */

import { runQuery, closeDriver } from '../src/lib/graph/index'

async function main() {
  console.log('\n╔═══════════════════════════════════════════════════════╗')
  console.log('║     KNOWLEDGE GRAPH DATA AUDIT                        ║')
  console.log('╚═══════════════════════════════════════════════════════╝\n')

  // 1. Cultivars
  const cultivars = await runQuery<any>(`
    MATCH (c:Cultivar)
    RETURN c.name, c.productType, c.heritageIntent, c.brixBase, c.gddToMaturity, c.gddToPeak
    ORDER BY c.name
  `, {})

  console.log('1. CULTIVARS IN GRAPH:')
  console.log('─'.repeat(80))
  for (const c of cultivars.slice(0, 10)) {
    console.log(`${c['c.name']}`)
    console.log(`  Product: ${c['c.productType']}`)
    console.log(`  Brix base: ${c['c.brixBase']}`)
    console.log(`  GDD to peak: ${c['c.gddToPeak']}`)
    console.log(`  Heritage: ${c['c.heritageIntent'] || 'unknown'}`)
    console.log()
  }

  // 2. Growing regions
  const regions = await runQuery<any>(`
    MATCH (gr:GrowingRegion)
    RETURN gr.id, gr.name, gr.state, gr.primaryCrops
    ORDER BY gr.state
  `, {})

  console.log('2. GROWING REGIONS IN GRAPH:')
  console.log('─'.repeat(80))
  for (const r of regions) {
    console.log(`${r['gr.id']} - ${r['gr.name']} (${r['gr.state']})`)
    console.log(`  Crops: ${r['gr.primaryCrops']}`)
  }

  // 3. Growers with products in Indian River
  const irGrowers = await runQuery<any>(`
    MATCH (g:Grower)
    WHERE g.city IN ['Vero Beach', 'Fort Pierce', 'Sebastian']
    AND g.stateCode = 'FL'
    RETURN g.name, g.city, g.products
    LIMIT 10
  `, {})

  console.log('\n3. GROWERS IN INDIAN RIVER CITIES:')
  console.log('─'.repeat(80))
  for (const g of irGrowers) {
    console.log(`${g['g.name']} (${g['g.city']})`)
    console.log(`  Products: ${g['g.products']}`)
  }

  await closeDriver()
}

main().catch(console.error)
