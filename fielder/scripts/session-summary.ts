#!/usr/bin/env tsx

/**
 * Complete Session Summary
 *
 * Shows the full state of the Fielder taxonomy after this session
 */

import { runQuery, closeDriver } from '../src/lib/graph/index'

async function main() {
  console.log('='.repeat(80))
  console.log('FIELDER TAXONOMY - COMPLETE SESSION SUMMARY')
  console.log('='.repeat(80))
  console.log()

  // Top-level counts
  const categories = await runQuery<{ count: number }>('MATCH (c:Category) RETURN count(c) as count')
  const subcategories = await runQuery<{ count: number }>('MATCH (s:Subcategory) RETURN count(s) as count')
  const productTypes = await runQuery<{ count: number }>('MATCH (p:ProductType) RETURN count(p) as count')
  const varieties = await runQuery<{ count: number }>('MATCH (v:Variety) RETURN count(v) as count')
  const cultivars = await runQuery<{ count: number }>('MATCH (c:Cultivar) RETURN count(c) as count')

  console.log('HIERARCHY OVERVIEW:')
  console.log('-'.repeat(80))
  console.log(`📦 Categories:     ${categories[0].count}`)
  console.log(`📂 Subcategories:  ${subcategories[0].count}`)
  console.log(`📋 Product Types:  ${productTypes[0].count}`)
  console.log(`🌱 Varieties:      ${varieties[0].count}`)
  console.log(`🌿 Cultivars:      ${cultivars[0].count}`)
  console.log()

  // Varieties by category
  const varietiesByCategory = await runQuery<{
    category: string
    varietyCount: number
    cultivarCount: number
  }>(`
    MATCH (c:Category)-[:HAS_PRODUCT_TYPE]->(p:ProductType)<-[:BELONGS_TO_PRODUCT]-(v:Variety)
    OPTIONAL MATCH (cult:Cultivar)-[:BELONGS_TO_VARIETY]->(v)
    RETURN c.name as category,
           count(DISTINCT v) as varietyCount,
           count(DISTINCT cult) as cultivarCount
    ORDER BY category
  `)

  console.log('VARIETIES & CULTIVARS BY CATEGORY:')
  console.log('-'.repeat(80))
  varietiesByCategory.forEach(c => {
    const varCount = Number(c.varietyCount)
    const cultCount = Number(c.cultivarCount)
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

    console.log(`${icon} ${c.category.padEnd(15)} ${varCount.toString().padStart(2)} varieties, ${cultCount.toString().padStart(3)} cultivars`)
  })
  console.log()

  // Check which varieties meet the 5 cultivar goal
  const varietyDetails = await runQuery<{
    category: string
    productType: string
    varietyName: string
    cultivarCount: number
  }>(`
    MATCH (v:Variety)-[:BELONGS_TO_PRODUCT]->(p:ProductType)
    MATCH (p)<-[:HAS_PRODUCT_TYPE]-(c:Category)
    OPTIONAL MATCH (cult:Cultivar)-[:BELONGS_TO_VARIETY]->(v)
    WHERE c.name IN ['fruit', 'meat', 'dairy', 'seafood']
    RETURN c.name as category,
           p.id as productType,
           COALESCE(v.displayName, v.name, v.id) as varietyName,
           count(cult) as cultivarCount
    ORDER BY category, productType, varietyName
  `)

  let totalWithData = 0
  let meetingGoal = 0

  varietyDetails.forEach(v => {
    const count = Number(v.cultivarCount)
    if (count > 0) {
      totalWithData++
      if (count >= 5) meetingGoal++
    }
  })

  console.log('='.repeat(80))
  console.log('GOAL PROGRESS: MINIMUM 5 CULTIVARS PER VARIETY')
  console.log('='.repeat(80))
  console.log()
  console.log(`Total varieties with cultivars: ${totalWithData}`)
  console.log(`Varieties meeting goal (≥5): ${meetingGoal}`)
  console.log(`Progress: ${Math.round(meetingGoal/totalWithData*100)}%`)
  console.log()

  if (meetingGoal === totalWithData) {
    console.log('🎉 ALL VARIETIES WITH DATA MEET THE 5 CULTIVAR MINIMUM!')
  }
  console.log()

  // Detailed breakdown
  console.log('='.repeat(80))
  console.log('DETAILED BREAKDOWN')
  console.log('='.repeat(80))
  console.log()

  let currentCategory = ''
  let currentProduct = ''

  varietyDetails.forEach(v => {
    const count = Number(v.cultivarCount)

    if (count === 0) return // Skip varieties with no cultivars

    if (v.category !== currentCategory) {
      console.log()
      console.log(`${v.category.toUpperCase()}:`)
      currentCategory = v.category
      currentProduct = ''
    }

    if (v.productType !== currentProduct) {
      console.log(`  ${v.productType}:`)
      currentProduct = v.productType
    }

    const status = count >= 5 ? '✅' : '⚠️'
    console.log(`    ${status} ${v.varietyName}: ${count}`)
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
