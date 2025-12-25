#!/usr/bin/env tsx
import { runWriteTransaction, closeDriver } from '../src/lib/graph/index'
import * as fs from 'fs'

/**
 * Load BFA measurements - FINAL VERSION with proper property setting
 */

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗')
  console.log('║  LOAD BFA DATASET FINAL (5,378 MEASUREMENTS)           ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  const data = JSON.parse(fs.readFileSync('data/bfa-measurements-clean.json', 'utf-8'))
  console.log(`Loading ${data.length} BFA measurements...\n`)

  let loaded = 0
  const batchSize = 100

  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize)

    // Use simpler SET syntax with explicit property mapping
    await runWriteTransaction(`
      UNWIND $batch as m
      MERGE (measurement:Measurement {id: m.id})
      ON CREATE SET measurement:BFAMeasurement
      SET measurement.source = 'bionutrient_food_association'

      // Only set if not null
      FOREACH (x IN CASE WHEN m.species IS NOT NULL THEN [1] ELSE [] END |
        SET measurement.species = m.species
      )
      FOREACH (x IN CASE WHEN m.variety IS NOT NULL THEN [1] ELSE [] END |
        SET measurement.variety = m.variety
      )
      FOREACH (x IN CASE WHEN m.state IS NOT NULL THEN [1] ELSE [] END |
        SET measurement.state = m.state
      )
      FOREACH (x IN CASE WHEN m.date IS NOT NULL THEN [1] ELSE [] END |
        SET measurement.collectionDate = m.date
      )
      FOREACH (x IN CASE WHEN m.sampleSource IS NOT NULL THEN [1] ELSE [] END |
        SET measurement.sampleSource = m.sampleSource
      )
      FOREACH (x IN CASE WHEN m.practices IS NOT NULL THEN [1] ELSE [] END |
        SET measurement.farmPractices = m.practices
      )
      FOREACH (x IN CASE WHEN m.brix IS NOT NULL THEN [1] ELSE [] END |
        SET measurement.brix = m.brix
      )
      FOREACH (x IN CASE WHEN m.brixPercentile IS NOT NULL THEN [1] ELSE [] END |
        SET measurement.brixPercentile = m.brixPercentile
      )
      FOREACH (x IN CASE WHEN m.soilCa IS NOT NULL THEN [1] ELSE [] END |
        SET measurement.soilCa = m.soilCa
      )
      FOREACH (x IN CASE WHEN m.soilMg IS NOT NULL THEN [1] ELSE [] END |
        SET measurement.soilMg = m.soilMg
      )
      FOREACH (x IN CASE WHEN m.soilP IS NOT NULL THEN [1] ELSE [] END |
        SET measurement.soilP = m.soilP
      )
      FOREACH (x IN CASE WHEN m.soilK IS NOT NULL THEN [1] ELSE [] END |
        SET measurement.soilK = m.soilK
      )
      FOREACH (x IN CASE WHEN m.caMgRatio IS NOT NULL THEN [1] ELSE [] END |
        SET measurement.caMgRatio = m.caMgRatio
      )

      RETURN count(measurement) as created
    `, { batch })

    loaded += batch.length

    if (loaded % 500 === 0) {
      console.log(`  ✓ Loaded ${loaded}...`)
    }
  }

  console.log(`\n✓ Loaded ${loaded} measurements\n`)

  // Stats with proper null checking
  const stats = await runWriteTransaction(`
    MATCH (m:BFAMeasurement)
    WITH count(m) as total,
         count(m.brix) as hasBrixProp
    MATCH (m2:BFAMeasurement)
    WHERE m2.brix IS NOT NULL
    WITH total, hasBrixProp, count(m2) as hasValidBrix
    MATCH (m3:BFAMeasurement)
    WHERE m3.soilCa IS NOT NULL
    RETURN total, hasBrixProp, hasValidBrix, count(m3) as hasSoilCa
  `, {})

  console.log('╔════════════════════════════════════════════════════════╗')
  console.log('║  BFA DATASET LOADED                                    ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  if (stats.length > 0) {
    console.log(`Total nodes: ${stats[0].total}`)
    console.log(`Nodes with brix property: ${stats[0].hasBrixProp}`)
    console.log(`Nodes with brix > 0: ${stats[0].hasValidBrix}`)
    console.log(`Nodes with soil Ca: ${stats[0].hasSoilCa}\n`)
  }

  await closeDriver()
}

main().catch(console.error)
