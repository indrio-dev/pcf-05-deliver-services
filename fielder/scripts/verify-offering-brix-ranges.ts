#!/usr/bin/env tsx
import { runWriteTransaction, closeDriver } from '../src/lib/graph/index'

/**
 * Verify Brix ranges on GROWN_IN relationships
 * Demonstrates E (Enrich) pillar quality queries
 */

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗')
  console.log('║  VERIFY BRIX RANGES ON REGIONAL OFFERINGS              ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  // Query 1: Statistics
  console.log('Query 1: Brix Data Coverage Statistics')
  console.log('─────────────────────────────────────────────────────────\n')

  const statsQuery = `
    MATCH (c:Cultivar)-[g:GROWN_IN]->(r:GrowingRegion)
    WITH count(g) as total,
         count(g.brix_expected) as hasBrix
    RETURN total,
           hasBrix,
           (total - hasBrix) as noBrix,
           round(100.0 * hasBrix / total) as pctCoverage
  `

  const stats = await runWriteTransaction(statsQuery, {})

  if (stats.length > 0) {
    const s = stats[0]
    console.log(`Total GROWN_IN relationships: ${s.total}`)
    console.log(`With Brix data: ${s.hasBrix} (${s.pctCoverage}%)`)
    console.log(`Without Brix data: ${s.noBrix}`)
  }

  // Query 2: Brix range statistics
  console.log('\n\nQuery 2: Brix Range Statistics')
  console.log('─────────────────────────────────────────────────────────\n')

  const rangeStatsQuery = `
    MATCH ()-[g:GROWN_IN]->()
    WHERE g.brix_expected IS NOT NULL
    RETURN min(g.brix_expected) as minBrix,
           max(g.brix_expected) as maxBrix,
           avg(g.brix_expected) as avgBrix,
           min(g.brix_min) as overallMin,
           max(g.brix_max) as overallMax
  `

  const rangeStats = await runWriteTransaction(rangeStatsQuery, {})

  if (rangeStats.length > 0) {
    const s = rangeStats[0]
    console.log(`Expected Brix Range: ${s.minBrix}°Bx - ${s.maxBrix}°Bx`)
    console.log(`Average Expected: ${Math.round(s.avgBrix * 10) / 10}°Bx`)
    console.log(`Overall Min-Max: ${s.overallMin}°Bx - ${s.overallMax}°Bx`)
  }

  // Query 3: Premium quality by Brix (14+ expected)
  console.log('\n\nQuery 3: Premium Quality Offerings (14+ Brix Expected)')
  console.log('─────────────────────────────────────────────────────────\n')

  const premiumQuery = `
    MATCH (c:Cultivar)-[g:GROWN_IN]->(r:GrowingRegion)
    WHERE g.brix_expected >= 14
    RETURN c.displayName as cultivar,
           r.displayName as region,
           r.state as state,
           g.brix_expected as brix,
           g.quality_tier as tier
    ORDER BY g.brix_expected DESC
    LIMIT 15
  `

  const premium = await runWriteTransaction(premiumQuery, {})

  for (const row of premium) {
    console.log(`  • ${row.cultivar} from ${row.region}, ${row.state}`)
    console.log(`    ${row.brix}°Bx (${row.tier})`)
  }

  // Query 4: Compare same cultivar across regions
  console.log('\n\nQuery 4: Regional Terroir Effect (Navel Orange)')
  console.log('─────────────────────────────────────────────────────────\n')

  const terroirQuery = `
    MATCH (c:Cultivar {id: 'navel_orange'})-[g:GROWN_IN]->(r:GrowingRegion)
    WHERE g.brix_expected IS NOT NULL
    RETURN r.displayName as region,
           r.state as state,
           g.brix_expected as brix,
           g.brix_min as min,
           g.brix_max as max,
           g.quality_tier as tier
    ORDER BY g.brix_expected DESC
    LIMIT 12
  `

  const terroir = await runWriteTransaction(terroirQuery, {})

  for (const row of terroir) {
    console.log(`  • ${row.region}, ${row.state}`)
    console.log(`    Expected: ${row.brix}°Bx  Range: ${row.min}-${row.max}°Bx  (${row.tier})`)
  }

  // Query 5: Find exceptional quality offerings
  console.log('\n\nQuery 5: Exceptional Quality Offerings')
  console.log('(Quality tier = exceptional, highest Brix potential)')
  console.log('─────────────────────────────────────────────────────────\n')

  const exceptionalQuery = `
    MATCH (c:Cultivar)-[g:GROWN_IN]->(r:GrowingRegion)
    WHERE g.quality_tier = 'exceptional'
      AND g.brix_expected IS NOT NULL
    RETURN c.displayName as cultivar,
           r.displayName as region,
           g.brix_expected as brix,
           g.brix_max as maxPotential
    ORDER BY g.brix_expected DESC
    LIMIT 15
  `

  const exceptional = await runWriteTransaction(exceptionalQuery, {})

  for (const row of exceptional) {
    console.log(`  • ${row.cultivar} from ${row.region}`)
    console.log(`    Expected: ${row.brix}°Bx  Max potential: ${row.maxPotential}°Bx`)
  }

  // Query 6: Citrus comparison
  console.log('\n\nQuery 6: Citrus Brix Comparison')
  console.log('─────────────────────────────────────────────────────────\n')

  const citrusQuery = `
    MATCH (c:Cultivar)-[g:GROWN_IN]->(r:GrowingRegion)
    WHERE c.productId IN ['orange', 'grapefruit', 'lemon', 'tangerine']
      AND g.brix_expected IS NOT NULL
    WITH c.productId as product,
         c.displayName as cultivar,
         avg(g.brix_expected) as avgBrix,
         min(g.brix_expected) as minBrix,
         max(g.brix_expected) as maxBrix
    RETURN product, cultivar, avgBrix, minBrix, maxBrix
    ORDER BY avgBrix DESC
    LIMIT 20
  `

  const citrus = await runWriteTransaction(citrusQuery, {})

  for (const row of citrus) {
    console.log(`  • ${row.cultivar} (${row.product})`)
    console.log(`    Avg: ${Math.round(row.avgBrix * 10) / 10}°Bx  Range: ${row.minBrix}-${row.maxBrix}°Bx`)
  }

  // Query 7: Cross-pillar SHARE with Brix (H×S×R×E)
  console.log('\n\nQuery 7: Complete SHARE Query with Brix')
  console.log('(Heritage apples in high-chill regions with 14+ Brix)')
  console.log('─────────────────────────────────────────────────────────\n')

  const shareQuery = `
    MATCH (c:Cultivar)-[g:GROWN_IN]->(r:GrowingRegion)
    WHERE c.isHeritage = true
      AND c.productId = 'apple'
      AND r.avgChillHours >= 800
      AND g.brix_expected >= 14
    RETURN c.displayName as cultivar,
           r.displayName as region,
           r.avgChillHours as chill,
           g.brix_expected as brix,
           g.quality_tier as tier
    ORDER BY g.brix_expected DESC
    LIMIT 10
  `

  const share = await runWriteTransaction(shareQuery, {})

  if (share.length > 0) {
    for (const row of share) {
      console.log(`  • ${row.cultivar} from ${row.region}`)
      console.log(`    Brix: ${row.brix}°Bx, Chill: ${row.chill} hrs (${row.tier})`)
    }
  } else {
    console.log('  (No matches - may need to verify isHeritage flags on apples)')
  }

  // Query 8: Find offerings by Brix threshold
  console.log('\n\nQuery 8: Super Sweet Offerings (15+ Brix)')
  console.log('─────────────────────────────────────────────────────────\n')

  const sweetQuery = `
    MATCH (c:Cultivar)-[g:GROWN_IN]->(r:GrowingRegion)
    WHERE g.brix_expected >= 15
    RETURN c.displayName as cultivar,
           c.productId as product,
           r.displayName as region,
           g.brix_expected as brix
    ORDER BY g.brix_expected DESC
    LIMIT 20
  `

  const sweet = await runWriteTransaction(sweetQuery, {})

  for (const row of sweet) {
    console.log(`  • ${row.cultivar} (${row.product}) - ${row.region}`)
    console.log(`    ${row.brix}°Bx`)
  }

  console.log('\n╔════════════════════════════════════════════════════════╗')
  console.log('║  BRIX VERIFICATION COMPLETE                            ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  await closeDriver()
}

main().catch(console.error)
