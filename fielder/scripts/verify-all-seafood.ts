#!/usr/bin/env tsx

/**
 * Verify Complete Seafood Taxonomy
 */

import { runQuery, closeDriver } from '../src/lib/graph/index'

async function main() {
  console.log('='.repeat(80))
  console.log('COMPLETE SEAFOOD TAXONOMY - VERIFICATION')
  console.log('='.repeat(80))
  console.log()

  const seafoodProducts = [
    { id: 'salmon', name: 'SALMON' },
    { id: 'halibut', name: 'HALIBUT' },
    { id: 'tuna', name: 'TUNA' },
    { id: 'trout', name: 'TROUT' },
    { id: 'catfish', name: 'CATFISH' },
    { id: 'oyster', name: 'OYSTER' },
    { id: 'clam', name: 'CLAM' },
    { id: 'mussel', name: 'MUSSEL' },
    { id: 'scallop', name: 'SCALLOP' },
    { id: 'crab', name: 'CRAB' },
    { id: 'lobster', name: 'LOBSTER' },
    { id: 'shrimp', name: 'SHRIMP' },
    { id: 'crawfish', name: 'CRAWFISH' }
  ]

  let totalVarieties = 0
  let totalCultivars = 0
  let varietiesMeetingGoal = 0

  for (const product of seafoodProducts) {
    console.log(`${product.name}:`)
    console.log('-'.repeat(80))

    const varieties = await runQuery<{
      varietyId: string
      varietyName: string
      cultivarCount: number
    }>(`
      MATCH (v:Variety)-[:BELONGS_TO_PRODUCT]->(p:ProductType {id: $productId})
      OPTIONAL MATCH (c:Cultivar)-[:BELONGS_TO_VARIETY]->(v)
      RETURN v.id as varietyId,
             COALESCE(v.displayName, v.name, v.id) as varietyName,
             count(c) as cultivarCount
      ORDER BY varietyName
    `, { productId: product.id })

    varieties.forEach(v => {
      const count = Number(v.cultivarCount)
      const status = count >= 5 ? '✅' : '⚠️'
      console.log(`  ${status} ${v.varietyName}: ${count} species`)

      totalVarieties++
      totalCultivars += count
      if (count >= 5) varietiesMeetingGoal++
    })
    console.log()
  }

  console.log('='.repeat(80))
  console.log('SUMMARY')
  console.log('='.repeat(80))
  console.log()
  console.log(`Total Seafood Varieties: ${totalVarieties}`)
  console.log(`Total Seafood Cultivars: ${totalCultivars}`)
  console.log(`Varieties Meeting Goal (≥5): ${varietiesMeetingGoal}/${totalVarieties}`)
  console.log()

  if (varietiesMeetingGoal === totalVarieties) {
    console.log('🎉 ALL SEAFOOD VARIETIES HAVE MINIMUM 5 CULTIVARS!')
  } else {
    console.log(`🎯 ${totalVarieties - varietiesMeetingGoal} varieties still need more cultivars`)
  }
  console.log()

  await closeDriver()
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
