#!/usr/bin/env tsx

/**
 * Final Taxonomy Report
 *
 * Complete overview of all categories, varieties, and cultivars
 */

import { runQuery, closeDriver } from '../src/lib/graph/index'

async function main() {
  console.log('='.repeat(80))
  console.log('FIELDER COMPLETE TAXONOMY - FINAL REPORT')
  console.log('='.repeat(80))
  console.log()

  // Overall counts
  const totals = await runQuery<any>(`
    MATCH (cat:Category) WITH count(cat) as categories
    MATCH (sub:Subcategory) WITH categories, count(sub) as subcategories
    MATCH (pt:ProductType) WITH categories, subcategories, count(pt) as productTypes
    MATCH (v:Variety) WITH categories, subcategories, productTypes, count(v) as varieties
    MATCH (c:Cultivar) WITH categories, subcategories, productTypes, varieties, count(c) as cultivars
    MATCH (c2:Cultivar)-[:BELONGS_TO_VARIETY]->(:Variety)
    RETURN categories, subcategories, productTypes, varieties, cultivars, count(c2) as cultivarsLinked
  `)

  const t = totals[0]
  console.log('TAXONOMY HIERARCHY:')
  console.log('-'.repeat(80))
  console.log(`📦 Categories:        ${t.categories}`)
  console.log(`📂 Subcategories:     ${t.subcategories}`)
  console.log(`📋 Product Types:     ${t.productTypes}`)
  console.log(`🌱 Varieties:         ${t.varieties}`)
  console.log(`🌿 Cultivars (total): ${t.cultivars}`)
  console.log(`   Linked to varieties: ${t.cultivarsLinked}`)
  console.log(`   Orphaned/junk:       ${Number(t.cultivars) - Number(t.cultivarsLinked)}`)
  console.log()

  // By category
  const byCategory = await runQuery<{
    category: string
    varietyCount: number
    cultivarCount: number
  }>(`
    MATCH (cat:Category)-[:HAS_PRODUCT_TYPE]->(pt:ProductType)<-[:BELONGS_TO_PRODUCT]-(v:Variety)
    OPTIONAL MATCH (c:Cultivar)-[:BELONGS_TO_VARIETY]->(v)
    RETURN cat.name as category,
           count(DISTINCT v) as varietyCount,
           count(DISTINCT c) as cultivarCount
    ORDER BY category
  `)

  console.log('BY CATEGORY:')
  console.log('-'.repeat(80))
  byCategory.forEach(c => {
    const icon = {
      'fruit': '🍎',
      'vegetable': '🥬',
      'meat': '🥩',
      'seafood': '🐟',
      'dairy': '🥛',
      'nut': '🌰',
      'grain': '🌾',
      'beverage': '☕',
      'post_harvest': '🍯'
    }[c.category] || '📦'

    const cat = c.category.padEnd(15)
    const vars = Number(c.varietyCount).toString().padStart(2)
    const cults = Number(c.cultivarCount).toString().padStart(3)
    console.log(`${icon} ${cat} ${vars} varieties, ${cults} cultivars`)
  })
  console.log()

  // Detailed by product type (only those with varieties)
  console.log('='.repeat(80))
  console.log('COMPLETE BREAKDOWN (Products with Varieties)')
  console.log('='.repeat(80))
  console.log()

  const detailed = await runQuery<{
    category: string
    productType: string
    varietyName: string
    cultivarCount: number
  }>(`
    MATCH (v:Variety)-[:BELONGS_TO_PRODUCT]->(p:ProductType)
    MATCH (p)<-[:HAS_PRODUCT_TYPE]-(cat:Category)
    OPTIONAL MATCH (c:Cultivar)-[:BELONGS_TO_VARIETY]->(v)
    WITH cat, p, v, count(c) as cultivarCount
    WHERE cultivarCount > 0
    RETURN cat.name as category,
           p.id as productType,
           COALESCE(v.displayName, v.name, v.id) as varietyName,
           cultivarCount
    ORDER BY category, productType, varietyName
  `)

  let currentCategory = ''
  let currentProduct = ''
  let categoryTotal = 0
  let varietiesWithData = 0
  let varietiesMeetingGoal = 0

  detailed.forEach(d => {
    const count = Number(d.cultivarCount)

    if (d.category !== currentCategory) {
      if (currentCategory) console.log()
      console.log(`${d.category.toUpperCase()}:`)
      console.log('-'.repeat(80))
      currentCategory = d.category
      currentProduct = ''
    }

    if (d.productType !== currentProduct) {
      console.log(`  ${d.productType}:`)
      currentProduct = d.productType
    }

    const status = count >= 5 ? '✅' : '⚠️'
    console.log(`    ${status} ${d.varietyName}: ${count}`)

    varietiesWithData++
    if (count >= 5) varietiesMeetingGoal++
    categoryTotal = count
  })

  console.log()
  console.log('='.repeat(80))
  console.log('GOAL ACHIEVEMENT')
  console.log('='.repeat(80))
  console.log()
  console.log(`Total varieties with cultivars: ${varietiesWithData}`)
  console.log(`Varieties meeting goal (≥5):    ${varietiesMeetingGoal}`)
  console.log(`Progress:                       ${Math.round(varietiesMeetingGoal/varietiesWithData*100)}%`)
  console.log()

  if (varietiesMeetingGoal === varietiesWithData) {
    console.log('🎉 ALL VARIETIES MEET THE 5 CULTIVAR MINIMUM!')
  } else {
    console.log(`🎯 ${varietiesWithData - varietiesMeetingGoal} varieties still below goal`)
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
