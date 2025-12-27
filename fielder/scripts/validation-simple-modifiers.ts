#!/usr/bin/env tsx

/**
 * Simple Validation with Modifiers
 *
 * Uses cultivar brixBase from Neo4j and manually applies the 3 modifiers:
 * 1. Harvest timing
 * 2. Late-season citrus
 * 3. Growing method
 */

import { runQuery, closeDriver } from '../src/lib/graph/index'
import * as fs from 'fs'

interface Measurement {
  measurementId: string
  cultivarId: string
  cultivarName: string
  brixBase: number
  location: string
  state: string
  harvestDate: string | null
  harvestYear: number | null
  harvestMonth: number | null
  harvestPeriod: string | null
  actualBrix: number
  measurementType: string | null
}

function determineHarvestTiming(cultivarId: string, month: number | null): 'early' | 'peak' | 'late' {
  // Apples: Aug=early, Sept=peak, Oct+=late
  if (['honeycrisp', 'gala', 'fuji', 'mcintosh', 'jonagold', 'empire', 'golden_delicious', 'red_delicious', 'cosmic_crisp', 'granny_smith', 'braeburn'].includes(cultivarId)) {
    if (month === 8) return 'early'
    if (month === 9) return 'peak'
    if (month && month >= 10) return 'late'
  }

  // Citrus: Nov-Jan=early, Feb-Mar=peak, Apr-Jun=late
  if (cultivarId.includes('navel') || cultivarId.includes('cara')) {
    if (month && (month === 11 || month === 12 || month === 1)) return 'early'
    if (month && (month === 2 || month === 3)) return 'peak'
    if (month && month >= 4 && month <= 6) return 'late'
  }

  return 'peak'
}

async function main() {
  console.log('='.repeat(80))
  console.log('SIMPLE VALIDATION WITH 3 MODIFIERS')
  console.log('='.repeat(80))
  console.log()

  const measurements = await runQuery<Measurement>(`
    MATCH (m:Measurement)-[:MEASURED_ON]->(c:Cultivar)
    WHERE m.dataSource IN ['strawberry_validated', 'citrus_uc_riverside', 'apple_msu_wsu']
      AND m.brix IS NOT NULL
      AND c.brixBase IS NOT NULL
    RETURN m.id as measurementId,
           c.id as cultivarId,
           c.displayName as cultivarName,
           c.brixBase as brixBase,
           m.location as location,
           m.state as state,
           m.harvestDate as harvestDate,
           m.harvestYear as harvestYear,
           m.harvestMonth as harvestMonth,
           m.harvestPeriod as harvestPeriod,
           m.brix as actualBrix,
           m.measurementType as measurementType
    ORDER BY c.displayName
  `)

  console.log(`Loaded ${measurements.length} measurements`)
  console.log()

  const results = measurements.map(m => {
    const baseline = Number(m.brixBase)
    let improved = baseline

    const modifiersApplied: string[] = []

    // 1. HARVEST TIMING
    const timing = determineHarvestTiming(m.cultivarId, m.harvestMonth)
    if (timing === 'early') {
      improved -= 2.0
      modifiersApplied.push('early-harvest(-2.0)')
    } else if (timing === 'late') {
      improved -= 1.0
      modifiersApplied.push('late-harvest(-1.0)')
    }

    // 2. LATE-SEASON CITRUS BONUS
    const isLateCitrus = m.cultivarId.includes('powell') || m.cultivarId.includes('lane_late')
    const month = m.harvestMonth
    if (isLateCitrus && month && (month === 5 || month === 6)) {
      improved += 3.0
      modifiersApplied.push('late-citrus-bonus(+3.0)')
    }

    // 3. GROWING METHOD
    if (m.measurementType === 'field_trial') {
      improved += 2.0
      modifiersApplied.push('field-method(+2.0)')
    } else if (m.measurementType === 'greenhouse') {
      // No modifier (baseline is greenhouse)
      modifiersApplied.push('greenhouse(0.0)')
    }

    const actual = Number(m.actualBrix)
    const baselineError = baseline - actual
    const improvedError = improved - actual

    return {
      cultivar: m.cultivarName,
      location: `${m.location}, ${m.state}`,
      harvestDate: m.harvestDate?.substring(0, 10) || `${m.harvestYear}-${String(m.harvestMonth).padStart(2, '0')}`,
      month: m.harvestMonth,
      actual,
      baseline,
      improved,
      baselineError,
      improvedError,
      improvement: Math.abs(baselineError) - Math.abs(improvedError),
      modifiersApplied
    }
  })

  // Calculate metrics
  const baselineMae = results.reduce((sum, r) => sum + Math.abs(r.baselineError), 0) / results.length
  const improvedMae = results.reduce((sum, r) => sum + Math.abs(r.improvedError), 0) / results.length

  const baselineWithin10 = results.filter(r => Math.abs(r.baselineError) <= 1.0).length
  const improvedWithin05 = results.filter(r => Math.abs(r.improvedError) <= 0.5).length
  const improvedWithin10 = results.filter(r => Math.abs(r.improvedError) <= 1.0).length
  const improvedWithin15 = results.filter(r => Math.abs(r.improvedError) <= 1.5).length
  const improvedWithin20 = results.filter(r => Math.abs(r.improvedError) <= 2.0).length

  const mse = results.reduce((sum, r) => sum + r.improvedError * r.improvedError, 0) / results.length
  const rmse = Math.sqrt(mse)

  const actualMean = results.reduce((sum, r) => sum + r.actual, 0) / results.length
  const ssTot = results.reduce((sum, r) => sum + Math.pow(r.actual - actualMean, 2), 0)
  const ssRes = results.reduce((sum, r) => sum + Math.pow(r.improvedError, 2), 0)
  const r2 = 1 - (ssRes / ssTot)

  console.log('='.repeat(80))
  console.log('RESULTS')
  console.log('='.repeat(80))
  console.log()

  console.log('BASELINE:')
  console.log(`  MAE: ${baselineMae.toFixed(2)}°Bx`)
  console.log(`  Within ±1.0°Bx: ${baselineWithin10}/${results.length} (${Math.round(baselineWithin10/results.length*100)}%)`)
  console.log()

  console.log('IMPROVED:')
  console.log(`  MAE: ${improvedMae.toFixed(2)}°Bx`)
  console.log(`  RMSE: ${rmse.toFixed(2)}°Bx`)
  console.log(`  R²: ${r2.toFixed(3)}`)
  console.log(`  Within ±0.5°Bx: ${improvedWithin05}/${results.length} (${Math.round(improvedWithin05/results.length*100)}%)`)
  console.log(`  Within ±1.0°Bx: ${improvedWithin10}/${results.length} (${Math.round(improvedWithin10/results.length*100)}%)`)
  console.log(`  Within ±1.5°Bx: ${improvedWithin15}/${results.length} (${Math.round(improvedWithin15/results.length*100)}%)`)
  console.log(`  Within ±2.0°Bx: ${improvedWithin20}/${results.length} (${Math.round(improvedWithin20/results.length*100)}%)`)
  console.log()

  const improvement = baselineMae - improvedMae
  const pctImprovement = (improvement / baselineMae) * 100

  console.log('IMPROVEMENT:')
  console.log(`  MAE: ${baselineMae.toFixed(2)}°Bx → ${improvedMae.toFixed(2)}°Bx`)
  console.log(`  Change: ${improvement > 0 ? '-' : '+'}${Math.abs(improvement).toFixed(2)}°Bx (${improvement > 0 ? '' : '+'}${pctImprovement.toFixed(1)}%)`)
  console.log(`  Accuracy: ${baselineWithin10} → ${improvedWithin10} (${improvedWithin10 - baselineWithin10 > 0 ? '+' : ''}${improvedWithin10 - baselineWithin10})`)
  console.log()

  // Show top improvements
  console.log('TOP 10 IMPROVEMENTS:')
  console.log('-'.repeat(80))
  results
    .filter(r => r.improvement > 0)
    .sort((a, b) => b.improvement - a.improvement)
    .slice(0, 10)
    .forEach((r, i) => {
      console.log(`${i + 1}. ${r.cultivar} (${r.harvestDate})`)
      console.log(`   ${r.actual.toFixed(1)}°Bx actual | Base: ${r.baseline.toFixed(1)}°Bx | Improved: ${r.improved.toFixed(1)}°Bx`)
      console.log(`   Modifiers: ${r.modifiersApplied.join(', ') || 'none'}`)
      console.log(`   Improvement: ${r.improvement.toFixed(1)}°Bx`)
    })

  console.log()

  // Assessment
  const status = improvedMae <= 1.0 ? '🎉 SUCCESS' :
                 improvement > 0 ? '✅ IMPROVED' : '⚠️ NO IMPROVEMENT'

  console.log('='.repeat(80))
  console.log(status)
  console.log('='.repeat(80))
  console.log()

  if (improvedMae <= 1.0) {
    console.log('Target accuracy achieved! (MAE ≤1.0°Bx)')
  } else if (improvement > 0) {
    console.log(`Model improved by ${pctImprovement.toFixed(1)}%`)
    console.log('Further tuning needed to reach target')
  } else {
    console.log('Modifiers need adjustment - made accuracy worse')
  }

  console.log()

  fs.writeFileSync('data/research/simple-modifiers-validation.json', JSON.stringify({
    date: new Date().toISOString(),
    sample_size: results.length,
    baseline: { mae: parseFloat(baselineMae.toFixed(2)), within_10: baselineWithin10 },
    improved: {
      mae: parseFloat(improvedMae.toFixed(2)),
      rmse: parseFloat(rmse.toFixed(2)),
      r2: parseFloat(r2.toFixed(3)),
      within_05: improvedWithin05,
      within_10: improvedWithin10,
      within_15: improvedWithin15
    },
    improvement: {
      mae_change: parseFloat(improvement.toFixed(2)),
      pct_change: parseFloat(pctImprovement.toFixed(1))
    },
    results
  }, null, 2))

  console.log('Saved to: data/research/simple-modifiers-validation.json')

  await closeDriver()
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
