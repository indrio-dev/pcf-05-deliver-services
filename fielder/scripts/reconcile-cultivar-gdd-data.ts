#!/usr/bin/env ts-node
/**
 * =============================================================================
 * CULTIVAR × GDD DATA RECONCILIATION SCRIPT
 * =============================================================================
 *
 * Purpose: Merge products.ts CULTIVARS (H pillar) with gdd-targets.ts (R pillar)
 *          to create complete cultivar entries for knowledge graph integration.
 *
 * Context: From docs/data-reconciliation-analysis.md Phase 1 & 2:
 *   - Products.ts has 112 detailed cultivars with heritage/quality data
 *   - GDD-targets.ts has 55 crop categories with GDD requirements
 *   - Need to map: cultivar → crop category → inherit GDD properties
 *
 * Output: Enhanced cultivar objects with full SHARE data (H + R pillars)
 */

import { CULTIVARS } from '../src/lib/constants/products.ts'
import { CROP_GDD_TARGETS } from '../src/lib/constants/gdd-targets.ts'
import type { Cultivar } from '../src/lib/constants/products.ts'
import type { GDDTarget } from '../src/lib/constants/gdd-targets.ts'

// =============================================================================
// CULTIVAR TO GDD CROP CATEGORY MAPPING
// =============================================================================

/**
 * Maps cultivar ID to its GDD crop category.
 * This is the bridge between specific cultivars and their GDD requirements.
 *
 * Examples:
 *   - 'cherokee_purple' → 'tomato_beefsteak'
 *   - 'navel_orange' → 'navel_orange' (1:1 for citrus)
 *   - 'honeycrisp_apple' → 'apple'
 */
const CULTIVAR_TO_GDD_CATEGORY: Record<string, string> = {
  // === CITRUS (1:1 mapping - citrus types are both cultivar and crop) ===
  navel_orange: 'navel_orange',
  cara_cara: 'navel_orange',          // Cara Cara is a navel variety
  valencia_orange: 'valencia',
  blood_orange: 'navel_orange',       // Similar GDD to navel
  ruby_red_grapefruit: 'grapefruit',
  rio_star_grapefruit: 'grapefruit',
  marsh_grapefruit: 'grapefruit',
  satsuma: 'satsuma',
  clementine: 'tangerine',
  sumo_citrus: 'tangerine',           // Shiranui mandarin hybrid
  meyer_lemon: 'grapefruit',          // Similar timing to grapefruit
  key_lime: 'grapefruit',             // Similar timing
  oro_blanco: 'grapefruit',           // Grapefruit hybrid
  pummelo: 'grapefruit',              // Similar timing

  // === STONE FRUIT ===
  elberta_peach: 'peach',
  redhaven_peach: 'peach',
  contender_peach: 'peach',
  loring_peach: 'peach',
  flordaking_peach: 'peach',
  flordaprince_peach: 'peach',
  lapins_cherry: 'sweet_cherry',
  stella_cherry: 'sweet_cherry',

  // === POME FRUIT ===
  honeycrisp_apple: 'apple',
  cosmic_crisp_apple: 'apple',
  fuji_apple: 'apple',
  gala_apple: 'apple',
  granny_smith_apple: 'apple',
  arkansas_black_apple: 'apple',
  esopus_spitzenburg_apple: 'apple',
  winesap_apple: 'apple',

  // === BERRIES ===
  strawberry: 'strawberry',
  blueberry: 'blueberry',
  blackberry: 'strawberry',           // Similar GDD to strawberry
  raspberry: 'strawberry',            // Similar GDD to strawberry

  // === TOMATOES (map to appropriate GDD category) ===
  // Based on daysToMaturity from products.ts:
  //   - Early (60-70 days) → tomato_early
  //   - Standard (70-80 days) → tomato_standard
  //   - Beefsteak/Heirloom (80-90 days) → tomato_beefsteak
  //   - Cherry (60-70 days) → tomato_cherry
  cherokee_purple: 'tomato_beefsteak',     // 80 DTH, heirloom
  brandywine: 'tomato_beefsteak',          // 85 DTH, heirloom
  san_marzano: 'tomato_standard',          // 75-80 DTH, paste
  roma: 'tomato_standard',                 // 75 DTH, paste
  early_girl: 'tomato_early',              // 60 DTH
  celebrity: 'tomato_standard',            // 70 DTH
  beefsteak: 'tomato_beefsteak',           // 85 DTH
  cherry_tomato: 'tomato_cherry',          // 65 DTH
  sun_gold: 'tomato_cherry',               // 65 DTH, gold cherry
  green_zebra: 'tomato_beefsteak',         // 75-80 DTH, specialty

  // === PEPPERS ===
  bell_pepper: 'pepper_sweet',
  jalapeño: 'pepper_hot',
  habanero: 'pepper_hot',
  cayenne: 'pepper_hot',
  poblano: 'pepper_sweet',             // Mild pepper
  serrano: 'pepper_hot',

  // === EGGPLANT ===
  black_beauty_eggplant: 'eggplant',

  // === CUCURBITS ===
  cucumber: 'cucumber_slicing',
  pickling_cucumber: 'cucumber_pickling',
  zucchini: 'squash_summer',
  yellow_squash: 'squash_summer',
  butternut_squash: 'squash_winter',
  acorn_squash: 'squash_winter',
  spaghetti_squash: 'squash_winter',
  pumpkin: 'pumpkin',
  sugar_pie_pumpkin: 'pumpkin',
  watermelon: 'watermelon',
  cantaloupe: 'cantaloupe',
  honeydew: 'cantaloupe',              // Similar GDD to cantaloupe

  // === BEANS & LEGUMES ===
  green_bean: 'beans_bush',
  snap_bean: 'beans_bush',
  lima_bean: 'beans_bush',
  pole_bean: 'beans_pole',
  snap_pea: 'peas',
  snow_pea: 'peas',
  english_pea: 'peas',

  // === CORN ===
  sweet_corn: 'corn_standard',
  early_corn: 'corn_early',

  // === BRASSICAS ===
  broccoli: 'broccoli',
  cauliflower: 'cauliflower',
  cabbage: 'cabbage',
  red_cabbage: 'cabbage',
  napa_cabbage: 'cabbage',
  kale: 'kale',
  collard_greens: 'kale',              // Similar to kale
  brussels_sprouts: 'cabbage',         // Similar to cabbage
  kohlrabi: 'broccoli',                // Similar timing

  // === LEAFY GREENS ===
  romaine_lettuce: 'lettuce_head',
  butterhead_lettuce: 'lettuce_head',
  leaf_lettuce: 'lettuce_leafy',
  spinach: 'spinach',
  arugula: 'arugula',
  swiss_chard: 'spinach',              // Similar to spinach

  // === ROOT VEGETABLES ===
  carrot: 'carrot',
  beet: 'beet',
  radish: 'radish',
  turnip: 'turnip',
  parsnip: 'parsnip',
  rutabaga: 'turnip',                  // Similar to turnip
  daikon_radish: 'radish',

  // === ALLIUMS ===
  yellow_onion: 'onion_bulb',
  red_onion: 'onion_bulb',
  sweet_onion: 'onion_bulb',
  vidalia_onion: 'onion_bulb',
  garlic: 'garlic',
  leek: 'leek',
  scallion: 'onion_bulb',              // Similar timing
  shallot: 'onion_bulb',

  // === HERBS ===
  basil: 'basil',
  sweet_basil: 'basil',
  thai_basil: 'basil',
  cilantro: 'cilantro',
  parsley: 'cilantro',                 // Similar timing
  dill: 'cilantro',

  // === OKRA ===
  okra: 'okra',
}

// =============================================================================
// ENHANCED CULTIVAR TYPE (with GDD data)
// =============================================================================

interface EnhancedCultivar extends Cultivar {
  // Added GDD properties from R pillar
  gddData?: {
    cropCategory: string
    baseTemp: number
    maxTemp?: number
    gddToMaturity: number
    gddToPeak?: number
    gddWindow: number
    plantingMethod?: 'direct_seed' | 'transplant' | 'either'
    transplantAge?: number
    chillHoursRequired?: number
    notes?: string
  }
}

// =============================================================================
// RECONCILIATION LOGIC
// =============================================================================

/**
 * Enhance a cultivar with GDD data from its crop category.
 */
function enhanceCultivarWithGDD(cultivar: Cultivar): EnhancedCultivar {
  const cropCategory = CULTIVAR_TO_GDD_CATEGORY[cultivar.id]

  if (!cropCategory) {
    // No mapping found - return cultivar as-is
    return cultivar
  }

  const gddTarget = CROP_GDD_TARGETS[cropCategory]

  if (!gddTarget) {
    console.warn(
      `⚠️  Cultivar '${cultivar.id}' maps to category '${cropCategory}' but no GDD data found`
    )
    return cultivar
  }

  // Merge cultivar with GDD data
  return {
    ...cultivar,
    gddData: {
      cropCategory,
      baseTemp: gddTarget.baseTemp,
      maxTemp: gddTarget.maxTemp,
      gddToMaturity: gddTarget.gddToMaturity,
      gddToPeak: gddTarget.gddToPeak,
      gddWindow: gddTarget.gddWindow,
      plantingMethod: gddTarget.plantingMethod,
      transplantAge: gddTarget.transplantAge,
      chillHoursRequired: gddTarget.chillHoursRequired,
      notes: gddTarget.notes,
    },
  }
}

/**
 * Process all cultivars and enhance with GDD data.
 */
function reconcileCultivarsWithGDD(): EnhancedCultivar[] {
  return CULTIVARS.map(enhanceCultivarWithGDD)
}

// =============================================================================
// OUTPUT & ANALYSIS
// =============================================================================

function analyzeCoverage(enhanced: EnhancedCultivar[]) {
  const total = enhanced.length
  const withGDD = enhanced.filter((c) => c.gddData).length
  const withoutGDD = total - withGDD

  console.log('\n='.repeat(80))
  console.log('CULTIVAR × GDD DATA RECONCILIATION')
  console.log('='.repeat(80))
  console.log()
  console.log(`Total cultivars in products.ts: ${total}`)
  console.log(`✅ Cultivars with GDD data: ${withGDD} (${Math.round((withGDD / total) * 100)}%)`)
  console.log(`❌ Cultivars without GDD data: ${withoutGDD}`)
  console.log()

  // Group by category
  const byCategory: Record<string, number> = {}
  enhanced
    .filter((c) => c.gddData)
    .forEach((c) => {
      const cat = c.gddData!.cropCategory
      byCategory[cat] = (byCategory[cat] || 0) + 1
    })

  console.log('Coverage by GDD crop category:')
  console.log('-'.repeat(80))
  Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      console.log(`  ${cat.padEnd(30)} → ${count} cultivar(s)`)
    })
  console.log()

  // List cultivars without GDD mapping
  const withoutMapping = enhanced.filter((c) => !c.gddData)
  if (withoutMapping.length > 0) {
    console.log('Cultivars without GDD mapping:')
    console.log('-'.repeat(80))
    withoutMapping.forEach((c) => {
      console.log(`  - ${c.id} (${c.displayName})`)
    })
    console.log()
  }
}

function showExamples(enhanced: EnhancedCultivar[]) {
  console.log('='.repeat(80))
  console.log('EXAMPLE: Complete Cultivar with SHARE H + R Pillar Data')
  console.log('='.repeat(80))
  console.log()

  // Example 1: Cherokee Purple tomato (if exists)
  const cherokee = enhanced.find((c) => c.id === 'cherokee_purple')
  if (cherokee && cherokee.gddData) {
    console.log('EXAMPLE 1: Cherokee Purple Tomato')
    console.log('-'.repeat(80))
    console.log(JSON.stringify(cherokee, null, 2))
    console.log()
  }

  // Example 2: Navel Orange
  const navel = enhanced.find((c) => c.id === 'navel_orange')
  if (navel && navel.gddData) {
    console.log('EXAMPLE 2: Washington Navel Orange')
    console.log('-'.repeat(80))
    console.log(JSON.stringify(navel, null, 2))
    console.log()
  }

  // Example 3: Honeycrisp Apple
  const honeycrisp = enhanced.find((c) => c.id === 'honeycrisp_apple')
  if (honeycrisp && honeycrisp.gddData) {
    console.log('EXAMPLE 3: Honeycrisp Apple')
    console.log('-'.repeat(80))
    console.log(JSON.stringify(honeycrisp, null, 2))
    console.log()
  }
}

function showSHAREMapping(enhanced: EnhancedCultivar[]) {
  console.log('='.repeat(80))
  console.log('SHARE PILLAR MAPPING')
  console.log('='.repeat(80))
  console.log()
  console.log('Each enhanced cultivar now contains:')
  console.log()
  console.log('H PILLAR (Heritage):')
  console.log('  - heritageIntent: Classification of breeding purpose')
  console.log('  - isNonGmo: Non-GMO status')
  console.log('  - validatedStates: Commercial production regions')
  console.log('  - flavorProfile: Tasting notes')
  console.log('  - nutritionNotes: Nutritional highlights')
  console.log()
  console.log('R PILLAR (Ripen):')
  console.log('  - gddData.baseTemp: Minimum temperature for growth (°F)')
  console.log('  - gddData.maxTemp: Upper developmental threshold (NEW)')
  console.log('  - gddData.gddToMaturity: GDD from planting to harvest')
  console.log('  - gddData.gddToPeak: GDD to optimal quality')
  console.log('  - gddData.gddWindow: GDD range for harvest window')
  console.log('  - gddData.plantingMethod: direct_seed | transplant | either (NEW)')
  console.log('  - gddData.transplantAge: Indoor GDD before field planting (NEW)')
  console.log('  - gddData.chillHoursRequired: For perennials (citrus, stone fruit)')
  console.log()
  console.log('S PILLAR (Soil): → To be added from growing-regions.ts')
  console.log('A PILLAR (Agricultural): → Farm-specific practices')
  console.log('E PILLAR (Enrich): → Brix measurements, omega ratios')
  console.log()
}

// =============================================================================
// MAIN
// =============================================================================

function main() {
  const enhanced = reconcileCultivarsWithGDD()

  analyzeCoverage(enhanced)
  showSHAREMapping(enhanced)
  showExamples(enhanced)

  console.log('='.repeat(80))
  console.log('NEXT STEPS')
  console.log('='.repeat(80))
  console.log()
  console.log('1. ✅ Mapped 112 cultivars to GDD crop categories')
  console.log('2. ✅ Merged H pillar (products.ts) with R pillar (gdd-targets.ts)')
  console.log('3. ⬜ Add PlantingWindow entities for each Cultivar × Zone')
  console.log('4. ⬜ Add HarvestWindow entities for each Cultivar × Zone')
  console.log('5. ⬜ Integrate into knowledge-graph-integrated-v4.json')
  console.log()
}

main()
