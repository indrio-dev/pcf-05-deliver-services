#!/usr/bin/env tsx
import { runWriteTransaction, closeDriver } from '../src/lib/graph/index'
import * as fs from 'fs'

/**
 * Load BFA measurements from pre-processed JSON
 * (Batch 1: First 1000 measurements)
 */

interface BFARecord {
  id: string
  species: string | null
  variety: string | null
  state: string | null
  county: string | null
  date: string | null
  source: string | null
  practices: string | null
  brix: number | null
  brixPercentile: number | null
  soilCa: number | null
  soilMg: number | null
  soilP: number | null
  soilK: number | null
  caMgRatio: number | null
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗')
  console.log('║  LOAD FULL BFA DATASET (5,378 MEASUREMENTS)            ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  const data: BFARecord[] = JSON.parse(
    fs.readFileSync('data/bfa-measurements-full.json', 'utf-8')
  )

  console.log(`Loading ${data.length} BFA measurements...\n`)

  let loaded = 0

  // Batch load for performance
  const batchSize = 50
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize)

    await runWriteTransaction(`
      UNWIND $batch as m
      MERGE (measurement:Measurement:BFAMeasurement {id: m.id})
      SET measurement.source = 'bionutrient_food_association',
          measurement.species = m.species,
          measurement.variety = m.variety,
          measurement.state = m.state,
          measurement.county = m.county,
          measurement.collectionDate = m.date,
          measurement.sampleSource = m.sampleSource,
          measurement.farmPractices = m.practices,
          measurement.brix = m.brix,
          measurement.brixPercentile = m.brixPercentile,
          measurement.soilCa = m.soilCa,
          measurement.soilMg = m.soilMg,
          measurement.soilP = m.soilP,
          measurement.soilK = m.soilK,
          measurement.caMgRatio = m.caMgRatio

      WITH measurement
      WHERE measurement.species IS NOT NULL

      // Try to link to cultivar by species (loose matching)
      OPTIONAL MATCH (c:Cultivar)
      WHERE toLower(c.name) CONTAINS measurement.species
         OR toLower(c.displayName) CONTAINS measurement.species
         OR c.productId = measurement.species
      WITH measurement, c
      LIMIT 1
      FOREACH (cultivar IN CASE WHEN c IS NOT NULL THEN [c] ELSE [] END |
        CREATE (measurement)-[:MEASURED_FROM]->(cultivar)
      )

      RETURN count(measurement) as created
    `, { batch })

    loaded += batch.length

    if (loaded % 200 === 0) {
      console.log(`  ✓ Loaded ${loaded} measurements...`)
    }
  }

  console.log(`\n✓ Loaded ${loaded} BFA measurements\n`)

  // Verification
  const stats = await runWriteTransaction(`
    MATCH (m:BFAMeasurement)
    RETURN count(m) as total,
           sum(CASE WHEN m.brix IS NOT NULL THEN 1 ELSE 0 END) as withBrix,
           sum(CASE WHEN m.soilCa IS NOT NULL THEN 1 ELSE 0 END) as withSoilData,
           sum(CASE WHEN m.caMgRatio IS NOT NULL THEN 1 ELSE 0 END) as withRatio
  `, {})

  console.log('╔════════════════════════════════════════════════════════╗')
  console.log('║  BFA MEASUREMENTS LOADED                               ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  if (stats.length > 0) {
    const s = stats[0]
    console.log(`Total measurements: ${s.total}`)
    console.log(`With Brix: ${s.withBrix}`)
    console.log(`With soil data: ${s.withSoilData}`)
    console.log(`With Ca:Mg ratio: ${s.withRatio}`)
  }

  console.log('\nEnables:')
  console.log('  ✓ S→E analysis (soil minerals → Brix correlation)')
  console.log('  ✓ A→E analysis (practices → Brix)')
  console.log('  ✓ SHARE prediction validation')
  console.log('  ✓ Proof that H×R context needed')
  console.log()

  await closeDriver()
}

main().catch(console.error)
