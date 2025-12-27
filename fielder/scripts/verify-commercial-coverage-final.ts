#!/usr/bin/env tsx

/**
 * Verify Commercial Coverage - Final Report
 *
 * Shows commercial market coverage across all major products
 * after systematic gap filling
 */

import { runQuery, closeDriver } from '../src/lib/graph/index'

async function main() {
  console.log('='.repeat(80))
  console.log('COMMERCIAL COVERAGE - FINAL VERIFICATION')
  console.log('='.repeat(80))
  console.log()

  // Total cultivars
  const totals = await runQuery<{
    total: number
    linked: number
    massMarket: number
    commercial: number
  }>(`
    MATCH (c:Cultivar)
    WITH count(c) as total
    MATCH (c2:Cultivar)-[:BELONGS_TO_VARIETY]->(:Variety)
    WITH total, count(c2) as linked
    MATCH (c3:Cultivar) WHERE c3.marketTier = 'mass_market'
    WITH total, linked, count(c3) as massMarket
    MATCH (c4:Cultivar) WHERE c4.marketTier IN ['mass_market', 'commercial']
    RETURN total, linked, massMarket, count(c4) as commercial
  `)

  const t = totals[0]
  console.log('OVERALL STATISTICS:')
  console.log('-'.repeat(80))
  console.log(`Total Cultivars:              ${t.total}`)
  console.log(`Linked to Varieties:          ${t.linked}`)
  console.log(`Mass Market (🏪):             ${t.massMarket}`)
  console.log(`Mass Market + Commercial:     ${t.commercial}`)
  console.log()

  const commercialPct = Math.round(Number(t.commercial) / Number(t.linked) * 100)
  console.log(`Commercial Coverage: ${commercialPct}% of linked cultivars`)
  console.log()

  // By product type
  console.log('='.repeat(80))
  console.log('COMMERCIAL COVERAGE BY PRODUCT')
  console.log('='.repeat(80))
  console.log()

  const byProduct = await runQuery<{
    productType: string
    totalCultivars: number
    massMarket: number
    commercial: number
  }>(`
    MATCH (c:Cultivar)-[:IS_A]->(p:ProductType)
    WITH p.id as productType, count(c) as totalCultivars
    MATCH (c2:Cultivar)-[:IS_A]->(p2:ProductType {id: productType})
    WHERE c2.marketTier = 'mass_market'
    WITH productType, totalCultivars, count(c2) as massMarket
    MATCH (c3:Cultivar)-[:IS_A]->(p3:ProductType {id: productType})
    WHERE c3.marketTier IN ['mass_market', 'commercial']
    WITH productType, totalCultivars, massMarket, count(c3) as commercial
    WHERE totalCultivars >= 5
    RETURN productType, totalCultivars, massMarket, commercial
    ORDER BY commercial DESC, productType
  `)

  byProduct.forEach(p => {
    const commPct = Math.round(Number(p.commercial) / Number(p.totalCultivars) * 100)
    const status = commPct >= 70 ? '✅' : commPct >= 50 ? '⚠️' : '❌'

    console.log(`${status} ${p.productType.padEnd(15)} ${String(p.totalCultivars).padStart(3)} cultivars | 🏪 ${String(p.massMarket).padStart(2)} | 🛒 ${String(p.commercial).padStart(3)} (${commPct}%)`)
  })

  console.log()
  console.log('Legend: 🏪 = Mass Market | 🛒 = Mass Market + Commercial')
  console.log()

  // Key products assessment
  console.log('='.repeat(80))
  console.log('KEY PRODUCT ASSESSMENT (Consumer-facing priorities)')
  console.log('='.repeat(80))
  console.log()

  const keyProducts = ['strawberry', 'apple', 'orange', 'tomato', 'potato', 'lettuce',
                       'pepper', 'cherry', 'peach', 'blueberry', 'raspberry', 'plum']

  for (const productId of keyProducts) {
    const data = byProduct.find(p => p.productType === productId)
    if (data) {
      const commPct = Math.round(Number(data.commercial) / Number(data.totalCultivars) * 100)
      const status = commPct >= 80 ? '✅ EXCELLENT' :
                     commPct >= 70 ? '✅ GOOD' :
                     commPct >= 60 ? '⚠️ MODERATE' : '❌ NEEDS WORK'

      console.log(`${productId.toUpperCase()}:`)
      console.log(`  ${status} - ${commPct}% commercial coverage`)
      console.log(`  Total: ${data.totalCultivars} cultivars (${data.massMarket} mass-market, ${Number(data.commercial) - Number(data.massMarket)} commercial)`)
      console.log()
    }
  }

  console.log('='.repeat(80))
  console.log('SUMMARY')
  console.log('='.repeat(80))
  console.log()

  const excellentCount = byProduct.filter(p => Number(p.commercial) / Number(p.totalCultivars) >= 0.8).length
  const goodCount = byProduct.filter(p => {
    const pct = Number(p.commercial) / Number(p.totalCultivars)
    return pct >= 0.7 && pct < 0.8
  }).length
  const needsWork = byProduct.filter(p => Number(p.commercial) / Number(p.totalCultivars) < 0.7).length

  console.log(`Products with ≥80% commercial coverage: ${excellentCount} ✅`)
  console.log(`Products with 70-79% coverage: ${goodCount} ✅`)
  console.log(`Products needing more commercial depth: ${needsWork} ⚠️`)
  console.log()

  console.log('OVERALL COMMERCIAL READINESS:')
  if (excellentCount + goodCount >= byProduct.length * 0.8) {
    console.log('  ✅ READY FOR VALIDATION')
    console.log('  → Commercial coverage sufficient to validate SHARE model with published research')
    console.log('  → Can now collect measurement data from university trials')
  } else {
    console.log('  ⚠️ MORE COMMERCIAL VARIETIES NEEDED')
    console.log('  → Continue adding commercial cultivars for major products')
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
