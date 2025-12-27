#!/usr/bin/env tsx

/**
 * SHARE Validation with NEW Modifiers
 *
 * Re-runs validation using the 3 new modifiers from validation insights:
 * 1. Harvest timing (early/peak/late)
 * 2. Late-season citrus bonus (May-June)
 * 3. Growing method (field/greenhouse/hydroponic)
 *
 * Compares to baseline (cultivar brixBase only) to show improvement
 */

import { runQuery, closeDriver } from '../src/lib/graph/index'
import { predictQuality } from '../src/lib/prediction/quality-predictor'
import * as fs from 'fs'

interface Measurement {
  measurementId: string
  cultivarId: string
  cultivarName: string
  location: string
  county: string | null
  state: string
  harvestDate: string | null
  harvestYear: number | null
  harvestMonth: number | null
  harvestPeriod: string | null
  actualBrix: number
  brixBase: number | null
  measurementType: string | null
  productType: string
}

interface ValidationResult {
  cultivar: string
  location: string
  harvestDate: string
  actualBrix: number
  baselinePrediction: number
  improvedPrediction: number
  baselineError: number
  improvedError: number
  improvement: number
  harvestTiming: string
  growingMethod: string
  modifiersApplied: string[]
}

// Determine harvest timing from date
function determineHarvestTiming(
  cultivarId: string,
  month: number | null,
  period: string | null
): 'early' | 'peak' | 'late' {
  // Apples - early season is Aug, peak is Sept, late is Oct+
  if (['honeycrisp', 'gala', 'fuji', 'mcintosh', 'jonagold', 'empire', 'golden_delicious', 'red_delicious', 'cosmic_crisp', 'granny_smith', 'braeburn'].includes(cultivarId)) {
    if (month === 8 || period?.toLowerCase().includes('august')) return 'early'
    if (month === 9 || period?.toLowerCase().includes('september')) return 'peak'
    if (month && month >= 10) return 'late'
  }

  // Citrus navels - early is Nov-Jan, peak is Feb-Mar, late is Apr-Jun
  if (cultivarId.includes('navel') || cultivarId.includes('cara_cara')) {
    if (month && month >= 11 && month <= 1) return 'early'
    if (month && month >= 2 && month <= 3) return 'peak'
    if (month && month >= 4) return 'late'
  }

  // Strawberries - depends on type, but generally peak for day-neutral is summer
  if (cultivarId.includes('strawberry') || ['albion_strawberry', 'monterey', 'sweet_charlie', 'fronteras'].includes(cultivarId)) {
    if (period?.toLowerCase().includes('february') || period?.toLowerCase().includes('winter')) return 'early'
    return 'peak'  // Most are peak season
  }

  // Default to peak if unknown
  return 'peak'
}

// Map state/county to regionId
function mapLocationToRegion(state: string, county: string | null, location: string): string {
  if (state === 'MI') {
    if (county?.includes('Berrien')) return 'southwest_michigan'
    if (county?.includes('Oceana')) return 'west_central_michigan'
    if (county?.includes('Kent')) return 'grand_rapids_mi'
    return 'michigan_general'
  }

  if (state === 'CA') {
    if (location.toLowerCase().includes('salinas')) return 'monterey_ca'
    if (location.toLowerCase().includes('riverside')) return 'inland_southern_california'
    if (location.toLowerCase().includes('lindcove')) return 'central_valley_ca'
    if (location.toLowerCase().includes('coachella')) return 'coachella_valley_ca'
    return 'california_central_valley'
  }

  if (state === 'WA') return 'wenatchee_wa'
  if (state === 'NC') return 'north_carolina_piedmont'

  return `${state.toLowerCase()}_general`
}

async function main() {
  console.log('='.repeat(80))
  console.log('SHARE VALIDATION WITH NEW MODIFIERS')
  console.log('='.repeat(80))
  console.log()
  console.log('Testing 3 new modifiers from validation insights:')
  console.log('  1. Harvest timing (early -2.0°Bx, peak 0.0, late -1.0)')
  console.log('  2. Late-season citrus bonus (May-Jun +3.0°Bx)')
  console.log('  3. Growing method (field +2.0°Bx, greenhouse 0.0, hydroponic -1.0)')
  console.log()

  // Get measurements with brixBase for baseline comparison
  const measurements = await runQuery<Measurement>(`
    MATCH (m:Measurement)-[:MEASURED_ON]->(c:Cultivar)-[:IS_A]->(p:ProductType)
    WHERE m.dataSource IN ['strawberry_validated', 'citrus_uc_riverside', 'apple_msu_wsu']
      AND m.brix IS NOT NULL
      AND c.brixBase IS NOT NULL
    RETURN m.id as measurementId,
           c.id as cultivarId,
           c.displayName as cultivarName,
           c.brixBase as brixBase,
           m.location as location,
           m.county as county,
           m.state as state,
           m.harvestDate as harvestDate,
           m.harvestYear as harvestYear,
           m.harvestMonth as harvestMonth,
           m.harvestPeriod as harvestPeriod,
           m.brix as actualBrix,
           m.measurementType as measurementType,
           p.id as productType
    ORDER BY p.id, c.displayName
  `)

  console.log(`Loaded ${measurements.length} measurements`)
  console.log()

  const validationResults: ValidationResult[] = []

  for (const m of measurements) {
    try {
      // Baseline prediction (brixBase only)
      const baselinePrediction = Number(m.brixBase!)

      // Determine modifiers from measurement data
      const harvestTiming = determineHarvestTiming(m.cultivarId, m.harvestMonth, m.harvestPeriod)
      const growingMethod = m.measurementType === 'greenhouse' ? 'greenhouse' :
                           m.measurementType === 'field_trial' ? 'field' :
                           'field'  // Default to field for unknown

      // Map location to region
      const regionId = mapLocationToRegion(m.state, m.county, m.location)

      // Determine currentDate for late-season citrus check
      let currentDate: Date | undefined
      if (m.harvestDate) {
        currentDate = new Date(m.harvestDate)
      } else if (m.harvestYear && m.harvestMonth) {
        currentDate = new Date(m.harvestYear, m.harvestMonth - 1, 15)
      }

      // Run improved prediction with modifiers
      const prediction = predictQuality({
        cultivarId: m.cultivarId,
        regionId: regionId,
        harvestTiming: harvestTiming,
        currentDate: currentDate,
        practices: {
          growingMethod: growingMethod
        }
      })

      const improvedPrediction = prediction.predictedBrix ?? baselinePrediction
      const actual = Number(m.actualBrix)

      const baselineError = baselinePrediction - actual
      const improvedError = improvedPrediction - actual
      const improvement = Math.abs(baselineError) - Math.abs(improvedError)

      const modifiersApplied: string[] = []
      if (harvestTiming !== 'peak') modifiersApplied.push(`timing:${harvestTiming}`)
      if (growingMethod !== 'field') modifiersApplied.push(`method:${growingMethod}`)
      if (m.cultivarId.includes('powell') || m.cultivarId.includes('lane_late')) {
        const month = currentDate?.getMonth() ? currentDate.getMonth() + 1 : m.harvestMonth
        if (month === 5 || month === 6) modifiersApplied.push('late-citrus-bonus')
      }

      validationResults.push({
        cultivar: m.cultivarName,
        location: `${m.location}, ${m.state}`,
        harvestDate: m.harvestDate?.substring(0, 10) || `${m.harvestYear}-${m.harvestMonth || '??'}`,
        actualBrix: actual,
        baselinePrediction: baselinePrediction,
        improvedPrediction: improvedPrediction,
        baselineError: baselineError,
        improvedError: improvedError,
        improvement: improvement,
        harvestTiming: harvestTiming,
        growingMethod: growingMethod,
        modifiersApplied: modifiersApplied
      })
    } catch (error) {
      console.error(`Error processing ${m.cultivarName}:`, error)
    }
  }

  console.log(`Validation results: ${validationResults.length}`)
  console.log()

  // Calculate metrics for BASELINE
  const baselineAbsErrors = validationResults.map(r => Math.abs(r.baselineError))
  const baselineMae = baselineAbsErrors.reduce((sum, e) => sum + e, 0) / baselineAbsErrors.length
  const baselineWithin10 = validationResults.filter(r => Math.abs(r.baselineError) <= 1.0).length

  // Calculate metrics for IMPROVED
  const improvedAbsErrors = validationResults.map(r => Math.abs(r.improvedError))
  const improvedMae = improvedAbsErrors.reduce((sum, e) => sum + e, 0) / improvedAbsErrors.length
  const improvedWithin05 = validationResults.filter(r => Math.abs(r.improvedError) <= 0.5).length
  const improvedWithin10 = validationResults.filter(r => Math.abs(r.improvedError) <= 1.0).length
  const improvedWithin15 = validationResults.filter(r => Math.abs(r.improvedError) <= 1.5).length

  // RMSE
  const improvedMse = validationResults.reduce((sum, r) => sum + r.improvedError * r.improvedError, 0) / validationResults.length
  const improvedRmse = Math.sqrt(improvedMse)

  // R²
  const actualMean = validationResults.reduce((sum, r) => sum + r.actualBrix, 0) / validationResults.length
  const ssTot = validationResults.reduce((sum, r) => sum + Math.pow(r.actualBrix - actualMean, 2), 0)
  const ssRes = validationResults.reduce((sum, r) => sum + Math.pow(r.improvedError, 2), 0)
  const improvedR2 = 1 - (ssRes / ssTot)

  console.log('='.repeat(80))
  console.log('COMPARISON: BASELINE vs IMPROVED')
  console.log('='.repeat(80))
  console.log()

  console.log('BASELINE (cultivar brixBase only):')
  console.log(`  MAE: ${baselineMae.toFixed(2)}°Bx`)
  console.log(`  Within ±1.0°Bx: ${baselineWithin10}/${validationResults.length} (${Math.round(baselineWithin10/validationResults.length*100)}%)`)
  console.log()

  console.log('IMPROVED (with 3 new modifiers):')
  console.log(`  MAE: ${improvedMae.toFixed(2)}°Bx`)
  console.log(`  RMSE: ${improvedRmse.toFixed(2)}°Bx`)
  console.log(`  R²: ${improvedR2.toFixed(3)}`)
  console.log(`  Within ±0.5°Bx: ${improvedWithin05}/${validationResults.length} (${Math.round(improvedWithin05/validationResults.length*100)}%)`)
  console.log(`  Within ±1.0°Bx: ${improvedWithin10}/${validationResults.length} (${Math.round(improvedWithin10/validationResults.length*100)}%)`)
  console.log(`  Within ±1.5°Bx: ${improvedWithin15}/${validationResults.length} (${Math.round(improvedWithin15/validationResults.length*100)}%)`)
  console.log()

  const maeImprovement = baselineMae - improvedMae
  const accuracyImprovement = improvedWithin10 - baselineWithin10

  console.log('IMPROVEMENT:')
  console.log(`  MAE: ${baselineMae.toFixed(2)}°Bx → ${improvedMae.toFixed(2)}°Bx (${maeImprovement > 0 ? '-' : '+'}${Math.abs(maeImprovement).toFixed(2)}°Bx)`)
  console.log(`  Within ±1.0°Bx: ${baselineWithin10} → ${improvedWithin10} (+${accuracyImprovement} predictions)`)
  console.log()

  // Show examples of improvements
  console.log('='.repeat(80))
  console.log('BIGGEST IMPROVEMENTS')
  console.log('='.repeat(80))
  console.log()

  const biggestImprovements = validationResults
    .filter(r => r.improvement > 0)
    .sort((a, b) => b.improvement - a.improvement)
    .slice(0, 10)

  biggestImprovements.forEach((r, i) => {
    console.log(`${i + 1}. ${r.cultivar} | ${r.location}`)
    console.log(`   Actual: ${r.actualBrix.toFixed(1)}°Bx`)
    console.log(`   Baseline: ${r.baselinePrediction.toFixed(1)}°Bx (error: ${r.baselineError > 0 ? '+' : ''}${r.baselineError.toFixed(1)}°Bx)`)
    console.log(`   Improved: ${r.improvedPrediction.toFixed(1)}°Bx (error: ${r.improvedError > 0 ? '+' : ''}${r.improvedError.toFixed(1)}°Bx)`)
    console.log(`   Modifiers: ${r.modifiersApplied.join(', ')}`)
    console.log(`   Improvement: ${r.improvement.toFixed(1)}°Bx`)
    console.log()
  })

  // Assessment
  console.log('='.repeat(80))
  console.log('VALIDATION ASSESSMENT')
  console.log('='.repeat(80))
  console.log()

  const targetMae = 1.0
  const targetAccuracy = 0.80

  const maeStatus = improvedMae <= targetMae ? '✅' : '⚠️'
  const accuracyStatus = (improvedWithin10 / validationResults.length) >= targetAccuracy ? '✅' : '⚠️'

  console.log(`${maeStatus} MAE: ${improvedMae.toFixed(2)}°Bx (target ≤1.0°Bx)`)
  console.log(`${accuracyStatus} Accuracy: ${Math.round(improvedWithin10/validationResults.length*100)}% within ±1.0°Bx (target ≥80%)`)
  console.log()

  if (improvedMae <= targetMae && (improvedWithin10 / validationResults.length) >= targetAccuracy) {
    console.log('🎉 VALIDATION SUCCESSFUL!')
    console.log('   SHARE framework with modifiers meets accuracy targets')
    console.log('   Ready for production use')
  } else if (improvedMae < baselineMae) {
    console.log('✅ SIGNIFICANT IMPROVEMENT')
    console.log(`   MAE reduced by ${(maeImprovement/baselineMae*100).toFixed(1)}%`)
    console.log(`   Accuracy improved by ${accuracyImprovement} predictions`)
    console.log('   Further tuning recommended but model is functional')
  } else {
    console.log('⚠️ MODIFIERS NEED ADJUSTMENT')
    console.log('   Review modifier values and re-tune')
  }

  console.log()

  // Save results
  fs.writeFileSync('data/research/improved-validation-results.json', JSON.stringify({
    validation_date: new Date().toISOString(),
    model: 'improved (with timing, late-citrus, and growing method modifiers)',
    sample_size: validationResults.length,
    baseline_metrics: {
      mae: parseFloat(baselineMae.toFixed(2)),
      within_10_bx: baselineWithin10,
      within_10_pct: Math.round(baselineWithin10/validationResults.length*100)
    },
    improved_metrics: {
      mae: parseFloat(improvedMae.toFixed(2)),
      rmse: parseFloat(improvedRmse.toFixed(2)),
      r2: parseFloat(improvedR2.toFixed(3)),
      within_05_bx: improvedWithin05,
      within_10_bx: improvedWithin10,
      within_15_bx: improvedWithin15,
      within_05_pct: Math.round(improvedWithin05/validationResults.length*100),
      within_10_pct: Math.round(improvedWithin10/validationResults.length*100),
      within_15_pct: Math.round(improvedWithin15/validationResults.length*100)
    },
    improvement: {
      mae_reduction: parseFloat(maeImprovement.toFixed(2)),
      mae_reduction_pct: parseFloat((maeImprovement/baselineMae*100).toFixed(1)),
      accuracy_gain: accuracyImprovement
    },
    results: validationResults
  }, null, 2))

  console.log('Results saved to: data/research/improved-validation-results.json')
  console.log()

  await closeDriver()
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
