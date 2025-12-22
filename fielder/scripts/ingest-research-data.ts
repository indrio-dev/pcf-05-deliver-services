#!/usr/bin/env tsx
/**
 * Ingest Packinghouse Research Data
 *
 * Reads the JSON files collected from agent research and
 * loads them into the Neo4j knowledge graph.
 *
 * Usage:
 *   source .env.local && npx tsx scripts/ingest-research-data.ts
 */

import fs from 'fs'
import path from 'path'
import { runWriteTransaction, closeDriver } from '../src/lib/graph/index'

// =============================================================================
// TYPES
// =============================================================================

interface PackinghouseData {
  name: string
  state: string
  city?: string
  region?: string
  products?: string[]
  website?: string
  phone?: string
  notes?: string
  association?: string
  address?: string
}

// =============================================================================
// DATA LOADING
// =============================================================================

function loadJsonFiles(projectRoot: string): PackinghouseData[] {
  const files = [
    'packinghouse_research_results.json',
    'us_produce_packinghouses.json',
    'southeast_farms_research.json',
    'california_central_valley_packinghouses.json',
    'alabama_packinghouses.json',
    'arkansas_packinghouses.json',
    'kentucky_packinghouses.json',
    'minnesota_packinghouses.json',
    'montana_packinghouses.json',
    'new_jersey_packinghouses.json',
  ]

  const allData: PackinghouseData[] = []

  for (const file of files) {
    const filePath = path.join(projectRoot, file)
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${file}`)
      continue
    }

    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      const parsed = JSON.parse(content)
      const records = Array.isArray(parsed) ? parsed : [parsed]
      allData.push(...records)
      console.log(`✓ Loaded ${records.length} from ${file}`)
    } catch (error) {
      console.error(`❌ Error loading ${file}:`, error)
    }
  }

  return allData
}

// =============================================================================
// NEO4J INGESTION
// =============================================================================

async function ingestPackinghouse(data: PackinghouseData): Promise<void> {
  const query = `
    // Create or merge the State node
    MERGE (s:State {code: $state})
    ON CREATE SET s.name = $state

    // Create the Packinghouse entity
    MERGE (e:Entity:Packinghouse {name: $name, state: $state})
    ON CREATE SET
      e.id = toLower(replace(replace($name, ' ', '_'), '.', '')),
      e.city = $city,
      e.region = $region,
      e.website = $website,
      e.phone = $phone,
      e.notes = $notes,
      e.association = $association,
      e.address = $address,
      e.products = $products,
      e.dataSource = 'agent_research_2025_12_21',
      e.createdAt = datetime()
    ON MATCH SET
      e.updatedAt = datetime()

    // Link to State
    MERGE (e)-[:LOCATED_IN_STATE]->(s)

    // Create City if provided
    WITH e, s
    WHERE $city IS NOT NULL
    MERGE (c:City {name: $city, state: $state})
    MERGE (s)-[:CONTAINS_CITY]->(c)
    MERGE (e)-[:LOCATED_IN_CITY]->(c)

    RETURN e
  `

  await runWriteTransaction(async (tx: any) => {
    await tx.run(query, {
      name: data.name,
      state: data.state,
      city: data.city || null,
      region: data.region || null,
      website: data.website || null,
      phone: data.phone || null,
      notes: data.notes || null,
      association: data.association || null,
      address: data.address || null,
      products: data.products || [],
    })
  })
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  console.log('═══════════════════════════════════════════════')
  console.log('  INGEST PACKINGHOUSE RESEARCH DATA')
  console.log('═══════════════════════════════════════════════')
  console.log('')

  const projectRoot = path.join(__dirname, '..')

  // Load data
  console.log('📂 Loading JSON files...')
  const data = loadJsonFiles(projectRoot)
  console.log(`\n📊 Loaded ${data.length} total records\n`)

  // Deduplicate by name + state
  const seen = new Set<string>()
  const unique = data.filter(record => {
    const key = `${record.name}|${record.state}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  console.log(`🔍 Deduplicated: ${data.length} → ${unique.length} unique records\n`)

  // Ingest into Neo4j
  console.log('🔗 Ingesting into Neo4j...')

  let success = 0
  let failed = 0

  for (const record of unique) {
    try {
      await ingestPackinghouse(record)
      success++
      if (success % 10 === 0) {
        console.log(`  Ingested ${success}/${unique.length}...`)
      }
    } catch (error) {
      console.error(`❌ Failed to ingest ${record.name}:`, error)
      failed++
    }
  }

  console.log('')
  console.log('═══════════════════════════════════════════════')
  console.log(`✅ Successfully ingested: ${success}`)
  console.log(`❌ Failed: ${failed}`)
  console.log('═══════════════════════════════════════════════')
  console.log('')

  await closeDriver()
}

main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
