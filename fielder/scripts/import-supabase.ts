/**
 * Import Supabase Data into Neo4j
 *
 * One-time import to enrich the Neo4j knowledge graph with Supabase data.
 *
 * Usage:
 *   npm run graph:import-supabase
 */

import { testConnection, closeDriver } from '../src/lib/graph/index'
import { runSupabaseImport } from '../src/lib/graph/import-supabase'

async function main() {
  console.log('')
  console.log('Testing Neo4j connection...')
  const connectionTest = await testConnection()

  if (!connectionTest.connected) {
    console.error('❌ Failed to connect to Neo4j:', connectionTest.error)
    process.exit(1)
  }

  console.log(`✓ Connected to Neo4j ${connectionTest.serverVersion}`)
  console.log('')

  // Run the import
  await runSupabaseImport()

  // Close connection
  await closeDriver()
}

main().catch(error => {
  console.error('Import failed:', error)
  process.exit(1)
})
