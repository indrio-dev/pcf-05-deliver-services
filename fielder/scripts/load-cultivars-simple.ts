#!/usr/bin/env tsx
import { runWriteTransaction, closeDriver } from '../src/lib/graph/index'
import { CULTIVARS } from '../src/lib/constants/products'

async function main() {
  const cultivars = Object.values(CULTIVARS || {})
  console.log(`\nLoading ${cultivars.length} cultivars...\n`)

  for (const c of cultivars) {
    await runWriteTransaction(`
      MERGE (cultivar:Cultivar {id: $id})
      SET cultivar += $properties
      
      WITH cultivar
      MATCH (pt:ProductType {id: $productType})
      MERGE (cultivar)-[:OF_PRODUCT_TYPE]->(pt)
    `, {
      id: c.id,
      productType: c.productType,
      properties: {
        name: c.name,
        productType: c.productType,
        heritageIntent: c.heritageIntent || null,
        brixMin: c.brixRange?.[0] || null,
        brixMax: c.brixRange?.[1] || null,
        isNonGmo: c.isNonGmo ?? null,
        source: 'typescript'
      }
    })
  }

  console.log(`✅ ${cultivars.length} cultivars loaded\n`)
}

main().then(() => closeDriver()).catch(console.error)
