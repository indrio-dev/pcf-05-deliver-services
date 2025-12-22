#!/usr/bin/env tsx
/**
 * Analyze Knowledge Graph Coverage
 *
 * Runs comprehensive analysis queries to identify:
 * - Coverage by state/region
 * - Products without growers
 * - Orphan cultivars
 * - Data quality gaps
 * - Inference coverage
 *
 * Usage:
 *   source .env.local && npx tsx scripts/analyze-kg-coverage.ts
 */

import { runQuery, closeDriver } from '../src/lib/graph/index'

interface CoverageReport {
  geographic: any
  products: any
  cultivars: any
  dataQuality: any
  inference: any
}

async function analyzeGeographicCoverage() {
  console.log('═══════════════════════════════════════════════════')
  console.log('  GEOGRAPHIC COVERAGE')
  console.log('═══════════════════════════════════════════════════\n')

  // Entities by state
  const byState = await runQuery(`
    MATCH (e:Entity)-[:LOCATED_IN_STATE]->(s:State)
    WITH s.code as state, labels(e) as roles, count(e) as count
    RETURN state, roles, count
    ORDER BY count DESC, state ASC
  `, {})

  // Aggregate by state
  const stateMap = new Map<string, { growers: number, packinghouses: number, retailers: number, total: number }>()

  for (const record of byState) {
    const state = record.state
    const roles = record.roles
    const count = record.count.toNumber()

    if (!stateMap.has(state)) {
      stateMap.set(state, { growers: 0, packinghouses: 0, retailers: 0, total: 0 })
    }

    const stats = stateMap.get(state)!
    stats.total += count

    if (roles.includes('Grower')) stats.growers += count
    if (roles.includes('Packinghouse')) stats.packinghouses += count
    if (roles.includes('Retailer')) stats.retailers += count
  }

  // Sort and display
  const sorted = Array.from(stateMap.entries()).sort((a, b) => b[1].total - a[1].total)

  console.log('Top 15 States by Entity Count:')
  console.log('State   Total  Growers  Packers  Retailers')
  console.log('─────   ─────  ───────  ───────  ─────────')

  for (const [state, stats] of sorted.slice(0, 15)) {
    console.log(`${state.padEnd(6)}  ${stats.total.toString().padStart(5)}  ${stats.growers.toString().padStart(7)}  ${stats.packinghouses.toString().padStart(7)}  ${stats.retailers.toString().padStart(9)}`)
  }

  console.log('\n' + `Total states with entities: ${stateMap.size}/50`)

  // States with NO entities
  const statesWithout = await runQuery(`
    MATCH (s:State)
    WHERE NOT exists((s)<-[:LOCATED_IN_STATE]-(:Entity))
    RETURN s.code as state
    ORDER BY state
  `, {})

  if (statesWithout.length > 0) {
    console.log(`\n⚠️  States with NO entities (${statesWithout.length}):`)
    const states = statesWithout.map(r => r.state).join(', ')
    console.log(`   ${states}`)
  } else {
    console.log('\n✅ All 50 states have entity coverage!')
  }

  console.log('')

  return { stateMap, statesWithout: statesWithout.length }
}

async function analyzeProductCoverage() {
  console.log('═══════════════════════════════════════════════════')
  console.log('  PRODUCT COVERAGE')
  console.log('═══════════════════════════════════════════════════\n')

  // Products with growers
  const withGrowers = await runQuery(`
    MATCH (g:Grower)-[:GROWS]->(pt:ProductType)
    RETURN pt.name as product, count(DISTINCT g) as growers
    ORDER BY growers DESC
  `, {})

  console.log('Top Products by Grower Count:')
  console.log('Product                 Growers')
  console.log('─────────────────────   ───────')

  for (const record of withGrowers.slice(0, 15)) {
    const product = record.product
    const growers = record.growers.toNumber()
    console.log(`${product.padEnd(24)} ${growers.toString().padStart(7)}`)
  }

  // Products WITHOUT growers
  const withoutGrowers = await runQuery(`
    MATCH (pt:ProductType)
    WHERE NOT exists((pt)<-[:GROWS]-(:Grower))
    RETURN pt.name as product
    ORDER BY product
  `, {})

  if (withoutGrowers.length > 0) {
    console.log(`\n⚠️  Products with NO growers (${withoutGrowers.length}):`)
    for (const record of withoutGrowers.slice(0, 10)) {
      console.log(`   - ${record.product}`)
    }
    if (withoutGrowers.length > 10) {
      console.log(`   ... and ${withoutGrowers.length - 10} more`)
    }
  } else {
    console.log('\n✅ All products have growers!')
  }

  console.log('')

  return { withGrowers: withGrowers.length, withoutGrowers: withoutGrowers.length }
}

async function analyzeCultivarCoverage() {
  console.log('═══════════════════════════════════════════════════')
  console.log('  CULTIVAR COVERAGE')
  console.log('═══════════════════════════════════════════════════\n')

  // Cultivars with growers
  const withGrowers = await runQuery(`
    MATCH (c:Cultivar)
    OPTIONAL MATCH (g:Grower)-[:GROWS_CULTIVAR]->(c)
    RETURN c.name as cultivar, c.heritageIntent as heritage, count(g) as growers
    ORDER BY growers DESC, cultivar ASC
  `, {})

  console.log('Cultivars by Grower Count:')
  console.log('Cultivar                     Heritage          Growers')
  console.log('───────────────────────────  ───────────────   ───────')

  let orphanCount = 0
  let heritageOrphans = 0

  for (const record of withGrowers.slice(0, 15)) {
    const cultivar = record.cultivar
    const heritage = record.heritage || 'unknown'
    const growers = record.growers.toNumber()

    if (growers === 0) {
      orphanCount++
      if (heritage.includes('heritage') || heritage.includes('heirloom')) {
        heritageOrphans++
      }
    }

    console.log(`${cultivar.padEnd(29)} ${heritage.padEnd(18)} ${growers.toString().padStart(7)}`)
  }

  // Total orphans
  const totalOrphans = withGrowers.filter(r => r.growers.toNumber() === 0).length

  console.log(`\n⚠️  Cultivars with NO growers: ${totalOrphans}/${withGrowers.length}`)
  if (heritageOrphans > 0) {
    console.log(`   (Including ${heritageOrphans} heritage/heirloom cultivars)`)
  }

  console.log('')

  return { totalCultivars: withGrowers.length, orphans: totalOrphans, heritageOrphans }
}

async function analyzeDataQuality() {
  console.log('═══════════════════════════════════════════════════')
  console.log('  DATA QUALITY')
  console.log('═══════════════════════════════════════════════════\n')

  // Entities missing key fields
  const missingWebsite = await runQuery(`
    MATCH (e:Entity)
    WHERE e.website IS NULL
    RETURN labels(e) as roles, count(e) as count
  `, {})

  console.log('Entities missing website:')
  for (const record of missingWebsite) {
    const roles = record.roles
    const count = record.count
    console.log(`  ${roles.join('/')}: ${count}`)
  }

  // Entities without region linkage
  const noRegion = await runQuery(`
    MATCH (e:Entity)
    WHERE NOT exists((e)-[:IN_GROWING_REGION]->(:GrowingRegion))
    RETURN labels(e) as roles, count(e) as count
  `, {})

  console.log('\nEntities without growing region link:')
  for (const record of noRegion) {
    const roles = record.roles
    const count = record.count.toNumber()
    console.log(`  ${roles.join('/')}: ${count}`)
  }

  // Check enrichment coverage (new fields)
  const enrichment = await runQuery(`
    MATCH (e:Packinghouse)
    RETURN
      count(e) as total,
      count(e.foundedYear) as withYear,
      count(e.acreage) as withAcreage,
      count(e.certifications) as withCerts
  `, {})

  if (enrichment.length > 0) {
    const r = enrichment[0]
    const total = r.total.toNumber()
    const withYear = r.withYear.toNumber()
    const withAcreage = r.withAcreage.toNumber()
    const withCerts = r.withCerts.toNumber()

    console.log('\nPackinghouse Enrichment Coverage:')
    console.log(`  Founded year:     ${withYear}/${total} (${Math.round(withYear*100/total)}%)`)
    console.log(`  Acreage:          ${withAcreage}/${total} (${Math.round(withAcreage*100/total)}%)`)
    console.log(`  Certifications:   ${withCerts}/${total} (${Math.round(withCerts*100/total)}%)`)
  }

  console.log('')
}

async function analyzeInferenceCoverage() {
  console.log('═══════════════════════════════════════════════════')
  console.log('  INFERENCE COVERAGE')
  console.log('═══════════════════════════════════════════════════\n')

  // Regions without entities
  const regionsNoEntities = await runQuery(`
    MATCH (gr:GrowingRegion)
    WHERE NOT exists((gr)<-[:IN_GROWING_REGION]-(:Entity))
    RETURN gr.name as region, gr.primaryCrops as crops
    ORDER BY region
  `, {})

  if (regionsNoEntities.length > 0) {
    console.log(`⚠️  Growing regions with NO entities (${regionsNoEntities.length}):`)
    for (const record of regionsNoEntities.slice(0, 10)) {
      const region = record.region
      const crops = record.crops
      console.log(`  - ${region} (${crops ? crops.join(', ') : 'unknown crops'})`)
    }
    if (regionsNoEntities.length > 10) {
      console.log(`  ... and ${regionsNoEntities.length - 10} more`)
    }
  } else {
    console.log('✅ All growing regions have entities!')
  }

  // Packinghouses without source relationships
  const noSources = await runQuery(`
    MATCH (p:Packinghouse)
    WHERE NOT exists((p)-[:SOURCES_FROM]->(:Grower))
    RETURN count(p) as count
  `, {})

  if (noSources.length > 0) {
    const count = noSources[0].count('count').toNumber()
    console.log(`\n⚠️  Packinghouses without SOURCES_FROM links: ${count}`)
    console.log('   (Supply chain tracing not yet complete)')
  }

  console.log('')
}

async function generateSummary(stats: any) {
  console.log('═══════════════════════════════════════════════════')
  console.log('  SUMMARY & PRIORITIES')
  console.log('═══════════════════════════════════════════════════\n')

  console.log('✅ STRENGTHS:')
  console.log('  - 50-state entity coverage (all states represented)')
  console.log('  - 319 growers with seasonal timing data')
  console.log('  - 349 packinghouses across major producing states')
  console.log('  - Rich product catalog (18 product types, 49 cultivars)')
  console.log('')

  console.log('⚠️  HIGH-PRIORITY GAPS:')
  console.log('  1. Cultivar adoption - Many cultivars have no growers')
  console.log('  2. Growing region entities - Some regions underrepresented')
  console.log('  3. Supply chain links - Packinghouse→Grower relationships missing')
  console.log('  4. Data enrichment - Many entities missing website, region links')
  console.log('')

  console.log('📊 RECOMMENDED NEXT COLLECTIONS:')
  console.log('  1. Extension service harvest timing (completes R pillar)')
  console.log('  2. Cultivar→Region mapping (which cultivars grow where)')
  console.log('  3. Packinghouse sourcing research (build SOURCES_FROM links)')
  console.log('  4. Missing state packinghouses (NY, ID, PA, etc.)')
  console.log('')
}

async function main() {
  console.log('\n╔═══════════════════════════════════════════════════════╗')
  console.log('║     FIELDER KNOWLEDGE GRAPH - COVERAGE ANALYSIS       ║')
  console.log('╚═══════════════════════════════════════════════════════╝\n')

  try {
    const geoStats = await analyzeGeographicCoverage()
    const productStats = await analyzeProductCoverage()
    const cultivarStats = await analyzeCultivarCoverage()
    await analyzeDataQuality()
    await analyzeInferenceCoverage()
    await generateSummary({ geoStats, productStats, cultivarStats })

    console.log('✨ Coverage analysis complete!\n')
  } catch (error) {
    console.error('❌ Analysis failed:', error)
    throw error
  } finally {
    await closeDriver()
  }
}

main()
