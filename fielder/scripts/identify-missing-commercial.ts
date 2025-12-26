#!/usr/bin/env tsx

/**
 * Identify Missing Commercial Cultivars
 *
 * Compares what we have vs major commercial market reality
 * Identifies gaps in mass-market and commercial coverage
 */

import { runQuery } from '../src/lib/graph/index'

interface CommercialGap {
  variety: string
  productType: string
  currentCultivars: string[]
  missingCommercial: Array<{
    name: string
    marketTier: string
    marketShare: string
    reason: string
  }>
}

async function main() {
  console.log('='.repeat(80))
  console.log('MISSING COMMERCIAL CULTIVAR ANALYSIS')
  console.log('='.repeat(80))
  console.log()

  // Get current cultivars by variety for key products
  const appleCultivars = await runQuery<{ name: string }>(`
    MATCH (c:Cultivar)-[:BELONGS_TO_VARIETY]->(:Variety)-[:BELONGS_TO_PRODUCT]->(p:ProductType {id: 'apple'})
    RETURN c.displayName as name
    ORDER BY name
  `)

  const orangeCultivars = await runQuery<{ name: string }>(`
    MATCH (c:Cultivar)-[:BELONGS_TO_VARIETY]->(:Variety)-[:BELONGS_TO_PRODUCT]->(p:ProductType {id: 'orange'})
    RETURN c.displayName as name
    ORDER BY name
  `)

  const tomatoCultivars = await runQuery<{ name: string }>(`
    MATCH (c:Cultivar)-[:BELONGS_TO_VARIETY]->(:Variety)-[:BELONGS_TO_PRODUCT]->(p:ProductType {id: 'tomato'})
    RETURN c.displayName as name
    ORDER BY name
  `)

  const grapefruitCultivars = await runQuery<{ name: string }>(`
    MATCH (c:Cultivar)-[:BELONGS_TO_VARIETY]->(:Variety)-[:BELONGS_TO_PRODUCT]->(p:ProductType {id: 'grapefruit'})
    RETURN c.displayName as name
    ORDER BY name
  `)

  const strawberryCultivars = await runQuery<{ name: string }>(`
    MATCH (c:Cultivar)-[:BELONGS_TO_VARIETY]->(:Variety)-[:BELONGS_TO_PRODUCT]->(p:ProductType {id: 'strawberry'})
    RETURN c.displayName as name
    ORDER BY name
  `)

  // Define gaps
  const gaps: CommercialGap[] = []

  // ========================================================================
  // APPLES - Missing Major Commercial Varieties
  // ========================================================================
  const appleNames = appleCultivars.map(c => (c.name || '').toLowerCase())
  const missingApples = []

  if (!appleNames.some(n => n.includes('red delicious'))) {
    missingApples.push({
      name: 'Red Delicious',
      marketTier: 'mass_market',
      marketShare: '~25% of US apple production (historically #1, declining)',
      reason: 'Most planted apple for decades, still 2nd most common'
    })
  }

  if (!appleNames.some(n => n.includes('golden delicious'))) {
    missingApples.push({
      name: 'Golden Delicious',
      marketTier: 'mass_market',
      marketShare: '~10% of US apple production',
      reason: '3rd most common apple, all-purpose, widely available'
    })
  }

  if (!appleNames.some(n => n.includes('mcintosh') || n.includes('mac'))) {
    missingApples.push({
      name: 'McIntosh',
      marketTier: 'commercial',
      marketShare: '~5% of US apple production',
      reason: 'Northeast favorite, major in NY/New England, sauce apple'
    })
  }

  if (!appleNames.some(n => n.includes('braeburn'))) {
    missingApples.push({
      name: 'Braeburn',
      marketTier: 'commercial',
      marketShare: '~3% of US apple market',
      reason: 'New Zealand import, growing popularity, sweet-tart'
    })
  }

  if (!appleNames.some(n => n.includes('jonagold'))) {
    missingApples.push({
      name: 'Jonagold',
      marketTier: 'commercial',
      marketShare: '~2% of US apple market',
      reason: 'Golden Delicious × Jonathan, commercial variety'
    })
  }

  if (!appleNames.some(n => n.includes('empire'))) {
    missingApples.push({
      name: 'Empire',
      marketTier: 'commercial',
      marketShare: '~2% of US apple market',
      reason: 'McIntosh × Red Delicious, Northeast common'
    })
  }

  if (missingApples.length > 0) {
    gaps.push({
      variety: 'Apples (All Varieties)',
      productType: 'apple',
      currentCultivars: appleCultivars.map(c => c.name),
      missingCommercial: missingApples
    })
  }

  // ========================================================================
  // ORANGES - Missing Commercial Varieties
  // ========================================================================
  const orangeNames = orangeCultivars.map(c => (c.name || '').toLowerCase())
  const missingOranges = []

  if (!orangeNames.some(n => n.includes('hamlin'))) {
    missingOranges.push({
      name: 'Hamlin',
      marketTier: 'mass_market',
      marketShare: '~30% of Florida orange juice production',
      reason: 'Major Florida juice orange, early season, commercial OJ'
    })
  }

  if (!orangeNames.some(n => n.includes('pineapple') && n.includes('orange'))) {
    missingOranges.push({
      name: 'Pineapple Orange',
      marketTier: 'commercial',
      marketShare: '~10% of Florida midseason oranges',
      reason: 'Florida midseason, fresh and juice, seedy but flavorful'
    })
  }

  if (!orangeNames.some(n => n.includes('temple'))) {
    missingOranges.push({
      name: 'Temple Orange',
      marketTier: 'regional',
      marketShare: '~3% of Florida specialty oranges',
      reason: 'Florida specialty, tangor (orange × mandarin), January-March'
    })
  }

  if (!orangeNames.some(n => n.includes('jaffa'))) {
    missingOranges.push({
      name: 'Jaffa (Shamouti)',
      marketTier: 'specialty',
      marketShare: '<1% US, major in Israel',
      reason: 'Israeli heritage, exported to US, distinctive flavor'
    })
  }

  if (missingOranges.length > 0) {
    gaps.push({
      variety: 'Oranges (All Varieties)',
      productType: 'orange',
      currentCultivars: orangeCultivars.map(c => c.name),
      missingCommercial: missingOranges
    })
  }

  // ========================================================================
  // GRAPEFRUIT - Missing Commercial
  // ========================================================================
  const grapefruitNames = grapefruitCultivars.map(c => (c.name || '').toLowerCase())
  const missingGrapefruit = []

  if (!grapefruitNames.some(n => n.includes('flame'))) {
    missingGrapefruit.push({
      name: 'Flame (Red)',
      marketTier: 'commercial',
      marketShare: '~20% of red grapefruit',
      reason: 'Texas specialty, darker red than Ruby, commercial'
    })
  }

  if (!grapefruitNames.some(n => n.includes('rio sweet') || n.includes('sweet scarlette'))) {
    missingGrapefruit.push({
      name: 'Rio Sweet (Sweet Scarlette)',
      marketTier: 'commercial',
      marketShare: '~10% of Texas red grapefruit',
      reason: 'Newer Texas A&M release, very sweet, low acid'
    })
  }

  if (missingGrapefruit.length > 0) {
    gaps.push({
      variety: 'Grapefruit (All Varieties)',
      productType: 'grapefruit',
      currentCultivars: grapefruitCultivars.map(c => c.name),
      missingCommercial: missingGrapefruit
    })
  }

  // ========================================================================
  // STRAWBERRIES - Missing Commercial
  // ========================================================================
  const strawberryNames = strawberryCultivars.map(c => (c.name || '').toLowerCase())
  const missingStrawberries = []

  if (!strawberryNames.some(n => n.includes('albion'))) {
    missingStrawberries.push({
      name: 'Albion',
      marketTier: 'mass_market',
      marketShare: '~40% of California strawberries',
      reason: 'UC Davis, day-neutral, year-round, #1 California variety'
    })
  }

  if (!strawberryNames.some(n => n.includes('camarosa'))) {
    missingStrawberries.push({
      name: 'Camarosa',
      marketTier: 'commercial',
      marketShare: '~15% of California strawberries',
      reason: 'UC Davis, short-day, major commercial variety'
    })
  }

  if (!strawberryNames.some(n => n.includes('portola'))) {
    missingStrawberries.push({
      name: 'Portola',
      marketTier: 'commercial',
      marketShare: '~10% of California strawberries',
      reason: 'UC Davis, day-neutral, commercial production'
    })
  }

  if (!strawberryNames.some(n => n.includes('san andreas'))) {
    missingStrawberries.push({
      name: 'San Andreas',
      marketTier: 'commercial',
      marketShare: '~15% of California strawberries',
      reason: 'UC Davis, day-neutral, heat-tolerant, commercial'
    })
  }

  if (missingStrawberries.length > 0) {
    gaps.push({
      variety: 'Strawberries',
      productType: 'strawberry',
      currentCultivars: strawberryCultivars.map(c => c.name),
      missingCommercial: missingStrawberries
    })
  }

  // ========================================================================
  // TOMATOES - Missing Major Hybrids
  // ========================================================================
  const tomatoNames = tomatoCultivars.map(c => (c.name || '').toLowerCase())
  const missingTomatoes = []

  if (!tomatoNames.some(n => n.includes('better boy'))) {
    missingTomatoes.push({
      name: 'Better Boy',
      marketTier: 'mass_market',
      marketShare: '~20% of home garden market',
      reason: 'Most popular home garden hybrid, disease resistant'
    })
  }

  if (!tomatoNames.some(n => n.includes('early girl'))) {
    missingTomatoes.push({
      name: 'Early Girl',
      marketTier: 'mass_market',
      marketShare: '~15% of home garden market',
      reason: 'Early hybrid, 50 days, very popular'
    })
  }

  if (!tomatoNames.some(n => n.includes('celebrity'))) {
    missingTomatoes.push({
      name: 'Celebrity',
      marketTier: 'commercial',
      marketShare: '~10% of hybrid market',
      reason: 'Disease resistant, commercial/home garden, AAS winner'
    })
  }

  if (!tomatoNames.some(n => n.includes('beefmaster'))) {
    // Already have this potentially, check
    if (!tomatoNames.includes('beefmaster')) {
      missingTomatoes.push({
        name: 'Beefmaster',
        marketTier: 'commercial',
        marketShare: '~5% of beefsteak market',
        reason: 'Large hybrid beefsteak, 2+ lbs'
      })
    }
  }

  if (missingTomatoes.length > 0) {
    gaps.push({
      variety: 'Tomatoes (All Varieties)',
      productType: 'tomato',
      currentCultivars: tomatoCultivars.map(c => c.name),
      missingCommercial: missingTomatoes
    })
  }

  // ========================================================================
  // OUTPUT RESULTS
  // ========================================================================

  console.log('MISSING COMMERCIAL CULTIVARS BY PRIORITY')
  console.log('='.repeat(80))
  console.log()

  if (gaps.length === 0) {
    console.log('✅ No major commercial gaps identified in analyzed products!')
    console.log()
    return
  }

  gaps.forEach(gap => {
    console.log(`${gap.productType.toUpperCase()} - ${gap.variety}`)
    console.log('-'.repeat(80))
    console.log()
    console.log(`CURRENT COVERAGE (${gap.currentCultivars.length} cultivars):`)
    gap.currentCultivars.forEach(name => console.log(`  ✅ ${name}`))
    console.log()
    console.log(`MISSING COMMERCIAL (${gap.missingCommercial.length}):`)
    console.log()

    gap.missingCommercial
      .sort((a, b) => {
        const tierOrder = { mass_market: 1, commercial: 2, regional: 3, specialty: 4 }
        return tierOrder[a.marketTier as keyof typeof tierOrder] - tierOrder[b.marketTier as keyof typeof tierOrder]
      })
      .forEach(missing => {
        const icon = {
          mass_market: '🏪',
          commercial: '🛒',
          regional: '📍',
          specialty: '⭐'
        }[missing.marketTier] || '❓'

        console.log(`  ${icon} ${missing.name}`)
        console.log(`     Market: ${missing.marketShare}`)
        console.log(`     Why: ${missing.reason}`)
        console.log()
      })

    console.log()
  })

  // Summary
  const totalMissing = gaps.reduce((sum, g) => sum + g.missingCommercial.length, 0)
  const massMissing = gaps.reduce((sum, g) =>
    sum + g.missingCommercial.filter(m => m.marketTier === 'mass_market').length, 0
  )

  console.log('='.repeat(80))
  console.log('SUMMARY')
  console.log('='.repeat(80))
  console.log()
  console.log(`Total missing commercial cultivars: ${totalMissing}`)
  console.log(`  - Mass market priority: ${massMissing}`)
  console.log(`  - Commercial priority: ${totalMissing - massMissing}`)
  console.log()
  console.log('RECOMMENDATION: Add mass market cultivars first, then fill commercial gaps')
  console.log()
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
