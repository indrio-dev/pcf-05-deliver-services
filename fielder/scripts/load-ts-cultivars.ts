#!/usr/bin/env tsx
import { runWriteTransaction, closeDriver } from '../src/lib/graph/index'
import { CULTIVARS } from '../src/lib/constants/products'

async function main() {
  const cultivars = Object.values(CULTIVARS || {})
  console.log('\n╔════════════════════════════════════════════════════════╗')
  console.log('║  LOAD CULTIVAR HIERARCHY FROM PRODUCTS.TS              ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')
  console.log(`Loading ${cultivars.length} cultivars...\n`)

  let loaded = 0

  for (const cultivar of cultivars) {
    // Create Cultivar node with H pillar attributes
    await runWriteTransaction(`
      MERGE (c:Cultivar {id: $id})
      SET c.name = $name,
          c.productType = $productType,
          c.heritageIntent = $heritageIntent,
          c.brixMin = $brixMin,
          c.brixMax = $brixMax,
          c.isNonGmo = $isNonGmo,
          c.source = 'typescript'
      
      // Link to ProductType
      MERGE (pt:ProductType {id: $productType})
      MERGE (c)-[:OF_PRODUCT_TYPE]->(pt)
    `, {
      id: cultivar.id,
      name: cultivar.name,
      productType: cultivar.productType,
      heritageIntent: cultivar.heritageIntent || null,
      brixMin: cultivar.brixRange ? cultivar.brixRange[0] : null,
      brixMax: cultivar.brixRange ? cultivar.brixRange[1] : null,
      isNonGmo: cultivar.isNonGmo !== undefined ? cultivar.isNonGmo : null
    })

    loaded++
    if (loaded % 50 === 0) console.log(`  ${loaded}/${cultivars.length}...`)
  }

  console.log(`\n✅ Loaded ${cultivars.length} cultivars with H pillar attributes\n`)
}

main().then(() => closeDriver()).catch(console.error)
