/**
 * Setup Fielder Knowledge Graph
 *
 * Run this script to initialize the Neo4j database with:
 * - Constraints and indexes
 * - Geographic hierarchy (regions, states, USDA zones)
 * - Growing regions
 *
 * Usage:
 *   source .env.local && npx tsx scripts/setup-graph.ts
 */

import {
  testConnection,
  setupSchema,
  getSchemaStats,
  closeDriver,
} from '../src/lib/graph/index'
import { seedGeography } from '../src/lib/graph/seed-geography'
import { seedCrops } from '../src/lib/graph/seed-crops'
import { seedEntities } from '../src/lib/graph/seed-entities'
import { seedInferences } from '../src/lib/graph/seed-inferences'

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗')
  console.log('║         FIELDER KNOWLEDGE GRAPH SETUP                      ║')
  console.log('╚════════════════════════════════════════════════════════════╝')
  console.log('')

  // Test connection
  console.log('Testing Neo4j connection...')
  const connectionTest = await testConnection()

  if (!connectionTest.connected) {
    console.error('❌ Failed to connect to Neo4j:', connectionTest.error)
    console.error('')
    console.error('Check that:')
    console.error('  1. NEO4J_URI is set correctly')
    console.error('  2. NEO4J_USERNAME and NEO4J_PASSWORD are correct')
    console.error('  3. The Neo4j Aura instance is running')
    console.error('')
    console.error('Run with: source .env.local && npx tsx scripts/setup-graph.ts')
    process.exit(1)
  }

  console.log(`✓ Connected to Neo4j ${connectionTest.serverVersion}`)
  console.log(`  Database: ${connectionTest.database}`)
  console.log('')

  // Setup schema
  await setupSchema()
  console.log('')

  // Seed geographic data
  await seedGeography()

  // Seed crop taxonomy
  await seedCrops()

  // Seed supply chain entities (replaces seedFarms)
  await seedEntities()

  // Create inference edges
  await seedInferences()

  // Show final stats
  console.log('Getting schema statistics...')
  const stats = await getSchemaStats()
  console.log('')
  console.log('╔════════════════════════════════════════════════════════════╗')
  console.log('║                    SETUP COMPLETE                          ║')
  console.log('╠════════════════════════════════════════════════════════════╣')
  console.log(`║  Node Labels:        ${stats.nodeLabels.length.toString().padStart(4)}                                ║`)
  console.log(`║  Relationship Types: ${stats.relationshipTypes.length.toString().padStart(4)}                                ║`)
  console.log(`║  Total Nodes:        ${stats.nodeCount.toString().padStart(4)}                                ║`)
  console.log(`║  Total Relationships:${stats.relationshipCount.toString().padStart(4)}                                ║`)
  console.log('╚════════════════════════════════════════════════════════════╝')
  console.log('')
  console.log('Node labels:', stats.nodeLabels.join(', '))
  console.log('Relationship types:', stats.relationshipTypes.join(', '))
  console.log('')

  // Close connection
  await closeDriver()
}

main().catch(error => {
  console.error('Setup failed:', error)
  process.exit(1)
})
