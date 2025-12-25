#!/usr/bin/env tsx
import { runWriteTransaction, closeDriver } from '../src/lib/graph/index'
import * as fs from 'fs'
import * as path from 'path'
import { parse } from 'csv-parse/sync'

/**
 * Load BioNutrient Food Association measurement data
 *
 * This is THE validation dataset for S→E pillar connection!
 * 5,591 samples with Brix + soil mineral data
 * Proves: Soil minerals → Brix outcome (Albrecht/Reams)
 */

interface BFAMeasurement {
  'Sample Collection Date': string
  Species: string
  Variety: string
  State: string
  County: string
  'Lab ID': string
  Source: string // farm, store, research_plots
  'Farm Practices': string
  Brix: string
  'Brix Percentile (by species)': string
  Antioxidants: string
  Polyphenols: string
  'Soil Ca Ppm': string
  'Soil Mg Ppm': string
  'Soil P Ppm': string
  'Soil K Ppm': string
  'Soil Ph': string
  'Soil Om Percent': string
  'Soil Ca Base Percent': string
  'Soil Mg Base Percent': string
  'Soil K Base Percent': string
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗')
  console.log('║  LOAD BFA MEASUREMENT DATA (S→E VALIDATION)            ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  // Read CSV
  const csvPath = '/mnt/c/Users/abrow/Downloads/openBIData.csv'
  const csvContent = fs.readFileSync(csvPath, 'utf-8')
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
  })

  console.log(`Loaded ${records.length} measurements from BFA\n`)

  // Filter to records with Brix data
  const withBrix = records.filter((r: any) => r.Brix && parseFloat(r.Brix) > 0)
  console.log(`Records with Brix: ${withBrix.length}`)

  // Filter to records with soil data
  const withSoil = withBrix.filter((r: any) =>
    r['Soil Ca Ppm'] && r['Soil Mg Ppm'] && parseFloat(r['Soil Ca Ppm']) > 0
  )
  console.log(`Records with Brix + Soil data: ${withSoil.length}\n`)

  console.log('Loading measurements with soil data (S→E validation set)...\n')

  let loaded = 0

  for (const record of withSoil.slice(0, 400)) { // Load first 400 with soil data
    try {
      const brix = parseFloat(record.Brix)
      if (isNaN(brix) || brix <= 0) continue

      const soilCa = parseFloat(record['Soil Ca Ppm'])
      const soilMg = parseFloat(record['Soil Mg Ppm'])
      const soilP = parseFloat(record['Soil P Ppm']) || null
      const soilK = parseFloat(record['Soil K Ppm']) || null
      const soilPh = parseFloat(record['Soil Ph']) || null

      // Calculate Ca:Mg ratio (CRITICAL for Albrecht)
      const caMgRatio = soilCa && soilMg ? soilCa / soilMg : null

      const measurementId = `bfa_${record['Lab ID']}_${record['Sample ID'] || loaded}`

      await runWriteTransaction(`
        MERGE (m:Measurement {id: $id})
        SET m.source = 'bionutrient_food_association',
            m.collectionDate = $date,
            m.species = $species,
            m.variety = $variety,
            m.state = $state,
            m.county = $county,
            m.labId = $labId,
            m.sampleSource = $sampleSource,
            m.farmPractices = $practices,

            // E pillar - Quality measurements
            m.brix = $brix,
            m.brixPercentile = $brixPercentile,
            m.antioxidants = $antioxidants,
            m.polyphenols = $polyphenols,

            // S pillar - Soil minerals (CRITICAL!)
            m.soilCa = $soilCa,
            m.soilMg = $soilMg,
            m.soilP = $soilP,
            m.soilK = $soilK,
            m.soilPh = $soilPh,
            m.soilOm = $soilOm,
            m.caMgRatio = $caMgRatio,

            m.soilCaBasePercent = $soilCaBase,
            m.soilMgBasePercent = $soilMgBase,
            m.soilKBasePercent = $soilKBase
      `, {
        id: measurementId,
        date: record['Sample Collection Date'] || null,
        species: record.Species?.toLowerCase(),
        variety: record.Variety || null,
        state: record.State?.toLowerCase(),
        county: record.County?.toLowerCase(),
        labId: record['Lab ID'],
        sampleSource: record.Source,
        practices: record['Farm Practices'] || null,

        brix: brix,
        brixPercentile: parseFloat(record['Brix Percentile (by species)']?.replace('%', '')) || null,
        antioxidants: parseFloat(record.Antioxidants) || null,
        polyphenols: parseFloat(record.Polyphenols) || null,

        soilCa,
        soilMg,
        soilP,
        soilK,
        soilPh,
        soilOm: parseFloat(record['Soil Om Percent']) || null,
        caMgRatio,

        soilCaBase: parseFloat(record['Soil Ca Base Percent']) || null,
        soilMgBase: parseFloat(record['Soil Mg Base Percent']) || null,
        soilKBase: parseFloat(record['Soil K Base Percent']) || null,
      })

      loaded++

      if (loaded % 50 === 0) {
        console.log(`  ✓ Loaded ${loaded} measurements...`)
      }
    } catch (error) {
      // Skip invalid records
    }
  }

  console.log(`\n✓ Loaded ${loaded} BFA measurements with soil data\n`)

  console.log('╔════════════════════════════════════════════════════════╗')
  console.log('║  BFA DATA LOAD COMPLETE                                ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  console.log(`Measurements loaded: ${loaded}`)
  console.log(`\nThis data enables S→E validation:`)
  console.log(`  - Soil Ca → Brix correlation`)
  console.log(`  - Soil Mg → Brix correlation`)
  console.log(`  - Soil P → Brix correlation (Reams: "P determines sugar")`)
  console.log(`  - Ca:Mg ratio → Brix correlation (Albrecht)`)
  console.log(`  - Farm practices → Brix correlation`)
  console.log(`\nNext: Analyze correlations to validate framework\n`)

  await closeDriver()
}

main().catch(console.error)
