#!/usr/bin/env tsx

/**
 * Baseline SHARE Validation
 *
 * Uses cultivar brixBase from Neo4j database instead of quality-tiers constants
 * Simpler baseline model: Predicted Brix = cultivar brixBase (no modifiers yet)
 *
 * This tests whether our cultivar base Brix values are reasonable starting points
 */

import { runQuery, closeDriver } from '../src/lib/graph/index'
import * as fs from 'fs'

interface MeasurementWithCultivar {
  measurementId: string
  cultivarId: string
  cultivarName: string
  brixBase: number | null
  location: string
  state: string
  harvestDate: string
  actualBrix: number
  productType: string
}

interface ValidationResult {
  cultivar: string
  location: string
  harvestDate: string
  actualBrix: number
  predictedBrix: number
  brixBase: number | null
  error: number
  absoluteError: number
  percentError: number
}

async function main() {
  console.log('='.repeat(80))
  console.log('BASELINE SHARE VALIDATION - Using Cultivar brixBase')
  console.log('='.repeat(80))
  console.log()

  // Get measurements with cultivar brixBase
  const measurements = await runQuery<MeasurementWithCultivar>(`
    MATCH (m:Measurement)-[:MEASURED_ON]->(c:Cultivar)-[:IS_A]->(p:ProductType)
    WHERE m.dataSource IN ['strawberry_validated', 'citrus_uc_riverside', 'apple_msu_wsu']
      AND m.brix IS NOT NULL
    RETURN m.id as measurementId,
           c.id as cultivarId,
           c.displayName as cultivarName,
           c.brixBase as brixBase,
           m.location as location,
           m.state as state,
           m.harvestDate as harvestDate,
           m.brix as actualBrix,
           p.id as productType
    ORDER BY p.id, c.displayName
  `)

  console.log(`Loaded ${measurements.length} measurements`)
  console.log()

  // Filter to only measurements where we have brixBase
  const withBaseline = measurements.filter(m => m.brixBase !== null && m.brixBase !== undefined)
  const withoutBaseline = measurements.filter(m => m.brixBase === null || m.brixBase === undefined)

  console.log(`Measurements with cultivar brixBase: ${withBaseline.length}`)
  console.log(`Measurements WITHOUT brixBase: ${withoutBaseline.length}`)
  console.log()

  if (withoutBaseline.length > 0) {
    console.log('Cultivars missing brixBase:')
    const missingSet = new Set(withoutBaseline.map(m => m.cultivarName))
    Array.from(missingSet).forEach(name => console.log(`  - ${name}`))
    console.log()
  }

  if (withBaseline.length === 0) {
    console.log('⚠️ No measurements have cultivar brixBase - cannot run baseline validation')
    await closeDriver()
    return
  }

  // Run baseline validation: predicted = brixBase (no modifiers)
  const validationResults: ValidationResult[] = []

  console.log('Running baseline predictions (brixBase only)...')
  console.log()

  for (const m of withBaseline) {
    const predicted = Number(m.brixBase!)
    const actual = Number(m.actualBrix)
    const error = predicted - actual
    const absoluteError = Math.abs(error)
    const percentError = (error / actual) * 100

    validationResults.push({
      cultivar: m.cultivarName,
      location: `${m.location}, ${m.state}`,
      harvestDate: m.harvestDate?.substring(0, 10) || 'unknown',
      actualBrix: actual,
      predictedBrix: predicted,
      brixBase: Number(m.brixBase!),
      error: error,
      absoluteError: absoluteError,
      percentError: percentError
    })
  }

  console.log(`Baseline predictions: ${validationResults.length}`)
  console.log()

  // Calculate metrics
  console.log('='.repeat(80))
  console.log('BASELINE VALIDATION METRICS')
  console.log('='.repeat(80))
  console.log()

  const errors = validationResults.map(r => r.error)
  const absoluteErrors = validationResults.map(r => r.absoluteError)

  // MAE
  const mae = absoluteErrors.reduce((sum, e) => sum + e, 0) / absoluteErrors.length

  // RMSE
  const mse = errors.reduce((sum, e) => sum + e * e, 0) / errors.length
  const rmse = Math.sqrt(mse)

  // R²
  const actualMean = validationResults.reduce((sum, r) => sum + r.actualBrix, 0) / validationResults.length
  const ssTot = validationResults.reduce((sum, r) => sum + Math.pow(r.actualBrix - actualMean, 2), 0)
  const ssRes = validationResults.reduce((sum, r) => sum + Math.pow(r.error, 2), 0)
  const r2 = 1 - (ssRes / ssTot)

  // Accuracy thresholds
  const within05 = validationResults.filter(r => r.absoluteError <= 0.5).length
  const within10 = validationResults.filter(r => r.absoluteError <= 1.0).length
  const within15 = validationResults.filter(r => r.absoluteError <= 1.5).length
  const within20 = validationResults.filter(r => r.absoluteError <= 2.0).length

  console.log(`Sample size (n):                  ${validationResults.length}`)
  console.log()
  console.log(`MAE (Mean Absolute Error):        ${mae.toFixed(2)}°Bx`)
  console.log(`RMSE (Root Mean Square Error):    ${rmse.toFixed(2)}°Bx`)
  console.log(`R² (Coefficient of Determination): ${r2.toFixed(3)}`)
  console.log()
  console.log(`Within ±0.5°Bx: ${within05}/${validationResults.length} (${Math.round(within05/validationResults.length*100)}%)`)
  console.log(`Within ±1.0°Bx: ${within10}/${validationResults.length} (${Math.round(within10/validationResults.length*100)}%)`)
  console.log(`Within ±1.5°Bx: ${within15}/${validationResults.length} (${Math.round(within15/validationResults.length*100)}%)`)
  console.log(`Within ±2.0°Bx: ${within20}/${validationResults.length} (${Math.round(within20/validationResults.length*100)}%)`)
  console.log()

  // By product
  console.log('='.repeat(80))
  console.log('BY PRODUCT TYPE')
  console.log('='.repeat(80))
  console.log()

  const byProduct = new Map<string, ValidationResult[]>()
  validationResults.forEach(r => {
    // Simple product extraction
    const product = ['Honeycrisp', 'Gala', 'Fuji', 'McIntosh', 'Jonagold', 'Empire', 'Golden Delicious', 'Red Delicious', 'Cosmic Crisp', 'Granny Smith', 'Braeburn'].includes(r.cultivar) ? 'Apple' :
                    r.cultivar.includes('Navel') || r.cultivar.includes('Orange') ? 'Orange' :
                    ['Albion', 'Monterey', 'Sweet Charlie', 'Fronteras'].includes(r.cultivar) ? 'Strawberry' : 'Unknown'

    if (!byProduct.has(product)) {
      byProduct.set(product, [])
    }
    byProduct.get(product)!.push(r)
  })

  for (const [product, results] of byProduct.entries()) {
    const productMae = results.reduce((sum, r) => sum + r.absoluteError, 0) / results.length
    const productWithin15 = results.filter(r => r.absoluteError <= 1.5).length

    console.log(`${product}:`)
    console.log(`  n = ${results.length}`)
    console.log(`  MAE: ${productMae.toFixed(2)}°Bx`)
    console.log(`  Within ±1.5°Bx: ${productWithin15}/${results.length} (${Math.round(productWithin15/results.length*100)}%)`)

    // Show sample
    const sample = results.slice(0, 2)
    sample.forEach(s => {
      console.log(`  • ${s.cultivar}: Actual ${s.actualBrix.toFixed(1)}°Bx, Predicted ${s.predictedBrix.toFixed(1)}°Bx (${s.error > 0 ? '+' : ''}${s.error.toFixed(1)}°Bx)`)
    })
    console.log()
  }

  // Assessment
  console.log('='.repeat(80))
  console.log('BASELINE ASSESSMENT')
  console.log('='.repeat(80))
  console.log()

  const status = mae <= 2.0 ? '✅ GOOD' : mae <= 3.0 ? '⚠️ FAIR' : '❌ POOR'

  console.log(`${status} - MAE ${mae.toFixed(2)}°Bx`)
  console.log()

  if (mae <= 2.0) {
    console.log('✅ Cultivar brixBase values are reasonable starting points')
    console.log('✅ Within 2°Bx average error with NO modifiers (timing, region, practices)')
    console.log('→ Adding SHARE modifiers should improve accuracy significantly')
  } else {
    console.log('⚠️ Cultivar brixBase values need review')
    console.log('→ Check which cultivars have large errors')
    console.log('→ Update brixBase values based on research')
  }

  console.log()

  // Save results
  fs.writeFileSync('data/research/baseline-validation-results.json', JSON.stringify({
    validation_date: new Date().toISOString(),
    model: 'baseline (brixBase only, no modifiers)',
    sample_size: validationResults.length,
    metrics: {
      mae: parseFloat(mae.toFixed(2)),
      rmse: parseFloat(rmse.toFixed(2)),
      r2: parseFloat(r2.toFixed(3)),
      within_05_bx: within05,
      within_10_bx: within10,
      within_15_bx: within15,
      within_20_bx: within20
    },
    results: validationResults
  }, null, 2))

  console.log('Results saved to: data/research/baseline-validation-results.json')
  console.log()

  await closeDriver()
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
