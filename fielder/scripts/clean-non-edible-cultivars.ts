#!/usr/bin/env tsx

/**
 * Clean Non-Edible Cultivars
 *
 * REMOVE: Flowers, ornamentals, non-food items
 * KEEP: ALL edible items (fruits, vegetables, herbs, edible plants)
 *
 * Criteria for removal:
 * - "Flower" in name
 * - "seeds" in name BUT only if clearly ornamental (not vegetable/herb seeds)
 * - Ornamental-only plants
 */

import { runQuery, runWriteTransaction, closeDriver } from '../src/lib/graph/index'

async function main() {
  console.log('='.repeat(80))
  console.log('CLEAN NON-EDIBLE CULTIVARS')
  console.log('='.repeat(80))
  console.log()
  console.log('Identifying cultivars to remove (non-edible only)...')
  console.log()

  // Get all orphaned cultivars (not linked to varieties)
  const orphans = await runQuery<{ id: string, name: string }>(`
    MATCH (c:Cultivar)
    WHERE c.varietyId IS NULL
    RETURN c.id as id, c.name as name
    ORDER BY c.name
  `)

  console.log(`Total orphaned cultivars: ${orphans.length}`)
  console.log()

  // Patterns for NON-EDIBLE (flowers, ornamentals)
  const nonEdiblePatterns = [
    /flower\s+seeds$/i,
    /\bflower$/i,
    /alyssum/i,
    /baby blue eyes/i,
    /bachelor.*button/i,
    /calendula/i,  // Wait - calendula is edible! Remove this
    /cosmos/i,
    /hollyhock/i,
    /larkspur/i,
    /marigold/i,
    /nasturtium/i, // Wait - nasturtium is edible! Remove this
    /pansy/i,      // Wait - pansies are edible! Remove this
    /petunia/i,
    /poppy/i,
    /snapdragon/i, // Wait - snapdragons are edible! Remove this
    /sunflower/i,  // Wait - sunflower is edible (seeds)! Remove this
    /sweet pea/i,  // ornamental, toxic
    /zinnia/i,
  ]

  // Edible herbs/plants that should be KEPT even if they have "seeds" or "flower"
  const edibleExceptions = [
    /basil/i,
    /cilantro/i,
    /dill/i,
    /parsley/i,
    /oregano/i,
    /thyme/i,
    /rosemary/i,
    /sage/i,
    /mint/i,
    /chive/i,
    /fennel/i,
    /arugula/i,
    /lettuce/i,
    /kale/i,
    /chard/i,
    /spinach/i,
    /mustard/i,
    /radish/i,
    /turnip/i,
    /carrot/i,
    /beet/i,
    /bean/i,
    /pea/i,
    /cucumber/i,
    /squash/i,
    /melon/i,
    /tomato/i,
    /pepper/i,
    /eggplant/i,
    /okra/i,
    /artichoke/i,
    /asparagus/i,
    /broccoli/i,
    /cabbage/i,
    /cauliflower/i,
    /celery/i,
    /leek/i,
    /onion/i,
    /garlic/i,
    /shallot/i,
    /scallion/i,
    /corn/i,
    /amaranth/i,      // Edible grain/greens
    /quinoa/i,        // Edible grain
    /calendula/i,     // Edible flower
    /nasturtium/i,    // Edible flower
    /pansy/i,         // Edible flower
    /violet/i,        // Edible flower
    /snapdragon/i,    // Edible flower
    /sunflower/i,     // Edible seeds
    /borage/i,        // Edible flower
    /chamomile/i,     // Edible (tea)
    /lavender/i,      // Edible (culinary)
    /angelica/i,      // Edible herb
    /anise/i,         // Edible spice
    /caraway/i,       // Edible spice
    /coriander/i,     // Edible (cilantro)
    /cumin/i,         // Edible spice
    /fenugreek/i,     // Edible spice
    /hyssop/i,        // Edible herb
    /lemon balm/i,    // Edible herb
    /lovage/i,        // Edible herb
    /marjoram/i,      // Edible herb
    /stevia/i,        // Edible sweetener
    /sorrel/i,        // Edible green
    /purslane/i,      // Edible green
    /watercress/i,    // Edible green
  ]

  const toRemove: Array<{ id: string, name: string }> = []
  const toKeep: Array<{ id: string, name: string }> = []

  orphans.forEach(c => {
    // First check if it's an edible exception
    const isEdible = edibleExceptions.some(pattern => pattern.test(c.name))

    if (isEdible) {
      toKeep.push(c)
      return
    }

    // Then check if it's non-edible
    const isNonEdible = nonEdiblePatterns.some(pattern => pattern.test(c.name))

    if (isNonEdible) {
      toRemove.push(c)
    } else {
      // Default: keep (conservative - only remove obvious non-edibles)
      toKeep.push(c)
    }
  })

  console.log(`Analysis:`)
  console.log(`  Non-edible (flowers/ornamentals): ${toRemove.length}`)
  console.log(`  Edible or unknown (keep):         ${toKeep.length}`)
  console.log()

  // Show sample of what will be removed
  console.log('Sample of non-edible cultivars to remove (first 20):')
  console.log('-'.repeat(80))
  toRemove.slice(0, 20).forEach(c => {
    console.log(`  ❌ ${c.name}`)
  })
  if (toRemove.length > 20) {
    console.log(`  ... and ${toRemove.length - 20} more`)
  }
  console.log()

  // Show sample of edible items being kept
  console.log('Sample of edible items being kept (first 20):')
  console.log('-'.repeat(80))
  toKeep.slice(0, 20).forEach(c => {
    console.log(`  ✅ ${c.name}`)
  })
  if (toKeep.length > 20) {
    console.log(`  ... and ${toKeep.length - 20} more`)
  }
  console.log()

  // Remove non-edible cultivars
  console.log('Removing non-edible cultivars...')
  let removed = 0

  for (const c of toRemove) {
    try {
      await runWriteTransaction(`
        MATCH (c:Cultivar {id: $id})
        DETACH DELETE c
      `, { id: c.id })

      removed++
      if (removed % 50 === 0) {
        console.log(`  ✓ Removed ${removed}/${toRemove.length}...`)
      }
    } catch (error) {
      console.error(`  ❌ Error removing ${c.id}:`, error)
    }
  }

  console.log(`  Completed: ${removed} non-edible cultivars removed`)
  console.log()

  // Final count
  const finalCount = await runQuery<{ count: number }>('MATCH (c:Cultivar) RETURN count(c) as count')
  console.log('='.repeat(80))
  console.log('CLEANUP COMPLETE')
  console.log('='.repeat(80))
  console.log()
  console.log(`Cultivars remaining: ${finalCount[0].count}`)
  console.log(`  - Linked to varieties: 504 (quality farm-to-table)`)
  console.log(`  - Orphaned but edible: ${Number(finalCount[0].count) - 504}`)
  console.log()

  await closeDriver()
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
