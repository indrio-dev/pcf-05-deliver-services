#!/usr/bin/env tsx

/**
 * Add Market Tier Data to Cultivars
 *
 * Adds structured market availability data to understand coverage
 *
 * Market Tiers:
 * - mass_market: 90%+ grocery stores (Washington Navel, Gala apple, Russet potato)
 * - commercial: Widely available, 50-90% stores (Royal Gala, Valencia, Red Anjou)
 * - regional: Strong in specific regions (Texas 1015 onion, Florida oranges)
 * - specialty: Farmers markets, Whole Foods (Cosmic Crisp, heritage breeds)
 * - rare: Hard to find, preservation (Ancient White Park, Ossabaw Island)
 */

import { runWriteTransaction, closeDriver } from '../src/lib/graph/index'

interface MarketData {
  cultivarId: string
  marketTier: 'mass_market' | 'commercial' | 'regional' | 'specialty' | 'rare'
  estimatedMarketShare?: string  // e.g., "40% of Navel oranges"
  availability: string[]          // e.g., ['kroger', 'walmart', 'whole_foods']
  productionVolume?: 'major' | 'regional' | 'boutique'
}

// Sample market tier data for key cultivars
const MARKET_TIER_DATA: MarketData[] = [
  // ========================================================================
  // ORANGES - NAVEL
  // ========================================================================
  {
    cultivarId: 'washington_navel',
    marketTier: 'mass_market',
    estimatedMarketShare: '60% of Navel oranges',
    availability: ['kroger', 'walmart', 'publix', 'whole_foods', 'trader_joes'],
    productionVolume: 'major'
  },
  {
    cultivarId: 'cara_cara',
    marketTier: 'commercial',
    estimatedMarketShare: '15% of Navel oranges',
    availability: ['whole_foods', 'trader_joes', 'publix', 'specialty'],
    productionVolume: 'regional'
  },
  {
    cultivarId: 'lane_late',
    marketTier: 'regional',
    estimatedMarketShare: '10% of Navel oranges',
    availability: ['regional_stores', 'farmers_markets'],
    productionVolume: 'regional'
  },

  // ========================================================================
  // APPLES
  // ========================================================================
  {
    cultivarId: 'honeycrisp',
    marketTier: 'mass_market',
    estimatedMarketShare: '15% of apple market',
    availability: ['kroger', 'walmart', 'publix', 'whole_foods', 'costco'],
    productionVolume: 'major'
  },
  {
    cultivarId: 'gala',
    marketTier: 'mass_market',
    estimatedMarketShare: '20% of apple market',
    availability: ['kroger', 'walmart', 'publix', 'whole_foods', 'costco'],
    productionVolume: 'major'
  },
  {
    cultivarId: 'fuji',
    marketTier: 'mass_market',
    estimatedMarketShare: '12% of apple market',
    availability: ['kroger', 'walmart', 'publix', 'whole_foods'],
    productionVolume: 'major'
  },
  {
    cultivarId: 'granny_smith',
    marketTier: 'mass_market',
    estimatedMarketShare: '10% of apple market',
    availability: ['kroger', 'walmart', 'publix', 'whole_foods'],
    productionVolume: 'major'
  },
  {
    cultivarId: 'cosmic_crisp',
    marketTier: 'commercial',
    estimatedMarketShare: '5% of apple market (growing)',
    availability: ['kroger', 'publix', 'whole_foods', 'costco'],
    productionVolume: 'regional'
  },

  // ========================================================================
  // POTATOES
  // ========================================================================
  {
    cultivarId: 'russet_burbank',
    marketTier: 'mass_market',
    estimatedMarketShare: '80% of russet potatoes, 50% all potatoes',
    availability: ['kroger', 'walmart', 'publix', 'costco', 'restaurants'],
    productionVolume: 'major'
  },
  {
    cultivarId: 'yukon_gold_potato',
    marketTier: 'mass_market',
    estimatedMarketShare: '60% of yellow potatoes, 15% all potatoes',
    availability: ['kroger', 'walmart', 'publix', 'whole_foods', 'costco'],
    productionVolume: 'major'
  },
  {
    cultivarId: 'red_pontiac',
    marketTier: 'mass_market',
    estimatedMarketShare: '50% of red potatoes',
    availability: ['kroger', 'walmart', 'publix'],
    productionVolume: 'major'
  },

  // Add more cultivars with market data...
]

async function main() {
  console.log('='.repeat(80))
  console.log('ADD MARKET TIER DATA TO CULTIVARS')
  console.log('='.repeat(80))
  console.log()
  console.log('This adds structured market availability data for coverage analysis')
  console.log()
  console.log(`Processing ${MARKET_TIER_DATA.length} cultivars with market data...`)
  console.log()

  let updated = 0

  for (const data of MARKET_TIER_DATA) {
    try {
      await runWriteTransaction(`
        MATCH (c:Cultivar {id: $cultivarId})
        SET c.marketTier = $marketTier,
            c.estimatedMarketShare = $estimatedMarketShare,
            c.availability = $availability,
            c.productionVolume = $productionVolume
        RETURN c.displayName as name
      `, {
        cultivarId: data.cultivarId,
        marketTier: data.marketTier,
        estimatedMarketShare: data.estimatedMarketShare || null,
        availability: data.availability,
        productionVolume: data.productionVolume || null
      })

      updated++
      if (updated % 5 === 0) {
        console.log(`  ✓ Updated ${updated}/${MARKET_TIER_DATA.length}...`)
      }
    } catch (error) {
      console.error(`  ❌ Error updating ${data.cultivarId}:`, error)
    }
  }

  console.log()
  console.log(`✅ ${updated} cultivars updated with market tier data`)
  console.log()
  console.log('This is a SAMPLE. To get complete market coverage analysis, we need:')
  console.log()
  console.log('1. USDA NASS production data by cultivar (where available)')
  console.log('2. Grocery store SKU data (what\'s actually stocked)')
  console.log('3. Industry reports (Produce Marketing Association, etc.)')
  console.log('4. Market research on heritage vs commercial production volumes')
  console.log()

  await closeDriver()
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
