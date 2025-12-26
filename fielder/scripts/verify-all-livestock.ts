#!/usr/bin/env tsx

/**
 * Verify Complete Livestock Taxonomy
 *
 * Shows all livestock products with their varieties and cultivar counts
 */

import { runQuery, closeDriver } from '../src/lib/graph/index'

async function main() {
  console.log('='.repeat(80))
  console.log('COMPLETE LIVESTOCK TAXONOMY - VERIFICATION')
  console.log('='.repeat(80))
  console.log()

  const livestockProducts = ['beef', 'pork', 'lamb', 'chicken', 'eggs']

  for (const productId of livestockProducts) {
    console.log(`${productId.toUpperCase()}:`)
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
    `, { productId })

    varieties.forEach(v => {
      const status = Number(v.cultivarCount) >= 5 ? '✅' : '⚠️'
      console.log(`  ${status} ${v.varietyName}: ${v.cultivarCount} breeds`)
    })
    console.log()
  }

  console.log('='.repeat(80))
  console.log('SUMMARY')
  console.log('='.repeat(80))
  console.log()

  const totalVarieties = await runQuery<{ count: number }>(`
    MATCH (v:Variety)-[:BELONGS_TO_PRODUCT]->(p:ProductType)
    WHERE p.id IN ['beef', 'pork', 'lamb', 'chicken', 'eggs']
    RETURN count(DISTINCT v) as count
  `)

  const totalCultivars = await runQuery<{ count: number }>(`
    MATCH (c:Cultivar)-[:BELONGS_TO_VARIETY]->(v:Variety)-[:BELONGS_TO_PRODUCT]->(p:ProductType)
    WHERE p.id IN ['beef', 'pork', 'lamb', 'chicken', 'eggs']
    RETURN count(DISTINCT c) as count
  `)

  console.log(`✅ Total Livestock Varieties: ${totalVarieties[0].count}`)
  console.log(`✅ Total Livestock Cultivars: ${totalCultivars[0].count}`)
  console.log()

  await closeDriver()
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
