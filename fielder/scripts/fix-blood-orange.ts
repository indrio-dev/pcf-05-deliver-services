#!/usr/bin/env tsx

/**
 * Fix Blood Orange - Link existing Tarocco and Moro cultivars
 */

import { runWriteTransaction, closeDriver } from '../src/lib/graph/index'

async function main() {
  console.log('='.repeat(80))
  console.log('FIX BLOOD ORANGE - LINK EXISTING CULTIVARS')
  console.log('='.repeat(80))
  console.log()

  const cultivarsToLink = ['tarocco', 'moro']

  for (const cultivarId of cultivarsToLink) {
    try {
      await runWriteTransaction(`
        MATCH (c:Cultivar {id: $cultivarId})
        SET c.varietyId = 'blood'

        WITH c
        MATCH (v:Variety {id: 'blood'})
        MERGE (c)-[:BELONGS_TO_VARIETY]->(v)

        RETURN c.displayName as name
      `, { cultivarId })

      console.log(`  ✅ Linked ${cultivarId} to Blood Orange variety`)
    } catch (error) {
      console.error(`  ❌ Error linking ${cultivarId}:`, error)
    }
  }

  console.log()
  console.log('Verifying Blood Orange count...')

  const count = await runWriteTransaction<{ count: number }>(`
    MATCH (c:Cultivar)-[:BELONGS_TO_VARIETY]->(v:Variety {id: 'blood'})
    RETURN count(c) as count
  `)

  console.log(`Blood Orange cultivars: ${count[0].count} ${count[0].count >= 5 ? '✅' : '⚠️'}`)
  console.log()

  await closeDriver()
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
