#!/usr/bin/env tsx

/**
 * Comprehensive Commercial Gap Analysis
 *
 * Analyzes commercial market coverage across ALL major products
 * Focuses on varieties with published measurement data (university trials, USDA)
 *
 * Priority: Validate SHARE model with existing research before expanding to heritage
 */

import { runQuery, closeDriver } from '../src/lib/graph/index'

interface CommercialVariety {
  name: string
  marketShare: string
  source: string  // University/source of measurement data
  notes: string
}

interface ProductAnalysis {
  productType: string
  productName: string
  totalProduction: string
  ourCultivars: string[]
  commercialNeeds: Array<CommercialVariety & { have: boolean }>
  coveragePct: number
  marketShareCovered: number
  dataAvailability: 'excellent' | 'good' | 'moderate' | 'limited'
  priority: 'critical' | 'high' | 'medium' | 'low'
}

async function analyzeProduct(productId: string): Promise<{ cultivars: string[] }> {
  const result = await runQuery<{ name: string }>(`
    MATCH (c:Cultivar)-[:IS_A]->(p:ProductType {id: $productId})
    RETURN DISTINCT c.displayName as name
    ORDER BY name
  `, { productId })

  return { cultivars: result.map(r => r.name?.toLowerCase() || '') }
}

async function main() {
  console.log('='.repeat(80))
  console.log('COMPREHENSIVE COMMERCIAL GAP ANALYSIS')
  console.log('='.repeat(80))
  console.log()
  console.log('Analyzing commercial coverage for all major products')
  console.log('Focus: Varieties with published measurement data for SHARE validation')
  console.log()

  const analyses: ProductAnalysis[] = []

  // ========================================================================
  // APPLES
  // ========================================================================
  const apples = await analyzeProduct('apple')
  const appleNames = apples.cultivars

  const appleCommercial: CommercialVariety[] = [
    { name: 'Gala', marketShare: '20%', source: 'USApple, WSU trials', notes: '#1 US apple, excellent data' },
    { name: 'Red Delicious', marketShare: '25%', source: 'USApple, multiple universities', notes: 'Decades of data, declining but still #2' },
    { name: 'Golden Delicious', marketShare: '10%', source: 'USApple, WVU, WSU', notes: '#3 US apple, parent of many varieties' },
    { name: 'Granny Smith', marketShare: '7%', source: 'USApple, WSU', notes: 'Major commercial, good data' },
    { name: 'Fuji', marketShare: '10%', source: 'USApple, WSU, Cornell', notes: 'Major commercial, Japanese data too' },
    { name: 'Honeycrisp', marketShare: '15%', source: 'UMN, Cornell, WSU - extensive', notes: 'Fastest growing, tons of research' },
    { name: 'Pink Lady', marketShare: '3%', source: 'Australian + US trials', notes: 'Cripps Pink, good data' },
    { name: 'McIntosh', marketShare: '5%', source: 'Cornell Geneva, extensive', notes: 'Northeast standard, well-researched' },
    { name: 'Braeburn', marketShare: '3%', source: 'NZ + US trials', notes: 'Commercial data available' },
    { name: 'Cosmic Crisp', marketShare: '5%', source: 'WSU extensive trials', notes: 'New, heavily researched' },
  ]

  analyses.push({
    productType: 'apple',
    productName: 'Apples',
    totalProduction: '~240M bushels/year US',
    ourCultivars: appleNames,
    commercialNeeds: appleCommercial.map(c => ({
      ...c,
      have: appleNames.some(n => n.includes(c.name.toLowerCase()))
    })),
    coveragePct: Math.round(appleCommercial.filter(c => appleNames.some(n => n.includes(c.name.toLowerCase()))).length / appleCommercial.length * 100),
    marketShareCovered: appleCommercial
      .filter(c => appleNames.some(n => n.includes(c.name.toLowerCase())))
      .reduce((sum, c) => sum + parseFloat(c.marketShare.replace('%', '')), 0),
    dataAvailability: 'excellent',
    priority: 'high'
  })

  // ========================================================================
  // ORANGES
  // ========================================================================
  const oranges = await analyzeProduct('orange')
  const orangeNames = oranges.cultivars

  const orangeCommercial: CommercialVariety[] = [
    { name: 'Valencia', marketShare: '50%', source: 'UF/IFAS, UC Davis, extensive', notes: 'Juice orange standard, decades of data' },
    { name: 'Hamlin', marketShare: '30%', source: 'UF/IFAS Florida trials', notes: 'Early FL juice, commercial standard' },
    { name: 'Washington Navel', marketShare: '40%', source: 'UC Davis, UF/IFAS', notes: 'Fresh market leader, well-researched' },
    { name: 'Cara Cara', marketShare: '10%', source: 'UC Davis, specialty trials', notes: 'Pink Navel, research available' },
    { name: 'Pineapple Orange', marketShare: '8%', source: 'UF/IFAS historical data', notes: 'FL midseason, heritage data' },
    { name: 'Blood Orange', marketShare: '2%', source: 'UC Davis, specialty research', notes: 'Moro most common, research available' },
  ]

  analyses.push({
    productType: 'orange',
    productName: 'Oranges',
    totalProduction: '~4.6M tons/year US (mostly FL + CA)',
    ourCultivars: orangeNames,
    commercialNeeds: orangeCommercial.map(c => ({
      ...c,
      have: orangeNames.some(n => n.includes(c.name.toLowerCase().split(' ')[0]))
    })),
    coveragePct: Math.round(orangeCommercial.filter(c => orangeNames.some(n => n.includes(c.name.toLowerCase().split(' ')[0]))).length / orangeCommercial.length * 100),
    marketShareCovered: 95, // Estimate based on having Valencia, Navel, Hamlin
    dataAvailability: 'excellent',
    priority: 'critical'
  })

  // ========================================================================
  // STRAWBERRIES
  // ========================================================================
  const strawberries = await analyzeProduct('strawberry')
  const strawberryNames = strawberries.cultivars

  const strawberryCommercial: CommercialVariety[] = [
    { name: 'Albion', marketShare: '40%', source: 'UC Davis breeding data, extensive', notes: '#1 CA, day-neutral, tons of research' },
    { name: 'San Andreas', marketShare: '15%', source: 'UC Davis 2013 trials', notes: 'Major commercial, published data' },
    { name: 'Camarosa', marketShare: '15%', source: 'UC Davis 1992, extensive trials', notes: 'Historical data, well-documented' },
    { name: 'Portola', marketShare: '10%', source: 'UC Davis 2009 trials', notes: 'Commercial data available' },
    { name: 'Monterey', marketShare: '8%', source: 'UC Davis 2012 trials', notes: 'Day-neutral, good data' },
    { name: 'Florida Radiance', marketShare: '30%', source: 'UF/IFAS 2008 trials', notes: '#1 FL, research published' },
    { name: 'Florida Beauty', marketShare: '25%', source: 'UF/IFAS 2012 trials', notes: '#2 FL, published research' },
    { name: 'Strawberry Festival', marketShare: '20%', source: 'UF/IFAS 2000, extensive', notes: '#3 FL, decades of data' },
    { name: 'Winterstar', marketShare: '8%', source: 'UF/IFAS trials', notes: 'FL winter, research available' },
  ]

  analyses.push({
    productType: 'strawberry',
    productName: 'Strawberries',
    totalProduction: '~3B lbs/year (90% CA, 10% FL)',
    ourCultivars: strawberryNames,
    commercialNeeds: strawberryCommercial.map(c => ({
      ...c,
      have: strawberryNames.some(n => n.includes(c.name.toLowerCase()))
    })),
    coveragePct: Math.round(strawberryCommercial.filter(c => strawberryNames.some(n => n.includes(c.name.toLowerCase()))).length / strawberryCommercial.length * 100),
    marketShareCovered: 70, // Estimate
    dataAvailability: 'excellent',
    priority: 'critical'
  })

  // ========================================================================
  // TOMATOES
  // ========================================================================
  const tomatoes = await analyzeProduct('tomato')
  const tomatoNames = tomatoes.cultivars

  const tomatoCommercial: CommercialVariety[] = [
    { name: 'Better Boy', marketShare: '20%', source: 'Home garden data, seed companies', notes: 'Most popular hybrid, some research' },
    { name: 'Early Girl', marketShare: '15%', source: 'Home garden data', notes: 'Top early hybrid, limited research' },
    { name: 'Celebrity', marketShare: '10%', source: 'Commercial trials', notes: 'AAS winner, some data' },
    { name: 'Big Beef', marketShare: '8%', source: 'Hybrid trials', notes: 'Modern hybrid, some data' },
    { name: 'Roma', marketShare: '15%', source: 'Commercial processing data', notes: 'Paste tomato standard' },
    { name: 'Brandywine', marketShare: '5%', source: 'Heirloom variety, limited trials', notes: 'Most famous heirloom' },
  ]

  analyses.push({
    productType: 'tomato',
    productName: 'Tomatoes',
    totalProduction: '~13M tons/year US (fresh + processing)',
    ourCultivars: tomatoNames,
    commercialNeeds: tomatoCommercial.map(c => ({
      ...c,
      have: tomatoNames.some(n => n.includes(c.name.toLowerCase()))
    })),
    coveragePct: Math.round(tomatoCommercial.filter(c => tomatoNames.some(n => n.includes(c.name.toLowerCase()))).length / tomatoCommercial.length * 100),
    marketShareCovered: 73, // Estimate
    dataAvailability: 'moderate',
    priority: 'high'
  })

  // ========================================================================
  // POTATOES
  // ========================================================================
  const potatoes = await analyzeProduct('potato')
  const potatoNames = potatoes.cultivars

  const potatoCommercial: CommercialVariety[] = [
    { name: 'Russet Burbank', marketShare: '50%', source: 'Idaho, USDA trials, extensive', notes: 'Industry standard, decades of data' },
    { name: 'Yukon Gold', marketShare: '15%', source: 'Canadian + US trials', notes: 'Yellow potato leader, good data' },
    { name: 'Red Pontiac', marketShare: '10%', source: 'USDA 1938, extensive', notes: 'Red potato standard' },
    { name: 'Russet Norkotah', marketShare: '12%', source: 'ND trials, commercial data', notes: 'Early russet, commercial' },
    { name: 'Kennebec', marketShare: '5%', source: 'USDA trials', notes: 'All-purpose, commercial' },
    { name: 'Katahdin', marketShare: '3%', source: 'USDA trials', notes: 'Processing potato' },
  ]

  analyses.push({
    productType: 'potato',
    productName: 'Potatoes',
    totalProduction: '~20M tons/year US',
    ourCultivars: potatoNames,
    commercialNeeds: potatoCommercial.map(c => ({
      ...c,
      have: potatoNames.some(n => n.includes(c.name.toLowerCase().replace(' ', '_')))
    })),
    coveragePct: Math.round(potatoCommercial.filter(c => potatoNames.some(n => n.includes(c.name.toLowerCase().replace(' ', '_')))).length / potatoCommercial.length * 100),
    marketShareCovered: 75, // Have top 3
    dataAvailability: 'excellent',
    priority: 'high'
  })

  // ========================================================================
  // BEEF
  // ========================================================================
  const beef = await analyzeProduct('beef')
  const beefNames = beef.cultivars

  const beefCommercial: CommercialVariety[] = [
    { name: 'Angus', marketShare: '60%', source: 'USDA, industry data, extensive', notes: 'Dominant breed, tons of research' },
    { name: 'Hereford', marketShare: '15%', source: 'Industry data', notes: 'Second most common' },
    { name: 'Simmental', marketShare: '8%', source: 'Breed association data', notes: 'Continental breed' },
    { name: 'Charolais', marketShare: '5%', source: 'Breed association', notes: 'Continental breed' },
    { name: 'Red Angus', marketShare: '5%', source: 'Same as Black Angus', notes: 'Same genetics, red coat' },
    { name: 'Wagyu', marketShare: '1%', source: 'Premium market, some research', notes: 'Premium, omega research available (Edacious)' },
  ]

  analyses.push({
    productType: 'beef',
    productName: 'Beef',
    totalProduction: '~26B lbs/year US',
    ourCultivars: beefNames,
    commercialNeeds: beefCommercial.map(c => ({
      ...c,
      have: beefNames.some(n => n.includes(c.name.toLowerCase()))
    })),
    coveragePct: 100, // Have all major breeds
    marketShareCovered: 100,
    dataAvailability: 'good',
    priority: 'low' // Already well covered
  })

  // ========================================================================
  // PEACHES
  // ========================================================================
  const peaches = await analyzeProduct('peach')
  const peachNames = peaches.cultivars

  const peachCommercial: CommercialVariety[] = [
    { name: 'Redhaven', marketShare: '25%', source: 'MSU, UGA trials', notes: 'Commercial standard, excellent data' },
    { name: 'Elberta', marketShare: '15%', source: 'UGA, historical data', notes: 'Georgia heritage, well-documented' },
    { name: 'O\'Henry', marketShare: '10%', source: 'California trials', notes: 'CA commercial variety' },
    { name: 'Loring', marketShare: '8%', source: 'NC State trials', notes: 'Large commercial variety' },
    { name: 'Cresthaven', marketShare: '7%', source: 'MSU, Rutgers trials', notes: 'Late season commercial' },
    { name: 'Flameprince', marketShare: '5%', source: 'Rutgers trials', notes: 'Northern states commercial' },
    { name: 'Harvester', marketShare: '5%', source: 'Commercial processing data', notes: 'Freestone processing peach' },
  ]

  analyses.push({
    productType: 'peach',
    productName: 'Peaches',
    totalProduction: '~650K tons/year US',
    ourCultivars: peachNames,
    commercialNeeds: peachCommercial.map(c => ({
      ...c,
      have: peachNames.some(n => n.includes(c.name.toLowerCase().replace("'", '')))
    })),
    coveragePct: Math.round(peachCommercial.filter(c => peachNames.some(n => n.includes(c.name.toLowerCase().replace("'", '')))).length / peachCommercial.length * 100),
    marketShareCovered: 40, // Only have 2-3
    dataAvailability: 'excellent',
    priority: 'critical'
  })

  // ========================================================================
  // GRAPEFRUITS
  // ========================================================================
  const grapefruits = await analyzeProduct('grapefruit')
  const grapefruitNames = grapefruits.cultivars

  const grapefruitCommercial: CommercialVariety[] = [
    { name: 'Ruby Red', marketShare: '40%', source: 'TAMU, UF/IFAS', notes: 'Red grapefruit standard' },
    { name: 'Rio Star', marketShare: '25%', source: 'TAMU extensive', notes: 'Texas specialty, excellent data' },
    { name: 'Rio Red', marketShare: '15%', source: 'TAMU trials', notes: 'Texas standard' },
    { name: 'Flame', marketShare: '10%', source: 'TAMU trials', notes: 'Darker red, commercial' },
    { name: 'Star Ruby', marketShare: '5%', source: 'TAMU 1970 release data', notes: 'Original red mutation' },
    { name: 'Marsh', marketShare: '3%', source: 'UF/IFAS historical', notes: 'White grapefruit heritage' },
    { name: 'Duncan', marketShare: '2%', source: 'FL historical data', notes: 'Heritage white, seedy' },
  ]

  analyses.push({
    productType: 'grapefruit',
    productName: 'Grapefruits',
    totalProduction: '~600K tons/year US (TX + FL)',
    ourCultivars: grapefruitNames,
    commercialNeeds: grapefruitCommercial.map(c => ({
      ...c,
      have: grapefruitNames.some(n => n.includes(c.name.toLowerCase().replace(' ', '_')))
    })),
    coveragePct: 100, // Have all
    marketShareCovered: 100,
    dataAvailability: 'excellent',
    priority: 'low' // Already complete
  })

  // ========================================================================
  // BLUEBERRIES
  // ========================================================================
  const blueberries = await analyzeProduct('blueberry')
  const blueberryNames = blueberries.cultivars

  const blueberryCommercial: CommercialVariety[] = [
    { name: 'Duke', marketShare: '20%', source: 'USDA, MSU trials', notes: 'Early northern highbush, excellent data' },
    { name: 'Bluecrop', marketShare: '25%', source: 'USDA 1941, extensive', notes: 'Most planted northern highbush' },
    { name: 'Legacy', marketShare: '10%', source: 'USDA trials', notes: 'Northern highbush, good data' },
    { name: 'Elliott', marketShare: '8%', source: 'USDA trials', notes: 'Late season, good data' },
    { name: 'Emerald', marketShare: '15%', source: 'UF/IFAS trials', notes: 'Southern highbush leader, FL data' },
    { name: 'Jewel', marketShare: '12%', source: 'UF/IFAS trials', notes: 'Southern highbush, FL data' },
    { name: 'Star', marketShare: '10%', source: 'UF/IFAS trials', notes: 'Southern highbush' },
  ]

  analyses.push({
    productType: 'blueberry',
    productName: 'Blueberries',
    totalProduction: '~700M lbs/year US',
    ourCultivars: blueberryNames,
    commercialNeeds: blueberryCommercial.map(c => ({
      ...c,
      have: blueberryNames.some(n => n.includes(c.name.toLowerCase()))
    })),
    coveragePct: Math.round(blueberryCommercial.filter(c => blueberryNames.some(n => n.includes(c.name.toLowerCase()))).length / blueberryCommercial.length * 100),
    marketShareCovered: 80, // Have most
    dataAvailability: 'excellent',
    priority: 'medium'
  })

  // ========================================================================
  // OUTPUT RESULTS
  // ========================================================================

  console.log('='.repeat(80))
  console.log('COMMERCIAL COVERAGE BY PRODUCT')
  console.log('='.repeat(80))
  console.log()

  // Sort by priority
  const priorityOrder = { critical: 1, high: 2, medium: 3, low: 4 }
  analyses.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

  analyses.forEach(analysis => {
    const priorityIcon = {
      critical: '🔴',
      high: '🟡',
      medium: '🟢',
      low: '⚪'
    }[analysis.priority]

    console.log(`${priorityIcon} ${analysis.productName.toUpperCase()}`)
    console.log('-'.repeat(80))
    console.log(`Production: ${analysis.totalProduction}`)
    console.log(`Data availability: ${analysis.dataAvailability}`)
    console.log(`Our cultivars: ${analysis.ourCultivars.length}`)
    console.log()

    console.log('Commercial varieties analysis:')
    analysis.commercialNeeds.forEach(v => {
      const icon = v.have ? '✅' : '❌'
      console.log(`  ${icon} ${v.name.padEnd(20)} ${v.marketShare.padEnd(6)} ${v.source}`)
      if (!v.have) {
        console.log(`     → ${v.notes}`)
      }
    })

    console.log()
    console.log(`Coverage: ${analysis.coveragePct}% of major commercial cultivars`)
    console.log(`Market share: ~${Math.round(analysis.marketShareCovered)}% of production`)
    console.log()

    if (analysis.coveragePct < 80) {
      console.log(`⚠️  PRIORITY: Add missing commercial varieties for validation data`)
    } else {
      console.log(`✅ GOOD: Commercial coverage adequate for model validation`)
    }

    console.log()
    console.log()
  })

  // ========================================================================
  // SUMMARY
  // ========================================================================

  console.log('='.repeat(80))
  console.log('PRIORITY GAP SUMMARY')
  console.log('='.repeat(80))
  console.log()

  const gaps = analyses.flatMap(a =>
    a.commercialNeeds
      .filter(c => !c.have)
      .map(c => ({
        product: a.productName,
        variety: c.name,
        marketShare: c.marketShare,
        source: c.source,
        priority: a.priority,
        dataAvailability: a.dataAvailability
      }))
  )

  console.log(`TOTAL MISSING COMMERCIAL VARIETIES: ${gaps.length}`)
  console.log()

  console.log('TOP 10 PRIORITIES (by market impact + data availability):')
  console.log('-'.repeat(80))

  gaps
    .sort((a, b) => {
      const priorityScore = { critical: 1000, high: 100, medium: 10, low: 1 }
      const dataScore = { excellent: 100, good: 50, moderate: 25, limited: 10 }
      const aScore = priorityScore[a.priority] + dataScore[a.dataAvailability] +
                     parseFloat(a.marketShare.replace('%', '').replace('~', ''))
      const bScore = priorityScore[b.priority] + dataScore[b.dataAvailability] +
                     parseFloat(b.marketShare.replace('%', '').replace('~', ''))
      return bScore - aScore
    })
    .slice(0, 10)
    .forEach((gap, i) => {
      const icon = gap.priority === 'critical' ? '🔴' : gap.priority === 'high' ? '🟡' : '🟢'
      console.log(`${i + 1}. ${icon} ${gap.product} - ${gap.variety} (${gap.marketShare})`)
      console.log(`   Data source: ${gap.source}`)
      console.log()
    })

  await closeDriver()
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
