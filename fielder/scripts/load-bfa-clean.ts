#!/usr/bin/env tsx
import { runWriteTransaction, closeDriver } from '../src/lib/graph/index'
import * as fs from 'fs'

/**
 * Load BFA measurements - CLEAN version with MERGE
 */

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗')
  console.log('║  LOAD BFA DATASET (CLEAN MERGE)                        ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  const data = JSON.parse(fs.readFileSync('data/bfa-measurements-full.json', 'utf-8'))
  console.log(`Loading ${data.length} BFA measurements...\n`)

  let loaded = 0
  const batchSize = 100

  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize)

    await runWriteTransaction(`
      UNWIND $batch as m
      MERGE (measurement:Measurement {id: m.id})
      ON CREATE SET
        measurement.source = 'bionutrient_food_association',
        measurement:BFAMeasurement
      SET measurement.species = m.species,
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
      RETURN count(measurement) as created
    `, { batch })

    loaded += batch.length

    if (loaded % 500 === 0) {
      console.log(`  ✓ Loaded ${loaded}...`)
    }
  }

  console.log(`\n✓ Loaded ${loaded} measurements\n`)

  // Stats
  const stats = await runWriteTransaction(`
    MATCH (m:BFAMeasurement)
    RETURN count(m) as total,
           sum(CASE WHEN m.brix IS NOT NULL THEN 1 ELSE 0 END) as withBrix,
           sum(CASE WHEN m.soilCa IS NOT NULL THEN 1 ELSE 0 END) as withSoil,
           sum(CASE WHEN m.caMgRatio IS NOT NULL THEN 1 ELSE 0 END) as withRatio
  `, {})

  console.log('╔════════════════════════════════════════════════════════╗')
  console.log('║  BFA DATASET LOADED                                    ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  if (stats.length > 0) {
    console.log(`Total: ${stats[0].total}`)
    console.log(`With Brix: ${stats[0].withBrix}`)
    console.log(`With soil: ${stats[0].withSoil}`)
    console.log(`With Ca:Mg ratio: ${stats[0].withRatio}\n`)
  }

  await closeDriver()
}

main().catch(console.error)
