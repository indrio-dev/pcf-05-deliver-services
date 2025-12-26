#!/usr/bin/env tsx

/**
 * Verify Ark of Taste Coverage
 *
 * Shows all heritage/conservation varieties in the database
 */

import { runQuery, closeDriver } from '../src/lib/graph/index'

async function main() {
  console.log('='.repeat(80))
  console.log('ARK OF TASTE & CONSERVATION STATUS REPORT')
  console.log('='.repeat(80))
  console.log()

  // Conservation status breakdown
  const conservationCounts = await runQuery<{
    conservationStatus: string
    count: number
  }>(`
    MATCH (c:Cultivar)
    WHERE c.conservationStatus IS NOT NULL
    RETURN c.conservationStatus as conservationStatus, count(c) as count
    ORDER BY count DESC
  `)

  console.log('CONSERVATION STATUS DISTRIBUTION:')
  console.log('-'.repeat(80))

  const total = conservationCounts.reduce((sum, c) => sum + Number(c.count), 0)

  conservationCounts.forEach(c => {
    const icon = {
      'ark_of_taste': '🏛️',
      'critically_rare': '🚨',
      'heirloom': '⭐',
      'cultivated': '✅',
      'common': '📦'
    }[c.conservationStatus] || '❓'

    const pct = Math.round(Number(c.count) / total * 100)
    console.log(`${icon} ${c.conservationStatus.padEnd(20)} ${String(c.count).padStart(3)} (${pct}%)`)
  })

  console.log()
  console.log(`Total with conservation status: ${total}`)
  console.log()

  // Ark of Taste items by category
  console.log('='.repeat(80))
  console.log('ARK OF TASTE ITEMS BY CATEGORY')
  console.log('='.repeat(80))
  console.log()

  const arkItems = await runQuery<{
    productType: string
    varietyName: string
    cultivarName: string
    validatedStates: string[]
  }>(`
    MATCH (c:Cultivar)-[:BELONGS_TO_VARIETY]->(v:Variety)-[:BELONGS_TO_PRODUCT]->(p:ProductType)
    WHERE c.conservationStatus = 'ark_of_taste'
    RETURN p.id as productType,
           COALESCE(v.displayName, v.name, v.id) as varietyName,
           c.displayName as cultivarName,
           c.validatedStates as validatedStates
    ORDER BY productType, cultivarName
  `)

  let currentProduct = ''

  arkItems.forEach(item => {
    if (item.productType !== currentProduct) {
      console.log()
      console.log(`${item.productType.toUpperCase()}:`)
      console.log('-'.repeat(80))
      currentProduct = item.productType
    }

    const states = item.validatedStates ? ` (${item.validatedStates.join(', ')})` : ''
    console.log(`  🏛️  ${item.cultivarName}${states}`)
  })

  console.log()
  console.log(`Total Ark of Taste items: ${arkItems.length}`)
  console.log()

  // Already had some Ark items before today
  const preExisting = await runQuery<{ count: number }>(`
    MATCH (c:Cultivar)
    WHERE c.id IN ['ossabaw_island', 'guinea_hog', 'mulefoot', 'olympia_oyster',
                    'navajo_churro', 'icelandic']
    RETURN count(c) as count
  `)

  console.log('='.repeat(80))
  console.log('SUMMARY')
  console.log('='.repeat(80))
  console.log()
  console.log(`Ark of Taste items ADDED TODAY:  ${arkItems.length}`)
  console.log(`Already had (previous sessions): ${preExisting[0].count}`)
  console.log(`  - Ossabaw Island Hog`)
  console.log(`  - Guinea Hog`)
  console.log(`  - Mulefoot Hog`)
  console.log(`  - Olympia Oyster`)
  console.log(`  - Navajo-Churro Sheep`)
  console.log(`  - Icelandic Sheep`)
  console.log()
  console.log(`TOTAL ARK OF TASTE: ${arkItems.length + Number(preExisting[0].count)}`)
  console.log()

  console.log('='.repeat(80))
  console.log('NEXT EXPANSION OPPORTUNITIES')
  console.log('='.repeat(80))
  console.log()
  console.log('Slow Food USA has 300+ Ark of Taste items. We have ~50.')
  console.log()
  console.log('To continue expansion, research and add:')
  console.log('  - More heritage vegetables (beans, peas, squash)')
  console.log('  - Heritage grains (regional wheat, rice, barley)')
  console.log('  - Regional specialty foods (state-by-state)')
  console.log('  - Wild-harvested items (ramps, morels, etc.)')
  console.log('  - Heritage processed foods (cheeses, cured meats)')
  console.log()
  console.log('Source: https://slowfoodusa.org/ark-of-taste/')
  console.log('        https://www.fondazioneslowfood.com/en/nazioni-arca/united-states-en/')
  console.log()

  await closeDriver()
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
