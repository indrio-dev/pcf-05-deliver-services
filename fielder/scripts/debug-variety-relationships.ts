#!/usr/bin/env tsx

/**
 * Debug Variety Relationships
 *
 * Check what relationships exist between Varieties and Cultivars
 */

import { runQuery } from '../src/lib/graph/neo4j'

async function main() {
  console.log('='.repeat(80))
  console.log('DEBUGGING VARIETY RELATIONSHIPS')
  console.log('='.repeat(80))
  console.log()

  // Check all varieties
  const varieties = await runQuery<{ name: string, id: string }>(
    'MATCH (v:Variety) RETURN v.name as name, v.id as id ORDER BY name LIMIT 10'
  )
  console.log(`Sample Varieties (first 10 of 48):`)
  varieties.forEach(v => console.log(`  - ${v.name} (id: ${v.id})`))
  console.log()

  // Check all cultivars
  const cultivars = await runQuery<{ name: string, id: string, varietyId?: string }>(
    'MATCH (c:Cultivar) RETURN c.name as name, c.id as id, c.varietyId as varietyId ORDER BY name LIMIT 10'
  )
  console.log(`Sample Cultivars (first 10 of 780):`)
  cultivars.forEach(c => console.log(`  - ${c.name} (id: ${c.id}, varietyId: ${c.varietyId || 'MISSING'})`))
  console.log()

  // Check BELONGS_TO_VARIETY relationships
  const relationships = await runQuery<{ cultivarName: string, varietyName: string }>(
    `MATCH (c:Cultivar)-[r:BELONGS_TO_VARIETY]->(v:Variety)
     RETURN c.name as cultivarName, v.name as varietyName
     LIMIT 20`
  )
  console.log(`BELONGS_TO_VARIETY relationships (first 20):`)
  if (relationships.length === 0) {
    console.log('  ❌ NO RELATIONSHIPS FOUND!')
  } else {
    relationships.forEach(r => console.log(`  - ${r.cultivarName} → ${r.varietyName}`))
  }
  console.log()

  // Check cultivars WITH varietyId property
  const cultivarsWithVariety = await runQuery<{ count: number }>(
    'MATCH (c:Cultivar) WHERE c.varietyId IS NOT NULL RETURN count(c) as count'
  )
  console.log(`Cultivars with varietyId property: ${cultivarsWithVariety[0].count}`)

  // Check cultivars WITHOUT varietyId property
  const cultivarsWithoutVariety = await runQuery<{ count: number }>(
    'MATCH (c:Cultivar) WHERE c.varietyId IS NULL RETURN count(c) as count'
  )
  console.log(`Cultivars WITHOUT varietyId property: ${cultivarsWithoutVariety[0].count}`)
  console.log()

  // Sample cultivars without variety
  const orphans = await runQuery<{ name: string, id: string }>(
    'MATCH (c:Cultivar) WHERE c.varietyId IS NULL RETURN c.name as name, c.id as id LIMIT 10'
  )
  console.log(`Sample orphaned cultivars (no varietyId):`)
  orphans.forEach(c => console.log(`  - ${c.name} (${c.id})`))
  console.log()
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Error:', error)
    process.exit(1)
  })
