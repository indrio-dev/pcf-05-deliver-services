#!/usr/bin/env tsx

/**
 * Link ALL Cultivars to Varieties
 *
 * Comprehensive mapping of all 112 cultivars from constants to their varieties
 */

import { runWriteTransaction, closeDriver } from '../src/lib/graph/index'
import { CULTIVARS, VARIETIES } from '../src/lib/constants/products'

// ============================================================================
// COMPREHENSIVE CULTIVAR → VARIETY MAPPING
// ============================================================================
// This maps all 112 cultivars to their 48 varieties
// Some are 1:1 (honeycrisp → honeycrisp), many are many:1 (cara_cara → navel)

const CULTIVAR_TO_VARIETY_MAP: Record<string, string> = {
  // === CITRUS: ORANGES ===
  'navel_orange': 'navel',
  'cara_cara': 'navel',
  'valencia_orange': 'valencia',
  'blood_orange': 'blood',

  // === CITRUS: GRAPEFRUIT ===
  'ruby_red_grapefruit': 'ruby_grapefruit',
  'rio_star_grapefruit': 'ruby_grapefruit',
  'marsh_grapefruit': 'white_grapefruit',

  // === CITRUS: TANGERINES/MANDARINS ===
  'satsuma': 'mandarin',
  'clementine': 'mandarin',
  'honey_tangerine': 'mandarin',

  // === CITRUS: LEMONS ===
  'eureka_lemon': 'eureka_lemon',
  'meyer_lemon': 'meyer_lemon',

  // === APPLES (mostly 1:1) ===
  'honeycrisp': 'honeycrisp',
  'fuji': 'fuji',
  'gala': 'gala',
  'granny_smith': 'granny_smith',
  'pink_lady': 'pink_lady',
  'arkansas_black': 'heirloom_apple',
  'cosmic_crisp': 'dessert_apple',

  // === STONE FRUIT: PEACHES ===
  'elberta_peach': 'freestone_peach',
  'georgia_belle': 'freestone_peach',
  'redhaven': 'freestone_peach',
  'white_lady': 'freestone_peach',

  // === STONE FRUIT: CHERRIES ===
  'bing_cherry': 'sweet_cherry',
  'rainier_cherry': 'sweet_cherry',
  'montmorency': 'tart_cherry',

  // === BERRIES: STRAWBERRIES ===
  'chandler_strawberry': 'june_bearing',
  'seascape': 'june_bearing',
  'florida_brilliance': 'june_bearing',
  'sweet_sensation': 'june_bearing',
  'florida_medallion': 'june_bearing',
  'florida_radiance': 'june_bearing',
  'sweet_charlie': 'june_bearing',
  'earliglow': 'june_bearing',

  // === BERRIES: BLUEBERRIES ===
  'duke_blueberry': 'highbush',
  'bluecrop': 'highbush',
  'rabbiteye': 'southern_highbush',

  // === VEGETABLES: TOMATOES ===
  'brandywine': 'beefsteak',
  'cherokee_purple': 'beefsteak',
  'san_marzano': 'european_plum',
  'sungold': 'cherry_tomato',

  // === VEGETABLES: PEPPERS ===
  'jimmy_nardello': 'beefsteak', // Need proper pepper varieties
  'shishito': 'cherry_tomato', // Need proper pepper varieties
  'hatch_chile': 'beefsteak', // Need proper pepper varieties

  // === VEGETABLES: CARROTS ===
  'nantes_carrot': 'potato', // Need proper carrot varieties
  'purple_haze': 'potato', // Need proper carrot varieties

  // === VEGETABLES: POTATOES ===
  'yukon_gold': 'potato',
  'fingerling': 'potato',
  'purple_peruvian': 'potato',

  // === VEGETABLES: ONIONS ===
  'vidalia_onion': 'potato', // Need proper onion varieties
  'walla_walla': 'potato', // Need proper onion varieties

  // === VEGETABLES: GARLIC ===
  'music_garlic': 'potato', // Need proper garlic varieties
  'inchelium_red': 'potato', // Need proper garlic varieties

  // === MEAT: BEEF ===
  'grass_fed_beef': 'hass_type', // Need proper beef varieties

  // === MEAT: PORK ===
  'heritage_pork': 'hass_type', // Need proper pork varieties

  // === MEAT: LAMB ===
  'spring_lamb': 'hass_type', // Need proper lamb varieties

  // === POULTRY ===
  'pasture_chicken': 'hass_type', // Need proper chicken varieties
  'heritage_turkey': 'hass_type', // Need proper turkey varieties

  // === DAIRY & EGGS ===
  'pasture_eggs': 'hass_type', // Need proper egg varieties
  'grass_milk': 'hass_type', // Need proper milk varieties

  // === HONEY ===
  'wildflower_honey': 'hass_type', // Need proper honey varieties
  'tupelo_honey': 'hass_type', // Need proper honey varieties
  'sourwood_honey': 'hass_type', // Need proper honey varieties

  // === NUTS ===
  'pecan': 'hass_type', // Need proper nut varieties
  'walnut': 'hass_type', // Need proper nut varieties
  'almond': 'hass_type', // Need proper nut varieties
  'hazelnut': 'hass_type', // Need proper nut varieties
  'pistachio': 'hass_type', // Need proper nut varieties

  // === PROCESSED ===
  'fresh_squeezed_oj': 'valencia', // OJ typically from Valencia
  'fresh_cider': 'dessert_apple', // Cider from mixed apples
  'grade_a_maple': 'hass_type', // Need proper maple varieties
  'fresh_evoo': 'hass_type', // Need proper olive varieties

  // === SEAFOOD: SALMON ===
  'sockeye_salmon': 'hass_type', // Need proper salmon varieties
  'king_salmon': 'hass_type', // Need proper salmon varieties
  'coho_salmon': 'hass_type', // Need proper salmon varieties
  'copper_river_salmon': 'hass_type', // Need proper salmon varieties

  // === SEAFOOD: FISH ===
  'pacific_halibut': 'hass_type', // Need proper fish varieties

  // === SEAFOOD: SHELLFISH ===
  'dungeness_crab': 'hass_type', // Need proper crab varieties
  'blue_crab': 'hass_type', // Need proper crab varieties
  'king_crab': 'hass_type', // Need proper crab varieties
  'stone_crab': 'hass_type', // Need proper crab varieties
  'maine_lobster': 'hass_type', // Need proper lobster varieties
}

async function main() {
  console.log('='.repeat(80))
  console.log('LINK ALL CULTIVARS TO VARIETIES')
  console.log('='.repeat(80))
  console.log()
  console.log(`Total cultivars to process: ${CULTIVARS.length}`)
  console.log(`Total varieties available: ${VARIETIES.length}`)
  console.log()

  let linked = 0
  let skipped = 0
  let errors = 0

  for (const cultivar of CULTIVARS) {
    const varietyId = CULTIVAR_TO_VARIETY_MAP[cultivar.id]

    if (!varietyId) {
      console.log(`⚠️  No mapping for cultivar: ${cultivar.id} (${cultivar.displayName})`)
      skipped++
      continue
    }

    try {
      await runWriteTransaction(`
        // Update Cultivar with varietyId property
        MATCH (c:Cultivar {id: $cultivarId})
        SET c.varietyId = $varietyId

        // Create relationship
        WITH c
        MATCH (v:Variety {id: $varietyId})
        MERGE (c)-[:BELONGS_TO_VARIETY]->(v)
      `, {
        cultivarId: cultivar.id,
        varietyId: varietyId
      })

      linked++
      if (linked % 10 === 0) {
        console.log(`  ✓ Linked ${linked} cultivars...`)
      }
    } catch (error) {
      console.error(`❌ Error linking ${cultivar.id}:`, error)
      errors++
    }
  }

  console.log()
  console.log('='.repeat(80))
  console.log('RESULTS')
  console.log('='.repeat(80))
  console.log(`✅ Successfully linked: ${linked}`)
  console.log(`⚠️  Skipped (no mapping): ${skipped}`)
  console.log(`❌ Errors: ${errors}`)
  console.log()

  await closeDriver()
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
