#!/usr/bin/env tsx

/**
 * Analyze Cultivars - Separate Good from Junk
 *
 * Identify farm-to-table cultivars vs seed catalog junk
 */

import { runQuery } from '../src/lib/graph/neo4j'

interface Cultivar {
  id: string
  name: string
  varietyId?: string
}

async function main() {
  console.log('='.repeat(80))
  console.log('CULTIVAR ANALYSIS - GOOD vs JUNK')
  console.log('='.repeat(80))
  console.log()

  // Get all cultivars
  const allCultivars = await runQuery<Cultivar>(
    'MATCH (c:Cultivar) RETURN c.id as id, c.name as name, c.varietyId as varietyId ORDER BY c.name'
  )

  console.log(`Total cultivars in database: ${allCultivars.length}`)
  console.log()

  // Heuristics for identifying junk:
  // - Contains "seeds" in the name
  // - Contains "Flower" in the name
  // - Contains parenthetical descriptions
  // - Very long names with lots of descriptors

  const junkPatterns = [
    /seeds$/i,
    /\bflower\b/i,
    /\bseed\b/i,
    /variety pack/i,
    /\bgarden\b/i,
    /\bplant\b/i,
  ]

  const junk: Cultivar[] = []
  const good: Cultivar[] = []

  allCultivars.forEach(c => {
    const isJunk = junkPatterns.some(pattern => pattern.test(c.name))
    if (isJunk) {
      junk.push(c)
    } else {
      good.push(c)
    }
  })

  console.log(`✅ Good cultivars (farm-to-table): ${good.length}`)
  console.log(`❌ Junk cultivars (seed catalog): ${junk.length}`)
  console.log()

  // Show sample of good cultivars by category
  console.log('='.repeat(80))
  console.log('GOOD CULTIVARS (Sample by Pattern)')
  console.log('='.repeat(80))
  console.log()

  // Citrus patterns
  const citrus = good.filter(c =>
    c.id.includes('orange') ||
    c.id.includes('lemon') ||
    c.id.includes('grapefruit') ||
    c.id.includes('tangerine') ||
    c.id.includes('mandarin')
  )
  console.log(`🍊 Citrus (${citrus.length}):`)
  citrus.slice(0, 15).forEach(c => console.log(`   ${c.name} (${c.id})`))
  if (citrus.length > 15) console.log(`   ... and ${citrus.length - 15} more`)
  console.log()

  // Apples
  const apples = good.filter(c =>
    c.id.includes('apple') ||
    ['honeycrisp', 'fuji', 'gala', 'cosmic_crisp', 'granny_smith', 'pink_lady'].includes(c.id)
  )
  console.log(`🍎 Apples (${apples.length}):`)
  apples.slice(0, 15).forEach(c => console.log(`   ${c.name} (${c.id})`))
  if (apples.length > 15) console.log(`   ... and ${apples.length - 15} more`)
  console.log()

  // Stone fruit (peaches, plums, cherries)
  const stoneFruit = good.filter(c =>
    c.id.includes('peach') ||
    c.id.includes('plum') ||
    c.id.includes('cherry') ||
    c.id.includes('nectarine')
  )
  console.log(`🍑 Stone Fruit (${stoneFruit.length}):`)
  stoneFruit.slice(0, 15).forEach(c => console.log(`   ${c.name} (${c.id})`))
  if (stoneFruit.length > 15) console.log(`   ... and ${stoneFruit.length - 15} more`)
  console.log()

  // Berries
  const berries = good.filter(c =>
    c.id.includes('berry') ||
    c.id.includes('strawberry') ||
    c.id.includes('blueberry') ||
    c.id.includes('raspberry')
  )
  console.log(`🫐 Berries (${berries.length}):`)
  berries.slice(0, 15).forEach(c => console.log(`   ${c.name} (${c.id})`))
  if (berries.length > 15) console.log(`   ... and ${berries.length - 15} more`)
  console.log()

  // Show sample of junk
  console.log('='.repeat(80))
  console.log('JUNK CULTIVARS (Sample - to be deleted)')
  console.log('='.repeat(80))
  console.log()
  junk.slice(0, 20).forEach(c => console.log(`   ${c.name} (${c.id})`))
  if (junk.length > 20) console.log(`   ... and ${junk.length - 20} more`)
  console.log()

  // Already linked cultivars
  const linked = good.filter(c => c.varietyId)
  console.log('='.repeat(80))
  console.log(`ALREADY LINKED: ${linked.length} cultivars`)
  console.log('='.repeat(80))
  linked.forEach(c => console.log(`   ${c.name} → varietyId: ${c.varietyId}`))
  console.log()
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Error:', error)
    process.exit(1)
  })
