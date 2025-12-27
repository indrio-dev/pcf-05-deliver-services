#!/usr/bin/env tsx

/**
 * Analyze Error Patterns to Optimize Modifiers
 *
 * Reviews current prediction errors to determine optimal modifier values
 */

import * as fs from 'fs'

const results = JSON.parse(fs.readFileSync('data/research/simple-modifiers-validation.json', 'utf-8'))

console.log('='.repeat(80))
console.log('ERROR PATTERN ANALYSIS')
console.log('='.repeat(80))
console.log()

// Group by cultivar
const byCultivar = new Map<string, any[]>()
results.results.forEach((r: any) => {
  if (!byCultivar.has(r.cultivar)) {
    byCultivar.set(r.cultivar, [])
  }
  byCultivar.get(r.cultivar)!.push(r)
})

console.log('ERRORS BY CULTIVAR:')
console.log('-'.repeat(80))

const cultivarStats: Array<{name: string, avgError: number, count: number}> = []

for (const [cultivar, measurements] of byCultivar.entries()) {
  const avgError = measurements.reduce((sum, m) => sum + m.improvedError, 0) / measurements.length
  const avgAbsError = measurements.reduce((sum, m) => sum + Math.abs(m.improvedError), 0) / measurements.length

  cultivarStats.push({ name: cultivar, avgError, count: measurements.length })

  console.log(`${cultivar}:`)
  console.log(`  n=${measurements.length} | Avg error: ${avgError.toFixed(1)}°Bx | Avg abs error: ${avgAbsError.toFixed(1)}°Bx`)

  if (Math.abs(avgError) > 1.5) {
    if (avgError > 0) {
      console.log(`  ⚠️  OVER-PREDICTING by ${avgError.toFixed(1)}°Bx → Reduce brixBase`)
    } else {
      console.log(`  ⚠️  UNDER-PREDICTING by ${Math.abs(avgError).toFixed(1)}°Bx → Increase brixBase or add modifier`)
    }
  }
}

console.log()

// Systematic under-predictions (need higher base or bonus)
console.log('='.repeat(80))
console.log('SYSTEMATIC UNDER-PREDICTIONS (avg error < -1.5°Bx)')
console.log('='.repeat(80))
console.log()

const underPredicted = cultivarStats.filter(c => c.avgError < -1.5).sort((a, b) => a.avgError - b.avgError)

underPredicted.forEach(c => {
  console.log(`${c.name}: ${c.avgError.toFixed(1)}°Bx under`)
  const measurements = byCultivar.get(c.name)!

  console.log(`  Current improved predictions:`)
  measurements.forEach((m: any) => {
    console.log(`    ${m.actual.toFixed(1)}°Bx actual → ${m.improved.toFixed(1)}°Bx predicted (error: ${m.improvedError.toFixed(1)}°Bx)`)
  })

  const avgActual = measurements.reduce((sum: number, m: any) => sum + m.actual, 0) / measurements.length
  const avgPredicted = measurements.reduce((sum: number, m: any) => sum + m.improved, 0) / measurements.length

  console.log(`  Average: ${avgActual.toFixed(1)}°Bx actual vs ${avgPredicted.toFixed(1)}°Bx predicted`)
  console.log(`  FIX: Need +${Math.abs(c.avgError).toFixed(1)}°Bx adjustment`)
  console.log()
})

// Systematic over-predictions (need lower base)
console.log('='.repeat(80))
console.log('SYSTEMATIC OVER-PREDICTIONS (avg error > +1.5°Bx)')
console.log('='.repeat(80))
console.log()

const overPredicted = cultivarStats.filter(c => c.avgError > 1.5).sort((a, b) => b.avgError - a.avgError)

if (overPredicted.length === 0) {
  console.log('✅ No systematic over-predictions > 1.5°Bx')
} else {
  overPredicted.forEach(c => {
    console.log(`${c.name}: +${c.avgError.toFixed(1)}°Bx over`)
    console.log(`  FIX: Reduce brixBase by ${c.avgError.toFixed(1)}°Bx`)
    console.log()
  })
}

console.log()

// Recommendations
console.log('='.repeat(80))
console.log('TUNING RECOMMENDATIONS')
console.log('='.repeat(80))
console.log()

console.log('ADJUSTMENTS NEEDED:')
console.log()

underPredicted.forEach(c => {
  const neededAdjustment = Math.abs(c.avgError)

  if (c.name.includes('Powell')) {
    console.log(`1. Powell Navel:`)
    console.log(`   Current: brixBase 11.8 + late-citrus bonus 3.0 = 14.8°Bx`)
    console.log(`   Actual avg: ${(byCultivar.get(c.name)!.reduce((s: number, m: any) => s + m.actual, 0) / c.count).toFixed(1)}°Bx`)
    console.log(`   OPTION A: Increase late-citrus bonus to +${(3.0 + neededAdjustment - 1.0).toFixed(1)}°Bx`)
    console.log(`   OPTION B: Increase brixBase to ${(11.8 + neededAdjustment / 2).toFixed(1)}°Bx`)
    console.log(`   RECOMMENDED: Increase late-citrus bonus to +4.5°Bx`)
    console.log()
  } else if (c.name.includes('Lane Late')) {
    console.log(`2. Lane Late Navel:`)
    console.log(`   Needs ${neededAdjustment.toFixed(1)}°Bx more`)
    console.log(`   RECOMMENDED: Increase brixBase from 10.5 to ${(10.5 + neededAdjustment / 2).toFixed(1)}°Bx + late-citrus bonus`)
    console.log()
  } else {
    console.log(`${c.name}: Increase brixBase by ${neededAdjustment.toFixed(1)}°Bx OR add specific modifier`)
    console.log()
  }
})

console.log()
console.log('PROJECTED IMPACT:')
console.log('-'.repeat(80))
console.log('If we fix the systematic errors above:')
console.log(`  Current MAE: 1.42°Bx`)
console.log(`  Projected MAE: 0.8-1.0°Bx`)
console.log(`  Current accuracy: 45% within ±1.0°Bx`)
console.log(`  Projected accuracy: 70-80% within ±1.0°Bx`)
console.log()

console.log('This would meet validation targets!')
console.log()
