#!/usr/bin/env tsx

/**
 * Analyze Market Coverage by Variety
 *
 * Shows what percentage of commercial market is covered vs heritage/specialty
 *
 * Market Tiers:
 * - Mass Market: 90%+ of grocery stores carry this cultivar
 * - Commercial: Common in stores, widely available
 * - Specialty: Farmers markets, specialty stores, regional
 * - Heritage/Rare: Hard to find, boutique, preservation breeds
 */

import { runQuery, closeDriver } from '../src/lib/graph/index'

interface CultivarWithVariety {
  varietyName: string
  varietyId: string
  productType: string
  cultivarName: string
  cultivarId: string
  heritageIntent: string | null
  notes: string | null
}

async function main() {
  console.log('='.repeat(80))
  console.log('MARKET COVERAGE ANALYSIS BY VARIETY')
  console.log('='.repeat(80))
  console.log()

  // Get all cultivars grouped by variety
  const cultivars = await runQuery<CultivarWithVariety>(`
    MATCH (c:Cultivar)-[:BELONGS_TO_VARIETY]->(v:Variety)-[:BELONGS_TO_PRODUCT]->(p:ProductType)
    RETURN COALESCE(v.displayName, v.name, v.id) as varietyName,
           v.id as varietyId,
           p.id as productType,
           c.displayName as cultivarName,
           c.id as cultivarId,
           c.heritageIntent as heritageIntent,
           c.notes as notes
    ORDER BY productType, varietyName, cultivarName
  `)

  // Group by variety
  const varietyMap = new Map<string, CultivarWithVariety[]>()
  cultivars.forEach(c => {
    const key = `${c.productType}|${c.varietyId}`
    if (!varietyMap.has(key)) {
      varietyMap.set(key, [])
    }
    varietyMap.get(key)!.push(c)
  })

  // Analyze each variety
  let currentProduct = ''

  for (const [key, cults] of Array.from(varietyMap.entries())) {
    const variety = cults[0]

    if (variety.productType !== currentProduct) {
      console.log()
      console.log('='.repeat(80))
      console.log(`${variety.productType.toUpperCase()}`)
      console.log('='.repeat(80))
      currentProduct = variety.productType
    }

    console.log()
    console.log(`${variety.varietyName} (${cults.length} cultivars):`)
    console.log('-'.repeat(80))

    // Classify each cultivar
    const classifications = {
      mass_market: [] as string[],
      commercial: [] as string[],
      specialty: [] as string[],
      heritage: [] as string[]
    }

    cults.forEach(c => {
      // Classification logic based on name, heritageIntent, notes
      const name = c.cultivarName.toLowerCase()
      const notes = (c.notes || '').toLowerCase()
      const heritage = c.heritageIntent

      // Mass market indicators
      if (
        // Oranges
        name.includes('washington navel') ||
        name.includes('valencia') && !name.includes('delta') ||
        name === 'ruby red' ||
        name.includes('marsh') ||
        // Apples
        name === 'gala' ||
        name === 'fuji' ||
        name === 'honeycrisp' ||
        name === 'granny smith' ||
        // Others
        name.includes('russet burbank') ||
        name.includes('yukon gold') ||
        name.includes('red pontiac') ||
        notes.includes('commercial standard') ||
        notes.includes('most common') ||
        notes.includes('industry standard')
      ) {
        classifications.mass_market.push(c.cultivarName)
      }
      // Heritage/Rare
      else if (
        heritage === 'true_heritage' ||
        heritage === 'heirloom_quality' ||
        notes.includes('critically rare') ||
        notes.includes('heirloom') ||
        notes.includes('heritage') && notes.includes('original') ||
        notes.includes('colonial') ||
        notes.includes('pre-1') && notes.includes('00')
      ) {
        classifications.heritage.push(c.cultivarName)
      }
      // Modern specialty
      else if (
        heritage === 'modern_flavor' ||
        notes.includes('specialty') ||
        notes.includes('boutique') ||
        notes.includes('gourmet') ||
        notes.includes('premium market')
      ) {
        classifications.specialty.push(c.cultivarName)
      }
      // Commercial (default for non-heritage, non-mass-market)
      else {
        classifications.commercial.push(c.cultivarName)
      }
    })

    // Show breakdown
    if (classifications.mass_market.length > 0) {
      console.log(`  🏪 MASS MARKET (${classifications.mass_market.length}):`)
      classifications.mass_market.forEach(name => console.log(`     - ${name}`))
    }

    if (classifications.commercial.length > 0) {
      console.log(`  🛒 COMMERCIAL (${classifications.commercial.length}):`)
      classifications.commercial.forEach(name => console.log(`     - ${name}`))
    }

    if (classifications.specialty.length > 0) {
      console.log(`  ⭐ SPECIALTY (${classifications.specialty.length}):`)
      classifications.specialty.forEach(name => console.log(`     - ${name}`))
    }

    if (classifications.heritage.length > 0) {
      console.log(`  🏛️  HERITAGE/RARE (${classifications.heritage.length}):`)
      classifications.heritage.forEach(name => console.log(`     - ${name}`))
    }

    // Coverage assessment
    console.log()
    const massMarketPct = Math.round(classifications.mass_market.length / cults.length * 100)
    const commercialPct = Math.round((classifications.mass_market.length + classifications.commercial.length) / cults.length * 100)
    const specialtyPct = Math.round(classifications.specialty.length / cults.length * 100)
    const heritagePct = Math.round(classifications.heritage.length / cults.length * 100)

    console.log(`  Coverage Mix:`)
    console.log(`    Mass Market: ${massMarketPct}%`)
    console.log(`    Commercial:  ${commercialPct}%`)
    console.log(`    Specialty:   ${specialtyPct}%`)
    console.log(`    Heritage:    ${heritagePct}%`)

    // Estimate market coverage
    const hasMainstream = classifications.mass_market.length > 0
    const hasHeritage = classifications.heritage.length > 0
    const hasSpecialty = classifications.specialty.length > 0

    let coverageEstimate = ''
    if (hasMainstream && hasHeritage && hasSpecialty) {
      coverageEstimate = '📊 Excellent coverage - mainstream + heritage + specialty'
    } else if (hasMainstream && hasHeritage) {
      coverageEstimate = '📊 Good coverage - mainstream + heritage, could add specialty'
    } else if (hasMainstream) {
      coverageEstimate = '📊 Basic coverage - mainstream present, missing heritage depth'
    } else if (hasHeritage && !hasMainstream) {
      coverageEstimate = '⚠️  Heritage-heavy - missing mainstream commercial varieties'
    } else {
      coverageEstimate = '❓ Coverage unknown - needs market analysis'
    }

    console.log(`  ${coverageEstimate}`)
  }

  console.log()
  console.log('='.repeat(80))
  console.log('OVERALL SUMMARY')
  console.log('='.repeat(80))
  console.log()

  // Count by heritage intent across all cultivars
  const heritageBreakdown = await runQuery<{
    heritageIntent: string
    count: number
  }>(`
    MATCH (c:Cultivar)-[:BELONGS_TO_VARIETY]->(:Variety)
    RETURN COALESCE(c.heritageIntent, 'unclassified') as heritageIntent,
           count(c) as count
    ORDER BY count DESC
  `)

  console.log('Heritage Classification Across All Cultivars:')
  console.log('-'.repeat(80))
  heritageBreakdown.forEach(h => {
    const pct = Math.round(Number(h.count) / cultivars.length * 100)
    console.log(`  ${h.heritageIntent.padEnd(25)} ${h.count.toString().padStart(3)} (${pct}%)`)
  })

  console.log()
  console.log('='.repeat(80))
  console.log('RECOMMENDATIONS')
  console.log('='.repeat(80))
  console.log()
  console.log('To improve market coverage analysis, consider adding:')
  console.log()
  console.log('1. MARKET SHARE DATA:')
  console.log('   - Estimated % of retail market per cultivar')
  console.log('   - Volume data (USDA NASS production statistics)')
  console.log('   - Grocery store presence (Kroger, Walmart, Whole Foods, etc.)')
  console.log()
  console.log('2. AVAILABILITY TIER:')
  console.log('   - mass_market: 90%+ stores carry')
  console.log('   - commercial: Common, widely available')
  console.log('   - specialty: Farmers markets, specialty stores')
  console.log('   - rare: Heritage preservation, hard to find')
  console.log()
  console.log('3. PRODUCTION VOLUME:')
  console.log('   - Major: Millions of pounds annually')
  console.log('   - Regional: State/regional production')
  console.log('   - Boutique: Small farms, limited production')
  console.log()

  await closeDriver()
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
