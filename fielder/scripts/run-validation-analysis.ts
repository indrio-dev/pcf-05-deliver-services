#!/usr/bin/env tsx

/**
 * Run SHARE Validation Analysis
 *
 * For each university measurement:
 * 1. Extract cultivar, location, harvest date
 * 2. Map location → regionId (best guess)
 * 3. Run SHARE prediction
 * 4. Compare predicted vs actual Brix
 * 5. Calculate validation metrics
 */

import { runQuery, closeDriver } from '../src/lib/graph/index'
import { predictQuality } from '../src/lib/prediction/quality-predictor'

interface Measurement {
  measurementId: string
  cultivarId: string
  cultivarName: string
  location: string
  county: string
  state: string
  harvestDate: string
  actualBrix: number
  productType: string
  source: string
}

interface ValidationResult {
  measurementId: string
  cultivar: string
  location: string
  harvestDate: string
  actualBrix: number
  predictedBrix: number
  error: number
  absoluteError: number
  percentError: number
  withinHalfDegree: boolean
  withinOneDegree: boolean
  notes: string
}

// Map state/county to regionId (simplified - would need full mapping)
function mapLocationToRegion(state: string, county: string | null, location: string): string {
  // Michigan apples
  if (state === 'MI') {
    if (county?.includes('Berrien')) return 'southwest_michigan'
    if (county?.includes('Oceana')) return 'west_central_michigan'
    if (county?.includes('Kent')) return 'grand_rapids_mi'
    return 'michigan_general'
  }

  // California
  if (state === 'CA') {
    if (location.toLowerCase().includes('salinas') || location.toLowerCase().includes('monterey')) {
      return 'monterey_ca'
    }
    if (location.toLowerCase().includes('riverside')) return 'inland_southern_california'
    if (location.toLowerCase().includes('lindcove')) return 'central_valley_ca'
    if (location.toLowerCase().includes('coachella')) return 'coachella_valley_ca'
    if (location.toLowerCase().includes('ojai')) return 'ventura_county_ca'
    if (location.toLowerCase().includes('exeter')) return 'tulare_county_ca'
    return 'california_central_valley'
  }

  // Washington
  if (state === 'WA') {
    if (location.toLowerCase().includes('wenatchee') || county?.includes('Chelan')) {
      return 'wenatchee_wa'
    }
    return 'washington_yakima_valley'
  }

  // North Carolina
  if (state === 'NC') return 'north_carolina_piedmont'

  // Default
  return `${state.toLowerCase()}_general`
}

async function main() {
  console.log('='.repeat(80))
  console.log('SHARE PREDICTION VALIDATION - FULL ANALYSIS')
  console.log('='.repeat(80))
  console.log()

  // Get university measurements
  const measurements = await runQuery<Measurement>(`
    MATCH (m:Measurement)-[:MEASURED_ON]->(c:Cultivar)-[:IS_A]->(p:ProductType)
    WHERE m.dataSource IN ['strawberry_validated', 'citrus_uc_riverside', 'apple_msu_wsu']
      AND m.brix IS NOT NULL
      AND m.state IS NOT NULL
    RETURN m.id as measurementId,
           c.id as cultivarId,
           c.displayName as cultivarName,
           m.location as location,
           m.county as county,
           m.state as state,
           m.harvestDate as harvestDate,
           m.brix as actualBrix,
           p.id as productType,
           m.source as source
    ORDER BY p.id, c.displayName
  `)

  console.log(`Loaded ${measurements.length} measurements for validation`)
  console.log()

  const validationResults: ValidationResult[] = []
  let predictionsRun = 0
  let predictionsFailed = 0

  console.log('Running SHARE predictions...')
  console.log()

  for (const measurement of measurements) {
    try {
      // Map location to region
      const regionId = mapLocationToRegion(
        measurement.state,
        measurement.county,
        measurement.location
      )

      // Run SHARE prediction with minimal input (cultivar + region)
      // Using defaults for rootstock, age, practices since we don't have that data
      const prediction = predictQuality({
        cultivarId: measurement.cultivarId,
        regionId: regionId,
        // Defaults will be used for rootstock, age, practices
      })

      const predicted = prediction.predictedBrix || prediction.quality?.brix || null

      if (predicted === null) {
        predictionsFailed++
        continue
      }

      const actual = Number(measurement.actualBrix)
      const error = predicted - actual
      const absoluteError = Math.abs(error)
      const percentError = (error / actual) * 100

      validationResults.push({
        measurementId: measurement.measurementId,
        cultivar: measurement.cultivarName,
        location: `${measurement.location}, ${measurement.state}`,
        harvestDate: measurement.harvestDate?.substring(0, 10) || 'unknown',
        actualBrix: actual,
        predictedBrix: predicted,
        error: error,
        absoluteError: absoluteError,
        percentError: percentError,
        withinHalfDegree: absoluteError <= 0.5,
        withinOneDegree: absoluteError <= 1.0,
        notes: `Region: ${regionId}, Prediction basis: ${prediction.predictionBasis || 'default'}`
      })

      predictionsRun++

      if (predictionsRun % 10 === 0) {
        console.log(`  ✓ Processed ${predictionsRun}/${measurements.length}...`)
      }
    } catch (error) {
      console.error(`  ❌ Error predicting for ${measurement.cultivarName}:`, error)
      predictionsFailed++
    }
  }

  console.log()
  console.log(`Predictions run: ${predictionsRun}`)
  console.log(`Predictions failed: ${predictionsFailed}`)
  console.log()

  if (validationResults.length === 0) {
    console.log('⚠️ No validation results - prediction model may need cultivar/region data')
    console.log()
    await closeDriver()
    return
  }

  // Calculate validation metrics
  console.log('='.repeat(80))
  console.log('VALIDATION METRICS')
  console.log('='.repeat(80))
  console.log()

  const errors = validationResults.map(r => r.error)
  const absoluteErrors = validationResults.map(r => r.absoluteError)

  // MAE (Mean Absolute Error)
  const mae = absoluteErrors.reduce((sum, e) => sum + e, 0) / absoluteErrors.length

  // RMSE (Root Mean Square Error)
  const mse = errors.reduce((sum, e) => sum + e * e, 0) / errors.length
  const rmse = Math.sqrt(mse)

  // R² (Coefficient of Determination)
  const actualMean = validationResults.reduce((sum, r) => sum + r.actualBrix, 0) / validationResults.length
  const ssTot = validationResults.reduce((sum, r) => sum + Math.pow(r.actualBrix - actualMean, 2), 0)
  const ssRes = validationResults.reduce((sum, r) => sum + Math.pow(r.error, 2), 0)
  const r2 = 1 - (ssRes / ssTot)

  // Accuracy thresholds
  const within05 = validationResults.filter(r => r.withinHalfDegree).length
  const within10 = validationResults.filter(r => r.withinOneDegree).length
  const within15 = validationResults.filter(r => r.absoluteError <= 1.5).length

  console.log(`MAE (Mean Absolute Error):        ${mae.toFixed(2)}°Bx`)
  console.log(`RMSE (Root Mean Square Error):    ${rmse.toFixed(2)}°Bx`)
  console.log(`R² (Coefficient of Determination): ${r2.toFixed(3)}`)
  console.log()
  console.log(`Accuracy within ±0.5°Bx: ${within05}/${validationResults.length} (${Math.round(within05/validationResults.length*100)}%)`)
  console.log(`Accuracy within ±1.0°Bx: ${within10}/${validationResults.length} (${Math.round(within10/validationResults.length*100)}%)`)
  console.log(`Accuracy within ±1.5°Bx: ${within15}/${validationResults.length} (${Math.round(within15/validationResults.length*100)}%)`)
  console.log()

  // By product type
  console.log('='.repeat(80))
  console.log('VALIDATION BY PRODUCT TYPE')
  console.log('='.repeat(80))
  console.log()

  const byProduct = new Map<string, ValidationResult[]>()
  validationResults.forEach(r => {
    // Extract product from cultivar (simple heuristic)
    const product = r.cultivar.includes('apple') || ['Honeycrisp', 'Gala', 'Fuji', 'McIntosh', 'Jonagold', 'Empire', 'Golden Delicious', 'Red Delicious', 'Cosmic Crisp', 'Granny Smith', 'Braeburn'].includes(r.cultivar) ? 'apple' :
                    r.cultivar.includes('Navel') || r.cultivar.includes('Orange') ? 'orange' :
                    r.cultivar.includes('Albion') || r.cultivar.includes('Monterey') || r.cultivar.includes('Charlie') || r.cultivar.includes('Fronteras') ? 'strawberry' :
                    r.cultivar.includes('Monterey') && !r.cultivar.includes('strawberry') ? 'almond' : 'unknown'

    if (!byProduct.has(product)) {
      byProduct.set(product, [])
    }
    byProduct.get(product)!.push(r)
  })

  for (const [product, results] of byProduct.entries()) {
    const productMae = results.reduce((sum, r) => sum + r.absoluteError, 0) / results.length
    const productWithin10 = results.filter(r => r.withinOneDegree).length

    console.log(`${product.toUpperCase()}:`)
    console.log(`  Measurements: ${results.length}`)
    console.log(`  MAE: ${productMae.toFixed(2)}°Bx`)
    console.log(`  Within ±1.0°Bx: ${productWithin10}/${results.length} (${Math.round(productWithin10/results.length*100)}%)`)
    console.log()
  }

  // Show best and worst predictions
  console.log('='.repeat(80))
  console.log('BEST PREDICTIONS (±0.5°Bx)')
  console.log('='.repeat(80))
  console.log()

  const best = validationResults
    .filter(r => r.withinHalfDegree)
    .sort((a, b) => a.absoluteError - b.absoluteError)
    .slice(0, 10)

  best.forEach(r => {
    console.log(`✅ ${r.cultivar} | ${r.location}`)
    console.log(`   Actual: ${r.actualBrix.toFixed(1)}°Bx | Predicted: ${r.predictedBrix.toFixed(1)}°Bx | Error: ${r.error > 0 ? '+' : ''}${r.error.toFixed(1)}°Bx`)
  })

  console.log()

  // Show worst predictions
  console.log('='.repeat(80))
  console.log('WORST PREDICTIONS (>2.0°Bx error)')
  console.log('='.repeat(80))
  console.log()

  const worst = validationResults
    .filter(r => r.absoluteError > 2.0)
    .sort((a, b) => b.absoluteError - a.absoluteError)
    .slice(0, 10)

  if (worst.length === 0) {
    console.log('✅ No predictions with >2.0°Bx error!')
  } else {
    worst.forEach(r => {
      console.log(`❌ ${r.cultivar} | ${r.location} | ${r.harvestDate}`)
      console.log(`   Actual: ${r.actualBrix.toFixed(1)}°Bx | Predicted: ${r.predictedBrix.toFixed(1)}°Bx | Error: ${r.error > 0 ? '+' : ''}${r.error.toFixed(1)}°Bx`)
      console.log(`   ${r.notes}`)
    })
  }

  console.log()

  // Summary assessment
  console.log('='.repeat(80))
  console.log('VALIDATION ASSESSMENT')
  console.log('='.repeat(80))
  console.log()

  const targetMae = 1.0  // Target ±1.0°Bx MAE
  const targetAccuracy = 0.80  // Target 80% within ±1.0°Bx

  const maeStatus = mae <= targetMae ? '✅' : '⚠️'
  const accuracyStatus = (within10 / validationResults.length) >= targetAccuracy ? '✅' : '⚠️'

  console.log(`${maeStatus} MAE: ${mae.toFixed(2)}°Bx (target ≤1.0°Bx)`)
  console.log(`${accuracyStatus} Accuracy: ${Math.round(within10/validationResults.length*100)}% within ±1.0°Bx (target ≥80%)`)
  console.log()

  if (mae <= targetMae && (within10 / validationResults.length) >= targetAccuracy) {
    console.log('🎉 MODEL VALIDATION SUCCESSFUL!')
    console.log('   SHARE framework predictions align with university research data')
  } else {
    console.log('🔧 MODEL NEEDS TUNING')
    console.log('   Review worst predictions and adjust parameters')
  }

  console.log()

  // Save results to JSON
  const outputPath = 'data/research/validation-results-university.json'
  const fs = require('fs')
  fs.writeFileSync(outputPath, JSON.stringify({
    validation_date: new Date().toISOString(),
    total_measurements: validationResults.length,
    metrics: {
      mae: parseFloat(mae.toFixed(2)),
      rmse: parseFloat(rmse.toFixed(2)),
      r2: parseFloat(r2.toFixed(3)),
      within_05_bx: within05,
      within_10_bx: within10,
      within_15_bx: within15,
      within_05_pct: Math.round(within05/validationResults.length*100),
      within_10_pct: Math.round(within10/validationResults.length*100),
      within_15_pct: Math.round(within15/validationResults.length*100)
    },
    results: validationResults
  }, null, 2))

  console.log(`Results saved to: ${outputPath}`)
  console.log()

  await closeDriver()
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
