#!/usr/bin/env tsx
import { runWriteTransaction, closeDriver } from '../src/lib/graph/index'
import { CULTIVARS } from '../src/lib/constants/products'

async function main() {
  const cultivars = Object.values(CULTIVARS || {})
  console.log(`\nLoading ${cultivars.length} cultivars with H pillar attributes...\n`)

  let loaded = 0

  for (const c of cultivars) {
    // Create Cultivar node
    await runWriteTransaction(`
      MERGE (cultivar:Cultivar {id: $id})
      SET cultivar.name = $name,
          cultivar.productType = $productType,
          cultivar.heritageIntent = $heritageIntent,
          cultivar.brixMin = $brixMin,
          cultivar.brixMax = $brixMax,
          cultivar.isNonGmo = $isNonGmo,
          cultivar.source = 'typescript'
    `, {
      id: c.id,
      name: c.name,
      productType: c.productType,
      heritageIntent: c.heritageIntent || null,
      brixMin: c.brixRange?.[0] || null,
      brixMax: c.brixRange?.[1] || null,
      isNonGmo: c.isNonGmo ?? null
    })

    // Link to ProductType (separate transaction)
    await runWriteTransaction(`
      MATCH (cultivar:Cultivar {id: $cultivarId})
      MERGE (pt:ProductType {id: $productType})
      MERGE (cultivar)-[:OF_PRODUCT_TYPE]->(pt)
    `, {
      cultivarId: c.id,
      productType: c.productType
    })

    loaded++
    if (loaded % 25 === 0) console.log(`  ${loaded}/${cultivars.length}...`)
  }

  console.log(`\n✅ Loaded ${loaded} cultivars with H pillar data\n`)
}

main().then(() => closeDriver()).catch(console.error)
