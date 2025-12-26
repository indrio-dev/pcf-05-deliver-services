#!/usr/bin/env tsx

/**
 * Verify Complete Taxonomy Load
 *
 * Shows all 9 categories with their subcategories and product type counts
 */

import { runQuery, closeDriver } from '../src/lib/graph/index'

async function main() {
  console.log('='.repeat(80))
  console.log('COMPLETE FARM-TO-TABLE TAXONOMY - VERIFICATION')
  console.log('='.repeat(80))
  console.log()

  // Get category counts
  const categoryCounts = await runQuery<{
    category: string
    subcategoryCount: number
    productTypeCount: number
  }>(`
    MATCH (c:Category)
    OPTIONAL MATCH (c)-[:HAS_SUBCATEGORY]->(s:Subcategory)
    OPTIONAL MATCH (c)-[:HAS_PRODUCT_TYPE]->(p:ProductType)
    RETURN c.name as category,
           count(DISTINCT s) as subcategoryCount,
           count(DISTINCT p) as productTypeCount
    ORDER BY category
  `)

  console.log('📦 CATEGORIES (9):')
  console.log('-'.repeat(80))
  categoryCounts.forEach(c => {
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

    console.log(`${icon} ${c.category.padEnd(15)} ${c.subcategoryCount} subcategories, ${c.productTypeCount} product types`)
  })
  console.log()

  // Show subcategories for each category
  console.log('📂 SUBCATEGORIES BY CATEGORY:')
  console.log('-'.repeat(80))

  const subcategoryData = await runQuery<{
    category: string
    subcategory: string
    productTypeCount: number
  }>(`
    MATCH (c:Category)-[:HAS_SUBCATEGORY]->(s:Subcategory)
    OPTIONAL MATCH (s)-[:HAS_PRODUCT_TYPE]->(p:ProductType)
    RETURN c.name as category,
           s.name as subcategory,
           count(DISTINCT p) as productTypeCount
    ORDER BY category, subcategory
  `)

  let currentCategory = ''
  subcategoryData.forEach(s => {
    if (s.category !== currentCategory) {
      console.log()
      console.log(`${s.category.toUpperCase()}:`)
      currentCategory = s.category
    }
    console.log(`  • ${s.subcategory.padEnd(20)} (${s.productTypeCount} types)`)
  })
  console.log()

  // Summary stats
  console.log('='.repeat(80))
  console.log('SUMMARY')
  console.log('='.repeat(80))

  const totalCategories = categoryCounts.length
  const totalSubcategories = subcategoryData.length
  const totalProductTypes = categoryCounts.reduce((sum, c) => sum + Number(c.productTypeCount), 0)

  console.log()
  console.log(`✅ Categories:     ${totalCategories}/9`)
  console.log(`✅ Subcategories:  ${totalSubcategories}/34`)
  console.log(`✅ ProductTypes:   ${totalProductTypes}/157`)
  console.log()

  if (totalCategories === 9 && totalSubcategories === 34 && totalProductTypes === 157) {
    console.log('🎉 COMPLETE TAXONOMY LOADED SUCCESSFULLY!')
  } else {
    console.log('⚠️  Some items missing - check the output above')
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
