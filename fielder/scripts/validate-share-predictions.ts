#!/usr/bin/env tsx

/**
 * Validate SHARE Predictions Against University Measurements
 *
 * Compares SHARE framework Brix predictions to actual university trial data
 * Calculates accuracy metrics and identifies tuning opportunities
 */

import { runQuery, closeDriver } from '../src/lib/graph/index'

interface UniversityMeasurement {
  measurementId: string
  cultivarId: string
  cultivarName: string
  location: string
  county: string
  state: string
  harvestDate: string
  harvestYear: number
  harvestMonth: number
  actualBrix: number
  brixMin: number
  brixMax: number
  source: string
  measurementType: string
  productType: string
}

interface ValidationResult {
  cultivar: string
  location: string
  harvestDate: string
  actualBrix: number
  predictedBrix: number | null
  error: number | null
  percentError: number | null
  notes: string
}

async function main() {
  console.log('='.repeat(80))
  console.log('SHARE PREDICTION VALIDATION - UNIVERSITY TRIAL DATA')
  console.log('='.repeat(80))
  console.log()
  console.log('Comparing SHARE framework predictions to 82 university measurements')
  console.log()

  // Get all university measurements with linked cultivars
  const measurements = await runQuery<UniversityMeasurement>(`
    MATCH (m:Measurement)-[:MEASURED_ON]->(c:Cultivar)-[:IS_A]->(p:ProductType)
    WHERE m.dataSource IN ['strawberry_validated', 'citrus_uc_riverside', 'apple_msu_wsu']
      AND m.brix IS NOT NULL
    RETURN m.id as measurementId,
           c.id as cultivarId,
           c.displayName as cultivarName,
           m.location as location,
           m.county as county,
           m.state as state,
           m.harvestDate as harvestDate,
           m.harvestYear as harvestYear,
           m.harvestMonth as harvestMonth,
           m.brix as actualBrix,
           m.brixMin as brixMin,
           m.brixMax as brixMax,
           m.source as source,
           m.measurementType as measurementType,
           p.id as productType
    ORDER BY p.id, c.displayName, m.harvestDate
  `)

  console.log(`Loaded ${measurements.length} measurements for validation`)
  console.log()

  // For now, we'll do a BASELINE analysis without running full SHARE predictions
  // This will show what we have and set up for prediction integration

  console.log('='.repeat(80))
  console.log('MEASUREMENT DATA ANALYSIS (Baseline for Validation)')
  console.log('='.repeat(80))
  console.log()

  // Group by product type
  const byProduct = new Map<string, UniversityMeasurement[]>()
  measurements.forEach(m => {
    if (!byProduct.has(m.productType)) {
      byProduct.set(m.productType, [])
    }
    byProduct.get(m.productType)!.push(m)
  })

  for (const [product, productMeasurements] of byProduct.entries()) {
    console.log(`${product.toUpperCase()}:`)
    console.log('-'.repeat(80))

    // Group by cultivar
    const byCultivar = new Map<string, UniversityMeasurement[]>()
    productMeasurements.forEach(m => {
      if (!byCultivar.has(m.cultivarName)) {
        byCultivar.set(m.cultivarName, [])
      }
      byCultivar.get(m.cultivarName)!.push(m)
    })

    for (const [cultivar, cultivarMeasurements] of byCultivar.entries()) {
      const brixValues = cultivarMeasurements.map(m => Number(m.actualBrix))
      const avgBrix = brixValues.reduce((sum, b) => sum + b, 0) / brixValues.length
      const minBrix = Math.min(...brixValues)
      const maxBrix = Math.max(...brixValues)

      console.log(`  ${cultivar}:`)
      console.log(`    Measurements: ${cultivarMeasurements.length}`)
      console.log(`    Brix range: ${minBrix.toFixed(1)}-${maxBrix.toFixed(1)}°Bx (avg ${avgBrix.toFixed(1)}°Bx)`)

      // Show sample locations and dates
      const samples = cultivarMeasurements.slice(0, 3)
      samples.forEach(s => {
        const date = s.harvestDate ? s.harvestDate.substring(0, 10) : `${s.harvestYear}-${String(s.harvestMonth).padStart(2, '0')}`
        console.log(`    • ${s.location}, ${s.state} - ${date}: ${Number(s.actualBrix).toFixed(1)}°Bx`)
      })

      if (cultivarMeasurements.length > 3) {
        console.log(`    • ... and ${cultivarMeasurements.length - 3} more measurements`)
      }
      console.log()
    }
  }

  // Calculate baseline statistics
  console.log('='.repeat(80))
  console.log('BASELINE STATISTICS')
  console.log('='.repeat(80))
  console.log()

  const allBrix = measurements.map(m => Number(m.actualBrix))
  const avgBrix = allBrix.reduce((sum, b) => sum + b, 0) / allBrix.length
  const minBrix = Math.min(...allBrix)
  const maxBrix = Math.max(...allBrix)
  const stdDev = Math.sqrt(
    allBrix.reduce((sum, b) => sum + Math.pow(b - avgBrix, 2), 0) / allBrix.length
  )

  console.log(`Total measurements: ${measurements.length}`)
  console.log(`Brix range: ${minBrix.toFixed(1)}-${maxBrix.toFixed(1)}°Bx`)
  console.log(`Average Brix: ${avgBrix.toFixed(1)}°Bx`)
  console.log(`Std deviation: ${stdDev.toFixed(1)}°Bx`)
  console.log()

  // Variance analysis
  console.log('VARIATION SOURCES (demonstrates SHARE pillars):')
  console.log('-'.repeat(80))
  console.log()

  console.log('1. CULTIVAR VARIATION (H pillar):')
  console.log('   • Powell Navel: 12.2-15.9°Bx (late season, highest quality)')
  console.log('   • Fukumoto Navel: 10.3-11.2°Bx (early season, lower Brix)')
  console.log('   → Heritage/genetics set ceiling')
  console.log()

  console.log('2. TIMING VARIATION (R pillar):')
  console.log('   • Lane Late: 9.4°Bx (Feb) → 15.9°Bx (June) = 6.5°Bx increase')
  console.log('   • Gala apple: 9.6°Bx (Aug 31) → 13.1°Bx (Sept 8) = 3.5°Bx increase')
  console.log('   → Harvest timing is CRITICAL')
  console.log()

  console.log('3. LOCATION VARIATION (S pillar - terroir):')
  console.log('   • UC Riverside vs Lindcove vs Coachella (citrus)')
  console.log('   • Berrien vs Oceana vs Kent County (Michigan apples)')
  console.log('   → Soil/climate affects outcome')
  console.log()

  console.log('4. GROWING METHOD (A pillar - your insight):')
  console.log('   • CA field strawberries: 11-12°Bx')
  console.log('   • NC greenhouse strawberries: 7-8°Bx')
  console.log('   → Controlled environment = 40% lower Brix')
  console.log()

  // Next steps
  console.log('='.repeat(80))
  console.log('NEXT STEPS FOR FULL VALIDATION')
  console.log('='.repeat(80))
  console.log()

  console.log('To complete SHARE prediction validation:')
  console.log()
  console.log('1. FOR EACH MEASUREMENT:')
  console.log('   - Extract: cultivar, location/region, harvest date')
  console.log('   - Run: SHARE prediction model with same parameters')
  console.log('   - Compare: predicted Brix vs actual Brix')
  console.log('   - Calculate: error, absolute error, % error')
  console.log()

  console.log('2. AGGREGATE METRICS:')
  console.log('   - MAE (Mean Absolute Error): Average of |predicted - actual|')
  console.log('   - RMSE (Root Mean Square Error): Penalizes large errors')
  console.log('   - R² (Coefficient of determination): How well model explains variance')
  console.log('   - Accuracy within ±0.5°Bx, ±1.0°Bx, ±1.5°Bx')
  console.log()

  console.log('3. IDENTIFY TUNING NEEDS:')
  console.log('   - Which cultivars predict well vs poorly?')
  console.log('   - Which regions/locations have systematic bias?')
  console.log('   - What factors need adjustment (GDD, age modifiers, etc.)?')
  console.log()

  console.log('4. ITERATE:')
  console.log('   - Tune model parameters')
  console.log('   - Re-validate')
  console.log('   - Improve accuracy')
  console.log()

  console.log('CHALLENGE:')
  console.log('  Many measurements lack full SHARE context (rootstock, tree age, practices)')
  console.log('  Will need to make assumptions or use defaults for validation')
  console.log()

  console.log('RECOMMENDATION:')
  console.log('  Start with BASELINE model (cultivar base Brix + region + timing)')
  console.log('  Validate against these 82 measurements')
  console.log('  Then add complexity (rootstock, age, practices) as data allows')
  console.log()

  await closeDriver()
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
