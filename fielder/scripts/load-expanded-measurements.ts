#!/usr/bin/env tsx

/**
 * Load Expanded Measurement Dataset
 *
 * Loads measurements for additional product categories beyond
 * the initial strawberry/citrus/apple dataset
 *
 * Expects JSON files in data/research/:
 * - peach-measurements-validated.json
 * - blueberry-measurements-validated.json
 * - grapefruit-measurements-validated.json
 * - cherry-measurements-validated.json (future)
 * - raspberry-measurements-validated.json (future)
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
  fruit_weight_g?: number
  source: string
  url?: string
  notes?: string
  measurement_type?: string
}

async function loadMeasurementFile(filename: string, dataSource: string) {
  const filePath = path.join(process.cwd(), 'data', 'research', filename)

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filename}`)
    return { loaded: 0, skipped: 0, errors: 0 }
  }

  const fileData = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  const measurements = fileData.measurements || fileData

  console.log(`Loading ${measurements.length} measurements from ${filename}...`)

  let loaded = 0
  let skipped = 0
  let errors = 0

  for (const m of measurements) {
    try {
      const measurementId = `${m.cultivar_id}_${m.state}_${m.harvest_date || m.harvest_year || 'unknown'}_${m.brix}`.replace(/[^a-z0-9_]/gi, '_')

      let harvestDate = m.harvest_date
      if (!harvestDate && m.harvest_year && m.harvest_month) {
        harvestDate = `${m.harvest_year}-${String(m.harvest_month).padStart(2, '0')}-15`
      }

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
            m.fruitWeightG = $fruitWeightG,
            m.source = $source,
            m.sourceUrl = $sourceUrl,
            m.notes = $notes,
            m.measurementType = $measurementType,
            m.dataSource = $dataSource

        WITH m
        MATCH (c:Cultivar)
        WHERE c.id = $cultivarId OR c.id = $cultivarIdAlt
        MERGE (m)-[:MEASURED_ON]->(c)

        RETURN m.id as measurementId
      `, {
        id: measurementId,
        cultivarId: m.cultivar_id,
        cultivarIdAlt: m.cultivar_id.replace(/_peach|_blueberry|_grapefruit|_cherry/g, ''),
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
        console.error(`  ❌ Error:`, error.message)
        errors++
      }
    }
  }

  console.log(`  Completed: ${loaded} loaded, ${skipped} skipped, ${errors} errors`)
  return { loaded, skipped, errors }
}

async function main() {
  console.log('='.repeat(80))
  console.log('LOAD EXPANDED MEASUREMENT DATASET')
  console.log('='.repeat(80))
  console.log()

  const filesToLoad = [
    { filename: 'peach-measurements-validated.json', dataSource: 'peach_uga_msu' },
    { filename: 'blueberry-measurements-validated.json', dataSource: 'blueberry_uf_usda' },
    { filename: 'grapefruit-measurements-validated.json', dataSource: 'grapefruit_tamu' },
    { filename: 'cherry-measurements-validated.json', dataSource: 'cherry_wsu' },
    { filename: 'raspberry-measurements-validated.json', dataSource: 'raspberry_wsu' },
  ]

  let totalLoaded = 0
  let totalSkipped = 0
  let totalErrors = 0

  for (const file of filesToLoad) {
    const result = await loadMeasurementFile(file.filename, file.dataSource)
    totalLoaded += result.loaded
    totalSkipped += result.skipped
    totalErrors += result.errors
    console.log()
  }

  console.log('='.repeat(80))
  console.log('LOADING SUMMARY')
  console.log('='.repeat(80))
  console.log()
  console.log(`✅ Total loaded: ${totalLoaded}`)
  console.log(`⚠️  Total skipped: ${totalSkipped}`)
  console.log(`❌ Total errors: ${totalErrors}`)
  console.log()

  // Verify total university measurements
  const totalUniversity = await runWriteTransaction<{ count: number }>(`
    MATCH (m:Measurement)
    WHERE m.dataSource IN ['strawberry_validated', 'citrus_uc_riverside', 'apple_msu_wsu',
                           'peach_uga_msu', 'blueberry_uf_usda', 'grapefruit_tamu',
                           'cherry_wsu', 'raspberry_wsu']
    RETURN count(m) as count
  `)

  console.log(`Total university measurements in database: ${totalUniversity[0].count}`)
  console.log()

  await closeDriver()
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
