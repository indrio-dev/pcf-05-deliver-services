#!/usr/bin/env tsx
/**
 * Import USDA Local Food Portal Data Directly to Neo4j
 *
 * Bypasses TypeScript seed files for large-scale bulk import.
 * Handles deduplication and relationship creation.
 *
 * Usage:
 *   source .env.local && npx tsx scripts/import-usda-to-neo4j.ts
 *   source .env.local && npx tsx scripts/import-usda-to-neo4j.ts --dry-run
 */

import fs from 'fs'
import { runQuery, runWriteTransaction, closeDriver } from '../src/lib/graph/index'

interface USDAEntity {
  name: string
  stateCode: string
  city?: string
  website?: string
  roles: string[]
  retailChannels?: string[]
  facilityTypes?: string[]
  b2bChannels?: string[]
  products: string[]
  features?: string[]
  verificationLevel: string
  dataSource: string
  _coordinates?: { lon: number; lat: number }
}

interface ImportStats {
  total: number
  duplicates: number
  imported: number
  withProducts: number
  withoutProducts: number
  byRole: Record<string, number>
  byState: Record<string, number>
}

/**
 * Check if entity already exists in graph
 */
async function entityExists(name: string, state: string): Promise<boolean> {
  const result = await runQuery<{ exists: boolean }>(`
    MATCH (e:Entity {name: $name, stateCode: $state})
    RETURN count(e) > 0 as exists
  `, { name, state })

  return result[0]?.exists || false
}

/**
 * Build role labels for Cypher
 */
function buildRoleLabels(roles: string[]): string {
  const labelMap: Record<string, string> = {
    'grower': 'Grower',
    'packinghouse': 'Packinghouse',
    'retailer': 'Retailer',
  }

  return roles.map(r => labelMap[r] || r).join(':')
}

/**
 * Import a single entity
 */
async function importEntity(entity: USDAEntity): Promise<void> {
  const roleLabels = buildRoleLabels(entity.roles)
  const setLabelsClause = entity.roles.map(r => {
    const label = r.charAt(0).toUpperCase() + r.slice(1)
    return `SET e:${label}`
  }).join(' ')

  await runWriteTransaction(`
    MATCH (s:State {code: $stateCode})
    MERGE (e:Entity {name: $name, stateCode: $stateCode})
    REMOVE e:Grower, e:Packinghouse, e:Retailer
    ${setLabelsClause}
    SET e.city = $city,
        e.website = $website,
        e.verificationLevel = $verificationLevel,
        e.dataSource = $dataSource,
        e.features = $features,
        e.retailChannels = $retailChannels,
        e.facilityTypes = $facilityTypes,
        e.b2bChannels = $b2bChannels,
        e.importedAt = datetime()
    MERGE (e)-[:LOCATED_IN_STATE]->(s)
  `, {
    name: entity.name,
    stateCode: entity.stateCode,
    city: entity.city || null,
    website: entity.website || null,
    verificationLevel: entity.verificationLevel,
    dataSource: entity.dataSource,
    features: entity.features || [],
    retailChannels: entity.retailChannels || [],
    facilityTypes: entity.facilityTypes || [],
    b2bChannels: entity.b2bChannels || [],
  })

  // Link products
  if (entity.products && entity.products.length > 0) {
    const relationship = entity.roles.includes('grower') ? 'GROWS' : 'SELLS'

    for (const productId of entity.products) {
      await runWriteTransaction(`
        MATCH (e:Entity {name: $name, stateCode: $stateCode})
        MATCH (pt:ProductType {id: $productId})
        MERGE (e)-[:${relationship}]->(pt)
      `, {
        name: entity.name,
        stateCode: entity.stateCode,
        productId,
      })
    }
  }
}

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')

  console.log('╔════════════════════════════════════════════════════════╗')
  console.log('║       IMPORT USDA DATA TO NEO4J                        ║')
  console.log('╚════════════════════════════════════════════════════════╝')
  console.log('')

  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No data will be imported\n')
  }

  // Load USDA entities
  console.log('📂 Loading USDA entities...')
  const rawData = fs.readFileSync('data/collected/usda-local-food/usda-all-entities.json', 'utf-8')
  const data = JSON.parse(rawData)
  const entities: USDAEntity[] = data.entities

  console.log(`   Loaded ${entities.length} entities\n`)

  // Deduplicate
  console.log('🔍 Checking for duplicates...')

  const stats: ImportStats = {
    total: entities.length,
    duplicates: 0,
    imported: 0,
    withProducts: 0,
    withoutProducts: 0,
    byRole: {},
    byState: {},
  }

  // Sample check (full check would take too long)
  console.log('   Sampling 100 entities for duplicate check...')
  let dupeCheckCount = 0
  for (const entity of entities.slice(0, 100)) {
    if (await entityExists(entity.name, entity.stateCode)) {
      dupeCheckCount++
    }
  }

  console.log(`   Sample duplicate rate: ${dupeCheckCount}/100 (${dupeCheckCount}%)\n`)

  if (dryRun) {
    console.log('📊 DRY RUN SUMMARY:')
    console.log(`   Would import: ~${entities.length - (entities.length * dupeCheckCount / 100)} entities`)
    console.log(`   Estimated duplicates: ~${entities.length * dupeCheckCount / 100}`)
    console.log('\n✨ Dry run complete. Run without --dry-run to import.\n')
    await closeDriver()
    return
  }

  // Import entities
  console.log('📥 Importing entities to Neo4j...')
  console.log('   (This will take several minutes for 22K entities)\n')

  const startTime = Date.now()
  let progressCount = 0

  for (const entity of entities) {
    try {
      // Check if exists (basic deduplication)
      const exists = await entityExists(entity.name, entity.stateCode)

      if (exists) {
        stats.duplicates++
        continue
      }

      // Import
      await importEntity(entity)
      stats.imported++

      // Track stats
      if (entity.products && entity.products.length > 0) {
        stats.withProducts++
      } else {
        stats.withoutProducts++
      }

      for (const role of entity.roles) {
        stats.byRole[role] = (stats.byRole[role] || 0) + 1
      }

      stats.byState[entity.stateCode] = (stats.byState[entity.stateCode] || 0) + 1

      // Progress
      progressCount++
      if (progressCount % 500 === 0) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
        const rate = (progressCount / (Date.now() - startTime) * 1000).toFixed(1)
        console.log(`   Imported ${progressCount}/${entities.length} (${rate}/sec, ${elapsed}s elapsed)`)
      }
    } catch (error) {
      console.error(`   ❌ Failed to import ${entity.name} (${entity.stateCode}):`, error)
    }
  }

  const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1)

  console.log('\n╔════════════════════════════════════════════════════════╗')
  console.log('║                  IMPORT COMPLETE                       ║')
  console.log('╠════════════════════════════════════════════════════════╣')
  console.log(`║  Total processed:     ${stats.total.toString().padStart(6)}                        ║`)
  console.log(`║  Imported:            ${stats.imported.toString().padStart(6)}                        ║`)
  console.log(`║  Duplicates skipped:  ${stats.duplicates.toString().padStart(6)}                        ║`)
  console.log(`║  Time:                ${totalTime.toString().padStart(6)} min                     ║`)
  console.log('╚════════════════════════════════════════════════════════╝')

  console.log('\nBy role:')
  for (const [role, count] of Object.entries(stats.byRole).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${role.padEnd(20)} ${count.toString().padStart(6)}`)
  }

  console.log('\nProduct coverage:')
  console.log(`  With products:        ${stats.withProducts.toString().padStart(6)} (${Math.round(stats.withProducts*100/stats.imported)}%)`)
  console.log(`  Needs research:       ${stats.withoutProducts.toString().padStart(6)} (${Math.round(stats.withoutProducts*100/stats.imported)}%)`)

  console.log('\nTop 10 states:')
  const sortedStates = Object.entries(stats.byState).sort((a, b) => b[1] - a[1])
  for (const [state, count] of sortedStates.slice(0, 10)) {
    console.log(`  ${state}: ${count.toString().padStart(5)}`)
  }

  console.log('\n✨ Import complete!\n')

  await closeDriver()
}

main().catch(error => {
  console.error('Import failed:', error)
  process.exit(1)
})
