#!/usr/bin/env tsx
import { runWriteTransaction, closeDriver } from '../src/lib/graph/index'
import { CULTIVARS } from '../src/lib/constants/products'

async function main() {
  const cultivars = Object.values(CULTIVARS || {})
  console.log(`\nLoading ${cultivars.length} cultivars...\n`)

  for (const cultivar of cultivars) {
    await runWriteTransaction(`
      MERGE (c:Cultivar {id: $id})
      ON CREATE SET
        c.name = $name,
        c.productType = $productType,
        c.heritageIntent = $heritageIntent,
        c.brixMin = $brixMin,
        c.brixMax = $brixMax,
        c.isNonGmo = $isNonGmo,
        c.source = 'typescript'
      ON MATCH SET
        c.name = $name,
        c.productType = $productType
      
      WITH c
      MERGE (pt:ProductType {id: $productType})
      MERGE (c)-[:OF_PRODUCT_TYPE]->(pt)
    `, {
      id: cultivar.id,
      name: cultivar.name,
      productType: cultivar.productType,
      heritageIntent: cultivar.heritageIntent || null,
      brixMin: cultivar.brixRange?.[0] || null,
      brixMax: cultivar.brixRange?.[1] || null,
      isNonGmo: cultivar.isNonGmo ?? null
    })
  }

  console.log(`✅ ${cultivars.length} cultivars loaded\n`)
}

main().then(() => closeDriver()).catch(console.error)
