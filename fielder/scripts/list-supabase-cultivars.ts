#!/usr/bin/env tsx

/**
 * List all Supabase cultivars grouped by cropId
 */

import { runQuery } from '../src/lib/graph/neo4j'

interface Cultivar {
  id: string
  name: string
  cropId: string
}

async function main() {
  const cultivars = await runQuery<Cultivar>(`
    MATCH (c:Cultivar)
    WHERE c.source = "supabase"
    RETURN c.id as id, c.name as name, c.cropId as cropId
    ORDER BY cropId, name
  `)

  let currentCrop = ''
  cultivars.forEach(c => {
    if (c.cropId !== currentCrop) {
      console.log(`\n${c.cropId}:`)
      currentCrop = c.cropId
    }
    console.log(`  - ${c.id} | ${c.name}`)
  })

  console.log(`\nTotal: ${cultivars.length} cultivars`)
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Error:', error)
    process.exit(1)
  })
