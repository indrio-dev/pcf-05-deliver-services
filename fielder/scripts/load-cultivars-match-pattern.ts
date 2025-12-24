#!/usr/bin/env tsx
import { runWriteTransaction, closeDriver } from '../src/lib/graph/index'
import { CULTIVARS } from '../src/lib/constants/products'

async function main() {
  const cultivars = Object.values(CULTIVARS || {})
  console.log(`\nLoading ${cultivars.length} cultivars...\n`)

  for (const c of cultivars) {
    // Match the exact pattern that worked for geography
    await runWriteTransaction(`
      MERGE (cultivar:Cultivar {id: $id})
      SET cultivar.name = $name
      
      MERGE (pt:ProductType {id: $productType})
      MERGE (cultivar)-[:OF_PRODUCT_TYPE]->(pt)
    `, {
      id: c.id,
      name: c.name,
      productType: c.productType
    })
  }

  console.log(`✅ ${cultivars.length} cultivars loaded\n`)
}

main().then(() => closeDriver()).catch(console.error)
