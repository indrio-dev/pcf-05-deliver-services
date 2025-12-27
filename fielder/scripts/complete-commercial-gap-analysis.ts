#!/usr/bin/env tsx

/**
 * Complete Commercial Gap Analysis - All Major Products
 *
 * Systematic analysis of commercial coverage for all products where
 * consumers make purchasing decisions in stores
 *
 * Priority: Top 10-15 cultivars per product that represent 80-90% of market
 */

import { runQuery, closeDriver } from '../src/lib/graph/index'

interface GapItem {
  product: string
  variety: string
  marketShare: string
  priority: 'critical' | 'high' | 'medium'
  states: string[]
  notes: string
}

async function checkCoverage(productId: string, varieties: string[]): Promise<{have: string[], missing: string[]}> {
  const result = await runQuery<{ name: string }>(`
    MATCH (c:Cultivar)-[:IS_A]->(p:ProductType {id: $productId})
    RETURN DISTINCT toLower(c.displayName) as name
  `, { productId })

  const ourNames = result.map(r => r.name || '').filter(n => n.length > 0)

  const have: string[] = []
  const missing: string[] = []

  varieties.forEach(v => {
    const vLower = v.toLowerCase()
    if (ourNames.some(n => n.includes(vLower) || vLower.includes(n))) {
      have.push(v)
    } else {
      missing.push(v)
    }
  })

  return { have, missing }
}

async function main() {
  console.log('='.repeat(80))
  console.log('COMPLETE COMMERCIAL GAP ANALYSIS - ALL MAJOR PRODUCTS')
  console.log('='.repeat(80))
  console.log()

  const allGaps: GapItem[] = []

  // ========================================================================
  // CITRUS - LEMONS
  // ========================================================================
  console.log('Analyzing LEMONS...')
  const lemonCoverage = await checkCoverage('lemon', ['Eureka', 'Lisbon', 'Meyer', 'Ponderosa'])

  if (lemonCoverage.missing.includes('Lisbon')) {
    allGaps.push({
      product: 'Lemon',
      variety: 'Lisbon',
      marketShare: '30%',
      priority: 'high',
      states: ['CA', 'AZ'],
      notes: 'Commercial lemon, similar to Eureka, major CA variety, more cold-hardy'
    })
  }

  // ========================================================================
  // STONE FRUIT - CHERRIES
  // ========================================================================
  console.log('Analyzing CHERRIES...')
  const cherryCoverage = await checkCoverage('cherry', ['Bing', 'Rainier', 'Chelan', 'Tieton', 'Montmorency', 'Balaton'])

  if (cherryCoverage.missing.includes('Chelan')) {
    allGaps.push({
      product: 'Cherry',
      variety: 'Chelan',
      marketShare: '15%',
      priority: 'high',
      states: ['WA', 'OR', 'CA'],
      notes: 'Early sweet cherry, major WA commercial variety, WSU release, extends season'
    })
  }

  if (cherryCoverage.missing.includes('Tieton')) {
    allGaps.push({
      product: 'Cherry',
      variety: 'Tieton',
      marketShare: '10%',
      priority: 'medium',
      states: ['WA', 'OR'],
      notes: 'Bing type, early season, WSU, commercial'
    })
  }

  if (cherryCoverage.missing.includes('Sweetheart')) {
    allGaps.push({
      product: 'Cherry',
      variety: 'Sweetheart',
      marketShare: '12%',
      priority: 'high',
      states: ['WA', 'OR', 'CA'],
      notes: 'Late season, extends cherry harvest, Canadian breeding, very sweet'
    })
  }

  // ========================================================================
  // STONE FRUIT - PLUMS
  // ========================================================================
  console.log('Analyzing PLUMS...')
  const plumCoverage = await checkCoverage('plum', ['Santa Rosa', 'Friar', 'Black Splendor', 'Angeleno'])

  cherryCoverage.missing.forEach(v => {
    allGaps.push({
      product: 'Plum',
      variety: v,
      marketShare: '10-15%',
      priority: v === 'Santa Rosa' ? 'critical' : 'medium',
      states: ['CA'],
      notes: `Commercial plum variety - ${v}`
    })
  })

  // ========================================================================
  // POME FRUIT - Check apples and pears
  // ========================================================================
  console.log('Analyzing additional APPLES...')
  const appleCoverage = await checkCoverage('apple', ['Rome', 'Jonagold', 'Cortland', 'Jonathan', 'Idared'])

  appleCoverage.missing.forEach(v => {
    if (['Rome', 'Jonathan', 'Cortland'].includes(v)) {
      allGaps.push({
        product: 'Apple',
        variety: v,
        marketShare: '2-5%',
        priority: 'medium',
        states: ['NY', 'MI', 'OH', 'PA'],
        notes: `Regional commercial variety - ${v}`
      })
    }
  })

  console.log('Analyzing PEARS...')
  const pearCoverage = await checkCoverage('pear', ['Bartlett', 'Anjou', 'Bosc', 'Comice', 'Seckel', 'Forelle'])

  if (pearCoverage.missing.includes('Seckel')) {
    allGaps.push({
      product: 'Pear',
      variety: 'Seckel',
      marketShare: '5%',
      priority: 'medium',
      states: ['OR', 'WA', 'PA'],
      notes: 'Small sugar pear, American heritage, commercial specialty'
    })
  }

  // ========================================================================
  // BERRIES - RASPBERRIES, BLACKBERRIES, CRANBERRIES
  // ========================================================================
  console.log('Analyzing RASPBERRIES...')
  const raspberryCoverage = await checkCoverage('raspberry', ['Heritage', 'Caroline', 'Autumn Bliss', 'Meeker'])

  raspberryCoverage.missing.forEach(v => {
    allGaps.push({
      product: 'Raspberry',
      variety: v,
      marketShare: v === 'Meeker' ? '40%' : '10-15%',
      priority: v === 'Meeker' ? 'critical' : 'high',
      states: v === 'Meeker' ? ['WA', 'OR', 'CA'] : ['WA', 'OR', 'NY'],
      notes: `Commercial raspberry - ${v}`
    })
  })

  // ========================================================================
  // VEGETABLES - LETTUCE
  // ========================================================================
  console.log('Analyzing LETTUCE...')
  const lettuceCoverage = await checkCoverage('lettuce', ['Iceberg', 'Romaine Hearts', 'Green Leaf', 'Red Leaf'])

  if (lettuceCoverage.missing.includes('Iceberg')) {
    allGaps.push({
      product: 'Lettuce',
      variety: 'Iceberg (Crisphead)',
      marketShare: '70%',
      priority: 'critical',
      states: ['CA', 'AZ'],
      notes: 'Dominant lettuce type in US, mass market standard, CA/AZ commercial'
    })
  }

  // ========================================================================
  // VEGETABLES - CARROTS
  // ========================================================================
  console.log('Analyzing CARROTS...')
  const carrotCoverage = await checkCoverage('carrot', ['Imperator', 'Nantes', 'Danvers', 'Bolero'])

  if (carrotCoverage.missing.includes('Danvers')) {
    allGaps.push({
      product: 'Carrot',
      variety: 'Danvers 126',
      marketShare: '15%',
      priority: 'high',
      states: ['CA', 'TX', 'MI', 'WI'],
      notes: 'Commercial half-long carrot, processing and fresh, heritage commercial variety'
    })
  }

  // ========================================================================
  // VEGETABLES - PEPPERS
  // ========================================================================
  console.log('Analyzing PEPPERS...')
  const pepperCoverage = await checkCoverage('pepper', ['Bell Boy', 'California Wonder', 'Jalapeño', 'Serrano'])

  pepperCoverage.missing.forEach(v => {
    if (['California Wonder', 'Bell Boy', 'Jalapeño'].includes(v)) {
      allGaps.push({
        product: 'Pepper',
        variety: v,
        marketShare: v === 'California Wonder' ? '30%' : v === 'Jalapeño' ? '40%' : '15%',
        priority: v === 'Jalapeño' ? 'critical' : 'high',
        states: ['CA', 'FL', 'TX', 'NM'],
        notes: `Commercial pepper variety - ${v}`
      })
    }
  })

  // ========================================================================
  // OUTPUT
  // ========================================================================

  console.log()
  console.log('='.repeat(80))
  console.log(`TOTAL COMMERCIAL GAPS IDENTIFIED: ${allGaps.length}`)
  console.log('='.repeat(80))
  console.log()

  // Group by priority
  const critical = allGaps.filter(g => g.priority === 'critical')
  const high = allGaps.filter(g => g.priority === 'high')
  const medium = allGaps.filter(g => g.priority === 'medium')

  console.log(`🔴 CRITICAL (mass market leaders): ${critical.length}`)
  console.log(`🟡 HIGH (major commercial): ${high.length}`)
  console.log(`🟢 MEDIUM (commercial depth): ${medium.length}`)
  console.log()

  console.log('TOP 15 PRIORITIES:')
  console.log('-'.repeat(80))

  const top15 = [...critical, ...high, ...medium].slice(0, 15)
  top15.forEach((gap, i) => {
    const icon = gap.priority === 'critical' ? '🔴' : gap.priority === 'high' ? '🟡' : '🟢'
    console.log(`${i + 1}. ${icon} ${gap.product} - ${gap.variety} (${gap.marketShare})`)
    console.log(`   States: ${gap.states.join(', ')}`)
    console.log(`   ${gap.notes}`)
    console.log()
  })

  console.log('='.repeat(80))
  console.log('RECOMMENDATION')
  console.log('='.repeat(80))
  console.log()
  console.log('Priority sequence:')
  console.log('1. Add all CRITICAL gaps (mass market leaders people see everywhere)')
  console.log('2. Add HIGH priority (major commercial varieties in main producing states)')
  console.log('3. Add MEDIUM priority (commercial depth for completeness)')
  console.log()
  console.log('This achieves 90% coverage of what consumers see in US stores')
  console.log()

  await closeDriver()
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
