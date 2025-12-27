#!/usr/bin/env tsx

/**
 * Measurement Dataset Summary
 *
 * Shows complete measurement coverage across all products
 */

import { runQuery, closeDriver } from '../src/lib/graph/index'

async function main() {
  console.log('='.repeat(80))
  console.log('COMPLETE MEASUREMENT DATASET SUMMARY')
  console.log('='.repeat(80))
  console.log()

  // Total measurements by source
  const bySource = await runQuery<{
    dataSource: string
    count: number
  }>(`
    MATCH (m:Measurement)
    WHERE m.dataSource IS NOT NULL
    RETURN m.dataSource as dataSource, count(m) as count
    ORDER BY count DESC
  `)

  console.log('MEASUREMENTS BY DATA SOURCE:')
  console.log('-'.repeat(80))

  let universityTotal = 0
  bySource.forEach(s => {
    const count = Number(s.count)
    console.log(`${s.dataSource.padEnd(30)} ${String(count).padStart(5)} measurements`)

    if (s.dataSource.includes('validated') || s.dataSource.includes('_uga_') ||
        s.dataSource.includes('_msu') || s.dataSource.includes('_tamu') ||
        s.dataSource.includes('_wsu') || s.dataSource.includes('_uf_')) {
      universityTotal += count
    }
  })

  console.log()
  console.log(`University trial total: ${universityTotal}`)
  console.log()

  // By product type
  const byProduct = await runQuery<{
    productType: string
    measurementCount: number
    cultivarCount: number
  }>(`
    MATCH (m:Measurement)-[:MEASURED_ON]->(c:Cultivar)-[:IS_A]->(p:ProductType)
    WHERE m.dataSource CONTAINS 'validated' OR
          m.dataSource CONTAINS '_uga_' OR m.dataSource CONTAINS '_msu' OR
          m.dataSource CONTAINS '_tamu' OR m.dataSource CONTAINS '_wsu' OR
          m.dataSource CONTAINS '_uf_'
    RETURN p.id as productType,
           count(m) as measurementCount,
           count(DISTINCT c) as cultivarCount
    ORDER BY measurementCount DESC
  `)

  console.log('UNIVERSITY MEASUREMENTS BY PRODUCT:')
  console.log('-'.repeat(80))

  byProduct.forEach(p => {
    console.log(`${p.productType.padEnd(20)} ${String(p.measurementCount).padStart(3)} measurements, ${String(p.cultivarCount).padStart(2)} cultivars`)
  })

  console.log()

  // Geographic coverage
  const byState = await runQuery<{
    state: string
    count: number
  }>(`
    MATCH (m:Measurement)
    WHERE m.dataSource CONTAINS 'validated' OR
          m.dataSource CONTAINS '_uga_' OR m.dataSource CONTAINS '_msu' OR
          m.dataSource CONTAINS '_tamu' OR m.dataSource CONTAINS '_wsu' OR
          m.dataSource CONTAINS '_uf_'
      AND m.state IS NOT NULL
    RETURN m.state as state, count(m) as count
    ORDER BY count DESC
  `)

  console.log('GEOGRAPHIC COVERAGE:')
  console.log('-'.repeat(80))

  byState.forEach(s => {
    console.log(`${s.state.padEnd(10)} ${String(s.count).padStart(3)} measurements`)
  })

  console.log()

  // Coverage assessment
  console.log('='.repeat(80))
  console.log('VALIDATION DATASET STATUS')
  console.log('='.repeat(80))
  console.log()

  console.log(`Total university measurements: ${universityTotal}`)
  console.log(`Products covered: ${byProduct.length}`)
  console.log(`States covered: ${byState.length}`)
  console.log()

  if (universityTotal >= 100) {
    console.log('✅ EXCELLENT - 100+ measurements for robust validation')
  } else if (universityTotal >= 50) {
    console.log('✅ GOOD - 50+ measurements for validation')
  } else {
    console.log('⚠️  LIMITED - Need more measurements for robust validation')
  }

  console.log()

  await closeDriver()
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
