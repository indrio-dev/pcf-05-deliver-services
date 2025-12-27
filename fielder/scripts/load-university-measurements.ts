#!/usr/bin/env tsx

/**
 * Load University Trial Measurements to Neo4j
 *
 * Loads 69 validated measurements from:
 * - strawberry-measurements-validated.json (5)
 * - university_citrus_variety_brix_data.json (38)
 * - apple-measurements-validated.json (26)
 *
 * All measurements validated for: Location + Time + Brix
 */

import { runWriteTransaction, closeDriver } from '../src/lib/graph/index'
import * as fs from 'fs'
import * as path from 'path'

interface Measurement {
  cultivar_id: string
  cultivar_name?: string
  location: string
  county?: string | null
  state: string
  harvest_date?: string
  harvest_year?: number
  harvest_month?: number
  harvest_season?: string
  harvest_period?: string
  brix: number
  brix_range?: string | number[]
  brix_se?: number
  acid?: number | null
  ph?: number
  firmness?: number
  starch_index?: number
  color_percent?: number
  fruit_weight_g?: number
  source: string
  url?: string
  notes?: string
  measurement_type?: string
}

async function loadMeasurements(measurements: Measurement[], dataSource: string) {
  console.log(`Loading ${measurements.length} measurements from ${dataSource}...`)

  let loaded = 0
  let skipped = 0
  let errors = 0

  for (const m of measurements) {
    try {
      // Generate unique ID for measurement
      const measurementId = `${m.cultivar_id}_${m.state}_${m.harvest_date || m.harvest_year || 'unknown'}_${m.brix}`.replace(/[^a-z0-9_]/gi, '_')

      // Parse harvest date if needed
      let harvestDate = m.harvest_date
      if (!harvestDate && m.harvest_year && m.harvest_month) {
        harvestDate = `${m.harvest_year}-${String(m.harvest_month).padStart(2, '0')}-15`
      }

      // Parse brix range
      let brixMin = null
      let brixMax = null
      if (m.brix_range) {
        if (Array.isArray(m.brix_range)) {
          brixMin = m.brix_range[0]
          brixMax = m.brix_range[1]
        } else if (typeof m.brix_range === 'string') {
          const parts = m.brix_range.split('-')
          if (parts.length === 2) {
            brixMin = parseFloat(parts[0])
            brixMax = parseFloat(parts[1])
          }
        }
      }

      await runWriteTransaction(`
        // Create Measurement node
        MERGE (m:Measurement {id: $id})
        SET m.cultivarId = $cultivarId,
            m.location = $location,
            m.county = $county,
            m.state = $state,
            m.harvestDate = $harvestDate,
            m.harvestYear = $harvestYear,
            m.harvestMonth = $harvestMonth,
            m.harvestSeason = $harvestSeason,
            m.harvestPeriod = $harvestPeriod,
            m.brix = $brix,
            m.brixMin = $brixMin,
            m.brixMax = $brixMax,
            m.brixSE = $brixSE,
            m.acid = $acid,
            m.ph = $ph,
            m.firmness = $firmness,
            m.starchIndex = $starchIndex,
            m.colorPercent = $colorPercent,
            m.fruitWeightG = $fruitWeightG,
            m.source = $source,
            m.sourceUrl = $sourceUrl,
            m.notes = $notes,
            m.measurementType = $measurementType,
            m.dataSource = $dataSource

        // Link to Cultivar
        WITH m
        MATCH (c:Cultivar)
        WHERE c.id = $cultivarId OR c.id = $cultivarIdAlt
        MERGE (m)-[:MEASURED_ON]->(c)

        RETURN m.id as measurementId
      `, {
        id: measurementId,
        cultivarId: m.cultivar_id,
        cultivarIdAlt: m.cultivar_id.replace('_strawberry', '').replace('_blueberry', ''), // Handle variations
        location: m.location,
        county: m.county || null,
        state: m.state,
        harvestDate: harvestDate || null,
        harvestYear: m.harvest_year || null,
        harvestMonth: m.harvest_month || null,
        harvestSeason: m.harvest_season || null,
        harvestPeriod: m.harvest_period || null,
        brix: m.brix,
        brixMin: brixMin,
        brixMax: brixMax,
        brixSE: m.brix_se || null,
        acid: m.acid || null,
        ph: m.ph || null,
        firmness: m.firmness || null,
        starchIndex: m.starch_index || null,
        colorPercent: m.color_percent || null,
        fruitWeightG: m.fruit_weight_g || null,
        source: m.source,
        sourceUrl: m.url || null,
        notes: m.notes || null,
        measurementType: m.measurement_type || 'university_trial',
        dataSource: dataSource
      })

      loaded++
      if (loaded % 10 === 0) {
        console.log(`  ✓ Loaded ${loaded}/${measurements.length}...`)
      }
    } catch (error: any) {
      if (error.code === 'Neo.ClientError.Schema.ConstraintValidationFailed') {
        skipped++
      } else {
        console.error(`  ❌ Error loading measurement:`, error.message)
        errors++
      }
    }
  }

  console.log(`  Completed: ${loaded} loaded, ${skipped} skipped, ${errors} errors`)
  return { loaded, skipped, errors }
}

async function main() {
  console.log('='.repeat(80))
  console.log('LOAD UNIVERSITY TRIAL MEASUREMENTS TO NEO4J')
  console.log('='.repeat(80))
  console.log()

  const dataDir = path.join(process.cwd(), 'data', 'research')

  // Load strawberry measurements
  const strawberryFile = path.join(dataDir, 'strawberry-measurements-validated.json')
  const strawberryData = JSON.parse(fs.readFileSync(strawberryFile, 'utf-8'))
  console.log('📊 STRAWBERRIES')
  console.log('-'.repeat(80))
  const strawberryResults = await loadMeasurements(strawberryData.measurements, 'strawberry_validated')
  console.log()

  // Load citrus measurements
  const citrusFile = path.join(dataDir, 'university_citrus_variety_brix_data.json')
  const citrusData = JSON.parse(fs.readFileSync(citrusFile, 'utf-8'))
  console.log('🍊 CITRUS')
  console.log('-'.repeat(80))
  const citrusResults = await loadMeasurements(citrusData, 'citrus_uc_riverside')
  console.log()

  // Load apple measurements
  const appleFile = path.join(dataDir, 'apple-measurements-validated.json')
  const appleData = JSON.parse(fs.readFileSync(appleFile, 'utf-8'))
  console.log('🍎 APPLES')
  console.log('-'.repeat(80))
  const appleResults = await loadMeasurements(appleData.measurements, 'apple_msu_wsu')
  console.log()

  // Summary
  const totalLoaded = strawberryResults.loaded + citrusResults.loaded + appleResults.loaded
  const totalSkipped = strawberryResults.skipped + citrusResults.skipped + appleResults.skipped
  const totalErrors = strawberryResults.errors + citrusResults.errors + appleResults.errors

  console.log('='.repeat(80))
  console.log('LOADING COMPLETE')
  console.log('='.repeat(80))
  console.log()
  console.log(`✅ Total loaded: ${totalLoaded}`)
  console.log(`⚠️  Total skipped: ${totalSkipped}`)
  console.log(`❌ Total errors: ${totalErrors}`)
  console.log()

  // Verify linkage
  console.log('Verifying cultivar linkage...')
  console.log()

  const linkage = await runWriteTransaction<{
    cultivarName: string
    measurementCount: number
  }>(`
    MATCH (m:Measurement)-[:MEASURED_ON]->(c:Cultivar)
    WHERE m.dataSource IN ['strawberry_validated', 'citrus_uc_riverside', 'apple_msu_wsu']
    RETURN c.displayName as cultivarName, count(m) as measurementCount
    ORDER BY measurementCount DESC, cultivarName
  `)

  console.log('Cultivars with university trial measurements:')
  console.log('-'.repeat(80))
  linkage.forEach(l => {
    console.log(`  ${l.cultivarName}: ${l.measurementCount} measurements`)
  })

  console.log()
  console.log(`Total cultivars with university data: ${linkage.length}`)
  console.log()

  await closeDriver()
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
