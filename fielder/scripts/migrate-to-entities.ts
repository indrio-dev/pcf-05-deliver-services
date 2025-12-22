/**
 * Migrate Farm nodes to Entity model
 *
 * This script:
 * 1. Updates schema with Entity constraints/indexes
 * 2. Migrates existing Farm nodes to Entity:Grower:Retailer
 * 3. Seeds the new multi-role entities
 *
 * Usage:
 *   npm run graph:migrate-entities
 */

import {
  testConnection,
  setupSchema,
  getSchemaStats,
  closeDriver,
  runWriteTransaction,
  runQuery,
} from '../src/lib/graph/index'
import { seedEntities } from '../src/lib/graph/seed-entities'

async function migrateFarmsToEntities(): Promise<void> {
  console.log('\n=== Migrating Farm nodes to Entity model ===\n')

  // Count existing Farm nodes
  const [farmCount] = await runQuery<{ count: number }>(
    'MATCH (f:Farm) RETURN count(f) as count'
  )
  console.log(`  Found ${farmCount?.count || 0} existing Farm nodes`)

  if (farmCount?.count && farmCount.count > 0) {
    // Add Entity:Grower:Retailer labels to all Farm nodes
    // (Most seeded farms were grower + D2C retailer)
    await runWriteTransaction(`
      MATCH (f:Farm)
      SET f:Entity:Grower:Retailer
      SET f.stateCode = COALESCE(f.stateCode, f.state)
      SET f.retailChannels = CASE
        WHEN f.retailChannels IS NULL OR size(f.retailChannels) = 0
        THEN ['d2c']
        ELSE f.retailChannels
      END
    `)
    console.log(`  ✓ Added Entity:Grower:Retailer labels to ${farmCount.count} Farm nodes`)

    // Convert GROWS relationships to proper type
    // (Farm used GROWS, which is correct for Grower role)
    console.log(`  ✓ GROWS relationships preserved (correct for Grower role)`)
  }

  console.log('\n=== Migration complete ===\n')
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗')
  console.log('║     MIGRATE TO MULTI-ROLE ENTITY MODEL                     ║')
  console.log('╚════════════════════════════════════════════════════════════╝')
  console.log('')

  // Test connection
  console.log('Testing Neo4j connection...')
  const connectionTest = await testConnection()

  if (!connectionTest.connected) {
    console.error('❌ Failed to connect to Neo4j:', connectionTest.error)
    process.exit(1)
  }

  console.log(`✓ Connected to Neo4j ${connectionTest.serverVersion}`)
  console.log('')

  // Update schema with new Entity constraints/indexes
  await setupSchema()
  console.log('')

  // Migrate existing Farm nodes
  await migrateFarmsToEntities()

  // Seed new entities (will MERGE, so existing entities get updated)
  await seedEntities()

  // Show final stats
  console.log('Getting schema statistics...')
  const stats = await getSchemaStats()
  console.log('')
  console.log('╔════════════════════════════════════════════════════════════╗')
  console.log('║                 MIGRATION COMPLETE                         ║')
  console.log('╠════════════════════════════════════════════════════════════╣')
  console.log(`║  Node Labels:        ${stats.nodeLabels.length.toString().padStart(4)}                                ║`)
  console.log(`║  Total Nodes:        ${stats.nodeCount.toString().padStart(4)}                                ║`)
  console.log(`║  Total Relationships:${stats.relationshipCount.toString().padStart(4)}                                ║`)
  console.log('╚════════════════════════════════════════════════════════════╝')
  console.log('')
  console.log('New labels added:', ['Entity', 'Grower', 'Packinghouse', 'Distributor', 'Retailer'].join(', '))
  console.log('')

  // Close connection
  await closeDriver()
}

main().catch(error => {
  console.error('Migration failed:', error)
  process.exit(1)
})
