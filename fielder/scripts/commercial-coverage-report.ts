#!/usr/bin/env tsx

/**
 * Commercial Coverage Report
 *
 * Shows market coverage by variety with tier breakdown
 */

import { runQuery, closeDriver } from '../src/lib/graph/index'

async function main() {
  console.log('='.repeat(80))
  console.log('COMMERCIAL MARKET COVERAGE REPORT')
  console.log('='.repeat(80))
  console.log()

  // Get cultivars with market tier data
  const withTiers = await runQuery<{
    productType: string
    varietyName: string
    cultivarName: string
    marketTier: string
    marketShare: string
  }>(`
    MATCH (c:Cultivar)-[:BELONGS_TO_VARIETY]->(v:Variety)-[:BELONGS_TO_PRODUCT]->(p:ProductType)
    WHERE c.marketTier IS NOT NULL
    RETURN p.id as productType,
           COALESCE(v.displayName, v.name, v.id) as varietyName,
           c.displayName as cultivarName,
           c.marketTier as marketTier,
           c.estimatedMarketShare as marketShare
    ORDER BY productType, varietyName,
             CASE c.marketTier
               WHEN 'mass_market' THEN 1
               WHEN 'commercial' THEN 2
               WHEN 'regional' THEN 3
               WHEN 'specialty' THEN 4
               ELSE 5
             END
  `)

  if (withTiers.length === 0) {
    console.log('⚠️  No cultivars have market tier data yet')
    console.log()
    console.log('Run add-market-tier-data.ts or add-missing-commercial-cultivars.ts first')
    console.log()
    return
  }

  console.log(`Cultivars with market data: ${withTiers.length}`)
  console.log()

  // Group by product type
  let currentProduct = ''
  let currentVariety = ''

  withTiers.forEach(c => {
    if (c.productType !== currentProduct) {
      console.log()
      console.log('='.repeat(80))
      console.log(`${c.productType.toUpperCase()}`)
      console.log('='.repeat(80))
      currentProduct = c.productType
      currentVariety = ''
    }

    if (c.varietyName !== currentVariety) {
      console.log()
      console.log(`${c.varietyName}:`)
      console.log('-'.repeat(80))
      currentVariety = c.varietyName
    }

    const icon = {
      'mass_market': '🏪',
      'commercial': '🛒',
      'regional': '📍',
      'specialty': '⭐',
      'rare': '🏛️'
    }[c.marketTier] || '❓'

    console.log(`  ${icon} ${c.cultivarName}`)
    if (c.marketShare) {
      console.log(`     ${c.marketShare}`)
    }
  })

  console.log()
  console.log('='.repeat(80))
  console.log('MARKET TIER SUMMARY')
  console.log('='.repeat(80))
  console.log()

  const tierCounts = await runQuery<{
    marketTier: string
    count: number
  }>(`
    MATCH (c:Cultivar)
    WHERE c.marketTier IS NOT NULL
    RETURN c.marketTier as marketTier, count(c) as count
    ORDER BY
      CASE c.marketTier
        WHEN 'mass_market' THEN 1
        WHEN 'commercial' THEN 2
        WHEN 'regional' THEN 3
        WHEN 'specialty' THEN 4
        WHEN 'rare' THEN 5
        ELSE 6
      END
  `)

  tierCounts.forEach(t => {
    const icon = {
      'mass_market': '🏪',
      'commercial': '🛒',
      'regional': '📍',
      'specialty': '⭐',
      'rare': '🏛️'
    }[t.marketTier] || '❓'

    console.log(`${icon} ${t.marketTier.padEnd(15)} ${t.count} cultivars`)
  })

  console.log()
  console.log('NOTE: Only cultivars with explicit market tier data shown')
  console.log('Most cultivars do not yet have market tier classification')
  console.log()

  await closeDriver()
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
