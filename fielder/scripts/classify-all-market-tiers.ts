#!/usr/bin/env tsx

/**
 * Classify All Cultivars by Market Tier
 *
 * Systematically assigns market tier to all 609 cultivars based on:
 * - Name matching (known commercial varieties)
 * - Heritage intent
 * - Production notes
 * - Industry knowledge
 */

import { runQuery, runWriteTransaction, closeDriver } from '../src/lib/graph/index'

interface Cultivar {
  id: string
  displayName: string
  productId: string
  heritageIntent: string | null
  notes: string | null
  marketTier: string | null
}

type MarketTier = 'mass_market' | 'commercial' | 'regional' | 'specialty' | 'rare'

function classifyMarketTier(c: Cultivar): { tier: MarketTier; share?: string } {
  const name = (c.displayName || c.id).toLowerCase()
  const notes = (c.notes || '').toLowerCase()
  const heritage = c.heritageIntent

  // ========================================================================
  // MASS MARKET (90%+ of stores carry these)
  // ========================================================================

  // Apples - Top 6
  if (name === 'gala' || name === 'red delicious' || name === 'golden delicious' ||
      name === 'granny smith' || name === 'fuji' || name === 'honeycrisp') {
    return {
      tier: 'mass_market',
      share: name === 'gala' ? '20% of apple market' :
             name === 'red delicious' ? '25% of apple market' :
             name === 'golden delicious' ? '10% of apple market' :
             name === 'granny smith' ? '7% of apple market' :
             name === 'fuji' ? '10% of apple market' :
             name === 'honeycrisp' ? '15% of apple market' : undefined
    }
  }

  // Oranges - Mass market
  if (name.includes('washington navel') || name.includes('hamlin') ||
      (name === 'valencia' && !name.includes('delta'))) {
    return {
      tier: 'mass_market',
      share: name.includes('washington') ? '60% of Navel oranges' :
             name.includes('hamlin') ? '30% of FL juice oranges' :
             name === 'valencia' ? '40% of juice oranges' : undefined
    }
  }

  // Potatoes - Mass market
  if (name.includes('russet burbank') || name.includes('yukon gold') ||
      name.includes('red pontiac')) {
    return {
      tier: 'mass_market',
      share: name.includes('russet burbank') ? '50% of all potatoes' :
             name.includes('yukon') ? '15% of all potatoes' : undefined
    }
  }

  // Strawberries - California commercial
  if (name.includes('albion')) {
    return { tier: 'mass_market', share: '40% of California strawberries' }
  }

  // Tomatoes - Top hybrids
  if (name.includes('better boy') || name.includes('early girl')) {
    return {
      tier: 'mass_market',
      share: name.includes('better boy') ? '20% of home garden market' :
             '15% of home garden market'
    }
  }

  // Beef - Angus dominates
  if (name.includes('black angus') || name.includes('certified angus')) {
    return { tier: 'mass_market', share: 'Angus = 60% of US beef' }
  }

  // Chicken - Cornish Cross is 99% of commercial
  if (name.includes('cornish cross') || name.includes('jumbo cornish')) {
    return { tier: 'mass_market', share: '99% of commercial chicken' }
  }

  // Eggs - ISA Brown, Red Sex Link commercial leaders
  if (name.includes('isa brown') || name.includes('red sex link') ||
      name.includes('white leghorn')) {
    return { tier: 'mass_market', share: 'Commercial egg production leader' }
  }

  // Pork - Commercial crosses
  if (name.includes('yorkshire') || name.includes('commercial cross') ||
      name.includes('landrace')) {
    return { tier: 'commercial', share: 'Commercial pork standard' }
  }

  // Salmon - Wild Pacific
  if ((name.includes('sockeye') || name.includes('king') || name.includes('coho')) &&
      !name.includes('copper river')) {
    return { tier: 'commercial', share: 'Wild-caught commercial' }
  }

  // ========================================================================
  // COMMERCIAL (Widely available, 50-90% of stores)
  // ========================================================================

  // Modern commercial indicators
  if (notes.includes('commercial standard') ||
      notes.includes('commercial variety') ||
      notes.includes('industry standard') ||
      notes.includes('most common') ||
      notes.includes('widely planted') ||
      heritage === 'modern_flavor' && !notes.includes('specialty') && !notes.includes('boutique')) {
    return { tier: 'commercial' }
  }

  // Specific commercial varieties
  if (name.includes('royal gala') || name.includes('cosmic crisp') ||
      name.includes('cara cara') || name.includes('ruby red') ||
      name.includes('celebrity') || name.includes('camarosa') ||
      name.includes('duroc') || name.includes('hampshire') ||
      name.includes('berkshire')) {
    return { tier: 'commercial' }
  }

  // Modern breeding programs (UC Davis, USDA, etc.)
  if (notes.includes('uc davis') || notes.includes('usda release') ||
      notes.includes('modern variety') || notes.includes('modern hybrid') ||
      notes.includes('modern selection')) {
    return { tier: 'commercial' }
  }

  // ========================================================================
  // REGIONAL (Strong in specific regions)
  // ========================================================================

  if (notes.includes('texas specialty') || notes.includes('florida specialty') ||
      notes.includes('california specialty') || notes.includes('regional') ||
      name.includes('texas 1015') || name.includes('vidalia') ||
      name.includes('walla walla') || name.includes('copper river')) {
    return { tier: 'regional' }
  }

  // ========================================================================
  // SPECIALTY (Farmers markets, Whole Foods, specialty stores)
  // ========================================================================

  if (heritage === 'modern_flavor' &&
      (notes.includes('specialty') || notes.includes('boutique') ||
       notes.includes('gourmet') || notes.includes('premium market'))) {
    return { tier: 'specialty' }
  }

  // New releases, boutique breeding
  if (notes.includes('sweettango') || notes.includes('envy') ||
      notes.includes('jazz') || notes.includes('pink lady') ||
      notes.includes('zaiger') || notes.includes('boutique')) {
    return { tier: 'specialty' }
  }

  // Heritage breeds with small markets
  if (heritage === 'heirloom_quality' &&
      (notes.includes('gourmet') || notes.includes('specialty market') ||
       notes.includes('farmers market'))) {
    return { tier: 'specialty' }
  }

  // ========================================================================
  // RARE (Heritage preservation, hard to find)
  // ========================================================================

  if (heritage === 'true_heritage' &&
      (notes.includes('critically rare') || notes.includes('endangered') ||
       notes.includes('preservation') || notes.includes('critically') ||
       notes.includes('rare'))) {
    return { tier: 'rare' }
  }

  // Ancient grains
  if (name.includes('einkorn') || name.includes('emmer') ||
      name.includes('khorasan') || name.includes('spelt')) {
    return { tier: 'rare' }
  }

  // Heritage livestock
  if ((name.includes('ossabaw') || name.includes('guinea hog') ||
       name.includes('mulefoot') || name.includes('ancient white park') ||
       name.includes('navajo-churro') || name.includes('icelandic')) &&
      notes.includes('rare')) {
    return { tier: 'rare' }
  }

  // Pre-1850 heirlooms
  if (notes.includes('pre-1') && (notes.includes('00') || notes.includes('50')) &&
      heritage === 'true_heritage') {
    return { tier: 'rare' }
  }

  // ========================================================================
  // DEFAULT CLASSIFICATION BY HERITAGE INTENT
  // ========================================================================

  if (heritage === 'true_heritage') {
    return { tier: 'specialty' }  // True heritage but not rare = specialty
  }

  if (heritage === 'heirloom_quality') {
    return { tier: 'specialty' }  // Heirloom quality = specialty market
  }

  if (heritage === 'modern_flavor') {
    return { tier: 'commercial' }  // Modern breeding = commercial
  }

  // No heritage intent specified
  if (notes.includes('commercial') || notes.includes('standard')) {
    return { tier: 'commercial' }
  }

  // Default: commercial (conservative - assume available unless proven rare)
  return { tier: 'commercial' }
}

async function main() {
  console.log('='.repeat(80))
  console.log('CLASSIFY ALL CULTIVARS BY MARKET TIER')
  console.log('='.repeat(80))
  console.log()

  // Get all cultivars linked to varieties
  const cultivars = await runQuery<Cultivar>(`
    MATCH (c:Cultivar)-[:BELONGS_TO_VARIETY]->(:Variety)
    RETURN c.id as id,
           c.displayName as displayName,
           c.productId as productId,
           c.heritageIntent as heritageIntent,
           c.notes as notes,
           c.marketTier as marketTier
    ORDER BY c.productId, c.displayName
  `)

  console.log(`Total cultivars to classify: ${cultivars.length}`)
  console.log()

  let updated = 0
  let skipped = 0

  console.log('Classifying and updating...')

  for (const cult of cultivars) {
    // Skip if already has market tier
    if (cult.marketTier) {
      skipped++
      continue
    }

    // Classify
    const classification = classifyMarketTier(cult)

    // Update in database
    try {
      await runWriteTransaction(`
        MATCH (c:Cultivar {id: $id})
        SET c.marketTier = $marketTier,
            c.estimatedMarketShare = $estimatedMarketShare
      `, {
        id: cult.id,
        marketTier: classification.tier,
        estimatedMarketShare: classification.share || null
      })

      updated++
      if (updated % 50 === 0) {
        console.log(`  ✓ Classified ${updated}/${cultivars.length - skipped}...`)
      }
    } catch (error) {
      console.error(`  ❌ Error updating ${cult.id}:`, error)
    }
  }

  console.log()
  console.log('='.repeat(80))
  console.log('CLASSIFICATION COMPLETE')
  console.log('='.repeat(80))
  console.log()
  console.log(`✅ Classified: ${updated}`)
  console.log(`⚠️  Already had tier: ${skipped}`)
  console.log()

  // Summary by tier
  const tierSummary = await runQuery<{
    marketTier: string
    count: number
  }>(`
    MATCH (c:Cultivar)-[:BELONGS_TO_VARIETY]->(:Variety)
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

  console.log('MARKET TIER DISTRIBUTION:')
  console.log('-'.repeat(80))

  const total = tierSummary.reduce((sum, t) => sum + Number(t.count), 0)

  tierSummary.forEach(t => {
    const icon = {
      'mass_market': '🏪',
      'commercial': '🛒',
      'regional': '📍',
      'specialty': '⭐',
      'rare': '🏛️'
    }[t.marketTier] || '❓'

    const pct = Math.round(Number(t.count) / total * 100)
    console.log(`${icon} ${t.marketTier.padEnd(15)} ${String(t.count).padStart(3)} cultivars (${pct}%)`)
  })

  console.log()
  console.log(`Total classified: ${total}`)
  console.log()

  // By category
  console.log('='.repeat(80))
  console.log('MARKET TIER DISTRIBUTION BY CATEGORY')
  console.log('='.repeat(80))
  console.log()

  const byCategory = await runQuery<{
    productType: string
    marketTier: string
    count: number
  }>(`
    MATCH (c:Cultivar)-[:BELONGS_TO_VARIETY]->(:Variety)-[:BELONGS_TO_PRODUCT]->(p:ProductType)
    WHERE c.marketTier IS NOT NULL
    RETURN p.id as productType, c.marketTier as marketTier, count(c) as count
    ORDER BY productType,
      CASE c.marketTier
        WHEN 'mass_market' THEN 1
        WHEN 'commercial' THEN 2
        WHEN 'regional' THEN 3
        WHEN 'specialty' THEN 4
        WHEN 'rare' THEN 5
      END
  `)

  let currentProduct = ''
  byCategory.forEach(row => {
    if (row.productType !== currentProduct) {
      console.log()
      console.log(`${row.productType.toUpperCase()}:`)
      currentProduct = row.productType
    }

    const icon = {
      'mass_market': '🏪',
      'commercial': '🛒',
      'regional': '📍',
      'specialty': '⭐',
      'rare': '🏛️'
    }[row.marketTier] || '❓'

    console.log(`  ${icon} ${row.marketTier.padEnd(15)} ${row.count}`)
  })

  console.log()

  await closeDriver()
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
