#!/usr/bin/env tsx
/**
 * Parse Packinghouse Agent Outputs
 *
 * Reads agent outputs from /tmp/claude/-home-alex/tasks/
 * and generates TypeScript code to add to seed-entities.ts
 *
 * Usage:
 *   source .env.local && npx tsx scripts/ingest-packinghouses.ts
 */

import fs from 'fs'
import path from 'path'

// =============================================================================
// TYPES
// =============================================================================

interface PackinghouseRecord {
  name: string
  state: string
  city?: string
  region?: string
  products: string[]
  website?: string
  phone?: string
  notes?: string
  address?: string
  source?: string
}

// =============================================================================
// EXTRACT DATA FROM AGENT OUTPUTS
// =============================================================================

function extractJsonFromOutput(outputPath: string): PackinghouseRecord[] {
  const content = fs.readFileSync(outputPath, 'utf-8')

  // Look for JSON arrays in the output
  const jsonArrayRegex = /\[\s*\{[\s\S]*?\}\s*\]/g
  const matches = content.match(jsonArrayRegex)

  if (!matches) {
    console.log(`❌ No JSON found in ${path.basename(outputPath)}`)
    return []
  }

  const allRecords: PackinghouseRecord[] = []

  for (const match of matches) {
    try {
      const parsed = JSON.parse(match)
      if (Array.isArray(parsed)) {
        allRecords.push(...parsed)
      }
    } catch (e) {
      // Skip invalid JSON
      continue
    }
  }

  return allRecords
}

function collectAllOutputs(taskDir: string): PackinghouseRecord[] {
  const files = fs.readdirSync(taskDir).filter(f => f.endsWith('.output'))

  console.log(`📂 Found ${files.length} agent output files`)

  const allRecords: PackinghouseRecord[] = []
  let successCount = 0

  for (const file of files) {
    const records = extractJsonFromOutput(path.join(taskDir, file))
    if (records.length > 0) {
      successCount++
      allRecords.push(...records)
      console.log(`  ✅ ${path.basename(file)}: ${records.length} records`)
    }
  }

  console.log(`\n📊 Total: ${allRecords.length} records from ${successCount}/${files.length} agents\n`)

  return allRecords
}

// =============================================================================
// NEO4J INGESTION
// =============================================================================

async function createStateIfNotExists(driver: any, stateCode: string): Promise<void> {
  const session = driver.session()
  try {
    await session.run(
      `
      MERGE (s:State {code: $code})
      ON CREATE SET s.name = $code
      `,
      { code: stateCode }
    )
  } finally {
    await session.close()
  }
}

async function createCityIfNotExists(driver: any, city: string, stateCode: string): Promise<void> {
  if (!city) return

  const session = driver.session()
  try {
    await session.run(
      `
      MATCH (s:State {code: $state})
      MERGE (c:City {name: $city, state: $state})
      MERGE (s)-[:CONTAINS_CITY]->(c)
      `,
      { city, state: stateCode }
    )
  } finally {
    await session.close()
  }
}

async function createPackinghouse(driver: any, record: PackinghouseRecord): Promise<void> {
  const session = driver.session()
  try {
    // Create the packinghouse node
    const query = `
      MERGE (f:Farm:Packinghouse {name: $name, state: $state})
      ON CREATE SET
        f.city = $city,
        f.region = $region,
        f.products = $products,
        f.website = $website,
        f.phone = $phone,
        f.notes = $notes,
        f.address = $address,
        f.source = $source,
        f.dataSource = 'agent_swarm_2025_12_21',
        f.createdAt = datetime()
      ON MATCH SET
        f.updatedAt = datetime()

      WITH f
      MATCH (s:State {code: $state})
      MERGE (f)-[:LOCATED_IN_STATE]->(s)

      ${record.city ? `
        WITH f
        MATCH (c:City {name: $city, state: $state})
        MERGE (f)-[:LOCATED_IN_CITY]->(c)
      ` : ''}

      RETURN f
    `

    await session.run(query, {
      name: record.name,
      state: record.state,
      city: record.city || null,
      region: record.region || null,
      products: record.products || [],
      website: record.website || null,
      phone: record.phone || null,
      notes: record.notes || null,
      address: record.address || null,
      source: record.source || 'agent_swarm'
    })
  } finally {
    await session.close()
  }
}

async function ingestRecords(records: PackinghouseRecord[]): Promise<void> {
  console.log('🔗 Connecting to Neo4j...')
  const driver = getDriver()

  console.log('🏗️  Creating geographic hierarchy...')

  // Get unique states
  const states = [...new Set(records.map(r => r.state).filter(Boolean))]
  for (const state of states) {
    await createStateIfNotExists(driver, state)
  }

  // Get unique cities
  const cities = [...new Set(records.filter(r => r.city && r.state).map(r => ({ city: r.city!, state: r.state })))]
  for (const { city, state } of cities) {
    await createCityIfNotExists(driver, city, state)
  }

  console.log(`📍 Created ${states.length} states, ${cities.length} cities\n`)

  console.log('🏭 Ingesting packinghouses...')
  let count = 0
  for (const record of records) {
    try {
      await createPackinghouse(driver, record)
      count++
      if (count % 10 === 0) {
        console.log(`  Ingested ${count}/${records.length}...`)
      }
    } catch (error) {
      console.error(`❌ Error ingesting ${record.name}:`, error)
    }
  }

  console.log(`\n✅ Successfully ingested ${count}/${records.length} packinghouses\n`)

  await closeDriver()
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  console.log('🚀 Packinghouse Data Ingestion\n')

  const taskDir = '/tmp/claude/-home-alex/tasks'

  if (!fs.existsSync(taskDir)) {
    console.error(`❌ Task directory not found: ${taskDir}`)
    process.exit(1)
  }

  // Collect all data
  const records = collectAllOutputs(taskDir)

  if (records.length === 0) {
    console.error('❌ No records found in agent outputs')
    process.exit(1)
  }

  // Deduplicate by name + state
  const seen = new Set<string>()
  const unique = records.filter(r => {
    const key = `${r.name}|${r.state}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  console.log(`📊 Deduplicated: ${records.length} → ${unique.length} unique records\n`)

  // Ingest into Neo4j
  await ingestRecords(unique)

  console.log('✨ Done!\n')
}

main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
